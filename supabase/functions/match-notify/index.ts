// ============================================
// KSLT — Match Start Notification
// Supabase Edge Function
// ============================================
// Two modes:
// 1. Auto (pg_cron): POST {} — notify players about matches starting in 0-15 min
// 2. Manual (admin): POST { tournament_id } with JWT — send full schedule summary
//
// Deduplication via matches.notified_at field.
//
// Deploy: supabase functions deploy match-notify --no-verify-jwt
// Required secrets: TELEGRAM_BOT_TOKEN, CRON_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'
const SITE_URL = 'https://kslt.netlify.app'
const BISHKEK_OFFSET = 6 // UTC+6

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Auth: JWT (admin) or CRON_SECRET ---
  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  const isCron = authHeader === `Bearer ${cronSecret}`
  const isServiceRole = authHeader.includes(serviceKey)

  let isAdmin = false
  if (!isCron && !isServiceRole) {
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return jsonResponse({ error: 'Forbidden: staff only' }, 403)
    }
    isAdmin = true
  }

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let body: { tournament_id?: string; match_id?: string; kind?: string } = {}
    try {
      body = await req.json()
    } catch {
      // Empty body = cron mode
    }

    if (body.match_id) {
      // ---- Зов на корт: одной паре, прямо во время турнира ----
      return await callToCourt(db, body.match_id, body.kind || 'go')
    } else if (body.tournament_id) {
      // ---- Manual mode: send full schedule to all players ----
      return await manualNotify(db, body.tournament_id)
    } else {
      // ---- Auto mode: notify about matches starting in 0-15 min ----
      return await autoNotify(db)
    }
  } catch (err) {
    console.error('match-notify error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})

// ============================================
// Помощники: пары, номер запуска, пуш
// ============================================

/**
 * В парном турнире в матче записаны только капитаны. Напарники живут в
 * заявке — без них письмо получали двое из четверых, а вторые номера не
 * знали ни времени, ни корта.
 *
 * Возвращает { partnerOf: {капитан: напарник}, extraName: {капитан: имя} }.
 */
async function loadPartners(db: any, tournamentIds: string[]) {
  const partnerOf: Record<string, string> = {}
  const extraName: Record<string, string> = {}
  if (!tournamentIds.length) return { partnerOf, extraName }

  const { data: regs } = await db
    .from('tournament_registrations')
    .select('player_id, partner_id, partner_external_name')
    .in('tournament_id', tournamentIds)

  for (const r of (regs || [])) {
    if (!r.player_id) continue
    if (r.partner_id) partnerOf[r.player_id] = r.partner_id
    else if (r.partner_external_name) extraName[r.player_id] = r.partner_external_name
  }
  return { partnerOf, extraName }
}

/**
 * Номер запуска: какой по счёту эта игра в общей очереди турнира.
 *
 * Раньше считали по каждому корту отдельно, но корт теперь известен только у
 * первых запусков — дальше его ставит ведущий, когда корт освободится. Так
 * что номер берём по очереди целиком: он и на площадке понятнее — «третьими
 * идём» значит третьими, а не третьими на четвёртом корте.
 */
async function loadLaunchNumbers(db: any, tournamentIds: string[]) {
  const номер: Record<string, number> = {}
  if (!tournamentIds.length) return номер

  const { data: все } = await db
    .from('matches')
    .select('id, tournament_id, court, scheduled_time, scheduled_day, score')
    .in('tournament_id', tournamentIds)
    .not('scheduled_time', 'is', null)

  const поДням: Record<string, any[]> = {}
  for (const m of (все || [])) {
    if (m.score === 'BYE') continue
    const ключ = `${m.tournament_id}|${m.scheduled_day || ''}`
    if (!поДням[ключ]) поДням[ключ] = []
    поДням[ключ].push(m)
  }
  for (const ключ of Object.keys(поДням)) {
    поДням[ключ]
      .sort((a, b) => {
        const в = String(a.scheduled_time).localeCompare(String(b.scheduled_time))
        if (в) return в
        return String(a.court || '').localeCompare(String(b.court || ''), undefined, { numeric: true })
      })
      .forEach((m, i) => { номер[m.id] = i + 1 })
  }
  return номер
}

/** Имя стороны: в паре — оба через косую черту. */
function sideName(captainId: string, playerMap: any, partnerOf: any, extraName: any): string {
  const кап = playerMap[captainId]?.name || '?'
  const пид = partnerOf[captainId]
  const имяП = пид ? (playerMap[пид]?.name || '') : (extraName[captainId] || '')
  return имяП ? `${кап} / ${имяП}` : кап
}

/** Все, кого касается матч: капитаны и их напарники. */
function matchRecipients(match: any, partnerOf: any): string[] {
  const кто: string[] = []
  for (const кап of [match.player1_id, match.player2_id]) {
    if (!кап) continue
    кто.push(кап)
    if (partnerOf[кап]) кто.push(partnerOf[кап])
  }
  return [...new Set(кто)]
}

/** Пуш в приложение. Молча пропускаем, если у человека нет учётной записи. */
async function sendPush(serviceKey: string, profileId: string, title: string, message: string, tournamentId?: string) {
  if (!profileId) return false
  try {
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify({
        title, message, type: 'match', audience: 'user', user_id: profileId,
        action_type: tournamentId ? 'tournament' : undefined,
        action_id: tournamentId
      })
    })
    return res.ok
  } catch (_) {
    return false
  }
}

