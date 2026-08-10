// ============================================
// KSLT — Verify OTP Code
// Supabase Edge Function
// ============================================
// Verifies a 6-digit OTP code and performs the flow action:
// - forgot_password: update password + magic link for auto-login
// - register: create user + magic link
// - telegram_register: verify HMAC, create user, link TG + magic link
//
// POST { flow, identifier, code, new_password?, email?, password?, full_name?, tg_data?, ... }
//
// Deploy: supabase functions deploy verify-otp --no-verify-jwt
// Required secrets: TELEGRAM_BOT_TOKEN (for telegram_register HMAC verification)

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

/**
 * Телефон одними цифрами в международном виде — тем же правилом, что считает
 * колонка profiles.phone_e164 и функция send-otp. Все трое обязаны совпадать:
 * по этому значению ищется аккаунт.
 */
function phoneToE164(value: string): string {
  const d = value.replace(/[^0-9]/g, '')
  if (!d) return ''
  if (d.length === 9) return '996' + d
  if (d.length === 10 && d[0] === '0') return '996' + d.slice(1)
  return d
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Verify Telegram Login Widget HMAC-SHA-256
async function verifyTelegramData(
  tgData: Record<string, string>,
  botToken: string
): Promise<boolean> {
  const checkArr: string[] = []
  for (const key of Object.keys(tgData).sort()) {
    if (key === 'hash') continue
    if (tgData[key] === '' || tgData[key] === undefined || tgData[key] === null) continue
    checkArr.push(`${key}=${tgData[key]}`)
  }
  const dataCheckString = checkArr.join('\n')

  const encoder = new TextEncoder()
  const secretKeyData = await crypto.subtle.digest('SHA-256', encoder.encode(botToken))
  const secretKey = await crypto.subtle.importKey(
    'raw', secretKeyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString))
  const hashHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex === tgData.hash
}

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
    const identifier = body.identifier as string
    const code = body.code as string

    if (!flow || !identifier || !code) {
      return json({ error: 'Missing required fields' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, serviceKey)

    // --- Find latest unused code for this identifier+flow ---
    const { data: otpRecord, error: otpErr } = await db
      .from('otp_codes')
      .select('*')
      .eq('identifier', identifier)
      .eq('flow', flow)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpErr || !otpRecord) {
      return json({ error: 'code_expired', remaining: 0 }, 400)
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      // Code already invalidated
      await db.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)
      return json({ error: 'code_exhausted', remaining: 0 }, 400)
    }

    // Compare hash
    const inputHash = await sha256(code)

    if (inputHash !== otpRecord.code) {
      // Wrong code — increment attempts
      const newAttempts = otpRecord.attempts + 1
      const remaining = 3 - newAttempts

      if (newAttempts >= 3) {
        await db.from('otp_codes').update({ attempts: newAttempts, used: true }).eq('id', otpRecord.id)
      } else {
        await db.from('otp_codes').update({ attempts: newAttempts }).eq('id', otpRecord.id)
      }

      return json({ error: 'wrong_code', remaining }, 400)
    }

    // --- Code is correct ---
    // For forgot_password without new_password: don't mark used yet (2-step flow)
    const isPartialForgot = flow === 'forgot_password' && !body.new_password
    if (!isPartialForgot) {
      await db.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)
    }

    // ============================================
    // FLOW: FORGOT PASSWORD
    // ============================================
    if (flow === 'forgot_password') {
      const newPassword = body.new_password as string

      if (!newPassword) {
        // Code verified, but password not provided yet (step 1 of 2)
        // Code remains unused so it can be verified again with password
        return json({ verified: true, flow })
      }

      // Password validation
      if (newPassword.length < 8) {
        return json({ error: 'Password too short' }, 400)
      }

      // Find user by email or phone
      let userId: string | null = null

      // Поиск по индексу в profiles. Раньше по почте выкачивался список
      // пользователей и перебирался в памяти — Supabase отдаёт первую
      // страницу в 50 записей, и у всех, кто зарегистрировался позже,
      // сброс пароля падал с «пользователь не найден».
      const lookup = db.from('profiles').select('id')
        .order('created_at', { ascending: false })
        .limit(1)
      const { data: rows } = identifier.includes('@')
        ? await lookup.eq('email', identifier)
        : await lookup.eq('phone_e164', phoneToE164(identifier))
      userId = rows?.[0]?.id || null

      if (!userId) {
        return json({ error: 'User not found' }, 404)
      }

      // Update password
      const { error: updateErr } = await db.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

      if (updateErr) {
        return json({ error: 'Failed to update password' }, 500)
      }

      // Get email for magic link
      const { data: authUser } = await db.auth.admin.getUserById(userId)
      if (!authUser?.user?.email) {
        return json({ error: 'User email not found' }, 500)
      }

      // Generate magic link for auto-login
      const { data: magicLink, error: magicErr } = await db.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.user.email,
      })

      if (magicErr || !magicLink?.properties?.hashed_token) {
        return json({ verified: true, flow, password_updated: true })
      }

      return json({
        verified: true,
        flow,
        password_updated: true,
        hashed_token: magicLink.properties.hashed_token,
        email: authUser.user.email,
      })
    }

    // ============================================
    // FLOW: REGISTER
    // ============================================
    if (flow === 'register') {
      const email = (body.email as string || identifier).trim().toLowerCase()
      const password = body.password as string
      const fullName = body.full_name as string || ''
      const gender = body.gender as string || ''
      const birthDay = body.birth_day as number | null
      const birthMonth = body.birth_month as number | null
      const birthYear = body.birth_year as number | null

      if (!password) {
        return json({ error: 'Password required' }, 400)
      }

      // Create user with confirmed email
      const { data: newUser, error: createErr } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          gender,
          birth_day: birthDay,
          birth_month: birthMonth,
          birth_year: birthYear,
        },
      })

      if (createErr) {
        if (createErr.message?.includes('already')) {
          return json({ error: 'email_taken' }, 409)
        }
        return json({ error: createErr.message }, 500)
      }

      if (!newUser?.user) {
        return json({ error: 'Failed to create user' }, 500)
      }

      // Generate magic link for auto-login
      const { data: magicLink, error: magicErr } = await db.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

      if (magicErr || !magicLink?.properties?.hashed_token) {
        return json({ verified: true, flow, user_created: true })
      }

      return json({
        verified: true,
        flow,
        user_created: true,
        hashed_token: magicLink.properties.hashed_token,
        email,
      })
    }

    // ============================================
    // FLOW: TELEGRAM REGISTER
    // ============================================
    if (flow === 'telegram_register') {
      const tgData = body.tg_data as Record<string, string>
      const email = (body.email as string || '').trim().toLowerCase()
      const fullName = body.full_name as string || ''
      const gender = body.gender as string || ''
      const birthDay = body.birth_day as number | null
      const birthMonth = body.birth_month as number | null
      const birthYear = body.birth_year as number | null

      if (!tgData || !tgData.id || !tgData.hash) {
        return json({ error: 'Missing Telegram data' }, 400)
      }
      if (!email) {
        return json({ error: 'Email required' }, 400)
      }

      // Verify Telegram HMAC
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!
      const valid = await verifyTelegramData(tgData, botToken)
      if (!valid) {
        return json({ error: 'Invalid Telegram signature' }, 403)
      }

      // Check auth_date freshness
      const authDate = parseInt(tgData.auth_date || '0', 10)
      const now = Math.floor(Date.now() / 1000)
      if (now - authDate > 86400) {
        return json({ error: 'Telegram auth data expired' }, 403)
      }

      const telegramId = String(tgData.id)
      const tgFirstName = tgData.first_name || ''
      const tgLastName = tgData.last_name || ''
      const tgUsername = tgData.username || ''
      const tgPhoto = tgData.photo_url || ''
      const tgFullName = (tgFirstName + ' ' + tgLastName).trim()

      // Занятость адреса — тем же поиском по индексу, а не перебором
      // первой страницы списка пользователей
      const { data: takenRows } = await db
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)
      if (takenRows?.length) {
        return json({ error: 'email_taken' }, 409)
      }

      // Create user
      const randomPassword = crypto.randomUUID() + 'Aa1!'
      const { data: newUser, error: createErr } = await db.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || tgFullName || tgUsername,
          gender,
          birth_day: birthDay,
          birth_month: birthMonth,
          birth_year: birthYear,
          telegram_id: telegramId,
        },
      })

      if (createErr) {
        if (createErr.message?.includes('already')) {
          return json({ error: 'email_taken' }, 409)
        }
        return json({ error: createErr.message }, 500)
      }

      if (!newUser?.user) {
        return json({ error: 'Failed to create user' }, 500)
      }

      // Update profile with telegram data
      const updateData: Record<string, unknown> = {
        telegram_chat_id: telegramId,
      }
      if (tgPhoto) updateData.avatar_url = tgPhoto
      if (tgUsername) updateData.telegram_username = tgUsername

      await db.from('profiles').update(updateData).eq('id', newUser.user.id)

      // Generate magic link
      const { data: magicLink, error: magicErr } = await db.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

      if (magicErr || !magicLink?.properties?.hashed_token) {
        return json({ verified: true, flow, user_created: true })
      }

      return json({
        verified: true,
        flow,
        user_created: true,
        hashed_token: magicLink.properties.hashed_token,
        email,
      })
    }

    return json({ error: 'Invalid flow' }, 400)
  } catch (err) {
    console.error('verify-otp error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
