(function() {
    'use strict';

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
        bookBtn: 'Машыгууга жазылуу',
        bioTitle: 'Машыктыруучу жөнүндө',
        achievementsTitle: 'Жетишкендиктер',
        scheduleTitle: 'Тартип',
        reviewsTitle: 'Окуучулардын пикирлери',
        ctaTitle: 'Бүгүн машыгууну баштаңыз',
        ctaText: 'Машыктыруучу тандап, биринчи сабакка жазылыңыз',
        ctaBtn: 'Жазылуу',
        backBtn: 'Бардык машыктыруучулар',
        court: 'Корт',
        loginToContact: 'Байланыш үчүн кириңиз',
        noContacts: 'Байланыш маалыматы көрсөтүлгөн эмес',
        contactCoach: 'Машыктыруучу менен байланышуу'
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
        bookBtn: "Записаться на тренировку",
        bioTitle: "О тренере",
        achievementsTitle: "Достижения",
        scheduleTitle: "Расписание",
        reviewsTitle: "Отзывы учеников",
        ctaTitle: "Начните тренироваться сегодня",
        ctaText: "Выберите тренера и запишитесь на первое занятие",
        ctaBtn: "Записаться",
        backBtn: "Все тренеры",
        court: "Корт",
        loginToContact: "Войти чтобы связаться",
        noContacts: "Контакты не указаны",
        contactCoach: "Связаться с тренером"
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

    async function detectAccess() {
        var client = window.supabaseClient;
        if (!client) return;
        try {
            var res = await client.auth.getSession();
            if (!res.data || !res.data.session) return;
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
            _promoted: row.promoted || false
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
        renderBackLink();
        renderGrid('all');
        initFilterClicks();
        initPaginationClicks();
        initCtaClicks();
        initScrollAnimations();
        renderSponsors();
        detectAccess();
    }

    function renderBackLink() {
        var filtersEl = document.getElementById('coachesFilters');
        if (!filtersEl) return;
        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');
        var link = document.createElement('a');
        link.href = servicesLink;
        link.className = 'co-back-link co-back-service';
        link.innerHTML = '\u2190 ' + (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги'));
        filtersEl.insertBefore(link, filtersEl.firstChild);
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
        var html = '<div class="co-filters">';
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
        if (_currentFilter !== 'all') {
            filtered = allData.filter(function(c) {
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
                '<span class="co-card-cta" data-id="' + c.id + '">' + (isEn ? 'Contact' : (isKg ? 'Байланышуу' : 'Связаться')) + '</span>' +
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

            html += '<a href="' + detailBase + '?id=' + c.id + '" class="co-card co-fade-in">' +
                '<img src="' + esc(c.photo) + '" alt="' + esc(c.name) + '" class="co-card-photo">' +
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

    // ---- SPONSORS ----
    function renderSponsors() {
        var container = document.getElementById('coachesSponsors');
        if (!container) return;

        var title = isEn ? 'Partners & Sponsors' : (isKg ? 'Өнөктөштөр жана демөөрчүлөр' : 'Партнёры и спонсоры');
        var general = isEn ? 'General sponsor' : (isKg ? 'Башкы демөөрчү' : 'Генеральный спонсор');
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

    function initCtaClicks() {
        var grid = document.getElementById('coachesGrid');
        if (!grid) return;
        grid.addEventListener('click', function(e) {
            var cta = e.target.closest('.co-card-cta');
            if (!cta) return;
            e.preventDefault();
            e.stopPropagation();

            if (_accessLevel === 'guest') {
                showToast(isEn ? 'Sign up and become a KSLT member' : (isKg ? 'Катталыңыз жана КСЛТ мүчөсү болуңуз' : 'Зарегистрируйтесь и станьте членом КСЛТ'), 'info');
                return;
            }
            if (_accessLevel === 'registered') {
                showToast(isEn ? 'Become a KSLT member to contact' : (isKg ? 'Байланышуу үчүн КСЛТ мүчөсү болуңуз' : 'Станьте членом КСЛТ чтобы связаться'), 'info');
                return;
            }
            var id = cta.getAttribute('data-id');
            var detailBase = isEn ? 'coach-en.html' : (isKg ? 'coach-kg.html' : 'coach.html');
            window.location.href = detailBase + '?id=' + id;
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
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Coach not found</h2><a href="' + (isEn ? 'coaches-en.html' : (isKg ? 'coaches-kg.html' : 'coaches.html')) + '" class="co-back-link">← ' + L.backBtn + '</a></div>';
            return;
        }

        document.title = 'KSLT — ' + coach.name;
        renderDetailHero(coach);
        renderDetail(coach);
        initScrollAnimations();
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

        var html = '';
        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');
        html += '<div class="co-back-links">';
        html += '<a href="' + servicesLink + '" class="co-back-link">\u2190 ' + (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги')) + '</a>';
        html += '<span class="co-back-sep">/</span>';
        html += '<a href="' + coachesLink + '" class="co-back-link">' + L.backBtn + '</a>';
        html += '</div>';

        // Header
        html += '<div class="co-detail-header co-fade-in">' +
            '<img src="' + esc(coach.photo) + '" alt="' + esc(coach.name) + '" class="co-detail-photo">' +
            '<div class="co-detail-info">' +
                '<h1>' + coach.name + '</h1>' +
                (coach.specialization ? '<div class="co-detail-spec">' + coach.specialization + '</div>' : '') +
                (coach.court ? '<div class="co-detail-court"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + coach.court + '</div>' : '') +
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

        // CTA
        if (!coach._isDb) {
            html += '<div class="co-cta co-fade-in">' +
                '<h3>' + L.ctaTitle.replace('KSLT', '<span>KSLT</span>') + '</h3>' +
                '<p>' + L.ctaText + '</p>' +
                '<a href="' + authLink + '" class="co-cta-btn">' + L.ctaBtn + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
            '</div>';
        }

        container.innerHTML = html;
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
