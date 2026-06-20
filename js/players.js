// ========================================
// PLAYERS PAGE — Rendering + Interactivity
// Supabase primary, static data fallback
// ========================================

(function() {
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    var PER_PAGE = 10;
    var CAT_PER_PAGE = 20;
    var currentTab = 'men-promasters';
    var currentPage = 1;
    var searchQuery = '';
    var catSearchQuery = '';
    var debounceTimer = null;
    var isCategoryMode = false;
    var catCurrentPage = 1;
    var _accessLevel = 'guest'; // guest | registered | member

    var GUEST_VISIBLE_ROWS = 8;
    var GUEST_BLURRED_ROWS = 4;
    var GUEST_CAT_VISIBLE = 8;
    var GUEST_CAT_BLURRED = 4;

    // Will be populated from Supabase or static
    var categoriesData = {};

    function isLoggedIn() {
        try {
            var key = 'sb-qqkzszesviukopgjbead-auth-token';
            var raw = localStorage.getItem(key);
            if (!raw) return false;
            var session = JSON.parse(raw);
            if (session && session.access_token && session.expires_at) {
                return session.expires_at > Math.floor(Date.now() / 1000);
            }
        } catch (e) {}
        return false;
    }

    // Badge data loaded from Supabase (player_id → [{badge_id, icon, name}])
    var _badgesByPlayer = {};
    var _badgeDefsMap = {};

    // ========================================
    // HELPERS
    // ========================================

    function getLabels() {
        return typeof window.playersLabels !== 'undefined' ? window.playersLabels : {
            title: 'Рейтинг KSLT',
            subtitle: '{count} игроков \u00b7 {online} онлайн \u00b7 Сезон 2026',
            searchPlaceholder: 'Поиск игрока...',
            men: 'Мужчины',
            women: 'Женщины',
            rank: '#',
            player: 'Игрок',
            country: 'Страна',
            points: 'Очки',
            record: 'W/L',
            form: 'Форма',
            change: '\u0394',
            actions: 'Вызов',
            ntrp: 'NTRP',
            online: 'Онлайн',
            message: 'Написать',
            challenge: 'Вызов',
            prevPage: '\u2190 Назад',
            nextPage: 'Далее \u2192',
            badgeChampion: 'Чемпион последнего турнира',
            badgeStreak: 'Серия 5+ побед',
            badgeTop1: '#1 текущего месяца',
            badgeNewbie: 'Новичок',
            badgeBreakthrough: 'Прорыв',
            sponsorsTitle: 'Партнёры и спонсоры',
            sponsorsGeneral: 'Генеральный спонсор',
            viewAll: 'Показать всех',
            noResults: 'Игроки не найдены',
            authRequired: 'Требуется авторизация',
            guestTitle: 'Зарегистрируйтесь для полного доступа',
            guestText: 'Полный рейтинг, поиск игроков и статистика доступны после регистрации',
            guestBtn: 'Войти / Регистрация',
            catPageBack: 'Назад к рейтингу',
            catPagePlayers: 'Игроков',
            catPageTournaments: 'Завершённых турниров',
            catPageLogin: 'Войдите, чтобы просматривать профили игроков',
            catPageRegister: 'Зарегистрируйтесь для доступа',
            catPageMemberOnly: 'Полный доступ для членов КСЛТ',
            catPageWins: 'П',
            catPageLosses: 'П',
            catPageTournamentsCol: 'Турниры'
        };
    }

    function isEnPage() {
        return window.location.pathname.indexOf('-en') !== -1;
    }

    function isKgPage() {
        return window.location.pathname.indexOf('-kg') !== -1;
    }

    function getAuthUrl() {
        return isEnPage() ? 'auth-en.html' : (isKgPage() ? 'auth-kg.html' : 'auth.html');
    }

    function getBadgeTooltip(badgeId) {
        var def = _badgeDefsMap[badgeId];
        if (!def) return badgeId;
        return isEnPage() ? (def.name_en || def.name) : (isKgPage() ? (def.name_kg || def.name) : def.name);
    }

    function getPlayerBadgesHtml(playerId, maxCount) {
        var badges = _badgesByPlayer[playerId];
        if (!badges || badges.length === 0) return '';
        var html = '';
        var show = badges.slice(0, maxCount || 5);
        for (var i = 0; i < show.length; i++) {
            var b = show[i];
            html += '<span class="pl-badge" title="' + esc(getBadgeTooltip(b.badge_id)) + '">' + (b.icon || '') + '</span>';
        }
        return html;
    }

    function getAllPlayers() {
        var all = [];
        for (var key in categoriesData) {
            if (categoriesData.hasOwnProperty(key)) {
                all = all.concat(categoriesData[key].players);
            }
        }
        return all;
    }

    function countOnline() {
        var count = 0;
        var all = getAllPlayers();
        for (var i = 0; i < all.length; i++) {
            if (all[i].online) count++;
        }
        return count;
    }

    function getCategory(tab) {
        return categoriesData[tab] || categoriesData['men-promasters'] || { players: [] };
    }

    function getFilteredPlayers(tab) {
        var cat = getCategory(tab);
        if (!searchQuery) return cat.players || [];
        var q = searchQuery.toLowerCase();
        var results = [];
        for (var key in categoriesData) {
            if (!categoriesData.hasOwnProperty(key)) continue;
            var c = categoriesData[key];
            var players = c.players || [];
            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                if (p.name.toLowerCase().indexOf(q) !== -1) {
                    results.push({
                        player: p,
                        categoryKey: key,
                        categoryName: c.name,
                        rankInCategory: i + 1
                    });
                }
            }
        }
        return results;
    }

    var isSearchMode = false;

    // ========================================
    // ACCESS LEVEL DETECTION
    // ========================================

    async function detectAccess() {
        var client = window.supabaseClient;
        if (!client) { _accessLevel = 'guest'; return; }

        var loggedIn = false;
        try {
            var res = await client.auth.getSession();
            if (res.data && res.data.session) loggedIn = true;
        } catch(e) {}

        if (!loggedIn) { _accessLevel = 'guest'; return; }

        _accessLevel = 'registered';

        if (typeof window.checkMembership === 'function') {
            try {
                var mem = await window.checkMembership();
                if (mem && mem.active) _accessLevel = 'member';
            } catch(e) {}
        }
    }

    // ========================================
    // LOAD BADGES FROM SUPABASE
    // ========================================

    async function loadBadgesFromSupabase() {
        if (!window.supabaseClient) return;
        var client = window.supabaseClient;
        try {
            // Load badge definitions
            var defsRes = await client.from('badge_definitions').select('*');
            if (defsRes.data) {
                defsRes.data.forEach(function(d) { _badgeDefsMap[d.id] = d; });
            }
            // Load all player badges
            var pbRes = await client.from('player_badges')
                .select('player_id, badge_id, badge:badge_definitions(icon)')
                .order('earned_at', { ascending: true });
            if (pbRes.data) {
                pbRes.data.forEach(function(pb) {
                    if (!_badgesByPlayer[pb.player_id]) _badgesByPlayer[pb.player_id] = [];
                    _badgesByPlayer[pb.player_id].push({
                        badge_id: pb.badge_id,
                        icon: pb.badge ? pb.badge.icon : ''
                    });
                });
            }
        } catch(e) {
            console.warn('[KSLT] badges load error:', e);
        }
    }

    // ========================================
    // SUPABASE DATA LOADER
    // ========================================

    async function loadFromSupabase() {
        if (!window.supabaseClient) return null;
        var client = window.supabaseClient;
        var isEn = isEnPage();
        var isKg = isKgPage();

        try {
            // Load categories
            var catResult = await client.from('categories').select('*').order('sort_order', { ascending: true });
            if (catResult.error || !catResult.data || catResult.data.length === 0) return null;

            // Load all players
            var plrResult = await client.from('players').select('*').order('points', { ascending: false });
            if (plrResult.error) return null;

            var players = plrResult.data || [];
            var categories = catResult.data;

            // Build categoriesData: composite keys men-{catId} / women-{catId}
            // Categories are gender-neutral (masters, tour), player.gender is separate
            // Skip Friendly — no ranking
            var result = {};
            var genders = ['men', 'women'];
            categories.forEach(function(cat) {
                if (cat.name && cat.name.toLowerCase().indexOf('friendly') !== -1) return;
                var catName = isEn ? (cat.name_en || cat.name) : (isKg ? (cat.name_kg || cat.name) : cat.name);
                genders.forEach(function(g) {
                    var catPlayers = players.filter(function(p) { return p.category_id === cat.id && p.gender === g; });
                    if (catPlayers.length === 0) return;
                    var key = g + '-' + cat.id;
                    result[key] = {
                        name: catName,
                        gender: g,
                        genderLabel: isEn ? (g === 'men' ? 'Men' : 'Women') : (isKg ? (g === 'men' ? 'Эркектер' : 'Аялдар') : (g === 'men' ? 'Мужчины' : 'Женщины')),
                        players: catPlayers.map(function(p) {
                            return {
                                id: p.id,
                                name: isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name),
                                photo: p.photo || 'https://placehold.co/80x80/1a1a1a/888?text=?',
                                country: p.country || '🇰🇬',
                                points: p.points || 0,
                                wins: p.wins || 0,
                                losses: p.losses || 0,
                                change: p.rank_change || 0,
                                form: p.form || [],
                                online: false,
                                badges: p.badges || [],
                                ntrp_rating: p.ntrp_rating || null,
                                banned_until: p.banned_until || null
                            };
                        })
                    };
                });
            });

            return result;
        } catch (e) {
            console.error('Supabase players load error:', e);
            return null;
        }
    }

    function loadStaticData() {
        if (typeof playersData !== 'undefined' && playersData.categories) {
            return playersData.categories;
        }
        return {};
    }

    // ========================================
    // INIT
    // ========================================

    document.addEventListener('DOMContentLoaded', async function() {
        // Load badges + players in parallel from Supabase
        var results = await Promise.all([loadFromSupabase(), loadBadgesFromSupabase()]);
        var dbData = results[0];
        if (dbData && Object.keys(dbData).length > 0) {
            categoriesData = dbData;
        } else {
            categoriesData = loadStaticData();
        }

        var params = new URLSearchParams(window.location.search);
        var tabParam = params.get('tab');

        // Category page mode: ?tab=men-tour → full page for that category
        if (tabParam && categoriesData[tabParam]) {
            isCategoryMode = true;
            currentTab = tabParam;
            await detectAccess();
            renderCategoryPage(tabParam);
            return;
        }

        // Overview mode (no ?tab or invalid tab)
        var firstKey = Object.keys(categoriesData)[0];
        if (firstKey) currentTab = firstKey;

        renderHero();
        renderFilters();
        renderPodium(currentTab);
        renderTable(currentTab, 1);
        renderSponsors();
        initTabs();
        initSearch();
        initScrollAnimations();
    });

    // ========================================
    // HERO
    // ========================================

    function renderHero() {
        var container = document.getElementById('playersHero');
        if (!container) return;

        var labels = getLabels();
        var totalPlayers = getAllPlayers().length;
        var onlineCount = countOnline();
        var subtitle = labels.subtitle
            .replace('{count}', totalPlayers)
            .replace('{online}', onlineCount);

        var searchHtml = isLoggedIn() ?
            '<div class="pl-search-wrap">' +
                '<svg class="pl-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '<input type="text" class="pl-search-input" id="playersSearch" placeholder="' + labels.searchPlaceholder + '" autocomplete="off">' +
            '</div>' : '';

        container.innerHTML =
            '<div class="pl-hero-bg"></div>' +
            '<div class="pl-hero-overlay"></div>' +
            '<div class="pl-hero-content">' +
                '<h1 class="pl-hero-title">' + labels.title + '</h1>' +
                '<p class="pl-hero-subtitle">' + subtitle + '</p>' +
                searchHtml +
            '</div>';
    }

    // ========================================
    // PODIUM (Top 3)
    // ========================================

    function renderPodium(tab, instant) {
        var container = document.getElementById('playersPodium');
        if (!container) return;

        var cat = getCategory(tab);
        var players = cat.players || [];
        var top3 = players.slice(0, 3);
        var medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
        var order = [1, 0, 2];
        var placeClass = ['pl-podium-first', 'pl-podium-second', 'pl-podium-third'];

        var animClasses = instant ? 'pl-animate pl-visible' : 'pl-animate';

        var html = '<div class="pl-podium">';
        for (var oi = 0; oi < order.length; oi++) {
            var i = order[oi];
            if (!top3[i]) continue;
            var p = top3[i];
            var badgesHtml = getPlayerBadgesHtml(p.id, 3);

            html += '<div class="pl-podium-card ' + placeClass[i] + ' ' + animClasses + '">' +
                '<div class="pl-podium-medal">' + medals[i] + '</div>' +
                '<div class="pl-podium-photo-wrap">' +
                    '<img src="' + esc(p.photo) + '" alt="' + esc(p.name) + '" class="pl-podium-photo">' +
                    (p.online ? '<span class="pl-online-dot pl-online-pulse"></span>' : '') +
                '</div>' +
                '<div class="pl-podium-name">' + p.name + '</div>' +
                '<div class="pl-podium-points">' + p.points.toLocaleString() + ' pts</div>' +
                (badgesHtml ? '<div class="pl-podium-badges">' + badgesHtml + '</div>' : '') +
            '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }

    // ========================================
    // FILTERS (Gender Tabs + Category Pills)
    // ========================================

    function renderFilters() {
        var container = document.getElementById('playersFilters');
        if (!container) return;

        var labels = getLabels();
        var currentGender = currentTab.split('-')[0];

        var menCats = [];
        var womenCats = [];
        for (var key in categoriesData) {
            if (categoriesData.hasOwnProperty(key)) {
                var cat = categoriesData[key];
                if (cat.gender === 'men') menCats.push({ key: key, name: cat.name });
                else womenCats.push({ key: key, name: cat.name });
            }
        }

        var html = '<div class="pl-gender-tabs">' +
            '<button class="pl-gender-tab' + (currentGender === 'men' ? ' active' : '') + '" data-gender="men">' + labels.men + '</button>' +
            '<button class="pl-gender-tab' + (currentGender === 'women' ? ' active' : '') + '" data-gender="women">' + labels.women + '</button>' +
        '</div>';

        html += '<div class="pl-category-row">';
        html += '<div class="pl-category-pills" id="categoryPills">';
        var cats = currentGender === 'men' ? menCats : womenCats;
        for (var i = 0; i < cats.length; i++) {
            html += '<button class="pl-category-pill' + (cats[i].key === currentTab ? ' active' : '') + '" data-tab="' + cats[i].key + '">' + cats[i].name + '</button>';
        }
        html += '</div>';
        var playersPage = isEnPage() ? 'players-en.html' : (isKgPage() ? 'players-kg.html' : 'players.html');
        html += '<a href="' + playersPage + '?tab=' + currentTab + '" class="pl-view-all">' + labels.viewAll + ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';
        html += '</div>';

        container.innerHTML = html;
    }

    // ========================================
    // TABLE
    // ========================================

    function renderTable(tab, page) {
        var container = document.getElementById('playersTable');
        if (!container) return;

        var labels = getLabels();
        var filtered = getFilteredPlayers(tab);
        isSearchMode = !!searchQuery;

        var items = filtered;
        var pageItems = items.slice(0, PER_PAGE);

        var podiumEl = document.getElementById('playersPodium');
        var filtersEl = document.getElementById('playersFilters');
        var sponsorsEl = document.getElementById('playersSponsors');
        if (podiumEl) podiumEl.style.display = isSearchMode ? 'none' : '';
        if (filtersEl) filtersEl.style.display = isSearchMode ? 'none' : '';
        if (container) container.style.paddingBottom = isSearchMode ? '16px' : '';
        if (sponsorsEl) sponsorsEl.style.paddingTop = isSearchMode ? '0' : '';

        if (pageItems.length === 0) {
            container.innerHTML = '<div class="pl-no-results">' + labels.noResults + '</div>';
            renderPagination(0, 1);
            return;
        }

        var logged = isLoggedIn();
        var isGuest = !logged && !isSearchMode;
        var totalVisible = isGuest ? Math.min(pageItems.length, GUEST_VISIBLE_ROWS + GUEST_BLURRED_ROWS) : pageItems.length;

        var html = '<div class="pl-table">';

        // Header
        html += '<div class="pl-row pl-row-header">' +
            '<span class="pl-col-rank">' + labels.rank + '</span>' +
            '<span class="pl-col-player">' + labels.player + '</span>' +
            '<span class="pl-col-online">' + labels.online + '</span>' +
            '<span class="pl-col-country">' + labels.country + '</span>' +
            '<span class="pl-col-ntrp">' + (labels.ntrp || 'NTRP') + '</span>' +
            '<span class="pl-col-points">' + labels.points + '</span>' +
            '<span class="pl-col-record">' + labels.record + '</span>' +
            '<span class="pl-col-form">' + labels.form + '</span>' +
            '<span class="pl-col-change">' + labels.change + '</span>' +
            (logged ? '<span class="pl-col-actions">' + labels.actions + '</span>' : '') +
        '</div>';

        // Rows
        for (var i = 0; i < totalVisible; i++) {
            var item = pageItems[i];
            var p = isSearchMode ? item.player : item;
            var rank = isSearchMode ? item.rankInCategory : (i + 1);
            var rankClass = rank <= 3 ? ' pl-rank-top' : '';

            var blurClass = '';
            if (isGuest && i >= GUEST_VISIBLE_ROWS) {
                var blurLevel = i - GUEST_VISIBLE_ROWS + 1;
                blurClass = ' pl-row-blur pl-row-blur-' + blurLevel;
            }

            var badgesHtml = getPlayerBadgesHtml(p.id, 3);

            var catLabel = isSearchMode ? '<span class="pl-player-category">' + item.categoryName + '</span>' : '';

            var pForm = p.form || [];
            var formHtml = '';
            for (var f = 0; f < pForm.length; f++) {
                formHtml += '<span class="pl-form-dot ' + (pForm[f] === 'W' ? 'pl-form-win' : 'pl-form-loss') + '"></span>';
            }

            var changeHtml = '';
            if (p.change > 0) {
                changeHtml = '<span class="pl-change-up">\u2191' + p.change + '</span>';
            } else if (p.change < 0) {
                changeHtml = '<span class="pl-change-down">\u2193' + Math.abs(p.change) + '</span>';
            } else {
                changeHtml = '<span class="pl-change-neutral">\u2014</span>';
            }

            var actionsHtml = '';
            if (logged) {
                var authUrl = getAuthUrl();
                if (p.online) {
                    actionsHtml += '<a href="' + authUrl + '" class="pl-btn-message" title="' + labels.message + '">\u2709\ufe0f</a>';
                }
                actionsHtml += '<a href="' + authUrl + '" class="pl-btn-challenge" title="' + labels.challenge + '">\u2694\ufe0f</a>';
            }

            html += '<div class="pl-row pl-animate' + blurClass + '" style="transition-delay:' + Math.min(i * 30, 300) + 'ms">' +
                '<span class="pl-col-rank' + rankClass + '">' + rank + '</span>' +
                '<div class="pl-col-player">' +
                    '<img src="' + esc(p.photo) + '" alt="" class="pl-player-photo">' +
                    '<div class="pl-player-info">' +
                        '<div class="pl-player-name-row">' +
                            (isGuest
                                ? '<a href="#" class="pl-player-name" data-guest-profile="1">' + p.name + '</a>'
                                : '<a href="' + (isEnPage() ? 'player-en.html' : (isKgPage() ? 'player-kg.html' : 'player.html')) + '?id=' + p.id + '" class="pl-player-name">' + p.name + '</a>') +
                            (badgesHtml ? '<span class="pl-player-badges">' + badgesHtml + '</span>' : '') +
                            (p.banned_until && new Date(p.banned_until) > new Date() ? '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;margin-left:4px;">' + (isEnPage() ? 'Banned' : (isKgPage() ? 'Бөгөт.' : 'Заблок.')) + '</span>' : '') +
                        '</div>' +
                        catLabel +
                    '</div>' +
                '</div>' +
                '<span class="pl-col-online">' + (p.online ? '<span class="pl-online-dot pl-online-pulse"></span>' : '<span class="pl-offline-dot"></span>') + '</span>' +
                '<span class="pl-col-country">' + p.country + '</span>' +
                '<span class="pl-col-ntrp">' + (p.ntrp_rating ? '<span class="pl-ntrp-value">' + Number(p.ntrp_rating).toFixed(1) + '</span>' : '<span class="pl-ntrp-na">\u2014</span>') + '</span>' +
                '<span class="pl-col-points">' + p.points.toLocaleString() + '</span>' +
                '<span class="pl-col-record">' + p.wins + '/' + p.losses + '</span>' +
                '<span class="pl-col-form">' + formHtml + '</span>' +
                '<span class="pl-col-change">' + changeHtml + '</span>' +
                (logged ? '<span class="pl-col-actions">' + actionsHtml + '</span>' : '') +
            '</div>';
        }

        html += '</div>';

        // Guest CTA banner
        if (isGuest && pageItems.length > GUEST_VISIBLE_ROWS) {
            var authUrl = getAuthUrl();
            html += '<div class="pl-guest-overlay">' +
                '<div class="pl-guest-cta">' +
                    '<div class="pl-guest-icon">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                            '<circle cx="12" cy="16" r="1"/>' +
                        '</svg>' +
                    '</div>' +
                    '<h3 class="pl-guest-title">' + labels.guestTitle + '</h3>' +
                    '<p class="pl-guest-text">' + labels.guestText + '</p>' +
                    '<a href="' + authUrl + '" class="pl-guest-btn">' + labels.guestBtn + '</a>' +
                '</div>' +
            '</div>';
        }

        container.innerHTML = html;

        initScrollAnimations();
    }

    // ========================================
    // PAGINATION
    // ========================================

    function renderPagination(total, page) {
        var container = document.getElementById('playersPagination');
        if (!container) return;

        var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        var labels = getLabels();
        var html = '<div class="pl-pagination">';

        html += '<button class="pl-page-btn pl-page-prev"' + (page === 1 ? ' disabled' : '') + '>' + labels.prevPage + '</button>';

        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="pl-page-btn pl-page-num' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }

        html += '<button class="pl-page-btn pl-page-next"' + (page === totalPages ? ' disabled' : '') + '>' + labels.nextPage + '</button>';
        html += '</div>';

        container.innerHTML = html;
    }

    // ========================================
    // SPONSORS
    // ========================================

    function renderSponsors() {
        var container = document.getElementById('playersSponsors');
        if (!container) return;

        var labels = getLabels();
        container.innerHTML =
            '<div class="section-header"><h2>' + labels.sponsorsTitle + '</h2></div>' +
            '<div class="sponsor-hero">' +
                '<span class="sponsor-hero-label">' + labels.sponsorsGeneral + '</span>' +
                '<a href="#" class="sponsor-hero-logo">' +
                    '<img src="https://placehold.co/200x80/0A0A0A/CCFF00?text=NURZAMAN" alt="Nurzaman">' +
                '</a>' +
            '</div>' +
            '<div class="sponsors-cloud">' +
                '<a href="#" class="sponsor-logo-link"><img src="https://placehold.co/120x50/1a1a1a/888888?text=Sponsor" alt="Sponsor"></a>' +
                '<a href="#" class="sponsor-logo-link"><img src="https://placehold.co/100x50/1a1a1a/888888?text=Partner" alt="Partner"></a>' +
                '<a href="#" class="sponsor-logo-link"><img src="https://placehold.co/110x50/1a1a1a/888888?text=Brand" alt="Brand"></a>' +
                '<a href="#" class="sponsor-logo-link"><img src="https://placehold.co/130x50/1a1a1a/888888?text=Company" alt="Company"></a>' +
                '<a href="#" class="sponsor-logo-link"><img src="https://placehold.co/90x50/1a1a1a/888888?text=Logo" alt="Logo"></a>' +
            '</div>';
    }

    // ========================================
    // CATEGORY PAGE MODE
    // ========================================

    async function renderCategoryPage(tabId) {
        var cat = getCategory(tabId);
        var labels = getLabels();
        var isEn = isEnPage();
        var isKg = isKgPage();
        var genderIcon = cat.gender === 'men' ? '\u2642' : '\u2640';
        var playersPage = isEn ? 'players-en.html' : (isKg ? 'players-kg.html' : 'players.html');

        // Extract base category ID (e.g. "men-promasters" → "promasters")
        var baseCatId = tabId.indexOf('-') !== -1 ? tabId.split('-').slice(1).join('-') : tabId;

        // Count completed tournaments for this category + gender
        var tournamentsCount = 0;
        if (window.supabaseClient) {
            try {
                var tRes = await window.supabaseClient
                    .from('tournaments')
                    .select('id', { count: 'exact', head: true })
                    .eq('category_id', baseCatId)
                    .eq('gender', cat.gender)
                    .eq('status', 'completed')
                    .not('published_at', 'is', null);
                if (tRes.count !== null && tRes.count !== undefined) tournamentsCount = tRes.count;
            } catch(e) {}
        }

        // Render hero
        renderCatHero(cat, genderIcon, labels, playersPage, tournamentsCount);

        // Hide podium
        var podiumEl = document.getElementById('playersPodium');
        if (podiumEl) podiumEl.style.display = 'none';

        // Render sticky category bar in filters section (already sticky at top:64px)
        // Content hidden until .stuck class is added via IntersectionObserver
        // Sticky bar — back + category name + search (all in one row)
        var filtersEl = document.getElementById('playersFilters');
        if (filtersEl) {
            filtersEl.classList.add('pl-cat-mode');
            filtersEl.innerHTML =
                '<div class="pl-cat-sticky-bar">' +
                    '<a href="' + playersPage + '" class="pl-cat-back-link">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
                        labels.catPageBack +
                    '</a>' +
                    '<div class="pl-cat-sticky-name">' + esc(cat.name) + ' <span>' + genderIcon + '</span></div>' +
                    '<div class="pl-cat-sticky-search">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                        '<input type="text" id="catSearchSticky" placeholder="' + labels.searchPlaceholder + '" autocomplete="off">' +
                    '</div>' +
                '</div>';

            // Sentinel before filters — when scrolled past hero, add .stuck
            var sentinel = document.createElement('div');
            sentinel.style.height = '1px';
            filtersEl.parentNode.insertBefore(sentinel, filtersEl);
            var obs = new IntersectionObserver(function(entries) {
                filtersEl.classList.toggle('stuck', !entries[0].isIntersecting);
            }, { threshold: [1], rootMargin: '-65px 0px 0px 0px' });
            obs.observe(sentinel);
        }

        // Render table
        renderCatTable(tabId, 1);

        // Sponsors
        renderSponsors();

        // Init pagination clicks
        initCatPagination(tabId);
        initCatSearch(tabId);

        initScrollAnimations();
        updateCatLangLinks(tabId);
    }

    function renderCatHero(cat, genderIcon, labels, playersPage, tournamentsCount) {
        var container = document.getElementById('playersHero');
        if (!container) return;

        var players = cat.players || [];
        var playerCount = players.length;
        var onlineCount = 0;
        for (var i = 0; i < players.length; i++) {
            if (players[i].online) onlineCount++;
        }

        var onlineLabel = isEnPage() ? 'Online' : (isKgPage() ? 'Онлайн' : 'Онлайн');

        var logged = isLoggedIn();
        var searchHtml =
            '<div class="pl-search-wrap pl-cat-search-wrap">' +
                '<svg class="pl-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '<input type="text" class="pl-search-input" id="catSearch" placeholder="' + labels.searchPlaceholder + '" autocomplete="off">' +
            '</div>';

        container.innerHTML =
            '<div class="pl-hero-bg"></div>' +
            '<div class="pl-hero-overlay"></div>' +
            '<div class="pl-cat-hero-content">' +
                '<h1 class="pl-cat-title">' + esc(cat.name) + ' <span class="pl-cat-gender">' + genderIcon + '</span></h1>' +
                '<div class="pl-cat-stats">' +
                    '<div class="pl-cat-stat">' +
                        '<div class="pl-cat-stat-value">' + playerCount + '</div>' +
                        '<div class="pl-cat-stat-label">' + labels.catPagePlayers + '</div>' +
                    '</div>' +
                    '<div class="pl-cat-stat">' +
                        '<div class="pl-cat-stat-value">' + tournamentsCount + '</div>' +
                        '<div class="pl-cat-stat-label">' + labels.catPageTournaments + '</div>' +
                    '</div>' +
                    '<div class="pl-cat-stat pl-cat-stat-online">' +
                        '<div class="pl-cat-stat-value">' + onlineCount + ' <span class="pl-online-dot pl-online-pulse"></span></div>' +
                        '<div class="pl-cat-stat-label">' + onlineLabel + '</div>' +
                    '</div>' +
                '</div>' +
                searchHtml +
            '</div>';
    }

    function renderCatTable(tabId, page) {
        var container = document.getElementById('playersTable');
        if (!container) return;

        var labels = getLabels();
        var cat = getCategory(tabId);
        var allPlayers = cat.players || [];
        var isEn = isEnPage();
        var isKg = isKgPage();

        // Filter by search query
        var players = allPlayers;
        if (catSearchQuery) {
            var q = catSearchQuery.toLowerCase();
            players = allPlayers.filter(function(p) {
                return p.name.toLowerCase().indexOf(q) !== -1;
            });
        }

        catCurrentPage = page;
        var totalPages = Math.max(1, Math.ceil(players.length / CAT_PER_PAGE));
        var start = (page - 1) * CAT_PER_PAGE;
        var pageItems = players.slice(start, start + CAT_PER_PAGE);

        if (pageItems.length === 0) {
            container.innerHTML = '<div class="pl-cat-table-wrap"><div class="pl-no-results">' + labels.noResults + '</div></div>';
            renderCatPaginationUI(0, 1);
            return;
        }

        var isGuest = _accessLevel === 'guest';
        var playerPage = isEn ? 'player-en.html' : (isKg ? 'player-kg.html' : 'player.html');

        // Guest: limit visible rows
        var totalVisible = isGuest ? Math.min(pageItems.length, GUEST_CAT_VISIBLE + GUEST_CAT_BLURRED) : pageItems.length;

        var headerRow = '<div class="pl-row pl-row-header pl-cat-row">' +
            '<span class="pl-col-rank">' + labels.rank + '</span>' +
            '<span class="pl-col-player">' + labels.player + '</span>' +
            '<span class="pl-col-ntrp">' + (labels.ntrp || 'NTRP') + '</span>' +
            '<span class="pl-col-points">' + labels.points + '</span>' +
            '<span class="pl-col-record">' + labels.record + '</span>' +
            '<span class="pl-col-form">' + labels.form + '</span>' +
            '<span class="pl-col-change">' + labels.change + '</span>' +
        '</div>';

        var html = '<div class="pl-cat-table-wrap">';

        // Table with header as first row (no separate sticky wrapper)
        html += '<div class="pl-table pl-cat-table-body">';
        html += headerRow;

        // Rows
        for (var i = 0; i < totalVisible; i++) {
            var p = pageItems[i];
            var rank = catSearchQuery ? (allPlayers.indexOf(p) + 1) : (start + i + 1);
            var rankClass = rank <= 3 ? ' pl-rank-top' : '';
            var rowClass = '';

            // Blur for guests after GUEST_CAT_VISIBLE rows
            var blurClass = '';
            if (isGuest && i >= GUEST_CAT_VISIBLE) {
                var blurLevel = i - GUEST_CAT_VISIBLE + 1;
                blurClass = ' pl-row-blur pl-row-blur-' + blurLevel;
            }

            var badgesHtml = getPlayerBadgesHtml(p.id, 3);

            var pForm = p.form || [];
            var formHtml = '';
            for (var f = 0; f < pForm.length; f++) {
                formHtml += '<span class="pl-form-dot ' + (pForm[f] === 'W' ? 'pl-form-win' : 'pl-form-loss') + '"></span>';
            }

            var changeHtml = '';
            if (p.change > 0) {
                changeHtml = '<span class="pl-change-up">\u2191' + p.change + '</span>';
            } else if (p.change < 0) {
                changeHtml = '<span class="pl-change-down">\u2193' + Math.abs(p.change) + '</span>';
            } else {
                changeHtml = '<span class="pl-change-neutral">\u2014</span>';
            }

            // Name: link for all, guests get modal instead of navigation
            var nameHtml;
            if (isGuest) {
                nameHtml = '<a href="#" class="pl-player-name" data-guest-profile="1">' + esc(p.name) + '</a>';
            } else {
                nameHtml = '<a href="' + playerPage + '?id=' + p.id + '" class="pl-player-name">' + esc(p.name) + '</a>';
            }

            html += '<div class="pl-row pl-cat-row pl-animate' + rowClass + blurClass + '" style="transition-delay:' + Math.min(i * 30, 300) + 'ms"' +
                (!isGuest ? ' data-player-id="' + p.id + '"' : '') +
                (!isGuest ? ' data-access="full"' : '') + '>' +
                '<span class="pl-col-rank' + rankClass + '">' + rank + '</span>' +
                '<div class="pl-col-player">' +
                    '<img src="' + esc(p.photo) + '" alt="" class="pl-player-photo">' +
                    '<div class="pl-player-info">' +
                        '<div class="pl-player-name-row">' +
                            nameHtml +
                            (badgesHtml ? '<span class="pl-player-badges">' + badgesHtml + '</span>' : '') +
                            (p.banned_until && new Date(p.banned_until) > new Date() ? '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;margin-left:4px;">' + (isEnPage() ? 'Banned' : (isKgPage() ? 'Бөгөт.' : 'Заблок.')) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<span class="pl-col-ntrp">' + (p.ntrp_rating ? '<span class="pl-ntrp-value">' + Number(p.ntrp_rating).toFixed(1) + '</span>' : '<span class="pl-ntrp-na">\u2014</span>') + '</span>' +
                '<span class="pl-col-points">' + p.points.toLocaleString() + '</span>' +
                '<span class="pl-col-record">' + p.wins + '/' + p.losses + '</span>' +
                '<span class="pl-col-form">' + formHtml + '</span>' +
                '<span class="pl-col-change">' + changeHtml + '</span>' +
            '</div>';
        }

        html += '</div>'; // close pl-table

        // Guest CTA overlay (same pattern as main ranking page)
        if (isGuest && pageItems.length > GUEST_CAT_VISIBLE) {
            var authUrl = getAuthUrl();
            html += '<div class="pl-guest-overlay">' +
                '<div class="pl-guest-cta">' +
                    '<div class="pl-guest-icon">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                            '<circle cx="12" cy="16" r="1"/>' +
                        '</svg>' +
                    '</div>' +
                    '<h3 class="pl-guest-title">' + labels.guestTitle + '</h3>' +
                    '<p class="pl-guest-text">' + labels.guestText + '</p>' +
                    '<a href="' + authUrl + '" class="pl-guest-btn">' + labels.guestBtn + '</a>' +
                '</div>' +
            '</div>';
        }

        html += '</div>'; // close pl-cat-table-wrap

        container.innerHTML = html;

        // Clickable rows for non-guests
        if (!isGuest) {
            var rows = container.querySelectorAll('.pl-cat-row[data-player-id]');
            rows.forEach(function(row) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function(e) {
                    if (e.target.closest('a')) return; // let link handle it
                    var pid = row.dataset.playerId;
                    window.location.href = playerPage + '?id=' + pid;
                });
            });
        }

        // Pagination UI (hide for guests)
        if (!isGuest) {
            renderCatPaginationUI(players.length, page);
        } else {
            var paginationEl = document.getElementById('playersPagination');
            if (paginationEl) paginationEl.innerHTML = '';
        }


        initScrollAnimations();
    }

    function renderCatPaginationUI(total, page) {
        var container = document.getElementById('playersPagination');
        if (!container) return;

        var totalPages = Math.max(1, Math.ceil(total / CAT_PER_PAGE));
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        var labels = getLabels();
        var html = '<div class="pl-pagination">';
        html += '<button class="pl-page-btn pl-page-prev"' + (page === 1 ? ' disabled' : '') + '>' + labels.prevPage + '</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="pl-page-btn pl-page-num' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="pl-page-btn pl-page-next"' + (page === totalPages ? ' disabled' : '') + '>' + labels.nextPage + '</button>';
        html += '</div>';

        container.innerHTML = html;
    }

    function initCatPagination(tabId) {
        document.addEventListener('click', function(e) {
            if (!isCategoryMode) return;

            var pageBtn = e.target.closest('.pl-page-btn');
            if (pageBtn && !pageBtn.disabled) {
                var cat = getCategory(tabId);
                var totalPages = Math.max(1, Math.ceil((cat.players || []).length / CAT_PER_PAGE));

                if (pageBtn.classList.contains('pl-page-prev')) {
                    catCurrentPage = Math.max(1, catCurrentPage - 1);
                } else if (pageBtn.classList.contains('pl-page-next')) {
                    catCurrentPage = Math.min(totalPages, catCurrentPage + 1);
                } else if (pageBtn.dataset.page) {
                    catCurrentPage = parseInt(pageBtn.dataset.page);
                }

                renderCatTable(tabId, catCurrentPage);
                var tableEl = document.getElementById('playersTable');
                if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function updateCatLangLinks(tabId) {
        document.querySelectorAll('.lang-option, .mobile-lang-option').forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('players') !== -1) {
                var base = href.split('?')[0];
                link.setAttribute('href', base + '?tab=' + tabId);
            }
        });
    }

    // ========================================
    // INTERACTIVITY
    // ========================================

    function initTabs() {
        document.addEventListener('click', function(e) {
            var genderBtn = e.target.closest('.pl-gender-tab');
            if (genderBtn) {
                var gender = genderBtn.dataset.gender;
                for (var key in categoriesData) {
                    if (categoriesData.hasOwnProperty(key) && categoriesData[key].gender === gender) {
                        switchTab(key);
                        break;
                    }
                }
                return;
            }

            var catBtn = e.target.closest('.pl-category-pill');
            if (catBtn) {
                switchTab(catBtn.dataset.tab);
                return;
            }

            var pageBtn = e.target.closest('.pl-page-btn');
            if (pageBtn && !pageBtn.disabled) {
                if (pageBtn.classList.contains('pl-page-prev')) {
                    currentPage = Math.max(1, currentPage - 1);
                } else if (pageBtn.classList.contains('pl-page-next')) {
                    currentPage++;
                } else if (pageBtn.dataset.page) {
                    currentPage = parseInt(pageBtn.dataset.page);
                }
                renderTable(currentTab, currentPage);
                var tableEl = document.getElementById('playersTable');
                if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function switchTab(tab) {
        if (!categoriesData[tab]) return;
        currentTab = tab;
        currentPage = 1;
        searchQuery = '';

        var searchInput = document.getElementById('playersSearch');
        if (searchInput) searchInput.value = '';

        renderFilters();
        renderPodium(tab);
        renderTable(tab, 1);
    }

    function initSearch() {
        document.addEventListener('input', function(e) {
            if (e.target.id !== 'playersSearch') return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                var val = e.target.value.trim();
                searchQuery = val;
                currentPage = 1;

                if (!val) {
                    isSearchMode = false;
                    renderPodium(currentTab, true);
                    renderFilters();
                    var podiumEl = document.getElementById('playersPodium');
                    var filtersEl = document.getElementById('playersFilters');
                    if (podiumEl) podiumEl.style.display = '';
                    if (filtersEl) filtersEl.style.display = '';
                    renderTable(currentTab, 1);
                } else {
                    renderTable(currentTab, 1);
                }
            }, 200);
        });
    }

    function initCatSearch(tabId) {
        var guestModalShown = false;

        function handleSearch(e) {
            if (e.target.id !== 'catSearch' && e.target.id !== 'catSearchSticky') return;

            // Guest: show modal on first input
            if (!isLoggedIn()) {
                if (!guestModalShown) {
                    guestModalShown = true;
                    showSearchAuthModal();
                }
                return;
            }

            // Sync both inputs
            var val = e.target.value;
            var hero = document.getElementById('catSearch');
            var sticky = document.getElementById('catSearchSticky');
            if (hero && hero !== e.target) hero.value = val;
            if (sticky && sticky !== e.target) sticky.value = val;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                catSearchQuery = val.trim();
                catCurrentPage = 1;
                renderCatTable(tabId, 1);
            }, 200);
        }

        document.addEventListener('input', handleSearch);
    }

    function showSearchAuthModal() {
        var labels = getLabels();
        var authUrl = getAuthUrl();
        var isEn = isEnPage();
        var isKg = isKgPage();

        var overlay = document.createElement('div');
        overlay.className = 'pl-search-modal-overlay';
        overlay.innerHTML =
            '<div class="pl-search-modal">' +
                '<button class="pl-search-modal-close">&times;</button>' +
                '<div class="pl-search-modal-icon">' +
                    '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '</div>' +
                '<h3>' + labels.guestTitle + '</h3>' +
                '<p>' + (isEn ? 'Sign up to search players and access full rankings' : (isKg ? 'Оюнчуларды издөө жана толук рейтингге кирүү үчүн катталыңыз' : 'Зарегистрируйтесь, чтобы искать игроков и получить полный доступ к рейтингу')) + '</p>' +
                '<a href="' + authUrl + '" class="pl-search-modal-btn">' + labels.guestBtn + '</a>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        // Clear search input
        var input = document.getElementById('catSearch');
        if (input) input.value = '';

        // Close handlers
        var closeBtn = overlay.querySelector('.pl-search-modal-close');
        closeBtn.addEventListener('click', function() { closeModal(overlay); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                closeModal(overlay);
                document.removeEventListener('keydown', handler);
            }
        });

        function closeModal(el) {
            el.classList.remove('visible');
            setTimeout(function() { if (el.parentNode) el.remove(); }, 300);
        }
    }

    // ========================================
    // GUEST PROFILE MODAL + DELEGATION
    // ========================================

    function showProfileAuthModal() {
        var authUrl = getAuthUrl();
        var isEn = isEnPage();
        var isKg = isKgPage();
        var labels = getLabels();

        var overlay = document.createElement('div');
        overlay.className = 'pl-search-modal-overlay';
        overlay.innerHTML =
            '<div class="pl-search-modal">' +
                '<button class="pl-search-modal-close">&times;</button>' +
                '<div class="pl-search-modal-icon">' +
                    '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                '</div>' +
                '<h3>' + labels.guestTitle + '</h3>' +
                '<p>' + (isEn ? 'Sign up to view player profiles and full rankings' : (isKg ? 'Оюнчулардын профилдерин жана толук рейтингди көрүү үчүн катталыңыз' : 'Зарегистрируйтесь, чтобы просматривать профили игроков и полный рейтинг')) + '</p>' +
                '<a href="' + authUrl + '" class="pl-search-modal-btn">' + labels.guestBtn + '</a>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        var closeBtn = overlay.querySelector('.pl-search-modal-close');
        closeBtn.addEventListener('click', function() { closeModal(overlay); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                closeModal(overlay);
                document.removeEventListener('keydown', handler);
            }
        });

        function closeModal(el) {
            el.classList.remove('visible');
            setTimeout(function() { if (el.parentNode) el.remove(); }, 300);
        }
    }

    // Event delegation for guest profile clicks
    document.addEventListener('click', function(e) {
        var link = e.target.closest('[data-guest-profile]');
        if (link) {
            e.preventDefault();
            showProfileAuthModal();
        }
    });

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================

    function initScrollAnimations() {
        var elements = document.querySelectorAll('.pl-animate:not(.pl-visible)');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('pl-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

        elements.forEach(function(el) { observer.observe(el); });
    }

    // ========================================
    // LANGUAGE LINKS
    // ========================================

    function updateLangLinks(tab) {
        document.querySelectorAll('.lang-option, .mobile-lang-option').forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('players') !== -1) {
                var base = href.split('?')[0];
                link.setAttribute('href', base + '?tab=' + tab);
            }
        });
    }
})();
