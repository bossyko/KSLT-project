// ============================================
// KSLT — Tournament Registration Notify
// Supabase Edge Function
// ============================================
// Sends tournament announcement to Telegram group + email when registration opens.
//
// Two modes:
// 1. Manual: POST { tournament_id: "xxx" } with JWT (admin button)
// 2. Cron:   POST {} with CRON_SECRET (daily auto-check)
//
// Deduplication via tournaments.notified_at field.
//
// Deploy: Supabase Dashboard → Edge Functions → New Function
// Required secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_CHAT_ID, CRON_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'
const SITE_URL = 'https://kslt.netlify.app'

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

  // For JWT auth — verify via Supabase, check admin role
  let isAdmin = false
  if (!isCron && !isServiceRole) {
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    // Check admin role
    const db = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'admin') {
      return new Response('Forbidden: admin only', { status: 403, headers: corsHeaders })
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

    let tournaments: any[] = []

    if (body.tournament_id) {
      // --- Manual mode: single tournament ---
      const { data, error } = await db
        .from('tournaments')
        .select('*')
        .eq('id', body.tournament_id)
        .single()

      if (error || !data) {
        return jsonResponse({ error: 'Tournament not found' }, 404)
      }
      if (data.notified_at) {
        return jsonResponse({ error: 'Already notified', notified_at: data.notified_at }, 409)
      }
      tournaments = [data]
    } else {
      // --- Cron mode: all tournaments with registration_start = today, not yet notified ---
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await db
        .from('tournaments')
        .select('*')
        .eq('registration_start', today)
        .is('notified_at', null)
        .neq('status', 'cancelled')

      if (error) {
        console.error('Query error:', error)
        return jsonResponse({ error: error.message }, 500)
      }
      tournaments = data || []
    }

    if (tournaments.length === 0) {
      return jsonResponse({ sent: 0, message: 'No tournaments to notify' })
    }

    // Load categories for names
    const { data: categories } = await db.from('categories').select('id, name, name_en')
    const catMap: Record<string, any> = {}
    if (categories) {
      for (const c of categories) catMap[c.id] = c
    }

    // Load courts for venue names
    const courtIds = tournaments.map(t => t.court_id).filter(Boolean)
    let courtMap: Record<string, string> = {}
    if (courtIds.length > 0) {
      const { data: courts } = await db.from('courts').select('id, name').in('id', courtIds)
      if (courts) {
        for (const c of courts) courtMap[c.id] = c.name
      }
    }

    const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')
    if (!groupChatId) {
      console.error('TELEGRAM_GROUP_CHAT_ID not set')
      return jsonResponse({ error: 'TELEGRAM_GROUP_CHAT_ID not configured' }, 500)
    }

    // Load all profiles with email for email notifications
    const { data: allProfiles } = await db
      .from('profiles')
      .select('email, notify_preferences')
      .not('email', 'is', null)

    let sent = 0
    let errors = 0
    let emailSent = 0

    for (const t of tournaments) {
      const catName = t.category_id && catMap[t.category_id]
        ? catMap[t.category_id].name
        : ''
      const venue = t.court_id && courtMap[t.court_id]
        ? courtMap[t.court_id]
        : (t.venue || '')

      // Format dates
      const dateStart = formatDate(t.date_start)
      const dateEnd = t.date_end ? formatDate(t.date_end) : ''
      const dateStr = dateEnd && dateEnd !== dateStart
        ? `${dateStart} – ${dateEnd}`
        : dateStart

      // Build message
      let text = `🎾 <b>Регистрация открыта!</b>\n\n`
      text += `🏆 <b>${escapeHtml(t.title || '')}</b>\n`
      text += `📅 ${dateStr}\n`
      if (venue) text += `📍 ${escapeHtml(venue)}\n`
      if (catName) text += `🎯 Категория: ${escapeHtml(catName)}\n`
      // Format & gender
      const fmtMap: Record<string, string> = { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' }
      const gdrMap: Record<string, string> = { men: '♂ Мужской', women: '♀ Женский', mixed: '⚤ Смешанный' }
      if (t.format && fmtMap[t.format]) text += `🎾 Формат: ${fmtMap[t.format]}\n`
      if (t.gender && gdrMap[t.gender]) text += `${gdrMap[t.gender]}\n`
      if (t.max_participants) text += `👥 Мест: ${t.max_participants}\n`

      // Inline keyboard: Register + Website
      const keyboard = {
        inline_keyboard: [[
          { text: '✅ Записаться', callback_data: `tournament_register:${t.id}` },
          { text: '🔗 На сайт', url: `${SITE_URL}/pages/tournament.html?id=${t.id}` }
        ]]
      }

      const ok = await sendMessageToGroup(groupChatId, text, keyboard)
      if (ok) {
        // Mark as notified
        await db
          .from('tournaments')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', t.id)
        sent++
      } else {
        errors++
      }

      // Email to all profiles with email
      for (const p of (allProfiles || [])) {
        if (p.email && shouldNotify(p.notify_preferences, 'email', 'tournaments')) {
          const ok = await callSendEmail(serviceKey, {
            to: p.email,
            subject: `🎾 Регистрация открыта: ${t.title}`,
            template: 'tournament-announcement',
            data: {
              title: t.title || '',
              dates: dateStr,
              venue: venue,
              category: catName,
              format: t.format ? (fmtMap[t.format] || t.format) : '',
              gender: t.gender ? (gdrMap[t.gender] || t.gender) : '',
              max_participants: t.max_participants,
              tournament_id: t.id
            }
          })
          if (ok) emailSent++
        }
      }
    }

    return jsonResponse({ sent, email_sent: emailSent, errors, total: tournaments.length })
  } catch (err) {
    console.error('tournament-notify error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})

// --- Helpers ---

function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
  if (!prefs) return true
  const ch = prefs[channel]
  if (!ch) return true
  return ch[cat] !== false
}

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

function formatDate(d: string): string {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
  return d
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

async function sendMessageToGroup(chatId: string, text: string, replyMarkup: unknown): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
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
