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
      .select('*, challenger:profiles!challenges_challenger_id_fkey(full_name), challenger_player:players!challenges_challenger_player_id_fkey(name, photo), opponent_player:players!challenges_opponent_player_id_fkey(name, photo), challenger_partner:players!challenges_challenger_partner_id_fkey(name, photo), opponent_partner:players!challenges_opponent_partner_id_fkey(name, photo)')
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
      // Имя и лицо идут парой: на сайте в карточке баттла фотографии
      // игроков, а здесь стояли лаймовые кружки с буквами и читались как
      // мячи, а не как люди
      var side1 = [{
        name: (b.challenger_player && b.challenger_player.name) ||
              b.challenger_external_name ||
              (b.challenger && b.challenger.full_name) || (I18N.t('home.player') + ' 1'),
        photo: (b.challenger_player && b.challenger_player.photo) || ''
      }];
      var side2 = [{
        name: (b.opponent_player && b.opponent_player.name) ||
              b.opponent_external_name || (I18N.t('home.player') + ' 2'),
        photo: (b.opponent_player && b.opponent_player.photo) || ''
      }];
      if (isPair) {
        var p1 = b.challenger_partner, p2 = b.opponent_partner;
        var m1 = (p1 && p1.name) || b.challenger_partner_name;
        var m2 = (p2 && p2.name) || b.opponent_partner_name;
        if (m1) side1.push({ name: m1, photo: (p1 && p1.photo) || '' });
        if (m2) side2.push({ name: m2, photo: (p2 && p2.photo) || '' });
      }
      var fmtLabel = APP.battleFormatLabel(b);

      function fighter(side) {
        var h = '<div class="battle-fighter"><div class="battle-fighter-avatars">';
        side.forEach(function(p) {
          h += p.photo
            ? '<img class="battle-fighter-avatar battle-fighter-photo" src="' + esc(p.photo) + '" alt="">'
            : '<div class="battle-fighter-avatar">' + initials(p.name) + '</div>';
        });
        h += '</div><div class="battle-fighter-name">';
        side.forEach(function(p) { h += '<span>' + esc(p.name) + '</span>'; });
        return h + '</div></div>';
      }

      html += '<div class="battle-card" data-battle-id="' + b.id + '">' +
        '<div class="battle-title">' + esc(b.battle_title || I18N.t('battles.battle')) + '</div>' +
        (fmtLabel ? '<div class="battle-format">' + esc(fmtLabel) + '</div>' : '') +
        '<div class="battle-vs">' +
          fighter(side1) +
          '<span class="battle-vs-text">VS</span>' +
          fighter(side2) +
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
