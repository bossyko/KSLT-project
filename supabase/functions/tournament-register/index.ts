// ============================================
// KSLT — Tournament Registration Edge Function
// POST { tournament_id, partner_id?, partner_external_name?, partner_external_ntrp?, partner_gender? }
//
// Решает судьбу заявки по правилам допуска и возвращает результат клиенту.
// Вся логика здесь, а не на клиенте: вытеснение меняет чужую заявку,
// а решение о статусе нельзя доверять браузеру.
//
// Ответ: { status: 'approved' | 'waitlist' | 'blocked', reason, rank?, displaced? }
// reason — код для локализации на клиенте, не текст.
//
// ДЕПЛОЙ: «Verify JWT with legacy secret» в настройках функции — ВЫКЛЮЧЕНО,
// как и у остальных функций проекта. Авторизацию функция проверяет сама:
// getUser() → 401, дальше карточка игрока, бан, членство, оплата.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

// Заявки, занимающие место в основной сетке
const MAIN_DRAW_STATUSES = ['approved', 'pending', 'draw']

// Правило допуска: топ-10 нижней категории проходит автоматом, 11-20 в лист ожидания
const AUTO_RANK_LIMIT = 10
const WAITLIST_RANK_LIMIT = 20

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const db = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const tournamentId = body.tournament_id
    if (!tournamentId) return json({ error: 'Missing tournament_id' }, 400)

    // ---- Профиль и карточка игрока ----
    const { data: profile } = await db
      .from('profiles')
      .select('id, full_name, player_id, role, gender')
      .eq('id', user.id)
      .single()

    if (!profile) return json({ error: 'profile_not_found' }, 400)
    if (!profile.player_id) return json({ error: 'no_player' }, 400)

    const isStaff = profile.role === 'admin' || profile.role === 'manager'

    const { data: player } = await db
      .from('players')
      .select('id, name, category_id, gender, points, doubles_points, ntrp_rating, banned_until')
      .eq('id', profile.player_id)
      .single()

    if (!player) return json({ error: 'player_not_found' }, 400)

    if (player.banned_until && new Date(player.banned_until) > new Date()) {
      return json({ error: 'banned' }, 403)
    }

    // ---- Турнир ----
    const { data: tournament } = await db
      .from('tournaments')
      .select('id, title, category_id, gender, format, status, max_participants, reserved_spots, ntrp_min, ntrp_max, ntrp_combined_max')
      .eq('id', tournamentId)
      .single()

    if (!tournament) return json({ error: 'tournament_not_found' }, 404)

    if (['completed', 'cancelled', 'ongoing'].includes(tournament.status)) {
      return json({ error: 'registration_closed' }, 400)
    }

    // ---- Уже подавал? ----
    const { data: existing } = await db
      .from('tournament_registrations')
      .select('id, status')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player.id)
      .maybeSingle()

    if (existing) {
      return json({ error: 'already_registered', status: existing.status }, 409)
    }

    // ---- Членство и оплата (staff пропускаем) ----
    if (!isStaff) {
      const today = new Date().toISOString().split('T')[0]
      const { data: memberships } = await db
        .from('memberships')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('status', 'active')
        .gte('expires_at', today)
        .order('expires_at', { ascending: false })
        .limit(1)

      if (!memberships || memberships.length === 0) {
        return json({ error: 'no_membership' }, 403)
      }

      const { data: payments } = await db
        .from('payments')
        .select('id')
        .eq('membership_id', memberships[0].id)
        .eq('status', 'completed')
        .limit(1)

      if (!payments || payments.length === 0) {
        return json({ error: 'not_paid' }, 403)
      }
    }

    // ---- Пол ----
    const playerGender = normalizeGender(player.gender || profile.gender)
    if (tournament.gender && tournament.gender !== 'mixed') {
      if (playerGender && playerGender !== tournament.gender) {
        return json({ error: 'gender_mismatch' }, 403)
      }
    }

    const isDoubles = tournament.format === 'doubles' || tournament.format === 'mixed_doubles'
    const isFriendly = tournament.category_id === 'friendly'

    // ---- NTRP ----
    if (isDoubles) {
      // Парные и микст: допуск по сумме NTRP двоих, категории не участвуют
      if (tournament.ntrp_combined_max) {
        const partnerNtrp = body.partner_id
          ? await loadPartnerNtrp(db, body.partner_id)
          : Number(body.partner_external_ntrp || 0)
        const combined = Number(player.ntrp_rating || 0) + Number(partnerNtrp || 0)
        if (combined > Number(tournament.ntrp_combined_max)) {
          return json({ error: 'ntrp_combined_exceeded', combined, limit: tournament.ntrp_combined_max }, 403)
        }
      }
    } else {
      const ntrp = Number(player.ntrp_rating || 0)
      if (ntrp) {
        if (tournament.ntrp_min && ntrp < Number(tournament.ntrp_min)) {
          return json({ error: 'ntrp_too_low' }, 403)
        }
        if (tournament.ntrp_max && ntrp > Number(tournament.ntrp_max)) {
          return json({ error: 'ntrp_too_high' }, 403)
        }
      }
    }

    // ---- Решение по категории ----
    // Парные и Friendly категорию не проверяют вообще
    let decision: Decision = { status: 'approved', reason: 'own_category' }
    let playerRank: number | null = null

    if (!isDoubles && !isFriendly && tournament.category_id) {
      const { data: cats } = await db.from('categories').select('id, name, sort_order')
      const sortOf: Record<string, number> = {}
      const nameOf: Record<string, string> = {}
      for (const c of (cats || [])) {
        sortOf[c.id] = c.sort_order
        nameOf[c.id] = c.name
      }

      const tSort = sortOf[tournament.category_id]
      const pSort = player.category_id != null ? sortOf[player.category_id] : undefined

      if (pSort === undefined) {
        // Игрок без категории — пускаем, но через рассмотрение админом
        decision = { status: 'waitlist', reason: 'no_category' }
      } else if (pSort === tSort) {
        decision = { status: 'approved', reason: 'own_category' }
      } else if (pSort > tSort) {
        decision = {
          status: 'blocked',
          reason: 'higher_category',
          text: `Турнир категории ${nameOf[tournament.category_id]}. Игрок категории ${nameOf[player.category_id!]} — участие в турнирах категорией ниже не допускается.`
        }
      } else if (pSort === tSort - 1) {
        playerRank = await computeRank(db, player, tournament.gender)
        if (playerRank <= AUTO_RANK_LIMIT) {
          decision = { status: 'approved', reason: 'top_rank' }
        } else if (playerRank <= WAITLIST_RANK_LIMIT) {
          decision = { status: 'waitlist', reason: 'rank_waitlist' }
        } else {
          decision = {
            status: 'blocked',
            reason: 'rank_too_low',
            text: `Турнир категории ${nameOf[tournament.category_id]}. Принимаются первые ${WAITLIST_RANK_LIMIT} рейтинга ${nameOf[player.category_id!]}, место игрока — ${playerRank}.`
          }
        }
      } else {
        decision = {
          status: 'blocked',
          reason: 'category_too_low',
          text: `Турнир категории ${nameOf[tournament.category_id]}. Категория ${nameOf[player.category_id!]} ниже допустимой — принимаются только на одну ступень ниже.`
        }
      }
    }

    // ---- Места и вытеснение ----
    let displaced: { player_id: string; name: string } | null = null

    if (decision.status === 'approved') {
      const { data: regs } = await db
        .from('tournament_registrations')
        .select('id, player_id, status, registered_at')
        .eq('tournament_id', tournamentId)
        .in('status', MAIN_DRAW_STATUSES)
        .order('registered_at', { ascending: true })

      const mainDraw = regs || []
      const onlineSlots = (tournament.max_participants || 0) - (tournament.reserved_spots || 0)
      const isFull = onlineSlots > 0 && mainDraw.length >= onlineSlots

      if (isFull) {
        if (decision.reason === 'own_category') {
          // Приоритет у своей категории: двигаем последнего по времени игрока нижней категории
          const victim = await findLastLowerCategoryReg(db, mainDraw, tournament.category_id)
          if (victim) {
            await db.from('tournament_registrations')
              .update({ status: 'waitlist' })
              .eq('id', victim.regId)
            displaced = { player_id: victim.playerId, name: victim.name }
          } else {
            decision = { status: 'waitlist', reason: 'draw_full' }
          }
        } else {
          decision = { status: 'waitlist', reason: 'draw_full' }
        }
      }
    }

    // ---- Запись заявки ----
    const row: Record<string, unknown> = {
      tournament_id: tournamentId,
      player_id: player.id,
      status: decision.status,
    }
    if (decision.status === 'blocked' && decision.text) {
      row.block_reason = decision.text
    }
    if (body.partner_id) row.partner_id = body.partner_id
    if (body.partner_external_name) row.partner_external_name = body.partner_external_name
    if (body.partner_external_ntrp) row.partner_external_ntrp = body.partner_external_ntrp
    if (body.partner_gender) row.partner_gender = body.partner_gender

    const { error: insErr } = await db.from('tournament_registrations').insert(row)
    if (insErr) {
      // Откатываем вытеснение, если саму заявку записать не удалось
      if (displaced) {
        await db.from('tournament_registrations')
          .update({ status: 'approved' })
          .eq('tournament_id', tournamentId)
          .eq('player_id', displaced.player_id)
      }
      return json({ error: insErr.message }, 500)
    }

    // ---- Уведомление вытесненному ----
    if (displaced) {
      await notifyDisplaced(db, serviceKey, displaced.player_id, tournament.title)
    }

    return json({
      status: decision.status,
      reason: decision.reason,
      rank: playerRank,
      block_reason: decision.text || null,
      displaced: displaced ? displaced.name : null,
    })

  } catch (e) {
    return json({ error: (e as Error).message || 'Internal error' }, 500)
  }
})

