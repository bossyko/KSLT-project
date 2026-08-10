// ============================================
// KSLT — Send OTP Code
// Supabase Edge Function
// ============================================
// Generates a 6-digit code and sends via Telegram bot or email.
// Used for registration, forgot password, and Telegram registration.
//
// POST { flow, identifier, identifier_type, turnstile_token?, telegram_chat_id? }
//
// Deploy: supabase functions deploy send-otp --no-verify-jwt
// Required secrets: TELEGRAM_BOT_TOKEN, TURNSTILE_SECRET_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Normalize identifier
function normalizeIdentifier(value: string, type: string): string {
  if (type === 'email') return value.trim().toLowerCase()
  // phone: strip spaces, dashes, parens — keep + and digits
  return value.replace(/[\s\-()]/g, '')
}

/**
 * Телефон одними цифрами в международном виде — тем же правилом, что считает
 * колонка profiles.phone_e164. Держать их в согласии обязательно: по этому
 * значению идёт поиск аккаунта.
 *
 * Местные номера у нас пишут как «0555123456» или «555123456», у обоих после
 * кода страны девять цифр. Отрезать «последние девять» у всех подряд нельзя:
 * у американского номера после кода страны их десять, и +1 240 974 0690
 * потерял бы первую цифру кода региона.
 */
function phoneToE164(value: string): string {
  const d = value.replace(/[^0-9]/g, '')
  if (!d) return ''
  if (d.length === 9) return '996' + d
  if (d.length === 10 && d[0] === '0') return '996' + d.slice(1)
  return d
}

// SHA-256 hash
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Generate 6-digit code
function generateCode(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1000000).padStart(6, '0')
}

// Verify Turnstile token
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) return true // graceful degradation

  const formData = new URLSearchParams()
  formData.append('secret', secret)
  formData.append('response', token)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })
  const result = await res.json()
  return result.success === true
}

// Send message via Telegram bot
async function sendTelegramOtp(chatId: string, code: string, flow: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')!
  const flowLabel =
    flow === 'forgot_password' ? 'сброса пароля' :
    flow === 'register' ? 'регистрации' : 'регистрации'

  const text =
    `🔐 *Код подтверждения KSLT*\n\n` +
    `Ваш код для ${flowLabel}:\n\n` +
    `\`${code}\`\n\n` +
    `Код действителен 10 минут.\n` +
    `Если вы не запрашивали код — проигнорируйте это сообщение.`

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}

// Send OTP via email (calls send-email Edge Function internally)
async function sendEmailOtp(email: string, code: string, flow: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Ответ send-email раньше не проверялся: письмо могло не уйти вовсе, а
  // человек видел «код отправлен» и ждал его до бесконечности. Наружу
  // причину не отдаём — по ней стало бы видно, есть ли такой аккаунт, —
  // но в лог пишем, иначе разбираться нечем.
  const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      to: email,
      subject: 'Код подтверждения KSLT',
      template: 'otp-code',
      data: { code, flow },
    }),
  })

  const body = await res.text()
  if (!res.ok) {
    console.error(`[send-otp] письмо не ушло на ${email}: ${res.status} ${body}`)
  } else if (body.includes('"sent":false')) {
    console.error(`[send-otp] send-email отказалась отправлять на ${email}: ${body}`)
  } else {
    console.log(`[send-otp] письмо отправлено на ${email}`)
  }
}

