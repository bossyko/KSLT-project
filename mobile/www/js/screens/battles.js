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
      .select('*, challenger:profiles!challenges_challenger_id_fkey(full_name), challenger_player:players!challenges_challenger_player_id_fkey(name), opponent_player:players!challenges_opponent_player_id_fkey(name)')
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
      var name1 = (b.challenger_player && b.challenger_player.name) || (b.challenger && b.challenger.full_name) || (I18N.t('home.player') + ' 1');
      var name2 = (b.opponent_player && b.opponent_player.name) || (I18N.t('home.player') + ' 2');

      html += '<div class="battle-card" data-battle-id="' + b.id + '">' +
        '<div class="battle-title">' + esc(b.battle_title || I18N.t('battles.battle')) + '</div>' +
        '<div class="battle-vs">' +
          '<div class="battle-fighter">' +
            '<div class="battle-fighter-avatar">' + initials(name1) + '</div>' +
            '<div class="battle-fighter-name">' + esc(name1) + '</div>' +
          '</div>' +
          '<span class="battle-vs-text">VS</span>' +
          '<div class="battle-fighter">' +
            '<div class="battle-fighter-avatar">' + initials(name2) + '</div>' +
            '<div class="battle-fighter-name">' + esc(name2) + '</div>' +
          '</div>' +
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
