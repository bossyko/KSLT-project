// ============================================
// KSLT — уборка учётных записей, помеченных на удаление
// Supabase Edge Function (вызывается pg_cron раз в сутки)
// ============================================
// Человек попросил удалить учётную запись — она получила метку и 30 дней
// ждала: всё это время можно было войти и передумать. Здесь доводим дело
// до конца для тех, у кого срок вышел.
//
// Карточку игрока не трогаем. Результаты матчей, очки и история игр
// принадлежат турнирам, а не учётной записи: стереть их — значит
// переписать турнирные сетки, где человек играл. Вместо этого ставим на
// карточке метку, что учётной записи больше нет, и обрываем связь.
//
// Deploy: supabase functions deploy purge-deleted-accounts --no-verify-jwt
// Secrets: CRON_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GRACE_DAYS = 30

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, serviceKey)

  try {
    const edge = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: due, error: findErr } = await db
      .from('profiles')
      .select('id, email, full_name, player_id, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', edge)

    if (findErr) {
      console.error('Find expired profiles error:', findErr)
      return json({ error: 'Failed to read profiles' }, 500)
    }

    if (!due || due.length === 0) {
      return json({ success: true, purged: 0 })
    }

    const purged: string[] = []
    const failed: string[] = []

    for (const profile of due) {
      // 1. Метка на карточке игрока — карточка остаётся жить
      if (profile.player_id) {
        const { error: markErr } = await db
          .from('players')
          .update({ account_deleted_at: profile.deleted_at })
          .eq('id', profile.player_id)
        if (markErr) console.error('Mark player error:', profile.player_id, markErr)
      }

      // 2. Личные данные, которые не нужны ни турнирам, ни рейтингу
      await db.from('loyalty_transactions').delete().eq('profile_id', profile.id)
      await db.from('notification_preferences').delete().eq('profile_id', profile.id)

      // 3. Сама учётная запись. Удаление профиля запускает триггер, который
      //    складывает ФИО и почту в журнал удалённых — по нему видно, кто и
      //    когда ушёл, если человек вернётся с вопросом
      const { error: delErr } = await db.auth.admin.deleteUser(profile.id)
      if (delErr) {
        console.error('Delete auth user error:', profile.id, delErr)
        failed.push(profile.id)
        continue
      }
      purged.push(profile.id)
    }

    return json({ success: true, purged: purged.length, failed: failed.length })

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
