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

    // Format prize fund total: 500000 → "500 000 сом", 0 → "0 сом"
    function formatPrize(num) {
        if (!num) return '0 ' + (isEn ? 'som' : 'сом');
        var str = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return str + ' ' + (isEn ? 'som' : 'сом');
    }

    // Countdown helpers
    var _cdInterval = null;
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
        if (_cdInterval) clearInterval(_cdInterval);
        if (document.querySelectorAll('.to-cd[data-cd-date]').length > 0) {
            _cdInterval = setInterval(updateCountdowns, 1000);
        }
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
        total: 'Total this season',
        upcoming: 'Upcoming',
        completed: 'Completed'
    } : (isKg ? {
        total: 'Мезгилде баары',
        upcoming: 'Алдыдагы',
        completed: 'Аяктаган'
    } : {
        total: 'Всего за сезон',
        upcoming: 'Предстоящих',
        completed: 'Завершённых'
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
                elPrize.textContent = formatPrize(totalPrize);
            }

            // Count participants from registrations
            try {
                var ids = tournaments.map(function(t) { return t.id; });
                if (ids.length > 0) {
                    var regsResult = await client.from('tournament_registrations')
                        .select('*', { count: 'exact', head: true })
                        .in('tournament_id', ids);
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

                // Auto-compute status (with overrides)
                var effectiveStatus;
                if (t.status === 'cancelled' || t.status === 'registration_closed' || t.status === 'completed') {
                    effectiveStatus = t.status;
                } else {
                    effectiveStatus = computeStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
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
                    regLine = (isEn ? 'Reg: ' : (isKg ? 'Кат: ' : 'Рег: ')) + rs.getDate() + ' ' + months[rs.getMonth()] + ' — ' + re.getDate() + ' ' + months[re.getMonth()];
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
                    regLine: regLine,
                    image: t.image_url || t.image || '',
                    _startTime: t.start_time || null,
                    _fromSupabase: true
                };
            });

            // Combine: Supabase data first, then static as fallback/demo
            var monthMap = isEn
                ? {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
                : {'Янв':'01','Фев':'02','Мар':'03','Апр':'04','Май':'05','Июн':'06','Июл':'07','Авг':'08','Сен':'09','Окт':'10','Ноя':'11','Дек':'12'};

            var staticGender = 'all';
            var staticItems = (typeof tournamentsData !== 'undefined' && tournamentsData.upcoming[category] || []).map(function(t) {
                return Object.assign({}, t, {
                    _dateSort: '2026-' + (monthMap[t.date.month] || '01') + '-' + t.date.day,
                    _gender: staticGender,
                    _fromSupabase: false
                });
            });

            var all = supaItems.concat(staticItems);

            // Load ALL active tournaments (all categories) for main grid
            var activeItems = [];
            try {
                var activeResult = await client.from('tournaments')
                    .select('*')
                    .neq('status', 'completed')
                    .neq('status', 'cancelled')
                    .not('published_at', 'is', null)
                    .order('date_start', { ascending: true });
                var activeData = activeResult.data || [];
                activeItems = activeData.map(function(t) {
                    var d = new Date(t.date_start + 'T00:00:00');
                    var day = String(d.getDate()).padStart(2, '0');
                    var month = months[d.getMonth()];
                    var effectiveStatus;
                    if (t.status === 'registration_closed') {
                        effectiveStatus = t.status;
                    } else {
                        effectiveStatus = computeStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
                    }
                    var cardStatusMap = { registration_open: 'open', completed: 'past', ongoing: 'ongoing', cancelled: 'past', registration_closed: 'closed' };
                    var cardStatus = cardStatusMap[effectiveStatus] || 'soon';
                    var gender = t.gender || '';
                    var genderLabel = (t.format !== 'mixed_doubles' && t.category_id !== 'friendly' && (gender === 'men' || gender === 'women'))
                        ? (gender === 'women'
                            ? (isEn ? '♀ Women' : (isKg ? '♀ Аялдар' : '♀ Женский'))
                            : (isEn ? '♂ Men' : (isKg ? '♂ Эркектер' : '♂ Мужской')))
                        : (gender === 'mixed' ? (isEn ? '⚤ Mixed' : (isKg ? '⚤ Аралаш' : '⚤ Смешанный')) : '');
                    var regLine = '';
                    if (t.registration_start && t.registration_end && t.registration_end >= today) {
                        var rs = new Date(t.registration_start + 'T00:00:00');
                        var re = new Date(t.registration_end + 'T00:00:00');
                        regLine = (isEn ? 'Reg: ' : (isKg ? 'Кат: ' : 'Рег: ')) + rs.getDate() + ' ' + months[rs.getMonth()] + ' — ' + re.getDate() + ' ' + months[re.getMonth()];
                    }
                    return {
                        id: t.id,
                        name: isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title),
                        date: { day: day, month: month },
                        _dateSort: t.date_start,
                        location: isEn ? (t.location_en || t.location) : (isKg ? (t.location_kg || t.location || '') : (t.location || '')),
                        format: formatLabels[t.format] || t.format || '',
                        participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                        prize: t.prize_fund ? ((/[а-яa-z]/i.test(String(t.prize_fund))) ? String(t.prize_fund) : formatPrize(parseInt(String(t.prize_fund).replace(/[^\d]/g, ''), 10) || 0)) : '',
                        status: cardStatus,
                        statusText: statusLabels[effectiveStatus] || statusLabels.upcoming,
                        genderLabel: genderLabel,
                        _gender: gender || 'all',
                        regLine: regLine,
                        image: t.image_url || t.image || '',
                        _startTime: t.start_time || null,
                        _fromSupabase: true
                    };
                });
            } catch(ae) {
                console.warn('Active tournaments load error:', ae);
                // Fallback: use category-specific items
                activeItems = all.filter(function(t) { return t.status !== 'past'; });
            }
            // Filter out items whose computed status is 'past' (date_end passed)
            activeItems = activeItems.filter(function(t) { return t.status !== 'past'; });
            // Sort: newest first
            activeItems.sort(function(a, b) {
                return (b._dateSort || '').localeCompare(a._dateSort || '');
            });

            // Load ALL completed tournaments (all categories) for past section
            var pastItems = [];
            try {
                var pastResult = await client.from('tournaments')
                    .select('*')
                    .eq('status', 'completed')
                    .not('published_at', 'is', null)
                    .order('date_start', { ascending: false });
                var pastData = pastResult.data || [];
                pastItems = pastData.map(function(t) {
                    var d = new Date(t.date_start + 'T00:00:00');
                    var day = String(d.getDate()).padStart(2, '0');
                    var month = months[d.getMonth()];
                    var gender = t.gender || '';
                    var genderLabel = (t.format !== 'mixed_doubles' && t.category_id !== 'friendly' && (gender === 'men' || gender === 'women'))
                        ? (gender === 'women'
                            ? (isEn ? '♀ Women' : (isKg ? '♀ Аялдар' : '♀ Женский'))
                            : (isEn ? '♂ Men' : (isKg ? '♂ Эркектер' : '♂ Мужской')))
                        : (gender === 'mixed' ? (isEn ? '⚤ Mixed' : (isKg ? '⚤ Аралаш' : '⚤ Смешанный')) : '');
                    return {
                        id: t.id,
                        name: isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title),
                        date: { day: day, month: month },
                        _dateSort: t.date_start,
                        location: isEn ? (t.location_en || t.location) : (isKg ? (t.location_kg || t.location || '') : (t.location || '')),
                        format: formatLabels[t.format] || t.format || '',
                        participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                        prize: t.prize_fund ? ((/[а-яa-z]/i.test(String(t.prize_fund))) ? String(t.prize_fund) : formatPrize(parseInt(String(t.prize_fund).replace(/[^\d]/g, ''), 10) || 0)) : '',
                        statusText: statusLabels.completed || (isEn ? 'Completed' : 'Завершён'),
                        genderLabel: genderLabel,
                        image: t.image_url || t.image || '',
                        _fromSupabase: true
                    };
                });
            } catch(pe) {
                console.warn('Past tournaments load error:', pe);
            }

            // Re-render main grid (show more: 3 cols × 3 rows = 9 per load)
            var grid = document.getElementById('tournamentsGrid');
            if (!grid) return;
            var ITEMS_PER_LOAD = 6;
            var _activeShown = 0;
            var upcomingSection = document.getElementById('upcoming');

            function renderActiveCard(t) {
                var statusText = t.statusText || (t.status === 'open'
                    ? (isEn ? 'Registration Open' : (isKg ? 'Каттоо ачык' : 'Регистрация открыта'))
                    : (isEn ? 'Coming Soon' : (isKg ? 'Жакында' : 'Скоро открытие')));
                return '<div class="tournament-card" data-status="' + t.status + '" data-gender="' + (t._gender || 'all') + '" data-id="' + t.id + '"' +
                    (t.image ? ' style="background-image:url(' + t.image + ')"' : '') + '>' +
                    '<div class="tournament-card-header">' +
                        '<span class="tournament-date">' +
                            '<span class="date-day">' + t.date.day + '</span>' +
                            '<span class="date-month">' + t.date.month + '</span>' +
                        '</span>' +
                        '<span class="tournament-status ' + t.status + '">' + statusText + '</span>' +
                    '</div>' +
                    getCountdownHtml(t._dateSort, t._startTime) +
                    '<div class="tournament-card-body">' +
                        '<div class="tournament-title-row">' +
                            '<h3>' + t.name + '</h3>' +
                            (t.genderLabel ? '<span class="tournament-gender-badge">' + t.genderLabel + '</span>' : '') +
                        '</div>' +
                        '<div class="tournament-meta">' +
                            '<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + t.location + '</span>' +
                        '</div>' +
                        '<div class="tournament-details">' +
                            (t.regLine ? '<div class="detail-item detail-reg"><span class="detail-label">' + (isEn ? 'Registration' : (isKg ? 'Каттоо' : 'Регистрация')) + '</span><span class="detail-value">' + t.regLine.replace(/^(Reg|Рег|Кат): /, '') + '</span></div>' : '') +
                            '<div class="detail-item"><span class="detail-label">' + L.format + '</span><span class="detail-value">' + (t.format || '') + '</span></div>' +
                            '<div class="detail-item"><span class="detail-label">' + L.participants + '</span><span class="detail-value">' + (t.participants || '') + '</span></div>' +
                            '<div class="detail-item"><span class="detail-label">' + L.prizeFund + '</span><span class="detail-value prize">' + (t.prize || '') + '</span></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tournament-card-footer">' +
                        '<button class="btn-calendar" title="' + L.calendar + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button>' +
                        '<span class="btn-view-bracket">' + L.details + '</span>' +
                        (t.status === 'open'
                            ? '<button class="btn-register">' + L.register + '</button>'
                            : '') +
                    '</div>' +
                '</div>';
            }

            var showMoreLabel = isEn ? 'Show more' : (isKg ? 'Дагы көрсөтүү' : 'Показать ещё');
            var showMoreArrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

            function renderActiveShowMore() {
                var nextItems = activeItems.slice(_activeShown, _activeShown + ITEMS_PER_LOAD);
                var html = nextItems.map(renderActiveCard).join('');
                grid.insertAdjacentHTML('beforeend', html);
                _activeShown += nextItems.length;

                // Click listeners for new cards
                grid.querySelectorAll('.tournament-card[data-id]').forEach(function(card) {
                    if (card._clickBound) return;
                    card._clickBound = true;
                    card.addEventListener('click', function(e) {
                        if (e.target.closest('.btn-calendar, .btn-register')) return;
                        window.location.href = detailPage + '?id=' + this.dataset.id;
                    });
                });

                // Show/hide button
                var oldBtn = upcomingSection.querySelector('.trn-show-more');
                if (oldBtn) oldBtn.remove();
                if (_activeShown < activeItems.length) {
                    var btnHtml = '<div class="trn-show-more"><button class="trn-show-more-btn" id="activeShowMore">' + showMoreLabel + ' ' + showMoreArrow + '</button></div>';
                    grid.insertAdjacentHTML('afterend', btnHtml);
                    document.getElementById('activeShowMore').addEventListener('click', function() {
                        renderActiveShowMore();
                    });
                }

                startCountdownTimer();
            }

            grid.innerHTML = '';
            renderActiveShowMore();

            // Render past tournaments into #pastTournamentsGrid (show more pattern)
            var pastGrid = document.getElementById('pastTournamentsGrid');
            var pastSection = document.getElementById('past');
            var _pastShown = 0;

            function renderPastCard(t) {
                var statusText = t.statusText || (isEn ? 'Completed' : (isKg ? 'Аяктады' : 'Завершён'));
                return '<div class="tournament-card" data-status="past" data-id="' + t.id + '"' +
                    (t.image ? ' style="background-image:url(' + t.image + ')"' : '') + '>' +
                    '<div class="tournament-card-header">' +
                        '<span class="tournament-date">' +
                            '<span class="date-day">' + t.date.day + '</span>' +
                            '<span class="date-month">' + t.date.month + '</span>' +
                        '</span>' +
                        '<span class="tournament-status past">' + statusText + '</span>' +
                    '</div>' +
                    '<div class="tournament-card-body">' +
                        '<div class="tournament-title-row">' +
                            '<h3>' + t.name + '</h3>' +
                            (t.genderLabel ? '<span class="tournament-gender-badge">' + t.genderLabel + '</span>' : '') +
                        '</div>' +
                        '<div class="tournament-meta">' +
                            '<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + t.location + '</span>' +
                        '</div>' +
                        '<div class="tournament-details">' +
                            '<div class="detail-item"><span class="detail-label">' + L.format + '</span><span class="detail-value">' + (t.format || '') + '</span></div>' +
                            '<div class="detail-item"><span class="detail-label">' + L.participants + '</span><span class="detail-value">' + (t.participants || '') + '</span></div>' +
                            '<div class="detail-item"><span class="detail-label">' + L.prizeFund + '</span><span class="detail-value prize">' + (t.prize || '') + '</span></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tournament-card-footer">' +
                        '<span class="btn-view-bracket">' + L.details + '</span>' +
                    '</div>' +
                '</div>';
            }

            function renderPastShowMore() {
                if (!pastGrid) return;
                var nextItems = pastItems.slice(_pastShown, _pastShown + ITEMS_PER_LOAD);
                var html = nextItems.map(renderPastCard).join('');
                pastGrid.insertAdjacentHTML('beforeend', html);
                _pastShown += nextItems.length;

                // Click listeners for new cards
                pastGrid.querySelectorAll('.tournament-card[data-id]').forEach(function(card) {
                    if (card._clickBound) return;
                    card._clickBound = true;
                    card.addEventListener('click', function() {
                        window.location.href = detailPage + '?id=' + this.dataset.id;
                    });
                });

                // Show/hide button
                var oldBtn = pastSection.querySelector('.trn-show-more');
                if (oldBtn) oldBtn.remove();
                if (_pastShown < pastItems.length) {
                    var btnHtml = '<div class="trn-show-more"><button class="trn-show-more-btn" id="pastShowMore">' + showMoreLabel + ' ' + showMoreArrow + '</button></div>';
                    pastGrid.insertAdjacentHTML('afterend', btnHtml);
                    document.getElementById('pastShowMore').addEventListener('click', function() {
                        renderPastShowMore();
                    });
                }
            }

            if (pastGrid && pastItems.length > 0) {
                if (pastSection) pastSection.style.display = '';
                pastGrid.innerHTML = '';
                renderPastShowMore();
            } else if (pastSection && pastItems.length === 0) {
                pastSection.style.display = 'none';
            }

            // Init search + filter buttons interaction
            initSearch(grid);
            initFilterSearch(grid);
            // Apply current filter state
            applyFilters(grid);
            startCountdownTimer();
            initStickyHeader();

        } catch (e) {
            console.error('Supabase tournaments overlay error:', e);
        }
    }

    var _searchTimer = null;

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

    function initFilterSearch(grid) {
        // Chip-based filters
        var chips = document.querySelectorAll('.trn-filter-chip');
        chips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                var group = chip.dataset.filter; // 'status' or 'gender'
                var parent = chip.closest('.trn-filter-chips');
                if (parent) {
                    parent.querySelectorAll('.trn-filter-chip').forEach(function(c) { c.classList.remove('active'); });
                }
                chip.classList.add('active');
                applyFilters(grid);
            });
        });

        // Fallback: dropdown-based filters (for backwards compat)
        var statusSelect = document.getElementById('statusFilter');
        var genderSelect = document.getElementById('genderFilter');
        if (statusSelect) statusSelect.addEventListener('change', function() { applyFilters(grid); });
        if (genderSelect) genderSelect.addEventListener('change', function() { applyFilters(grid); });
    }

    function applyFilters(grid) {
        var input = document.getElementById('tournamentSearch');
        var query = input ? input.value.trim().toLowerCase() : '';

        // Read from chips first, fallback to selects
        var statusChip = document.querySelector('.trn-filter-chip[data-filter="status"].active');
        var genderChip = document.querySelector('.trn-filter-chip[data-filter="gender"].active');
        var statusSelect = document.getElementById('statusFilter');
        var genderSelect = document.getElementById('genderFilter');
        var filter = statusChip ? statusChip.dataset.value : (statusSelect ? statusSelect.value : 'all');
        var genderFilter = genderChip ? genderChip.dataset.value : (genderSelect ? genderSelect.value : 'all');

        // Update section title
        var sectionTitle = document.querySelector('#trnStickyHeader h2');
        if (sectionTitle) {
            sectionTitle.textContent = (filter === 'past')
                ? (isEn ? 'Completed Tournaments' : (isKg ? 'Аяктаган мелдештер' : 'Завершённые турниры'))
                : (isEn ? 'Upcoming Tournaments' : (isKg ? 'Алдыдагы мелдештер' : 'Предстоящие турниры'));
        }

        grid.querySelectorAll('.tournament-card').forEach(function(card) {
            var status = card.dataset.status;
            var cardGender = card.dataset.gender || 'all';
            var statusMatch = (filter === 'all') ? (status !== 'past') : (status === filter);
            var genderMatch = (genderFilter === 'all') || (cardGender === genderFilter);
            var title = card.querySelector('h3');
            var nameMatch = !query || (title && title.textContent.toLowerCase().indexOf(query) !== -1);
            card.style.display = (statusMatch && genderMatch && nameMatch) ? '' : 'none';
        });
    }

    function initStickyHeader() {
        var header = document.getElementById('trnStickyHeader');
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
