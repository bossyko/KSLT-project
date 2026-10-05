// ========================================
// Tournaments Overview — Supabase + static fallback
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;

    /**
     * Категории и их порядок.
     *
     * Список читается из базы: новая категория должна появляться на странице
     * сама, а не после правки кода. Здесь лежит запасной набор — на случай,
     * если база недоступна и страница работает на статических данных.
     */
    var CATEGORIES = [
        { key: 'promasters', name: 'Pro-Masters' },
        { key: 'masters', name: 'Masters' },
        { key: 'tour', name: 'Tour' },
        { key: 'challenger', name: 'Challengers' },
        { key: 'futures', name: 'Futures' },
        { key: 'friendly', name: 'Friendly Weekend' }
    ];

    /**
     * Категории, которые не идут в рейтинг. Заполняется из базы, из поля
     * is_rating. Пока база не ответила — знаем только про дружеские: это
     * запасное знание на случай, если страница работает на статике.
     */
    var NO_RATING = { friendly: true };

    /** Подменяет запасной набор тем, что заведено в базе. */
    async function loadCategories() {
        if (!client) return;
        try {
            // Забираем строку целиком: в таблице шесть строк, экономить не на
            // чем, зато код не падает, если колонка в базе появится позже.
            var res = await client.from('categories')
                .select('*')
                .order('sort_order', { ascending: false });
            if (!res.data || res.data.length === 0) return;

            CATEGORIES = res.data.map(function(c) {
                if (c.is_rating === false) NO_RATING[c.id] = true;
                return {
                    key: c.id,
                    name: isEn ? (c.name_en || c.name) : (isKg ? (c.name_kg || c.name) : c.name),
                    color: c.color || ''
                };
            });
        } catch(e) {
            console.warn('[KSLT] categories load error:', e);
        }
    }

    var months = isEn
        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

    var formatLabels = isEn
        ? { singles: 'Singles', doubles: 'Doubles', mixed_doubles: 'Mixed Doubles' }
        : (isKg ? { singles: 'Жалгыз', doubles: 'Жуптук', mixed_doubles: 'Аралаш жуптук' }
        : { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' });

    /* Подписи статусов живут в js/tournament-status.js — одно определение на одно понятие */
    var statusLabels = window.KSLT_STATUS.подписи(isEn ? 'en' : (isKg ? 'kg' : 'ru'));

    var L = isEn ? {
        heroTitle: 'Tournaments',
        heroSub: 'All KSLT tournament categories',
        heroDesc: 'From beginner to professional level',
        heroBadge: 'KSLT',
        viewAll: 'All tournaments',
        slotEmpty: 'the next tournament of this category will appear here',
        details: 'Details',
        register: 'Register',
        empty: 'No upcoming tournaments',
        format: 'Format',
        participants: 'Players',
        pairs: 'Pairs',
        prize: 'Prize',
        men: 'Men',
        women: 'Women',
        gender: 'Gender',
        noRating: 'Unranked',
        fee: 'Fee', feeMember: 'KSLT members', feeGuest: 'non-members',
        perPair: 'per player', som: 'som'
    } : (isKg ? {
        heroTitle: 'Мелдештер',
        heroSub: 'KSLT мелдештеринин бардык категориялары',
        heroDesc: 'Башталгычтан профессионал деңгээлге чейин',
        heroBadge: 'KSLT',
        viewAll: 'Бардык мелдештер',
        slotEmpty: 'бул категориянын кийинки мелдеши ушул жерде пайда болот',
        details: 'Толугураак',
        register: 'Каттоо',
        empty: 'Алдыдагы мелдештер жок',
        format: 'Формат',
        participants: 'Катышуучулар',
        pairs: 'Жуптар',
        prize: 'Сыйлык',
        men: 'Эрк',
        women: 'Аял',
        gender: 'Жынысы',
        noRating: 'Рейтингсиз',
        fee: 'Взнос', feeMember: 'КСЛТ мүчөлөрүнө', feeGuest: 'калгандарга',
        perPair: 'оюнчудан', som: 'сом'
    } : {
        heroTitle: 'Турниры',
        heroSub: 'Все категории турниров KSLT',
        heroDesc: 'От начального до профессионального уровня',
        heroBadge: 'KSLT',
        viewAll: 'Все турниры',
        slotEmpty: 'здесь появится следующий турнир категории',
        details: 'Подробнее',
        register: 'Регистрация',
        empty: 'Нет предстоящих турниров',
        format: 'Формат',
        participants: 'Участники',
        pairs: 'Пар',
        prize: 'Призовой',
        men: 'Муж',
        women: 'Жен',
        gender: 'Пол',
        noRating: 'Без рейтинга',
        fee: 'Взнос', feeMember: 'членам КСЛТ', feeGuest: 'остальным',
        perPair: 'с участника', som: 'сом'
    });

    var SL = isEn ? {
        totalLabel: 'Tournaments',
        participantsLabel: 'Participants',
        prizeLabel: 'Prize Fund',
        categoriesLabel: 'Categories'
    } : (isKg ? {
        totalLabel: 'Мелдештер',
        participantsLabel: 'Катышуучулар',
        prizeLabel: 'Сыйлык фонду',
        categoriesLabel: 'Категориялар'
    } : {
        totalLabel: 'Турниров',
        participantsLabel: 'Участников',
        prizeLabel: 'Призовой фонд',
        categoriesLabel: 'Категорий'
    });

    var tournamentPage = isEn ? 'tournament-en.html' : (isKg ? 'tournament-kg.html' : 'tournament.html');
    var tournamentsPage = isEn ? 'tournaments-en.html' : (isKg ? 'tournaments-kg.html' : 'tournaments.html');

    var _grouped = {};
    var _allGrouped = {};
    var _bgImages = {};
    var _searchTimer = null;

    // Auto-compute tournament status from dates
    /* Вычисление одно на всю КСЛТ — js/tournament-status.js */
    function computeStatus(a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); }

    // SVG icons
    var pinSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    var arrowSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    var emptySvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

    // Countdown helpers
    var _countdownInterval = null;
    var CL = isEn
        ? { days: 'd', hours: 'h', min: 'm', sec: 's', live: 'LIVE NOW', prefix: 'STARTS IN' }
        : (isKg
            ? { days: 'к', hours: 'с', min: 'м', sec: 'с', live: 'ТҮЗ ЭФИР', prefix: 'БАШТАЛАТ' }
            : { days: 'д', hours: 'ч', min: 'м', sec: 'с', live: 'ИДЁТ СЕЙЧАС', prefix: 'СТАРТ ЧЕРЕЗ' });

    function getCountdownHtml(dateSort, startTime) {
        if (!dateSort) return '';
        var timeStr = startTime || '00:00';
        var target = new Date(dateSort + 'T' + timeStr + ':00');
        var now = new Date();
        var diff = target.getTime() - now.getTime();
        if (diff <= 0) return '<span class="to-cd to-cd-live"><span class="to-cd-dot"></span>' + CL.live + '</span>';
        if (diff > 48 * 60 * 60 * 1000) return '';
        var d = Math.floor(diff / (1000*60*60*24));
        var h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        var m = Math.floor((diff % (1000*60*60)) / (1000*60));
        var s = Math.floor((diff % (1000*60)) / 1000);
        var urgent = diff < 60 * 60 * 1000 ? ' to-cd-urgent' : '';
        var parts = '<span class="to-cd-label">' + CL.prefix + '</span>';
        if (d > 0) parts += '<span class="to-cd-unit">' + d + '<small>' + CL.days + '</small></span>';
        parts += '<span class="to-cd-unit">' + String(h).padStart(2,'0') + '<small>' + CL.hours + '</small></span>';
        parts += '<span class="to-cd-unit">' + String(m).padStart(2,'0') + '<small>' + CL.min + '</small></span>';
        parts += '<span class="to-cd-unit">' + String(s).padStart(2,'0') + '<small>' + CL.sec + '</small></span>';
        return '<span class="to-cd' + urgent + '" data-cd-date="' + dateSort + '" data-cd-time="' + timeStr + '">' + parts + '</span>';
    }

    function updateCountdowns() {
        document.querySelectorAll('.to-cd[data-cd-date]').forEach(function(el) {
            var dateSort = el.dataset.cdDate;
            var timeStr = el.dataset.cdTime || '00:00';
            var target = new Date(dateSort + 'T' + timeStr + ':00');
            var now = new Date();
            var diff = target.getTime() - now.getTime();
            if (diff <= 0) {
                el.className = 'to-cd to-cd-live';
                el.innerHTML = '<span class="to-cd-dot"></span>' + CL.live;
                return;
            }
            var d = Math.floor(diff / (1000*60*60*24));
            var h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
            var m = Math.floor((diff % (1000*60*60)) / (1000*60));
            var s = Math.floor((diff % (1000*60)) / 1000);
            if (diff < 60 * 60 * 1000) el.classList.add('to-cd-urgent'); else el.classList.remove('to-cd-urgent');
            var parts = '<span class="to-cd-label">' + CL.prefix + '</span>';
            if (d > 0) parts += '<span class="to-cd-unit">' + d + '<small>' + CL.days + '</small></span>';
            parts += '<span class="to-cd-unit">' + String(h).padStart(2,'0') + '<small>' + CL.hours + '</small></span>';
            parts += '<span class="to-cd-unit">' + String(m).padStart(2,'0') + '<small>' + CL.min + '</small></span>';
            parts += '<span class="to-cd-unit">' + String(s).padStart(2,'0') + '<small>' + CL.sec + '</small></span>';
            el.innerHTML = parts;
        });
    }

    function startCountdownTimer() {
        if (_countdownInterval) clearInterval(_countdownInterval);
        if (document.querySelectorAll('.to-cd[data-cd-date]').length > 0) {
            _countdownInterval = setInterval(updateCountdowns, 1000);
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        renderHero();
        loadTournaments();
        trackPageView('tournaments-overview');
        initStickySearch();
    }

    function initStickySearch() {
        var wrap = document.getElementById('overviewSearchWrap');
        if (!wrap) return;
        var sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        wrap.parentNode.insertBefore(sentinel, wrap);
        var obs = new IntersectionObserver(function(entries) {
            wrap.classList.toggle('stuck', !entries[0].isIntersecting);
        });
        obs.observe(sentinel);
    }

    function trackPageView(pageName) {
        if (!client) return;
        var key = 'kslt_pv_' + pageName;
        if (sessionStorage.getItem(key)) return;
        client.rpc('increment_page_view', { p_page_name: pageName }).then(function(res) {
            if (!res.error) sessionStorage.setItem(key, '1');
        });
    }

    function renderHero() {
        var el = document.getElementById('overviewHero');
        if (!el) return;
        // Своё фото вместо стокового: снимок с корта, а не картинка из интернета
        var heroImg = '../images/heroes/tournaments.jpg';
        el.innerHTML =
            '<div class="to-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="to-hero-overlay"></div>' +
            // Лаймовой метки «KSLT» нет: она повторяла логотип в шапке и
            // выбивалась из ряда — на страницах категорий такой метки тоже нет
            '<div class="to-hero-content">' +
                '<h1>' + L.heroTitle + '</h1>' +
                // Одна строка под заголовком, а не две: вторая повторяла
                // первую другими словами и лишь удлиняла шапку
                '<h2 class="to-hero-sub">' + L.heroSub + '</h2>' +
                '<div class="tournament-hero-stats">' +
                    '<div class="hero-stat"><span class="hero-stat-value" id="toStatTotal">&mdash;</span><span class="hero-stat-label">' + SL.totalLabel + '</span></div>' +
                    '<div class="hero-stat"><span class="hero-stat-value" id="toStatParticipants">&mdash;</span><span class="hero-stat-label">' + SL.participantsLabel + '</span></div>' +
                    '<div class="hero-stat"><span class="hero-stat-value" id="toStatPrize">&mdash;</span><span class="hero-stat-label">' + SL.prizeLabel + '</span></div>' +
                    '<div class="hero-stat"><span class="hero-stat-value" id="toStatCategories">&mdash;</span><span class="hero-stat-label">' + SL.categoriesLabel + '</span></div>' +
                '</div>' +
            '</div>';
        loadOverviewStats();
    }

    function formatPrize(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return Math.round(num / 1000) + 'K';
        return String(num);
    }

    async function loadOverviewStats() {
        if (!client) return;
        try {
            var res = await client.from('tournaments')
                .select('id, prize_fund, published_at, category_id');
            var all = (res.data || []).filter(function(t) { return t.published_at !== null; });
            if (all.length === 0) all = res.data || [];

            /* ТУРНИРОВ — ТО ЖЕ ЧИСЛО, ЧТО НА ГЛАВНОЙ. Решение Кости 27.09
               (доска 482:9, блок B) и его же слова 04.10: «от 300 мы
               отталкиваемся и дальше начисляем турниры». До 04.10 здесь
               стояло all.length — все опубликованные строки, и выходило 49
               против 340 на главной. Формула одна, живёт в js/stats.js;
               день отсечки — в функции базы get_club_stats.
               БАЗА МОЛЧИТ — ОСТАЁТСЯ ПРОЧЕРК: соврать числом хуже, чем
               честно не знать, и запасной счёт вернул бы прежний шов. */
            var elВсего = document.getElementById('toStatTotal');
            if (elВсего && window.KSLT_STATS && window.KSLT_STATS.турнировВсего) {
                client.rpc('get_club_stats').then(function(ст) {
                    var д = (ст.data && ст.data[0]) || null;
                    if (ст.error || !д) return;
                    elВсего.textContent = window.KSLT_STATS.турнировВсего(д.tournaments);
                });
            }

            // Считаем все турнирные категории, включая Friendly Weekend.
            // Рейтинговых пять, но страница про турниры: ниже на ней шесть
            // блоков, и счётчик «пять» противоречил бы тому, что видно глазами
            var cats = {};
            all.forEach(function(t) {
                var cat = t.category_id || '';
                if (cat) cats[cat] = true;
            });
            el = document.getElementById('toStatCategories');
            if (el) el.textContent = Object.keys(cats).length;

            // Prize fund
            var totalPrize = 0;
            all.forEach(function(t) {
                if (t.prize_fund != null) {
                    var match = String(t.prize_fund).match(/[\d][\d\s,.\u00a0]*/);
                    if (match) {
                        var num = parseInt(match[0].replace(/[\s,.\u00a0]/g, ''), 10);
                        if (!isNaN(num) && num <= 100000000) totalPrize += num;
                    }
                }
            });
            /* НОЛЬ ПРЯЧЕМ ЦЕЛИКОМ, А НЕ ПОКАЗЫВАЕМ НУЛЁМ. Решение Кости
               27.09, доска 482:9, блок B: «если 0 стоит то скрывать». До
               04.10 оно было записано на доску и не доехало до кода —
               обложка показывала «ПРИЗОВОЙ ФОНД 0». Костя увидел это
               глазами на закрытой странице.
               Прячется ВЕСЬ показатель, а не только цифра: подпись без
               числа сообщает ещё меньше, чем ноль. Тот же приём, что у
               нулевых карточек в js/stats.js. */
            el = document.getElementById('toStatPrize');
            if (el) {
                var ячейка = el.closest('.hero-stat');
                if (totalPrize > 0) {
                    el.textContent = formatPrize(totalPrize);
                    if (ячейка) ячейка.style.display = '';
                } else if (ячейка) {
                    ячейка.style.display = 'none';
                }
            }

            // Игроки в рейтинге, сложенные по всем разрядам. Кто играет в
            // двух — считается дважды: это два разных места в двух таблицах.
            // Раньше здесь стояло число принятых заявок на турниры, а это
            // ответ на другой вопрос
            try {
                var счёт = window.KSLT_RANKINGS && window.KSLT_RANKINGS.countByCategory
                    ? await window.KSLT_RANKINGS.countByCategory() : null;
                el = document.getElementById('toStatParticipants');
                if (el) el.textContent = (счёт && счёт.всего) || 0;
            } catch(e) {}
        } catch(e) {}
    }

    async function loadTournaments() {
        var grouped = null;

        // Категории — до турниров: по ним раскладываются группы
        await loadCategories();

        if (client) {
            try {
                // Load all tournaments so every category has data with gender
                var result = await client.from('tournaments')
                    .select('*')
                    .order('date_start', { ascending: true });

                if (result.data && result.data.length > 0) {
                    // Filter out drafts (published_at is null = draft)
                    var publishedRows = result.data.filter(function(t) {
                        return t.published_at !== null;
                    });
                    // Backward compat: if ALL tournaments have published_at=null, show all
                    if (publishedRows.length === 0) {
                        publishedRows = result.data;
                    }
                    // Load registration counts per tournament
                    var tIds = publishedRows.map(function(t) { return t.id; });
                    var regCounts = {};
                    try {
                        if (tIds.length > 0) {
                            // Считаем только одобренные заявки. Раньше в счёт шли
                            // все подряд — снявшиеся, отклонённые, лист ожидания,
                            // и на карточке стояло больше народу, чем играло
                            var regsResult = await client.from('tournament_registrations')
                                .select('tournament_id')
                                .in('tournament_id', tIds)
                                .in('status', (window.KSLT_SLOTS || {}).MAIN_DRAW || ['approved', 'pending', 'draw']);
                            if (regsResult.data) {
                                regsResult.data.forEach(function(r) {
                                    regCounts[r.tournament_id] = (regCounts[r.tournament_id] || 0) + 1;
                                });
                            }
                        }
                    } catch (re) {
                        console.warn('Registration counts unavailable:', re.message);
                    }
                    grouped = groupByCategory(publishedRows, true, regCounts);
                }
            } catch(e) {
                console.error('Supabase tournaments overview error:', e);
            }
        }

        if (!grouped) grouped = {};
        renderCategories(grouped);
    }

    // Category ID is now stored without gender prefix
    function getCatId(catId) {
        if (!catId) return 'tour';
        return catId;
    }

    function groupByCategory(rows, fromSupabase, regCounts) {
        regCounts = regCounts || {};
        var map = {};
        var today = new Date().toISOString().substring(0, 10);
        CATEGORIES.forEach(function(c) { map[c.key] = []; });

        rows.forEach(function(t) {
            var cat = getCatId(t.category_id);
            if (!map[cat]) map[cat] = [];

            var d = new Date(t.date_start + 'T00:00:00');
            var day = String(d.getDate()).padStart(2, '0');
            var month = months[d.getMonth()];
            var gender = t.gender || '';

            // Auto-compute status (with overrides)
            var effectiveStatus;
            if (t.status === 'cancelled' || t.status === 'registration_closed' || t.status === 'completed') {
                effectiveStatus = t.status;
            } else {
                effectiveStatus = computeStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
            }
            effectiveStatus = settleStatus(t, effectiveStatus);
            var cardStatus = mapStatus(effectiveStatus);

            // Registration dates line (show only if reg_end >= today)
            var regLine = '';
            if (t.registration_start && t.registration_end && t.registration_end >= today) {
                var rs = new Date(t.registration_start + 'T00:00:00');
                var re = new Date(t.registration_end + 'T00:00:00');
                regLine = rs.getDate() + ' ' + months[rs.getMonth()] + ' — ' + re.getDate() + ' ' + months[re.getMonth()];
            }

            map[cat].push({
                id: t.id,
                name: isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title),
                date: { day: day, month: month },
                _dateSort: t.date_start,
                location: isEn ? (t.location_en || t.location) : (isKg ? (t.location_kg || t.location || '') : (t.location || '')),
                format: formatLabels[t.format] || t.format || '',
                _rawFormat: t.format || '',
                participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                // Свободные места считает общий модуль — он же на главной
                // и на странице турнира, поэтому цифры везде совпадают
                slots: window.KSLT_SLOTS
                    ? window.KSLT_SLOTS.line(t, regCounts[t.id] || 0, cardStatus)
                    : null,
                slotsStat: window.KSLT_SLOTS
                    ? window.KSLT_SLOTS.stat(t, regCounts[t.id] || 0, cardStatus)
                    : null,
                prize: t.prize_fund || '',
                feeMember: t.fee_member != null ? Number(t.fee_member) : null,
                feeGuest: t.fee_guest != null ? Number(t.fee_guest) : null,
                status: cardStatus,
                _rawStatus: effectiveStatus,
                statusText: statusLabels[effectiveStatus] || statusLabels.upcoming,
                gender: gender,
                noRating: !!NO_RATING[cat],
                genderLabel: (t.format !== 'mixed_doubles' && !NO_RATING[cat] && gender)
                    ? (gender === 'women' ? L.women : (gender === 'mixed' ? formatLabels.mixed_doubles : L.men))
                    : '',
                regLine: regLine,
                image: t.image_url || t.image || '',
                /* Целая афиша — для миниатюры в полосе. Крупная карточка
                   остаётся на обрезанной: там афиша идёт фоном во всю
                   ширину, и вписывать её целиком некуда */
                imageFull: t.image_full || '',
                _startTime: t.start_time || null,
                // Исходная запись: по ней собирается карточка с афишей сбоку —
                // та же, что на главной. Ей нужны поля базы, а не наши подписи
                _row: t,
                _taken: regCounts[t.id] || 0,
                _fromSupabase: true
            });
        });

        // Sort: active/upcoming first (date asc), then past (date desc)
        Object.keys(map).forEach(function(key) {
            map[key].sort(function(a, b) {
                var aIsPast = a.status === 'past';
                var bIsPast = b.status === 'past';
                if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
                if (aIsPast) return (b._dateSort || '').localeCompare(a._dateSort || '');
                return (a._dateSort || '').localeCompare(b._dateSort || '');
            });
        });

        // Save full data for search
        _allGrouped = {};
        Object.keys(map).forEach(function(key) {
            _allGrouped[key] = map[key].slice();
        });

        // ПЯТЬ, А НЕ ЧЕТЫРЕ: столько мест на самом широком из видов —
        // крупная карточка плюс четыре слота на планшете. При четырёх один
        // слот там оставался пустым ВСЕГДА, потому что данных не было
        var МЕСТ_В_КАТЕГОРИИ = 5;
        var sliced = {};
        Object.keys(map).forEach(function(key) {
            sliced[key] = map[key].slice(0, МЕСТ_В_КАТЕГОРИИ);
        });

        return sliced;
    }

        // Календарь главнее записи в базе: у 77 турниров из 127 статус остался
        // с прошлого сезона — «регистрация открыта» на мартовском турнире.
        // Если дата окончания прошла, турнир завершён, что бы ни стояло в поле
        function settleStatus(t, stored) {
            var today = new Date().toISOString().substring(0, 10);
            var end = t.date_end || t.date_start;
            if (end && end < today && stored !== 'cancelled') return 'completed';
            return stored;
        }

    function mapStatus(s) {
        if (s === 'registration_open') return 'open';
        if (s === 'ongoing') return 'ongoing';
        if (s === 'registration_closed') return 'closed';
        if (s === 'completed' || s === 'cancelled') return 'past';
        return 'soon';
    }

    /**
     * Карточки категории на телефоне — те же, что на главной.
     *
     * На широком экране категория показана крупной афишей и стопкой строк
     * рядом: там есть место под описание, адрес и взнос. На телефоне эта
     * раскладка разъезжалась — текст налезал на афишу, а карточки шли
     * разной высоты. Рисуем общим модулем, тем же, что собирает карточки
     * на главной: один вид на весь сайт, правка в одном месте.
     *
     * Четыре турнира — две в ряд, два ряда. Пятая карточка оставила бы
     * дыру в ряду, а остальные и так за ссылкой «Все турниры».
     *
     * Модулю нужна запись из базы, а не наши подписи, — она лежит в _row.
     */
    // ГРАНИЦА ОДНОЙ КОЛОНКИ — 640, А НЕ 768. Две ширины на весь продукт,
    // 640 и 992; 768 был третьей и уводил планшет в телефонную раскладку
    // ...и НИЗКИЙ ГОРИЗОНТАЛЬНЫЙ ЭКРАН — это тоже телефон, хотя по ширине
    // он 844. Замерено 27.09: на 844x390 категория уходила в планшетную
    // ветку и разворачивалась на 963 — две с половиной высоты экрана.
    // Правило продукта: планшет стоя делится ПОВОРОТОМ, а не третьей шириной
    var узкийЭкран = window.matchMedia
        ? window.matchMedia('(max-width: 640px), (max-height: 500px) and (orientation: landscape)')
        : null;

    function телефон() {
        return !!(узкийЭкран && узкийЭкран.matches && window.KSLT_TCARD);
    }

    /**
     * Сколько боковых слотов рисуем.
     *
     * Число уменьшается вместе с шириной, и ни на одном виде не остаётся
     * НЕПОЛНОГО РЯДА: на десктопе столб стоит сбоку колонкой — три; выше
     * 640 он уходит под карточку в две колонки — значит два, иначе ряд
     * из двух и ряд из одного; на телефоне карточки идут лентой — одна
     * рядом с крупной, всего две.
     *
     * Решение Кости 27.09: десктоп три, планшет четыре (два целых ряда
     * по два), телефон — лента до шести карточек.
     */
    function слотов() {
        if (!window.matchMedia) return 3;
        if (window.matchMedia('(min-width: 992px)').matches) return 3;
        // Выше 640 столб уходит ПОД карточку в две колонки: четыре слота —
        // это два целых ряда. Три дали бы ряд из двух и ряд из одного
        if (window.matchMedia('(min-width: 641px)').matches) return 4;
        return 1;
    }

    function карточкиТелефона(items, фонКатегории) {
        var html = '<div class="tournaments-grid to-phone-cards">';
        // ЛЕНТА ДО ШЕСТИ. Было четыре и сеткой в два ряда; решение Кости
        // 27.09 — горизонтальная лента со снапом, как у телефона боком
        items.slice(0, 6).forEach(function(it) {
            if (!it._row) return;
            // У части турниров своей афиши нет — на широком экране для них
            // берётся фоновая картинка категории. Общий модуль про этот
            // запас не знает, поэтому подставляем сами. Исходную запись не
            // трогаем: она общая с остальной страницей
            var запись = it._row;
            if (!запись.image && !запись.image_url && фонКатегории) {
                запись = Object.assign({}, запись, { image: фонКатегории });
            }
            html += window.KSLT_TCARD.render(запись, { taken: it._taken });
        });
        return html + '</div>';
    }

    function renderCategories(grouped) {
        var container = document.getElementById('overviewCategories');
        if (!container) return;
        _grouped = grouped;

        var html = '';

        // Разряды с живыми турнирами идут первыми: человек заходит сюда, чтобы
        // записаться, и не должен пролистывать архив в поисках открытой
        // регистрации. Внутри группы порядок разрядов прежний
        // ТРИ УРОВНЯ, А НЕ ДВА. Было: «есть хоть один не-прошедший» вперёд —
        // и категория с ИДУЩИМ турниром не отличалась от категории, где
        // только «скоро». Решение Кости 27.09: сначала та, где играют прямо
        // сейчас; потом та, где есть предстоящие; потом всё остальное.
        // Внутри уровня порядок категорий прежний, из базы
        var вес = function(ключ) {
            var список = grouped[ключ] || [];
            // 'ongoing' — так называет идущий турнир mapStatus (:519)
            if (список.some(function(t) { return t.status === 'ongoing'; })) return 2;
            if (список.some(function(t) { return t.status !== 'past'; })) return 1;
            return 0;
        };
        var порядок = CATEGORIES.slice().sort(function(a, b) {
            return вес(b.key) - вес(a.key);
        });

        порядок.forEach(function(cat) {
            var items = grouped[cat.key] || [];
            // Пустую категорию не показываем вовсе. Пять блоков подряд с
            // надписью «турниров нет» говорят не о клубе, а о том, что
            // страницу забыли наполнить
            if (items.length === 0) return;
            var catData = (typeof tournamentsData !== 'undefined' && tournamentsData.categories[cat.key]) || {};
            var bgImage = catData.bgImage || '';
            _bgImages[cat.key] = bgImage;

            html += '<div class="to-category-block" data-cat="' + cat.key + '">';
            html += '<div class="to-category-header">';
            html += '<h2 class="to-category-title">' + cat.name + '</h2>';
            html += '<a href="' + tournamentsPage + '?category=' + cat.key + '" class="to-view-all">' + L.viewAll + ' ' + arrowSvg + '</a>';
            html += '</div>';

            if (телефон()) {
                html += карточкиТелефона(items, bgImage);
            } else {
                html += '<div class="to-card-grid">';
                var featuredBg = items[0].image || bgImage;
                html += renderFeatured(items[0], featuredBg, cat.key);
                // ТРИ СЛОТА ВСЕГДА, и пустой ГОВОРИТ, а не молчит.
                // Замерено 26.09 до правки: столб был то из одного слота,
                // то из трёх, и крупная карточка каждый раз подстраивалась
                // под него — 420 · 185 · 191 · 160 в одной странице
                var сколько = слотов();
                html += '<div class="to-side-stack">';
                for (var i = 1; i <= сколько; i++) {
                    // КАРТОЧКА ЛЕЖИТ В СВОЁМ СЛОТЕ. Слот — точка отсчёта
                    // ширины (container-type): полоса перестраивается в
                    // плитку по СВОЕЙ ширине, а не по ширине окна. Иначе
                    // на 1024 (столб рядом с крупной, карточка 469) и на
                    // 768 (столб под ней в два столбца, карточка 313)
                    // пришлось бы заводить точки останова под каждый
                    // случай — а их две на весь сайт.
                    html += items[i]
                        ? '<div class="to-slot">' + renderCompact(items[i], cat.key, i) + '</div>'
                        : '<div class="to-slot-empty"></div>';
                }
                html += '</div>';
                html += '</div>';
            }

            html += '</div>';
        });

        // Все категории пусты — одна заглушка вместо пяти подряд
        if (!html) {
            html = '<div class="to-category-block"><div class="to-card-grid">' +
                   '<div class="to-empty">' + emptySvg + '<p>' + L.empty + '</p></div>' +
                   '</div></div>';
        }

        container.innerHTML = html;
        attachEvents();
        initSearch();
        startCountdownTimer();
        initRegisterButtons();
        // У карточек с главной свой счётчик до старта
        if (телефон() && window.KSLT_TCARD.startTicker) window.KSLT_TCARD.startTicker();

        // Ширину окна меняют редко, но при повороте телефона категория
        // должна пересобраться: иначе на альбомной останутся плитки, а на
        // компьютере после сужения — крупные афиши
        if (узкийЭкран && !renderCategories._следим) {
            renderCategories._следим = true;
            var былоУзко = узкийЭкран.matches;
            window.addEventListener('resize', function() {
                var стало = узкийЭкран.matches;
                if (стало === былоУзко) return;
                былоУзко = стало;
                renderCategories(_grouped);
            });
        }
    }


    /**
     * Окно парной заявки для кнопки в карточке. Данные турнира и имя игрока
     * подтягиваем на месте: карточка знает только его номер.
     */
    async function открытьПарнуюЗаявку(btn) {
        var client = window.supabaseClient || (typeof supabase !== 'undefined' && window.SUPABASE_URL
            ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);
        if (!client || !window.KSLT_DOUBLES) return;

        var сессия = await client.auth.getSession();
        if (!сессия.data.session) {
            if (window.KSLT_REG && window.KSLT_REG.предложитьВойти) {
                window.KSLT_REG.предложитьВойти(isEn, isKg);
            }
            return;
        }

        var профиль = await client.from('profiles')
            .select('full_name, player_id').eq('id', сессия.data.session.user.id).single();
        var турнир = await client.from('tournaments')
            .select('id, title, title_en, title_kg, format, gender, ntrp_combined_max').eq('id', btn.dataset.tid).single();
        if (!турнир.data) return;

        window.KSLT_DOUBLES.открыть({
            client: client,
            tournament: турнир.data,
            playerId: профиль.data ? профиль.data.player_id : null,
            playerName: профиль.data ? профиль.data.full_name : '',
            onDone: function(info) {
                if (info && info.created && window.KSLT_REG) window.KSLT_REG.markRegistered(client);
            }
        });
    }

    // ---- Запись на турнир прямо из карточки ----
    // Решение принимает Edge Function, как и на остальных точках входа
    function initRegisterButtons() {
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.to-register');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();          // карточка кликабельна целиком

            // Парный: открываем окно выбора напарника прямо здесь — уводить
            // человека на страницу турнира ради одной кнопки незачем
            if (btn.dataset.doubles) {
                открытьПарнуюЗаявку(btn);
                return;
            }

            if (!window.KSLT_REG || !client) return;

            var wasLabel = btn.textContent;
            btn.disabled = true;
            btn.textContent = isEn ? 'Sending...' : (isKg ? 'Жөнөтүлүүдө...' : 'Отправка...');

            window.KSLT_REG.submit(client, btn.dataset.tid, { isEn: isEn, isKg: isKg }).then(function(info) {
                if (info && info.created) {
                    window.KSLT_REG.markRegistered(client);
                } else {
                    btn.disabled = false;
                    btn.textContent = wasLabel;
                }
            });
        }, true);

        if (window.KSLT_REG && window.KSLT_REG.markRegistered) {
            window.KSLT_REG.markRegistered(client);
        }
    }

    /** «1500» → «1 500»: пробел между тысячами, иначе сумма читается с трудом */
    function money(n) {
        return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    }

    /**
     * Взнос на карточке. Две суммы, если заведены обе; одна, если задана
     * только она; ничего, если не задано ничего — про деньги молчим, как и
     * про призовой фонд, которого нет.
     */
    function renderFeatured(t, bgImage, catKey) {
        // Разметку собирает общий модуль: страница только готовит данные.
        // Раньше карточка была написана здесь заново и постепенно разошлась
        // с такой же карточкой на страницах категорий
        var F = window.KSLT_TFEATURED;
        return F.карточка({
            id: t.id,
            href: tournamentPage + '?id=' + t.id,
            name: t.name,
            image: bgImage,
            status: t.status,
            statusText: t.statusText,
            date: t.date,
            genderLabel: t.genderLabel,
            noRating: t.noRating,
            location: t.location,
            regLine: t.regLine,
            format: t.format,
            prize: t.prize,
            участники: t.slotsStat || null,
            взнос: взносДляКарточки(t),
            регПодпись: isEn ? 'Reg' : (isKg ? 'Кат' : 'Рег'),
            форматПодпись: L.format,
            призПодпись: L.prize,
            взносПодпись: L.fee,
            _rawStatus: t._rawStatus,
            _dateSort: t._dateSort,
            _startTime: t._startTime,
            _gender: t._gender,
            _row: t._row,
            _taken: t._taken,
            // Такая же карточка, как на страницах категорий: афиша сбоку,
            // справа даты, отсчёт и кнопка
            боком: true
        });
    }

    /** Взнос для карточки: сумма и расшифровка в подсказке. */
    function взносДляКарточки(t) {
        var m = t.feeMember, g = t.feeGuest;
        if (m == null && g == null) return null;
        var двойной = (m != null && g != null && m !== g);
        var пара = (t._rawFormat === 'doubles' || t._rawFormat === 'mixed_doubles') ? ' (' + L.perPair + ')' : '';
        return {
            value: двойной ? money(m) + ' / ' + money(g) : money(m != null ? m : g),
            title: двойной
                ? money(m) + ' ' + L.som + ' — ' + L.feeMember + ', ' + money(g) + ' ' + L.som + ' — ' + L.feeGuest + пара
                : money(m != null ? m : g) + ' ' + L.som + пара
        };
    }


    /** Парный или микст: заявку с двумя людьми собирают на странице турнира. */
    function парный(t) {
        return t._rawFormat === 'doubles' || t._rawFormat === 'mixed_doubles';
    }

    function renderCompact(t, catKey, idx) {
        var compactHref = tournamentPage + '?id=' + t.id;

        // АФИША СЛЕВА У ВСЕХ, НЕЗАВИСИМО ОТ СТАТУСА — решение Кости 28.09:
        // «может, тоже просто ставить афишу слева, чем прятать её в
        // подложку». Раньше завершённым афиша давалась ФОНОМ и глушилась:
        // под текстом оставались цветные пятна, а контраст на такой
        // подложке непредсказуем — среднее значение врёт о картинке.
        // Довод «у архива останется настроение» дешевле, чем читаемость,
        // и вид карточки не должен зависеть от статуса: одно понятие —
        // одно определение.
        var прошёл = t.status === 'past';
        /* Миниатюра показывает целую афишу, если она заведена: короб
           3:4 вписывает её через background-size: contain. Старые турниры
           целой не имеют — им остаётся обрезанная, как было */
        var постер = t.imageFull || t.image;
        var афиша = постер ? ' style="--poster:url(' + постер + ')"' : '';

        return '<div class="to-compact to-compact-thumb' + (прошёл ? ' to-compact-past' : '') +
            '" data-cat="' + catKey + '" data-idx="' + idx + '"' +
            афиша + '>' +
            /* ВХОД — НАСТОЯЩАЯ ССЫЛКА. Полосу рисуют ДВА места: здесь и
               js/tournament-blocks.js:208, и содержимое у копий разное —
               места показывает только эта. Слой входа у обеих ОДИН, из
               KSLT_TFEATURED, чтобы на шве не разошлось ещё и это */
            window.KSLT_TFEATURED.слойСсылки(compactHref, t.name) +
            '<div class="to-compact-left">' +
                // СТАТУС НАД ДАТОЙ, И НЕ ПОВЕРХ АФИШИ — решение Кости 28.09:
                // «на афишу не залезай, до границы афиш». Плашка ушла из
                // блока справа в колонку сведений и стоит первой: сверху
                // «что с турниром», под ней «когда». Поверх афиши она лежала
                // absolute — не принадлежала ни одной колонке и закрывала
                // картинку, за которую эта колонка и отведена.
                '<span class="to-compact-status ' + t.status + '">' + t.statusText + '</span>' +
                '<div class="to-compact-date">' +
                    '<span class="to-day">' + t.date.day + '</span>' +
                    '<span class="to-month">' + t.date.month + '</span>' +
                '</div>' +
                (t.genderLabel ? '<span class="to-compact-gender-badge">' + t.genderLabel + '</span>' : '') +
                (t.noRating ? '<span class="to-compact-norating-badge">' + L.noRating + '</span>' : '') +
            '</div>' +
            '<div class="to-compact-info">' +
                '<h4>' + t.name + '</h4>' +
                '<div class="to-compact-sub">' +
                    '<span>' + pinSvg + ' ' + t.location + '</span>' +
                    (t.regLine ? '<span class="to-compact-reg">' + (isEn ? 'Reg: ' : (isKg ? 'Кат: ' : 'Рег: ')) + t.regLine + '</span>' : '') +
                    (t.slots ? '<span class="to-compact-slots' + (t.slots.tight ? ' to-slots-tight' : '') + '">' + t.slots.text + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="to-compact-right">' +
                // Запись прямо отсюда: раньше в боковой карточке был только
                // статус «регистрация открыта», а записаться было негде —
                // приходилось открывать турнир ради одной кнопки
                (t._rawStatus === 'registration_open'
                    ? '<button class="btn-register to-register to-compact-regbtn" data-tid="' + t.id + '"' +
                        // В парном нужен напарник — заявку собирают на странице
                        // турнира, отсюда только ведём туда
                        (парный(t) ? ' data-doubles="1"' : '') + '>' + L.register + '</button>'
                    : '') +
                // Отсчёт у завершённого турнира показывал «ИДЁТ СЕЙЧАС»:
                // дата в прошлом, а функция считает прошлое началом матча
                (t.status === 'past' ? '' : getCountdownHtml(t._dateSort, t._startTime)) +
            '</div>' +
        '</div>';
    }

    function attachEvents() {
        var container = document.getElementById('overviewCategories');
        if (!container) return;

        container.addEventListener('click', function(e) {
            // Кнопки внутри карточки живут своей жизнью: запись отправляет
            // заявку, а карточка целиком ведёт на страницу турнира. Без этой
            // проверки нажатие на «Регистрацию» просто уводило со страницы
            if (e.target.closest('.btn-register, .btn-calendar')) return;

            /* Полоса больше не ходит обработчиком — у неё настоящая
               ссылка (KSLT_TFEATURED.слойСсылки). Остаётся крупная
               карточка: её вариант с афишей фоном рисует
               js/tournament-featured.js:121 всё ещё как div[data-href].
               Записано открытым — закрывается вместе со страницей
               категории, где эта карточка и живёт */
            var card = e.target.closest('.to-featured[data-href]');
            if (card) {
                window.location.href = card.dataset.href;
            }
        });
    }

    function initSearch() {
        var input = document.getElementById('overviewSearch');
        if (!input) return;

        input.addEventListener('input', function() {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(function() {
                var query = input.value.trim().toLowerCase();
                if (!query) {
                    renderCategories(_grouped);
                    return;
                }
                // Filter ALL tournaments (not sliced) by name
                var filtered = {};
                CATEGORIES.forEach(function(cat) {
                    var items = (_allGrouped[cat.key] || []).filter(function(item) {
                        return item.name.toLowerCase().indexOf(query) !== -1;
                    });
                    if (items.length > 0) filtered[cat.key] = items;
                });
                renderSearchResults(filtered);
            }, 200);
        });
    }

    function renderSearchResults(filtered) {
        var container = document.getElementById('overviewCategories');
        if (!container) return;

        var html = '';

        CATEGORIES.forEach(function(cat) {
            var items = filtered[cat.key];
            if (!items || !items.length) return;

            var catData = (typeof tournamentsData !== 'undefined' && tournamentsData.categories[cat.key]) || {};
            var bgImage = catData.bgImage || '';

            html += '<div class="to-category-block" data-cat="' + cat.key + '">';
            html += '<div class="to-category-header">';
            html += '<h2 class="to-category-title">' + cat.name + '</h2>';
            html += '<a href="' + tournamentsPage + '?category=' + cat.key + '" class="to-view-all">' + L.viewAll + ' ' + arrowSvg + '</a>';
            html += '</div>';

            html += '<div class="to-card-grid">';
            var featuredBg = items[0].image || bgImage;
            html += renderFeatured(items[0], featuredBg, cat.key);
            if (items.length > 1) {
                html += '<div class="to-side-stack">';
                for (var i = 1; i < items.length; i++) {
                    html += renderCompact(items[i], cat.key, i);
                }
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        });

        if (!html) {
            html = '<div class="to-category-block"><div class="to-card-grid"><div class="to-empty">' + emptySvg + '<p>' + (isEn ? 'Nothing found' : (isKg ? 'Эч нерсе табылган жок' : 'Ничего не найдено')) + '</p></div></div></div>';
        }

        container.innerHTML = html;
        attachEvents();
        startCountdownTimer();
    }

})();
