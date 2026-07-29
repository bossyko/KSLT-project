// ============================================
// KSLT — Server-side Rate Limiter
// Supabase Edge Function
// ============================================
// Checks rate limits by key (email + IP).
// Stores attempts in rate_limits table.
// Called from auth.js before signInWithPassword.
//
// Deploy: supabase functions deploy rate-limit --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Config: max attempts per window
const LIMITS: Record<string, { max: number; windowSec: number }> = {
  login:          { max: 5,  windowSec: 300 },   // 5 per 5 min
  password_reset: { max: 3,  windowSec: 600 },   // 3 per 10 min
  password_change:{ max: 3,  windowSec: 300 },   // 3 per 5 min
  signup:         { max: 3,  windowSec: 600 },   // 3 per 10 min
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const action = body.action as string   // 'login' | 'password_reset' | 'signup' | 'password_change'
    const key = body.key as string         // email or identifier

    if (!action || !key) {
      return json({ allowed: false, error: 'Missing action or key' }, 400)
    }

    const config = LIMITS[action]
    if (!config) {
      return json({ allowed: true }) // unknown action = allow
    }

    // Get client IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown'

    const limitKey = `${action}:${key}:${ip}`

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const windowStart = new Date(Date.now() - config.windowSec * 1000).toISOString()

    // Count recent attempts
    const { count } = await serviceClient
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('limit_key', limitKey)
      .gte('created_at', windowStart)

    if ((count || 0) >= config.max) {
      // Calculate retry-after
      const { data: oldest } = await serviceClient
        .from('rate_limits')
        .select('created_at')
        .eq('limit_key', limitKey)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      const retryAfter = oldest
        ? Math.ceil((new Date(oldest.created_at).getTime() + config.windowSec * 1000 - Date.now()) / 1000)
        : config.windowSec

      return json({ allowed: false, retry_after: Math.max(retryAfter, 1) })
    }

    // Record attempt
    await serviceClient
      .from('rate_limits')
      .insert({ limit_key: limitKey, action, ip })

    return json({ allowed: true, remaining: config.max - (count || 0) - 1 })
  } catch (err) {
    console.error('rate-limit error:', err)
    // On error, allow through (fail open)
    return json({ allowed: true })
  }
})

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