// ============================================
// Зов на корт: одной паре
// ============================================
//
// В день турнира очередь ведёт человек: освободился корт — он ставит его
// следующей игре и зовёт участников. До сих пор это делалось голосом через
// весь клуб, а теперь уходит пушем и в телеграм всем четверым сразу.
//
// kind = 'ready' — «готовьтесь, вы следующие»
// kind = 'go'    — «ваш запуск, пройдите на корт N»
async function callToCourt(db: any, matchId: string, kind: string): Promise<Response> {
  const { data: match } = await db
    .from('matches')
    .select('id, tournament_id, player1_id, player2_id, court, scheduled_time, status, called_ready_at, called_go_at')
    .eq('id', matchId)
    .single()

  if (!match) return jsonResponse({ error: 'Match not found' }, 404)

  // Сыгранный матч звать некуда: страница у ведущего могла остаться открытой
  // с прошлого круга, и случайное нажатие подняло бы людей с лавки
  if (match.status === 'completed') {
    return jsonResponse({ error: 'Матч уже сыгран' }, 409)
  }

  // Пара на корте — звать её незачем
  if (match.status === 'live') {
    return jsonResponse({ error: 'Матч уже идёт' }, 409)
  }

  // «Пройдите на корт» — а на какой? У поздних запусков корт назначают по
  // ходу дня, и к зову он должен быть проставлен
  // Не 409: матч в порядке, не хватает только номера корта — кнопку гасить
  // не надо, её нажмут снова, когда корт проставят
  if (kind !== 'ready' && !match.court) {
    return jsonResponse({ error: 'Сначала укажи корт' }, 400)
  }

  // После «На корт» предупреждать поздно — люди уже идут
  if (kind === 'ready' && match.called_go_at) {
    return jsonResponse({ ok: true, already: true, at: match.called_go_at, kind, mode: 'call' })
  }

  // «Готовьтесь» — предупреждение, оно имеет смысл один раз. «На корт»
  // повторить можно: вдруг не услышали
  if (kind === 'ready' && match.called_ready_at) {
    return jsonResponse({ ok: true, already: true, at: match.called_ready_at, kind, mode: 'call' })
  }

  const { data: tournament } = await db
    .from('tournaments').select('id, title').eq('id', match.tournament_id).single()

  const { partnerOf, extraName } = await loadPartners(db, [String(match.tournament_id)])
  const кому = matchRecipients(match, partnerOf)

  const { data: players } = await db.from('players').select('id, name').in('id', кому)
  const { data: profiles } = await db
    .from('profiles').select('id, player_id, telegram_chat_id, email, notify_preferences').in('player_id', кому)

  const playerMap: Record<string, any> = {}
  for (const p of (players || [])) playerMap[p.id] = p
  const profileMap: Record<string, any> = {}
  for (const p of (profiles || [])) profileMap[p.player_id] = p

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const кортStr = match.court ? `Корт ${match.court}` : ''
  const зовём = kind === 'ready'

  let sent = 0, pushSent = 0

  for (const сторона of [1, 2]) {
    const свой = сторона === 1 ? match.player1_id : match.player2_id
    const чужой = сторона === 1 ? match.player2_id : match.player1_id
    if (!свой) continue

    const соперник = sideName(чужой, playerMap, partnerOf, extraName)

    for (const игрок of [свой, partnerOf[свой]].filter(Boolean)) {
      const pr = profileMap[игрок]
      if (!pr) continue

      const заголовок = зовём ? 'Готовьтесь — вы следующие' : 'Ваш запуск'
      // У поздних запусков корт назначают по ходу дня. В «Готовьтесь» это
      // нормально — так и пишем, что корт назовём перед выходом. А «На корт»
      // без номера не уходит вовсе, его проверяем выше
      const строка = зовём
        ? (кортStr
            ? `Скоро ваш выход, ${кортStr}. Соперники: ${соперник}`
            : `Скоро ваш выход. Корт назовём перед выходом. Соперники: ${соперник}`)
        : `Пройдите на корт ${match.court}. Соперники: ${соперник}`

      if (pr.telegram_chat_id && shouldNotify(pr.notify_preferences, 'tg', 'matches')) {
        const значок = зовём ? '\u{23F3}' : '\u{1F3BE}'
        await sendTg(pr.telegram_chat_id,
          `${значок} <b>${заголовок}</b>\n\n\u{1F3C6} ${esc(tournament?.title || '')}\n${esc(строка)}`)
        sent++
      }

      if (pr.id) {
        const ok = await sendPush(serviceKey, pr.id, заголовок, строка, match.tournament_id)
        if (ok) pushSent++
      }
    }
  }

  const когда = new Date().toISOString()
  await db.from('matches')
    .update(зовём ? { called_ready_at: когда } : { called_go_at: когда })
    .eq('id', match.id)

  return jsonResponse({ ok: true, sent, push_sent: pushSent, at: когда, kind, mode: 'call' })
}

