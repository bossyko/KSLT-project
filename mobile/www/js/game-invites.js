/**
 * Приглашение поиграть — в приложении.
 *
 * Баттл вызывает на поединок того, кого ты уже знаешь. Здесь задача другая:
 * найти, с кем вообще выйти на корт. Приглашение уходит с карточки игрока,
 * ответ даётся в профиле, и только после согласия обе стороны видят контакты
 * друг друга.
 *
 * Обмен взаимный. Тот, кто принимает, отдаёт свои контакты тоже — поэтому
 * перед согласием предупреждаем, а не ставим человека перед фактом.
 *
 * Всё, что здесь есть, повторяет сайт: те же функции на сервере, те же
 * ответы об ошибках, те же значки сетей. Разошедшиеся тексты в приложении и
 * на сайте — самая частая причина «а почему тут по-другому».
 */
(function () {
  'use strict';

  var INV = {};
  var _sending = false;

  function I(key) { return window.KSLT_I18N ? window.KSLT_I18N.t(key) : key; }

  function esc(s) {
      /* ЭКРАНИРОВАНИЕ ОДНО НА ВЕСЬ ПРОДУКТ. Здесь стояло своё тело на
         `textContent`/`innerHTML`, и оно НЕ ЭКРАНИРУЕТ КАВЫЧКИ: проверено
         работой 08.11 — имя игрока `Костя" onmouseover="alert(1)` давало
         кнопку с чужим обработчиком, потому что значения атрибутов здесь
         собираются строками. Ещё `if (!s)` съедал ноль: счёт «0» пропадал.
         Имя `esc` оставлено: одна правка ТЕЛА чинит все зовы файла. */
      return KSLT_экранировать(s);
    }

  function token() {
    return supabaseClient.auth.getSession().then(function (s) {
      return (s.data && s.data.session && s.data.session.access_token) || null;
    });
  }

  // ---- Единое окно ----------------------------------------------------
  /**
   * ОКНО ПЕРЕЕХАЛО В СВОЙ ДОМ 05.11 — `js/kslt-vopros.js`.
   *
   * Оно звалось `KSLT_INVITES.modal`, то есть жило под именем, которое
   * обещало приглашения, а звали его отовсюду: удаление учётной записи,
   * отказы при выборе напарника, подтверждение обмена баллов. Здесь не
   * осталось даже обёртки: ОБЁРТКА — ЭТО ВТОРОЕ ИМЯ ОДНОГО ПОНЯТИЯ, и
   * половина мест звала бы старое, половина новое.
   */

  // ---- Контакты -------------------------------------------------------
  /**
   * Карточка контактов собеседника. Показываем всё, что он заполнил: галочки
   * «показывать другим» тут ни при чём — они про открытый показ всему клубу,
   * а здесь согласие дано адресно, одному человеку.
   *
   * Плашка красится цветом своей сети, а не общим лаймом: строка узнаётся
   * раньше, чем прочитана.
   */
  INV.contactsHtml = function (cn) {
    var ICON = window.KSLT_CONTACT_ICONS || {};
    if (!cn) return '<p class="gi-text">' + I('inv.noContacts') + '</p>';

    // Имя пользователя вытаскиваем общим правилом: люди вписывают в поле и
    // «@ivanov», и целую ссылку с хвостом — показывать это как есть нельзя
    var R = window.KSLT_RULES;
    var rows = [];
    if (cn.phone) rows.push([ICON.phone, esc(cn.phone), 'tel:' + cn.phone, 'phone']);
    if (cn.whatsapp) rows.push([ICON.whatsapp, esc(cn.whatsapp), R.socialUrl('wa', cn.whatsapp), 'wa']);
    if (cn.telegram) rows.push([ICON.telegram, '@' + esc(R.handle(cn.telegram)), R.socialUrl('tg', cn.telegram), 'tg']);
    if (cn.instagram) rows.push([ICON.instagram, '@' + esc(R.handle(cn.instagram)), R.socialUrl('ig', cn.instagram), 'ig']);
    if (!rows.length) return '<p class="gi-text">' + I('inv.noContacts') + '</p>';

    return '<div class="gi-contacts">' +
      (cn.full_name ? '<div class="gi-contacts-name">' + esc(cn.full_name) + '</div>' : '') +
      rows.map(function (r) {
        return '<a class="gi-contact gi-contact--' + r[3] + '" href="' + r[2] + '" target="_blank" rel="noopener">' +
          '<span class="gi-contact-icon">' + r[0] + '</span>' +
          '<span>' + r[1] + '</span></a>';
      }).join('') +
    '</div>';
  };

  INV.showContacts = function (contacts) {
    window.KSLT_VOPROS.окно({
      title: I('inv.contactsTitle'),
      body: INV.contactsHtml(contacts),
      actions: [{ label: I('inv.close'), primary: true }]
    });
  };

  // ---- Отправка -------------------------------------------------------
  /**
   * Телеграм для отправки не нужен. Раньше без него запрещали: принять
   * приглашение можно было только кнопками в боте. Теперь ответ живёт в
   * приложении и на сайте, а Телеграм с почтой лишь оповещают — кому что
   * доступно.
   */
  INV.send = function (playerId) {
    window.KSLT_VOPROS.окно({
      title: I('inv.confirmTitle'),
      body: '<p class="gi-text">' + I('inv.confirmText') + '</p>',
      actions: [
        { label: I('inv.cancel') },
        { label: I('inv.confirmBtn'), primary: true, onClick: function (close) {
          close();
          doSend(playerId);
        } }
      ]
    });
  };

  function doSend(playerId) {
    if (_sending) return;
    _sending = true;

    token().then(function (tk) {
      if (!tk) { toast(I('inv.error')); _sending = false; return; }

      /* ЗОВ ЧЕРЕЗ ДОМ (30.10). Дом сам отличает «не JSON» от отказа:
         прежде `r.json()` бросал на упавшей функции, и человек видел
         общее «ошибка» — а код отказа, по которому `errorText` выбирает
         слово, терялся. */
      return window.KSLT_ZOV.сТокеном(tk, 'send-game-invite',
        { receiver_player_id: playerId }
      ).then(function (данные) {
        if (данные && данные.success) { toast(I('inv.sent')); return; }
        toast(errorText(данные && данные.error));
      });
    }).catch(function (e) {
      console.error('[KSLT] invite send:', e);
      toast(I('inv.error'));
    }).then(function () { _sending = false; });
  }

  /** Ответы сервера — теми же словами, что и на сайте. */
  function errorText(code) {
    if (code === 'daily_limit') return I('inv.limit');
    if (code === 'already_pending') return I('inv.pending');
    if (code === 'no_account') return I('inv.noAccount');
    if (code === 'receiver_no_contacts') return I('inv.noContactsSend');
    if (code === 'self_invite') return I('inv.self');
    if (code === 'not_member') return I('inv.notMember');
    return I('inv.error');
  }

  function toast(msg) {
    if (window.KSLT_APP && window.KSLT_APP.toast) window.KSLT_APP.toast(msg);
  }

  // ---- Ответ ----------------------------------------------------------
  /**
   * Принять или отклонить. Идём через функцию на сервере, а не напрямую в
   * базу: она заодно оповещает отправителя — колокольчиком, Телеграмом,
   * push и письмом, кому что доступно.
   */
  INV.respond = function (inviteId, accept) {
    /* ЗОВ ЧЕРЕЗ ДОМ (30.10): без токена сервер не зовётся вовсе, а
       ответ разбирается через текст — упавшая функция больше не роняет
       разбор. */
    return token().then(function (tk) {
      return window.KSLT_ZOV.сТокеном(tk, 'respond-game-invite',
        { invite_id: inviteId, accept: accept });
    });
  };

  /** Согласие спрашиваем отдельно: человек отдаёт свои контакты тоже. */
  INV.confirmAccept = function (inviteId, done) {
    window.KSLT_VOPROS.окно({
      title: I('inv.accept'),
      body: '<p class="gi-text">' + I('inv.shareWarn') + '</p>',
      actions: [
        { label: I('inv.cancel') },
        { label: I('inv.accept'), primary: true, onClick: function (close) {
          close();
          answer(inviteId, true, done);
        } }
      ]
    });
  };

  INV.decline = function (inviteId, done) {
    answer(inviteId, false, done);
  };

  function answer(inviteId, accept, done) {
    INV.respond(inviteId, accept).then(function (res) {
      if (res && res.error) {
        window.KSLT_VOPROS.окно({
          title: I('inv.title'),
          body: '<p class="gi-text">' + esc(res.error) + '</p>',
          actions: [{ label: I('inv.close'), primary: true }]
        });
        return;
      }
      if (accept && res && res.contacts) INV.showContacts(res.contacts);
      if (done) done();
    }).catch(function (e) {
      console.error('[KSLT] invite answer:', e);
      toast(I('inv.error'));
    });
  }

  // ---- Список приглашений --------------------------------------------
  /**
   * Экран со всеми приглашениями — и полученными, и отправленными.
   * Направление показываем стрелкой у имени, а не отдельной колонкой: на
   * узком экране пятая колонка не помещается.
   */
  INV.openList = function () {
    var overlay = openScreen(I('inv.title'),
      '<div class="loading-center"><div class="spinner"></div></div>');
    loadList(overlay);
    return overlay;
  };

  function loadList(overlay) {
    var box = overlay.querySelector('.gi-list-content');
    if (!box) return;

    supabaseClient.rpc('get_my_game_invites').then(function (r) {
      var list = r.data || [];
      if (r.error) {
        box.innerHTML = '<div class="empty-state"><div class="empty-title">' + I('common.error') + '</div></div>';
        return;
      }
      if (!list.length) {
        box.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-icon">🎾</div>' +
            '<div class="empty-title">' + I('inv.emptyTitle') + '</div>' +
            '<div class="empty-text">' + I('inv.emptyText') + '</div>' +
          '</div>';
        return;
      }
      box.innerHTML = list.map(card).join('');
    });
  }

  function card(inv) {
    var name = inv.partner_name || '—';
    var isSent = inv.direction === 'sent';

    var statusLabel = inv.status === 'accepted' ? I('inv.accepted')
      : inv.status === 'declined' ? I('inv.declined') : I('inv.pendingLabel');
    var statusClass = inv.status === 'accepted' ? 'accepted'
      : inv.status === 'declined' ? 'declined' : 'pending';

    var dateStr = '';
    if (inv.created_at) {
      var d = String(inv.created_at);
      dateStr = d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(2, 4);
    }

    var actions = '';
    if (!isSent && inv.status === 'pending') {
      actions =
        '<div class="gi-card-actions">' +
          '<button class="gi-btn gi-btn-primary gi-btn-sm gi-accept" data-inv="' + esc(inv.id) + '">' + I('inv.accept') + '</button>' +
          '<button class="gi-btn gi-btn-ghost gi-btn-sm gi-decline" data-inv="' + esc(inv.id) + '">' + I('inv.decline') + '</button>' +
        '</div>';
    } else if (inv.status === 'accepted') {
      actions =
        '<div class="gi-card-actions">' +
          '<button class="gi-btn gi-btn-ghost gi-btn-sm gi-show" data-inv="' + esc(inv.id) + '">' + I('inv.showContacts') + '</button>' +
        '</div>';
    }

    var avatar = inv.partner_avatar
      ? '<img class="gi-card-avatar" src="' + esc(inv.partner_avatar) + '" alt="">'
      : '<div class="gi-card-avatar gi-card-avatar--letters">' + esc(initials(name)) + '</div>';

    return '<div class="gi-card">' +
      '<div class="gi-card-head">' +
        avatar +
        '<div class="gi-card-who">' +
          '<div class="gi-card-name">' +
            '<span class="gi-card-name-text">' + esc(name) + '</span>' +
            '<span class="gi-card-dir" title="' + (isSent ? I('inv.sentLabel') : I('inv.receivedLabel')) + '">' +
            (isSent ? '↗' : '↙') + '</span>' +
          '</div>' +
          '<div class="gi-card-date">' + dateStr + '</div>' +
        '</div>' +
        '<span class="gi-status gi-status--' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      actions +
    '</div>';
  }

  function initials(name) {
    return String(name).split(' ').map(function (p) {
      return p.charAt(0).toUpperCase();
    }).slice(0, 2).join('');
  }

  /** Отдельный экран поверх, устроен как подэкраны профиля. */
  function openScreen(title, contentHtml) {
    var existing = document.getElementById('giListOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'giListOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML =
      '<div class="td-topbar">' +
        '<button class="td-back" id="giListBack">' +
          '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          I('common.back') +
        '</button>' +
        '<span class="td-topbar-title">' + esc(title) + '</span>' +
        '<span style="width:60px"></span>' +
      '</div>' +
      '<div class="prof-sub-content gi-list-content" style="padding:16px">' + contentHtml + '</div>';

    document.getElementById('app').appendChild(overlay);
    setTimeout(function () { overlay.classList.add('open'); }, 20);

    overlay.querySelector('#giListBack').addEventListener('click', function () {
      overlay.classList.remove('open');
      setTimeout(function () { overlay.remove(); }, 300);
    });

    overlay.addEventListener('click', function (e) {
      var acc = e.target.closest('.gi-accept');
      var dec = e.target.closest('.gi-decline');
      var show = e.target.closest('.gi-show');
      if (acc) {
        INV.confirmAccept(acc.dataset.inv, function () { loadList(overlay); });
      } else if (dec) {
        INV.decline(dec.dataset.inv, function () { loadList(overlay); });
      } else if (show) {
        supabaseClient.rpc('get_invite_contacts', { p_invite_id: show.dataset.inv }).then(function (r) {
          if (r.error || (r.data && r.data.error)) {
            window.KSLT_VOPROS.окно({
              title: I('inv.contactsTitle'),
              body: '<p class="gi-text">' + esc((r.error && r.error.message) || (r.data && r.data.error)) + '</p>',
              actions: [{ label: I('inv.close'), primary: true }]
            });
            return;
          }
          INV.showContacts(r.data && r.data.contacts);
        });
      }
    });

    return overlay;
  }

  window.KSLT_INVITES = INV;
})();
