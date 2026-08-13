// ============================================
// KSLT — Challenge Answered Notification
// POST { challenge_id }
//
// Автору вызова сообщаем, что ему ответили. В колокольчик уведомление
// кладёт сама база, внутри respond_to_challenge: там же, где меняется
// статус, — иначе запись и уведомление могли бы разойтись.
//
// Сюда вынесено только то, до чего база не дотягивается: личное сообщение
// в Telegram и письмо. Это не механика ответа, а доставка — тот случай,
// ради которого мессенджер у нас и остался.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { challenge_id } = await req.json()
    if (!challenge_id) return json({ error: 'challenge_id required' }, 400)

    const db = createClient(supabaseUrl, serviceKey)

    const { data: ch } = await db
      .from('challenges')
      .select('id, status, challenger_id, opponent_profile_id, message')
      .eq('id', challenge_id)
      .single()

    if (!ch) return json({ error: 'not_found' }, 404)

    // Сообщить может только тот, кто отвечал: иначе любой вошедший мог бы
    // слать чужие уведомления запросом напрямую
    if (ch.opponent_profile_id !== user.id) return json({ error: 'forbidden' }, 403)
    if (ch.status !== 'accepted' && ch.status !== 'declined') {
      return json({ error: 'not_answered', status: ch.status }, 400)
    }

    const accepted = ch.status === 'accepted'

    const { data: opponent } = await db
      .from('profiles').select('full_name').eq('id', user.id).single()
    const { data: author } = await db
      .from('profiles')
      .select('telegram_chat_id, email, notify_preferences')
      .eq('id', ch.challenger_id)
      .single()

    const who = opponent?.full_name || 'Соперник'
    const title = accepted ? 'Вызов принят' : 'Вызов отклонён'
    const body = accepted
      ? `${who} принял ваш вызов.`
      : `${who} отклонил ваш вызов.`

    let tgSent = false
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (token && author?.telegram_chat_id &&
        shouldNotify(author.notify_preferences, 'tg', 'challenges')) {
      const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: author.telegram_chat_id,
          text: `${accepted ? '🔥' : '❌'} <b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`,
          parse_mode: 'HTML'
        })
      })
      const data = await res.json()
      tgSent = !!data.ok
    }

    let mailSent = false
    if (author?.email && shouldNotify(author.notify_preferences, 'email', 'challenges')) {
      mailSent = await callSendEmail(serviceKey, {
        to: author.email,
        subject: title,
        template: 'challenge-answered',
        data: { opponent_name: who, accepted }
      })
    }

    return json({ success: true, tg_sent: tgSent, mail_sent: mailSent })

  } catch (err) {
    console.error('challenge-notify error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function shouldNotify(prefs: any, channel: 'tg' | 'email' | 'site', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

async function callSendEmail(serviceKey: string, payload: any): Promise<boolean> {
  try {
    const res = await fetch(
      Deno.env.get('SUPABASE_URL') + '/functions/v1/send-email',
      {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    )
    return res.ok
  } catch { return false }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
