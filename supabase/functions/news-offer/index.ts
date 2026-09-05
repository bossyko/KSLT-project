// ============================================
// KSLT — Предложить новость менеджерам
// POST {} — зовёт расписание дважды в день
//
// Берёт одну находку и шлёт её всем администраторам и менеджерам в
// Telegram с двумя кнопками: «Опубликовать» и «Пропустить».
//
// Шлём всем сразу, а не одному: это страховка. Кто первый нажал — того и
// решение, второму бот скажет, что уже обработано. Ответ обрабатывает
// telegram-webhook, там же, где вызовы и членство.
//
// Непринятое за сутки предложится снова, до трёх раз. Дальше забываем:
// новость недельной давности уже не новость.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org/bot'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const authHeader = req.headers.get('Authorization') || ''
  if (!serviceKey || !authHeader.includes(serviceKey)) {
    return json({ error: 'Unauthorized — service role only' }, 401)
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) return json({ error: 'no telegram token' }, 500)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  // Прибираем просроченное, чтобы не предлагать бесконечно
  await db.rpc('expire_old_suggestions')

  const { data: список } = await db.rpc('next_news_suggestion')
  const s = Array.isArray(список) ? список[0] : список
  if (!s) return json({ ok: true, note: 'предлагать нечего' })

  const { data: staff } = await db
    .from('profiles')
    .select('id, telegram_chat_id')
    .in('role', ['admin', 'manager'])
    .not('telegram_chat_id', 'is', null)

  if (!staff || staff.length === 0) {
    return json({ ok: true, note: 'ни у кого из персонала нет Телеграма' })
  }

  const текст =
    '📰 <b>Новость дня</b>\n\n' +
    `<b>${esc(s.title)}</b>\n\n` +
    `Источник: ${esc(s.source_name || '—')}\n` +
    `${esc(s.link)}\n\n` +
    '<i>Опубликуем заголовок со ссылкой на источник. Чужой текст и картинки не берём.</i>'

  const кнопки = {
    inline_keyboard: [[
      { text: '✅ Опубликовать', callback_data: `news_pub:${s.id}` },
      { text: '✖️ Пропустить',  callback_data: `news_skip:${s.id}` }
    ]]
  }

  let ушло = 0
  for (const m of staff) {
    const ok = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: m.telegram_chat_id,
        text: текст,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: кнопки
      })
    }).then((r) => r.ok).catch(() => false)
    if (ok) ушло++
  }

  await db.from('news_suggestions').update({
    status: 'offered',
    offered_at: new Date().toISOString(),
    offers: (s.offers || 0) + 1
  }).eq('id', s.id)

  return json({ ok: true, suggestion: s.id, sent: ушло, staff: staff.length })
})

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