// ============================================
// Auto mode: pg_cron every 5 min
// ============================================
async function autoNotify(db: any): Promise<Response> {
  // Current time in Bishkek (UTC+6)
  const now = new Date()
  const bishkekNow = new Date(now.getTime() + (BISHKEK_OFFSET * 60 + now.getTimezoneOffset()) * 60000)
  const today = bishkekNow.toISOString().slice(0, 10)
  const currentMinutes = bishkekNow.getHours() * 60 + bishkekNow.getMinutes()

  // Matches today, not yet notified, with both players
  const { data: matches } = await db
    .from('matches')
    .select('id, tournament_id, player1_id, player2_id, scheduled_time, court')
    .eq('scheduled_day', today)
    .eq('status', 'upcoming')
    .is('notified_at', null)
    .not('player1_id', 'is', null)
    .not('player2_id', 'is', null)

  if (!matches || matches.length === 0) {
    return jsonResponse({ sent: 0, mode: 'auto' })
  }

  // Filter: match starts in 0-15 minutes
  const WINDOW = 15
  const upcoming = matches.filter((m: any) => {
    const [h, min] = m.scheduled_time.split(':').map(Number)
    const matchMin = h * 60 + min
    const diff = matchMin - currentMinutes
    return diff >= 0 && diff <= WINDOW
  })

  if (upcoming.length === 0) {
    return jsonResponse({ sent: 0, mode: 'auto' })
  }

  const tournamentIds: string[] = [...new Set<string>(upcoming.map((m: any) => String(m.tournament_id)))]

  // Напарники и номера запусков — до рассылки: письмо получают все четверо,
  // и каждый должен увидеть, каким по счёту он выходит
  const { partnerOf, extraName } = await loadPartners(db, tournamentIds)
  const launchNo = await loadLaunchNumbers(db, tournamentIds)

  // Collect player IDs (капитаны и напарники)
  const playerIds = [...new Set(upcoming.flatMap((m: any) => matchRecipients(m, partnerOf)))]

  // Load players, profiles, tournaments
  const { data: players } = await db.from('players').select('id, name').in('id', playerIds)
  const { data: profiles } = await db.from('profiles').select('id, player_id, telegram_chat_id, email, notify_preferences').in('player_id', playerIds)

  const playerMap: Record<string, any> = {}
  for (const p of (players || [])) playerMap[p.id] = p
  const profileMap: Record<string, any> = {}
  for (const p of (profiles || [])) profileMap[p.player_id] = p

  const { data: tournaments } = await db.from('tournaments').select('id, title').in('id', tournamentIds)
  const tournamentMap: Record<string, any> = {}
  for (const t of (tournaments || [])) tournamentMap[t.id] = t

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Send notifications
  let sent = 0
  let emailSent = 0
  let pushSent = 0
  for (const match of upcoming) {
    const t = tournamentMap[match.tournament_id]
    const courtStr = match.court ? `Корт ${match.court}` : ''
    const запуск = launchNo[match.id]
    const запускStr = запуск ? `\u{1F3AF} Запуск №${запуск}` : ''

    // Пишем каждому из четверых: капитанам и их напарникам
    for (const сторона of [1, 2]) {
      const свой = сторона === 1 ? match.player1_id : match.player2_id
      const чужой = сторона === 1 ? match.player2_id : match.player1_id
      if (!свой) continue

      const соперник = sideName(чужой, playerMap, partnerOf, extraName)
      const мои = [свой, partnerOf[свой]].filter(Boolean)

      for (const кому of мои) {
        const pr = profileMap[кому]
        if (!pr) continue

        const строки = [
          `\u{1F3BE} <b>Ваш матч скоро!</b>`,
          '',
          `\u{1F3C6} ${esc(t?.title || '')}`,
          `\u{23F0} ${match.scheduled_time}`,
          запускStr,
          courtStr ? `\u{1F4CD} ${courtStr}` : '',
          `\u{1F19A} ${esc(соперник)}`,
          '',
          '\u{1F4AA} Удачи!'
        ].filter((x) => x !== '')

        if (pr.telegram_chat_id && shouldNotify(pr.notify_preferences, 'tg', 'matches')) {
          await sendTg(pr.telegram_chat_id, строки.join('\n'))
          sent++
        }

        if (pr.email && shouldNotify(pr.notify_preferences, 'email', 'matches')) {
          const ok = await callSendEmail(serviceKey, {
            to: pr.email,
            subject: `\u{1F3BE} Ваш матч скоро: ${t?.title || ''}`,
            template: 'match-schedule',
            data: {
              player_name: playerMap[кому]?.name || '',
              tournament_title: t?.title || '',
              tournament_id: match.tournament_id,
              matches: [{
                time: match.scheduled_time,
                opponent: соперник,
                court: courtStr,
                launch: запуск || null
              }]
            }
          })
          if (ok) emailSent++
        }

        // Пуш в приложение: короткой строкой, без разметки
        if (pr.id) {
          const краткоЗапуск = запуск ? `запуск №${запуск}, ` : ''
          const ok = await sendPush(
            serviceKey,
            pr.id,
            'Ваш матч скоро',
            `${match.scheduled_time} \u00B7 ${краткоЗапуск}${courtStr || 'корт уточняется'} \u00B7 ${соперник}`,
            match.tournament_id
          )
          if (ok) pushSent++
        }
      }
    }

    // Mark as notified
    await db.from('matches').update({ notified_at: new Date().toISOString() }).eq('id', match.id)
  }


  return jsonResponse({ sent, email_sent: emailSent, push_sent: pushSent, matches: upcoming.length, mode: 'auto' })
}

