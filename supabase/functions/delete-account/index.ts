// ============================================
// KSLT — управление своей учётной записью
//
// Два действия, оба от имени самого человека:
//   delete  — пометить на удаление. Запись пропадает из общих списков,
//             но 30 дней её можно вернуть: люди передумывают, а стёртое
//             не восстановишь. По истечении срока убирает уборщик.
//   restore — вернуть помеченную обратно, пока срок не вышел.
//
// Раньше здесь было одно действие: пометка и сразу же безвозвратное
// удаление учётной записи входа. Вернуться было нельзя.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Сколько дней учётная запись ждёт перед окончательным удалением
const GRACE_DAYS = 30

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

    let body: Record<string, unknown> = {}
    try { body = await req.json() } catch { /* тело необязательно */ }
    const action = String(body.action || 'delete')

    // Service role client for privileged operations
    const db = createClient(supabaseUrl, serviceKey)

    if (action === 'restore') {
      // Возвращаем только пока срок не вышел. После него записи уже нет,
      // и восстанавливать нечего
      const { data, error } = await db.from('profiles')
        .update({ deleted_at: null })
        .eq('id', userId)
        .not('deleted_at', 'is', null)
        .select('id')
      if (error) {
        console.error('Restore profile error:', error)
        return json({ error: 'Failed to restore profile' }, 500)
      }
      if (!data || data.length === 0) {
        return json({ error: 'Nothing to restore' }, 404)
      }
      return json({ success: true, action: 'account_restored' })
    }

    // ---- Пометка на удаление ----
    const now = new Date()
    const purgeAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)

    const { error: profileErr } = await db
      .from('profiles')
      .update({ deleted_at: now.toISOString() })
      .eq('id', userId)

    if (profileErr) {
      console.error('Profile soft-delete error:', profileErr)
      return json({ error: 'Failed to update profile' }, 500)
    }

    // Уведомления выключаем сразу: человек попросил его не беспокоить,
    // а не «беспокоить ещё месяц». Настройки восстановит сам, если вернётся
    const { error: notifErr } = await db
      .from('notification_preferences')
      .delete()
      .eq('profile_id', userId)

    if (notifErr) {
      console.error('Notification preferences cleanup error:', notifErr)
      // Не критично — продолжаем
    }

    // Учётную запись входа не трогаем: без неё человек не сможет вернуться,
    // и вся отсрочка теряет смысл. Её удалит уборщик, когда выйдет срок.
    // Выходим со всех устройств — на сайте это выглядит как обычный выход
    await db.auth.admin.signOut(userId, 'global').catch(function (e: unknown) {
      console.error('Sign out error:', e)
    })

    return json({
      success: true,
      action: 'account_marked_for_deletion',
      purge_at: purgeAt.toISOString(),
      grace_days: GRACE_DAYS
    })

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
