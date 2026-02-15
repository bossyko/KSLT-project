(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var L_labels = window.courtsLabels || {
        heroTitle: "Корты KSLT",
        heroSubtitle: "Теннисные корты Бишкека для тренировок и турниров",
        filterAll: "Все",
        filterIndoor: "Крытые",
        filterOutdoor: "Открытые",
        filterClay: "Грунт",
        filterHard: "Хард",
        courts: "кортов",
        rating: "рейтинг",
        priceFrom: "от",
        priceCurrency: "сом/час",
        detailsBtn: "Подробнее",
        bookBtn: "Забронировать корт",
        aboutTitle: "О площадке",
        amenitiesTitle: "Удобства",
        scheduleTitle: "Расписание и цены",
        locationTitle: "Расположение",
        galleryTitle: "Галерея",
        ctaTitle: "Забронировать корт",
        ctaText: "Зарегистрируйтесь, чтобы бронировать корты онлайн и получать скидки для членов KSLT",
        ctaBtn: "Регистрация",
        backBtn: "Все корты",
        partnerBadge: "Партнёр KSLT",
        surface: "Покрытие",
        phone: "Телефон"
    };

    var data = window.courtsData || [];

    var courtPage = window.location.pathname.indexOf('court.html') !== -1 || window.location.pathname.indexOf('court-en.html') !== -1;
    var isListPage = window.location.pathname.indexOf('courts.html') !== -1 || window.location.pathname.indexOf('courts-en.html') !== -1;
    var isDetailPage = courtPage && !isListPage;

    if (isDetailPage) {
        initDetailPage();
    } else {
        initListPage();
    }

    /* ===== LIST PAGE ===== */

    function initListPage() {
        renderHero();
        renderFilters();
        renderGrid('all');
        initFilterClicks();
        initScrollAnimations();
    }

    function renderHero() {
        var hero = document.getElementById('courtsHero');
        if (!hero) return;
        hero.innerHTML =
            '<div class="ct-hero-bg" style="background-image: url(\'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1400&q=80\')"></div>' +
            '<div class="ct-hero-content">' +
                '<h1 class="ct-hero-title">' + L_labels.heroTitle.replace('KSLT', '<span>KSLT</span>') + '</h1>' +
                '<p class="ct-hero-subtitle">' + L_labels.heroSubtitle + '</p>' +
            '</div>';
    }

    function renderFilters() {
        var container = document.getElementById('courtsFilters');
        if (!container) return;
        var filters = [
            { key: 'all', label: L_labels.filterAll },
            { key: 'indoor', label: L_labels.filterIndoor },
            { key: 'outdoor', label: L_labels.filterOutdoor },
            { key: 'clay', label: L_labels.filterClay },
            { key: 'hard', label: L_labels.filterHard }
        ];
        var html = '<div class="ct-filters">';
        filters.forEach(function(f) {
            html += '<button class="ct-filter-btn' + (f.key === 'all' ? ' active' : '') + '" data-filter="' + f.key + '">' + f.label + '</button>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderGrid(filter) {
        var container = document.getElementById('courtsGrid');
        if (!container) return;

        var filtered = data;
        if (filter === 'indoor') {
            filtered = data.filter(function(c) { return c.type === 'indoor'; });
        } else if (filter === 'outdoor') {
            filtered = data.filter(function(c) { return c.type === 'outdoor'; });
        } else if (filter === 'clay') {
            filtered = data.filter(function(c) { return c.surface === 'Грунт' || c.surface === 'Clay'; });
        } else if (filter === 'hard') {
            filtered = data.filter(function(c) { return c.surface === 'Хард' || c.surface === 'Hard'; });
        }

        var detailBase = isEn ? 'court-en.html' : 'court.html';

        var html = '<div class="ct-grid">';
        filtered.forEach(function(c) {
            var typeLabel = c.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor;
            html += '<div class="ct-card ct-fade-in">' +
                '<img src="' + c.photo + '" alt="' + c.name + '" class="ct-card-img" loading="lazy">' +
                '<div class="ct-card-body">' +
                    '<div class="ct-card-top">' +
                        '<div class="ct-card-name">' + c.name + '</div>' +
                        (c.partner ? '<span class="ct-card-partner">' + L_labels.partnerBadge + '</span>' : '') +
                    '</div>' +
                    '<div class="ct-card-type">' + typeLabel + ' · ' + c.surface + '</div>' +
                    '<div class="ct-card-desc">' + c.shortDesc + '</div>' +
                    '<div class="ct-card-stats">' +
                        '<div class="ct-card-stat"><div class="ct-card-stat-num">' + c.courtsCount + '</div><div class="ct-card-stat-label">' + L_labels.courts + '</div></div>' +
                        '<div class="ct-card-stat"><div class="ct-card-stat-num">★ ' + c.rating + '</div><div class="ct-card-stat-label">' + L_labels.rating + '</div></div>' +
                    '</div>' +
                    '<div class="ct-card-price">' + L_labels.priceFrom + ' <strong>' + c.price + '</strong> ' + L_labels.priceCurrency + '</div>' +
                    '<a href="' + detailBase + '?id=' + c.id + '" class="ct-card-btn">' + L_labels.detailsBtn + ' →</a>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
        initScrollAnimations();
    }

    function initFilterClicks() {
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('ct-filter-btn')) return;
            document.querySelectorAll('.ct-filter-btn').forEach(function(b) { b.classList.remove('active'); });
            e.target.classList.add('active');
            renderGrid(e.target.getAttribute('data-filter'));
        });
    }

    /* ===== DETAIL PAGE ===== */

    function initDetailPage() {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        var court = null;
        for (var i = 0; i < data.length; i++) {
            if (data[i].id === id) { court = data[i]; break; }
        }
        if (!court) {
            var container = document.getElementById('courtDetail');
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Court not found</h2><a href="' + (isEn ? 'courts-en.html' : 'courts.html') + '" class="ct-back-link">\u2190 ' + L_labels.backBtn + '</a></div>';
            return;
        }

        document.title = 'KSLT \u2014 ' + court.name;
        renderDetailHero(court);
        renderDetail(court);
        initScrollAnimations();
    }

    function renderDetailHero(court) {
        var hero = document.getElementById('courtDetailHero');
        if (!hero) return;
        hero.innerHTML =
            '<div class="ct-hero-bg" style="background-image: url(\'' + court.photo + '\')"></div>' +
            '<div class="ct-hero-content">' +
                '<h1 class="ct-hero-title">' + court.name + '</h1>' +
                '<p class="ct-hero-subtitle">' + court.address + '</p>' +
            '</div>';
    }

    function renderDetail(court) {
        var container = document.getElementById('courtDetail');
        if (!container) return;

        var courtsLink = isEn ? 'courts-en.html' : 'courts.html';
        var authLink = isEn ? 'auth-en.html' : 'auth.html';
        var typeLabel = court.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor;

        var html = '';

        // Back link
        html += '<a href="' + courtsLink + '" class="ct-back-link">\u2190 ' + L_labels.backBtn + '</a>';

        // Header
        html += '<div class="ct-detail-header ct-fade-in">' +
            '<img src="' + court.photo + '" alt="' + court.name + '" class="ct-detail-photo">' +
            '<div class="ct-detail-info">' +
                '<h1>' + court.name + '</h1>' +
                '<div class="ct-detail-type">' + typeLabel + ' \u00b7 ' + court.surface +
                    (court.partner ? ' \u00b7 <span style="background:var(--accent);color:#000;font-size:0.72rem;padding:2px 8px;border-radius:100px;font-weight:700;">' + L_labels.partnerBadge + '</span>' : '') +
                '</div>' +
                '<div class="ct-detail-address"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + court.address + '</div>' +
                '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> <a href="tel:' + court.phone.replace(/\s/g, '') + '">' + court.phone + '</a></div>' +
            '</div>' +
        '</div>';

        // Stats
        html += '<div class="ct-detail-stats ct-fade-in">' +
            '<div class="ct-detail-stat"><div class="ct-detail-stat-num">' + court.courtsCount + '</div><div class="ct-detail-stat-label">' + L_labels.courts + '</div></div>' +
            '<div class="ct-detail-stat"><div class="ct-detail-stat-num">' + court.surface + '</div><div class="ct-detail-stat-label">' + L_labels.surface + '</div></div>' +
            '<div class="ct-detail-stat"><div class="ct-detail-stat-num">\u2605 ' + court.rating + '</div><div class="ct-detail-stat-label">' + L_labels.rating + '</div></div>' +
            '<div class="ct-detail-stat"><div class="ct-detail-stat-num">' + court.price + '</div><div class="ct-detail-stat-label">' + L_labels.priceCurrency + '</div></div>' +
        '</div>';

        // About
        html += '<div class="ct-section ct-fade-in">' +
            '<h2 class="ct-section-title">' + L_labels.aboutTitle + '</h2>' +
            '<p class="ct-about-text">' + court.description + '</p>' +
        '</div>';

        // Amenities
        html += '<div class="ct-section ct-fade-in">' +
            '<h2 class="ct-section-title">' + L_labels.amenitiesTitle + '</h2>' +
            '<div class="ct-amenities">';
        court.amenities.forEach(function(a) {
            html += '<div class="ct-amenity">' + a + '</div>';
        });
        html += '</div></div>';

        // Schedule
        html += '<div class="ct-section ct-fade-in">' +
            '<h2 class="ct-section-title">' + L_labels.scheduleTitle + '</h2>' +
            '<div class="ct-schedule">';
        var keys = Object.keys(court.schedule);
        keys.forEach(function(key) {
            html += '<div class="ct-schedule-row">' +
                '<span class="ct-schedule-day">' + key + '</span>' +
                '<span class="ct-schedule-time">' + court.schedule[key] + '</span>' +
            '</div>';
        });
        html += '</div></div>';

        // Gallery
        if (court.gallery && court.gallery.length > 0) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + L_labels.galleryTitle + '</h2>' +
                '<div class="ct-gallery">';
            court.gallery.forEach(function(img) {
                html += '<img src="' + img + '" alt="' + court.name + '" class="ct-gallery-img" loading="lazy">';
            });
            html += '</div></div>';
        }

        // Location map
        html += '<div class="ct-section ct-fade-in">' +
            '<h2 class="ct-section-title">' + L_labels.locationTitle + '</h2>' +
            '<div id="courtDetailMap" class="ct-detail-map"></div>' +
        '</div>';

        // CTA
        html += '<div class="ct-cta ct-fade-in">' +
            '<h3>' + L_labels.ctaTitle.replace('KSLT', '<span>KSLT</span>') + '</h3>' +
            '<p>' + L_labels.ctaText + '</p>' +
            '<a href="' + authLink + '" class="ct-cta-btn">' + L_labels.ctaBtn + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
        '</div>';

        container.innerHTML = html;

        // Init mini map after DOM update
        initDetailMap(court);
    }

    function initDetailMap(court) {
        var mapEl = document.getElementById('courtDetailMap');
        if (!mapEl || typeof L === 'undefined') return;

        var map = L.map(mapEl, {
            scrollWheelZoom: false
        }).setView([court.lat, court.lng], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19
        }).addTo(map);

        var accentIcon = L.divIcon({
            className: 'ct-marker-icon',
            html: '<div style="width:16px;height:16px;background:#CCFF00;border-radius:50%;border:2px solid #000;box-shadow:0 0 10px rgba(204,255,0,0.6);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        L.marker([court.lat, court.lng], { icon: accentIcon }).addTo(map);
    }

    /* ===== SCROLL ANIMATIONS ===== */

    function initScrollAnimations() {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.ct-fade-in:not(.visible)').forEach(function(el) {
            observer.observe(el);
        });
    }

})();
