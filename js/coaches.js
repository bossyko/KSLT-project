(function() {
    'use strict';

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function coachMapLinks(coach) {
        var gm = coach._courtMapGoogle || '';
        var tg = coach._courtMapTwogis || '';
        if (!gm && !tg) return '';
        var html = ' <span class="co-map-links">';
        if (gm) html += '<a href="' + esc(gm) + '" target="_blank" rel="noopener" class="co-map-link">Google Maps &#8599;</a>';
        if (gm && tg) html += ' ';
        if (tg) html += '<a href="' + esc(tg) + '" target="_blank" rel="noopener" class="co-map-link">2GIS &#8599;</a>';
        html += '</span>';
        return html;
    }

    function getMapEmbed(url) {
        if (!url) return null;
        if (url.indexOf('google.com/maps') !== -1 || url.indexOf('goo.gl/maps') !== -1 || url.indexOf('maps.app.goo.gl') !== -1) {
            if (url.indexOf('/embed') !== -1) return url;
            var qMatch = url.match(/[?&]q=([^&]+)/);
            if (qMatch) return 'https://maps.google.com/maps?q=' + qMatch[1] + '&output=embed';
            var coordMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
            if (coordMatch) return 'https://maps.google.com/maps?q=' + coordMatch[1] + ',' + coordMatch[2] + '&output=embed';
            var placeMatch = url.match(/\/place\/([^/]+)/);
            if (placeMatch) return 'https://maps.google.com/maps?q=' + placeMatch[1] + '&output=embed';
            return 'https://maps.google.com/maps?q=' + encodeURIComponent(url) + '&output=embed';
        }
        if (url.indexOf('2gis.') !== -1) {
            var gisMatch = url.match(/\/([\d.]+)%2C([\d.]+)\//);
            if (!gisMatch) gisMatch = url.match(/\/([\d.]+),([\d.]+)\//);
            if (gisMatch) return 'https://maps.google.com/maps?q=' + gisMatch[2] + ',' + gisMatch[1] + '&output=embed';
        }
        return null;
    }

    function coachMapSection(coach) {
        var gm = coach._courtMapGoogle || '';
        var tg = coach._courtMapTwogis || '';
        if (!gm && !tg) return '';

        var html = '<div class="co-section co-fade-in">' +
            '<h2 class="co-section-title">' + (isEn ? 'Location' : (isKg ? 'Жайгашкан жери' : 'Расположение')) + '</h2>' +
            '<div class="co-map-links-section">';
        if (tg) html += '<a href="' + esc(tg) + '" target="_blank" rel="noopener" class="co-map-link-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 2GIS</a>';
        if (gm) html += '<a href="' + esc(gm) + '" target="_blank" rel="noopener" class="co-map-link-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Google Maps</a>';
        html += '</div></div>';
        return html;
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var L = window.coachesLabels || (isKg ? {
        heroTitle: 'KSLT Машыктыруучулары',
        heroSubtitle: 'Бардык деңгээлдеги оюнчулар үчүн кесипкөй машыктыруучулар',
        filterAll: 'Баары',
        filterAdults: 'Чоңдор',
        filterKids: 'Балдар',
        filterGroup: 'Топтук',
        filterIndividual: 'Жеке',
        filterBeginner: 'Башталгыч',
        filterAdvanced: 'Алдыңкы',
        experience: 'жыл тажрыйба',
        students: 'окуучу',
        rating: 'рейтинг',
        priceFrom: 'дан',
        priceCurrency: 'сом/саат',
        detailsBtn: 'Толугураак',
        bookBtn: 'KSLT арзандатуу',
        bioTitle: 'Машыктыруучу жөнүндө',
        achievementsTitle: 'Жетишкендиктер',
        scheduleTitle: 'Тартип',
        reviewsTitle: 'Окуучулардын пикирлери',
        ctaTitle: 'KSLT мүчөлөрүнө арзандатуу',
        ctaText: 'Катталыңыз жана KSLT мүчөсү болуп, өнөктөш машыктыруучуларда арзандатуу алыңыз',
        ctaBtn: 'Жазылуу',
        backBtn: 'Бардык машыктыруучулар',
        court: 'Корт',
        loginToContact: 'Байланыш үчүн кириңиз',
        noContacts: 'Байланыш маалыматы көрсөтүлгөн эмес',
        contactCoach: 'Машыктыруучу менен байланышуу',
        searchPlaceholder: 'Машыктыруучу издөө...',
        recommendedBadge: 'KSLT сунуштайт',
        discountTitle: 'KSLT мүчөлөрүнө арзандатуу',
        getVoucher: 'Арзандатуу алуу',
        discountGuest: 'Арзандатуу алуу үчүн катталыңыз жана KSLT мүчөсү болуңуз',
        discountRegistered: 'Арзандатуу алуу үчүн KSLT мүчөсү болуңуз',
        voucherReady: 'Арзандатууңуз даяр!',
        voucherLimit: 'Активдүү арзандатууңуз бар',
        voucherExpires: 'Мөөнөтү',
        voucherDownload: 'QR жүктөө',
        voucherDiscount: 'Арзандатуу',
        voucherService: 'Кызмат',
        myVouchers: 'Менин арзандатууларым',
        voucherActive: 'Активдүү',
        voucherUsed: 'Колдонулду',
        voucherExpired: 'Мөөнөтү бүттү',
        voucherShowQR: 'QR',
        noVouchersYet: 'Арзандатуулар жок',
        pickService: 'Кызматты тандаңыз',
        pickSubmit: 'Арзандатуу алуу',
        noDiscountsConfigured: 'Арзандатуу жок'
    } : {
        heroTitle: "Тренеры KSLT",
        heroSubtitle: "Профессиональные тренеры для игроков всех уровней",
        filterAll: "Все",
        filterAdults: "Взрослые",
        filterKids: "Дети",
        filterGroup: "Групповые",
        filterIndividual: "Индивидуальные",
        filterBeginner: "Начинающие",
        filterAdvanced: "Продвинутые",
        experience: "лет опыта",
        students: "учеников",
        rating: "рейтинг",
        priceFrom: "от",
        priceCurrency: "сом/час",
        detailsBtn: "Подробнее",
        bookBtn: "Скидка KSLT",
        bioTitle: "О тренере",
        achievementsTitle: "Достижения",
        scheduleTitle: "Расписание",
        reviewsTitle: "Отзывы учеников",
        ctaTitle: "Скидки для членов KSLT",
        ctaText: "Зарегистрируйтесь и станьте членом KSLT для скидок у партнёрских тренеров",
        ctaBtn: "Записаться",
        backBtn: "Все тренеры",
        court: "Корт",
        loginToContact: "Войти чтобы связаться",
        noContacts: "Контакты не указаны",
        contactCoach: "Связаться с тренером",
        searchPlaceholder: "Поиск тренера...",
        recommendedBadge: "Рекомендован KSLT",
        discountTitle: "Скидки для членов KSLT",
        getVoucher: "Получить скидку",
        discountGuest: "Зарегистрируйтесь и оформите членство для скидок",
        discountRegistered: "Оформите членство KSLT для скидок",
        voucherReady: "Ваша скидка готова!",
        voucherLimit: "У вас есть активная скидка",
        voucherExpires: "Действительна до",
        voucherDownload: "Скачать QR",
        voucherDiscount: "Скидка",
        voucherService: "Услуга",
        myVouchers: "Мои скидки",
        voucherActive: "Активна",
        voucherUsed: "Использована",
        voucherExpired: "Истекла",
        voucherShowQR: "QR",
        noVouchersYet: "Скидок пока нет",
        pickService: "Выберите услугу",
        pickSubmit: "Получить скидку",
        noDiscountsConfigured: "Скидки пока не настроены"
    });

    var staticData = window.coachesData || [];
    var coachPage = window.location.pathname.indexOf('coach.html') !== -1 || window.location.pathname.indexOf('coach-en.html') !== -1 || window.location.pathname.indexOf('coach-kg.html') !== -1;
    var isListPage = window.location.pathname.indexOf('coaches.html') !== -1 || window.location.pathname.indexOf('coaches-en.html') !== -1 || window.location.pathname.indexOf('coaches-kg.html') !== -1;
    var isDetailPage = coachPage && !isListPage;

    // Check auth (lightweight, no SDK needed)
    var isLoggedIn = false;
    try {
        var key = 'sb-qqkzszesviukopgjbead-auth-token';
        var raw = localStorage.getItem(key);
        if (raw) {
            var s = JSON.parse(raw);
            if (s && s.access_token && s.expires_at > Math.floor(Date.now() / 1000)) isLoggedIn = true;
        }
    } catch(e) {}

    var _accessLevel = 'guest';
    var _toastTimer = null;
    var PER_PAGE = 20;
    var _currentPage = 1;
    var _currentFilter = 'all';
    var _searchQuery = '';

    async function detectAccess() {
        var client = window.supabaseClient;
        if (!client) return;
        try {
            var res = await client.auth.getSession();
            if (!res.data || !res.data.session) return;
            if (!window.ksltUser) window.ksltUser = res.data.session.user;
        } catch(e) { return; }
        _accessLevel = 'registered';
        if (typeof window.checkMembership === 'function') {
            try {
                var mem = await window.checkMembership();
                if (mem && mem.active) _accessLevel = 'member';
            } catch(e) {}
        }
    }

    function showToast(message, type) {
        var old = document.querySelector('.co-toast');
        if (old) old.remove();
        if (_toastTimer) clearTimeout(_toastTimer);
        var toast = document.createElement('div');
        toast.className = 'co-toast' + (type ? ' ' + type : '');
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

    // All data (Supabase + static)
    var allData = [];

    // Map Supabase row to card-compatible format
    function mapDbCoach(row) {
        var name = isEn
            ? ((row.last_name_en || row.last_name || '') + ' ' + (row.first_name_en || row.first_name || '')).trim() || row.name_en || row.name
            : isKg
            ? ((row.last_name_kg || row.last_name || '') + ' ' + (row.first_name_kg || row.first_name || '')).trim() || row.name_kg || row.name
            : ((row.last_name || '') + ' ' + (row.first_name || '')).trim() || row.name;
        var spec = isEn ? (row.position_en || row.position || '') : isKg ? (row.position_kg || row.position || '') : (row.position || '');
        var shortDesc = isEn ? (row.short_desc_en || row.short_desc || '') : isKg ? (row.short_desc_kg || row.short_desc || '') : (row.short_desc || '');
        var bio = isEn ? (row.bio_en || row.bio || '') : isKg ? (row.bio_kg || row.bio || '') : (row.bio || '');
        var court = isEn ? (row.court_en || row.court || '') : isKg ? (row.court_kg || row.court || '') : (row.court || '');
        var achievements = isEn ? (row.achievements_en || row.achievements || []) : isKg ? (row.achievements_kg || row.achievements || []) : (row.achievements || []);
        return {
            id: row.id,
            _isDb: true,
            name: name,
            photo: row.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80',
            specialization: spec,
            tags: row.tags || [],
            experience: row.experience || 0,
            price: row.price || 0,
            shortDesc: shortDesc,
            bio: bio,
            court: court,
            achievements: achievements,
            telegram: row.telegram || '',
            whatsapp: row.whatsapp || '',
            schedule: {},
            reviews: [],
            students: 0,
            rating: 0,
            _promoted: row.promoted || false,
            partner: row.partner || false
        };
    }

    // Promoted first (fixed), rest shuffled
    function sortPromotedFirst(arr) {
        var promoted = [];
        var rest = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i]._promoted) {
                promoted.push(arr[i]);
            } else {
                rest.push(arr[i]);
            }
        }
        // Fisher-Yates shuffle rest
        for (var i = rest.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = rest[i];
            rest[i] = rest[j];
            rest[j] = tmp;
        }
        return promoted.concat(rest);
    }

    // Load from Supabase then init
    function loadAndInit() {
        var client = window.supabaseClient;
        if (client) {
            client.from('coaches').select('*').order('created_at', { ascending: false })
                .then(function(res) {
                    if (res.data && res.data.length) {
                        var dbCoaches = res.data.map(function(row) { return mapDbCoach(row); });
                        var sorted = sortPromotedFirst(dbCoaches);
                        sorted.forEach(function(c) { allData.push(c); });
                    }
                    // Append static data
                    staticData.forEach(function(c) { allData.push(c); });
                    init();
                });
        } else {
            allData = staticData.slice();
            init();
        }
    }

    function init() {
        if (isDetailPage) {
            initDetailPage();
        } else {
            initListPage();
        }
    }

    loadAndInit();

    // ---- LIST PAGE ----
    function initListPage() {
        renderHero();
        renderFilters();
        renderGrid('all');
        initSearchInput();
        initFilterClicks();
        initPaginationClicks();
        initCtaClicks();
        initScrollAnimations();
        if (window.loadSponsors) loadSponsors('coachesSponsors');
        detectAccess();
    }

    function renderHero() {
        var hero = document.getElementById('coachesHero');
        if (!hero) return;
        hero.innerHTML =
            '<div class="co-hero-bg" style="background-image: url(\'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1400&q=80\')"></div>' +
            '<div class="co-hero-content">' +
                '<h1 class="co-hero-title">' + L.heroTitle.replace('KSLT', '<span>KSLT</span>') + '</h1>' +
                '<p class="co-hero-subtitle">' + L.heroSubtitle + '</p>' +
            '</div>';
    }

    function renderFilters() {
        var container = document.getElementById('coachesFilters');
        if (!container) return;
        var filters = [
            { key: 'all', label: L.filterAll },
            { key: 'adults', label: L.filterAdults },
            { key: 'kids', label: L.filterKids },
            { key: 'group', label: L.filterGroup },
            { key: 'individual', label: L.filterIndividual },
            { key: 'beginner', label: L.filterBeginner },
            { key: 'advanced', label: L.filterAdvanced }
        ];
        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');

        // Возврат живёт ВНУТРИ прилипающего блока с поиском и фильтрами.
        // Стоя над ним, он уезжал при первой же прокрутке: прилипает блок,
        // а ссылка оставалась снаружи
        var html =
            '<a href="' + servicesLink + '" class="kslt-back kslt-back-inline">\u2190 ' +
                (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги')) + '</a>' +
            '<div class="co-search-wrap">' +
                '<svg class="co-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '<input type="text" class="co-search-input" id="coachesSearch" placeholder="' + L.searchPlaceholder + '" autocomplete="off">' +
            '</div>' +
            '<div class="co-filters">';
        filters.forEach(function(f) {
            html += '<button class="co-filter-btn' + (f.key === 'all' ? ' active' : '') + '" data-filter="' + f.key + '">' + f.label + '</button>';
        });
        html += '</div>';
        container.innerHTML = html;

        // Detect stuck state
        var sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        container.parentNode.insertBefore(sentinel, container);
        var obs = new IntersectionObserver(function(entries) {
            container.classList.toggle('stuck', !entries[0].isIntersecting);
        }, { threshold: [1], rootMargin: '-65px 0px 0px 0px' });
        obs.observe(sentinel);
    }

    function renderGrid(filter) {
        if (filter !== undefined) _currentFilter = filter;
        var container = document.getElementById('coachesGrid');
        if (!container) return;
        var filtered = allData;
        if (_searchQuery) {
            var q = _searchQuery.toLowerCase();
            filtered = filtered.filter(function(c) {
                return (c.name && c.name.toLowerCase().indexOf(q) !== -1) ||
                       (c.specialization && c.specialization.toLowerCase().indexOf(q) !== -1);
            });
        }
        if (_currentFilter !== 'all') {
            filtered = filtered.filter(function(c) {
                return (c.tags || []).indexOf(_currentFilter) !== -1;
            });
        }

        var start = (_currentPage - 1) * PER_PAGE;
        var pageItems = filtered.slice(start, start + PER_PAGE);

        var detailBase = isEn ? 'coach-en.html' : (isKg ? 'coach-kg.html' : 'coach.html');
        var authLink = isEn ? 'auth-en.html?redirect=coaches' : (isKg ? 'auth-kg.html?redirect=coaches' : 'auth.html?redirect=coaches');
        var html = '<div class="co-grid">';
        pageItems.forEach(function(c) {
            var contactHtml = '<div class="co-card-actions">' +
                '<span class="co-card-btn">' + L.detailsBtn + ' →</span>' +
                '<span class="co-card-cta" data-id="' + c.id + '">' + L.bookBtn + '</span>' +
            '</div>';

            // Stats
            var statsHtml = '';
            if (c.experience) {
                statsHtml += '<div class="co-card-stat"><div class="co-card-stat-num">' + c.experience + '</div><div class="co-card-stat-label">' + L.experience + '</div></div>';
            }
            if (c.students) {
                statsHtml += '<div class="co-card-stat"><div class="co-card-stat-num">' + c.students + '+</div><div class="co-card-stat-label">' + L.students + '</div></div>';
            }
            if (c.rating) {
                statsHtml += '<div class="co-card-stat"><div class="co-card-stat-num">' + c.rating + '</div><div class="co-card-stat-label">' + L.rating + '</div></div>';
            }

            var promoBadge = c._promoted ? '<span class="kslt-recommended-badge">' + L.recommendedBadge + '</span>' : '';

            html += '<a href="' + detailBase + '?id=' + c.id + '" class="co-card co-fade-in' + (c._promoted ? ' kslt-promoted-card' : '') + '">' +
                '<div class="co-card-img-wrap">' +
                    '<img src="' + esc(c.photo) + '" alt="' + esc(c.name) + '" class="co-card-photo">' +
                    promoBadge +
                '</div>' +
                '<div class="co-card-name">' + esc(c.name) + '</div>' +
                (c.specialization ? '<div class="co-card-spec">' + c.specialization + '</div>' : '') +
                (c.shortDesc ? '<div class="co-card-desc">' + c.shortDesc + '</div>' : '') +
                (statsHtml ? '<div class="co-card-stats">' + statsHtml + '</div>' : '') +
                (c.price ? '<div class="co-card-price">' + L.priceFrom + ' <strong>' + c.price + '</strong> ' + L.priceCurrency + '</div>' : '') +
                contactHtml +
            '</a>';
        });
        html += '</div>';
        container.innerHTML = html;
        renderPagination(filtered.length, _currentPage);
        initScrollAnimations();
    }

    // ---- PAGINATION ----
    function renderPagination(total, page) {
        var container = document.getElementById('coachesPagination');
        if (!container) return;

        var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        var prevLabel = isEn ? '\u2190 Back' : (isKg ? '\u2190 Артка' : '\u2190 Назад');
        var nextLabel = isEn ? 'Next \u2192' : (isKg ? 'Кийинки \u2192' : 'Далее \u2192');
        var html = '<div class="co-pagination">';
        html += '<button class="co-page-btn co-page-prev"' + (page === 1 ? ' disabled' : '') + '>' + prevLabel + '</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="co-page-btn co-page-num' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="co-page-btn co-page-next"' + (page === totalPages ? ' disabled' : '') + '>' + nextLabel + '</button>';
        html += '</div>';
        container.innerHTML = html;
    }

    function initPaginationClicks() {
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.co-page-btn');
            if (!btn || btn.disabled) return;

            if (btn.classList.contains('co-page-prev')) {
                _currentPage = Math.max(1, _currentPage - 1);
            } else if (btn.classList.contains('co-page-next')) {
                _currentPage++;
            } else if (btn.dataset.page) {
                _currentPage = parseInt(btn.dataset.page);
            }
            renderGrid();
            var gridEl = document.getElementById('coachesGrid');
            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ---- SPONSORS — loaded via sponsors-loader.js ----

    function showMembershipModal(level) {
        var authLink = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
        var pricingLink = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');
        var isGuest = level === 'guest';

        var title = isGuest
            ? (isEn ? 'Become a KSLT Member' : isKg ? 'KSLT мүчөсү болуңуз' : 'Станьте членом KSLT')
            : (isEn ? 'Membership Required' : isKg ? 'Мүчөлүк керек' : 'Нужно членство');
        var text = isGuest
            ? (isEn ? 'Register and become a KSLT member to get discounts at partner coaches' : isKg ? 'Катталыңыз жана KSLT мүчөсү болуп, машыктыруучулардан арзандатуу алыңыз' : 'Зарегистрируйтесь и оформите членство KSLT, чтобы получить скидки у партнёрских тренеров')
            : (isEn ? 'Become a KSLT member to unlock discounts at partner coaches' : isKg ? 'KSLT мүчөсү болуп, машыктыруучулардан арзандатуу алыңыз' : 'Оформите членство KSLT, чтобы получить скидки у партнёрских тренеров');
        var btnText = isGuest
            ? (isEn ? 'Sign Up' : isKg ? 'Каттоо' : 'Регистрация')
            : (isEn ? 'View Plans' : isKg ? 'Тарифтар' : 'Тарифы');
        var btnLink = isGuest ? authLink : pricingLink;

        var svgIcon = isGuest
            ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
            : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

        var overlay = document.createElement('div');
        overlay.className = 'co-membership-overlay';
        overlay.innerHTML =
            '<div class="co-membership-modal">' +
                '<button class="co-membership-close">&times;</button>' +
                '<div class="co-membership-icon">' + svgIcon + '</div>' +
                '<h3>' + title + '</h3>' +
                '<p>' + text + '</p>' +
                '<a href="' + btnLink + '" class="co-membership-btn">' + btnText + '</a>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        overlay.querySelector('.co-membership-close').onclick = function() {
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 300);
        };
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('visible');
                setTimeout(function() { overlay.remove(); }, 300);
            }
        });
    }

    function initCtaClicks() {
        var grid = document.getElementById('coachesGrid');
        if (!grid) return;
        grid.addEventListener('click', function(e) {
            var cta = e.target.closest('.co-card-cta');
            if (!cta) return;
            e.preventDefault();
            e.stopPropagation();

            if (_accessLevel === 'guest' || _accessLevel === 'registered') {
                showMembershipModal(_accessLevel);
                return;
            }
            // Member: inline voucher generation
            var id = cta.getAttribute('data-id');
            coCtaLoadServices(cta, 'coach', id);
        });
    }

    async function coCtaLoadServices(btnEl, entityType, entityId) {
        var client = window.supabaseClient;
        if (!client) return;
        var origText = btnEl.textContent;
        btnEl.textContent = '...';
        btnEl.style.pointerEvents = 'none';
        try {
            var res = await client.from('partner_services')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .eq('is_active', true);
            var services = res.data || [];
            if (!services.length) {
                showToast(L.noDiscountsConfigured, 'info');
                return;
            }
            if (services.length === 1) {
                coGenerateVoucher(entityType, entityId, services[0].id);
            } else {
                coShowServicePicker(entityType, entityId, services);
            }
        } catch(e) {
            showToast(e.message || 'Error', 'error');
        } finally {
            btnEl.textContent = origText;
            btnEl.style.pointerEvents = '';
        }
    }

    function coShowServicePicker(entityType, entityId, services) {
        var existing = document.getElementById('coPickerModal');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'coPickerModal';
        overlay.className = 'co-picker-overlay';

        var optionsHtml = '';
        services.forEach(function(svc, i) {
            var svcName = isEn ? (svc.service_name_en || svc.service_name) : (isKg ? (svc.service_name_kg || svc.service_name) : svc.service_name);
            optionsHtml += '<div class="co-picker-option' + (i === 0 ? ' selected' : '') + '" data-service-id="' + svc.id + '">' +
                '<div class="co-picker-radio"></div>' +
                '<span class="co-picker-label">' + esc(svcName) + '</span>' +
                '<span class="co-picker-percent">-' + svc.discount_percent + '%</span>' +
            '</div>';
        });

        overlay.innerHTML =
            '<div class="co-picker-modal">' +
                '<button class="co-picker-close">&times;</button>' +
                '<div class="co-picker-title">' + L.pickService + '</div>' +
                '<div class="co-picker-options">' + optionsHtml + '</div>' +
                '<button class="co-picker-submit">' + L.pickSubmit + '</button>' +
            '</div>';

        document.body.appendChild(overlay);

        var selectedId = services[0].id;

        overlay.querySelectorAll('.co-picker-option').forEach(function(opt) {
            opt.addEventListener('click', function() {
                overlay.querySelectorAll('.co-picker-option').forEach(function(o) { o.classList.remove('selected'); });
                this.classList.add('selected');
                selectedId = this.dataset.serviceId;
            });
        });

        overlay.querySelector('.co-picker-close').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        overlay.querySelector('.co-picker-submit').addEventListener('click', function() {
            overlay.remove();
            coGenerateVoucher(entityType, entityId, selectedId);
        });
    }

    function initSearchInput() {
        var searchInput = document.getElementById('coachesSearch');
        if (!searchInput) return;
        searchInput.addEventListener('input', function() {
            _searchQuery = searchInput.value.trim();
            _currentPage = 1;
            renderGrid();
        });
    }

    function initFilterClicks() {
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('co-filter-btn')) return;
            document.querySelectorAll('.co-filter-btn').forEach(function(b) { b.classList.remove('active'); });
            e.target.classList.add('active');
            _currentPage = 1;
            renderGrid(e.target.getAttribute('data-filter'));
        });
    }

    // View counter for detail page (localStorage dedup)
    function incrementCoachView(id) {
        if (!id) return;
        var key = 'kslt_cchview_' + id;
        if (localStorage.getItem(key)) return;
        var cl = window.supabaseClient;
        if (!cl) return;
        cl.rpc('increment_coach_view', { p_id: id }).then(function(res) {
            if (!res.error) localStorage.setItem(key, '1');
        });
    }

    // ---- DETAIL PAGE ----
    function initDetailPage() {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        var coach = null;
        for (var i = 0; i < allData.length; i++) {
            if (allData[i].id === id) { coach = allData[i]; break; }
        }
        if (!coach) {
            var container = document.getElementById('coachDetail');
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Coach not found</h2><a href="' + (isEn ? 'coaches-en.html' : (isKg ? 'coaches-kg.html' : 'coaches.html')) + '" class="kslt-back">\u2190 ' + L.backBtn + '</a></div>';
            return;
        }

        document.title = 'KSLT — ' + coach.name;
        renderDetailHero(coach);

        // Load court map links if coach has court field
        if (coach.court && coach._isDb) {
            var cl = window.supabaseClient;
            if (cl) {
                cl.from('courts').select('name, name_en, google_maps_url, twogis_url')
                    .then(function(res) {
                        if (res.data) {
                            var courtText = coach.court.toLowerCase().trim();
                            for (var ci = 0; ci < res.data.length; ci++) {
                                var ct = res.data[ci];
                                var ctName = (ct.name || '').toLowerCase().trim();
                                var ctNameEn = (ct.name_en || '').toLowerCase().trim();
                                if (ctName === courtText || ctNameEn === courtText) {
                                    coach._courtMapGoogle = ct.google_maps_url || '';
                                    coach._courtMapTwogis = ct.twogis_url || '';
                                    break;
                                }
                            }
                        }
                        renderDetail(coach);
                        initScrollAnimations();
                    }).catch(function() {
                        renderDetail(coach);
                        initScrollAnimations();
                    });
            } else {
                renderDetail(coach);
                initScrollAnimations();
            }
        } else {
            renderDetail(coach);
            initScrollAnimations();
        }
        incrementCoachView(id);
    }

    function renderDetailHero(coach) {
        var hero = document.getElementById('coachDetailHero');
        if (!hero) return;
        hero.innerHTML =
            '<div class="co-hero-bg" style="background-image: url(\'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1400&q=80\')"></div>' +
            '<div class="co-hero-content">' +
                '<h1 class="co-hero-title">' + coach.name + '</h1>' +
                '<p class="co-hero-subtitle">' + coach.specialization + '</p>' +
            '</div>';
    }

    function renderDetail(coach) {
        var container = document.getElementById('coachDetail');
        if (!container) return;

        var coachesLink = isEn ? 'coaches-en.html' : (isKg ? 'coaches-kg.html' : 'coaches.html');
        var authLink = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');

        // Breadcrumb — render before container so it's outside .co-container
        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');
        var breadcrumb = document.createElement('div');
        // Тот же плавающий возврат, что на странице игрока: один вид на
        // всех карточках, и он не уезжает вместе с баннером
        breadcrumb.className = 'kslt-back-wrap kslt-back-float';
        breadcrumb.innerHTML =
            '<a href="' + servicesLink + '" class="kslt-back">\u2190 ' + (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги')) + '</a>' +
            '<span class="kslt-back-sep">/</span>' +
            '<a href="' + coachesLink + '" class="kslt-back">' + L.backBtn + '</a>';
        container.parentNode.insertBefore(breadcrumb, container);

        var html = '';

        // Header
        html += '<div class="co-detail-header co-fade-in">' +
            '<img src="' + esc(coach.photo) + '" alt="' + esc(coach.name) + '" class="co-detail-photo">' +
            '<div class="co-detail-info">' +
                '<div class="co-detail-title-row"><h1>' + coach.name + '</h1>' +
                (coach._promoted ? '<span class="kslt-recommended-detail">' + L.recommendedBadge + '</span>' : '') +
                '</div>' +
                (coach.specialization ? '<div class="co-detail-spec">' + coach.specialization + '</div>' : '') +
                (coach.court ? '<div class="co-detail-court"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + coach.court + coachMapLinks(coach) + '</div>' : '') +
            '</div>' +
        '</div>';

        // Stats
        var statsHtml = '';
        if (coach.experience) statsHtml += '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.experience + '</div><div class="co-detail-stat-label">' + L.experience + '</div></div>';
        if (coach.students) statsHtml += '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.students + '+</div><div class="co-detail-stat-label">' + L.students + '</div></div>';
        if (coach.rating) statsHtml += '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.rating + '</div><div class="co-detail-stat-label">' + L.rating + '</div></div>';
        if (coach.price) statsHtml += '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.price + '</div><div class="co-detail-stat-label">' + L.priceCurrency + '</div></div>';
        if (statsHtml) {
            html += '<div class="co-detail-stats co-fade-in">' + statsHtml + '</div>';
        }

        // Contact (for DB coaches)
        if (coach._isDb) {
            html += '<div class="co-section co-fade-in">' +
                '<h2 class="co-section-title">' + L.contactCoach + '</h2>';
            if (isLoggedIn) {
                var btns = '';
                if (coach.telegram) {
                    var tgUser = coach.telegram.replace('@', '');
                    btns += '<a href="https://t.me/' + tgUser + '" target="_blank" class="co-cta-btn" style="margin-right:12px;">Telegram</a>';
                }
                if (coach.whatsapp) {
                    var waNum = coach.whatsapp.replace(/\D/g, '');
                    btns += '<a href="https://wa.me/' + waNum + '" target="_blank" class="co-cta-btn">WhatsApp</a>';
                }
                html += btns || '<p style="color:rgba(255,255,255,0.4);">' + L.noContacts + '</p>';
            } else {
                html += '<a href="' + authLink + '" class="co-cta-btn">' + L.loginToContact + '</a>';
            }
            html += '</div>';
        }

        // Bio
        if (coach.bio) {
            html += '<div class="co-section co-fade-in">' +
                '<h2 class="co-section-title">' + L.bioTitle + '</h2>' +
                '<p class="co-bio-text">' + coach.bio + '</p>' +
            '</div>';
        }

        // Map (from court)
        html += coachMapSection(coach);

        // Achievements
        if (coach.achievements && coach.achievements.length) {
            html += '<div class="co-section co-fade-in">' +
                '<h2 class="co-section-title">' + L.achievementsTitle + '</h2>' +
                '<div class="co-achievements">';
            coach.achievements.forEach(function(a) {
                html += '<div class="co-achievement">' + a + '</div>';
            });
            html += '</div></div>';
        }

        // Schedule (static coaches only)
        if (coach.schedule && Object.keys(coach.schedule).length) {
            html += '<div class="co-section co-fade-in">' +
                '<h2 class="co-section-title">' + L.scheduleTitle + '</h2>' +
                '<div class="co-schedule">';
            Object.keys(coach.schedule).forEach(function(day) {
                var time = coach.schedule[day];
                var isDayOff = time === 'Выходной' || time === 'Day off';
                html += '<div class="co-schedule-row' + (isDayOff ? ' day-off' : '') + '">' +
                    '<span class="co-schedule-day">' + day + '</span>' +
                    '<span class="co-schedule-time">' + time + '</span>' +
                '</div>';
            });
            html += '</div></div>';
        }

        // Reviews (static coaches only)
        if (coach.reviews && coach.reviews.length) {
            html += '<div class="co-section co-fade-in">' +
                '<h2 class="co-section-title">' + L.reviewsTitle + '</h2>' +
                '<div class="co-reviews-grid">';
            coach.reviews.forEach(function(r) {
                var stars = '';
                for (var ss = 0; ss < r.rating; ss++) stars += '★';
                html += '<div class="co-review-card">' +
                    '<div class="co-review-stars">' + stars + '</div>' +
                    '<div class="co-review-text">"' + r.text + '"</div>' +
                    '<div class="co-review-author">— ' + r.author + '</div>' +
                '</div>';
            });
            html += '</div></div>';
        }

        // Discount section (partner coaches)
        if (coach._isDb && coach.partner) {
            html += '<div class="co-section co-fade-in co-discount-section">' +
                '<h2 class="co-section-title">' + L.discountTitle + '</h2>' +
                '<div class="co-discount-list" id="coDiscountList">' +
                    '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (isEn ? 'Loading...' : (isKg ? 'Жүктөлүүдө...' : 'Загрузка...')) + '</p>' +
                '</div>' +
            '</div>';
        }

        // CTA
        if (!coach._isDb) {
            html += '<div class="co-cta co-fade-in">' +
                '<h3>' + L.ctaTitle.replace('KSLT', '<span>KSLT</span>') + '</h3>' +
                '<p>' + L.ctaText + '</p>' +
                '<a href="' + authLink + '" class="co-cta-btn">' + L.ctaBtn + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
            '</div>';
        }

        container.innerHTML = html;

        // Load discount services
        if (coach._isDb && coach.partner) {
            loadCoachDiscounts(coach);
        }
    }

    /* ===== DISCOUNT / VOUCHER ===== */

    async function loadCoachDiscounts(coach) {
        var container = document.getElementById('coDiscountList');
        if (!container) return;
        var client = window.supabaseClient;
        if (!client) return;

        // Detect access level independently (async)
        var accessLevel = 'guest';
        try {
            var sess = await client.auth.getSession();
            if (sess.data && sess.data.session) {
                accessLevel = 'registered';
                // Ensure ksltUser is set for checkMembership
                if (!window.ksltUser) window.ksltUser = sess.data.session.user;
                if (typeof window.checkMembership === 'function') {
                    var mem = await window.checkMembership();
                    if (mem && mem.active) accessLevel = 'member';
                }
            }
        } catch(e) {}

        try {
            var result = await client.from('partner_services')
                .select('*')
                .eq('entity_type', 'coach')
                .eq('entity_id', coach.id)
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            var services = result.data || [];
            if (!services.length) {
                container.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (isEn ? 'No discounts available' : (isKg ? 'Арзандатуу жок' : 'Скидок пока нет')) + '</p>';
                return;
            }

            var html = '';
            services.forEach(function(svc) {
                var svcName = isEn ? (svc.service_name_en || svc.service_name) : (isKg ? (svc.service_name_kg || svc.service_name) : svc.service_name);
                html += '<div class="co-discount-item">' +
                    '<div class="co-discount-info">' +
                        '<span class="co-discount-name">' + esc(svcName) + '</span>' +
                        '<span class="co-discount-percent">-' + svc.discount_percent + '%</span>' +
                    '</div>';
                if (accessLevel === 'member') {
                    html += '<button class="co-discount-btn" data-service-id="' + svc.id + '" data-coach-id="' + coach.id + '">' + L.getVoucher + '</button>';
                } else if (accessLevel === 'registered') {
                    html += '<p class="co-discount-hint">' + L.discountRegistered + '</p>';
                } else {
                    html += '<p class="co-discount-hint">' + L.discountGuest + '</p>';
                }
                html += '</div>';
            });
            container.innerHTML = html;

            container.querySelectorAll('.co-discount-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var serviceId = this.dataset.serviceId;
                    var coachId = this.dataset.coachId;
                    coGenerateVoucher('coach', coachId, serviceId, function() {
                        coLoadVoucherHistory('coach', coach.id, services, accessLevel, container);
                    });
                });
            });

            // Load voucher history for members
            coLoadVoucherHistory('coach', coach.id, services, accessLevel, container);
        } catch (e) {
            console.error('Discount load error:', e);
        }
    }

    async function coLoadVoucherHistory(entityType, entityId, services, accessLevel, parentContainer) {
        if (accessLevel !== 'member') return;
        var client = window.supabaseClient;
        if (!client) return;

        try {
            var sess = await client.auth.getSession();
            if (!sess.data || !sess.data.session) return;
            var userId = sess.data.session.user.id;

            var res = await client.from('discount_vouchers')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .eq('profile_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            var vouchers = res.data || [];

            // Build service name map
            var svcMap = {};
            services.forEach(function(s) {
                var nm = isEn ? (s.service_name_en || s.service_name) : (isKg ? (s.service_name_kg || s.service_name) : s.service_name);
                svcMap[s.id] = nm;
            });

            // Remove old history block
            var oldHist = parentContainer.querySelector('.co-voucher-history');
            if (oldHist) oldHist.remove();

            var histDiv = document.createElement('div');
            histDiv.className = 'co-voucher-history';
            histDiv.innerHTML = '<h4>' + L.myVouchers + '</h4>';

            if (!vouchers.length) {
                histDiv.innerHTML += '<p class="co-vh-empty">' + L.noVouchersYet + '</p>';
            } else {
                var listHtml = '<div class="co-vh-list">';
                var now = new Date();
                vouchers.forEach(function(v) {
                    var d = new Date(v.created_at);
                    var dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
                    var svcName = svcMap[v.service_id] || v.service_id;
                    var status = v.status;
                    if (status === 'active' && v.expires_at && new Date(v.expires_at) < now) {
                        status = 'expired';
                    }
                    var statusLabel = status === 'active' ? L.voucherActive : (status === 'used' ? L.voucherUsed : L.voucherExpired);
                    var statusClass = 'co-vh-status co-vh-status-' + status;

                    listHtml += '<div class="co-vh-item">' +
                        '<span class="co-vh-date">' + dateStr + '</span>' +
                        '<span class="co-vh-service">' + esc(svcName) + '</span>' +
                        '<span class="co-vh-discount">-' + v.discount_percent + '%</span>' +
                        '<span class="' + statusClass + '">' + statusLabel + '</span>';
                    if (status === 'active') {
                        listHtml += '<button class="co-vh-qr-btn" data-token="' + esc(v.qr_token) + '" data-service="' + esc(svcName) + '" data-percent="' + v.discount_percent + '" data-entity="' + esc(v.entity_name || '') + '" data-expires="' + v.expires_at + '">' + L.voucherShowQR + '</button>';
                    }
                    listHtml += '</div>';
                });
                listHtml += '</div>';
                histDiv.innerHTML += listHtml;
            }

            parentContainer.appendChild(histDiv);

            // QR button clicks in history
            histDiv.querySelectorAll('.co-vh-qr-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    coShowVoucherModal({
                        qr_token: this.dataset.token,
                        service_name: this.dataset.service,
                        discount_percent: this.dataset.percent,
                        entity_name: this.dataset.entity,
                        expires_at: this.dataset.expires
                    });
                });
            });
        } catch(e) {
            console.error('Voucher history error:', e);
        }
    }

    async function coGenerateVoucher(entityType, entityId, serviceId, onSuccess) {
        var client = window.supabaseClient;
        if (!client) return;

        try {
            var result = await client.rpc('generate_voucher', {
                p_entity_type: entityType,
                p_entity_id: entityId,
                p_service_id: serviceId
            });

            if (result.error) {
                console.error('Voucher RPC error:', result.error);
                showToast(result.error.message || (isEn ? 'Error getting discount' : (isKg ? 'Арзандатуу алууда ката' : 'Ошибка получения скидки')), 'error');
                return;
            }
            var data = result.data;
            if (!data) {
                showToast(isEn ? 'Error getting discount' : (isKg ? 'Арзандатуу алууда ката' : 'Ошибка получения скидки'), 'error');
                return;
            }
            if (data.error) {
                if (data.error === 'active_voucher_exists') {
                    coShowLimitModal('active');
                    return;
                }
                if (data.error === 'daily_limit') {
                    coShowLimitModal('daily');
                    return;
                }
                var msgs = {
                    not_authenticated: isEn ? 'Please log in' : (isKg ? 'Кириңиз' : 'Войдите в систему'),
                    not_member: isEn ? 'Membership required' : (isKg ? 'Мүчөлүк керек' : 'Требуется членство'),
                    service_not_found: isEn ? 'Service not found' : (isKg ? 'Кызмат табылган жок' : 'Услуга не найдена'),
                    entity_not_partner: isEn ? 'Not a partner' : (isKg ? 'Өнөктөш эмес' : 'Не партнёр')
                };
                showToast(msgs[data.error] || data.error, 'error');
                return;
            }
            if (data.success && data.voucher) {
                coShowVoucherModal(data.voucher);
                if (typeof onSuccess === 'function') onSuccess();
            }
        } catch (e) {
            showToast(e.message || 'Error', 'error');
        }
    }

    function coShowVoucherModal(voucher) {
        var existing = document.getElementById('coVoucherModal');
        if (existing) existing.remove();

        var verifyUrl = 'https://kslt.netlify.app/pages/verify.html?token=' + voucher.qr_token;
        var expiresDate = new Date(voucher.expires_at);
        var expiresStr = expiresDate.toLocaleString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        var modal = document.createElement('div');
        modal.id = 'coVoucherModal';
        modal.className = 'co-voucher-overlay';
        modal.innerHTML =
            '<div class="co-voucher-modal">' +
                '<button class="co-voucher-close" id="coVoucherClose">&times;</button>' +
                '<h3 class="co-voucher-title">' + L.voucherReady + '</h3>' +
                '<div class="co-voucher-qr" id="coVoucherQR"></div>' +
                '<div class="co-voucher-details">' +
                    '<div class="co-voucher-row"><span>' + L.voucherService + ':</span><span>' + esc(voucher.service_name) + '</span></div>' +
                    '<div class="co-voucher-row"><span>' + L.voucherDiscount + ':</span><span class="co-voucher-percent">-' + voucher.discount_percent + '%</span></div>' +
                    '<div class="co-voucher-row"><span>' + esc(voucher.entity_name) + '</span></div>' +
                    '<div class="co-voucher-row"><span>' + L.voucherExpires + ':</span><span>' + expiresStr + '</span></div>' +
                '</div>' +
                '<div class="co-voucher-actions">' +
                    '<button class="co-voucher-download" id="coVoucherDownload">' + L.voucherDownload + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);

        var qrContainer = document.getElementById('coVoucherQR');
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: verifyUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        document.getElementById('coVoucherClose').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });

        document.getElementById('coVoucherDownload').addEventListener('click', function() {
            setTimeout(function() {
                var qrCanvas = qrContainer.querySelector('canvas');
                if (!qrCanvas) return;

                var w = 380;
                var h = 520;
                var c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                var ctx = c.getContext('2d');

                var grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0f0f0f');
                grad.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, 0, w, 4);

                ctx.fillStyle = '#CCFF00';
                ctx.font = 'bold 26px Inter, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('KSLT', w / 2, 42);

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '11px Inter, Arial, sans-serif';
                ctx.fillText('KYRGYZSTAN SOCIAL LAWN TENNIS', w / 2, 60);

                ctx.strokeStyle = 'rgba(204,255,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(40, 75);
                ctx.lineTo(w - 40, 75);
                ctx.stroke();

                ctx.fillStyle = '#CCFF00';
                ctx.font = 'bold 32px Inter, Arial, sans-serif';
                ctx.fillText('-' + voucher.discount_percent + '%', w / 2, 112);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 15px Inter, Arial, sans-serif';
                ctx.fillText(voucher.service_name || '', w / 2, 138);

                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '13px Inter, Arial, sans-serif';
                ctx.fillText(voucher.entity_name || '', w / 2, 160);

                var qrSize = 200;
                var qrX = (w - qrSize) / 2;
                var qrY = 180;
                var pad = 12;
                ctx.fillStyle = '#ffffff';
                roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 12);
                ctx.fill();
                ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '11px Inter, Arial, sans-serif';
                var scanLabel = isEn ? 'Scan QR to verify discount' : (isKg ? 'Арзандатууну текшерүү үчүн QR сканерлеңиз' : 'Отсканируйте QR для проверки скидки');
                ctx.fillText(scanLabel, w / 2, qrY + qrSize + pad + 22);

                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '12px Inter, Arial, sans-serif';
                ctx.fillText(expiresStr, w / 2, qrY + qrSize + pad + 44);

                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, h - 4, w, 4);

                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = '10px Inter, Arial, sans-serif';
                ctx.fillText('kslt.netlify.app', w / 2, h - 14);

                var link = document.createElement('a');
                link.download = 'KSLT-voucher-' + voucher.qr_token.substring(0, 8) + '.png';
                link.href = c.toDataURL('image/png');
                link.click();
            }, 300);
        });
    }

    /* ===== LIMIT MODAL ===== */

    function coShowLimitModal(reason) {
        var existing = document.getElementById('coLimitModal');
        if (existing) existing.remove();

        var title, desc;
        if (reason === 'daily') {
            title = isEn ? 'Daily limit reached' : (isKg ? 'Күнүмдүк лимит' : 'Дневной лимит');
            desc = isEn ? 'You can get a new discount for this service tomorrow' : (isKg ? 'Бул кызмат үчүн жаңы арзандатууну эртең ала аласыз' : 'Новую скидку на эту услугу можно получить завтра');
        } else {
            title = L.voucherLimit;
            desc = isEn ? 'Use or wait for your current discount to expire' : (isKg ? 'Учурдагы арзандатууңузду колдонуңуз же мөөнөтү бүткөнчө күтүңүз' : 'Используйте текущую скидку или дождитесь её истечения');
        }

        var modal = document.createElement('div');
        modal.id = 'coLimitModal';
        modal.className = 'co-voucher-overlay';
        modal.innerHTML =
            '<div class="co-voucher-modal" style="text-align:center;">' +
                '<button class="co-voucher-close" id="coLimitClose">&times;</button>' +
                '<div style="font-size:2.5rem;margin-bottom:12px;">&#9203;</div>' +
                '<h3 class="co-voucher-title">' + title + '</h3>' +
                '<p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:20px;">' + desc + '</p>' +
                '<button class="co-voucher-download" id="coLimitOk">OK</button>' +
            '</div>';

        document.body.appendChild(modal);
        document.getElementById('coLimitClose').addEventListener('click', function() { modal.remove(); });
        document.getElementById('coLimitOk').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    }

    function initScrollAnimations() {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.co-fade-in:not(.visible)').forEach(function(el) {
            observer.observe(el);
        });
    }
})();
