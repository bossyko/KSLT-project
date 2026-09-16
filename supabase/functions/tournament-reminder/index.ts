// ============================================
// KSLT — Tournament Reminder (3 days + 1 day)
// Supabase Edge Function
// ============================================
// Sends reminders before tournament start:
// - 3 days before: group message + DM to registered players
// - 1 day before:  group message + DM to registered players
//
// Cron only (pg_cron daily at 02:00 UTC = 08:00 Bishkek).
// Deduplication via tournaments.reminded_3d_at / reminded_1d_at.
//
// Deploy: supabase functions deploy tournament-reminder --no-verify-jwt
// Required secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_CHAT_ID, CRON_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// ТЕКСТЫ УВЕДОМЛЕНИЙ
// ============================================
//
// Лежат в таблице notification_texts — по одной строке на сообщение, три
// языка в колонках. В базе, а не в коде: переводы вычитывают люди со
// стороны, и правку в таблице видно сразу, без выкладки функции.
//
// Читаем один раз и держим в памяти: функция живёт между вызовами, и
// ходить в базу за каждой строчкой незачем.

type Язык = 'ru' | 'en' | 'kg'

let _тексты: Record<string, Record<string, string>> | null = null

async function загрузитьТексты(supabase: any) {
  // Пустое не запоминаем: одна неудачная попытка — и бот до перезапуска
  // отвечал бы ключами вместо текста
  if (_тексты && Object.keys(_тексты).length) return _тексты
  try {
    const { data, error } = await supabase.from('notification_texts').select('key, ru, kg, en')
    if (error) { console.error('тексты не прочитались:', error.message); return _тексты || {} }
    const свежие: Record<string, Record<string, string>> = {}
    for (const строка of (data || [])) {
      свежие[строка.key] = { ru: строка.ru, kg: строка.kg, en: строка.en }
    }
    if (Object.keys(свежие).length) _тексты = свежие
    else console.error('таблица notification_texts пуста')
  } catch (e) {
    console.error('тексты не прочитались:', e)
  }
  return _тексты || {}
}

/** Текст на языке человека. Нет перевода — русский. Нет строки — ключ. */
function т(ключ: string, язык: Язык = 'ru', подстановки: Record<string, string | number> = {}): string {
  const строка = _тексты?.[ключ]
  if (!строка) return ключ
  let текст = строка[язык] || строка.ru || ключ
  for (const имя in подстановки) {
    текст = текст.split('{' + имя + '}').join(String(подстановки[имя]))
  }
  return текст
}

/** Язык из уже загруженного профиля. */
function языкИз(профиль: any): Язык {
  const язык = профиль?.lang
  return (язык === 'en' || язык === 'kg') ? язык : 'ru'
}

/** Язык владельца чата. */
async function языкЧата(supabase: any, chatId: number): Promise<Язык> {
  try {
    const { data } = await supabase.from('profiles').select('lang').eq('telegram_chat_id', chatId).maybeSingle()
    return языкИз(data)
  } catch { return 'ru' }
}

/** Язык по идентификатору профиля. */
async function языкПрофиля(supabase: any, profileId: string): Promise<Язык> {
  try {
    const { data } = await supabase.from('profiles').select('lang').eq('id', profileId).maybeSingle()
    return языкИз(data)
  } catch { return 'ru' }
}

const TELEGRAM_API = 'https://api.telegram.org/bot'
const SITE_URL = 'https://kslt.netlify.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatDate(d: string): string {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
  return d
}

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

// --- Telegram helpers ---

async function sendTg(chatId: string | number, text: string, replyMarkup?: unknown): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) { console.error('TELEGRAM_BOT_TOKEN not set'); return false }

  try {
    const payload: any = { chat_id: chatId, text, parse_mode: 'HTML' }
    if (replyMarkup) payload.reply_markup = replyMarkup

    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!data.ok) { console.error('TG API error:', data); return false }
    return true
  } catch (err) {
    console.error('TG send error:', err)
    return false
  }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth: CRON_SECRET only
  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  const isCron = authHeader === `Bearer ${cronSecret}`
  const isServiceRole = authHeader.includes(serviceKey)

  if (!isCron && !isServiceRole) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
