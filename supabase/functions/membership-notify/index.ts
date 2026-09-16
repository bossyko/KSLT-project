// ============================================
// KSLT — Membership Expiry Notification (Daily Cron)
// Supabase Edge Function
// ============================================
// Sends Telegram reminder 7 days before membership expires.
// Checks notification_log to prevent duplicates.
//
// Deploy: Supabase Dashboard → Edge Functions → New Function
// Required secrets: TELEGRAM_BOT_TOKEN, CRON_SECRET
//
// pg_cron setup (run in SQL Editor):
//   SELECT cron.schedule(
//     'membership-expiry-notify',
//     '0 4 * * *',  -- 04:00 UTC = 10:00 Bishkek
//     $$
//     SELECT net.http_post(
//       url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/membership-notify',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
//         'Content-Type', 'application/json'
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );

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

Deno.serve(async (req) => {
  // Verify cron secret or service role
  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')
  const expectedAuth = `Bearer ${cronSecret}`

  if (authHeader !== expectedAuth) {
    // Also allow Supabase service role key
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!authHeader.includes(serviceKey)) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
await загрузитьТексты(supabase)

    // Calculate target date: today + 7 days
    const target = new Date()
    target.setDate(target.getDate() + 7)
    const targetDate = target.toISOString().split('T')[0] // YYYY-MM-DD

    // Find active memberships expiring on target date
    const { data: memberships, error: memError } = await supabase
      .from('memberships')
      .select('id, profile_id, expires_at, profiles(full_name, telegram_chat_id, email, notify_preferences, lang)')
      .eq('status', 'active')
      .gte('expires_at', targetDate + 'T00:00:00')
      .lt('expires_at', targetDate + 'T23:59:59')

    if (memError) {
      console.error('Query error:', memError)
      return new Response(JSON.stringify({ error: memError.message }), { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No expiring memberships for ' + targetDate }), { status: 200 })
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    let sent = 0
    let emailSent = 0
    let skipped = 0

    for (const m of memberships) {
      const profile = m.profiles as any
      if (!profile) {
        skipped++
        continue
      }

      // Check notification_log for duplicates
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('membership_id', m.id)
        .eq('type', 'expiry_7d')
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      const name = profile.full_name || ''
      const expiresFormatted = m.expires_at ? m.expires_at.split('T')[0] : targetDate
      let notified = false

      // Send Telegram message
      if (profile.telegram_chat_id && shouldNotify(profile.notify_preferences, 'tg', 'membership')) {
        const text =
          `Здравствуйте${name ? ', ' + name : ''}! Ваше членство KSLT истекает через 7 дней (${expiresFormatted}).\n` +
          `Для продления оплатите 1000 сом/мес.\n` +
          `Подробнее: https://kslt.netlify.app/pages/pricing.html`

        const success = await sendMessage(profile.telegram_chat_id, text)
        if (success) { sent++; notified = true }
      }

      // Send email
      if (profile.email && shouldNotify(profile.notify_preferences, 'email', 'membership')) {
        const emailOk = await callSendEmail(serviceKey, {
          to: profile.email,
          subject: т('mail_mem_soon_subject', языкИз(profile)),
          template: 'membership-expiring',
          data: { name, expires_at: expiresFormatted, lang: языкИз(profile) }
        })
        if (emailOk) { emailSent++; notified = true }
      }

      if (notified) {
        // Log notification
        await supabase.from('notification_log').insert({
          profile_id: m.profile_id,
          membership_id: m.id,
          type: 'expiry_7d'
        })
      }
    }

    return new Response(
      JSON.stringify({ sent, email_sent: emailSent, skipped, total: memberships.length, targetDate }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Cron error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

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

async function sendMessage(chatId: number, text: string): Promise<boolean> {
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
        text: text
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
