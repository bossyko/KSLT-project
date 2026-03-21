// ========================================
// Tournaments Overview — Supabase + static fallback
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;

    // Category order + meta
    var CATEGORIES = [
        { key: 'promasters', name: 'Pro-Masters' },
        { key: 'masters', name: 'Masters' },
        { key: 'challenger', name: 'Challenger' },
        { key: 'futures', name: 'Futures' },
        { key: 'tour', name: 'Tour' },
        { key: 'friendly', name: 'Friendly' }
    ];

    var months = isEn
        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

    var formatLabels = isEn
        ? { singles: 'Singles', doubles: 'Doubles', mixed_doubles: 'Mixed Doubles' }
        : (isKg ? { singles: 'Жалгыз', doubles: 'Жуптук', mixed_doubles: 'Аралаш жуптук' }
        : { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' });

    var statusLabels = isEn
        ? { registration_open: 'Registration Open', upcoming: 'Coming Soon', registration_closed: 'Reg. Closed', ongoing: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
        : (isKg ? { registration_open: 'Каттоо ачык', upcoming: 'Жакында', registration_closed: 'Каттоо жабык', ongoing: 'Жүрүп жатат', completed: 'Аяктады', cancelled: 'Жокко чыгарылды' }
        : { registration_open: 'Регистрация открыта', upcoming: 'Скоро', registration_closed: 'Рег. закрыта', ongoing: 'Идёт', completed: 'Завершён', cancelled: 'Отменён' });

    var L = isEn ? {
        heroTitle: 'Tournaments',
        heroDesc: 'All KSLT tournament categories — from beginner to professional level',
        heroBadge: 'KSLT',
        viewAll: 'All tournaments',
        details: 'Details',
        empty: 'No upcoming tournaments',
        format: 'Format',
        participants: 'Players',
        prize: 'Prize',
        men: 'Men',
        women: 'Women',
        gender: 'Gender'
    } : (isKg ? {
        heroTitle: 'Мелдештер',
        heroDesc: 'KSLT мелдештеринин бардык категориялары — башталгычтан профессионал деңгээлге чейин',
        heroBadge: 'KSLT',
        viewAll: 'Бардык мелдештер',
        details: 'Толугураак',
        empty: 'Алдыдагы мелдештер жок',
        format: 'Формат',
        participants: 'Катышуучулар',
        prize: 'Сыйлык',
        men: 'Эрк',
        women: 'Аял',
        gender: 'Жынысы'
    } : {
        heroTitle: 'Турниры',
        heroDesc: 'Все категории турниров KSLT — от начального до профессионального уровня',
        heroBadge: 'KSLT',
        viewAll: 'Все турниры',
        details: 'Подробнее',
        empty: 'Нет предстоящих турниров',
        format: 'Формат',
        participants: 'Участники',
        prize: 'Призовой',
        men: 'Муж',
        women: 'Жен',
        gender: 'Пол'
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
    function computeStatus(regStart, regEnd, dateStart, dateEnd) {
        var now = new Date().toISOString().substring(0, 10);
        if (regStart && now < regStart) return 'upcoming';
        if (regStart && regEnd && now >= regStart && now <= regEnd) return 'registration_open';
        if (dateEnd && now > dateEnd) return 'completed';
        if (dateStart && now >= dateStart) return 'ongoing';
        if (regEnd && now > regEnd) return 'registration_closed';
        return 'upcoming';
    }

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
        var heroImg = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80';
        el.innerHTML =
            '<div class="to-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="to-hero-overlay"></div>' +
            '<div class="to-hero-content">' +
                '<span class="to-hero-badge">' + L.heroBadge + '</span>' +
                '<h1>' + L.heroTitle + '</h1>' +
                '<p>' + L.heroDesc + '</p>' +
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

            var el = document.getElementById('toStatTotal');
            if (el) el.textContent = all.length;

            // Unique categories
            var cats = {};
            all.forEach(function(t) {
                var cat = (t.category_id || '').split('-').pop();
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
            el = document.getElementById('toStatPrize');
            if (el) el.textContent = formatPrize(totalPrize);

            // Participants
            try {
                var ids = all.map(function(t) { return t.id; });
                if (ids.length > 0) {
                    var regs = await client.from('tournament_registrations')
                        .select('*', { count: 'exact', head: true })
                        .in('tournament_id', ids);
                    el = document.getElementById('toStatParticipants');
                    if (el) el.textContent = regs.count || 0;
                }
            } catch(e) {}
        } catch(e) {}
    }

    async function loadTournaments() {
        var grouped = null;

        if (client) {
            try {
                // Load all tournaments so every category has data with gender
                var result = await client.from('tournaments')
                    .select('*')
                    .order('date_start', { ascending: true });

                console.log('[overview] Supabase returned', result.data ? result.data.length : 0, 'tournaments');
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
                    grouped = groupByCategory(publishedRows, true, regCounts);
                }
            } catch(e) {
                console.error('Supabase tournaments overview error:', e);
            }
        }

        if (!grouped) grouped = {};
        renderCategories(grouped);
    }

    // Strip gender prefix: "men-promasters" → "promasters", "women-masters" → "masters"
    function stripGender(catId) {
        if (!catId) return 'tour';
        return catId.replace(/^(men|women)-/, '');
    }

    function getGender(catId) {
        if (!catId) return 'men';
        if (catId.indexOf('women') === 0) return 'women';
        return 'men';
    }

    function groupByCategory(rows, fromSupabase, regCounts) {
        regCounts = regCounts || {};
        var map = {};
        var today = new Date().toISOString().substring(0, 10);
        CATEGORIES.forEach(function(c) { map[c.key] = []; });

        rows.forEach(function(t) {
            var cat = stripGender(t.category_id);
            if (!map[cat]) map[cat] = [];

            var d = new Date(t.date_start + 'T00:00:00');
            var day = String(d.getDate()).padStart(2, '0');
            var month = months[d.getMonth()];
            var gender = getGender(t.category_id);

            // Auto-compute status (with overrides)
            var effectiveStatus;
            if (t.status === 'cancelled' || t.status === 'registration_closed' || t.status === 'completed') {
                effectiveStatus = t.status;
            } else {
                effectiveStatus = computeStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
            }
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
                participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                prize: t.prize_fund || '',
                status: cardStatus,
                statusText: statusLabels[effectiveStatus] || statusLabels.upcoming,
                gender: gender,
                genderLabel: (t.format !== 'mixed_doubles' && cat !== 'friendly' && (gender === 'men' || gender === 'women'))
                    ? (gender === 'women' ? ('♀ ' + L.women) : ('♂ ' + L.men))
                    : '',
                regLine: regLine,
                image: t.image_url || t.image || '',
                _startTime: t.start_time || null,
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

        // Limit to 4 per category for default view (exclude past)
        var sliced = {};
        Object.keys(map).forEach(function(key) {
            var active = map[key].filter(function(t) { return t.status !== 'past'; });
            sliced[key] = active.slice(0, 4);
        });

        return sliced;
    }

    function mapStatus(s) {
        if (s === 'registration_open') return 'open';
        if (s === 'ongoing') return 'ongoing';
        if (s === 'registration_closed') return 'closed';
        if (s === 'completed' || s === 'cancelled') return 'past';
        return 'soon';
    }

    function renderCategories(grouped) {
        var container = document.getElementById('overviewCategories');
        if (!container) return;
        _grouped = grouped;

        var html = '';

        CATEGORIES.forEach(function(cat) {
            var items = grouped[cat.key] || [];
            var catData = (typeof tournamentsData !== 'undefined' && tournamentsData.categories[cat.key]) || {};
            var bgImage = catData.bgImage || '';
            _bgImages[cat.key] = bgImage;

            html += '<div class="to-category-block" data-cat="' + cat.key + '">';
            html += '<div class="to-category-header">';
            html += '<h2 class="to-category-title"><span>' + cat.name + '</span></h2>';
            html += '<a href="' + tournamentsPage + '?category=' + cat.key + '" class="to-view-all">' + L.viewAll + ' ' + arrowSvg + '</a>';
            html += '</div>';

            if (items.length === 0) {
                html += '<div class="to-card-grid"><div class="to-empty">' + emptySvg + '<p>' + L.empty + '</p></div></div>';
            } else {
                html += '<div class="to-card-grid">';
                // Featured card — use category image (more reliable for overview)
                var featuredBg = items[0].image || bgImage;
                html += renderFeatured(items[0], featuredBg, cat.key);
                // Side stack (items 1-3)
                if (items.length > 1) {
                    html += '<div class="to-side-stack">';
                    for (var i = 1; i < items.length; i++) {
                        html += renderCompact(items[i], cat.key, i);
                    }
                    html += '</div>';
                }
                html += '</div>';
            }

            html += '</div>';
        });

        container.innerHTML = html;
        attachEvents();
        initSearch();
        startCountdownTimer();
    }

    function renderFeatured(t, bgImage, catKey) {
        var linkHref = tournamentPage + '?id=' + t.id;

        return '<div class="to-featured" data-href="' + linkHref + '">' +
            (bgImage
                ? '<div class="to-featured-bg"><img src="' + bgImage + '" alt="" loading="lazy"></div><div class="to-featured-overlay"></div>'
                : '<div class="to-featured-overlay" style="background:var(--bg-card)"></div>') +
            '<div class="to-featured-content">' +
                '<div>' +
                    '<span class="to-featured-date"><span class="to-day">' + t.date.day + '</span><span class="to-month">' + t.date.month + '</span></span>' +
                    (t.genderLabel ? '<span class="to-gender-badge">' + t.genderLabel + '</span>' : '') +
                '</div>' +
                getCountdownHtml(t._dateSort, t._startTime) +
                '<span class="to-featured-status ' + t.status + '">' + t.statusText + '</span>' +
                '<h3>' + t.name + '</h3>' +
                '<div class="to-featured-meta">' +
                    '<span>' + pinSvg + ' ' + t.location + '</span>' +
                '</div>' +
                '<div class="to-featured-details">' +
                    (t.regLine ? '<div class="to-featured-detail"><span class="to-label">' + (isEn ? 'Reg' : (isKg ? 'Кат' : 'Рег')) + '</span><span class="to-value">' + t.regLine + '</span></div>' : '') +
                    (t.format ? '<div class="to-featured-detail"><span class="to-label">' + L.format + '</span><span class="to-value">' + t.format + '</span></div>' : '') +
                    (t.participants ? '<div class="to-featured-detail"><span class="to-label">' + L.participants + '</span><span class="to-value">' + t.participants + '</span></div>' : '') +
                    (t.prize ? '<div class="to-featured-detail"><span class="to-label">' + L.prize + '</span><span class="to-value prize">' + t.prize + '</span></div>' : '') +
                '</div>' +
                '<span class="to-featured-link">' + L.details + '</span>' +
            '</div>' +
        '</div>';
    }

    function renderCompact(t, catKey, idx) {
        var compactHref = tournamentPage + '?id=' + t.id;

        return '<div class="to-compact" data-cat="' + catKey + '" data-idx="' + idx + '" data-href="' + compactHref + '"' +
            (t.image ? ' style="background-image:url(' + t.image + ')"' : '') + '>' +
            '<div class="to-compact-left">' +
                '<div class="to-compact-date">' +
                    '<span class="to-day">' + t.date.day + '</span>' +
                    '<span class="to-month">' + t.date.month + '</span>' +
                '</div>' +
                (t.genderLabel ? '<span class="to-compact-gender-badge">' + t.genderLabel + '</span>' : '') +
            '</div>' +
            '<div class="to-compact-info">' +
                '<h4>' + t.name + '</h4>' +
                '<div class="to-compact-sub">' +
                    '<span>' + pinSvg + ' ' + t.location + '</span>' +
                    (t.regLine ? '<span class="to-compact-reg">' + (isEn ? 'Reg: ' : (isKg ? 'Кат: ' : 'Рег: ')) + t.regLine + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="to-compact-right">' +
                '<span class="to-compact-status ' + t.status + '">' + t.statusText + '</span>' +
                getCountdownHtml(t._dateSort, t._startTime) +
            '</div>' +
        '</div>';
    }

    function renderCardGrid(catKey) {
        var items = _grouped[catKey];
        var bgImage = _bgImages[catKey] || '';
        if (!items || !items.length) return;

        var block = document.querySelector('.to-category-block[data-cat="' + catKey + '"]');
        if (!block) return;

        var grid = block.querySelector('.to-card-grid');
        if (!grid) return;

        var featuredBg = items[0].image || bgImage;
        var html = renderFeatured(items[0], featuredBg, catKey);
        if (items.length > 1) {
            html += '<div class="to-side-stack">';
            for (var i = 1; i < items.length; i++) {
                html += renderCompact(items[i], catKey, i);
            }
            html += '</div>';
        }
        grid.innerHTML = html;
    }

    function attachEvents() {
        var container = document.getElementById('overviewCategories');
        if (!container) return;

        container.addEventListener('click', function(e) {
            // Any card with data-href → navigate
            var card = e.target.closest('.to-featured[data-href], .to-compact[data-href]');
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
                // Filter ALL tournaments (not sliced) by name, exclude past
                var filtered = {};
                CATEGORIES.forEach(function(cat) {
                    var items = (_allGrouped[cat.key] || []).filter(function(item) {
                        return item.status !== 'past' && item.name.toLowerCase().indexOf(query) !== -1;
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
            html += '<h2 class="to-category-title"><span>' + cat.name + '</span></h2>';
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
