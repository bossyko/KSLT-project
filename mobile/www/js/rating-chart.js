/**
 * KSLT mobile — график истории рейтинга: линия на категорию.
 *
 * Рисуем свой SVG, а не тянем Chart.js: ради одного экрана 200 КБ в APK
 * не окупаются, а геометрия здесь простая — ступеньки и точки.
 *
 * Считаем тем же правилом, что и очки (recalc_player_categories): сезонное
 * окно с 1 сентября, одиночные, категория проставлена. Поэтому конец линии
 * совпадает с очками игрока в этой категории.
 */
(function() {
  'use strict';

  var API = window.KSLT_RATING_CHART = {};

  var FALLBACK_COLOR = '#8A8A8F';
  var W = 320, H = 190;                          // система координат SVG
  var PAD = { top: 16, right: 12, bottom: 26, left: 34 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- Данные ----
  API.load = function(playerId) {
    var now = new Date();
    var year = now.getFullYear();
    var oldest = ((now.getMonth() + 1) >= 9 ? year - 1 : year - 2) + '-09-01';

    return supabaseClient.from('rating_history')
      .select('recorded_at, points_earned, tournament_name, category_id, is_doubles')
      .eq('player_id', playerId)
      .gte('recorded_at', oldest)
      .order('recorded_at', { ascending: true })
      .then(function(r) {
        return (r.data || []).filter(function(row) {
          return row.category_id && row.is_doubles !== true;
        });
      });
  };

  API.categories = function() {
    return supabaseClient.from('categories')
      .select('id, name, name_en, name_kg, sort_order, color')
      .then(function(r) {
        // Колонка color появилась вместе с графиком — без неё запрос падает
        if (r.error) return supabaseClient.from('categories').select('id, name, name_en, name_kg, sort_order');
        return r;
      })
      .then(function(r) {
        var lang = (window.KSLT_I18N && window.KSLT_I18N.lang) || 'ru';
        var map = {};
        (r.data || []).forEach(function(c) {
          map[c.id] = {
            name: lang === 'kg' ? (c.name_kg || c.name) : (lang === 'en' ? (c.name_en || c.name) : c.name),
            color: c.color || FALLBACK_COLOR,
            sort: c.sort_order || 0
          };
        });
        return map;
      });
  };

  // ---- Накопление по категории ----
  API.series = function(rows, cats) {
    var dates = [];
    rows.forEach(function(r) { if (dates.indexOf(r.recorded_at) === -1) dates.push(r.recorded_at); });
    dates.sort();

    var byCat = {};
    rows.forEach(function(r) { (byCat[r.category_id] = byCat[r.category_id] || []).push(r); });

    var order = Object.keys(byCat).sort(function(a, b) {
      return ((cats[b] && cats[b].sort) || 0) - ((cats[a] && cats[a].sort) || 0);
    });

    return {
      dates: dates,
      sets: order.map(function(cat) {
        var sum = 0, started = false, debut = -1;
        var points = [];
        dates.forEach(function(d, i) {
          var hit = null;
          byCat[cat].forEach(function(r) { if (r.recorded_at === d) hit = r; });
          if (hit) {
            sum += hit.points_earned || 0;
            if (!started) debut = i;
            started = true;
          }
          points.push({ i: i, value: started ? sum : null, row: hit });
        });
        return { cat: cat, points: points, debut: debut, total: sum };
      })
    };
  };

  // ---- Отрисовка ----
  // Возвращает готовую разметку блока или '' — если показывать нечего
  API.svg = function(rows, cats, homeCategory) {
    if (!rows || rows.length === 0) return '';

    var s = API.series(rows, cats);
    var maxV = 0;
    s.sets.forEach(function(set) {
      set.points.forEach(function(p) { if (p.value > maxV) maxV = p.value; });
    });
    if (maxV <= 0) return '';

    var innerW = W - PAD.left - PAD.right;
    var innerH = H - PAD.top - PAD.bottom;
    var stepX = s.dates.length > 1 ? innerW / (s.dates.length - 1) : 0;

    function x(i) { return PAD.left + (s.dates.length > 1 ? i * stepX : innerW / 2); }
    function y(v) { return PAD.top + innerH - (v / maxV) * innerH; }

    var svg = '<svg class="rc-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">';

    // Сетка и подписи оси
    [0, 0.5, 1].forEach(function(f) {
      var gy = PAD.top + innerH * f;
      var val = Math.round(maxV * (1 - f));
      svg += '<line class="rc-grid" x1="' + PAD.left + '" y1="' + gy + '" x2="' + (W - PAD.right) + '" y2="' + gy + '"/>';
      svg += '<text class="rc-axis" x="' + (PAD.left - 5) + '" y="' + (gy + 3) + '" text-anchor="end">' + val + '</text>';
    });

    // Линии категорий: ступенька — горизонталь до даты турнира, затем вверх
    s.sets.forEach(function(set) {
      var c = cats[set.cat] || { name: set.cat, color: FALLBACK_COLOR };
      var d = '', prev = null;
      set.points.forEach(function(p) {
        if (p.value == null) return;
        if (prev === null) {
          d += 'M' + x(p.i) + ',' + y(p.value);
        } else {
          d += 'H' + x(p.i) + 'V' + y(p.value);
        }
        prev = p.value;
      });
      if (!d) return;
      svg += '<path class="rc-line' + (set.cat === homeCategory ? ' rc-line-home' : '') +
             '" d="' + d + '" stroke="' + esc(c.color) + '"/>';

      set.points.forEach(function(p) {
        if (!p.row || p.value == null) return;
        var isDebut = p.i === set.debut;
        svg += '<circle class="rc-dot' + (isDebut ? ' rc-dot-debut' : '') + '" cx="' + x(p.i) + '" cy="' + y(p.value) +
               '" r="' + (isDebut ? 5 : 3) + '" fill="' + esc(c.color) + '"/>';
      });
    });

    // Крайние даты
    svg += '<text class="rc-axis" x="' + PAD.left + '" y="' + (H - 8) + '">' + esc(shortDate(s.dates[0])) + '</text>';
    if (s.dates.length > 1) {
      svg += '<text class="rc-axis" x="' + (W - PAD.right) + '" y="' + (H - 8) + '" text-anchor="end">' +
             esc(shortDate(s.dates[s.dates.length - 1])) + '</text>';
    }
    svg += '</svg>';

    // Легенда: категория, её цвет и итог — то, чем на сайте служат подписи у линий
    var legend = '<div class="rc-legend">';
    s.sets.forEach(function(set) {
      var c = cats[set.cat] || { name: set.cat, color: FALLBACK_COLOR };
      legend += '<span class="rc-legend-item">' +
        '<span class="rc-legend-dot" style="background:' + esc(c.color) + '"></span>' +
        esc(c.name) + ' · <strong>' + set.total + '</strong></span>';
    });
    legend += '</div>';

    return '<div class="rc-wrap">' + svg + legend + '</div>';
  };

  function shortDate(d) {
    if (!d) return '';
    var p = d.split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0].slice(2) : d;
  }

  // Всё вместе: грузит и вставляет в контейнер. Если показывать нечего —
  // контейнер остаётся пустым и секция не появляется
  API.mount = function(containerId, playerId, homeCategory) {
    var el = document.getElementById(containerId);
    if (!el) return;

    Promise.all([API.load(playerId), API.categories()]).then(function(res) {
      var html = API.svg(res[0], res[1], homeCategory);
      if (!html) return;
      el.innerHTML = html;
      var section = el.closest('.rc-section');
      if (section) section.style.display = '';
    }).catch(function(e) {
      console.error('Rating chart error:', e);
    });
  };
})();
