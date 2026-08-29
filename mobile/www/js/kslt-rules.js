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
    R.PAGE_SIZE = 30;

    window.KSLT_RULES = R;
})();
