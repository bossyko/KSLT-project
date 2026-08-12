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
      await db.from('notification_log').insert({
        profile_id: opponentProfileId,
        type: 'challenge',
        // Без эмодзи: значок рисует интерфейс по типу уведомления.
        // Буква в тексте означала бы, что смена знака требует переката
        // функции и правки всех уже разосланных записей
        title: 'Вызов на матч',
        message: message
          ? `${senderName} вызывает вас на баттл: «${String(message).slice(0, 150)}»`
          : `${senderName} вызывает вас на баттл`,
        is_read: false,
        action_type: 'challenge',
        action_id: created.challenge_id
      })

      const { data: opponent } = await db
        .from('profiles')
        .select('email, notify_preferences')
        .eq('id', opponentProfileId)
        .single()

      // Почта — вдогонку: она работает, когда человек неделю не заходил.
      // Отключается тем же переключателем в настройках, что и раньше
      if (opponent?.email && shouldNotify(opponent.notify_preferences, 'email', 'challenges')) {
        await callSendEmail(serviceKey, {
          to: opponent.email,
          subject: `🔥 Вызов на матч от ${senderName}`,
          template: 'challenge-received',
          data: { challenger_name: senderName, message: message || '' }
        })
      }
    }

    return json({ success: true, challenge_id: created.challenge_id })

  } catch (err) {
    console.error('Edge function error:', err)
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

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
