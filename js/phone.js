/**
 * KSLT — телефон со страной.
 *
 * Раньше номер вводили одной строкой, и в базе оказывалось «+996 555 12 34 56»,
 * «0555123456», «996555 123456» — у каждого по-своему. Восстановление доступа
 * ищет человека по номеру, и такие записи между собой не сходятся.
 *
 * Теперь страна выбирается из списка, а код подставляется сам. Гадать по числу
 * цифр нельзя: у американского номера после кода страны их десять, у нашего
 * девять, а корейский бывает и таким и таким.
 *
 * Список стран лежит здесь и только здесь — он нужен в кабинете, в админке,
 * в приложении и на странице входа.
 */
(function() {
    'use strict';

    var P = window.KSLT_PHONE = {};

    // Кыргызстан первым — он у большинства. Дальше соседи и страны, куда
    // игроки ездят на турниры.
    // groups — как разбивать цифры на группы при показе, len — сколько их
    // всего. По этим двум полям строится и подсказка в поле, и проверка
    // ввода, и вид номера на сайте.
    P.countries = [
        { iso: 'KG', code: '+996', flag: '🇰🇬', ru: 'Кыргызстан',   en: 'Kyrgyzstan',   kg: 'Кыргызстан',   len: 9,  groups: [3, 3, 3] },
        { iso: 'KZ', code: '+7',   flag: '🇰🇿', ru: 'Казахстан',    en: 'Kazakhstan',   kg: 'Казакстан',    len: 10, groups: [3, 3, 2, 2] },
        { iso: 'RU', code: '+7',   flag: '🇷🇺', ru: 'Россия',       en: 'Russia',       kg: 'Россия',       len: 10, groups: [3, 3, 2, 2] },
        { iso: 'UZ', code: '+998', flag: '🇺🇿', ru: 'Узбекистан',   en: 'Uzbekistan',   kg: 'Өзбекстан',    len: 9,  groups: [2, 3, 2, 2] },
        { iso: 'TJ', code: '+992', flag: '🇹🇯', ru: 'Таджикистан',  en: 'Tajikistan',   kg: 'Тажикстан',    len: 9,  groups: [2, 3, 4] },
        { iso: 'UA', code: '+380', flag: '🇺🇦', ru: 'Украина',      en: 'Ukraine',      kg: 'Украина',      len: 9,  groups: [2, 3, 4] },
        { iso: 'TR', code: '+90',  flag: '🇹🇷', ru: 'Турция',       en: 'Turkey',       kg: 'Түркия',       len: 10, groups: [3, 3, 2, 2] },
        { iso: 'AE', code: '+971', flag: '🇦🇪', ru: 'ОАЭ',          en: 'UAE',          kg: 'БАЭ',          len: 9,  groups: [2, 3, 4] },
        { iso: 'CN', code: '+86',  flag: '🇨🇳', ru: 'Китай',        en: 'China',        kg: 'Кытай',        len: 11, groups: [3, 4, 4] },
        { iso: 'KR', code: '+82',  flag: '🇰🇷', ru: 'Южная Корея',  en: 'South Korea',  kg: 'Түштүк Корея', len: 10, groups: [2, 4, 4] },
        { iso: 'US', code: '+1',   flag: '🇺🇸', ru: 'США',          en: 'USA',          kg: 'АКШ',          len: 10, groups: [3, 3, 4] },
        { iso: 'GB', code: '+44',  flag: '🇬🇧', ru: 'Великобритания', en: 'UK',         kg: 'Улуу Британия', len: 10, groups: [4, 6] },
        { iso: 'DE', code: '+49',  flag: '🇩🇪', ru: 'Германия',     en: 'Germany',      kg: 'Германия',     len: 11, groups: [3, 4, 4] }
    ];

    var DEFAULT_ISO = 'KG';

    function byIso(iso) {
        for (var i = 0; i < P.countries.length; i++) {
            if (P.countries[i].iso === iso) return P.countries[i];
        }
        return null;
    }

    // На неизвестный код отдаём страну по умолчанию: вызывающему коду
    // важнее получить формат, чем null
    P.byIso = function(iso) { return byIso(iso) || byIso(DEFAULT_ISO); };

    /** Название страны на языке страницы. */
    P.name = function(country, lang) {
        return country[lang] || country.ru;
    };

    /**
     * Разбирает сохранённый номер на страну и остаток.
     *
     * Страну берём из профиля, а не выводим из номера: у России и Казахстана
     * общий код +7, и по цифрам их не различить. Если страна не сохранена —
     * подбираем по самому длинному подходящему коду.
     */
    P.split = function(phone, savedIso) {
        var digits = String(phone || '').replace(/[^0-9]/g, '');
        var country = savedIso ? byIso(savedIso) : null;

        if (country && digits.indexOf(country.code.slice(1)) === 0) {
            return { iso: country.iso, rest: digits.slice(country.code.length - 1) };
        }

        var best = null;
        P.countries.forEach(function(c) {
            var bare = c.code.slice(1);
            if (digits.indexOf(bare) === 0 && (!best || bare.length > best.code.length - 1)) best = c;
        });

        if (best) return { iso: best.iso, rest: digits.slice(best.code.length - 1) };

        // Кода страны в номере нет — старая запись вида 0555123456. Ноль
        // впереди местный, в международном виде его не бывает.
        if (digits.length > 1 && digits.charAt(0) === '0') digits = digits.slice(1);
        return { iso: country ? country.iso : DEFAULT_ISO, rest: digits };
    };

    /** Разбивает цифры на группы по правилам страны: 701111732 → 701 111 732 */
    P.format = function(iso, digits) {
        var country = byIso(iso) || byIso(DEFAULT_ISO);
        var d = String(digits || '').replace(/[^0-9]/g, '');
        if (!d) return '';
        var out = [];
        var pos = 0;
        for (var i = 0; i < country.groups.length && pos < d.length; i++) {
            out.push(d.substr(pos, country.groups[i]));
            pos += country.groups[i];
        }
        if (pos < d.length) out.push(d.slice(pos));   // лишние цифры не прячем
        return out.join(' ');
    };

    /** Подсказка в пустом поле: тот же формат, но нулями. */
    P.placeholder = function(iso) {
        var country = byIso(iso) || byIso(DEFAULT_ISO);
        return country.groups.map(function(n) {
            return new Array(n + 1).join('0');
        }).join(' ');
    };

    /**
     * Разбирает то, что человек набрал или вставил из буфера.
     *
     * Номер часто копируют целиком: «+996 701 111 732» или «00996701111732».
     * Если просто вырезать нецифровое, код страны сольётся с номером и
     * обрежется по длине — получится правдоподобный мусор вроде «996 701 111».
     * Поэтому код страны сначала распознаём и, если он чужой, сообщаем
     * вызывающему: пусть переключит выбор страны.
     *
     * Возвращает { iso, digits, switched }.
     */
    P.parseInput = function(raw, currentIso) {
        var text = String(raw || '').trim();
        var digits = text.replace(/[^0-9]/g, '');
        if (!digits) return { iso: currentIso, digits: '', switched: false };

        // 00 в начале — та же международная запись, что и плюс
        var international = text.charAt(0) === '+' || digits.indexOf('00') === 0;
        if (digits.indexOf('00') === 0) digits = digits.slice(2);

        var current = byIso(currentIso) || byIso(DEFAULT_ISO);

        // Код страны ищем, только если номер записан международно или явно
        // длиннее местного: иначе «701111732» примут за код +7
        if (international || digits.length > current.len) {
            var best = null;
            P.countries.forEach(function(c) {
                var bare = c.code.slice(1);
                if (digits.indexOf(bare) !== 0) return;
                var rest = digits.slice(bare.length);
                // Код подходит, только если остаток похож на номер этой страны
                if (rest.length !== c.len) return;
                if (!best || bare.length > best.code.length - 1) best = c;
            });

            if (best) {
                return {
                    iso: best.iso,
                    digits: digits.slice(best.code.length - 1),
                    switched: best.iso !== currentIso && best.code !== current.code
                };
            }
        }

        // Местная запись с нуля впереди: 0701 111 732
        if (digits.length > current.len && digits.charAt(0) === '0') digits = digits.slice(1);

        return { iso: currentIso, digits: digits.substr(0, current.len), switched: false };
    };

    /** Переставляет выбор страны в уже нарисованном списке. */
    P.setPicker = function(root, iso) {
        var country = byIso(iso);
        if (!root || !country) return;
        root.dataset.iso = country.iso;
        var flag = root.querySelector('.kslt-cc-toggle .kslt-cc-flag');
        var code = root.querySelector('.kslt-cc-current');
        if (flag) flag.textContent = country.flag;
        if (code) code.textContent = country.code;
        root.querySelectorAll('.kslt-cc-item').forEach(function(b) {
            b.classList.toggle('active', b.dataset.iso === country.iso);
        });
    };

    /** Обрезает по длине номера этой страны. */
    P.trim = function(iso, digits) {
        var country = byIso(iso) || byIso(DEFAULT_ISO);
        var d = String(digits || '').replace(/[^0-9]/g, '');
        if (d.length > 1 && d.charAt(0) === '0') d = d.slice(1);
        return d.substr(0, country.len);
    };

    /** Номер целиком для показа: +996 701 111 732 */
    P.pretty = function(phone) {
        var v = String(phone || '').trim();
        if (!v) return '';
        var parts = P.split(v);
        var country = byIso(parts.iso);
        if (!country || !parts.rest) return v;
        return country.code + ' ' + P.format(parts.iso, parts.rest);
    };

    /** Собирает номер для хранения: +996555123456, без пробелов и скобок. */
    P.join = function(iso, rest) {
        var country = byIso(iso) || byIso(DEFAULT_ISO);
        var digits = String(rest || '').replace(/[^0-9]/g, '');
        if (!digits) return '';
        // Человек мог набрать номер с нуля впереди, как привык: 0555 123 456
        if (digits.length > 1 && digits.charAt(0) === '0') digits = digits.slice(1);
        return country.code + digits;
    };

    /**
     * Компактный выбор кода страны: в кнопке только флаг и код, названия
     * видны в раскрытом списке. Нативный select для этого не годится —
     * он показывает в закрытом виде ту же строку, что и в списке, а без
     * названий Казахстан и Россию не различить: у обоих +7.
     *
     * Значение читается из data-iso корневого элемента.
     */
    P.pickerHtml = function(selectedIso, lang, extraClass) {
        var iso = selectedIso || DEFAULT_ISO;
        var current = byIso(iso) || byIso(DEFAULT_ISO);

        var items = P.countries.map(function(c) {
            return '<button type="button" class="kslt-cc-item' + (c.iso === iso ? ' active' : '') +
                '" data-iso="' + c.iso + '" data-code="' + c.code + '" data-flag="' + c.flag + '">' +
                '<span class="kslt-cc-flag">' + c.flag + '</span>' +
                '<span class="kslt-cc-name">' + P.name(c, lang) + '</span>' +
                '<span class="kslt-cc-code">' + c.code + '</span>' +
            '</button>';
        }).join('');

        return '<div class="kslt-cc ' + (extraClass || '') + '" data-iso="' + iso + '">' +
            '<button type="button" class="kslt-cc-toggle">' +
                '<span class="kslt-cc-flag">' + current.flag + '</span>' +
                '<span class="kslt-cc-current">' + current.code + '</span>' +
                '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="kslt-cc-menu">' + items + '</div>' +
        '</div>';
    };

    /**
     * Один обработчик на всю страницу: открывает список, ставит выбранное
     * и зовёт onPick(корень, iso). Вызывать один раз.
     */
    P.initPickers = function(onPick) {
        if (P._pickersReady) return;
        P._pickersReady = true;

        document.addEventListener('click', function(e) {
            var toggle = e.target.closest('.kslt-cc-toggle');
            var item = e.target.closest('.kslt-cc-item');

            if (!toggle && !item) {
                document.querySelectorAll('.kslt-cc.open').forEach(function(d) { d.classList.remove('open'); });
                return;
            }

            if (toggle) {
                var box = toggle.closest('.kslt-cc');
                var wasOpen = box.classList.contains('open');
                document.querySelectorAll('.kslt-cc.open').forEach(function(d) { d.classList.remove('open'); });
                box.classList.toggle('open', !wasOpen);
                return;
            }

            var root = item.closest('.kslt-cc');
            root.dataset.iso = item.dataset.iso;
            root.querySelector('.kslt-cc-flag').textContent = item.dataset.flag;
            root.querySelector('.kslt-cc-current').textContent = item.dataset.code;
            root.querySelectorAll('.kslt-cc-item').forEach(function(b) { b.classList.remove('active'); });
            item.classList.add('active');
            root.classList.remove('open');
            if (typeof onPick === 'function') onPick(root, item.dataset.iso);
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.kslt-cc.open').forEach(function(d) { d.classList.remove('open'); });
            }
        });
    };

    /** Разметка выпадающего списка стран. */
    P.selectHtml = function(id, selectedIso, lang, className) {
        var options = P.countries.map(function(c) {
            var sel = c.iso === (selectedIso || DEFAULT_ISO) ? ' selected' : '';
            return '<option value="' + c.iso + '"' + sel + '>' +
                c.flag + '  ' + P.name(c, lang) + '  ' + c.code +
            '</option>';
        }).join('');
        return '<select id="' + id + '" class="' + (className || '') + '">' + options + '</select>';
    };

})();
