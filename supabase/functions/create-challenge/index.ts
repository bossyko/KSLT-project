// ============================================
// KSLT — Create Challenge Edge Function
// POST { opponent_player_id, proposed_date, proposed_time, court_id?, venue_text?, message? }
// JWT auth + membership check + 3/day limit
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'
const DAILY_LIMIT = 5

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth
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

    // 2. Get sender profile
    const { data: sender } = await db
      .from('profiles')
      .select('id, full_name, player_id, telegram_chat_id, role')
      .eq('id', user.id)
      .single()

    if (!sender) {
      return json({ error: 'Profile not found' }, 400)
    }

    if (!sender.player_id) {
      return json({ error: 'no_player' }, 400)
    }

    // 3. Membership check (admin/manager bypass)
    const isStaff = sender.role === 'admin' || sender.role === 'manager'
    if (!isStaff) {
      const now = new Date().toISOString()
      const { data: membership } = await db
        .from('memberships')
        .select('id')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single()

      if (!membership) {
        return json({ error: 'no_membership' }, 403)
      }
    }

    // 4. Parse body
    const { opponent_player_id, proposed_date, proposed_time, court_id, venue_text, message } = await req.json()

    if (!opponent_player_id || !proposed_date || !proposed_time) {
      return json({ error: 'Missing required fields: opponent_player_id, proposed_date, proposed_time' }, 400)
    }

    // 5. Self-check
    if (sender.player_id === opponent_player_id) {
      return json({ error: 'self_challenge' }, 400)
    }

    // 6. Date validation (must be in the future)
    const proposedDateObj = new Date(proposed_date + 'T' + proposed_time + ':00')
    if (isNaN(proposedDateObj.getTime()) || proposedDateObj <= new Date()) {
      return json({ error: 'invalid_date' }, 400)
    }

    // 7. Daily limit
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count } = await db
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('challenger_id', user.id)
      .gte('created_at', todayStart.toISOString())

    if ((count || 0) >= DAILY_LIMIT) {
      return json({ error: 'daily_limit' }, 429)
    }

    // 8. Duplicate check (active/negotiating/countered to same opponent)
    const { data: existing } = await db
      .from('challenges')
      .select('id')
      .eq('challenger_id', user.id)
      .eq('opponent_player_id', opponent_player_id)
      .in('status', ['active', 'negotiating', 'countered'])
      .limit(1)

    if (existing && existing.length > 0) {
      return json({ error: 'already_pending' }, 409)
    }

    // 9. Opponent player exists
    const { data: opponentPlayer } = await db
      .from('players')
      .select('id, name')
      .eq('id', opponent_player_id)
      .single()

    if (!opponentPlayer) {
      return json({ error: 'Player not found' }, 404)
    }

    // 10. Resolve opponent profile (with telegram)
    const { data: opponentProfile } = await db
      .from('profiles')
      .select('id, telegram_chat_id, full_name')
      .eq('player_id', opponent_player_id)
      .limit(1)
      .single()

    if (!opponentProfile || !opponentProfile.telegram_chat_id) {
      return json({ error: 'no_telegram' }, 400)
    }

    // 11. Venue text
    let venueDisplay = venue_text || ''
    if (court_id) {
      const { data: court } = await db.from('courts').select('name').eq('id', court_id).single()
      if (court) venueDisplay = court.name
    }

    // 12. Insert challenge
    const { data: challenge, error: insertErr } = await db
      .from('challenges')
      .insert({
        challenger_id: user.id,
        challenger_player_id: sender.player_id,
        opponent_player_id: opponent_player_id,
        opponent_profile_id: opponentProfile.id,
        proposed_date: proposed_date,
        proposed_time: proposed_time,
        proposed_venue: venueDisplay || null,
        proposed_court_id: court_id || null,
        message: message ? message.substring(0, 150) : null,
        status: 'active'
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Insert error:', insertErr)
      return json({ error: 'DB error' }, 500)
    }

    // 13. Telegram notification to opponent
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (token && opponentProfile.telegram_chat_id) {
      const senderName = sender.full_name || 'Игрок KSLT'
      const dateFormatted = formatDate(proposed_date)
      const msgParts = [
        `⚔️ <b>Вызов на матч!</b>`,
        ``,
        `${escapeHtml(senderName)} предлагает матч:`,
        `📅 ${dateFormatted}  ⏰ ${proposed_time}${venueDisplay ? '  📍 ' + escapeHtml(venueDisplay) : ''}`,
      ]
      if (message) {
        msgParts.push(`💬 <i>${escapeHtml(message)}</i>`)
      }

      await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: opponentProfile.telegram_chat_id,
          text: msgParts.join('\n'),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Принять', callback_data: `challenge_accept:${challenge.id}` },
              { text: '🔄 Другое время', callback_data: `challenge_counter:${challenge.id}` },
              { text: '❌ Отклонить', callback_data: `challenge_decline:${challenge.id}` }
            ]]
          }
        })
      })
    }

    return json({ success: true, challenge_id: challenge.id })

  } catch (err) {
    console.error('Edge function error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}
