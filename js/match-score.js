// ============================================
// Счёт матча: вписывают сами игроки
// ============================================
//
// Счёт до сих пор попадал в базу одним путём — менеджер спрашивал его у
// игроков и вбивал руками. На корте из-за этого задержки, а в турнире, где
// играют три месяца по своей договорённости, результаты уходят в чат и
// теряются там совсем.
//
// Здесь второй путь: вписывает один из двоих, второй подтверждает. Сутки
// молчания — счёт принимается сам, иначе половина матчей повиснет. Не
// согласен — матч уходит организатору.
//
// Окно одно на все места: сетка турнира, «Мои матчи» в кабинете и переход
// из уведомления зовут его же. Проверки — в базе: она не пустит чужого в
// чужой матч и посчитает победителя из сетов сама.

(function () {
    'use strict';

    var MS = {};
    window.KSLT_MATCH_SCORE = MS;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    // Надписи — из общего файла js/match-score-texts.js: они одни на сайт и
    // приложение, вид у каждого свой
    var L = window.KSLT_SCORE_TEXTS
        ? window.KSLT_SCORE_TEXTS.of(isEn ? 'en' : (isKg ? 'kg' : 'ru'))
        : {};

    var _myPlayerId = null;
    var _myIds = null;
    var _loaded = false;
    var _busy = false;

    /** Своя карточка игрока. Считаем один раз за жизнь страницы. */
    MS.myPlayerId = async function () {
        if (_loaded) return _myPlayerId;
        _loaded = true;
        var client = window.supabaseClient;
        if (!client) return null;
        try {
            var res = await client.auth.getUser();
            var user = res.data && res.data.user;
            if (!user) return null;
            var pr = await client.from('profiles').select('player_id').eq('id', user.id).single();
            _myPlayerId = (pr.data && pr.data.player_id) || null;
        } catch (e) {}
        return _myPlayerId;
    };

    /**
     * Все карточки, за которые человек отвечает: своя и капитаны тех пар,
     * где он напарник.
     *
     * В парном турнире в записи матча стоит капитан. Без этого списка
     * напарник не увидел бы ни своей пары в сетке, ни кнопки.
     */
    MS.myPlayerIds = async function () {
        if (_myIds) return _myIds;
        var pid = await MS.myPlayerId();
        if (!pid) { _myIds = []; return _myIds; }

        _myIds = [pid];
        try {
            var r = await window.supabaseClient.from('tournament_registrations')
                .select('player_id')
                .eq('partner_id', pid)
                .in('status', ['approved', 'draw']);
            (r.data || []).forEach(function (x) {
                if (x.player_id && _myIds.indexOf(x.player_id) === -1) _myIds.push(x.player_id);
            });
        } catch (e) {}
        return _myIds;
    };

    /**
     * Что показывать по этому матчу вошедшему.
     *
     * Само правило живёт в своде js/kslt-rules.js — оно одно на сайт и
     * приложение, и сверяется проверкой общих файлов.
     */
    MS.stateOf = function (match, myPlayerId, myUserId) {
        var R = window.KSLT_RULES;
        return R ? R.matchScoreState(match, myPlayerId, myUserId) : 'none';
    };

    /** Открыть окно по номеру матча — само решит, вписывать или подтверждать. */
    MS.open = async function (matchId, onDone) {
        var client = window.supabaseClient;
        if (!client) return;

        var overlay = shell(L.loading, '<div class="ms-loading">' + L.loading + '</div>');

        var pid = await MS.myPlayerIds();
        var userRes = await client.auth.getUser();
        var userId = userRes.data && userRes.data.user ? userRes.data.user.id : null;

        var res = await client.from('matches')
            .select('*, tournament:tournaments(id, title, title_en, title_kg, set_format)')
            .eq('id', matchId).single();

        if (res.error || !res.data) { close(overlay); return; }
        var m = res.data;

        var ids = [m.player1_id, m.player2_id].filter(Boolean);
        var pl = await client.from('players').select('id, name, name_en, photo').in('id', ids);
        var byId = {};
        (pl.data || []).forEach(function (p) { byId[p.id] = p; });

        var состояние = MS.stateOf(m, pid, userId);
        if (состояние === 'none' || состояние === 'done' || состояние === 'wait') {
            close(overlay);
            // Молчать нельзя: человек нажал и ждёт ответа. Чаще всего это
            // пара — напарник успел раньше, и делать уже нечего
            if (состояние === 'none') toast(L.errNotPlayer, 'error');
            else if (состояние === 'done') toast(L.alreadyDone, 'info');
            else toast(L.alreadySent, 'info');
            if (typeof onDone === 'function') onDone();
            return;
        }

        close(overlay);
        if (состояние === 'confirm') buildConfirm(m, byId, onDone);
        else buildEnter(m, byId, onDone);
    };

    // ---- Окно ввода ----

    function buildEnter(m, byId, onDone) {
        var trn = m.tournament || {};
        var сетов = (trn.set_format === 'short') ? 2 : 3;
        var сегодня = (m.played_at ? new Date(m.played_at) : new Date());

        var шапки = '';
        for (var i = 1; i <= сетов; i++) шапки += '<th>' + L.set + ' ' + i + '</th>';

        var строка = function (id, номер) {
            var p = byId[id] || {};
            var имя = isEn ? (p.name_en || p.name || '?') : (p.name || '?');
            var поля = '';
            for (var i = 1; i <= сетов; i++) {
                поля += '<td class="ms-cell"><input class="ms-in" id="ms' + номер + 's' + i +
                        '" inputmode="numeric" maxlength="2" autocomplete="off"></td>';
            }
            return '<tr><td>' + фото(p, имя) + '</td>' + поля + '</tr>';
        };

        var тело =
            '<div class="ms-trn">' + esc(имяТурнира(trn)) + '</div>' +
            пара(m, byId) +
            '<div class="ms-when"><span>' + L.date + '</span>' +
                '<input type="date" class="ms-date" id="msDate" value="' + датой(сегодня) + '"></div>' +
            '<table class="ms-table"><thead><tr><th>' + L.player + '</th>' + шапки + '</tr></thead>' +
            '<tbody>' + строка(m.player1_id, 1) + строка(m.player2_id, 2) + '</tbody></table>' +
            '<div class="ms-hint">' + L.hint + '</div>' +
            '<button class="ms-send" id="msSend">' + L.send + '</button>';

        var overlay = shell(L.titleEnter, тело);

        overlay.querySelector('#msSend').addEventListener('click', function () {
            отправить(m, сетов, overlay, onDone);
        });
    }

    async function отправить(m, сетов, overlay, onDone) {
        if (_busy) return;
        var пары = [];
        for (var i = 1; i <= сетов; i++) пары.push([поле('ms1s' + i), поле('ms2s' + i)]);

        var собран = window.KSLT_RULES.buildScore(пары);
        if (!собран.ok) { toast(L.errBad, 'error'); return; }

        _busy = true;
        var btn = overlay.querySelector('#msSend');
        if (btn) btn.disabled = true;
        try {
            var res = await window.supabaseClient.rpc('submit_match_score', {
                p_match_id: m.id,
                p_score: собран.score,
                p_played_at: поле('msDate') || null
            });
            _busy = false;
            if (btn) btn.disabled = false;
            if (res.error) { toast(L.err, 'error'); return; }
            var d = res.data || {};
            if (!d.ok) { toast(ошибка(d.error), 'error'); return; }
            close(overlay);
            toast(L.sent, 'success');
            if (typeof onDone === 'function') onDone();
        } catch (e) {
            _busy = false;
            if (btn) btn.disabled = false;
            toast(L.err, 'error');
        }
    }

    // ---- Окно подтверждения ----

    function buildConfirm(m, byId, onDone) {
        var trn = m.tournament || {};
        var кто = byId[m.player1_id] || {};
        var имя = isEn ? (кто.name_en || кто.name || '') : (кто.name || '');

        // Исход крупно: подтверждающий не должен вычислять в уме, где его геймы
        var выиграл = (_myIds || [_myPlayerId]).indexOf(m.winner_id) !== -1;

        var тело =
            '<div class="ms-trn">' + esc(имяТурнира(trn)) + '</div>' +
            пара(m, byId) +
            '<div class="ms-outcome ' + (выиграл ? 'ms-won' : 'ms-lost') + '">' +
                (выиграл ? L.youWon : L.youLost) + '</div>' +
            '<div class="ms-score-big">' + esc(человечно(m.score)) + '</div>' +
            '<div class="ms-hint ms-hint-center">' + esc(имя) + ' ' + L.confirmText + '<br>' + L.autoNote + '</div>' +
            '<div class="ms-row2">' +
                '<button class="ms-send" id="msYes">' + L.confirm + '</button>' +
                '<button class="ms-send ms-ghost" id="msNo">' + L.dispute + '</button>' +
            '</div>';

        var overlay = shell(L.titleConfirm, тело);

        overlay.querySelector('#msYes').addEventListener('click', function () {
            ответить('confirm_match_score', { p_match_id: m.id }, L.confirmed, overlay, onDone);
        });
        overlay.querySelector('#msNo').addEventListener('click', function () {
            ответить('dispute_match_score', { p_match_id: m.id }, L.disputed, overlay, onDone);
        });
    }

    async function ответить(функция, аргументы, сообщение, overlay, onDone) {
        if (_busy) return;
        _busy = true;
        try {
            var res = await window.supabaseClient.rpc(функция, аргументы);
            _busy = false;
            if (res.error || !res.data || !res.data.ok) {
                toast(res.data ? ошибка(res.data.error) : L.err, 'error');
                return;
            }
            close(overlay);
            toast(сообщение, 'success');
            if (typeof onDone === 'function') onDone();
        } catch (e) {
            _busy = false;
            toast(L.err, 'error');
        }
    }

    // ---- Мелочи ----

    function ошибка(код) {
        if (код === 'own_score') return L.errOwn;
        if (код === 'already_final') return L.errFinal;
        if (код === 'not_a_player') return L.errNotPlayer;
        if (код === 'no_winner') return L.errNoWinner;
        if (код === 'tied_set' || код === 'bad_score' || код === 'empty_score') return L.errBad;
        return L.err;
    }

    function имяТурнира(t) {
        if (!t) return '';
        return isEn ? (t.title_en || t.title || '') : (isKg ? (t.title_kg || t.title || '') : (t.title || ''));
    }

    function пара(m, byId) {
        var a = byId[m.player1_id] || {}, b = byId[m.player2_id] || {};
        var имяA = isEn ? (a.name_en || a.name || '?') : (a.name || '?');
        var имяB = isEn ? (b.name_en || b.name || '?') : (b.name || '?');
        return '<div class="ms-vs">' + аватар(a) + '<b>' + esc(имяA) + '</b>' +
               '<span>VS</span><b>' + esc(имяB) + '</b>' + аватар(b) + '</div>';
    }

    function аватар(p) {
        return p.photo
            ? '<img src="' + esc(p.photo) + '" alt="">'
            : '<i class="ms-noface">' + esc(инициалы(p.name || '?')) + '</i>';
    }

    function фото(p, имя) {
        return '<div class="ms-p">' + аватар(p) + esc(коротко(имя)) + '</div>';
    }

    function инициалы(имя) {
        var ч = String(имя).trim().split(/\s+/);
        return ((ч[0] || '')[0] || '?').toUpperCase();
    }

    /** В таблице счёта места мало: показываем фамилию. */
    function коротко(имя) {
        var ч = String(имя).trim().split(/\s+/);
        return ч.length > 1 ? ч[ч.length - 1] : ч[0];
    }

    /** «6/3 6/4» человеку привычнее читать через двоеточие. */
    function человечно(счёт) {
        return String(счёт || '').replace(/\//g, ':').replace(/ /g, ', ');
    }

    function датой(d) {
        var м = ('0' + (d.getMonth() + 1)).slice(-2), дн = ('0' + d.getDate()).slice(-2);
        return d.getFullYear() + '-' + м + '-' + дн;
    }

    function поле(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function shell(заголовок, тело) {
        var old = document.querySelector('.ms-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay ms-overlay visible';
        overlay.innerHTML =
            '<div class="pt-modal ms-modal">' +
                '<div class="ms-head">' +
                    '<span class="ms-title">' + заголовок + '</span>' +
                    '<button class="ms-close" type="button">&times;</button>' +
                '</div>' +
                '<div class="ms-body">' + тело + '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.querySelector('.ms-close').addEventListener('click', function () { close(overlay); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(overlay); });
        return overlay;
    }

    function close(overlay) { if (overlay) overlay.remove(); }

    /** Уведомление — то же, что у приглашений: одно на весь сайт. */
    function toast(текст, вид) {
        var old = document.querySelector('.pt-toast');
        if (old) old.remove();
        var t = document.createElement('div');
        t.className = 'pt-toast' + (вид ? ' ' + вид : '');
        t.textContent = текст;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('visible'); });
        setTimeout(function () {
            t.classList.remove('visible');
            setTimeout(function () { t.remove(); }, 300);
        }, 3000);
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
