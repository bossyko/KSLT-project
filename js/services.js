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
        heroTitle: 'Your tennis starts here',
        heroDesc: 'Best courts and professional coaches in Kyrgyzstan',
        courtsTitle: 'Courts',
        coachesTitle: 'Coaches',
        partnersTitle: 'Player Search',
        invite: 'Invite to play', online: 'online recently',
        seenNow: 'Online', seenToday: 'Was here today', seenYesterday: 'Was here yesterday',
        seenDays: 'Was here {n} d. ago', seenLong: 'Has not been here for a while',
        viewAllCourts: 'All courts',
        viewAllCoaches: 'All coaches',
        viewAllPartners: 'All players',
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
        heroTitle: 'Сенин теннисиң ушул жерден башталат',
        heroDesc: 'Кыргызстандагы мыкты корттор жана кесипкөй машыктыруучулар',
        courtsTitle: 'Корттор',
        coachesTitle: 'Машыктыруучулар',
        partnersTitle: 'Оюнчу издөө',
        invite: 'Оюнга чакыруу', online: 'жакында кирген',
        seenNow: 'Тармакта', seenToday: 'Бүгүн кирген', seenYesterday: 'Кечээ кирген',
        seenDays: '{n} күн мурун', seenLong: 'Көптөн бери кирген жок',
        viewAllCourts: 'Бардык корттор',
        viewAllCoaches: 'Бардык машыктыруучулар',
        viewAllPartners: 'Бардык оюнчулар',
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
        offline: 'Офлайн',
        levelBeginner: 'Башталгыч',
        levelIntermediate: 'Орточо',
        levelAdvanced: 'Алдыңкы',
        levelUnknown: 'Деңгээл көрсөтүлгөн эмес'
    } : {
        heroTagline: 'KSLT Услуги',
        heroTitle: 'Ваш теннис начинается здесь',
        heroDesc: 'Лучшие корты и профессиональные тренеры Кыргызстана',
        courtsTitle: 'Корты',
        coachesTitle: 'Тренеры',
        partnersTitle: 'Поиск игрока',
        invite: 'Предложить игру', online: 'недавно заходил',
        seenNow: 'В сети', seenToday: 'Был сегодня', seenYesterday: 'Был вчера',
        seenDays: 'Был {n} дн. назад', seenLong: 'Давно не заходил',
        viewAllCourts: 'Все корты',
        viewAllCoaches: 'Все тренеры',
        viewAllPartners: 'Все игроки',
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
        offline: 'Офлайн',
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

    /** Сколько игроков показываем в ленте на «Услугах» */
    var PARTNERS_IN_STRIP = 10;

    /** Тасуем список, не трогая исходный массив */
    function shuffle(list) {
        var out = list.slice();
        for (var i = out.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = out[i]; out[i] = out[j]; out[j] = t;
        }
        return out;
    }

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
        var heroImg = '../images/heroes/services.jpg';
        el.innerHTML =
            '<div class="sv-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="sv-hero-overlay"></div>' +
            '<div class="sv-hero-content">' +
                // Метки над заголовком нет: она повторяла раздел, который
                // и так подсвечен в меню — как на страницах турниров
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

                    // Рейтинг и пол лежат в карточках игроков, а не в профилях:
                    // тем же вторым запросом их берёт страница «Поиск игрока»
                    var ids = partners.map(function(x) { return x.id; });
                    var plRes = await client.from('players')
                        .select('id, ntrp_rating, gender')
                        .in('id', ids);
                    var plMap = {};
                    (plRes.data || []).forEach(function(x) { plMap[x.id] = x; });
                    partners.forEach(function(x) {
                        var pl = plMap[x.id];
                        if (!pl) return;
                        x.ntrp_rating = pl.ntrp_rating;
                        if (pl.gender) x.gender = pl.gender;
                    });
                }
            } catch(e) {
                console.error('Supabase partners error:', e);
            }
        }

        _courts = courts || [];
        _coaches = coaches || [];
        // Игроков в базе три сотни, а в ленту помещается десяток. Берём их
        // вперемешку и не больше десяти: при каждом заходе на странице
        // оказываются разные люди, а не одни и те же первые по алфавиту
        _partners = shuffle(partners || []).slice(0, PARTNERS_IN_STRIP);

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
        html += '<h2 class="sv-column-title">' + L.courtsTitle + '</h2>';
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
        html += '<h2 class="sv-column-title">' + L.coachesTitle + '</h2>';
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
        html += '<h2 class="sv-column-title">' + L.partnersTitle + '</h2>';
        html += '<a href="' + partnersPage + '" class="sv-view-all">' + L.viewAllPartners + ' ' + arrowSvg + '</a>';
        html += '</div>';
        if (_partners.length === 0) {
            html += '<div class="sv-empty">' + emptySvg + '<p>' + L.emptyPartners + '</p></div>';
        } else {
            // Десять игроков вперемешку, новые при каждой загрузке. Без
            // движения: бегущая лента мешала прочитать карточку и нажать
            html += '<div class="sv-players-box">';
            for (var pi = 0; pi < _partners.length; pi++) {
                html += renderCompactPartner(_partners[pi], pi);
            }
            html += '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
        attachEvents();
        revealTelegramMarks();

        // Скорость ленты как у спонсоров на главной: там на карточку уходит
        // примерно двенадцать секунд, и имена успеваешь прочитать. Было
        // четыре — лента пролетала мимо
        var carousels = container.querySelectorAll('.sv-carousel');
        carousels.forEach(function(car) {
            var itemCount = car.children.length / 2;
            if (itemCount > 0) {
                car.style.animationDuration = (itemCount * 12) + 's';
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

    /**
     * Карточка игрока: категория крупно в углу, зелёная точка у тех, кто
     * заходил недавно, и кнопка «Предложить игру».
     *
     * Раньше это была ровная плитка с именем и подписью — блок читался как
     * таблица, и по нему было не понять, с кем стоит играть.
     */
    function renderCompactPartner(p, idx) {
        var name = getPartnerName(p);
        var level = getPartnerLevel(p);
        var online = isOnline(p.last_seen);

        var avatarHtml;
        if (p.avatar_url) {
            avatarHtml = '<img class="sv-player-ava" src="' + p.avatar_url + '" alt="" loading="lazy">';
        } else {
            avatarHtml = '<div class="sv-player-ava sv-player-initials">' + getInitials(name) + '</div>';
        }

        // Пол, уровень игры и когда человек последний раз заходил — то, по
        // чему решают, звать его или нет. Без этого карточка была витриной
        // В профилях пол пишут как female/male, в карточках игроков — women/men
        var g = String(p.gender || '');
        var genderMark = (g === 'female' || g === 'women') ? '\u2640'
            : ((g === 'male' || g === 'men') ? '\u2642' : '');
        var playLevel = levelLabel(p.play_level);
        var seen = lastSeenLabel(p.last_seen);

        return '<div class="sv-player" data-type="partners" data-idx="' + idx + '">' +
            '<span class="sv-player-cat">' + level + '</span>' +
            (p.ntrp_rating ? '<span class="sv-player-ntrp">' + p.ntrp_rating +
                '<small>NTRP</small></span>' : '') +
            '<div class="sv-player-ava-wrap">' +
                avatarHtml +
                (online ? '<span class="sv-player-dot" title="' + L.online + '"></span>' : '') +
            '</div>' +
            '<div class="sv-player-name">' +
                (genderMark ? '<span class="sv-player-gender">' + genderMark + '</span> ' : '') + name +
            '</div>' +
            (playLevel ? '<div class="sv-player-level">' + playLevel + '</div>' : '') +
            '<div class="sv-player-seen' + (online ? ' is-online' : '') + '">' + seen + '</div>' +
            // Значок Telegram виден только членам КСЛТ: гостю знать, у кого
            // есть телеграм, незачем — это личные данные человека
            '<button class="sv-player-btn" type="button">' +
                (p.has_telegram ? '<span class="sv-tg-mark" hidden>' + tgIconSmall + '</span>' : '') +
                L.invite +
            '</button>' +
        '</div>';
    }

    var tgIconSmall = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px;vertical-align:-2px"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>';

    /**
     * Значки Telegram открываем только тем, у кого действующее членство.
     * Проверяем один раз после отрисовки: до ответа значки скрыты.
     */
    function revealTelegramMarks() {
        var marks = document.querySelectorAll('.sv-tg-mark');
        if (!marks.length || typeof window.checkMembership !== 'function') return;
        window.checkMembership().then(function(info) {
            if (!info || !info.active) return;
            marks.forEach(function(el) { el.hidden = false; });
        }).catch(function() {});
    }

    /** Уровень игры словами; не задан — строку не рисуем вовсе */
    function levelLabel(lvl) {
        var map = { beginner: L.levelBeginner, intermediate: L.levelIntermediate, advanced: L.levelAdvanced };
        return map[lvl] || '';
    }

    /** «В сети», «был вчера», «был 3 дня назад» — насколько человек живой */
    function lastSeenLabel(lastSeen) {
        if (!lastSeen) return L.seenLong;
        var diff = Date.now() - new Date(lastSeen).getTime();
        if (diff < ONLINE_THRESHOLD) return L.seenNow;
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days < 1) return L.seenToday;
        if (days === 1) return L.seenYesterday;
        if (days < 30) return L.seenDays.replace('{n}', days);
        return L.seenLong;
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
            // Карточка в ленте открывает свою страницу. Раньше клик менял её
            // местами с крупной карточкой сверху — человек нажимал на корт и
            // оставался на той же странице, гадая, что произошло
            // Игрок: и карточка, и кнопка ведут на страницу поиска игрока,
            // там уже можно предложить игру
            var player = e.target.closest('.sv-player');
            if (player) {
                e.preventDefault();
                window.location.href = partnersPage;
                return;
            }

            var compact = e.target.closest('.sv-compact');
            if (compact) {
                e.preventDefault();
                var type = compact.dataset.type;
                var idx = parseInt(compact.dataset.idx, 10);
                if (!type || isNaN(idx)) return;

                var items = type === 'courts' ? _courts : (type === 'coaches' ? _coaches : _partners);
                var item = items[idx];
                if (!item) return;

                if (type === 'courts') window.location.href = courtPage + '?id=' + item.id;
                else if (type === 'coaches') window.location.href = coachPage + '?id=' + item.id;
                else window.location.href = partnersPage;
            }
        });
    }

    // --- Sponsors — loaded via sponsors-loader.js ---

})();