// Block duration constants (minutes)
const BLOCK_DURATIONS = [15, 60, 1440] // 15min, 1hr, 24hr
const RATE_LIMIT_WINDOW = 60 // minutes (1 hour)
const RATE_LIMIT_MAX = 5 // requests per window

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json()
    const flow = body.flow as string
    const identifierType = body.identifier_type as string // 'email' | 'phone'
    const rawIdentifier = body.identifier as string
    const turnstileToken = body.turnstile_token as string | undefined
    const telegramChatId = body.telegram_chat_id as string | undefined

    // Validate required fields
    if (!flow || !['forgot_password', 'register', 'telegram_register'].includes(flow)) {
      return json({ error: 'Invalid flow' }, 400)
    }
    if (!identifierType || !['email', 'phone'].includes(identifierType)) {
      return json({ error: 'Invalid identifier_type' }, 400)
    }
    if (!rawIdentifier) {
      return json({ error: 'Missing identifier' }, 400)
    }

    const identifier = normalizeIdentifier(rawIdentifier, identifierType)

    // Turnstile verification for web forgot_password
    if (flow === 'forgot_password' && turnstileToken) {
      const turnstileOk = await verifyTurnstile(turnstileToken)
      if (!turnstileOk) {
        return json({ error: 'captcha_failed' }, 400)
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, serviceKey)

    // Get client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('cf-connecting-ip') || 'unknown'
    const blockKey = `${identifier}:${ip}`

    // --- Check progressive blocking ---
    const { data: block } = await db
      .from('otp_blocks')
      .select('*')
      .eq('block_key', blockKey)
      .single()

    if (block && block.blocked_until && !block.admin_unblocked) {
      const blockedUntil = new Date(block.blocked_until)
      if (blockedUntil > new Date()) {
        // Still blocked — but always respond with "sent" (anti-enumeration)
        return json({ sent: true, channel: 'email' })
      }
    }

    // --- Rate limiting: count requests in window ---
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 60 * 1000).toISOString()

    const { count } = await db
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .gte('created_at', windowStart)

    const requestCount = (count || 0) + 1

    if (requestCount > RATE_LIMIT_MAX) {
      // Escalate blocking
      const escalation = block ? Math.min((block.escalation || 0) + 1, 2) : 0
      const blockMinutes = BLOCK_DURATIONS[escalation]
      const blockedUntil = new Date(Date.now() + blockMinutes * 60 * 1000).toISOString()

      await db.from('otp_blocks').upsert({
        block_key: blockKey,
        request_count: requestCount,
        blocked_until: blockedUntil,
        escalation,
        admin_unblocked: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'block_key' })

      // Anti-enumeration: always respond with "sent"
      return json({ sent: true, channel: 'email' })
    }

    // Update request count (no block yet)
    if (block) {
      await db.from('otp_blocks').update({
        request_count: requestCount,
        updated_at: new Date().toISOString(),
      }).eq('block_key', blockKey)
    }

    // --- Determine delivery channel ---
    let channel: 'telegram' | 'email' = 'email'
    let deliveryChatId: string | null = null
    let deliveryEmail: string | null = null

    if (flow === 'telegram_register' && telegramChatId) {
      // TG registration: send code to Telegram
      channel = 'telegram'
      deliveryChatId = telegramChatId
    } else if (flow === 'forgot_password') {
      // Восстановление доступа начинается с поиска аккаунта. Раньше здесь
      // выкачивался список пользователей и перебирался в памяти — Supabase
      // отдаёт первую страницу в 50 записей, то есть полсотни самых старых
      // аккаунтов из трёхсот. Теперь один поиск по индексу в profiles.
      const query = db.from('profiles').select('id, telegram_chat_id')
        .order('created_at', { ascending: false })
        .limit(1)
      const { data: rows } = identifierType === 'phone'
        ? await query.eq('phone_e164', phoneToE164(identifier))
        : await query.eq('email', identifier)
      const profile = rows?.[0] || null

      if (!profile) {
        // Аккаунта нет — код не создаём и письма не шлём. Иначе форма
        // «Забыли пароль?» превращается в способ рассылать письма с нашего
        // домена на любой адрес, и почту клуба начнут считать спамом.
        // Ответ при этом обычный: по нему нельзя узнать, есть ли аккаунт.
        return json({ sent: true, channel: 'email' })
      }

      if (profile.telegram_chat_id) {
        channel = 'telegram'
        deliveryChatId = profile.telegram_chat_id
      } else if (identifierType === 'email') {
        channel = 'email'
        deliveryEmail = identifier
      } else {
        // Искали по телефону, Телеграма нет — код уходит на почту аккаунта
        const { data: authUser } = await db.auth.admin.getUserById(profile.id)
        if (authUser?.user?.email) {
          channel = 'email'
          deliveryEmail = authUser.user.email
        } else {
          return json({ sent: true, channel: 'email' })   // доставить нечем
        }
      }
    } else if (identifierType === 'email') {
      // Регистрация: аккаунта ещё нет, адрес берём из формы
      channel = 'email'
      deliveryEmail = identifier
    }

    // --- Generate code ---
    const code = generateCode()
    const hashedCode = await sha256(code)

    // Invalidate old codes for this identifier+flow
    await db
      .from('otp_codes')
      .update({ used: true })
      .eq('identifier', identifier)
      .eq('flow', flow)
      .eq('used', false)

    // Save new code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await db.from('otp_codes').insert({
      identifier,
      code: hashedCode,
      flow,
      channel,
      attempts: 0,
      used: false,
      expires_at: expiresAt,
      ip,
    })

    // --- Send code ---
    if (channel === 'telegram' && deliveryChatId) {
      await sendTelegramOtp(deliveryChatId, code, flow)
    } else if (deliveryEmail) {
      await sendEmailOtp(deliveryEmail, code, flow)
    }
    // If neither — user doesn't exist, but we don't reveal that

    return json({ sent: true, channel })
  } catch (err) {
    console.error('send-otp error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
