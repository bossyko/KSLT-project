// ========================================
// Tournaments Overview — Supabase + static fallback
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
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
        : { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' };

    var statusLabels = isEn
        ? { registration_open: 'Registration Open', upcoming: 'Coming Soon', registration_closed: 'Reg. Closed', ongoing: 'In Progress', completed: 'Completed' }
        : { registration_open: 'Регистрация открыта', upcoming: 'Скоро', registration_closed: 'Рег. закрыта', ongoing: 'Идёт', completed: 'Завершён' };

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
    };

    var tournamentPage = isEn ? 'tournament-en.html' : 'tournament.html';
    var tournamentsPage = isEn ? 'tournaments-en.html' : 'tournaments.html';
    var authPage = isEn ? 'auth-en.html' : 'auth.html';

    var _grouped = {};
    var _bgImages = {};

    // SVG icons
    var pinSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    var arrowSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    var emptySvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        renderHero();
        loadTournaments();
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
            '</div>';
    }

    async function loadTournaments() {
        var grouped = null;

        if (client) {
            try {
                // Load all tournaments (including completed) so every category has data with gender
                var result = await client.from('tournaments')
                    .select('*')
                    .order('date_start', { ascending: true });

                console.log('[overview] Supabase returned', result.data ? result.data.length : 0, 'tournaments');
                if (result.data && result.data.length > 0) {
                    result.data.forEach(function(t) { console.log('  ->', t.id, 'category_id:', t.category_id, 'format:', t.format); });
                    // Load registration counts per tournament
                    var tIds = result.data.map(function(t) { return t.id; });
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
                    grouped = groupByCategory(result.data, true, regCounts);
                }
            } catch(e) {
                console.error('Supabase tournaments overview error:', e);
            }
        }

        // Static fallback
        if (!grouped) {
            grouped = buildStaticGrouped();
        }

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
        CATEGORIES.forEach(function(c) { map[c.key] = []; });

        rows.forEach(function(t) {
            var cat = stripGender(t.category_id);
            if (!map[cat]) map[cat] = [];

            var d = new Date(t.date_start + 'T00:00:00');
            var day = String(d.getDate()).padStart(2, '0');
            var month = months[d.getMonth()];
            var gender = getGender(t.category_id);
            var cardStatus = mapStatus(t.status);

            map[cat].push({
                id: t.id,
                name: isEn ? (t.title_en || t.title) : t.title,
                date: { day: day, month: month },
                _dateSort: t.date_start,
                location: isEn ? (t.location_en || t.location) : (t.location || ''),
                format: formatLabels[t.format] || t.format || '',
                participants: t.max_participants ? (regCounts[t.id] || 0) + '/' + t.max_participants : '',
                prize: t.prize_fund || '',
                status: cardStatus,
                statusText: statusLabels[t.status] || statusLabels.upcoming,
                gender: gender,
                genderLabel: (t.format !== 'mixed_doubles' && cat !== 'friendly' && (gender === 'men' || gender === 'women'))
                    ? (gender === 'women' ? ('♀ ' + L.women) : ('♂ ' + L.men))
                    : '',
                image: t.image_url || t.image || '',
                _fromSupabase: true
            });
        });

        // Sort each category: non-completed first (by date asc), completed last (by date desc)
        Object.keys(map).forEach(function(key) {
            map[key].sort(function(a, b) {
                var aPast = a.status === 'past' ? 1 : 0;
                var bPast = b.status === 'past' ? 1 : 0;
                if (aPast !== bPast) return aPast - bPast;
                return (a._dateSort || '').localeCompare(b._dateSort || '');
            });
            map[key] = map[key].slice(0, 4);
        });

        return map;
    }

    function buildStaticGrouped() {
        var map = {};
        if (typeof tournamentsData === 'undefined') return map;

        CATEGORIES.forEach(function(c) {
            var items = tournamentsData.upcoming[c.key] || [];
            map[c.key] = items.slice(0, 4).map(function(t) {
                var monthMap = isEn
                    ? {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
                    : {'Янв':'01','Фев':'02','Мар':'03','Апр':'04','Май':'05','Июн':'06','Июл':'07','Авг':'08','Сен':'09','Окт':'10','Ноя':'11','Дек':'12'};

                return {
                    id: c.key + '-' + t.id,
                    name: t.name,
                    date: t.date,
                    _dateSort: '2026-' + (monthMap[t.date.month] || '01') + '-' + t.date.day,
                    location: t.location || '',
                    format: t.format || '',
                    participants: t.participants || '',
                    prize: t.prize || '',
                    status: t.status || 'soon',
                    statusText: t.status === 'open'
                        ? (isEn ? 'Registration Open' : 'Регистрация открыта')
                        : (isEn ? 'Coming Soon' : 'Скоро'),
                    gender: '',
                    genderLabel: '',
                    image: t.image || '',
                    _fromSupabase: false
                };
            });
        });

        return map;
    }

    function mapStatus(s) {
        if (s === 'registration_open') return 'open';
        if (s === 'ongoing') return 'ongoing';
        if (s === 'registration_closed') return 'closed';
        if (s === 'completed') return 'past';
        return 'soon';
    }

    function renderCategories(grouped) {
        var container = document.getElementById('overviewCategories');
        if (!container) return;
        _grouped = grouped;

        var html = '';

        console.log('[overview] renderCategories, source:', grouped === _grouped ? 'cached' : 'new');
        CATEGORIES.forEach(function(cat) {
            var items = grouped[cat.key] || [];
            if (items.length) console.log('[overview]', cat.key, ':', items.length, 'items, first genderLabel:', JSON.stringify(items[0].genderLabel), 'fromSupabase:', items[0]._fromSupabase);
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
                html += renderFeatured(items[0], featuredBg);
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
    }

    function renderFeatured(t, bgImage) {
        var linkHref = tournamentPage + '?id=' + t.id;

        return '<div class="to-featured">' +
            (bgImage
                ? '<div class="to-featured-bg"><img src="' + bgImage + '" alt="" loading="lazy"></div><div class="to-featured-overlay"></div>'
                : '<div class="to-featured-overlay" style="background:var(--bg-card)"></div>') +
            '<div class="to-featured-content">' +
                '<div>' +
                    '<span class="to-featured-date"><span class="to-day">' + t.date.day + '</span><span class="to-month">' + t.date.month + '</span></span>' +
                    (t.genderLabel ? '<span class="to-gender-badge">' + t.genderLabel + '</span>' : '') +
                '</div>' +
                '<span class="to-featured-status ' + t.status + '">' + t.statusText + '</span>' +
                '<h3>' + t.name + '</h3>' +
                '<div class="to-featured-meta">' +
                    '<span>' + pinSvg + ' ' + t.location + '</span>' +
                '</div>' +
                '<div class="to-featured-details">' +
                    (t.format ? '<div class="to-featured-detail"><span class="to-label">' + L.format + '</span><span class="to-value">' + t.format + '</span></div>' : '') +
                    (t.participants ? '<div class="to-featured-detail"><span class="to-label">' + L.participants + '</span><span class="to-value">' + t.participants + '</span></div>' : '') +
                    (t.prize ? '<div class="to-featured-detail"><span class="to-label">' + L.prize + '</span><span class="to-value prize">' + t.prize + '</span></div>' : '') +
                '</div>' +
                '<button class="to-featured-link" data-href="' + linkHref + '">' + L.details + '</button>' +
            '</div>' +
        '</div>';
    }

    function renderCompact(t, catKey, idx) {
        return '<div class="to-compact" data-cat="' + catKey + '" data-idx="' + idx + '"' +
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
                    (t.format ? '<span>' + t.format + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="to-compact-right">' +
                '<span class="to-compact-status ' + t.status + '">' + t.statusText + '</span>' +
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
        var html = renderFeatured(items[0], featuredBg);
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
            // Carousel: compact card click
            var compact = e.target.closest('.to-compact');
            if (compact) {
                e.preventDefault();
                var catKey = compact.dataset.cat;
                var idx = parseInt(compact.dataset.idx, 10);
                if (catKey && !isNaN(idx) && _grouped[catKey]) {
                    var items = _grouped[catKey];
                    var temp = items[0];
                    items[0] = items[idx];
                    items[idx] = temp;
                    renderCardGrid(catKey);
                }
                return;
            }

            // Auth-gate: details button click
            var btn = e.target.closest('.to-featured-link');
            if (btn) {
                e.preventDefault();
                var href = btn.dataset.href;
                if (!href) return;
                var authToken = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');
                if (authToken) {
                    window.location.href = href;
                } else {
                    window.location.href = authPage;
                }
            }
        });
    }

})();
