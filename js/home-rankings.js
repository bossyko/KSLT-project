// ============================================
// Главная — блок «Топ рейтинга»
// ============================================
//
// Данные берём оттуда же, откуда их берёт страница рейтинга: общий модуль
// js/rankings-data.js. Пересчитался рейтинг после турнира — на главной он
// изменится сам.
//
// Раньше здесь лежали восемьдесят две строки, вписанные в разметку руками:
// выдуманные имена, выдуманные очки, чужие фотографии.
//
// Гостю показываем пять строк чётко и три в тумане, поверх — карточка входа.
// Правило то же, что на странице рейтинга: видно, что рейтинг длиннее.

(function() {
    'use strict';

    var section = document.getElementById('rankings');
    if (!section) return;

    var ROWS = 8;          // сколько игроков показываем всего: тройка на
                           // пьедестале плюс пять строк таблицы
    var ПЬЕДЕСТАЛ = 3;     // мест уносит пьедестал; таблица начинается с 4-го

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn
        ? { rank: '#', player: 'Player', country: 'Ctry', ntrp: 'NTRP', ntrpSub: 'sng / dbl', wl: 'W/L', points: 'Pts', change: 'Δ', empty: 'No players in this category yet',
            ptsWord: 'pts', places: ['1st place', '2nd place', '3rd place'] }
        : (isKg
            ? { rank: '#', player: 'Оюнчу', country: 'Өлк.', ntrp: 'NTRP', ntrpSub: 'жеке / жуп', wl: 'Ж/Ж', points: 'Упай', change: 'Δ', empty: 'Бул категорияда оюнчулар жок',
                ptsWord: 'упай', places: ['1-орун', '2-орун', '3-орун'] }
            : { rank: '#', player: 'Игрок', country: 'Стр.', ntrp: 'NTRP', ntrpSub: 'од. / пар.', wl: 'В/П', points: 'Очки', change: 'Δ', empty: 'В этой категории пока нет игроков',
                ptsWord: 'очков', places: ['1 место', '2 место', '3 место'] });

    var playerPage = isEn ? 'pages/player-en.html' : (isKg ? 'pages/player-kg.html' : 'pages/player.html');

    start();

    /**
     * Переключатель пола — на телефоне.
     *
     * Две таблицы рядом туда не помещаются, а листать их одну под другой
     * долго. Кнопки просто помечают, какую колонку показывать: правила
     * рейтинга не меняются, это только про вид.
     */
    function включитьПереключательПола() {
        var полоса = document.querySelector('.rk-gender-switch');
        var колонки = document.querySelector('.rankings-columns');
        if (!полоса || !колонки) return;

        колонки.setAttribute('data-пол', 'men');
        полоса.addEventListener('click', function (e) {
            var кнопка = e.target.closest('.rk-gender');
            if (!кнопка) return;
            полоса.querySelectorAll('.rk-gender').forEach(function (к) {
                к.classList.toggle('active', к === кнопка);
            });
            колонки.setAttribute('data-пол', кнопка.dataset['пол']);
        });
    }

    async function start() {
        if (!window.KSLT_RANKINGS) return;

        var data = null;
        try {
            data = await window.KSLT_RANKINGS.load();
        } catch (e) {
            console.error('[KSLT] рейтинг на главной не загружен:', e);
        }

        var колонки = section.querySelector('.rankings-columns');
        if (!колонки) return;

        if (!data) {
            /* База молчит — заголовок раздела и ссылка «Полный рейтинг»
               остаются на месте, а не дыра в странице. */
            колонки.innerHTML = '<div class="rankings-col">' + пусто() + '</div>';
            включитьПереключательПола();
            return;
        }

        var guest = isGuest();
        колонки.classList.toggle('is-guest', guest);

        колонки.innerHTML = колонка('men', data, guest) + колонка('women', data, guest);
        включитьВкладки(колонки);
        включитьПереключательПола();
        включитьВход(колонки);
    }

    /**
     * КОЛОНКУ СТРОИТ ЭТОТ ФАЙЛ, И ТОЛЬКО ОН — с 24.09.
     *
     * До этого колонки строил инлайновый скрипт в index.html, а сюда
     * приходило только наполнение панелей. Два шага одного конвейера с ДВУМЯ
     * разными правилами: там «рейтинговая категория» определялась по НАЗВАНИЮ
     * («friendly»), здесь — по идентификатору. Категория называется «Friendly
     * Weekend», поэтому первый фильтр не срабатывал никогда: вкладка
     * создавалась, данных для неё не было, и раздел на всех видах открывался
     * словами «в этой категории пока нет игроков».
     *
     * Одно определение на одно понятие: список разрядов даёт KSLT_RULES,
     * нерейтинговые отсекает слой данных (rankings-data.js:96).
     */
    function колонка(пол, data, guest) {
        var R = window.KSLT_RULES;
        var разряды = (R && R.categoryIds ? R.categoryIds(пол) : [])
            .map(function (id) { return { id: id, ключ: пол + '-' + id, кат: data[пол + '-' + id] }; })
            .filter(function (x) { return !!x.кат; });

        if (!разряды.length) return '';

        /* УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ. Активной встаёт первая
           категория С ЛЮДЬМИ, а не первая по порядку. Пустые из ленты не
           убираем: разряд существует, просто в нём пока никто не играл. */
        var активный = разряды.findIndex(function (x) { return (x.кат.players || []).length > 0; });
        if (активный < 0) активный = 0;

        var titleId = 'rk-title-' + пол;
        var html = '<div class="rankings-col">' +
            '<h3 class="rankings-col-title" id="' + titleId + '">' +
                esc(разряды[0].кат.genderLabel ? заголовок(пол) : заголовок(пол)) + '</h3>' +
            '<div class="rankings-tabs" role="tablist" aria-labelledby="' + titleId + '">';

        разряды.forEach(function (x, i) {
            var вкл = i === активный;
            html += '<button class="rankings-tab' + (вкл ? ' active' : '') + '"' +
                ' role="tab" type="button"' +
                ' id="tab-' + esc(x.ключ) + '"' +
                ' aria-selected="' + (вкл ? 'true' : 'false') + '"' +
                ' aria-controls="' + esc(x.ключ) + '"' +
                ' tabindex="' + (вкл ? '0' : '-1') + '"' +
                ' data-target="' + esc(x.ключ) + '">' + esc(x.кат.name) + '</button>';
        });
        html += '</div>';

        разряды.forEach(function (x, i) {
            var вкл = i === активный;
            var список = x.кат.players || [];
            html += '<div class="rankings-panel' + (вкл ? ' active' : '') + '"' +
                ' id="' + esc(x.ключ) + '" role="tabpanel"' +
                ' aria-labelledby="tab-' + esc(x.ключ) + '"' +
                (вкл ? '' : ' hidden') + '>' +
                (список.length ? (пьедестал(список) + table(список, guest)) : пусто()) +
            '</div>';
        });

        return html + '</div>';
    }

    /* ВХОД ПЬЕДЕСТАЛА — ОДИН РАЗ И ТОЛЬКО КОГДА ДО НЕГО ДОШЛИ.
       Тумбы встают снизу по очереди (бронза → серебро → золото, победитель
       последним), потом над ним один раз просыпаются искры. Никакой петли:
       раздел, который вечно шевелится, на таблице результатов только мешает.

       Человеку, которому от движения плохо, не сыплем ничего: ни искр, ни
       въезда. То же самое проверяет и css, но искры создаёт js, поэтому
       спросить надо в обоих местах. */
    function включитьВход(корень) {
        var тихо = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var карточки = корень.querySelectorAll('.pl-podium-card');
        if (тихо || !('IntersectionObserver' in window)) {
            [].forEach.call(карточки, function (к) { к.classList.add('pl-visible'); });
            return;
        }

        var набл = new IntersectionObserver(function (записи) {
            записи.forEach(function (з) {
                if (!з.isIntersecting) return;
                набл.unobserve(з.target);
                з.target.classList.add('pl-visible');
                искры(з.target);
            });
        }, { threshold: 0.35 });

        [].forEach.call(карточки, function (к) { набл.observe(к); });
    }

    /* Искры живут полторы секунды и уходят вместе с узлами: ни таймеров,
       ни мусора в разметке.

       Цвет и количество — по месту: золото десятью искрами, серебро и бронза
       шестью. Поровну было бы неправильно: три равных фейерверка спорят друг
       с другом, и первое место перестаёт быть первым.

       Задержка тоже по месту и повторяет порядок приезда тумб: бронза,
       серебро, золото. */
    var МЕТАЛЛ = {
        'pl-podium-first':  { цвет: 'rgba(233, 184, 36, 0.95)', сколько: 10, пауза: 0.50 },
        'pl-podium-second': { цвет: 'rgba(210, 210, 210, 0.90)', сколько: 6, пауза: 0.41 },
        'pl-podium-third':  { цвет: 'rgba(205, 127, 50, 0.90)',  сколько: 6, пауза: 0.32 }
    };

    function искры(карточка) {
        var гнездо = карточка.querySelector('.pl-podium-photo-wrap');
        if (!гнездо) return;
        var м = МЕТАЛЛ['pl-podium-first'];
        for (var к in МЕТАЛЛ) {
            if (карточка.classList.contains(к)) { м = МЕТАЛЛ[к]; break; }
        }
        for (var i = 0; i < м.сколько; i++) {
            var и = document.createElement('span');
            и.className = 'rk-iskra';
            и.style.setProperty('--iskra', м.цвет);
            и.style.left = (10 + Math.random() * 80) + '%';
            и.style.animationDelay = (м.пауза + Math.random() * 0.5).toFixed(2) + 's';
            гнездо.appendChild(и);
        }
        setTimeout(function () {
            var все = гнездо.querySelectorAll('.rk-iskra');
            [].forEach.call(все, function (э) { э.remove(); });
        }, 2600);
    }

    function заголовок(пол) {
        if (isEn) return пол === 'men' ? 'Men\u2019s singles ranking' : 'Women\u2019s singles ranking';
        if (isKg) return пол === 'men' ? '\u042d\u0440\u043a\u0435\u043a\u0442\u0435\u0440\u0434\u0438\u043d \u0436\u0435\u043a\u0435 \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0438' : '\u0410\u044f\u043b\u0434\u0430\u0440\u0434\u044b\u043d \u0436\u0435\u043a\u0435 \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0438';
        return пол === 'men' ? '\u041c\u0443\u0436\u0441\u043a\u043e\u0439 \u043e\u0434\u0438\u043d\u043e\u0447\u043d\u044b\u0439 \u0440\u0435\u0439\u0442\u0438\u043d\u0433' : '\u0416\u0435\u043d\u0441\u043a\u0438\u0439 \u043e\u0434\u0438\u043d\u043e\u0447\u043d\u044b\u0439 \u0440\u0435\u0439\u0442\u0438\u043d\u0433';
    }

    function пусто() {
        return '<div class="rk-empty">' + esc(L.empty) + '</div>';
    }

    /* Вкладки: чип фильтрует список на месте (Filter chip 49:77), поэтому
       role=tab + aria-selected, а не голая кнопка. Клавиатура — стрелками,
       как того требует шаблон tablist. */
    function включитьВкладки(корень) {
        корень.addEventListener('click', function (e) {
            var кнопка = e.target.closest('.rankings-tab');
            if (кнопка) выбрать(кнопка);
        });
        корень.addEventListener('keydown', function (e) {
            var кнопка = e.target.closest('.rankings-tab');
            if (!кнопка) return;
            var шаг = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
            if (!шаг) return;
            e.preventDefault();
            var все = [].slice.call(кнопка.closest('.rankings-tabs').querySelectorAll('.rankings-tab'));
            var i = (все.indexOf(кнопка) + шаг + все.length) % все.length;
            выбрать(все[i]);
            все[i].focus();
        });
    }

    function выбрать(кнопка) {
        var колонка = кнопка.closest('.rankings-col');
        колонка.querySelectorAll('.rankings-tab').forEach(function (b) {
            var вкл = b === кнопка;
            b.classList.toggle('active', вкл);
            b.setAttribute('aria-selected', вкл ? 'true' : 'false');
            b.setAttribute('tabindex', вкл ? '0' : '-1');
        });
        колонка.querySelectorAll('.rankings-panel').forEach(function (p) {
            var вкл = p.id === кнопка.dataset.target;
            p.classList.toggle('active', вкл);
            if (вкл) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });
    }

    function isGuest() {
        try {
            var raw = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');
            if (!raw) return true;
            var s = JSON.parse(raw);
            return !(s && s.access_token && s.expires_at > Math.floor(Date.now() / 1000));
        } catch (e) { return true; }
    }

    /* ТАБЛИЦА НАЧИНАЕТСЯ С ЧЕТВЁРТОГО МЕСТА. Тройку показывает пьедестал, и
       повторять её здесь нельзя: глаз читает одни и те же имена дважды, а
       раздел растёт вдвое. Разряд меньше четырёх человек — таблицы нет
       вовсе, пьедестал показывает всех, кто есть. */
    function table(list, guest) {
        if (list.length <= ПЬЕДЕСТАЛ) return '';
        var html = '<div class="rk-row rk-head">' +
            '<span class="rk-rank">' + L.rank + '</span>' +
            '<span>' + L.player + '</span>' +
            '<span class="rk-country">' + L.country + '</span>' +
            '<span class="rk-ntrp">' + L.ntrp +
                '<span class="pl-col-sub">' + (L.ntrpSub || '') + '</span></span>' +
            '<span class="rk-wl">' + L.wl + '</span>' +
            '<span class="rk-points">' + L.points + '</span>' +
            '<span class="rk-change">' + L.change + '</span>' +
        '</div>';

        for (var i = ПЬЕДЕСТАЛ; i < Math.min(list.length, ROWS); i++) {
            html += row(list[i], i, guest);
        }
        return html;
    }

    /* ТУМАН СЧИТАЕТ CSS, А НЕ JS. Сколько строк видно чётко, зависит от
       вида, а разметка одна на все экраны: при повороте ничего не
       пересобирается. Классы .rk-blur-1/2 отсюда убраны 24.09. */
    function row(p, i, guest) {
        var ch = p.change || 0;
        var chHtml = ch > 0 ? '<span class="rk-up">+' + ch + '</span>'
                   : (ch < 0 ? '<span class="rk-down">' + ch + '</span>'
                             : '<span class="rk-same">\u2014</span>');

        // Два числа: одиночный разряд и парные турниры
        var R = window.KSLT_RULES;
        var ntrp = (R && R.ntrpКоротко && R.ntrpКоротко(p.ntrp_singles, p.ntrp_doubles)) || '\u2014';

        // Гостю имя не ссылка: страница игрока ему всё равно закрыта
        var name = guest
            ? '<span>' + esc(p.name) + '</span>'
            : '<a href="' + playerPage + '?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a>';

        return '<div class="rk-row">' +
            /* Класс `top` убран 24.09: тройку выделяет пьедестал, а лайм по
               правилу 109:370 принадлежит одному главному действию. */
            '<span class="rk-rank">' + (i + 1) + '</span>' +
            '<div class="rk-player">' +
                лицо(p) + name +
            '</div>' +
            '<span class="rk-country">' + esc(p.country) + '</span>' +
            '<span class="rk-ntrp">' + ntrp + '</span>' +
            '<span class="rk-wl">' + (p.wins || 0) + '/' + (p.losses || 0) + '</span>' +
            '<span class="rk-points">' + Number(p.points || 0).toLocaleString('ru-RU') + '</span>' +
            '<span class="rk-change">' + chHtml + '</span>' +
        '</div>';
    }

    /* ПЬЕДЕСТАЛ — ТОТ ЖЕ, ЧТО НА СТРАНИЦЕ РЕЙТИНГА, А НЕ ВТОРОЙ.
       24.09 я сперва написал для главной свой `.rk-podium` — и это было
       ровно то, что запрещено: пьедестал уже существовал в коде
       (js/players.js:447) по компоненту Ranking podium 51:80. Свой выброшен,
       стили вынесены из css/players.css в общий css/podium.css, и обе
       стороны берут один и тот же.

       Отличие от страницы одно и это свойство места, а не компонента:
       значков под именем здесь нет — на главной данные о значках не
       грузятся, а компонент разрешает их не показывать.

       Разметка идёт ПО МЕСТАМ, 1 – 2 – 3; на экране их переставляет css. */
    function пьедестал(list) {
        var тройка = list.slice(0, ПЬЕДЕСТАЛ);
        if (!тройка.length) return '';
        var медали = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
        var класс = ['pl-podium-first', 'pl-podium-second', 'pl-podium-third'];
        return '<div class="pl-podium">' + тройка.map(function (p, i) {
            return '<div class="pl-podium-card ' + класс[i] + '">' +
                '<div class="pl-podium-medal" role="img" aria-label="' +
                    esc(L.places[i]) + '">' + медали[i] + '</div>' +
                '<div class="pl-podium-photo-wrap">' + лицо(p, 'pl-podium-photo') + '</div>' +
                '<div class="pl-podium-base">' +
                    '<div class="pl-podium-name">' + esc(p.name) + '</div>' +
                    '<div class="pl-podium-points">' +
                        Number(p.points || 0).toLocaleString('ru-RU') + ' ' + esc(L.ptsWord) +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('') + '</div>';
    }

    /* Нет фото — рисуем инициалы сами, без запроса на чужой CDN.
       Avatar 29:82. Размер берётся от .rk-player, один на фото и на заглушку. */
    function инициалы(имя) {
        return (имя || '').trim().split(/\s+/).slice(0, 2)
            .map(function (ч) { return ч.charAt(0); }).join('');
    }
    function лицо(p, класс) {
        var к = класс ? класс + ' ' : '';
        return p.photo
            ? '<img' + (класс ? ' class="' + класс + '"' : '') +
              ' src="' + esc(p.photo) + '" alt="" loading="lazy">'
            : '<span class="' + к + 'avatar-initials" aria-hidden="true">' +
              esc(инициалы(p.name)) + '</span>';
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
