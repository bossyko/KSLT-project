// ============================================
// KSLT — Send Game Invite Edge Function
// POST { receiver_player_id: string }
// JWT auth + membership check + 5/day limit
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'
const DAILY_LIMIT = 30

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth — extract JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // User client (with JWT) for auth check
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // Service client for DB operations
    const db = createClient(supabaseUrl, serviceKey)

    // 2. Get sender profile
    const { data: senderProfile } = await db
      .from('profiles')
      .select('id, full_name, phone, telegram, instagram, player_id, telegram_chat_id, role')
      .eq('id', user.id)
      .single()

    if (!senderProfile) {
      return json({ error: 'Profile not found' }, 400)
    }

    // 3. Check active membership (admin/manager bypass)
    const isAdmin = senderProfile.role === 'admin' || senderProfile.role === 'manager'
    if (!isAdmin) {
      const now = new Date().toISOString()
      const { data: membership } = await db
        .from('memberships')
        .select('id')
        .eq('profile_id', user.id)
        .gte('end_date', now)
        .limit(1)
        .single()

      if (!membership) {
        return json({ error: 'no_membership' }, 403)
      }
    }

    // 4. Parse body
    const { receiver_player_id } = await req.json()
    if (!receiver_player_id) {
      return json({ error: 'receiver_player_id required' }, 400)
    }

    // 5. Prevent self-invite (disabled for testing)
    // if (senderProfile.player_id === receiver_player_id) {
    //   return json({ error: 'self_invite' }, 400)
    // }

    // 6. Daily limit check
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count } = await db
      .from('game_invites')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', todayStart.toISOString())

    if ((count || 0) >= DAILY_LIMIT) {
      return json({ error: 'daily_limit' }, 429)
    }

    // 7. Check duplicate pending invite
    const { data: existing } = await db
      .from('game_invites')
      .select('id')
      .eq('sender_id', user.id)
      .eq('receiver_player_id', receiver_player_id)
      .eq('status', 'pending')
      .limit(1)

    if (existing && existing.length > 0) {
      return json({ error: 'already_pending' }, 409)
    }

    // 8. Get receiver info
    const { data: receiverPlayer } = await db
      .from('players')
      .select('id, name')
      .eq('id', receiver_player_id)
      .single()

    if (!receiverPlayer) {
      return json({ error: 'Player not found' }, 404)
    }

    // Get receiver profile (may not exist)
    const { data: receiverProfile } = await db
      .from('profiles')
      .select('id, telegram_chat_id, full_name, phone, telegram, instagram, notify_preferences')
      .eq('player_id', receiver_player_id)
      .limit(1)
      .single()

    if (!receiverProfile || !receiverProfile.telegram_chat_id) {
      return json({ error: 'no_telegram' }, 400)
    }

    // 9. Insert invite
    const { data: invite, error: insertErr } = await db
      .from('game_invites')
      .insert({
        sender_id: user.id,
        receiver_player_id: receiver_player_id,
        receiver_profile_id: receiverProfile?.id || null,
        status: 'pending'
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Insert error:', insertErr)
      return json({ error: 'DB error' }, 500)
    }

    // 10. Send Telegram to receiver (respect opt-out)
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (token && receiverProfile.telegram_chat_id && shouldNotify(receiverProfile.notify_preferences, 'tg', 'challenges')) {
      const senderName = senderProfile.full_name || 'Игрок KSLT'
      const msgText = `🎾 <b>Приглашение на игру!</b>\n\n${senderName} предлагает вам сыграть в теннис.\n\nПримите приглашение, чтобы обменяться контактами.`

      await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: receiverProfile.telegram_chat_id,
          text: msgText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Принять', callback_data: `invite_accept:${invite.id}` },
              { text: '❌ Отклонить', callback_data: `invite_decline:${invite.id}` }
            ]]
          }
        })
      })
    }

    return json({ success: true, invite_id: invite.id })

  } catch (err) {
    console.error('Edge function error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
