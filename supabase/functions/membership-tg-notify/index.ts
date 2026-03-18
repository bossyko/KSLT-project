// ============================================
// KSLT — Membership TG Notify (Admin Actions)
// Supabase Edge Function
// ============================================
// Sends Telegram notification when admin grants/extends/cancels membership.
// Called from admin panel (users.js).
//
// POST { action: 'granted'|'extended'|'cancelled', profile_id, expires_at? }
// Auth: JWT (admin/manager)
//
// Deploy: supabase functions deploy membership-tg-notify --no-verify-jwt
// Secrets: TELEGRAM_BOT_TOKEN

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
    // 1. JWT Auth
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

    // 2. Check caller is staff
    const db = createClient(supabaseUrl, serviceKey)

    const { data: caller } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!caller || (caller.role !== 'admin' && caller.role !== 'manager')) {
      return json({ error: 'Forbidden' }, 403)
    }

    // 3. Parse body
    const { action, profile_id, expires_at } = await req.json()

    if (!action || !profile_id) {
      return json({ error: 'Missing action or profile_id' }, 400)
    }

    if (!['granted', 'extended', 'cancelled'].includes(action)) {
      return json({ error: 'Invalid action' }, 400)
    }

    // 4. Get target profile
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, telegram_chat_id, email, notify_preferences')
      .eq('id', profile_id)
      .single()

    if (!profile) {
      return json({ ok: true, sent: false, reason: 'no_profile' })
    }

    // 5. Build message
    const name = profile.full_name || ''
    const expDate = expires_at ? formatDate(expires_at) : ''
    let text = ''

    if (action === 'granted') {
      text = `${name ? name + ', в' : 'В'}ам выдано членство KSLT!`
      if (expDate) text += `\nДействует до: ${expDate}`
      text += '\n\nДобро пожаловать! 🎾'
    } else if (action === 'extended') {
      text = `${name ? name + ', в' : 'В'}аше членство KSLT продлено!`
      if (expDate) text += `\nНовая дата окончания: ${expDate}`
    } else if (action === 'cancelled') {
      text = `${name ? name + ', в' : 'В'}аше членство KSLT отменено.\n\nДля продления: /membership`
    }

    let tgSent = false
    let emailSent = false

    // 6. Send TG (independent of email)
    const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (tgToken && profile.telegram_chat_id && shouldNotify(profile.notify_preferences, 'tg', 'membership')) {
      await tgFetch(tgToken, 'sendMessage', {
        chat_id: profile.telegram_chat_id,
        text,
        parse_mode: 'HTML'
      })
      tgSent = true
    }

    // 7. Send email (independent of TG)
    if (profile.email && shouldNotify(profile.notify_preferences, 'email', 'membership')) {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const emailAction = action === 'cancelled' ? action : (action === 'granted' ? 'granted' : 'extended')
      emailSent = await callSendEmail(serviceKey, {
        to: profile.email,
        subject: action === 'cancelled'
          ? '❌ Членство KSLT отменено'
          : `✅ Членство KSLT ${action === 'granted' ? 'выдано' : 'продлено'}`,
        template: 'membership-approved',
        data: { name, action: emailAction, expires_at: expDate }
      })
    }

    return json({ ok: true, tg_sent: tgSent, email_sent: emailSent })

  } catch (err) {
    console.error('membership-tg-notify error:', err)
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

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return isoStr
  }
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
