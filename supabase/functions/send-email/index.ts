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

const SITE_URL = 'https://kslt.netlify.app'
const FROM_EMAIL = 'KSLT <noreply@kslt.kg>'

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
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Inter',Arial,Helvetica,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
<!-- Header -->
<tr><td style="background-color:#1a1a1a;padding:24px 32px;border-bottom:1px solid #2a2a2a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-size:20px;font-weight:700;color:#CCFF00;letter-spacing:1px;">KSLT</span>
<span style="font-size:12px;color:#888;margin-left:8px;">Kyrgyzstan Social Lawn Tennis</span></td>
</tr></table>
</td></tr>
<!-- Content -->
<tr><td style="padding:32px;">
${content}
</td></tr>
<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid #2a2a2a;background-color:#111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:12px;color:#666;line-height:1.4;">
<a href="${SITE_URL}" style="color:#CCFF00;text-decoration:none;">kslt.netlify.app</a><br>
<a href="${SITE_URL}/pages/dashboard.html#notifications" style="color:#666;text-decoration:underline;">Настройки уведомлений</a>
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
  h1: 'font-size:22px;font-weight:700;color:#fff;margin:0 0 16px 0;',
  h2: 'font-size:18px;font-weight:600;color:#fff;margin:0 0 12px 0;',
  p: 'font-size:14px;color:#ccc;line-height:1.6;margin:0 0 12px 0;',
  accent: 'color:#CCFF00;',
  muted: 'font-size:13px;color:#888;',
  btn: 'display:inline-block;padding:12px 24px;background-color:#CCFF00;color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;',
  btnOutline: 'display:inline-block;padding:10px 20px;border:1px solid #CCFF00;color:#CCFF00;font-size:13px;font-weight:500;text-decoration:none;border-radius:8px;',
  divider: 'border:0;border-top:1px solid #2a2a2a;margin:20px 0;',
  tag: 'display:inline-block;padding:4px 10px;background-color:#2a2a2a;color:#CCFF00;font-size:12px;font-weight:500;border-radius:4px;',
  infoRow: 'font-size:14px;color:#ccc;line-height:1.8;margin:0;',
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
    case 'broadcast': return templateBroadcast(data)
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
  const daysLabel = d.days === 3 ? 'через 3 дня' : 'завтра'
  const content = `
<h1 style="${S.h1}">🔔 Турнир ${daysLabel}!</h1>
${d.player_name ? `<p style="${S.p}">Привет, ${esc(d.player_name)}!</p>` : ''}
<p style="${S.p}">Вы записаны на турнир:</p>
<h2 style="${S.h2}">${esc(d.title)}</h2>
<p style="${S.infoRow}">📅 ${esc(d.dates)}</p>
${d.venue ? `<p style="${S.infoRow}">📍 ${esc(d.venue)}</p>` : ''}
${d.start_time ? `<p style="${S.infoRow}">⏰ Начало: ${esc(d.start_time)}</p>` : ''}
<hr style="${S.divider}">
<p style="${S.p}">Удачи на корте! 🎾</p>
<a href="${SITE_URL}/pages/tournament.html?id=${d.tournament_id}" style="${S.btnOutline}">Подробнее</a>`
  return wrapLayout(content, `Турнир ${d.title} — ${daysLabel}`)
}

// --- 3. Membership Approved ---
function templateMembershipApproved(d: Record<string, any>): string {
  const actionLabel = d.action === 'granted' ? 'выдано' : d.action === 'extended' ? 'продлено' : 'обновлено'
  const content = `
<h1 style="${S.h1}">✅ Членство ${actionLabel}!</h1>
${d.name ? `<p style="${S.p}">${esc(d.name)}, ваше членство KSLT ${actionLabel}.</p>` : `<p style="${S.p}">Ваше членство KSLT ${actionLabel}.</p>`}
${d.expires_at ? `<p style="${S.infoRow}">📅 Действует до: <strong style="${S.accent}">${esc(d.expires_at)}</strong></p>` : ''}
<hr style="${S.divider}">
<p style="${S.p}">Теперь вам доступны все преимущества клуба: рейтинг, вызовы на матч, скидки у партнёров.</p>
<a href="${SITE_URL}/pages/dashboard.html" style="${S.btn}">Личный кабинет</a>`
  return wrapLayout(content, `Членство KSLT ${actionLabel}`)
}

