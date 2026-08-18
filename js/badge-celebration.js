// ============================================
// Поздравление с достижением
// ============================================
//
// Игрок заходит на сайт — и если с прошлого раза что-то заработал, ему это
// показывают. Один раз: отметку о показе ставит база, поэтому неважно, где он
// открыл первым, на сайте или в приложении. Второй раз не всплывёт.
//
// Отметку игрок не пишет напрямую — таблица достижений ему на запись закрыта,
// иначе он мог бы подправить себе дату получения. Для этого есть функция
// mark_badges_seen(), она трогает только его записи.

(function() {
    'use strict';

    var client = window.supabaseClient;
    if (!client) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn
        ? { kicker: 'New achievement', next: 'Next', done: 'Great', left: 'more to go: ' }
        : (isKg
            ? { kicker: 'Жаңы жетишкендик', next: 'Кийинки', done: 'Сонун', left: 'дагы калды: ' }
            : { kicker: 'Новое достижение', next: 'Дальше', done: 'Отлично', left: 'осталось ещё ' });

    var queue = [];
    var overlay = null;

    start();

    async function start() {
        try {
            var userRes = await client.auth.getUser();
            var user = userRes.data && userRes.data.user;
            if (!user) return;

            var prof = await client.from('profiles').select('player_id').eq('id', user.id).single();
            if (prof.error || !prof.data || !prof.data.player_id) return;

            var res = await client.from('player_badges')
                .select('badge_id, earned_at, badge:badge_definitions(icon, name, name_en, name_kg, ' +
                        'description, description_en, description_kg, sort_order)')
                .eq('player_id', prof.data.player_id)
                .is('seen_at', null);

            if (res.error) {
                // Молча пропустить нельзя: человек так и не узнает, что что-то
                // заработал, а мы не узнаем, что поздравление не работает
                console.error('[KSLT] достижения не проверены:', res.error.message || res.error);
                return;
            }

            queue = (res.data || [])
                .filter(function(r) { return r.badge; })
                .sort(function(a, b) { return (a.badge.sort_order || 0) - (b.badge.sort_order || 0); });

            if (!queue.length) return;

            build();
            next();

            // Отметку ставим сразу, а не после просмотра: человек может закрыть
            // вкладку на середине, и тогда при каждом входе его встречало бы
            // одно и то же поздравление
            var mark = await client.rpc('mark_badges_seen');
            if (mark.error) console.error('[KSLT] отметка о показе не сохранена:', mark.error.message);
        } catch (e) {
            console.error('[KSLT] поздравление:', e);
        }
    }

    function build() {
        overlay = document.createElement('div');
        overlay.className = 'ach-overlay';
        overlay.innerHTML = '<div class="ach-card"></div>';
        document.body.appendChild(overlay);
    }

    function next() {
        if (!queue.length) { overlay.classList.remove('show'); return; }

        var b = queue.shift().badge;
        var left = queue.length;
        var name = isEn ? (b.name_en || b.name) : (isKg ? (b.name_kg || b.name) : b.name);
        var desc = isEn ? (b.description_en || b.description)
                        : (isKg ? (b.description_kg || b.description) : b.description);

        overlay.querySelector('.ach-card').innerHTML =
            '<div class="ach-fx balls">' + balls(26) + '</div>' +
            '<div class="ach-halo"></div>' +
            '<div class="ach-kicker">' + L.kicker + '</div>' +
            '<div class="ach-emoji">' + (b.icon || '🏅') + '</div>' +
            '<div class="ach-name"></div>' +
            '<div class="ach-desc"></div>' +
            '<button class="ach-btn" type="button">' + (left ? L.next : L.done) + '</button>' +
            (left ? '<div class="ach-count">' + L.left + left + '</div>' : '');

        // Название и описание вставляем текстом, а не разметкой: они приходят
        // из базы, и однажды туда попадёт что-нибудь с угловой скобкой
        overlay.querySelector('.ach-name').textContent = name || '';
        overlay.querySelector('.ach-desc').textContent = desc || '';
        overlay.querySelector('.ach-btn').addEventListener('click', next);

        overlay.classList.remove('show');
        void overlay.offsetWidth;   // перезапуск анимации
        overlay.classList.add('show');
    }

    /** Падающие теннисные мячи — вместо конфетти. */
    function balls(n) {
        var out = '';
        for (var i = 0; i < n; i++) {
            out += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;' +
                   'animation-duration:' + (1.2 + Math.random() * 0.9).toFixed(2) + 's;' +
                   'animation-delay:' + (Math.random() * 0.4).toFixed(2) + 's"></i>';
        }
        return out;
    }
})();
