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
                    записьСКарточки(client, picked);
                });
        });

    /**
     * Запись прямо с карточки на главной. Одиночный турнир отправляет заявку
     * сразу, парный открывает окно выбора напарника — заявку в паре подаёт
     * один за двоих.
     */
    function записьСКарточки(client, турниры) {
        if (записьСКарточки._done) return;
        записьСКарточки._done = true;

        var поId = {};
        турниры.forEach(function(t) { поId[t.id] = t; });

        var isEn = location.pathname.indexOf('-en') !== -1;
        var isKg = location.pathname.indexOf('-kg') !== -1;

        // Состояние уже поданных заявок: кнопка сразу скажет «вы в сетке»
        if (window.KSLT_REG) window.KSLT_REG.markRegistered(client);

        document.addEventListener('click', async function(e) {
            var btn = e.target.closest('.tc .to-register');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();

            var сессия = await client.auth.getSession();
            if (!сессия.data.session) {
                if (window.KSLT_REG) window.KSLT_REG.предложитьВойти(isEn, isKg);
                return;
            }

            if (btn.dataset.doubles && window.KSLT_DOUBLES) {
                var профиль = await client.from('profiles')
                    .select('full_name, player_id').eq('id', сессия.data.session.user.id).single();
                window.KSLT_DOUBLES.открыть({
                    client: client,
                    tournament: поId[btn.dataset.tid] || { id: btn.dataset.tid },
                    playerId: профиль.data ? профиль.data.player_id : null,
                    playerName: профиль.data ? профиль.data.full_name : '',
                    onDone: function() { window.KSLT_REG.markRegistered(client); }
                });
                return;
            }

            var прежний = btn.textContent;
            btn.disabled = true;
            btn.textContent = isEn ? 'Sending...' : (isKg ? 'Жөнөтүлүүдө...' : 'Отправка...');
            var info = await window.KSLT_REG.submit(client, btn.dataset.tid, { isEn: isEn, isKg: isKg });
            if (info && info.created) {
                window.KSLT_REG.markRegistered(client);
            } else {
                btn.disabled = false;
                btn.textContent = прежний;
            }
        }, true);
    }

    /**
     * Отбираем шесть по договорённому порядку.
     *
     * Само правило — в общем своде (js/kslt-rules.js): по одной карточке на
     * турнир, а если впереди пусто — недавно сыгранные. Приложение берёт
     * его оттуда же, иначе главная у них расходится, как и было.
     */
    function pick(all) {
        return window.KSLT_RULES.pickTournaments(all, TC.status, LIMIT, ORDER);
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
