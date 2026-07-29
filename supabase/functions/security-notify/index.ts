// ============================================
// KSLT — Security Notification
// Supabase Edge Function
// ============================================
// Sends email + Telegram notification when user changes password.
// Called from dashboard.js after successful password update.
//
// Deploy: supabase functions deploy security-notify --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: verify JWT from user session
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const eventType = body.event_type // 'password_changed' | 'new_device_login'

    if (!eventType) {
      return new Response(JSON.stringify({ error: 'Missing event_type' }), { status: 400, headers: corsHeaders })
    }

    // Load profile with service role (to get telegram_chat_id)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, email, telegram_chat_id, notify_preferences')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: corsHeaders })
    }

    const name = profile.full_name || ''
    let tgSent = false
    let emailSent = false

    // Build message based on event type
    let ruMsg = ''
    let enMsg = ''
    let emailSubject = ''

    if (eventType === 'password_changed') {
      ruMsg = `${name ? name + ', в' : 'В'}аш пароль KSLT был изменён.\nЕсли это были не вы — срочно свяжитесь с поддержкой.`
      enMsg = `${name ? name + ', y' : 'Y'}our KSLT password has been changed.\nIf this wasn't you — contact support immediately.`
      emailSubject = 'KSLT — Пароль изменён / Password changed'
    } else if (eventType === 'new_device_login') {
      const ua = body.metadata?.user_agent || 'Unknown'
      ruMsg = `${name ? name + ', в' : 'В'} ваш аккаунт KSLT вошли с нового устройства.\nУстройство: ${ua}\nЕсли это не вы — смените пароль.`
      enMsg = `${name ? name + ', s' : 'S'}omeone logged into your KSLT account from a new device.\nDevice: ${ua}\nIf this wasn't you — change your password immediately.`
      emailSubject = 'KSLT — Вход с нового устройства / New device login'
    }

    // Send Telegram
    if (profile.telegram_chat_id && shouldNotify(profile.notify_preferences, 'tg', 'security')) {
      tgSent = await sendTelegram(profile.telegram_chat_id, ruMsg)
    }

    // Send Email
    if (profile.email && shouldNotify(profile.notify_preferences, 'email', 'security')) {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      emailSent = await callSendEmail(serviceKey, {
        to: profile.email,
        subject: emailSubject,
        template: 'security-alert',
        data: { name, event: eventType, message_ru: ruMsg, message_en: enMsg }
      })
    }

    return new Response(
      JSON.stringify({ ok: true, tg_sent: tgSent, email_sent: emailSent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('security-notify error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
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

async function sendTelegram(chatId: number, text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) return false

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}
