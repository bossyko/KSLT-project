// ============================================
// Большая карточка турнира — одна на весь сайт
// ============================================
//
// Раньше её собирали в двух местах: своя сборка на странице «Турниры» и своя
// на страницах категорий. Классы одинаковые, а состав разный — где-то мест
// осталось, где-то число пар, по-разному считался отсчёт. Правка в одном месте
// до другого не доезжала, и карточки постепенно разошлись.
//
// Здесь одна сборка и один отсчёт. Данные приходят готовыми: страница сама
// знает, как читать свой турнир, а карточка — как его показать.
//
// window.KSLT_TFEATURED:
//   отсчёт(dateSort, startTime, статус) — счётчик до старта или «идёт сейчас»
//   карточка(t)                        — разметка большой карточки
//
// t.боком = true — живой турнир показать карточкой с афишей сбоку (так на
// страницах категорий). Без этого рисуется карточка с афишей фоном.
//
// Поля t: id, href, name, image, status, statusText, date{day,month},
//         genderLabel, noRating, location, regLine, format, prize,
//         участники {label, value, tight}, взнос {value, title},
//         _rawStatus, _dateSort, _startTime, _gender

(function () {
    'use strict';

    /* Язык — у дома (js/kslt-yazyk.js). */

    var L = KSLT_YAZYK.выбрать({ details: 'Details', register: 'Register', noRating: 'No rating',
            live: 'IN PROGRESS', prefix: 'Starts in', days: 'd', hours: 'h', min: 'm', sec: 's',
            reg: 'Reg', noRatingРяд: 'Unranked' }, { details: 'Толугураак', register: 'Катталуу', noRating: 'Рейтингсиз',
                live: 'АЗЫР ЖҮРҮҮДӨ', prefix: 'Башталууга', days: 'к', hours: 'с', min: 'м', sec: 'сек',
                reg: 'Кат', noRatingРяд: 'Рейтингсиз' }, { details: 'Подробнее', register: 'Регистрация', noRating: 'Без рейтинга',
                live: 'ИДЁТ СЕЙЧАС', prefix: 'Старт через', days: 'д', hours: 'ч', min: 'м', sec: 'с',
                reg: 'Рег', noRatingРяд: 'Без рейтинга' });

    /* ДВА АНГЛИЙСКИХ СЛОВА НА ОДНО ПОНЯТИЕ, И ЭТО ЗАМЕРЕНО, А НЕ УГАДАНО:
       крупная карточка говорит `No rating`, а ПОЛОСА на обеих страницах —
       `Unranked`. Свести их значит поменять видимый текст, и это решение
       Кости, а не моё: пока оба слова живут здесь, рядом, под разными
       именами, и расхождение записано находкой. */

    /* ОДНО ОПРЕДЕЛЕНИЕ, РАЗМЕР — ДОВОДОМ. Булавка жила тремя копиями: 12 в
       этом доме, 14 в `tournament-blocks.js` и 14 в `tournaments-overview.js`.
       Размер не свожу — он разный по делу: на карточке значок мельче. */
    function булавка(размер) {
        return '<svg width="' + размер + '" height="' + размер + '" viewBox="0 0 24 24" ' +
            'fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
            '<circle cx="12" cy="10" r="3"/></svg>';
    }
    var pinSvg = булавка(12);

    /* Парный разряд — одно определение: оно стояло в обеих копиях полосы
       слово в слово. */
    function парный(t) {
        return t._rawFormat === 'doubles' || t._rawFormat === 'mixed_doubles';
    }

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    /**
     * Отсчёт до старта. Показываем только за двое суток: раньше он не помогает,
     * а место занимает. Завершённым не рисуем совсем — у них дата в прошлом,
     * и «осталось меньше нуля» превращалось в «идёт сейчас».
     */
    function отсчёт(dateSort, startTime, статус) {
        if (!dateSort || статус === 'past') return '';
        var время = startTime || '00:00';
        var цель = new Date(dateSort + 'T' + время + ':00');
        var разница = цель.getTime() - Date.now();

        if (разница <= 0) {
            return '<span class="to-cd to-cd-live"><span class="to-cd-dot"></span>' + L.live + '</span>';
        }
        if (разница > 48 * 60 * 60 * 1000) return '';

        var д = Math.floor(разница / 86400000);
        var ч = Math.floor((разница % 86400000) / 3600000);
        var м = Math.floor((разница % 3600000) / 60000);
        var с = Math.floor((разница % 60000) / 1000);
        var срочно = разница < 3600000 ? ' to-cd-urgent' : '';

        var части = '<span class="to-cd-label">' + L.prefix + '</span>';
        if (д > 0) части += '<span class="to-cd-unit">' + д + '<small>' + L.days + '</small></span>';
        части += '<span class="to-cd-unit">' + String(ч).padStart(2, '0') + '<small>' + L.hours + '</small></span>';
        части += '<span class="to-cd-unit">' + String(м).padStart(2, '0') + '<small>' + L.min + '</small></span>';
        части += '<span class="to-cd-unit">' + String(с).padStart(2, '0') + '<small>' + L.sec + '</small></span>';

        return '<span class="to-cd' + срочно + '" data-cd-date="' + dateSort +
            '" data-cd-time="' + время + '">' + части + '</span>';
    }

    /** Строка подробностей. Пустое значение не показываем вовсе. */
    function строка(подпись, значение, класс, подсказка) {
        if (!значение) return '';
        return '<div class="to-featured-detail"' + (подсказка ? ' title="' + KSLT_экранировать(подсказка) + '"' : '') + '>' +
            '<span class="to-label">' + KSLT_экранировать(подпись) + '</span>' +
            '<span class="to-value' + (класс ? ' ' + класс : '') + '">' + значение + '</span></div>';
    }

    /**
     * Живой турнир показываем карточкой с афишей сбоку — той же, что на
     * главной: афиша целиком, справа дата, отсчёт, описание и кнопка. Так
     * карточка отвечает на вопросы «когда, где, успею ли записаться».
     *
     * Один вид у всех больших карточек, включая завершённые: иначе на
     * странице рядом стоят две разные большие карточки, и кажется, будто
     * что-то сломалось.
     */
    function боком(t) {
        var TC = window.KSLT_TCARD;
        // Только там, где страница сама попросила: на «Турнирах» все разряды
        // должны выглядеть одинаково, и вытянутая афиша ломала бы ряд
        if (!t.боком || !TC || !t._row) return '';
        // Состояние и пол — на обёртке: по ним фильтрует страница. Без них
        // блок с единственным турниром считался пустым и прятался целиком
        return '<div class="to-featured-side" data-status="' + KSLT_экранировать(t.status) + '"' +
            ' data-gender="' + KSLT_экранировать(t._gender || 'all') + '">' +
            TC.render(t._row, { featured: true, taken: t._taken }) +
        '</div>';
    }

    function карточка(t) {
        var сбоку = боком(t);
        if (сбоку) return сбоку;

        var фон = t.image || '';
        var участники = t.участники || null;
        var взнос = t.взнос || null;

        /* СЛОЙ-ССЫЛКА НА ВСЮ КАРТОЧКУ. Тот же приём, что у полосы архива
           (см. ниже) и у карточки игрока: 13.10 крупная карточка осталась
           последней, кто вёл на турнир обработчиком `bindLinks`. Внутри
           живёт кнопка записи, поэтому слой, а не обёртка. */
        return '<div class="to-featured" data-status="' + KSLT_экранировать(t.status) + '"' +
            ' data-gender="' + KSLT_экранировать(t._gender || 'all') + '">' +
            (window.KSLT_SLOY
                ? window.KSLT_SLOY.слой('to-featured-cover', t.href, t.name || '')
                : '') +
            (фон
                ? '<div class="to-featured-bg"><img src="' + KSLT_экранировать(фон) + '" alt="" loading="lazy"></div>' +
                  '<div class="to-featured-overlay"></div>'
                : '<div class="to-featured-overlay" style="background:var(--bg-card)"></div>') +
            '<div class="to-featured-content">' +
                '<div>' +
                    '<span class="to-featured-date">' +
                        '<span class="to-day">' + KSLT_экранировать(t.date.day) + '</span>' +
                        '<span class="to-month">' + KSLT_экранировать(t.date.month) + '</span></span>' +
                    (t.genderLabel ? '<span class="to-gender-badge">' + KSLT_экранировать(t.genderLabel) + '</span>' : '') +
                    (t.noRating ? '<span class="to-norating-badge">' + L.noRating + '</span>' : '') +
                '</div>' +
                отсчёт(t._dateSort, t._startTime, t.status) +
                '<span class="to-featured-status ' + KSLT_экранировать(t.status) + '">' + KSLT_экранировать(t.statusText) + '</span>' +
                '<h3>' + KSLT_экранировать(t.name) + '</h3>' +
                (t.location ? '<div class="to-featured-meta"><span>' + pinSvg + ' ' + KSLT_экранировать(t.location) + '</span></div>' : '') +
                '<div class="to-featured-details">' +
                    строка(t.регПодпись, t.regLine ? KSLT_экранировать(t.regLine) : '') +
                    строка(t.форматПодпись, t.format ? KSLT_экранировать(t.format) : '') +
                    (участники
                        ? строка(участники.label, KSLT_экранировать(участники.value), участники.tight ? 'to-slots-tight' : '')
                        : '') +
                    строка(t.призПодпись, t.prize ? KSLT_экранировать(t.prize) : '', 'prize') +
                    (взнос ? строка(t.взносПодпись, KSLT_экранировать(взнос.value), 'to-fee', взнос.title) : '') +
                '</div>' +
                '<div class="to-featured-actions">' +
                    '<span class="to-featured-link">' + L.details + '</span>' +
                    (t._rawStatus === 'registration_open'
                        ? '<button class="btn-register to-register" data-tid="' + KSLT_экранировать(t.id) + '">' + L.register + '</button>'
                        : '') +
                '</div>' +
            '</div>' +
        '</div>';
    }

    /**
     * СЛОЙ-ССЫЛКА НА ВСЮ КАРТОЧКУ — одно определение входа на турнир.
     *
     * 04.10, замер пяти видов: турнир открывался тремя разными карточками.
     * На телефоне — настоящей ссылкой `a.tc`, на планшете и десктопе —
     * ссылкой у крупной и `div[data-href]` у полосы. Полоса не открывалась
     * в новой вкладке, не бралась клавиатурой ВОВСЕ и диктором ссылкой не
     * называлась: клавиатурой в блоках категорий бралось 12 элементов на
     * десктопе против 22 на телефоне — вид, который показывает турниров
     * больше, был доступен меньше.
     *
     * ПОЧЕМУ СЛОЙ, А НЕ ОБЁРТКА. Внутри полосы живёт кнопка записи, а
     * кнопка внутри ссылки — недопустимая разметка. Обернуть название тоже
     * нельзя: у `h4` стоит `overflow: hidden` ради обрезки в две строки, и
     * слой изнутри неё был бы ею обрезан — ровно та беда, что поймал замер
     * вкладок турнира в тот же день. Поэтому ссылка — ПРЯМОЙ ребёнок
     * карточки, растянутая на неё целиком, на `z-index: 0`: под
     * содержимым (`.to-compact > * { z-index: 1 }`) и над фоном. Кнопка
     * остаётся нажимаемой, потому что лежит выше слоя, а не потому что
     * слой меньше.
     *
     * Имя турнира уходит в `aria-label`: пустая ссылка диктору ничего не
     * говорит, а видимый заголовок остаётся заголовком.
     */
    /* СЛОЙ БЕРЁТСЯ ДОМОМ, А НЕ ПЕРЕСОБИРАЕТСЯ ЗДЕСЬ (21.10). Было
       побайтовое повторение `KSLT_SLOY.слой`: та же ссылка, тот же
       `aria-label`, и СВОЯ копия экранирования, которая не гасила
       одинарную кавычку. Остаётся одно — имя класса, и ровно его этот
       кусок и добавляет к дому.
       Дом подключён на всех шести страницах турниров и на стенде —
       проверено прибором, а не на глаз. */
    function слойСсылки(href, имя) {
        return window.KSLT_SLOY.слой('to-compact-cover', href, имя);
    }

    /**
     * ПОЛОСА ТУРНИРА — ОДНО ТЕЛО НА ДВЕ СТРАНИЦЫ (кусок 162).
     *
     * Полосу рисовали ДВА места: `tournament-blocks.compact` (61 строка) и
     * `tournaments-overview.renderCompact` (65 строк). Общих блоков разметки
     * было 13 из 14, css — один (84 правила в `tournaments-overview.css`),
     * то есть ВИД БЫЛ ОДИН, А ТЕЛА ДВА. Беда с адресом афиши в куске 158
     * родилась ровно на этом шве: починил одну копию, вторая осталась.
     *
     * ДОМ ВЫБРАН ЦЕНОЙ ТЕГОВ, А НЕ УДОБСТВОМ: `tournament-blocks.js` на
     * обзорной не подключён, а этот файл стоит на всех шести страницах
     * турниров — цена сведения НОЛЬ тегов вместо трёх.
     *
     * АФИША СЛЕВА У ВСЕХ, НЕЗАВИСИМО ОТ СТАТУСА — решение Кости 28.09, до
     * этого куска применённое к ОДНОЙ копии из двух: полоса показывала
     * архивному турниру афишу фоном во всю строку под затемнением. Слово
     * Кости 25.10: «да».
     *
     * @param {object} t — турнир
     * @param {object} о — различия доводами:
     *        `атрибуты` — свои `data-*` зовущего;
     *        `слоты` — показывать «мест осталось» (только обзорная);
     *        `href` — куда ведёт строка.
     */
    function полоса(t, о) {
        о = о || {};
        var прошёл = t.status === 'past';
        var постер = t.imageFull || t.image;
        var афиша = постер
            ? ' style="--poster:url(' + window.KSLT_SLOY.экр(постер) + ')"'
            : '';

        return '<div class="to-compact to-compact-thumb' + (прошёл ? ' to-compact-past' : '') + '"' +
            (о.атрибуты || '') + афиша + '>' +
            слойСсылки(о.href || '#', t.name) +
            '<div class="to-compact-left">' +
                '<span class="to-compact-status ' + t.status + '">' + t.statusText + '</span>' +
                '<div class="to-compact-date">' +
                    '<span class="to-day">' + t.date.day + '</span>' +
                    '<span class="to-month">' + t.date.month + '</span>' +
                '</div>' +
                (t.genderLabel ? '<span class="to-compact-gender-badge">' + t.genderLabel + '</span>' : '') +
                (t.noRating ? '<span class="to-compact-norating-badge">' + L.noRatingРяд + '</span>' : '') +
            '</div>' +
            '<div class="to-compact-info">' +
                '<h4>' + window.KSLT_SLOY.экр(t.name) + '</h4>' +
                '<div class="to-compact-sub">' +
                    /* ПУСТОЕ ПОЛЕ НЕ РИСУЕТСЯ ВОВСЕ: обзорная рисовала
                       булавку без места — значок, указывающий в пустоту. */
                    (t.location ? '<span>' + булавка(14) + ' ' +
                        window.KSLT_SLOY.экр(t.location) + '</span>' : '') +
                    (t.regLine ? '<span class="to-compact-reg">' + L.reg + ': ' + t.regLine + '</span>' : '') +
                    (о.слоты && t.slots
                        ? '<span class="to-compact-slots' + (t.slots.tight ? ' to-slots-tight' : '') + '">' +
                            window.KSLT_SLOY.экр(t.slots.text) + '</span>'
                        : '') +
                '</div>' +
            '</div>' +
            '<div class="to-compact-right">' +
                (t._rawStatus === 'registration_open'
                    ? '<button class="btn-register to-register to-compact-regbtn" data-tid="' + t.id + '"' +
                        (парный(t) ? ' data-doubles="1"' : '') + '>' + L.register + '</button>'
                    : '') +
                отсчёт(t._dateSort, t._startTime, t.status) +
            '</div>' +
        '</div>';
    }

    window.KSLT_TFEATURED = {
        отсчёт: отсчёт,
        карточка: карточка,
        полоса: полоса,
        булавка: булавка,
        парный: парный,
        слойСсылки: слойСсылки,
        /* экранирование отдаётся домом, своего здесь больше нет */
        экр: function (т) { return window.KSLT_SLOY.экр(т); }
    };
})();
