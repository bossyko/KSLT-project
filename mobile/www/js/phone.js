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
    P.countries = [
        { iso: 'KG', code: '+996', flag: '🇰🇬', ru: 'Кыргызстан',   en: 'Kyrgyzstan',   kg: 'Кыргызстан' },
        { iso: 'KZ', code: '+7',   flag: '🇰🇿', ru: 'Казахстан',    en: 'Kazakhstan',   kg: 'Казакстан' },
        { iso: 'RU', code: '+7',   flag: '🇷🇺', ru: 'Россия',       en: 'Russia',       kg: 'Россия' },
        { iso: 'UZ', code: '+998', flag: '🇺🇿', ru: 'Узбекистан',   en: 'Uzbekistan',   kg: 'Өзбекстан' },
        { iso: 'TJ', code: '+992', flag: '🇹🇯', ru: 'Таджикистан',  en: 'Tajikistan',   kg: 'Тажикстан' },
        { iso: 'UA', code: '+380', flag: '🇺🇦', ru: 'Украина',      en: 'Ukraine',      kg: 'Украина' },
        { iso: 'TR', code: '+90',  flag: '🇹🇷', ru: 'Турция',       en: 'Turkey',       kg: 'Түркия' },
        { iso: 'AE', code: '+971', flag: '🇦🇪', ru: 'ОАЭ',          en: 'UAE',          kg: 'БАЭ' },
        { iso: 'CN', code: '+86',  flag: '🇨🇳', ru: 'Китай',        en: 'China',        kg: 'Кытай' },
        { iso: 'KR', code: '+82',  flag: '🇰🇷', ru: 'Южная Корея',  en: 'South Korea',  kg: 'Түштүк Корея' },
        { iso: 'US', code: '+1',   flag: '🇺🇸', ru: 'США',          en: 'USA',          kg: 'АКШ' },
        { iso: 'GB', code: '+44',  flag: '🇬🇧', ru: 'Великобритания', en: 'UK',         kg: 'Улуу Британия' },
        { iso: 'DE', code: '+49',  flag: '🇩🇪', ru: 'Германия',     en: 'Germany',      kg: 'Германия' }
    ];

    var DEFAULT_ISO = 'KG';

    function byIso(iso) {
        for (var i = 0; i < P.countries.length; i++) {
            if (P.countries[i].iso === iso) return P.countries[i];
        }
        return null;
    }

    P.byIso = byIso;

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

    /** Собирает номер для хранения: +996555123456, без пробелов и скобок. */
    P.join = function(iso, rest) {
        var country = byIso(iso) || byIso(DEFAULT_ISO);
        var digits = String(rest || '').replace(/[^0-9]/g, '');
        if (!digits) return '';
        // Человек мог набрать номер с нуля впереди, как привык: 0555 123 456
        if (digits.length > 1 && digits.charAt(0) === '0') digits = digits.slice(1);
        return country.code + digits;
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
