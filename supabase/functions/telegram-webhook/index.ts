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
        await sendMessage(chatId, 'Добро пожаловать в KSLT Tennis Bot! 🎾\n\nЧтобы подключить аккаунт, нажмите «Подключить Telegram» в личном кабинете:\nhttps://kslt.kg/pages/dashboard.html')
      }
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
    .select('id, full_name, player_id, role')
    .eq('telegram_chat_id', tgUserId)
    .limit(1)
    .single()

  if (!profile) {
    await answerCallbackQuery(token, query.id, 'Привяжите Telegram к аккаунту KSLT')
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
    .select('id, category_id, points')
    .eq('id', profile.player_id)
    .single()

  if (!player) {
    await answerCallbackQuery(token, query.id, 'Карточка игрока не найдена')
    return
  }

  if (tournament.category_id) {
    const tCatId = tournament.category_id
    const pCatId = player.category_id

    // Category hierarchy: Tour(1) < Futures(2) < Challenger(3) < Masters(4) < Pro-Masters(5)
    const CAT_LEVELS: Record<string, number> = { tour: 1, futures: 2, challenger: 3, masters: 4, promasters: 5 }
    function getCatLevel(cid: string | null): number {
      if (!cid) return 0
      const tier = cid.split('-').slice(1).join('')
      return CAT_LEVELS[tier] || 0
    }
    function getCatGender(cid: string | null): string | null {
      return cid ? cid.split('-')[0] : null
    }

    const isFriendly = tCatId.indexOf('friendly') !== -1
    let categoryMatch = isFriendly || pCatId === tCatId

    if (!categoryMatch) {
      // Check promotion: player one level below + same gender + top-5 by points
      const tLevel = getCatLevel(tCatId)
      const pLevel = getCatLevel(pCatId)
      const tGender = getCatGender(tCatId)
      const pGender = getCatGender(pCatId)

      if (pLevel === tLevel - 1 && pGender === tGender && pLevel > 0) {
        const { data: top5 } = await db
          .from('players')
          .select('id')
          .eq('category_id', pCatId)
          .order('points', { ascending: false })
          .limit(5)

        const top5Ids = (top5 || []).map((p: any) => p.id)
        if (top5Ids.includes(player.id)) {
          categoryMatch = true
        }
      }
    }

    if (!categoryMatch) {
      await answerCallbackQuery(token, query.id, 'Ваша категория не подходит для этого турнира')
      return
    }
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
      status: 'pending'
    })

  if (regError) {
    console.error('Registration error:', regError)
    await answerCallbackQuery(token, query.id, 'Ошибка регистрации')
    return
  }

  // 8. Answer callback
  await answerCallbackQuery(token, query.id, '✅ Заявка отправлена!')

  // 9. Send confirmation DM
  await sendMessage(
    tgUserId,
    `✅ <b>Заявка на турнир отправлена!</b>\n\n🏆 ${escapeHtml(tournament.title || '')}\n\nСтатус: ожидает подтверждения. Следите за обновлениями на сайте.`
  )
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
