// ============================================
// KSLT Mobile — Push Notifications (FCM)
// ============================================
(function() {
  'use strict';

  var PUSH = window.KSLT_PUSH = {};

  // Check if Capacitor PushNotifications plugin available
  function getPlugin() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
      return window.Capacitor.Plugins.PushNotifications;
    }
    return null;
  }

  /**
   * ПРИ ЗАПУСКЕ РАЗРЕШЕНИЯ НЕ СПРАШИВАЕМ (Ю10, кусок 230).
   *
   * Было: `init()` звался сразу после входа и перехода на главную, то
   * есть системное окно «разрешить уведомления?» всплывало на первом
   * же экране — человеку, который ещё не понял, что это за приложение.
   * Apple требует спрашивать ПРИ ПЕРВОМ ИСПОЛЬЗОВАНИИ функции, и это же
   * просто вежливее: отказ на запуске необратим без похода в настройки
   * телефона.
   *
   * Стало: при запуске только слушатели и — ЕСЛИ разрешение уже дано —
   * обновление признака устройства. Спрашиваем в `спросить()`, из тех
   * мест, где человек сам пришёл за уведомлениями.
   */
  PUSH.init = function() {
    var plugin = getPlugin();
    if (!plugin) return;

    plugin.checkPermissions().then(function(permResult) {
      if (permResult && permResult.receive === 'granted') plugin.register();
    }).catch(function() {});

    // Registration success — save token
    plugin.addListener('registration', function(token) {
      PUSH.fcmToken = token.value;
      saveFcmToken(token.value);
    });

    // Registration error
    plugin.addListener('registrationError', function(err) {
      console.warn('Push registration error:', err);
    });

    // Received while app is in foreground
    plugin.addListener('pushNotificationReceived', function(notification) {
      if (window.KSLT_APP) {
        window.KSLT_APP.toast(notification.title || notification.body || 'New notification');
      }
      // Refresh unread count
      if (window.KSLT_APP && window.KSLT_APP.checkUnreadNotifications) {
        window.KSLT_APP.checkUnreadNotifications();
      }
    });

    // Tapped notification (app was in background)
    plugin.addListener('pushNotificationActionPerformed', function(action) {
      var data = (action.notification && action.notification.data) || {};

      // Приглашение поиграть — открываем сразу список, а не профиль: человек
      // нажал на уведомление, чтобы ответить, а не чтобы искать, где ответить
      if (data.action_type && data.action_type.indexOf('game_invite') === 0) {
        if (window.KSLT_APP) window.KSLT_APP.switchScreen('profile');
        setTimeout(function() {
          if (window.KSLT_INVITES) window.KSLT_INVITES.openList();
        }, 300);
        return;
      }

      // Счёт матча — открываем сразу окно нужного матча. Без номера открыть
      // было бы нечего, поэтому он и едет в теле push
      if (data.action_type === 'match_score' && data.action_id) {
        if (window.KSLT_MATCH_SCORE) {
          setTimeout(function() { window.KSLT_MATCH_SCORE.open(data.action_id); }, 300);
        } else if (window.KSLT_APP) {
          window.KSLT_APP.switchScreen('profile');
        }
        return;
      }

      if (data.screen && window.KSLT_APP) {
        window.KSLT_APP.switchScreen(data.screen);
      }
    });
  };

  // Save FCM token to profile
  function saveFcmToken(token) {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser || !supabaseClient) return;

    supabaseClient.from('profiles')
      .update({ fcm_token: token })
      .eq('id', AUTH.currentUser.id)
      .then(function() {});
  }

  /**
   * СПРОСИТЬ РАЗРЕШЕНИЕ — ЗОВЁТСЯ ИЗ МЕСТА, КУДА ЧЕЛОВЕК ПРИШЁЛ САМ.
   * Второй раз системное окно не всплывёт: если уже отказали, телефон
   * отдаёт `denied` и спрашивать нечего — ведём в настройки словом, а не
   * окном.
   */
  /* «НЕ СЕЙЧАС» В ЭТОМ ЗАПУСКЕ. Держим в памяти, а не в localStorage:
     отказ от объяснения — не решение навсегда, а «не мешай сейчас».
     Следующий запуск спросит снова, и это честно: системную попытку
     отказ не тратит. */
  var отложено = false;

  function системный(plugin) {
    return plugin.requestPermissions().then(function(permResult) {
      if (permResult && permResult.receive === 'granted') plugin.register();
    });
  }

  /**
   * Спрашивает разрешение на уведомления.
   *
   * У ANDROID ОДНА ПОПЫТКА: нажал «Не разрешать» — системное окно больше
   * не покажется никогда, только настройки телефона. Поэтому сперва своё
   * объяснение своими словами и на своём языке, и лишь по согласию —
   * системное окно. Системное рисует Android: его текст, язык и цвет
   * берутся от СИСТЕМЫ, и перевести его нельзя.
   *
   * `опции.сразу` — для мест, где человек уже сказал, чего хочет: тумблер
   * «Уведомления» в кабинете сам по себе и есть согласие, и объяснять
   * ему то, что он только что нажал, — это спросить дважды.
   */
  PUSH.спросить = function(опции) {
    опции = опции || {};
    var plugin = getPlugin();
    if (!plugin) return;
    plugin.checkPermissions().then(function(permResult) {
      /* Решение уже принято — системное окно не покажется, и своё
         показывать незачем. */
      if (!permResult || permResult.receive !== 'prompt') return;
      if (опции.сразу) return системный(plugin);
      if (отложено) return;
      объяснить(plugin);
    }).catch(function() {});
  };

  /** Своё окно: вопрос, объяснение и две кнопки. */
  function объяснить(plugin) {
    var окно = document.getElementById('pushPrimeOverlay');
    /* Нет разметки — не выдумываем её из кода, просим системное
       напрямую: лучше спросить без объяснения, чем не спросить вовсе. */
    if (!окно) return системный(plugin);

    var да = document.getElementById('pushPrimeYes');
    var нет = document.getElementById('pushPrimeNo');

    function закрыть() { окно.classList.remove('open'); }

    if (!окно.dataset.связан) {
      окно.dataset.связан = '1';
      да.addEventListener('click', function() {
        закрыть();
        системный(plugin).catch(function() {});
      });
      нет.addEventListener('click', function() {
        отложено = true;
        закрыть();
      });
      /* Нажатие по затемнению — тот же отказ: окно поверх экрана
         обязано закрываться мимо него. */
      окно.addEventListener('click', function(e) {
        if (e.target === окно) { отложено = true; закрыть(); }
      });
    }
    окно.classList.add('open');
  }

  // Remove token on logout
  PUSH.clearToken = function() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser || !supabaseClient) return;

    supabaseClient.from('profiles')
      .update({ fcm_token: null })
      .eq('id', AUTH.currentUser.id)
      .then(function() {});
  };

})();
