// ============================================
// KSLT — Telegram Webhook Handler
// Supabase Edge Function
// ============================================
// Handles /start command with deep link parameter (profile UUID)
// Saves telegram chat_id to profiles table
//
// Deploy: Supabase Dashboard → Edge Functions → New Function
// Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>
// Required secret: TELEGRAM_BOT_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

Deno.serve(async (req) => {
  try {
    const body = await req.json()
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

      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: chatId })
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

    // Handle plain /start (no deep link)
    if (text === '/start') {
      await sendMessage(
        chatId,
        'Welcome to KSLT Tennis Bot! 🎾\n\nTo connect your account, use the "Connect Telegram" button in your KSLT dashboard:\nhttps://kslt.kg/pages/dashboard.html'
      )
      return new Response('ok', { status: 200 })
    }

    // Unknown command
    await sendMessage(chatId, 'Use /start to begin, or connect via your KSLT dashboard.')

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('ok', { status: 200 })
  }
})

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
