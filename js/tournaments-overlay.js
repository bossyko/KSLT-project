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
    function computeStatus(regStart, regEnd, dateStart, dateEnd) {
        var now = new Date().toISOString().substring(0, 10);
        if (regStart && now < regStart) return 'upcoming';
        if (regStart && regEnd && now >= regStart && now <= regEnd) return 'registration_open';
        if (dateEnd && now > dateEnd) return 'completed';
        if (dateStart && now >= dateStart) return 'ongoing';
        if (regEnd && now > regEnd) return 'registration_closed';
        return 'upcoming';
    }

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

    // Run after static data has rendered
    window.addEventListener('load', function() {
        var urlParams = new URLSearchParams(window.location.search);
        var category = urlParams.get('category') || 'tour';
        overlaySupabaseTournaments(category);
        loadHeroStats(category);
        trackPageView('tournaments-' + category);
    });

    // Load hero stats from Supabase (tournament count, participants, prize fund)
    // Always overwrites static fallback with real data (even if 0)
    var friendlyLabels = isEn ? {
        total: 'total this season',
        upcoming: 'upcoming',
        completed: 'completed'
    } : (isKg ? {
        total: 'мезгилде баары',
        upcoming: 'алдыдагы',
        completed: 'аяктаган'
    } : {
        total: 'всего за сезон',
        upcoming: 'предстоящих',
        completed: 'завершённых'
    });

    async function loadHeroStats(category) {
        var statsBlock = document.querySelector('.tournament-hero-stats');

        if (category === 'friendly') {
            // Friendly: show Total / Upcoming / Completed
            if (statsBlock) {
                statsBlock.innerHTML =
                    '<div class="hero-stat"><span class="hero-stat-value" id="statFriendlyTotal">&mdash;</span><span class="hero-stat-label">' + friendlyLabels.total + '</span></div>' +
                    '<div class="hero-stat"><span class="hero-stat-value" id="statFriendlyUpcoming">&mdash;</span><span class="hero-stat-label">' + friendlyLabels.upcoming + '</span></div>' +
                    '<div class="hero-stat"><span class="hero-stat-value" id="statFriendlyCompleted">&mdash;</span><span class="hero-stat-label">' + friendlyLabels.completed + '</span></div>';
                statsBlock.style.display = '';
            }
            try {
                var result = await client.from('tournaments')
                    .select('id, date_end, published_at')
                    .eq('category_id', 'friendly');
                var allT = (result.data || []).filter(function(t) { return t.published_at !== null; });
                if (allT.length === 0) allT = result.data || [];
                var today = new Date().toISOString().substring(0, 10);
                var upcoming = allT.filter(function(t) { return !t.date_end || t.date_end >= today; }).length;
                var completed = allT.filter(function(t) { return t.date_end && t.date_end < today; }).length;
                var el = document.getElementById('statFriendlyTotal');
                if (el) el.textContent = allT.length;
                el = document.getElementById('statFriendlyUpcoming');
                if (el) el.textContent = upcoming;
                el = document.getElementById('statFriendlyCompleted');
                if (el) el.textContent = completed;
            } catch(e) {}
            return;
        }

        if (statsBlock) statsBlock.style.display = '';

        var elCount = document.getElementById('statTournaments');
        var elPart = document.getElementById('statParticipants');
        var elPrize = document.getElementById('statPrize');

        try {
            // All tournaments in this category (all statuses)
            var result = await client.from('tournaments')
                .select('id, prize_fund, published_at')
                .eq('category_id', category);

            var allT = (result.data && !result.error) ? result.data : [];
            var tournaments = allT.filter(function(t) { return t.published_at !== null; });
            if (tournaments.length === 0) tournaments = allT;
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
            if (elCount) elCount.textContent = tournamentCount;
            if (elPrize) {
                // В шапке — коротко, как на «Турнирах»: «2.6M», а не
                // «2 626 000 сом». Полная сумма ломала строку цифр
                elPrize.textContent = shortPrize(totalPrize);
            }

            // Count participants from registrations
            try {
                var ids = tournaments.map(function(t) { return t.id; });
                if (ids.length > 0) {
                    // Только принятые заявки: снявшиеся, отклонённые,
                    // заблокированные и лист ожидания на корт не выходят
                    var regsResult = await client.from('tournament_registrations')
                        .select('*', { count: 'exact', head: true })
                        .in('tournament_id', ids)
                        .eq('status', 'approved');
                    if (elPart) elPart.textContent = regsResult.count || 0;
                } else {
                    if (elPart) elPart.textContent = '0';
                }
            } catch (re) {
                console.warn('Registrations count unavailable:', re.message);
                if (elPart) elPart.textContent = '0';
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
            var publishedData = allData.filter(function(t) { return t.published_at !== null; });
            if (publishedData.length === 0) publishedData = allData;

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

            var statusLabels = isEn
                ? { registration_open: 'Registration Open', upcoming: 'Coming Soon', registration_closed: 'Registration Closed', ongoing: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
                : (isKg ? { registration_open: 'Каттоо ачык', upcoming: 'Жакында', registration_closed: 'Каттоо жабык', ongoing: 'Жүрүп жатат', completed: 'Аяктады', cancelled: 'Жокко чыгарылды' }
                : { registration_open: 'Регистрация открыта', upcoming: 'Скоро открытие', registration_closed: 'Регистрация закрыта', ongoing: 'Идёт', completed: 'Завершён', cancelled: 'Отменён' });

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
                        ? (isEn ? '♀ Women' : (isKg ? '♀ Аялдар' : '♀ Женский'))
                        : (isEn ? '♂ Men' : (isKg ? '♂ Эркектер' : '♂ Мужской')))
                    : (gender === 'mixed' ? (isEn ? '⚤ Mixed' : (isKg ? '⚤ Аралаш' : '⚤ Смешанный')) : '');

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
                    regLine: regLine,
                    image: t.image_url || t.image || '',
                    _startTime: t.start_time || null,
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
        document.querySelectorAll('.trn-chip-count[data-count]').forEach(function(el) {
            var v = counts[el.dataset.count];
            el.textContent = v ? v : '';
        });
    }

    function initFilterSearch(grid) {
        document.querySelectorAll('.trn-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                var group = chip.dataset.filter;
                document.querySelectorAll('.trn-chip[data-filter="' + group + '"]').forEach(function(c) {
                    c.classList.remove('active');
                });
                chip.classList.add('active');
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
            b.grid.querySelectorAll('.to-featured, .to-compact').forEach(function(card) {
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
