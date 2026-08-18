// ============================================
// Главная — блок «Ближайшие турниры»
// ============================================
//
// Раньше здесь лежали четыре карточки, вписанные в разметку руками, с
// выдуманными названиями и датами. Они не менялись никогда.
//
// Порядок показа (как договорились с Costa):
//   1. Идёт сейчас — в большую карточку
//   2. Если идут два и больше — остальные сразу за ней
//   3. Регистрация открыта
//   4. Предстоящие по возрастанию даты
//   5. При равных датах — кто раньше заведён в базу
//   6. Если впереди нет ничего — последний завершённый

(function() {
    'use strict';

    var GRID_ID = 'homeTournaments';
    var LIMIT = 6;

    var grid = document.getElementById(GRID_ID);
    if (!grid) return;

    var client = window.supabaseClient;
    var TC = window.KSLT_TCARD;
    if (!client || !TC) return;

    var ORDER = { live: 0, open: 1, soon: 2, closed: 3, done: 4, cancelled: 9 };

    client.from('tournaments')
        .select('id, title, title_en, title_kg, description, description_en, description_kg, ' +
                'date_start, date_end, registration_start, registration_end, image, ' +
                'category_id, max_participants, location, location_en, status, start_time, ' +
                'published_at, created_at')
        .order('date_start', { ascending: true })
        .then(function(res) {
            if (res.error) {
                // База недоступна — это не «турниров нет». Раздел оставляем на
                // месте: убрать его целиком значит показать человеку дыру в
                // странице и сделать вид, что так и задумано
                console.error('[KSLT] турниры на главной не загружены:', res.error.message || res.error);
                showNotice();
                return;
            }

            var all = (res.data || []).filter(function(t) {
                return t.published_at !== null && TC.status(t) !== 'cancelled';
            });

            var picked = pick(all);
            if (!picked.length) { hideSection(); return; }

            grid.innerHTML = picked.map(function(t, i) {
                return TC.render(t, { featured: i === 0 });
            }).join('');
            TC.startTicker();
        });

    /** Отбираем шесть по договорённому порядку. */
    function pick(all) {
        var future = all.filter(function(t) { return TC.status(t) !== 'done'; });

        if (!future.length) {
            // Впереди пусто — показываем последний сыгранный
            var done = all.filter(function(t) { return TC.status(t) === 'done'; })
                .sort(function(a, b) { return (b.date_end || '').localeCompare(a.date_end || ''); });
            return done.slice(0, 1);
        }

        future.sort(function(a, b) {
            var d = ORDER[TC.status(a)] - ORDER[TC.status(b)];
            if (d) return d;
            d = (a.date_start || '').localeCompare(b.date_start || '');
            if (d) return d;
            // Даты совпали — первым идёт тот, кого раньше завели в базу
            return (a.created_at || '').localeCompare(b.created_at || '');
        });

        return future.slice(0, LIMIT);
    }

    /** Турниров нет вовсе — заголовку не о чем говорить, прячем раздел. */
    function hideSection() {
        var section = grid.closest('section');
        if (section) section.style.display = 'none';
    }

    /** База не ответила — говорим об этом, а не притворяемся пустотой. */
    function showNotice() {
        var isEn = window.location.pathname.indexOf('-en') !== -1;
        var isKg = window.location.pathname.indexOf('-kg') !== -1;
        grid.innerHTML = '<div class="tc-notice">' +
            (isEn ? 'Tournaments are temporarily unavailable. Please try again later.'
                  : (isKg ? 'Мелдештер убактылуу жеткиликсиз. Кийинчерээк аракет кылыңыз.'
                          : 'Турниры временно недоступны. Загляните чуть позже.')) +
            '</div>';
    }
})();
