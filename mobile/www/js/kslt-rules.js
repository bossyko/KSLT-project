/**
 * Правила клуба — одни на двоих, для сайта и для приложения.
 *
 * Всё, что лежит здесь, раньше было записано дважды: своё в сайте, своё в
 * приложении. И расходилось молча. За один день это вылезло трижды: у женщин
 * в приложении оказалось пять категорий вместо трёх, на главной пропали
 * турниры, а подписи категорий писались как в базе — «masters» вместо
 * «Masters», потому что две карты названий не сошлись ни между собой, ни с
 * базой.
 *
 * Поэтому: вид у сайта и приложения свой, а правила общие. Файл лежит в
 * js/ и копией в mobile/www/js/ — Capacitor раскладывает эту папку и в
 * Android, и в iOS. Копии сверяет tools/check-rules.js.
 *
 * Ничего не грузит и никуда не ходит: чистые правила, данные приходят
 * снаружи.
 */
(function () {
    'use strict';

    var R = {};

    // ---- Категории -------------------------------------------------

    /** Порядок разрядов: сильные сверху. Тот же, что в сортировке базы. */
    R.CATEGORY_ORDER = ['promasters', 'masters', 'tour', 'challenger', 'futures'];

    /**
     * Какие разряды у кого. У женщин их три — так решил клуб, и так уже
     * сделано на сайте. В базе у категорий пола нет вовсе, там один общий
     * список на всех, поэтому делить приходится здесь.
     */
    R.MEN_CATEGORIES = ['promasters', 'masters', 'tour', 'challenger', 'futures'];
    R.WOMEN_CATEGORIES = ['masters', 'tour', 'futures'];

    /** Нерейтинговые в таблицы не идут: дружеские турниры очков не дают. */
    R.NON_RATING = ['friendly'];

    /**
     * Разбирает ключ вида «women-masters» на пол и разряд. Сайт хранит
     * категории с полом в ключе, база — без. Понимаем оба вида.
     */
    R.splitKey = function (key) {
        var s = String(key || '');
        var i = s.indexOf('-');
        if (i > 0) {
            var g = s.slice(0, i);
            if (g === 'men' || g === 'women') {
                return { gender: g, id: s.slice(i + 1) };
            }
        }
        return { gender: null, id: s };
    };

    R.categoryIds = function (gender) {
        return gender === 'women' ? R.WOMEN_CATEGORIES.slice() : R.MEN_CATEGORIES.slice();
    };

    /** Положен ли разряд этому полу. */
    R.allowsCategory = function (gender, categoryId) {
        return R.categoryIds(gender).indexOf(R.splitKey(categoryId).id) !== -1;
    };

    /**
     * Разряды для переключателя: берём строки из базы, отсеиваем чужие полу
     * и нерейтинговые, раскладываем по порядку.
     *
     * dbCategories — как есть из таблицы categories.
     */
    R.categoriesFor = function (gender, dbCategories) {
        var allowed = R.categoryIds(gender);
        var byId = {};
        (dbCategories || []).forEach(function (c) { byId[c.id] = c; });

        var out = [];
        R.CATEGORY_ORDER.forEach(function (id) {
            if (allowed.indexOf(id) === -1) return;
            if (R.NON_RATING.indexOf(id) !== -1) return;
            var c = byId[id];
            if (!c) return;
            if (c.is_rating === false) return;
            out.push(c);
        });
        return out;
    };

    /**
     * Человеческое название разряда. Раньше в приложении лежали две карты
     * с ключами «men-tour», каких в базе нет вовсе, — совпадений не было
     * никогда, и на экран шло сырое «masters».
     */
    /**
     * Строки из таблицы categories, запомненные один раз. Кто первым их
     * загрузил, тот и положил сюда — остальным незачем ходить в базу за
     * шестью строками ради подписи.
     */
    var _known = [];
    R.rememberCategories = function (dbCategories) {
        if (dbCategories && dbCategories.length) _known = dbCategories;
    };
    R.knownCategories = function () { return _known; };

    R.categoryLabel = function (categoryId, lang, dbCategories) {
        var id = R.splitKey(categoryId).id;
        var rows = (dbCategories && dbCategories.length) ? dbCategories : _known;
        var row = null;
        (rows || []).forEach(function (c) { if (c.id === id) row = c; });

        if (row) {
            if (lang === 'en') return row.name_en || row.name || id;
            if (lang === 'kg') return row.name_kg || row.name || id;
            return row.name || id;
        }

        // База не под рукой — отдаём хотя бы с большой буквы, а не как в коде
        var FALLBACK = {
            promasters: 'Pro-Masters', masters: 'Masters', tour: 'Tour',
            challenger: 'Challenger', futures: 'Futures', friendly: 'Friendly Weekend'
        };
        return FALLBACK[id] || id;
    };

    // ---- Игроки ----------------------------------------------------

    /**
     * Фоновая карточка: человек есть в списках клуба, но членство не
     * оплачено. Показываем приглушённо и всегда — карточка ждёт, когда он
     * заведёт себе учётную запись. Звать и вызывать таких нельзя: по ту
     * сторону никого нет.
     */
    R.isBackground = function (player) {
        if (!player) return true;
        if (player.is_member !== undefined) return player.is_member === false;
        if (player.isMember !== undefined) return player.isMember === false;
        return false;
    };

    /**
     * Места в рейтинге получают только члены клуба. Иначе первым в таблице
     * оказывается тот, кто в клубе не состоит, и она перестаёт отвечать на
     * вопрос «кто первый в КСЛТ». Фоновым — прочерк.
     *
     * Возвращает {идентификатор игрока: место}; кого нет — тому прочерк.
     */
    R.rankMembers = function (players) {
        var rank = 0;
        var out = {};
        (players || []).forEach(function (p) {
            if (!R.isBackground(p)) {
                rank++;
                out[p.id] = rank;
            }
        });
        return out;
    };

    // ---- Турниры ---------------------------------------------------

    /**
     * Событие турнира — название без хвоста про разряд, плюс дата начала.
     * «SUMMER BREEZE CUP – 2026 — дружеский, парный, мужской» и
     * «... — дружеский, микст» это один турнир в двух разрядах.
     */
    R.eventKey = function (t) {
        var base = String(t.title || '').split(' — ')[0].trim().toLowerCase();
        return base + '|' + (t.date_start || '');
    };

    /**
     * По одной карточке на турнир. Разряды заводятся отдельными записями —
     * так считаются очки и строятся сетки, — но шесть плиток с одним и тем
     * же названием выглядели как сбой.
     */
    R.oneCardPerEvent = function (list) {
        var seen = {};
        return (list || []).filter(function (t) {
            var k = R.eventKey(t);
            if (seen[k]) return false;
            seen[k] = true;
            return true;
        });
    };

    /**
     * Что показать в блоке турниров.
     *
     * Впереди пусто — берём недавно сыгранные, от свежих к старым. Без
     * этого запасного хода раздел выглядит заброшенным: в приложении там
     * была пустота, хотя у клуба турниры есть, просто все уже прошли.
     *
     * statusOf(t) — откуда узнать состояние; у сайта и приложения оно
     * считается по-своему, поэтому приходит снаружи.
     * order — вес состояний при сортировке предстоящих.
     */
    R.pickTournaments = function (all, statusOf, limit, order) {
        var list = all || [];
        var ORDER = order || { live: 0, open: 1, soon: 2, closed: 3, done: 4, cancelled: 9 };
        var max = limit || 6;

        var future = list.filter(function (t) { return statusOf(t) !== 'done'; });

        if (!future.length) {
            var done = list.filter(function (t) { return statusOf(t) === 'done'; })
                .sort(function (a, b) {
                    var d = String(b.date_end || b.date_start || '')
                        .localeCompare(String(a.date_end || a.date_start || ''));
                    return d || String(b.created_at || '').localeCompare(String(a.created_at || ''));
                });
            return R.oneCardPerEvent(done).slice(0, max);
        }

        future.sort(function (a, b) {
            var d = ORDER[statusOf(a)] - ORDER[statusOf(b)];
            if (d) return d;
            d = String(a.date_start || '').localeCompare(String(b.date_start || ''));
            if (d) return d;
            // Даты совпали — первым идёт тот, кого раньше завели в базу
            return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });
        return R.oneCardPerEvent(future).slice(0, max);
    };

    // ---- Ссылки на сети --------------------------------------------

    /**
     * Имя пользователя из чего угодно.
     *
     * Люди вписывают в поле что придётся: «@ivanov», «ivanov», целую
     * ссылку с хвостом вида ?utm_source=ig_web_button_share_sheet. Если
     * такое просто показать, приписав собаку, выходит
     * «@https://instagram.com/ivanov?utm_source=…» — так у нас и было в
     * карточке спонсора.
     */
    R.handle = function (value) {
        var v = String(value || '').trim();
        if (!v) return '';

        // Ссылка — берём последний кусок пути, без хвоста с метками
        if (/^https?:\/\//i.test(v) || v.indexOf('/') !== -1) {
            v = v.split(/[?#]/)[0];                 // отрезаем хвост
            v = v.replace(/\/+$/, '');              // и косые в конце
            v = v.slice(v.lastIndexOf('/') + 1);
        }
        return v.replace(/^@+/, '');
    };

    /** Куда вести по нажатию. */
    R.socialUrl = function (kind, value) {
        var h = R.handle(value);
        if (!h) return '';
        if (kind === 'tg') return 'https://t.me/' + h;
        if (kind === 'ig') return 'https://instagram.com/' + h;
        if (kind === 'wa') return 'https://wa.me/' + String(value).replace(/[^0-9]/g, '');
        if (kind === 'phone') return 'tel:' + value;
        return value;
    };

    // ---- Показ списками --------------------------------------------

    /**
     * Сколько строк рейтинга показывать сразу. Остальные — по кнопке:
     * телефон грузил всех разом, а людей под три сотни.
     */
    /**
     * Что делать вошедшему с этим матчем.
     *
     * Одно правило на сайт и приложение: раньше такие мелочи писались в
     * каждом месте заново и незаметно расходились.
     *
     *   enter   — счёта нет, можно вписать
     *   confirm — счёт вписал соперник, ждёт ответа
     *   wait    — счёт вписал ты сам, ждём соперника
     *   done    — счёт окончательный
     *   none    — матч не твой или соперник ещё не определён
     */
    R.matchScoreState = function (match, myPlayerId, myUserId) {
        if (!match || !myPlayerId) return 'none';

        // В паре в записи матча стоит капитан, а напарник не значится вовсе.
        // Поэтому принимаем не один номер, а список: свой и капитанов тех
        // пар, где человек напарник
        var мои = Array.isArray(myPlayerId) ? myPlayerId : [myPlayerId];
        if (мои.indexOf(match.player1_id) === -1 && мои.indexOf(match.player2_id) === -1) return 'none';
        if (!match.player1_id || !match.player2_id) return 'none';
        if (match.score_status === 'pending') {
            return match.score_submitted_by === myUserId ? 'wait' : 'confirm';
        }
        if (match.score_status === 'confirmed' || match.score_status === 'disputed') return 'done';
        return match.winner_id ? 'done' : 'enter';
    };

    /**
     * Счёт по сетам в строку вида «6/3 6/4».
     *
     * Пары «геймы первого, геймы второго»; пустой сет пропускаем — играли
     * не всегда все три. Равный счёт в сете вернёт ошибку: победителя из
     * него не вывести, а его считает база.
     */
    R.buildScore = function (пары) {
        var сеты = [];
        for (var i = 0; i < пары.length; i++) {
            var a = String(пары[i][0] == null ? '' : пары[i][0]).trim();
            var b = String(пары[i][1] == null ? '' : пары[i][1]).trim();
            if (a === '' && b === '') continue;
            if (a === '' || b === '' || a === b) return { ok: false, error: 'bad' };
            сеты.push(a + '/' + b);
        }
        if (!сеты.length) return { ok: false, error: 'empty' };
        return { ok: true, score: сеты.join(' ') };
    };

    R.PAGE_SIZE = 30;

    window.KSLT_RULES = R;

    // ---- Сетка «все места»: из чего она состоит ----
    //
    // Блоки, круги и матчи за места. Раньше эта таблица жила в трёх местах —
    // на сайте, в админке и просилась в приложение. Третья копия и стала бы
    // той, что разойдётся: круги тут описаны вручную, и правка в одном месте
    // молча не доехала бы до других.
    //
    // Возвращает список блоков: у каждого подпись, свои круги (номер круга и
    // разбег номеров матчей) и отдельный матч за место.

    /**
     * Из чего состоит сетка «все места».
     *
     * Строится по тому же правилу, по которому база двигает игроков: в круге
     * r сетка поделена на 2^(r-1) блоков, победитель идёт в верхнюю половину
     * своего блока, проигравший — в нижнюю. Отсюда и адрес блока за места:
     * проигравший первого круга уходит в нижнюю половину всех мест, второго —
     * в нижнюю половину верхней половины, и так далее.
     *
     * Раньше таблица была набита руками для 8, 16 и 32, а правило в базе
     * считало постоянным шагом. Для 16 они случайно совпадали, для 32 уже
     * нет: все проигравшие валились в блок 17-32, а блоки 5-8, 9-12 и 13-16
     * стояли пустыми. Теперь источник один, разойтись нечему.
     */
    // ---- NTRP: одиночный разряд и парные турниры ----
    //
    // В карточке два числа. Показываем их одной строкой с подписями, чтобы
    // не гадать, какое из них к чему: «4.5 одиночка · 4.0 пара». Если второго
    // нет — показываем одно.

    /** Одно число NTRP в привычном виде: 4.5, 4.25, 3. */
    R.ntrpЧисло = function(v) {
        if (v === null || v === undefined || v === '') return null;
        var n = Math.round(Number(v) / 0.25) * 0.25;
        if (isNaN(n)) return null;
        return n.toFixed(2).replace(/\.?0+$/, '');
    };

    /** Строка с подписями для карточки и списков. */
    R.ntrpСтрока = function(одиночный, парный, lang) {
        var од = R.ntrpЧисло(одиночный), пар = R.ntrpЧисло(парный);
        if (!од && !пар) return '';
        var en = lang === 'en';
        var подпись1 = en ? 'singles' : 'одиночка';
        var подпись2 = en ? 'doubles' : 'пара';
        if (од && пар) return од + ' ' + подпись1 + ' · ' + пар + ' ' + подпись2;
        return од ? (од + ' ' + подпись1) : (пар + ' ' + подпись2);
    };

    /** Короткая запись для тесных мест: «4.5 / 4». */
    R.ntrpКоротко = function(одиночный, парный) {
        var од = R.ntrpЧисло(одиночный), пар = R.ntrpЧисло(парный);
        if (!од && !пар) return '';
        if (од && пар) return од + ' / ' + пар;
        return од || пар;
    };

    /**
     * Какой рейтинг брать в парном турнире: парный. Если его нет — одиночный,
     * иначе человек без парной оценки выпал бы из подсчёта суммы пары.
     */
    R.ntrpПары = function(одиночный, парный) {
        var п = (парный === null || парный === undefined || парный === '') ? NaN : Number(парный);
        if (!isNaN(п) && п > 0) return п;
        var о = (одиночный === null || одиночный === undefined || одиночный === '') ? NaN : Number(одиночный);
        return (!isNaN(о) && о > 0) ? о : null;
    };

    R.ficSections = function(drawSize, lang) {
        var isEn = lang === 'en';
        var N = drawSize;
        if (!N || (N & (N - 1)) !== 0 || N < 4) return [];
        var кругов = Math.round(Math.log(N) / Math.log(2));

        // Какие места разыгрывает блок с таким путём: W — победил, L — проиграл
        function места(путь) {
            var a = 1, w = N;
            for (var i = 0; i < путь.length; i++) { w /= 2; if (путь[i] === 'L') a += w; }
            return [a, a + w - 1];
        }
        // Какие номера матчей занимает блок этого пути в своём круге
        function номера(путь, r) {
            var блоков = Math.pow(2, r - 1);
            var наБлок = (N / 2) / блоков;
            var индекс = 0;
            for (var i = 0; i < путь.length; i++) индекс = индекс * 2 + (путь[i] === 'L' ? 1 : 0);
            return [индекс * наБлок + 1, (индекс + 1) * наБлок];
        }
        function путьПоИндексу(индекс, длина) {
            var п = '';
            for (var i = длина - 1; i >= 0; i--) п += ((индекс >> i) & 1) ? 'L' : 'W';
            return п;
        }

        function имяКруга(ширина, r, d, главная) {
            var хвост = ' ' + d[0] + '-' + d[1];
            if (ширина === 2) return главная ? (isEn ? 'Final' : 'Финал') : (isEn ? 'Final' : 'Финал') + хвост;
            if (ширина === 4) return главная ? (isEn ? 'Semifinal' : 'Полуфинал') : (isEn ? 'Semifinal' : 'Полуфинал') + хвост;
            if (ширина === 8) return главная ? (isEn ? 'Quarterfinal' : 'Четвертьфинал') : (isEn ? 'QF' : 'ЧФ') + хвост;
            var н = (isEn ? 'Round ' : 'Раунд ') + r;
            return главная ? н : н + ' (' + d[0] + '-' + d[1] + ')';
        }

        // Собираем клетки по веткам. Ветка — четыре места подряд; живёт со
        // всех кругов, где её отрезок начинается с её первого места.
        var ветки = {};
        for (var r = 1; r <= кругов; r++) {
            var блоков = Math.pow(2, r - 1);
            for (var i = 0; i < блоков; i++) {
                var путь = путьПоИндексу(i, r - 1);
                var d = места(путь);
                var н = номера(путь, r);
                var ширина = d[1] - d[0] + 1;
                if (ширина >= 4) {
                    (ветки[d[0]] = ветки[d[0]] || []).push({ r: r, н: н[0], к: н[1], ширина: ширина, d: d });
                } else {
                    // Последний круг: верхние два места — финал ветки,
                    // нижние — матч за место
                    var начало = ((d[0] - 1) % 4 === 0) ? d[0] : d[0] - 2;
                    var это = (d[0] === начало) ? 'финал' : 'место';
                    (ветки[начало] = ветки[начало] || [])
                        .push({ r: r, н: н[0], к: н[1], ширина: ширина, d: d, вид: это });
                }
            }
        }

        return Object.keys(ветки).map(Number).sort(function(a, b) { return a - b; })
            .map(function(старт) {
                var клетки = ветки[старт];
                var главная = старт === 1;
                var место = null, круги = [];
                клетки.forEach(function(x) {
                    if (x.вид === 'место') место = x; else круги.push(x);
                });
                круги.sort(function(a, b) { return a.r - b.r; });
                return {
                    первоеМесто: старт,
                    label: главная
                        ? (isEn ? 'Main Draw (1-2)' : 'Основная сетка (1-2 место)')
                        : старт + '-' + (старт + 3) + (isEn ? ' Place' : ' место'),
                    rounds: круги.map(function(x) {
                        return { roundNum: x.r, matchStart: x.н, matchEnd: x.к,
                                 name: имяКруга(x.ширина, x.r, x.d, главная) };
                    }),
                    placeMatch: место ? {
                        roundNum: место.r, matchOrder: место.н,
                        label: isEn ? (старт + 2) + '-' + (старт + 3) + ' Place'
                                    : 'За ' + (старт + 2) + '-' + (старт + 3) + ' место'
                    } : null
                };
            });
    };

})();