await загрузитьТексты(db)

    const groupChatId = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')
    if (!groupChatId) {
      return jsonResponse({ error: 'TELEGRAM_GROUP_CHAT_ID not configured' }, 500)
    }

    // Calculate target dates (UTC — cron runs at 02:00 UTC = 08:00 Bishkek)
    const now = new Date()
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const in1day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Find tournaments needing 3-day reminder
    const { data: tournaments3d } = await db
      .from('tournaments')
      .select('*')
      .eq('date_start', in3days)
      .is('reminded_3d_at', null)
      .neq('status', 'cancelled')

    // Find tournaments needing 1-day reminder
    const { data: tournaments1d } = await db
      .from('tournaments')
      .select('*')
      .eq('date_start', in1day)
      .is('reminded_1d_at', null)
      .neq('status', 'cancelled')

    const allTasks: { tournament: any; type: '3d' | '1d' }[] = []
    for (const t of (tournaments3d || [])) allTasks.push({ tournament: t, type: '3d' })
    for (const t of (tournaments1d || [])) allTasks.push({ tournament: t, type: '1d' })

    if (allTasks.length === 0) {
      return jsonResponse({ sent: 0, message: 'No tournaments to remind' })
    }

    // Load categories & courts for message enrichment
    const { data: categories } = await db.from('categories').select('id, name, name_en')
    const catMap: Record<string, any> = {}
    for (const c of (categories || [])) catMap[c.id] = c

    const courtIds = allTasks.map(t => t.tournament.court_id).filter(Boolean)
    const courtMap: Record<string, string> = {}
    if (courtIds.length > 0) {
      const { data: courts } = await db.from('courts').select('id, name').in('id', courtIds)
      for (const c of (courts || [])) courtMap[c.id] = c.name
    }

    let groupSent = 0
    let dmSent = 0
    let emailQueued = 0
    let errors = 0

    for (const task of allTasks) {
      const t = task.tournament
      const is3d = task.type === '3d'
      const daysLabel = is3d ? 'через 3 дня' : 'завтра'
      const daysEmoji = is3d ? '📢' : '🔔'

      const catName = t.category_id && catMap[t.category_id] ? catMap[t.category_id].name : ''
      const venue = t.court_id && courtMap[t.court_id] ? courtMap[t.court_id] : (t.venue || '')
      const dateStart = formatDate(t.date_start)
      const dateEnd = t.date_end ? formatDate(t.date_end) : ''
      const dateStr = dateEnd && dateEnd !== dateStart ? `${dateStart} – ${dateEnd}` : dateStart

      // Count current registrations
      const { count: regCount } = await db
        .from('tournament_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', t.id)
        .in('status', ['approved', 'pending'])

      const spotsInfo = t.max_participants
        ? `👥 Записано: ${regCount || 0}/${t.max_participants}`
        : `👥 Записано: ${regCount || 0}`

      // ---- 1. Group chat message ----
      let groupText = `${daysEmoji} <b>Турнир ${daysLabel}!</b>\n\n`
      groupText += `🏆 <b>${escapeHtml(t.title || '')}</b>\n`
      groupText += `📅 ${dateStr}\n`
      if (venue) groupText += `📍 ${escapeHtml(venue)}\n`
      if (catName) groupText += `🎯 Категория: ${escapeHtml(catName)}\n`
      groupText += `${spotsInfo}\n`

      // Registration still open? Add register button
      const regOpen = t.status === 'registration_open'
      const keyboard = regOpen ? {
        inline_keyboard: [[
          { text: '✅ Записаться', callback_data: `tournament_register:${t.id}` },
          { text: '🔗 Подробнее', url: `${SITE_URL}/pages/tournament.html?id=${t.id}` }
        ]]
      } : {
        inline_keyboard: [[
          { text: '🔗 Подробнее', url: `${SITE_URL}/pages/tournament.html?id=${t.id}` }
        ]]
      }

      const groupOk = await sendTg(groupChatId, groupText, keyboard)
      if (groupOk) groupSent++
      else errors++

      // ---- 2. DM to registered players ----
      const { data: registrations } = await db
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', t.id)
        .in('status', ['approved', 'pending'])

      if (registrations && registrations.length > 0) {
        const playerIds = registrations.map(r => r.player_id).filter(Boolean)

        if (playerIds.length > 0) {
          const { data: profiles } = await db
            .from('profiles')
            .select('player_id, full_name, telegram_chat_id, email, notify_preferences, lang')
            .in('player_id', playerIds)

          for (const p of (profiles || [])) {
            // TG DM
            if (p.telegram_chat_id && shouldNotify(p.notify_preferences, 'tg', 'tournaments')) {
              const name = p.full_name ? p.full_name.split(' ')[0] : ''
              let dmText = `${daysEmoji} <b>Напоминание: турнир ${daysLabel}!</b>\n\n`
              if (name) dmText += `${escapeHtml(name)}, `
              dmText += `вы записаны на турнир:\n\n`
              dmText += `🏆 <b>${escapeHtml(t.title || '')}</b>\n`
              dmText += `📅 ${dateStr}\n`
              if (venue) dmText += `📍 ${escapeHtml(venue)}\n`
              if (t.start_time) dmText += `⏰ Начало: ${escapeHtml(t.start_time)}\n`
              dmText += `\nУдачи на корте! 🎾`

              const dmOk = await sendTg(p.telegram_chat_id, dmText)
              if (dmOk) dmSent++
              else errors++
            }

            // Email
            if (p.email && shouldNotify(p.notify_preferences, 'email', 'tournaments')) {
              const emailOk = await callSendEmail(serviceKey, {
                to: p.email,
                subject: т('mail_trn_soon_subject', языкИз(p), {
                  'когда': т(is3d ? 'mail_trn_when_3days' : 'mail_trn_when_tomorrow', языкИз(p)),
                  'турнир': t.title
                }),
                template: 'tournament-reminder',
                data: {
                  title: t.title || '',
                  dates: dateStr,
                  venue: venue,
                  start_time: t.start_time || '',
                  player_name: name,
                  days: is3d ? 3 : 1,
                  tournament_id: t.id,
                  lang: языкИз(p)
                }
              })
              if (emailOk) emailQueued++
            }
          }
        }
      }

      // ---- 3. Mark as reminded ----
      const updateField = is3d ? 'reminded_3d_at' : 'reminded_1d_at'
      await db
        .from('tournaments')
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', t.id)
    }

    return jsonResponse({
      group_sent: groupSent,
      dm_sent: dmSent,
      email_queued: emailQueued,
      errors,
      tournaments: allTasks.length
    })

  } catch (err) {
    console.error('tournament-reminder error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
