/**
 * ДАННЫЕ ГРАФИКА РЕЙТИНГА — ОДИН ДОМ НА ДВА ПРОДУКТА (шаг A3.3, 29.10).
 *
 * ЧТО БЫЛО. `js/rating-chart.js` (494 строки) и
 * `mobile/www/js/rating-chart.js` (196 строк) — не копия и отставшая
 * копия, а ДВЕ РЕАЛИЗАЦИИ одного понятия: сайт рисует через Chart.js,
 * приложение — свой SVG. Рисование законно разное. А логика данных была
 * продублирована и РАЗОШЛАСЬ на пяти местах:
 *
 *   1. `friendly` сайт выбрасывал, приложение — нет: на графике в
 *      приложении стояла лишняя линия за турниры, где очков не дают;
 *   2. порядок категорий: сайт звал `KSLT_RULES.поСилеКатегорий`,
 *      приложение считало само по `sort_order` — порядок линий разный;
 *   3. второй ключ сортировки `created_at` был только на сайте. Оценку
 *      NTRP можно поменять несколько раз за день, такие записи лежат
 *      одной датой, и без второго ключа порядок внутри дня произвольный:
 *      линия шла зигзагом. Приложение жило с этой бедой;
 *   4. `ntrp_after` приложение не запрашивало вовсе;
 *   5. цвет-заглушка: сайт брал из темы, приложение держал зашитым.
 *
 * ГРАНИЦА ДОМА. Здесь только ДАННЫЕ: что прочитать, за какое окно, как
 * отобрать и как накопить. Ни рисования, ни цветов-заглушек, ни выбора
 * языка — это забота продукта, и у сайта с приложением она разная по
 * существу: у приложения нет ни Chart.js, ни `KSLT_KRASKA`.
 *
 * Поэтому `categories` принимает ФУНКЦИЮ выбора названия, а не язык:
 * сайт зовёт её через `KSLT_YAZYK`, приложение — через `KSLT_I18N`.
 * Цвет дом отдаёт как есть из базы или `null` — заглушку ставит тот,
 * кто рисует.
 *
 * Правка этого файла правится В ДВУХ МЕСТАХ: он лежит побайтовой копией
 * в `mobile/www/js/`. Расхождение копий ловит сторож
 * `check-grafik-dannye.js`, а не память.
 */
