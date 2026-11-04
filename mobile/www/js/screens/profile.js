// ============================================
// KSLT Mobile — Profile Screen (Mini-Dashboard)
// ============================================
(function() {
  'use strict';

  var P = window.KSLT_PROFILE = {};
  var I18N = window.KSLT_I18N;
  var _profile = null;
  var _player = null;
  var _membership = null;

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  function getMonths() { return I18N.months(); }

  // Матчи играются в Бишкеке, и датой матча должен быть бишкекский день.
  // Телефон в поездке переводил время в свой пояс, и матч, начатый ночью,
  // показывался вчерашним — при том что дата турнира рядом не сдвигалась
  var TZ = 'Asia/Bishkek';

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    var parts = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, day: 'numeric', month: 'numeric', year: 'numeric'
    }).formatToParts(d).forEach(function(x) { parts[x.type] = x.value; });
    return parseInt(parts.day, 10) + ' ' + I18N.month(parseInt(parts.month, 10) - 1) + ' ' + parts.year;
  }

  P.load = function() {
    var el = document.getElementById('profileContent');
    var AUTH = window.KSLT_AUTH;

    if (!AUTH || !AUTH.currentUser) {
      el.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">👤</div>' +
          '<div class="empty-title">' + I18N.t('profile.notAuth') + '</div>' +
          '<div class="empty-text">' + I18N.t('profile.loginText') + '</div>' +
          '<button class="btn-accent" style="margin-top:16px" id="profileLoginBtn">' + I18N.t('profile.login') + '</button>' +
        '</div>';
      var btn = document.getElementById('profileLoginBtn');
      if (btn) {
        btn.addEventListener('click', function() { if (window.KSLT_AUTH) window.KSLT_AUTH.showAuth(); });
      }
      return;
    }

    /* ТРЕТЬЕ СОСТОЯНИЕ ЭКРАНА: ВХОД ЕСТЬ, А ПРОФИЛЯ НЕТ (01.11).
       Его не было вовсе, и кабинет от этого УМИРАЛ ЦЕЛИКОМ. Костя вошёл,
       открыл «Профиль» и увидел пустоту; лог молчал, потому что смотрели
       не туда. DevTools сказал прямо:
         TypeError: Cannot read properties of null (reading 'role')
         at P.load (profile.js:82)
       На :71 и :74 чтение профиля ЗАЩИЩЕНО (`_profile && …`), а на :82
       голое: `_profile.role === 'admin'`. АВТОР ЗНАЛ, ЧТО ПРОФИЛЯ МОЖЕТ
       НЕ БЫТЬ, И ЗАЩИТИЛ ДВА МЕСТА ИЗ ТРЁХ — та же беда, что была в
       `js/auth.js:1934` на сайте, где защитили одно чтение и забыли
       второе.
       ЗАЩИТИТЬ ОДНУ СТРОКУ МАЛО: молча нарисовать «Член клуба» вместо
       настоящей роли значит соврать человеку. Отсутствие профиля при
       живом входе — это СОСТОЯНИЕ, и оно обязано себя назвать. */
    if (!AUTH.currentProfile) {
      el.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">⚠️</div>' +
          '<div class="empty-title">' + I18N.t('profile.noProfileTitle') + '</div>' +
          '<div class="empty-text">' + I18N.t('profile.noProfileText') + '</div>' +
          '<button class="btn-accent" style="margin-top:16px" id="profileRetryBtn">' +
            I18N.t('profile.retry') + '</button>' +
        '</div>';
      var повтор = document.getElementById('profileRetryBtn');
      if (повтор) {
        повтор.addEventListener('click', function () {
          повтор.disabled = true;
          AUTH.loadProfile(AUTH.currentUser.id).then(function () { P.load(); })
            .catch(function () { повтор.disabled = false; });
        });
      }
      return;
    }

    _profile = AUTH.currentProfile;
    _player = _profile && _profile.players ? _profile.players : null;
    var name = (_profile && _profile.full_name) || I18N.t('profile.user');

    var html = '';

    // ---- Hero ----
    html += '<div class="profile-hero">';
    if (_profile && _profile.avatar_url) {
      html += '<div class="profile-avatar"><img src="' + esc(_profile.avatar_url) + '" alt=""></div>';
    } else {
      html += '<div class="profile-avatar">' + initials(name) + '</div>';
    }
    html += '<div class="profile-name">' + esc(name) + '</div>';

    var roleText = '';
    if (_player) {
      var catMap = {'men-tour':'Tour','men-futures':'Futures','men-challenger':'Challenger','men-masters':'Masters','men-promasters':'Pro-Masters','women-tour':'Tour Ж','women-futures':'Futures Ж','women-challenger':'Challenger Ж','women-masters':'Masters Ж','women-promasters':'Pro-Masters Ж'};
      roleText = (catMap[_player.category_id] || I18N.t('profile.player'));
    } else {
      roleText = _profile.role === 'admin' ? I18N.t('profile.admin') : _profile.role === 'manager' ? I18N.t('profile.manager') : I18N.t('profile.member');
    }
    html += '<div class="profile-role">' + esc(roleText) + '</div>';
    html += '</div>';

    // ---- Membership card ----
    html += '<div id="profMembership"></div>';

    // ---- Stats (if player) ----
    if (_player) {
      var totalM = (_player.wins || 0) + (_player.losses || 0);
      /* Процент — из дома правил (шаг A3.1): при нуле игр он даёт
         прочерк, а не «0%». «Играл и не выиграл» и «не играл» — разные
         утверждения, и приложение говорило второе первым. */
      var winRate = window.KSLT_RULES.процентПобедТекст(_player.wins, _player.losses);
      /* Разметку плитки даёт общий дом `js/kslt-plitki.js` (шаг A3.5):
         одно понятие жило под семью семьями имён, и строителей было
         четыре. Здесь остаются только ДАННЫЕ и ПОДПИСИ. */
      var П = window.KSLT_PLITKI;
      html += П.сетка([
        П.плитка(_player.points || 0, I18N.t('profile.points')),
        П.плитка(_player.wins   || 0, I18N.t('profile.wins')),
        П.плитка(_player.losses || 0, I18N.t('profile.losses')),
        П.плитка(winRate,             I18N.t('profile.winRate'))
      ]);

      // Form dots
      var form = _player.form || [];
      if (form.length > 0) {
        html += '<div class="prof-form-row">';
        html += '<span class="prof-form-label">' + I18N.t('profile.formLabel') + '</span>';
        form.slice(-8).forEach(function(f) {
          html += '<span class="pd-form-dot ' + (f === 'W' || f === 'w' ? 'w' : 'l') + '"></span>';
        });
        html += '</div>';
      }

      // Без этой строчки цифры выглядят враньём: в истории матчей
      // одиннадцать игр, а побед и поражений здесь четыре. Дружеские,
      // парные, микст и баттлы в зачёт не идут
      html += '<div class="prof-stats-note">' + I18N.t('match.statsNote') + '</div>';

      /* РАЗБИВКА ПО КАТЕГОРИЯМ (шаг A3.6, 29.10). На сайте этот блок
         есть, в приложении его не было вовсе — слово Кости: «если на
         сайте есть, значит и в приложении надо». Разметку и расчёт
         МЕСТА даёт общий дом `js/kslt-kategorii.js`: разойдись расчёт
         между продуктами, человек увидел бы на сайте «#4», а здесь
         «#6». Блок грузится отдельно, после отрисовки: он спрашивает
         базу дважды и задерживать весь экран ради него незачем. */
      html += '<div id="profCats"></div>';

      html += window.KSLT_APP.pairBlocks(_player, esc);
    }

    // ---- Rating mini-chart (SVG sparkline from form) ----
    if (_player && _player.form && _player.form.length >= 3) {
      var formArr = _player.form;
      var cumPoints = [0];
      for (var fi = 0; fi < formArr.length; fi++) {
        cumPoints.push(cumPoints[fi] + (formArr[fi] === 'W' || formArr[fi] === 'w' ? 1 : -1));
      }
      var minP = Math.min.apply(null, cumPoints);
      var maxP = Math.max.apply(null, cumPoints);
      var range = Math.max(1, maxP - minP);
      var svgW = 280, svgH = 60;
      var points = cumPoints.map(function(v, idx) {
        var x = (idx / (cumPoints.length - 1)) * svgW;
        var y = svgH - ((v - minP) / range) * (svgH - 4) - 2;
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      html += '<div style="padding:0 16px;margin-bottom:8px">';
      html += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">' + I18N.t('profile.formTrend') + '</div>';
      html += '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:60px"><polyline points="' + points + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      html += '</div>';
    }

    // ---- Rating history: линия на категорию ----
    // Секция скрыта, пока график не найдёт записи — он сам её и откроет
    if (_player) {
      html += '<div class="profile-section rc-section" style="display:none;">';
      html += '<div class="profile-section-title">' + I18N.t('pd.ratingHistory') + '</div>';
      html += '<div id="profRatingChart"></div>';
      html += '</div>';
    }

    // ---- Activity ----
    html += '<div class="profile-section">';
    html += '<div class="profile-section-title">' + I18N.t('profile.activity') + '</div>';

    // My Tournaments
    html += profileRow('green',
      '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>',
      I18N.t('profile.myTournaments'), '', '', true, 'profTournamentsRow');

    // My Matches
    if (_player) {
      html += profileRow('blue',
        '<svg viewBox="0 0 24 24"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/></svg>',
        I18N.t('profile.myMatches'), '', '', true, 'profMatchesRow');
    }

    // Мои баттлы. В кабинете на сайте этот раздел есть, в приложении не
    // было: человек отправлял вызов и больше не видел, что с ним стало
    if (_player) {
      html += profileRow('red',
        '<svg viewBox="0 0 24 24"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 3h2v2"/></svg>',
        I18N.t('profile.myBattles'), '', '', true, 'profBattlesRow');
    }

    // Приглашения поиграть — свой раздел, а не вперемешку с вызовами:
    // баттл зовёт на поединок, приглашение ищет, с кем выйти на корт
    html += profileRow('cyan',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20M2 12h20"/></svg>',
      I18N.t('inv.title'), '', '', true, 'profInvitesRow');

    // Badges
    html += profileRow('purple',
      '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      I18N.t('profile.achievements'), '', '', true, 'profBadgesRow');

    // Loyalty
    html += profileRow('yellow',
      '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      I18N.t('profile.loyalty'), I18N.t('profile.loyaltySub'), '', true, 'profLoyaltyRow');

    // Vouchers
    html += profileRow('cyan',
      '<svg viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 000 4h4v-4h-4z"/></svg>',
      I18N.t('profile.vouchers'), I18N.t('profile.vouchersSub'), '', true, 'profVouchersRow');

    // Payments
    html += profileRow('orange',
      '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>',
      I18N.t('profile.payments'), '', '', true, 'profPaymentsRow');
    html += '</div>';

    // ---- Settings ----
    html += '<div class="profile-section">';
    html += '<div class="profile-section-title">' + I18N.t('profile.settings') + '</div>';

    /* ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ЗДЕСЬ НЕ РИСУЕТСЯ: он живёт в боковом меню
       (`index.html` #menuThemeControl, обвязка `js/app.js:296`).
       ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ — беда рождалась ровно на шве:
       обе подсветки снимаются ОДИН раз (меню — в `initMenuControls`
       при старте, кабинет — при первой отрисовке, дальше экран лежит
       в `loadedScreens`), поэтому переключение в одном месте оставляло
       другое показывать прежнее. Слово Кости 02.11: «убрать, у нас есть
       оно в боковом окне меню». */

    // Language switcher
    /* РЯД ЯЗЫКА НЕ РИСУЕТСЯ ВОВСЕ, пока язык заперт (слово Кости 29.10).
       Не `display: none`: скрытый ряд всё равно читает диктор и ловит
       Tab, то есть переключатель остаётся для того, кто ходит клавишами
       и слушает, — а именно его убрать и просили.
       Выключатель живёт в `js/i18n.js` (`I18N.ОДИН_ЯЗЫК`), здесь только
       его чтение: одно определение на одно понятие. */
    if (!I18N.ОДИН_ЯЗЫК) {
      var currentLang = I18N.lang;
      html += '<div class="profile-row">';
      html += '<div class="profile-row-icon blue"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div>';
      html += '<div class="profile-row-text"><div class="profile-row-label">' + I18N.t('profile.language') + '</div></div>';
      html += '<div class="seg-control" id="langControl">';
      html += '<button class="seg-btn' + (currentLang === 'ru' ? ' active' : '') + '" data-lang="ru">РУ</button>';
      html += '<button class="seg-btn' + (currentLang === 'en' ? ' active' : '') + '" data-lang="en">EN</button>';
      html += '<button class="seg-btn' + (currentLang === 'kg' ? ' active' : '') + '" data-lang="kg">KG</button>';
      html += '</div></div>';
    }

    html += profileRow('orange',
      '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      I18N.t('profile.editProfile'), '', '', true, 'profEditRow');
    html += profileRow('blue',
      '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>',
      I18N.t('profile.notifications'), '', '', true, 'profNotifyRow');
    html += profileRow('red',
      '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      I18N.t('profile.changePass'), '', '', true, 'profPasswordRow');

    // Telegram connect
    var tgLinked = _profile && _profile.telegram_id;
    html += profileRow(tgLinked ? 'green' : 'blue',
      '<svg viewBox="0 0 24 24"><path d="M21.2 4.4L2.4 11.4c-.5.2-.5.8 0 1l4.8 1.8 1.8 5.8c.1.4.6.5.9.3l2.7-2.2 4.8 3.5c.4.3 1 .1 1.1-.4l3.3-15c.1-.6-.4-1-.6-.8z"/></svg>',
      I18N.t('profile.telegram'), tgLinked ? I18N.t('profile.tgLinked') : I18N.t('profile.tgLink'), '', true, 'profTelegramRow');

    /* ЗАБЛОКИРОВАННЫЕ — НАСТРОЙКА ОБЩЕНИЯ, А НЕ ОПАСНОЕ ДЕЙСТВИЕ,
       поэтому ряд стоит ДО «Удалить аккаунт» и покрашен нейтрально.
       Без этого экрана блокировка была бы дорогой в один конец:
       нажал — и снять негде. */
    html += profileRow('blue',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M4.9 4.9l14.2 14.2"/></svg>',
      I18N.t('blk.listTitle'), '', '', true, 'profBlockedRow');

    // Delete account
    html += profileRow('red',
      '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
      I18N.t('profile.deleteAccount'), '', '', true, 'profDeleteRow');
    html += '</div>';

    // ---- Logout ----
    html += '<div class="profile-section">';
    html += '<div class="profile-row" id="logoutRow" style="cursor:pointer">' +
      '<div class="profile-row-icon red"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg></div>' +
      '<div class="profile-row-text"><div class="profile-row-label">' + I18N.t('profile.logout') + '</div></div>' +
      '<span class="profile-row-arrow">›</span>' +
    '</div>';
    html += '</div>';

    html += '<div style="height:16px"></div>';

    el.innerHTML = html;

    if (_player && window.KSLT_RATING_CHART) {
      window.KSLT_RATING_CHART.mount('profRatingChart', _player.id, _player.category_id);
    }

    // Bind events
    bindLogout();
    loadMembership();
    loadCategories();
    bindRowOverlays();
    loadLoyaltyBalance();
    bindLangControl();
    /* Один обработчик на все пикеры страны; защищён от повторного зова
       изнутри (`P._pickersReady`), поэтому звать можно при каждой
       отрисовке кабинета. */
    if (window.KSLT_PHONE && KSLT_PHONE.initPickers) KSLT_PHONE.initPickers();
  };

  // ---- Membership card ----
  /**
   * РАЗБИВКА ПО КАТЕГОРИЯМ. Данные и разметка — общий дом
   * `js/kslt-kategorii.js` (шаг A3.6, 29.10). Здесь только слова:
   * словарь у приложения свой, правило склонения — из дома языка.
   *
   * Пусто — блок не появляется вовсе: у игрока без категорий показывать
   * нечего, а пустая карточка с заголовком занимает место и ничего не
   * говорит.
   */
  function loadCategories() {
    var el = document.getElementById('profCats');
    if (!el || !_player || !window.KSLT_KATEGORII) return;

    var K = window.KSLT_KATEGORII;
    K.строки(supabaseClient, _player).then(function (строки) {
      if (!строки.length) return;

      return supabaseClient.from('categories')
        .select('id, name, name_en, name_kg, color')
        .then(function (r) {
          var имена = {}, цвета = {};
          (r.data || []).forEach(function (c) {
            имена[c.id] = window.KSLT_I18N
              ? window.KSLT_I18N.поле(c, 'name') : c.name;
            цвета[c.id] = c.color || null;
          });

          var победы = I18N.формы('cats.wins');
          var поражения = I18N.формы('cats.losses');

          el.innerHTML =
            '<div class="profile-section-title">' + esc(I18N.t('cats.title')) + '</div>' +
            K.все(строки, {
              имена: имена,
              цвета: цвета,
              счёт: window.KSLT_YAZYK ? window.KSLT_YAZYK.счёт : null,
              слова: {
                очки: I18N.t('profile.points'),
                победыКратко: I18N.t('profile.wins'),
                поражКратко: I18N.t('profile.losses'),
                место: I18N.t('cats.place'),
                домашняя: I18N.t('cats.home'),
                закрыта: I18N.t('cats.closed'),
                процент: I18N.t('cats.winRate'),
                всего: I18N.t('cats.total'),
                нетМатчей: I18N.t('cats.noMatches'),
                победа: победы[0], победы: победы[1], побед: победы[2],
                поражение: поражения[0], поражения: поражения[1],
                поражений: поражения[2]
              }
            });
        });
    }).catch(function (e) {
      console.error('[KSLT] разбивка по категориям:', e);
    });
  }

  function loadMembership() {
    var container = document.getElementById('profMembership');
    if (!container) return;

    var AUTH = window.KSLT_AUTH;
    if (!AUTH) return;

    AUTH.checkMembership().then(function(mem) {
      _membership = mem;
      AUTH._membershipStatus = !!mem;

      if (!mem) {
        container.innerHTML = '<div class="prof-membership none" id="profMemNone" style="cursor:pointer">' +
          '<div class="prof-mem-icon">📋</div>' +
          '<div class="prof-mem-info"><div class="prof-mem-status">' + I18N.t('profile.noMembership') + '</div><div class="prof-mem-sub">' + I18N.t('profile.getMembership') + '</div></div>' +
          '<span class="profile-row-arrow">›</span>' +
        '</div>';
        var memNoneBtn = document.getElementById('profMemNone');
        if (memNoneBtn) {
          memNoneBtn.addEventListener('click', function() {
            if (window.KSLT_INFO && window.KSLT_INFO.showPricing) window.KSLT_INFO.showPricing();
          });
        }
        return;
      }

      var endDate = new Date(mem.end_date);
      var now = new Date();
      var daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      /* УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ (01.11).
         Здесь стояло `pct = 100`, и при истёкшем членстве без `start_date`
         полоса рисовалась ПОЛНОЙ: орган говорил «всё цело» над надписью
         «Истекло». Нечего считать — полосы нет вовсе, и это честнее
         выдуманной сотни. */
      var pct = null;
      if (mem.start_date) {
        var startDate = new Date(mem.start_date);
        var total = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
        var elapsed = Math.max(0, (now - startDate) / (1000 * 60 * 60 * 24));
        pct = Math.max(0, Math.min(100, Math.round((1 - elapsed / total) * 100)));
      }

      var statusClass = daysLeft > 30 ? 'active' : (daysLeft > 0 ? 'expiring' : 'expired');
      var statusText = daysLeft > 0 ? I18N.t('profile.memActive') : I18N.t('profile.memExpired');
      var subText = daysLeft > 0 ? I18N.t('profile.memDaysLeft') + ' ' + daysLeft + ' ' + I18N.t('profile.daysShort') : I18N.t('profile.memRenew');

      /* ЗНАЧОК ГОВОРИТ ТО ЖЕ, ЧТО НАДПИСЬ. Здесь был зашит один `✅` на
         ВСЕ ТРИ состояния: зелёная галочка успеха стояла и над «Истекло».
         ОРГАН, ГОВОРЯЩИЙ НЕ ТО, ЧТО НАДПИСЬ, ХУЖЕ ОТСУТСТВУЮЩЕГО ОРГАНА —
         человек верит картинке быстрее, чем тексту. */
      var значок = statusClass === 'active' ? '✅'
                 : statusClass === 'expiring' ? '⏳' : '⚠️';

      /* ПОЛОСА ПОКАЗЫВАЕТ ОСТАТОК, А У ИСТЁКШЕГО ОСТАТКА НЕТ. Рисовать её
         нулём тоже незачем: пустой жёлоб ничего не сообщает, а место
         занимает. Заодно карточка становится ниже на 16 — ровно столько
         весит полоса со своим отступом (8 + 8), о чём Костя и сказал
         глазами: «слишком большой получился». */
      var полоса = (pct === null || statusClass === 'expired') ? ''
        : '<div class="prof-mem-bar"><div class="prof-mem-bar-fill" style="width:' + pct + '%"></div></div>';

      container.innerHTML = '<div class="prof-membership ' + statusClass + '">' +
        '<div class="prof-mem-icon">' + значок + '</div>' +
        '<div class="prof-mem-info">' +
          '<div class="prof-mem-status">' + statusText + '</div>' +
          '<div class="prof-mem-sub">' + subText + '</div>' +
          полоса +
        '</div>' +
      '</div>';
    });
  }

  // ---- Loyalty balance ----
  function loadLoyaltyBalance() {
    var row = document.getElementById('profLoyaltyRow');
    if (!row || !_profile) return;

    supabaseClient.rpc('get_loyalty_balance', { p_profile_id: _profile.id })
      .then(function(r) {
        var balance = (r.data !== null && r.data !== undefined) ? r.data : 0;
        var valEl = row.querySelector('.profile-row-value');
        if (valEl) valEl.textContent = balance;
      })
      .catch(function() {});
  }

  // ---- Row overlay navigation ----
  function bindRowOverlays() {
    bindRowClick('profTournamentsRow', showMyTournaments);
    bindRowClick('profMatchesRow', showMyMatches);
    bindRowClick('profBattlesRow', showMyBattles);
    bindRowClick('profInvitesRow', function() {
      if (window.KSLT_INVITES) window.KSLT_INVITES.openList();
    });
    bindRowClick('profBadgesRow', showBadges);
    bindRowClick('profLoyaltyRow', showLoyalty);
    bindRowClick('profVouchersRow', showVouchers);
    bindRowClick('profPaymentsRow', showPayments);
    bindRowClick('profEditRow', showEditProfile);
    bindRowClick('profNotifyRow', showNotifications);
    bindRowClick('profPasswordRow', showPasswordChange);
    bindRowClick('profTelegramRow', showTelegramConnect);
    bindRowClick('profDocsRow', showDocuments);
    bindRowClick('profBlockedRow', showBlocked);
    bindRowClick('profDeleteRow', showDeleteAccount);
  }

  function bindRowClick(id, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  // ---- Sub-overlay helper ----
  /** Закрывает окно так же, как кнопка «Назад» — с тем же затуханием. */
  function closeSubOverlay(overlay) {
    var ov = overlay || document.getElementById('profSubOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    setTimeout(function() { ov.remove(); }, 300);
  }

  function openSubOverlay(title, contentHtml) {
    var existing = document.getElementById('profSubOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'profSubOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML =
      '<div class="td-topbar">' +
        '<button class="td-back" id="profSubBack">' +
          '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          I18N.t('common.back') +
        '</button>' +
        '<span class="td-topbar-title">' + esc(title) + '</span>' +
        '<span style="width:60px"></span>' +
      '</div>' +
      '<div class="prof-sub-content" style="padding:16px">' + contentHtml + '</div>';

    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    /* ЧАСТЬ ОКНА ИЩЕТСЯ В САМОМ ОКНЕ (02.11). `getElementById`
       отдаёт первый подходящий узел ДОКУМЕНТА: пока окно одно,
       ответы совпадают, и беда ждёт второго — а второе бывает,
       пока старое ещё висит в доме после закрытия. */
    overlay.querySelector('#profSubBack').addEventListener('click', function() {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    });

    return overlay;
  }

  /**
   * Мои баттлы: вызовы, которые я отправил или получил.
   *
   * Берём той же функцией, что и кабинет на сайте, — иначе состояния
   * разойдутся, как уже расходились категории и фильтры.
   */
  function showMyBattles() {
    var ov = openSubOverlay(I18N.t('profile.myBattles'),
      '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.rpc('get_my_challenges').then(function(r) {
      var list = r.data || [];
      if (r.error || !list.length) {
        content.innerHTML = '<div class="empty-state">' +
          '<div class="empty-icon">\uD83D\uDD25</div>' +
          '<div class="empty-title">' + I18N.t('profile.noBattles') + '</div>' +
          '<div class="empty-text">' + I18N.t('profile.noBattlesText') + '</div>' +
        '</div>';
        return;
      }

      // Состояния теми же словами, что в кабинете
      var STATUS = {
        cancelled:   ['profile.chalCancelled', 'declined'],
        active:      ['profile.chalActive',    'pending'],
        negotiating: ['profile.chalNegotiating','pending'],
        countered:   ['profile.chalCountered', 'pending'],
        accepted:    ['profile.chalAccepted',  'accepted'],
        declined:    ['profile.chalDeclined',  'declined'],
        expired:     ['profile.chalExpired',   'declined'],
        completed:   ['profile.chalCompleted', 'accepted']
      };

      content.innerHTML = list.map(function(ch) {
        var isSent = ch.direction === 'sent';
        var who = (isSent ? ch.opponent_name : ch.challenger_name) || '\u2014';
        var photo = isSent ? ch.opponent_avatar : ch.challenger_avatar;
        var st = STATUS[ch.status] || ['profile.chalActive', 'pending'];

        var d = ch.created_at ? String(ch.created_at) : '';
        var when = d ? d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(2, 4) : '';

        return '<div class="gi-card" data-battle="' + esc(ch.id) + '">' +
          '<div class="gi-card-head">' +
            (photo
              ? '<img class="gi-card-avatar" src="' + esc(photo) + '" alt="">'
              : '<div class="gi-card-avatar gi-card-avatar--letters">' + esc(initials(who)) + '</div>') +
            '<div class="gi-card-who">' +
              '<div class="gi-card-name"><span class="gi-card-name-text">' + esc(who) + '</span>' +
                '<span class="gi-card-dir">' + (isSent ? '\u2197' : '\u2199') + '</span></div>' +
              '<div class="gi-card-date">' + when + '</div>' +
            '</div>' +
            '<span class="gi-status gi-status--' + st[1] + '">' + I18N.t(st[0]) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      // Открываем сам баттл — тем же окном, что и с главной
      content.addEventListener('click', function(e) {
        var card = e.target.closest('[data-battle]');
        if (!card) return;
        if (window.KSLT_HOME && window.KSLT_HOME.openBattleDetail) {
          window.KSLT_HOME.openBattleDetail(card.getAttribute('data-battle'));
        }
      });
    });
  }

  // ---- My Tournaments ----
  function showMyTournaments() {
    var ov = openSubOverlay(I18N.t('profile.myTournaments'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    // Заявки привязаны к карточке игрока: у профиля без player_id их нет.
    // Раньше здесь был запрос по несуществующей колонке profile_id, а сортировка
    // шла по created_at, которой в таблице тоже нет — список всегда был пустым.
    if (!_player) {
      renderTournamentsList(content, []);
      return;
    }

    // В парном турнире заявка одна на пару: капитан в player_id, напарник
    // отдельным полем. Напарник своих парных турниров не видел вовсе
    var FIELDS = '*, tournament:tournaments(id, title, date_start, status)';
    Promise.all([
      supabaseClient.from('tournament_registrations').select(FIELDS)
        .eq('player_id', _player.id).order('registered_at', { ascending: false }),
      supabaseClient.from('tournament_registrations').select(FIELDS)
        .eq('partner_id', _player.id).order('registered_at', { ascending: false })
    ]).then(function(rs) {
      if (rs[0].error) console.error('My tournaments load error:', rs[0].error);
      var seen = {};
      var all = (rs[0].data || []).concat(rs[1].data || []).filter(function(r) {
        var id = r.tournament && r.tournament.id;
        if (!id || seen[id]) return false;
        seen[id] = true;
        return true;
      });
      renderTournamentsList(content, all);
    });
  }

  function renderTournamentsList(container, regs) {
    if (!regs || regs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-title">' + I18N.t('profile.noTournamentsTitle') + '</div><div class="empty-text">' + I18N.t('profile.noTournaments') + '</div></div>';
      return;
    }
    // Предстоящее и сыгранное — разные вещи: с первым игрок что-то делает,
    // второе просто листает
    var upcoming = [], played = [];
    regs.forEach(function(reg) {
      if (!reg.tournament) return;
      (isUpcoming(reg) ? upcoming : played).push(reg);
    });

    var html = '';
    if (upcoming.length) html += '<div class="prof-group-title">' + I18N.t('reg.upcoming') + '</div>' + upcoming.map(tournamentRow).join('');
    if (played.length) html += '<div class="prof-group-title">' + I18N.t('reg.played') + '</div>' + played.map(tournamentRow).join('');
    container.innerHTML = html;
    bindWithdraw(container);
    bindReenter(container);
    return;

    function unusedRow(reg) {
      var t = reg.tournament;
      var withdrawn = reg.status === 'withdrawn';
      var statusClass = withdrawn ? 'withdrawn' : (t.status === 'completed' ? 'completed' : 'upcoming');
      var statusText = withdrawn
        ? I18N.t('reg.withdrawn')
        : (t.status === 'completed' ? I18N.t('profile.tCompleted') : (t.status === 'live' ? I18N.t('profile.tLive') : I18N.t('profile.tUpcoming')));
      html += '<div class="pd-tournament' + (withdrawn ? ' pd-tournament-withdrawn' : '') + '">';
      html += '<div class="pd-tournament-date">' + formatDate(t.date_start) + '</div>';
      html += '<div class="pd-tournament-name">' + esc(t.title) + '</div>';
      html += '<div class="pd-tournament-status ' + statusClass + '">' + statusText + '</div>';
      if (canWithdraw(reg)) {
        html += '<button class="pd-withdraw-btn" data-reg="' + reg.id + '">' + I18N.t('reg.withdraw') + '</button>';
      }
      html += '</div>';
    }
  }

  // Турнир ещё впереди, пока не сыгран
  function isUpcoming(reg) {
    var st = reg.tournament && reg.tournament.status;
    return st === 'registration_open' || st === 'registration_closed' || st === 'upcoming';
  }

  // Записаться снова можно, пока регистрация открыта. Сама запись — на экране
  // турнира, там все проверки допуска
  function canReenter(reg) {
    return reg.status === 'withdrawn'
      && reg.tournament && reg.tournament.status === 'registration_open';
  }

  function tournamentRow(reg) {
    var t = reg.tournament;
    var withdrawn = reg.status === 'withdrawn';
    var statusClass = withdrawn ? 'withdrawn' : (t.status === 'completed' ? 'completed' : 'upcoming');
    var statusText = withdrawn
      ? I18N.t('reg.withdrawn')
      : (t.status === 'completed' ? I18N.t('profile.tCompleted') : (t.status === 'live' ? I18N.t('profile.tLive') : I18N.t('profile.tUpcoming')));

    var html = '<div class="pd-tournament' + (withdrawn ? ' pd-tournament-withdrawn' : '') + '">';
    html += '<div class="pd-tournament-date">' + formatDate(t.date_start) + '</div>';
    html += '<div class="pd-tournament-name">' + esc(t.title) + '</div>';
    html += '<div class="pd-tournament-status ' + statusClass + '">' + statusText + '</div>';
    if (canWithdraw(reg)) {
      html += '<button class="pd-withdraw-btn" data-reg="' + reg.id + '">' + I18N.t('reg.withdraw') + '</button>';
    } else if (canReenter(reg)) {
      html += '<button class="pd-withdraw-btn pd-reenter-btn" data-tid="' + esc(t.id) + '">' + I18N.t('reg.again') + '</button>';
    }
    html += '</div>';
    return html;
  }

  // «Записаться снова» — подаём заявку прямо отсюда. Решение о допуске
  // принимает Edge Function, так что гонять игрока на экран турнира незачем
  function bindReenter(container) {
    container.querySelectorAll('.pd-reenter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (!window.KSLT_REG) return;
        var wasLabel = btn.textContent;
        btn.disabled = true;
        btn.textContent = I18N.t('trn.registering');

        window.KSLT_REG.submit(btn.getAttribute('data-tid')).then(function(info) {
          if (info && info.created) {
            showMyTournaments();
          } else {
            btn.disabled = false;
            btn.textContent = wasLabel;
          }
        });
      });
    });
  }

  // ---- Снятие заявки ----
  // Снять можно, пока не проведена жеребьёвка: после неё игрок уже в сетке
  // и его снимает организатор. Правило «за 3 часа» и штраф — отдельная задача
  function canWithdraw(reg) {
    if (!reg || !reg.tournament) return false;
    if (['approved', 'pending', 'waitlist'].indexOf(reg.status) === -1) return false;
    if (reg.draw_position != null || reg.group_number != null) return false;
    // Статусы турнира до начала игры — те же, что на сайте
    var st = reg.tournament.status;
    return st === 'registration_open' || st === 'registration_closed' || st === 'upcoming';
  }

  function bindWithdraw(container) {
    container.querySelectorAll('.pd-withdraw-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        askWithdraw(btn.getAttribute('data-reg'));
      });
    });
  }

  function askWithdraw(regId) {
    var ov = document.createElement('div');
    ov.className = 'rc-confirm';
    ov.innerHTML =
      '<div class="rc-confirm-box">' +
        '<div class="rc-confirm-title">' + I18N.t('reg.withdrawAsk') + '</div>' +
        '<div class="rc-confirm-actions">' +
          '<button class="rc-confirm-no">' + I18N.t('reg.withdrawNo') + '</button>' +
          '<button class="rc-confirm-yes">' + I18N.t('reg.withdrawYes') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function close() { ov.remove(); }
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    ov.querySelector('.rc-confirm-no').addEventListener('click', close);

    ov.querySelector('.rc-confirm-yes').addEventListener('click', function() {
      var yes = this;
      yes.disabled = true;
      supabaseClient.from('tournament_registrations')
        .update({ status: 'withdrawn' })
        .eq('id', regId)
        .then(function(res) {
          close();
          if (res.error) {
            if (window.KSLT_APP) window.KSLT_APP.toast(res.error.message || I18N.t('reg.withdrawError'));
            return;
          }
          if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('reg.withdrawDone'));
          showMyTournaments();
        });
    });
  }

  // ---- My Matches ----
  /**
   * Матчи, ждущие ответа.
   *
   * Полоса над списком сыгранного. Пусто — полосы нет вовсе: пустая рамка
   * ради пустоты занимает место и ничего не говорит.
   */
  function показатьДела(content) {
    var MS = window.KSLT_MATCH_SCORE;
    if (!MS || !_player) return;

    MS.loadMyIds().then(function (мои) {
    supabaseClient.from('matches')
      .select('id, player1_id, player2_id, winner_id, score, score_status, score_submitted_by, played_at, ' +
              'tournament:tournaments(title, title_en, title_kg)')
      .or('player1_id.in.(' + мои.join(',') + '),player2_id.in.(' + мои.join(',') + ')')
      .or('winner_id.is.null,score_status.eq.pending')
      .then(function (r) {
        var дела = (r.data || []).map(function (m) {
          return { m: m, что: MS.stateOf(m) };
        }).filter(function (x) {
          return x.что === 'enter' || x.что === 'confirm' || x.что === 'wait';
        });
        if (!дела.length) return;

        var ids = [];
        дела.forEach(function (x) {
          [x.m.player1_id, x.m.player2_id].forEach(function (id) {
            if (id && мои.indexOf(id) === -1 && ids.indexOf(id) === -1) ids.push(id);
          });
        });

        supabaseClient.from('players_public').select('id, name, photo').in('id', ids).then(function (pr) {
          var byId = {};
          (pr.data || []).forEach(function (p) { byId[p.id] = p; });

          var html = '<div class="msa-todo"><div class="msa-todo-title">' +
                     I18N.t('score.todo') + '</div>';
          дела.forEach(function (x) {
            var m = x.m;
            var чужой = мои.indexOf(m.player1_id) !== -1 ? m.player2_id : m.player1_id;
            var соперник = byId[чужой] || {};
            var действие = x.что === 'wait'
              ? '<span class="msa-todo-wait">' + I18N.t('score.waiting') + '</span>'
              : '<button class="msa-todo-btn" data-match="' + m.id + '">' +
                (x.что === 'confirm' ? I18N.t('score.confirm') : I18N.t('score.enter')) + '</button>';
            var подпись = x.что === 'confirm'
              ? I18N.t('score.entered') + ' ' + esc(String(m.score || '').replace(/\//g, ':'))
              : esc(нужныйТурнир(m.tournament));

            html += '<div class="msa-todo-row">' +
              '<div class="msa-todo-main">' +
                '<div class="msa-todo-name">' + esc(соперник.name || '?') + '</div>' +
                '<div class="msa-todo-sub">' + подпись + '</div>' +
              '</div>' + действие +
            '</div>';
          });
          html += '</div>';

          // Ставим рядом с содержимым, а не внутрь: список сыгранного
          // дорисовывается позже и затирал бы полосу целиком
          var старая = document.getElementById('msaTodo');
          if (старая) старая.remove();

          var полоса = document.createElement('div');
          полоса.innerHTML = html;
          var узел = полоса.firstChild;
          узел.id = 'msaTodo';
          content.parentNode.insertBefore(узел, content);

          узел.querySelectorAll('[data-match]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              MS.open(btn.dataset.match, function () { showMyMatches(); });
            });
          });
        });
      });
    });
  }

  function нужныйТурнир(t) {
    if (!t) return I18N.t('score.battle');
    if (I18N.lang === 'en') return t.title_en || t.title || '';
    if (I18N.lang === 'kg') return t.title_kg || t.title || '';
    return t.title || '';
  }

  function showMyMatches() {
    if (!_player) return;
    var ov = openSubOverlay(I18N.t('profile.myMatches'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    // Турнирные матчи: дуэли по вызову живут отдельно, в баттлах.
    // Ограничение снято — при трёх десятках матчей остальные просто
    // исчезали, ничем себя не обозначив.
    //
    // В матче помещаются двое: в парном турнире это капитаны пар, а
    // напарник не упомянут вовсе. Турниры, где игрок заявлен напарником,
    // подбираем отдельно и добираем матчи его капитана
    supabaseClient.from('tournament_registrations')
      .select('tournament_id, player_id')
      .eq('partner_id', _player.id)
      .in('status', ['approved', 'draw'])
      .then(function(pr) {
        var conds = ['player1_id.eq.' + _player.id, 'player2_id.eq.' + _player.id];
        var myCaptains = {};
        (pr.data || []).forEach(function(r) {
          if (!r.tournament_id || !r.player_id) return;
          myCaptains[r.tournament_id] = r.player_id;
          conds.push('and(tournament_id.eq.' + r.tournament_id + ',player1_id.eq.' + r.player_id + ')');
          conds.push('and(tournament_id.eq.' + r.tournament_id + ',player2_id.eq.' + r.player_id + ')');
        });
        loadMatchRows(conds.join(','), myCaptains);
      });

    // Над архивом — то, что ждёт ответа прямо сейчас: вписать счёт или
    // ответить на вписанный соперником. В архив такие матчи не попадают
    // вовсе: победителя у них ещё нет
    показатьДела(content);

    function loadMatchRows(orFilter, myCaptains) {
      // Здесь всё сыгранное: рейтинговые и дружеские турниры, парные, микст
      // и баттлы. Что из этого идёт в зачёт, говорит метка у названия —
      // в победы, поражения и форму попадают только рейтинговые одиночные
      supabaseClient.from('matches')
        .select('*, tournament:tournaments(title, format, category_id)')
        .or(orFilter)
        .not('winner_id', 'is', null)
        .order('played_at', { ascending: false })
        .then(function(r) {
          if (!r.data || r.data.length === 0) {
            content.innerHTML = '<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">' + I18N.t('profile.noMatches') + '</div></div>';
            return;
          }
          var matches = r.data;
          // Load all opponent IDs
          var oppIds = [];
          matches.forEach(function(m) {
            [m.player1_id, m.player2_id].forEach(function(id) {
              if (id && oppIds.indexOf(id) === -1) oppIds.push(id);
            });
          });

          // Составы пар: в матче записаны только капитаны. Без заявок не
          // сказать ни кто играл за соперника, ни с кем был в паре сам игрок
          var dblTournaments = [];
          matches.forEach(function(m) {
            var f = m.tournament && m.tournament.format;
            if ((f === 'doubles' || f === 'mixed_doubles') && m.tournament_id &&
                dblTournaments.indexOf(m.tournament_id) === -1) {
              dblTournaments.push(m.tournament_id);
            }
          });

          Promise.all([
            supabaseClient.from('players_public').select('id, name').in('id', oppIds),
            dblTournaments.length
              ? supabaseClient.from('tournament_registrations')
                  .select('tournament_id, player_id, partner_id, partner_external_name')
                  .in('tournament_id', dblTournaments)
              : Promise.resolve({ data: [] })
          ]).then(function(loaded) {
            var nameMap = {};
            (loaded[0].data || []).forEach(function(p) { nameMap[p.id] = p.name; });

            var pairs = {};
            (loaded[1].data || []).forEach(function(r) {
              if (!r.player_id) return;
              if (!pairs[r.tournament_id]) pairs[r.tournament_id] = {};
              pairs[r.tournament_id][r.player_id] = r.partner_id || r.partner_external_name || '';
            });

            // Имя напарника капитана в этом турнире
            function mateOf(tid, captainId) {
              var mate = pairs[tid] && pairs[tid][captainId];
              return mate ? (nameMap[mate] || mate) : '';
            }

            var html = '<div class="pd-matches-list">';
            matches.forEach(function(m) {
              // Своей может быть та сторона, где стоит не сам игрок, а его
              // капитан по паре
              var myCap = myCaptains[m.tournament_id];
              var mineIsP1 = m.player1_id === _player.id ||
                (m.player2_id !== _player.id && !!myCap && m.player1_id === myCap);
              var oppId = mineIsP1 ? m.player2_id : m.player1_id;
              var mySideCap = mineIsP1 ? m.player1_id : m.player2_id;
              var result = m.winner_id === mySideCap ? 'W' : 'L';
              var score = m.score || '';
              var displayScore = mineIsP1 ? formatScore(score) : formatScore(flipScore(score));
              var dbl = m.tournament &&
                (m.tournament.format === 'doubles' || m.tournament.format === 'mixed_doubles');

              var oppLabel = esc(nameMap[oppId] || oppId);
              var myMate = '';
              if (dbl) {
                var oppMate = mateOf(m.tournament_id, oppId);
                if (oppMate) oppLabel += ' / ' + esc(oppMate);
                // Свою половину пары в матче не найти: капитану напарника
                // даёт заявка, напарнику парой был сам капитан из матча
                myMate = mySideCap === _player.id
                  ? mateOf(m.tournament_id, _player.id)
                  : (nameMap[mySideCap] || '');
              }

              html += '<div class="pd-match">';
              html += '<div class="pd-match-date">' + formatDate(m.played_at).split(' ').slice(0, 2).join(' ') + '</div>';
              html += '<div class="pd-match-info">';
              html += '<div class="pd-match-tournament"><span class="pd-t-name">' +
                (m.tournament ? esc(m.tournament.title) : '') + '</span>' +
                window.KSLT_APP.matchKindTag(m) + '</div>';
              html += '<div class="pd-match-opp">' + oppLabel + '</div>';
              if (myMate) html += '<div class="pd-match-mate">' + esc(I18N.t('profile.matchWith')) +
                ' <span class="pd-match-mate-name">' + esc(myMate) + '</span></div>';
              html += '</div>';
              html += '<div class="pd-match-score">' + displayScore + '</div>';
              html += '<div class="pd-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + result + '</div>';
              html += '</div>';
            });
            html += '</div>';
            content.innerHTML = html;
          });
        });
    }
  }

  function formatScore(score) {
    if (!score) return '—';
    return score.replace(/(\d+)\/(\d+)/g, '$1:$2');
  }
  /* ПЕРЕВОРОТ СЧЁТА — ДОМ ПРАВИЛ (29.10). Здесь жила КОПИЯ с той самой
     ошибкой, которую сайт уже починил и описал: `(\d+)\/(\d+)` → `$2/$1`
     на «7/6(11-9)» давало «6/7(11-9)» — скобка оставалась у того, кто сет
     выиграл, и числа внутри не менялись. Таких копий в приложении было
     ДВЕ, и обе расходились с сайтом по-своему. */
  function flipScore(score) {
    return window.KSLT_RULES.перевернутьСчёт(score);
  }

  // ---- Badges ----
  /** Название значка на языке приложения: раньше всегда бралось русское. */
  function badgeName(b) {
    var lang = I18N.lang || 'ru';
    if (lang === 'en') return b.name_en || b.name || '';
    if (lang === 'kg') return b.name_kg || b.name || '';
    return b.name || '';
  }

  function showBadges() {
    var ov = openSubOverlay(I18N.t('profile.achievements'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    Promise.all([
      supabaseClient.from('badge_definitions').select('*').order('sort_order', { ascending: true }),
      _player
        ? supabaseClient.from('player_badges').select('badge_id, earned_at, badge:badge_definitions(*)').eq('player_id', _player.id)
        : Promise.resolve({ data: [] })
    ]).then(function(results) {
      var allBadges = results[0].data || [];
      var earned = results[1].data || [];
      var earnedIds = {};
      earned.forEach(function(pb) { earnedIds[pb.badge_id] = pb; });

      if (allBadges.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="empty-icon">🏅</div><div class="empty-title">' + I18N.t('profile.noBadges') + '</div></div>';
        return;
      }

      var html = '<div class="pd-badges-grid">';
      allBadges.forEach(function(b) {
        var e = earnedIds[b.id];
        html += '<div class="pd-badge-card ' + (e ? 'earned' : 'locked') + '">';
        html += '<div class="pd-badge-icon">' + (b.icon || '🏅') + '</div>';
        html += '<div class="pd-badge-name">' + esc(badgeName(b)) + '</div>';
        if (e) {
          html += '<div class="pd-badge-date">' + formatDate(e.earned_at) + '</div>';
        } else {
          html += '<div class="pd-badge-locked">🔒</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      content.innerHTML = html;
    });
  }

  // ---- Loyalty ----
  function showLoyalty() {
    var ov = openSubOverlay(I18N.t('profile.loyalty'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    Promise.all([
      supabaseClient.rpc('get_loyalty_balance', { p_profile_id: _profile.id }),
      supabaseClient.from('loyalty_transactions')
        .select('*')
        .eq('profile_id', _profile.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabaseClient.from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('cost', { ascending: true })
    ]).then(function(results) {
      var balance = (results[0].data !== null) ? results[0].data : 0;
      var transactions = results[1].data || [];
      var rewards = results[2].data || [];

      var html = '';

      // Balance card
      html += '<div class="prof-loyalty-balance">';
      html += '<div class="prof-loy-num">' + balance + '</div>';
      html += '<div class="prof-loy-label">' + I18N.t('profile.loyaltyPts') + '</div>';
      html += '</div>';

      // Rewards
      if (rewards.length > 0) {
        html += '<h4 class="prof-sub-title">' + I18N.t('profile.redeemTitle') + '</h4>';
        rewards.forEach(function(rw) {
          var canRedeem = balance >= rw.cost;
          html += '<div class="prof-reward-card' + (canRedeem ? '' : ' disabled') + '"' +
            (canRedeem ? ' data-reward-id="' + rw.id + '" data-cost="' + rw.cost + '"' : '') + '>';
          html += '<div class="prof-reward-info">';
          html += '<div class="prof-reward-name">' + esc(rw.name) + '</div>';
          if (rw.description) html += '<div class="prof-reward-desc">' + esc(rw.description) + '</div>';
          html += '</div>';
          html += '<div class="prof-reward-cost">' + rw.cost + ' б.</div>';
          html += '</div>';
        });
      }

      // History
      if (transactions.length > 0) {
        html += '<h4 class="prof-sub-title">' + I18N.t('profile.historyTitle') + '</h4>';
        html += '<div class="prof-loy-history">';
        transactions.forEach(function(t) {
          var isEarn = t.type === 'earn' || t.points > 0;
          html += '<div class="prof-loy-tx">';
          html += '<div class="prof-loy-tx-info">';
          html += '<span class="prof-loy-tx-desc">' + esc(t.description || (isEarn ? I18N.t('profile.earnDesc') : I18N.t('profile.spendDesc'))) + '</span>';
          html += '<span class="prof-loy-tx-date">' + formatDate(t.created_at) + '</span>';
          html += '</div>';
          html += '<span class="prof-loy-tx-pts ' + (isEarn ? 'earn' : 'spend') + '">' + (isEarn ? '+' : '') + t.points + '</span>';
          html += '</div>';
        });
        html += '</div>';
      } else {
        html += '<div class="pd-empty-small">' + I18N.t('profile.noTransactions') + '</div>';
      }

      content.innerHTML = html;

      // Redeem handlers
      content.querySelectorAll('.prof-reward-card[data-reward-id]').forEach(function(card) {
        card.addEventListener('click', function() {
          var rewardId = card.getAttribute('data-reward-id');
          var cost = parseInt(card.getAttribute('data-cost'));
          if (confirm(cost + ' ' + I18N.t('profile.redeemConfirm'))) {
            redeemReward(rewardId, content);
          }
        });
      });
    });
  }

  function redeemReward(rewardId, container) {
    supabaseClient.from('loyalty_transactions').insert({
      profile_id: _profile.id,
      type: 'redeem',
      reward_id: rewardId,
      description: I18N.t('profile.redeemDesc')
    }).then(function(r) {
      if (r.error) {
        window.KSLT_APP.toast(I18N.t('common.error') + ': ' + (r.error.message || I18N.t('profile.redeemError')));
      } else {
        window.KSLT_APP.toast(I18N.t('profile.redeemSuccess'));
        showLoyalty(); // Refresh
      }
    });
  }

  // ---- Vouchers ----
  function showVouchers() {
    var ov = openSubOverlay(I18N.t('profile.vouchers'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.from('discount_vouchers')
      .select('*')
      .eq('profile_id', _profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(function(r) {
        var vouchers = r.data || [];
        if (vouchers.length === 0) {
          content.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">' + I18N.t('profile.noVouchers') + '</div><div class="empty-text">' + I18N.t('profile.noVouchersSub') + '</div></div>';
          return;
        }

        var html = '';
        vouchers.forEach(function(v) {
          var isActive = v.status === 'active' && (!v.expires_at || new Date(v.expires_at) > new Date());
          var statusText = isActive ? I18N.t('profile.vActive') : (v.status === 'used' ? I18N.t('profile.vUsed') : I18N.t('profile.vExpired'));
          var statusClass = isActive ? 'active' : 'inactive';

          html += '<div class="prof-voucher ' + statusClass + '"' + (isActive ? ' data-code="' + esc(v.code || '') + '"' : '') + '>';
          html += '<div class="prof-voucher-info">';
          html += '<div class="prof-voucher-name">' + esc(v.service_name || v.entity_type || I18N.t('profile.vDiscount')) + '</div>';
          html += '<div class="prof-voucher-code">' + esc(v.code || '') + '</div>';
          if (v.expires_at) html += '<div class="prof-voucher-exp">' + I18N.t('profile.vUntil') + ' ' + formatDate(v.expires_at) + '</div>';
          html += '</div>';
          html += '<div class="prof-voucher-discount">-' + (v.discount_percent || v.discount || 0) + '%</div>';
          html += '<div class="prof-voucher-status ' + statusClass + '">' + statusText + '</div>';
          html += '</div>';
        });
        content.innerHTML = html;

        // Click active voucher → show QR code
        content.querySelectorAll('.prof-voucher[data-code]').forEach(function(vc) {
          vc.addEventListener('click', function() {
            var code = vc.getAttribute('data-code');
            if (!code) return;
            showVoucherQR(code);
          });
        });
      });
  }

  /* QR РИСУЕТСЯ В ТЕЛЕФОНЕ, А НЕ НА ЧУЖОМ СЕРВЕРЕ (03.11).
     Здесь стоял `<img src="https://api.qrserver.com/...?data=<код>">`:
     КОД ВАУЧЕРА УХОДИЛ В АДРЕСЕ ССЫЛКИ НА ЧУЖУЮ МАШИНУ — и в её журналы.
     Два следствия, и оба замерены, а не предположены: упадёт сервис —
     исчезнут ВСЕ ваучеры разом, запасного пути не было; и для анкеты
     Data safety в Play это передача данных третьей стороне, которую
     пришлось бы объявлять.
     Рисует `js/vendor/qrcode.js` (Kazuhiko Arase, MIT) — наружу не
     уходит ничего. SVG, а не картинка: чёток на любой плотности экрана,
     и показывать его администратору корта будут именно с экрана.
     ЗАПАСНОЙ ПУТЬ — САМ КОД СЛОВАМИ. Дом не загрузился — человек
     прочитает код вслух, и скидку всё равно получит. Пустое окно
     вместо ваучера оставлять нельзя: оно выглядит поломкой. */
  function рисоватьQR(узел, код) {
    if (!узел) return;
    if (typeof window.qrcode !== 'function') {
      узел.style.cssText += ';display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:14px;color:#000;word-break:break-all';
      узел.textContent = String(код);
      return;
    }
    var q = window.qrcode(0, 'M');
    q.addData(String(код));
    q.make();
    узел.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    var svg = узел.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.display = 'block';
    }
  }

  function showVoucherQR(code) {
    var existing = document.getElementById('voucherQRModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'voucherQRModal';
    modal.className = 'pd-h2h-modal';
    modal.innerHTML =
      '<div class="pd-h2h-content" style="max-width:300px;text-align:center">' +
        '<div class="pd-h2h-header"><button class="pd-h2h-close" id="qrClose">✕</button><h3>' + I18N.t('profile.vQRTitle') + '</h3></div>' +
        '<div style="padding:24px">' +
          '<div id="voucherQRBox" style="width:200px;height:200px;margin:0 auto;border-radius:8px;background:#fff;padding:8px;box-sizing:border-box"></div>' +
          '<div style="margin-top:12px;font-family:monospace;font-size:18px;color:var(--accent);letter-spacing:2px">' + code + '</div>' +
          '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">' + I18N.t('profile.vQRText') + '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('app').appendChild(modal);
    рисоватьQR(modal.querySelector('#voucherQRBox'), code);
    requestAnimationFrame(function() { modal.classList.add('open'); });

    /* ЧАСТЬ ОКНА ИЩЕТСЯ В САМОМ ОКНЕ (02.11). `getElementById`
       отдаёт первый подходящий узел ДОКУМЕНТА: пока окно одно,
       ответы совпадают, и беда ждёт второго — а второе бывает,
       пока старое ещё висит в доме после закрытия. */
    modal.querySelector('#qrClose').addEventListener('click', function() {
      modal.classList.remove('open');
      setTimeout(function() { modal.remove(); }, 300);
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('open');
        setTimeout(function() { modal.remove(); }, 300);
      }
    });
  }

  // ---- Payments ----
  function showPayments() {
    var ov = openSubOverlay(I18N.t('profile.payments'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.from('finances')
      .select('*')
      .eq('profile_id', _profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(function(r) {
        var payments = r.data || [];
        if (payments.length === 0) {
          content.innerHTML = '<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">' + I18N.t('profile.noPayments') + '</div></div>';
          return;
        }

        var total = 0;
        payments.forEach(function(p) { total += (p.amount || 0); });

        var html = '<div class="prof-pay-summary">' + I18N.t('profile.payTotal') + ' <strong>' + total.toLocaleString() + ' ' + I18N.t('td.som') + '</strong></div>';
        html += '<div class="prof-pay-list">';
        payments.forEach(function(p) {
          html += '<div class="prof-pay-item">';
          html += '<div class="prof-pay-date">' + formatDate(p.created_at) + '</div>';
          html += '<div class="prof-pay-info">';
          html += '<div class="prof-pay-desc">' + esc(p.description || p.entity_type || I18N.t('profile.payDefault')) + '</div>';
          if (p.method) html += '<div class="prof-pay-method">' + esc(p.method) + '</div>';
          html += '</div>';
          html += '<div class="prof-pay-amount">' + (p.amount || 0).toLocaleString() + ' с</div>';
          html += '</div>';
        });
        html += '</div>';
        content.innerHTML = html;
      });
  }

  // ---- Edit Profile ----
  function showEditProfile() {
    var p = _profile;
    // На сайте при регистрации имя складывается как «Имя Фамилия», а здесь
    // первое слово брали за фамилию — и в поле «Фамилия» у человека стояло
    // его имя. Сохранение переворачивало ФИО обратно, поэтому в базе всё
    // выглядело верно и ошибку никто не ловил.
    var nameParts = (p.full_name || '').trim().split(/\s+/);
    var firstName = nameParts[0] || '';
    var lastName = nameParts.slice(1).join(' ') || '';

    var html = '<div class="prof-edit-form">';

    // Avatar
    html += '<div class="prof-edit-avatar" id="profEditAvatar">';
    if (p.avatar_url) {
      html += '<img src="' + esc(p.avatar_url) + '" alt="">';
    } else {
      html += '<span>' + initials(p.full_name) + '</span>';
    }
    html += '<div class="prof-edit-avatar-hint">' + I18N.t('profile.editAvatar') + '</div>';
    html += '</div>';
    html += '<input type="file" id="profAvatarInput" accept="image/*" style="display:none">';

    html += profField(I18N.t('profile.lastName'), 'profLastName', lastName, 'text');
    html += profField(I18N.t('profile.firstName'), 'profFirstName', firstName, 'text');
    // Телефон: страна списком, номер отдельно. Код подставляется по выбору, а не
    // угадывается по номеру — у России и Казахстана он общий, +7.
    var phoneParts = window.KSLT_PHONE
        ? KSLT_PHONE.split(p.phone || '', p.phone_country)
        : { iso: 'KG', rest: p.phone || '' };
    html += '<div class="prof-field">';
    html += '<label class="prof-field-label">' + I18N.t('profile.phoneLbl') + '</label>';
    html += '<div class="prof-phone-row">';
    /* ОРГАН ВЫБОРА СТРАНЫ ОДИН НА ПРИЛОЖЕНИЕ — `pickerHtml`.
       Нативный `<select>` здесь стоял до 02.11 и показывал в закрытом
       поле только флаг с кодом: Казахстан и Россию с общим +7 по нему
       не различить, а на Android он открывается системным окном, в
       которое css не достаёт. */
    if (window.KSLT_PHONE) {
        html += '<span id="profPhoneCountryBox">' +
                KSLT_PHONE.pickerHtml(phoneParts.iso, I18N.lang, 'prof-phone-country') +
                '</span>';
    }
    html += '<input class="prof-field-input prof-phone-number" type="tel" id="profPhone" value="' +
            esc(phoneParts.rest) + '" placeholder="555 123 456" inputmode="tel">';
    html += '</div>';
    html += showToggle('profShowPhone', p.show_phone);
    html += '</div>';
    html += '<div class="prof-contacts-note">' + I18N.t('profile.contactsHint') + '</div>';

    // WhatsApp: свой номер, если отличается от основного. Пустое поле значит
    // «тот же, что телефон» — вводить номер дважды никого не заставляем.
    // Разрешение отдельное: номер можно скрыть, а WhatsApp оставить.
    var waStored = p.whatsapp_phone || '';
    var waParts = window.KSLT_PHONE
        ? KSLT_PHONE.split(waStored, p.whatsapp_country || p.phone_country)
        : { iso: 'KG', rest: waStored };
    html += '<div class="prof-field">';
    html += '<label class="prof-field-label">WhatsApp</label>';
    html += '<div class="prof-phone-row">';
    if (window.KSLT_PHONE) {
        html += '<span id="profWhatsappCountryBox">' +
                KSLT_PHONE.pickerHtml(waParts.iso, I18N.lang, 'prof-phone-country') +
                '</span>';
    }
    html += '<input class="prof-field-input prof-phone-number" type="tel" id="profWhatsapp" value="' +
            esc(waStored ? waParts.rest : '') + '" placeholder="' + I18N.t('profile.whatsappSame') + '" inputmode="tel">';
    html += '</div>';
    html += showToggle('profShowWhatsapp', p.show_whatsapp);
    html += '</div>';

    // Gender
    html += '<div class="prof-field">';
    html += '<label class="prof-field-label">' + I18N.t('profile.gender') + '</label>';
    html += '<select class="prof-field-input" id="profGender">';
    html += '<option value="">' + I18N.t('profile.genderNone') + '</option>';
    html += '<option value="men"' + (p.gender === 'men' ? ' selected' : '') + '>' + I18N.t('profile.genderMale') + '</option>';
    html += '<option value="women"' + (p.gender === 'women' ? ' selected' : '') + '>' + I18N.t('profile.genderFemale') + '</option>';
    html += '</select></div>';

    // Соцсети: у каждой своё разрешение — телеграм может быть рабочий,
    // инстаграм личный, и открывать их одной галочкой неправильно
    html += '<div class="prof-field">';
    html += '<label class="prof-field-label">Instagram</label>';
    html += '<input class="prof-field-input" type="text" id="profInstagram" value="' + esc(p.instagram || '') + '" placeholder="@username">';
    html += showToggle('profShowInstagram', p.show_instagram);
    html += '</div>';

    html += '<div class="prof-field">';
    html += '<label class="prof-field-label">Telegram</label>';
    html += '<input class="prof-field-input" type="text" id="profTelegram" value="' + esc(p.telegram || '') + '" placeholder="@username">';
    html += showToggle('profShowTelegram', p.show_telegram);
    html += '</div>';

    // Save button
    html += '<button class="pd-challenge-btn" id="profSaveBtn" style="margin-top:16px">' + I18N.t('common.save') + '</button>';
    html += '</div>';

    var ov = openSubOverlay(I18N.t('profile.editProfile'), html);
    bindShowToggleLabels(ov);

    // Avatar upload
    var avatarEl = document.getElementById('profEditAvatar');
    var avatarInput = document.getElementById('profAvatarInput');
    if (avatarEl && avatarInput) {
      avatarEl.addEventListener('click', function() { avatarInput.click(); });
      avatarInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          uploadAvatar(this.files[0]);
        }
      });
    }

    // Save
    document.getElementById('profSaveBtn').addEventListener('click', function() {
      var ln = document.getElementById('profLastName').value.trim();
      var fn = document.getElementById('profFirstName').value.trim();
      /* СТРАНА ЧИТАЕТСЯ ИЗ `data-iso` КОРНЯ ПИКЕРА, а не из `.value`
         селекта: органа-селекта здесь больше нет. */
      var phoneCountryEl = document.querySelector('#profPhoneCountryBox .kslt-cc');
      var phoneCountry = phoneCountryEl ? phoneCountryEl.dataset.iso : null;
      var phone = window.KSLT_PHONE
        ? KSLT_PHONE.join(phoneCountry, document.getElementById('profPhone').value)
        : document.getElementById('profPhone').value.trim();

      var waCountryEl = document.querySelector('#profWhatsappCountryBox .kslt-cc');
      var waCountry = waCountryEl ? waCountryEl.dataset.iso : null;
      var waRaw = (document.getElementById('profWhatsapp') || {}).value || '';
      var waNumber = waRaw.trim() && window.KSLT_PHONE
        ? KSLT_PHONE.join(waCountry, waRaw)
        : '';
      var gender = document.getElementById('profGender').value;
      var fullName = (fn + ' ' + ln).trim();   // «Имя Фамилия», как на сайте

      // Instagram / Telegram
      var instagram = (document.getElementById('profInstagram').value || '').trim().replace(/^@/, '');
      var telegram = (document.getElementById('profTelegram').value || '').trim().replace(/^@/, '');

      // Validate
      if (instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) {
        window.KSLT_APP.toast('Instagram: @username (a-z, 0-9, . _)');
        return;
      }
      if (telegram && !/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) {
        window.KSLT_APP.toast('Telegram: @username (5-32 chars)');
        return;
      }

      var oldPhone = _profile.phone || '';

      // Занятый номер ловим до сохранения: в базе запрет стоит на едином
      // виде номера, и её ошибка выглядела бы как «Ошибка сохранения»
      var phoneCheck = phone
        ? supabaseClient.rpc('is_phone_taken', { p_phone: phone })
        : Promise.resolve({ data: false });

      phoneCheck.then(function(chk) {
        if (chk && chk.data === true) {
          window.KSLT_APP.toast(I18N.t('profile.phoneTaken'));
          return null;
        }
        return supabaseClient.from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          phone_country: phoneCountry,
          show_phone: (document.getElementById('profShowPhone') || {}).checked || false,
          show_whatsapp: (document.getElementById('profShowWhatsapp') || {}).checked || false,
          show_telegram: (document.getElementById('profShowTelegram') || {}).checked || false,
          show_instagram: (document.getElementById('profShowInstagram') || {}).checked || false,
          whatsapp_phone: waNumber || null,
          whatsapp_country: waNumber ? waCountry : null,
          gender: gender,
          instagram: instagram,
          telegram: telegram
        })
        .eq('id', _profile.id);
      })
        .then(function(r) {
          if (!r) return;   // номер занят — сообщение уже показано
          if (r.error) {
            var dup = r.error.code === '23505' && String(r.error.message || '').indexOf('phone') !== -1;
            window.KSLT_APP.toast(I18N.t(dup ? 'profile.phoneTaken' : 'profile.savedErr'));
          } else {
            _profile.full_name = fullName;
            _profile.phone = phone;
            _profile.gender = gender;
            _profile.instagram = instagram;
            _profile.telegram = telegram;
            window.KSLT_AUTH.currentProfile = _profile;
            window.KSLT_APP.toast(I18N.t('profile.savedOk'));

            /* ПИСЬМО О СМЕНЕ НОМЕРА — ЗОВ ЧЕРЕЗ ДОМ ВХОДА (30.10).
               ЭТО МЕСТО МОЙ ЖЕ ЗАМЕР СНАЧАЛА НЕ УВИДЕЛ: оно стоит
               ПОСЛЕ `accept="image/*"` на :1259, а прибор, снимавший
               комментарии регулярками, принял открывашку внутри строки
               за начало комментария и ослеп до конца файла. Прибор
               заменён на `tools/bez-kommentariev.js`, который знает
               строки.
               И БЕДА ЗДЕСЬ БЫЛА НЕ ОДНА: рядом лежал ЗАШИТЫЙ адрес базы
               со `|| ''` вместо ключа. Пустой ключ даёт молчаливый отказ
               сервера, а зашитый адрес — второе определение того, что с
               шага A3.4 живёт в одном месте. */
            if (phone !== oldPhone && oldPhone) {
              try {
                window.KSLT_VHOD.письмоБезопасности(supabaseClient,
                  'phone_changed',
                  { old_phone: oldPhone, new_phone: phone });
              } catch (e) {}
            }
          }
        });
    });
  }

  function profField(label, id, value, type) {
    return '<div class="prof-field">' +
      '<label class="prof-field-label">' + esc(label) + '</label>' +
      '<input class="prof-field-input" type="' + type + '" id="' + id + '" value="' + esc(value) + '">' +
    '</div>';
  }

  function uploadAvatar(file) {
    if (file.size > 2 * 1024 * 1024) {
      window.KSLT_APP.toast(I18N.t('profile.fileTooLarge'));
      return;
    }
    var ext = file.name.split('.').pop().toLowerCase();
    // Та же папка, что у кабинета: раньше приложение писало в avatars/<id>.<ext>,
    // а кабинет в <id>/avatar.jpg, и у человека копились два файла аватара
    var path = _profile.id + '/avatar.' + ext;

    supabaseClient.storage.from('avatars')
      // Год: адрес аватара получает метку времени ниже, поэтому новая
      // фотография подхватывается сразу, а старая не скачивается заново при
      // каждом открытии профиля
      .upload(path, file, { upsert: true, cacheControl: '31536000' })
      .then(function(r) {
        if (r.error) {
          window.KSLT_APP.toast(I18N.t('profile.avatarErr'));
          return;
        }
        // Путь при смене аватара не меняется, поэтому без метки времени
        // человек продолжал бы видеть старую фотографию
        var publicUrl = supabaseClient.storage.from('avatars').getPublicUrl(path).data.publicUrl +
                        '?t=' + Date.now();
        supabaseClient.from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', _profile.id)
          .then(function() {
            _profile.avatar_url = publicUrl;
            window.KSLT_AUTH.currentProfile = _profile;
            window.KSLT_APP.toast(I18N.t('profile.avatarOk'));
            // Update avatar in edit form
            var avatarEl = document.getElementById('profEditAvatar');
            if (avatarEl) avatarEl.innerHTML = '<img src="' + esc(publicUrl) + '" alt=""><div class="prof-edit-avatar-hint">' + I18N.t('profile.editAvatar') + '</div>';
          });
      });
  }

  // ---- Notifications ----
  /**
   * Переключатель видимости рядом с полем связи. Галочка тут не годится: по
   * ней не прочитать, что произойдёт. Ползунок показывает состояние сразу, а
   * подпись меняется вместе с ним.
   */
  function showToggle(id, checked) {
    return '<label class="prof-show-toggle">' +
      '<span class="prof-show-label" data-for="' + id + '">' +
        I18N.t(checked ? 'profile.visibleToClub' : 'profile.hiddenFromAll') +
      '</span>' +
      '<span class="prof-switch">' +
        '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '>' +
        '<span class="prof-switch-slider"></span>' +
      '</span></label>';
  }

  /** Подпись переключателя следует за его состоянием. */
  function bindShowToggleLabels(root) {
    (root || document).querySelectorAll('.prof-show-toggle input').forEach(function(input) {
      input.addEventListener('change', function() {
        var label = (root || document).querySelector('.prof-show-label[data-for="' + input.id + '"]');
        if (label) label.textContent = I18N.t(input.checked ? 'profile.visibleToClub' : 'profile.hiddenFromAll');
      });
    });
  }

  /**
   * ДОКУМЕНТЫ КЛУБА.
   *
   * Список и адреса — дом `js/kslt-dokumenty.js`: адрес сайта берётся у
   * `KSLT_SAYT`, а не вписывается здесь, и язык выбирает продукт.
   *
   * ОТКРЫВАЕМ СИСТЕМНЫМ БРАУЗЕРОМ (`_system`), а не внутри накладки:
   * документ длинный, его читают, копируют и показывают юристу, и держать
   * его в окне приложения без адресной строки — хуже. Этот приём в
   * приложении уже есть (`screens/home.js:1312`).
   */
  function showDocuments() {
    var D = window.KSLT_DOKUMENTY;
    var I = window.KSLT_I18N;
    var язык = (I && I.lang) || 'ru';
    var имена = {
      privacy: I18N.t('profile.docPrivacy'),
      offer:   I18N.t('profile.docOffer'),
      rules:   I18N.t('profile.docRules'),
      terms:   I18N.t('profile.docTerms')
    };

    var список = D ? D.все(язык) : [];
    var html = '';
    список.forEach(function (д) {
      html += '<div class="profile-row prof-doc-row" data-doc="' + esc(д.адрес) + '">' +
        '<div class="profile-row-text"><div class="profile-row-label">' +
          esc(имена[д.имя] || д.страница) + '</div></div>' +
        '<span class="profile-row-arrow">›</span>' +
      '</div>';
    });
    if (!список.length) {
      html = '<div class="empty-state"><div class="empty-title">' +
             esc(I18N.t('profile.savedErr')) + '</div></div>';
    } else {
      html += '<div class="prof-notif-hint">' + esc(I18N.t('profile.docOpens')) + '</div>';
    }

    var ov = openSubOverlay(I18N.t('profile.documents'), html);
    ov.querySelectorAll('.prof-doc-row').forEach(function (строка) {
      строка.addEventListener('click', function () {
        window.open(строка.getAttribute('data-doc'), '_system');
      });
    });
  }

  /**
   * НАСТРОЙКИ УВЕДОМЛЕНИЙ.
   *
   * ПЕРЕПИСАНО КУСКОМ A2.3. Здесь было написано вот что: чтение и запись
   * в таблицу `notification_preferences`, КОТОРОЙ В БАЗЕ НЕТ ВОВСЕ —
   * проверено запросом 29.10, «relation does not exist», ни в одной
   * схеме. Чтение возвращало ошибку, данных не было, и из-за
   * `prefs[key] !== false` все восемь ползунков показывались
   * ВКЛЮЧЁННЫМИ. Человек трогал любой — запись падала, и ему
   * показывали «ошибка сохранения». А перед падением приложение успевало
   * спросить системное разрешение на пуши: разрешение взяли, обещание не
   * исполнили.
   *
   * И имена не совпадали ни в чём: каналы `telegram`/`email` вместо
   * `tg`/`email`, разделы `tournament`/`payment`/`system`/`marketing`
   * вместо шести, которые спрашивает сервер.
   *
   * Теперь всё как на сайте: `profiles.notify_preferences`, имена и
   * правило «включено ли» — из дома `js/kslt-uvedomleniya.js`.
   */
  function showNotifications() {
    var U = window.KSLT_UVEDOMLENIYA;
    var ov = openSubOverlay(I18N.t('profile.notifications'), '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    var настройки = U.прочитать(_profile);

    var имена = {
      tournaments: I18N.t('profile.notifTournaments'),
      challenges:  I18N.t('profile.notifChallenges'),
      membership:  I18N.t('profile.notifMembership'),
      matches:     I18N.t('profile.notifMatches'),
      security:    I18N.t('profile.notifSecurity'),
      general:     I18N.t('profile.notifGeneral')
    };
    var каналы = { tg: I18N.t('profile.notifTelegram'), email: I18N.t('profile.notifEmail') };

    var html = '';
    U.РАЗДЕЛЫ.forEach(function(раздел) {
      html += '<div class="prof-notif-card">';
      html += '<div class="prof-notif-header">' + esc(имена[раздел]) + '</div>';
      html += '<div class="prof-notif-toggles">';
      U.КАНАЛЫ.forEach(function(канал) {
        var вкл = U.включено(настройки, канал, раздел);
        /* БЕЗ ПРИВЯЗАННОГО БОТА СТОЛБЕЦ ТЕЛЕГРАМА БЕСПОЛЕЗЕН: человек
           включал ползунок и ждал сообщений, которым неоткуда взяться.
           Это правило было только у сайта, здесь его не было вовсе. */
        var гасить = !U.каналДоступен(канал, _profile);
        html += '<label class="prof-notif-toggle' + (гасить ? ' prof-notif-off' : '') + '">';
        html += '<span>' + esc(каналы[канал]) + '</span>';
        html += '<input type="checkbox" class="prof-notif-cb"' +
                ' data-razdel="' + esc(раздел) + '" data-kanal="' + esc(канал) + '"' +
                (вкл && !гасить ? ' checked' : '') + (гасить ? ' disabled' : '') + '>';
        html += '<span class="prof-toggle-switch"></span>';
        html += '</label>';
      });
      html += '</div></div>';
    });

    if (!U.каналДоступен('tg', _profile)) {
      html += '<div class="prof-notif-hint">' + esc(I18N.t('profile.notifTgOff')) + '</div>';
    }

    content.innerHTML = html;

    content.querySelectorAll('.prof-notif-cb').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var раздел = cb.getAttribute('data-razdel');
        var канал = cb.getAttribute('data-kanal');
        var вкл = cb.checked;

        /* ВКЛЮЧИЛ УВЕДОМЛЕНИЕ — ЗНАЧИТ ХОЧЕТ ЕГО ПОЛУЧАТЬ (Ю10, кусок
           230). Разрешение на пуши спрашиваем ТОЛЬКО ПОСЛЕ успешной
           записи: прежде спрашивали до неё, запись падала, и человек
           отдавал разрешение ни за что. */
        var было = U.прочитать(_profile);
        var стало = U.переключить(было, канал, раздел, вкл);
        _profile.notify_preferences = стало;

        supabaseClient.from('profiles')
          .update({ notify_preferences: стало })
          .eq('id', _profile.id)
          .then(function(r) {
            if (r.error) {
              cb.checked = !вкл;
              _profile.notify_preferences = было;
              window.KSLT_APP.toast(I18N.t('profile.savedErr'));
              return;
            }
            if (вкл && window.KSLT_PUSH && window.KSLT_PUSH.спросить) {
              /* СРАЗУ СИСТЕМНОЕ, БЕЗ СВОЕГО ОБЪЯСНЕНИЯ: человек только
                 что включил тумблер «Уведомления» — он уже сказал, чего
                 хочет. Объяснять ему то, что он нажал, значит спросить
                 дважды. */
              window.KSLT_PUSH.спросить({ сразу: true });
            }
          });
      });
    });
  }

  function showPasswordChange() {
    var html = '<div class="prof-edit-form">';
    html += profField(I18N.t('profile.newPass'), 'profNewPass', '', 'password');
    /* ПОЛЯ ПОДТВЕРЖДЕНИЯ ЗДЕСЬ БОЛЬШЕ НЕТ (02.11, решение сайта 21.09):
       у поля пароля есть глаз показа, а подтверждение — приём из времён,
       когда посмотреть на введённое было нельзя. Приложение шло на этом
       приёме ровно потому, что глаза не было. */
    html += '<div class="prof-pass-rules" id="profPassRules">';
    html += '<div class="prof-pass-rule" data-rule="length">' + I18N.t('profile.passRule') + '</div>';
    html += '</div>';
    html += '<button class="pd-challenge-btn" id="profChangePassBtn" style="margin-top:16px" disabled>' + I18N.t('profile.changePassBtn') + '</button>';
    html += '</div>';

    var ov = openSubOverlay(I18N.t('profile.changePass'), html);

    var newPass = document.getElementById('profNewPass');
    var btn = document.getElementById('profChangePassBtn');

    /* Поле нарисовано ТОЛЬКО ЧТО — глаз ставится по готовой разметке.
       Признак стоит на самом поле, поэтому повторный зов безвреден. */
    if (window.KSLT_GLAZ) KSLT_GLAZ.применить(ov || document);

    /* ШЕСТЬ ЗНАКОВ ЗДЕСЬ БЫЛО ВДВОЕ СЛАБЕЕ, ЧЕМ ВЕЗДЕ (02.11). Человек,
       сменивший пароль в кабинете, получал «123456» там, где при
       регистрации у него потребовали бы восемь со знаком препинания:
       дверь заперта, а окно открыто. Правило одно и живёт в
       `js/kslt-parol.js`. */
    function validate() {
      var нет = window.KSLT_PAROL.чегоНеХватает(newPass.value);
      btn.disabled = нет.length > 0;
      var подсказка = document.getElementById('profPassRules');
      if (подсказка) {
        var ряд = подсказка.querySelector('.prof-pass-rule');
        if (ряд) {
          /* Говорим, ЧЕГО не хватает, а не просто «пароль плохой»:
             человек, которому называют беду по одной, правит пароль
             четырежды. */
          ряд.textContent = нет.length
            ? I18N.t('profile.passRule')
            : I18N.t('profile.passRuleOk');
          ряд.classList.toggle('is-ok', нет.length === 0);
        }
      }
    }

    newPass.addEventListener('input', validate);

    btn.addEventListener('click', function() {
      btn.disabled = true;
      btn.textContent = I18N.t('profile.changingPass');
      supabaseClient.auth.updateUser({ password: newPass.value })
        .then(function(r) {
          if (r.error) {
            window.KSLT_APP.toast(I18N.t('common.error') + ': ' + (r.error.message || I18N.t('profile.redeemError')));
            btn.disabled = false;
            btn.textContent = I18N.t('profile.changePassBtn');
          } else {
            window.KSLT_APP.toast(I18N.t('profile.passChanged'));
            // Close overlay
            var overlay = document.getElementById('profSubOverlay');
            if (overlay) {
              overlay.classList.remove('open');
              setTimeout(function() { overlay.remove(); }, 300);
            }
          }
        });
    });
  }

  // ---- Language control ----
  function bindLangControl() {
    var control = document.getElementById('langControl');
    if (!control) return;
    control.querySelectorAll('.seg-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        control.querySelectorAll('.seg-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        I18N.setLang(btn.getAttribute('data-lang'));
        // Re-render profile screen with new language
        window.KSLT_PROFILE.load();
      });
    });
  }

  // ---- Logout ----
  function bindLogout() {
    var logoutEl = document.getElementById('logoutRow');
    if (logoutEl) {
      logoutEl.addEventListener('click', function() {
        window.KSLT_AUTH.logout().then(function() {
          P.load();
          if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
            window.KSLT_APP.onAuthChange();
          }
        });
      });
    }
  }

  // ---- Telegram connect ----
  function showTelegramConnect() {
    var tgBot = window.KSLT_TG_BOT || 'KSLTennisBot';
    var linked = _profile && _profile.telegram_id;

    var html = '<div style="text-align:center;padding:20px 0">';
    html += '<div style="font-size:56px;margin-bottom:16px">🤖</div>';

    // Раньше было написано только «откройте бота и нажмите /start» — зачем
    // подключать и что придёт, человек не понимал. Перечисляем до нажатия.
    var benefits = I18N.t('profile.tgBenefits');
    var list = Array.isArray(benefits)
      ? '<ul style="text-align:left;margin:0 0 18px;padding-left:20px;color:var(--text-sec);font-size:13px;line-height:1.7">' +
          benefits.map(function(b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>'
      : '';

    if (linked) {
      html += '<h3 style="color:var(--accent);margin-bottom:8px">' + I18N.t('profile.tgConnectedTitle') + '</h3>';
      html += '<p style="color:var(--text-sec);font-size:14px;margin-bottom:20px">' + I18N.t('profile.tgWhatComes') + '</p>';
      // Отключить бота из приложения было нельзя вовсе: человек блокировал его
      // в телеграме, а здесь оставалось «подключён»
      html += '<button class="pd-challenge-btn" id="profTgOff" style="background:transparent;border:1px solid var(--border);color:var(--text-sec)">' +
              I18N.t('profile.tgDisconnect') + '</button>';
    } else {
      html += '<h3 style="color:var(--text);margin-bottom:8px">' + I18N.t('profile.tgConnectTitle') + '</h3>';
      html += '<p style="color:var(--text-sec);font-size:14px;margin-bottom:12px">' + I18N.t('profile.tgWhy') + '</p>';
      html += list;
      html += '<a href="https://t.me/' + esc(tgBot) + '?start=' + (_profile ? _profile.id : '') + '" target="_blank" id="profTgOpen" class="pd-challenge-btn" style="display:block;text-decoration:none;text-align:center;background:var(--blue)">' + I18N.t('profile.tgOpenBot') + '</a>';
      html += '<div id="profTgWait" style="display:none;margin-top:16px;font-size:13px;color:var(--text-sec)">' +
              I18N.t('profile.tgWaiting') + '</div>';
    }
    html += '</div>';

    var ov = openSubOverlay(I18N.t('profile.telegram'), html);

    var off = ov.querySelector('#profTgOff');
    if (off) {
      off.addEventListener('click', function() {
        off.disabled = true;
        supabaseClient.from('profiles')
          .update({ telegram_chat_id: null, telegram_username: null })
          .eq('id', _profile.id)
          .then(function(r) {
            if (r.error) { off.disabled = false; window.KSLT_APP.toast(I18N.t('profile.savedErr')); return; }
            _profile.telegram_chat_id = null;
            _profile.telegram_id = null;
            window.KSLT_AUTH.currentProfile = _profile;
            closeSubOverlay(ov);
            P.load();
          });
      });
    }

    // Телеграм — отдельное приложение: человек уходит туда и возвращается.
    // Ждём ответа бота, чтобы состояние обновилось само, без перезапуска.
    var openBtn = ov.querySelector('#profTgOpen');
    if (openBtn) {
      openBtn.addEventListener('click', function() {
        var wait = ov.querySelector('#profTgWait');
        if (wait) wait.style.display = '';
        var stop = false;
        var stopWatch = setInterval(function() {
          if (!document.body.contains(ov)) { stop = true; clearInterval(stopWatch); }
        }, 1000);

        (function poll(tries) {
          if (stop || tries > 100) { clearInterval(stopWatch); return; }
          setTimeout(function() {
            if (stop) return;
            supabaseClient.from('profiles')
              .select('telegram_chat_id, telegram_username')
              .eq('id', _profile.id).single()
              .then(function(r) {
                if (r.data && r.data.telegram_chat_id) {
                  clearInterval(stopWatch);
                  _profile.telegram_chat_id = r.data.telegram_chat_id;
                  _profile.telegram_id = r.data.telegram_chat_id;
                  window.KSLT_AUTH.currentProfile = _profile;
                  if (wait) wait.innerHTML = '<span style="color:var(--accent)">\u2713 ' + I18N.t('profile.tgConnectedNow') + '</span>';
                  setTimeout(function() { closeSubOverlay(ov); P.load(); }, 1200);
                } else {
                  poll(tries + 1);
                }
              });
          }, 3000);
        })(0);
      });
    }
  }

  // ---- Delete account ----
  function showDeleteAccount() {
    var html = '<div style="text-align:center;padding:20px 0">';
    html += '<div style="font-size:48px;margin-bottom:16px">⚠️</div>';
    html += '<h3 style="color:var(--red);margin-bottom:8px">' + I18N.t('profile.deleteTitle') + '</h3>';
    html += '<p style="color:var(--text-sec);font-size:13px;margin-bottom:24px">' + I18N.t('profile.deleteText') + '</p>';
    html += '<button class="pd-challenge-btn" id="profDeleteConfirm" style="background:var(--red)">' + I18N.t('profile.deleteBtn') + '</button>';
    html += '<button class="gi-btn gi-btn-ghost" id="profDeleteCancel" style="width:100%;margin-top:10px">' + I18N.t('profile.deleteCancel') + '</button>';
    html += '</div>';

    var ov = openSubOverlay(I18N.t('profile.deleteAccount'), html);

    document.getElementById('profDeleteCancel').addEventListener('click', function() {
      closeSubOverlay(ov);
    });

    document.getElementById('profDeleteConfirm').addEventListener('click', function() {
      var btn = this;
      // Спрашиваем своим окном, а не системным: то выглядит чужим и в
      // приложении способно подвесить экран, пока его не закроют
      if (!window.KSLT_INVITES) return;
      window.KSLT_INVITES.modal({
        title: I18N.t('profile.deleteAsk'),
        body: '<p class="gi-text">' + I18N.t('profile.deleteConfirm') + '</p>',
        actions: [
          { label: I18N.t('profile.deleteCancel') },
          { label: I18N.t('profile.deleteBtn'), primary: true, onClick: function(close) {
            close();
            doDelete(btn);
          } }
        ]
      });
    });

    function doDelete(btn) {
      btn.disabled = true;
      btn.textContent = I18N.t('profile.deleting');

      /* УДАЛЕНИЕ УЧЁТНОЙ ЗАПИСИ — ЗОВ ЧЕРЕЗ ДОМ (30.10). Здесь слепой
         `r.json()` был опаснее всего: функция, упавшая на сервере,
         отвечает не JSON, разбор бросал — и человек видел «ошибка» там,
         где надо точно знать, удалена запись или нет. Дом отличает «не
         JSON» (громко, с кодом ответа) от отказа с причиной. */
      window.KSLT_ZOV.отИмени(supabaseClient, 'delete-account',
        { action: 'delete' })
        .then(function(data) {
          if (data.error) throw new Error(data.error);
          window.KSLT_AUTH.logout().then(function() {
            if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('profile.deletedOk'));
            P.load();
          });
        })
        .catch(function(err) {
          console.error('Delete account error:', err);
          if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('profile.deleteError') || 'Error');
          btn.disabled = false;
          btn.textContent = I18N.t('profile.deleteBtn');
        });
    }
  }

  // ---- Helper ----
  /* =========================================================
     ЗАБЛОКИРОВАННЫЕ (Apple 1.2), 04.11
     =========================================================
     Список приходит ОДНИМ запросом `kslt_moi_blokirovki()`: имя живёт в
     `players`, блокировка — в `user_blocks`, связывает их
     `profiles.player_id`. Собирать это тремя запросами в приложении
     значит завести порядок между ними и беду на шве. */
  function showBlocked() {
    var overlay = openSubOverlay(I18N.t('blk.listTitle'),
      '<div id="profBlkList"><div class="loading-center"><div class="spinner"></div></div></div>');
    if (!overlay) return;
    рисоватьБлокировки(overlay);
  }

  function рисоватьБлокировки(overlay) {
    var где = overlay.querySelector('#profBlkList');
    if (!где) return;
    supabaseClient.rpc('kslt_moi_blokirovki').then(function(r) {
      if (r && r.error) { throw r.error; }
      var список = (r && r.data) || [];
      if (!список.length) {
        /* ПУСТО — ЭТО ТОЖЕ ОТВЕТ. Пустой экран человек читает как
           поломку, поэтому говорим словами. */
        где.innerHTML = '<div class="pd-empty"><div class="pd-empty-icon">🙂</div>' +
          '<div class="pd-empty-title">' + esc(I18N.t('blk.listEmpty')) + '</div></div>';
        return;
      }
      var h = '';
      список.forEach(function(б) {
        var имя = I18N.lang === 'en' ? (б.name_en || б.name)
                : I18N.lang === 'kg' ? (б.name_kg || б.name)
                : б.name;
        h += '<div class="prof-blk-row" data-player="' + esc(б.player_id || '') + '">' +
               '<div class="prof-blk-text">' +
                 '<div class="prof-blk-name">' + esc(имя || б.player_id || '') + '</div>' +
                 '<div class="prof-blk-date">' + esc(датаКоротко(б.created_at)) + '</div>' +
               '</div>' +
               '<button class="prof-blk-off" type="button">' + esc(I18N.t('blk.unblock')) + '</button>' +
             '</div>';
      });
      h += '<p class="prof-blk-note">' + esc(I18N.t('blk.unblockNote')) + '</p>';
      где.innerHTML = h;

      где.querySelectorAll('.prof-blk-row').forEach(function(строка) {
        var кнопка = строка.querySelector('.prof-blk-off');
        кнопка.addEventListener('click', function() {
          кнопка.disabled = true;
          кнопка.textContent = I18N.t('blk.unblocking');
          supabaseClient.rpc('kslt_razblokirovat', {
            p_player_id: строка.getAttribute('data-player')
          }).then(function(о) {
            if (о && о.error) { throw о.error; }
            if (window.KSLT_APP && window.KSLT_APP.toast) {
              window.KSLT_APP.toast(I18N.t('blk.unblockDone'));
            }
            /* СПИСОК ПЕРЕЧИТЫВАЕТСЯ, А НЕ ПРАВИТСЯ НА МЕСТЕ: снятие
               могло не дойти, и строка, убранная руками, соврала бы. */
            рисоватьБлокировки(overlay);
          }).catch(function(e) {
            console.warn('[KSLT] блокировка не снята:', (e && e.message) || e);
            if (window.KSLT_APP && window.KSLT_APP.toast) {
              window.KSLT_APP.toast(I18N.t('blk.unblockError'));
            }
            кнопка.disabled = false;
            кнопка.textContent = I18N.t('blk.unblock');
          });
        });
      });
    }).catch(function(e) {
      console.warn('[KSLT] блокировки не прочитаны:', (e && e.message) || e);
      где.innerHTML = '<div class="pd-empty"><div class="pd-empty-title">' +
        esc(I18N.t('blk.unblockError')) + '</div></div>';
    });
  }

  /** Дата без времени: когда именно в тот день — человеку не нужно. */
  function датаКоротко(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(
        I18N.lang === 'en' ? 'en-GB' : 'ru-RU',
        { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return String(iso).slice(0, 10); }
  }

  function profileRow(colorClass, iconSvg, label, sub, value, hasArrow, id) {
    return '<div class="profile-row"' + (id ? ' id="' + id + '" style="cursor:pointer"' : '') + '>' +
      '<div class="profile-row-icon ' + colorClass + '">' + iconSvg + '</div>' +
      '<div class="profile-row-text">' +
        '<div class="profile-row-label">' + esc(label) + '</div>' +
        (sub ? '<div class="profile-row-sub">' + esc(sub) + '</div>' : '') +
      '</div>' +
      (value !== undefined ? '<span class="profile-row-value">' + esc(String(value)) + '</span>' : '') +
      (hasArrow ? '<span class="profile-row-arrow">›</span>' : '') +
    '</div>';
  }

})();
