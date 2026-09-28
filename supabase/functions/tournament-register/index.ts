  // ============================================
  // KSLT — Tournament Registration Edge Function
  // POST { tournament_id, partner_id?, partner_external_name?, partner_external_ntrp?,
  //        partner_gender?, partner_external_country? }
  //
  // Решает судьбу заявки по правилам допуска и возвращает результат клиенту.
  // Вся логика здесь, а не на клиенте: вытеснение меняет чужую заявку,
  // а решение о статусе нельзя доверять браузеру.
  //
  // Ответ: { status: 'approved' | 'waitlist' | 'blocked', reason, rank?, displaced? }
  // reason — код для локализации на клиенте, не текст.
  //
  // ДЕПЛОЙ: «Verify JWT with legacy secret» в настройках функции — ВЫКЛЮЧЕНО,
  // как и у остальных функций проекта. Авторизацию функция проверяет сама:
  // getUser() → 401, дальше карточка игрока, бан, членство, оплата.
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

  // Заявки, занимающие место в основной сетке
  const MAIN_DRAW_STATUSES = ['approved', 'pending', 'draw']

  // Правило допуска: топ-10 нижней категории проходит автоматом, 11-20 в лист ожидания
  const AUTO_RANK_LIMIT = 10
  const WAITLIST_RANK_LIMIT = 20

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

      const db = createClient(supabaseUrl, serviceKey)
      await загрузитьТексты(db)

      const body = await req.json()
      const tournamentId = body.tournament_id
      if (!tournamentId) return json({ error: 'Missing tournament_id' }, 400)

      // ---- Кто подаёт заявку ----
      // Обычный режим: токен пользователя из браузера или приложения.
      // Серверный режим: телеграм-бот знает игрока по telegram_chat_id, токена
      // пользователя у него нет — вызывает с сервисным ключом и явным player_id.
      const isServiceCall = authHeader === 'Bearer ' + serviceKey
      let profile: any = null

      if (isServiceCall && body.player_id) {
        const { data } = await db
          .from('profiles')
          .select('id, full_name, player_id, role, gender, lang')
          .eq('player_id', body.player_id)
          .maybeSingle()
        profile = data
      } else {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } }
        })
        const { data: { user }, error: authErr } = await userClient.auth.getUser()
        if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

        const { data } = await db
          .from('profiles')
          .select('id, full_name, player_id, role, gender, lang')
          .eq('id', user.id)
          .single()
        profile = data
      }

      if (!profile) return json({ error: 'profile_not_found' }, 400)

      // Причины отказа и лист ожидания — на языке того, кто подаёт заявку
      const языкЗаявителя = языкИз(profile)
      if (!profile.player_id) return json({ error: 'no_player' }, 400)

      const isStaff = profile.role === 'admin' || profile.role === 'manager'

      const { data: player } = await db
        .from('players')
        .select('id, name, category_id, gender, points, ntrp_singles, ntrp_doubles, banned_until')
        .eq('id', profile.player_id)
        .single()

      if (!player) return json({ error: 'player_not_found' }, 400)

      if (player.banned_until && new Date(player.banned_until) > new Date()) {
        return json({ error: 'banned' }, 403)
      }

      // ---- Турнир ----
      const { data: tournament } = await db
        .from('tournaments')
        .select('id, title, category_id, gender, format, status, max_participants, reserved_spots, ntrp_min, ntrp_max, ntrp_combined_max, level_id')
        .eq('id', tournamentId)
        .single()

      if (!tournament) return json({ error: 'tournament_not_found' }, 404)

      if (['completed', 'cancelled', 'ongoing'].includes(tournament.status)) {
        return json({ error: 'registration_closed' }, 400)
      }

      // ---- Уже подавал? ----
      //
      // Берём строку целиком, а не id со статусом. Выход из пары смотрит на
      // player_id и partner_id этой записи: с урезанным набором полей
      // player_id был undefined, подавший не признавался капитаном, и вместо
      // себя он вычёркивал из заявки напарника
      const { data: existing } = await db
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', player.id)
        .maybeSingle()

      // Заявка принадлежит паре, а не тому, кто её подал: напарник тоже должен
      // ею распоряжаться — заменить второго номера или выйти самому. Иначе один
      // человек снимает заявку, и второй остаётся ни с чем, даже не узнав
      if (!existing && (body.change_partner || body.leave_pair)) {
        const { data: какНапарник } = await db
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('partner_id', player.id)
          .not('status', 'in', '("withdrawn","rejected")')
          .maybeSingle()
        if (какНапарник) {
          // Второй номер распоряжается заявкой наравне с подавшим — и так же
          // теряет это право, когда сетка собрана
          if (какНапарник.status === 'draw' || какНапарник.group_number != null ||
              какНапарник.draw_position != null) {
            return json({ error: 'entry_in_draw' }, 409)
          }
          if (body.leave_pair) return await выйтиИзПары(db, какНапарник, player.id, serviceKey)
          return await сменитьНапарника(db, какНапарник, body, player, tournament, serviceKey)
        }
        // Живой заявки нет. Раньше второй номер в этом месте молча проваливался
        // в обычную регистрацию и заводил себе отдельную заявку — пара
        // распадалась, хотя человек всего лишь менял напарника
        return json({ error: 'entry_not_active' }, 409)
      }

      // Заявка вне турнира — отказ менеджера или игрок снялся сам. Менять на
      // ней напарника нечего: места у пары нет
      if (existing && (existing.status === 'withdrawn' || existing.status === 'rejected') &&
          (body.change_partner || body.leave_pair)) {
        return json({ error: 'entry_not_active', status: existing.status }, 409)
      }

      // Снятую самим игроком заявку не считаем поданной: он передумал и вправе
      // записаться снова, пока регистрация открыта. Время подачи будет новым,
      // то есть он встанет в конец очереди. Второй строки не будет: уникальный
      // индекс на (турнир, игрок), поэтому в конце оживляем ту же запись.
      //
      // Отказ менеджера — другое дело. Заявку закрыл клуб, и подавать её снова
      // игрок не может: иначе он давил бы кнопку без конца, а решение менеджера
      // ничего не значило бы. Вернуть заявку может только тот, кто отказал.
      if (existing && existing.status === 'rejected') {
        return json({ error: 'entry_rejected' }, 409)
      }
      if (existing && existing.status !== 'withdrawn') {
        // Сетка сформирована — состав закрыт.
        //
        // Пока жеребьёвки нет, игрок распоряжается своей парой сам. После неё
        // менять напарника нельзя: посев разведён по группам, соперники
        // определены, расписание разложено по кортам и времени — на корт
        // вышла бы пара, которой в расчёте не было. Заодно мимо проверок
        // прошли бы лимит суммы NTRP и разнополость в миксте. Дальше замену
        // делает менеджер, который видит последствия.
        var вСетке = existing.status === 'draw' ||
                     existing.group_number != null ||
                     existing.draw_position != null
        if (вСетке && (body.change_partner || body.leave_pair)) {
          return json({ error: 'entry_in_draw' }, 409)
        }

        // Замена напарника — не новая заявка: место, время подачи и очередь
        // остаются за игроком, меняется только тот, с кем он выйдет на корт
        if (body.change_partner) {
          return await сменитьНапарника(db, existing, body, player, tournament, serviceKey)
        }
        if (body.leave_pair) {
          return await выйтиИзПары(db, existing, player.id, serviceKey)
        }
        return json({ error: 'already_registered', status: existing.status }, 409)
      }

      // ---- Членство и оплата (staff пропускаем) ----
      //
      // Бесплатный период: пока дата в настройках не прошла, членство не
      // спрашиваем ни у кого, кто вошёл. Дату ставит администратор в админке,
      // Настройки → Доступ.
      const { data: настройка } = await db
        .from('app_settings')
        .select('value')
        .eq('key', 'free_access_until')
        .maybeSingle()
      const доступДо = настройка?.value ? String(настройка.value).replace(/"/g, '') : ''
      const бесплатныйПериод = !!доступДо &&
        new Date().toISOString().split('T')[0] <= доступДо

      if (!isStaff && !бесплатныйПериод) {
        const today = new Date().toISOString().split('T')[0]
        const { data: memberships } = await db
          .from('memberships')
          .select('id')
          .eq('profile_id', profile.id)
          .eq('status', 'active')
          .gte('expires_at', today)
          .order('expires_at', { ascending: false })
          .limit(1)

        if (!memberships || memberships.length === 0) {
          return json({ error: 'no_membership' }, 403)
        }

        const { data: payments } = await db
          .from('payments')
          .select('id')
          .eq('membership_id', memberships[0].id)
          .eq('status', 'completed')
          .limit(1)

        if (!payments || payments.length === 0) {
          return json({ error: 'not_paid' }, 403)
        }
      }

      // ---- Пол ----
      //
      // Проверяем обоих: в парном турнире напарник — такой же участник, и до
      // сих пор он проходил без единой проверки. Менеджера и админа не держим:
      // они ставят замены осознанно, и в админке их об этом спрашивают.
      const playerGender = normalizeGender(player.gender || profile.gender)
      const partnerGender = await loadPartnerGender(db, body)

      // Пол гостя спрашиваем всегда: без него пару не проверить, а когда
      // гость заведёт карточку, пол придётся угадывать по имени
      if (body.partner_external_name && !partnerGender) {
        return json({ error: 'partner_gender_required' }, 400)
      }
      // NTRP — тоже: пустое поле считалось нулём, и лимит суммы пары
      // обходился сам собой. Значение проверит менеджер, но оно должно быть
      if (!isStaff && body.partner_external_name && !body.partner_external_ntrp) {
        return json({ error: 'partner_ntrp_required' }, 400)
      }

      // Состав не сошёлся с турниром — это ещё не отказ.
      //
      // В рейтинговом одиночном отказ: очки идут в мужской или женский
      // рейтинг, и чужой пол там невозможен. В остальных турнирах заявку
      // принимаем, но помечаем: место держится по времени подачи, как у
      // всех, а в сетку она не пойдёт, пока менеджер не решит. Женскую пару
      // в мужской парный или двух мужчин в микст заявляют осознанно, и
      // решать это человеку, а не проверке.
      const рейтинговый = tournament.format === 'singles' &&
                          tournament.category_id !== 'friendly' && !!tournament.level_id

      /* ПРИЧИН БЫВАЕТ НЕСКОЛЬКО РАЗОМ, и раньше их держал булев
         gender_confirmed — то есть одна. Пара может и не совпасть по полу,
         и превысить сумму NTRP, и не иметь парного рейтинга. Список пустой —
         проверять нечего. Решение Кости 28.09. */
      const причины: string[] = []

      if (tournament.gender && tournament.gender !== 'mixed') {
        if (playerGender && playerGender !== tournament.gender) {
          if (рейтинговый) return json({ error: 'gender_mismatch' }, 403)
          причины.push('gender')
        }
        if (!isStaff && partnerGender && partnerGender !== tournament.gender) {
          причины.push('gender')
        }
      }

      // Микст: пара — мужчина и женщина
      if (!isStaff && tournament.format === 'mixed_doubles' &&
          playerGender && partnerGender && playerGender === partnerGender) {
        причины.push('gender')
      }

      // ---- Категория закрыта для этого игрока ----
      // По правилам клуба игрок выступает не более чем в двух категориях.
      // Когда его переводят в новую, прежнюю закрывают: очки и история в ней
      // остаются, но новых заявок туда больше не принимаем. Уже поданные
      // заявки не трогаем — записанные турниры игрок доигрывает.
      // Проверка живёт здесь, а не только в интерфейсе: страницу можно обойти
      // запросом напрямую.
      if (!isStaff && tournament.category_id) {
        const { data: closedCat } = await db
          .from('player_categories')
          .select('closed_at')
          .eq('player_id', player.id)
          .eq('category_id', tournament.category_id)
          .maybeSingle()

        if (closedCat && closedCat.closed_at) {
          return json({ error: 'category_closed', category: tournament.category_id }, 403)
        }
      }

      const isDoubles = tournament.format === 'doubles' || tournament.format === 'mixed_doubles'
      const isFriendly = tournament.category_id === 'friendly'

      // ---- NTRP ----
      if (isDoubles) {
        /* Парные и микст: допуск по сумме NTRP двоих, категории не участвуют.
           ОТКАЗА ЗДЕСЬ БОЛЬШЕ НЕТ. Раньше сумма выше предела давала 403, и
           человек не попадал ни в основу, ни в очередь. Решение Кости 28.09:
           заявку принять, место держать по времени подачи, решение — за
           менеджером. Это та же дорога, по которой уже ходит несошедшийся
           пол. */
        if (tournament.ntrp_combined_max) {
          const мой = ntrpПары(player)
          const напарника = body.partner_id
            ? await loadPartnerNtrp(db, body.partner_id)
            : (Number(body.partner_external_ntrp) || null)
          /* Нет парного рейтинга — сумму НЕ СЧИТАЕМ ВОВСЕ. Прежде сюда
             подставлялся одиночный, и пара проходила предел чужим числом */
          if (мой === null || напарника === null) {
            причины.push('ntrp_doubles')
          } else if (мой + напарника > Number(tournament.ntrp_combined_max)) {
            причины.push('ntrp_combined')
          }
        }
      } else {
        const ntrp = Number(player.ntrp_singles || 0)
        if (ntrp) {
          if (tournament.ntrp_min && ntrp < Number(tournament.ntrp_min)) {
            return json({ error: 'ntrp_too_low' }, 403)
          }
          if (tournament.ntrp_max && ntrp > Number(tournament.ntrp_max)) {
            return json({ error: 'ntrp_too_high' }, 403)
          }
        }
      }

      // ---- Решение по категории ----
      // Парные и Friendly категорию не проверяют вообще
      let decision: Decision = { status: 'approved', reason: 'own_category' }
      let playerRank: number | null = null

      if (!isDoubles && !isFriendly && tournament.category_id) {
        const { data: cats } = await db.from('categories').select('id, name, sort_order')
        const sortOf: Record<string, number> = {}
        const nameOf: Record<string, string> = {}
        for (const c of (cats || [])) {
          sortOf[c.id] = c.sort_order
          nameOf[c.id] = c.name
        }

        const tSort = sortOf[tournament.category_id]
        const pSort = player.category_id != null ? sortOf[player.category_id] : undefined

        if (pSort === undefined) {
          // Игрок без категории — пускаем, но через рассмотрение админом
          decision = { status: 'waitlist', reason: 'no_category' }
        } else if (pSort === tSort) {
          decision = { status: 'approved', reason: 'own_category' }
        } else if (pSort > tSort) {
          decision = {
            status: 'blocked',
            reason: 'higher_category',
            text: т('trn_higher_category', языкЗаявителя, {
              'турнир': nameOf[tournament.category_id],
              'игрок': nameOf[player.category_id!]
            })
          }
        } else if (pSort === tSort - 1) {
          playerRank = await computeRank(db, player, tournament.gender)
          if (playerRank <= AUTO_RANK_LIMIT) {
            decision = { status: 'approved', reason: 'top_rank' }
          } else if (playerRank <= WAITLIST_RANK_LIMIT) {
            decision = { status: 'waitlist', reason: 'rank_waitlist' }
          } else {
            decision = {
              status: 'blocked',
              reason: 'rank_too_low',
              text: т('trn_rank_too_low', языкЗаявителя, {
                'турнир': nameOf[tournament.category_id],
                'предел': WAITLIST_RANK_LIMIT,
                'игрок': nameOf[player.category_id!],
                'место': playerRank
              })
            }
          }
        } else {
          decision = {
            status: 'blocked',
            reason: 'category_too_low',
            text: т('trn_category_too_low', языкЗаявителя, {
              'турнир': nameOf[tournament.category_id],
              'игрок': nameOf[player.category_id!]
            })
          }
        }
      }

      // ---- Места и вытеснение ----
      let displaced: { player_id: string; name: string } | null = null

      if (decision.status === 'approved') {
        const { data: regs } = await db
          .from('tournament_registrations')
          .select('id, player_id, status, registered_at')
          .eq('tournament_id', tournamentId)
          .eq('seat_pool', 'online')
          .in('status', MAIN_DRAW_STATUSES)
          .order('registered_at', { ascending: true })

        const mainDraw = regs || []
        /* РЕЗЕРВ — НЕ СВОБОДНЫЕ МЕСТА. Их заполняет человек: админ сажает
           туда спецгостей турнира. Очередь их не трогает и в счёт онлайна
           они не идут — потому заявки и помечены seat_pool, а запрос выше
           берёт только 'online'. Правило Кости 28.09.

           Ноль мест онлайн — это ноль, а не «без предела»: прежнее условие
           onlineSlots > 0 выключало проверку целиком, и при резерве, равном
           сетке, в основу пускали всех подряд. Размер сетки не задан вовсе —
           вот тогда предела нет, и это другое условие. */
        const сетка = Number(tournament.max_participants) || 0
        const резерв = Number(tournament.reserved_spots) || 0
        const onlineSlots = сетка > 0 ? Math.max(0, сетка - резерв) : null
        const isFull = onlineSlots !== null && mainDraw.length >= onlineSlots

        if (isFull) {
          if (decision.reason === 'own_category') {
            // Приоритет у своей категории: двигаем последнего по времени игрока нижней категории
            const victim = await findLastLowerCategoryReg(db, mainDraw, tournament.category_id)
            if (victim) {
              await db.from('tournament_registrations')
                .update({ status: 'waitlist' })
                .eq('id', victim.regId)
              displaced = { player_id: victim.playerId, name: victim.name }
            } else {
              decision = { status: 'waitlist', reason: 'draw_full' }
            }
          } else {
            decision = { status: 'waitlist', reason: 'draw_full' }
          }
        }
      }

      // ---- Запись заявки ----
      const row: Record<string, unknown> = {
        tournament_id: tournamentId,
        player_id: player.id,
        status: decision.status,
      }
      if (decision.status === 'blocked' && decision.text) {
        row.block_reason = decision.text
      }
      // Напарника задаём всегда, даже пустым: заявка после снятия переписывает
      // прежнюю строку, и не указанные поля оставались от старой пары — человек
      // записывался один, а в участниках снова стоял прежний напарник
      row.partner_id = body.partner_id || null
      row.partner_external_name = body.partner_external_name || null
      row.partner_external_ntrp = body.partner_external_ntrp || null
      row.partner_external_country = body.partner_external_country || null
      row.partner_gender = body.partner_gender || null
      row.guest_confirmed = false
      /* Заявка пришла с сайта или из приложения — значит занимает место из
         ОНЛАЙН-запаса. Резерв заполняет человек в админке, и очередь его
         не трогает */
      row.seat_pool = 'online'
      /* Пусто — проверять нечего. Место при этом за парой в любом случае:
         очередь честная, по времени подачи. Дубли снимаем — «не совпал пол»
         могло прийти и от игрока, и от напарника */
      row.review_reasons = [...new Set(причины)]
      /* Переходное: столбец уберёт шаг 2 миграции. Пока живёт рядом, чтобы
         уже открытая в браузере админка не ослепла */
      row.gender_confirmed = причины.length === 0

      // Заявка после снятия или отказа — обновляем прежнюю строку, иначе
      // вставка упрётся в уникальный индекс
      const { error: insErr } = existing
        ? await db.from('tournament_registrations')
            .update({
              ...row,
              block_reason: row.block_reason ?? null,
              // Следы прежней жеребьёвки тоже снимаем: место в сетке разыграют заново
              group_number: null,
              seed_number: null,
              draw_position: null,
              registered_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        : await db.from('tournament_registrations').insert(row)
      if (insErr) {
        // Откатываем вытеснение, если саму заявку записать не удалось
        if (displaced) {
          await db.from('tournament_registrations')
            .update({ status: 'approved' })
            .eq('tournament_id', tournamentId)
            .eq('player_id', displaced.player_id)
        }
        return json({ error: insErr.message }, 500)
      }

      // ---- Уведомление вытесненному ----
      if (displaced) {
        await notifyDisplaced(db, serviceKey, displaced.player_id, tournament.title)
      }

      // ---- Состав ждёт решения ----
      //
      // Игроку — что заявка принята и рассматривается: место за ним, и
      // молчать об этом нельзя. Клубу — что решение за ним, иначе заявка
      // провисит до жеребьёвки
      if (причины.length) {
        await сообщитьОРассмотрении(db, serviceKey, player, body, tournament, [...new Set(причины)])
      }

      return json({
        status: decision.status,
        reason: decision.reason,
        rank: playerRank,
        block_reason: decision.text || null,
        displaced: displaced ? displaced.name : null,
        review_reasons: [...new Set(причины)],
        gender_review: причины.length > 0,
      })

    } catch (e) {
      return json({ error: (e as Error).message || 'Internal error' }, 500)
    }
  })

  // ============================================

  type Decision = {
    status: 'approved' | 'waitlist' | 'blocked'
    reason: string
    text?: string
  }

  // Пол во всём проекте пишется одним словарём: men/women. Раньше учётные
  // записи хранили male/female, и здесь стоял перевод — теперь переводить нечего
  /**
   * Пол напарника: у игрока с карточкой берём из карточки, у гостя — из того,
   * что указал заявитель. Не указал — считаем неизвестным и не придираемся.
   */
  async function loadPartnerGender(db: any, body: any): Promise<string | null> {
    if (body.partner_id) {
      const { data } = await db.from('players').select('gender').eq('id', body.partner_id).maybeSingle()
      return normalizeGender(data?.gender || null)
    }
    return normalizeGender(body.partner_gender || null)
  }

  function normalizeGender(g: string | null): string | null {
    if (!g) return null
    return (g === 'men' || g === 'women') ? g : null
  }

  /* В парном турнире человек считается ПАРНЫМ рейтингом и только им.
     Раньше при его отсутствии подставлялся одиночный — решение Кости 28.09
     это отменяет: сумма пары выходила ложной, и человек без парной оценки
     проходил предел чужим числом. Нет парного — возвращаем null, сумма не
     считается, а заявка идёт на рассмотрение с причиной ntrp_doubles:
     рейтинг проставит менеджер. */
  function ntrpПары(p: { ntrp_singles?: number | null; ntrp_doubles?: number | null } | null): number | null {
    const пар = Number(p?.ntrp_doubles || 0)
    return пар > 0 ? пар : null
  }

  async function loadPartnerNtrp(db: any, partnerId: string): Promise<number | null> {
    const { data } = await db.from('players').select('ntrp_singles, ntrp_doubles').eq('id', partnerId).single()
    return ntrpПары(data)
  }

  /**
   * Место игрока в его категории среди своего пола.
   * Рейтинги мужской и женский ведутся раздельно, поэтому пол обязателен.
   */
  async function computeRank(db: any, player: any, tournamentGender: string | null): Promise<number> {
    const gender = normalizeGender(player.gender) || normalizeGender(tournamentGender)
    let query = db
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', player.category_id)
      .gt('points', player.points || 0)

    if (gender) query = query.eq('gender', gender)

    const { count } = await query
    return (count || 0) + 1
  }

  /**
   * Последний по времени подачи игрок нижней категории в основной сетке.
   * Его и двигаем, когда приходит игрок категории турнира, а мест нет.
   */
  async function findLastLowerCategoryReg(
    db: any,
    mainDraw: any[],
    tournamentCategoryId: string
  ): Promise<{ regId: string; playerId: string; name: string } | null> {
    const playerIds = mainDraw.map((r) => r.player_id).filter(Boolean)
    if (playerIds.length === 0) return null

    const { data: players } = await db
      .from('players')
      .select('id, name, category_id')
      .in('id', playerIds)

    const catOf: Record<string, string> = {}
    const nameOf: Record<string, string> = {}
    for (const p of (players || [])) {
      catOf[p.id] = p.category_id
      nameOf[p.id] = p.name
    }

    // mainDraw отсортирован по возрастанию времени — идём с конца
    for (let i = mainDraw.length - 1; i >= 0; i--) {
      const reg = mainDraw[i]
      if (!reg.player_id) continue
      if (catOf[reg.player_id] !== tournamentCategoryId) {
        return { regId: reg.id, playerId: reg.player_id, name: nameOf[reg.player_id] || '' }
      }
    }
    return null
  }

  async function notifyDisplaced(db: any, serviceKey: string, playerId: string, tournamentTitle: string) {
    const { data: prof } = await db
      .from('profiles')
      .select('id, telegram_chat_id, notify_preferences')
      .eq('player_id', playerId)
      .maybeSingle()

    if (!prof) return

    const title = 'Заявка перемещена в лист ожидания'
    const message = `На турнир «${tournamentTitle}» подал заявку игрок категории турнира. ` +
      `Ваша заявка перемещена в лист ожидания — решение примет администратор.`

    // Telegram
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (token && prof.telegram_chat_id && shouldNotify(prof.notify_preferences, 'tg', 'tournaments')) {
      try {
        await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: prof.telegram_chat_id,
            text: `⏳ <b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`,
            parse_mode: 'HTML',
          })
        })
      } catch { /* уведомление не должно ронять регистрацию */ }
    }

    // Push
    try {
      await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/send-push', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type: 'tournaments', audience: 'user', user_id: prof.id })
      })
    } catch { /* см. выше */ }
  }

  /**
   * Состав заявки не сошёлся с турниром по полу.
   *
   * Двоим участникам — что заявка принята и ждёт решения. Админам и
   * менеджерам — что решать им. Отправка не должна ронять регистрацию:
   * заявка уже записана, и молчание уведомления её не отменяет.
   */
  /**
   * Заявка принята и ждёт решения клуба.
   *
   * ИГРОКУ — ОДНО СООБЩЕНИЕ НА ВСЕ СЛУЧАИ, без причины. Решение Кости 28.09:
   * «одно правило и одно уведомление, проще и ясно». Причина может быть не
   * одна, может измениться после правки данных, и решает её всё равно
   * человек — перечислять её игроку незачем. Текст лежит в notification_texts
   * и идёт на языке игрока: прежний был зашит по-русски прямо здесь, и
   * англоязычный игрок получал русское сообщение.
   *
   * КЛУБУ — причины списком: менеджеру решать, и он должен видеть, что
   * именно не так. Админка живёт только на русском (js/auth-nav.js:89),
   * поэтому здесь русский и остаётся.
   */
  async function сообщитьОРассмотрении(
    db: any, serviceKey: string, player: any, body: any, tournament: any, причины: string[]
  ) {
    const кому = [player.id, body.partner_id].filter(Boolean)
    const { data: профили } = await db
      .from('profiles')
      .select('id, lang, telegram_chat_id, notify_preferences')
      .in('player_id', кому)

    for (const пр of (профили || [])) {
      const язык = языкИз(пр)
      await отправить(
        пр,
        т('trn_review_title', язык),
        т('trn_review_body', язык, { 'турнир': tournament.title }),
        serviceKey
      )
    }

    const { data: клуб } = await db
      .from('profiles')
      .select('id, telegram_chat_id, notify_preferences')
      .in('role', ['admin', 'manager'])

    const напарник = body.partner_external_name ||
      (body.partner_id ? await имяИгрока(db, body.partner_id) : null)
    const словами: Record<string, string> = {
      gender: 'состав не совпадает с турниром по полу',
      ntrp_combined: 'сумма NTRP пары выше предела турнира',
      ntrp_doubles: 'у кого-то из пары нет парного рейтинга — его нужно проставить'
    }
    const перечень = причины.map((п) => словами[п] || п).join('; ')
    const клубу = {
      title: 'Заявка требует решения',
      message: `«${tournament.title}»: ${player.name}` +
        (напарник ? ` и ${напарник}` : '') +
        ` — ${перечень}. Место держится до вашего решения.`,
    }
    for (const пр of (клуб || [])) {
      await отправить(пр, клубу.title, клубу.message, serviceKey)
    }
  }

  async function имяИгрока(db: any, id: string): Promise<string | null> {
    try {
      const { data } = await db.from('players').select('name').eq('id', id).maybeSingle()
      return data?.name || null
    } catch { return null }
  }

  async function отправить(проф: any, title: string, message: string, serviceKey: string) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (token && проф.telegram_chat_id && shouldNotify(проф.notify_preferences, 'tg', 'tournaments')) {
      try {
        await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: проф.telegram_chat_id,
            text: `\u{23F3} <b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`,
            parse_mode: 'HTML',
          })
        })
      } catch { /* уведомление не должно ронять регистрацию */ }
    }
    try {
      await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/send-push', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type: 'tournaments', audience: 'user', user_id: проф.id })
      })
    } catch { /* см. выше */ }
  }

  function shouldNotify(prefs: any, channel: 'tg' | 'email', cat: string): boolean {
    if (!prefs) return true
    const ch = prefs[channel]
    if (!ch) return true
    return ch[cat] !== false
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

  /**
   * Сменить напарника в уже поданной заявке.
   *
   * Правила те же, что при подаче: пол и суммарный NTRP проверяем для напарника
   * с карточкой, гостя пропускаем на рассмотрение менеджеру. Место в очереди не
   * трогаем: человек его заслужил временем подачи.
   */
  async function сменитьНапарника(db: any, existing: any, body: any, player: any, tournament: any, serviceKey: string) {
    const isDoubles = tournament.format === 'doubles' || tournament.format === 'mixed_doubles'
    if (!isDoubles) return jsonResp({ error: 'not_doubles' }, 400)

    const partnerGender = await loadPartnerGender(db, body)
    const playerGender = normalizeGender(player.gender)

    /* ОДНО ПРАВИЛО НА ОБА ВХОДА. Здесь стояли три отказа 403 — по полу
       напарника, по составу микста и по сумме NTRP, — а при подаче те же
       случаи уже принимались на рассмотрение. Один и тот же состав
       проходил или нет в зависимости от того, каким входом он пришёл.
       Теперь везде одно: принять, назвать причину, решает менеджер. */
    const причиныДобора: string[] = []

    if (body.partner_id) {
      if (tournament.gender && tournament.gender !== 'mixed' &&
          partnerGender && partnerGender !== tournament.gender) {
        причиныДобора.push('gender')
      }
      if (tournament.format === 'mixed_doubles' &&
          playerGender && partnerGender && playerGender === partnerGender) {
        причиныДобора.push('gender')
      }
      if (tournament.ntrp_combined_max) {
        const мой = ntrpПары(player)
        const напарника = await loadPartnerNtrp(db, body.partner_id)
        if (мой === null || напарника === null) {
          причиныДобора.push('ntrp_doubles')
        } else if (мой + напарника > Number(tournament.ntrp_combined_max)) {
          причиныДобора.push('ntrp_combined')
        }
      }
      // Один человек не может играть в двух парах одного турнира
      const { data: занят } = await db
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournament.id)
        .neq('id', existing.id)
        .or(`player_id.eq.${body.partner_id},partner_id.eq.${body.partner_id}`)
        .not('status', 'in', '("withdrawn","rejected")')
        .maybeSingle()
      if (занят) return jsonResp({ error: 'partner_taken' }, 409)
    }

    const { error } = await db.from('tournament_registrations').update({
      partner_id: body.partner_id || null,
      partner_external_name: body.partner_external_name || null,
      partner_external_country: body.partner_external_country || null,
      partner_external_ntrp: body.partner_external_ntrp || null,
      partner_gender: body.partner_gender || null,
      // Нового гостя менеджер подтверждает заново
      guest_confirmed: false,
      review_reasons: [...new Set(причиныДобора)],
      /* Переходное: столбец уберёт шаг 2 миграции. Пока живёт рядом,
         чтобы уже открытая в браузере админка не ослепла */
      gender_confirmed: причиныДобора.length === 0
    }).eq('id', existing.id)

    if (error) return jsonResp({ error: error.message }, 500)

    /* Место в очереди не трогаем — человек его заслужил временем подачи */
    if (причиныДобора.length) {
      await сообщитьОРассмотрении(db, serviceKey, player, body, tournament, причиныДобора)
    }

    return jsonResp({
      ok: true,
      status: existing.status,
      partner_changed: true,
      guest: !!body.partner_external_name,
      review_reasons: [...new Set(причиныДобора)]
    })
  }

  function jsonResp(body: Record<string, unknown>, status = 200) {
    return json(body, status)
  }

  /**
   * Выйти из пары.
   *
   * Снимает себя, а не заявку: место в турнире принадлежит паре, и второй не
   * должен его терять из-за чужого решения. Выходит первый номер — напарник
   * занимает его место и остаётся в заявке один. Выходит напарник — первый
   * остаётся один. Ушли оба — заявка снимается.
   */
  async function выйтиИзПары(db: any, reg: any, playerId: string, serviceKey?: string) {
    const яКапитан = reg.player_id === playerId

    if (яКапитан) {
      if (reg.partner_id) {
        const { error } = await db.from('tournament_registrations').update({
          player_id: reg.partner_id,
          partner_id: null,
          partner_external_name: null,
          partner_external_ntrp: null,
          partner_gender: null,
          guest_confirmed: false
        }).eq('id', reg.id)
        if (error) return jsonResp({ error: error.message }, 500)
        // Оставшийся должен узнать, что играть теперь не с кем: место за ним,
        // но напарника надо искать заново
        await сообщитьОбУходе(db, reg.partner_id, reg.tournament_id, serviceKey)
        return jsonResp({ ok: true, left: true, stays: 'partner' })
      }
      // Напарника нет или он гость — заявке больше некому принадлежать
      const { error } = await db.from('tournament_registrations')
        .update({ status: 'withdrawn' }).eq('id', reg.id)
      if (error) return jsonResp({ error: error.message }, 500)
      return jsonResp({ ok: true, left: true, stays: 'nobody' })
    }

    const { error } = await db.from('tournament_registrations').update({
      partner_id: null,
      guest_confirmed: false
    }).eq('id', reg.id)
    if (error) return jsonResp({ error: error.message }, 500)
    await сообщитьОбУходе(db, reg.player_id, reg.tournament_id, serviceKey)
    return jsonResp({ ok: true, left: true, stays: 'captain' })
  }

  /** Напарник вышел из пары: место за оставшимся, но играть не с кем. */
  async function сообщитьОбУходе(db: any, playerId: string, tournamentId: string, serviceKey?: string) {
    if (!playerId || !serviceKey) return
    try {
      const { data: проф } = await db.from('profiles')
        .select('id, telegram_chat_id, notify_preferences')
        .eq('player_id', playerId).maybeSingle()
      if (!проф) return
      const { data: t } = await db.from('tournaments')
        .select('title').eq('id', tournamentId).maybeSingle()
      await отправить(проф, 'Напарник вышел из пары',
        `Место на «${t?.title || ''}» осталось за вами — найдите другого напарника, ` +
        `иначе пара в сетку не попадёт.`, serviceKey)
    } catch { /* уведомление не должно ронять выход из пары */ }
  }
