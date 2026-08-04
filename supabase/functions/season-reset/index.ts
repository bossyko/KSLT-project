// ============================================
// KSLT — Смена сезона (#9)
// POST { dry_run?: boolean }
//
// 1 сентября сгорают очки за сезон, закончившийся в августе предыдущего года.
// Функция снимает состояние до пересчёта, пересчитывает, снимает после,
// пишет журнал и рассылает уведомления тем, у кого что-то изменилось.
//
// Запускается кнопкой в админке: действие меняет рейтинг всем сразу,
// поэтому лучше осознанно, чем молча по расписанию.
//
// dry_run = true — только показать, что изменится, ничего не трогая.
//
// ДЕПЛОЙ: «Verify JWT with legacy secret» — ВЫКЛЮЧЕНО, как у остальных функций.
// Авторизацию функция проверяет сама: только admin и manager.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Snap = {
  player_id: string
  category_id: string | null
  gender: string | null
  points: number
  rank: number | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const db = createClient(supabaseUrl, serviceKey)

    // Два способа запуска:
    //   кнопкой в админке — токен пользователя, проверяем роль
    //   по расписанию 1 сентября — крон приходит с сервисным ключом,
    //   токена пользователя у него нет
    const isServiceCall = authHeader === 'Bearer ' + serviceKey

    if (!isServiceCall) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      })
      const { data: { user }, error: authErr } = await userClient.auth.getUser()
      if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

      const { data: me } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!me || (me.role !== 'admin' && me.role !== 'manager')) {
        return json({ error: 'forbidden' }, 403)
      }
    }

    const body = await req.json().catch(() => ({}))
    const dryRun = body.dry_run === true

    // Смена сезона — сентябрьское событие. В другое время года пересчёт
    // безвреден (окно считается от даты, досрочно ничего не сгорает), но
    // случайное нажатие не должно проходить молча.
    const isSeptember = new Date().getMonth() === 8
    if (!isSeptember && body.force !== true) {
      return json({ error: 'not_season_time', hint: 'Смена сезона проводится в сентябре. Для запуска в другое время передайте force.' }, 400)
    }

    // ---- Сезон, который начинается ----
    // До сентября мы ещё в сезоне, начавшемся в прошлом году
    const now = new Date()
    const y = now.getFullYear()
    const startYear = now.getMonth() >= 8 ? y : y - 1
    const season = `${startYear}/${String(startYear + 1).slice(2)}`

    // ---- Состояние до ----
    const before = await snapshot(db)

    if (dryRun) {
      // Пересчитываем во временную копию нельзя — просто сообщаем, что есть сейчас
      return json({
        dry_run: true,
        season,
        players: before.length,
        message: 'Пересчёт не выполнялся. Уберите dry_run, чтобы провести смену сезона.'
      })
    }

    // ---- Пересчёт ----
    const { error: recalcErr } = await db.rpc('recalc_all_player_points')
    if (recalcErr) return json({ error: 'recalc_failed: ' + recalcErr.message }, 500)

    // ---- Состояние после ----
    const after = await snapshot(db)
    const afterMap: Record<string, Snap> = {}
    for (const s of after) afterMap[s.player_id] = s

    // ---- Сравнение и журнал ----
    const changed: Array<{ before: Snap; after: Snap }> = []
    const logRows: Record<string, unknown>[] = []

    for (const b of before) {
      const a = afterMap[b.player_id]
      if (!a) continue
      const pointsChanged = a.points !== b.points
      const rankChanged = a.rank !== b.rank
      if (!pointsChanged && !rankChanged) continue

      changed.push({ before: b, after: a })
      logRows.push({
        season,
        player_id: b.player_id,
        category_id: b.category_id,
        gender: b.gender,
        points_before: b.points,
        points_after: a.points,
        rank_before: b.rank,
        rank_after: a.rank
      })
    }

    // Журнал важнее рассылки: если он не записался, дальше идти нельзя —
    // разослать сообщения и не суметь потом объяснить игроку, что изменилось,
    // хуже, чем не разослать вовсе.
    if (logRows.length > 0) {
      const { error: logErr } = await db.from('season_reset_log').insert(logRows)
      if (logErr) {
        return json({
          error: 'log_failed: ' + logErr.message,
          hint: 'Прогоните sql/season-reset-migration.sql — таблица журнала не создана',
          season,
          changed: changed.length,
          notified: 0
        }, 500)
      }
    }

    // ---- Уведомления ----
    let notified = 0
    if (changed.length > 0) {
      const playerIds = changed.map((c) => c.before.player_id)
      const { data: profiles } = await db
        .from('profiles')
        .select('id, player_id, telegram_chat_id, notify_preferences')
        .in('player_id', playerIds)

      const profByPlayer: Record<string, any> = {}
      for (const p of (profiles || [])) profByPlayer[p.player_id] = p

      const { data: cats } = await db.from('categories').select('id, name')
      const catName: Record<string, string> = {}
      for (const c of (cats || [])) catName[c.id] = c.name

      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')

      for (const ch of changed) {
        const prof = profByPlayer[ch.before.player_id]
        if (!prof) continue // игрок без аккаунта — уведомлять некому

        const cat = ch.after.category_id ? (catName[ch.after.category_id] || ch.after.category_id) : ''
        const lines = [
          `🗓 <b>Новый сезон ${escapeHtml(season)}</b>`,
          ``,
          `Очки за сезон, закончившийся в прошлом августе, сгорели.`,
          ``,
          `Очки: <b>${ch.before.points}</b> → <b>${ch.after.points}</b>`
        ]
        if (ch.before.rank !== ch.after.rank && ch.after.rank) {
          lines.push(`Место${cat ? ' в ' + escapeHtml(cat) : ''}: <b>${ch.before.rank ?? '—'}</b> → <b>${ch.after.rank}</b>`)
        }
        lines.push(``, `Полная история результатов сохранена в личном кабинете.`)

        if (token && prof.telegram_chat_id && shouldNotify(prof.notify_preferences, 'tg', 'tournaments')) {
          try {
            await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: prof.telegram_chat_id, text: lines.join('\n'), parse_mode: 'HTML' })
            })
          } catch { /* уведомление не должно ронять смену сезона */ }
        }

        try {
          await fetch(supabaseUrl + '/functions/v1/send-push', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Новый сезон ${season}`,
              message: `Очки: ${ch.before.points} → ${ch.after.points}`,
              type: 'tournaments',
              audience: 'user',
              user_id: prof.id
            })
          })
        } catch { /* см. выше */ }

        notified++
      }

      if (notified > 0) {
        await db.from('season_reset_log')
          .update({ notified: true })
          .eq('season', season)
          .in('player_id', playerIds)
      }
    }

    return json({
      season,
      players: before.length,
      changed: changed.length,
      notified
    })

  } catch (e) {
    return json({ error: (e as Error).message || 'Internal error' }, 500)
  }
})

/**
 * Очки и место каждого игрока. Место считается внутри своей категории
 * и своего пола — мужской и женский рейтинги ведутся раздельно.
 */
async function snapshot(db: any): Promise<Snap[]> {
  const { data: players } = await db
    .from('players')
    .select('id, category_id, gender, points')

  const rows: Snap[] = (players || []).map((p: any) => ({
    player_id: p.id,
    category_id: p.category_id,
    gender: p.gender,
    points: p.points || 0,
    rank: null
  }))

  // Место = сколько игроков в той же категории и того же пола имеют строго
  // больше очков, плюс один. При равных очках место одинаковое.
  //
  // Нумеровать подряд по отсортированному списку нельзя: у большинства игроков
  // очки равны (часто нули), порядок таких строк в выдаче произвольный и
  // меняется между запросами. Тогда сравнение «до и после» показывало бы
  // изменение места там, где ничего не менялось.
  const groups: Record<string, number[]> = {}
  for (const r of rows) {
    if (!r.category_id) continue
    const key = r.category_id + '|' + (r.gender || '')
    if (!groups[key]) groups[key] = []
    groups[key].push(r.points)
  }

  for (const r of rows) {
    if (!r.category_id) continue
    const key = r.category_id + '|' + (r.gender || '')
    const pts = groups[key]
    let higher = 0
    for (const v of pts) if (v > r.points) higher++
    r.rank = higher + 1
  }

  return rows
}

function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
