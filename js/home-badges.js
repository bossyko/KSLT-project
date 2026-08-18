// ============================================
// Главная — перебивка «Играй. Расти. Собирай достижения»
// ============================================
//
// Список достижений берём из базы, а не из разметки. Раньше он был вписан в
// index.html руками — и жил своей жизнью: в базе шесть, на главной двадцать
// семь, причём таких, которых никто не мог получить.
//
// Показываем двенадцать: шесть в первом ряду и шесть во втором, уходящем в
// туман. Вошедшему игроку сначала показываем его собственные — приятно
// увидеть своё, — потом закрытые.
//
// Запасной список на случай, если база не ответит: пустая перебивка выглядит
// как поломка вёрстки.

(function() {
    'use strict';

    var el = document.getElementById('badgesCtaCards');
    if (!el) return;

    var locked = document.getElementById('badgesCtaLocked');
    var btn = document.getElementById('badgesCtaBtn');
    var desc = document.getElementById('badgesCtaDesc');
    var client = window.supabaseClient;

    var PER_ROW = 6;
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn
        ? { desc: 'Play in tournaments and earn awards', btn: 'My badges' }
        : (isKg
            ? { desc: 'Мелдештерде ойноп, сыйлыктарга ээ бол', btn: 'Менин белгилерим' }
            : { desc: 'Играй в турнирах и получай награды за достижения', btn: 'Мои бейджи' });

    // Запасной набор — только то, что точно заведено в базе
    var FALLBACK = isEn ? [
        { e: '🎾', n: 'First match',  d: 'Play your first match' },
        { e: '🥇', n: 'First win',    d: 'Win your first match' },
        { e: '🔟', n: 'Ten',          d: 'Play 10 matches' },
        { e: '🏆', n: 'Champion',     d: 'Win a tournament' },
        { e: '🥈', n: 'Finalist',     d: 'Reach a final' },
        { e: '💚', n: 'KSLT member',  d: 'Active membership' }
    ] : isKg ? [
        { e: '🎾', n: 'Биринчи матч',  d: 'Биринчи оюнуңду ойно' },
        { e: '🥇', n: 'Биринчи жеңиш', d: 'Биринчи матчты утуп ал' },
        { e: '🔟', n: 'Ондук',         d: '10 матч ойно' },
        { e: '🏆', n: 'Чемпион',       d: 'Мелдешти утуп ал' },
        { e: '🥈', n: 'Финалист',      d: 'Финалга чык' },
        { e: '💚', n: 'КСЛТ мүчөсү',   d: 'Активдүү мүчөлүк' }
    ] : [
        { e: '🎾', n: 'Первый матч',   d: 'Сыграй свой первый матч' },
        { e: '🥇', n: 'Первая победа', d: 'Выиграй первый матч' },
        { e: '🔟', n: 'Десятка',       d: 'Сыграй 10 матчей' },
        { e: '🏆', n: 'Чемпион',       d: 'Выиграй турнир' },
        { e: '🥈', n: 'Финалист',      d: 'Дойди до финала' },
        { e: '💚', n: 'Член КСЛТ',     d: 'Действующее членство' }
    ];

    start();

    async function start() {
        if (!client) { fill(FALLBACK); return; }

        try {
            var defsRes = await client.from('badge_definitions')
                .select('id, icon, name, name_en, name_kg, description, description_en, description_kg')
                .order('sort_order');

            if (defsRes.error || !defsRes.data || !defsRes.data.length) {
                if (defsRes.error) {
                    console.error('[KSLT] достижения не загружены:', defsRes.error.message || defsRes.error);
                }
                fill(FALLBACK);
                return;
            }

            var list = defsRes.data.map(map);
            var earned = await loadEarned();

            if (earned) {
                // Свои — вперёд, остальные следом
                list.sort(function(a, b) {
                    return (earned[b.id] ? 1 : 0) - (earned[a.id] ? 1 : 0);
                });
                list.forEach(function(b) { b.locked = !earned[b.id]; });

                if (desc) desc.textContent = L.desc;
                if (btn) {
                    btn.href = (isEn ? 'pages/dashboard-en.html'
                                     : (isKg ? 'pages/dashboard-kg.html' : 'pages/dashboard.html'));
                    btn.textContent = L.btn;
                }
            }

            fill(list);
        } catch (e) {
            console.error('[KSLT] достижения:', e);
            fill(FALLBACK);
        }
    }

    /** Заработанные текущим игроком. null — гость или не удалось узнать. */
    async function loadEarned() {
        try {
            var userRes = await client.auth.getUser();
            var user = userRes.data && userRes.data.user;
            if (!user) return null;

            var prof = await client.from('profiles').select('player_id').eq('id', user.id).single();
            if (prof.error || !prof.data || !prof.data.player_id) return null;

            var res = await client.from('player_badges')
                .select('badge_id').eq('player_id', prof.data.player_id);
            if (res.error) return null;

            var set = {};
            (res.data || []).forEach(function(b) { set[b.badge_id] = true; });
            return set;
        } catch (e) {
            return null;
        }
    }

    function map(b) {
        return {
            id: b.id,
            e: b.icon || '🏅',
            n: isEn ? (b.name_en || b.name) : (isKg ? (b.name_kg || b.name) : b.name),
            d: isEn ? (b.description_en || b.description)
                    : (isKg ? (b.description_kg || b.description) : b.description),
            locked: false
        };
    }

    function fill(list) {
        el.innerHTML = list.slice(0, PER_ROW).map(card).join('');
        if (!locked) return;
        var rest = list.slice(PER_ROW, PER_ROW * 2);
        locked.innerHTML = rest.map(card).join('');
        locked.style.display = rest.length ? '' : 'none';
    }

    function card(b) {
        var div = document.createElement('div');
        div.className = 'badge-cta-card' + (b.locked ? ' locked' : '');

        var icon = document.createElement('span');
        icon.className = 'badge-cta-emoji';
        icon.textContent = b.e;

        var name = document.createElement('span');
        name.className = 'badge-cta-name';
        name.textContent = b.n || '';

        var text = document.createElement('span');
        text.className = 'badge-cta-desc';
        text.textContent = b.d || '';

        div.appendChild(icon);
        div.appendChild(name);
        div.appendChild(text);
        return div.outerHTML;
    }
})();
