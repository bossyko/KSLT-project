// ============================================
// KSLT — Спорный счёт: зовём организатора
// POST { match_id }
//
// Счёт вписывают сами игроки, и почти всегда второй его подтверждает.
// Но если он нажал «Не согласен», матч встаёт: сетка дальше не идёт, пока
// не разберётся человек. Значит человека надо позвать — и не в браузер,
// куда он заглядывает раз в день, а туда, где он есть всегда.
//
// Строку в колокольчике кладёт сама база, внутри notify_match_score:
// там же, где меняется состояние счёта, — иначе запись и уведомление
// могли бы разойтись.
//
// Сюда вынесено то, до чего база не дотягивается: Telegram и письмо.
// Шлём всем, кто может разобраться — администраторам и менеджерам.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Зовут либо база через net.http_post, либо админка — оба со служебным
    // ключом. Снаружи сюда ходить незачем
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''
    if (!serviceKey || !authHeader.includes(serviceKey)) {
      return json({ error: 'Unauthorized — service role only' }, 401)
    }

    const { match_id } = await req.json()
    if (!match_id) return json({ error: 'match_id required' }, 400)

    const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

    // ---- Что за матч ----
    const { data: m } = await db
      .from('matches')
      .select('id, score, score_dispute_note, player1_id, player2_id, tournament_id')
      .eq('id', match_id)
      .single()

    if (!m) return json({ error: 'match_not_found' }, 404)

    const ids = [m.player1_id, m.player2_id].filter(Boolean)
    const { data: players } = await db.from('players').select('id, name').in('id', ids)
    const имя = (id: string) => (players || []).find((p) => p.id === id)?.name || '—'

    let турнир = ''
    if (m.tournament_id) {
      const { data: t } = await db.from('tournaments').select('title').eq('id', m.tournament_id).single()
      турнир = t?.title || ''
    }

    const счёт = String(m.score || '').replace(/\//g, ':')
    const пара = `${имя(m.player1_id)} — ${имя(m.player2_id)}`

    const заголовок = 'Спорный счёт'
    const текст = `${пара}${турнир ? ' · ' + турнир : ''}\nВписано: ${счёт}` +
                  (m.score_dispute_note ? `\nПричина: ${m.score_dispute_note}` : '') +
                  '\n\nМатч не пойдёт дальше, пока счёт не подтвердят в админке.'

    // ---- Кому ----
    const { data: staff } = await db
      .from('profiles')
      .select('id, full_name, email, telegram_chat_id')
      .in('role', ['admin', 'manager'])

    if (!staff || staff.length === 0) {
      return json({ ok: true, sent: 0, note: 'персонала нет' })
    }

    const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    let вТелеграм = 0
    let наПочту = 0

    for (const s of staff) {
      // Telegram — быстрее всего доходит, поэтому первым
      if (tgToken && s.telegram_chat_id) {
        const ok = await fetch(`${TELEGRAM_API}${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: s.telegram_chat_id,
            text: `⚠️ <b>${заголовок}</b>\n\n${escapeHtml(текст)}`,
            parse_mode: 'HTML'
          })
        }).then((r) => r.ok).catch(() => false)
        if (ok) вТелеграм++
      }

      // Письмо — вдогонку: работает, когда Телеграма нет или он не читается
      if (s.email) {
        const ok = await callSendEmail(serviceKey, {
          to: s.email,
          subject: 'КСЛТ · спорный счёт матча',
          html: `<p style="font-size:14px;color:#3f4650;line-height:1.6">` +
                escapeHtml(текст).replace(/\n/g, '<br>') + '</p>'
        })
        if (ok) наПочту++
      }
    }

    return json({ ok: true, staff: staff.length, telegram: вТелеграм, email: наПочту })
  } catch (e) {
    console.error('[score-dispute-notify]', e)
    return json({ error: String(e) }, 500)
  }
})

function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
