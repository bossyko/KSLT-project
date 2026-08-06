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

    var FALLBACK_COLOR = '#8A8A8F';

    function t(o, ru, en, kg) {
        return o.isKg ? kg : (o.isEn ? en : ru);
    }

    // ---- Категории: название, цвет, порядок ----
    // Колонка color заводится миграцией sql/category-colors.sql. Пока её нет,
    // запрос с ней падает целиком, поэтому откатываемся на выборку без цвета.
    API.categories = async function(client, isEn, isKg) {
        var res = await client.from('categories').select('id, name, name_en, name_kg, sort_order, color');
        if (res.error) res = await client.from('categories').select('id, name, name_en, name_kg, sort_order');

        var map = {};
        (res.data || []).forEach(function(c) {
            map[c.id] = {
                name: isKg ? (c.name_kg || c.name) : (isEn ? (c.name_en || c.name) : c.name),
                color: c.color || FALLBACK_COLOR,
                sort: c.sort_order || 0
            };
        });
        return map;
    };

    // ---- Записи, из которых складываются очки ----
    API.rows = async function(client, playerId) {
        var now = new Date();
        var year = now.getFullYear();
        // Сезон начинается 1 сентября — то же, что oldest_date в recalc_player_categories
        var oldest = ((now.getMonth() + 1) >= 9 ? year - 1 : year - 2) + '-09-01';

        var res = await client.from('rating_history')
            .select('recorded_at, points_earned, tournament_name, category_id, is_doubles, ntrp_after')
            .eq('player_id', playerId)
            .gte('recorded_at', oldest)
            .order('recorded_at', { ascending: true });

        return (res.data || []).filter(function(r) {
            return r.category_id && r.is_doubles !== true;
        });
    };

    // ---- Накопление по категории с переносом значения вперёд ----
    // Между турнирами линия держит достигнутое, в день турнира — ступенька вверх
    API.series = function(rows, cats) {
        var dates = [];
        rows.forEach(function(r) { if (dates.indexOf(r.recorded_at) === -1) dates.push(r.recorded_at); });
        dates.sort();

        var byCat = {};
        rows.forEach(function(r) { (byCat[r.category_id] = byCat[r.category_id] || []).push(r); });

        // Сильные категории первыми, как в рейтинге
        var order = Object.keys(byCat).sort(function(a, b) {
            return ((cats[b] && cats[b].sort) || 0) - ((cats[a] && cats[a].sort) || 0);
        });

        var sets = order.map(function(cat) {
            var sum = 0, started = false, debut = -1;
            var values = [], meta = [];
            dates.forEach(function(d, i) {
                var hit = null;
                byCat[cat].forEach(function(r) { if (r.recorded_at === d) hit = r; });
                if (hit) {
                    sum += hit.points_earned || 0;
                    if (!started) debut = i;
                    started = true;
                }
                values.push(started ? sum : null);
                meta.push(hit);
            });
            return { cat: cat, values: values, meta: meta, debut: debut, total: sum };
        });

        return { dates: dates, sets: sets };
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

        var canvas = document.getElementById(opts.canvasId);
        if (!canvas) return false;

        var cats = await API.categories(opts.client, opts.isEn, opts.isKg);
        var series = API.series(rows, cats);
        var top = series.sets.slice().sort(function(a, b) { return b.total - a.total; })[0];

        var wrap = opts.wrapId ? document.getElementById(opts.wrapId) : null;
        if (wrap) wrap.style.display = '';

        var datasets = series.sets.map(function(s) {
            var c = cats[s.cat] || { name: s.cat, color: FALLBACK_COLOR };
            return {
                label: c.name,
                data: s.values,
                _meta: s.meta,
                _total: s.total,
                borderColor: c.color,
                borderWidth: s.cat === opts.homeCategory ? 3 : 2,
                stepped: 'after',
                spanGaps: false,
                fill: s === top ? 'origin' : false,
                backgroundColor: function(ctx) {
                    var area = ctx.chart.chartArea;
                    if (!area) return 'transparent';
                    var g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                    g.addColorStop(0, c.color + '38');
                    g.addColorStop(1, c.color + '00');
                    return g;
                },
                pointBackgroundColor: s.meta.map(function(m) { return m ? c.color : 'transparent'; }),
                pointBorderColor: s.meta.map(function(m, i) { return i === s.debut ? '#0d0d10' : 'transparent'; }),
                pointBorderWidth: s.meta.map(function(m, i) { return i === s.debut ? 3 : 0; }),
                pointRadius: s.meta.map(function(m, i) { return i === s.debut ? 8 : (m ? 4 : 0); }),
                pointHoverRadius: s.meta.map(function(m) { return m ? 7 : 0; })
            };
        });

        new Chart(canvas, {
            type: 'line',
            data: { labels: series.dates, datasets: datasets },
            plugins: [endLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'nearest', intersect: true },
                layout: { padding: { right: 16, top: 8 } },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { color: '#ccc', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20,20,24,0.95)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderWidth: 1,
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#ccc',
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
                        ticks: { color: '#888', maxRotation: 45, font: { size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#888', font: { size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        title: {
                            display: true,
                            text: t(opts, 'Очки по категориям', 'Points by category', 'Категориялар боюнча упайлар'),
                            color: '#888',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });

        if (opts.ntrpCanvasId) renderNtrp(rows, opts);
        return true;
    };

    // ---- NTRP отдельно: своя шкала, на общем поле он терялся среди линий ----
    function renderNtrp(rows, opts) {
        var wrap = opts.ntrpWrapId ? document.getElementById(opts.ntrpWrapId) : null;
        var canvas = document.getElementById(opts.ntrpCanvasId);
        if (!canvas) return;

        var labels = [], values = [];
        rows.forEach(function(r) {
            if (r.ntrp_after == null) return;
            labels.push(r.recorded_at);
            values.push(r.ntrp_after);
        });
        if (values.length === 0) return;

        if (wrap) wrap.style.display = '';
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'NTRP',
                    data: values,
                    borderColor: '#00BFFF',
                    backgroundColor: 'rgba(0,191,255,0.08)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#00BFFF',
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
                        backgroundColor: 'rgba(20,20,24,0.95)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(item) { return 'NTRP: ' + item.parsed.y.toFixed(2); }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#888', maxRotation: 45, font: { size: 11 } }, grid: { display: false } },
                    y: {
                        min: 1.0, max: 7.0,
                        ticks: { color: '#00BFFF', stepSize: 1, font: { size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });
    }
})();
