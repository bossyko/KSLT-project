// ============================================
// KSLT — Admin Manage User Edge Function
// Operations: create_manager, delete_user
// JWT auth + admin role check
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Check admin role
    const { data: callerProfile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return json({ error: 'Forbidden: admin only' }, 403)
    }

    const body = await req.json()
    const { action } = body

    // ---- CREATE MANAGER ----
    if (action === 'create_manager') {
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
        .select('role')
        .eq('id', user_id)
        .single()

      if (targetProfile && targetProfile.role === 'admin') {
        return json({ error: 'Cannot delete admin' }, 403)
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

    return json({ error: 'Unknown action' }, 400)

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
