
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
// ============================================
// KSLT — Send Email Edge Function (Resend)
// ============================================
// Centralized email sending with HTML templates.
// Called internally by other Edge Functions via service role key.
//
// POST { to, subject, template, data }  — templated email
// POST { to, subject, html }            — raw HTML email
//
// Without RESEND_API_KEY → logs and returns { sent: false, reason: 'no_api_key' }
//
// Deploy: supabase functions deploy send-email --no-verify-jwt
// Required secrets: RESEND_API_KEY (optional — graceful degradation)

// Адрес сайта в ссылках письма. Вынесен в настройку: при переезде на kslt.kg
// достаточно поменять секрет SITE_URL, не трогая код девяти функций.

const SITE_URL = Deno.env.get('SITE_URL') || 'https://kslt.netlify.app'
// Отправитель обязан быть на домене, подтверждённом в Resend, иначе письма
// отклоняются. Пока подтверждён tennis.kg; когда поднимется kslt.kg — сменить
// секрет EMAIL_FROM, не трогая код.
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'KSLT <info@tennis.kg>'

// Куда отвечать. Отправлять с gmail.com нельзя — чужой домен в Resend не
// подтвердить, письма будут отклонены. Поэтому уходит письмо с домена клуба,
// а нажатие «Ответить» ведёт на почтовый ящик, который читают
const REPLY_TO = Deno.env.get('EMAIL_REPLY_TO') || 'kslt.kyrgyzstan@gmail.com'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth: service role key only (internal calls)
  const authHeader = req.headers.get('Authorization') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!serviceKey || !authHeader.includes(serviceKey)) {
    return json({ error: 'Unauthorized — service role only' }, 401)
  }

  // Тексты писем лежат в базе — читаем один раз на жизнь функции
  await загрузитьТексты(createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey
  ))

  try {
    const { to, subject, template, data, html: rawHtml } = await req.json()

    if (!to || !subject) {
      return json({ error: 'Missing to or subject' }, 400)
    }

    // Build HTML body
    let htmlBody: string

    if (rawHtml) {
      htmlBody = rawHtml
    } else if (template) {
      htmlBody = renderTemplate(template, data || {})
    } else {
      return json({ error: 'Provide template+data or html' }, 400)
    }

    // Check for Resend API key
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.log(`[send-email] No RESEND_API_KEY — skipping email to ${to}, subject: ${subject}`)
      return json({ sent: false, reason: 'no_api_key' })
    }

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        reply_to: REPLY_TO,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: htmlBody
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[send-email] Resend error ${res.status}:`, err)
      return json({ sent: false, reason: 'resend_error', status: res.status }, 502)
    }

    const result = await res.json()
    console.log(`[send-email] Sent to ${to}, id: ${result.id}`)
    return json({ sent: true, id: result.id })

  } catch (err) {
    console.error('[send-email] Error:', err)
    return json({ error: String(err) }, 500)
  }
})

// ============================================
// CORS & helpers
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ============================================
// Email layout wrapper
// ============================================

function wrapLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>KSLT</title></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Inter',Arial,Helvetica,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
<!-- Header -->
<tr><td style="background-color:#ffffff;padding:24px 32px;border-bottom:1px solid #e6e8eb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-size:20px;font-weight:700;color:#4e6b00;letter-spacing:1px;">KSLT</span>
<span style="font-size:12px;color:#7a828c;margin-left:8px;">Kyrgyzstan Social Lawn Tennis</span></td>
</tr></table>
</td></tr>
<!-- Content -->
<tr><td style="padding:32px;">
${content}
</td></tr>
<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid #e6e8eb;background-color:#fafbfc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:12px;color:#7a828c;line-height:1.4;">
<a href="${SITE_URL}" style="color:#4e6b00;text-decoration:none;">kslt.netlify.app</a><br>
<a href="${SITE_URL}/pages/dashboard.html#notifications" style="color:#7a828c;text-decoration:underline;">Настройки уведомлений</a>
<div style="margin-top:10px;color:#8a919b;">Ответить на это письмо можно — оно придёт на
<a href="mailto:${REPLY_TO}" style="color:#7a828c;text-decoration:underline;">${REPLY_TO}</a></div>
</td>
</tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

// ============================================
// Shared styles
// ============================================

const S = {
  h1: 'font-size:22px;font-weight:700;color:#14161a;margin:0 0 16px 0;',
  h2: 'font-size:18px;font-weight:600;color:#14161a;margin:0 0 12px 0;',
  p: 'font-size:14px;color:#3f4650;line-height:1.6;margin:0 0 12px 0;',
  accent: 'color:#4e6b00;',
  muted: 'font-size:13px;color:#7a828c;',
  btn: 'display:inline-block;padding:12px 24px;background-color:#CCFF00;color:#14161a;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;',
  btnOutline: 'display:inline-block;padding:10px 20px;border:1px solid #9fc400;color:#4e6b00;font-size:13px;font-weight:500;text-decoration:none;border-radius:8px;',
  divider: 'border:0;border-top:1px solid #e6e8eb;margin:20px 0;',
  tag: 'display:inline-block;padding:4px 10px;background-color:#f0f8cc;color:#4e6b00;font-size:12px;font-weight:500;border-radius:4px;',
  infoRow: 'font-size:14px;color:#3f4650;line-height:1.8;margin:0;',
}

// ============================================
// Template rendering
// ============================================

function renderTemplate(template: string, data: Record<string, any>): string {
  switch (template) {
    case 'tournament-announcement': return templateTournamentAnnouncement(data)
    case 'tournament-reminder': return templateTournamentReminder(data)
    case 'membership-approved': return templateMembershipApproved(data)
    case 'membership-expiring': return templateMembershipExpiring(data)
    case 'membership-expired': return templateMembershipExpired(data)
    case 'match-schedule': return templateMatchSchedule(data)
    case 'challenge-received': return templateChallengeReceived(data)
    case 'game-invite': return templateGameInvite(data)
    case 'game-invite-answered': return templateGameInviteAnswered(data)
    case 'challenge-answered': return templateChallengeAnswered(data)
    case 'security-alert': return templateSecurityAlert(data)
    case 'broadcast': return templateBroadcast(data)
    case 'otp-code': return templateOtpCode(data)
    default:
      console.warn(`[send-email] Unknown template: ${template}`)
      return wrapLayout(`<p style="${S.p}">No template found: ${esc(template)}</p>`)
  }
}

// --- 1. Tournament Announcement ---
function templateTournamentAnnouncement(d: Record<string, any>): string {
  const content = `
