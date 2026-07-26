// ============================================
// KSLT — Delete Account Edge Function
// Self-service account deletion by authenticated user
// Soft-deletes profile, cleans up related data,
// then hard-deletes auth user via service role
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

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller via JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const userId = user.id

    // Service role client for privileged operations
    const db = createClient(supabaseUrl, serviceKey)

    // 1. Soft-delete profile (set deleted_at timestamp)
    const { error: profileErr } = await db
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)

    if (profileErr) {
      console.error('Profile soft-delete error:', profileErr)
      return json({ error: 'Failed to update profile' }, 500)
    }

    // 2. Delete notification preferences
    const { error: notifErr } = await db
      .from('notification_preferences')
      .delete()
      .eq('profile_id', userId)

    if (notifErr) {
      console.error('Notification preferences cleanup error:', notifErr)
      // Non-critical — continue with deletion
    }

    // 3. Delete loyalty transactions
    const { error: loyaltyErr } = await db
      .from('loyalty_transactions')
      .delete()
      .eq('profile_id', userId)

    if (loyaltyErr) {
      console.error('Loyalty transactions cleanup error:', loyaltyErr)
      // Non-critical — continue with deletion
    }

    // 4. Hard-delete auth user (removes from auth.users)
    const { error: deleteErr } = await db.auth.admin.deleteUser(userId)

    if (deleteErr) {
      console.error('Auth user delete error:', deleteErr)
      return json({ error: 'Failed to delete auth user' }, 500)
    }

    return json({ success: true, action: 'account_deleted' })

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
