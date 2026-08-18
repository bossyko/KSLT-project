// ============================================
// КСЛТ в цифрах — числа берём из базы
//
// Один файл на главную и на «О проекте»: числа там одни и те же,
// а два счётчика однажды разойдутся — это мы уже проходили
// ============================================
//
// Раньше цифры были вписаны в разметку руками и устаревали в тот же день,
// когда кто-то вступал в сообщество. Теперь их считает база.
//
// Одно исключение — турниры. Сообщество живёт с 2021 года, а сайт с 2025-го,
// и всё, что было до сайта, базе неизвестно. Поэтому к живому счёту
// прибавляем архив клуба, а из базы берём только турниры от дня отсечки:
// иначе старый турнир, заведённый задним числом ради истории, посчитался бы
// дважды — и связать это с правкой годичной давности не смог бы никто.

(function() {
    'use strict';

    // Считаем все турниры подряд, без деления на виды. Из письма Айсулуу
    // (август 2026): 120 рейтинговых + 150 дружеских парных + 30 международных.
    //
    // Цифра приблизительная, и вот в чём: она посчитана «с момента создания»,
    // то есть вместе с 2025–2026 годами, а те частью уже лежат в базе и
    // прибавятся ещё раз. Насколько — неизвестно, пока Айсулуу не назовёт
    // число турниров до 2025 года. Тогда заменить здесь.
    var ARCHIVE_TOURNAMENTS = 300;
    var SITE_START = '2025-01-01';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var LOCALE = isEn ? 'en-US' : 'ru-RU';

    var client = window.supabaseClient;
    if (!client) return;

    /**
     * Показать число в карточке.
     *
     * Ноль и недоступная база — разные вещи, и ведём себя с ними по-разному.
     * Нет тренеров — карточку убираем, она ничего не сообщает. База молчит —
     * оставляем прочерк: соврать «ноль тренеров» хуже, чем честно не знать.
     */
    function apply(id, err, value) {
        var el = document.getElementById(id);
        if (!el) return;

        if (err) {
            console.error('[KSLT] цифры, ' + id + ':', err.message || err);
            return;
        }
        if (!value) {
            var card = el.closest('.ip-stat-card, .stat');
            if (card) card.style.display = 'none';
            return;
        }
        el.textContent = value.toLocaleString(LOCALE);
    }

    Promise.all([
        client.from('players').select('id', { count: 'exact', head: true }),
        client.from('profiles').select('id', { count: 'exact', head: true }),
        client.from('tournaments').select('id', { count: 'exact', head: true })
            .eq('status', 'completed').gte('date_start', SITE_START),
        client.from('courts').select('court_types'),
        client.from('coaches').select('id', { count: 'exact', head: true })
    ]).then(function(r) {
        apply('statMembers', r[0].error, r[0].count);
        apply('statUsers', r[1].error, r[1].count);

        // Турниры не прячем никогда: архив клуба сам по себе больше нуля
        apply('statTournaments', r[2].error,
              ARCHIVE_TOURNAMENTS + (r[2].count || 0));

        // Считаем корты, а не площадки: у одного клуба их несколько.
        // Так же устроен счётчик на главной
        var courts = null;
        if (r[3].data) {
            courts = 0;
            r[3].data.forEach(function(row) {
                (row.court_types || []).forEach(function(ct) {
                    courts += (ct.count || 0);
                });
            });
        }
        apply('statCourts', r[3].error, courts);

        apply('statCoaches', r[4].error, r[4].count);
    });
})();
