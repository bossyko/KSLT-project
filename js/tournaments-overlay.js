// ========================================
// Tournaments — Supabase Overlay
// Loads DB tournaments on top of static data,
// sorts all by date (closest first)
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;

    // Detail page URL base
    var detailPage = isEn ? 'tournament-en.html' : (isKg ? 'tournament-kg.html' : 'tournament.html');

    if (!client) return;

    // Auto-compute tournament status from dates
    /* Вычисление одно на всю КСЛТ — js/tournament-status.js */
    function computeStatus(a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); }

    /** Сумма в шапке — коротко: 2626000 → «2.6M», 40000 → «40K» */
    function shortPrize(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return Math.round(num / 1000) + 'K';
        return String(num);
    }

    // Format prize fund total: 500000 → "500 000 сом", 0 → "0 сом"
    function formatPrize(num) {
        if (!num) return '0 ' + (isEn ? 'som' : 'сом');
        var str = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return str + ' ' + (isEn ? 'som' : 'сом');
    }

    function trackPageView(pageName) {
        if (!client) return;
        var key = 'kslt_pv_' + pageName;
        if (sessionStorage.getItem(key)) return;
        client.rpc('increment_page_view', { p_page_name: pageName }).then(function(res) {
            if (!res.error) sessionStorage.setItem(key, '1');
        });
    }

    /**
     * Шапка разряда: название и обложка. В разметке они стоят статикой —
     * «Tour Tournaments» и tour.jpg, — и на всех разрядах была одна и та же
     * картинка с чужим названием. Ставим по разряду из адреса.
     */
    function оформитьШапку(category) {
        var подписи = {
            promasters: 'Pro-Masters', masters: 'Masters', tour: 'Tour',
            challenger: 'Challengers', futures: 'Futures', friendly: 'Friendly Weekend'
        };
        var имя = подписи[category] || category;

        var заголовок = document.getElementById('categoryTitle');
        if (заголовок) {
            // «Friendly Weekend» — название самого разряда, как в админке и на
            // карточках. «Турниры Дружеские» звучало переводом с чужого языка
            заголовок.textContent = category === 'friendly' ? имя
                : (isEn ? (имя + ' Tournaments')
                    : (isKg ? (имя + ' турнирлери') : ('Турниры ' + имя)));
        }

        var фон = document.getElementById('heroBg');
        if (фон) {
            var путь = '../images/heroes/' + category + '.jpg';
            // Обложки нет — пусть остаётся общая, это лучше битой картинки
            фон.onerror = function() { фон.onerror = null; фон.src = '../images/heroes/tournaments.jpg'; };
            фон.src = путь;
        }
    }

    // Run after static data has rendered
    window.addEventListener('load', function() {
        var urlParams = new URLSearchParams(window.location.search);
        var category = urlParams.get('category') || 'tour';
        оформитьШапку(category);
        overlaySupabaseTournaments(category);
        loadHeroStats(category);
        trackPageView('tournaments-' + category);
    });

    // Load hero stats from Supabase (tournament count, participants, prize fund)
    // Always overwrites static fallback with real data (even if 0)
    /* ОБЛОЖКА ДРУЖЕСКИХ — ВАРИАНТ «Г», слово Кости 05.10.
       Первый слот слово в слово тот же, что у пяти остальных категорий
       (подписи взяты из pages/tournaments*.html), второй — ИГРОКИ, и это
       заявленные, а не рейтинговые: у дружеских рейтинга нет вовсе
       (решение Кости 30.09), а призового фонда у них не бывает.
       Так у всех шести категорий обложка несёт три живых числа, и ни одна
       не выглядит пустой. */
    var friendlyLabels = isEn ? {
        total: 'tournaments this season',
        players: 'players',
        completed: 'completed'
    } : (isKg ? {
        total: 'мезгилдеги мелдештер',
        players: 'оюнчу',
        completed: 'аяктаган'
    } : {
        total: 'турниров в сезоне',
        players: 'игроков',
        completed: 'завершённых'
    });

    /**
     * ОДНА ОБЛОЖКА НА ВСЕ ШЕСТЬ КАТЕГОРИЙ — по слову Кости 05.10
     * «и френдли приводи к общей обложке».
     *
     * До этого обложку строили ДВА места: отдельная ветка для дружеских и
     * общая для остальных пяти. Разметка в них была одна и та же, и шов
     * держался только на моей памяти.
     *
     * СОСТАВ ОБЛОЖКИ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ: сборщик один, а
     * какие показатели в него класть, решает категория. У дружеских
     * рейтинга нет вовсе (решение Кости 30.09), поэтому «Участников» и
     * «Призовой фонд» им нечем наполнить — у них свои три числа.
     * ПРЕДПОЛОЖЕНИЕ: «общая обложка» — это один сборщик и одна вёрстка, а
     * не одинаковые подписи. Угадал — скажешь.
     */
    function нарисоватьОбложку(показатели) {
        var блок = document.querySelector('.tournament-hero-stats');
        if (!блок) return;
        блок.innerHTML = показатели.map(function(п) {
            return '<div class="hero-stat">' +
                '<span class="hero-stat-value" id="' + п.id + '">&mdash;</span>' +
                '<span class="hero-stat-label">' + п.подпись + '</span></div>';
        }).join('');
        блок.style.display = '';
    }

    /**
     * НОЛЬ ПРЯЧЕТ ВЕСЬ ПОКАЗАТЕЛЬ, А НЕ ПОКАЗЫВАЕТСЯ НУЛЁМ.
     * Решение Кости 27.09, доска 482:9 блок B. На обзорной оно сделано
     * 04.10, а сюда не доехало: призовой фонд стоял нулём во всех пяти
     * категориях. Подпись без числа сообщает ещё меньше, чем ноль.
     */
    function поставитьПоказатель(id, число, текст) {
        var э = document.getElementById(id);
        if (!э) return;
        var ячейка = э.closest('.hero-stat');
        if (число > 0) {
            э.textContent = (текст != null) ? текст : число;
            if (ячейка) ячейка.style.display = '';
        } else if (ячейка) {
            ячейка.style.display = 'none';
        }
    }

    async function loadHeroStats(category) {
        var statsBlock = document.querySelector('.tournament-hero-stats');

        if (category === 'friendly') {
            // Friendly: show Total / Upcoming / Completed
            нарисоватьОбложку([
                { id: 'statFriendlyTotal',     подпись: friendlyLabels.total },
                { id: 'statFriendlyPlayers',   подпись: friendlyLabels.players },
                { id: 'statFriendlyCompleted', подпись: friendlyLabels.completed }
            ]);
            try {
                var result = await client.from('tournaments')
                    .select('id, date_end, published_at')
                    .eq('category_id', 'friendly');
                /* ЗАПАСНОГО СЧЁТА НЕТ. Было: нет опубликованных — показываем
                   ВСЕ строки, то есть черновики. Ноль — законный ответ. */
                var allT = (result.data || []).filter(function(t) { return t.published_at !== null; });
                var today = new Date().toISOString().substring(0, 10);
                var completed = allT.filter(function(t) { return t.date_end && t.date_end < today; }).length;

                /* ИГРОКИ ДРУЖЕСКИХ — РАЗНЫЕ ЛЮДИ, А НЕ ЧИСЛО ЗАЯВОК.
                   Один человек играет в нескольких дружеских за сезон, и
                   счёт заявок ответил бы на другой вопрос — ту же ошибку
                   уже ловили на Futures: 22 заявки при 68 игроках. */
                var игроков = 0;
                try {
                    var идТурниров = allT.map(function(t) { return t.id; });
                    if (идТурниров.length > 0) {
                        var зая = await client.from('tournament_registrations')
                            .select('player_id')
                            .in('tournament_id', идТурниров);
                        if (зая.data) {
                            var разные = {};
                            зая.data.forEach(function(з) {
                                if (з.player_id) разные[з.player_id] = 1;
                            });
                            игроков = Object.keys(разные).length;
                        }
                    }
                } catch (ie) {
                    console.warn('Friendly players count unavailable:', ie.message);
                }

                поставитьПоказатель('statFriendlyTotal', allT.length);
                поставитьПоказатель('statFriendlyPlayers', игроков);
                поставитьПоказатель('statFriendlyCompleted', completed);
            } catch(e) {}
            return;
        }

        /* У пяти категорий слоты обложки лежат в pages/tournaments.html —
           там же их переводы на три языка. Собирать их заново значит
           потерять перевод, поэтому сборщик нужен только дружеским, у
           которых разметки в странице нет. Общее у всех — ВИД слота и
           правило «ноль прячет показатель»; оно и сведено в одно место. */
        if (statsBlock) statsBlock.style.display = '';

        try {
            // All tournaments in this category (all statuses)
            var result = await client.from('tournaments')
                .select('id, prize_fund, published_at')
                .eq('category_id', category);

            var allT = (result.data && !result.error) ? result.data : [];
            /* ЗАПАСНОГО СЧЁТА НЕТ — он был заряженным ружьём: у категории с
               нулём опубликованных обложка показала бы число ЧЕРНОВИКОВ.
               Соврать числом хуже, чем честно показать ноль. */
            var tournaments = allT.filter(function(t) { return t.published_at !== null; });
            var tournamentCount = tournaments.length;

            // Sum prize funds — extract number from text like "100,000 сом" or "500000"
            var totalPrize = 0;
            tournaments.forEach(function(t) {
                if (t.prize_fund != null) {
                    var raw = String(t.prize_fund);
                    var match = raw.match(/[\d][\d\s,.\u00a0]*/);
                    if (match) {
                        var cleaned = match[0].replace(/[\s,.\u00a0]/g, '');
                        var num = parseInt(cleaned, 10);
                        if (!isNaN(num) && num <= 100000000) totalPrize += num;
                    }
                }
            });
            поставитьПоказатель('statTournaments', tournamentCount);
            // В шапке — коротко, как на «Турнирах»: «2.6M», а не
            // «2 626 000 сом». Полная сумма ломала строку цифр
            поставитьПоказатель('statPrize', totalPrize, shortPrize(totalPrize));

            // Игроки разряда — те, кто стоит в его таблице рейтинга, а не те,
            // кто подавал заявки на турниры. Заявок было 22 при 68 игроках в
            // Futures: цифра отвечала на другой вопрос
            try {
                var счёт = window.KSLT_RANKINGS && window.KSLT_RANKINGS.countByCategory
                    ? await window.KSLT_RANKINGS.countByCategory() : null;
                поставитьПоказатель('statParticipants', (счёт && счёт[category]) || 0);
            } catch (re) {
                console.warn('Rating count unavailable:', re.message);
                поставитьПоказатель('statParticipants', 0);
            }

        } catch (e) {
            console.error('Hero stats error:', e);
        }
    }

    async function overlaySupabaseTournaments(category) {
        try {
            var result = await client.from('tournaments')
                .select('*')
                .eq('category_id', category)
                .order('date_start', { ascending: true });

            // Filter out drafts (published_at null = draft)
            var allData = result.data || [];
            /* ЧЕРНОВИК НЕ ПОКАЗЫВАЕТСЯ НИКОГДА. Было: нет опубликованных —
               рисуем ВСЁ, и посетитель видел неопубликованные турниры.
               Это уже не враньё числом, а утечка. */
            var publishedData = allData.filter(function(t) { return t.published_at !== null; });

            // Load registration counts per tournament for participant display
            var tIds = publishedData.map(function(t) { return t.id; });
            var regCounts = {};
            try {
                if (tIds.length > 0) {
                    var regsResult = await client.from('tournament_registrations')
                        .select('tournament_id')
                        .in('tournament_id', tIds);
                    if (regsResult.data) {
                        regsResult.data.forEach(function(r) {
                            regCounts[r.tournament_id] = (regCounts[r.tournament_id] || 0) + 1;
                        });
                    }
                }
            } catch (re) {
                console.warn('Registration counts unavailable:', re.message);
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
                format: 'Format', participants: 'Players', prizeFund: 'Prize',
                gender: 'Gender', details: 'Details', register: 'Register', calendar: 'Add to calendar'
            } : (isKg ? {
                format: 'Формат', participants: 'Катышуучулар', prizeFund: 'Сыйлык',
                gender: 'Жынысы', details: 'Толугураак', register: 'Каттоо', calendar: 'Календарга'
            } : {
                format: 'Формат', participants: 'Участники', prizeFund: 'Призовой',
                gender: 'Пол', details: 'Подробнее', register: 'Регистрация', calendar: 'В календарь'
            });

            var today = new Date().toISOString().substring(0, 10);

            // Convert Supabase data to card format
            var supaItems = publishedData.map(function(t) {
                var d = new Date(t.date_start + 'T00:00:00');
                var day = String(d.getDate()).padStart(2, '0');
                var month = months[d.getMonth()];

                // Состояние турнира: сохранённое, если его выставили руками,
                // иначе считаем по датам.
                var effectiveStatus;
                if (t.status === 'cancelled' || t.status === 'registration_closed' || t.status === 'completed') {
                    effectiveStatus = t.status;
                } else {
                    effectiveStatus = computeStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
                }
                // Турнир, который отыграли, — завершён, что бы ни стояло в базе.
                // Иначе апрельский турнир со стухшим «регистрация закрыта»
                // навсегда оставался бы среди предстоящих
                var lastDay = t.date_end || t.date_start;
                if (lastDay && lastDay < today && effectiveStatus !== 'cancelled') {
                    effectiveStatus = 'completed';
                }
                var cardStatusMap = { registration_open: 'open', completed: 'past', ongoing: 'ongoing', cancelled: 'past', registration_closed: 'closed' };
                var cardStatus = cardStatusMap[effectiveStatus] || 'soon';

                var gender = t.gender || '';
                var genderLabel = (t.format !== 'mixed_doubles' && category !== 'friendly' && (gender === 'men' || gender === 'women'))
                    ? (gender === 'women'
                        ? (isEn ? 'Women' : (isKg ? 'Аялдар' : 'Женский'))
                        : (isEn ? 'Men' : (isKg ? 'Эркектер' : 'Мужской')))
                    : (gender === 'mixed' ? (isEn ? 'Mixed' : (isKg ? 'Аралаш' : 'Смешанный')) : '');

                // Registration dates line (show only if reg_end >= today)
                var regLine = '';
                if (t.registration_start && t.registration_end && t.registration_end >= today) {
                    var rs = new Date(t.registration_start + 'T00:00:00');
                    var re = new Date(t.registration_end + 'T00:00:00');
                    regLine = rs.getDate() + ' ' + months[rs.getMonth()] + ' — ' + re.getDate() + ' ' + months[re.getMonth()];
                }

                // Gender for filtering
                var _gender = gender || 'all';

                return {
                    id: t.id,
                    name: isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title),
                    date: { day: day, month: month },
                    _dateSort: t.date_start,
                    location: isEn ? (t.location_en || t.location) : (isKg ? (t.location_kg || t.location || '') : (t.location || '')),
                    time: '',
                    format: formatLabels[t.format] || t.format || '',
                    participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                    prize: t.prize_fund ? ((/[а-яa-z]/i.test(String(t.prize_fund))) ? String(t.prize_fund) : formatPrize(parseInt(String(t.prize_fund).replace(/[^\d]/g, ''), 10) || 0)) : '',
                    status: cardStatus,
                    statusText: statusLabels[effectiveStatus] || statusLabels.upcoming,
                    genderLabel: genderLabel,
                    _gender: _gender,
                    _rawStatus: effectiveStatus,
                    _rawFormat: t.format || '',
                    feeMember: t.fee_member != null ? Number(t.fee_member) : null,
                    feeGuest: t.fee_guest != null ? Number(t.fee_guest) : null,
                    regLine: regLine,
                    image: t.image_url || t.image || '',
                    imageFull: t.image_full || '',
                    _startTime: t.start_time || null,
                    // Исходная запись для карточки с афишей сбоку: ей нужны
                    // поля базы, а не наши готовые подписи
                    _row: t,
                    _taken: regCounts[t.id] || 0,
                    _fromSupabase: true
                };
            });

            // Раскладываем турниры категории по трём блокам из одного запроса.
            //
            // Раньше здесь били ещё два запроса — «действующие» и «завершённые»,
            // и оба смотрели на поле status. А status у 77 турниров отстал от
            // календаря: апрельский турнир всё ещё числился «регистрация
            // открыта». Из-за этого он не попадал ни в архив (там ищут
            // status = completed), ни в предстоящие (оттуда его выбивала дата)
            // — и просто исчезал со страницы. Теперь состояние считается по
            // датам, как на странице «Турниры», и запрос нужен один.
            var liveItems = supaItems.filter(function(t) { return t.status === 'ongoing'; });
            var upcomingItems = supaItems.filter(function(t) {
                return t.status !== 'ongoing' && t.status !== 'past';
            });
            var pastItems = supaItems.filter(function(t) { return t.status === 'past'; });

            // Ближайшие сверху: это список того, что впереди, а не лента новостей
            upcomingItems.sort(function(a, b) {
                return (a._dateSort || '').localeCompare(b._dateSort || '');
            });
            liveItems.sort(function(a, b) {
                return (a._dateSort || '').localeCompare(b._dateSort || '');
            });
            // Архив наоборот: свежее сверху
            pastItems.sort(function(a, b) {
                return (b._dateSort || '').localeCompare(a._dateSort || '');
            });

            // Три блока вместо одной кучи: идущие сейчас, предстоящие и архив.
            // Раньше действующие турниры шли сплошным списком без заголовка,
            // и идущий прямо сегодня терялся между анонсами на октябрь.
            //
            // Разметку карточек рисует общий модуль tournament-blocks.js —
            // тот же, что на странице «Турниры». Раскладка там же: ближайший
            // турнир крупно слева, остальные полосами справа. Когда турнир
            // в блоке один, правая половина остаётся пустой — карточка не
            // растягивается на весь экран.
            var TB = window.KSLT_TBLOCK;
            var grid = document.getElementById('tournamentsGrid');
            if (!grid || !TB) return;

            var heroBg = (document.getElementById('heroBg') || {}).src || '';
            var PER_LOAD = 6;
            var _activeShown = Math.min(PER_LOAD, upcomingItems.length);
            var _pastShown = Math.min(PER_LOAD, pastItems.length);
            var upcomingSection = document.getElementById('upcoming');
            var liveSection = document.getElementById('live');
            var liveGrid = document.getElementById('liveGrid');
            var pastGrid = document.getElementById('pastTournamentsGrid');
            var pastSection = document.getElementById('past');

            var showMoreLabel = isEn ? 'Show more' : (isKg ? 'Дагы көрсөтүү' : 'Показать ещё');
            var showMoreArrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

            /** Кнопка «показать ещё» под блоком — одна на блок, перерисовывается вместе с ним */
            function syncShowMore(section, id, shown, total, onClick) {
                if (!section) return;
                var old = section.querySelector('.trn-show-more');
                if (old) old.remove();
                if (shown >= total) return;
                section.insertAdjacentHTML('beforeend',
                    '<div class="trn-show-more"><button class="trn-show-more-btn" id="' + id + '">' +
                    showMoreLabel + ' ' + showMoreArrow + '</button></div>');
                document.getElementById(id).addEventListener('click', onClick);
            }

            function renderUpcoming() {
                grid.innerHTML = TB.grid(upcomingItems.slice(0, _activeShown), heroBg);
                TB.bindLinks(grid);
                syncShowMore(upcomingSection, 'upcomingShowMore', _activeShown, upcomingItems.length, function() {
                    _activeShown = Math.min(_activeShown + PER_LOAD, upcomingItems.length);
                    renderUpcoming();
                    applyFilters(grid);
                });
                TB.startTimer();
                TB.initRegister();
                // Карточки турниров, куда игрок уже подал заявку, гаснут
                if (window.KSLT_REG && window.KSLT_REG.markRegistered) {
                    window.KSLT_REG.markRegistered(client);
                }
            }

            function renderLive() {
                if (!liveGrid) return;
                liveGrid.innerHTML = TB.grid(liveItems, heroBg);
                TB.bindLinks(liveGrid);
            }

            function renderPast() {
                if (!pastGrid) return;
                if (!pastItems.length) {
                    pastGrid.innerHTML = '<div class="trn-block-empty"><strong>' +
                        EMPTY.pastTitle + '</strong>' + EMPTY.pastText + '</div>';
                    return;
                }
                // Архив — полосами: на завершённый смотрят ради результата,
                // ему не нужны крупная афиша и кнопка регистрации
                pastGrid.innerHTML = pastItems.slice(0, _pastShown).map(function(t) {
                    return TB.compact(t);
                }).join('');
                TB.bindLinks(pastGrid);
                syncShowMore(pastSection, 'pastShowMore', _pastShown, pastItems.length, function() {
                    _pastShown = Math.min(_pastShown + PER_LOAD, pastItems.length);
                    renderPast();
                    applyFilters(grid);
                });
            }

            renderLive();
            renderUpcoming();
            renderPast();

            if (liveSection) liveSection.hidden = liveItems.length === 0;
            if (upcomingSection) upcomingSection.hidden = upcomingItems.length === 0;

            renderBlockSubs(liveItems, upcomingItems, pastItems);
            renderChipCounts(liveItems, upcomingItems, pastItems);

            // Поиск и фильтры должны видеть весь список, а не подгруженную часть
            _expandAll = function() {
                if (_activeShown >= upcomingItems.length && _pastShown >= pastItems.length) return;
                _activeShown = upcomingItems.length;
                _pastShown = pastItems.length;
                renderUpcoming();
                renderPast();
            };

            // Init search + filter buttons interaction
            initSearch(grid);
            initFilterSearch(grid);
            // Apply current filter state
            applyFilters(grid);
            if (TB) TB.startTimer();
            initStickyHeader();

        } catch (e) {
            console.error('Supabase tournaments overlay error:', e);
        }
    }

    var _searchTimer = null;
    /** Догружает скрытые под «Показать ещё» карточки — фильтр должен видеть весь список */
    var _expandAll = null;

    function initSearch(grid) {
        var input = document.getElementById('tournamentSearch');
        if (!input) return;

        input.addEventListener('input', function() {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(function() {
                applyFilters(grid);
            }, 200);
        });
    }

    /* Тексты пустого архива */
    var EMPTY = isEn ? {
        pastTitle: 'No tournaments played here yet',
        pastText: 'The first one will also be the first line in the archive.'
    } : (isKg ? {
        pastTitle: 'Бул категорияда азырынча оюн болгон эмес',
        pastText: 'Биринчи мелдеш архивдин биринчи сабы болот.'
    } : {
        pastTitle: 'В этой категории ещё не играли',
        pastText: 'Первый турнир станет и первой строкой в архиве.'
    });

    /* Подписи под заголовками блоков */
    var SUB = isEn ? {
        liveOne: 'tournament in play — the score updates live',
        liveMany: 'tournaments in play — the score updates live',
        upcomingOne: 'tournament ahead',
        upcomingMany: 'tournaments ahead',
        nearest: 'nearest',
        pastOne: 'tournament in the archive',
        pastMany: 'tournaments in the archive'
    } : (isKg ? {
        liveOne: 'мелдеш жүрүп жатат — эсеби түз эфирде',
        liveMany: 'мелдеш жүрүп жатат — эсеби түз эфирде',
        upcomingOne: 'мелдеш алдыда',
        upcomingMany: 'мелдеш алдыда',
        nearest: 'эң жакыны',
        pastOne: 'мелдеш архивде',
        pastMany: 'мелдеш архивде'
    } : {
        liveOne: 'турнир в игре — счёт обновляется вживую',
        liveMany: 'турнира в игре — счёт обновляется вживую',
        upcomingOne: 'турнир впереди',
        upcomingMany: 'турнира впереди',
        nearest: 'ближайший',
        pastOne: 'турнир в архиве',
        pastMany: 'турниров в архиве'
    });

    /** «1 турнир / 2 турнира / 5 турниров» — без склонения строка режет глаз */
    function plural(n, one, few, many) {
        if (isEn || isKg) return n === 1 ? one : few;
        var n10 = n % 10, n100 = n % 100;
        if (n10 === 1 && n100 !== 11) return one;
        if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
        return many;
    }

    function humanDate(iso) {
        if (!iso) return '';
        var months = isEn
            ? ['January','February','March','April','May','June','July','August','September','October','November','December']
            : (isKg
                ? ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
                : ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']);
        var d = new Date(iso + 'T00:00:00');
        return isEn ? (months[d.getMonth()] + ' ' + d.getDate())
                    : (d.getDate() + ' ' + months[d.getMonth()]);
    }

    function setSub(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function renderBlockSubs(liveItems, upcomingItems, pastItems) {
        var n = liveItems.length;
        setSub('liveSub', n + ' ' + plural(n, SUB.liveOne, SUB.liveMany, SUB.liveMany));

        n = upcomingItems.length;
        var line = n + ' ' + plural(n, SUB.upcomingOne, SUB.upcomingMany, SUB.upcomingMany);
        var nearest = upcomingItems[0] && upcomingItems[0]._dateSort;
        if (nearest) line += ' · ' + SUB.nearest + ' ' + humanDate(nearest);
        setSub('upcomingSub', line);

        n = pastItems.length;
        setSub('pastSub', n ? (n + ' ' + plural(n, SUB.pastOne, SUB.pastMany, SUB.pastMany)) : '');
    }

    /** Сколько турниров попадёт под фильтр — видно до нажатия */
    function renderChipCounts(liveItems, upcomingItems, pastItems) {
        var open = upcomingItems.filter(function(t) { return t.status === 'open'; }).length;
        var counts = {
            all: liveItems.length + upcomingItems.length + pastItems.length,
            open: open,
            soon: upcomingItems.length - open,
            past: pastItems.length
        };
        /* ЧИП, КОТОРЫЙ НИЧЕГО НЕ НАЙДЁТ, ГАСНЕТ.
           Было: ноль прятался в пустую строку, и «Предстоящие» без числа
           нельзя было отличить от «числа не знаем». Гашение отвечает на
           вопрос прямо, а нажать на пустоту больше нельзя. */
        document.querySelectorAll('.trn-chip-count[data-count]').forEach(function(el) {
            var v = counts[el.dataset.count];
            el.textContent = v ? v : '';
            var чип = el.closest('.trn-chip');
            if (чип && чип.dataset.value !== 'all') чип.disabled = !v;
        });
    }

    function initFilterSearch(grid) {
        document.querySelectorAll('.trn-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                var group = chip.dataset.filter;
                /* СОСТОЯНИЕ ЕДЕТ ВМЕСТЕ С ВИДОМ. Класс active красит чип, а
                   диктору про выбор говорит только aria-checked: без него
                   человек с диктором слышал семь одинаковых кнопок. */
                document.querySelectorAll('.trn-chip[data-filter="' + group + '"]').forEach(function(c) {
                    c.classList.remove('active');
                    c.setAttribute('aria-checked', 'false');
                });
                chip.classList.add('active');
                chip.setAttribute('aria-checked', 'true');
                applyFilters(grid);
            });
        });
    }

    /**
     * Фильтры поверх трёх блоков.
     *
     * Блоки уже разложены по состоянию, поэтому фильтр статуса не столько
     * отсеивает карточки, сколько оставляет на экране нужный блок: выбрал
     * «Завершённые» — видишь только архив. Пол и поиск режут карточки внутри
     * оставшихся блоков; блок, из которого выбило все карточки, прячется —
     * заголовок над пустотой читается как поломка.
     */
    function applyFilters(grid) {
        var input = document.getElementById('tournamentSearch');
        var query = input ? input.value.trim().toLowerCase() : '';

        var statusChip = document.querySelector('.trn-chip[data-filter="status"].active');
        var genderChip = document.querySelector('.trn-chip[data-filter="gender"].active');
        var status = statusChip ? statusChip.dataset.value : 'all';
        var gender = genderChip ? genderChip.dataset.value : 'all';

        // Ищем по всему списку, а не по первым шести: иначе «женские» находит
        // пусто только потому, что нужные карточки ещё не подгружены
        if ((query || gender !== 'all') && _expandAll) _expandAll();

        var blocks = [
            { id: 'live',     grid: document.getElementById('liveGrid'),             shown: status === 'all' },
            { id: 'upcoming', grid: grid,                                            shown: status === 'all' || status === 'open' || status === 'soon' },
            { id: 'past',     grid: document.getElementById('pastTournamentsGrid'),  shown: status === 'all' || status === 'past' }
        ];

        blocks.forEach(function(b) {
            var section = document.getElementById(b.id);
            if (!section || !b.grid) return;

            var visible = 0;
            // Карточка с афишей сбоку — тоже карточка: когда турнир в блоке
            // один, рисуется именно она, и без неё блок считался пустым
            b.grid.querySelectorAll('.to-featured, .to-featured-side, .to-compact').forEach(function(card) {
                var cardStatus = card.dataset.status || '';
                var cardGender = card.dataset.gender || 'all';
                var statusMatch = (b.id !== 'upcoming') || status === 'all'
                    || (status === 'open' && cardStatus === 'open')
                    || (status === 'soon' && cardStatus !== 'open');
                var genderMatch = (gender === 'all') || (cardGender === gender);
                var title = card.querySelector('h3, h4');
                var nameMatch = !query || (title && title.textContent.toLowerCase().indexOf(query) !== -1);
                var ok = statusMatch && genderMatch && nameMatch;
                card.style.display = ok ? '' : 'none';
                if (ok) visible++;
            });

            var moreBtn = section.querySelector('.trn-show-more');
            if (moreBtn) moreBtn.style.display = (query || gender !== 'all') ? 'none' : '';

            var empty = b.grid.querySelector('.trn-block-empty');
            // Архив пустой по-настоящему — заглушка на месте, блок остаётся
            if (empty && !query && gender === 'all' && status !== 'open' && status !== 'soon') {
                section.hidden = !b.shown;
                return;
            }
            section.hidden = !b.shown || visible === 0;
        });

        // Все блоки скрыты — молчать нельзя, человек решит, что страница сломалась
        var none = document.getElementById('trnNoResults');
        if (none) {
            none.hidden = blocks.some(function(b) {
                var section = document.getElementById(b.id);
                return section && !section.hidden;
            });
        }
    }

    function initStickyHeader() {
        var header = document.getElementById('trnFilters');
        if (!header) return;
        // Insert sentinel before header
        var sentinel = document.createElement('div');
        sentinel.className = 'trn-sticky-sentinel';
        sentinel.style.height = '1px';
        sentinel.style.marginBottom = '-1px';
        header.parentNode.insertBefore(sentinel, header);

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                header.classList.toggle('stuck', !entry.isIntersecting);
            });
        }, { threshold: 0, rootMargin: '-113px 0px 0px 0px' });
        observer.observe(sentinel);
    }
})();
