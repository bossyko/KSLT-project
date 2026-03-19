// ========================================
// Services Overview — Supabase loader + carousel + swap
// Promoted (top 3) fixed, rest random on each page load
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;

    var L = isEn ? {
        heroTagline: 'KSLT Services',
        heroTitle: 'Your tennis <span>starts here</span>',
        heroDesc: 'Best courts and professional coaches in Bishkek',
        courtsTitle: 'Courts',
        coachesTitle: 'Coaches',
        partnersTitle: 'Find a partner',
        viewAllCourts: 'All courts',
        viewAllCoaches: 'All coaches',
        viewAllPartners: 'All partners',
        details: 'Details',
        surface: 'Surface',
        price: 'Price',
        experience: 'Experience',
        level: 'Level',
        years: 'years',
        emptyCourts: 'No courts available',
        emptyCoaches: 'No coaches available',
        emptyPartners: 'No partners available',
        from: 'from',
        online: 'Online',
        offline: 'Offline',
        levelBeginner: 'Beginner',
        levelIntermediate: 'Intermediate',
        levelAdvanced: 'Advanced',
        levelUnknown: 'Level not specified'
    } : isKg ? {
        heroTagline: 'KSLT Кызматтар',
        heroTitle: 'Сенин теннисиң <span>ушул жерден башталат</span>',
        heroDesc: 'Бишкектеги мыкты корттор жана кесипкөй машыктыруучулар',
        courtsTitle: 'Корттор',
        coachesTitle: 'Машыктыруучулар',
        partnersTitle: 'Өнөктөш табуу',
        viewAllCourts: 'Бардык корттор',
        viewAllCoaches: 'Бардык машыктыруучулар',
        viewAllPartners: 'Бардык өнөктөштөр',
        details: 'Толугураак',
        surface: 'Жабуу',
        price: 'Баа',
        experience: 'Тажрыйба',
        level: 'Деңгээл',
        years: 'жыл',
        emptyCourts: 'Жеткиликтүү корттор жок',
        emptyCoaches: 'Жеткиликтүү машыктыруучулар жок',
        emptyPartners: 'Жеткиликтүү өнөктөштөр жок',
        from: 'дан',
        online: 'Онлайн',
        offline: 'Оффлайн',
        levelBeginner: 'Башталгыч',
        levelIntermediate: 'Орточо',
        levelAdvanced: 'Алдыңкы',
        levelUnknown: 'Деңгээл көрсөтүлгөн эмес'
    } : {
        heroTagline: 'KSLT Услуги',
        heroTitle: 'Ваш теннис <span>начинается здесь</span>',
        heroDesc: 'Лучшие корты и профессиональные тренеры Бишкека',
        courtsTitle: 'Корты',
        coachesTitle: 'Тренеры',
        partnersTitle: 'Найти партнёра',
        viewAllCourts: 'Все корты',
        viewAllCoaches: 'Все тренеры',
        viewAllPartners: 'Все партнёры',
        details: 'Подробнее',
        surface: 'Покрытие',
        price: 'Цена',
        experience: 'Опыт',
        level: 'Уровень',
        years: 'лет',
        emptyCourts: 'Нет доступных кортов',
        emptyCoaches: 'Нет доступных тренеров',
        emptyPartners: 'Нет доступных партнёров',
        from: 'от',
        online: 'Онлайн',
        offline: 'Оффлайн',
        levelBeginner: 'Начинающий',
        levelIntermediate: 'Средний',
        levelAdvanced: 'Продвинутый',
        levelUnknown: 'Уровень не указан'
    };

    var courtPage = isEn ? 'court-en.html' : (isKg ? 'court-kg.html' : 'court.html');
    var coachPage = isEn ? 'coach-en.html' : (isKg ? 'coach-kg.html' : 'coach.html');
    var courtsPage = isEn ? 'courts-en.html' : (isKg ? 'courts-kg.html' : 'courts.html');
    var coachesPage = isEn ? 'coaches-en.html' : (isKg ? 'coaches-kg.html' : 'coaches.html');
    var partnersPage = isEn ? 'partners-en.html' : (isKg ? 'partners-kg.html' : 'partners.html');

    var _courts = [];
    var _coaches = [];
    var _partners = [];

    var ONLINE_THRESHOLD = 5 * 60 * 1000;

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
        renderSponsors();
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

    // Promoted always included, rest random, limit total to cap
    function selectForDisplay(data, cap) {
        var promoted = [];
        var rest = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].promoted) {
                promoted.push(data[i]);
            } else {
                rest.push(data[i]);
            }
        }
        var remaining = Math.max(0, cap - promoted.length);
        return promoted.concat(shuffle(rest).slice(0, remaining));
    }

    async function loadData() {
        var courts = null;
        var coaches = null;
        var partners = null;

        if (client) {
            try {
                var cResult = await client.from('courts')
                    .select('id, name, name_en, photo, street, street_en, building, district, district_en, city, city_en, court_types, partner, promoted');
                if (cResult.data && cResult.data.length > 0) {
                    courts = selectForDisplay(cResult.data, 10);
                }
            } catch(e) {
                console.error('Supabase courts error:', e);
            }

            try {
                var chResult = await client.from('coaches')
                    .select('id, last_name, first_name, last_name_en, first_name_en, name, name_en, photo, position, position_en, tags, experience, price, court, court_en, promoted, partner');
                if (chResult.data && chResult.data.length > 0) {
                    coaches = selectForDisplay(chResult.data, 10);
                }
            } catch(e) {
                console.error('Supabase coaches error:', e);
            }

            try {
                var pResult = await client.rpc('get_public_partners');
                if (pResult.data && pResult.data.length > 0) {
                    partners = shuffle(pResult.data).slice(0, 10);
                }
            } catch(e) {
                console.error('Supabase partners error:', e);
            }
        }

        _courts = courts || [];
        _coaches = coaches || [];
        _partners = partners || [];

        // Load max discounts for partner courts + coaches
        if (client && (_courts.length || _coaches.length)) {
            try {
                var dsResult = await client.from('partner_services')
                    .select('entity_type, entity_id, discount_percent');
                if (dsResult.data && dsResult.data.length) {
                    var courtMap = {};
                    var coachMap = {};
                    dsResult.data.forEach(function(s) {
                        var map = s.entity_type === 'court' ? courtMap : coachMap;
                        if (!map[s.entity_id] || s.discount_percent > map[s.entity_id]) {
                            map[s.entity_id] = s.discount_percent;
                        }
                    });
                    _courts.forEach(function(c) {
                        if (c.partner && courtMap[c.id]) c._maxDiscount = courtMap[c.id];
                    });
                    _coaches.forEach(function(c) {
                        if (c.partner && coachMap[c.id]) c._maxDiscount = coachMap[c.id];
                    });
                }
            } catch(e) {}
        }

        renderColumns();
    }

    function getCourtAddress(c) {
        var street = isEn ? (c.street_en || c.street) : (isKg ? (c.street_kg || c.street) : c.street);
        var district = isEn ? (c.district_en || c.district) : (isKg ? (c.district_kg || c.district) : c.district);
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
        if (isKg) {
            if (ch.name_kg) return ch.name_kg;
            if (ch.first_name_kg && ch.last_name_kg) return ch.first_name_kg + ' ' + ch.last_name_kg;
        }
        if (ch.name) return ch.name;
        return (ch.last_name || '') + ' ' + (ch.first_name || '');
    }

    function getCoachSpec(ch) {
        return isEn ? (ch.position_en || ch.position || '') : (isKg ? (ch.position_kg || ch.position || '') : (ch.position || ''));
    }

    function getCoachLevel(ch) {
        if (!ch.tags || !ch.tags.length) return '';
        var levelTags = [];
        if (ch.tags.indexOf('beginner') !== -1) levelTags.push(isEn ? 'Beginner' : (isKg ? 'Башталгыч' : 'Начинающие'));
        if (ch.tags.indexOf('advanced') !== -1) levelTags.push(isEn ? 'Advanced' : (isKg ? 'Алдыңкы' : 'Продвинутые'));
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

        // Partners section (centered below)
        html += '<div class="sv-section sv-partners-section" data-type="partners">';
        html += '<div class="sv-column-header">';
        html += '<h2 class="sv-column-title"><span>' + L.partnersTitle + '</span></h2>';
        html += '<a href="' + partnersPage + '" class="sv-view-all">' + L.viewAllPartners + ' ' + arrowSvg + '</a>';
        html += '</div>';
        if (_partners.length === 0) {
            html += '<div class="sv-empty">' + emptySvg + '<p>' + L.emptyPartners + '</p></div>';
        } else {
            html += '<div class="sv-card-grid">';
            html += renderFeaturedPartner(_partners[0]);
            if (_partners.length > 1) {
                html += renderCarousel(_partners.slice(1), 'partners');
            }
            html += '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
        attachEvents();

        // Normalize carousel speed: ~4s per item so all scroll at the same rate
        var carousels = container.querySelectorAll('.sv-carousel');
        carousels.forEach(function(car) {
            var itemCount = car.children.length / 2;
            if (itemCount > 0) {
                car.style.animationDuration = (itemCount * 4) + 's';
            }
        });

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
                } else if (type === 'coaches') {
                    html += renderCompactCoach(items[i], i + 1);
                } else {
                    html += renderCompactPartner(items[i], i + 1);
                }
            }
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    // --- Featured Court ---
    function renderFeaturedCourt(c) {
        var name = isEn ? (c.name_en || c.name) : (isKg ? (c.name_kg || c.name) : c.name);
        var addr = getCourtAddress(c);
        var surface = getCourtSurface(c);
        var price = getCourtMinPrice(c);
        var photo = c.photo || '';
        var href = courtPage + '?id=' + c.id;

        var discountHtml = c._maxDiscount ? '<span class="sv-discount-overlay">\uD83C\uDFF7\uFE0F ' + (isEn ? 'up to' : isKg ? 'чейин' : 'до') + ' -' + c._maxDiscount + '%</span>' : '';

        return '<a class="sv-featured" href="' + href + '">' +
            (photo
                ? '<div class="sv-featured-bg"><img src="' + photo + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>'
                : '<div class="sv-featured-overlay" style="background:var(--bg-card)"></div>') +
            discountHtml +
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
        var discountHtml = ch._maxDiscount ? '<span class="sv-discount-overlay">\uD83C\uDFF7\uFE0F ' + (isEn ? 'up to' : isKg ? 'чейин' : 'до') + ' -' + ch._maxDiscount + '%</span>' : '';

        return '<a class="sv-featured" href="' + href + '">' +
            (photo
                ? '<div class="sv-featured-bg"><img src="' + photo + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>'
                : '<div class="sv-featured-overlay" style="background:var(--bg-card)"></div>') +
            discountHtml +
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
        var name = isEn ? (c.name_en || c.name) : (isKg ? (c.name_kg || c.name) : c.name);
        var addr = getCourtAddress(c);
        var price = getCourtMinPrice(c);
        var photo = c.photo || '';

        var discountSm = c._maxDiscount ? '<span class="sv-discount-overlay-sm">-' + c._maxDiscount + '%</span>' : '';

        return '<div class="sv-compact" data-type="courts" data-idx="' + idx + '">' +
            '<div class="sv-compact-img-wrap">' +
                (photo
                    ? '<img class="sv-compact-photo" src="' + photo + '" alt="" loading="lazy">'
                    : '<div class="sv-compact-icon">' + courtSvg + '</div>') +
                discountSm +
            '</div>' +
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
        var discountSm = ch._maxDiscount ? '<span class="sv-discount-overlay-sm">-' + ch._maxDiscount + '%</span>' : '';

        return '<div class="sv-compact" data-type="coaches" data-idx="' + idx + '">' +
            '<div class="sv-compact-img-wrap">' +
                (photo
                    ? '<img class="sv-compact-avatar" src="' + photo + '" alt="" loading="lazy">'
                    : '<div class="sv-compact-icon">' + courtSvg + '</div>') +
                discountSm +
            '</div>' +
            '<h4>' + name + '</h4>' +
            (spec ? '<div class="sv-compact-sub">' + spec + '</div>' : '') +
            (price ? '<div class="sv-compact-price">' + price + '</div>' : '') +
        '</div>';
    }

    // --- Partner helpers ---
    function isOnline(lastSeen) {
        if (!lastSeen) return false;
        return (new Date() - new Date(lastSeen)) < ONLINE_THRESHOLD;
    }

    function getPartnerName(p) {
        return p.full_name || '';
    }

    function getPartnerLevel(p) {
        var category = isEn ? (p.category_name_en || p.category_name) : (isKg ? (p.category_name_kg || p.category_name) : p.category_name);
        if (category) return category;
        var levelMap = { beginner: L.levelBeginner, intermediate: L.levelIntermediate, advanced: L.levelAdvanced };
        return (p.play_level && levelMap[p.play_level]) || L.levelUnknown;
    }

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
    }

    // --- Featured Partner ---
    function renderFeaturedPartner(p) {
        var name = getPartnerName(p);
        var level = getPartnerLevel(p);
        var online = isOnline(p.last_seen);
        var href = partnersPage;

        var avatarHtml;
        if (p.avatar_url) {
            avatarHtml = '<div class="sv-featured-bg"><img src="' + p.avatar_url + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>';
        } else {
            avatarHtml = '<div class="sv-featured-overlay" style="background:var(--bg-card)"></div>';
        }

        return '<a class="sv-featured" href="' + href + '">' +
            avatarHtml +
            '<div class="sv-featured-content">' +
                (p.avatar_url ? '<img class="sv-coach-avatar" src="' + p.avatar_url + '" alt="" loading="lazy">' : '<div class="sv-partner-initials">' + getInitials(name) + '</div>') +
                '<h3>' + name + '</h3>' +
                '<div class="sv-featured-meta">' +
                    '<span class="sv-partner-status ' + (online ? 'online' : 'offline') + '">' +
                        '<span class="sv-partner-dot"></span>' + (online ? L.online : L.offline) +
                    '</span>' +
                '</div>' +
                '<div class="sv-featured-details">' +
                    '<div class="sv-featured-detail"><span class="sv-label">' + L.level + '</span><span class="sv-value">' + level + '</span></div>' +
                '</div>' +
                '<span class="sv-featured-link">' + L.details + '</span>' +
            '</div>' +
        '</a>';
    }

    // --- Compact Partner (card for carousel) ---
    function renderCompactPartner(p, idx) {
        var name = getPartnerName(p);
        var level = getPartnerLevel(p);
        var online = isOnline(p.last_seen);

        var avatarHtml;
        if (p.avatar_url) {
            avatarHtml = '<img class="sv-compact-avatar" src="' + p.avatar_url + '" alt="" loading="lazy">';
        } else {
            avatarHtml = '<div class="sv-compact-initials">' + getInitials(name) + '</div>';
        }

        return '<div class="sv-compact" data-type="partners" data-idx="' + idx + '">' +
            '<div class="sv-compact-partner-head">' +
                avatarHtml +
                (online ? '<span class="sv-compact-online-dot"></span>' : '') +
            '</div>' +
            '<h4>' + name + '</h4>' +
            '<div class="sv-compact-sub">' + level + '</div>' +
        '</div>';
    }

    // --- Re-render a single section ---
    function renderSection(type) {
        var items = type === 'courts' ? _courts : (type === 'coaches' ? _coaches : _partners);
        var section = document.querySelector('.sv-section[data-type="' + type + '"]');
        if (!section) return;

        var grid = section.querySelector('.sv-card-grid');
        if (!grid || !items.length) return;

        var html = '';
        if (type === 'courts') {
            html += renderFeaturedCourt(items[0]);
            if (items.length > 1) html += renderCarousel(items.slice(1), 'courts');
        } else if (type === 'coaches') {
            html += renderFeaturedCoach(items[0]);
            if (items.length > 1) html += renderCarousel(items.slice(1), 'coaches');
        } else {
            html += renderFeaturedPartner(items[0]);
            if (items.length > 1) html += renderCarousel(items.slice(1), 'partners');
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

                var items = type === 'courts' ? _courts : (type === 'coaches' ? _coaches : _partners);
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

    // --- Sponsors ---
    function renderSponsors() {
        var container = document.getElementById('svSponsors');
        if (!container) return;

        var title = isEn ? 'Partners & Sponsors' : (isKg ? 'ӨНӨКТӨШТӨР ЖАНА ДЕМӨӨРЧҮЛӨР' : 'ПАРТНЁРЫ И СПОНСОРЫ');
        var generalLabel = isEn ? 'GENERAL SPONSOR' : (isKg ? 'БАШ ДЕМӨӨРЧҮ' : 'ГЕНЕРАЛЬНЫЙ СПОНСОР');

        container.innerHTML =
            '<div class="section-header"><h2>' + title + '</h2></div>' +
            '<div class="sponsor-hero">' +
                '<span class="sponsor-hero-label">' + generalLabel + '</span>' +
                '<a href="https://nurzaman.kg" target="_blank" rel="noopener" class="sponsor-hero-logo">' +
                    '<img src="https://nurzaman.kg/wp-content/themes/nur/img/nur-logonew.png" alt="Nurzaman">' +
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

})();
