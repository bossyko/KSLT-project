// ============================================
// KSLT — Battle Announce
// Supabase Edge Function
// ============================================
// Sends/re-sends TG group message with inline voting buttons
// for an already-published battle.
// JWT auth: admin or manager only.
//
// POST { challenge_id: UUID }
//
// Deploy: supabase functions deploy battle-announce --no-verify-jwt

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
    // cancelled — та же рассылка, но об отмене: баттл сняли с сайта, и
    // группа, которой его объявляли, должна узнать об этом тем же каналом
    const { challenge_id, cancelled, reason } = body

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
        proposed_date, proposed_time, proposed_venue
      `)
      .eq('id', challenge_id)
      .single()

    if (chalErr || !challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), {
        status: 404, headers: corsHeaders
      })
    }

    // При отмене баттл уже снят с публикации — это и есть отмена. Проверка
    // «опубликован» здесь отказывала ровно в том случае, ради которого
    // сообщение и нужно
    if (!challenge.battle_published && !cancelled) {
      return new Response(JSON.stringify({ error: 'Battle not published yet' }), {
        status: 400, headers: corsHeaders
      })
    }

    // Get player names
    const { data: players } = await db
      .from('players')
      .select('id, name')
      .in('id', [challenge.challenger_player_id, challenge.opponent_player_id])

    const pMap: Record<string, string> = {}
    if (players) players.forEach((p: any) => { pMap[p.id] = p.name })

    const challengerName = pMap[challenge.challenger_player_id] || '?'
    const opponentName = pMap[challenge.opponent_player_id] || '?'

    // Встречного предложения больше нет: дату и место задаёт менеджер
    const date = challenge.proposed_date || ''
    const time = challenge.proposed_time || ''
    const venue = challenge.proposed_venue || ''
    const title = challenge.battle_title || 'Battle'

    // Send TG announcement to group with inline voting buttons
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')

    let tgSent = false

    if (token && groupChatId && cancelled) {
      const text =
        `❌ <b>Баттл отменён</b>\n\n` +
        `<s>${escHtml(title)}</s>\n` +
        `${escHtml(challengerName)} — ${escHtml(opponentName)}\n` +
        (reason ? `\n${escHtml(String(reason))}` : '')

      const ok = await sendTgMessage(token, groupChatId, text, null)
      return new Response(JSON.stringify({ success: true, tg_sent: ok, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (token && groupChatId) {
      const text =
        `🔥 <b>${escHtml(title)}</b>\n\n` +
        `🔴 ${escHtml(challengerName)} vs 🔵 ${escHtml(opponentName)}\n` +
        (date ? `📅 ${date}` : '') +
        (time ? ` ⏰ ${time}` : '') + '\n' +
        (venue ? `📍 ${escHtml(venue)}\n` : '') +
        `\nГолосуйте за победителя! 👇`

      const keyboard = {
        inline_keyboard: [
          [
            { text: `🔴 ${challengerName}`, callback_data: `battle_vote:${challenge_id}:${challenge.challenger_player_id}` },
            { text: `🔵 ${opponentName}`, callback_data: `battle_vote:${challenge_id}:${challenge.opponent_player_id}` }
          ]
        ]
      }

      tgSent = await sendTgMessage(token, groupChatId, text, keyboard)
    }

    // Update battle_notified_at
    await db
      .from('challenges')
      .update({ battle_notified_at: new Date().toISOString() })
      .eq('id', challenge_id)

    return new Response(JSON.stringify({ success: true, tg_sent: tgSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('battle-announce error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: corsHeaders
    })
  }
})

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function sendTgMessage(token: string, chatId: string, text: string, replyMarkup?: any): Promise<boolean> {
  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    }
    if (replyMarkup) payload.reply_markup = replyMarkup

    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('TG API error:', data)
      return false
    }
    return true
  } catch (err) {
    console.error('TG send error:', err)
    return false
  }
}
