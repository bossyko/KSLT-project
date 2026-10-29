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

  /* ДАННЫЕ БЕРЁТ ОБЩИЙ ДОМ (шаг A3.3, 29.10):
     `mobile/www/js/kslt-grafik-dannye.js` — побайтовая копия `js/`.

     ЧТО ЗДЕСЬ СТОЯЛО СВОЁ И ЧЕМ РАСХОДИЛОСЬ С САЙТОМ:
       · `friendly` не выбрасывался — на графике стояла лишняя линия за
         турниры, где очков не дают;
       · порядок категорий считался своей арифметикой по `sort_order`
         вместо правила `KSLT_RULES.поСилеКатегорий` — линии шли в другом
         порядке, чем на сайте;
       · второго ключа сортировки `created_at` не было — оценку NTRP
         можно поменять несколько раз за день, и линия шла зигзагом;
       · `ntrp_after` не запрашивался вовсе.
     Теперь считает один дом, рисует по-прежнему этот файл. */

  API.load = function (playerId) {
    return window.KSLT_GRAFIK_DANNYE.rows(supabaseClient, playerId);
  };

  /* Язык остаётся ЗДЕСЬ: у приложения он через `KSLT_I18N`, у сайта —
     через `KSLT_YAZYK`, и дом в этот спор не влезает. Цвет-заглушка тоже
     здесь: `KSLT_KRASKA` в приложении нет, тема не читается. */
  API.categories = function () {
    return window.KSLT_GRAFIK_DANNYE
      .categories(supabaseClient, function (c) {
        var lang = (window.KSLT_I18N && window.KSLT_I18N.lang) || 'ru';
        return lang === 'kg' ? (c.name_kg || c.name)
             : lang === 'en' ? (c.name_en || c.name)
             : c.name;
      })
      .then(function (map) {
        Object.keys(map).forEach(function (id) {
          if (!map[id].color) map[id].color = FALLBACK_COLOR;
        });
        return map;
      });
  };

  API.series = function (rows, cats) {
    return window.KSLT_GRAFIK_DANNYE.series(rows, cats);
  };

  // ---- Отрисовка ----
  // Возвращает готовую разметку блока или '' — если показывать нечего
  API.svg = function(rows, cats, homeCategory) {
    if (!rows || rows.length === 0) return '';

    var s = API.series(rows, cats);
    var maxV = 0;
    s.sets.forEach(function(set) {
      set.values.forEach(function(v) { if (v > maxV) maxV = v; });
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
      /* Дом отдаёт `values` (числа) и `meta` (строки базы) двумя
         списками одной длины: Chart.js на сайте хочет числа списком,
         этому SVG нужна точка со своей строкой. Ни один вид не навязан
         другому — индекс и есть связь. */
      set.values.forEach(function(v, i) {
        if (v == null) return;
        if (prev === null) {
          d += 'M' + x(i) + ',' + y(v);
        } else {
          d += 'H' + x(i) + 'V' + y(v);
        }
        prev = v;
      });
      if (!d) return;
      svg += '<path class="rc-line' + (set.cat === homeCategory ? ' rc-line-home' : '') +
             '" d="' + d + '" stroke="' + esc(c.color) + '"/>';

      set.values.forEach(function(v, i) {
        var строка = set.meta[i];
        if (!строка || v == null) return;
        var isDebut = i === set.debut;
        svg += '<circle class="rc-dot' + (isDebut ? ' rc-dot-debut' : '') + '" cx="' + x(i) + '" cy="' + y(v) +
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

  /**
   * ГРАФИК ОЦЕНКИ NTRP (шаг A3.3б, 29.10, слово Кости: «если на сайте
   * есть, значит и в приложении надо»).
   *
   * Отбор точек и печать числа — в общем доме; здесь только рисование.
   *
   * ОДНО ИЗМЕРЕНИЕ — ЭТО НЕ ИСТОРИЯ, А ЧИСЛО. Решение взято у сайта
   * (`js/rating-chart.js`): график из единственной точки в углу пустого
   * поля не сообщает ничего, поэтому вместо линии печатается само
   * значение с датой. Разметка своя, РЕШЕНИЕ ОБЩЕЕ — иначе сайт и
   * приложение разошлись бы на том же месте, где уже расходились.
   *
   * ЛИНИЯ ОЦЕНКИ ИДЁТ НАКЛОНОМ, А НЕ СТУПЕНЬКОЙ. У очков ступенька
   * верна: между турнирами счёт держит достигнутое. Оценка же меняется
   * плавно — она не копится, а пересматривается, и ступенька соврала бы
   * про то, что весь месяц оценка стояла, а потом прыгнула.
   */
  API.ntrpSvg = function (rows) {
    var Д = window.KSLT_GRAFIK_DANNYE;
    var точки = Д.ntrpPoints(rows);
    if (точки.length === 0) return '';

    var подпись = window.KSLT_I18N ? window.KSLT_I18N.t('pd.ntrpHistory') : 'Уровень NTRP';

    if (точки.length === 1) {
      return '<div class="rc-ntrp-block">' +
             '<div class="rc-sub-title">' + esc(подпись) + '</div>' +
             '<div class="rc-single">' +
               '<span class="rc-single-value">' + esc(Д.ntrpТекст(точки[0].оценка)) + '</span>' +
               '<span class="rc-single-note">' +
                 esc(window.KSLT_I18N ? window.KSLT_I18N.t('pd.ntrpOnce') : 'одно измерение') +
                 ', ' + esc(shortDate(точки[0].дата)) +
               '</span>' +
             '</div></div>';
    }

    /* Поле оценки НЕ начинается с нуля: шаг между 3.5 и 4.5 на шкале
       от нуля был бы незаметен. Берём запас в четверть балла по краям —
       четверть и есть шаг, которым оценку выставляют. */
    var знач = точки.map(function (п) { return Number(п.оценка); });
    var низ = Math.min.apply(null, знач) - 0.25;
    var верх = Math.max.apply(null, знач) + 0.25;
    if (верх - низ < 0.5) { низ -= 0.25; верх += 0.25; }

    var innerW = W - PAD.left - PAD.right;
    var innerH = H - PAD.top - PAD.bottom;
    var stepX = точки.length > 1 ? innerW / (точки.length - 1) : 0;
    function x(i) { return PAD.left + i * stepX; }
    function y(v) { return PAD.top + innerH - ((v - низ) / (верх - низ)) * innerH; }

    var svg = '<svg class="rc-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"' +
              ' role="img" aria-label="' + esc(подпись + ': ' +
              Д.ntrpТекст(знач[0]) + ' \u2192 ' + Д.ntrpТекст(знач[знач.length - 1]) +
              ', ' + знач.length + ' ' +
              (window.KSLT_I18N ? window.KSLT_I18N.t('pd.ntrpPoints') : 'измерений')) + '">';

    /* Сетка: три линии, подписанные самой оценкой — иначе непонятно,
       насколько шаг велик */
    [0, 0.5, 1].forEach(function (f) {
      var gy = PAD.top + innerH * f;
      var val = верх - (верх - низ) * f;
      svg += '<line class="rc-grid" x1="' + PAD.left + '" y1="' + gy +
             '" x2="' + (W - PAD.right) + '" y2="' + gy + '"/>';
      svg += '<text class="rc-axis" x="4" y="' + (gy + 4) + '">' +
             esc(Д.ntrpТекст(Math.round(val * 4) / 4)) + '</text>';
    });

    var d = '';
    знач.forEach(function (v, i) {
      d += (i === 0 ? 'M' : 'L') + x(i) + ',' + y(v);
    });
    svg += '<path class="rc-line rc-line-ntrp" d="' + d + '"/>';
    знач.forEach(function (v, i) {
      svg += '<circle class="rc-dot" cx="' + x(i) + '" cy="' + y(v) + '" r="3"/>';
    });

    svg += '<text class="rc-axis" x="' + PAD.left + '" y="' + (H - 8) + '">' +
           esc(shortDate(точки[0].дата)) + '</text>';
    svg += '<text class="rc-axis" x="' + (W - PAD.right) + '" y="' + (H - 8) +
           '" text-anchor="end">' + esc(shortDate(точки[точки.length - 1].дата)) + '</text>';
    svg += '</svg>';

    return '<div class="rc-ntrp-block">' +
           '<div class="rc-sub-title">' + esc(подпись) + '</div>' +
           '<div class="rc-wrap">' + svg + '</div></div>';
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
      /* ДВА БЛОКА В ОДНОЙ СЕКЦИИ, а не две секции: очки и оценка — две
         стороны одной истории игрока, и заголовок у них общий. */
      var html = API.svg(res[0], res[1], homeCategory) + API.ntrpSvg(res[0]);
      if (!html) return;
      el.innerHTML = html;
      var section = el.closest('.rc-section');
      if (section) section.style.display = '';
    }).catch(function(e) {
      console.error('Rating chart error:', e);
    });
  };
})();