<h1 style="${S.h1}">🎾 Регистрация открыта!</h1>
<h2 style="${S.h2}">${esc(d.title)}</h2>
<p style="${S.infoRow}">📅 ${esc(d.dates)}</p>
${d.venue ? `<p style="${S.infoRow}">📍 ${esc(d.venue)}</p>` : ''}
${d.category ? `<p style="${S.infoRow}">🎯 Категория: ${esc(d.category)}</p>` : ''}
${d.max_participants ? `<p style="${S.infoRow}">👥 Мест: ${d.max_participants}</p>` : ''}
<hr style="${S.divider}">
<p style="${S.p}">Записывайтесь на турнир через сайт или Telegram-бота.</p>
<a href="${SITE_URL}/pages/tournament.html?id=${d.tournament_id}" style="${S.btn}">Записаться</a>`
  return wrapLayout(content, `Регистрация на ${d.title} открыта`)
}

// --- 2. Tournament Reminder ---
function templateTournamentReminder(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const когда = т(d.days === 3 ? 'mail_trn_when_3days' : 'mail_trn_when_tomorrow', язык)
  const заголовок = т('mail_trn_soon_subject', язык, { 'когда': когда, 'турнир': esc(d.title) })
  const тело = т('mail_trn_soon_body', язык, {
    'имя': d.player_name ? esc(d.player_name) : '',
    'даты': esc(d.dates),
    'место': d.venue ? esc(d.venue) : '—'
  })
  const content = `
<h1 style="${S.h1}">🔔 ${esc(когда)}</h1>
${тело.split('\n\n').map((абзац) => `<p style="${S.p}">${абзац.split('\n').join('<br>')}</p>`).join('')}
<h2 style="${S.h2}">${esc(d.title)}</h2>
${d.start_time ? `<p style="${S.infoRow}">⏰ ${т('mail_trn_start', язык)}: ${esc(d.start_time)}</p>` : ''}
<hr style="${S.divider}">
${d.board ? `<p style="${S.muted}">${т('mail_trn_queue_note', язык)}</p>` : ''}
<p style="${S.p}">${т('mail_trn_good_luck', язык)}</p>
<a href="${SITE_URL}/pages/tournament.html?id=${d.tournament_id}" style="${S.btnOutline}">${кнопка('tournament', язык)}</a>`
  return wrapLayout(content, заголовок)
}

// --- 3. Membership Approved ---
function templateMembershipApproved(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const заголовок = т('mail_mem_ok_subject', язык)
  const тело = т('mail_mem_ok_body', язык, {
    'имя': d.name ? esc(d.name) : '',
    'дата': d.expires_at ? esc(d.expires_at) : ''
  })
  const content = `
