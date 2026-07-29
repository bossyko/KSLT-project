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

  // Request permission and register
  PUSH.init = function() {
    var plugin = getPlugin();
    if (!plugin) return;

    plugin.checkPermissions().then(function(permResult) {
      if (permResult.receive === 'prompt') {
        return plugin.requestPermissions();
      }
      return permResult;
    }).then(function(permResult) {
      if (permResult && permResult.receive !== 'granted') return;
      plugin.register();
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
      var data = action.notification && action.notification.data;
      if (data && data.screen && window.KSLT_APP) {
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
