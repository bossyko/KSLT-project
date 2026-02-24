// ============================================
// KSLT — Membership Expiry Notification (Daily Cron)
// Supabase Edge Function
// ============================================
// Sends Telegram reminder 7 days before membership expires.
// Checks notification_log to prevent duplicates.
//
// Deploy: Supabase Dashboard → Edge Functions → New Function
// Required secrets: TELEGRAM_BOT_TOKEN, CRON_SECRET
//
// pg_cron setup (run in SQL Editor):
//   SELECT cron.schedule(
//     'membership-expiry-notify',
//     '0 4 * * *',  -- 04:00 UTC = 10:00 Bishkek
//     $$
//     SELECT net.http_post(
//       url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/membership-notify',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
//         'Content-Type', 'application/json'
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

Deno.serve(async (req) => {
  // Verify cron secret or service role
  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')
  const expectedAuth = `Bearer ${cronSecret}`

  if (authHeader !== expectedAuth) {
    // Also allow Supabase service role key
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!authHeader.includes(serviceKey)) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Calculate target date: today + 7 days
    const target = new Date()
    target.setDate(target.getDate() + 7)
    const targetDate = target.toISOString().split('T')[0] // YYYY-MM-DD

    // Find active memberships expiring on target date
    // with telegram_chat_id set on the profile
    const { data: memberships, error: memError } = await supabase
      .from('memberships')
      .select('id, profile_id, expires_at, profiles(full_name, telegram_chat_id)')
      .eq('status', 'active')
      .gte('expires_at', targetDate + 'T00:00:00')
      .lt('expires_at', targetDate + 'T23:59:59')

    if (memError) {
      console.error('Query error:', memError)
      return new Response(JSON.stringify({ error: memError.message }), { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No expiring memberships for ' + targetDate }), { status: 200 })
    }

    let sent = 0
    let skipped = 0

    for (const m of memberships) {
      const profile = m.profiles as any
      if (!profile || !profile.telegram_chat_id) {
        skipped++
        continue
      }

      // Check notification_log for duplicates
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('membership_id', m.id)
        .eq('type', 'expiry_7d')
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      // Send Telegram message
      const name = profile.full_name || ''
      const expiresFormatted = m.expires_at ? m.expires_at.split('T')[0] : targetDate
      const text =
        `Здравствуйте${name ? ', ' + name : ''}! Ваше членство KSLT истекает через 7 дней (${expiresFormatted}).\n` +
        `Для продления оплатите 1000 сом/мес.\n` +
        `Подробнее: https://kslt.kg/pages/pricing.html`

      const success = await sendMessage(profile.telegram_chat_id, text)

      if (success) {
        // Log notification
        await supabase.from('notification_log').insert({
          profile_id: m.profile_id,
          membership_id: m.id,
          type: 'expiry_7d'
        })
        sent++
      }
    }

    return new Response(
      JSON.stringify({ sent, skipped, total: memberships.length, targetDate }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Cron error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

async function sendMessage(chatId: number, text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('TG API error:', data)
      return false
    }
    return true
  } catch (err) {
    console.error('TG send error:', err)
    return false
  }
}