// ============================================
// Manual mode: admin sends full schedule to players
// ============================================
async function manualNotify(db: any, tournamentId: string): Promise<Response> {
  // Load tournament
  const { data: tournament, error: tErr } = await db
    .from('tournaments')
    .select('id, title, date_start')
    .eq('id', tournamentId)
    .single()

  if (tErr || !tournament) {
    return jsonResponse({ error: 'Tournament not found' }, 404)
  }

  // Load non-completed, not yet notified matches with both players
  const { data: matches } = await db
    .from('matches')
    .select('id, player1_id, player2_id, scheduled_time, scheduled_day, court, status, round, group_number')
    .eq('tournament_id', tournamentId)
    .not('player1_id', 'is', null)
    .not('player2_id', 'is', null)
    .or('score.is.null,score.neq.BYE')
    .neq('status', 'completed')
    // На «уже уведомляли» здесь не смотрим: это защита автоматической
    // рассылки от повторов. Ручную кнопку жмёт человек — он и решает, когда
    // разослать заново, а очередь после перестановок меняется
    .order('scheduled_time', { ascending: true })

  if (!matches || matches.length === 0) {
    return jsonResponse({ error: 'No matches with schedule', sent: 0 }, 200)
  }

  // Напарники и номера запусков: расписание получают все четверо в паре,
  // и у каждой игры видно, какой она по счёту на своём корте
  const { partnerOf, extraName } = await loadPartners(db, [tournamentId])
  const launchNo = await loadLaunchNumbers(db, [tournamentId])

  // Collect player IDs (капитаны и напарники)
  const playerIds = [...new Set(matches.flatMap((m: any) => matchRecipients(m, partnerOf)))]

  const { data: players } = await db.from('players').select('id, name').in('id', playerIds)
  const { data: profiles } = await db.from('profiles').select('id, player_id, telegram_chat_id, email, notify_preferences').in('player_id', playerIds)

  const playerMap: Record<string, any> = {}
  for (const p of (players || [])) playerMap[p.id] = p
  const profileMap: Record<string, any> = {}
  for (const p of (profiles || [])) profileMap[p.player_id] = p

  // Group matches by player — вместе с напарниками
  const playerMatches: Record<string, any[]> = {}
  for (const m of matches) {
    for (const сторона of [1, 2]) {
      const свой = сторона === 1 ? m.player1_id : m.player2_id
      const чужой = сторона === 1 ? m.player2_id : m.player1_id
      if (!свой) continue
      for (const кому of [свой, partnerOf[свой]].filter(Boolean)) {
        if (!playerMatches[кому]) playerMatches[кому] = []
        playerMatches[кому].push({ ...m, opponentId: чужой })
      }
    }
  }

  // Format date
  const dateStr = tournament.date_start ? formatDate(tournament.date_start) : ''

  // ---- Доска запусков: один список для всех ----
  //
  // Раньше каждый получал только свои три строчки и не понимал, к чему
  // готовиться: сколько пар впереди, когда примерно выход. Теперь уходит вся
  // очередь, а свои игры помечены — их видно сразу.
  const доска = [...matches].sort((a: any, b: any) => {
    if ((a.scheduled_day || '') !== (b.scheduled_day || '')) {
      return (a.scheduled_day || '') < (b.scheduled_day || '') ? -1 : 1
    }
    if ((a.scheduled_time || '') !== (b.scheduled_time || '')) {
      return (a.scheduled_time || '') < (b.scheduled_time || '') ? -1 : 1
    }
    return String(a.court || '').localeCompare(String(b.court || ''))
  })

  const строкаЗапуска = (m: any) => {
    const время = m.scheduled_time ? String(m.scheduled_time).slice(0, 5) : '??:??'
    const корт = m.court ? `Корт ${m.court}` : ''
    const круг = getRoundLabel(m.round, m.group_number)
    return {
      launch: launchNo[m.id] || null,
      time: время,
      court: корт,
      round: круг,
      pair1: sideName(m.player1_id, playerMap, partnerOf, extraName),
      pair2: sideName(m.player2_id, playerMap, partnerOf, extraName)
    }
  }

  // Телеграм не берёт сообщения длиннее 4096 знаков: на большом турнире
  // хвост очереди заменяем ссылкой на страницу турнира
  const ПОТОЛОК = 40

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Send summary to each player
  let sent = 0
  let emailSent = 0
  let pushSent = 0
  let noTg = 0

  for (const playerId of Object.keys(playerMatches)) {
    const pr = profileMap[playerId]
    const playerName = playerMap[playerId]?.name || ''

    const myMatches = playerMatches[playerId]
    // Sort by day then time
    myMatches.sort((a: any, b: any) => {
      if (a.scheduled_day !== b.scheduled_day) return (a.scheduled_day || '') < (b.scheduled_day || '') ? -1 : 1
      return (a.scheduled_time || '') < (b.scheduled_time || '') ? -1 : 1
    })

    // Письмо получает ту же доску: список всех запусков, свои помечены
    const matchList = доска.map((m: any) => {
      const с = строкаЗапуска(m)
      return {
        time: с.launch ? `№${с.launch} · ${с.time}` : с.time,
        opponent: `${с.pair1} — ${с.pair2}`,
        court: [с.court, с.round].filter(Boolean).join(' · '),
        mine: myMatches.some((свой: any) => свой.id === m.id)
      }
    })

    // Свои игры — чтобы пометить их в общем списке
    const свои = new Set(myMatches.map((m: any) => m.id))

    // TG notification
    if (pr?.telegram_chat_id && shouldNotify(pr?.notify_preferences, 'tg', 'matches')) {
      let msg = `📋 <b>Расписание запусков</b>\n\n`
      if (playerName) msg += `👤 ${esc(playerName)}\n`
      msg += `🏆 ${esc(tournament.title)}\n`
      if (dateStr) msg += `📅 ${dateStr}\n`
      msg += `\nВаши игры отмечены ▶\n\n`

      доска.slice(0, ПОТОЛОК).forEach((m: any) => {
        const с = строкаЗапуска(m)
        const мой = свои.has(m.id)
        const номер = с.launch ? `№${с.launch} ` : ''
        const хвост = [с.court, с.round].filter(Boolean).join(' · ')
        const игра = `${номер}${с.time} — ${esc(с.pair1)} vs ${esc(с.pair2)}${хвост ? ` (${хвост})` : ''}`
        msg += мой ? `▶ <b>${игра}</b>\n` : `${игра}\n`
      })

      if (доска.length > ПОТОЛОК) {
        msg += `\n…и ещё ${доска.length - ПОТОЛОК} запусков — на странице турнира\n`
      }

      msg += `\nТочно ко времени идут первые запуски — по числу кортов. `
      msg += `Дальше время ориентировочное: игра начнётся, как освободится корт.\n`
      msg += `\n🎾 <a href="${SITE_URL}/pages/tournament.html?id=${tournamentId}">Расписание на странице турнира</a>`

      await sendTg(pr.telegram_chat_id, msg)
      sent++
    } else {
      noTg++
    }

    // Email notification
    if (pr?.email && shouldNotify(pr?.notify_preferences, 'email', 'matches')) {
      const ok = await callSendEmail(serviceKey, {
        to: pr.email,
        subject: `📋 Расписание: ${tournament.title}`,
        template: 'match-schedule',
        data: {
          player_name: playerName,
          tournament_title: tournament.title,
          tournament_id: tournamentId,
          date: dateStr,
          board: true,
          matches: matchList
        }
      })
      if (ok) emailSent++
    }

    // Пуш в приложение: первая игра и сколько всего
    if (pr?.id) {
      const первая = myMatches[0]
      const время = первая?.scheduled_time ? String(первая.scheduled_time).slice(0, 5) : ''
      const запуск = первая && launchNo[первая.id] ? `запуск №${launchNo[первая.id]}, ` : ''
      const корт = первая?.court ? `корт ${первая.court}` : ''
      const хвост = myMatches.length > 1 ? ` \u00B7 всего игр: ${myMatches.length}` : ''
      const ok = await sendPush(
        serviceKey, pr.id,
        `Расписание: ${tournament.title}`,
        `Первая игра ${время} \u00B7 ${запуск}${корт}${хвост}`.replace(/ \u00B7 $/, ''),
        tournamentId
      )
      if (ok) pushSent++
    }
  }

  // Mark all included matches as notified
  const когда = new Date().toISOString()
  const matchIds = matches.map((m: any) => m.id)
  if (matchIds.length > 0) {
    await db.from('matches').update({ notified_at: когда }).in('id', matchIds)
  }

  // Отметка на самом турнире: по ней админка пишет, когда рассылали в
  // прошлый раз, и предупреждает перед повтором. Если запись не прошла —
  // говорим об этом вслух, иначе дата пропадёт при обновлении страницы, а
  // причина останется невидимой
  const { error: отметкаErr } = await db
    .from('tournaments').update({ schedule_notified_at: когда }).eq('id', tournamentId)
  if (отметкаErr) console.error('schedule_notified_at не записан:', отметкаErr.message)

  return jsonResponse({
    sent, email_sent: emailSent, push_sent: pushSent, at: когда,
    saved: !отметкаErr, save_error: отметкаErr?.message || null,
    noTelegram: noTg, totalPlayers: Object.keys(playerMatches).length, mode: 'manual'
  })
}

