  // ============================================
  // KSLT — Send Game Invite Edge Function
  // POST { receiver_player_id: string }
  // JWT auth + membership check + 5/day limit
  // ============================================

  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const TELEGRAM_API = 'https://api.telegram.org/bot'
  const SITE_URL = 'https://kslt.netlify.app'
  const DAILY_LIMIT = 30

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // 1. Auth — extract JWT
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return json({ error: 'Unauthorized' }, 401)
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

      // User client (with JWT) for auth check
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: { user }, error: authErr } = await userClient.auth.getUser()
      if (authErr || !user) {
        return json({ error: 'Unauthorized' }, 401)
      }

      // Service client for DB operations
      const db = createClient(supabaseUrl, serviceKey)

      // 2. Get sender profile
      const { data: senderProfile } = await db
        .from('profiles')
        .select('id, full_name, phone, telegram, instagram, player_id, telegram_chat_id, role')
        .eq('id', user.id)
        .single()

      if (!senderProfile) {
        return json({ error: 'Profile not found' }, 400)
      }

      // 3. Check active membership (admin/manager bypass)
      const isAdmin = senderProfile.role === 'admin' || senderProfile.role === 'manager'
      if (!isAdmin) {
        // Срок членства лежит в expires_at. Поля end_date в таблице нет
        // вовсе: запрос по нему молча возвращал пусто, и приглашение не мог
        // отправить никто — даже с оплаченным членством
        const today = new Date().toISOString().slice(0, 10)
        const { data: membership } = await db
          .from('memberships')
          .select('id')
          .eq('profile_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', today)
          .limit(1)
          .maybeSingle()

        if (!membership) {
          return json({ error: 'no_membership' }, 403)
        }
      }

      // 4. Parse body
      const { receiver_player_id } = await req.json()
      if (!receiver_player_id) {
        return json({ error: 'receiver_player_id required' }, 400)
      }

      // 5. Себе приглашение не отправить.
      //    Проверку когда-то отключили на время испытаний и забыли вернуть:
      //    человек звал сам себя и получал собственное приглашение
      if (senderProfile.player_id && senderProfile.player_id === receiver_player_id) {
        return json({ error: 'self_invite' }, 400)
      }

      // 6. Daily limit check
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { count } = await db
        .from('game_invites')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .gte('created_at', todayStart.toISOString())

      if ((count || 0) >= DAILY_LIMIT) {
        return json({ error: 'daily_limit' }, 429)
      }

      // 7. Check duplicate pending invite
      const { data: existing } = await db
        .from('game_invites')
        .select('id')
        .eq('sender_id', user.id)
        .eq('receiver_player_id', receiver_player_id)
        .eq('status', 'pending')
        .limit(1)

      if (existing && existing.length > 0) {
        return json({ error: 'already_pending' }, 409)
      }

      // 8. Get receiver info
      const { data: receiverPlayer } = await db
        .from('players')
        .select('id, name')
        .eq('id', receiver_player_id)
        .single()

      if (!receiverPlayer) {
        return json({ error: 'Player not found' }, 404)
      }

      // Get receiver profile (may not exist)
      const { data: receiverProfile } = await db
        .from('profiles')
        .select('id, telegram_chat_id, email, full_name, phone, telegram, instagram, notify_preferences')
        .eq('player_id', receiver_player_id)
        .limit(1)
        .single()

      // Учётной записи нет — приглашать некого: человек не на платформе,
      // ответить ему негде. Телеграм и почта тут больше ни при чём: раньше
      // без них отправка запрещалась, потому что всё держалось на боте.
      // Теперь приглашение живёт в кабинете и в приложении, а Телеграм с
      // почтой лишь оповещают
      if (!receiverProfile) {
        return json({ error: 'no_account' }, 400)
      }

      // Смысл приглашения — обменяться контактами. Если у человека не
      // заполнено ничего, соглашаться ему нечем: собеседник получит пустую
      // карточку. Лучше сказать об этом сразу, чем заставлять ждать ответа
      const receiverHasContacts = !!(receiverProfile.phone || receiverProfile.telegram || receiverProfile.instagram)
      if (!receiverHasContacts) {
        return json({ error: 'receiver_no_contacts' }, 400)
      }

      // 9. Insert invite
      const { data: invite, error: insertErr } = await db
        .from('game_invites')
        .insert({
          sender_id: user.id,
          receiver_player_id: receiver_player_id,
          receiver_profile_id: receiverProfile?.id || null,
          status: 'pending'
        })
        .select('id')
        .single()

      if (insertErr) {
        console.error('Insert error:', insertErr)
        return json({ error: 'DB error' }, 500)
      }

      const senderName = senderProfile.full_name || 'Игрок KSLT'

      // Запись для колокольчика на сайте. Её не было вовсе: приглашение
      // уходило в Телеграм и на почту, а человек, вошедший на сайт, не
      // видел никакого знака — колокольчик молчал
      await db.from('notification_log').insert({
        profile_id: receiverProfile.id,
        type: 'game_invite',
        title: 'Приглашение на игру',
        message: `${senderName} предлагает сыграть в теннис`,
        is_read: false,
        action_type: 'game_invite',
        action_id: invite.id
      }).then(function () {}, function (e: unknown) { console.error('notification_log:', e) })

      // 10. Send Telegram to receiver (respect opt-out)
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')

      // Телеграм только зовёт на сайт: отвечают там, где человек видит, на
      // что соглашается. Личные данные через бота больше не ходят — раньше
      // он сам раздавал ссылки на переписку, минуя всякое согласие
      if (token && receiverProfile.telegram_chat_id && shouldNotify(receiverProfile.notify_preferences, 'tg', 'challenges')) {
        const msgText = `🎾 <b>Приглашение на игру!</b>\n\n${senderName} предлагает вам сыграть в теннис.\n\nОткройте приложение или сайт, чтобы принять или отклонить.`

        await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: receiverProfile.telegram_chat_id,
            text: msgText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { text: '🎾 Открыть приглашение', url: `${SITE_URL}/pages/dashboard.html#games` }
              ]]
            }
          })
        })
      }

      // Push в приложение — доходит и при погашенном экране
      try {
        await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/send-push', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🎾 Приглашение на игру',
            message: `${senderName} предлагает сыграть в теннис`,
            type: 'challenges',
            audience: 'user',
            user_id: receiverProfile.id,
            // Запись в колокольчике уже заведена выше — со своими кнопками.
            // Без этого рядом с ней вставала бы вторая, пустая
            skip_log: true,
            action_type: 'game_invite'
          })
        })
      } catch { /* доставка не должна ронять само приглашение */ }

      // 11. Send email to receiver
      if (receiverProfile.email && shouldNotify(receiverProfile.notify_preferences, 'email', 'challenges')) {
        // Свой шаблон, а не «вызов на матч»: у приглашения нет ни даты, ни
        // корта — о них договариваются сами, — и в письме оставались пустые
        // строки под календарь и часы
        await callSendEmail(serviceKey, {
          to: receiverProfile.email,
          subject: `🎾 Приглашение на игру от ${senderName}`,
          template: 'game-invite',
          data: { sender_name: senderName }
        })
      }

      return json({ success: true, invite_id: invite.id })

    } catch (err) {
      console.error('Edge function error:', err)
      return json({ error: 'Internal error' }, 500)
    }
  })

  function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
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

  function json(data: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
