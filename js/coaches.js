(function() {
    'use strict';

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    function coachMapLinks(coach) {
        var gm = coach._courtMapGoogle || '';
        var tg = coach._courtMapTwogis || '';
        if (!gm && !tg) return '';
        var html = ' <span class="co-map-links">';
        if (gm) html += '<a href="' + KSLT_экранировать(gm) + '" target="_blank" rel="noopener" class="co-map-link">Google Maps &#8599;</a>';
        if (gm && tg) html += ' ';
        if (tg) html += '<a href="' + KSLT_экранировать(tg) + '" target="_blank" rel="noopener" class="co-map-link">2GIS &#8599;</a>';
        html += '</span>';
        return html;
    }

    /* ЗДЕСЬ СТОЯЛА МЁРТВАЯ КОПИЯ КАРТЫ — 19 строк, которые не звались
       НИГДЕ: ни в js, ни в html, ни в приложении. Снята 19.10 после
       проверки поиском по всему продукту, а не по виду. Понадобится —
       дом `js/kslt-karta.js` уже есть. */
    function coachMapSection(coach) {
        var gm = coach._courtMapGoogle || '';
        var tg = coach._courtMapTwogis || '';
        if (!gm && !tg) return '';

        var html = '<div class="co-section co-fade-in">' +
            '<h2 class="co-section-title">' + (KSLT_YAZYK.выбрать('Location', 'Жайгашкан жери', 'Расположение')) + '</h2>' +
            '<div class="co-map-links-section">';
        if (tg) html += '<a href="' + KSLT_экранировать(tg) + '" target="_blank" rel="noopener" class="co-map-link-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 2GIS</a>';
        if (gm) html += '<a href="' + KSLT_экранировать(gm) + '" target="_blank" rel="noopener" class="co-map-link-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Google Maps</a>';
        html += '</div></div>';
        return html;
    }

    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;
    /* АНГЛИЙСКАЯ ВЕТКА ЗАВЕДЕНА 12.10 — её не было, как и у кортов.
       `experience` на КАРТОЧКЕ намеренно короткое: замер 12.10 дал
       «лет опыта» 53.4 против «years of experience» 103.3 — почти вдвое,
       и это самое узкое место карточки. Полная подпись живёт на странице
       тренера, где место есть (`experienceFull`).

       Крючок `window.coachesLabels` снят: его не задавал никто. */
    var L = KSLT_YAZYK.выбрать({
        heroTitle: "Coaches",
        heroSubtitle: "Professional coaches for players of every level",
        filterAll: "All",
        ddAge: "Age",
        ddForm: "Format",
        ddLevel: "Level",
        filterAdults: "Adults",
        filterKids: "Kids",
        filterGroup: "Group",
        filterIndividual: "Individual",
        filterBeginner: "Beginners",
        filterAdvanced: "Advanced",
        experience: "years",
        experienceFull: "years of experience",
        students: "students",
        rating: "rating",
        priceFrom: "from",
        priceCurrency: "som/hour",
        detailsBtn: "Details",
        bookBtn: "KSLT discount",
        shownOf: "of",
        pageOf: "of",
        prevPage: "\u2190 Back",
        nextPage: "Next \u2192",
        bioTitle: "About the coach",
        achievementsTitle: "Achievements",
        scheduleTitle: "Schedule",
        reviewsTitle: "Student reviews",
        ctaTitle: "Discounts for KSLT members",
        ctaText: "Sign up and become a KSLT member for discounts at partner coaches",
        ctaBtn: "Book a session",
        backBtn: "All coaches",
        court: "Court",
        loginToContact: "Sign in to get in touch",
        noContacts: "No contacts listed",
        contactCoach: "Contact the coach",
        searchPlaceholder: "Search coaches...",
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
        noDiscountsConfigured: "No discounts set up yet"
    }, {
        heroTitle: 'Машыктыруучулар',
        heroSubtitle: 'Бардык деңгээлдеги оюнчулар үчүн кесипкөй машыктыруучулар',
        filterAll: 'Баары',
        ddAge: 'Жашы',
        ddForm: 'Сабак',
        ddLevel: 'Деңгээл',
        filterAdults: 'Чоңдор',
        filterKids: 'Балдар',
        filterGroup: 'Топтук',
        filterIndividual: 'Жеке',
        filterBeginner: 'Башталгыч',
        filterAdvanced: 'Алдыңкы',
        experience: 'жыл тажрыйба',
        experienceFull: 'жыл тажрыйба',
        students: 'окуучу',
        rating: 'рейтинг',
        priceFrom: 'дан',
        priceCurrency: 'сом/саат',
        detailsBtn: 'Толугураак',
        bookBtn: 'KSLT арзандатуу',
        shownOf: 'ичинен',
        pageOf: 'ичинен',
        prevPage: '\u2190 Артка',
        nextPage: 'Кийинки \u2192',
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
    }, {
        heroTitle: "Тренеры",
        heroSubtitle: "Профессиональные тренеры для игроков всех уровней",
        filterAll: "Все",
        ddAge: "Возраст",
        ddForm: "Занятия",
        ddLevel: "Уровень",
        filterAdults: "Взрослые",
        filterKids: "Дети",
        filterGroup: "Групповые",
        filterIndividual: "Индивидуальные",
        filterBeginner: "Начинающие",
        filterAdvanced: "Продвинутые",
        experience: "лет опыта",
        experienceFull: "лет опыта",
        students: "учеников",
        rating: "рейтинг",
        priceFrom: "от",
        priceCurrency: "сом/час",
        detailsBtn: "Подробнее",
        bookBtn: "Скидка KSLT",
        shownOf: "из",
        pageOf: "из",
        prevPage: "\u2190 Назад",
        nextPage: "Далее \u2192",
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

    // Заготовок больше нет: при сбое базы показывались выдуманные тренеры,
    // которых нет в админке, — их нельзя было ни изменить, ни удалить
    var loadFailed = false;
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
    /* ШАГ СТРАНИЦЫ — КОЛОНОК × РЯДОВ, А НЕ ЧИСЛО. То же решение, что на
       кортах 07.10: рядов держит css (`--co-ryadov`, 4 и 3 на границе
       992), колонок считает браузер — их у `auto-fill` 4 · 3 · 2 внутри
       одной границы, числом не описать. */
    var PER_PAGE = 16;
    var _шагИдёт = false;
    var _currentPage = 1;
    // Три признака выбираются независимо: возраст, форма занятий, уровень.
    // Раньше был один фильтр на всё — семь чипов в три строки, и выбрать
    // «дети + индивидуально» было нельзя
    var _currentFilter = 'all';
    var _ddFilters = { age: 'all', form: 'all', level: 'all' };
    var _searchQuery = '';

    async function detectAccess() {
        /* УРОВЕНЬ ДОСТУПА — У ДОМА (js/kslt-dostup.js). Здесь стояла своя
           копия: пять копий одного понятия разошлись, и эта не считала
           админа членом клуба. */
        _accessLevel = await KSLT_DOSTUP.уровень();
    }

    /* ОДНО УВЕДОМЛЕНИЕ НА САЙТ — компонент Toast 30:59 требует этого
       сам: «four separate notification mechanisms… They should all render
       this one component». Своя копия снята заходом B1, 14.10.
       ИМЯ ФУНКЦИИ ОСТАВЛЕНО НА МЕСТЕ: вызовы в этом файле не трогаются,
       правится одно тело вместо каждого вызова.
       Перевод тона живёт в модуле — одно определение, а не семь. */
    // All data (Supabase + static)
    var allData = [];

    // Map Supabase row to card-compatible format
    function mapDbCoach(row) {
        var name = isEn
            ? ((row.last_name_en || row.last_name || '') + ' ' + (row.first_name_en || row.first_name || '')).trim() || row.name_en || row.name
            : isKg
            ? ((row.last_name_kg || row.last_name || '') + ' ' + (row.first_name_kg || row.first_name || '')).trim() || row.name_kg || row.name
            : ((row.last_name || '') + ' ' + (row.first_name || '')).trim() || row.name;
        var spec = KSLT_YAZYK.выбрать(row.position_en || row.position || '', row.position_kg || row.position || '', row.position || '');
        var shortDesc = KSLT_YAZYK.выбрать(row.short_desc_en || row.short_desc || '', row.short_desc_kg || row.short_desc || '', row.short_desc || '');
        var bio = KSLT_YAZYK.выбрать(row.bio_en || row.bio || '', row.bio_kg || row.bio || '', row.bio || '');
        var court = KSLT_YAZYK.выбрать(row.court_en || row.court || '', row.court_kg || row.court || '', row.court || '');
        var achievements = KSLT_YAZYK.выбрать(row.achievements_en || row.achievements || [], row.achievements_kg || row.achievements || [], row.achievements || []);
        return {
            id: row.id,
            _isDb: true,
            name: name,
            // Своя картинка вместо чужой со стоков: внешний сервер отвечает
            // не всегда, и на месте фотографии оставалась пустая рамка
            photo: row.photo || '../images/heroes/coaches.jpg',
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
        return KSLT_VITRINA.продвинутыеПервыми(arr);
    }

    // Load from Supabase then init
    function loadAndInit() {
        var client = window.supabaseClient;
        if (client) {
            client.from('coaches').select('*').order('created_at', { ascending: false })
                .then(function(res) {
                    // База ответила — показываем ровно то, что в ней есть.
                    // Пустой список и недоступная база — разные вещи: раньше
                    // при пустой базе подставлялись заготовки, и на странице
                    // висели выдуманные тренеры, которых нет в админке. Их
                    // нельзя было ни изменить, ни удалить
                    if (!res.error) {
                        var dbCoaches = (res.data || []).map(function(row) { return mapDbCoach(row); });
                        sortPromotedFirst(dbCoaches).forEach(function(c) { allData.push(c); });
                    } else {
                        console.error('[KSLT] тренеры не загружены:', res.error.message || res.error);
                        loadFailed = true;
                    }
                    init();
                });
        } else {
            loadFailed = true;
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
        следитьЗаШагом();
        initCtaClicks();
        initScrollAnimations();
        detectAccess();
    }

    /* ОБЛОЖКА РАЗДЕЛА — ДОМ ВИТРИНЫ (кусок 144). Название без лаймовой
       подсветки: заголовки разделов на сайте белые. */
    function renderHero() {
        KSLT_VITRINA.обложка(document.getElementById('coachesHero'), {
            приставка: 'co',
            картинка: '../images/heroes/coaches.jpg',
            заголовок: L.heroTitle,
            подзаголовок: L.heroSubtitle
        });
    }

    // Три выпадающих списка вместо семи чипов: столько же признаков,
    // но одна строка вместо трёх. Вид тот же, что у фильтров на кортах
    function ddГруппы() {
        return [
            { kind: 'age', title: L.ddAge, options: [
                { value: 'adults', label: L.filterAdults },
                { value: 'kids', label: L.filterKids }
            ] },
            { kind: 'form', title: L.ddForm, options: [
                { value: 'group', label: L.filterGroup },
                { value: 'individual', label: L.filterIndividual }
            ] },
            { kind: 'level', title: L.ddLevel, options: [
                { value: 'beginner', label: L.filterBeginner },
                { value: 'advanced', label: L.filterAdvanced }
            ] }
        ];
    }

    // Сколько тренеров попадёт под значение — видно до нажатия
    function ddСчёт(value) {
        return (allData || []).filter(function(c) {
            return (c.tags || []).indexOf(value) !== -1;
        }).length;
    }

    function ddРазметка(g) {
        var выбрано = _ddFilters[g.kind];
        var подпись = g.title;
        g.options.forEach(function(o) { if (o.value === выбрано) подпись = o.label; });

        var пункты = '<button class="f-dd-item' + (выбрано === 'all' ? ' active' : '') +
            '" data-dd-value="all">' + L.filterAll + '</button>';
        g.options.forEach(function(o) {
            пункты += '<button class="f-dd-item' + (o.value === выбрано ? ' active' : '') +
                '" data-dd-value="' + o.value + '">' + o.label +
                '<span class="f-dd-count">' + ddСчёт(o.value) + '</span></button>';
        });

        return '<div class="f-dd" data-dd="' + g.kind + '">' +
            '<button class="trn-chip f-dd-toggle' + (выбрано !== 'all' ? ' active' : '') + '">' +
                подпись +
                '<svg class="f-dd-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="f-dd-menu">' + пункты + '</div>' +
        '</div>';
    }

    function renderFilters() {
        var container = document.getElementById('coachesFilters');
        if (!container) return;
        var группы = ddГруппы();
        var servicesLink = KSLT_YAZYK.выбрать('services-en.html', 'services-kg.html', 'services.html');

        // Полоса та же, что на страницах категорий турниров и на кортах:
        // общий вид на весь сайт. Ссылка «назад» внутри полосы — снаружи
        // она уезжала при первой же прокрутке
        container.className = 'trn-filters';
        var html =
            '<div class="trn-filters-inner">' +
                '<a href="' + servicesLink + '" class="kslt-back trn-back">\u2190 ' +
                    (KSLT_YAZYK.выбрать('Services', 'Кызматтар', 'Услуги')) + '</a>' +
                '<div class="trn-search-wrap">' +
                    '<svg class="trn-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                    '<input type="text" class="trn-search-input" id="coachesSearch" placeholder="' + L.searchPlaceholder + '" autocomplete="off">' +
                '</div>' +
                '<div class="trn-chips">';
        группы.forEach(function(g) { html += ddРазметка(g); });
        html += '</div></div>';
        container.innerHTML = html;

        /* ЛИПКОСТЬ ПОЛОСЫ — ДОМ ВИТРИНЫ (кусок 144). Это понятие написано
           в ВОСЬМИ файлах сайта побайтово; сведены два, остальные шесть
           записаны. */
        KSLT_VITRINA.липнетПолоса(container);
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
        Object.keys(_ddFilters).forEach(function(kind) {
            var value = _ddFilters[kind];
            if (value === 'all') return;
            filtered = filtered.filter(function(c) {
                return (c.tags || []).indexOf(value) !== -1;
            });
        });

        // Пустой список — не повод показывать голую страницу. Тренеров в
        // клубе пока нет, и человек должен понять это, а не решить, что
        // страница сломалась
        if (filtered.length === 0) {
            var emptyText;
            if (loadFailed) {
                emptyText = KSLT_YAZYK.выбрать('Could not load the coaches. Please refresh the page.', 'Машыктыруучулардын тизмеси жүктөлгөн жок. Баракты жаңылаңыз.', 'Не удалось загрузить список тренеров. Обновите страницу.');
            } else if (_searchQuery || естьВыбранныйФильтр()) {
                emptyText = KSLT_YAZYK.выбрать('No coaches match your search', 'Издөө боюнча машыктыруучу табылган жок', 'По вашему запросу тренеров не нашлось');
            } else {
                emptyText = KSLT_YAZYK.выбрать('The list of coaches will appear soon', 'Машыктыруучулардын тизмеси жакында пайда болот', 'Список тренеров скоро появится');
            }
            container.innerHTML = '<div class="co-empty">' +
                '<div class="co-empty-icon">' + (loadFailed ? '\u26A0\uFE0F' : '\uD83C\uDFBE') + '</div>' +
                '<p>' + emptyText + '</p>' +
            '</div>';
            renderPagination(0, 1);
            return;
        }

        var start = (_currentPage - 1) * PER_PAGE;
        var pageItems = filtered.slice(start, start + PER_PAGE);

        var detailBase = KSLT_YAZYK.выбрать('coach-en.html', 'coach-kg.html', 'coach.html');
        var authLink = KSLT_YAZYK.выбрать('auth-en.html?redirect=coaches', 'auth-kg.html?redirect=coaches', 'auth.html?redirect=coaches');
        var html = '<div class="co-grid">';
        pageItems.forEach(function(c) {
            /* «Подробнее →» снято: карточка САМА ссылка на тренера, и
               кнопка была нажимаемым внутри нажимаемого. Остаётся одно
               действие, которое карточку не повторяет. */
            var contactHtml = '<div class="co-card-actions">' +
                '<span class="co-card-cta" data-id="' + c.id + '">' + L.bookBtn + '</span>' +
            '</div>';

            // Stats
            var statsHtml = '';
            if (c.experience) {
                statsHtml += '<div class="co-card-stat"><div class="co-card-stat-num">' + KSLT_экранировать(c.experience) + '</div><div class="co-card-stat-label">' + L.experience + '</div></div>';
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
                    '<img src="' + KSLT_экранировать(c.photo) + '" alt="' + KSLT_экранировать(c.name) + '" class="co-card-photo">' +
                    promoBadge +
                '</div>' +
                /* Тело карточки отдельной коробкой — как у кортов и у
                   витрины лендинга: фотография во всю ширину, текст в
                   своих полях, и ритм задаёт один `gap`. */
                '<div class="co-card-body">' +
                    '<div class="co-card-name">' + KSLT_экранировать(c.name) + '</div>' +
                    (c.specialization ? '<div class="co-card-spec">' + KSLT_экранировать(c.specialization) + '</div>' : '') +
                    (c.shortDesc ? '<div class="co-card-desc">' + c.shortDesc + '</div>' : '') +
                    (statsHtml ? '<div class="co-card-stats">' + statsHtml + '</div>' : '') +
                    (c.price ? '<div class="co-card-price">' + L.priceFrom + ' <strong>' + c.price + '</strong> ' + L.priceCurrency + '</div>' : '') +
                    contactHtml +
                '</div>' +
            '</a>';
        });
        html += '</div>';
        container.innerHTML = html;
        /* ШАГ ИЗВЕСТЕН ТОЛЬКО ПОСЛЕ РАСКЛАДКИ: колонки у `auto-fill`
           считает браузер. Сторож держит ровно один повтор. */
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

    /* ШАГ И СЛЕЖЕНИЕ — ОДНИМ ЗОВОМ ДОМА (кусок 144). Здесь остаётся только
       своё: имя сетки, имя рядов и СВОЁ ЧИСЛО — его дом спрашивает и
       отдаёт, а не хранит. */
    var пересчитатьШаг = KSLT_VITRINA.пересчётШага({
        селектор: '.co-grid',
        ряды: '--co-ryadov',
        взять: function () { return PER_PAGE; },
        поставить: function (н) { PER_PAGE = н; }
    });

    /* ResizeObserver, а не resize окна: коробка витрины меняет ширину и от
       поворота, и от появления полосы прокрутки. */
    function следитьЗаШагом() {
        KSLT_VITRINA.следитьЗаШириной(document.getElementById('coachesGrid'), function () {
            if (пересчитатьШаг()) renderGrid();
        });
    }

    // ---- PAGINATION ----
    function renderPagination(total, page) {
        var container = document.getElementById('coachesPagination');
        if (!container) return;

        /* ПОЛОСА СТРАНИЦ — ОБЩИЙ КОМПОНЕНТ, `js/polosa-stranic.js`.
           Своя была третьей копией одного понятия: слова вместо шевронов,
           все номера подряд без окна и без счётчика строк. */
        if (!window.KSLT_полосаСтраниц) { container.innerHTML = ''; return; }
        window.KSLT_полосаСтраниц(container, total, page, PER_PAGE, L);
    }

    function initPaginationClicks() {
        KSLT_VITRINA.нажатияПолосы(document.getElementById('coachesGrid'),
            function () { return _currentPage; },
            function (n) { _currentPage = n; },
            renderGrid);
    }

    // ---- SPONSORS — loaded via sponsors-loader.js ----

    /* ЧЛЕНСКОЕ ОКНО — ДОМ ВИТРИНЫ (кусок 144). Разметка, значки и
       закрытие были побайтовой копией кортов; своё здесь — приставка и два
       текста, в которых названы именно тренеры. */
    function showMembershipModal(level) {
        KSLT_VITRINA.членскоеОкно({
            подложка: 'co-membership-overlay',
            окно: 'co-membership-modal',
            закрыть: 'co-membership-close',
            значок: 'co-membership-icon',
            кнопка: 'co-membership-btn'
        }, level, {
            гостю: KSLT_YAZYK.выбрать(
                'Register and become a KSLT member to get discounts at partner coaches',
                'Катталыңыз жана KSLT мүчөсү болуп, машыктыруучулардан арзандатуу алыңыз',
                'Зарегистрируйтесь и оформите членство KSLT, чтобы получить скидки у партнёрских тренеров'),
            безЧленства: KSLT_YAZYK.выбрать(
                'Become a KSLT member to unlock discounts at partner coaches',
                'KSLT мүчөсү болуп, машыктыруучулардан арзандатуу алыңыз',
                'Оформите членство KSLT, чтобы получить скидки у партнёрских тренеров')
        });
    }

    /* ИМЕНА КЛАССОВ ВАУЧЕРА ПЕРЕЕХАЛИ В ДОМ — кусок 148. Здесь лежала
       своя карта из 30 имён с приставкой раздела, и такая же — у
       близнеца. Замер показал: вид описан дважды побайтово, а в кабинете
       третий раз инлайном. Вид один, имя одно (`kslt-`), карта одна — в
       `js/kslt-vaucher-blok.js`. */

    /* ВАУЧЕРНЫЙ БЛОК — ДОМ `js/kslt-vaucher-blok.js` (кусок 145). Эти шесть
       функций стояли здесь и у близнеца СЛОВО В СЛОВО, 271 строка на
       сторону: расходились только приставки классов, адреса окон и имена
       самих функций. Имена оставлены прежними — их зовут соседние места. */
    function coCtaLoadServices(кнопка, видСущности, idСущности) {
        KSLT_VAUCHER_BLOK.услугиПоКнопке({
            кнопка: кнопка, видСущности: видСущности, idСущности: idСущности,
            L: L
        });
    }

    function coShowServicePicker(видСущности, idСущности, услуги) {
        KSLT_VAUCHER_BLOK.выборУслуги({
            видСущности: видСущности, idСущности: idСущности, услуги: услуги,
            L: L
        });
    }

    function coLoadVoucherHistory(видСущности, idСущности, услуги, уровень, коробка) {
        KSLT_VAUCHER_BLOK.история({
            видСущности: видСущности, idСущности: idСущности, услуги: услуги,
            уровень: уровень, коробка: коробка, L: L
        });
    }

    function coGenerateVoucher(видСущности, idСущности, idУслуги, послеУспеха) {
        KSLT_VAUCHER_BLOK.завести({
            видСущности: видСущности, idСущности: idСущности, idУслуги: idУслуги,
            послеУспеха: послеУспеха, L: L
        });
    }

    function coShowVoucherModal(ваучер) {
        KSLT_VAUCHER_BLOK.окноВаучера({ ваучер: ваучер, L: L });
    }

    function coShowLimitModal(причина) {
        KSLT_VAUCHER_BLOK.окноЛимита({ причина: причина, L: L });
    }

    /* НАЖАТИЕ КНОПКИ КАРТОЧКИ — ДОМ ВИТРИНЫ (кусок 144). У кортов то же
       самое было записано двумя `if` подряд вместо одного со связкой —
       ПОВЕДЕНИЕ ОДНО, проверено по дереву. */
    function initCtaClicks() {
        KSLT_VITRINA.нажатияКарточки('coachesGrid', '.co-card-cta',
            function () { return _accessLevel; },
            function (кнопка, id) { coCtaLoadServices(кнопка, 'coach', id); },
            showMembershipModal);
    }



    /* ПОЛЕ ПОИСКА — ДОМ ВИТРИНЫ (кусок 144). У кортов после перерисовки
       обновляются выпадашки — это стало крючком, здесь крючка нет. */
    function initSearchInput() {
        KSLT_VITRINA.поиск('coachesSearch', function (строка) {
            _searchQuery = строка;
            _currentPage = 1;
        }, renderGrid);
    }

    function перерисоватьСписки() {
        var полоса = document.querySelector('#coachesFilters .trn-chips');
        if (!полоса) return;
        var html = '';
        ddГруппы().forEach(function(g) { html += ddРазметка(g); });
        полоса.innerHTML = html;
    }

    function естьВыбранныйФильтр() {
        return Object.keys(_ddFilters).some(function(k) { return _ddFilters[k] !== 'all'; });
    }

    // Открыть список, выбрать значение, закрыть по клику мимо —
    // тот же порядок, что у фильтров на кортах
    function initFilterClicks() {
        document.addEventListener('click', function(e) {
            var кнопка = e.target.closest ? e.target.closest('.f-dd-toggle') : null;
            var пункт = e.target.closest ? e.target.closest('.f-dd-item') : null;

            if (кнопка) {
                var список = кнопка.closest('.f-dd');
                var былОткрыт = список.classList.contains('open');
                document.querySelectorAll('.f-dd.open').forEach(function(d) { d.classList.remove('open'); });
                if (!былОткрыт) список.classList.add('open');
                return;
            }

            if (пункт) {
                var обёртка = пункт.closest('.f-dd');
                var вид = обёртка.getAttribute('data-dd');
                _ddFilters[вид] = пункт.getAttribute('data-dd-value');
                обёртка.classList.remove('open');
                _currentPage = 1;
                // Перерисовываем только сами списки: полоса целиком унесла бы
                // с собой поле поиска — вместе с набранным текстом и его
                // обработчиком, привязанным при первой отрисовке
                перерисоватьСписки();
                renderGrid();
                return;
            }

            document.querySelectorAll('.f-dd.open').forEach(function(d) { d.classList.remove('open'); });
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
            if (container) container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Coach not found</h2><a href="' + (KSLT_YAZYK.выбрать('coaches-en.html', 'coaches-kg.html', 'coaches.html')) + '" class="kslt-back">\u2190 ' + L.backBtn + '</a></div>';
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
            '<div class="co-hero-bg" style="background-image: url(\'../images/heroes/coaches.jpg\')"></div>' +
            '<div class="co-hero-content">' +
                /* ЭКРАНИРУЮТСЯ ДАННЫЕ (157): имя тренера на ПУБЛИЧНОЙ странице. */
                '<h1 class="co-hero-title">' + KSLT_экранировать(coach.name) + '</h1>' +
                '<p class="co-hero-subtitle">' + KSLT_экранировать(coach.specialization) + '</p>' +
            '</div>';
    }

    function renderDetail(coach) {
        var container = document.getElementById('coachDetail');
        if (!container) return;

        var coachesLink = KSLT_YAZYK.выбрать('coaches-en.html', 'coaches-kg.html', 'coaches.html');
        var authLink = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');

        // Breadcrumb — render before container so it's outside .co-container
        var servicesLink = KSLT_YAZYK.выбрать('services-en.html', 'services-kg.html', 'services.html');
        var breadcrumb = document.createElement('div');
        // Тот же плавающий возврат, что на странице игрока: один вид на
        // всех карточках, и он не уезжает вместе с баннером
        breadcrumb.className = 'kslt-back-wrap kslt-back-float';
        breadcrumb.innerHTML =
            '<a href="' + servicesLink + '" class="kslt-back">\u2190 ' + (KSLT_YAZYK.выбрать('Services', 'Кызматтар', 'Услуги')) + '</a>' +
            '<span class="kslt-back-sep">/</span>' +
            '<a href="' + coachesLink + '" class="kslt-back">' + L.backBtn + '</a>';
        container.parentNode.insertBefore(breadcrumb, container);

        var html = '';

        // Header
        html += '<div class="co-detail-header co-fade-in">' +
            '<img src="' + KSLT_экранировать(coach.photo) + '" alt="' + KSLT_экранировать(coach.name) + '" class="co-detail-photo">' +
            '<div class="co-detail-info">' +
                /* ВТОРОЙ `h1` СНЯТ 13.10 — та же правка, что на странице корта. */
                '<div class="co-detail-title-row"><div class="co-detail-name">' + KSLT_экранировать(coach.name) + '</div>' +
                (coach._promoted ? '<span class="kslt-recommended-detail">' + L.recommendedBadge + '</span>' : '') +
                '</div>' +
                (coach.specialization ? '<div class="co-detail-spec">' + KSLT_экранировать(coach.specialization) + '</div>' : '') +
                (coach.court ? '<div class="co-detail-court"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + KSLT_экранировать(coach.court) + coachMapLinks(coach) + '</div>' : '') +
            '</div>' +
        '</div>';

        // Stats
        var statsHtml = '';
        if (coach.experience) statsHtml += '<div class="co-detail-stat"><div class="co-detail-stat-num">' + KSLT_экранировать(coach.experience) + '</div><div class="co-detail-stat-label">' + L.experienceFull + '</div></div>';
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
                '<p class="co-bio-text">' + KSLT_экранировать(coach.bio) + '</p>' +
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
                    '<div class="co-review-text">"' + KSLT_экранировать(r.text) + '"</div>' +
                    '<div class="co-review-author">— ' + KSLT_экранировать(r.author) + '</div>' +
                '</div>';
            });
            html += '</div></div>';
        }

        // Discount section (partner coaches)
        if (coach._isDb && coach.partner) {
            html += '<div class="co-section co-fade-in co-discount-section">' +
                '<h2 class="co-section-title">' + L.discountTitle + '</h2>' +
                '<div class="co-discount-list" id="coDiscountList">' +
                    '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (KSLT_YAZYK.выбрать('Loading...', 'Жүктөлүүдө...', 'Загрузка...')) + '</p>' +
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
                container.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">' + (KSLT_YAZYK.выбрать('No discounts available', 'Арзандатуу жок', 'Скидок пока нет')) + '</p>';
                return;
            }

            var html = '';
            services.forEach(function(svc) {
                var svcName = KSLT_YAZYK.выбрать(svc.service_name_en || svc.service_name, svc.service_name_kg || svc.service_name, svc.service_name);
                html += '<div class="co-discount-item">' +
                    '<div class="co-discount-info">' +
                        '<span class="co-discount-name">' + KSLT_экранировать(svcName) + '</span>' +
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




    /* ===== LIMIT MODAL ===== */


    /* ПОЯВЛЕНИЕ — ДОМ ВИТРИНЫ (кусок 144). Своё тело было побайтовой
       копией того, что в `courts.js`, и это понятие живёт ещё в семи
       файлах — они записаны и ждут своего куска. */
    function initScrollAnimations() {
        KSLT_VITRINA.появление('co');
    }
})();
