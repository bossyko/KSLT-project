// ============================================
// KSLT — Create Challenge Edge Function
// POST { opponent_player_id, message? }
//
// Вызов — это намерение сыграть, а не бронь корта. Дату, время и площадку
// назначает менеджер после того, как соперник согласится, поэтому здесь их
// не спрашивают: выбранная при отправке дата всё равно устаревает, пока
// человек думает.
//
// Все правила — членство KSLT, три неотвеченных вызова, две недели после
// отказа — живут в функции базы create_challenge. Правило, которое живёт в
// Edge Function, обходится прямым запросом к таблице.
//
// Telegram отсюда убран. Раньше именно он нёс кнопки «Принять / Отклонить»,
// а игроку без бота вызов вообще не отправлялся. Теперь ответ живёт на
// платформе: уведомление с кнопками в кабинете и в колокольчике.
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
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const { opponent_player_id, message } = await req.json()
    if (!opponent_player_id) {
      return json({ error: 'Missing opponent_player_id' }, 400)
    }

    // Заводим от имени вошедшего: функция сама смотрит, кто её вызвал
    const { data: created, error: rpcErr } = await userClient.rpc('create_challenge', {
      p_opponent_player_id: opponent_player_id,
      p_message: message ? String(message).slice(0, 150) : null
    })

    if (rpcErr) {
      console.error('create_challenge failed:', rpcErr)
      return json({ error: 'DB error' }, 500)
    }
    if (created?.error) {
      // Отказ по правилу — это не сбой: интерфейсу нужен код, чтобы
      // объяснить человеку, почему нельзя
      return json(created, 409)
    }

    const db = createClient(supabaseUrl, serviceKey)
    await загрузитьТексты(db)

    const { data: sender } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const senderName = sender?.full_name || 'Игрок KSLT'
    const opponentProfileId = created.opponent_profile_id as string | null

    // Уведомление сопернику. Кнопки «Принять» и «Отклонить» интерфейс
    // рисует сам по типу и ссылке на вызов
    if (opponentProfileId) {
      // Язык соперника: вызов придёт на его языке
      const { data: opponent } = await db
        .from('profiles')
        .select('email, notify_preferences, telegram_chat_id, lang')
        .eq('id', opponentProfileId)
        .single()
      const языкСоперника = языкИз(opponent)

      await db.from('notification_log').insert({
        profile_id: opponentProfileId,
        type: 'challenge',
        // Без эмодзи: значок рисует интерфейс по типу уведомления.
        // Буква в тексте означала бы, что смена знака требует переката
        // функции и правки всех уже разосланных записей
        title: т('challenge_title', языкСоперника),
        message: message
          ? т('challenge_with_message', языкСоперника, { 'имя': senderName, 'сообщение': String(message).slice(0, 150) })
          : т('challenge_no_message', языкСоперника, { 'имя': senderName }),
        is_read: false,
        action_type: 'challenge',
        action_id: created.challenge_id
      })

      // Telegram — дублирующий канал, без кнопок: отвечают на вызов на
      // платформе. Кнопки здесь означали бы второй механизм ответа, а
      // именно из-за него ответ и разошёлся с базой в прошлый раз
      const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (tgToken && opponent?.telegram_chat_id &&
          shouldNotify(opponent.notify_preferences, 'tg', 'challenges')) {
        const lines = [т('challenge_tg', языкСоперника, { 'имя': escapeHtml(senderName) })]
        if (message) lines.push('', `💬 <i>${escapeHtml(String(message).slice(0, 150))}</i>`)
        lines.push('', т('challenge_tg_tail', языкСоперника))

        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: opponent.telegram_chat_id,
            text: lines.join('\n'),
            parse_mode: 'HTML'
          })
        }).catch((e) => console.error('TG notify failed:', e))
      }

      // Почта — вдогонку: она работает, когда человек неделю не заходил.
      // Отключается тем же переключателем в настройках, что и раньше
      if (opponent?.email && shouldNotify(opponent.notify_preferences, 'email', 'challenges')) {
        await callSendEmail(serviceKey, {
          to: opponent.email,
          subject: т('mail_challenge_subject', языкСоперника, { 'имя': senderName }),
          template: 'challenge-received',
          data: { challenger_name: senderName, message: message || '', lang: языкСоперника }
        })
      }
    }

    return json({ success: true, challenge_id: created.challenge_id })

  } catch (err) {
    console.error('Edge function error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

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

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
