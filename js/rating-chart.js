/**
 * KSLT — график истории рейтинга: линия на категорию.
 *
 * Общий для кабинета игрока и публичного профиля, чтобы обе страницы считали
 * одинаково. Значение линии — очки, набранные в этой категории, по тому же
 * правилу, что и текущие очки (recalc_player_categories): сезонное окно,
 * одиночные, категория проставлена. Поэтому конец линии всегда совпадает
 * с цифрой в блоке очков этой категории.
 *
 * Требует Chart.js на странице.
 */
(function() {
    'use strict';

    var API = window.KSLT_RATING_CHART = {};

    /* Краски берутся ДОМОМ КРАСОК и ЛЕНИВО — в момент рисования, а не при
       загрузке файла. Так порядок подключения скриптов перестаёт быть
       вопросом: когда график рисуется, дом уже на странице. Холст не
       понимает var(), поэтому через дом — единственный законный путь. */

    /** Линия категории, у которой свой цвет не задан: приглушённый текст. */
    function FALLBACK_COLOR() {
        return window.KSLT_KRASKA.цвет('--text-muted');
    }

    /* Цвет подписи в легенде. Одним именем, потому что его называют дважды:
       в настройках легенды и в каждой её записи — запись, собранная своими
       руками, настроек не наследует. Отношение: подпись легенды — тот же
       второстепенный текст, что и во всей системе. */
    function ЦВЕТ_ПОДПИСИ() {
        return window.KSLT_KRASKA.цвет('--text-secondary');
    }

    /** Нарисованные графики по идентификатору холста — чтобы гасить прежний. */
    var _charts = {};

    function destroyChart(id) {
        if (id && _charts[id]) {
            _charts[id].destroy();
            delete _charts[id];
        }
    }

    function t(o, ru, en, kg) {
        return o.isKg ? kg : (o.isEn ? en : ru);
    }

    // ---- Категории: название, цвет, порядок ----
    // Колонка color заводится миграцией sql/схема/category-colors.sql. Пока её нет,
    // запрос с ней падает целиком, поэтому откатываемся на выборку без цвета.
    /* ДАННЫЕ БЕРЁТ ОБЩИЙ ДОМ (шаг A3.3, 29.10): `js/kslt-grafik-dannye.js`
       плюс его побайтовая копия в приложении. Подпись наружу оставлена
       как была — зовущие (`js/dashboard.js:5230`) не трогаются.
       Язык и цвет-заглушка остаются ЗДЕСЬ: дом про данные, а язык у
       сайта и приложения устроен по-разному, цвета-заглушки берутся из
       темы, которой в приложении нет. */
    API.categories = async function(client, isEn, isKg) {
        var map = await window.KSLT_GRAFIK_DANNYE.categories(client, function(c) {
            return KSLT_YAZYK.выбрать(c.name_en || c.name, c.name_kg || c.name, c.name);
        });
        Object.keys(map).forEach(function(id) {
            if (!map[id].color) map[id].color = FALLBACK_COLOR();
        });
        return map;
    };

    // ---- Записи, из которых складываются очки ----
    /* Окно сезона, второй ключ сортировки и `ntrp_after` — в общем доме */
    API.rows = function(client, playerId) {
        return window.KSLT_GRAFIK_DANNYE.rows(client, playerId);
    };

    /**
     * Строки, из которых складываются очки: одиночные и с категорией.
     *
     * Отбор перенесён сюда из загрузки, потому что оценка NTRP пишется
     * отдельной строкой без категории и без очков — при отборе на входе она
     * не доходила бы и до графика NTRP.
     */
    /* ОТБОР И НАКОПЛЕНИЕ — В ОБЩЕМ ДОМЕ (шаг A3.3, 29.10).
       Здесь жили: выброс `friendly`, порядок по `поСилеКатегорий`,
       перенос значения вперёд. Приложение считало то же самое по-своему
       и расходилось на пяти местах — теперь считает один дом. */
    API.series = function(allRows, cats) {
        return window.KSLT_GRAFIK_DANNYE.series(allRows, cats);
    };

    // ---- Название категории и её итог у конца линии ----
    var endLabels = {
        id: 'ratingEndLabels',
        afterDatasetsDraw: function(chart) {
            var ctx = chart.ctx;
            chart.data.datasets.forEach(function(ds, i) {
                var meta = chart.getDatasetMeta(i);
                if (meta.hidden) return;
                var last = meta.data[meta.data.length - 1];
                if (!last) return;
                ctx.save();
                ctx.font = '600 12px Inter, sans-serif';
                // Подпись в цвет своей линии, включая приглушённый у закрытых
                ctx.fillStyle = ds.borderColor;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(ds.label + ' · ' + ds._total, last.x - 6, last.y - 8);
                ctx.restore();
            });
        }
    };

    /**
     * Рисует график. Возвращает true, если данные нашлись и график построен.
     *
     * opts: client, playerId, homeCategory, isEn, isKg,
     *       canvasId, wrapId, ntrpCanvasId, ntrpWrapId
     */
    API.render = async function(opts) {
        if (!opts.playerId || !opts.client || typeof Chart === 'undefined') return false;

        var rows = await API.rows(opts.client, opts.playerId);
        if (rows.length === 0) return false;

        // NTRP рисуется даже тогда, когда очков ещё нет
        if (opts.ntrpCanvasId) renderNtrp(rows, opts);

        if (window.KSLT_GRAFIK_DANNYE.pointRows(rows).length === 0) return false;

        var canvas = document.getElementById(opts.canvasId);
        if (!canvas) return false;

        // В админке карточка игрока перерисовывается много раз, а Chart.js
        // на занятом холсте падает. Гасим прежний график, если он был
        destroyChart(opts.canvasId);

        var cats = await API.categories(opts.client, opts.isEn, opts.isKg);

        // Закрытые категории: линия рисуется тише. Игрок в них больше не
        // выступает, но заработанное никуда не делось и остаётся на графике
        var closed = {};
        try {
            var closedRes = await opts.client.from('player_categories')
                .select('category_id, closed_at')
                .eq('player_id', opts.playerId)
                .not('closed_at', 'is', null);
            (closedRes.data || []).forEach(function(r) { closed[r.category_id] = true; });
        } catch(e) { /* колонки может не быть на старой базе — рисуем как обычно */ }

        var series = API.series(rows, cats);
        var top = series.sets.slice().sort(function(a, b) { return b.total - a.total; })[0];

        var wrap = opts.wrapId ? document.getElementById(opts.wrapId) : null;
        if (wrap) wrap.style.display = '';

        var datasets = series.sets.map(function(s) {
            var c = cats[s.cat] || { name: s.cat, color: FALLBACK_COLOR() };
            return {
                label: c.name,
                data: s.values,
                _meta: s.meta,
                _total: s.total,
                borderColor: closed[s.cat] ? window.KSLT_KRASKA.сАльфой(c.color, 0.40) : c.color,
                borderWidth: closed[s.cat] ? 2 : (s.cat === opts.homeCategory ? 3 : 2),
                borderDash: closed[s.cat] ? [5, 4] : undefined,
                // Ступенька у даты начисления, а не у предыдущей: с 'after'
                // Chart.js ставит вертикаль у прошлой точки, и рост очков
                // выглядел так, будто турнир закончился раньше, чем закончился
                stepped: 'before',
                spanGaps: false,
                fill: s === top ? 'origin' : false,
                backgroundColor: function(ctx) {
                    var area = ctx.chart.chartArea;
                    if (!area) return 'transparent';
                    var g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                    g.addColorStop(0, window.KSLT_KRASKA.сАльфой(c.color, 0.22));
                    g.addColorStop(1, window.KSLT_KRASKA.сАльфой(c.color, 0));
                    return g;
                },
                pointBackgroundColor: s.meta.map(function(m) { return m ? c.color : 'transparent'; }),
                pointBorderColor: s.meta.map(function(m, i) { return i === s.debut ? window.KSLT_KRASKA.цвет('--bg-base') : 'transparent'; }),
                pointBorderWidth: s.meta.map(function(m, i) { return i === s.debut ? 3 : 0; }),
                pointRadius: s.meta.map(function(m, i) { return i === s.debut ? 8 : (m ? 4 : 0); }),
                pointHoverRadius: s.meta.map(function(m) { return m ? 7 : 0; })
            };
        });

        /* Имя графика собирается из того же, что нарисовано: сколько
           линий, какая ведёт и с какого значения до какого */
        (function () {
            var части = series.sets.map(function (s) {
                var c = cats[s.cat] || { name: s.cat };
                var v = s.values.filter(function (x) { return x != null; });
                if (!v.length) return c.name;
                return c.name + ' ' + t(opts, 'от ', 'from ', '') + v[0] +
                    t(opts, ' до ', ' to ', '-ден ') + v[v.length - 1];
            });
            назватьГрафик(canvas,
                t(opts, 'График рейтинговых очков: ', 'Rating points chart: ', 'Рейтинг упайлары: ') +
                части.join('; '));
        })();

        _charts[opts.canvasId] = new Chart(canvas, {
            type: 'line',
            data: { labels: series.dates, datasets: datasets },
            plugins: [endLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'nearest', intersect: true },
                // Подпись линии рисуется у её последнего значения. Линия,
                // ушедшая вверх, заканчивалась ровно под легендой, и
                // «Tour · 159» ложилось поверх неё. Легенда уехала вниз,
                // сверху оставлен запас под подпись
                layout: { padding: { right: 16, top: 20 } },
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'start',
                        /* ЦВЕТ КРУЖКА БЕРЁТСЯ У ЛИНИИ, А НЕ У ТОЧКИ НОМЕР НОЛЬ.
                           При `usePointStyle` Chart.js строит запись легенды из
                           стиля ТОЧКИ с номером 0. А `pointBackgroundColor` у
                           нас — массив по точкам: засечка стоит только в дни
                           турниров, в остальные она 'transparent'. У линии,
                           чей первый турнир не совпал с самой левой датой,
                           нулевая точка прозрачная — и кружок в легенде
                           пропадал, оставалась одна подпись.
                           Померено 11.10 на furkat-sadykov: у «Pro-Masters»
                           fillStyle приходил 'transparent', у «Masters» —
                           '#B76BFF' с обводкой '#0d0d10', цветом фона.
                           Берём `borderColor` — он у линии один и уже несёт
                           приглушение закрытой категории. */
                        labels: {
                            color: ЦВЕТ_ПОДПИСИ(), usePointStyle: true, pointStyle: 'circle',
                            boxWidth: 8, padding: 16, font: { size: 12 },
                            generateLabels: function(chart) {
                                return chart.data.datasets.map(function(ds, и) {
                                    return {
                                        text: ds.label,
                                        fillStyle: ds.borderColor,
                                        strokeStyle: ds.borderColor,
                                        lineWidth: 0,
                                        pointStyle: 'circle',
                                        fontColor: ЦВЕТ_ПОДПИСИ(),
                                        hidden: !chart.isDatasetVisible(и),
                                        datasetIndex: и
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: window.KSLT_KRASKA.цвет('--chart-tip-bg'),
                        borderColor: window.KSLT_KRASKA.цвет('--chart-tip-border'),
                        borderWidth: 1,
                        padding: 12,
                        titleColor: window.KSLT_KRASKA.цвет('--chart-tip-title'),
                        bodyColor: window.KSLT_KRASKA.цвет('--chart-tip-body'),
                        displayColors: false,
                        filter: function(item) { return !!item.dataset._meta[item.dataIndex]; },
                        callbacks: {
                            title: function(items) {
                                var m = items[0].dataset._meta[items[0].dataIndex];
                                return m ? m.tournament_name : '';
                            },
                            label: function(item) {
                                var m = item.dataset._meta[item.dataIndex];
                                return [
                                    item.dataset.label + ' · +' + m.points_earned,
                                    t(opts, 'Всего в категории: ', 'Total in category: ', 'Категорияда бардыгы: ') + item.parsed.y,
                                    item.label
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: window.KSLT_KRASKA.цвет('--text-muted'), maxRotation: 45, font: { size: 11 },
                            // В базе дата лежит как 2026-03-16, а в кабинете
                            // везде принят вид 16.03.26
                            callback: function(v, i) { return tickDate(this.getLabelForValue(i)); }
                        },
                        grid: { color: window.KSLT_KRASKA.цвет('--neutral-white', 0.04) }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: window.KSLT_KRASKA.цвет('--text-muted'), font: { size: 11 } },
                        // Подпись оси убрана: она повторяла заголовок над
                        // графиком и съедала ширину повёрнутым текстом
                        grid: { color: window.KSLT_KRASKA.цвет('--neutral-white', 0.04) }
                    }
                }
            }
        });

        return true;
    };

    /**
     * Дата из базы в виде [день, месяц, год].
     *
     * recorded_at — дата без времени, «2026-03-16». Через new Date() она
     * читается как полночь по Гринвичу, и западнее нулевого пояса день
     * терялся: у турнира 16 марта на оси стояло 15-е. Разбираем строку
     * как есть, без часовых поясов.
     */
    /* ХОЛСТ САМ ПО СЕБЕ НЕ ГОВОРИТ НИЧЕГО. Замер 12.10: у dbRatingChart и
       dbNtrpChart не было ни role, ни aria-label, ни запасного текста —
       для диктора это пустая картинка, и человек, который не видит, не
       узнаёт о графике вовсе (WCAG 1.1.1). Имя собирается ИЗ ДАННЫХ, а не
       пишется общей фразой: «с 450 до 870 очков» — это то же, что видит
       глазами зрячий. Файл один на три экрана: публичная страница игрока,
       кабинет и карточка игрока в админке. */
    function назватьГрафик(canvas, подпись) {
        if (!canvas || !подпись) return;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', подпись);
        // Запасной текст ВНУТРИ холста: его читают и те, у кого canvas
        // не нарисовался вовсе
        canvas.textContent = подпись;
    }

    function dateParts(value) {
        var m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return [m[3], m[2], m[1]];

        var d = new Date(value);
        if (isNaN(d.getTime())) return null;
        return [
            String(d.getDate()).padStart(2, '0'),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getFullYear())
        ];
    }

    /* Печать оценки — в общем доме (шаг A3.3б): 4.0 и 4 это одна оценка,
       и человек обязан видеть её одинаково на сайте и в приложении. */
    function ntrpText(v) {
        return window.KSLT_GRAFIK_DANNYE.ntrpТекст(v);
    }

    /** Короткая дата для подписей оси: 16.03.26. */
    function tickDate(value) {
        var p = dateParts(value);
        return p ? p[0] + '.' + p[1] + '.' + p[2].slice(2) : String(value || '');
    }

    /** Дата вида 16.03.2026. */
    function shortDate(value) {
        var p = dateParts(value);
        return p ? p[0] + '.' + p[1] + '.' + p[2] : String(value || '');
    }

    // ---- NTRP отдельно: своя шкала, на общем поле он терялся среди линий ----
    function renderNtrp(rows, opts) {
        var wrap = opts.ntrpWrapId ? document.getElementById(opts.ntrpWrapId) : null;
        var canvas = document.getElementById(opts.ntrpCanvasId);
        if (!canvas) return;

        /* Отбор точек оценки — в общем доме (шаг A3.3б): оценка пишется
           отдельной строкой истории, без категории и без очков, и
           признак для неё обязан быть один на оба продукта. */
        var точки = window.KSLT_GRAFIK_DANNYE.ntrpPoints(rows);
        if (точки.length === 0) return;
        var labels = точки.map(function(п) { return п.дата; });
        var values = точки.map(function(п) { return п.оценка; });

        if (wrap) wrap.style.display = '';
        destroyChart(opts.ntrpCanvasId);

        // Одно измерение — это не история, а число. График из единственной
        // точки в углу пустого поля не сообщал ничего
        if (values.length === 1) {
            var host = canvas.parentNode;
            if (host) {
                host.style.height = 'auto';
                host.innerHTML =
                    '<div class="rc-single">' +
                        '<span class="rc-single-value">' + ntrpText(values[0]) + '</span>' +
                        '<span class="rc-single-note">' +
                            t(opts, 'одно измерение, ', 'single measurement, ', 'бир өлчөө, ') +
                            shortDate(labels[0]) +
                        '</span>' +
                    '</div>';
            }
            return;
        }
        назватьГрафик(canvas,
            t(opts, 'График уровня NTRP: от ', 'NTRP level chart: from ', 'NTRP деңгээли: ') +
            ntrpText(values[0]) + t(opts, ' до ', ' to ', '-ден ') + ntrpText(values[values.length - 1]) +
            ', ' + values.length + t(opts, ' измерений', ' measurements', ' өлчөө'));

        _charts[opts.ntrpCanvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'NTRP',
                    data: values,
                    borderColor: window.KSLT_KRASKA.цвет('--cat-1'),
                    backgroundColor: window.KSLT_KRASKA.цвет('--cat-1', 0.08),
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: window.KSLT_KRASKA.цвет('--cat-1'),
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: window.KSLT_KRASKA.цвет('--chart-tip-bg'),
                        borderColor: window.KSLT_KRASKA.цвет('--chart-tip-border'),
                        borderWidth: 1,
                        titleColor: window.KSLT_KRASKA.цвет('--chart-tip-title'),
                        bodyColor: window.KSLT_KRASKA.цвет('--chart-tip-body'),
                        displayColors: false,
                        callbacks: {
                            label: function(item) { return 'NTRP: ' + ntrpText(item.parsed.y); }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: window.KSLT_KRASKA.цвет('--text-muted'), maxRotation: 45, font: { size: 11 },
                            callback: function(v, i) { return tickDate(this.getLabelForValue(i)); }
                        },
                        grid: { display: false }
                    },
                    y: {
                        min: 1.0, max: 7.0,
                        ticks: { color: window.KSLT_KRASKA.цвет('--cat-1'), stepSize: 1, font: { size: 11 } },
                        grid: { color: window.KSLT_KRASKA.цвет('--neutral-white', 0.04) }
                    }
                }
            }
        });
    }
})();
