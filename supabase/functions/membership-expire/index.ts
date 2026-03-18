// ============================================
// KSLT — Auto-Expire Memberships
// Supabase Edge Function (called by pg_cron)
// ============================================
// Runs daily. Finds memberships where status='active' AND expires_at < now(),
// sets status='expired', sends Telegram notification.
//
// Deploy: supabase functions deploy membership-expire --no-verify-jwt
// Secrets: TELEGRAM_BOT_TOKEN, CRON_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Auth: CRON_SECRET only ---
  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const db = createClient(supabaseUrl, serviceKey)
  const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

  try {
    const now = new Date().toISOString()

    // Find active memberships that have expired
    const { data: expired, error } = await db
      .from('memberships')
      .select('id, profile_id, expires_at, profiles(full_name, telegram_chat_id, email, notify_preferences)')
      .eq('status', 'active')
      .lt('expires_at', now)

    if (error) {
      console.error('Query error:', error)
      return json({ error: error.message }, 500)
    }

    if (!expired || expired.length === 0) {
      return json({ ok: true, expired: 0 })
    }

    let expiredCount = 0

    for (const m of expired) {
      // Set status to expired
      const { error: upErr } = await db
        .from('memberships')
        .update({ status: 'expired' })
        .eq('id', m.id)

      if (upErr) {
        console.error(`Expire ${m.id} error:`, upErr)
        continue
      }

      expiredCount++
      console.log(`Auto-expired membership: ${m.id} (profile: ${m.profile_id})`)

      // Send Telegram notification
      const profile = m.profiles as any
      const name = profile?.full_name || ''
      if (tgToken && profile?.telegram_chat_id && shouldNotify(profile?.notify_preferences, 'tg', 'membership')) {
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: profile.telegram_chat_id,
          text: `${name ? name + ', в' : 'В'}аше членство KSLT истекло.\n\nДля продления используйте /membership или оплатите на сайте:\nhttps://kslt.netlify.app/pages/pricing.html`,
          parse_mode: 'HTML'
        })
      }

      // Send email notification
      if (profile?.email && shouldNotify(profile?.notify_preferences, 'email', 'membership')) {
        await callSendEmail(serviceKey, {
          to: profile.email,
          subject: '❌ Членство KSLT истекло',
          template: 'membership-expired',
          data: { name }
        })
      }

      // Log to notification_log
      await db.from('notification_log').insert({
        profile_id: m.profile_id,
        membership_id: m.id,
        type: 'expired'
      })
    }

    return json({ ok: true, expired: expiredCount })

  } catch (err) {
    console.error('Membership-expire error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

// ---- Helpers ----
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

async function tgFetch(token: string, method: string, body: Record<string, unknown>) {
  try {
    await fetch(`${TELEGRAM_API}${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch (e) {
    console.error(`TG ${method} error:`, e)
  }
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
