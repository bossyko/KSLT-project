// ============================================
// Главная — блок «Найди партнёра по игре»
// ============================================
//
// Данные те же, что на странице поиска: функция get_public_partners плюс
// рейтинговые поля из карточки игрока. Раньше здесь лежали восемь карточек,
// вписанных в разметку руками, — с выдуманными именами, адресами кортов и
// временем игры. Ни места, ни времени в базе нет и не было.
//
// Порядок случайный при каждой загрузке: иначе одни и те же люди получали бы
// всё внимание, а остальных будто нет.
//
// На главную берём только тех, у кого есть фотография: это витрина
// сообщества. Если таких меньше десяти — добираем остальными, пустой блок
// хуже.

(function() {
    'use strict';

    var section = document.getElementById('players');
    if (!section) return;

    var grid = document.getElementById('homePartners');
    if (!grid) return;

    var client = window.supabaseClient;
    if (!client) return;

    var SHOW = 10;         // два ряда по пять
    var GUEST_CLEAR = 5;   // гостю чётко видны первые пять

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn
        ? { invite: 'Invite', wins: 'wins', losses: 'losses', empty: 'No players yet',
            pairs: 'Doubles', mixed: 'Mixed' }
        : (isKg
            ? { invite: 'Чакыруу', wins: 'жеңиш', losses: 'жеңилүү', empty: 'Оюнчулар жок',
                pairs: 'Жуптук', mixed: 'Аралаш' }
            : { invite: 'Пригласить', wins: 'побед', losses: 'поражений', empty: 'Игроков пока нет',
                pairs: 'Пара', mixed: 'Микст' });

    var playerPage = isEn ? 'pages/player-en.html' : (isKg ? 'pages/player-kg.html' : 'pages/player.html');

    start();

    async function start() {
        try {
            var res = await client.rpc('get_public_partners');
            if (res.error) {
                console.error('[KSLT] партнёры не загружены:', res.error.message || res.error);
                grid.innerHTML = '<div class="pg-empty">' + L.empty + '</div>';
                return;
            }

            var list = res.data || [];
            if (!list.length) {
                grid.innerHTML = '<div class="pg-empty">' + L.empty + '</div>';
                return;
            }

            // Рейтинговые поля лежат в карточке игрока: NTRP, победы, форма
            var ids = list.map(function(p) { return p.id; });
            var stats = await client.from('players')
                .select('id, ntrp_rating, wins, losses, form, doubles_wins, doubles_losses, mixed_wins, mixed_losses')
                .in('id', ids);

            var byId = {};
            (stats.data || []).forEach(function(p) { byId[p.id] = p; });
            list.forEach(function(p) {
                var s = byId[p.id] || {};
                p.ntrp_rating = s.ntrp_rating || null;
                p.wins = s.wins || 0;
                p.losses = s.losses || 0;
                p.form = s.form || [];
                p.doubles_wins = s.doubles_wins || 0;
                p.doubles_losses = s.doubles_losses || 0;
                p.mixed_wins = s.mixed_wins || 0;
                p.mixed_losses = s.mixed_losses || 0;
            });

            var withPhoto = list.filter(function(p) { return !!p.avatar_url; });
            var pool = withPhoto.length >= SHOW ? withPhoto : list;

            var picked = shuffle(pool).slice(0, SHOW);
            var guest = isGuest();

            grid.innerHTML = picked.map(function(p, i) { return card(p, i, guest); }).join('');
            bindClicks(guest);
        } catch (e) {
            console.error('[KSLT] партнёры:', e);
            grid.innerHTML = '<div class="pg-empty">' + L.empty + '</div>';
        }
    }

    function isGuest() {
        try {
            var raw = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');
            if (!raw) return true;
            var s = JSON.parse(raw);
            return !(s && s.access_token && s.expires_at > Math.floor(Date.now() / 1000));
        } catch (e) { return true; }
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function online(p) {
        if (!p.last_seen) return false;
        return Date.now() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;
    }

    function shortName(name) {
        var parts = String(name || '').trim().split(/\s+/);
        if (parts.length < 2) return parts[0] || '';
        return parts[0] + ' ' + parts[1].charAt(0) + '.';
    }

    function initials(name) {
        var parts = String(name || '').trim().split(/\s+/);
        return ((parts[0] || '')[0] || '?').toUpperCase() +
               ((parts[1] || '')[0] || '').toUpperCase();
    }

    function formHtml(form) {
        if (!form || !form.length) return '<div class="pg-form"></div>';
        var out = '<div class="pg-form">';
        for (var i = 0; i < form.length; i++) {
            out += '<i class="' + (form[i] === 'W' ? 'w' : 'l') + '"></i>';
        }
        return out + '</div>';
    }

    /**
     * Парные игры короткой строкой: «Пара 10/3 · Микст 3/0».
     *
     * Основная строка выше — рейтинговая, одиночная. Эта про то, чего в ней
     * нет. Показываем только тем, кто в парах играл: у остальных строки
     * нет вовсе, карточка выглядит как раньше.
     */
    function pairsHtml(p) {
        var out = '';
        if ((p.doubles_wins || 0) + (p.doubles_losses || 0) > 0) {
            out += '<span class="pp-dbl">' + L.pairs + ' ' + p.doubles_wins + '/' + p.doubles_losses + '</span>';
        }
        if ((p.mixed_wins || 0) + (p.mixed_losses || 0) > 0) {
            out += '<span class="pp-mix">' + L.mixed + ' ' + p.mixed_wins + '/' + p.mixed_losses + '</span>';
        }
        return out ? '<div class="pg-pairs">' + out + '</div>' : '';
    }

    function card(p, i, guest) {
        var blur = '';
        if (guest && i >= GUEST_CLEAR) {
            blur = ' pt-card-blur pt-card-blur-' + Math.min(i - GUEST_CLEAR + 1, 4);
        }

        var name = guest ? shortName(p.full_name) : (p.full_name || '');
        var cat = isEn ? (p.category_name_en || p.category_name) : p.category_name;
        var isOnline = online(p);

        return '<div class="pt-card' + blur + '"' +
                (guest ? '' : ' data-player-id="' + esc(p.id) + '"') + '>' +
            (p.ntrp_rating
                ? '<div class="pt-ntrp-badge">NTRP ' + Number(p.ntrp_rating).toFixed(1) + '</div>'
                : '') +
            '<div class="pt-avatar-wrap">' +
                (p.avatar_url
                    ? '<img class="pt-avatar" src="' + esc(p.avatar_url) + '" alt="" loading="lazy">'
                    : '<div class="pt-avatar-placeholder">' + esc(initials(p.full_name)) + '</div>') +
                (isOnline ? '<div class="pt-online-dot"></div>' : '') +
            '</div>' +
            '<div class="pt-name">' + esc(name) + '</div>' +
            (cat ? '<div class="pt-category">' + esc(cat) + '</div>' : '') +
            formHtml(p.form) +
            '<div class="pg-record">' + p.wins + ' ' + L.wins + ' · ' + p.losses + ' ' + L.losses + '</div>' +
            pairsHtml(p) +
            '<button class="pt-invite-btn" type="button">' + L.invite + '</button>' +
        '</div>';
    }

    /** Клик по карточке — на страницу игрока. Гостю она закрыта. */
    function bindClicks(guest) {
        grid.addEventListener('click', function(e) {
            var card = e.target.closest('.pt-card');
            if (!card) return;

            var invite = e.target.closest('.pt-invite-btn');
            var id = card.getAttribute('data-player-id');

            if (guest || !id) {
                // Гостю показываем то же окно, что и в других местах сайта
                var auth = isEn ? 'pages/auth-en.html' : (isKg ? 'pages/auth-kg.html' : 'pages/auth.html');
                window.location.href = auth;
                return;
            }
            if (invite) {
                window.location.href = (isEn ? 'pages/partners-en.html'
                    : (isKg ? 'pages/partners-kg.html' : 'pages/partners.html')) + '?invite=' + encodeURIComponent(id);
                return;
            }
            window.location.href = playerPage + '?id=' + encodeURIComponent(id);
        });
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
