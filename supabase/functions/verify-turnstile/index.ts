// ============================================
// KSLT — Cloudflare Turnstile Verification
// Supabase Edge Function
// ============================================
// Verifies Turnstile CAPTCHA token server-side.
// Called from auth.js before login/signup.
//
// Deploy: supabase functions deploy verify-turnstile --no-verify-jwt
// Required secret: TURNSTILE_SECRET_KEY

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
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secret) {
      console.error('TURNSTILE_SECRET_KEY not configured')
      // Allow through if not configured (graceful degradation)
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = new URLSearchParams()
    formData.append('secret', secret)
    formData.append('response', token)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    const result = await res.json()

    return new Response(
      JSON.stringify({ success: result.success === true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('verify-turnstile error:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
