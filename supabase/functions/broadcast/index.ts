// ============================================
// KSLT — Broadcast Edge Function
// ============================================
// Admin-only manual broadcast to users via TG + Email.
//
// POST {
//   subject: "Тема",
//   message: "Текст рассылки",
//   audience: "all" | "members" | "tournament:<id>",
//   channels: { tg: true, email: true }
// }
//
// Auth: JWT (admin only)
//
// Deploy: supabase functions deploy broadcast --no-verify-jwt

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
    const { subject, message, audience, channels } = await req.json()

    if (!subject || !message || !audience) {
      return json({ error: 'Missing subject, message, or audience' }, 400)
    }

    const sendTg = channels?.tg !== false
    const sendEmail = channels?.email !== false

    // 3. Build recipient list
    let profiles: any[] = []

    if (audience === 'all') {
      // All profiles
      const { data } = await db
        .from('profiles')
        .select('id, full_name, telegram_chat_id, email, notify_preferences')
      profiles = data || []

    } else if (audience === 'members') {
      // Active members only
      const { data: memberships } = await db
        .from('memberships')
        .select('profile_id')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())

      if (memberships && memberships.length > 0) {
        const profileIds = [...new Set(memberships.map(m => m.profile_id))]
        const { data } = await db
          .from('profiles')
          .select('id, full_name, telegram_chat_id, email, notify_preferences')
          .in('id', profileIds)
        profiles = data || []
      }

    } else if (audience.startsWith('tournament:')) {
      // Tournament registrants
      const tournamentId = audience.split(':')[1]
      const { data: regs } = await db
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', tournamentId)
        .in('status', ['approved', 'pending'])

      if (regs && regs.length > 0) {
        const playerIds = regs.map(r => r.player_id).filter(Boolean)
        if (playerIds.length > 0) {
          const { data } = await db
            .from('profiles')
            .select('id, full_name, telegram_chat_id, email, notify_preferences')
            .in('player_id', playerIds)
          profiles = data || []
        }
      }

    } else {
      return json({ error: 'Invalid audience' }, 400)
    }

    if (profiles.length === 0) {
      return json({ tg_sent: 0, email_sent: 0, skipped: 0, total: 0 })
    }

    // 4. Send to each recipient
    const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    let tgSent = 0
    let emailSentCount = 0
    let skipped = 0

    for (const p of profiles) {
      let contacted = false

      // TG
      if (sendTg && tgToken && p.telegram_chat_id && shouldNotify(p.notify_preferences, 'tg', 'general')) {
        try {
          const res = await fetch(`${TELEGRAM_API}${tgToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: p.telegram_chat_id,
              text: `📢 <b>${escapeHtml(subject)}</b>\n\n${escapeHtml(message)}`,
              parse_mode: 'HTML'
            })
          })
          const data = await res.json()
          if (data.ok) { tgSent++; contacted = true }
        } catch (e) {
          console.error('TG broadcast error:', e)
        }
      }

      // Email
      if (sendEmail && p.email && shouldNotify(p.notify_preferences, 'email', 'general')) {
        const ok = await callSendEmail(serviceKey, {
          to: p.email,
          subject: `📢 ${subject}`,
          template: 'broadcast',
          data: { subject, message }
        })
        if (ok) { emailSentCount++; contacted = true }
      }

      if (!contacted) skipped++
    }

    return json({
      tg_sent: tgSent,
      email_sent: emailSentCount,
      skipped,
      total: profiles.length
    })

  } catch (err) {
    console.error('broadcast error:', err)
    return json({ error: String(err) }, 500)
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

function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}