// --- Helpers ---

async function callSendEmail(serviceKey: string, payload: any): Promise<boolean> {
  try {
    const res = await fetch(
      Deno.env.get('SUPABASE_URL') + '/functions/v1/send-email',
      {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    )
    return res.ok
  } catch { return false }
}

function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

function getRoundLabel(round: string | null, groupNumber: number | null): string {
  if (!round) return ''
  // Group stage: G1, G2... → Гр.A, Гр.B...
  if (groupNumber && groupNumber > 0) {
    const letter = String.fromCharCode(64 + groupNumber) // 1→A, 2→B
    return `Гр.${letter}`
  }
  // Already ITF abbreviations: R1, R16, QF, SF, F, 3RD
  return round
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatDate(d: string): string {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
  return d
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

async function sendTg(chatId: number, text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }
  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('TG API error:', data)

      // Человек заблокировал бота — связь больше не работает. Без очистки в
      // базе остался бы chat_id: уведомления молча пропадают, а в кабинете
      // написано «подключён», и переподключить не получается.
      if (data.error_code === 403) {
        try {
          const db = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )
          await db.from('profiles')
            .update({ telegram_chat_id: null, telegram_username: null })
            .eq('telegram_chat_id', chatId)
          console.log(`[match-notify] бот заблокирован у chat_id ${chatId}, связь снята`)
        } catch (e) {
          console.error('не удалось снять связь:', e)
        }
      }
      return false
    }
    return true
  } catch (err) {
    console.error('TG send error:', err)
    return false
  }
}
