(function() {
    'use strict';

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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

    /**
     * Номер хранится слитно: +996701111732. На странице показываем его
     * группами по правилам страны. Телефонов может быть несколько — они
     * лежат в одном поле через запятую.
     */
    function prettyPhone(value) {
        var v = String(value || '').trim();
        if (!v) return '';
        if (!window.KSLT_PHONE) return v;

        return v.split(',').map(function(part) {
            return KSLT_PHONE.pretty(part.trim());
        }).filter(Boolean).join(', ');
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
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var L_labels = window.courtsLabels || (isKg ? {
        heroTitle: 'Корттор',
        heroSubtitle: 'Кыргызстанда кайда ойноо керек: жабуу, баа, ижара',
        filterAll: 'Баары',
        filterIndoor: 'Жабык',
        filterOutdoor: 'Ачык',
        filterClay: 'Топурак',
        filterHard: 'Катуу',
        courts: 'корт',
        rating: 'рейтинг',
        priceFrom: 'дан',
        priceCurrency: 'сом/саат',
        detailsBtn: 'Толугураак',
        bookBtn: 'KSLT арзандатуу',
        aboutTitle: 'Аянтча жөнүндө',
        amenitiesTitle: 'Ыңгайлуулуктар',
        scheduleTitle: 'Тартип жана баалар',
        locationTitle: 'Жайгашкан жери',
        galleryTitle: 'Галерея',
        ctaTitle: 'KSLT мүчөлөрүнө арзандатуу',
        ctaText: 'Катталыңыз жана KSLT мүчөсү болуп, өнөктөш корттордо арзандатуу алыңыз',
        ctaBtn: 'Каттоо',
        ctaTextAuth: 'KSLT мүчөсү катары өнөктөш корттордо арзандатуу алыңыз',
        ctaBtnAuth: 'Арзандатуу көрүү',
        backBtn: 'Бардык корттор',
        partnerBadge: 'KSLT Өнөктөшү',
        surface: 'Жабуу',
        phone: 'Телефон',
        newBadge: 'Жаңы',
        filterType: 'Корт түрү',
        filterSurface: 'Жабуу',
        filterCarpet: 'Килем',
        filterGrass: 'Чөп',
        filterCity: 'Шаар',
        searchPlaceholder: 'Корт издөө...',
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
        noDiscountsConfigured: 'Арзандатуу жок',
        courtTypesTitle: 'Корт түрлөрү',
        thType: 'Түрү',
        thSurface: 'Жабуу',
        thQty: 'Саны',
        thPrice: 'Баасы',
        additionalServicesTitle: 'Кошумча кызматтар',
        thService: 'Кызмат',
        thServicePrice: 'Баасы'
    } : {
        heroTitle: "Корты",
        heroSubtitle: "Где играть в Кыргызстане: покрытие, цены, аренда",
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
        bookBtn: "Скидка KSLT",
        aboutTitle: "О площадке",
        amenitiesTitle: "Удобства",
        scheduleTitle: "Расписание и цены",
        locationTitle: "Расположение",
        galleryTitle: "Галерея",
        ctaTitle: "Скидки для членов KSLT",
        ctaText: "Зарегистрируйтесь и оформите членство, чтобы получать скидки у партнёрских кортов",
        ctaBtn: "Регистрация",
        ctaTextAuth: "Как член KSLT вы получаете скидки у партнёрских кортов и тренеров",
        ctaBtnAuth: "Смотреть скидки",
        backBtn: "Все корты",
        partnerBadge: "Партнёр KSLT",
        surface: "Покрытие",
        phone: "Телефон",
        newBadge: "Новый",
        filterType: "Тип корта",
        filterSurface: "Покрытие",
        filterCarpet: "Ковёр",
        filterGrass: "Трава",
        filterCity: "Город",
        searchPlaceholder: "Поиск корта...",
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
        noDiscountsConfigured: "Скидки пока не настроены",
        courtTypesTitle: "Типы кортов",
        thType: "Тип",
        thSurface: "Покрытие",
        thQty: "Кол-во",
        thPrice: "Цена",
        additionalServicesTitle: "Дополнительные услуги",
        thService: "Услуга",
        thServicePrice: "Цена"
    });

    var SURFACE_MAP = { hard: 'Хард', clay: 'Грунт', carpet: 'Ковёр', grass: 'Трава' };
    var SURFACE_MAP_EN = { hard: 'Hard', clay: 'Clay', carpet: 'Carpet', grass: 'Grass' };
    var SURFACE_MAP_KG = { hard: 'Катуу', clay: 'Топурак', carpet: 'Килем', grass: 'Чөп' };

    var staticData = window.courtsData || [];
    var data = staticData.slice(); // will be replaced after Supabase load

    var currentTypeFilter = 'all';
    var currentSurfaceFilter = 'all';
    var currentCityFilter = 'all';
    var _searchQuery = '';

    var _accessLevel = 'guest';
    var PER_PAGE = 20;
    var _currentPage = 1;
    var _toastTimer = null;

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

    function showMembershipModal(level) {
        var authLink = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
        var pricingLink = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');
        var isGuest = level === 'guest';

        var title = isGuest
            ? (isEn ? 'Become a KSLT Member' : isKg ? 'KSLT мүчөсү болуңуз' : 'Станьте членом KSLT')
            : (isEn ? 'Membership Required' : isKg ? 'Мүчөлүк керек' : 'Нужно членство');
        var text = isGuest
            ? (isEn ? 'Register and become a KSLT member to get discounts at partner courts and coaches' : isKg ? 'Катталыңыз жана KSLT мүчөсү болуп, өнөктөш корттордо арзандатуу алыңыз' : 'Зарегистрируйтесь и оформите членство KSLT, чтобы получать скидки у партнёрских кортов и тренеров')
            : (isEn ? 'Become a KSLT member to unlock discounts at partner courts and coaches' : isKg ? 'KSLT мүчөсү болуп, өнөктөш корттордо арзандатуу алыңыз' : 'Оформите членство KSLT, чтобы получать скидки у партнёрских кортов и тренеров');
        var btnText = isGuest
            ? (isEn ? 'Sign Up' : isKg ? 'Каттоо' : 'Регистрация')
            : (isEn ? 'View Plans' : isKg ? 'Тарифтар' : 'Тарифы');
        var btnLink = isGuest ? authLink : pricingLink;

        var overlay = document.createElement('div');
        overlay.className = 'ct-membership-overlay';
        var svgIcon = isGuest
            ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
            : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

        overlay.innerHTML =
            '<div class="ct-membership-modal">' +
                '<button class="ct-membership-close">&times;</button>' +
                '<div class="ct-membership-icon">' + svgIcon + '</div>' +
                '<h3>' + title + '</h3>' +
                '<p>' + text + '</p>' +
                '<a href="' + btnLink + '" class="ct-membership-btn">' + btnText + '</a>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        overlay.querySelector('.ct-membership-close').onclick = function() {
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

    function showToast(message, type) {
        var old = document.querySelector('.ct-toast');
        if (old) old.remove();
        if (_toastTimer) clearTimeout(_toastTimer);
        var toast = document.createElement('div');
        toast.className = 'ct-toast' + (type ? ' ' + type : '');
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

    var courtPage = window.location.pathname.indexOf('court.html') !== -1 || window.location.pathname.indexOf('court-en.html') !== -1 || window.location.pathname.indexOf('court-kg.html') !== -1;
    var isListPage = window.location.pathname.indexOf('courts.html') !== -1 || window.location.pathname.indexOf('courts-en.html') !== -1 || window.location.pathname.indexOf('courts-kg.html') !== -1;
    var isDetailPage = courtPage && !isListPage;

    // View counter for detail page (localStorage dedup)
    function incrementCourtView(id) {
        if (!id) return;
        var key = 'kslt_crtview_' + id;
        if (localStorage.getItem(key)) return;
        var cl = window.supabaseClient;
        if (!cl) return;
        cl.rpc('increment_court_view', { p_id: id }).then(function(res) {
            if (!res.error) localStorage.setItem(key, '1');
        });
    }

    if (isDetailPage) {
        initDetailPage();
        detectAccess();
        loadSupabaseCourts(function(dbCourts) {
            if (dbCourts.length) {
                // База — единственный источник. Заготовки из data/courts-data.js
                // остаются только на случай, когда база недоступна: иначе на
                // сайте живут пять выдуманных кортов, которых нет в админке
                data = dbCourts;
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
                    incrementCourtView(id);
                }
            }
        });
    } else {
        initListPage();
        loadSupabaseCourts(function(dbCourts) {
            if (dbCourts.length) {
                data = sortPromotedFirst(dbCourts);
                refreshDropdowns();
                loadMaxDiscounts(function() {
                    renderGrid();
                });
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

    function loadMaxDiscounts(callback) {
        var client = window.supabaseClient || null;
        if (!client) { callback(); return; }
        try {
            client.from('partner_services')
                .select('entity_id, discount_percent')
                .eq('entity_type', 'court')
                .then(function(res) {
                    if (res.data && res.data.length) {
                        var maxMap = {};
                        res.data.forEach(function(s) {
                            if (!maxMap[s.entity_id] || s.discount_percent > maxMap[s.entity_id]) {
                                maxMap[s.entity_id] = s.discount_percent;
                            }
                        });
                        data.forEach(function(c) {
                            if (c._isDb && c.partner && maxMap[c.id]) {
                                c._maxDiscount = maxMap[c.id];
                            }
                        });
                    }
                    callback();
                })
                .catch(function() { callback(); });
        } catch(e) { callback(); }
    }

    function mapDbCourt(row) {
        var courtTypes = row.court_types || [];
        // Determine primary type
        var hasIndoor = courtTypes.some(function(ct) { return ct.type === 'indoor'; });
        var hasOutdoor = courtTypes.some(function(ct) { return ct.type === 'outdoor'; });
        var primaryType = hasIndoor ? 'indoor' : 'outdoor';

        // Surface from first court type
        var surfaceKey = courtTypes.length ? (courtTypes[0].surface || '') : '';
        var surface = surfaceKey ? (isEn ? (SURFACE_MAP_EN[surfaceKey] || surfaceKey) : isKg ? (SURFACE_MAP_KG[surfaceKey] || surfaceKey) : (SURFACE_MAP[surfaceKey] || surfaceKey)) : '';

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
        var street = isEn ? (row.street_en || row.street) : isKg ? (row.street_kg || row.street) : row.street;
        if (street) parts.push(street);
        if (row.building) parts.push(row.building);
        var city = isEn ? (row.city_en || row.city) : isKg ? (row.city_kg || row.city || 'Бишкек') : (row.city || 'Бишкек');
        if (city) parts.push(city);
        var address = parts.join(', ');

        // Description
        var desc = isEn ? (row.description_en || row.description || '') : isKg ? (row.description_kg || row.description || '') : (row.description || '');
        var shortDesc = desc.length > 120 ? desc.substr(0, 120) + '...' : desc;

        // Name
        var name = isEn ? (row.name_en || row.name) : isKg ? (row.name_kg || row.name) : row.name;

        // Amenities — map keys to labels
        var AMENITY_LABELS = {
            locker_rooms: isEn ? 'Locker rooms' : isKg ? 'Кийим алмаштыруучу' : 'Раздевалки',
            showers: isEn ? 'Showers' : isKg ? 'Душ' : 'Душевые',
            parking: isEn ? 'Parking' : isKg ? 'Токтоочу жай' : 'Парковка',
            racket_rental: isEn ? 'Racket rental' : isKg ? 'Ракетка ижарасы' : 'Прокат ракеток',
            pro_shop: 'Pro-shop',
            cafe: isEn ? 'Café' : isKg ? 'Кафе' : 'Кафе',
            gym: isEn ? 'Gym' : isKg ? 'Спорт зал' : 'Тренажёрный зал',
            pool: isEn ? 'Pool' : isKg ? 'Бассейн' : 'Бассейн',
            sauna: isEn ? 'Sauna' : isKg ? 'Сауна' : 'Сауна',
            climate: isEn ? 'Climate control' : isKg ? 'Климат-контроль' : 'Климат-контроль',
            lighting: isEn ? 'Lighting' : isKg ? 'Кечки жарык' : 'Вечернее освещение',
            kids_area: isEn ? 'Kids area' : isKg ? 'Балдар аянтчасы' : 'Детская площадка',
            kids_school: isEn ? 'Kids school' : isKg ? 'Балдар мектеби' : 'Детская школа',
            video: isEn ? 'Video' : isKg ? 'Видео талдоо' : 'Видеоанализ',
            wifi: 'Wi-Fi',
            benches: isEn ? 'Benches' : isKg ? 'Отургучтар' : 'Скамейки'
        };
        var amenities = (row.amenities || []).map(function(key) {
            return AMENITY_LABELS[key] || key;
        });

        // Type labels for mixed courts
        var typeDesc = '';
        if (hasIndoor && hasOutdoor) {
            typeDesc = (isEn ? 'Indoor + Outdoor' : isKg ? 'Жабык + Ачык' : 'Крытый + Открытый');
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
            instagram: row.instagram || '',
            whatsapp: row.whatsapp || '',
            shortDesc: shortDesc,
            description: desc,
            amenities: amenities,
            schedule: {},
            partner: row.partner || false,
            google_maps_url: row.google_maps_url || '',
            twogis_url: row.twogis_url || '',
            _additionalServices: row.additional_services || [],
            _isNew: true,
            _isDb: true,
            city: isEn ? (row.city_en || row.city || '') : (isKg ? (row.city_kg || row.city || '') : (row.city || '')),
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
        renderGrid();
        initSearchInput();
        initFilterClicks();
        initPaginationClicks();
        initCtaClicks();
        initScrollAnimations();
        detectAccess();
    }

    function renderHero() {
        var hero = document.getElementById('courtsHero');
        if (!hero) return;
        hero.innerHTML =
            '<div class="ct-hero-bg" style="background-image: url(\'../images/heroes/courts.jpg\')"></div>' +
            '<div class="ct-hero-content">' +
                '<h1 class="ct-hero-title">' + L_labels.heroTitle + '</h1>' +
                '<p class="ct-hero-subtitle">' + L_labels.heroSubtitle + '</p>' +
            '</div>';
    }

    /**
     * Города и покрытия — выпадающими списками, а не рядом кнопок: рядом
     * они не помещались в строку, а городов со временем станет больше.
     * В списке только то, что есть у кортов на самом деле, и рядом счётчик.
     */
    function dropdownOptions(kind) {
        var counts = {};
        var order = [];

        if (kind === 'city') {
            applyFilters('city').forEach(function(c) {
                if (!c.city) return;
                if (counts[c.city] === undefined) { counts[c.city] = 0; order.push(c.city); }
                counts[c.city]++;
            });
            order.sort(function(a, b) { return counts[b] - counts[a]; });
            return order.map(function(city) {
                return { value: city, label: city, count: counts[city] };
            });
        }

        var labels = {
            hard: L_labels.filterHard,
            clay: L_labels.filterClay,
            carpet: L_labels.filterCarpet,
            grass: L_labels.filterGrass
        };
        var pool = applyFilters('surface');
        ['hard', 'clay', 'carpet', 'grass'].forEach(function(key) {
            var n = pool.filter(function(c) { return hasSurface(c, key); }).length;
            if (n) order.push({ value: key, label: labels[key], count: n });
        });
        return order;
    }

    function dropdownHtml(kind) {
        var options = dropdownOptions(kind);
        if (!options.length) return '';

        var allLabel = kind === 'city' ? L_labels.filterCity : L_labels.filterSurface;
        var current = kind === 'city' ? currentCityFilter : currentSurfaceFilter;

        if (current !== 'all' && !options.some(function(o) { return o.value === current; })) {
            var labelsMap = {
                hard: L_labels.filterHard, clay: L_labels.filterClay,
                carpet: L_labels.filterCarpet, grass: L_labels.filterGrass
            };
            options = options.concat([{ value: current, label: labelsMap[current] || current, count: 0 }]);
        }

        var title = allLabel;
        options.forEach(function(o) { if (o.value === current) title = o.label; });

        var items = '<button class="ct-dd-item' + (current === 'all' ? ' active' : '') +
            '" data-dd-value="all">' + allLabel + '</button>';
        options.forEach(function(o) {
            items += '<button class="ct-dd-item' + (o.value === current ? ' active' : '') +
                '" data-dd-value="' + esc(o.value) + '">' + esc(o.label) +
                '<span class="ct-dd-count">' + o.count + '</span></button>';
        });

        return '<div class="ct-dd" data-dd="' + kind + '">' +
            '<button class="trn-chip ct-dd-toggle' + (current !== 'all' ? ' active' : '') + '">' +
                esc(title) +
                '<svg class="ct-dd-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="ct-dd-menu">' + items + '</div>' +
        '</div>';
    }

    function renderFilters() {
        var container = document.getElementById('courtsFilters');
        if (!container) return;

        // Полоса та же, что на страницах категорий турниров: общий вид на
        // весь сайт. Классы trn- лежат в style.css
        container.className = 'trn-filters';

        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');

        // Возврат живёт ВНУТРИ прилипающего блока с поиском и фильтрами.
        // Стоя над ним, он уезжал при первой же прокрутке
        var html =
            '<div class="trn-filters-inner">' +
                '<a href="' + servicesLink + '" class="kslt-back trn-back">\u2190 ' +
                    (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги')) + '</a>' +
                '<div class="trn-search-wrap">' +
                    '<svg class="trn-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                    '<input type="text" class="trn-search-input" id="courtsSearch" placeholder="' + L_labels.searchPlaceholder + '" autocomplete="off">' +
                '</div>' +
                '<div class="trn-chips" id="courtsChips">' +
                    '<button class="trn-chip active ct-filter-btn" data-filter-type="all">' + L_labels.filterAll + '</button>' +
                    '<button class="trn-chip ct-filter-btn" data-filter-type="indoor">' + L_labels.filterIndoor + '</button>' +
                    '<button class="trn-chip ct-filter-btn" data-filter-type="outdoor">' + L_labels.filterOutdoor + '</button>' +
                    '<span class="trn-chip-div"></span>' +
                    dropdownHtml('city') +
                    dropdownHtml('surface') +
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

    function hasSurface(c, key) {
        if (c._courtTypes) return c._courtTypes.some(function(ct) { return ct.surface === key; });
        var surfMap = { hard: ['Хард', 'Hard'], clay: ['Грунт', 'Clay'], carpet: ['Ковёр', 'Carpet'], grass: ['Трава', 'Grass'] };
        return (surfMap[key] || []).indexOf(c.surface) !== -1;
    }

    /**
     * Отбор кортов по всем фильтрам сразу. skip нужен для счётчиков в
     * выпадающих списках: считая города, собственный фильтр города не
     * применяем — иначе в списке останется один пункт, тот же самый.
     */
    function applyFilters(skip) {
        var filtered = data;

        if (_searchQuery) {
            var q = _searchQuery.toLowerCase();
            filtered = filtered.filter(function(c) {
                return (c.name && c.name.toLowerCase().indexOf(q) !== -1) ||
                       (c.address && c.address.toLowerCase().indexOf(q) !== -1) ||
                       (c.surface && c.surface.toLowerCase().indexOf(q) !== -1) ||
                       (c.city && c.city.toLowerCase().indexOf(q) !== -1);
            });
        }

        if (skip !== 'type') {
            if (currentTypeFilter === 'indoor') {
                filtered = filtered.filter(function(c) { return c.type === 'indoor' || c._hasIndoor; });
            } else if (currentTypeFilter === 'outdoor') {
                filtered = filtered.filter(function(c) { return c.type === 'outdoor' || c._hasOutdoor; });
            }
        }

        if (skip !== 'city' && currentCityFilter !== 'all') {
            filtered = filtered.filter(function(c) { return c.city === currentCityFilter; });
        }

        if (skip !== 'surface' && currentSurfaceFilter !== 'all') {
            filtered = filtered.filter(function(c) { return hasSurface(c, currentSurfaceFilter); });
        }

        return filtered;
    }

    function renderGrid() {
        var container = document.getElementById('courtsGrid');
        if (!container) return;

        var filtered = applyFilters();

        var start = (_currentPage - 1) * PER_PAGE;
        var pageItems = filtered.slice(start, start + PER_PAGE);

        var detailBase = isEn ? 'court-en.html' : (isKg ? 'court-kg.html' : 'court.html');

        var html = '<div class="ct-grid">';
        pageItems.forEach(function(c) {
            var typeLabel = c._typeDesc || (c.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor);
            var newBadge = c._isNew ? '<span class="ct-new-badge">' + L_labels.newBadge + '</span>' : '';
            var promoBadge = c._promoted ? '<span class="kslt-recommended-badge">' + L_labels.recommendedBadge + '</span>' : '';
            var discountBadge = c._maxDiscount ? '<span class="ct-discount-overlay">\uD83C\uDFF7\uFE0F ' + (isEn ? 'up to' : isKg ? 'чейин' : 'до') + ' -' + c._maxDiscount + '%</span>' : '';

            html += '<a href="' + detailBase + '?id=' + c.id + '" class="ct-card ct-fade-in' + (c._promoted ? ' kslt-promoted-card' : '') + '">' +
                '<div class="ct-card-img-wrap">' +
                    '<img src="' + esc(c.photo) + '" alt="' + esc(c.name) + '" class="ct-card-img" loading="lazy">' +
                    newBadge +
                    promoBadge +
                    discountBadge +
                '</div>' +
                '<div class="ct-card-body">' +
                    '<div class="ct-card-top">' +
                        '<div class="ct-card-name">' + c.name + '</div>' +
                        (c.partner ? '<span class="ct-card-partner">' + L_labels.partnerBadge + '</span>' : '') +
                    '</div>' +
                    '<div class="ct-card-type">' + typeLabel + (c.surface ? ' \u00b7 ' + c.surface : '') + '</div>' +
                    '<div class="ct-card-desc">' + (c.shortDesc || '') + '</div>' +
                    '<div class="ct-card-stats">' +
                        '<div class="ct-card-stat"><div class="ct-card-stat-num">' + c.courtsCount + '</div><div class="ct-card-stat-label">' + L_labels.courts + '</div></div>' +
                        (c.rating ? '<div class="ct-card-stat"><div class="ct-card-stat-num">\u2605 ' + c.rating + '</div><div class="ct-card-stat-label">' + L_labels.rating + '</div></div>' : '') +
                    '</div>' +
                    (c.price ? '<div class="ct-card-price">' + L_labels.priceFrom + ' <strong>' + c.price + '</strong> ' + L_labels.priceCurrency + '</div>' : '') +
                    '<div class="ct-card-actions">' +
                        '<span class="ct-card-btn">' + L_labels.detailsBtn + ' \u2192</span>' +
                        // Кнопка скидки только у партнёров: у остальных она вела
                        // в тупик — гостя звали оформить членство, а член клуба
                        // упирался в «скидки не настроены»
                        (c.partner ? '<span class="ct-card-cta" data-id="' + c.id + '">' + L_labels.bookBtn + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</a>';
        });
        html += '</div>';
        container.innerHTML = html;
        renderPagination(filtered.length, _currentPage);
        initScrollAnimations();
    }

    // ---- PAGINATION ----
    function renderPagination(total, page) {
        var container = document.getElementById('courtsPagination');
        if (!container) return;

        var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        var prevLabel = isEn ? '\u2190 Back' : (isKg ? '\u2190 Артка' : '\u2190 Назад');
        var nextLabel = isEn ? 'Next \u2192' : (isKg ? 'Кийинки \u2192' : 'Далее \u2192');
        var html = '<div class="ct-pagination">';
        html += '<button class="ct-page-btn ct-page-prev"' + (page === 1 ? ' disabled' : '') + '>' + prevLabel + '</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ct-page-btn ct-page-num' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="ct-page-btn ct-page-next"' + (page === totalPages ? ' disabled' : '') + '>' + nextLabel + '</button>';
        html += '</div>';
        container.innerHTML = html;
    }

    function initPaginationClicks() {
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.ct-page-btn');
            if (!btn || btn.disabled) return;

            if (btn.classList.contains('ct-page-prev')) {
                _currentPage = Math.max(1, _currentPage - 1);
            } else if (btn.classList.contains('ct-page-next')) {
                _currentPage++;
            } else if (btn.dataset.page) {
                _currentPage = parseInt(btn.dataset.page);
            }
            renderGrid();
            var gridEl = document.getElementById('courtsGrid');
            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ---- SPONSORS — loaded via sponsors-loader.js ----

    function initCtaClicks() {
        var grid = document.getElementById('courtsGrid');
        if (!grid) return;
        grid.addEventListener('click', function(e) {
            var cta = e.target.closest('.ct-card-cta');
            if (!cta) return;
            e.preventDefault();
            e.stopPropagation();

            if (_accessLevel === 'guest') {
                showMembershipModal('guest');
                return;
            }
            if (_accessLevel === 'registered') {
                showMembershipModal('registered');
                return;
            }
            // Member: inline voucher generation
            var id = cta.getAttribute('data-id');
            ctaLoadServices(cta, 'court', id);
        });
    }

    async function ctaLoadServices(btnEl, entityType, entityId) {
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
                showToast(L_labels.noDiscountsConfigured, 'info');
                return;
            }
            if (services.length === 1) {
                generateVoucher(entityType, entityId, services[0].id);
            } else {
                showServicePicker(entityType, entityId, services);
            }
        } catch(e) {
            showToast(e.message || 'Error', 'error');
        } finally {
            btnEl.textContent = origText;
            btnEl.style.pointerEvents = '';
        }
    }

    function showServicePicker(entityType, entityId, services) {
        var existing = document.getElementById('ctPickerModal');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'ctPickerModal';
        overlay.className = 'ct-picker-overlay';

        var optionsHtml = '';
        services.forEach(function(svc, i) {
            var svcName = isEn ? (svc.service_name_en || svc.service_name) : (isKg ? (svc.service_name_kg || svc.service_name) : svc.service_name);
            optionsHtml += '<div class="ct-picker-option' + (i === 0 ? ' selected' : '') + '" data-service-id="' + svc.id + '">' +
                '<div class="ct-picker-radio"></div>' +
                '<span class="ct-picker-label">' + esc(svcName) + '</span>' +
                '<span class="ct-picker-percent">-' + svc.discount_percent + '%</span>' +
            '</div>';
        });

        overlay.innerHTML =
            '<div class="ct-picker-modal">' +
                '<button class="ct-picker-close">&times;</button>' +
                '<div class="ct-picker-title">' + L_labels.pickService + '</div>' +
                '<div class="ct-picker-options">' + optionsHtml + '</div>' +
                '<button class="ct-picker-submit">' + L_labels.pickSubmit + '</button>' +
            '</div>';

        document.body.appendChild(overlay);

        var selectedId = services[0].id;

        overlay.querySelectorAll('.ct-picker-option').forEach(function(opt) {
            opt.addEventListener('click', function() {
                overlay.querySelectorAll('.ct-picker-option').forEach(function(o) { o.classList.remove('selected'); });
                this.classList.add('selected');
                selectedId = this.dataset.serviceId;
            });
        });

        overlay.querySelector('.ct-picker-close').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        overlay.querySelector('.ct-picker-submit').addEventListener('click', function() {
            overlay.remove();
            generateVoucher(entityType, entityId, selectedId);
        });
    }

    function initSearchInput() {
        var searchInput = document.getElementById('courtsSearch');
        if (!searchInput) return;
        searchInput.addEventListener('input', function() {
            _searchQuery = searchInput.value.trim();
            _currentPage = 1;
            refreshDropdowns();
            renderGrid();
        });
    }

    function initFilterClicks() {
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('ct-filter-btn')) return;

            // Группы больше нет — чипы идут одной строкой, поэтому снимаем
            // отметку у соседей по признаку, а не по общему предку
            if (e.target.hasAttribute('data-filter-type')) {
                currentTypeFilter = e.target.getAttribute('data-filter-type');
                document.querySelectorAll('[data-filter-type]').forEach(function(b) { b.classList.remove('active'); });
                e.target.classList.add('active');
                _currentPage = 1;
                refreshDropdowns();
                renderGrid();
            }
        });

        initDropdowns();
    }

    function refreshDropdowns() {
        var chips = document.getElementById('courtsChips');
        if (!chips) return;

        chips.querySelectorAll('.ct-dd').forEach(function(el) { el.remove(); });
        chips.insertAdjacentHTML('beforeend', dropdownHtml('city') + dropdownHtml('surface'));
    }

    function initDropdowns() {
        document.addEventListener('click', function(e) {
            var toggle = e.target.closest('.ct-dd-toggle');
            var item = e.target.closest('.ct-dd-item');

            // Клик мимо — закрываем открытое
            if (!toggle && !item) {
                document.querySelectorAll('.ct-dd.open').forEach(function(d) { d.classList.remove('open'); });
                return;
            }

            if (toggle) {
                var dd = toggle.closest('.ct-dd');
                var wasOpen = dd.classList.contains('open');
                document.querySelectorAll('.ct-dd.open').forEach(function(d) { d.classList.remove('open'); });
                dd.classList.toggle('open', !wasOpen);
                return;
            }

            var wrap = item.closest('.ct-dd');
            var kind = wrap.getAttribute('data-dd');
            var value = item.getAttribute('data-dd-value');
            if (kind === 'city') currentCityFilter = value;
            else currentSurfaceFilter = value;

            wrap.classList.remove('open');
            _currentPage = 1;
            refreshDropdowns();
            renderGrid();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.ct-dd.open').forEach(function(d) { d.classList.remove('open'); });
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
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-dim);">' + (isEn ? 'Loading...' : (isKg ? 'Жүктөлүүдө...' : 'Загрузка...')) + '</div>';
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

        var courtsLink = isEn ? 'courts-en.html' : (isKg ? 'courts-kg.html' : 'courts.html');
        var authLink = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
        var typeLabel = court._typeDesc || (court.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor);

        // Breadcrumb — render before container so it's outside .ct-container
        var servicesLink = isEn ? 'services-en.html' : (isKg ? 'services-kg.html' : 'services.html');
        var breadcrumb = document.createElement('div');
        // Тот же плавающий возврат, что на странице игрока: один вид на
        // всех карточках, и он не уезжает вместе с баннером
        breadcrumb.className = 'kslt-back-wrap kslt-back-float';
        breadcrumb.innerHTML =
            '<a href="' + servicesLink + '" class="kslt-back">\u2190 ' + (isEn ? 'Services' : (isKg ? 'Кызматтар' : 'Услуги')) + '</a>' +
            '<span class="kslt-back-sep">/</span>' +
            '<a href="' + courtsLink + '" class="kslt-back">' + L_labels.backBtn + '</a>';
        container.parentNode.insertBefore(breadcrumb, container);

        var html = '';

        // Header
        html += '<div class="ct-detail-header ct-fade-in">' +
            '<img src="' + esc(court.photo) + '" alt="' + esc(court.name) + '" class="ct-detail-photo">' +
            '<div class="ct-detail-info">' +
                '<div class="ct-detail-title-row"><h1>' + court.name + '</h1>' +
                (court._promoted ? '<span class="kslt-recommended-detail">' + L_labels.recommendedBadge + '</span>' : '') +
                '</div>' +
                '<div class="ct-detail-type">' + typeLabel + (court.surface ? ' \u00b7 ' + court.surface : '') +
                    (court.partner ? ' \u00b7 <span style="background:var(--accent);color:#000;font-size:0.72rem;padding:2px 8px;border-radius:100px;font-weight:700;">' + L_labels.partnerBadge + '</span>' : '') +
                '</div>' +
                (court.address ? '<div class="ct-detail-address"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + court.address + '</div>' : '') +
                (court.phone ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> <a href="tel:' + court.phone.split(',')[0].replace(/\s/g, '') + '">' + esc(prettyPhone(court.phone)) + '</a></div>' : '') +
                (court.whatsapp ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> <a href="https://wa.me/' + esc(court.whatsapp.replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + esc(prettyPhone(court.whatsapp)) + '</a></div>' : '') +
                (court.instagram ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> <a href="https://instagram.com/' + esc(court.instagram.replace(/^@/, '')) + '" target="_blank" rel="noopener">' + esc(court.instagram) + '</a></div>' : '') +
            '</div>' +
        '</div>';

        // Stats — single combined card
        var allSurfaces = [];
        var surfaceSeen = {};
        (court._courtTypes || []).forEach(function(ct) {
            var sLabel = isEn ? (SURFACE_MAP_EN[ct.surface] || ct.surface) : isKg ? (SURFACE_MAP_KG[ct.surface] || ct.surface) : (SURFACE_MAP[ct.surface] || ct.surface);
            if (sLabel && !surfaceSeen[sLabel]) { surfaceSeen[sLabel] = true; allSurfaces.push(sLabel); }
        });
        var surfacesText = allSurfaces.join(', ') || court.surface;
        var priceFromText = court.price ? ((isEn ? 'from ' : isKg ? 'дан ' : 'от ') + court.price + ' ' + (isEn ? 'som/hr' : isKg ? 'сом/саат' : 'сом/час')) : '';

        html += '<div class="ct-detail-stats ct-detail-stats-single ct-fade-in">' +
            '<div class="ct-detail-stat-combined">' +
                '<span class="ct-stat-item">' + court.courtsCount + ' ' + L_labels.courts + '</span>' +
                '<span class="ct-stat-sep">\u00b7</span>' +
                '<span class="ct-stat-item">' + esc(surfacesText) + '</span>' +
                (priceFromText ? '<span class="ct-stat-sep">\u00b7</span><span class="ct-stat-item">' + priceFromText + '</span>' : '') +
            '</div>' +
        '</div>';

        // Court Types table
        if (court._courtTypes && court._courtTypes.length > 0) {
            var TYPE_LABELS = { indoor: (isEn ? 'Indoor' : isKg ? 'Жабык' : 'Крытый'), outdoor: (isEn ? 'Outdoor' : isKg ? 'Ачык' : 'Открытый') };
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + (L_labels.courtTypesTitle || 'Типы кортов') + '</h2>' +
                '<div class="ct-types-table">' +
                    '<div class="ct-types-header">' +
                        '<span>' + (L_labels.thType || 'Тип') + '</span>' +
                        '<span>' + (L_labels.thSurface || 'Покрытие') + '</span>' +
                        '<span>' + (L_labels.thQty || 'Кол-во') + '</span>' +
                        '<span>' + (L_labels.thPrice || 'Цена') + '</span>' +
                    '</div>';
            court._courtTypes.forEach(function(ct) {
                var typeLabel = TYPE_LABELS[ct.type] || ct.type || '';
                var surfaceLabel = isEn ? (SURFACE_MAP_EN[ct.surface] || ct.surface) : isKg ? (SURFACE_MAP_KG[ct.surface] || ct.surface) : (SURFACE_MAP[ct.surface] || ct.surface);
                var priceText = ct.price ? (ct.price + ' ' + (isEn ? 'som/hr' : isKg ? 'сом/саат' : 'сом/час')) : '—';
                if (ct.partner && ct.discount) {
                    priceText += ' <span class="ct-svc-discount">KSLT -' + ct.discount + '%</span>';
                } else if (ct.partner) {
                    priceText += ' <span class="ct-svc-discount">KSLT</span>';
                }
                html += '<div class="ct-types-row">' +
                    '<span>' + esc(typeLabel) + '</span>' +
                    '<span>' + esc(surfaceLabel) + '</span>' +
                    '<span>' + (ct.count || '—') + '</span>' +
                    '<span>' + priceText + '</span>' +
                '</div>';
            });
            html += '</div></div>';
        }

        // Additional Services table
        if (court._additionalServices && court._additionalServices.length > 0) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + (L_labels.additionalServicesTitle || 'Дополнительные услуги') + '</h2>' +
                '<div class="ct-services-table">' +
                    '<div class="ct-services-header">' +
                        '<span>' + (L_labels.thService || 'Услуга') + '</span>' +
                        '<span>' + (L_labels.thServicePrice || 'Цена') + '</span>' +
                    '</div>';
            court._additionalServices.forEach(function(svc) {
                var svcName = isEn ? (svc.name_en || svc.name) : isKg ? (svc.name_kg || svc.name) : svc.name;
                var priceText = svc.price ? (svc.price + ' ' + (isEn ? 'som/hr' : isKg ? 'сом/саат' : 'сом/час')) : '—';
                if (svc.partner && svc.discount) {
                    priceText += ' <span class="ct-svc-discount">KSLT -' + svc.discount + '%</span>';
                } else if (svc.partner) {
                    priceText += ' <span class="ct-svc-discount">KSLT</span>';
                }
                html += '<div class="ct-services-row">' +
                    '<span>' + esc(svcName || '') + '</span>' +
                    '<span>' + priceText + '</span>' +
                '</div>';
            });
            html += '</div></div>';
        }

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

        // Discount section (partner courts)
        if (court._isDb && court.partner) {
            html += '<div class="ct-section ct-fade-in ct-discount-section">' +
                '<h2 class="ct-section-title">' + L_labels.discountTitle + '</h2>' +
                '<div class="ct-discount-list" id="ctDiscountList">' +
                    '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (isEn ? 'Loading...' : (isKg ? 'Жүктөлүүдө...' : 'Загрузка...')) + '</p>' +
                '</div>' +
            '</div>';
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

        // CTA — different for guest vs authenticated
        if (!(court._isDb && court.partner)) {
            var isAuth = _accessLevel !== 'guest';
            var ctaLink = isAuth ? servicesLink : authLink;
            var ctaText = isAuth ? (L_labels.ctaTextAuth || L_labels.ctaText) : L_labels.ctaText;
            var ctaBtnText = isAuth ? (L_labels.ctaBtnAuth || L_labels.ctaBtn) : L_labels.ctaBtn;
            html += '<div class="ct-cta ct-fade-in">' +
                '<h3>' + L_labels.ctaTitle.replace('KSLT', '<span>KSLT</span>') + '</h3>' +
                '<p>' + ctaText + '</p>' +
                '<a href="' + ctaLink + '" class="ct-cta-btn">' + ctaBtnText + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
            '</div>';
        }

        container.innerHTML = html;

        // Load discount services
        if (court._isDb && court.partner) {
            loadCourtDiscounts(court);
        }

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

    /* ===== DISCOUNT / VOUCHER ===== */

    async function loadCourtDiscounts(court) {
        var container = document.getElementById('ctDiscountList');
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
                .eq('entity_type', 'court')
                .eq('entity_id', court.id)
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
                html += '<div class="ct-discount-item">' +
                    '<div class="ct-discount-info">' +
                        '<span class="ct-discount-name">' + esc(svcName) + '</span>' +
                        '<span class="ct-discount-percent">-' + svc.discount_percent + '%</span>' +
                    '</div>';
                if (accessLevel === 'member') {
                    html += '<button class="ct-discount-btn" data-service-id="' + svc.id + '" data-court-id="' + court.id + '">' + L_labels.getVoucher + '</button>';
                } else if (accessLevel === 'registered') {
                    html += '<p class="ct-discount-hint">' + L_labels.discountRegistered + '</p>';
                } else {
                    html += '<p class="ct-discount-hint">' + L_labels.discountGuest + '</p>';
                }
                html += '</div>';
            });
            container.innerHTML = html;

            // Voucher button clicks
            container.querySelectorAll('.ct-discount-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var serviceId = this.dataset.serviceId;
                    var courtId = this.dataset.courtId;
                    generateVoucher('court', courtId, serviceId, function() {
                        loadVoucherHistory('court', court.id, services, accessLevel, container);
                    });
                });
            });

            // Load voucher history for members
            loadVoucherHistory('court', court.id, services, accessLevel, container);
        } catch (e) {
            console.error('Discount load error:', e);
        }
    }

    async function loadVoucherHistory(entityType, entityId, services, accessLevel, parentContainer) {
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
            var oldHist = parentContainer.querySelector('.ct-voucher-history');
            if (oldHist) oldHist.remove();

            var histDiv = document.createElement('div');
            histDiv.className = 'ct-voucher-history';
            histDiv.innerHTML = '<h4>' + L_labels.myVouchers + '</h4>';

            if (!vouchers.length) {
                histDiv.innerHTML += '<p class="ct-vh-empty">' + L_labels.noVouchersYet + '</p>';
            } else {
                var listHtml = '<div class="ct-vh-list">';
                var now = new Date();
                vouchers.forEach(function(v) {
                    var d = new Date(v.created_at);
                    var dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
                    var svcName = svcMap[v.service_id] || v.service_id;
                    var status = v.status;
                    // Auto-expire display
                    if (status === 'active' && v.expires_at && new Date(v.expires_at) < now) {
                        status = 'expired';
                    }
                    var statusLabel = status === 'active' ? L_labels.voucherActive : (status === 'used' ? L_labels.voucherUsed : L_labels.voucherExpired);
                    var statusClass = 'ct-vh-status ct-vh-status-' + status;

                    listHtml += '<div class="ct-vh-item">' +
                        '<span class="ct-vh-date">' + dateStr + '</span>' +
                        '<span class="ct-vh-service">' + esc(svcName) + '</span>' +
                        '<span class="ct-vh-discount">-' + v.discount_percent + '%</span>' +
                        '<span class="' + statusClass + '">' + statusLabel + '</span>';
                    if (status === 'active') {
                        listHtml += '<button class="ct-vh-qr-btn" data-token="' + esc(v.qr_token) + '" data-service="' + esc(svcName) + '" data-percent="' + v.discount_percent + '" data-entity="' + esc(v.entity_name || '') + '" data-expires="' + v.expires_at + '">' + L_labels.voucherShowQR + '</button>';
                    }
                    listHtml += '</div>';
                });
                listHtml += '</div>';
                histDiv.innerHTML += listHtml;
            }

            parentContainer.appendChild(histDiv);

            // QR button clicks in history
            histDiv.querySelectorAll('.ct-vh-qr-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    showVoucherModal({
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

    async function generateVoucher(entityType, entityId, serviceId, onSuccess) {
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
                    showLimitModal('active');
                    return;
                }
                if (data.error === 'daily_limit') {
                    showLimitModal('daily');
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
                showVoucherModal(data.voucher);
                if (typeof onSuccess === 'function') onSuccess();
            }
        } catch (e) {
            showToast(e.message || 'Error', 'error');
        }
    }

    function showVoucherModal(voucher) {
        // Remove existing modal
        var existing = document.getElementById('ctVoucherModal');
        if (existing) existing.remove();

        var verifyUrl = 'https://kslt.netlify.app/pages/verify.html?token=' + voucher.qr_token;
        var expiresDate = new Date(voucher.expires_at);
        var expiresStr = expiresDate.toLocaleString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        var modal = document.createElement('div');
        modal.id = 'ctVoucherModal';
        modal.className = 'ct-voucher-overlay';
        modal.innerHTML =
            '<div class="ct-voucher-modal">' +
                '<button class="ct-voucher-close" id="ctVoucherClose">&times;</button>' +
                '<h3 class="ct-voucher-title">' + L_labels.voucherReady + '</h3>' +
                '<div class="ct-voucher-qr" id="ctVoucherQR"></div>' +
                '<div class="ct-voucher-details">' +
                    '<div class="ct-voucher-row"><span>' + L_labels.voucherService + ':</span><span>' + esc(voucher.service_name) + '</span></div>' +
                    '<div class="ct-voucher-row"><span>' + L_labels.voucherDiscount + ':</span><span class="ct-voucher-percent">-' + voucher.discount_percent + '%</span></div>' +
                    '<div class="ct-voucher-row"><span>' + esc(voucher.entity_name) + '</span></div>' +
                    '<div class="ct-voucher-row"><span>' + L_labels.voucherExpires + ':</span><span>' + expiresStr + '</span></div>' +
                '</div>' +
                '<div class="ct-voucher-actions">' +
                    '<button class="ct-voucher-download" id="ctVoucherDownload">' + L_labels.voucherDownload + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);

        // Generate QR
        var qrContainer = document.getElementById('ctVoucherQR');
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: verifyUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            qrContainer.innerHTML = '<p style="color:#999;font-size:0.8rem;">QR library not loaded</p>';
        }

        // Close
        document.getElementById('ctVoucherClose').addEventListener('click', function() {
            modal.remove();
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });

        // Download branded PNG
        document.getElementById('ctVoucherDownload').addEventListener('click', function() {
            setTimeout(function() {
                var qrCanvas = qrContainer.querySelector('canvas');
                if (!qrCanvas) return;

                var w = 380;
                var h = 520;
                var c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                var ctx = c.getContext('2d');

                // Gradient background
                var grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0f0f0f');
                grad.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                // Accent top stripe
                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, 0, w, 4);

                // Logo
                ctx.fillStyle = '#CCFF00';
                ctx.font = 'bold 26px Inter, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('KSLT', w / 2, 42);

                // Subtitle
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '11px Inter, Arial, sans-serif';
                ctx.fillText('KYRGYZSTAN SOCIAL LAWN TENNIS', w / 2, 60);

                // Divider line
                ctx.strokeStyle = 'rgba(204,255,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(40, 75);
                ctx.lineTo(w - 40, 75);
                ctx.stroke();

                // Discount badge
                ctx.fillStyle = '#CCFF00';
                ctx.font = 'bold 32px Inter, Arial, sans-serif';
                ctx.fillText('-' + voucher.discount_percent + '%', w / 2, 112);

                // Service name
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 15px Inter, Arial, sans-serif';
                ctx.fillText(voucher.service_name || '', w / 2, 138);

                // Entity name
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '13px Inter, Arial, sans-serif';
                ctx.fillText(voucher.entity_name || '', w / 2, 160);

                // QR code with rounded white background
                var qrSize = 200;
                var qrX = (w - qrSize) / 2;
                var qrY = 180;
                var pad = 12;
                ctx.fillStyle = '#ffffff';
                roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 12);
                ctx.fill();
                ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

                // Scan text
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '11px Inter, Arial, sans-serif';
                var scanLabel = isEn ? 'Scan QR to verify discount' : (isKg ? 'Арзандатууну текшерүү үчүн QR сканерлеңиз' : 'Отсканируйте QR для проверки скидки');
                ctx.fillText(scanLabel, w / 2, qrY + qrSize + pad + 22);

                // Expires
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '12px Inter, Arial, sans-serif';
                ctx.fillText(expiresStr, w / 2, qrY + qrSize + pad + 44);

                // Bottom accent stripe
                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, h - 4, w, 4);

                // URL footer
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

    function showLimitModal(reason) {
        var existing = document.getElementById('ctLimitModal');
        if (existing) existing.remove();

        var title, desc;
        if (reason === 'daily') {
            title = isEn ? 'Daily limit reached' : (isKg ? 'Күнүмдүк лимит' : 'Дневной лимит');
            desc = isEn ? 'You can get a new discount for this service tomorrow' : (isKg ? 'Бул кызмат үчүн жаңы арзандатууну эртең ала аласыз' : 'Новую скидку на эту услугу можно получить завтра');
        } else {
            title = L_labels.voucherLimit;
            desc = isEn ? 'Use or wait for your current discount to expire' : (isKg ? 'Учурдагы арзандатууңузду колдонуңуз же мөөнөтү бүткөнчө күтүңүз' : 'Используйте текущую скидку или дождитесь её истечения');
        }

        var modal = document.createElement('div');
        modal.id = 'ctLimitModal';
        modal.className = 'ct-voucher-overlay';
        modal.innerHTML =
            '<div class="ct-voucher-modal" style="text-align:center;">' +
                '<button class="ct-voucher-close" id="ctLimitClose">&times;</button>' +
                '<div style="font-size:2.5rem;margin-bottom:12px;">&#9203;</div>' +
                '<h3 class="ct-voucher-title">' + title + '</h3>' +
                '<p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:20px;">' + desc + '</p>' +
                '<button class="ct-voucher-download" id="ctLimitOk">OK</button>' +
            '</div>';

        document.body.appendChild(modal);
        document.getElementById('ctLimitClose').addEventListener('click', function() { modal.remove(); });
        document.getElementById('ctLimitOk').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
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
