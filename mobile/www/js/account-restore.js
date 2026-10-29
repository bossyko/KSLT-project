/**
 * Возврат учётной записи, помеченной на удаление.
 *
 * Человек попросил удалить аккаунт, а через неделю передумал и вошёл.
 * Пока не вышли 30 дней, всё на месте — надо только спросить, оставить
 * или довести удаление до конца. На сайте такое окно уже есть; без него
 * в приложении человек видел бы пустой профиль и решил, что данные
 * стёрты.
 */
(function () {
  'use strict';

  var AR = window.KSLT_ACCOUNT_RESTORE = {};
  /* СРОК — В ОБЩЕМ ДОМЕ ПРАВИЛ (шаг A3.7, 29.10): он жил в четырёх
     объявлениях кода. Подробности — в `js/kslt-rules.js`.
     Здесь он больше не объявляется вовсе: единственный зов — расчёт
     даты удаления, и его делает дом. */

  // Кому окно уже показали в этом заходе.
  //
  // Приложение за весь запуск не перезагружается, и простая отметка «уже
  // показывали» переживала выход и повторный вход: сервер честно отвечал
  // «помечен на удаление», а окно молчало, и человек попадал прямо в
  // кабинет. Поэтому помним не «показывали вообще», а кому именно, и
  // забываем при выходе.
  var shownFor = null;

  /** Человек вышел — в следующий раз спросим снова. */
  AR.reset = function () { shownFor = null; };

  function t(key) {
    return window.KSLT_I18N ? window.KSLT_I18N.t(key) : key;
  }

  /** Дата, когда учётная запись исчезнет насовсем. */
  function purgeDate(deletedAt) {
    var d = window.KSLT_RULES.датаУдаления(deletedAt);
    if (!d) return '';
    var lang = (window.KSLT_I18N && window.KSLT_I18N.lang) || 'ru';
    return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU',
      { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /**
   * Показывает окно, если учётная запись помечена на удаление.
   * Зовём после загрузки профиля — отдельного запроса не делаем.
   */
  AR.check = function (profile) {
    if (!profile || !profile.deleted_at) return;
    if (shownFor === profile.id) return;
    shownFor = profile.id;

    var ov = document.createElement('div');
    ov.className = 'ar-overlay';
    ov.innerHTML =
      '<div class="ar-modal">' +
        '<h3 class="ar-modal-title">' + t('restore.title') + '</h3>' +
        '<p class="ar-modal-subtitle">' +
          t('restore.text').replace('{date}', purgeDate(profile.deleted_at)) +
        '</p>' +
        '<button class="pd-challenge-btn" id="arKeep">' + t('restore.keep') + '</button>' +
        '<button class="pd-challenge-btn" id="arLeave" ' +
          'style="background:transparent;color:var(--text-sec);margin-top:10px;">' +
          t('restore.leave') + '</button>' +
      '</div>';
    document.body.appendChild(ov);
    // Через таймер, а не через requestAnimationFrame: в свёрнутом
    // приложении кадры не рисуются, и окно так и осталось бы прозрачным
    setTimeout(function () { ov.classList.add('open'); }, 20);

    document.getElementById('arKeep').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = '...';

      /* ЗОВ ВОЗВРАТА — В ОБЩЕМ ДОМЕ `js/kslt-vozvrat.js`
         (шаг A3.7в, 29.10). Здесь он собирался `fetch`-ом руками: свой
         адрес, свой `Authorization`, свой `apikey`, свой разбор ответа.
         Сайт в том же месте звал `functions.invoke`. Поменяйся формат
         заголовков — приложение замолчало бы, а срок шёл бы своим
         чередом. */
      window.KSLT_VOZVRAT.вернуть(supabaseClient)
      .then(function (data) {
        if (!data.ок) throw new Error(data.беда || 'не вышло');
        if (window.KSLT_AUTH && window.KSLT_AUTH.currentProfile) {
          window.KSLT_AUTH.currentProfile.deleted_at = null;
        }
        close(ov);
        if (window.KSLT_APP) window.KSLT_APP.toast(t('restore.done'));
      })
      .catch(function (err) {
        console.error('Restore account error:', err);
        btn.disabled = false;
        btn.textContent = t('restore.keep');
        if (window.KSLT_APP) window.KSLT_APP.toast(t('restore.fail'));
      });
    });

    // Передумал возвращаться — просто выходим. Метка остаётся, срок идёт
    // своим чередом, удаление доведёт до конца ежедневная уборка
    document.getElementById('arLeave').addEventListener('click', function () {
      close(ov);
      if (window.KSLT_AUTH) window.KSLT_AUTH.logout();
    });
  };

  function close(ov) {
    ov.classList.remove('open');
    setTimeout(function () { ov.remove(); }, 300);
  }
})();
