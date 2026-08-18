// ============================================
// KSLT Mobile — Battles Screen
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var B = window.KSLT_BATTLES = {};
  var allBattles = [];
  var currentFilter = 'active';

  B.load = function() {
    if (!supabaseClient) return;
    var el = document.getElementById('battleList');
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('challenges')
      .select('*, challenger:profiles!challenges_challenger_id_fkey(full_name), challenger_player:players!challenges_challenger_player_id_fkey(name), opponent_player:players!challenges_opponent_player_id_fkey(name), challenger_partner:players!challenges_challenger_partner_id_fkey(name), opponent_partner:players!challenges_opponent_partner_id_fkey(name)')
      .eq('battle_published', true)
      .order('created_at', { ascending: false })
      .then(function(r) {
        allBattles = r.data || [];
        render();
      })
      .catch(function() {
        // If the query fails (columns may not exist), show empty
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">' + I18N.t('battles.title') + '</div><div class="empty-text">' + I18N.t('battles.soon') + '</div></div>';
      });
  };

  B.filter = function(f) {
    currentFilter = f;
    render();
  };

  function render() {
    var el = document.getElementById('battleList');
    var filtered = allBattles.filter(function(b) {
      if (currentFilter === 'active') return !b.voting_closed;
      return !!b.voting_closed;
    });

    if (filtered.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">' + I18N.t('battles.empty') + '</div><div class="empty-text">' +
        (currentFilter === 'active' ? I18N.t('battles.emptyActive') : I18N.t('battles.emptyDone')) + '</div></div>';
      return;
    }

    var html = '';
    filtered.forEach(function(b) {
      // Сторона — один человек или пара. У пары два кружка и два имени:
      // раньше здесь бралось по одному, и половина участников пропадала
      var APP = window.KSLT_APP;
      var isPair = APP.battleIsPair(b);
      var names1 = [(b.challenger_player && b.challenger_player.name) ||
                    b.challenger_external_name ||
                    (b.challenger && b.challenger.full_name) || (I18N.t('home.player') + ' 1')];
      var names2 = [(b.opponent_player && b.opponent_player.name) ||
                    b.opponent_external_name || (I18N.t('home.player') + ' 2')];
      if (isPair) {
        var m1 = (b.challenger_partner && b.challenger_partner.name) || b.challenger_partner_name;
        var m2 = (b.opponent_partner && b.opponent_partner.name) || b.opponent_partner_name;
        if (m1) names1.push(m1);
        if (m2) names2.push(m2);
      }
      var fmtLabel = APP.battleFormatLabel(b);

      function fighter(names) {
        var h = '<div class="battle-fighter"><div class="battle-fighter-avatars">';
        names.forEach(function(n) {
          h += '<div class="battle-fighter-avatar">' + initials(n) + '</div>';
        });
        h += '</div><div class="battle-fighter-name">';
        names.forEach(function(n) { h += '<span>' + esc(n) + '</span>'; });
        return h + '</div></div>';
      }

      html += '<div class="battle-card" data-battle-id="' + b.id + '">' +
        '<div class="battle-title">' + esc(b.battle_title || I18N.t('battles.battle')) + '</div>' +
        (fmtLabel ? '<div class="battle-format">' + esc(fmtLabel) + '</div>' : '') +
        '<div class="battle-vs">' +
          fighter(names1) +
          '<span class="battle-vs-text">VS</span>' +
          fighter(names2) +
        '</div>' +
        '<div class="battle-btn-row">' +
          '<button class="battle-btn primary">' + I18N.t('battles.details') + '</button>' +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;

    // Bind card clicks → open detail
    el.querySelectorAll('.battle-card[data-battle-id]').forEach(function(card) {
      card.addEventListener('click', function() {
        var bid = card.getAttribute('data-battle-id');
        if (bid && window.KSLT_HOME && window.KSLT_HOME.openBattleDetail) {
          window.KSLT_HOME.openBattleDetail(bid);
        }
      });
    });
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

})();
