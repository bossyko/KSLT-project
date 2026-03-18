// ============================================
// KSLT — Auto-Unban Expired Player Bans
// Supabase Edge Function (called by pg_cron)
// ============================================
// Runs daily. Finds players where banned_until < now(),
// clears ban fields, sends Telegram notification.
//
// Deploy: supabase functions deploy auto-unban --no-verify-jwt
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
    // Find players with expired bans (banned_until < now, not permanent)
    const now = new Date().toISOString()
    const { data: expired, error } = await db
      .from('players')
      .select('id, name, banned_until, ban_reason')
      .not('banned_until', 'is', null)
      .lt('banned_until', now)
      .lt('banned_until', '2099-01-01') // skip permanent bans

    if (error) {
      console.error('Query error:', error)
      return json({ error: error.message }, 500)
    }

    if (!expired || expired.length === 0) {
      return json({ ok: true, unbanned: 0 })
    }

    let unbannedCount = 0

    for (const player of expired) {
      // Clear ban fields
      const { error: upErr } = await db
        .from('players')
        .update({ banned_until: null, ban_reason: null })
        .eq('id', player.id)

      if (upErr) {
        console.error(`Unban ${player.id} error:`, upErr)
        continue
      }

      unbannedCount++
      console.log(`Auto-unbanned: ${player.name} (${player.id})`)

      // Send Telegram notification
      if (tgToken) {
        const { data: profile } = await db
          .from('profiles')
          .select('telegram_chat_id')
          .eq('player_id', player.id)
          .limit(1)
          .maybeSingle()

        if (profile?.telegram_chat_id) {
          await tgFetch(tgToken, 'sendMessage', {
            chat_id: profile.telegram_chat_id,
            text: '✅ Срок вашей блокировки истёк. Вы разблокированы!\n\nДобро пожаловать обратно в KSLT!',
            parse_mode: 'HTML'
          })
        }
      }
    }

    return json({ ok: true, unbanned: unbannedCount })

  } catch (err) {
    console.error('Auto-unban error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

// ---- Helpers ----
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
