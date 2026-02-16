(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var L = window.coachesLabels || {
        heroTitle: "Тренеры KSLT",
        heroSubtitle: "Профессиональные тренеры для игроков всех уровней",
        filterAll: "Все",
        filterAdults: "Взрослые",
        filterKids: "Дети",
        filterGroup: "Групповые",
        filterIndividual: "Индивидуальные",
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
        court: "Корт"
    };

    var data = window.coachesData || [];
    var coachPage = window.location.pathname.indexOf('coach.html') !== -1 || window.location.pathname.indexOf('coach-en.html') !== -1;
    var isListPage = window.location.pathname.indexOf('coaches.html') !== -1 || window.location.pathname.indexOf('coaches-en.html') !== -1;

    // Determine if we're on detail page (coach.html, NOT coaches.html)
    var isDetailPage = coachPage && !isListPage;

    if (isDetailPage) {
        initDetailPage();
    } else {
        initListPage();
    }

    function initListPage() {
        renderHero();
        renderFilters();
        renderGrid('all');
        initFilterClicks();
        initScrollAnimations();
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
            { key: 'individual', label: L.filterIndividual }
        ];
        var html = '<div class="co-filters">';
        filters.forEach(function(f) {
            html += '<button class="co-filter-btn' + (f.key === 'all' ? ' active' : '') + '" data-filter="' + f.key + '">' + f.label + '</button>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderGrid(filter) {
        var container = document.getElementById('coachesGrid');
        if (!container) return;
        var filtered = data;
        if (filter !== 'all') {
            filtered = data.filter(function(c) {
                return c.tags.indexOf(filter) !== -1;
            });
        }
        var detailBase = isEn ? 'coach-en.html' : 'coach.html';
        var html = '<div class="co-grid">';
        filtered.forEach(function(c) {
            html += '<div class="co-card co-fade-in">' +
                '<img src="' + c.photo + '" alt="' + c.name + '" class="co-card-photo">' +
                '<div class="co-card-name">' + c.name + '</div>' +
                '<div class="co-card-spec">' + c.specialization + '</div>' +
                '<div class="co-card-desc">' + c.shortDesc + '</div>' +
                '<div class="co-card-stats">' +
                    '<div class="co-card-stat"><div class="co-card-stat-num">' + c.experience + '</div><div class="co-card-stat-label">' + L.experience + '</div></div>' +
                    '<div class="co-card-stat"><div class="co-card-stat-num">' + c.students + '+</div><div class="co-card-stat-label">' + L.students + '</div></div>' +
                    '<div class="co-card-stat"><div class="co-card-stat-num">' + c.rating + '</div><div class="co-card-stat-label">' + L.rating + '</div></div>' +
                '</div>' +
                '<div class="co-card-price">' + L.priceFrom + ' <strong>' + c.price + '</strong> ' + L.priceCurrency + '</div>' +
                '<a href="' + detailBase + '?id=' + c.id + '" class="co-card-btn">' + L.detailsBtn + ' →</a>' +
            '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
        // Re-init scroll animations for new cards
        initScrollAnimations();
    }

    function initFilterClicks() {
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('co-filter-btn')) return;
            document.querySelectorAll('.co-filter-btn').forEach(function(b) { b.classList.remove('active'); });
            e.target.classList.add('active');
            renderGrid(e.target.getAttribute('data-filter'));
        });
    }

    // ---- DETAIL PAGE ----
    function initDetailPage() {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        var coach = null;
        for (var i = 0; i < data.length; i++) {
            if (data[i].id === id) { coach = data[i]; break; }
        }
        if (!coach) {
            var container = document.getElementById('coachDetail');
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Coach not found</h2><a href="' + (isEn ? 'coaches-en.html' : 'coaches.html') + '" class="co-back-link">← ' + L.backBtn + '</a></div>';
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

        var coachesLink = isEn ? 'coaches-en.html' : 'coaches.html';
        var authLink = isEn ? 'auth-en.html' : 'auth.html';

        var html = '';

        // Back link
        html += '<a href="' + coachesLink + '" class="co-back-link">← ' + L.backBtn + '</a>';

        // Header
        html += '<div class="co-detail-header co-fade-in">' +
            '<img src="' + coach.photo + '" alt="' + coach.name + '" class="co-detail-photo">' +
            '<div class="co-detail-info">' +
                '<h1>' + coach.name + '</h1>' +
                '<div class="co-detail-spec">' + coach.specialization + '</div>' +
                '<div class="co-detail-court"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + coach.court + '</div>' +
            '</div>' +
        '</div>';

        // Stats
        html += '<div class="co-detail-stats co-fade-in">' +
            '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.experience + '</div><div class="co-detail-stat-label">' + L.experience + '</div></div>' +
            '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.students + '+</div><div class="co-detail-stat-label">' + L.students + '</div></div>' +
            '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.rating + '</div><div class="co-detail-stat-label">' + L.rating + '</div></div>' +
            '<div class="co-detail-stat"><div class="co-detail-stat-num">' + coach.price + '</div><div class="co-detail-stat-label">' + L.priceCurrency + '</div></div>' +
        '</div>';

        // Bio
        html += '<div class="co-section co-fade-in">' +
            '<h2 class="co-section-title">' + L.bioTitle + '</h2>' +
            '<p class="co-bio-text">' + coach.bio + '</p>' +
        '</div>';

        // Achievements
        html += '<div class="co-section co-fade-in">' +
            '<h2 class="co-section-title">' + L.achievementsTitle + '</h2>' +
            '<div class="co-achievements">';
        coach.achievements.forEach(function(a) {
            html += '<div class="co-achievement">' + a + '</div>';
        });
        html += '</div></div>';

        // Schedule
        html += '<div class="co-section co-fade-in">' +
            '<h2 class="co-section-title">' + L.scheduleTitle + '</h2>' +
            '<div class="co-schedule">';
        var days = Object.keys(coach.schedule);
        days.forEach(function(day) {
            var time = coach.schedule[day];
            var isDayOff = time === 'Выходной' || time === 'Day off';
            html += '<div class="co-schedule-row' + (isDayOff ? ' day-off' : '') + '">' +
                '<span class="co-schedule-day">' + day + '</span>' +
                '<span class="co-schedule-time">' + time + '</span>' +
            '</div>';
        });
        html += '</div></div>';

        // Reviews
        html += '<div class="co-section co-fade-in">' +
            '<h2 class="co-section-title">' + L.reviewsTitle + '</h2>' +
            '<div class="co-reviews-grid">';
        coach.reviews.forEach(function(r) {
            var stars = '';
            for (var s = 0; s < r.rating; s++) stars += '★';
            html += '<div class="co-review-card">' +
                '<div class="co-review-stars">' + stars + '</div>' +
                '<div class="co-review-text">"' + r.text + '"</div>' +
                '<div class="co-review-author">— ' + r.author + '</div>' +
            '</div>';
        });
        html += '</div></div>';

        // CTA
        html += '<div class="co-cta co-fade-in">' +
            '<h3>' + L.ctaTitle.replace('KSLT', '<span>KSLT</span>') + '</h3>' +
            '<p>' + L.ctaText + '</p>' +
            '<a href="' + authLink + '" class="co-cta-btn">' + L.ctaBtn + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
        '</div>';

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
