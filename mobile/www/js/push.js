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
  PUSH.спросить = function() {
    var plugin = getPlugin();
    if (!plugin) return;
    plugin.checkPermissions().then(function(permResult) {
      if (!permResult || permResult.receive !== 'prompt') return permResult;
      return plugin.requestPermissions();
    }).then(function(permResult) {
      if (permResult && permResult.receive === 'granted') plugin.register();
    }).catch(function() {});
  };

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
