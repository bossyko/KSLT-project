// ============================================
// KSLT — Сбор мировых новостей
// POST {} — зовёт расписание раз в три часа
//
// Обходит ленты источников и складывает находки в news_suggestions. На
// сайте их не видно: это черновики, которые ещё должен одобрить человек.
//
// Чужой текст не берём. Только заголовок, ссылка на первоисточник и его
// название — это агрегация ссылок, а не перепечатка. Описание из ленты не
// сохраняем сознательно: оно уже их текст. Картинки не трогаем вовсе.
//
// Разбираем ленту без сторонних библиотек: в Edge их держать накладно, а
// RSS и Atom устроены достаточно просто, чтобы обойтись поиском по строке.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Берём только то, что про теннис. Ленты бывают общеспортивные, и без
// сита в мировые новости КСЛТ попадёт футбол
const ПРО_ТЕННИС = /теннис|tennis|ATP|WTA|ITF|Roland Garros|Wimbledon|US Open|Australian Open|Ролан Гаррос|Уимблдон/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const authHeader = req.headers.get('Authorization') || ''
  if (!serviceKey || !authHeader.includes(serviceKey)) {
    return json({ error: 'Unauthorized — service role only' }, 401)
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  const { data: sources } = await db
    .from('news_sources')
    .select('id, name, feed_url, lang')
    .eq('active', true)

  if (!sources || sources.length === 0) return json({ ok: true, sources: 0 })

  let найдено = 0
  let добавлено = 0
  const сбои: string[] = []

  for (const s of sources) {
    try {
      const res = await fetch(s.feed_url, {
        headers: { 'User-Agent': 'KSLT news reader (kslt.kyrgyzstan@gmail.com)' },
        signal: AbortSignal.timeout(15000)
      })
      if (!res.ok) { сбои.push(`${s.name}: HTTP ${res.status}`); continue }

      const xml = await res.text()
      const items = разобрать(xml)
      найдено += items.length

      for (const it of items) {
        if (!it.title || !it.link) continue
        // Общеспортивные ленты сеем по теме, теннисные пропускаем как есть
        if (!ПРО_ТЕННИС.test(it.title) && !/tennis|теннис/i.test(s.feed_url)) continue

        const { error } = await db.from('news_suggestions').insert({
          source_id: s.id,
          title: it.title.slice(0, 300),
          link: it.link,
          link_key: ключ(it.link),
          source_name: s.name,
          lang: s.lang,
          published_at: it.date
        })
        // Повтор — не ошибка: одна и та же новость висит в ленте днями
        if (!error) добавлено++
      }

      await db.from('news_sources').update({ last_fetch: new Date().toISOString() }).eq('id', s.id)
    } catch (e) {
      сбои.push(`${s.name}: ${e}`)
    }
  }

  return json({ ok: true, sources: sources.length, найдено, добавлено, сбои })
})

// ---- Разбор ленты ----
//
// RSS кладёт записи в <item>, Atom — в <entry>. Ссылка в RSS лежит текстом,
// в Atom — атрибутом href. Больше различий нам не нужно.

function разобрать(xml: string): Array<{ title: string; link: string; date: string | null }> {
  const out: Array<{ title: string; link: string; date: string | null }> = []
  const блоки = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || []

  for (const b of блоки.slice(0, 30)) {
    const title = чисто(взять(b, 'title'))
    let link = чисто(взять(b, 'link'))
    if (!link) {
      const href = b.match(/<link[^>]*href=["']([^"']+)["']/i)
      if (href) link = href[1]
    }
    const дата = взять(b, 'pubDate') || взять(b, 'published') || взять(b, 'updated')
    let iso: string | null = null
    if (дата) {
      const d = new Date(дата.trim())
      if (!isNaN(d.getTime())) iso = d.toISOString()
    }
    if (title && link) out.push({ title, link: link.trim(), date: iso })
  }
  return out
}

function взять(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return m ? m[1] : ''
}

function чисто(s: string): string {
  return (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Ключ ссылки без меток отслеживания: с ними одна статья приходит дважды. */
function ключ(link: string): string {
  try {
    const u = new URL(link)
    u.search = ''
    u.hash = ''
    return (u.host + u.pathname).replace(/\/$/, '').toLowerCase()
  } catch {
    return link.toLowerCase()
  }
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
