(function() {
    'use strict';

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function getMapEmbed(url) {
        if (!url) return null;
        // Google Maps
        if (url.indexOf('google.com/maps') !== -1 || url.indexOf('goo.gl/maps') !== -1 || url.indexOf('maps.app.goo.gl') !== -1) {
            if (url.indexOf('/embed') !== -1) return url;
            var qMatch = url.match(/[?&]q=([^&]+)/);
            if (qMatch) return 'https://maps.google.com/maps?q=' + qMatch[1] + '&output=embed';
            var coordMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
            if (coordMatch) return 'https://maps.google.com/maps?q=' + coordMatch[1] + ',' + coordMatch[2] + '&output=embed';
            // Place URL: extract place name from /place/Name/
            var placeMatch = url.match(/\/place\/([^/]+)/);
            if (placeMatch) return 'https://maps.google.com/maps?q=' + placeMatch[1] + '&output=embed';
            return 'https://maps.google.com/maps?q=' + encodeURIComponent(url) + '&output=embed';
        }
        // 2GIS
        if (url.indexOf('2gis.') !== -1) {
            var gisMatch = url.match(/\/([\d.]+)%2C([\d.]+)\//);
            if (!gisMatch) gisMatch = url.match(/\/([\d.]+),([\d.]+)\//);
            if (gisMatch) return 'https://maps.google.com/maps?q=' + gisMatch[2] + ',' + gisMatch[1] + '&output=embed';
        }
        return null;
    }

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
        phone: "Телефон",
        newBadge: "Новый",
        filterType: "Тип корта",
        filterSurface: "Покрытие",
        filterCarpet: "Ковёр"
    };

    var SURFACE_MAP = { hard: 'Хард', clay: 'Грунт', carpet: 'Ковёр' };
    var SURFACE_MAP_EN = { hard: 'Hard', clay: 'Clay', carpet: 'Carpet' };

    var staticData = window.courtsData || [];
    var data = staticData.slice(); // will be replaced after Supabase load

    var currentTypeFilter = 'all';
    var currentSurfaceFilter = 'all';

    var courtPage = window.location.pathname.indexOf('court.html') !== -1 || window.location.pathname.indexOf('court-en.html') !== -1;
    var isListPage = window.location.pathname.indexOf('courts.html') !== -1 || window.location.pathname.indexOf('courts-en.html') !== -1;
    var isDetailPage = courtPage && !isListPage;

    if (isDetailPage) {
        initDetailPage();
        loadSupabaseCourts(function(dbCourts) {
            if (dbCourts.length) {
                data = dbCourts.concat(staticData);
                // Re-check if current detail is from DB
                var params = new URLSearchParams(window.location.search);
                var id = params.get('id');
                var found = null;
                for (var i = 0; i < dbCourts.length; i++) {
                    if (dbCourts[i].id === id) { found = dbCourts[i]; break; }
                }
                if (found) {
                    document.title = 'KSLT \u2014 ' + found.name;
                    renderDetailHero(found);
                    renderDetail(found);
                    initScrollAnimations();
                }
            }
        });
    } else {
        initListPage();
        loadSupabaseCourts(function(dbCourts) {
            if (dbCourts.length) {
                data = sortPromotedFirst(dbCourts).concat(staticData);
                renderGrid();
            }
        });
    }

    /* ===== SUPABASE LOADING ===== */

    function loadSupabaseCourts(callback) {
        var client = window.supabaseClient || null;
        if (!client) {
            callback([]);
            return;
        }
        try {
            client.from('courts').select('*').order('created_at', { ascending: false })
                .then(function(result) {
                    if (result.error || !result.data) { callback([]); return; }
                    var mapped = result.data.map(function(row) { return mapDbCourt(row); });
                    callback(mapped);
                })
                .catch(function() { callback([]); });
        } catch (e) {
            callback([]);
        }
    }

    function mapDbCourt(row) {
        var courtTypes = row.court_types || [];
        // Determine primary type
        var hasIndoor = courtTypes.some(function(ct) { return ct.type === 'indoor'; });
        var hasOutdoor = courtTypes.some(function(ct) { return ct.type === 'outdoor'; });
        var primaryType = hasIndoor ? 'indoor' : 'outdoor';

        // Surface from first court type
        var surfaceKey = courtTypes.length ? courtTypes[0].surface : 'hard';
        var surface = isEn ? (SURFACE_MAP_EN[surfaceKey] || surfaceKey) : (SURFACE_MAP[surfaceKey] || surfaceKey);

        // Total courts count
        var totalCourts = 0;
        courtTypes.forEach(function(ct) { totalCourts += (ct.count || 0); });

        // Min price
        var minPrice = 0;
        courtTypes.forEach(function(ct) {
            if (ct.price && (!minPrice || ct.price < minPrice)) minPrice = ct.price;
        });

        // Build address
        var parts = [];
        var street = isEn ? (row.street_en || row.street) : row.street;
        if (street) parts.push(street);
        if (row.building) parts.push(row.building);
        var city = isEn ? (row.city_en || row.city) : (row.city || 'Бишкек');
        if (city) parts.push(city);
        var address = parts.join(', ');

        // Description
        var desc = isEn ? (row.description_en || row.description || '') : (row.description || '');
        var shortDesc = desc.length > 120 ? desc.substr(0, 120) + '...' : desc;

        // Name
        var name = isEn ? (row.name_en || row.name) : row.name;

        // Amenities — map keys to labels
        var AMENITY_LABELS = {
            locker_rooms: isEn ? 'Locker rooms' : 'Раздевалки',
            showers: isEn ? 'Showers' : 'Душевые',
            parking: isEn ? 'Parking' : 'Парковка',
            racket_rental: isEn ? 'Racket rental' : 'Прокат ракеток',
            pro_shop: 'Pro-shop',
            cafe: isEn ? 'Café' : 'Кафе',
            gym: isEn ? 'Gym' : 'Тренажёрный зал',
            pool: isEn ? 'Pool' : 'Бассейн',
            sauna: isEn ? 'Sauna' : 'Сауна',
            climate: isEn ? 'Climate control' : 'Климат-контроль',
            lighting: isEn ? 'Lighting' : 'Вечернее освещение',
            kids_area: isEn ? 'Kids area' : 'Детская площадка',
            kids_school: isEn ? 'Kids school' : 'Детская школа',
            video: isEn ? 'Video' : 'Видеоанализ',
            wifi: 'Wi-Fi',
            benches: isEn ? 'Benches' : 'Скамейки'
        };
        var amenities = (row.amenities || []).map(function(key) {
            return AMENITY_LABELS[key] || key;
        });

        // Type labels for mixed courts
        var typeDesc = '';
        if (hasIndoor && hasOutdoor) {
            typeDesc = (isEn ? 'Indoor + Outdoor' : 'Крытый + Открытый');
        }

        return {
            id: row.id,
            name: name,
            photo: row.photo || 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
            gallery: row.gallery || [],
            type: primaryType,
            _hasIndoor: hasIndoor,
            _hasOutdoor: hasOutdoor,
            _courtTypes: courtTypes,
            surface: surface,
            courtsCount: totalCourts,
            rating: null,
            price: minPrice,
            address: address,
            phone: row.phone || '',
            shortDesc: shortDesc,
            description: desc,
            amenities: amenities,
            schedule: {},
            partner: row.partner || false,
            google_maps_url: row.google_maps_url || '',
            twogis_url: row.twogis_url || '',
            _isNew: true,
            _isDb: true,
            _typeDesc: typeDesc,
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

    /* ===== LIST PAGE ===== */

    function initListPage() {
        renderHero();
        renderFilters();
        renderBackLink();
        renderGrid();
        initFilterClicks();
        initScrollAnimations();
    }

    function renderBackLink() {
        var filters = document.getElementById('courtsFilters');
        if (!filters) return;
        var servicesLink = isEn ? 'services-en.html' : 'services.html';
        var link = document.createElement('a');
        link.href = servicesLink;
        link.className = 'ct-back-link ct-back-service';
        link.innerHTML = '\u2190 ' + (isEn ? 'Services' : 'Услуги');
        filters.insertBefore(link, filters.firstChild);
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

        container.className = 'ct-filters-wrap';

        var html =
            '<div class="ct-filter-group">' +
                '<span class="ct-filter-label">' + L_labels.filterType + '</span>' +
                '<div class="ct-filter-chips">' +
                    '<button class="ct-filter-btn active" data-filter-type="all">' + L_labels.filterAll + '</button>' +
                    '<button class="ct-filter-btn" data-filter-type="indoor">' + L_labels.filterIndoor + '</button>' +
                    '<button class="ct-filter-btn" data-filter-type="outdoor">' + L_labels.filterOutdoor + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="ct-filter-divider"></div>' +
            '<div class="ct-filter-group">' +
                '<span class="ct-filter-label">' + L_labels.filterSurface + '</span>' +
                '<div class="ct-filter-chips">' +
                    '<button class="ct-filter-btn active" data-filter-surface="all">' + L_labels.filterAll + '</button>' +
                    '<button class="ct-filter-btn" data-filter-surface="hard">' + L_labels.filterHard + '</button>' +
                    '<button class="ct-filter-btn" data-filter-surface="clay">' + L_labels.filterClay + '</button>' +
                    '<button class="ct-filter-btn" data-filter-surface="carpet">' + L_labels.filterCarpet + '</button>' +
                '</div>' +
            '</div>';
        container.innerHTML = html;

        // Sticky shadow on scroll
        var observer = new IntersectionObserver(function(entries) {
            container.classList.toggle('stuck', !entries[0].isIntersecting);
        }, { threshold: [1], rootMargin: '-65px 0px 0px 0px' });
        var sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        container.parentNode.insertBefore(sentinel, container);
        observer.observe(sentinel);
    }

    function renderGrid() {
        var container = document.getElementById('courtsGrid');
        if (!container) return;

        var filtered = data;

        // Filter by type
        if (currentTypeFilter === 'indoor') {
            filtered = filtered.filter(function(c) {
                return c.type === 'indoor' || c._hasIndoor;
            });
        } else if (currentTypeFilter === 'outdoor') {
            filtered = filtered.filter(function(c) {
                return c.type === 'outdoor' || c._hasOutdoor;
            });
        }

        // Filter by surface
        if (currentSurfaceFilter !== 'all') {
            filtered = filtered.filter(function(c) {
                if (c._courtTypes) return c._courtTypes.some(function(ct) { return ct.surface === currentSurfaceFilter; });
                var surfMap = { hard: ['Хард', 'Hard'], clay: ['Грунт', 'Clay'], carpet: ['Ковёр', 'Carpet'] };
                var variants = surfMap[currentSurfaceFilter] || [];
                return variants.indexOf(c.surface) !== -1;
            });
        }

        var detailBase = isEn ? 'court-en.html' : 'court.html';

        var html = '<div class="ct-grid">';
        filtered.forEach(function(c) {
            var typeLabel = c._typeDesc || (c.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor);
            var newBadge = c._isNew ? '<span class="ct-new-badge">' + L_labels.newBadge + '</span>' : '';

            html += '<a href="' + detailBase + '?id=' + c.id + '" class="ct-card ct-fade-in">' +
                '<div class="ct-card-img-wrap">' +
                    '<img src="' + esc(c.photo) + '" alt="' + esc(c.name) + '" class="ct-card-img" loading="lazy">' +
                    newBadge +
                '</div>' +
                '<div class="ct-card-body">' +
                    '<div class="ct-card-top">' +
                        '<div class="ct-card-name">' + c.name + '</div>' +
                        (c.partner ? '<span class="ct-card-partner">' + L_labels.partnerBadge + '</span>' : '') +
                    '</div>' +
                    '<div class="ct-card-type">' + typeLabel + ' \u00b7 ' + c.surface + '</div>' +
                    '<div class="ct-card-desc">' + (c.shortDesc || '') + '</div>' +
                    '<div class="ct-card-stats">' +
                        '<div class="ct-card-stat"><div class="ct-card-stat-num">' + c.courtsCount + '</div><div class="ct-card-stat-label">' + L_labels.courts + '</div></div>' +
                        (c.rating ? '<div class="ct-card-stat"><div class="ct-card-stat-num">\u2605 ' + c.rating + '</div><div class="ct-card-stat-label">' + L_labels.rating + '</div></div>' : '') +
                    '</div>' +
                    (c.price ? '<div class="ct-card-price">' + L_labels.priceFrom + ' <strong>' + c.price + '</strong> ' + L_labels.priceCurrency + '</div>' : '') +
                    '<span class="ct-card-btn">' + L_labels.detailsBtn + ' \u2192</span>' +
                '</div>' +
            '</a>';
        });
        html += '</div>';
        container.innerHTML = html;
        initScrollAnimations();
    }

    function initFilterClicks() {
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('ct-filter-btn')) return;

            if (e.target.hasAttribute('data-filter-type')) {
                currentTypeFilter = e.target.getAttribute('data-filter-type');
                e.target.closest('.ct-filter-group').querySelectorAll('.ct-filter-btn').forEach(function(b) { b.classList.remove('active'); });
                e.target.classList.add('active');
                renderGrid();
            } else if (e.target.hasAttribute('data-filter-surface')) {
                currentSurfaceFilter = e.target.getAttribute('data-filter-surface');
                e.target.closest('.ct-filter-group').querySelectorAll('.ct-filter-btn').forEach(function(b) { b.classList.remove('active'); });
                e.target.classList.add('active');
                renderGrid();
            }
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
            // Will be retried after Supabase loads
            var container = document.getElementById('courtDetail');
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-dim);">' + (isEn ? 'Loading...' : 'Загрузка...') + '</div>';
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
        var subtitle = court.address || '';
        hero.innerHTML =
            '<div class="ct-hero-bg" style="background-image: url(\'' + esc(court.photo) + '\')"></div>' +
            '<div class="ct-hero-content">' +
                '<h1 class="ct-hero-title">' + court.name + '</h1>' +
                '<p class="ct-hero-subtitle">' + subtitle + '</p>' +
            '</div>';
    }

    function renderDetail(court) {
        var container = document.getElementById('courtDetail');
        if (!container) return;

        var courtsLink = isEn ? 'courts-en.html' : 'courts.html';
        var authLink = isEn ? 'auth-en.html' : 'auth.html';
        var typeLabel = court._typeDesc || (court.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor);

        var html = '';

        // Back links
        var servicesLink = isEn ? 'services-en.html' : 'services.html';
        html += '<div class="ct-back-links">';
        html += '<a href="' + servicesLink + '" class="ct-back-link">\u2190 ' + (isEn ? 'Services' : 'Услуги') + '</a>';
        html += '<span class="ct-back-sep">/</span>';
        html += '<a href="' + courtsLink + '" class="ct-back-link">' + L_labels.backBtn + '</a>';
        html += '</div>';

        // Header
        html += '<div class="ct-detail-header ct-fade-in">' +
            '<img src="' + esc(court.photo) + '" alt="' + esc(court.name) + '" class="ct-detail-photo">' +
            '<div class="ct-detail-info">' +
                '<h1>' + court.name + '</h1>' +
                '<div class="ct-detail-type">' + typeLabel + ' \u00b7 ' + court.surface +
                    (court.partner ? ' \u00b7 <span style="background:var(--accent);color:#000;font-size:0.72rem;padding:2px 8px;border-radius:100px;font-weight:700;">' + L_labels.partnerBadge + '</span>' : '') +
                '</div>' +
                (court.address ? '<div class="ct-detail-address"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + court.address + '</div>' : '') +
                (court.phone ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> <a href="tel:' + court.phone.replace(/\s/g, '') + '">' + court.phone + '</a></div>' : '') +
            '</div>' +
        '</div>';

        // Stats
        html += '<div class="ct-detail-stats ct-fade-in">' +
            '<div class="ct-detail-stat"><div class="ct-detail-stat-num">' + court.courtsCount + '</div><div class="ct-detail-stat-label">' + L_labels.courts + '</div></div>' +
            '<div class="ct-detail-stat"><div class="ct-detail-stat-num">' + court.surface + '</div><div class="ct-detail-stat-label">' + L_labels.surface + '</div></div>' +
            (court.rating ? '<div class="ct-detail-stat"><div class="ct-detail-stat-num">\u2605 ' + court.rating + '</div><div class="ct-detail-stat-label">' + L_labels.rating + '</div></div>' : '') +
            (court.price ? '<div class="ct-detail-stat"><div class="ct-detail-stat-num">' + court.price + '</div><div class="ct-detail-stat-label">' + L_labels.priceCurrency + '</div></div>' : '') +
        '</div>';

        // About
        if (court.description) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + L_labels.aboutTitle + '</h2>' +
                '<p class="ct-about-text">' + court.description + '</p>' +
            '</div>';
        }

        // Amenities
        if (court.amenities && court.amenities.length) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + L_labels.amenitiesTitle + '</h2>' +
                '<div class="ct-amenities">';
            court.amenities.forEach(function(a) {
                html += '<div class="ct-amenity">' + a + '</div>';
            });
            html += '</div></div>';
        }

        // Schedule (only for static courts)
        if (court.schedule && Object.keys(court.schedule).length) {
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
        }

        // Gallery
        if (court.gallery && court.gallery.length > 0) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + L_labels.galleryTitle + '</h2>' +
                '<div class="ct-gallery">';
            court.gallery.forEach(function(img) {
                html += '<img src="' + esc(img) + '" alt="' + esc(court.name) + '" class="ct-gallery-img" loading="lazy">';
            });
            html += '</div></div>';
        }

        // Location map (only for static courts with lat/lng)
        if (court.lat && court.lng) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + L_labels.locationTitle + '</h2>' +
                '<div id="courtDetailMap" class="ct-detail-map"></div>' +
            '</div>';
        }

        // Map embed + links (for DB courts — at the bottom)
        if (court.google_maps_url || court.twogis_url) {
            var mapEmbedUrl = getMapEmbed(court.google_maps_url) || getMapEmbed(court.twogis_url);
            html += '<div class="ct-section ct-fade-in">';
            html += '<h2 class="ct-section-title">' + L_labels.locationTitle + '</h2>';
            if (mapEmbedUrl) {
                html += '<div class="ct-map-embed"><iframe src="' + esc(mapEmbedUrl) + '" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>';
            }
            html += '<div class="ct-map-links">';
            if (court.google_maps_url) html += '<a href="' + court.google_maps_url + '" target="_blank" rel="noopener" class="ct-map-link">Google Maps \u2197</a>';
            if (court.twogis_url) html += '<a href="' + court.twogis_url + '" target="_blank" rel="noopener" class="ct-map-link">2GIS \u2197</a>';
            html += '</div></div>';
        }

        // CTA
        html += '<div class="ct-cta ct-fade-in">' +
            '<h3>' + L_labels.ctaTitle.replace('KSLT', '<span>KSLT</span>') + '</h3>' +
            '<p>' + L_labels.ctaText + '</p>' +
            '<a href="' + authLink + '" class="ct-cta-btn">' + L_labels.ctaBtn + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
        '</div>';

        container.innerHTML = html;

        // Init mini map after DOM update (static courts only)
        if (court.lat && court.lng) initDetailMap(court);
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
