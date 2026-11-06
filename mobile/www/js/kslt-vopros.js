/**
 * ОКНО-ВОПРОС ПРИЛОЖЕНИЯ — ОДИН ДОМ НА ВСЕ ВОПРОСЫ И СООБЩЕНИЯ.
 *
 * ЗАЧЕМ ОН ВЫНЕСЕН СЮДА (05.11). Окно жило внутри `game-invites.js` под
 * именем `KSLT_INVITES.modal`: имя обещало приглашения, а звали его
 * отовсюду — удаление учётной записи, отказы, подтверждения. ИМЯ,
 * КОТОРОЕ ОБЕЩАЕТ НЕ ТО, ЧТО ДЕЛАЕТ, — ТАКОЙ ЖЕ ВРУЩИЙ ОРГАН, КАК
 * НАДПИСЬ БЕЗ ПРОВЕРКИ: следующий человек ищет окно подтверждения в
 * приглашениях и не находит, а найдя — боится трогать.
 *
 * ЧЕМ ЭТО ВЫЗВАНО. Замер 05.11 нашёл в приложении ТРИ системных окна
 * WebView — `confirm` в профиле и два `alert` в турнирах. Их рисует
 * Android: белые на тёмной теме, без перевода, и они держат экран, пока
 * их не закроют. Правило было записано в самом коде ещё раньше
 * (`js/screens/profile.js`, удаление учётной записи): «Спрашиваем своим
 * окном, а не системным: то выглядит чужим и в приложении способно
 * подвесить экран». Три места его не слышали.
 *
 * ОДЕЖДА ОСТАЁТСЯ ПРЕЖНЕЙ — классы `gi-*` в `css/app.css`. Переименовать
 * их значит тронуть и список дома окон (`kslt-okno.js`), и одежду, и
 * разметку приглашений разом; это отдельный кусок, он записан в трекер.
 * ЗДЕСЬ ПЕРЕЕХАЛ ДОМ, А НЕ ОДЕЖДА.
 *
 * ОСНАСТКУ СТАВИТ НЕ ЭТОТ ФАЙЛ. Роль `dialog`, `aria-modal`, подпись для
 * диктора, увод фокуса, Tab и Esc — работа `kslt-okno.js`, который
 * слушает класс `open`. До 05.11 роль стояла ДВАЖДЫ: дом ставил её на
 * подложку, а разметка — ещё и на коробку. ДВА ОПРЕДЕЛЕНИЯ ОДНОГО
 * ПОНЯТИЯ: диктор читал вложенные диалоги, а подпись была только у
 * одного из них. Здесь роли нет — её ставит дом.
 *
 *   KSLT_VOPROS.окно({
 *     title:   'Обменять баллы',
 *     body:    '<p class="gi-text">Спишется 50 баллов</p>',
 *     actions: [{ label: 'Отмена' },
 *               { label: 'Обменять', primary: true, onClick: function (закрыть) { … } }]
 *   })
 *
 * Без `actions` рисуется одна кнопка «Понятно» — это замена `alert`.
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

  /**
   * Окно приложения выглядит так же, как на сайте: тёмная подложка,
   * лаймовая главная кнопка, второстепенная — прозрачная с рамкой. Выбор
   * в таком окне почти всегда неравный, и одинаковые кнопки заставляют
   * вчитываться.
   */
  function окно(opts) {
    opts = opts || {};
    var старое = document.getElementById('giModal');
    /* СНИМАЕМ КЛАСС ПЕРЕД УДАЛЕНИЕМ, А НЕ ПРОСТО УДАЛЯЕМ. Дом окон ведёт
       стопку открытых и чистит её по снятию класса `open`; узел,
       выдернутый из дерева с этим классом, остаётся в стопке навсегда, и
       Esc потом закрывает мёртвое окно. */
    if (старое) { старое.classList.remove('open'); старое.remove(); }

    var подложка = document.createElement('div');
    подложка.id = 'giModal';
    подложка.className = 'gi-overlay';

    var кнопки = (opts.actions || [{ label: I('common.ok'), primary: true }]).map(function (a, i) {
      return '<button type="button" class="gi-btn' +
             (a.primary ? ' gi-btn-primary' : ' gi-btn-ghost') +
             '" data-act="' + i + '">' + esc(a.label) + '</button>';
    }).join('');

    подложка.innerHTML =
      '<div class="gi-box">' +
        '<div class="gi-title">' + esc(opts.title || '') + '</div>' +
        '<div class="gi-body">' + (opts.body || '') + '</div>' +
        '<div class="gi-actions">' + кнопки + '</div>' +
      '</div>';

    (document.getElementById('app') || document.body).appendChild(подложка);

    /* Свёрнутое приложение кадры не рисует, и requestAnimationFrame может
       не прийти вовсе — окно тогда остаётся невидимым. Отсчёт по часам
       надёжнее. */
    setTimeout(function () { подложка.classList.add('open'); }, 20);

    function закрыть() {
      подложка.classList.remove('open');
      setTimeout(function () { подложка.remove(); }, 250);
    }

    подложка.addEventListener('click', function (e) {
      if (e.target === подложка) { закрыть(); return; }
      var b = e.target.closest('.gi-btn');
      if (!b) return;
      var act = (opts.actions || [])[Number(b.dataset.act)];
      if (act && act.onClick) act.onClick(закрыть);
      else закрыть();
    });

    return { закрыть: закрыть, close: закрыть };
  }

  /**
   * СООБЩЕНИЕ БЕЗ ВЫБОРА — замена `alert`. Отдельное имя, потому что
   * зовущему не нужно знать про `actions`, а одна кнопка «Понятно» здесь
   * не решение места вызова, а свойство самого понятия «сообщение».
   */
  function сказать(заголовок, текст) {
    return окно({
      title: заголовок,
      body: '<p class="gi-text">' + esc(текст || '') + '</p>'
    });
  }

  global.KSLT_VOPROS = { окно: окно, сказать: сказать };
})(window);
