// ========================================
// PLAYERS PAGE — Rendering + Interactivity
// ========================================

(function() {
    var PER_PAGE = 20;
    var currentTab = 'men-promasters';
    var currentPage = 1;
    var searchQuery = '';
    var debounceTimer = null;

    var GUEST_VISIBLE_ROWS = 8;
    var GUEST_BLURRED_ROWS = 4;

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

    var badgeMap = {
        champion: { emoji: '\ud83c\udfc6', ru: 'Чемпион последнего турнира', en: 'Tournament Champion' },
        streak:   { emoji: '\ud83d\udd25', ru: 'Серия 5+ побед', en: 'Win streak 5+' },
        top1:     { emoji: '\ud83d\udc51', ru: '#1 текущего месяца', en: '#1 of the month' },
        newbie:   { emoji: '\ud83c\udd95', ru: 'Новичок', en: 'Newcomer' },
        breakthrough: { emoji: '\u2b06\ufe0f', ru: 'Прорыв (+10 позиций)', en: 'Breakthrough' }
    };

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
            actions: '',
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
            noResults: 'Игроки не найдены',
            authRequired: 'Требуется авторизация',
            guestTitle: 'Зарегистрируйтесь для полного доступа',
            guestText: 'Полный рейтинг, поиск игроков и статистика доступны после регистрации',
            guestBtn: 'Войти / Регистрация'
        };
    }

    function isEnPage() {
        return window.location.pathname.indexOf('-en') !== -1;
    }

    function getAuthUrl() {
        return isEnPage() ? 'auth-en.html' : 'auth.html';
    }

    function getBadgeTooltip(key) {
        var labels = getLabels();
        var map = {
            champion: labels.badgeChampion,
            streak: labels.badgeStreak,
            top1: labels.badgeTop1,
            newbie: labels.badgeNewbie,
            breakthrough: labels.badgeBreakthrough
        };
        return map[key] || key;
    }

    function getAllPlayers() {
        var all = [];
        var cats = playersData.categories;
        for (var key in cats) {
            if (cats.hasOwnProperty(key)) {
                all = all.concat(cats[key].players);
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
        return playersData.categories[tab] || playersData.categories['men-promasters'];
    }

    function getFilteredPlayers(tab) {
        var cat = getCategory(tab);
        if (!searchQuery) return cat.players;
        // Search across ALL categories
        var q = searchQuery.toLowerCase();
        var results = [];
        var cats = playersData.categories;
        for (var key in cats) {
            if (!cats.hasOwnProperty(key)) continue;
            var c = cats[key];
            for (var i = 0; i < c.players.length; i++) {
                var p = c.players[i];
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
    // INIT
    // ========================================

    document.addEventListener('DOMContentLoaded', function() {
        var params = new URLSearchParams(window.location.search);
        var tab = params.get('tab');
        if (tab && playersData.categories[tab]) {
            currentTab = tab;
        }

        renderHero();
        renderFilters();
        renderPodium(currentTab);
        renderTable(currentTab, 1);
        renderSponsors();
        initTabs();
        initSearch();
        initScrollAnimations();
        updateLangLinks(currentTab);
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
        var top3 = cat.players.slice(0, 3);
        var medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
        // Podium order: 2nd (left), 1st (center), 3rd (right)
        var order = [1, 0, 2];
        var placeClass = ['pl-podium-first', 'pl-podium-second', 'pl-podium-third'];

        var animClasses = instant ? 'pl-animate pl-visible' : 'pl-animate';

        var html = '<div class="pl-podium">';
        for (var oi = 0; oi < order.length; oi++) {
            var i = order[oi];
            if (!top3[i]) continue;
            var p = top3[i];
            var badgesHtml = '';
            for (var b = 0; b < p.badges.length; b++) {
                var badge = badgeMap[p.badges[b]];
                if (badge) {
                    badgesHtml += '<span class="pl-badge" title="' + getBadgeTooltip(p.badges[b]) + '">' + badge.emoji + '</span>';
                }
            }

            html += '<div class="pl-podium-card ' + placeClass[i] + ' ' + animClasses + '">' +
                '<div class="pl-podium-medal">' + medals[i] + '</div>' +
                '<div class="pl-podium-photo-wrap">' +
                    '<img src="' + p.photo + '" alt="' + p.name + '" class="pl-podium-photo">' +
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
        for (var key in playersData.categories) {
            if (playersData.categories.hasOwnProperty(key)) {
                var cat = playersData.categories[key];
                if (cat.gender === 'men') menCats.push({ key: key, name: cat.name });
                else womenCats.push({ key: key, name: cat.name });
            }
        }

        html = '<div class="pl-gender-tabs">' +
            '<button class="pl-gender-tab' + (currentGender === 'men' ? ' active' : '') + '" data-gender="men">' + labels.men + '</button>' +
            '<button class="pl-gender-tab' + (currentGender === 'women' ? ' active' : '') + '" data-gender="women">' + labels.women + '</button>' +
        '</div>';

        html += '<div class="pl-category-pills" id="categoryPills">';
        var cats = currentGender === 'men' ? menCats : womenCats;
        for (var i = 0; i < cats.length; i++) {
            html += '<button class="pl-category-pill' + (cats[i].key === currentTab ? ' active' : '') + '" data-tab="' + cats[i].key + '">' + cats[i].name + '</button>';
        }
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

        // In search mode, filtered is array of {player, categoryKey, categoryName, rankInCategory}
        // In normal mode, filtered is array of player objects
        var items = isSearchMode ? filtered : filtered;
        var totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
        if (page > totalPages) page = totalPages;
        currentPage = page;

        var start = (page - 1) * PER_PAGE;
        var pageItems = items.slice(start, start + PER_PAGE);

        // Toggle podium/filters visibility in search mode
        var podiumEl = document.getElementById('playersPodium');
        var filtersEl = document.getElementById('playersFilters');
        var paginationEl = document.getElementById('playersPagination');
        var sponsorsEl = document.getElementById('playersSponsors');
        if (podiumEl) podiumEl.style.display = isSearchMode ? 'none' : '';
        if (filtersEl) filtersEl.style.display = isSearchMode ? 'none' : '';
        // Reduce gap between table and sponsors in search mode
        if (container) container.style.paddingBottom = isSearchMode ? '16px' : '';
        if (sponsorsEl) sponsorsEl.style.paddingTop = isSearchMode ? '0' : '';

        if (pageItems.length === 0) {
            container.innerHTML = '<div class="pl-no-results">' + labels.noResults + '</div>';
            renderPagination(0, 1);
            return;
        }

        var html = '<div class="pl-table">';

        // Header
        html += '<div class="pl-row pl-row-header">' +
            '<span class="pl-col-rank">' + labels.rank + '</span>' +
            '<span class="pl-col-player">' + labels.player + '</span>' +
            '<span class="pl-col-online">' + labels.online + '</span>' +
            '<span class="pl-col-country">' + labels.country + '</span>' +
            '<span class="pl-col-points">' + labels.points + '</span>' +
            '<span class="pl-col-record">' + labels.record + '</span>' +
            '<span class="pl-col-form">' + labels.form + '</span>' +
            '<span class="pl-col-change">' + labels.change + '</span>' +
            (logged ? '<span class="pl-col-actions">' + labels.actions + '</span>' : '') +
        '</div>';

        // Guest restriction
        var logged = isLoggedIn();
        var isGuest = !logged && !isSearchMode;
        var totalVisible = isGuest ? Math.min(pageItems.length, GUEST_VISIBLE_ROWS + GUEST_BLURRED_ROWS) : pageItems.length;

        // Rows
        for (var i = 0; i < totalVisible; i++) {
            var item = pageItems[i];
            var p = isSearchMode ? item.player : item;
            var rank = isSearchMode ? item.rankInCategory : (start + i + 1);
            var rankClass = rank <= 3 ? ' pl-rank-top' : '';

            // Blur level for guest rows beyond visible limit
            var blurClass = '';
            if (isGuest && i >= GUEST_VISIBLE_ROWS) {
                var blurLevel = i - GUEST_VISIBLE_ROWS + 1;
                blurClass = ' pl-row-blur pl-row-blur-' + blurLevel;
            }

            // Badges
            var badgesHtml = '';
            for (var b = 0; b < p.badges.length; b++) {
                var badge = badgeMap[p.badges[b]];
                if (badge) {
                    badgesHtml += '<span class="pl-badge" title="' + getBadgeTooltip(p.badges[b]) + '">' + badge.emoji + '</span>';
                }
            }

            // Category label (search mode only)
            var catLabel = isSearchMode ? '<span class="pl-player-category">' + item.categoryName + '</span>' : '';

            // Form dots
            var formHtml = '';
            for (var f = 0; f < p.form.length; f++) {
                formHtml += '<span class="pl-form-dot ' + (p.form[f] === 'W' ? 'pl-form-win' : 'pl-form-loss') + '"></span>';
            }

            // Change
            var changeHtml = '';
            if (p.change > 0) {
                changeHtml = '<span class="pl-change-up">\u2191' + p.change + '</span>';
            } else if (p.change < 0) {
                changeHtml = '<span class="pl-change-down">\u2193' + Math.abs(p.change) + '</span>';
            } else {
                changeHtml = '<span class="pl-change-neutral">\u2014</span>';
            }

            // Actions (only for logged-in users)
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
                    '<img src="' + p.photo + '" alt="" class="pl-player-photo">' +
                    '<div class="pl-player-info">' +
                        '<div class="pl-player-name-row">' +
                            '<a href="' + (isEnPage() ? 'player-en.html' : 'player.html') + '?id=' + p.id + '" class="pl-player-name">' + p.name + '</a>' +
                            (badgesHtml ? '<span class="pl-player-badges">' + badgesHtml + '</span>' : '') +
                        '</div>' +
                        catLabel +
                    '</div>' +
                '</div>' +
                '<span class="pl-col-online">' + (p.online ? '<span class="pl-online-dot pl-online-pulse"></span>' : '<span class="pl-offline-dot"></span>') + '</span>' +
                '<span class="pl-col-country">' + p.country + '</span>' +
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
            var hiddenCount = items.length - GUEST_VISIBLE_ROWS;
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
                    '<div class="pl-guest-hint">+' + hiddenCount + ' ' + (isEnPage() ? 'more players' : 'игроков скрыто') + '</div>' +
                '</div>' +
            '</div>';
        }

        container.innerHTML = html;

        // Hide pagination for guests
        if (!logged) {
            var paginationEl = document.getElementById('playersPagination');
            if (paginationEl) paginationEl.style.display = 'none';
        }

        renderPagination(items.length, page);
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
    // INTERACTIVITY
    // ========================================

    function initTabs() {
        // Gender tabs
        document.addEventListener('click', function(e) {
            var genderBtn = e.target.closest('.pl-gender-tab');
            if (genderBtn) {
                var gender = genderBtn.dataset.gender;
                // Find first category of this gender
                for (var key in playersData.categories) {
                    if (playersData.categories.hasOwnProperty(key) && playersData.categories[key].gender === gender) {
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

            // Pagination
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
        if (!playersData.categories[tab]) return;
        currentTab = tab;
        currentPage = 1;
        searchQuery = '';

        var searchInput = document.getElementById('playersSearch');
        if (searchInput) searchInput.value = '';

        renderFilters();
        renderPodium(tab);
        renderTable(tab, 1);
        updateUrl(tab);
        updateLangLinks(tab);
    }

    function updateUrl(tab) {
        var url = new URL(window.location);
        url.searchParams.set('tab', tab);
        history.replaceState(null, '', url);
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
                    // Search cleared — restore podium for active tab
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
