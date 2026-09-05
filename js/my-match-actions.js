// ============================================
// «Мои матчи»: что требует ответа
// ============================================
//
// В кабинете список матчей — это архив: там только сыгранное, с победителем
// и счётом. Матч, который отыграли, но счёт ещё не вписали, туда не попадал
// вовсе: победителя у него нет.
//
// Здесь отдельная полоса над архивом — только то, что ждёт человека прямо
// сейчас: вписать счёт или ответить на вписанный соперником. Пусто — полосы
// нет вовсе, чтобы не занимать место ради пустоты.
//
// Само окно счёта — в js/match-score.js, общее с сеткой турнира.

(function () {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn ? {
        title: 'Needs your answer',
        enter: 'Enter score', confirm: 'Confirm', dispute: 'Not correct',
        entered: 'entered the score', wait: 'waiting for opponent',
        vs: 'vs', noTrn: 'Battle'
    } : isKg ? {
        title: 'Жооп күтөт',
        enter: 'Эсепти жазуу', confirm: 'Ырастоо', dispute: 'Туура эмес',
        entered: 'эсепти жазды', wait: 'каршылашты күтөбүз',
        vs: 'каршы', noTrn: 'Баттл'
    } : {
        title: 'Ждёт вашего ответа',
        enter: 'Вписать счёт', confirm: 'Подтвердить', dispute: 'Не согласен',
        entered: 'вписал счёт', wait: 'ждём соперника',
        vs: 'против', noTrn: 'Баттл'
    };

    document.addEventListener('DOMContentLoaded', function () {
        var попыток = 0;
        var таймер = setInterval(function () {
            попыток++;
            if (document.getElementById('dbGamesMatches')) {
                clearInterval(таймер);
                загрузить();
            } else if (попыток > 40) {
                clearInterval(таймер);   // это не кабинет
            }
        }, 250);
    });

    async function загрузить() {
        var client = window.supabaseClient;
        var MS = window.KSLT_MATCH_SCORE;
        if (!client || !MS) return;

        var pid = await MS.myPlayerIds();
        if (!pid || !pid.length) return;

        var u = await client.auth.getUser();
        var uid = u.data && u.data.user ? u.data.user.id : null;

        // Берём незакрытые: без победителя или ждущие подтверждения
        var res = await client.from('matches')
            .select('id, player1_id, player2_id, winner_id, score, score_status, score_submitted_by, played_at, ' +
                    'tournament:tournaments(title, title_en, title_kg)')
            .or('player1_id.in.(' + pid.join(',') + '),player2_id.in.(' + pid.join(',') + ')')
            .or('winner_id.is.null,score_status.eq.pending');

        if (res.error || !res.data) return;

        var дела = res.data.map(function (m) {
            return { m: m, что: MS.stateOf(m, pid, uid) };
        }).filter(function (x) {
            return x.что === 'enter' || x.что === 'confirm' || x.что === 'wait';
        });

        if (!дела.length) { убрать(); return; }

        var ids = [];
        дела.forEach(function (x) {
            [x.m.player1_id, x.m.player2_id].forEach(function (id) {
                if (id && ids.indexOf(id) === -1) ids.push(id);
            });
        });
        var pl = await client.from('players').select('id, name, name_en, photo').in('id', ids);
        var byId = {};
        (pl.data || []).forEach(function (p) { byId[p.id] = p; });

        нарисовать(дела, byId, pid);
    }

    function нарисовать(дела, byId, pid) {
        убрать();

        var где = document.getElementById('dbGamesMatches');
        if (!где) return;

        var box = document.createElement('div');
        box.className = 'mma-box';
        box.id = 'mmaBox';

        var html = '<div class="mma-title">' + L.title + '</div>';

        дела.forEach(function (x) {
            var m = x.m;
            var мой = pid.indexOf(m.player1_id) !== -1;
            var чужой = мой ? m.player2_id : m.player1_id;
            var соперник = byId[чужой] || {};
            var имя = isEn ? (соперник.name_en || соперник.name || '?') : (соперник.name || '?');

            var т = m.tournament;
            var турнир = т
                ? (isEn ? (т.title_en || т.title) : (isKg ? (т.title_kg || т.title) : т.title))
                : L.noTrn;

            var подпись, кнопки;
            if (x.что === 'confirm') {
                подпись = esc(имя) + ' ' + L.entered + ': <b>' + esc(человечно(m.score)) + '</b>';
                кнопки = '<button class="mma-btn" data-open="' + m.id + '">' + L.confirm + '</button>';
            } else if (x.что === 'wait') {
                подпись = esc(турнир);
                кнопки = '<span class="mma-wait">' + L.wait + '</span>';
            } else {
                подпись = esc(турнир);
                кнопки = '<button class="mma-btn" data-open="' + m.id + '">' + L.enter + '</button>';
            }

            html += '<div class="mma-row">' +
                '<div class="mma-when">' + датой(m.played_at) + '</div>' +
                '<div class="mma-main">' +
                    '<div class="mma-name">' + esc(имя) + '</div>' +
                    '<div class="mma-sub">' + подпись + '</div>' +
                '</div>' + кнопки +
            '</div>';
        });

        box.innerHTML = html;
        где.parentNode.insertBefore(box, где);

        box.querySelectorAll('[data-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                window.KSLT_MATCH_SCORE.open(btn.dataset.open, загрузить);
            });
        });

        // Подраздел «Матчи» мог быть свёрнут — раскрываем, иначе полоса с
        // делами останется невидимой
        var тело = document.getElementById('dbSubMatches');
        var кнопка = document.querySelector('[data-target="dbSubMatches"]');
        if (тело && кнопка && !кнопка.classList.contains('db-subsection-open')) {
            кнопка.click();
        }
    }

    function убрать() {
        var old = document.getElementById('mmaBox');
        if (old) old.remove();
    }

    function человечно(счёт) {
        return String(счёт || '').replace(/\//g, ':').replace(/ /g, ', ');
    }

    function датой(когда) {
        if (!когда) return '—';
        var d = new Date(когда);
        if (isNaN(d.getTime())) return '—';
        var мес = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
                   'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        return d.getDate() + ' ' + мес[d.getMonth()];
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
