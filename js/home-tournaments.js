// ============================================
// Главная — блок «Турниры»
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
//   6. Если впереди нет ничего — недавно сыгранные, от свежих к старым
//
// Раздел назывался «Ближайшие турниры», но показывает и завершённые,
// и те, что идут сейчас. Название спорило с содержимым, поэтому просто
// «Турниры».

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
                'category_id, max_participants, reserved_spots, format, location, location_en, status, start_time, ' +
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

            // Заявки грузим отдельно и только по показанным турнирам:
            // без них на карточке стояла бы вместимость из формы создания,
            // одинаковая с первого дня записи до последнего
            var ids = picked.map(function(t) { return t.id; });
            client.from('tournament_registrations')
                .select('tournament_id')
                .in('tournament_id', ids)
                .in('status', (window.KSLT_SLOTS || {}).MAIN_DRAW || ['approved', 'pending', 'draw'])
                .then(function(regs) {
                    var taken = {};
                    (regs.data || []).forEach(function(r) {
                        taken[r.tournament_id] = (taken[r.tournament_id] || 0) + 1;
                    });
                    grid.innerHTML = picked.map(function(t, i) {
                        return TC.render(t, { featured: i === 0, taken: taken[t.id] || 0 });
                    }).join('');
                    TC.startTicker();
                });
        });

    /**
     * Событие турнира — название без хвоста про разряд, плюс дата.
     * «SUMMER BREEZE CUP – 2026 — дружеский, парный, мужской» и
     * «... — дружеский, микст» это один турнир в двух разрядах.
     */
    function eventKey(t) {
        var base = (t.title || '').split(' — ')[0].trim().toLowerCase();
        return base + '|' + (t.date_start || '');
    }

    /**
     * Оставляем по одной карточке на турнир. Разряды заводятся отдельными
     * записями — так считаются очки и строятся сетки, — но на главной
     * шесть плиток с одним и тем же названием выглядели как сбой.
     */
    function oneCardPerEvent(list) {
        var seen = {};
        return list.filter(function(t) {
            var k = eventKey(t);
            if (seen[k]) return false;
            seen[k] = true;
            return true;
        });
    }

    /** Отбираем шесть по договорённому порядку. */
    function pick(all) {
        var future = all.filter(function(t) { return TC.status(t) !== 'done'; });

        if (!future.length) {
            // Впереди пусто — показываем недавно сыгранные, от свежих к
            // старым. Раньше брали только один, и раздел выглядел так,
            // будто у клуба всего один турнир за всю историю
            var done = all.filter(function(t) { return TC.status(t) === 'done'; })
                .sort(function(a, b) {
                    var d = (b.date_end || b.date_start || '').localeCompare(a.date_end || a.date_start || '');
                    return d || (b.created_at || '').localeCompare(a.created_at || '');
                });
            return oneCardPerEvent(done).slice(0, LIMIT);
        }

        future.sort(function(a, b) {
            var d = ORDER[TC.status(a)] - ORDER[TC.status(b)];
            if (d) return d;
            d = (a.date_start || '').localeCompare(b.date_start || '');
            if (d) return d;
            // Даты совпали — первым идёт тот, кого раньше завели в базу
            return (a.created_at || '').localeCompare(b.created_at || '');
        });

        return oneCardPerEvent(future).slice(0, LIMIT);
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