(function (global) {
    'use strict';

    var API = global.KSLT_GRAFIK_DANNYE = {};

    /**
     * НАЧАЛО СЕЗОНА — 1 сентября.
     * То же, что `oldest_date` в `recalc_player_categories`: одно
     * определение на одно понятие, иначе график и пересчёт очков
     * разойдутся на границе сезона.
     */
    API.началоСезона = function (сейчас) {
        var now = сейчас || new Date();
        var год = now.getFullYear();
        return ((now.getMonth() + 1) >= 9 ? год - 1 : год - 2) + '-09-01';
    };

    /**
     * Записи, из которых складываются очки и оценка.
     *
     * ВТОРОЙ КЛЮЧ СОРТИРОВКИ ОБЯЗАТЕЛЕН. Оценку NTRP можно поменять
     * несколько раз за день, и такие записи лежат одной датой. Без
     * `created_at` порядок внутри дня произвольный, и линия оценки
     * идёт зигзагом.
     *
     * `ntrp_after` берётся ЗДЕСЬ, а не при отборе: оценка пишется
     * отдельной строкой без категории и без очков, и при отборе на
     * входе она не доходила бы и до графика оценки.
     */
    API.rows = function (client, playerId) {
        return client.from('rating_history')
            .select('recorded_at, points_earned, tournament_name, category_id, is_doubles, ntrp_after')
            .eq('player_id', playerId)
            .gte('recorded_at', API.началоСезона())
            .order('recorded_at', { ascending: true })
            .order('created_at', { ascending: true })
            .then(function (r) { return r.data || []; });
    };

    /**
     * Строки, дающие очки: с категорией, не парные, не friendly.
     *
     * Friendly в рейтинге не участвует — очков за него нет, значит и
     * линии на графике быть не должно.
     *
     * Отбор живёт ОТДЕЛЬНО от чтения, а не внутри запроса: строка
     * оценки NTRP не имеет категории и не дала бы себя прочитать.
     */
    API.pointRows = function (rows) {
        return (rows || []).filter(function (r) {
            return r.category_id && r.category_id !== 'friendly' && r.is_doubles !== true;
        });
    };

    /**
     * Категории: название, цвет, порядок.
     *
     * Колонка `color` заводится миграцией `sql/схема/category-colors.sql`.
     * Пока её нет, запрос с ней падает ЦЕЛИКОМ, поэтому откат на выборку
     * без цвета.
     *
     * @param {function} выбратьИмя — (строка категории) → название на
     *        языке продукта. Выбор языка остаётся продукту: у сайта и у
     *        приложения он устроен по-разному.
     */
    API.categories = function (client, выбратьИмя) {
        return client.from('categories')
            .select('id, name, name_en, name_kg, sort_order, color')
            .then(function (r) {
                if (r.error) {
                    return client.from('categories')
                        .select('id, name, name_en, name_kg, sort_order');
                }
                return r;
            })
            .then(function (r) {
                var map = {};
                (r.data || []).forEach(function (c) {
                    map[c.id] = {
                        name: выбратьИмя ? выбратьИмя(c) : c.name,
                        color: c.color || null,
                        sort: c.sort_order || 0
                    };
                });
                return map;
            });
    };

    /**
     * Накопление по категории с переносом значения вперёд: между
     * турнирами линия держит достигнутое, в день турнира — ступенька.
     *
     * ПОРЯДОК КАТЕГОРИЙ БЕРЁТСЯ У ПРАВИЛА, А НЕ СЧИТАЕТСЯ ЗДЕСЬ.
     * `KSLT_RULES.поСилеКатегорий` — то же правило, которым сортируются
     * карточки категорий на странице игрока. Своя арифметика по
     * `sort_order` дала бы второе определение одного понятия.
     *
     * Возвращает `values` (числа) и `meta` (строки базы) ОТДЕЛЬНЫМИ
     * списками одной длины: Chart.js хочет числа списком, SVG —
     * точку с её строкой. Ни один из двух видов не навязывается другому.
     */
    API.series = function (allRows, cats) {
        var rows = API.pointRows(allRows);

        var dates = [];
        rows.forEach(function (r) {
            if (dates.indexOf(r.recorded_at) === -1) dates.push(r.recorded_at);
        });
        dates.sort();

        var byCat = {};
        rows.forEach(function (r) {
            (byCat[r.category_id] = byCat[r.category_id] || []).push(r);
        });

        /* ПРАВИЛО ТРЕБУЕТСЯ, А НЕ ПОДМЕНЯЕТСЯ. Первая редакция имела
           мягкий откат на свою арифметику по `sort_order` — и это была
           ровно та беда, от которой дом и заводился: при отсутствии
           правила порядок линий молча становился другим, а никто бы не
           узнал. Тихое расхождение хуже падения, поэтому падаем.

           Порядок тегов на страницах сайта не строгий: `rating-chart.js`
           там грузится РАНЬШЕ `kslt-rules.js`. Работает это потому, что
           зов приходится на время работы, а не на загрузку. Опираться на
           такой порядок нельзя, поэтому дом не надеется, а проверяет. */
        var правило = global.KSLT_RULES && global.KSLT_RULES.поСилеКатегорий;
        if (!правило) {
            throw new Error('KSLT_GRAFIK_DANNYE: нет KSLT_RULES.поСилеКатегорий — ' +
                'порядок категорий задаёт одно правило на продукт, ' +
                'подменять его своей арифметикой нельзя');
        }
        var order = Object.keys(byCat).sort(function (a, b) {
            return правило(cats[a], cats[b]);
        });

        var sets = order.map(function (cat) {
            var sum = 0, started = false, debut = -1;
            var values = [], meta = [];
            dates.forEach(function (d) {
                var hit = null;
                byCat[cat].forEach(function (r) { if (r.recorded_at === d) hit = r; });
                if (hit) {
                    sum += hit.points_earned || 0;
                    if (!started) debut = dates.indexOf(d);
                    started = true;
                }
                values.push(started ? sum : null);
                meta.push(hit);
            });
            return { cat: cat, values: values, meta: meta, debut: debut, total: sum };
        });

        return { dates: dates, sets: sets };
    };

    /**
     * ТОЧКИ ОЦЕНКИ NTRP (шаг A3.3б, 29.10).
     *
     * Оценка пишется ОТДЕЛЬНОЙ строкой истории: без категории и без
     * очков. Поэтому она не проходит через `pointRows` и отбирается
     * здесь — своим признаком.
     *
     * Отбор живёт в доме, а не у рисовальщиков: на сайте он стоял внутри
     * `renderNtrp`, в приложении графика оценки не было вовсе, и стоило
     * его завести — признак разошёлся бы на второй день.
     */
    API.ntrpPoints = function (rows) {
        var точки = [];
        (rows || []).forEach(function (r) {
            if (r.ntrp_after == null) return;
            точки.push({ дата: r.recorded_at, оценка: r.ntrp_after });
        });
        return точки;
    };

    /**
     * ОЦЕНКА КАК ЕЁ ВЫБРАЛИ: 3.75, 4.0, 4.25 — а не округлённая до 3.8.
     *
     * Это формат ЧИСЛА, а не вид: 4.0 и 4 — одна оценка, и человек
     * обязан видеть её одинаково на сайте и в приложении. Поэтому в доме.
     */
    API.ntrpТекст = function (v) {
        var n = Number(v);
        return (Math.round(n * 100) % 100 === 0) ? n.toFixed(1) : String(n);
    };

})(typeof window !== 'undefined' ? window : this);
