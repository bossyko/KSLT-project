(function() {
    'use strict';

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
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

    /* КАРТА ЖИВЁТ В ДОМЕ `js/kslt-karta.js` (19.10). Здесь стояла своя
       копия, которая на короткой ссылке подставляла САМУ ССЫЛКУ
       поисковым запросом и показывала карту неизвестно чего. */
    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;
    /* АНГЛИЙСКАЯ ВЕТКА ЗАВЕДЕНА 12.10. Её не было вовсе: словарь строился
       как `isKg ? {kg} : {ru}`, и английская страница получала РУССКИЙ
       словарь — при `<html lang="en">`. Замер: 58 русских узлов из 110
       видимых плюс 28 русских атрибутов. Корты и тренеры были последними
       двумя файлами продукта без ветки `isEn`.

       Крючок `window.courtsLabels` снят: его не задавал никто с момента
       написания, а он создавал вид, что словарь можно подменить снаружи. */
    var L_labels = KSLT_YAZYK.выбрать({
        heroTitle: "Courts",
        heroSubtitle: "Where to play in Kyrgyzstan: surface, prices, rental",
        filterAll: "All",
        filterIndoor: "Indoor",
        filterOutdoor: "Outdoor",
        filterClay: "Clay",
        filterHard: "Hard",
        courts: "courts",
        rating: "rating",
        priceFrom: "from",
        priceCurrency: "som/hour",
        detailsBtn: "Details",
        bookBtn: "KSLT discount",
        aboutTitle: "About the venue",
        amenitiesTitle: "Amenities",
        scheduleTitle: "Schedule and prices",
        locationTitle: "Location",
        galleryTitle: "Gallery",
        ctaTitle: "Discounts for KSLT members",
        ctaText: "Sign up and get a membership to receive discounts at partner courts",
        ctaBtn: "Sign up",
        ctaTextAuth: "As a KSLT member you get discounts at partner courts and coaches",
        ctaBtnAuth: "View discounts",
        backBtn: "All courts",
        partnerBadge: "KSLT Partner",
        surface: "Surface",
        phone: "Phone",
        newBadge: "New",
        filterType: "Court type",
        shownOf: "of",
        pageOf: "of",
        prevPage: "\u2190 Back",
        nextPage: "Next \u2192",
        filterSurface: "Surface",
        filterCarpet: "Carpet",
        filterGrass: "Grass",
        filterCity: "City",
        searchPlaceholder: "Search courts...",
        recommendedBadge: "KSLT recommends",
        discountTitle: "Discounts for KSLT members",
        getVoucher: "Get discount",
        discountGuest: "Sign up and get a membership for discounts",
        discountRegistered: "Get a KSLT membership for discounts",
        voucherReady: "Your discount is ready!",
        voucherLimit: "You already have an active discount",
        voucherExpires: "Valid until",
        voucherDownload: "Download QR",
        voucherDiscount: "Discount",
        voucherService: "Service",
        myVouchers: "My discounts",
        voucherActive: "Active",
        voucherUsed: "Used",
        voucherExpired: "Expired",
        voucherShowQR: "QR",
        noVouchersYet: "No discounts yet",
        pickService: "Choose a service",
        pickSubmit: "Get discount",
        noDiscountsConfigured: "No discounts set up yet",
        courtTypesTitle: "Court types",
        thType: "Type",
        thSurface: "Surface",
        thQty: "Qty",
        thPrice: "Price",
        additionalServicesTitle: "Additional services",
        thService: "Service",
        thServicePrice: "Price"
    }, {
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
        shownOf: 'ичинен',
        pageOf: 'ичинен',
        prevPage: '\u2190 Артка',
        nextPage: 'Кийинки \u2192',
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
    }, {
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
        shownOf: "из",
        pageOf: "из",
        prevPage: "\u2190 Назад",
        nextPage: "Далее \u2192",
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

    /* ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. Покрытие называлось ДВАЖДЫ: этими
       картами (их зовёт карточка, `js/courts.js` ниже) и ключами
       filterHard / filterClay / filterCarpet / filterGrass в словаре, их
       звали фильтры. Пока английской ветки не было, расхождение не было
       видно: обе копии отдавали русское. Теперь карта одна, выбранная по
       языку, а ключи словаря остались для совместимости и ничем не правят. */
    var ПОКРЫТИЯ = KSLT_YAZYK.выбрать(SURFACE_MAP_EN, SURFACE_MAP_KG, SURFACE_MAP);

    // Фотографий у кортов пока нет ни у одного: реестр собирали из 2ГИС и
    // гидов, снимки добавим по мере получения. До тех пор общая картинка
    // раздела — иначе на карточке зияет пустая рамка
    var FALLBACK_PHOTO = '../images/heroes/courts.jpg';

    // Заготовок больше нет. Раньше при сбое базы показывались пять
    // выдуманных кортов — человек мог поехать по адресу, которого не
    // существует. Честное «не загрузилось» вредит меньше
    var data = [];
    var loadFailed = false;

    var currentTypeFilter = 'all';
    var currentSurfaceFilter = 'all';
    var currentCityFilter = 'all';
    var _searchQuery = '';

    var _accessLevel = 'guest';
    /* ШАГ СТРАНИЦЫ — КОЛОНОК × РЯДОВ, А НЕ ЧИСЛО.
       Стояло 20 на все виды: на десктопе это пять рядов по четыре, на
       телефоне десять рядов по две — страница в 2.7 экрана против 1.6.
       Слово Кости 07.10: четыре ряда на широких, три на телефоне. Рядов
       держит css (`--ct-ryadov`, 4 и 3 на границе 992), колонок считает
       браузер — их у `auto-fill` 4 · 3 · 2 внутри одной границы, числом
       не описать. Замер: 16 · 12 · 6 · 6 · 6 карточек, страница
       2.2 · 2.6 · 1.7 · 1.6 · 3.9 экрана. */
    var PER_PAGE = 16;
    var _шагИдёт = false;
    var _currentPage = 1;
    var _toastTimer = null;

    async function detectAccess() {
        /* УРОВЕНЬ ДОСТУПА — У ДОМА (js/kslt-dostup.js). Здесь стояла своя
           копия: пять копий одного понятия разошлись, и эта не считала
           админа членом клуба. */
        _accessLevel = await KSLT_DOSTUP.уровень();
    }

    /* ЧЛЕНСКОЕ ОКНО — ДОМ ВИТРИНЫ (кусок 144). Своё здесь — приставка и
       два текста: у кортов названы и корты, и тренеры. */
    function showMembershipModal(level) {
        KSLT_VITRINA.членскоеОкно({
            подложка: 'ct-membership-overlay',
            окно: 'ct-membership-modal',
            закрыть: 'ct-membership-close',
            значок: 'ct-membership-icon',
            кнопка: 'ct-membership-btn'
        }, level, {
            гостю: KSLT_YAZYK.выбрать(
                'Register and become a KSLT member to get discounts at partner courts and coaches',
                'Катталыңыз жана KSLT мүчөсү болуп, өнөктөш корттордо арзандатуу алыңыз',
                'Зарегистрируйтесь и оформите членство KSLT, чтобы получать скидки у партнёрских кортов и тренеров'),
            безЧленства: KSLT_YAZYK.выбрать(
                'Become a KSLT member to unlock discounts at partner courts and coaches',
                'KSLT мүчөсү болуп, өнөктөш корттордо арзандатуу алыңыз',
                'Оформите членство KSLT, чтобы получать скидки у партнёрских кортов и тренеров')
        });
    }

    /* ОДНО УВЕДОМЛЕНИЕ НА САЙТ — компонент Toast 30:59 требует этого
       сам: «four separate notification mechanisms… They should all render
       this one component». Своя копия снята заходом B1, 14.10.
       ИМЯ ФУНКЦИИ ОСТАВЛЕНО НА МЕСТЕ: вызовы в этом файле не трогаются,
       правится одно тело вместо каждого вызова.
       Перевод тона живёт в модуле — одно определение, а не семь. */
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
        loadSupabaseCourts(function(dbCourts, failed) {
            loadFailed = !!failed;
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
                } else {
                    /* Корта среди опубликованных нет: он черновик, его сняли
                       с сайта или ссылка старая. Раньше страница навсегда
                       оставалась на «Загрузка…» — человек ждал того, чего
                       не будет */
                    нетКорта();
                }
            }
        });
    } else {
        initListPage();
        loadSupabaseCourts(function(dbCourts, failed) {
            // Пустая база и недоступная база — разные вещи. Пусто — значит
            // кортов нет; связи нет — показываем заготовки, чтобы страница
            // не выглядела сломанной
            loadFailed = !!failed;
            data = sortPromotedFirst(dbCourts);
            {
                refreshDropdowns();
                loadMaxDiscounts(function() {
                    renderGrid();
                });
            }
        });
    }

    /* ===== SUPABASE LOADING ===== */

    /**
     * Вторым доводом отдаём признак «не дозвонились до базы». Пустой список
     * сам по себе ничего не говорит: он бывает и когда кортов правда нет,
     * и когда связь оборвалась, а вести себя в этих случаях надо по-разному
     */
    function loadSupabaseCourts(callback) {
        var client = window.supabaseClient || null;
        if (!client) {
            callback([], true);
            return;
        }
        try {
            /* Черновики людям не показываем: корт, заведённый из формы
               турнира, — это три поля без фото, покрытий и цен. Он ждёт,
               когда его дозаполнят в админке и опубликуют */
            client.from('courts').select('*').not('published_at', 'is', null)
                .order('created_at', { ascending: false })
                .then(function(result) {
                    if (result.error || !result.data) {
                        console.error('[KSLT] корты не загружены:', result.error && result.error.message);
                        callback([], true);
                        return;
                    }
                    var mapped = result.data.map(function(row) { return mapDbCourt(row); });
                    callback(mapped, false);
                })
                .catch(function() { callback([], true); });
        } catch (e) {
            callback([], true);
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
        var surface = surfaceKey ? (ПОКРЫТИЯ[surfaceKey] || surfaceKey) : '';

        // Total courts count
        var totalCourts = 0;
        courtTypes.forEach(function(ct) { totalCourts += (ct.count || 0); });

        // Min price
        var minPrice = 0;
        courtTypes.forEach(function(ct) {
            if (ct.price && (!minPrice || ct.price < minPrice)) minPrice = ct.price;
        });

        /* Адрес собирается в одном месте — js/court-address.js */
        var address = window.KSLT_ADDRESS.адрес(row, KSLT_YAZYK.выбрать('en', 'kg', 'ru'));

        // Description
        var desc = KSLT_YAZYK.выбрать(row.description_en || row.description || '', row.description_kg || row.description || '', row.description || '');
        var shortDesc = desc.length > 120 ? desc.substr(0, 120) + '...' : desc;

        // Name
        var name = KSLT_YAZYK.выбрать(row.name_en || row.name, row.name_kg || row.name, row.name);

        // Amenities — map keys to labels
        var AMENITY_LABELS = {
            locker_rooms: KSLT_YAZYK.выбрать('Locker rooms', 'Кийим алмаштыруучу', 'Раздевалки'),
            showers: KSLT_YAZYK.выбрать('Showers', 'Душ', 'Душевые'),
            parking: KSLT_YAZYK.выбрать('Parking', 'Токтоочу жай', 'Парковка'),
            racket_rental: KSLT_YAZYK.выбрать('Racket rental', 'Ракетка ижарасы', 'Прокат ракеток'),
            pro_shop: 'Pro-shop',
            cafe: KSLT_YAZYK.выбрать('Café', 'Кафе', 'Кафе'),
            gym: KSLT_YAZYK.выбрать('Gym', 'Спорт зал', 'Тренажёрный зал'),
            pool: KSLT_YAZYK.выбрать('Pool', 'Бассейн', 'Бассейн'),
            sauna: KSLT_YAZYK.выбрать('Sauna', 'Сауна', 'Сауна'),
            climate: KSLT_YAZYK.выбрать('Climate control', 'Климат көзөмөлү', 'Климат-контроль'),
            lighting: KSLT_YAZYK.выбрать('Lighting', 'Кечки жарык', 'Вечернее освещение'),
            kids_area: KSLT_YAZYK.выбрать('Kids area', 'Балдар аянтчасы', 'Детская площадка'),
            kids_school: KSLT_YAZYK.выбрать('Kids school', 'Балдар мектеби', 'Детская школа'),
            video: KSLT_YAZYK.выбрать('Video', 'Видео талдоо', 'Видеоанализ'),
            wifi: 'Wi-Fi',
            benches: KSLT_YAZYK.выбрать('Benches', 'Отургучтар', 'Скамейки')
        };
        var amenities = (row.amenities || []).map(function(key) {
            return AMENITY_LABELS[key] || key;
        });

        // Type labels for mixed courts
        var typeDesc = '';
        if (hasIndoor && hasOutdoor) {
            typeDesc = (KSLT_YAZYK.выбрать('Indoor + Outdoor', 'Жабык + Ачык', 'Крытый + Открытый'));
        }

        return {
            id: row.id,
            name: name,
            // Своя картинка вместо чужой со стоков: снимков у кортов пока нет
            // ни у одного, а внешний сервер отвечает не всегда — из двадцати
            // карточек грузилось двенадцать, остальные зияли пустыми рамками
            photo: row.photo || FALLBACK_PHOTO,
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
            /* «НОВЫЙ» — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ. До 13.10 здесь стояло
               `true` без условия, и плашку носили ВСЕ 24 опубликованных корта
               разом: метка, которую носят все, не метит никого. Срок —
               30 дней, слово Кости 13.10. */
            _isNew: новыйЛи(row.created_at),
            _isDb: true,
            city: KSLT_YAZYK.выбрать(row.city_en || row.city || '', row.city_kg || row.city || '', row.city || ''),
            _typeDesc: typeDesc,
            _promoted: row.promoted || false
        };
    }

    // Promoted first (fixed), rest shuffled
    function sortPromotedFirst(arr) {
        return KSLT_VITRINA.продвинутыеПервыми(arr);
    }

    /* ===== LIST PAGE ===== */

    function initListPage() {
        renderHero();
        renderFilters();
        renderGrid();
        следитьЗаШагом();
        initSearchInput();
        initFilterClicks();
        initPaginationClicks();
        initCtaClicks();
        initScrollAnimations();
        detectAccess();
    }

    /* ОБЛОЖКА РАЗДЕЛА — ДОМ ВИТРИНЫ (кусок 144). */
    function renderHero() {
        KSLT_VITRINA.обложка(document.getElementById('courtsHero'), {
            приставка: 'ct',
            картинка: '../images/heroes/courts.jpg',
            заголовок: L_labels.heroTitle,
            подзаголовок: L_labels.heroSubtitle
        });
    }

    /**
     * Города и покрытия — выпадающими списками, а не рядом кнопок: рядом
     * они не помещались в строку, а городов со временем станет больше.
     * В списке только то, что есть у кортов на самом деле, и рядом счётчик.
     */
    function dropdownOptions(kind) {
        var counts = {};
        var order = [];

        /* ТИП КОРТА — ТАКАЯ ЖЕ ВЫПАДАШКА, КАК ГОРОД И ПОКРЫТИЕ.
           Слово Кости 07.10. Стоял ряд из трёх чипов плюс разделитель —
           четыре места в полосе под ОДИН признак, тогда как два других
           признака занимали по одному. Выпадающий фильтр — компонент на
           весь сайт (css/style.css:5420, `.f-dd` / `.ct-dd`): им уже
           пользуются корты, тренеры, поиск игрока и новости. */
        if (kind === 'type') {
            var типы = { indoor: L_labels.filterIndoor, outdoor: L_labels.filterOutdoor };
            var бассейн = applyFilters('type');
            ['indoor', 'outdoor'].forEach(function(key) {
                var n = бассейн.filter(function(c) { return c.type === key; }).length;
                if (n) order.push({ value: key, label: типы[key], count: n });
            });
            return order;
        }

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

        var labels = ПОКРЫТИЯ;
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

        var allLabel = kind === 'type' ? L_labels.filterType
            : (kind === 'city' ? L_labels.filterCity : L_labels.filterSurface);
        var current = kind === 'type' ? currentTypeFilter
            : (kind === 'city' ? currentCityFilter : currentSurfaceFilter);

        if (current !== 'all' && !options.some(function(o) { return o.value === current; })) {
            var labelsMap = {
                hard: ПОКРЫТИЯ.hard, clay: ПОКРЫТИЯ.clay,
                carpet: ПОКРЫТИЯ.carpet, grass: ПОКРЫТИЯ.grass,
                indoor: L_labels.filterIndoor, outdoor: L_labels.filterOutdoor
            };
            options = options.concat([{ value: current, label: labelsMap[current] || current, count: 0 }]);
        }

        var title = allLabel;
        options.forEach(function(o) { if (o.value === current) title = o.label; });

        /* ГАЛОЧКА У ВЫБРАННОГО — ТРЕБОВАНИЕ КОМПОНЕНТА, А НЕ УКРАШЕНИЕ.
           `Menu item 32:44`: «Selected carries a tick and goes
           accent/default — never rely on the tint alone, it is invisible
           to anyone who cannot separate the two greys». До 12.10 выбранный
           пункт отличался ТОЛЬКО краской. */
        var ГАЛКА = '<svg class="ct-dd-tick" width="14" height="14" viewBox="0 0 24 24" ' +
            'fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">' +
            '<path d="M20 6L9 17l-5-5"/></svg>';

        var items = '<button class="ct-dd-item' + (current === 'all' ? ' active' : '') +
            '" data-dd-value="all"' + (current === 'all' ? ' aria-current="true"' : '') + '>' +
            allLabel + (current === 'all' ? ГАЛКА : '') + '</button>';
        options.forEach(function(o) {
            var выбран = o.value === current;
            items += '<button class="ct-dd-item' + (выбран ? ' active' : '') +
                '" data-dd-value="' + KSLT_экранировать(o.value) + '"' + (выбран ? ' aria-current="true"' : '') + '>' +
                KSLT_экранировать(o.label) + (выбран ? ГАЛКА : '') +
                '<span class="ct-dd-count">' + o.count + '</span></button>';
        });

        /* ЧТО ЧИТАЕТ ДИКТОР. Раскрывашка обязана сказать, что она
           раскрывашка и открыта ли она: без `aria-haspopup` и
           `aria-expanded` это просто кнопка с непонятным словом.
           `aria-expanded` переключается при открытии — `initDropdowns`. */
        return '<div class="ct-dd" data-dd="' + kind + '">' +
            '<button class="trn-chip ct-dd-toggle' + (current !== 'all' ? ' active' : '') + '"' +
                ' aria-haspopup="listbox" aria-expanded="false">' +
                KSLT_экранировать(title) +
                '<svg class="ct-dd-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="ct-dd-menu" role="listbox">' + items + '</div>' +
        '</div>';
    }

    function renderFilters() {
        var container = document.getElementById('courtsFilters');
        if (!container) return;

        // Полоса та же, что на страницах категорий турниров: общий вид на
        // весь сайт. Классы trn- лежат в style.css
        container.className = 'trn-filters';

        var servicesLink = KSLT_YAZYK.выбрать('services-en.html', 'services-kg.html', 'services.html');

        // Возврат живёт ВНУТРИ прилипающего блока с поиском и фильтрами.
        // Стоя над ним, он уезжал при первой же прокрутке
        var html =
            '<div class="trn-filters-inner">' +
                '<a href="' + servicesLink + '" class="kslt-back trn-back">\u2190 ' +
                    (KSLT_YAZYK.выбрать('Services', 'Кызматтар', 'Услуги')) + '</a>' +
                '<div class="trn-search-wrap">' +
                    '<svg class="trn-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                    '<input type="text" class="trn-search-input" id="courtsSearch" placeholder="' + L_labels.searchPlaceholder + '" autocomplete="off">' +
                '</div>' +
                /* Три признака — три одинаковых выпадашки. Разделитель
                   `.trn-chip-div` ушёл вместе с чипами: разделять стало
                   нечего, все три места в полосе теперь однородны. */
                '<div class="trn-chips" id="courtsChips">' +
                    dropdownHtml('type') +
                    dropdownHtml('city') +
                    dropdownHtml('surface') +
                '</div>' +
            '</div>';
        container.innerHTML = html;

        /* ЛИПКОСТЬ ПОЛОСЫ — ДОМ ВИТРИНЫ (кусок 144). */
        KSLT_VITRINA.липнетПолоса(container);
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

        // Пусто по трём разным причинам, и человеку важно понимать, по какой:
        // связь оборвалась, поиск ничего не нашёл или кортов ещё не завели
        if (filtered.length === 0) {
            var text;
            if (loadFailed) {
                text = KSLT_YAZYK.выбрать('Could not load the courts. Please refresh the page.', 'Корттордун тизмеси жүктөлгөн жок. Баракты жаңылаңыз.', 'Не удалось загрузить список кортов. Обновите страницу.');
            } else if (_searchQuery || currentTypeFilter !== 'all' || currentSurfaceFilter !== 'all' || currentCityFilter !== 'all') {
                text = KSLT_YAZYK.выбрать('No courts match your search', 'Издөө боюнча корт табылган жок', 'По вашему запросу кортов не нашлось');
            } else {
                text = KSLT_YAZYK.выбрать('The list of courts will appear soon', 'Корттордун тизмеси жакында пайда болот', 'Список кортов скоро появится');
            }
            container.innerHTML = '<div class="ct-empty">' +
                '<div class="ct-empty-icon">' + (loadFailed ? '\u26A0\uFE0F' : '\uD83C\uDFBE') + '</div>' +
                '<p>' + text + '</p>' +
            '</div>';
            renderPagination(0, 1);
            return;
        }

        var start = (_currentPage - 1) * PER_PAGE;
        var pageItems = filtered.slice(start, start + PER_PAGE);

        var detailBase = KSLT_YAZYK.выбрать('court-en.html', 'court-kg.html', 'court.html');

        var html = '<div class="ct-grid">';
        pageItems.forEach(function(c) {
            var typeLabel = c._typeDesc || (c.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor);
            var newBadge = c._isNew ? '<span class="ct-new-badge">' + L_labels.newBadge + '</span>' : '';
            var promoBadge = c._promoted ? '<span class="kslt-recommended-badge">' + L_labels.recommendedBadge + '</span>' : '';
            var discountBadge = c._maxDiscount ? '<span class="ct-discount-overlay">\uD83C\uDFF7\uFE0F ' + (KSLT_YAZYK.выбрать('up to', 'чейин', 'до')) + ' -' + c._maxDiscount + '%</span>' : '';

            html += '<a href="' + detailBase + '?id=' + c.id + '" class="ct-card ct-fade-in' + (c._promoted ? ' kslt-promoted-card' : '') + '">' +
                '<div class="ct-card-img-wrap">' +
                    '<img src="' + KSLT_экранировать(c.photo || FALLBACK_PHOTO) + '" alt="' + KSLT_экранировать(c.name) + '" class="ct-card-img" loading="lazy">' +
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
                    /* «Подробнее →» снято: карточка САМА ссылка на корт, и
                       кнопка была нажимаемым внутри нажимаемого — с
                       клавиатуры до неё не добраться, а ведёт она туда же.
                       Остаётся одно действие, которое карточку не повторяет. */
                    '<div class="ct-card-actions">' +
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
        /* ШАГ ИЗВЕСТЕН ТОЛЬКО ПОСЛЕ РАСКЛАДКИ. Колонки у `auto-fill`
           считает браузер, а до первой отрисовки сетки считать нечего —
           поэтому шаг проверяется здесь и, если изменился, сетка рисуется
           ЕЩЁ РАЗ. Сторож `_шагИдёт` держит ровно один повтор: второй
           пересчёт даёт то же число и возвращает false. */
        if (!_шагИдёт && пересчитатьШаг()) {
            _шагИдёт = true;
            var всего = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
            if (_currentPage > всего) _currentPage = всего;
            renderGrid();
            _шагИдёт = false;
            return;
        }

        renderPagination(filtered.length, _currentPage);
        initScrollAnimations();
    }

    /* ШАГ И СЛЕЖЕНИЕ — ОДНИМ ЗОВОМ ДОМА (кусок 144). Своё здесь — имя
       сетки, имя рядов и СВОЁ ЧИСЛО: дом его спрашивает и отдаёт. */
    var пересчитатьШаг = KSLT_VITRINA.пересчётШага({
        селектор: '.ct-grid',
        ряды: '--ct-ryadov',
        взять: function () { return PER_PAGE; },
        поставить: function (н) { PER_PAGE = н; }
    });

    /* ResizeObserver, а не resize окна: коробка витрины меняет ширину и от
       поворота, и от появления полосы прокрутки, о чём окно не сообщает. */
    function следитьЗаШагом() {
        KSLT_VITRINA.следитьЗаШириной(document.getElementById('courtsGrid'), function () {
            if (пересчитатьШаг()) renderGrid();
        });
    }

    // ---- PAGINATION ----
    function renderPagination(total, page) {
        var container = document.getElementById('courtsPagination');
        if (!container) return;

        /* ПОЛОСА СТРАНИЦ — ОБЩИЙ КОМПОНЕНТ, `js/polosa-stranic.js`.
           Своя была второй копией и худшей: слова «← Назад / Далее →»
           вместо шевронов, ВСЕ номера подряд без окна (при двадцати
           кортах и шаге 16 это два номера, при двухстах — тринадцать) и
           ни одного счётчика строк. Теперь определение одно на рейтинг и
           на корты, собранное по `Pagination row 115:171`. */
        if (!window.KSLT_полосаСтраниц) { container.innerHTML = ''; return; }
        window.KSLT_полосаСтраниц(container, total, page, PER_PAGE, L_labels);
    }

    function initPaginationClicks() {
        KSLT_VITRINA.нажатияПолосы(document.getElementById('courtsGrid'),
            function () { return _currentPage; },
            function (n) { _currentPage = n; },
            renderGrid);
    }

    // ---- SPONSORS — loaded via sponsors-loader.js ----

    /* ИМЕНА КЛАССОВ ВАУЧЕРА ПЕРЕЕХАЛИ В ДОМ — кусок 148. Здесь лежала
       своя карта из 30 имён с приставкой раздела, и такая же — у
       близнеца. Замер показал: вид описан дважды побайтово, а в кабинете
       третий раз инлайном. Вид один, имя одно (`kslt-`), карта одна — в
       `js/kslt-vaucher-blok.js`. */

    /* ВАУЧЕРНЫЙ БЛОК — ДОМ `js/kslt-vaucher-blok.js` (кусок 145). Эти шесть
       функций стояли здесь и у близнеца СЛОВО В СЛОВО, 271 строка на
       сторону: расходились только приставки классов, адреса окон и имена
       самих функций. Имена оставлены прежними — их зовут соседние места. */
    function ctaLoadServices(кнопка, видСущности, idСущности) {
        KSLT_VAUCHER_BLOK.услугиПоКнопке({
            кнопка: кнопка, видСущности: видСущности, idСущности: idСущности,
            L: L_labels
        });
    }

    function showServicePicker(видСущности, idСущности, услуги) {
        KSLT_VAUCHER_BLOK.выборУслуги({
            видСущности: видСущности, idСущности: idСущности, услуги: услуги,
            L: L_labels
        });
    }

    function loadVoucherHistory(видСущности, idСущности, услуги, уровень, коробка) {
        KSLT_VAUCHER_BLOK.история({
            видСущности: видСущности, idСущности: idСущности, услуги: услуги,
            уровень: уровень, коробка: коробка, L: L_labels
        });
    }

    function generateVoucher(видСущности, idСущности, idУслуги, послеУспеха) {
        KSLT_VAUCHER_BLOK.завести({
            видСущности: видСущности, idСущности: idСущности, idУслуги: idУслуги,
            послеУспеха: послеУспеха, L: L_labels
        });
    }

    function showVoucherModal(ваучер) {
        KSLT_VAUCHER_BLOK.окноВаучера({ ваучер: ваучер, L: L_labels });
    }

    function showLimitModal(причина) {
        KSLT_VAUCHER_BLOK.окноЛимита({ причина: причина, L: L_labels });
    }

    /* НАЖАТИЕ КНОПКИ КАРТОЧКИ — ДОМ ВИТРИНЫ (кусок 144). Здесь было два
       `if` подряд, у тренеров один со связкой — поведение одно. */
    function initCtaClicks() {
        KSLT_VITRINA.нажатияКарточки('courtsGrid', '.ct-card-cta',
            function () { return _accessLevel; },
            function (кнопка, id) { ctaLoadServices(кнопка, 'court', id); },
            showMembershipModal);
    }



    /* ПОЛЕ ПОИСКА — ДОМ ВИТРИНЫ (кусок 144). Обновление выпадашек —
       СВОЁ: у кортов счётчики в списках зависят от набранного. */
    function initSearchInput() {
        KSLT_VITRINA.поиск('courtsSearch', function (строка) {
            _searchQuery = строка;
            _currentPage = 1;
        }, renderGrid, refreshDropdowns);
    }

    /* Чипов типа в полосе больше нет — тип выбирается выпадашкой, и её
       нажатия разбирает initDropdowns. Отдельный обработчик `.ct-filter-btn`
       снят: он остался бы слушателем, которому некого слушать. */
    function initFilterClicks() {
        initDropdowns();
    }

    function refreshDropdowns() {
        var chips = document.getElementById('courtsChips');
        if (!chips) return;

        chips.querySelectorAll('.ct-dd').forEach(function(el) { el.remove(); });
        chips.insertAdjacentHTML('beforeend',
            dropdownHtml('type') + dropdownHtml('city') + dropdownHtml('surface'));
    }

    function initDropdowns() {
        document.addEventListener('click', function(e) {
            var toggle = e.target.closest('.ct-dd-toggle');
            var item = e.target.closest('.ct-dd-item');

            // Клик мимо — закрываем открытое
            /* `aria-expanded` ходит ВМЕСТЕ с классом open, и обновляется в
               одном месте — иначе диктор и экран разойдутся на первом же
               закрытии «кликом мимо» */
            var закрытьВсе = function() {
                document.querySelectorAll('.ct-dd.open').forEach(function(d) {
                    d.classList.remove('open');
                    var к = d.querySelector('.ct-dd-toggle');
                    if (к) к.setAttribute('aria-expanded', 'false');
                });
            };

            if (!toggle && !item) {
                закрытьВсе();
                return;
            }

            if (toggle) {
                var dd = toggle.closest('.ct-dd');
                var wasOpen = dd.classList.contains('open');
                закрытьВсе();
                dd.classList.toggle('open', !wasOpen);
                toggle.setAttribute('aria-expanded', String(!wasOpen));
                return;
            }

            var wrap = item.closest('.ct-dd');
            var kind = wrap.getAttribute('data-dd');
            var value = item.getAttribute('data-dd-value');
            if (kind === 'type') currentTypeFilter = value;
            else if (kind === 'city') currentCityFilter = value;
            else currentSurfaceFilter = value;

            wrap.classList.remove('open');
            var кнопкаWrap = wrap.querySelector('.ct-dd-toggle');
            if (кнопкаWrap) кнопкаWrap.setAttribute('aria-expanded', 'false');
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

    /* Корт считается новым 30 дней со дня заведения. Нет даты — не новый:
       отсутствие признака не повод рисовать метку. */
    var ДНЕЙ_НОВИЗНЫ = 30;
    function новыйЛи(когда) {
        if (!когда) return false;
        var д = new Date(когда);
        if (isNaN(д.getTime())) return false;
        return (Date.now() - д.getTime()) < ДНЕЙ_НОВИЗНЫ * 24 * 60 * 60 * 1000;
    }

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
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-muted);">' + (KSLT_YAZYK.выбрать('Loading...', 'Жүктөлүүдө...', 'Загрузка...')) + '</div>';
            return;
        }

        document.title = 'KSLT \u2014 ' + court.name;
        renderDetailHero(court);
        renderDetail(court);
        initScrollAnimations();
    }

    /** Корта нет среди опубликованных — говорим это, а не крутим загрузку */
    function нетКорта() {
        var container = document.getElementById('courtDetail');
        var hero = document.getElementById('courtDetailHero');
        if (hero) hero.innerHTML = '';
        if (!container) return;
        var заголовок = KSLT_YAZYK.выбрать('Court is not published yet', 'Корт азырынча жарыяланган жок', 'Корт ещё не открыт');
        var текст = KSLT_YAZYK.выбрать('It may be in preparation or removed from the site.', 'Ал даярдалууда же сайттан алынган болушу мүмкүн.', 'Возможно, он готовится или снят с сайта.');
        var кнопка = KSLT_YAZYK.выбрать('All courts', 'Бардык корттор', 'Все корты');
        var адрес = KSLT_YAZYK.выбрать('courts-en.html', 'courts-kg.html', 'courts.html');
        document.title = 'KSLT \u2014 ' + заголовок;
        container.innerHTML =
            '<div class="ct-empty">' +
                '<h2 class="ct-empty-title">' + заголовок + '</h2>' +
                '<p class="ct-empty-text">' + текст + '</p>' +
                '<a class="btn-primary" href="' + адрес + '">' + кнопка + '</a>' +
            '</div>';
    }

    function renderDetailHero(court) {
        var hero = document.getElementById('courtDetailHero');
        if (!hero) return;
        var subtitle = court.address || '';
        // Фотографий у кортов пока нет ни у одного: реестр собирали из 2ГИС
        // и гидов, снимки будем добавлять по мере получения. Пока подставляем
        // общую картинку раздела — иначе шапка карточки просто чёрная
        var heroBg = court.photo || FALLBACK_PHOTO;
        hero.innerHTML =
            '<div class="ct-hero-bg" style="background-image: url(\'' + KSLT_экранировать(heroBg) + '\')"></div>' +
            '<div class="ct-hero-content">' +
                '<h1 class="ct-hero-title">' + court.name + '</h1>' +
                '<p class="ct-hero-subtitle">' + subtitle + '</p>' +
            '</div>';
    }

    function renderDetail(court) {
        var container = document.getElementById('courtDetail');
        if (!container) return;

        var courtsLink = KSLT_YAZYK.выбрать('courts-en.html', 'courts-kg.html', 'courts.html');
        var authLink = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');
        var typeLabel = court._typeDesc || (court.type === 'indoor' ? L_labels.filterIndoor : L_labels.filterOutdoor);

        // Breadcrumb — render before container so it's outside .ct-container
        var servicesLink = KSLT_YAZYK.выбрать('services-en.html', 'services-kg.html', 'services.html');
        var breadcrumb = document.createElement('div');
        // Тот же плавающий возврат, что на странице игрока: один вид на
        // всех карточках, и он не уезжает вместе с баннером
        breadcrumb.className = 'kslt-back-wrap kslt-back-float';
        breadcrumb.innerHTML =
            '<a href="' + servicesLink + '" class="kslt-back">\u2190 ' + (KSLT_YAZYK.выбрать('Services', 'Кызматтар', 'Услуги')) + '</a>' +
            '<span class="kslt-back-sep">/</span>' +
            '<a href="' + courtsLink + '" class="kslt-back">' + L_labels.backBtn + '</a>';
        container.parentNode.insertBefore(breadcrumb, container);

        var html = '';

        // Header
        html += '<div class="ct-detail-header ct-fade-in">' +
            '<img src="' + KSLT_экранировать(court.photo || FALLBACK_PHOTO) + '" alt="' + KSLT_экранировать(court.name) + '" class="ct-detail-photo">' +
            '<div class="ct-detail-info">' +
                /* ВТОРОЙ `h1` СНЯТ 13.10. Обложка выше уже несёт имя корта заголовком
                   первого уровня — здесь был ещё один, с тем же текстом: диктор читал
                   заголовок дважды. Слово Кости: «имя оставляем на H1, на обложке».
                   Вид не изменился, правило переехало на класс `.ct-detail-name`. */
                '<div class="ct-detail-title-row"><div class="ct-detail-name">' + court.name + '</div>' +
                (court._promoted ? '<span class="kslt-recommended-detail">' + L_labels.recommendedBadge + '</span>' : '') +
                '</div>' +
                '<div class="ct-detail-type">' + typeLabel + (court.surface ? ' \u00b7 ' + court.surface : '') +
                    (court.partner ? ' \u00b7 <span class="ct-partner-badge">' + L_labels.partnerBadge + '</span>' : '') +
                '</div>' +
                (court.address ? '<div class="ct-detail-address"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + court.address + '</div>' : '') +
                (court.phone ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> <a href="tel:' + court.phone.split(',')[0].replace(/\s/g, '') + '">' + KSLT_экранировать(prettyPhone(court.phone)) + '</a></div>' : '') +
                (court.whatsapp ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> <a href="https://wa.me/' + KSLT_экранировать(court.whatsapp.replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + KSLT_экранировать(prettyPhone(court.whatsapp)) + '</a></div>' : '') +
                (court.instagram ? '<div class="ct-detail-phone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> <a href="https://instagram.com/' + KSLT_экранировать(court.instagram.replace(/^@/, '')) + '" target="_blank" rel="noopener">' + KSLT_экранировать(court.instagram) + '</a></div>' : '') +
            '</div>' +
        '</div>';

        // «1 корт», «2 корта», «5 кортов» — на карточке стояло жёсткое «кортов»,
    // и выходило «1 кортов»
    function словоКорты(n) {
        if (isEn) return n === 1 ? 'court' : 'courts';
        if (isKg) return 'корт';
        var сотня = n % 100;
        if (сотня >= 11 && сотня <= 14) return 'кортов';
        var последняя = n % 10;
        if (последняя === 1) return 'корт';
        if (последняя >= 2 && последняя <= 4) return 'корта';
        return 'кортов';
    }

    // Stats — single combined card
        var allSurfaces = [];
        var surfaceSeen = {};
        (court._courtTypes || []).forEach(function(ct) {
            var sLabel = ПОКРЫТИЯ[ct.surface] || ct.surface;
            if (sLabel && !surfaceSeen[sLabel]) { surfaceSeen[sLabel] = true; allSurfaces.push(sLabel); }
        });
        var surfacesText = allSurfaces.join(', ') || court.surface;
        var priceFromText = court.price ? ((KSLT_YAZYK.выбрать('from ', 'дан ', 'от ')) + court.price + ' ' + (KSLT_YAZYK.выбрать('som/hr', 'сом/саат', 'сом/час'))) : '';

        // Показываем только то, что известно. Раньше строка собиралась жёстко,
        // и у корта без данных выходило «0 кортов ·» — ноль и висячая точка
        var показатели = [];
        if (court.courtsCount) показатели.push(KSLT_экранировать(court.courtsCount + ' ' + словоКорты(court.courtsCount)));
        if (surfacesText) показатели.push(KSLT_экранировать(surfacesText));
        if (priceFromText) показатели.push(KSLT_экранировать(priceFromText));

        if (показатели.length) {
            html += '<div class="ct-detail-stats ct-detail-stats-single ct-fade-in">' +
                '<div class="ct-detail-stat-combined">' +
                    показатели.map(function(т) { return '<span class="ct-stat-item">' + т + '</span>'; })
                        .join('<span class="ct-stat-sep">\u00b7</span>') +
                '</div>' +
            '</div>';
        }

        // Court Types table
        if (court._courtTypes && court._courtTypes.length > 0) {
            var TYPE_LABELS = { indoor: (KSLT_YAZYK.выбрать('Indoor', 'Жабык', 'Крытый')), outdoor: (KSLT_YAZYK.выбрать('Outdoor', 'Ачык', 'Открытый')) };
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
                var surfaceLabel = ПОКРЫТИЯ[ct.surface] || ct.surface;
                var priceText = ct.price ? (ct.price + ' ' + (KSLT_YAZYK.выбрать('som/hr', 'сом/саат', 'сом/час'))) : '—';
                if (ct.partner && ct.discount) {
                    priceText += ' <span class="ct-svc-discount">KSLT -' + ct.discount + '%</span>';
                } else if (ct.partner) {
                    priceText += ' <span class="ct-svc-discount">KSLT</span>';
                }
                html += '<div class="ct-types-row">' +
                    '<span>' + KSLT_экранировать(typeLabel) + '</span>' +
                    '<span>' + KSLT_экранировать(surfaceLabel) + '</span>' +
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
                var svcName = KSLT_YAZYK.выбрать(svc.name_en || svc.name, svc.name_kg || svc.name, svc.name);
                var priceText = svc.price ? (svc.price + ' ' + (KSLT_YAZYK.выбрать('som/hr', 'сом/саат', 'сом/час'))) : '—';
                if (svc.partner && svc.discount) {
                    priceText += ' <span class="ct-svc-discount">KSLT -' + svc.discount + '%</span>';
                } else if (svc.partner) {
                    priceText += ' <span class="ct-svc-discount">KSLT</span>';
                }
                html += '<div class="ct-services-row">' +
                    '<span>' + KSLT_экранировать(svcName || '') + '</span>' +
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
                    '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (KSLT_YAZYK.выбрать('Loading...', 'Жүктөлүүдө...', 'Загрузка...')) + '</p>' +
                '</div>' +
            '</div>';
        }

        // Gallery
        if (court.gallery && court.gallery.length > 0) {
            html += '<div class="ct-section ct-fade-in">' +
                '<h2 class="ct-section-title">' + L_labels.galleryTitle + '</h2>' +
                '<div class="ct-gallery">';
            court.gallery.forEach(function(img) {
                html += '<img src="' + KSLT_экранировать(img) + '" alt="' + KSLT_экранировать(court.name) + '" class="ct-gallery-img" loading="lazy">';
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
            var mapEmbedUrl = window.KSLT_KARTA.встроить(court.google_maps_url, court.address) ||
                              window.KSLT_KARTA.встроить(court.twogis_url, court.address);
            html += '<div class="ct-section ct-fade-in">';
            html += '<h2 class="ct-section-title">' + L_labels.locationTitle + '</h2>';
            if (mapEmbedUrl) {
                html += '<div class="ct-map-embed"><iframe src="' + KSLT_экранировать(mapEmbedUrl) + '" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>';
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
            html: '<div style="width:16px;height:16px;background:var(--accent);border-radius:50%;border:2px solid #000;box-shadow:0 0 10px var(--alpha-lime-50);"></div>',
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
                container.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (KSLT_YAZYK.выбрать('No discounts available', 'Арзандатуу жок', 'Скидок пока нет')) + '</p>';
                return;
            }

            var html = '';
            services.forEach(function(svc) {
                var svcName = KSLT_YAZYK.выбрать(svc.service_name_en || svc.service_name, svc.service_name_kg || svc.service_name, svc.service_name);
                html += '<div class="ct-discount-item">' +
                    '<div class="ct-discount-info">' +
                        '<span class="ct-discount-name">' + KSLT_экранировать(svcName) + '</span>' +
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




    /* ===== LIMIT MODAL ===== */


    /* ===== SCROLL ANIMATIONS ===== */

    /* ПОЯВЛЕНИЕ — ДОМ ВИТРИНЫ (кусок 144). */
    function initScrollAnimations() {
        KSLT_VITRINA.появление('ct');
    }

})();
