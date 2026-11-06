/**
 * ШТОРКА ПРИЛОЖЕНИЯ — ОДИН ДОМ НА ОКНА, КОТОРЫЕ ВЫЕЗЖАЮТ СНИЗУ.
 *
 * ЗАЧЕМ ОН ВЫНЕСЕН СЮДА (06.11). Окно с классом `pd-h2h-modal`
 * собиралось ТРЕМЯ руками — `screens/player-detail.js` дважды и
 * `screens/profile.js` один раз, — и к этому дню они уже разошлись:
 *
 *   · `role="dialog"` и `aria-modal` ставила руками ОДНА из трёх (и это
 *     был дубль: их ставит дом окон `kslt-okno.js` по классу `open`);
 *   · `type="button"` и `aria-label` у кнопки закрытия были у ОДНОЙ;
 *   · заголовок «Head-to-Head» был зашит по-английски, при живом ключе
 *     словаря `pd.h2h` — «Личные встречи».
 *
 * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: беда рождается ровно на шве, и до
 * неё оставался один новый вызов.
 *
 * ЧЕМ ЭТОТ ДОМ ОТЛИЧАЕТСЯ ОТ `kslt-vopros.js`. Вопрос — это выбор из
 * кнопок посреди экрана. Шторка — лист содержимого, выезжающий снизу:
 * счёт личных встреч, причина жалобы, код ваучера. Разные понятия —
 * разные дома; общее у них одно: оснастку обоим ставит `kslt-okno.js`.
 *
 * КЛАСС ОСТАЁТСЯ `pd-h2h-modal` (от «player detail head-to-head»),
 * хотя шторка давно не только про личные встречи. Переименование
 * трогает одежду, список дома окон и три экрана разом — это отдельный
 * кусок, он записан в трекер.
 *
 *   KSLT_SHTORKA.окно({
 *     id:        'pdH2HModal',
 *     заголовок: I18N.t('pd.h2h'),
 *     тело:      '<div class="loading-center">…</div>',
 *     родитель:  document.getElementById('playerOverlay')
 *   })
 */
(function (global) {
  'use strict';

  function I(key) { return global.KSLT_I18N ? global.KSLT_I18N.t(key) : key; }

  function esc(s) {
    if (s === null || s === undefined) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function окно(opts) {
    opts = opts || {};
    var родитель = opts.родитель || document.getElementById('app') || document.body;

    var прежнее = opts.id ? document.getElementById(opts.id) : null;
    /* СНИМАЕМ КЛАСС ПЕРЕД УДАЛЕНИЕМ. Дом окон ведёт стопку открытых и
       чистит её по снятию класса `open`; узел, выдернутый из дерева с
       этим классом, остаётся в стопке навсегда, и Esc потом закрывает
       мёртвое окно. */
    if (прежнее) { прежнее.classList.remove('open'); прежнее.remove(); }

    var узел = document.createElement('div');
    if (opts.id) узел.id = opts.id;
    узел.className = 'pd-h2h-modal';
    /* Роли и подписи здесь нет намеренно: их ставит `kslt-okno.js`
       вместе с уводом фокуса, Tab и Esc. Поставить её ещё и тут значит
       завести диалог внутри диалога — замер 05.11 нашёл ровно это у
       окна-вопроса. */
    узел.innerHTML =
      '<div class="pd-h2h-content"' +
        (opts.ширина ? ' style="max-width:' + opts.ширина + 'px"' : '') + '>' +
        '<div class="pd-h2h-header">' +
          '<button class="pd-h2h-close" type="button" aria-label="' +
            esc(I('common.close')) + '">✕</button>' +
          '<h3>' + esc(opts.заголовок || '') + '</h3>' +
        '</div>' +
        '<div class="pd-h2h-body">' + (opts.тело || '') + '</div>' +
      '</div>';

    родитель.appendChild(узел);

    /* ОТСЧЁТ ПО ЧАСАМ, А НЕ ПО КАДРУ. Здесь стоял
       `requestAnimationFrame`: свёрнутое приложение кадров не рисует, и
       окно так и осталось бы прозрачным. Правило выведено на окне
       возврата учётной записи (`account-restore.js`) и применяется
       здесь без нового разбора. */
    setTimeout(function () { узел.classList.add('open'); }, 20);

    function закрыть() {
      узел.classList.remove('open');
      setTimeout(function () { узел.remove(); }, 300);
    }

    узел.querySelector('.pd-h2h-close').addEventListener('click', закрыть);
    узел.addEventListener('click', function (e) { if (e.target === узел) закрыть(); });
    узел.закрыть = закрыть;
    return узел;
  }

  global.KSLT_SHTORKA = { окно: окно };
})(window);
