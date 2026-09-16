// ============================================
// KSLT — Challenge Answered Notification
// POST { challenge_id }
//
// Автору вызова сообщаем, что ему ответили. В колокольчик уведомление
// кладёт сама база, внутри respond_to_challenge: там же, где меняется
// статус, — иначе запись и уведомление могли бы разойтись.
//
// Сюда вынесено только то, до чего база не дотягивается: личное сообщение
// в Telegram и письмо. Это не механика ответа, а доставка — тот случай,
// ради которого мессенджер у нас и остался.
// ============================================

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

    const { challenge_id } = await req.json()
    if (!challenge_id) return json({ error: 'challenge_id required' }, 400)

    const db = createClient(supabaseUrl, serviceKey)
    await загрузитьТексты(db)

    const { data: ch } = await db
      .from('challenges')
      .select('id, status, challenger_id, opponent_profile_id, message')
      .eq('id', challenge_id)
      .single()

    if (!ch) return json({ error: 'not_found' }, 404)

    // Сообщить может только тот, кто отвечал: иначе любой вошедший мог бы
    // слать чужие уведомления запросом напрямую
    if (ch.opponent_profile_id !== user.id) return json({ error: 'forbidden' }, 403)
    if (ch.status !== 'accepted' && ch.status !== 'declined') {
      return json({ error: 'not_answered', status: ch.status }, 400)
    }

    const accepted = ch.status === 'accepted'

    const { data: opponent } = await db
      .from('profiles').select('full_name').eq('id', user.id).single()
    const { data: author } = await db
      .from('profiles')
      .select('telegram_chat_id, email, notify_preferences, lang')
      .eq('id', ch.challenger_id)
      .single()

    const who = opponent?.full_name || 'KSLT'
    // Весть идёт автору вызова — значит на его языке
    const языкАвтора = языкИз(author)
    const title = т(accepted ? 'challenge_accepted_title' : 'challenge_declined_title', языкАвтора)
    const body = т(accepted ? 'challenge_accepted_text' : 'challenge_declined_text', языкАвтора, { 'имя': who })

    let tgSent = false
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (token && author?.telegram_chat_id &&
        shouldNotify(author.notify_preferences, 'tg', 'challenges')) {
      const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: author.telegram_chat_id,
          text: `${accepted ? '🔥' : '❌'} <b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`,
          parse_mode: 'HTML'
        })
      })
      const data = await res.json()
      tgSent = !!data.ok
    }

    let mailSent = false
    if (author?.email && shouldNotify(author.notify_preferences, 'email', 'challenges')) {
      mailSent = await callSendEmail(serviceKey, {
        to: author.email,
        subject: title,
        template: 'challenge-answered',
        data: { opponent_name: who, accepted, lang: языкАвтора }
      })
    }

    return json({ success: true, tg_sent: tgSent, mail_sent: mailSent })

  } catch (err) {
    console.error('challenge-notify error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function shouldNotify(prefs: any, channel: 'tg' | 'email' | 'site', cat: string): boolean {
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
