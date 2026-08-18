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
        challenger_player_id, opponent_player_id
      `)
      .eq('id', challenge_id)
      .single()

    if (chalErr || !challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), {
        status: 404, headers: corsHeaders
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

    const title = challenge.battle_title || 'Battle'

    // Объявление об отмене — единственное, ради чего эту функцию зовут.
    //
    // Здесь же лежал второй анонс баттла, с кнопками голосования. Его никто
    // не вызывал: публикация идёт через battle-publish. И он был сломан —
    // кнопки подписывались как `battle_vote:UUID:playerid`, а бот понимает
    // только короткое `bv:UUID:1|2`. Даже подключи его кто-нибудь к кнопке,
    // объявление ушло бы, а проголосовать было бы нельзя.
    //
    // Убран целиком: код, который выглядит рабочим, но не работает, опаснее
    // отсутствующего. Анонс баттла живёт в одном месте — в battle-publish.
    if (!cancelled) {
      return new Response(JSON.stringify({ error: 'Use battle-publish to announce' }), {
        status: 400, headers: corsHeaders
      })
    }

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')

    if (!token || !groupChatId) {
      return new Response(JSON.stringify({ success: true, tg_sent: false, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const text =
      `❌ <b>Баттл отменён</b>\n\n` +
      `<s>${escHtml(title)}</s>\n` +
      `${escHtml(challengerName)} — ${escHtml(opponentName)}\n` +
      (reason ? `\n${escHtml(String(reason))}` : '')

    const tgSent = await sendTgMessage(token, groupChatId, text)

    return new Response(JSON.stringify({ success: true, tg_sent: tgSent, cancelled: true }), {
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
