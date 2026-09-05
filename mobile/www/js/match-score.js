// ============================================
// Счёт матча в приложении
// ============================================
//
// То же, что на сайте: счёт вписывает один из двоих, второй подтверждает,
// сутки молчания — счёт принимается сам, не согласен — матч уходит
// организатору.
//
// Правило «что делать с этим матчем» и сборка счёта в строку — общие с
// сайтом, они живут в js/kslt-rules.js и сверяются проверкой. Здесь только
// вид: окно в стиле приложения, а не сайта.

(function () {
  'use strict';

  var MS = {};
  window.KSLT_MATCH_SCORE = MS;

  var _pid = null;
  var _uid = null;
  var _ids = null;
  var _loaded = false;
  var _busy = false;

  function I() { return window.KSLT_I18N; }
  function t(ключ, запас) {
    var i = I();
    var v = i ? i.t(ключ) : null;
    return (v && v !== ключ) ? v : запас;
  }

  /** Своя карточка игрока. Берём из уже загруженного профиля. */
  MS.myPlayerId = function () {
    if (_loaded) return _pid;
    var AUTH = window.KSLT_AUTH;
    if (AUTH && AUTH.currentProfile) {
      _pid = AUTH.currentProfile.player_id || null;
      _uid = AUTH.currentProfile.id || null;
      _loaded = true;
    }
    return _pid;
  };

  MS.myUserId = function () { MS.myPlayerId(); return _uid; };

  /**
   * Все карточки, за которые человек отвечает: своя и капитаны тех пар,
   * где он напарник.
   *
   * В парном турнире в записи матча стоит капитан. Без этого списка
   * напарник не увидел бы ни своей пары, ни кнопки.
   */
  MS.loadMyIds = function () {
    var pid = MS.myPlayerId();
    if (!pid) { _ids = []; return Promise.resolve(_ids); }
    if (_ids) return Promise.resolve(_ids);
    _ids = [pid];
    return window.supabaseClient.from('tournament_registrations')
      .select('player_id')
      .eq('partner_id', pid)
      .in('status', ['approved', 'draw'])
      .then(function (r) {
        (r.data || []).forEach(function (x) {
          if (x.player_id && _ids.indexOf(x.player_id) === -1) _ids.push(x.player_id);
        });
        return _ids;
      });
  };

  MS.myIds = function () { return _ids || (MS.myPlayerId() ? [MS.myPlayerId()] : []); };

  MS.stateOf = function (match) {
    var R = window.KSLT_RULES;
    return R ? R.matchScoreState(match, MS.myIds(), MS.myUserId()) : 'none';
  };

  /** Открыть окно по номеру матча. Само решит, вписывать или подтверждать. */
  MS.open = function (matchId, onDone) {
    var client = window.supabaseClient;
    if (!client) return;

    client.from('matches')
      .select('*, tournament:tournaments(title, title_en, title_kg, set_format)')
      .eq('id', matchId).single()
      .then(function (res) {
        if (res.error || !res.data) return;
        var m = res.data;
        var состояние = MS.stateOf(m);
        if (состояние !== 'enter' && состояние !== 'confirm') {
          // Молчать нельзя: человек нажал и ждёт ответа. Чаще всего это
          // пара — напарник успел раньше, и делать уже нечего
          if (состояние === 'done') сказать(t('score.alreadyDone', 'Счёт уже подтверждён'));
          else if (состояние === 'wait') сказать(t('score.alreadySent', 'Счёт уже вписан — ждём соперника'));
          if (typeof onDone === 'function') onDone();
          return;
        }

        var ids = [m.player1_id, m.player2_id].filter(Boolean);
        return client.from('players').select('id, name, name_en, photo').in('id', ids)
          .then(function (pr) {
            var byId = {};
            (pr.data || []).forEach(function (p) { byId[p.id] = p; });
            if (состояние === 'confirm') окноПодтверждения(m, byId, onDone);
            else окноВвода(m, byId, onDone);
          });
      });
  };

  // ---- Ввод ----

  function окноВвода(m, byId, onDone) {
    var trn = m.tournament || {};
    var сетов = (trn.set_format === 'short') ? 2 : 3;

    var шапки = '';
    for (var i = 1; i <= сетов; i++) шапки += '<th>' + t('score.set', 'Сет') + ' ' + i + '</th>';

    function строка(id, номер) {
      var p = byId[id] || {};
      var имя = имяИгрока(p);
      var поля = '';
      for (var i = 1; i <= сетов; i++) {
        поля += '<td class="msa-cell"><input class="msa-in" id="msa' + номер + 's' + i +
                '" inputmode="numeric" maxlength="2"></td>';
      }
      return '<tr><td class="msa-name">' + esc(фамилия(имя)) + '</td>' + поля + '</tr>';
    }

    var тело =
      '<div class="msa-trn">' + esc(имяТурнира(trn)) + '</div>' +
      пара(m, byId) +
      '<div class="msa-when"><span>' + t('score.date', 'Дата матча') + '</span>' +
        '<input type="date" class="msa-date" id="msaDate" value="' + датой(m.played_at) + '"></div>' +
      '<table class="msa-table"><thead><tr><th>' + t('score.player', 'Игрок') + '</th>' + шапки +
      '</tr></thead><tbody>' + строка(m.player1_id, 1) + строка(m.player2_id, 2) + '</tbody></table>' +
      '<div class="msa-hint">' + t('score.hint', 'Впишите геймы в каждом сете. Победителя считаем из счёта.') + '</div>' +
      '<button class="btn-accent msa-send" id="msaSend">' + t('score.send', 'Отправить счёт') + '</button>';

    var окно = оболочка(t('score.title', 'Счёт матча'), тело);
    окно.querySelector('#msaSend').addEventListener('click', function () {
      отправить(m, сетов, окно, onDone);
    });
  }

  function отправить(m, сетов, окно, onDone) {
    if (_busy) return;
    var пары = [];
    for (var i = 1; i <= сетов; i++) пары.push([поле('msa1s' + i), поле('msa2s' + i)]);

    var собран = window.KSLT_RULES.buildScore(пары);
    if (!собран.ok) {
      сказать(t('score.errBad', 'Проверьте счёт: геймы в сете не могут быть равны'));
      return;
    }

    _busy = true;
    var btn = окно.querySelector('#msaSend');
    if (btn) btn.disabled = true;

    window.supabaseClient.rpc('submit_match_score', {
      p_match_id: m.id, p_score: собран.score, p_played_at: поле('msaDate') || null
    }).then(function (res) {
      _busy = false;
      if (btn) btn.disabled = false;
      if (res.error || !res.data || !res.data.ok) {
        сказать(ошибка(res.data && res.data.error));
        return;
      }
      закрыть(окно);
      сказать(t('score.sent', 'Счёт отправлен — ждём соперника'));
      if (typeof onDone === 'function') onDone();
    });
  }

  // ---- Подтверждение ----

  function окноПодтверждения(m, byId, onDone) {
    var trn = m.tournament || {};
    var кто = byId[m.player1_id] || {};

    // Исход крупно: подтверждающий не должен вычислять в уме, где его геймы
    var выиграл = MS.myIds().indexOf(m.winner_id) !== -1;

    var тело =
      '<div class="msa-trn">' + esc(имяТурнира(trn)) + '</div>' +
      пара(m, byId) +
      '<div class="msa-outcome ' + (выиграл ? 'msa-won' : 'msa-lost') + '">' +
        (выиграл ? t('score.youWon', 'Вы выиграли') : t('score.youLost', 'Вы проиграли')) + '</div>' +
      '<div class="msa-score">' + esc(человечно(m.score)) + '</div>' +
      '<div class="msa-hint msa-center">' + esc(имяИгрока(кто)) + ' ' +
        t('score.entered', 'вписал счёт. Всё верно?') + '<br>' +
        t('score.auto', 'Не ответите в течение суток — счёт примется как есть.') + '</div>' +
      '<button class="btn-accent msa-send" id="msaYes">' + t('score.confirm', 'Подтвердить') + '</button>' +
      '<button class="msa-send msa-ghost" id="msaNo">' + t('score.dispute', 'Не согласен') + '</button>';

    var окно = оболочка(t('score.titleConfirm', 'Подтвердите счёт'), тело);

    окно.querySelector('#msaYes').addEventListener('click', function () {
      ответить('confirm_match_score', m.id, t('score.confirmed', 'Счёт подтверждён'), окно, onDone);
    });
    окно.querySelector('#msaNo').addEventListener('click', function () {
      ответить('dispute_match_score', m.id, t('score.disputed', 'Матч ушёл организатору'), окно, onDone);
    });
  }

  function ответить(функция, id, сообщение, окно, onDone) {
    if (_busy) return;
    _busy = true;
    window.supabaseClient.rpc(функция, { p_match_id: id }).then(function (res) {
      _busy = false;
      if (res.error || !res.data || !res.data.ok) {
        сказать(ошибка(res.data && res.data.error));
        return;
      }
      закрыть(окно);
      сказать(сообщение);
      if (typeof onDone === 'function') onDone();
    });
  }

  // ---- Мелочи ----

  function ошибка(код) {
    if (код === 'own_score') return t('score.errOwn', 'Свой счёт подтверждает соперник');
    if (код === 'already_final') return t('score.errFinal', 'Счёт уже окончательный');
    if (код === 'not_a_player') return t('score.errNotPlayer', 'Вы не играете в этом матче');
    if (код === 'no_winner') return t('score.errNoWinner', 'По сетам никто не выиграл');
    return t('score.err', 'Не удалось сохранить счёт');
  }

  function пара(m, byId) {
    var a = byId[m.player1_id] || {}, b = byId[m.player2_id] || {};
    return '<div class="msa-vs">' + лицо(a) + '<b>' + esc(имяИгрока(a)) + '</b>' +
           '<span>VS</span><b>' + esc(имяИгрока(b)) + '</b>' + лицо(b) + '</div>';
  }

  function лицо(p) {
    return p.photo
      ? '<img src="' + esc(p.photo) + '" alt="">'
      : '<i class="msa-noface">' + esc(((p.name || '?')[0] || '?').toUpperCase()) + '</i>';
  }

  function имяТурнира(t) {
    if (!t) return '';
    var i = I();
    var lang = i ? i.lang : 'ru';
    if (lang === 'en') return t.title_en || t.title || '';
    if (lang === 'kg') return t.title_kg || t.title || '';
    return t.title || '';
  }

  function имяИгрока(p) {
    var i = I();
    var en = i && i.lang === 'en';
    return (en ? (p.name_en || p.name) : p.name) || '?';
  }

  function фамилия(имя) {
    var ч = String(имя).trim().split(/\s+/);
    return ч.length > 1 ? ч[ч.length - 1] : ч[0];
  }

  function человечно(счёт) {
    return String(счёт || '').replace(/\//g, ':').replace(/ /g, ', ');
  }

  function датой(когда) {
    var d = когда ? new Date(когда) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var м = ('0' + (d.getMonth() + 1)).slice(-2), дн = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + м + '-' + дн;
  }

  function поле(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function оболочка(заголовок, тело) {
    var старое = document.getElementById('msaOverlay');
    if (старое) старое.remove();

    var o = document.createElement('div');
    o.id = 'msaOverlay';
    o.className = 'msa-overlay';
    o.innerHTML =
      '<div class="msa-sheet">' +
        '<div class="msa-head"><span>' + esc(заголовок) + '</span>' +
          '<button class="msa-close" type="button">&times;</button></div>' +
        '<div class="msa-body">' + тело + '</div>' +
      '</div>';
    document.body.appendChild(o);

    o.querySelector('.msa-close').addEventListener('click', function () { закрыть(o); });
    o.addEventListener('click', function (e) { if (e.target === o) закрыть(o); });

    // Приложение уходит в фон и не рисует кадров: rAF там не срабатывает,
    // поэтому открываем с задержкой, а не по кадру
    setTimeout(function () { o.classList.add('open'); }, 20);
    return o;
  }

  function закрыть(o) { if (o) o.remove(); }

  function сказать(текст) {
    var APP = window.KSLT_APP;
    if (APP && APP.toast) { APP.toast(текст); return; }
    var el = document.createElement('div');
    el.className = 'msa-toast';
    el.textContent = текст;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 3000);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
