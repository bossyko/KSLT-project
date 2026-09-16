// ============================================
// KSLT — Auto-Expire Memberships
// Supabase Edge Function (called by pg_cron)
// ============================================
// Runs daily. Finds memberships where status='active' AND expires_at < now(),
// sets status='expired', sends Telegram notification.
//
// Deploy: supabase functions deploy membership-expire --no-verify-jwt
// Secrets: TELEGRAM_BOT_TOKEN, CRON_SECRET

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Auth: CRON_SECRET only ---
  const authHeader = req.headers.get('Authorization') || ''
  const cronSecret = Deno.env.get('CRON_SECRET')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const db = createClient(supabaseUrl, serviceKey)
    await загрузитьТексты(db)
  const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

  try {
    const now = new Date().toISOString()

    // Find active memberships that have expired
    const { data: expired, error } = await db
      .from('memberships')
      .select('id, profile_id, expires_at, profiles(full_name, telegram_chat_id, email, notify_preferences, lang)')
      .eq('status', 'active')
      .lt('expires_at', now)

    if (error) {
      console.error('Query error:', error)
      return json({ error: error.message }, 500)
    }

    if (!expired || expired.length === 0) {
      return json({ ok: true, expired: 0 })
    }

    let expiredCount = 0

    for (const m of expired) {
      // Set status to expired
      const { error: upErr } = await db
        .from('memberships')
        .update({ status: 'expired' })
        .eq('id', m.id)

      if (upErr) {
        console.error(`Expire ${m.id} error:`, upErr)
        continue
      }

      expiredCount++
      console.log(`Auto-expired membership: ${m.id} (profile: ${m.profile_id})`)

      // Send Telegram notification
      const profile = m.profiles as any
      const name = profile?.full_name || ''
      if (tgToken && profile?.telegram_chat_id && shouldNotify(profile?.notify_preferences, 'tg', 'membership')) {
        await tgFetch(tgToken, 'sendMessage', {
          chat_id: profile.telegram_chat_id,
          text: т('mail_mem_end_body', языкИз(profile), { 'имя': name }),
          parse_mode: 'HTML'
        })
      }

      // Send email notification
      if (profile?.email && shouldNotify(profile?.notify_preferences, 'email', 'membership')) {
        await callSendEmail(serviceKey, {
          to: profile.email,
          subject: т('mail_mem_end_subject', языкИз(profile)),
          template: 'membership-expired',
          data: { name, lang: языкИз(profile) }
        })
      }

      // Log to notification_log
      await db.from('notification_log').insert({
        profile_id: m.profile_id,
        membership_id: m.id,
        type: 'expired'
      })
    }

    return json({ ok: true, expired: expiredCount })

  } catch (err) {
    console.error('Membership-expire error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

// ---- Helpers ----
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

async function tgFetch(token: string, method: string, body: Record<string, unknown>) {
  try {
    await fetch(`${TELEGRAM_API}${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch (e) {
    console.error(`TG ${method} error:`, e)
  }
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
