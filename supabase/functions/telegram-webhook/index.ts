    // ============================================
    // KSLT — Telegram Webhook Handler
    // Supabase Edge Function
    // ============================================
    // Handles:
    // 1. /start command with deep link parameter (profile UUID)
    // 2. callback_query for game invite accept/decline
    // 3. callback_query for tournament registration (tournament_register:{id})
    // 4. /membership command + membership request flow (period → category → receipt → approval)
    // 5. Photo messages (membership receipt upload)
    //
    // Deploy: Supabase Dashboard → Edge Functions → New Function
    // Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>
    // Required secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_MANAGER_CHAT_ID

    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

    const TELEGRAM_API = 'https://api.telegram.org/bot'

    const MEMBERSHIP_PRICES: Record<number, number> = {
      1: 1000,
      3: 3000,
      6: 6000,
      12: 12000
    }

    Deno.serve(async (req) => {
      try {
        const body = await req.json()

        // ---- Handle callback_query (inline keyboard buttons) ----
        if (body.callback_query) {
          await handleCallbackQuery(body.callback_query)
          return new Response('ok', { status: 200 })
        }

        // ---- Handle message ----
        const message = body.message
        if (!message) {
          return new Response('ok', { status: 200 })
        }

        const chatId = message.chat.id

        // Handle photo messages (membership receipt)
        if (message.photo && message.photo.length > 0) {
          await handleMembershipPhoto(chatId, message.photo)
          return new Response('ok', { status: 200 })
        }

        if (!message.text) {
          return new Response('ok', { status: 200 })
        }

        const text = message.text.trim()

        // Handle /start with deep link parameter (profile UUID)
        if (text.startsWith('/start ')) {
          const profileId = text.replace('/start ', '').trim()

          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (!uuidRegex.test(profileId)) {
            await sendMessage(chatId, 'Invalid link. Please use the button from your KSLT dashboard.')
            return new Response('ok', { status: 200 })
          }

          // Save chat_id to profile
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )

          // Clear chat_id from any previous profile (UNIQUE constraint)
          await supabase
            .from('profiles')
            .update({ telegram_chat_id: null, telegram_username: null })
            .eq('telegram_chat_id', chatId)
            .neq('id', profileId)

          // Save chat_id and username
          const tgUsername = message.from?.username || null
          const updateData: Record<string, unknown> = { telegram_chat_id: chatId }
          if (tgUsername) updateData.telegram_username = tgUsername

          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', profileId)

          if (error) {
            console.error('DB error:', error)
            await sendMessage(chatId, 'Error connecting account. Please try again later.')
            return new Response('ok', { status: 200 })
          }

          const firstName = message.from?.first_name || ''
          await sendMessage(
            chatId,
            `${firstName ? firstName + ', ' : ''}your Telegram is now connected to KSLT! ✅\n\nYou will receive membership expiry reminders here.`
          )

          return new Response('ok', { status: 200 })
        }

        // Handle plain /start (no deep link) — check if already connected
        if (text === '/start') {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('telegram_chat_id', chatId)
            .limit(1)
            .single()

          if (existing) {
            await sendMessage(chatId, 'Ваш Telegram подключён к KSLT ✅\n\nВы будете получать уведомления о приглашениях на игру и напоминания здесь.')
          } else {
            await sendMessage(chatId, 'Добро пожаловать в KSLT Tennis Bot! 🎾\n\nЧтобы подключить аккаунт, нажмите «Подключить Telegram» в личном кабинете:\nhttps://kslt.netlify.app/pages/dashboard.html')
          }
          return new Response('ok', { status: 200 })
        }

        // Handle /membership command
        if (text === '/membership') {
          await handleMembershipCommand(chatId)
          return new Response('ok', { status: 200 })
        }

        // Handle /notifications command
        if (text === '/notifications') {
          await handleNotificationsCommand(chatId)
          return new Response('ok', { status: 200 })
        }

        // Check for active challenge counter-step (text message flow)
        const counterHandled = await handleCounterStep(chatId, text)
        if (counterHandled) {
          return new Response('ok', { status: 200 })
        }

        // Unknown command
        await sendMessage(chatId, 'Нажмите /start или подключите аккаунт через личный кабинет KSLT.\n\nКоманды:\n/membership — заявка на членство\n/notifications — настройки уведомлений')

        return new Response('ok', { status: 200 })
      } catch (err) {
        console.error('Webhook error:', err)
        return new Response('ok', { status: 200 })
      }
    })

    // ---- Callback Query Dispatcher ----
    async function handleCallbackQuery(query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } }) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const data = query.data || ''
      const chatId = query.message?.chat?.id

      // Route: notification toggle callbacks
      if (data.startsWith('notif_toggle:')) {
        await handleNotifToggle(query, data)
        return
      }

      // Route: membership callbacks (mem_period, mem_cat, mem_approve, mem_reject)
      if (data.startsWith('mem_')) {
        await handleMembershipCallback(query, data)
        return
      }

      // Route: tournament_register:{id}
      const trnMatch = data.match(/^tournament_register:(.+)$/)
      if (trnMatch) {
        await handleTournamentRegister(query, trnMatch[1])
        return
      }

      // Route: challenge_accept/counter/decline:{uuid}
      const chalMatch = data.match(/^challenge_(accept|counter|decline|counter_accept|counter_decline):(.+)$/)
      if (chalMatch && chatId) {
        const chalAction = chalMatch[1]
        const chalId = chalMatch[2]
        if (chalAction === 'accept' || chalAction === 'counter_accept') {
          await handleChallengeAccept(query, chalId)
        } else if (chalAction === 'counter') {
          await handleChallengeCounter(query, chalId)
        } else {
          await handleChallengeDecline(query, chalId)
        }
        return
      }

      // Route: invite_accept/decline:{uuid}
      const messageId = query.message?.message_id
      const match = data.match(/^invite_(accept|decline):(.+)$/)
      if (!match || !chatId) {
        await answerCallbackQuery(token, query.id, 'Unknown action')
        return
      }

      const action = match[1] // 'accept' | 'decline'
      const inviteId = match[2]

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Get invite with sender + receiver info
      const { data: invite, error: fetchErr } = await db
        .from('game_invites')
        .select('id, status, sender_id, receiver_player_id, receiver_profile_id')
        .eq('id', inviteId)
        .single()

      if (fetchErr || !invite) {
        await answerCallbackQuery(token, query.id, 'Приглашение не найдено')
        return
      }

      if (invite.status !== 'pending') {
        const statusText = invite.status === 'accepted' ? 'уже принято' : 'уже обработано'
        await answerCallbackQuery(token, query.id, `Приглашение ${statusText}`)
        // Update message to remove buttons
        if (messageId) {
          await editMessageReplyMarkup(token, chatId, messageId)
        }
        return
      }

      // Verify the clicker is the receiver
      const { data: receiverProfile } = await db
        .from('profiles')
        .select('id, full_name, telegram_chat_id, telegram_username')
        .eq('id', invite.receiver_profile_id)
        .single()

      if (!receiverProfile || receiverProfile.telegram_chat_id !== chatId) {
        await answerCallbackQuery(token, query.id, 'Действие недоступно')
        return
      }

      // Get sender profile
      const { data: senderProfile } = await db
        .from('profiles')
        .select('id, full_name, telegram_chat_id, telegram_username, notify_preferences')
        .eq('id', invite.sender_id)
        .single()

      if (!senderProfile) {
        await answerCallbackQuery(token, query.id, 'Ошибка: отправитель не найден')
        return
      }

      const newStatus = action === 'accept' ? 'accepted' : 'declined'

      // Update invite status
      await db
        .from('game_invites')
        .update({ status: newStatus, responded_at: new Date().toISOString() })
        .eq('id', inviteId)

      // Remove inline keyboard from original message
      if (messageId) {
        await editMessageReplyMarkup(token, chatId, messageId)
      }

      if (action === 'accept') {
        const disclaimer = '\n\n<i>КСЛТ не передаёт персональные данные. Общение происходит напрямую через Telegram.</i>'

        // Build chat URLs — prefer username (opens chat), fallback to user ID (opens profile)
        const senderUrl = senderProfile.telegram_username
          ? `https://t.me/${senderProfile.telegram_username}`
          : `tg://user?id=${senderProfile.telegram_chat_id}`
        const receiverUrl = receiverProfile.telegram_username
          ? `https://t.me/${receiverProfile.telegram_username}`
          : `tg://user?id=${receiverProfile.telegram_chat_id}`

        // Notify receiver (current chat) — button to open chat with sender
        await sendMessageWithButton(
          chatId,
          `✅ <b>Приглашение принято!</b>\n\nНажмите кнопку ниже, чтобы написать ${senderProfile.full_name} и договориться об игре 🎾` + disclaimer,
          `💬 Написать ${senderProfile.full_name}`,
          senderUrl
        )

        // Notify sender — button to open chat with receiver (respect opt-out)
        if (senderProfile.telegram_chat_id && shouldNotify(senderProfile.notify_preferences, 'tg', 'challenges')) {
          await sendMessageWithButton(
            senderProfile.telegram_chat_id,
            `✅ <b>${receiverProfile.full_name} принял(а) ваше приглашение!</b>\n\nНажмите кнопку ниже, чтобы начать общение 🎾` + disclaimer,
            `💬 Написать ${receiverProfile.full_name}`,
            receiverUrl
          )
        }

        await answerCallbackQuery(token, query.id, 'Принято!')
      } else {
        // Declined
        await sendMessage(chatId, 'Приглашение отклонено.')

        if (senderProfile.telegram_chat_id && shouldNotify(senderProfile.notify_preferences, 'tg', 'challenges')) {
          await sendMessage(
            senderProfile.telegram_chat_id,
            `${receiverProfile.full_name} отклонил(а) приглашение на игру.`
          )
        }

        await answerCallbackQuery(token, query.id, 'Отклонено')
      }
    }

    // ---- Tournament Registration Callback Handler ----
    async function handleTournamentRegister(
      query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
      tournamentId: string
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const tgUserId = query.from.id

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 1. Find profile by telegram_chat_id
      const { data: profile } = await db
        .from('profiles')
        .select('id, full_name, player_id, role, banned_until, notify_preferences')
        .eq('telegram_chat_id', tgUserId)
        .limit(1)
        .single()

      if (!profile) {
        await answerCallbackQuery(token, query.id, 'Привяжите Telegram к аккаунту KSLT')
        return
      }

      // 1.5. Ban check
      if (profile.banned_until && new Date(profile.banned_until) > new Date()) {
        const isPerm = new Date(profile.banned_until).getFullYear() >= 2099
        const banMsg = isPerm
          ? '⛔ Вы заблокированы навсегда'
          : '⛔ Вы заблокированы до ' + new Date(profile.banned_until).toLocaleDateString('ru-RU')
        await answerCallbackQuery(token, query.id, banMsg)
        return
      }

      // 2. Check player_id
      if (!profile.player_id) {
        await answerCallbackQuery(token, query.id, 'У вас нет карточки игрока')
        return
      }

      // 3. Load tournament
      const { data: tournament } = await db
        .from('tournaments')
        .select('id, title, status, category_id, max_participants')
        .eq('id', tournamentId)
        .single()

      if (!tournament) {
        await answerCallbackQuery(token, query.id, 'Турнир не найден')
        return
      }

      if (tournament.status !== 'registration_open') {
        await answerCallbackQuery(token, query.id, 'Регистрация закрыта')
        return
      }

      // 4. Check duplicate registration
      const { data: existingReg } = await db
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('player_id', profile.player_id)
        .limit(1)

      if (existingReg && existingReg.length > 0) {
        await answerCallbackQuery(token, query.id, 'Вы уже записаны на этот турнир')
        return
      }

      // 5. Category check
      const isStaff = profile.role === 'admin' || profile.role === 'manager'

      const { data: player } = await db
        .from('players')
        .select('id, category_id, points, banned_until, ban_reason')
        .eq('id', profile.player_id)
        .single()

      if (!player) {
        await answerCallbackQuery(token, query.id, 'Карточка игрока не найдена')
        return
      }

      // 5.5. Player-level ban check
      if (player.banned_until && new Date(player.banned_until) > new Date()) {
        const isPerm = new Date(player.banned_until).getFullYear() >= 2099
        const banMsg = isPerm
          ? '⛔ Вы заблокированы навсегда'
          : '⛔ Вы заблокированы до ' + new Date(player.banned_until).toLocaleDateString('ru-RU')
        await answerCallbackQuery(token, query.id, banMsg)
        return
      }

      // Gender helper
      function getCatGender(cid: string | null): string | null {
        return cid ? cid.split('-')[0] : null
      }

      // Determine registration status (pending vs waitlist)
      let regStatus = 'pending'
      const tCatId = tournament.category_id
      const pCatId = player.category_id

      if (tCatId) {
        // 1. Gender check: load category gender from categories table
        const { data: catRow } = await db
          .from('categories')
          .select('gender')
          .eq('id', tCatId)
          .single()
        const catGender = catRow?.gender || null // 'men' | 'women' | null
        const playerGender = getCatGender(pCatId)

        if (catGender && playerGender && catGender !== playerGender) {
          const genderMsg = catGender === 'men'
            ? 'Этот турнир только для мужчин'
            : 'Этот турнир только для женщин'
          await answerCallbackQuery(token, query.id, genderMsg)
          return
        }

        // 2. Category match → pending (main draw) or waitlist
        regStatus = (pCatId === tCatId) ? 'pending' : 'waitlist'
      }

      // 6. Check membership (staff bypass)
      if (!isStaff) {
        const today = new Date().toISOString().split('T')[0]
        const { data: membership } = await db
          .from('memberships')
          .select('id, status')
          .eq('profile_id', profile.id)
          .eq('status', 'active')
          .gte('expires_at', today)
          .limit(1)

        if (!membership || membership.length === 0) {
          await answerCallbackQuery(token, query.id, 'Необходимо активное членство KSLT')
          return
        }
      }

      // 7. Register
      const { error: regError } = await db
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: profile.player_id,
          status: regStatus
        })

      if (regError) {
        console.error('Registration error:', regError)
        await answerCallbackQuery(token, query.id, 'Ошибка регистрации')
        return
      }

      // 8. Answer callback + DM based on status
      if (regStatus === 'waitlist') {
        await answerCallbackQuery(token, query.id, '⏳ Вы в листе ожидания')
        if (shouldNotify(profile.notify_preferences, 'tg', 'tournaments')) {
          await sendMessage(
            tgUserId,
            `⏳ <b>Вы в листе ожидания</b>\n\n🏆 ${escapeHtml(tournament.title || '')}\n\nВаша заявка ожидает одобрения администратора. Следите за обновлениями на сайте.`
          )
        }
      } else {
        await answerCallbackQuery(token, query.id, '✅ Заявка отправлена!')
        if (shouldNotify(profile.notify_preferences, 'tg', 'tournaments')) {
          await sendMessage(
            tgUserId,
            `✅ <b>Заявка на турнир отправлена!</b>\n\n🏆 ${escapeHtml(tournament.title || '')}\n\nСтатус: ожидает подтверждения. Следите за обновлениями на сайте.`
          )
        }
      }
    }

    // ---- Challenge Handlers ----

    async function handleChallengeAccept(
      query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
      challengeId: string
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: challenge } = await db
        .from('challenges')
        .select('id, status, challenger_id, opponent_profile_id, proposed_date, proposed_time, proposed_venue, counter_date, counter_time, counter_venue')
        .eq('id', challengeId)
        .single()

      if (!challenge) {
        await answerCallbackQuery(token, query.id, 'Вызов не найден')
        return
      }

      if (challenge.status !== 'active' && challenge.status !== 'countered') {
        await answerCallbackQuery(token, query.id, 'Вызов уже обработан')
        if (messageId && chatId) await editMessageReplyMarkup(token, chatId, messageId)
        return
      }

      // Determine final date/time/venue
      const finalDate = challenge.status === 'countered' && challenge.counter_date ? challenge.counter_date : challenge.proposed_date
      const finalTime = challenge.status === 'countered' && challenge.counter_time ? challenge.counter_time : challenge.proposed_time
      const finalVenue = challenge.status === 'countered' && challenge.counter_venue ? challenge.counter_venue : challenge.proposed_venue

      await db
        .from('challenges')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', challengeId)

      if (messageId && chatId) await editMessageReplyMarkup(token, chatId, messageId)

      // Get profiles
      const { data: challengerProfile } = await db
        .from('profiles')
        .select('full_name, telegram_chat_id, notify_preferences')
        .eq('id', challenge.challenger_id)
        .single()

      const { data: opponentProfile } = await db
        .from('profiles')
        .select('full_name, telegram_chat_id, notify_preferences')
        .eq('id', challenge.opponent_profile_id)
        .single()

      const cName = challengerProfile?.full_name || 'Игрок'
      const oName = opponentProfile?.full_name || 'Игрок'
      const dateStr = formatDateRu(finalDate)

      const confirmMsg = `✅ <b>Матч подтверждён!</b>\n\n${escapeHtml(cName)} vs ${escapeHtml(oName)}\n📅 ${dateStr}  ⏰ ${finalTime || ''}${finalVenue ? '\n📍 ' + escapeHtml(finalVenue) : ''}`

      // Notify both (respect opt-out)
      if (challengerProfile?.telegram_chat_id && shouldNotify(challengerProfile.notify_preferences, 'tg', 'challenges')) {
        await sendMessage(challengerProfile.telegram_chat_id, confirmMsg)
      }
      if (opponentProfile?.telegram_chat_id && shouldNotify(opponentProfile.notify_preferences, 'tg', 'challenges')) {
        await sendMessage(opponentProfile.telegram_chat_id, confirmMsg)
      }

      // Notify managers
      const { data: managers } = await db
        .from('profiles')
        .select('telegram_chat_id')
        .in('role', ['admin', 'manager'])
        .not('telegram_chat_id', 'is', null)

      if (managers) {
        const mgrMsg = `📋 <b>Новый выставочный матч</b>\n\n${escapeHtml(cName)} vs ${escapeHtml(oName)}\n📅 ${dateStr}  ⏰ ${finalTime || ''}${finalVenue ? '\n📍 ' + escapeHtml(finalVenue) : ''}`
        for (const mgr of managers) {
          if (mgr.telegram_chat_id) await sendMessage(mgr.telegram_chat_id, mgrMsg)
        }
      }

      await answerCallbackQuery(token, query.id, 'Принято!')
    }

    async function handleChallengeCounter(
      query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
      challengeId: string
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: challenge } = await db
        .from('challenges')
        .select('id, status, opponent_profile_id')
        .eq('id', challengeId)
        .single()

      if (!challenge || challenge.status !== 'active') {
        await answerCallbackQuery(token, query.id, 'Вызов уже обработан')
        if (messageId && chatId) await editMessageReplyMarkup(token, chatId, messageId)
        return
      }

      // Verify clicker is the opponent
      const { data: profile } = await db
        .from('profiles')
        .select('id')
        .eq('id', challenge.opponent_profile_id)
        .eq('telegram_chat_id', chatId)
        .single()

      if (!profile) {
        await answerCallbackQuery(token, query.id, 'Действие недоступно')
        return
      }

      await db
        .from('challenges')
        .update({ status: 'negotiating', counter_step: 'date' })
        .eq('id', challengeId)

      if (messageId && chatId) await editMessageReplyMarkup(token, chatId, messageId)

      await sendMessage(chatId!, '📅 Укажите удобную дату (ГГГГ-ММ-ДД):')
      await answerCallbackQuery(token, query.id, 'Укажите дату')
    }

    async function handleChallengeDecline(
      query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
      challengeId: string
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: challenge } = await db
        .from('challenges')
        .select('id, status, challenger_id, opponent_profile_id')
        .eq('id', challengeId)
        .single()

      if (!challenge) {
        await answerCallbackQuery(token, query.id, 'Вызов не найден')
        return
      }

      if (challenge.status !== 'active' && challenge.status !== 'countered') {
        await answerCallbackQuery(token, query.id, 'Вызов уже обработан')
        if (messageId && chatId) await editMessageReplyMarkup(token, chatId, messageId)
        return
      }

      await db
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId)

      if (messageId && chatId) await editMessageReplyMarkup(token, chatId, messageId)

      // Get names
      const { data: challengerProfile } = await db
        .from('profiles')
        .select('full_name, telegram_chat_id, notify_preferences')
        .eq('id', challenge.challenger_id)
        .single()

      const { data: opponentProfile } = await db
        .from('profiles')
        .select('full_name, telegram_chat_id')
        .eq('id', challenge.opponent_profile_id)
        .single()

      const declinedByName = opponentProfile?.full_name || 'Игрок'

      if (chatId) {
        await sendMessage(chatId, 'Вызов отклонён.')
      }
      if (challengerProfile?.telegram_chat_id && shouldNotify(challengerProfile.notify_preferences, 'tg', 'challenges')) {
        await sendMessage(challengerProfile.telegram_chat_id, `${escapeHtml(declinedByName)} отклонил(а) ваш вызов на матч.`)
      }

      await answerCallbackQuery(token, query.id, 'Отклонено')
    }

    async function handleCounterStep(chatId: number, text: string): Promise<boolean> {
      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Find profile by chat_id
      const { data: profile } = await db
        .from('profiles')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single()

      if (!profile) return false

      // Find active negotiating challenge for this user
      const { data: challenge } = await db
        .from('challenges')
        .select('id, status, counter_step, challenger_id, opponent_profile_id')
        .eq('opponent_profile_id', profile.id)
        .eq('status', 'negotiating')
        .not('counter_step', 'is', null)
        .limit(1)
        .single()

      if (!challenge) return false

      const step = challenge.counter_step

      if (step === 'date') {
        // Parse date YYYY-MM-DD
        const dateMatch = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (!dateMatch) {
          await sendMessage(chatId, '❌ Формат даты: ГГГГ-ММ-ДД (например, 2026-04-15)')
          return true
        }
        const d = new Date(text.trim() + 'T00:00:00')
        if (isNaN(d.getTime()) || d <= new Date()) {
          await sendMessage(chatId, '❌ Дата должна быть в будущем')
          return true
        }
        await db.from('challenges').update({ counter_date: text.trim(), counter_step: 'time' }).eq('id', challenge.id)
        await sendMessage(chatId, '⏰ Укажите удобное время (ЧЧ:ММ):')
        return true
      }

      if (step === 'time') {
        const timeMatch = text.trim().match(/^(\d{1,2}):(\d{2})$/)
        if (!timeMatch) {
          await sendMessage(chatId, '❌ Формат времени: ЧЧ:ММ (например, 18:00)')
          return true
        }
        const h = parseInt(timeMatch[1]), m = parseInt(timeMatch[2])
        if (h < 0 || h > 23 || m < 0 || m > 59) {
          await sendMessage(chatId, '❌ Некорректное время')
          return true
        }
        const timeFormatted = timeMatch[1].padStart(2, '0') + ':' + timeMatch[2]
        await db.from('challenges').update({ counter_time: timeFormatted, counter_step: 'venue' }).eq('id', challenge.id)
        await sendMessage(chatId, '📍 Укажите площадку (название):')
        return true
      }

      if (step === 'venue') {
        const venue = text.trim().substring(0, 200)
        if (!venue) {
          await sendMessage(chatId, '❌ Укажите название площадки')
          return true
        }

        // Get counter data
        const { data: updated } = await db
          .from('challenges')
          .update({
            counter_venue: venue,
            counter_step: null,
            status: 'countered',
            countered_at: new Date().toISOString()
          })
          .eq('id', challenge.id)
          .select('counter_date, counter_time, challenger_id')
          .single()

        // Get opponent name
        const { data: opProfile } = await db
          .from('profiles')
          .select('full_name')
          .eq('id', challenge.opponent_profile_id)
          .single()

        const opName = opProfile?.full_name || 'Игрок'
        const dateStr = formatDateRu(updated?.counter_date)

        await sendMessage(chatId, '✅ Встречное предложение отправлено!')

        // Send counter-proposal to challenger
        const { data: challengerProfile } = await db
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', challenge.challenger_id)
          .single()

        if (challengerProfile?.telegram_chat_id) {
          const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
          if (token) {
            await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: challengerProfile.telegram_chat_id,
                text: `🔄 <b>Встречное предложение!</b>\n\n${escapeHtml(opName)} предлагает другое время:\n📅 ${dateStr}  ⏰ ${updated?.counter_time || ''}\n📍 ${escapeHtml(venue)}`,
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [[
                    { text: '✅ Принять', callback_data: `challenge_counter_accept:${challenge.id}` },
                    { text: '❌ Отклонить', callback_data: `challenge_counter_decline:${challenge.id}` }
                  ]]
                }
              })
            })
          }
        }

        return true
      }

      return false
    }

    // ---- Membership Flow Handlers ----

    async function handleMembershipCommand(chatId: number) {
      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 1. Find profile by telegram_chat_id
      const { data: profile } = await db
        .from('profiles')
        .select('id, full_name, player_id, gender')
        .eq('telegram_chat_id', chatId)
        .limit(1)
        .single()

      if (!profile) {
        await sendMessage(chatId, 'Сначала привяжите Telegram к аккаунту KSLT:\nhttps://kslt.netlify.app/pages/dashboard.html')
        return
      }

      // 2. Check active membership
      const today = new Date().toISOString().split('T')[0]
      const { data: activeMem } = await db
        .from('memberships')
        .select('id, expires_at')
        .eq('profile_id', profile.id)
        .eq('status', 'active')
        .gte('expires_at', today)
        .limit(1)

      if (activeMem && activeMem.length > 0) {
        const expDate = formatDateRu(activeMem[0].expires_at?.split('T')[0])
        await sendMessage(chatId, `У вас уже есть активное членство KSLT до ${expDate} ✅`)
        return
      }

      // 3. Check pending request
      const { data: pendingReq } = await db
        .from('membership_requests')
        .select('id, status')
        .eq('profile_id', profile.id)
        .in('status', ['select_period', 'select_category', 'pending_receipt', 'pending_approval'])
        .limit(1)

      if (pendingReq && pendingReq.length > 0) {
        const st = pendingReq[0].status
        if (st === 'pending_approval') {
          await sendMessage(chatId, 'У вас уже есть активная заявка на рассмотрении. Ожидайте подтверждения.')
        } else if (st === 'pending_receipt') {
          await sendMessage(chatId, 'У вас есть незавершённая заявка. Отправьте скриншот чека об оплате.')
        } else {
          // Reset stale request (select_period / select_category)
          await db.from('membership_requests').delete().eq('id', pendingReq[0].id)
        }
        if (st === 'pending_approval' || st === 'pending_receipt') return
      }

      // 4. Create new request
      await db.from('membership_requests').insert({
        profile_id: profile.id,
        status: 'select_period'
      })

      // 5. Show period selection
      const keyboard = Object.entries(MEMBERSHIP_PRICES).map(([months, price]) => [{
        text: `${months} мес — ${price} сом`,
        callback_data: `mem_period:${months}`
      }])

      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (token) {
        await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '🎾 <b>Членство KSLT</b>\n\nВыберите срок членства:',
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          })
        })
      }
    }

    async function handleMembershipCallback(
      query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
      data: string
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // --- mem_period:{months} ---
      const periodMatch = data.match(/^mem_period:(\d+)$/)
      if (periodMatch && chatId) {
        const months = parseInt(periodMatch[1])
        const price = MEMBERSHIP_PRICES[months]
        if (!price) {
          await answerCallbackQuery(token, query.id, 'Некорректный срок')
          return
        }

        // Find profile
        const { data: profile } = await db
          .from('profiles')
          .select('id, player_id, gender')
          .eq('telegram_chat_id', chatId)
          .single()

        if (!profile) {
          await answerCallbackQuery(token, query.id, 'Профиль не найден')
          return
        }

        // Find active request
        const { data: req } = await db
          .from('membership_requests')
          .select('id')
          .eq('profile_id', profile.id)
          .in('status', ['select_period', 'select_category'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!req) {
          await answerCallbackQuery(token, query.id, 'Заявка не найдена. Используйте /membership')
          return
        }

        // Remove inline keyboard from period selection message
        if (messageId) await editMessageReplyMarkup(token, chatId, messageId)

        if (profile.player_id) {
          // Has player card → skip category selection → pending_receipt
          await db.from('membership_requests')
            .update({ months, amount: price, status: 'pending_receipt', updated_at: new Date().toISOString() })
            .eq('id', req.id)

          await sendMessage(chatId, `💰 К оплате: <b>${price} сом</b> за ${months} мес.\n\nРеквизиты для оплаты:\nhttps://kslt.netlify.app/pages/pricing.html\n\n📸 Отправьте скриншот чека об оплате в этот чат.`)
          await answerCallbackQuery(token, query.id, `${months} мес — ${price} сом`)
        } else {
          // No player card → need category selection
          await db.from('membership_requests')
            .update({ months, amount: price, status: 'select_category', updated_at: new Date().toISOString() })
            .eq('id', req.id)

          // Load categories filtered by gender
          const gender = profile.gender // 'male' | 'female' | null
          let catQuery = db.from('categories').select('id, name').order('name')
          if (gender === 'male') {
            catQuery = catQuery.eq('gender', 'men')
          } else if (gender === 'female') {
            catQuery = catQuery.eq('gender', 'women')
          }

          const { data: categories } = await catQuery
          if (!categories || categories.length === 0) {
            // Fallback: skip category, go to receipt
            await db.from('membership_requests')
              .update({ status: 'pending_receipt', updated_at: new Date().toISOString() })
              .eq('id', req.id)
            await sendMessage(chatId, `💰 К оплате: <b>${price} сом</b> за ${months} мес.\n\nРеквизиты для оплаты:\nhttps://kslt.netlify.app/pages/pricing.html\n\n📸 Отправьте скриншот чека об оплате в этот чат.`)
            await answerCallbackQuery(token, query.id, `${months} мес — ${price} сом`)
            return
          }

          const catKeyboard = categories.map(c => [{
            text: c.name,
            callback_data: `mem_cat:${c.id}`
          }])

          await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '🏆 Выберите категорию:',
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: catKeyboard }
            })
          })

          await answerCallbackQuery(token, query.id, `${months} мес — ${price} сом`)
        }
        return
      }

      // --- mem_cat:{category_id} ---
      const catMatch = data.match(/^mem_cat:(.+)$/)
      if (catMatch && chatId) {
        const categoryId = catMatch[1]

        const { data: profile } = await db
          .from('profiles')
          .select('id')
          .eq('telegram_chat_id', chatId)
          .single()

        if (!profile) {
          await answerCallbackQuery(token, query.id, 'Профиль не найден')
          return
        }

        const { data: req } = await db
          .from('membership_requests')
          .select('id, amount, months')
          .eq('profile_id', profile.id)
          .eq('status', 'select_category')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!req) {
          await answerCallbackQuery(token, query.id, 'Заявка не найдена')
          return
        }

        // Remove inline keyboard
        if (messageId) await editMessageReplyMarkup(token, chatId, messageId)

        await db.from('membership_requests')
          .update({ category_id: categoryId, status: 'pending_receipt', updated_at: new Date().toISOString() })
          .eq('id', req.id)

        await sendMessage(chatId, `💰 К оплате: <b>${req.amount} сом</b> за ${req.months} мес.\n\nРеквизиты для оплаты:\nhttps://kslt.netlify.app/pages/pricing.html\n\n📸 Отправьте скриншот чека об оплате в этот чат.`)
        await answerCallbackQuery(token, query.id, 'Отправьте скриншот чека')
        return
      }

      // --- mem_approve:{request_id} (from manager group) ---
      const approveMatch = data.match(/^mem_approve:(.+)$/)
      if (approveMatch) {
        const requestId = approveMatch[1]
        await processMembershipApproval(query, requestId, true)
        return
      }

      // --- mem_reject:{request_id} (from manager group) ---
      const rejectMatch = data.match(/^mem_reject:(.+)$/)
      if (rejectMatch) {
        const requestId = rejectMatch[1]
        await processMembershipApproval(query, requestId, false)
        return
      }

      await answerCallbackQuery(token, query.id, 'Неизвестное действие')
    }

    async function handleMembershipPhoto(chatId: number, photos: Array<{ file_id: string; width: number; height: number }>) {
      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Find profile
      const { data: profile } = await db
        .from('profiles')
        .select('id, full_name')
        .eq('telegram_chat_id', chatId)
        .single()

      if (!profile) return

      // Find pending_receipt request
      const { data: req } = await db
        .from('membership_requests')
        .select('id, months, amount, category_id')
        .eq('profile_id', profile.id)
        .eq('status', 'pending_receipt')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!req) {
        // No pending receipt request — ignore photo
        return
      }

      // Get largest photo (last in array)
      const fileId = photos[photos.length - 1].file_id

      // Update request
      await db.from('membership_requests')
        .update({ receipt_file_id: fileId, status: 'pending_approval', updated_at: new Date().toISOString() })
        .eq('id', req.id)

      // Send to manager group
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const managerChatId = Deno.env.get('TELEGRAM_MANAGER_CHAT_ID')

      if (token && managerChatId) {
        const name = profile.full_name || 'Без имени'
        const caption = `🆕 <b>Заявка на членство</b>\n\nФИО: ${escapeHtml(name)}\nСрок: ${req.months} мес\nСумма: ${req.amount} сом`

        const sendRes = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: managerChatId,
            photo: fileId,
            caption,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Одобрить', callback_data: `mem_approve:${req.id}` },
                { text: '❌ Отклонить', callback_data: `mem_reject:${req.id}` }
              ]]
            }
          })
        })

        // Save manager message_id for later editing
        try {
          const sendData = await sendRes.json()
          if (sendData.ok && sendData.result?.message_id) {
            await db.from('membership_requests')
              .update({ manager_message_id: sendData.result.message_id })
              .eq('id', req.id)
          }
        } catch { /* ignore */ }
      }

      await sendMessage(chatId, '✅ Заявка отправлена на рассмотрение. Ожидайте подтверждения.')
    }

    async function processMembershipApproval(
      query: { id: string; data?: string; from: { id: number; first_name?: string }; message?: { chat: { id: number }; message_id: number } },
      requestId: string,
      approve: boolean
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Load request
      const { data: req } = await db
        .from('membership_requests')
        .select('id, profile_id, status, months, amount, category_id')
        .eq('id', requestId)
        .single()

      if (!req) {
        await answerCallbackQuery(token, query.id, 'Заявка не найдена')
        return
      }

      if (req.status !== 'pending_approval') {
        await answerCallbackQuery(token, query.id, 'Заявка уже обработана')
        return
      }

      const managerName = query.from?.first_name || 'Менеджер'

      // Get user profile
      const { data: profile } = await db
        .from('profiles')
        .select('id, full_name, player_id, gender, telegram_chat_id, notify_preferences')
        .eq('id', req.profile_id)
        .single()

      if (!profile) {
        await answerCallbackQuery(token, query.id, 'Профиль пользователя не найден')
        return
      }

      if (approve) {
        // 1. Create membership
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setMonth(expiresAt.getMonth() + (req.months || 1))

        const { data: membership, error: memErr } = await db.from('memberships').insert({
          profile_id: req.profile_id,
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          note: 'Telegram bot'
        }).select('id').single()

        if (memErr) {
          console.error('Membership insert error:', memErr)
          await answerCallbackQuery(token, query.id, 'Ошибка создания членства')
          return
        }

        // 2. Create payment record
        if (membership) {
          await db.from('payments').insert({
            profile_id: req.profile_id,
            membership_id: membership.id,
            amount: req.amount || 0,
            currency: 'KGS',
            method: 'transfer',
            status: 'completed',
            note: 'Telegram bot'
          })
        }

        // 3. Auto-create player if no player_id + category selected
        if (!profile.player_id && req.category_id) {
          await autoCreatePlayerFromBot(db, profile, req.category_id)
        }

        // 4. Update request status
        await db.from('membership_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', req.id)

        // 5. Notify user via TG (respect opt-out)
        if (profile.telegram_chat_id && shouldNotify(profile.notify_preferences, 'tg', 'membership')) {
          const expDateStr = expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
          await sendMessage(
            profile.telegram_chat_id,
            `✅ <b>Членство KSLT активировано!</b>\n\nДействует до: ${expDateStr}\nДобро пожаловать! 🎾`
          )
        }

        // 6. Update manager group message
        if (chatId && messageId) {
          const managerChatIdStr = Deno.env.get('TELEGRAM_MANAGER_CHAT_ID')
          if (managerChatIdStr) {
            await fetch(`${TELEGRAM_API}${token}/editMessageReplyMarkup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: [] }
              })
            })
            // Add approval note as caption edit is not possible for photos, send reply
            await sendMessage(chatId, `✅ Одобрено — ${escapeHtml(managerName)}`)
          }
        }

        await answerCallbackQuery(token, query.id, '✅ Членство выдано!')

      } else {
        // Reject
        await db.from('membership_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', req.id)

        if (profile.telegram_chat_id && shouldNotify(profile.notify_preferences, 'tg', 'membership')) {
          await sendMessage(
            profile.telegram_chat_id,
            '❌ Заявка на членство отклонена.\n\nОбратитесь к менеджеру для уточнения.'
          )
        }

        if (chatId && messageId) {
          await fetch(`${TELEGRAM_API}${token}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              reply_markup: { inline_keyboard: [] }
            })
          })
          await sendMessage(chatId, `❌ Отклонено — ${escapeHtml(managerName)}`)
        }

        await answerCallbackQuery(token, query.id, '❌ Заявка отклонена')
      }
    }

    async function autoCreatePlayerFromBot(
      db: ReturnType<typeof createClient>,
      profile: { id: string; full_name: string | null; gender: string | null },
      categoryId: string
    ) {
      const name = (profile.full_name || '').trim()
      if (!name) return

      // Generate slug id
      const baseId = name
        .toLowerCase()
        .replace(/[а-яё]/g, (c: string) => {
          const map: Record<string, string> = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
            'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
            'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
            'ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
          }
          return map[c] || c
        })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      if (!baseId) return

      let finalId = baseId
      let suffix = 2
      while (suffix < 20) {
        const { data: existing } = await db.from('players').select('id').eq('id', finalId).maybeSingle()
        if (!existing) break
        finalId = baseId + '-' + suffix
        suffix++
      }

      const { error: insertErr } = await db.from('players').insert({
        id: finalId,
        name: name,
        category_id: categoryId,
        points: 0,
        wins: 0,
        losses: 0,
        country: '🇰🇬'
      })

      if (insertErr) {
        console.error('Auto-create player error:', insertErr)
        return
      }

      // Link player to profile
      await db.from('profiles').update({ player_id: finalId }).eq('id', profile.id)
    }

    // ---- /notifications command ----
    const NOTIF_CATS = ['membership', 'tournaments', 'matches', 'challenges'] as const
    const NOTIF_LABELS: Record<string, string> = {
      membership: 'Членство',
      tournaments: 'Турниры',
      matches: 'Матчи',
      challenges: 'Вызовы'
    }

    async function handleNotificationsCommand(chatId: number) {
      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: profile } = await db
        .from('profiles')
        .select('id, notify_preferences')
        .eq('telegram_chat_id', chatId)
        .limit(1)
        .single()

      if (!profile) {
        await sendMessage(chatId, 'Привяжите Telegram к аккаунту KSLT через личный кабинет.')
        return
      }

      const prefs = profile.notify_preferences || {}
      await sendNotifKeyboard(chatId, prefs, null)
    }

    async function sendNotifKeyboard(chatId: number, prefs: any, messageId: number | null) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      let text = '🔔 <b>Уведомления Telegram</b>\n\n'
      const buttons: Array<{ text: string; callback_data: string }[]> = []

      for (const cat of NOTIF_CATS) {
        const on = shouldNotify(prefs, 'tg', cat)
        const icon = on ? '✅' : '❌'
        text += `${icon} ${NOTIF_LABELS[cat]}\n`
        buttons.push([{
          text: `${icon} ${NOTIF_LABELS[cat]}`,
          callback_data: `notif_toggle:${cat}`
        }])
      }

      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      }

      if (messageId) {
        // Edit existing message
        payload.message_id = messageId
        await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
    }

    async function handleNotifToggle(
      query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
      data: string
    ) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      const chatId = query.message?.chat?.id
      const messageId = query.message?.message_id
      const cat = data.replace('notif_toggle:', '')

      if (!NOTIF_CATS.includes(cat as any)) {
        await answerCallbackQuery(token, query.id, 'Неизвестная категория')
        return
      }

      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: profile } = await db
        .from('profiles')
        .select('id, notify_preferences')
        .eq('telegram_chat_id', chatId)
        .limit(1)
        .single()

      if (!profile) {
        await answerCallbackQuery(token, query.id, 'Профиль не найден')
        return
      }

      const prefs = profile.notify_preferences || {}
      if (!prefs.tg) prefs.tg = {}
      const currentVal = prefs.tg[cat] !== false
      prefs.tg[cat] = !currentVal

      await db.from('profiles').update({ notify_preferences: prefs }).eq('id', profile.id)

      const statusText = !currentVal ? 'включено' : 'выключено'
      await answerCallbackQuery(token, query.id, `${NOTIF_LABELS[cat]}: ${statusText}`)

      // Update keyboard
      if (chatId && messageId) {
        await sendNotifKeyboard(chatId, prefs, messageId)
      }
    }

    function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
      if (!prefs) return true
      const ch = prefs[channel]
      if (!ch) return true
      return ch[cat] !== false
    }

    function formatDateRu(dateStr: string | null | undefined): string {
      if (!dateStr) return ''
      try {
        const d = new Date(dateStr + 'T00:00:00')
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
      } catch {
        return dateStr
      }
    }

    function escapeHtml(s: string): string {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    async function sendMessageWithButton(chatId: number, text: string, btnText: string, btnUrl: string) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) return

      await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: btnText, url: btnUrl }
            ]]
          }
        })
      })
    }

    async function sendMessage(chatId: number, text: string) {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (!token) {
        console.error('TELEGRAM_BOT_TOKEN not set')
        return
      }

      await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      })
    }

    async function answerCallbackQuery(token: string, callbackQueryId: string, text: string) {
      await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text
        })
      })
    }

    async function editMessageReplyMarkup(token: string, chatId: number, messageId: number) {
      await fetch(`${TELEGRAM_API}${token}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: [] }
        })
      })
    }
