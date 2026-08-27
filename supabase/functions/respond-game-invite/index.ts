// ============================================
// KSLT — ответ на приглашение поиграть
// POST { invite_id: string, accept: boolean }
// ============================================
//
// Раньше отвечали кнопками в Телеграм-боте, и он же оповещал отправителя.
// Теперь отвечают на сайте и в приложении — а отправитель об ответе не
// узнавал вовсе, пока сам не заглянет в кабинет.
//
// Здесь ответ и оповещение в одном месте: меняем состояние, отдаём
// контакты второй стороны и сообщаем отправителю всеми путями, какие ему
// доступны. Через Телеграм при этом ходит только весть о согласии —
// контакты человек видит на сайте, где ясно, чем именно обменивается.

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

    const body = await req.json()
    const inviteId = String(body.invite_id || '')
    const accept = body.accept === true
    if (!inviteId) return json({ error: 'invite_id required' }, 400)

    const db = createClient(supabaseUrl, serviceKey)

    const { data: invite } = await db
      .from('game_invites')
      .select('id, status, sender_id, receiver_profile_id')
      .eq('id', inviteId)
      .single()

    if (!invite) return json({ error: 'not_found' }, 404)

    // Отвечает тот, кому написали. За него это сделать нельзя
    if (invite.receiver_profile_id !== user.id) {
      return json({ error: 'not_yours' }, 403)
    }
    if (invite.status !== 'pending') {
      return json({ error: 'already_answered', status: invite.status }, 409)
    }

    await db.from('game_invites')
      .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
      .eq('id', inviteId)

    const { data: sender } = await db
      .from('profiles')
      .select('id, full_name, email, telegram_chat_id, notify_preferences, phone, whatsapp_phone, telegram, instagram, avatar_url')
      .eq('id', invite.sender_id)
      .single()

    const { data: me } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const myName = me?.full_name || 'Игрок KSLT'

    // ---- Оповещаем отправителя ----
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const title = accept ? '🎾 Приглашение принято' : 'Приглашение отклонено'
    const text = accept
      ? `${myName} принял ваше приглашение сыграть. Откройте кабинет — там его контакты.`
      : `${myName} отказался от игры.`

    // Колокольчик на сайте: значок рисует интерфейс по типу уведомления,
    // поэтому в заголовке эмодзи не нужен
    // Тип отличается от самого приглашения: это весть об ответе, отвечать
    // на неё нечего. С одинаковым типом колокольчик рисовал «Принять» и
    // «Отклонить» под сообщением «Приглашение принято»
    await db.from('notification_log').insert({
      profile_id: invite.sender_id,
      type: 'game_invite',
      title: accept ? 'Приглашение принято' : 'Приглашение отклонено',
      message: text,
      is_read: false,
      action_type: accept ? 'game_invite_accepted' : 'game_invite_declined',
      action_id: inviteId
    }).then(function () {}, function (e: unknown) { console.error('notification_log:', e) })

    if (token && sender?.telegram_chat_id && shouldNotify(sender.notify_preferences, 'tg', 'challenges')) {
      await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: sender.telegram_chat_id,
          text: `<b>${title}</b>\n\n${text}`,
          parse_mode: 'HTML',
          reply_markup: accept ? {
            inline_keyboard: [[
              { text: '🎾 Открыть кабинет', url: `${SITE_URL}/pages/dashboard.html#games` }
            ]]
          } : undefined
        })
      }).catch(() => {})
    }

    // Push — доходит и при погашенном экране
    await fetch(supabaseUrl + '/functions/v1/send-push', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, message: text, type: 'challenges', audience: 'user', user_id: sender?.id
      })
    }).catch(() => {})

    if (sender?.email && shouldNotify(sender.notify_preferences, 'email', 'challenges')) {
      await fetch(supabaseUrl + '/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sender.email,
          subject: title,
          template: 'game-invite-answered',
          data: { opponent_name: myName, accepted: accept }
        })
      }).catch(() => {})
    }

    if (!accept) return json({ success: true, status: 'declined' })

    // Согласился — отдаём контакты отправителя. Галочки «показывать
    // другим» тут ни при чём: они про открытый показ всему клубу, а
    // здесь согласие дано адресно, одному человеку
    return json({
      success: true,
      status: 'accepted',
      contacts: {
        full_name: sender?.full_name || null,
        avatar_url: sender?.avatar_url || null,
        phone: sender?.phone || null,
        whatsapp: sender?.whatsapp_phone || sender?.phone || null,
        telegram: sender?.telegram || null,
        instagram: sender?.instagram || null
      }
    })

  } catch (err) {
    console.error('respond-game-invite error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
