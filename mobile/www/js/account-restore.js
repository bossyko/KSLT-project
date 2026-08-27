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
  var GRACE_DAYS = 30;
  var shown = false;

  function t(key) {
    return window.KSLT_I18N ? window.KSLT_I18N.t(key) : key;
  }

  /** Дата, когда учётная запись исчезнет насовсем. */
  function purgeDate(deletedAt) {
    var d = new Date(deletedAt);
    d.setDate(d.getDate() + GRACE_DAYS);
    var lang = (window.KSLT_I18N && window.KSLT_I18N.lang) || 'ru';
    return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU',
      { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /**
   * Показывает окно, если учётная запись помечена на удаление.
   * Зовём после загрузки профиля — отдельного запроса не делаем.
   */
  AR.check = function (profile) {
    if (shown || !profile || !profile.deleted_at) return;
    shown = true;

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

      supabaseClient.auth.getSession().then(function (sess) {
        var token = sess.data.session ? sess.data.session.access_token : '';
        return fetch(SUPABASE_URL + '/functions/v1/delete-account', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'restore' })
        });
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
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
