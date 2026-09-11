// ============================================
// KSLT — Карточка игрока для нового участника
// Supabase Edge Function
// ============================================
//
// Карточки игроков всегда заводил клуб вручную, а учётная запись живёт
// отдельно. Человек, который только что зарегистрировался, упирался в стену:
// жмёт «Записаться», получает «аккаунт не связан с карточкой игрока» — и сам
// выйти из этого не может.
//
// Эта функция вызывается после любого входа: обычная регистрация, Google,
// Apple, iCloud, Telegram — всё равно. Что делает:
//
//   есть карточка          → ничего;
//   нашли похожую свободную → возвращаем её как кандидата, чтобы человек
//                             подтвердил сам: «кажется, это ваша карточка»;
//   не нашли               → заводим новую и привязываем.
//
// Молча чужую карточку не присваиваем: у людей, игравших раньше, там рейтинг,
// очки и история — ошибка стоила бы дорого.
//
// Deploy: supabase functions deploy ensure-player-card

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    let body: { ntrp?: number; confirm_player_id?: string } = {}
    try { body = await req.json() } catch { /* пустое тело — обычная проверка */ }

    const { data: профиль } = await db
      .from('profiles')
      .select('id, full_name, gender, player_id')
      .eq('id', user.id)
      .single()

    if (!профиль) return json({ error: 'profile_not_found' }, 404)
    if (профиль.player_id) return json({ ok: true, player_id: профиль.player_id, status: 'already' })

    // Человек подтвердил, что нашлась именно его карточка
    if (body.confirm_player_id) {
      const свободна = await картаСвободна(db, body.confirm_player_id)
      if (!свободна) return json({ error: 'player_taken' }, 409)
      await db.from('profiles').update({ player_id: body.confirm_player_id }).eq('id', профиль.id)
      return json({ ok: true, player_id: body.confirm_player_id, status: 'linked' })
    }

    const имя = (профиль.full_name || '').trim()
    if (!имя) return json({ ok: false, status: 'no_name' })

    // Ищем свою карточку по звучанию: в базе имена кириллицей, а входят часто
    // латиницей, и «Konstantin Han» должен узнаваться как «Константин Хан»
    const { data: все } = await db.from('players').select('id, name, name_en, category_id, points, ntrp_singles')
    const мой = ключ(имя)
    const похожие = (все || []).filter((p: any) =>
      ключ(p.name || '') === мой || (p.name_en ? ключ(p.name_en) === мой : false))

    for (const карточка of похожие) {
      if (await картаСвободна(db, карточка.id)) {
        // Не привязываем молча — пусть подтвердит сам
        return json({
          ok: true,
          status: 'candidate',
          candidate: {
            id: карточка.id,
            name: карточка.name,
            category_id: карточка.category_id,
            points: карточка.points,
            ntrp_singles: карточка.ntrp_singles
          }
        })
      }
    }

    // Своей карточки нет — заводим новую
    const основа = транслит(имя)
    let id = основа
    for (let i = 2; i < 30; i++) {
      const { data: занят } = await db.from('players').select('id').eq('id', id).maybeSingle()
      if (!занят) break
      id = основа + '-' + i
    }

    // Латиницей написанное имя кладём и в английское поле: в списках клуба
    // имена кириллицей, менеджеру будет с чем сверять
    const латиницей = !/[а-яё]/i.test(имя)
    const строка: Record<string, unknown> = { id, name: имя }
    if (латиницей) строка.name_en = имя
    if (профиль.gender === 'men' || профиль.gender === 'women') строка.gender = профиль.gender
    if (body.ntrp) строка.ntrp_singles = Number(body.ntrp)

    const { error: insErr } = await db.from('players').insert(строка)
    if (insErr) return json({ error: insErr.message }, 500)

    await db.from('profiles').update({ player_id: id }).eq('id', профиль.id)
    return json({ ok: true, player_id: id, status: 'created', latin: латиницей })
  } catch (err) {
    console.error('ensure-player-card:', err)
    return json({ error: String(err) }, 500)
  }
})

/** Карточку уже заняла чья-то учётная запись? */
async function картаСвободна(db: any, playerId: string): Promise<boolean> {
  const { data } = await db.from('profiles')
    .select('id').eq('player_id', playerId).is('deleted_at', null).maybeSingle()
  return !data
}

/**
 * Ключ имени для сверки: приводим к латинице, схлопываем то, что люди пишут
 * по-разному, и сортируем слова — «Хан Константин» и «Konstantin Han» дают
 * одинаковый ключ.
 */
function ключ(имя: string): string {
  return транслит(имя)
    .replace(/y/g, 'i')      // Айсулуу пишут и Aisuluu, и Aysuluu
    .replace(/(.)\1+/g, '$1') // двойные буквы: Aisuluu ↔ Айсулу
    .split('-').filter(Boolean).sort().join('-')
}

/** Имя латиницей: «Максим Серко» → «maksim-serko». */
function транслит(имя: string): string {
  const карта: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya'
  }
  return имя.toLowerCase().split('').map((с) => карта[с] !== undefined ? карта[с] : с)
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'player'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
