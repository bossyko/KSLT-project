// ========================================
// Partners Page — Player Search
// 3 access levels: guest (8 + blur), registered (all), member (full)
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;

    var L = isEn ? {
        heroTagline: 'KSLT Partners',
        heroTitle: 'Player <span>Search</span>',
        heroDesc: 'Connect with tennis players in Bishkek for games and practice',
        online: 'Online',
        offline: 'Offline',
        filterAll: 'All',
        filterMen: 'Men',
        filterWomen: 'Women',
        guestTitle: 'Register to see all players',
        guestText: 'Create an account to access the full list of tennis partners',
        guestBtn: 'Sign Up',
        guestHidden: 'more players',
        searchPlaceholder: 'Search by name...',
        empty: 'No partners found',
        emptyFiltered: 'No partners match the selected filter',
        levelBeginner: 'Beginner',
        levelIntermediate: 'Intermediate',
        levelAdvanced: 'Advanced',
        levelUnknown: 'Level not specified',
        inviteBtn: 'Invite to play',
        inviteConfirmTitle: 'Send game invitation?',
        inviteConfirmText: 'By sending an invitation, you agree that your Telegram contact may be shared with the recipient if they accept.',
        inviteConfirmBtn: 'Send',
        inviteConfirmCancel: 'Cancel',
        inviteSent: 'Invitation sent!',
        inviteNoTg: 'Player has no Telegram connected',
        inviteError: 'Failed to send invitation',
        inviteLimit: 'Daily invite limit reached (5/day)',
        invitePending: 'Invitation already sent',
        inviteSelf: 'Cannot invite yourself',
        modalGuestTitle: 'Join us!',
        modalGuestText: 'Sign up and become a KSLT member to send game invitations',
        modalGuestBtn: 'Sign Up',
        modalRegTitle: 'Become a member',
        modalRegText: 'Get a KSLT membership to send game invitations to other players',
        modalRegBtn: 'Pay for membership',
        modalRegDisclaimer: 'By paying, you agree to the <a href="rules-en.html" target="_blank">rules</a> and <a href="pricing-en.html" target="_blank">pricing</a> of KSLT'
    } : isKg ? {
        heroTagline: 'KSLT Өнөктөштөр',
        heroTitle: '<span>Оюнчу</span> издөө',
        heroDesc: 'Оюн жана машыгуу үчүн Бишкектеги теннисчилерди табыңыз',
        online: 'Онлайн',
        offline: 'Оффлайн',
        filterAll: 'Баары',
        filterMen: 'Эркектер',
        filterWomen: 'Аялдар',
        guestTitle: 'Баарын көрүү үчүн катталыңыз',
        guestText: 'Теннис өнөктөштөрүнүн толук тизмесине мүмкүнчүлүк алуу үчүн аккаунт түзүңүз',
        guestBtn: 'Каттоо',
        guestHidden: 'оюнчу жашырылган',
        searchPlaceholder: 'Аты боюнча издөө...',
        empty: 'Өнөктөштөр табылган жок',
        emptyFiltered: 'Тандалган чыпка боюнча өнөктөштөр жок',
        levelBeginner: 'Башталгыч',
        levelIntermediate: 'Орточо',
        levelAdvanced: 'Алдыңкы',
        levelUnknown: 'Деңгээл көрсөтүлгөн эмес',
        inviteBtn: 'Оюн сунуштоо',
        inviteConfirmTitle: 'Оюнга чакыруу жөнөтөсүзбү?',
        inviteConfirmText: 'Чакыруу жөнөтүү менен, кабыл алган учурда Telegram байланышыңыз алуучуга берилиши мүмкүн экенине макулдугуңузду билдиресиз.',
        inviteConfirmBtn: 'Жөнөтүү',
        inviteConfirmCancel: 'Жокко чыгаруу',
        inviteSent: 'Чакыруу жөнөтүлдү!',
        inviteNoTg: 'Оюнчунун Telegram\'ы байланган эмес',
        inviteError: 'Чакыруу жөнөтүлгөн жок',
        inviteLimit: 'Күнүмдүк чакыруу лимити (5/күн)',
        invitePending: 'Чакыруу мурунтан жөнөтүлгөн',
        inviteSelf: 'Өзүңдү чакыра албайсыз',
        modalGuestTitle: 'Кошулуңуз!',
        modalGuestText: 'Оюнга чакыруу жөнөтүү үчүн катталып, КСЛТ мүчөсү болуңуз',
        modalGuestBtn: 'Каттоо',
        modalRegTitle: 'КСЛТ мүчөсү болуңуз',
        modalRegText: 'Башка оюнчуларга оюнга чакыруу жөнөтүү үчүн КСЛТ мүчөлүгүн алыңыз',
        modalRegBtn: 'Мүчөлүктү төлөө',
        modalRegDisclaimer: 'Баскычты басуу менен, <a href="rules-kg.html" target="_blank">эрежелер</a> жана <a href="pricing-kg.html" target="_blank">баалар</a> менен тааныштыгыңызды тастыктайсыз'
    } : {
        heroTagline: 'KSLT Партнёры',
        heroTitle: 'Поиск <span>игрока</span>',
        heroDesc: 'Найдите теннисистов в Бишкеке для совместных игр и тренировок',
        online: 'Онлайн',
        offline: 'Оффлайн',
        filterAll: 'Все',
        filterMen: 'Мужчины',
        filterWomen: 'Женщины',
        guestTitle: 'Зарегистрируйтесь, чтобы видеть всех',
        guestText: 'Создайте аккаунт для доступа к полному списку теннисных партнёров',
        guestBtn: 'Регистрация',
        guestHidden: 'игроков скрыто',
        searchPlaceholder: 'Поиск по имени...',
        empty: 'Партнёры не найдены',
        emptyFiltered: 'Нет партнёров по выбранному фильтру',
        levelBeginner: 'Начинающий',
        levelIntermediate: 'Средний',
        levelAdvanced: 'Продвинутый',
        levelUnknown: 'Уровень не указан',
        inviteBtn: 'Предложить игру',
        inviteConfirmTitle: 'Отправить приглашение на игру?',
        inviteConfirmText: 'Отправляя приглашение, вы соглашаетесь, что ваш контакт в Telegram может быть передан получателю в случае принятия приглашения.',
        inviteConfirmBtn: 'Отправить',
        inviteConfirmCancel: 'Отмена',
        inviteSent: 'Приглашение отправлено!',
        inviteNoTg: 'У игрока не привязан Telegram',
        inviteError: 'Не удалось отправить приглашение',
        inviteLimit: 'Лимит приглашений на сегодня (5/день)',
        invitePending: 'Приглашение уже отправлено',
        inviteSelf: 'Нельзя пригласить себя',
        modalGuestTitle: 'Присоединяйтесь!',
        modalGuestText: 'Зарегистрируйтесь и станьте членом КСЛТ для отправки приглашений на игру',
        modalGuestBtn: 'Регистрация',
        modalRegTitle: 'Станьте членом КСЛТ',
        modalRegText: 'Оформите членство КСЛТ, чтобы отправлять приглашения на игру другим игрокам',
        modalRegBtn: 'Оплатить членство',
        modalRegDisclaimer: 'Нажимая кнопку, вы подтверждаете, что ознакомлены с <a href="rules.html" target="_blank">правилами</a> и <a href="pricing.html" target="_blank">тарифами</a> КСЛТ'
    };

    var authPage = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
    var pricingPage = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');
    var FUNCTIONS_URL = 'https://qqkzszesviukopgjbead.supabase.co/functions/v1';
    var ANON_KEY = 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G';
    var _partners = [];
    var _currentFilter = 'all';
    var _ntrpFilter = null;
    var _searchQuery = '';
    var _sendingInvite = false;

    var ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    var GUEST_VISIBLE = 8;
    var GUEST_BLURRED = 4;
    var PER_PAGE = 20;
    var _currentPage = 1;

    var emptySvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    var lockSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>';

    // Access level: 'guest' | 'registered' | 'member'
    var _accessLevel = 'guest';

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        renderHero();
        renderFilters();
        initPaginationClicks();
        await detectAccess();
        await loadPartners();
        if (window.loadSponsors) loadSponsors('ptSponsors');
    }

    // ---- Detect access level ----
    async function detectAccess() {
        // Check real Supabase session (not just localStorage)
        var loggedIn = false;
        if (client) {
            try {
                var res = await client.auth.getSession();
                if (res.data && res.data.session) {
                    loggedIn = true;
                }
            } catch(e) {}
        }

        if (!loggedIn) {
            _accessLevel = 'guest';
            return;
        }

        // User is logged in — check admin or membership
        _accessLevel = 'registered';

        // Check role from profile
        try {
            var uid = (await client.auth.getUser()).data.user.id;
            var profileRes = await client.from('profiles').select('role').eq('id', uid).single();
            if (profileRes.data && (profileRes.data.role === 'admin' || profileRes.data.role === 'manager')) {
                _accessLevel = 'member';
                return;
            }
        } catch(e) {}

        if (typeof window.checkMembership === 'function') {
            try {
                var mem = await window.checkMembership();
                if (mem && mem.active) {
                    _accessLevel = 'member';
                }
            } catch(e) {}
        }
    }

    function isOnline(lastSeen) {
        if (!lastSeen) return false;
        return (new Date() - new Date(lastSeen)) < ONLINE_THRESHOLD;
    }

    // Fisher-Yates shuffle
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
    }

    function escHtml(s) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- Hero ----
    function renderHero() {
        var el = document.getElementById('ptHero');
        if (!el) return;
        var heroImg = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80';
        el.innerHTML =
            '<div class="pt-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="pt-hero-overlay"></div>' +
            '<div class="pt-hero-content">' +
                '<div class="pt-hero-tagline">' + L.heroTagline + '</div>' +
                '<h1>' + L.heroTitle + '</h1>' +
                '<p>' + L.heroDesc + '</p>' +
            '</div>';
    }

    // ---- Filters ----
    function renderFilters() {
        var el = document.getElementById('ptFilters');
        if (!el) return;

        var filters = [
            { key: 'all', label: L.filterAll },
            { key: 'male', label: L.filterMen },
            { key: 'female', label: L.filterWomen }
        ];

        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');

        var html =
            '<a href="' + servicesLink + '" class="kslt-back" style="align-self:flex-start;">\u2190 ' + (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги')) + '</a>' +
            '<div class="pt-search-wrap">' +
            '<svg class="pt-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<input type="text" class="pt-search" id="ptSearch" placeholder="' + L.searchPlaceholder + '">' +
            '</div>';

        html += '<div class="pt-filter-row">';
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];
            html += '<button class="pt-filter-btn' + (f.key === _currentFilter ? ' active' : '') + '" data-filter="' + f.key + '">' + f.label + '</button>';
        }
        var ntrpRanges = [
            { value: '', label: isEn ? 'All NTRP' : (isKg ? 'Баары NTRP' : 'Все NTRP') },
            { value: '1-2.5', min: 1, max: 2.5, label: isEn ? 'Beginner (1.0\u20132.5)' : (isKg ? 'Башталгыч (1.0\u20132.5)' : 'Начинающий (1.0\u20132.5)') },
            { value: '2.5-3.5', min: 2.5, max: 3.5, label: isEn ? 'Intermediate (2.5\u20133.5)' : (isKg ? 'Орточо (2.5\u20133.5)' : 'Средний (2.5\u20133.5)') },
            { value: '3.5-4.5', min: 3.5, max: 4.5, label: isEn ? 'Advanced (3.5\u20134.5)' : (isKg ? '\u04e8\u043d\u04af\u043a\u043a\u04e9\u043d (3.5\u20134.5)' : 'Продвинутый (3.5\u20134.5)') },
            { value: '4.5-5.5', min: 4.5, max: 5.5, label: isEn ? 'Strong (4.5\u20135.5)' : (isKg ? 'К\u04af\u0447\u0442\u04af\u04af (4.5\u20135.5)' : 'Сильный (4.5\u20135.5)') },
            { value: '5.5-7', min: 5.5, max: 7, label: isEn ? 'Expert (5.5\u20137.0)' : (isKg ? 'Эксперт (5.5\u20137.0)' : 'Эксперт (5.5\u20137.0)') }
        ];
        html += '<select class="pt-ntrp-select" id="ptNtrpFilter">';
        for (var n = 0; n < ntrpRanges.length; n++) {
            html += '<option value="' + ntrpRanges[n].value + '">' + ntrpRanges[n].label + '</option>';
        }
        html += '</select>';
        html += '</div>';

        el.innerHTML = html;

        document.getElementById('ptSearch').addEventListener('input', function(e) {
            _searchQuery = e.target.value.toLowerCase().trim();
            _currentPage = 1;
            renderGrid();
        });

        document.getElementById('ptNtrpFilter').addEventListener('change', function(e) {
            var val = e.target.value;
            if (!val) {
                _ntrpFilter = null;
            } else {
                var found = ntrpRanges.filter(function(r) { return r.value === val; })[0];
                _ntrpFilter = found ? { min: found.min, max: found.max } : null;
            }
            _currentPage = 1;
            renderGrid();
        });

        el.addEventListener('click', function(e) {
            var btn = e.target.closest('.pt-filter-btn');
            if (!btn) return;
            _currentFilter = btn.dataset.filter;
            _currentPage = 1;
            var btns = el.querySelectorAll('.pt-filter-btn');
            for (var j = 0; j < btns.length; j++) {
                btns[j].classList.toggle('active', btns[j].dataset.filter === _currentFilter);
            }
            renderGrid();
        });

        // Detect stuck state
        var sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        el.parentNode.insertBefore(sentinel, el);
        new IntersectionObserver(function(entries) {
            el.classList.toggle('stuck', !entries[0].isIntersecting);
        }, { threshold: [1], rootMargin: '-65px 0px 0px 0px' }).observe(sentinel);
    }

    // ---- Load partners via RPC ----
    async function loadPartners() {
        if (!client) {
            renderGrid();
            return;
        }

        try {
            var result = await client.rpc('get_public_partners');
            if (result.data && result.data.length > 0) {
                // Load NTRP ratings from players table
                var playerIds = result.data.map(function(p) { return p.id; });
                var ntrpRes = await client.from('players').select('id, ntrp_rating').in('id', playerIds);
                var ntrpMap = {};
                (ntrpRes.data || []).forEach(function(p) { ntrpMap[p.id] = p.ntrp_rating; });
                result.data.forEach(function(p) { p.ntrp_rating = ntrpMap[p.id] || null; });

                var shuffled = shuffle(result.data);
                var onlineArr = [];
                var offlineArr = [];
                for (var i = 0; i < shuffled.length; i++) {
                    if (isOnline(shuffled[i].last_seen)) {
                        onlineArr.push(shuffled[i]);
                    } else {
                        offlineArr.push(shuffled[i]);
                    }
                }
                _partners = onlineArr.concat(offlineArr);
            }
        } catch(e) {
            console.error('Partners RPC error:', e);
        }

        renderGrid();
    }

    // ---- Get filtered list ----
    function getFiltered() {
        var list = _partners;
        if (_currentFilter !== 'all') {
            list = list.filter(function(p) { return p.gender === _currentFilter; });
        }
        if (_ntrpFilter) {
            list = list.filter(function(p) {
                return p.ntrp_rating && p.ntrp_rating >= _ntrpFilter.min && p.ntrp_rating < _ntrpFilter.max;
            });
        }
        if (_searchQuery) {
            list = list.filter(function(p) {
                return p.full_name && p.full_name.toLowerCase().indexOf(_searchQuery) !== -1;
            });
        }
        return list;
    }

    // ---- Render grid ----
    function renderGrid() {
        var el = document.getElementById('ptGrid');
        if (!el) return;

        var filtered = getFiltered();
        var isGuest = _accessLevel === 'guest';
        var html = '';

        if (_partners.length === 0) {
            html = '<div class="pt-grid"><div class="pt-empty">' + emptySvg + '<p>' + L.empty + '</p></div></div>';
            renderPagination(0, 1);
        } else if (filtered.length === 0) {
            html = '<div class="pt-grid"><div class="pt-empty">' + emptySvg + '<p>' + L.emptyFiltered + '</p></div></div>';
            renderPagination(0, 1);
        } else if (isGuest) {
            // Guest: no pagination, limited view
            // NTRP filter = stricter limit (3 visible + 2 blur)
            var hasFilter = _ntrpFilter || _currentFilter !== 'all';
            var guestVis = hasFilter ? 4 : GUEST_VISIBLE;
            var guestBlur = _ntrpFilter ? 2 : GUEST_BLURRED;
            var total = Math.min(filtered.length, guestVis + guestBlur);

            html = '<div class="pt-grid">';
            for (var i = 0; i < total; i++) {
                var blurClass = '';
                if (i >= guestVis) {
                    var level = i - guestVis + 1;
                    blurClass = ' pt-card-blur pt-card-blur-' + level;
                }
                html += renderCard(filtered[i], blurClass);
            }
            html += '</div>';

            // Guest CTA overlay — always show when NTRP filter active
            if (filtered.length > guestVis || _ntrpFilter) {
                html += '<div class="pt-guest-overlay">' +
                    '<div class="pt-guest-cta">' +
                        '<div class="pt-guest-icon">' + lockSvg + '</div>' +
                        '<h3 class="pt-guest-title">' + L.guestTitle + '</h3>' +
                        '<p class="pt-guest-text">' + L.guestText + '</p>' +
                        '<a href="' + authPage + '" class="pt-guest-btn">' + L.guestBtn + '</a>' +
                    '</div>' +
                '</div>';
            }
            renderPagination(0, 1);
        } else {
            // Registered/member: paginate
            var start = (_currentPage - 1) * PER_PAGE;
            var pageItems = filtered.slice(start, start + PER_PAGE);

            html = '<div class="pt-grid">';
            for (var i = 0; i < pageItems.length; i++) {
                html += renderCard(pageItems[i], '');
            }
            html += '</div>';
            renderPagination(filtered.length, _currentPage);
        }

        el.innerHTML = html;
    }

    // ---- Render single card ----
    function renderCard(p, extraClass) {
        var online = isOnline(p.last_seen);
        var name = escHtml(p.full_name);
        var category = isEn ? (p.category_name_en || p.category_name) : (isKg ? (p.category_name_kg || p.category_name) : p.category_name);

        // Play level fallback if no official category
        var levelMap = { beginner: L.levelBeginner, intermediate: L.levelIntermediate, advanced: L.levelAdvanced };
        var badgeText = category || (p.play_level && levelMap[p.play_level]) || L.levelUnknown;
        var badgeClass = category ? 'pt-badge' : (p.play_level ? 'pt-badge pt-badge-level' : 'pt-badge pt-badge-unknown');

        var avatarHtml;
        if (p.avatar_url) {
            avatarHtml = '<img class="pt-avatar" src="' + p.avatar_url + '" alt="" loading="lazy">';
        } else {
            avatarHtml = '<div class="pt-avatar-placeholder">' + getInitials(p.full_name) + '</div>';
        }

        var ntrpHtml = '';
        if (p.ntrp_rating) {
            ntrpHtml = '<div class="pt-ntrp-badge">NTRP ' + Number(p.ntrp_rating).toFixed(1) + '</div>';
        }

        var playerPage = isEn ? 'player-en.html' : isKg ? 'player-kg.html' : 'player.html';
        var html = '<div class="pt-card' + (extraClass || '') + '" data-player-url="' + playerPage + '?id=' + escHtml(p.id) + '" style="cursor:pointer;">' +
            ntrpHtml +
            '<div class="pt-avatar-wrap">' +
                avatarHtml +
                (online ? '<div class="pt-online-dot"></div>' : '') +
            '</div>' +
            '<div class="pt-name">' + name + '</div>';

        html += '<div class="' + badgeClass + '">' + escHtml(badgeText) + '</div>';

        html += '<div class="pt-status ' + (online ? 'online' : 'offline') + '">' + (online ? L.online : L.offline) + '</div>';

        // Invite button — visible for all access levels
        html += '<button class="pt-invite-btn" data-player-id="' + escHtml(p.id) + '" data-has-tg="' + (p.has_telegram ? '1' : '0') + '">' + L.inviteBtn + '</button>';

        html += '</div>';
        return html;
    }

    // ---- PAGINATION ----
    function renderPagination(total, page) {
        var container = document.getElementById('ptPagination');
        if (!container) return;

        var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        var prevLabel = isEn ? '\u2190 Back' : (isKg ? '\u2190 Артка' : '\u2190 Назад');
        var nextLabel = isEn ? 'Next \u2192' : (isKg ? 'Кийинки \u2192' : 'Далее \u2192');
        var html = '<div class="pt-pagination">';
        html += '<button class="pt-page-btn pt-page-prev"' + (page === 1 ? ' disabled' : '') + '>' + prevLabel + '</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="pt-page-btn pt-page-num' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="pt-page-btn pt-page-next"' + (page === totalPages ? ' disabled' : '') + '>' + nextLabel + '</button>';
        html += '</div>';
        container.innerHTML = html;
    }

    function initPaginationClicks() {
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.pt-page-btn');
            if (!btn || btn.disabled) return;

            if (btn.classList.contains('pt-page-prev')) {
                _currentPage = Math.max(1, _currentPage - 1);
            } else if (btn.classList.contains('pt-page-next')) {
                _currentPage++;
            } else if (btn.dataset.page) {
                _currentPage = parseInt(btn.dataset.page);
            }
            renderGrid();
            var gridEl = document.getElementById('ptGrid');
            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ---- SPONSORS — loaded via sponsors-loader.js ----

    // ---- Card click → player profile ----
    document.addEventListener('click', function(e) {
        // Skip if clicking invite button
        if (e.target.closest('.pt-invite-btn')) return;
        var card = e.target.closest('.pt-card[data-player-url]');
        if (!card) return;
        window.location.href = card.dataset.playerUrl;
    });

    // ---- Invite click delegation ----
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.pt-invite-btn');
        if (!btn) return;
        e.preventDefault();
        var playerId = btn.dataset.playerId;
        var hasTg = btn.dataset.hasTg === '1';
        handleInviteClick(playerId, hasTg);
    });

    // ---- Handle invite click by access level ----
    function handleInviteClick(playerId, hasTelegram) {
        if (_accessLevel === 'guest') {
            showModal(L.modalGuestTitle, L.modalGuestText, L.modalGuestBtn, authPage);
            return;
        }

        if (_accessLevel === 'registered') {
            showPaymentModal();
            return;
        }

        // Member — show confirmation before sending
        showInviteConfirm(playerId, hasTelegram);
    }

    function showInviteConfirm(playerId, hasTelegram) {
        var old = document.querySelector('.pt-modal-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay';
        overlay.innerHTML =
            '<div class="pt-modal">' +
                '<button class="pt-modal-close">&times;</button>' +
                '<div class="pt-modal-icon">&#9888;&#65039;</div>' +
                '<div class="pt-modal-title">' + L.inviteConfirmTitle + '</div>' +
                '<div class="pt-modal-text">' + L.inviteConfirmText + '</div>' +
                '<div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">' +
                    '<button class="pt-modal-btn pt-confirm-send">' + L.inviteConfirmBtn + '</button>' +
                    '<button class="pt-modal-btn pt-confirm-cancel" style="background:rgba(255,255,255,0.08);color:var(--text-secondary);">' + L.inviteConfirmCancel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        overlay.querySelector('.pt-confirm-send').addEventListener('click', function() {
            closeModal(overlay);
            sendInvite(playerId, hasTelegram);
        });
        overlay.querySelector('.pt-confirm-cancel').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.querySelector('.pt-modal-close').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
    }

    // ---- Send invite via Edge Function ----
    async function sendInvite(playerId, hasTelegram) {
        if (_sendingInvite) return;

        if (!hasTelegram) {
            showToast(L.inviteNoTg, 'info');
            return;
        }

        _sendingInvite = true;

        try {
            var session = await client.auth.getSession();
            var token = session.data.session ? session.data.session.access_token : null;
            if (!token) {
                showToast(L.inviteError, 'error');
                return;
            }

            var res = await fetch(FUNCTIONS_URL + '/send-game-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'apikey': ANON_KEY
                },
                body: JSON.stringify({ receiver_player_id: playerId })
            });

            var data = await res.json();

            if (res.ok && data.success) {
                showToast(L.inviteSent, 'success');
            } else {
                var errMsg = L.inviteError;
                if (data.error === 'daily_limit') errMsg = L.inviteLimit;
                else if (data.error === 'already_pending') errMsg = L.invitePending;
                else if (data.error === 'no_telegram') errMsg = L.inviteNoTg;
                else if (data.error === 'self_invite') errMsg = L.inviteSelf;
                showToast(errMsg, data.error === 'daily_limit' || data.error === 'already_pending' ? 'info' : 'error');
            }
        } catch(e) {
            console.error('Invite error:', e);
            showToast(L.inviteError, 'error');
        } finally {
            _sendingInvite = false;
        }
    }

    // ---- Modal ----
    function showModal(title, text, btnLabel, btnHref, disclaimer) {
        // Remove existing
        var old = document.querySelector('.pt-modal-overlay');
        if (old) old.remove();

        var disclaimerHtml = disclaimer ? '<div class="pt-modal-disclaimer">' + disclaimer + '</div>' : '';

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay';
        overlay.innerHTML =
            '<div class="pt-modal">' +
                '<button class="pt-modal-close">&times;</button>' +
                '<div class="pt-modal-icon">&#127934;</div>' +
                '<div class="pt-modal-title">' + title + '</div>' +
                '<div class="pt-modal-text">' + text + '</div>' +
                '<a href="' + btnHref + '" class="pt-modal-btn">' + btnLabel + '</a>' +
                disclaimerHtml +
            '</div>';
        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        // Close handlers
        overlay.querySelector('.pt-modal-close').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
    }

    function closeModal(overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
    }

    // ---- Payment Modal (for registered non-members) ----
    function showPaymentModal() {
        var old = document.querySelector('.pt-modal-overlay');
        if (old) old.remove();

        var rulesPage = isEn ? 'rules-en.html' : (isKg ? 'rules-kg.html' : 'rules.html');
        var pricePage = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');

        var title = isEn ? 'Become a KSLT Member' : (isKg ? 'КСЛТ мүчөсү болуңуз' : 'Станьте членом КСЛТ');
        var subtitle = isEn
            ? 'Monthly membership — <strong style="color:var(--accent)">1,000 KGS/mo</strong>'
            : (isKg ? 'Ай сайынкы мүчөлүк — <strong style="color:var(--accent)">1 000 сом/ай</strong>' : 'Ежемесячное членство — <strong style="color:var(--accent)">1 000 сом/мес</strong>');
        var cardsLabel = isEn ? 'Bank cards' : (isKg ? 'Банк карталары' : 'Банковские карты');
        var mobileLabel = isEn ? 'Mobile banks' : (isKg ? 'Мобилдик банктар' : 'Мобильные банки');
        var walletsLabel = isEn ? 'E-wallets' : (isKg ? 'Электрондук капчыктар' : 'Электронные кошельки');
        var orLabel = isEn ? 'or' : (isKg ? 'же' : 'или');
        var tgBtn = isEn ? 'Message in Telegram' : (isKg ? 'Telegram\'га жазуу' : 'Написать в Telegram');
        var noteText = isEn
            ? 'Online payment coming soon. Contact the admin for now.'
            : (isKg ? 'Онлайн төлөм жакында ишке кирет. Азырынча администраторго кайрылыңыз.' : 'Онлайн-оплата появится в ближайшее время. Пока свяжитесь с администратором.');
        var disclaimer = isEn
            ? 'By paying, you agree to the <a href="' + rulesPage + '" target="_blank">rules</a> and <a href="' + pricePage + '" target="_blank">pricing</a> of KSLT'
            : (isKg ? 'Баскычты басуу менен, <a href="' + rulesPage + '" target="_blank">эрежелер</a> жана <a href="' + pricePage + '" target="_blank">баалар</a> менен тааныштыгыңызды тастыктайсыз' : 'Нажимая кнопку, вы подтверждаете, что ознакомлены с <a href="' + rulesPage + '" target="_blank">правилами</a> и <a href="' + pricePage + '" target="_blank">тарифами</a> КСЛТ');
        var soonLabel = isEn ? 'soon' : (isKg ? 'жакында' : 'скоро');

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay';
        overlay.innerHTML =
            '<div class="pt-modal pt-modal-pay">' +
                '<button class="pt-modal-close">&times;</button>' +
                '<div class="pt-modal-title">' + title + '</div>' +
                '<div class="pt-modal-text" style="margin-bottom:16px;">' + subtitle + '</div>' +

                '<div class="pt-pay-label">' + cardsLabel + '</div>' +
                '<div class="pt-pay-grid">' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128179;</span><span class="pt-pay-name">Visa / MC</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#127974;</span><span class="pt-pay-name">Элкарт</span></div>' +
                '</div>' +

                '<div class="pt-pay-label">' + mobileLabel + '</div>' +
                '<div class="pt-pay-grid">' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">MBank</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">Bakai24</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">Optima24</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">Демир24</span></div>' +
                '</div>' +

                '<div class="pt-pay-label">' + walletsLabel + '</div>' +
                '<div class="pt-pay-grid">' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">O! Деньги</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">Balance.kg</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">Элсом</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">MegaPay</span></div>' +
                '</div>' +

                '<div class="pt-pay-divider">' + orLabel + '</div>' +

                '<a href="https://t.me/kslt_admin" target="_blank" rel="noopener" class="pt-pay-tg-btn">&#9993; ' + tgBtn + '</a>' +

                '<div class="pt-modal-note">' + noteText + '</div>' +
                '<div class="pt-modal-disclaimer">' + disclaimer + '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        overlay.querySelector('.pt-modal-close').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
    }

    // ---- Toast ----
    var _toastTimer = null;
    function showToast(message, type) {
        // Remove existing
        var old = document.querySelector('.pt-toast');
        if (old) old.remove();
        if (_toastTimer) clearTimeout(_toastTimer);

        var toast = document.createElement('div');
        toast.className = 'pt-toast' + (type ? ' ' + type : '');
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('visible');
        });

        _toastTimer = setTimeout(function() {
            toast.classList.remove('visible');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

})();
