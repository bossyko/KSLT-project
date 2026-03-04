// ========================================
// Services Overview — Supabase loader + carousel + swap
// Promoted (top 3) fixed, rest random on each page load
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var client = window.supabaseClient;

    var L = isEn ? {
        heroTagline: 'KSLT Services',
        heroTitle: 'Your tennis <span>starts here</span>',
        heroDesc: 'Best courts and professional coaches in Bishkek',
        courtsTitle: 'Courts',
        coachesTitle: 'Coaches',
        viewAllCourts: 'All courts',
        viewAllCoaches: 'All coaches',
        details: 'Details',
        surface: 'Surface',
        price: 'Price',
        experience: 'Experience',
        level: 'Level',
        years: 'years',
        emptyCourts: 'No courts available',
        emptyCoaches: 'No coaches available',
        from: 'from'
    } : {
        heroTagline: 'KSLT Услуги',
        heroTitle: 'Ваш теннис <span>начинается здесь</span>',
        heroDesc: 'Лучшие корты и профессиональные тренеры Бишкека',
        courtsTitle: 'Корты',
        coachesTitle: 'Тренеры',
        viewAllCourts: 'Все корты',
        viewAllCoaches: 'Все тренеры',
        details: 'Подробнее',
        surface: 'Покрытие',
        price: 'Цена',
        experience: 'Опыт',
        level: 'Уровень',
        years: 'лет',
        emptyCourts: 'Нет доступных кортов',
        emptyCoaches: 'Нет доступных тренеров',
        from: 'от'
    };

    var courtPage = isEn ? 'court-en.html' : 'court.html';
    var coachPage = isEn ? 'coach-en.html' : 'coach.html';
    var courtsPage = isEn ? 'courts-en.html' : 'courts.html';
    var coachesPage = isEn ? 'coaches-en.html' : 'coaches.html';

    var _courts = [];
    var _coaches = [];

    // SVG icons
    var pinSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    var pinSvgLg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    var arrowSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    var courtSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="2" y1="12" x2="22" y2="12"/></svg>';
    var emptySvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        renderHero();
        loadData();
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

    function renderHero() {
        var el = document.getElementById('svHero');
        if (!el) return;
        var heroImg = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80';
        el.innerHTML =
            '<div class="sv-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="sv-hero-overlay"></div>' +
            '<div class="sv-hero-content">' +
                '<div class="sv-hero-tagline">' + L.heroTagline + '</div>' +
                '<h1>' + L.heroTitle + '</h1>' +
                '<p>' + L.heroDesc + '</p>' +
            '</div>';
    }

    // Separate promoted (fixed top) from rest (random), combine
    function sortPromotedFirst(data) {
        var promoted = [];
        var rest = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].promoted) {
                promoted.push(data[i]);
            } else {
                rest.push(data[i]);
            }
        }
        return promoted.concat(shuffle(rest));
    }

    async function loadData() {
        var courts = null;
        var coaches = null;

        if (client) {
            try {
                var cResult = await client.from('courts')
                    .select('id, name, name_en, photo, street, street_en, building, district, district_en, city, city_en, court_types, partner, promoted');
                if (cResult.data && cResult.data.length > 0) {
                    courts = sortPromotedFirst(cResult.data);
                }
            } catch(e) {
                console.error('Supabase courts error:', e);
            }

            try {
                var chResult = await client.from('coaches')
                    .select('id, last_name, first_name, last_name_en, first_name_en, name, name_en, photo, position, position_en, tags, experience, price, court, court_en, promoted');
                if (chResult.data && chResult.data.length > 0) {
                    coaches = sortPromotedFirst(chResult.data);
                }
            } catch(e) {
                console.error('Supabase coaches error:', e);
            }
        }

        _courts = courts || [];
        _coaches = coaches || [];

        renderColumns();
    }

    function getCourtAddress(c) {
        var street = isEn ? (c.street_en || c.street) : c.street;
        var district = isEn ? (c.district_en || c.district) : c.district;
        var parts = [];
        if (street) parts.push(street);
        if (c.building) parts.push(c.building);
        if (district) parts.push(district);
        return parts.join(', ') || '';
    }

    function getCourtMinPrice(c) {
        if (!c.court_types || !c.court_types.length) return '';
        var prices = c.court_types.map(function(ct) { return parseInt(ct.price) || 0; }).filter(function(p) { return p > 0; });
        if (!prices.length) return '';
        var min = Math.min.apply(null, prices);
        return L.from + ' ' + min + ' сом/ч';
    }

    function getCourtSurface(c) {
        if (!c.court_types || !c.court_types.length) return '';
        var surfaces = [];
        c.court_types.forEach(function(ct) {
            if (ct.surface && surfaces.indexOf(ct.surface) === -1) surfaces.push(ct.surface);
        });
        return surfaces.join(', ');
    }

    function getCoachName(ch) {
        if (isEn) {
            if (ch.name_en) return ch.name_en;
            if (ch.first_name_en && ch.last_name_en) return ch.first_name_en + ' ' + ch.last_name_en;
        }
        if (ch.name) return ch.name;
        return (ch.last_name || '') + ' ' + (ch.first_name || '');
    }

    function getCoachSpec(ch) {
        return isEn ? (ch.position_en || ch.position || '') : (ch.position || '');
    }

    function getCoachLevel(ch) {
        if (!ch.tags || !ch.tags.length) return '';
        var levelTags = [];
        if (ch.tags.indexOf('beginner') !== -1) levelTags.push(isEn ? 'Beginner' : 'Начинающие');
        if (ch.tags.indexOf('advanced') !== -1) levelTags.push(isEn ? 'Advanced' : 'Продвинутые');
        return levelTags.join(', ');
    }

    function renderColumns() {
        var container = document.getElementById('svColumns');
        if (!container) return;

        var html = '';

        // Courts column
        html += '<div class="sv-section" data-type="courts">';
        html += '<div class="sv-column-header">';
        html += '<h2 class="sv-column-title"><span>' + L.courtsTitle + '</span></h2>';
        html += '<a href="' + courtsPage + '" class="sv-view-all">' + L.viewAllCourts + ' ' + arrowSvg + '</a>';
        html += '</div>';
        if (_courts.length === 0) {
            html += '<div class="sv-empty">' + emptySvg + '<p>' + L.emptyCourts + '</p></div>';
        } else {
            html += '<div class="sv-card-grid">';
            html += renderFeaturedCourt(_courts[0]);
            if (_courts.length > 1) {
                html += renderCarousel(_courts.slice(1), 'courts');
            }
            html += '</div>';
        }
        html += '</div>';

        // Coaches column
        html += '<div class="sv-section" data-type="coaches">';
        html += '<div class="sv-column-header">';
        html += '<h2 class="sv-column-title"><span>' + L.coachesTitle + '</span></h2>';
        html += '<a href="' + coachesPage + '" class="sv-view-all">' + L.viewAllCoaches + ' ' + arrowSvg + '</a>';
        html += '</div>';
        if (_coaches.length === 0) {
            html += '<div class="sv-empty">' + emptySvg + '<p>' + L.emptyCoaches + '</p></div>';
        } else {
            html += '<div class="sv-card-grid">';
            html += renderFeaturedCoach(_coaches[0]);
            if (_coaches.length > 1) {
                html += renderCarousel(_coaches.slice(1), 'coaches');
            }
            html += '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
        attachEvents();

        // Sticky headers: remove border-radius when stuck
        var headers = container.querySelectorAll('.sv-column-header');
        headers.forEach(function(hdr) {
            var sentinel = document.createElement('div');
            sentinel.style.height = '1px';
            hdr.parentNode.insertBefore(sentinel, hdr);
            var obs = new IntersectionObserver(function(entries) {
                hdr.classList.toggle('stuck', !entries[0].isIntersecting);
            }, { threshold: [1], rootMargin: '-65px 0px 0px 0px' });
            obs.observe(sentinel);
        });
    }

    // --- Carousel wrapper — infinite auto-scroll (items duplicated for seamless loop) ---
    function renderCarousel(items, type) {
        var html = '<div class="sv-carousel-wrap" data-type="' + type + '">';
        html += '<div class="sv-carousel" data-type="' + type + '">';
        // Render items twice for seamless infinite loop
        for (var pass = 0; pass < 2; pass++) {
            for (var i = 0; i < items.length; i++) {
                if (type === 'courts') {
                    html += renderCompactCourt(items[i], i + 1);
                } else {
                    html += renderCompactCoach(items[i], i + 1);
                }
            }
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    // --- Featured Court ---
    function renderFeaturedCourt(c) {
        var name = isEn ? (c.name_en || c.name) : c.name;
        var addr = getCourtAddress(c);
        var surface = getCourtSurface(c);
        var price = getCourtMinPrice(c);
        var photo = c.photo || '';
        var href = courtPage + '?id=' + c.id;

        return '<a class="sv-featured" href="' + href + '">' +
            (photo
                ? '<div class="sv-featured-bg"><img src="' + photo + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>'
                : '<div class="sv-featured-overlay" style="background:var(--bg-card)"></div>') +
            '<div class="sv-featured-content">' +
                '<h3>' + name + '</h3>' +
                '<div class="sv-featured-meta">' +
                    (addr ? '<span>' + pinSvgLg + ' ' + addr + '</span>' : '') +
                '</div>' +
                '<div class="sv-featured-details">' +
                    (surface ? '<div class="sv-featured-detail"><span class="sv-label">' + L.surface + '</span><span class="sv-value">' + surface + '</span></div>' : '') +
                    (price ? '<div class="sv-featured-detail"><span class="sv-label">' + L.price + '</span><span class="sv-value accent">' + price + '</span></div>' : '') +
                '</div>' +
                '<span class="sv-featured-link">' + L.details + '</span>' +
            '</div>' +
        '</a>';
    }

    // --- Featured Coach ---
    function renderFeaturedCoach(ch) {
        var name = getCoachName(ch);
        var spec = getCoachSpec(ch);
        var level = getCoachLevel(ch);
        var photo = ch.photo || '';
        var href = coachPage + '?id=' + ch.id;
        var exp = ch.experience ? ch.experience + ' ' + L.years : '';
        var price = ch.price ? ch.price + ' сом/ч' : '';

        return '<a class="sv-featured" href="' + href + '">' +
            (photo
                ? '<div class="sv-featured-bg"><img src="' + photo + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>'
                : '<div class="sv-featured-overlay" style="background:var(--bg-card)"></div>') +
            '<div class="sv-featured-content">' +
                (photo ? '<img class="sv-coach-avatar" src="' + photo + '" alt="" loading="lazy">' : '') +
                '<h3>' + name + '</h3>' +
                '<div class="sv-featured-meta">' +
                    (spec ? '<span>' + spec + '</span>' : '') +
                '</div>' +
                '<div class="sv-featured-details">' +
                    (exp ? '<div class="sv-featured-detail"><span class="sv-label">' + L.experience + '</span><span class="sv-value">' + exp + '</span></div>' : '') +
                    (level ? '<div class="sv-featured-detail"><span class="sv-label">' + L.level + '</span><span class="sv-value">' + level + '</span></div>' : '') +
                    (price ? '<div class="sv-featured-detail"><span class="sv-label">' + L.price + '</span><span class="sv-value accent">' + price + '</span></div>' : '') +
                '</div>' +
                '<span class="sv-featured-link">' + L.details + '</span>' +
            '</div>' +
        '</a>';
    }

    // --- Compact Court (card for carousel) ---
    function renderCompactCourt(c, idx) {
        var name = isEn ? (c.name_en || c.name) : c.name;
        var addr = getCourtAddress(c);
        var price = getCourtMinPrice(c);
        var photo = c.photo || '';

        return '<div class="sv-compact" data-type="courts" data-idx="' + idx + '">' +
            (photo
                ? '<img class="sv-compact-photo" src="' + photo + '" alt="" loading="lazy">'
                : '<div class="sv-compact-icon">' + courtSvg + '</div>') +
            '<h4>' + name + '</h4>' +
            (addr ? '<div class="sv-compact-sub">' + pinSvg + ' ' + addr + '</div>' : '') +
            (price ? '<div class="sv-compact-price">' + price + '</div>' : '') +
        '</div>';
    }

    // --- Compact Coach (card for carousel) ---
    function renderCompactCoach(ch, idx) {
        var name = getCoachName(ch);
        var spec = getCoachSpec(ch);
        var price = ch.price ? ch.price + ' сом/ч' : '';
        var photo = ch.photo || '';

        return '<div class="sv-compact" data-type="coaches" data-idx="' + idx + '">' +
            (photo
                ? '<img class="sv-compact-avatar" src="' + photo + '" alt="" loading="lazy">'
                : '<div class="sv-compact-icon">' + courtSvg + '</div>') +
            '<h4>' + name + '</h4>' +
            (spec ? '<div class="sv-compact-sub">' + spec + '</div>' : '') +
            (price ? '<div class="sv-compact-price">' + price + '</div>' : '') +
        '</div>';
    }

    // --- Re-render a single section ---
    function renderSection(type) {
        var items = type === 'courts' ? _courts : _coaches;
        var section = document.querySelector('.sv-section[data-type="' + type + '"]');
        if (!section) return;

        var grid = section.querySelector('.sv-card-grid');
        if (!grid || !items.length) return;

        var html = '';
        if (type === 'courts') {
            html += renderFeaturedCourt(items[0]);
            if (items.length > 1) html += renderCarousel(items.slice(1), 'courts');
        } else {
            html += renderFeaturedCoach(items[0]);
            if (items.length > 1) html += renderCarousel(items.slice(1), 'coaches');
        }
        grid.innerHTML = html;
    }

    // --- Events ---
    function attachEvents() {
        var container = document.getElementById('svColumns');
        if (!container) return;

        container.addEventListener('click', function(e) {
            // Compact card click → swap with featured
            var compact = e.target.closest('.sv-compact');
            if (compact) {
                e.preventDefault();
                var type = compact.dataset.type;
                var idx = parseInt(compact.dataset.idx, 10);
                if (!type || isNaN(idx)) return;

                var items = type === 'courts' ? _courts : _coaches;
                if (idx > 0 && idx < items.length) {
                    var temp = items[0];
                    items[0] = items[idx];
                    items[idx] = temp;
                    renderSection(type);
                }
                return;
            }
        });
    }

})();
