  // ============================================
  // KSLT — Telegram Webhook Handler
  // Supabase Edge Function
  // ============================================
  // Handles:
  // 1. /start command with deep link parameter (profile UUID)
  // 2. callback_query for game invite accept/decline
  // 3. callback_query for tournament registration (tournament_register:{id})
  //
  // Deploy: Supabase Dashboard → Edge Functions → New Function
  // Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>
  // Required secret: TELEGRAM_BOT_TOKEN

  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const TELEGRAM_API = 'https://api.telegram.org/bot'

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

      if (!message || !message.text) {
        return new Response('ok', { status: 200 })
      }

      const chatId = message.chat.id
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

      // Check for active challenge counter-step (text message flow)
      const counterHandled = await handleCounterStep(chatId, text)
      if (counterHandled) {
        return new Response('ok', { status: 200 })
      }

      // Unknown command
      await sendMessage(chatId, 'Нажмите /start или подключите аккаунт через личный кабинет KSLT.')

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
      .select('id, full_name, telegram_chat_id, telegram_username')
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

      // Notify sender — button to open chat with receiver
      if (senderProfile.telegram_chat_id) {
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

      if (senderProfile.telegram_chat_id) {
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
      .select('id, full_name, player_id, role, banned_until')
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
      const { data: membership } = await db
        .from('memberships')
        .select('id, status')
        .eq('profile_id', profile.id)
        .eq('status', 'active')
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
      await sendMessage(
        tgUserId,
        `⏳ <b>Вы в листе ожидания</b>\n\n🏆 ${escapeHtml(tournament.title || '')}\n\nВаша заявка ожидает одобрения администратора. Следите за обновлениями на сайте.`
      )
    } else {
      await answerCallbackQuery(token, query.id, '✅ Заявка отправлена!')
      await sendMessage(
        tgUserId,
        `✅ <b>Заявка на турнир отправлена!</b>\n\n🏆 ${escapeHtml(tournament.title || '')}\n\nСтатус: ожидает подтверждения. Следите за обновлениями на сайте.`
      )
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
      .select('full_name, telegram_chat_id')
      .eq('id', challenge.challenger_id)
      .single()

    const { data: opponentProfile } = await db
      .from('profiles')
      .select('full_name, telegram_chat_id')
      .eq('id', challenge.opponent_profile_id)
      .single()

    const cName = challengerProfile?.full_name || 'Игрок'
    const oName = opponentProfile?.full_name || 'Игрок'
    const dateStr = formatDateRu(finalDate)

    const confirmMsg = `✅ <b>Матч подтверждён!</b>\n\n${escapeHtml(cName)} vs ${escapeHtml(oName)}\n📅 ${dateStr}  ⏰ ${finalTime || ''}${finalVenue ? '\n📍 ' + escapeHtml(finalVenue) : ''}`

    // Notify both
    if (challengerProfile?.telegram_chat_id) {
      await sendMessage(challengerProfile.telegram_chat_id, confirmMsg)
    }
    if (opponentProfile?.telegram_chat_id) {
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
      .select('full_name, telegram_chat_id')
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
    if (challengerProfile?.telegram_chat_id) {
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
