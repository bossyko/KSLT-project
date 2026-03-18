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

    let body: { tournament_id?: string } = {}
    try {
      body = await req.json()
    } catch {
      // Empty body = cron mode
    }

    if (body.tournament_id) {
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

  // Collect player IDs
  const playerIds = [...new Set(upcoming.flatMap((m: any) => [m.player1_id, m.player2_id]))]

  // Load players, profiles, tournaments
  const { data: players } = await db.from('players').select('id, name').in('id', playerIds)
  const { data: profiles } = await db.from('profiles').select('player_id, telegram_chat_id, email, notify_preferences').in('player_id', playerIds)

  const playerMap: Record<string, any> = {}
  for (const p of (players || [])) playerMap[p.id] = p
  const profileMap: Record<string, any> = {}
  for (const p of (profiles || [])) profileMap[p.player_id] = p

  const tournamentIds = [...new Set(upcoming.map((m: any) => m.tournament_id))]
  const { data: tournaments } = await db.from('tournaments').select('id, title').in('id', tournamentIds)
  const tournamentMap: Record<string, any> = {}
  for (const t of (tournaments || [])) tournamentMap[t.id] = t

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Send notifications
  let sent = 0
  let emailSent = 0
  for (const match of upcoming) {
    const t = tournamentMap[match.tournament_id]
    const p1 = playerMap[match.player1_id]
    const p2 = playerMap[match.player2_id]
    const pr1 = profileMap[match.player1_id]
    const pr2 = profileMap[match.player2_id]
    const courtStr = match.court ? `Корт ${match.court}` : ''

    // Player 1 — TG
    if (pr1?.telegram_chat_id && shouldNotify(pr1.notify_preferences, 'tg', 'matches')) {
      const msg = `🎾 <b>Ваш матч скоро!</b>\n\n🏆 ${esc(t?.title || '')}\n⏰ ${match.scheduled_time}\n${courtStr ? '📍 ' + courtStr + '\n' : ''}🆚 ${esc(p2?.name || '?')}\n\n💪 Удачи!`
      await sendTg(pr1.telegram_chat_id, msg)
      sent++
    }
    // Player 1 — Email
    if (pr1?.email && shouldNotify(pr1.notify_preferences, 'email', 'matches')) {
      const ok = await callSendEmail(serviceKey, {
        to: pr1.email,
        subject: `🎾 Ваш матч скоро: ${t?.title || ''}`,
        template: 'match-schedule',
        data: {
          player_name: p1?.name || '',
          tournament_title: t?.title || '',
          tournament_id: match.tournament_id,
          matches: [{ time: match.scheduled_time, opponent: p2?.name || '?', court: courtStr }]
        }
      })
      if (ok) emailSent++
    }

    // Player 2 — TG
    if (pr2?.telegram_chat_id && shouldNotify(pr2.notify_preferences, 'tg', 'matches')) {
      const msg = `🎾 <b>Ваш матч скоро!</b>\n\n🏆 ${esc(t?.title || '')}\n⏰ ${match.scheduled_time}\n${courtStr ? '📍 ' + courtStr + '\n' : ''}🆚 ${esc(p1?.name || '?')}\n\n💪 Удачи!`
      await sendTg(pr2.telegram_chat_id, msg)
      sent++
    }
    // Player 2 — Email
    if (pr2?.email && shouldNotify(pr2.notify_preferences, 'email', 'matches')) {
      const ok = await callSendEmail(serviceKey, {
        to: pr2.email,
        subject: `🎾 Ваш матч скоро: ${t?.title || ''}`,
        template: 'match-schedule',
        data: {
          player_name: p2?.name || '',
          tournament_title: t?.title || '',
          tournament_id: match.tournament_id,
          matches: [{ time: match.scheduled_time, opponent: p1?.name || '?', court: courtStr }]
        }
      })
      if (ok) emailSent++
    }

    // Mark as notified
    await db.from('matches').update({ notified_at: new Date().toISOString() }).eq('id', match.id)
  }

  return jsonResponse({ sent, email_sent: emailSent, matches: upcoming.length, mode: 'auto' })
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
    .is('notified_at', null)
    .order('scheduled_time', { ascending: true })

  if (!matches || matches.length === 0) {
    return jsonResponse({ error: 'No matches with schedule', sent: 0 }, 200)
  }

  // Collect player IDs
  const playerIds = [...new Set(matches.flatMap((m: any) => [m.player1_id, m.player2_id]))]

  const { data: players } = await db.from('players').select('id, name').in('id', playerIds)
  const { data: profiles } = await db.from('profiles').select('player_id, telegram_chat_id, email, notify_preferences').in('player_id', playerIds)

  const playerMap: Record<string, any> = {}
  for (const p of (players || [])) playerMap[p.id] = p
  const profileMap: Record<string, any> = {}
  for (const p of (profiles || [])) profileMap[p.player_id] = p

  // Group matches by player
  const playerMatches: Record<string, any[]> = {}
  for (const m of matches) {
    if (!playerMatches[m.player1_id]) playerMatches[m.player1_id] = []
    if (!playerMatches[m.player2_id]) playerMatches[m.player2_id] = []
    playerMatches[m.player1_id].push({ ...m, opponentId: m.player2_id })
    playerMatches[m.player2_id].push({ ...m, opponentId: m.player1_id })
  }

  // Format date
  const dateStr = tournament.date_start ? formatDate(tournament.date_start) : ''

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Send summary to each player
  let sent = 0
  let emailSent = 0
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

    // Build match list for email template
    const matchList = myMatches.map((m: any) => {
      const oppName = playerMap[m.opponentId]?.name || '?'
      const time = m.scheduled_time ? m.scheduled_time.slice(0, 5) : '??:??'
      const court = m.court ? `Корт ${m.court}` : ''
      return { time, opponent: oppName, court }
    })

    // TG notification
    if (pr?.telegram_chat_id && shouldNotify(pr?.notify_preferences, 'tg', 'matches')) {
      let msg = `📋 <b>Расписание турнира</b>\n\n`
      if (playerName) msg += `👤 ${esc(playerName)}\n`
      msg += `🏆 ${esc(tournament.title)}\n`
      if (dateStr) msg += `📅 ${dateStr}\n`
      msg += `\nВаши матчи:\n`

      for (const m of myMatches) {
        const oppName = playerMap[m.opponentId]?.name || '?'
        const time = m.scheduled_time ? m.scheduled_time.slice(0, 5) : '??:??'
        const court = m.court ? `, Корт ${m.court}` : ''
        const roundLabel = getRoundLabel(m.round, m.group_number)
        const roundStr = roundLabel ? ` (${roundLabel})` : ''
        msg += `⏰ ${time} — vs ${esc(oppName)}${court}${roundStr}\n`
      }

      msg += `\n🎾 Удачи!`

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
          matches: matchList
        }
      })
      if (ok) emailSent++
    }
  }

  // Mark all included matches as notified
  const matchIds = matches.map((m: any) => m.id)
  if (matchIds.length > 0) {
    await db.from('matches').update({ notified_at: new Date().toISOString() }).in('id', matchIds)
  }

  return jsonResponse({ sent, email_sent: emailSent, noTelegram: noTg, totalPlayers: Object.keys(playerMatches).length, mode: 'manual' })
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
      return false
    }
    return true
  } catch (err) {
    console.error('TG send error:', err)
    return false
  }
}
