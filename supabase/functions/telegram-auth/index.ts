// ============================================
// KSLT — Telegram Auth
// Supabase Edge Function
// ============================================
// Verifies Telegram Login Widget data (HMAC-SHA-256),
// logs in existing users or registers new ones.
//
// POST { action: 'login', tg_data: {...} }
// POST { action: 'register', tg_data: {...}, email, gender, birth_day, birth_month, birth_year }
//
// Deploy: supabase functions deploy telegram-auth --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Verify Telegram Login Widget data using HMAC-SHA-256
async function verifyTelegramData(
  tgData: Record<string, string>,
  botToken: string
): Promise<boolean> {
  // 1. Create data-check-string (sorted key=value pairs, excluding hash and empty values)
  const checkArr: string[] = []
  for (const key of Object.keys(tgData).sort()) {
    if (key === 'hash') continue
    if (tgData[key] === '' || tgData[key] === undefined || tgData[key] === null) continue
    checkArr.push(`${key}=${tgData[key]}`)
  }
  const dataCheckString = checkArr.join('\n')

  // 2. Secret key = SHA-256(bot_token)
  const encoder = new TextEncoder()
  const secretKeyData = await crypto.subtle.digest('SHA-256', encoder.encode(botToken))
  const secretKey = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // 3. HMAC-SHA-256(data_check_string, secret_key)
  const signature = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString))

  // 4. Compare with hash
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
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!

  if (!botToken) {
    return jsonResponse({ error: 'Bot token not configured' }, 500)
  }

  const db = createClient(supabaseUrl, serviceKey)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const action = body.action as string
  const tgData = body.tg_data as Record<string, string>

  if (!tgData || !tgData.id || !tgData.hash) {
    return jsonResponse({ error: 'Missing Telegram data' }, 400)
  }

  // --- Verify HMAC-SHA-256 ---
  const valid = await verifyTelegramData(tgData, botToken)
  if (!valid) {
    return jsonResponse({ error: 'Invalid Telegram signature' }, 403)
  }

  // --- Check auth_date freshness (max 1 day) ---
  const authDate = parseInt(tgData.auth_date || '0', 10)
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 86400) {
    return jsonResponse({ error: 'Telegram auth data expired' }, 403)
  }

  const telegramId = String(tgData.id)
  const tgFirstName = tgData.first_name || ''
  const tgLastName = tgData.last_name || ''
  const tgUsername = tgData.username || ''
  const tgPhoto = tgData.photo_url || ''
  const tgFullName = (tgFirstName + ' ' + tgLastName).trim()

  // ============================================
  // ACTION: LOGIN
  // ============================================
  if (action === 'login') {
    // Find profile by telegram_chat_id
    const { data: profile } = await db
      .from('profiles')
      .select('id, full_name, role')
      .eq('telegram_chat_id', telegramId)
      .single()

    if (!profile) {
      // New user — return TG data for mini-form
      return jsonResponse({
        status: 'new_user',
        telegram_id: telegramId,
        telegram_name: tgFullName,
        telegram_username: tgUsername,
        telegram_photo: tgPhoto,
      })
    }

    // Existing user — generate magic link
    const { data: linkData, error: linkErr } =
      await db.auth.admin.generateLink({
        type: 'magiclink',
        email: '', // will be filled below
      })

    // We need the user's email to generate a link
    const { data: authUser, error: authUserErr } =
      await db.auth.admin.getUserById(profile.id)

    if (authUserErr || !authUser?.user?.email) {
      return jsonResponse({ error: 'User not found in auth' }, 404)
    }

    const { data: magicLink, error: magicErr } =
      await db.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.user.email,
      })

    if (magicErr || !magicLink?.properties?.hashed_token) {
      return jsonResponse({ error: 'Failed to generate login link' }, 500)
    }

    return jsonResponse({
      status: 'ok',
      hashed_token: magicLink.properties.hashed_token,
      email: authUser.user.email,
    })
  }

  // ============================================
  // ACTION: REGISTER
  // ============================================
  if (action === 'register') {
    const email = (body.email as string || '').trim().toLowerCase()
    const fullName = (body.full_name as string) || ''
    const gender = (body.gender as string) || ''
    const birthDay = body.birth_day as number | null
    const birthMonth = body.birth_month as number | null
    const birthYear = body.birth_year as number | null

    if (!email) {
      return jsonResponse({ error: 'Email is required' }, 400)
    }

    // Check if email already taken
    const { data: existingUsers } = await db.auth.admin.listUsers()
    const emailTaken = existingUsers?.users?.some(
      (u: { email?: string }) => u.email?.toLowerCase() === email
    )
    if (emailTaken) {
      return jsonResponse({ error: 'email_taken' }, 409)
    }

    // Create user with random password
    const randomPassword = crypto.randomUUID() + 'Aa1!'
    const { data: newUser, error: createErr } = await db.auth.admin.createUser({
      email: email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || tgFullName || tgUsername,
        gender: gender,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: birthYear,
        telegram_id: telegramId,
      },
    })

    if (createErr) {
      if (createErr.message?.includes('already')) {
        return jsonResponse({ error: 'email_taken' }, 409)
      }
      return jsonResponse({ error: createErr.message }, 500)
    }

    if (!newUser?.user) {
      return jsonResponse({ error: 'Failed to create user' }, 500)
    }

    // Update profile with telegram_chat_id and avatar
    const updateData: Record<string, unknown> = {
      telegram_chat_id: telegramId,
    }
    if (tgPhoto) {
      updateData.avatar_url = tgPhoto
    }
    if (tgUsername) {
      updateData.telegram_username = tgUsername
    }

    await db
      .from('profiles')
      .update(updateData)
      .eq('id', newUser.user.id)

    // Generate magic link for immediate login
    const { data: magicLink, error: magicErr } =
      await db.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      })

    if (magicErr || !magicLink?.properties?.hashed_token) {
      return jsonResponse({ error: 'User created but login failed' }, 500)
    }

    return jsonResponse({
      status: 'ok',
      hashed_token: magicLink.properties.hashed_token,
      email: email,
    })
  }

  return jsonResponse({ error: 'Invalid action' }, 400)
})
