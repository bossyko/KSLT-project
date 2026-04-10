// ============================================
// KSLT Mobile — Live Screen
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var L = window.KSLT_LIVE = {};

  L.load = function() {
    var el = document.getElementById('liveList');
    if (!supabaseClient) return;

    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('matches')
      .select('*, tournament:tournaments(name)')
      .eq('status', 'live')
      .order('updated_at', { ascending: false })
      .then(function(r) {
        var matches = r.data || [];
        if (matches.length === 0) {
          el.innerHTML =
            '<div class="empty-state">' +
              '<div class="empty-icon">📺</div>' +
              '<div class="empty-title">' + I18N.t('live.empty') + '</div>' +
              '<div class="empty-text">' + I18N.t('live.emptyText') + '</div>' +
            '</div>';
          return;
        }

        var html = '';
        matches.forEach(function(m) {
          var scores = m.score || {};
          var sets = scores.sets || [];
          var tournamentName = m.tournament ? m.tournament.name : '';

          html += '<div class="live-list-card">' +
            '<div class="live-list-top">' +
              '<span class="live-badge">LIVE</span>' +
              '<span class="live-list-info">' + esc(m.court || '') + (tournamentName ? ' · ' + esc(tournamentName) : '') + '</span>' +
            '</div>' +
            '<div class="live-list-players">' +
              '<div class="live-list-p">' +
                '<div class="live-list-av">' + initials(m.player1_name) + '</div>' +
                '<div class="live-list-pname">' + shortName(m.player1_name) +
                  (scores.serving === 1 ? ' <span class="serving-dot"></span>' : '') +
                '</div>' +
              '</div>' +
              '<div class="live-list-score">' +
                renderSetsCompact(sets) +
                (scores.game ? '<div class="live-list-game">' + scores.game + '</div>' : '') +
              '</div>' +
              '<div class="live-list-p right">' +
                '<div class="live-list-av">' + initials(m.player2_name) + '</div>' +
                '<div class="live-list-pname">' + shortName(m.player2_name) +
                  (scores.serving === 2 ? ' <span class="serving-dot"></span>' : '') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        });
        el.innerHTML = html;
      });
  };

  // Auto-refresh every 30 seconds
  L.startAutoRefresh = function() {
    L._interval = setInterval(function() {
      var screen = document.getElementById('screenLive');
      if (screen && screen.classList.contains('active')) {
        L.load();
      }
    }, 30000);
  };

  L.stopAutoRefresh = function() {
    if (L._interval) clearInterval(L._interval);
  };

  function renderSetsCompact(sets) {
    if (!sets || sets.length === 0) return '<div class="live-list-sets"><span style="font-size:14px;color:var(--text-dim)">VS</span></div>';
    var html = '<div class="live-list-sets">';
    sets.forEach(function(s) {
      var p1lead = (s[0] || 0) > (s[1] || 0);
      var p2lead = (s[1] || 0) > (s[0] || 0);
      html += '<div class="live-list-set">' +
        '<span class="s-top' + (p1lead ? ' leading' : '') + '">' + (s[0] || 0) + '</span>' +
        '<span' + (p2lead ? ' class="leading" style="color:var(--accent)"' : '') + '>' + (s[1] || 0) + '</span>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  function shortName(name) {
    if (!name) return '?';
    var parts = name.split(' ');
    if (parts.length >= 2) {
      return esc(parts[0].charAt(0) + '. ' + parts[parts.length - 1]);
    }
    return esc(name);
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

})();