<h1 style="${S.h1}">✅ ${esc(заголовок)}</h1>
${тело.split('\n\n').map((абзац) => `<p style="${S.p}">${абзац}</p>`).join('')}
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/dashboard.html" style="${S.btn}">${кнопка('dashboard', язык)}</a>`
  return wrapLayout(content, заголовок)
}


// Подписи кнопок в письмах. Отдельно от словаря: это не сообщения, а
// органы управления — короткие и повторяются во многих письмах
const КНОПКИ: Record<string, Record<string, string>> = {
  dashboard: { ru: 'Личный кабинет', kg: 'Жеке кабинет', en: 'My dashboard' },
  renew:     { ru: 'Продлить членство', kg: 'Мүчөлүктү узартуу', en: 'Renew membership' },
  open:      { ru: 'Открыть', kg: 'Ачуу', en: 'Open' },
  tournament:{ ru: 'Страница турнира', kg: 'Турнир барагы', en: 'Tournament page' }
}

/** Язык письма: его присылает функция, которая заказала письмо. */
function языкПисьма(d: Record<string, any>): Язык {
  return (d.lang === 'en' || d.lang === 'kg') ? d.lang : 'ru'
}

/** Подпись кнопки на языке письма. */
function кнопка(ключ: string, язык: Язык): string {
  return КНОПКИ[ключ]?.[язык] || КНОПКИ[ключ]?.ru || ''
}

// --- 4. Membership Expiring ---
function templateMembershipExpiring(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const заголовок = т('mail_mem_soon_subject', язык)
  const тело = т('mail_mem_soon_body', язык, {
    'имя': d.name ? esc(d.name) : '',
    'дата': esc(d.expires_at),
    'сумма': d.price || 1000
  })
  const content = `
<h1 style="${S.h1}">${esc(заголовок)}</h1>
${тело.split('\n\n').map((абзац) => `<p style="${S.p}">${абзац}</p>`).join('')}
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/pricing.html" style="${S.btn}">${кнопка('renew', язык)}</a>`
  return wrapLayout(content, заголовок)
}

// --- 5. Membership Expired ---
function templateMembershipExpired(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const заголовок = т('mail_mem_end_subject', язык)
  const тело = т('mail_mem_end_body', язык, { 'имя': d.name ? esc(d.name) : '' })
  const content = `
<h1 style="${S.h1}">${esc(заголовок)}</h1>
${тело.split('\n\n').map((абзац) => `<p style="${S.p}">${абзац}</p>`).join('')}
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/pricing.html" style="${S.btn}">${кнопка('renew', язык)}</a>`
  return wrapLayout(content, заголовок)
}

// --- 6. Match Schedule ---
function templateMatchSchedule(d: Record<string, any>): string {
  let matchesHtml = ''
  if (d.matches && Array.isArray(d.matches)) {
    for (const m of d.matches) {
      // Общая доска запусков: свои игры выделяем, иначе в длинном списке
      // человеку придётся искать себя глазами
      const фон = m.mine ? 'background-color:#f6ffd9;' : ''
      const жирный = m.mine ? 'font-weight:700;' : ''
      matchesHtml += `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e6e8eb;color:#3f4650;font-size:13px;${фон}${жирный}">${m.mine ? '▶ ' : ''}${esc(m.time)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e6e8eb;color:#14161a;font-size:13px;${фон}${жирный}">${esc(m.opponent)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e6e8eb;color:#7a828c;font-size:13px;${фон}">${esc(m.court || '')}</td>
      </tr>`
    }
  }

  const content = `
<h1 style="${S.h1}">📋 ${d.board ? 'Расписание запусков' : 'Расписание матчей'}</h1>
${d.player_name ? `<p style="${S.p}">👤 ${esc(d.player_name)}</p>` : ''}
<h2 style="${S.h2}">${esc(d.tournament_title)}</h2>
${d.date ? `<p style="${S.infoRow}">📅 ${esc(d.date)}</p>` : ''}
<hr style="${S.divider}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
<tr style="background-color:#f4f5f7;">
  <th style="padding:8px 12px;text-align:left;color:#4e6b00;font-size:12px;font-weight:600;">Время</th>
  <th style="padding:8px 12px;text-align:left;color:#4e6b00;font-size:12px;font-weight:600;">${d.board ? 'Игра' : 'Соперник'}</th>
  <th style="padding:8px 12px;text-align:left;color:#4e6b00;font-size:12px;font-weight:600;">Корт</th>
</tr>
${matchesHtml}
</table>
<p style="${S.p}">Удачи на корте! 🎾</p>
<a href="${SITE_URL}/pages/tournament.html?id=${d.tournament_id}" style="${S.btnOutline}">Подробнее</a>`
  return wrapLayout(content, `Расписание: ${d.tournament_title}`)
}