// --- 4. Membership Expiring ---
function templateMembershipExpiring(d: Record<string, any>): string {
  const content = `
<h1 style="${S.h1}">⏰ Членство истекает через 7 дней</h1>
${d.name ? `<p style="${S.p}">Здравствуйте, ${esc(d.name)}!</p>` : ''}
<p style="${S.p}">Ваше членство KSLT истекает <strong style="${S.accent}">${esc(d.expires_at)}</strong>.</p>
<p style="${S.p}">Для продления оплатите 1000 сом/мес.</p>
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/pricing.html" style="${S.btn}">Продлить членство</a>`
  return wrapLayout(content, `Членство KSLT истекает ${d.expires_at}`)
}

// --- 5. Membership Expired ---
function templateMembershipExpired(d: Record<string, any>): string {
  const content = `
<h1 style="${S.h1}">❌ Членство истекло</h1>
${d.name ? `<p style="${S.p}">${esc(d.name)}, ваше членство KSLT истекло.</p>` : `<p style="${S.p}">Ваше членство KSLT истекло.</p>`}
<p style="${S.p}">Для продления используйте Telegram-бота или оплатите на сайте.</p>
<hr style="${S.divider}">
<a href="${SITE_URL}/pages/pricing.html" style="${S.btn}">Продлить</a>`
  return wrapLayout(content, 'Членство KSLT истекло')
}

// --- 6. Match Schedule ---
function templateMatchSchedule(d: Record<string, any>): string {
  let matchesHtml = ''
  if (d.matches && Array.isArray(d.matches)) {
    for (const m of d.matches) {
      matchesHtml += `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ccc;font-size:13px;">${esc(m.time)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;">${esc(m.opponent)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#888;font-size:13px;">${esc(m.court || '')}</td>
      </tr>`
    }
  }

  const content = `
<h1 style="${S.h1}">📋 Расписание матчей</h1>
${d.player_name ? `<p style="${S.p}">👤 ${esc(d.player_name)}</p>` : ''}
<h2 style="${S.h2}">${esc(d.tournament_title)}</h2>
${d.date ? `<p style="${S.infoRow}">📅 ${esc(d.date)}</p>` : ''}
<hr style="${S.divider}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
<tr style="background-color:#2a2a2a;">
  <th style="padding:8px 12px;text-align:left;color:#CCFF00;font-size:12px;font-weight:600;">Время</th>
  <th style="padding:8px 12px;text-align:left;color:#CCFF00;font-size:12px;font-weight:600;">Соперник</th>
  <th style="padding:8px 12px;text-align:left;color:#CCFF00;font-size:12px;font-weight:600;">Корт</th>
</tr>
${matchesHtml}
</table>
<p style="${S.p}">Удачи на корте! 🎾</p>
<a href="${SITE_URL}/pages/tournament.html?id=${d.tournament_id}" style="${S.btnOutline}">Подробнее</a>`
  return wrapLayout(content, `Расписание: ${d.tournament_title}`)
}

// --- 7. Challenge Received ---
function templateChallengeReceived(d: Record<string, any>): string {
  const content = `
<h1 style="${S.h1}">⚔️ Вызов на матч!</h1>
<p style="${S.p}"><strong style="color:#fff;">${esc(d.challenger_name)}</strong> предлагает матч:</p>
<p style="${S.infoRow}">📅 ${esc(d.date)}  ⏰ ${esc(d.time)}</p>
${d.venue ? `<p style="${S.infoRow}">📍 ${esc(d.venue)}</p>` : ''}
${d.message ? `<p style="${S.p};font-style:italic;">💬 ${esc(d.message)}</p>` : ''}
<hr style="${S.divider}">
<p style="${S.p}">Ответьте на вызов через Telegram-бота или в личном кабинете.</p>
<a href="${SITE_URL}/pages/dashboard.html" style="${S.btn}">Открыть кабинет</a>`
  return wrapLayout(content, `Вызов от ${d.challenger_name}`)
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