// ============================================

type Decision = {
  status: 'approved' | 'waitlist' | 'blocked'
  reason: string
  text?: string
}

function normalizeGender(g: string | null): string | null {
  if (!g) return null
  if (g === 'male') return 'men'
  if (g === 'female') return 'women'
  return g
}

async function loadPartnerNtrp(db: any, partnerId: string): Promise<number> {
  const { data } = await db.from('players').select('ntrp_rating').eq('id', partnerId).single()
  return Number(data?.ntrp_rating || 0)
}

/**
 * Место игрока в его категории среди своего пола.
 * Рейтинги мужской и женский ведутся раздельно, поэтому пол обязателен.
 */
async function computeRank(db: any, player: any, tournamentGender: string | null): Promise<number> {
  const gender = normalizeGender(player.gender) || normalizeGender(tournamentGender)
  let query = db
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', player.category_id)
    .gt('points', player.points || 0)

  if (gender) query = query.eq('gender', gender)

  const { count } = await query
  return (count || 0) + 1
}

/**
 * Последний по времени подачи игрок нижней категории в основной сетке.
 * Его и двигаем, когда приходит игрок категории турнира, а мест нет.
 */
async function findLastLowerCategoryReg(
  db: any,
  mainDraw: any[],
  tournamentCategoryId: string
): Promise<{ regId: string; playerId: string; name: string } | null> {
  const playerIds = mainDraw.map((r) => r.player_id).filter(Boolean)
  if (playerIds.length === 0) return null

  const { data: players } = await db
    .from('players')
    .select('id, name, category_id')
    .in('id', playerIds)

  const catOf: Record<string, string> = {}
  const nameOf: Record<string, string> = {}
  for (const p of (players || [])) {
    catOf[p.id] = p.category_id
    nameOf[p.id] = p.name
  }

  // mainDraw отсортирован по возрастанию времени — идём с конца
  for (let i = mainDraw.length - 1; i >= 0; i--) {
    const reg = mainDraw[i]
    if (!reg.player_id) continue
    if (catOf[reg.player_id] !== tournamentCategoryId) {
      return { regId: reg.id, playerId: reg.player_id, name: nameOf[reg.player_id] || '' }
    }
  }
  return null
}

async function notifyDisplaced(db: any, serviceKey: string, playerId: string, tournamentTitle: string) {
  const { data: prof } = await db
    .from('profiles')
    .select('id, telegram_chat_id, notify_preferences')
    .eq('player_id', playerId)
    .maybeSingle()

  if (!prof) return

  const title = 'Заявка перемещена в лист ожидания'
  const message = `На турнир «${tournamentTitle}» подал заявку игрок категории турнира. ` +
    `Ваша заявка перемещена в лист ожидания — решение примет администратор.`

  // Telegram
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (token && prof.telegram_chat_id && shouldNotify(prof.notify_preferences, 'tg', 'tournaments')) {
    try {
      await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: prof.telegram_chat_id,
          text: `⏳ <b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`,
          parse_mode: 'HTML',
        })
      })
    } catch { /* уведомление не должно ронять регистрацию */ }
  }

  // Push
  try {
    await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/send-push', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, type: 'tournaments', audience: 'user', user_id: prof.id })
    })
  } catch { /* см. выше */ }
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
