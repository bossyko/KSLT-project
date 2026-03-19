// ============================================
// KSLT — Battle Publish
// Supabase Edge Function
// ============================================
// Publishes accepted challenge as a "Battle" with TG announcement.
// JWT auth: admin or manager only.
//
// POST { challenge_id: UUID, title: string }
//
// Deploy: supabase functions deploy battle-publish --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'
const SITE_URL = 'https://kslt.netlify.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Auth: JWT → admin or manager ---
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const db = createClient(supabaseUrl, serviceKey)
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { challenge_id, title, notify_only } = body

    if (!challenge_id) {
      return new Response(JSON.stringify({ error: 'challenge_id required' }), {
        status: 400, headers: corsHeaders
      })
    }

    // Get challenge
    const { data: challenge, error: chalErr } = await db
      .from('challenges')
      .select(`
        id, status, battle_published, battle_title,
        challenger_player_id, opponent_player_id,
        proposed_date, proposed_time, proposed_venue,
        counter_date, counter_time, counter_venue
      `)
      .eq('id', challenge_id)
      .single()

    if (chalErr || !challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), {
        status: 404, headers: corsHeaders
      })
    }

    // --- MODE 1: notify_only — re-send TG announcement for already published battle ---
    if (notify_only) {
      if (!challenge.battle_published) {
        return new Response(JSON.stringify({ error: 'Battle not published yet' }), {
          status: 400, headers: corsHeaders
        })
      }
    } else {
      // --- MODE 2: initial publish ---
      if (!title) {
        return new Response(JSON.stringify({ error: 'title required' }), {
          status: 400, headers: corsHeaders
        })
      }
      if (challenge.status !== 'accepted') {
        return new Response(JSON.stringify({ error: 'Challenge must be accepted' }), {
          status: 400, headers: corsHeaders
        })
      }
      if (challenge.battle_published) {
        return new Response(JSON.stringify({ error: 'Already published' }), {
          status: 400, headers: corsHeaders
        })
      }

      // Update challenge
      const { error: updateErr } = await db
        .from('challenges')
        .update({
          battle_title: title,
          battle_published: true,
          battle_published_at: new Date().toISOString()
        })
        .eq('id', challenge_id)

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500, headers: corsHeaders
        })
      }
    }

    const battleTitle = notify_only ? (challenge.battle_title || 'Battle') : title!

    // Get player names for TG
    const { data: players } = await db
      .from('players')
      .select('id, name')
      .in('id', [challenge.challenger_player_id, challenge.opponent_player_id])

    const pMap: Record<string, string> = {}
    if (players) players.forEach((p: any) => { pMap[p.id] = p.name })

    const challengerName = pMap[challenge.challenger_player_id] || '?'
    const opponentName = pMap[challenge.opponent_player_id] || '?'

    const date = challenge.counter_date || challenge.proposed_date || ''
    const time = challenge.counter_time || challenge.proposed_time || ''
    const venue = challenge.counter_venue || challenge.proposed_venue || ''

    // Send TG announcement to group with inline voting buttons
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')

    console.log('TG config:', { hasToken: !!token, groupChatId: groupChatId || 'NOT SET' })

    let tgSent = false

    if (token && groupChatId) {
      const text =
        `⚔️ <b>${escHtml(battleTitle)}</b>\n\n` +
        `🔴 ${escHtml(challengerName)} vs 🔵 ${escHtml(opponentName)}\n` +
        (date ? `📅 ${date}` : '') +
        (time ? ` ⏰ ${time}` : '') + '\n' +
        (venue ? `📍 ${escHtml(venue)}\n` : '') +
        `\nГолосуйте за победителя! 👇`

      // callback_data max 64 bytes! Use "bv:UUID:1" / "bv:UUID:2" (1=challenger, 2=opponent)
      const keyboard = {
        inline_keyboard: [
          [
            { text: `🔴 ${challengerName}`, callback_data: `bv:${challenge_id}:1` },
            { text: `🔵 ${opponentName}`, callback_data: `bv:${challenge_id}:2` }
          ],
          [
            { text: '🎾 Подробнее', url: `${SITE_URL}/pages/challenge.html?id=${challenge_id}` }
          ]
        ]
      }

      tgSent = await sendTgMessage(token, groupChatId, text, keyboard)
    }

    // Update battle_notified_at only if TG was sent
    if (tgSent) {
      await db
        .from('challenges')
        .update({ battle_notified_at: new Date().toISOString() })
        .eq('id', challenge_id)
    }

    // Send DM to both players (only on initial publish, not re-notify)
    if (!notify_only && token) {
      const { data: profiles } = await db
        .from('profiles')
        .select('player_id, telegram_chat_id, notify_preferences')
        .in('player_id', [challenge.challenger_player_id, challenge.opponent_player_id])

      if (profiles) {
        for (const p of profiles) {
          if (p.telegram_chat_id && shouldNotify(p.notify_preferences, 'tg', 'challenges')) {
            const dmText =
              `⚔️ Ваш баттл "<b>${escHtml(battleTitle)}</b>" опубликован!\n` +
              `Зрители уже голосуют.\n\n` +
              `🎾 <a href="${SITE_URL}/pages/challenge.html?id=${challenge_id}">Посмотреть страницу баттла</a>`
            await sendTgMessage(token, p.telegram_chat_id, dmText)
          }
        }
      }
    }

    const debugInfo: any = { success: true, tg_sent: tgSent }
    if (!tgSent) {
      debugInfo.debug = {
        has_token: !!token,
        has_group_id: !!groupChatId,
        group_id: groupChatId || 'NOT SET'
      }
    }

    return new Response(JSON.stringify(debugInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('battle-publish error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: corsHeaders
    })
  }
})

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

async function sendTgMessage(token: string, chatId: string, text: string, replyMarkup?: any): Promise<boolean> {
  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  }
  if (replyMarkup) payload.reply_markup = replyMarkup

  // Retry up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.ok) return true

      console.error(`TG API error (attempt ${attempt}):`, data)

      // Rate limit — wait and retry
      if (res.status === 429 && data.parameters?.retry_after) {
        await new Promise(r => setTimeout(r, data.parameters.retry_after * 1000))
        continue
      }
    } catch (err) {
      console.error(`TG send error (attempt ${attempt}):`, err)
    }

    // Wait 1s before retry
    if (attempt < 3) await new Promise(r => setTimeout(r, 1000))
  }
  return false
}
