// ============================================
// KSLT Mobile — Player Detail Overlay
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var PD = window.KSLT_PLAYER_DETAIL = {};
  var _player = null;
  var _playerId = null;
  var _contacts = null;   // телефон и соцсети из профиля игрока
  var _categoryLabel = '';
  var _rank = 0;
  var _earnedBadges = [];
  var _allBadges = [];
  var _playerCache = {};
  /* Заблокирован ли этот игрок МНОЙ. Спрашивается у базы вместе с
     карточкой, а не вычисляется на месте: заслон стоит триггером
     (`sql/схема/apple-1-2-zaslon.sql`), и приложение обязано показывать
     ТО ЖЕ, что решит база, иначе кнопка обещает одно, а отказ приходит
     другой. */
  var _zablokirovan = false;

  function esc(s) {
      /* ЭКРАНИРОВАНИЕ ОДНО НА ВЕСЬ ПРОДУКТ. Здесь стояло своё тело на
         `textContent`/`innerHTML`, и оно НЕ ЭКРАНИРУЕТ КАВЫЧКИ: проверено
         работой 08.11 — имя игрока `Костя" onmouseover="alert(1)` давало
         кнопку с чужим обработчиком, потому что значения атрибутов здесь
         собираются строками. Ещё `if (!s)` съедал ноль: счёт «0» пропадал.
         Имя `esc` оставлено: одна правка ТЕЛА чинит все зовы файла. */
      return KSLT_экранировать(s);
    }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  function getMonths() { return I18N.months(); }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.getDate() + ' ' + I18N.month(d.getMonth()) + ' ' + d.getFullYear();
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.getDate() + ' ' + I18N.month(d.getMonth());
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

  // Названия разрядов — из общего свода правил (js/kslt-rules.js). Здесь
  // лежала своя карта с ключами вида «men-tour», каких в базе нет вовсе:
  // совпадений не было никогда, и на экран шло сырое «masters».
  //
  // Если человек открыл карточку раньше, чем заглянул в рейтинг, свод ещё
  // пуст — тогда подтягиваем шесть строк сами, один раз за запуск
  function ensureCategories() {
    var R = window.KSLT_RULES;
    if (!R || R.knownCategories().length) return Promise.resolve();
    return supabaseClient.from('categories').select('*').then(function(r) {
      R.rememberCategories(r.data || []);
    });
  }

  // ---- Access check ----
  function getAccessLevel() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser) return 'guest';
    // member check: AUTH.checkMembership returns true/false via cached result
    if (AUTH._membershipStatus) return 'member';
    return 'registered';
  }

  // ---- Open player detail ----
  PD.open = function(playerId) {
    _playerId = playerId;
    _player = null;
    _earnedBadges = [];
    _allBadges = [];
    _rank = 0;
    _categoryLabel = '';

    if (window.KSLT_APP && window.KSLT_APP.incrementView) {
      window.KSLT_APP.incrementView('increment_player_view', { p_id: playerId });
    }

    var overlay = document.getElementById('playerOverlay');
    if (!overlay) return;

    var detail = document.getElementById('playerDetail');
    if (detail) detail.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
    overlay.classList.add('open');

    var access = getAccessLevel();

    // Load player data
    ensureCategories();
    /* ВИТРИНА, А НЕ ТАБЛИЦА. `players` открыта ПО СТОЛБЦАМ
       (`sql/доступ/players-public-view.sql`): почта, телефон и бан
       закрыты, и `select('*')` упирается в отказ — так и было написано
       в том файле: «`select=*` от анонима упирается в отказ».
       Приложение просило звёздочку и получало ошибку, а человек видел
       «Игрок не найден»: страница игрока не открывалась НИ РАЗУ.
       ЗВЁЗДОЧКА ПРОСИТ ВСЁ, А ОТКРЫТО НЕ ВСЁ — то же правило, на
       котором утром 02.11 стоял пустой кабинет.
       `players_public` отдаёт ровно разрешённый набор, и звёздочка по
       ней законна: перечислять тридцать столбцов руками значит завести
       второй список, который разойдётся с первым. */
    supabaseClient.from('players_public')
      .select('*')
      .eq('id', playerId)
      .single()
      .then(function(r) {
        if (r.error || !r.data) {
          /* ОШИБКА БЕЗ ИМЕНИ — ЭТО ПОТЕРЯННЫЙ ЧАС. «Не найден» говорит
             человеку правду о том, что он видит, но прячет причину от
             того, кто чинит: отказ в правах выглядит точно так же, как
             несуществующий игрок. */
          if (r.error) console.warn('[KSLT] игрок не прочитан:', r.error.message || r.error);
          detail.innerHTML = '<div class="pd-empty"><div class="pd-empty-icon">🔍</div><div class="pd-empty-title">' + I18N.t('pd.notFound') + '</div></div>';
          return;
        }
        _player = r.data;
        _categoryLabel = window.KSLT_RULES
          ? window.KSLT_RULES.categoryLabel(_player.category_id, I18N.lang)
          : (_player.category_id || '');

        // Load rank (count players with more points in same category)
        supabaseClient.from('players_public')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', _player.category_id)
          .gt('points', _player.points || 0)
          .then(function(rr) {
            _rank = ((rr.count || 0) + 1);

            if (access === 'guest') {
              renderGuestView();
            } else {
              // Load badges + render in parallel
              Promise.all([
                loadPlayerBadges(playerId),
                loadAllBadges(),
                // Контакты нужны только членам клуба — остальным их не покажут,
                // значит и запрашивать незачем
                /* КОНТАКТЫ ПРЯЧЕТ БАЗА, А НЕ РАЗМЕТКА (04.11). Здесь
                   стоял прямой запрос к `profiles`, а блокировку
                   учитывала отрисовка ниже — обещание окна блокировки
                   держала КАРТИНКА. Теперь решает серверная функция, та
                   же, что на сайте (`sql/схема/apple-1-2-kontakty.sql`):
                   она прячет в ОБЕ стороны и при уходе из клуба. */
                access === 'member'
                  ? supabaseClient.rpc('kslt_kontakty', { p_player_id: playerId })
                      .then(function(r) {
                        var о = (r && r.data) || {};
                        return (r && r.error) || о.error ? null : о;
                      })
                      .catch(function() { return null; })
                  : Promise.resolve(null),
                /* ОТКАЗ БАЗЫ НЕ ДОЛЖЕН ГАСИТЬ КАРТОЧКУ: не смогли
                   спросить — считаем, что блокировки нет, и человек
                   увидит обычный экран. Соврать в сторону «заблокирован»
                   хуже: это спрятало бы кнопки без причины. */
                supabaseClient.rpc('kslt_zablokirovan_li', { p_player_id: playerId })
                  .then(function(r) { return r && r.data === true; })
                  .catch(function() { return false; })
              ]).then(function(results) {
                _earnedBadges = results[0];
                _allBadges = results[1];
                _contacts = results[2];
                _zablokirovan = results[3] === true;
                renderFullProfile(access);
              });
            }
          });
      });
  };

  // ---- Close overlay ----
  PD.close = function() {
    var overlay = document.getElementById('playerOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  // ---- Guest view: minimal info + CTA ----
  function renderGuestView() {
    var detail = document.getElementById('playerDetail');
    if (!detail || !_player) return;

    var p = _player;
    var photoUrl = p.photo || '';

    var html = '<div class="pd-guest">';
    html += '<div class="pd-guest-avatar-wrap">';
    html += photoUrl
      ? '<img class="pd-guest-avatar" src="' + esc(photoUrl) + '" alt="">'
      : '<div class="pd-guest-avatar-fallback">' + initials(p.name) + '</div>';
    html += '</div>';
    html += '<h2 class="pd-guest-name">' + esc(p.name) + '</h2>';
    html += '<div class="pd-guest-cat">' + esc(_categoryLabel) + ' · #' + _rank + '</div>';

    html += '<div class="pd-guest-cta">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>';
    html += '<h3>' + I18N.t('pd.guestRegister') + '</h3>';
    html += '<p>' + I18N.t('pd.guestRegText') + '</p>';
    html += '<button class="pd-guest-btn" id="pdLoginBtn">' + I18N.t('pd.guestLoginBtn') + '</button>';
    html += '</div></div>';

    detail.innerHTML = html;

    var loginBtn = document.getElementById('pdLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        PD.close();
        if (window.KSLT_AUTH && window.KSLT_AUTH.showAuth) {
          window.KSLT_AUTH.showAuth();
        }
      });
    }
  }

  // ---- Full profile ----
  function renderFullProfile(access) {
    var detail = document.getElementById('playerDetail');
    if (!detail || !_player) return;

    var p = _player;
    var form = p.form || [];
    var totalM = (p.wins || 0) + (p.losses || 0);
    var winRate = window.KSLT_RULES.процентПобедТекст(p.wins, p.losses);
    var streak = calcStreak(form);

    var html = '';

    // ---- Hero section ----
    html += '<div class="pd-hero">';
    html += '<div class="pd-avatar-wrap">';
    html += p.photo
      ? '<img class="pd-avatar" src="' + esc(p.photo) + '" alt="">'
      : '<div class="pd-avatar-fallback">' + initials(p.name) + '</div>';
    html += '</div>';
    html += '<h2 class="pd-name">' + esc(p.name) + '</h2>';
    html += '<div class="pd-meta">';
    if (p.country) html += '<span class="pd-country">' + esc(p.country) + '</span>';
    html += '<span class="pd-category">' + esc(_categoryLabel) + ' · #' + _rank + '</span>';
    html += '</div>';

    // NTRP: одиночный разряд и парные турниры, с подписями
    var ntrpСтрока = (window.KSLT_RULES && window.KSLT_RULES.ntrpСтрока)
      ? window.KSLT_RULES.ntrpСтрока(p.ntrp_singles, p.ntrp_doubles,
                                     I18N.lang === 'en' ? 'en' : 'ru') : '';
    if (ntrpСтрока) {
      html += '<div class="pd-ntrp">NTRP <strong>' + ntrpСтрока + '</strong></div>';
    }

    // Header badges
    if (_earnedBadges.length > 0) {
      html += '<div class="pd-badges-row">';
      _earnedBadges.slice(0, 5).forEach(function(pb) {
        if (pb.badge) html += '<span class="pd-badge" title="' + esc(badgeName(pb.badge)) + '">' + (pb.badge.icon || '🏅') + '</span>';
      });
      if (_earnedBadges.length > 5) html += '<span class="pd-badge pd-badge-more">+' + (_earnedBadges.length - 5) + '</span>';
      html += '</div>';
    }

    // Bio
    if (p.bio) {
      html += '<div class="pd-bio">«' + esc(p.bio) + '»</div>';
    }

    html += '</div>'; // .pd-hero

    // ---- Stats grid ----
    /* Сетка плиток — из дома: `kst-grid` держит и три плитки, и пять,
       а прежняя `.pd-stats` была жёстко `repeat(3, 1fr)` */
    html += '<div class="kst-grid">';
    html += pdStatCard(p.points || 0, I18N.t('pd.rating'), p.rank_change);
    html += pdStatCard(p.wins || 0, I18N.t('pd.wins'), null);
    html += pdStatCard(p.losses || 0, I18N.t('pd.losses'), null);
    /* Знак процента печатает дом целиком: приписка `+ '%'` снаружи
       превратила бы прочерк при нуле игр в «—%» (шаг A3.1). */
    html += pdStatCard(winRate, I18N.t('pd.winRate'), null);
    // Streak with form dots
    /* Плитка серии несёт ещё и точки формы, поэтому собирается не
       зовом дома, а на его именах: дом отвечает за строение, а этот
       экран добавляет к нему свой хвост. */
    html += '<div class="kst-card">';
    html += '<div class="kst-value">' + streak.count + (streak.type === 'up' ? 'W' : 'L') + '</div>';
    html += '<div class="kst-label">' + I18N.t('pd.streak') + '</div>';
    html += '<div class="pd-form-dots">';
    form.slice(-5).forEach(function(f) {
      html += '<span class="pd-form-dot ' + (f === 'W' || f === 'w' ? 'w' : 'l') + '"></span>';
    });
    html += '</div></div>';
    html += '</div>'; // .kst-grid

    // Парный и микст. На сайте они показаны отдельными блоками: очки за них
    // не начисляются, но сыгранное — сыграно, и человек хочет это видеть.
    // В приложении их не было вовсе
    var dblW = p.doubles_wins || 0, dblL = p.doubles_losses || 0;
    var mixW = p.mixed_wins || 0, mixL = p.mixed_losses || 0;
    if (dblW || dblL || mixW || mixL) {
      html += '<div class="pd-pairs">';
      if (dblW || dblL) {
        html += '<div class="pd-pair"><div class="pd-pair-title">' + I18N.t('pd.doubles') + '</div>' +
                '<div class="pd-pair-score">' + dblW + ' / ' + dblL + '</div>' +
                '<div class="pd-pair-cap">' + I18N.t('pd.winsLosses') + '</div></div>';
      }
      if (mixW || mixL) {
        html += '<div class="pd-pair"><div class="pd-pair-title">' + I18N.t('pd.mixed') + '</div>' +
                '<div class="pd-pair-score">' + mixW + ' / ' + mixL + '</div>' +
                '<div class="pd-pair-cap">' + I18N.t('pd.winsLosses') + '</div></div>';
      }
      html += '</div>';
    }
    html += window.KSLT_APP.pairBlocks(p, esc);

    // ---- Rating history ----
    // Секция скрыта, пока график не найдёт записи — он сам её и откроет
    html += '<div class="pd-section rc-section" style="display:none;">';
    html += '<h3 class="pd-section-title">📈 ' + I18N.t('pd.ratingHistory') + '</h3>';
    html += '<div id="pdRatingChart"></div>';
    html += '</div>';

    /* ТРИ РАЗДЕЛА — СКЛАДКИ (02.11, слово Кости: «достижения — надо
       раскрывашку сделать, матчи тоже и в турнирах тоже»). Каждый из
       них в десятки строк: сетка значков на шесть рядов, десять матчей,
       список турниров. Складка прячет раздел за его заголовком, а счёт
       рядом с подписью отвечает, что внутри, не открывая.

       МАТЧИ ОТКРЫТЫ, ОСТАЛЬНЫЕ СВЁРНУТЫ — ПРЕДПОЛОЖЕНИЕ, И ОНО
       ПОМЕЧЕНО: за матчами на страницу игрока и ходят, а свернуть всё
       значит встретить человека списком заголовков. Скажешь иначе —
       меняется одно слово `открыта`. */
    var С = window.KSLT_SKLADKA;
    var грузится = '<div class="loading-center"><div class="spinner"></div></div>';

    html += '<div class="pd-section">' + С.разметка({
        знак: '⚔️', подпись: I18N.t('pd.matches'), открыта: true,
        id: 'pdMatches', содержимое: грузится
    }) + '</div>';

    html += '<div class="pd-section">' + С.разметка({
        знак: '🏆', подпись: I18N.t('pd.tournaments'),
        id: 'pdTournaments', содержимое: грузится
    }) + '</div>';

    html += '<div class="pd-section">' + С.разметка({
        знак: '🏅', подпись: I18N.t('pd.badges'),
        id: 'pdAchievements'
    }) + '</div>';

    // ---- Contact info (member only, if player allows) ----
    if (access === 'member') {
      // Контакты берём из профиля игрока: телефон он вводит в кабинете, там же
      // разрешает показ. Колонки players.phone/show_phone никто не заполнял.
      // Каждый способ связи открывается отдельно: телеграм может быть рабочий,
      // WhatsApp личный. WhatsApp живёт на своём номере, если он указан.
      /* ЗАБЛОКИРОВАЛ — КОНТАКТОВ НЕ ВИДИШЬ, И ЭТО ДЕРЖИТ БАЗА (04.11).
         Долг закрыт: `kslt_kontakty` сама отдаёт пусто при блокировке в
         любую сторону, поэтому `_contacts` уже пуст. Проверка здесь
         остаётся ВТОРЫМ рубежом — на случай, если карточку нарисуют из
         старого ответа, — но она больше не единственная. */
      var contacts = _zablokirovan ? {} : (_contacts || {});
      var cPhone = contacts.show_phone ? (contacts.phone || '') : '';
      /* ВТОРОЙ РУБЕЖ: основной телефон подставляется под WhatsApp только
         тогда, когда он и сам разрешён к показу. Первый рубеж — в базе,
         `sql/схема/vacap-ne-vydayot-skrytyy-nomer-06nov.sql`. */
      var cWa = contacts.show_whatsapp
        ? (contacts.whatsapp_phone || (contacts.show_phone ? (contacts.phone || '') : ''))
        : '';
      var cTg = contacts.show_telegram ? (contacts.telegram || '') : '';
      var cIg = contacts.show_instagram ? (contacts.instagram || '') : '';
      var hasContact = cPhone || cWa || cTg || cIg;
      if (hasContact) {
        html += '<div class="pd-section"><h3 class="pd-section-title">📞 ' + I18N.t('pd.contact') + '</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:8px">';
        if (cPhone) {
          html += '<a href="tel:' + esc(cPhone) + '" class="pd-challenge-btn" style="display:block;text-align:center;text-decoration:none;color:#0A0A0A">📱 ' + esc(cPhone) + '</a>';
        }
        if (cWa) {
          html += '<a href="https://wa.me/' + esc(cWa.replace(/[^0-9]/g, '')) + '" target="_blank" class="pd-challenge-btn" style="background:#25D366;display:block;text-align:center;text-decoration:none;color:#fff">WhatsApp</a>';
        }
        if (cTg) {
          var tgHandle = cTg.replace('@', '');
          html += '<a href="https://t.me/' + esc(tgHandle) + '" target="_blank" class="pd-challenge-btn" style="background:#2AABEE;display:block;text-align:center;text-decoration:none;color:#fff">Telegram @' + esc(tgHandle) + '</a>';
        }
        if (cIg) {
          html += '<a href="https://instagram.com/' + esc(cIg.replace('@', '')) + '" target="_blank" class="pd-challenge-btn" style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:block;text-align:center;text-decoration:none;color:#fff">Instagram @' + esc(cIg.replace('@', '')) + '</a>';
        }
        html += '</div></div>';
      }
    }

    // ---- Challenge button (member only) ----
    // Звать можно только того, у кого есть учётная запись: карточка из
    // списков клуба вызова и приглашения не получит — по ту сторону никого нет
    var естьЧеловек = _player.has_account === true;
    if (access === 'member' && естьЧеловек && !_zablokirovan) {
      html += '<div class="pd-challenge-wrap">';
      html += '<button class="pd-challenge-btn" id="pdChallengeBtn">⚔️ ' + I18N.t('pd.challenge') + '</button>';
      // Баттл зовёт на поединок того, кого ты уже знаешь. Приглашение решает
      // другую задачу — найти, с кем вообще выйти на корт
      html += '<button class="pd-invite-btn" id="pdInviteBtn">🎾 ' + I18N.t('inv.btn') + '</button>';
      html += '</div>';
    } else if (access === 'member' && естьЧеловек && _zablokirovan) {
      /* КНОПКА, КОТОРАЯ ГАРАНТИРОВАННО ОТКАЖЕТ, — ЭТО ЛОВУШКА.
         Заслон в базе стоит в обе стороны: заблокировав, ты и сам не
         позовёшь. Значит вместо «Вызвать» здесь стоит правда о том,
         что происходит, и выход из положения. */
      html += '<div class="pd-cta-membership"><p>' + I18N.t('blk.blockedHint') + '</p></div>';
    } else if (access === 'registered') {
      html += '<div class="pd-cta-membership">';
      html += '<p>' + I18N.t('pd.memberCta') + '</p>';
      html += '</div>';
    }

    /* ---- Жалоба и блокировка (Apple 1.2) ----
       СТОЯТ ПОСЛЕДНИМИ И ТИХО. Правило 1.2 требует, чтобы они БЫЛИ, а не
       чтобы кричали: за карточкой приходят играть, а не жаловаться.
       Показываются вошедшему и только там, где по ту сторону есть
       человек: у карточки из списков клуба нет учётной записи, и
       блокировать там некого (функция ответит `no_account`). */
    if (access !== 'guest' && естьЧеловек) {
      html += '<div class="pd-safety-row">';
      html += '<button class="pd-safety-btn" type="button" id="pdReportBtn">' +
              I18N.t('sft.report') + '</button>';
      html += '<button class="pd-safety-btn pd-safety-btn--block" type="button" id="pdBlockBtn">' +
              (_zablokirovan ? I18N.t('blk.unblock') : I18N.t('sft.block')) + '</button>';
      html += '</div>';
    }

    detail.innerHTML = html;

    // Async load data
    loadMatches();
    loadTournaments();
    renderAchievements();
    if (window.KSLT_RATING_CHART) window.KSLT_RATING_CHART.mount('pdRatingChart', p.id, p.category_id);

    // Challenge button
    if (access === 'member') {
      var chalBtn = document.getElementById('pdChallengeBtn');
      if (chalBtn) {
        chalBtn.addEventListener('click', function() {
          handleChallenge();
        });
      }
      var invBtn = document.getElementById('pdInviteBtn');
      if (invBtn) {
        invBtn.addEventListener('click', function() {
          if (window.KSLT_INVITES) window.KSLT_INVITES.send(_player.id);
        });
      }
    }

    // ---- Жалоба и блокировка ----
    var repBtn = document.getElementById('pdReportBtn');
    if (repBtn) repBtn.addEventListener('click', openReport);
    var blkBtn = document.getElementById('pdBlockBtn');
    if (blkBtn) blkBtn.addEventListener('click', function() {
      if (_zablokirovan) снятьБлокировку(); else openBlock();
    });
  }

  /* =========================================================
     ЖАЛОБА И БЛОКИРОВКА (Apple 1.2), 04.11
     =========================================================
     ОКНА СТРОЯТСЯ ТОЙ ЖЕ ДОРОГОЙ, ЧТО H2H (`openH2H` ниже): узел
     кладётся в `playerOverlay`, класс `open` вешается следующим кадром,
     снимается с задержкой под переход. Нового компонента не заведено —
     так решено на доске 1030:155, раздел F.

     ЧАСТЬ ОКНА ИЩЕТСЯ В САМОМ ОКНЕ (правило 02.11): `getElementById`
     отдаёт первый узел ДОКУМЕНТА, и пока окно одно — ответы совпадают,
     а беда ждёт второго. */

  /* ОКНО ПЕРЕЕХАЛО В ДОМ 06.11 — `js/kslt-shtorka.js`. Здесь оно
     собиралось руками, и ровно такое же собиралось ещё в двух местах:
     ниже в `openH2H` и в кабинете, у кода ваучера. Три руки уже
     разошлись — роль, подпись кнопки и язык заголовка были в разных
     местах разными. ОБЁРТКИ НЕ ОСТАВЛЕНО: второе имя одного понятия
     разводит вызовы по двум дорогам. */
  function окно(id, заголовок, тело) {
    var родитель = document.getElementById('playerOverlay');
    if (!родитель) return null;
    return window.KSLT_SHTORKA.окно({ id: id, заголовок: заголовок, тело: тело, родитель: родитель });
  }

  /** Пять причин живут ОДНИМ списком: добавится шестая — правится одно
      место, а не разметка и перевод по отдельности. Коды — те же, что в
      ограничении базы `content_reports.reason`. */
  var ПРИЧИНЫ = [
    ['offensive',     'rep.offensive'],
    ['spam',          'rep.spam'],
    ['fake',          'rep.fake'],
    ['foreign_photo', 'rep.foreignPhoto'],
    ['other',         'rep.other']
  ];

  function openReport() {
    var тело = '<div class="pd-rep-reasons" role="radiogroup" aria-label="' +
               esc(I18N.t('rep.title')) + '">';
    ПРИЧИНЫ.forEach(function(пара, i) {
      тело += '<label class="pd-rep-reason">' +
                '<input type="radio" name="kslt-prichina" value="' + пара[0] + '"' +
                  (i === 0 ? ' checked' : '') + '>' +
                '<span class="pd-rep-tick" aria-hidden="true">✓</span>' +
                '<span class="pd-rep-label">' + esc(I18N.t(пара[1])) + '</span>' +
              '</label>';
    });
    тело += '</div>' +
      '<label class="pd-rep-note-label" for="pdRepNote">' + esc(I18N.t('rep.noteLabel')) + '</label>' +
      '<textarea class="pd-rep-note" id="pdRepNote" maxlength="1000" placeholder="' +
        esc(I18N.t('rep.notePlaceholder')) + '"></textarea>' +
      '<button class="pd-rep-send" type="button">' + esc(I18N.t('rep.send')) + '</button>' +
      '<p class="pd-rep-srok">' + esc(I18N.t('rep.srok')) + '</p>';

    var у = окно('pdReportModal', I18N.t('rep.title'), тело);
    if (!у) return;

    var кнопка = у.querySelector('.pd-rep-send');
    кнопка.addEventListener('click', function() {
      var выбран = у.querySelector('input[name="kslt-prichina"]:checked');
      var заметка = у.querySelector('#pdRepNote').value;
      /* РАБОТА, КОТОРАЯ НЕ ВИДНА, НЕОТЛИЧИМА ОТ БЕЗДЕЙСТВИЯ — правило
         03.11 с перестановки мест. Кнопка запирается на время запроса. */
      кнопка.disabled = true;
      кнопка.textContent = I18N.t('rep.sending');
      supabaseClient.rpc('kslt_pozhalovatsya', {
        p_target_kind: 'player',
        p_target: _player.id,
        p_reason: выбран ? выбран.value : 'other',
        p_note: заметка
      }).then(function(r) {
        var о = (r && r.data) || {};
        if (r && r.error) { throw r.error; }
        if (о.error === 'already') { toast(I18N.t('rep.already')); у.закрыть(); return; }
        if (о.error === 'not_logged_in') { toast(I18N.t('blk.notLogged')); у.закрыть(); return; }
        if (о.ok) { toast(I18N.t('rep.done')); у.закрыть(); return; }
        throw new Error(о.error || 'unknown');
      }).catch(function(e) {
        console.warn('[KSLT] жалоба не ушла:', (e && e.message) || e);
        toast(I18N.t('rep.error'));
        кнопка.disabled = false;
        кнопка.textContent = I18N.t('rep.send');
      });
    });
  }

  function openBlock() {
    var пункты = ['blk.w1', 'blk.w2', 'blk.w3', 'blk.w4', 'blk.w5', 'blk.w6']
      .map(function(к) { return '<li>' + esc(I18N.t(к)) + '</li>'; }).join('');
    var тело =
      '<ul class="pd-blk-what">' + пункты + '</ul>' +
      '<div class="pd-blk-keep"><strong>' + esc(I18N.t('blk.keepTitle')) + '</strong>' +
        '<span>' + esc(I18N.t('blk.keepText')) + '</span></div>' +
      '<button class="pd-blk-do" type="button">' + esc(I18N.t('blk.do')) + '</button>' +
      '<button class="pd-blk-cancel" type="button">' + esc(I18N.t('blk.cancel')) + '</button>';

    var у = окно('pdBlockModal', I18N.t('blk.title'), тело);
    if (!у) return;

    у.querySelector('.pd-blk-cancel').addEventListener('click', function() { у.закрыть(); });

    var кнопка = у.querySelector('.pd-blk-do');
    кнопка.addEventListener('click', function() {
      кнопка.disabled = true;
      кнопка.textContent = I18N.t('blk.doing');
      supabaseClient.rpc('kslt_zablokirovat', { p_player_id: _player.id })
        .then(function(r) {
          var о = (r && r.data) || {};
          if (r && r.error) { throw r.error; }
          if (о.error === 'no_account') { toast(I18N.t('blk.noAccount')); у.закрыть(); return; }
          if (о.error === 'not_logged_in') { toast(I18N.t('blk.notLogged')); у.закрыть(); return; }
          if (!о.ok) { throw new Error(о.error || 'unknown'); }
          _zablokirovan = true;
          у.закрыть();
          /* ЧИСЛО ОТМЕНЁННЫХ ГОВОРИТСЯ ВСЛУХ: человек должен узнать о
             потере матча от нас, а не обнаружить её сам в кабинете. */
          /* ПРО ПАРНЫЙ МАТЧ ГОВОРИМ ОТДЕЛЬНО: он НЕ отменяется, и
             человек должен узнать это сразу, а не в день игры. */
          var слово = о.otmeneno > 0
            ? I18N.t('blk.doneMatches') + о.otmeneno
            : I18N.t('blk.done');
          if (о.parnyh > 0) слово += ' ' + I18N.t('blk.doneParnyh');
          toast(слово);
          PD.open(_playerId);
        })
        .catch(function(e) {
          console.warn('[KSLT] блокировка не прошла:', (e && e.message) || e);
          toast(I18N.t('blk.error'));
          кнопка.disabled = false;
          кнопка.textContent = I18N.t('blk.do');
        });
    });
  }

  function снятьБлокировку() {
    var кнопка = document.getElementById('pdBlockBtn');
    if (кнопка) { кнопка.disabled = true; кнопка.textContent = I18N.t('blk.unblocking'); }
    supabaseClient.rpc('kslt_razblokirovat', { p_player_id: _player.id })
      .then(function(r) {
        if (r && r.error) { throw r.error; }
        _zablokirovan = false;
        toast(I18N.t('blk.unblockDone'));
        PD.open(_playerId);
      })
      .catch(function(e) {
        console.warn('[KSLT] блокировка не снята:', (e && e.message) || e);
        toast(I18N.t('blk.unblockError'));
        if (кнопка) { кнопка.disabled = false; кнопка.textContent = I18N.t('blk.unblock'); }
      });
  }

  /** Одно место, где приложение говорит с человеком всплывашкой. */
  function toast(текст) {
    if (window.KSLT_APP && window.KSLT_APP.toast) window.KSLT_APP.toast(текст);
    else console.log('[KSLT]', текст);
  }

  /* ПЛИТКУ СТРОИТ ОБЩИЙ ДОМ `js/kslt-plitki.js` (шаг A3.5, 29.10).
     Здесь жил ЧЕТВЁРТЫЙ строитель одного и того же понятия, со своей
     семьёй имён `pd-stat-*`. Имена `pd-stat-*` остаются карточке
     ТРЕНЕРА (`screens/coaches.js:177`) — там это цена и опыт, другие
     данные; это записано в трекер как оставшийся долг, а не замолчано.

     Обёртка оставлена нарочно: зовов пять, и у них своя подпись
     «сдвиг». Переименовывать зовы незачем — меняется только тело. */
  function pdStatCard(num, label, change) {
    var h = window.KSLT_PLITKI.плитка(num, label, { сдвиг: change });
    return h;
  }

  function calcStreak(form) {
    if (!form || !form.length) return { count: 0, type: 'neutral' };
    var reversed = form.slice().reverse();
    var first = reversed[0];
    var count = 0;
    for (var i = 0; i < reversed.length; i++) {
      if (reversed[i] === first) count++;
      else break;
    }
    return { count: count, type: first === 'W' || first === 'w' ? 'up' : 'down' };
  }

  // ---- Load Badges ----
  function loadPlayerBadges(playerId) {
    return supabaseClient.from('player_badges')
      .select('badge_id, earned_at, badge:badge_definitions(*)')
      .eq('player_id', playerId)
      .order('earned_at', { ascending: true })
      .then(function(r) { return r.data || []; });
  }

  function loadAllBadges() {
    return supabaseClient.from('badge_definitions')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(function(r) { return r.data || []; });
  }

  // ---- Load Matches ----
  function loadMatches() {
    var container = document.getElementById('pdMatches');
    if (!container) return;

    // Здесь всё сыгранное: рейтинговые и дружеские турниры, парные, микст и
    // баттлы. В зачёт из этого идут только рейтинговые одиночные — об этом
    // говорит метка у названия турнира
    supabaseClient.from('matches')
      .select('*, tournament:tournaments(id, title, format, category_id)')
      .or('player1_id.eq.' + _playerId + ',player2_id.eq.' + _playerId)
      .not('winner_id', 'is', null)
      .order('played_at', { ascending: false })
      .limit(20)
      .then(function(r) {
        /* СЧЁТ СТАВИТСЯ В ШАПКУ ДАЖЕ ПРИ ПУСТОМ РАЗДЕЛЕ: ноль — такой
           же ответ, как двадцать, и ради него не надо открывать. */
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noMatches') + '</div>';
          if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, 0);
          return;
        }
        if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, r.data.length);
        renderMatches(container, r.data);
      });
  }

  function renderMatches(container, matches) {
    /* ОТСЕЧКУ ДЕЛАЕТ ДОМ `js/kslt-otsechka.js` — тот же, что на сайте
       («10 везде», слово Кости 06.10). Здесь она была написана заново,
       и написана НЕВЕРНО: кнопка звала `renderMatches` с тем же полным
       списком, а он снова отрезал первые десять. Нажатие убирало кнопку
       и НЕ ПОКАЗЫВАЛО НИЧЕГО НОВОГО — обещание без содержания.

       Дом работает иначе: строки рисуются ВСЕ, лишние получают класс,
       кнопка его снимает. СТРОКА СКРЫТА, А НЕ ВЫБРОШЕНА — её находит
       поиск по странице и читает диктор. */
    var О = window.KSLT_OTSECHKA;
    var всего = matches.length;
    var visible = matches;

    var html = '<div class="pd-matches-list">';
    visible.forEach(function(m, номер) {
      var isP1 = m.player1_id === _playerId;
      var oppId = isP1 ? m.player2_id : m.player1_id;
      var result = m.winner_id === _playerId ? 'W' : 'L';
      var score = m.score || '';
      var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));
      var tName = m.tournament ? m.tournament.title : '';
      var kind = window.KSLT_APP.matchKind(m);

      // Пары и микст в личные встречи не идут: в матче записаны капитаны,
      // а состав пары меняется от турнира к турниру
      var pairGame = kind === 'doubles' || kind === 'mixed';

      html += '<div class="pd-match' + (pairGame ? '' : ' pd-match-clickable') +
              О.класс(номер, всего) + '"' +
              (pairGame ? '' : ' data-opponent-id="' + esc(oppId) + '"') + '>';
      html += '<div class="pd-match-date">' + formatDateShort(m.played_at) + '</div>';
      html += '<div class="pd-match-info">';
      html += '<div class="pd-match-tournament"><span class="pd-t-name">' + esc(tName) +
              '</span>' + window.KSLT_APP.matchKindTag(m) + '</div>';
      html += '<div class="pd-match-opp" id="pdOpp_' + esc(oppId) + '">' + I18N.t('common.loading') + '</div>';
      html += '</div>';
      html += '<div class="pd-match-score">' + displayScore + '</div>';
      html += '<div class="pd-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + result + '</div>';
      html += '</div>';
    });
    html += '</div>';
    /* Кнопка стоит ВНУТРИ коробки списка: дом раскрывает свою коробку,
       а не все на странице — у игрока списков два, матчи и турниры. */
    html += О.кнопка(всего, I18N.lang);

    container.innerHTML = html;
    О.включить(container);

    // Load opponent names
    var oppIds = [];
    visible.forEach(function(m) {
      var oppId = m.player1_id === _playerId ? m.player2_id : m.player1_id;
      if (oppIds.indexOf(oppId) === -1) oppIds.push(oppId);
    });
    loadOpponentNames(oppIds);

    // Match click → H2H. У парных строк обработчика нет: там встречались
    // не двое, и «личная встреча» была бы неправдой
    container.querySelectorAll('.pd-match-clickable').forEach(function(row) {
      row.addEventListener('click', function() {
        var oppId = row.getAttribute('data-opponent-id');
        if (oppId) openH2H(oppId);
      });
    });
  }

  function loadOpponentNames(ids) {
    if (!ids.length) return;
    supabaseClient.from('players_public')
      .select('id, name, photo')
      .in('id', ids)
      .then(function(r) {
        if (!r.data) return;
        r.data.forEach(function(p) {
          _playerCache[p.id] = p;
          var el = document.getElementById('pdOpp_' + p.id);
          if (el) el.textContent = p.name;
        });
      });
  }

  // ---- Load Tournaments ----
  function loadTournaments() {
    var container = document.getElementById('pdTournaments');
    if (!container) return;

    // Get tournament registrations for this player
    supabaseClient.from('tournament_registrations')
      .select('*, tournament:tournaments(id, title, date_start, status)')
      .eq('player_id', _playerId)
      /* 28.10, КУСОК 216: тот же несуществующий `created_at` — турниры
         игрока не показывались НИКОГДА, на странице каждого игрока. */
      .order('registered_at', { ascending: false })
      .limit(20)
      .then(function(r) {
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noTournaments') + '</div>';
          if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, 0);
          return;
        }
        if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, r.data.length);
        var html = '<div class="pd-tournaments-list">';
        r.data.forEach(function(reg) {
          if (!reg.tournament) return;
          var t = reg.tournament;
          var statusClass = t.status === 'completed' ? 'completed' : 'upcoming';
          html += '<div class="pd-tournament">';
          html += '<div class="pd-tournament-date">' + formatDateShort(t.date_start) + '</div>';
          html += '<div class="pd-tournament-name">' + esc(t.title) + '</div>';
          html += '<div class="pd-tournament-status ' + statusClass + '">' + (t.status === 'completed' ? I18N.t('pd.completed') : I18N.t('pd.upcoming')) + '</div>';
          html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
      });
  }

  // ---- Achievements ----
  function renderAchievements() {
    var container = document.getElementById('pdAchievements');
    if (!container) return;

    if (_allBadges.length === 0 && _earnedBadges.length === 0) {
      container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noBadges') + '</div>';
      if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, 0);
      return;
    }

    var earnedIds = {};
    _earnedBadges.forEach(function(pb) { earnedIds[pb.badge_id] = pb; });

    var html = '<div class="pd-badges-grid">';
    _allBadges.forEach(function(b) {
      var earned = earnedIds[b.id];
      html += '<div class="pd-badge-card ' + (earned ? 'earned' : 'locked') + '">';
      html += '<div class="pd-badge-icon">' + (b.icon || '🏅') + '</div>';
      html += '<div class="pd-badge-name">' + esc(badgeName(b)) + '</div>';
      if (earned) {
        html += '<div class="pd-badge-date">' + formatDate(earned.earned_at) + '</div>';
      } else {
        html += '<div class="pd-badge-locked">🔒</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
    /* У ЗНАЧКОВ СЧЁТ — ЭТО ДРОБЬ, А НЕ ЧИСЛО: показаны все, что есть в
       клубе, и часть из них под замком. «3 / 24» отвечает на вопрос
       «сколько у него», а «24» ответило бы на «сколько бывает». */
    if (window.KSLT_SKLADKA) {
      KSLT_SKLADKA.счёт(container, _earnedBadges.length + ' / ' + _allBadges.length);
    }
  }

  /** Название значка на языке приложения: раньше всегда бралось русское. */
  function badgeName(b) {
    var lang = I18N.lang || 'ru';
    if (lang === 'en') return b.name_en || b.name || '';
    if (lang === 'kg') return b.name_kg || b.name || '';
    return b.name || '';
  }

  // ---- H2H Modal ----
  function openH2H(opponentId) {
    /* ЗАГОЛОВОК БЕРЁТСЯ ИЗ СЛОВАРЯ. Здесь было зашито «Head-to-Head»
       по-английски — при живом ключе `pd.h2h` («Личные встречи»).
       НАДПИСЬ МИМО СЛОВАРЯ ПРИ ЖИВОМ КЛЮЧЕ — ЭТО НЕ ЭКОНОМИЯ, А ВТОРОЕ
       определение одного понятия. */
    var modal = окно('pdH2HModal', I18N.t('pd.h2h'),
      '<div class="loading-center"><div class="spinner"></div></div>');
    if (!modal) return;

    /* ЗАКРЫТИЕ ВЕШАЕТ ДОМ. Здесь висели свои два обработчика — по
       кнопке и по подложке, — и они повторяли дом слово в слово. ДВА
       ПУТИ ЗАКРЫТИЯ ОДНОГО ОКНА РАСХОДЯТСЯ НА ПЕРВОЙ ЖЕ ПРАВКЕ: один
       снимет класс и уберёт узел, другой забудет про уборку. */

    // Load H2H data
    loadH2HData(opponentId);
  }

  function loadH2HData(opponentId) {
    /* ЧАСТЬ ОКНА ИЩЕТСЯ В САМОМ ОКНЕ (правило 02.11): `getElementById`
       отдаёт ПЕРВЫЙ подходящий узел документа, а окон с телом может
       оказаться два — пока старое ещё доживает свой переход. */
    var окноH2H = document.getElementById('pdH2HModal');
    var body = окноH2H && окноH2H.querySelector('.pd-h2h-body');
    if (!body) return;

    // Load opponent info
    var oppPromise = _playerCache[opponentId]
      ? Promise.resolve(_playerCache[opponentId])
      : supabaseClient.from('players_public').select('id, name, photo, points, wins, losses').eq('id', opponentId).single().then(function(r) {
          if (r.data) _playerCache[opponentId] = r.data;
          return r.data;
        });

    // Личные встречи: рейтинговые, дружеские и баттлы. Парные и микст сюда
    // не идут — в матче записаны капитаны, а состав пары каждый раз новый,
    // и счёт «двое на двое» выдавался бы за встречу двоих
    var matchesPromise = supabaseClient.from('matches')
      .select('*, tournament:tournaments(title, format, category_id)')
      .or(
        'and(player1_id.eq.' + _playerId + ',player2_id.eq.' + opponentId + '),' +
        'and(player1_id.eq.' + opponentId + ',player2_id.eq.' + _playerId + ')'
      )
      .not('winner_id', 'is', null)
      .order('played_at', { ascending: false })
      .limit(10)
      .then(function(r) {
        return (r.data || []).filter(function(m) {
          var k = window.KSLT_APP.matchKind(m);
          return k !== 'doubles' && k !== 'mixed';
        });
      });

    Promise.all([oppPromise, matchesPromise]).then(function(results) {
      var opp = results[0];
      var matches = results[1];

      if (!opp) {
        body.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.h2hNoData') + '</div>';
        return;
      }

      // Calculate H2H stats
      var myWins = 0, oppWins = 0, mySets = 0, oppSets = 0, myGames = 0, oppGames = 0;
      matches.forEach(function(m) {
        var isP1 = m.player1_id === _playerId;
        if (m.winner_id === _playerId) myWins++;
        else oppWins++;

        if (m.score) {
          var stats = parseScoreStats(m.score);
          if (stats) {
            if (isP1) {
              mySets += stats.p1Sets; oppSets += stats.p2Sets;
              myGames += stats.p1Games; oppGames += stats.p2Games;
            } else {
              mySets += stats.p2Sets; oppSets += stats.p1Sets;
              myGames += stats.p2Games; oppGames += stats.p1Games;
            }
          }
        }
      });

      var html = '';

      // VS header
      html += '<div class="pd-h2h-vs">';
      html += '<div class="pd-h2h-player">';
      html += '<div class="pd-h2h-avatar">' + (_player.photo ? '<img src="' + esc(_player.photo) + '" alt="">' : initials(_player.name)) + '</div>';
      html += '<div class="pd-h2h-pname">' + esc(_player.name) + '</div>';
      html += '</div>';
      html += '<div class="pd-h2h-vs-text">VS</div>';
      html += '<div class="pd-h2h-player">';
      html += '<div class="pd-h2h-avatar">' + (opp.photo ? '<img src="' + esc(opp.photo) + '" alt="">' : initials(opp.name)) + '</div>';
      html += '<div class="pd-h2h-pname">' + esc(opp.name) + '</div>';
      html += '</div>';
      html += '</div>';

      // Stats row
      html += '<div class="pd-h2h-stats">';
      html += '<div class="pd-h2h-stat"><span class="pd-h2h-val my">' + myWins + '</span><span class="pd-h2h-label">' + I18N.t('pd.h2hWins') + '</span><span class="pd-h2h-val opp">' + oppWins + '</span></div>';
      html += '<div class="pd-h2h-stat"><span class="pd-h2h-val my">' + mySets + '</span><span class="pd-h2h-label">' + I18N.t('pd.h2hSets') + '</span><span class="pd-h2h-val opp">' + oppSets + '</span></div>';
      html += '<div class="pd-h2h-stat"><span class="pd-h2h-val my">' + myGames + '</span><span class="pd-h2h-label">' + I18N.t('pd.h2hGames') + '</span><span class="pd-h2h-val opp">' + oppGames + '</span></div>';
      html += '</div>';

      // Match list
      if (matches.length === 0) {
        html += '<div class="pd-empty-small">' + I18N.t('pd.h2hNoMatches') + '</div>';
      } else {
        html += '<h4 class="pd-h2h-matches-title">' + I18N.t('pd.h2hLatest') + '</h4>';
        html += '<div class="pd-h2h-matches">';
        matches.forEach(function(m) {
          var isP1 = m.player1_id === _playerId;
          var result = m.winner_id === _playerId ? 'W' : 'L';
          var score = m.score || '';
          var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));
          var tName = m.tournament ? m.tournament.title : '';

          html += '<div class="pd-h2h-match ' + (result === 'W' ? 'win' : 'loss') + '">';
          html += '<span class="pd-h2h-m-date">' + formatDateShort(m.played_at) + '</span>';
          html += '<span class="pd-h2h-m-score">' + displayScore + '</span>';
          html += '<span class="pd-h2h-m-result">' + result + '</span>';
          html += '<span class="pd-h2h-m-tournament"><span class="pd-t-name">' + esc(tName) +
                  '</span>' + window.KSLT_APP.matchKindTag(m) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      body.innerHTML = html;
    });
  }

  function parseScoreStats(score) {
    if (!score || score === 'BYE') return null;
    var sets = score.trim().split(/\s+/);
    var p1S = 0, p2S = 0, p1G = 0, p2G = 0;
    sets.forEach(function(s) {
      var m = s.match(/^(\d+)\/(\d+)/);
      if (m) {
        var g1 = parseInt(m[1], 10), g2 = parseInt(m[2], 10);
        p1G += g1; p2G += g2;
        if (g1 > g2) p1S++; else if (g2 > g1) p2S++;
      }
    });
    return { p1Sets: p1S, p2Sets: p2S, p1Games: p1G, p2Games: p2G };
  }

  // ---- Challenge handler ----
  /**
   * ВЫЗОВ НА БАТТЛ.
   *
   * ПЕРЕПИСАНО 29.10, И ЭТО БЫЛА ПОЛОМКА, А НЕ НЕХВАТКА БЛОКА.
   *
   * Здесь шла ПРЯМАЯ ВСТАВКА в таблицу `challenges` со статусом
   * `pending` — а в ограничении базы `challenges_status_check` такого
   * статуса НЕТ ВОВСЕ (допустимы `active`, `negotiating`, `countered`,
   * `accepted`, `declined`, `expired`, `completed`, `cancelled`). База
   * отклоняла вставку, и человек получал ошибку при каждом нажатии
   * «Вызвать».
   *
   * И вставка шла МИМО серверной функции `create-challenge`, которую
   * зовёт сайт, — то есть мимо восьми её проверок: вошёл ли, есть ли
   * карточка, не себя ли вызывает, член ли клуба, нашёлся ли соперник,
   * не слишком ли много висящих вызовов, нет ли уже такого вызова, нет
   * ли назначенного матча. И мимо уведомлений, которые она отправляет
   * сопернику.
   *
   * Теперь зов один — через дом `js/kslt-vyzov.js`, как на сайте.
   * Проверки «вошёл» и «есть карточка» оставлены ЗДЕСЬ намеренно: это
   * не правила клуба, а подсказка человеку до обращения к серверу.
   */
  function handleChallenge() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser) {
      window.KSLT_APP.toast(словоВызова('chalLogin'));
      return;
    }
    if (!AUTH.currentProfile || !AUTH.currentProfile.player_id) {
      window.KSLT_APP.toast(словоВызова('chalNoPlayer'));
      return;
    }
    if (AUTH.currentProfile.player_id === _playerId) {
      window.KSLT_APP.toast(словоВызова('chalSelf'));
      return;
    }

    window.KSLT_VYZOV.создать(supabaseClient, _playerId, '').then(function (итог) {
      window.KSLT_APP.toast(итог.ок ? I18N.t('pd.chalSent') : словоВызова(итог.ключ));
    });
  }

  /* СЛОВА ОТКАЗОВ ВЫЗОВА. Дом отдаёт КЛЮЧ, слово по ключу — здесь: у
     сайта свой словарь на три языка, у приложения свой. Восемь кодов
     серверной функции сведены домом в семь ключей плюс общий. */
  var СЛОВА_ВЫЗОВА = {
    chalLogin:     ['pd.chalLogin', 'Войдите, чтобы вызвать'],
    chalNoPlayer:  ['pd.chalLinkPlayer', 'Свяжите учётную запись с карточкой игрока'],
    chalSelf:      ['pd.chalSelf', 'Себя вызвать нельзя'],
    chalNotMember: ['pd.chalNotMember', 'Вызов доступен членам клуба'],
    chalLimit:     ['pd.chalLimit', 'Слишком много висящих вызовов — дождитесь ответа'],
    chalExists:    ['pd.chalExists', 'Вызов этому игроку уже отправлен'],
    chalMatchSet:  ['pd.chalMatchSet', 'Матч с этим игроком уже назначен'],
    chalError:     ['pd.chalError', 'Не удалось отправить вызов']
  };

  function словоВызова(ключ) {
    var п = СЛОВА_ВЫЗОВА[ключ] || СЛОВА_ВЫЗОВА.chalError;
    var v = I18N.t(п[0]);
    return (v && v !== п[0]) ? v : п[1];
  }

  // ---- Init overlay back button ----
  document.addEventListener('click', function(e) {
    if (e.target.closest('#playerBack')) {
      PD.close();
    }
  });

})();
