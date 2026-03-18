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
      .select('full_name, telegram_chat_id')
      .eq('id', profile_id)
      .single()

    if (!profile || !profile.telegram_chat_id) {
      return json({ ok: true, sent: false, reason: 'no_telegram' })
    }

    // 5. Build message
    const name = profile.full_name || ''
    let text = ''

    if (action === 'granted') {
      const expDate = expires_at ? formatDate(expires_at) : ''
      text = `${name ? name + ', в' : 'В'}ам выдано членство KSLT!`
      if (expDate) text += `\nДействует до: ${expDate}`
      text += '\n\nДобро пожаловать! 🎾'
    } else if (action === 'extended') {
      const expDate = expires_at ? formatDate(expires_at) : ''
      text = `${name ? name + ', в' : 'В'}аше членство KSLT продлено!`
      if (expDate) text += `\nНовая дата окончания: ${expDate}`
    } else if (action === 'cancelled') {
      text = `${name ? name + ', в' : 'В'}аше членство KSLT отменено.\n\nДля продления: /membership`
    }

    // 6. Send TG
    const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!tgToken) {
      return json({ ok: true, sent: false, reason: 'no_token' })
    }

    await tgFetch(tgToken, 'sendMessage', {
      chat_id: profile.telegram_chat_id,
      text,
      parse_mode: 'HTML'
    })

    return json({ ok: true, sent: true })

  } catch (err) {
    console.error('membership-tg-notify error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

// ---- Helpers ----
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
