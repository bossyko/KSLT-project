// ============================================
// KSLT — Send Push Notification Edge Function
// ============================================
// Admin-only: sends push notifications via FCM + inserts into notification_log.
//
// POST {
//   title: "...",
//   message: "...",
//   type: "system"|"tournament"|"match"|"battle",
//   audience: "all"|"members"|"user",
//   user_id?: "uuid" (required when audience="user")
// }
//
// Returns: { total, notified, fcm_sent }
//
// Env vars (Supabase Secrets): FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
// Deploy: supabase functions deploy send-push --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return json('ok', 200)
  }

  try {
    // 1. JWT Auth — admin only
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = createClient(supabaseUrl, serviceKey)

    const { data: caller } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!caller || caller.role !== 'admin') {
      return json({ error: 'Forbidden: admin only' }, 403)
    }

    // 2. Parse body
    const { title, message, type, audience, user_id } = await req.json()

    if (!title || !message || !audience) {
      return json({ error: 'Missing title, message, or audience' }, 400)
    }

    if (audience === 'user' && !user_id) {
      return json({ error: 'Missing user_id for audience=user' }, 400)
    }

    // 3. Build recipient list
    let profiles: any[] = []

    if (audience === 'all') {
      const { data } = await db
        .from('profiles')
        .select('id, fcm_token')
      profiles = data || []

    } else if (audience === 'members') {
      const { data: memberships } = await db
        .from('memberships')
        .select('profile_id')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())

      if (memberships && memberships.length > 0) {
        const profileIds = [...new Set(memberships.map(m => m.profile_id))]
        const { data } = await db
          .from('profiles')
          .select('id, fcm_token')
          .in('id', profileIds)
        profiles = data || []
      }

    } else if (audience === 'user') {
      const { data } = await db
        .from('profiles')
        .select('id, fcm_token')
        .eq('id', user_id)
      profiles = data || []

    } else {
      return json({ error: 'Invalid audience' }, 400)
    }

    // Переключатели в настройках кабинета до сих пор управляли только
    // Telegram и почтой: колокольчик показывал всё подряд, и отключить,
    // например, чужие баттлы было нечем. Рассылка «всем» и «членам» теперь
    // уважает канал «сайт»; адресную одному человеку — нет, она личная
    const CAT: Record<string, string> = {
      tournament: 'tournaments', match: 'matches', battle: 'challenges'
    }
    const cat = CAT[type || 'system']
    if (cat && audience !== 'user' && profiles.length > 0) {
      const ids = profiles.map(p => p.id)
      const { data: prefs } = await db
        .from('profiles')
        .select('id, notify_preferences')
        .in('id', ids)
      const off = new Set(
        (prefs || [])
          .filter(p => p.notify_preferences?.site?.[cat] === false)
          .map(p => p.id)
      )
      if (off.size > 0) profiles = profiles.filter(p => !off.has(p.id))
    }

    if (profiles.length === 0) {
      return json({ total: 0, notified: 0, fcm_sent: 0 })
    }

    // 4. Запись в журнал заводим первой: её идентификатор проставляется
    // каждому уведомлению, и по нему рассылку можно отозвать — убрать
    // сообщение у всех, кому оно ушло
    const { data: logRow } = await db
      .from('push_log')
      .insert({
        admin_id: user.id,
        title,
        message,
        type: type || 'system',
        audience,
        recipients_count: profiles.length,
        fcm_sent: 0
      })
      .select('id')
      .single()

    const pushId = logRow?.id ?? null

    // 5. Insert notification_log for each recipient
    const notifRows = profiles.map(p => ({
      profile_id: p.id,
      type: type || 'system',
      title,
      message,
      is_read: false,
      push_id: pushId
    }))

    await db.from('notification_log').insert(notifRows)

    // 6. Send FCM push to recipients with fcm_token
    let fcmSent = 0
    const fcmProjectId = Deno.env.get('FCM_PROJECT_ID')
    const fcmClientEmail = Deno.env.get('FCM_CLIENT_EMAIL')
    const fcmPrivateKey = Deno.env.get('FCM_PRIVATE_KEY')

    if (fcmProjectId && fcmClientEmail && fcmPrivateKey) {
      const accessToken = await getGoogleAccessToken(fcmClientEmail, fcmPrivateKey)

      if (accessToken) {
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`

        for (const p of profiles) {
          if (!p.fcm_token) continue

          try {
            const res = await fetch(fcmUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: {
                  token: p.fcm_token,
                  notification: { title, body: message },
                  data: { type: type || 'system' }
                }
              })
            })

            if (res.ok) {
              fcmSent++
            } else {
              const errData = await res.text()
              console.error('FCM error for', p.id, ':', errData)
            }
          } catch (e) {
            console.error('FCM send error:', e)
          }
        }
      }
    }

    // Сколько ушло пушем — известно только сейчас, дописываем в журнал
    if (pushId) {
      await db.from('push_log').update({ fcm_sent: fcmSent }).eq('id', pushId)
    }

    return json({
      total: profiles.length,
      notified: profiles.length,
      fcm_sent: fcmSent
    })

  } catch (err) {
    console.error('send-push error:', err)
    return json({ error: String(err) }, 500)
  }
})

// ---- Google OAuth2 JWT for FCM ----

async function getGoogleAccessToken(clientEmail: string, privateKeyPem: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    }

    const encodedHeader = base64url(JSON.stringify(header))
    const encodedPayload = base64url(JSON.stringify(payload))
    const unsignedToken = encodedHeader + '.' + encodedPayload

    // Import private key and sign
    const keyData = pemToArrayBuffer(privateKeyPem)
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    )

    const jwt = unsignedToken + '.' + base64url(signature)

    // Exchange JWT for access token
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    const data = await res.json()
    return data.access_token || null
  } catch (e) {
    console.error('Google OAuth error:', e)
    return null
  }
}

function base64url(input: string | ArrayBuffer): string {
  let bytes: Uint8Array
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input)
  } else {
    bytes = new Uint8Array(input)
  }
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const lines = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '')
  const binary = atob(lines)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}
