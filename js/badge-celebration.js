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


    var L = KSLT_YAZYK.выбрать({ kicker: 'New achievement', next: 'Next', done: 'Great', left: 'more to go: ' }, { kicker: 'Жаңы жетишкендик', next: 'Кийинки', done: 'Сонун', left: 'дагы калды: ' }, { kicker: 'Новое достижение', next: 'Дальше', done: 'Отлично', left: 'осталось ещё ' });

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

            /* ЧТЕНИЕ ОЧЕРЕДИ И ОТМЕТКА — В ОБЩЕМ ДОМЕ
               `js/kslt-pozdravlenie.js` (шаг A3.7б, 29.10). Здесь
               остаётся только ДОБЫЧА playerId: сайт берёт его сам, а
               приложение получает снаружи — это строение запуска, и оно
               законно разное. */
            queue = await KSLT_POZDRAVLENIE.очередь(client, prof.data.player_id);
            if (!queue.length) return;

            build();
            next();
            await KSLT_POZDRAVLENIE.пометить(client);
        } catch (e) {
            console.error('[KSLT] поздравление:', e);
        }
    }

    function build() {
        overlay = KSLT_POZDRAVLENIE.оболочка(document);
    }

    function next() {
        if (!queue.length) {
            /* ПОСЛЕДНЕЕ ПОЗДРАВЛЕНИЕ ЗАКРЫВАЕТ ОКНО — здесь и снимается
               оснастка (кусок 156). */
            if (overlay.__ksltСнять) { overlay.__ksltСнять(); overlay.__ksltСнять = null; }
            overlay.classList.remove('show');
            return;
        }

        var b = queue.shift().badge;
        var left = queue.length;

        overlay.querySelector('.ach-card').innerHTML =
            KSLT_POZDRAVLENIE.карточка(b, left,
                { шапка: L.kicker, дальше: L.next, готово: L.done, осталось: L.left },
                balls);

        // Название и описание вставляем текстом, а не разметкой: они приходят
        // из базы, и однажды туда попадёт что-нибудь с угловой скобкой
        KSLT_POZDRAVLENIE.назвать(overlay.querySelector('.ach-card'), b,
            function (значок, основа) {
                return KSLT_YAZYK.выбрать(
                    значок[основа + '_en'] || значок[основа],
                    значок[основа + '_kg'] || значок[основа],
                    значок[основа]);
            });
        overlay.querySelector('.ach-btn').addEventListener('click', next);

        overlay.classList.remove('show');
        void overlay.offsetWidth;   // перезапуск анимации
        overlay.classList.add('show');

        /* ОСНАСТКА ОКНА — ДОМ (кусок 156). ОДИН РАЗ НА ОЧЕРЕДЬ, А НЕ НА
           КАЖДЫЙ БЕЙДЖ: окно одно, меняется только его содержимое, и
           запирание идемпотентно по корню — но возврат фокуса иначе
           запомнил бы кнопку «Дальше» самого окна вместо того места, откуда
           человек пришёл. */
        if (!overlay.__ksltСнять) {
            overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, {
                поEsc: function () {
                    /* Поздравление — не спрос: Escape закрывает всю очередь. */
                    queue.length = 0;
                    next();
                }
            });
        }
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
