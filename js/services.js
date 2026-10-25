// ========================================
// Services Overview — Supabase loader + carousel + swap
// Promoted (top 3) fixed, rest random on each page load
// ========================================

(function() {
    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;
    var client = window.supabaseClient;

    var L = KSLT_YAZYK.выбрать({
        heroTagline: 'KSLT Services',
        heroTitle: 'Your tennis starts here',
        heroDesc: 'Courts, coaches and hitting partners',
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
        emptyCourts: 'Courts will be added soon',
        emptyCoaches: 'Coaches will be added soon',
        emptyPartners: 'No partners available',
        from: 'from',
        online: 'Online',
        offline: 'Offline',
        levelBeginner: 'Beginner',
        levelIntermediate: 'Intermediate',
        levelAdvanced: 'Advanced',
        levelUnknown: 'Level not specified'
    }, {
        heroTagline: 'KSLT Кызматтар',
        heroTitle: 'Сенин теннисиң ушул жерден башталат',
        heroDesc: 'Корттор, машыктыруучулар жана оюн боюнча өнөктөштөр',
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
        emptyCourts: 'Корттор жакында кошулат',
        emptyCoaches: 'Машыктыруучулар жакында кошулат',
        emptyPartners: 'Жеткиликтүү өнөктөштөр жок',
        from: 'дан',
        online: 'Онлайн',
        offline: 'Офлайн',
        levelBeginner: 'Башталгыч',
        levelIntermediate: 'Орточо',
        levelAdvanced: 'Алдыңкы',
        levelUnknown: 'Деңгээл көрсөтүлгөн эмес'
    }, {
        heroTagline: 'KSLT Услуги',
        heroTitle: 'Ваш теннис начинается здесь',
        heroDesc: 'Корты, тренеры и партнёры по игре',
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
        emptyCourts: 'Корты скоро появятся',
        emptyCoaches: 'Тренеры скоро появятся',
        emptyPartners: 'Нет доступных партнёров',
        from: 'от',
        online: 'Онлайн',
        offline: 'Офлайн',
        levelBeginner: 'Начинающий',
        levelIntermediate: 'Средний',
        levelAdvanced: 'Продвинутый',
        levelUnknown: 'Уровень не указан'
    });

    // Фотографий у кортов и тренеров пока нет: реестр собирали из 2ГИС и
    // гидов. Без запасной картинки на месте снимка оставалась пустая рамка —
    // на главной и здесь это выглядело как поломка
    var COURT_PHOTO = '../images/heroes/courts.jpg';
    var COACH_PHOTO = '../images/heroes/coaches.jpg';

    var courtPage = KSLT_YAZYK.выбрать('court-en.html', 'court-kg.html', 'court.html');
    var coachPage = KSLT_YAZYK.выбрать('coach-en.html', 'coach-kg.html', 'coach.html');
    var courtsPage = KSLT_YAZYK.выбрать('courts-en.html', 'courts-kg.html', 'courts.html');
    var coachesPage = KSLT_YAZYK.выбрать('coaches-en.html', 'coaches-kg.html', 'coaches.html');
    var partnersPage = KSLT_YAZYK.выбрать('partners-en.html', 'partners-kg.html', 'partners.html');

    var _courts = [];
    var _coaches = [];
    var _partners = [];

    /** Сколько игроков показываем в ленте на «Услугах» */
    var PARTNERS_IN_STRIP = 10;

    /* ЗДЕСЬ СТОЯЛА МЁРТВАЯ `shuffle` — ВОСЕМЬ СТРОК, КОТОРЫЕ НЕ
       ИСПОЛНЯЛИСЬ НИКОГДА. Имя объявлялось в этом файле ДВА РАЗА в одной
       области, разными телами; объявления поднимаются, и побеждало
       второе. Проверено запуском, а не рассуждением. Нашёл парсер
       (`tools/razovye/155-odno-imya-dva-tela.js`), и на весь продукт
       такое место было одно. Порог «в сети» тоже стоял здесь своим
       числом — теперь он один, в доме лица. */

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

    /* СЛУЧАЙНЫЙ ПОРЯДОК — ДОМ `js/kslt-tasovka.js` (кусок 155). */
    function shuffle(arr) { return window.KSLT_TASOVKA.перемешать(arr); }

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

    /**
     * Продвинутые первыми, остальные вперемешку, итог не выше потолка.
     *
     * СВЕДЕНО КУСКОМ 155 — это была ТРЕТЬЯ форма одного понятия: витрина
     * знала признак `_promoted`, главная `partner`, здесь `promoted`.
     * Признак приходит доводом: сводится рамка, а не середина.
     * ПОВЕДЕНИЕ ИЗМЕНИЛОСЬ (слово Кости 24.10): продвинутые теперь
     * перемешиваются между собой, а не идут в порядке базы.
     */
    function selectForDisplay(data, cap) {
        return window.KSLT_TASOVKA.продвинутыеПервыми(data, 'promoted', cap);
    }

    async function loadData() {
        var courts = null;
        var coaches = null;
        var partners = null;

        if (client) {
            try {
                var cResult = await client.from('courts')
                    .select('id, name, name_en, photo, street, street_en, street_kg, building, district, district_en, city, city_en, city_kg, country, country_en, court_types, partner, promoted')
                    /* Черновики в витрину не попадают — см. js/courts.js */
                    .not('published_at', 'is', null);
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
                    var plRes = await client.from('players_public')
                        .select('id, ntrp_singles, gender')
                        .in('id', ids);
                    var plMap = {};
                    (plRes.data || []).forEach(function(x) { plMap[x.id] = x; });
                    partners.forEach(function(x) {
                        var pl = plMap[x.id];
                        if (!pl) return;
                        x.ntrp_singles = pl.ntrp_singles;
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
        /* Адрес собирается в одном месте — js/court-address.js */
        return window.KSLT_ADDRESS.адрес(c, KSLT_YAZYK.выбрать('en', 'kg', 'ru')) || '';
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
        return KSLT_YAZYK.выбрать(ch.position_en || ch.position || '', ch.position_kg || ch.position || '', ch.position || '');
    }

    function getCoachLevel(ch) {
        if (!ch.tags || !ch.tags.length) return '';
        var levelTags = [];
        if (ch.tags.indexOf('beginner') !== -1) levelTags.push(KSLT_YAZYK.выбрать('Beginner', 'Башталгыч', 'Начинающие'));
        if (ch.tags.indexOf('advanced') !== -1) levelTags.push(KSLT_YAZYK.выбрать('Advanced', 'Алдыңкы', 'Продвинутые'));
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

        // СКОРОСТЬ ЛЕНТЫ — ВРЕМЯ НА КАРТОЧКУ, А НЕ ВРЕМЯ НА ЛЕНТУ.
        // Здесь стояло `children.length / 2 * 12s` на animationDuration.
        // Детьми ленты были карточки, а с 07.10 ими стали два прохода
        // (.sv-carousel-pass), и счёт давал 1 → вся лента за 12 секунд
        // при любом числе кортов. Лента летела мимо.
        // Теперь js сообщает ТОЛЬКО число карточек одного прохода, а шаг
        // (9 с на широких, 11 с на узких — замерено на ленте спонсоров
        // лендинга) живёт в css/services.css. Так шаг переключается на
        // границе сам, без слушателя resize и без чисел в скрипте.
        var carousels = container.querySelectorAll('.sv-carousel');
        carousels.forEach(function(car) {
            var pass = car.querySelector('.sv-carousel-pass');
            var count = pass ? pass.children.length : car.children.length / 2;
            if (count > 0) {
                car.style.removeProperty('animation-duration');
                car.style.setProperty('--sv-karto4ek', String(count));
            }
        });

        // ДВА РЯДА У ВИТРИНЫ ИГРОКОВ — ОТНОШЕНИЕ, А НЕ ЧИСЛО.
        // css держит правило «видно = колонок × 2» (css/services.css,
        // блок `data-vidno`), а колонок у `auto-fit` столько, сколько
        // влезло: замер 07.10 дал 5 · 4 · 3 внутри одной границы 992.
        // Считать их можно только после раскладки, поэтому число приходит
        // отсюда. ResizeObserver, а не resize у окна: коробка меняет
        // ширину и от поворота, и от появления полосы прокрутки.
        var box = container.querySelector('.sv-players-box');
        if (box) {
            var пересчитать = function() {
                var колонок = getComputedStyle(box)
                    .gridTemplateColumns.split(' ')
                    .filter(function(x) { return x && x !== 'none'; }).length;
                if (!колонок) колонок = 1;
                if (колонок > 5) колонок = 5;
                box.setAttribute('data-vidno', String(колонок * 2));
            };
            пересчитать();
            if (window.ResizeObserver) {
                new ResizeObserver(пересчитать).observe(box);
            }
        }

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
        /* КЛОН — ТОЛЬКО ДЛЯ ГЛАЗА. Лента едет бесконечно за счёт второго
           прохода тех же карточек. Замер 06.10: в оглавлении страницы
           оказывалось 16 ЛИШНИХ заголовков, а диктор читал каждый корт
           дважды. Второй проход уходит из дерева доступности целиком;
           `display: contents` оставляет его карточки детьми той же ленты,
           поэтому раскладка не меняется. */
        for (var pass = 0; pass < 2; pass++) {
            html += '<div class="sv-carousel-pass"' +
                (pass ? ' aria-hidden="true"' : '') + '>';
            for (var i = 0; i < items.length; i++) {
                if (type === 'courts') {
                    html += renderCompactCourt(items[i], i + 1);
                } else if (type === 'coaches') {
                    html += renderCompactCoach(items[i], i + 1);
                } else {
                    html += renderCompactPartner(items[i], i + 1);
                }
            }
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    // --- Featured Court ---
    function renderFeaturedCourt(c) {
        var name = KSLT_YAZYK.выбрать(c.name_en || c.name, c.name_kg || c.name, c.name);
        var addr = getCourtAddress(c);
        var surface = getCourtSurface(c);
        var price = getCourtMinPrice(c);
        var photo = c.photo || COURT_PHOTO;
        var href = courtPage + '?id=' + c.id;

        var discountHtml = c._maxDiscount ? '<span class="sv-discount-overlay">\uD83C\uDFF7\uFE0F ' + (KSLT_YAZYK.выбрать('up to', 'чейин', 'до')) + ' -' + c._maxDiscount + '%</span>' : '';

        return '<a class="sv-featured" href="' + href + '">' +
            (photo
                ? '<div class="sv-featured-bg"><img src="' + KSLT_экранировать(photo) + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>'
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
        var photo = ch.photo || COACH_PHOTO;
        var href = coachPage + '?id=' + ch.id;
        var exp = ch.experience ? ch.experience + ' ' + L.years : '';
        var price = ch.price ? ch.price + ' сом/ч' : '';
        var discountHtml = ch._maxDiscount ? '<span class="sv-discount-overlay">\uD83C\uDFF7\uFE0F ' + (KSLT_YAZYK.выбрать('up to', 'чейин', 'до')) + ' -' + ch._maxDiscount + '%</span>' : '';

        return '<a class="sv-featured" href="' + href + '">' +
            (photo
                ? '<div class="sv-featured-bg"><img src="' + KSLT_экранировать(photo) + '" alt="" loading="lazy"></div><div class="sv-featured-overlay"></div>'
                : '<div class="sv-featured-overlay" style="background:var(--bg-card)"></div>') +
            discountHtml +
            '<div class="sv-featured-content">' +
                (photo ? '<img class="sv-coach-avatar" src="' + KSLT_экранировать(photo) + '" alt="" loading="lazy">' : '') +
                '<h3>' + name + '</h3>' +
                '<div class="sv-featured-meta">' +
                    (spec ? '<span>' + spec + '</span>' : '') +
                '</div>' +
                '<div class="sv-featured-details">' +
                    (exp ? '<div class="sv-featured-detail"><span class="sv-label">' + L.experience + '</span><span class="sv-value">' + KSLT_экранировать(exp) + '</span></div>' : '') +
                    (level ? '<div class="sv-featured-detail"><span class="sv-label">' + L.level + '</span><span class="sv-value">' + level + '</span></div>' : '') +
                    (price ? '<div class="sv-featured-detail"><span class="sv-label">' + L.price + '</span><span class="sv-value accent">' + price + '</span></div>' : '') +
                '</div>' +
                '<span class="sv-featured-link">' + L.details + '</span>' +
            '</div>' +
        '</a>';
    }

    // --- Compact Court (card for carousel) ---
    function renderCompactCourt(c, idx) {
        var name = KSLT_YAZYK.выбрать(c.name_en || c.name, c.name_kg || c.name, c.name);
        var addr = getCourtAddress(c);
        var price = getCourtMinPrice(c);
        var photo = c.photo || COURT_PHOTO;

        var discountSm = c._maxDiscount ? '<span class="sv-discount-overlay-sm">-' + c._maxDiscount + '%</span>' : '';

        /* КАРТОЧКА — ССЫЛКА, А НЕ `div` С ОБРАБОТЧИКОМ. Замер 06.10: на
           странице 57 нажимаемых мест и 15 фокусируемых — 42 карточки
           нельзя было ни взять с клавиатуры, ни открыть в новой вкладке. */
        return '<a class="sv-compact" href="' + courtPage + '?id=' + c.id + '"' +
            ' data-type="courts" data-idx="' + idx + '">' +
            '<div class="sv-compact-img-wrap">' +
                (photo
                    ? '<img class="sv-compact-photo" src="' + photo + '" alt="" loading="lazy">'
                    : '<div class="sv-compact-icon">' + courtSvg + '</div>') +
                discountSm +
            '</div>' +
            '<h4>' + name + '</h4>' +
            (addr ? '<div class="sv-compact-sub">' + pinSvg + ' ' + addr + '</div>' : '') +
            (price ? '<div class="sv-compact-price">' + price + '</div>' : '') +
        '</a>';
    }

    // --- Compact Coach (card for carousel) ---
    function renderCompactCoach(ch, idx) {
        var name = getCoachName(ch);
        var spec = getCoachSpec(ch);
        var price = ch.price ? ch.price + ' сом/ч' : '';
        var photo = ch.photo || COACH_PHOTO;
        var discountSm = ch._maxDiscount ? '<span class="sv-discount-overlay-sm">-' + ch._maxDiscount + '%</span>' : '';

        return '<a class="sv-compact" href="' + coachPage + '?id=' + ch.id + '"' +
            ' data-type="coaches" data-idx="' + idx + '">' +
            '<div class="sv-compact-img-wrap">' +
                (photo
                    ? '<img class="sv-compact-avatar" src="' + KSLT_экранировать(photo) + '" alt="" loading="lazy">'
                    : '<div class="sv-compact-icon">' + courtSvg + '</div>') +
                discountSm +
            '</div>' +
            '<h4>' + name + '</h4>' +
            (spec ? '<div class="sv-compact-sub">' + spec + '</div>' : '') +
            (price ? '<div class="sv-compact-price">' + price + '</div>' : '') +
        '</a>';
    }

    // --- Partner helpers ---
    /* «В СЕТИ» — ДОМ ЛИЦА (кусок 155): одно понятие, один порог. */
    function isOnline(lastSeen) { return window.KSLT_LICO.вСети(lastSeen); }

    function getPartnerName(p) {
        return p.full_name || '';
    }

    function getPartnerLevel(p) {
        var category = KSLT_YAZYK.выбрать(p.category_name_en || p.category_name, p.category_name_kg || p.category_name, p.category_name);
        if (category) return category;
        var levelMap = { beginner: L.levelBeginner, intermediate: L.levelIntermediate, advanced: L.levelAdvanced };
        return (p.play_level && levelMap[p.play_level]) || L.levelUnknown;
    }

    /* Инициалы — одно определение на продукт: js/kslt-lico.js. */
    function getInitials(name) { return window.KSLT_LICO.инициалы(name); }

    // --- Featured Partner ---

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
            avatarHtml = '<img class="sv-player-ava" src="' + KSLT_экранировать(p.avatar_url) + '" alt="" loading="lazy">';
        } else {
            avatarHtml = '<div class="sv-player-ava sv-player-initials">' + KSLT_экранировать(getInitials(name)) + '</div>';
        }

        // Пол, уровень игры и когда человек последний раз заходил — то, по
        // чему решают, звать его или нет. Без этого карточка была витриной
        // В профилях пол пишут как female/male, в карточках игроков — women/men
        var g = String(p.gender || '');
        var playLevel = levelLabel(p.play_level);
        var seen = lastSeenLabel(p.last_seen);

        /* ДВА ЭЛЕМЕНТА, КОТОРЫЕ ДЕЛЯТ ОДНУ СТРОКУ, ДОЛЖНЫ ЕЁ И ДЕЛИТЬ.
           NTRP и разряд стояли двумя `absolute` в двух верхних углах и
           встречались посередине: замер 06.10 — на телефоне 6 карточек из
           10 с нахлёстом до 57 пикселей, на десктопе 2 из 10 по 12.
           Ряд не наезжает никогда: при нехватке места он переносит. */
        /* СЛОЙ-ССЫЛКА НА ВСЮ КАРТОЧКУ — тот же приём, что у полосы турнира
           (js/tournament-featured.js). Обернуть карточку ссылкой нельзя:
           внутри живёт кнопка «Предложить игру», а кнопка внутри ссылки —
           недопустимая разметка. Слой лежит прямым ребёнком, растянут на
           карточку и стоит ПОД содержимым: кнопка остаётся нажимаемой. */
        return '<div class="sv-player" data-type="partners" data-idx="' + idx + '">' +
            '<a class="sv-player-cover" href="' + partnersPage + '" aria-label="' +
                name.replace(/"/g, '&quot;') + '"></a>' +
            '<div class="sv-player-top">' +
            (p.ntrp_singles ? '<span class="sv-player-ntrp">' + p.ntrp_singles +
                '<small>NTRP</small></span>' : '<span class="sv-player-ntrp sv-player-ntrp-net"></span>') +
            '<span class="sv-player-cat">' + level + '</span>' +
            '</div>' +
            '<div class="sv-player-ava-wrap">' +
                avatarHtml +
                (online ? '<span class="sv-player-dot" title="' + L.online + '"></span>' : '') +
            '</div>' +
            '<div class="sv-player-name">' +
                name +
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
        if (diff < window.KSLT_LICO.ПОРОГ_В_СЕТИ) return L.seenNow;
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days < 1) return L.seenToday;
        if (days === 1) return L.seenYesterday;
        if (days < 30) return L.seenDays.replace('{n}', days);
        return L.seenLong;
    }

    // --- Re-render a single section ---

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
            /* ПЕРЕХВАТА БОЛЬШЕ НЕТ. Раньше здесь стоял `preventDefault` и
               переход через `location.href`: он открывал ту же страницу,
               но убивал Ctrl+клик и среднюю кнопку — открыть карточку в
               новой вкладке было нельзя. Теперь карточка сама ссылка
               (ленты) или несёт слой-ссылку (игрок), и браузер делает всё
               сам. Кнопка «Предложить игру» — единственное, что осталось
               обработчику. */
            var btn = e.target.closest('.sv-player-btn');
            if (btn) {
                e.preventDefault();
                window.location.href = partnersPage;
            }
        });
    }

    // --- Sponsors — loaded via sponsors-loader.js ---

})();
