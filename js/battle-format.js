// ============================================
// Состав баттла: кто играет и как это назвать
// ============================================
//
// Баттл бывает одиночным, парным и смешанным. В парном и смешанном у каждой
// стороны двое, и участник может быть как членом клуба, так и гостем —
// у гостя есть только имя, карточки игрока у него нет.
//
// Собирать это в каждом месте заново — верный способ получить четыре разных
// ответа на один вопрос. Здесь одно место.
//
// Состав называем словами, а не форматом: «мужские пары», «женские пары»,
// «микст». Пол участников база знает, она же по нему проверяет состав при
// заведении, — значит подпись собирается сама, спрашивать нечего.
//
// Если состав неровный — такое бывает у показательных игр, где проверку
// сняли галочкой, — пишем просто «пары», без пола. Соврать нельзя,
// промолчать можно.

(function() {
    'use strict';

    var BF = window.KSLT_BATTLE_FORMAT = {};

    var L = {
        ru: { doubles: 'пары', men: 'мужские пары', women: 'женские пары', mixed: 'микст' },
        en: { doubles: 'doubles', men: "men's doubles", women: "women's doubles", mixed: 'mixed' },
        kg: { doubles: 'жуптук', men: 'эркектер жуптугу', women: 'аялдар жуптугу', mixed: 'аралаш' }
    };

    function lang() {
        var p = window.location.pathname;
        if (p.indexOf('-en') !== -1) return 'en';
        if (p.indexOf('-kg') !== -1) return 'kg';
        return 'ru';
    }

    BF.isPair = function(b) {
        return !!b && b.format && b.format !== 'singles';
    };

    /**
     * Подпись состава. Пустая строка у одиночного: там называть нечего.
     * @param {Object} b запись баттла
     * @param {Object} [genders] пол четверых, если он известен вызывающему
     */
    BF.label = function(b, genders) {
        if (!BF.isPair(b)) return '';
        var t = L[lang()];
        if (b.format === 'mixed_doubles') return t.mixed;

        var g = genders || {
            c: b.challenger_gender, cm: b.challenger_partner_gender,
            o: b.opponent_gender,   om: b.opponent_partner_gender
        };
        var all = [g.c, g.cm, g.o, g.om];
        if (all.indexOf(undefined) !== -1 || all.indexOf(null) !== -1 || all.indexOf('') !== -1) {
            return t.doubles;
        }
        if (all.every(function(x) { return x === 'men'; })) return t.men;
        if (all.every(function(x) { return x === 'women'; })) return t.women;
        return t.doubles;
    };

    /**
     * Имена стороны: основной участник и напарник.
     *
     * @param {Object} b запись баттла
     * @param {number} side 1 или 2
     * @param {Object} players справочник игроков по идентификатору
     * @param {Function} nameOf как достать имя из записи игрока
     * @returns {{names: string[], photos: string[]}}
     */
    BF.side = function(b, side, players, nameOf) {
        players = players || {};
        nameOf = nameOf || function(p) { return p && p.name; };

        var mainId = side === 1 ? b.challenger_player_id : b.opponent_player_id;
        var mainExt = side === 1 ? b.challenger_external_name : b.opponent_external_name;
        var mateId = side === 1 ? b.challenger_partner_id : b.opponent_partner_id;
        var mateExt = side === 1 ? b.challenger_partner_name : b.opponent_partner_name;

        var out = { names: [], photos: [] };

        function push(id, ext) {
            var p = id ? players[id] : null;
            var n = (p && nameOf(p)) || ext || '';
            if (!n) return;
            out.names.push(n);
            out.photos.push((p && p.photo) || '');
        }

        push(mainId, mainExt);
        if (BF.isPair(b)) push(mateId, mateExt);
        return out;
    };

    /**
     * Короткая подпись стороны для кнопки голосования: «Хан / Асанов».
     *
     * Полные имена в кнопку не помещаются ни на карточке, ни в Telegram,
     * поэтому берём последнее слово — фамилию.
     */
    BF.shortSide = function(names) {
        return (names || []).map(function(n) {
            var parts = String(n).trim().split(/\s+/);
            return parts[parts.length - 1] || n;
        }).join(' / ');
    };

    /**
     * Состояние баттла. Одно правило на весь сайт: 'upcoming', 'live', 'done'.
     *
     * Раньше главная считала по одной только дате, страница баттлов — по дате
     * со временем, и баттл, назначенный на сегодня в 10:00, в полдень висел
     * на главной как предстоящий и лежал в архиве на своей странице.
     *
     * Завершённым считаем только тот, где введён счёт. Наступившее время
     * матча означает «идёт»: пока судья не сохранил результат, баттл никуда
     * не должен пропадать — раньше он в этот промежуток исчезал отовсюду.
     */
    BF.state = function(b) {
        if (!b) return 'upcoming';
        if (b.status === 'completed') return 'done';

        var date = b.proposed_date || '';
        if (!date) return 'upcoming';

        // Время матча по Бишкеку; без времени считаем от конца дня
        var when = new Date(date + 'T' + (b.proposed_time || '23:59') + ':00+06:00');
        if (isNaN(when.getTime())) return 'upcoming';

        return Date.now() >= when.getTime() ? 'live' : 'upcoming';
    };

    /** Матч отыгран и счёт сохранён */
    BF.isPlayed = function(b) {
        return BF.state(b) === 'done';
    };
})();
