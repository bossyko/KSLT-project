// ============================================
// KSLT — Admin Manage User Edge Function
// Operations: create_manager, delete_user, ban_user, unban_user, ban_player, unban_player
// JWT auth + staff role check (admin / manager)
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_API = 'https://api.telegram.org/bot'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return json({ ok: true }, 200)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = createClient(supabaseUrl, serviceKey)

    // Check caller role (admin or manager)
    const { data: callerProfile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const callerRole = callerProfile?.role
    if (!callerRole || (callerRole !== 'admin' && callerRole !== 'manager')) {
      return json({ error: 'Forbidden: staff only' }, 403)
    }

    const body = await req.json()
    const { action } = body

    // ---- CREATE MANAGER ---- (admin only)
    if (action === 'create_manager') {
      if (callerRole !== 'admin') {
        return json({ error: 'Forbidden: admin only' }, 403)
      }
      const { email, first_name, last_name } = body
      if (!email) return json({ error: 'email required' }, 400)

      // Check if user already exists
      const { data: existingProfile } = await db
        .from('profiles')
        .select('id, role, email')
        .eq('email', email)
        .single()

      if (existingProfile) {
        // User exists — just update role
        await db
          .from('profiles')
          .update({ role: 'manager' })
          .eq('id', existingProfile.id)

        return json({ success: true, action: 'role_updated', user_id: existingProfile.id })
      }

      // User doesn't exist — invite via Supabase Auth
      const { data: inviteData, error: inviteErr } = await db.auth.admin.inviteUserByEmail(email)

      if (inviteErr) {
        console.error('Invite error:', inviteErr)
        return json({ error: inviteErr.message }, 500)
      }

      const newUserId = inviteData.user.id
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0]

      // Create profile with manager role
      await db
        .from('profiles')
        .upsert({
          id: newUserId,
          email: email,
          full_name: fullName,
          role: 'manager'
        })

      return json({ success: true, action: 'invited', user_id: newUserId })
    }

    // ---- BAN USER ----
    if (action === 'ban_user') {
      const { user_id, duration, reason } = body
      if (!user_id) return json({ error: 'user_id required' }, 400)
      if (!duration) return json({ error: 'duration required' }, 400)

      // Cannot ban self
      if (user_id === user.id) {
        return json({ error: 'Cannot ban yourself' }, 400)
      }

      // Cannot ban another admin
      const { data: targetProfile } = await db
        .from('profiles')
        .select('role, telegram_chat_id')
        .eq('id', user_id)
        .single()

      if (!targetProfile) return json({ error: 'User not found' }, 404)
      if (targetProfile.role === 'admin') {
        return json({ error: 'Cannot ban admin' }, 403)
      }
      // Manager can only ban regular users (not other managers/admins)
      if (callerRole === 'manager' && targetProfile.role !== 'user') {
        return json({ error: 'Managers can only ban regular users' }, 403)
      }

      // Calculate banned_until
      const durationMap: Record<string, number> = {
        '1d': 1, '3d': 3, '7d': 7, '30d': 30
      }
      let bannedUntil: string
      if (duration === 'permanent') {
        bannedUntil = '2099-12-31T23:59:59.000Z'
      } else {
        const days = durationMap[duration]
        if (!days) return json({ error: 'Invalid duration' }, 400)
        const dt = new Date()
        dt.setDate(dt.getDate() + days)
        bannedUntil = dt.toISOString()
      }

      // Update profile
      await db
        .from('profiles')
        .update({
          banned_until: bannedUntil,
          ban_reason: reason || null
        })
        .eq('id', user_id)

      // Ban in Supabase Auth (blocks login)
      const banDuration = duration === 'permanent' ? '876000h' : (durationMap[duration] * 24) + 'h'
      await db.auth.admin.updateUserById(user_id, { ban_duration: banDuration })

      // Telegram: restrict + notify
      const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')
      const tgChatId = targetProfile.telegram_chat_id

      if (tgToken && tgChatId) {
        // Restrict in group (read-only)
        if (groupChatId) {
          await tgFetch(tgToken, 'restrictChatMember', {
            chat_id: groupChatId,
            user_id: tgChatId,
            permissions: {
              can_send_messages: false,
              can_send_media_messages: false,
              can_send_polls: false,
              can_send_other_messages: false,
              can_add_web_page_previews: false,
              can_change_info: false,
              can_invite_users: false,
              can_pin_messages: false
            }
          })
        }

        // DM notification
        const banDateStr = duration === 'permanent'
          ? 'навсегда'
          : new Date(bannedUntil).toLocaleDateString('ru-RU')
        const reasonText = reason ? '\nПричина: ' + reason : ''
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: tgChatId,
          text: `⛔ Вы заблокированы до: ${banDateStr}${reasonText}`,
          parse_mode: 'HTML'
        })
      }

      return json({ success: true, action: 'banned', banned_until: bannedUntil })
    }

    // ---- UNBAN USER ----
    if (action === 'unban_user') {
      const { user_id } = body
      if (!user_id) return json({ error: 'user_id required' }, 400)

      const { data: targetProfile } = await db
        .from('profiles')
        .select('role, telegram_chat_id')
        .eq('id', user_id)
        .single()

      // Manager can only unban regular users
      if (callerRole === 'manager' && targetProfile && targetProfile.role !== 'user') {
        return json({ error: 'Managers can only unban regular users' }, 403)
      }

      // Clear ban in profile
      await db
        .from('profiles')
        .update({
          banned_until: null,
          ban_reason: null
        })
        .eq('id', user_id)

      // Unban in Supabase Auth
      await db.auth.admin.updateUserById(user_id, { ban_duration: 'none' })

      // Telegram: restore + notify
      const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')
      const tgChatId = targetProfile?.telegram_chat_id

      if (tgToken && tgChatId) {
        // Restore permissions in group
        if (groupChatId) {
          await tgFetch(tgToken, 'restrictChatMember', {
            chat_id: groupChatId,
            user_id: tgChatId,
            permissions: {
              can_send_messages: true,
              can_send_media_messages: true,
              can_send_polls: true,
              can_send_other_messages: true,
              can_add_web_page_previews: true,
              can_change_info: false,
              can_invite_users: true,
              can_pin_messages: false
            }
          })
        }

        // DM notification
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: tgChatId,
          text: '✅ Вы разблокированы. Добро пожаловать обратно!',
          parse_mode: 'HTML'
        })
      }

      return json({ success: true, action: 'unbanned' })
    }

    // ---- DELETE USER ----
    if (action === 'delete_user') {
      const { user_id } = body
      if (!user_id) return json({ error: 'user_id required' }, 400)

      // Cannot delete self
      if (user_id === user.id) {
        return json({ error: 'Cannot delete yourself' }, 400)
      }

      // Cannot delete another admin
      const { data: targetProfile } = await db
        .from('profiles')
        .select('role, telegram_chat_id')
        .eq('id', user_id)
        .single()

      if (targetProfile && targetProfile.role === 'admin') {
        return json({ error: 'Cannot delete admin' }, 403)
      }
      // Manager can only delete regular users
      if (callerRole === 'manager' && targetProfile && targetProfile.role !== 'user') {
        return json({ error: 'Managers can only delete regular users' }, 403)
      }

      // Telegram: notify + kick from group
      const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')
      const tgChatId = targetProfile?.telegram_chat_id

      if (tgToken && tgChatId) {
        // DM notification (before kick)
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: tgChatId,
          text: '⛔ Ваш аккаунт KSLT удалён.',
          parse_mode: 'HTML'
        })

        // Kick from group
        if (groupChatId) {
          await tgFetch(tgToken, 'banChatMember', {
            chat_id: groupChatId,
            user_id: tgChatId
          })
        }
      }

      // Delete from auth (cascades to profiles via trigger/FK)
      const { error: deleteErr } = await db.auth.admin.deleteUser(user_id)

      if (deleteErr) {
        console.error('Delete error:', deleteErr)
        return json({ error: deleteErr.message }, 500)
      }

      // Also clean up profile manually in case no cascade
      await db.from('profiles').delete().eq('id', user_id)

      return json({ success: true, action: 'deleted' })
    }

    // ---- BAN PLAYER ----
    if (action === 'ban_player') {
      const { player_id, banned_until, reason } = body
      if (!player_id) return json({ error: 'player_id required' }, 400)
      if (!banned_until) return json({ error: 'banned_until required' }, 400)

      // Update player ban fields
      const { error: upErr } = await db
        .from('players')
        .update({
          banned_until: banned_until,
          ban_reason: reason || null
        })
        .eq('id', player_id)

      if (upErr) {
        console.error('Ban player error:', upErr)
        return json({ error: upErr.message }, 500)
      }

      // Find linked profile for Telegram notification
      const { data: linkedProfile } = await db
        .from('profiles')
        .select('telegram_chat_id')
        .eq('player_id', player_id)
        .limit(1)
        .single()

      const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const tgChatId = linkedProfile?.telegram_chat_id

      if (tgToken && tgChatId) {
        const isPerm = new Date(banned_until).getFullYear() >= 2099
        const banDateStr = isPerm
          ? 'навсегда'
          : new Date(banned_until).toLocaleDateString('ru-RU')
        const reasonText = reason ? '\nПричина: ' + reason : ''
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: tgChatId,
          text: `⛔ Вы заблокированы до: ${banDateStr}${reasonText}`,
          parse_mode: 'HTML'
        })
      }

      return json({ success: true, action: 'player_banned', banned_until })
    }

    // ---- UNBAN PLAYER ----
    if (action === 'unban_player') {
      const { player_id } = body
      if (!player_id) return json({ error: 'player_id required' }, 400)

      const { error: upErr } = await db
        .from('players')
        .update({
          banned_until: null,
          ban_reason: null
        })
        .eq('id', player_id)

      if (upErr) {
        console.error('Unban player error:', upErr)
        return json({ error: upErr.message }, 500)
      }

      // Find linked profile for Telegram notification
      const { data: linkedProfile } = await db
        .from('profiles')
        .select('telegram_chat_id')
        .eq('player_id', player_id)
        .limit(1)
        .single()

      const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const tgChatId = linkedProfile?.telegram_chat_id

      if (tgToken && tgChatId) {
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: tgChatId,
          text: '✅ Вы разблокированы. Добро пожаловать обратно!',
          parse_mode: 'HTML'
        })
      }

      return json({ success: true, action: 'player_unbanned' })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (err) {
    console.error('Edge function error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

// ---- Telegram API helper ----
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
