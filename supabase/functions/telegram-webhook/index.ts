// ============================================
// KSLT — Telegram Webhook Handler
// Supabase Edge Function
// ============================================
// Handles:
// 1. /start command with deep link parameter (profile UUID)
// 2. callback_query for game invite accept/decline
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

// ---- Game Invite Callback Handler ----
async function handleCallbackQuery(query: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } }) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) return

  const data = query.data || ''
  const chatId = query.message?.chat?.id
  const messageId = query.message?.message_id

  // Parse: "invite_accept:UUID" or "invite_decline:UUID"
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