// --- 7. Challenge Received ---
/**
 * Оповещение о действии с учётной записью: вход с нового устройства,
 * смена пароля, почты или телефона. Шаблона тоже не было — письма о
 * безопасности уходили с той же строкой об отсутствии шаблона.
 */
function templateSecurityAlert(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const заголовок = т('mail_security_subject', язык)
  // Что именно случилось, присылает вызывающая функция: смена пароля,
  // новое устройство, смена почты. Своего текста нет — берём общий
  const тело = т('mail_security_body', язык, { 'имя': d.name ? esc(d.name) : '' })
  const абзацы = тело.split('\n\n')
  if (d.message_ru && язык === 'ru') абзацы[1] = esc(d.message_ru)
  const content = `
<h1 style="${S.h1}">🔐 ${esc(заголовок)}</h1>
${абзацы.map((абзац) => `<p style="${S.p}">${абзац}</p>`).join('')}
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/dashboard.html#settings" style="${S.btn}">${кнопка('open', язык)}</a>`
  return wrapLayout(content, заголовок)
}

/**
 * Ответ на вызов. Шаблона не было вовсе: challenge-notify его звал, а в
 * списке он отсутствовал — и человеку уходило письмо со строкой
 * «No template found: challenge-answered» вместо текста.
 */
function templateChallengeAnswered(d: Record<string, any>): string {
  const yes = d.accepted === true || d.accepted === 'true'
  const who = esc(d.opponent_name || 'Соперник')
  const content = yes
    ? `
<h1 style="${S.h1}">🔥 Вызов принят!</h1>
<p style="${S.p}"><strong style="color:#14161a;">${who}</strong> принял ваш вызов.</p>
<p style="${S.p}">Договоритесь о дате, времени и корте — и выходите на матч.</p>
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/dashboard.html#games" style="${S.btn}">Открыть кабинет</a>`
    : `
<h1 style="${S.h1}">Вызов отклонён</h1>
<p style="${S.p}"><strong style="color:#14161a;">${who}</strong> отказался от матча.</p>
<p style="${S.p}">Ничего страшного — предложите игру другому сопернику.</p>
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/players.html" style="${S.btn}">Найти соперника</a>`
  return wrapLayout(content, yes ? `${d.opponent_name} принял вызов` : `${d.opponent_name} отклонил вызов`)
}

/**
 * Приглашение поиграть — не то же, что вызов на матч. Раньше оно уходило
 * по шаблону вызова: человек получал письмо «⚔️ Вызов на матч!» с пустыми
 * датой и временем, потому что у приглашения их нет и быть не может —
 * когда и где играть, договариваются сами.
 */
function templateGameInvite(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const заголовок = т('mail_invite_subject', язык, { 'имя': esc(d.sender_name) })
  const тело = т('mail_invite_body', язык)
  const content = `
<h1 style="${S.h1}">${esc(заголовок)}</h1>
${тело.split('\n\n').map((абзац) => `<p style="${S.p}">${абзац}</p>`).join('')}
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/dashboard.html#games" style="${S.btn}">${кнопка('open', язык)}</a>`
  return wrapLayout(content, заголовок)
}

/**
 * Ответ на приглашение поиграть — отправителю. Раньше об ответе сообщал
 * только Телеграм-бот, и человек без Телеграма не узнавал ничего.
 */
function templateGameInviteAnswered(d: Record<string, any>): string {
  const yes = d.accepted === true || d.accepted === 'true'
  const who = esc(d.opponent_name || 'Игрок')
  const content = yes
    ? `
<h1 style="${S.h1}">🎾 Приглашение принято</h1>
<p style="${S.p}"><strong style="color:#14161a;">${who}</strong> согласился сыграть.</p>
<p style="${S.p}">Откройте кабинет — там его контакты. Дальше договоритесь сами.</p>
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/dashboard.html#games" style="${S.btn}">Открыть кабинет</a>`
    : `
<h1 style="${S.h1}">Приглашение отклонено</h1>
<p style="${S.p}"><strong style="color:#14161a;">${who}</strong> отказался от игры.</p>
<p style="${S.p}">Ничего страшного — предложите игру другому.</p>
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/partners.html" style="${S.btn}">Найти партнёра</a>`
  return wrapLayout(content, yes ? `${d.opponent_name} согласился сыграть` : `${d.opponent_name} отказался`)
}

