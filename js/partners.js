// ========================================
// Partners Page — Find a Partner
// 3 access levels: guest (8 + blur), registered (all), member (full)
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var client = window.supabaseClient;

    var L = isEn ? {
        heroTagline: 'KSLT Partners',
        heroTitle: 'Find a <span>partner</span>',
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
    } : {
        heroTagline: 'KSLT Партнёры',
        heroTitle: 'Найти <span>партнёра</span>',
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

    var authPage = isEn ? 'auth-en.html' : 'auth.html';
    var pricingPage = isEn ? 'pricing-en.html' : 'pricing.html';
    var FUNCTIONS_URL = 'https://qqkzszesviukopgjbead.supabase.co/functions/v1';
    var ANON_KEY = 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G';
    var _partners = [];
    var _currentFilter = 'all';
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
        renderSponsors();
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

        var html = '';
        for (var i = 0; i < filters.length; i++) {
            var f = filters[i];
            html += '<button class="pt-filter-btn' + (f.key === _currentFilter ? ' active' : '') + '" data-filter="' + f.key + '">' + f.label + '</button>';
        }
        html += '<div class="pt-search-wrap"><input type="text" class="pt-search" id="ptSearch" placeholder="' + L.searchPlaceholder + '"></div>';

        // Back link (hidden, shown on scroll)
        var servicesLink = isEn ? 'services-en.html' : 'services.html';
        html = '<a href="' + servicesLink + '" class="pt-back-link">\u2190 ' + (isEn ? 'Services' : 'Услуги') + '</a>' + html;

        el.innerHTML = html;

        document.getElementById('ptSearch').addEventListener('input', function(e) {
            _searchQuery = e.target.value.toLowerCase().trim();
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
            var total = Math.min(filtered.length, GUEST_VISIBLE + GUEST_BLURRED);

            html = '<div class="pt-grid">';
            for (var i = 0; i < total; i++) {
                var blurClass = '';
                if (i >= GUEST_VISIBLE) {
                    var level = i - GUEST_VISIBLE + 1;
                    blurClass = ' pt-card-blur pt-card-blur-' + level;
                }
                html += renderCard(filtered[i], blurClass);
            }
            html += '</div>';

            // Guest CTA overlay
            if (filtered.length > GUEST_VISIBLE) {
                var hiddenCount = filtered.length - GUEST_VISIBLE;
                html += '<div class="pt-guest-overlay">' +
                    '<div class="pt-guest-cta">' +
                        '<div class="pt-guest-icon">' + lockSvg + '</div>' +
                        '<h3 class="pt-guest-title">' + L.guestTitle + '</h3>' +
                        '<p class="pt-guest-text">' + L.guestText + '</p>' +
                        '<a href="' + authPage + '" class="pt-guest-btn">' + L.guestBtn + '</a>' +
                        '<div class="pt-guest-hint">+' + hiddenCount + ' ' + L.guestHidden + '</div>' +
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
        var category = isEn ? (p.category_name_en || p.category_name) : p.category_name;

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

        var html = '<div class="pt-card' + (extraClass || '') + '">' +
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

        var prevLabel = isEn ? '\u2190 Back' : '\u2190 Назад';
        var nextLabel = isEn ? 'Next \u2192' : 'Далее \u2192';
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

    // ---- SPONSORS ----
    function renderSponsors() {
        var container = document.getElementById('ptSponsors');
        if (!container) return;

        var title = isEn ? 'Partners & Sponsors' : 'Партнёры и спонсоры';
        var general = isEn ? 'General sponsor' : 'Генеральный спонсор';
        container.innerHTML =
            '<div class="section-header"><h2>' + title + '</h2></div>' +
            '<div class="sponsor-hero">' +
                '<span class="sponsor-hero-label">' + general + '</span>' +
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

        // Member — send invite
        sendInvite(playerId, hasTelegram);
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

        var rulesPage = isEn ? 'rules-en.html' : 'rules.html';
        var pricePage = isEn ? 'pricing-en.html' : 'pricing.html';

        var title = isEn ? 'Become a KSLT Member' : 'Станьте членом КСЛТ';
        var subtitle = isEn
            ? 'Monthly membership — <strong style="color:var(--accent)">1,000 KGS/mo</strong>'
            : 'Ежемесячное членство — <strong style="color:var(--accent)">1 000 сом/мес</strong>';
        var cardsLabel = isEn ? 'Bank cards' : 'Банковские карты';
        var mobileLabel = isEn ? 'Mobile banks' : 'Мобильные банки';
        var walletsLabel = isEn ? 'E-wallets' : 'Электронные кошельки';
        var orLabel = isEn ? 'or' : 'или';
        var tgBtn = isEn ? 'Message in Telegram' : 'Написать в Telegram';
        var noteText = isEn
            ? 'Online payment coming soon. Contact the admin for now.'
            : 'Онлайн-оплата появится в ближайшее время. Пока свяжитесь с администратором.';
        var disclaimer = isEn
            ? 'By paying, you agree to the <a href="' + rulesPage + '" target="_blank">rules</a> and <a href="' + pricePage + '" target="_blank">pricing</a> of KSLT'
            : 'Нажимая кнопку, вы подтверждаете, что ознакомлены с <a href="' + rulesPage + '" target="_blank">правилами</a> и <a href="' + pricePage + '" target="_blank">тарифами</a> КСЛТ';
        var soonLabel = isEn ? 'soon' : 'скоро';

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