function templateChallengeReceived(d: Record<string, any>): string {
  const язык = языкПисьма(d)
  const заголовок = т('mail_challenge_subject', язык, { 'имя': esc(d.challenger_name) })
  const тело = т('mail_challenge_body', язык, {
    'дата': esc(d.date), 'время': esc(d.time), 'место': d.venue ? esc(d.venue) : '—'
  })
  const content = `
<h1 style="${S.h1}">${esc(заголовок)}</h1>
${тело.split('\n\n').map((абзац) => `<p style="${S.infoRow}">${абзац.split('\n').join('<br>')}</p>`).join('')}
${d.message ? `<p style="${S.p};font-style:italic;">💬 ${esc(d.message)}</p>` : ''}
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/dashboard.html" style="${S.btn}">${кнопка('dashboard', язык)}</a>`
  return wrapLayout(content, заголовок)
}

// --- 8. Broadcast ---
function templateBroadcast(d: Record<string, any>): string {
  // Convert newlines to <br> for plain text messages
  const messageHtml = esc(d.message || '').replace(/\n/g, '<br>')
  const content = `
<h1 style="${S.h1}">${esc(d.subject || 'Уведомление KSLT')}</h1>
<div style="${S.p}">${messageHtml}</div>
${d.link ? `<hr style="${S.divider}"><a href="${esc(d.link)}" style="${S.btn}">${esc(d.link_text || 'Подробнее')}</a>` : ''}`
  return wrapLayout(content, d.subject || 'Сообщение от KSLT')
}

// --- 9. OTP Code ---
// Цифры кода — тёмным по белому, а не акцентным лаймом. Письмо свёрстано
// тёмным, но Apple Mail в светлой теме выворачивает тёмные цвета в светлые:
// белый текст становится тёмным и читается, а лайм выворачивать нечего —
// он остаётся светлым на светлом, и код пропадает. Чёрное с белым читается
// при любом раскладе, потому что выворачивается целиком.
function templateOtpCode(d: Record<string, any>): string {
  // Язык письма приходит от той функции, которая его заказала: она знает,
  // кому пишет. Нет языка — русский
  const язык: Язык = (d.lang === 'en' || d.lang === 'kg') ? d.lang : 'ru'
  const flowLabel = d.flow === 'forgot_password'
    ? т('mail_otp_flow_forgot', язык)
    : т('mail_otp_flow_register', язык)
  const заголовок = т('mail_otp_subject', язык)
  const строкаКода = язык === 'en' ? `Your code for ${esc(flowLabel)}:`
    : (язык === 'kg' ? `${esc(flowLabel)} үчүн кодуңуз:` : `Ваш код для ${esc(flowLabel)}:`)
  const content = `
<h1 style="${S.h1}">🔐 ${esc(заголовок)}</h1>
<p style="${S.p}">${строкаКода}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td align="center">
<div style="display:inline-block;padding:16px 32px;background-color:#f9ffe0;border:2px solid #9fc400;border-radius:12px;">
<span style="font-size:32px;font-weight:700;color:#111111;letter-spacing:8px;font-family:'Courier New',monospace;">${esc(d.code)}</span>
</div>
</td></tr>
</table>
<p style="${S.muted}">${язык === 'en' ? 'The code is valid for <strong style="color:#14161a;">10 minutes</strong>.'
    : (язык === 'kg' ? 'Код <strong style="color:#14161a;">10 мүнөт</strong> жарактуу.'
    : 'Код действителен <strong style="color:#14161a;">10 минут</strong>.')}</p>
<hr style="${S.divider}">
<p style="${S.muted}">${язык === 'en' ? 'If you did not request it, please disregard this email.'
    : (язык === 'kg' ? 'Эгер сиз код сурабаган болсоңуз, бул катка көңүл бурбаңыз.'
    : 'Если вы не запрашивали код — не обращайте внимания на это письмо.')}</p>`
  return wrapLayout(content, `${esc(заголовок)}: ${d.code}`)
}
