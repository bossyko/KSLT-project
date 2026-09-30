/**
 * ПРОГОН ЦЕПОЧКИ — ДВИЖОК: один расклад от жеребьёвки до плей-офф.
 *
 * Проверяет ПОРЯДОК ЭТАПОВ и ОТСУТСТВИЕ ДУБЛЕЙ на настоящих функциях
 * `bracket.js`, а не на их пересказе. Возвращает список находок; пустой
 * список — расклад чистый.
 *
 * ЧТО ИМЕННО ПРОВЕРЯЕТСЯ — по пунктам Кости:
 *   1. групповой:  каждый ровно в одной группе; каждая пара внутри группы
 *                  встречается РОВНО один раз; никто не стоит дважды в одном
 *                  туре; число матчей совпадает с суммой C(n,2) по группам.
 *   2. до выхода:  клетка сетки не получает имени раньше, чем доиграна та
 *                  группа, на которую показывает её метка; доп. матч не
 *                  получает игроков, пока не доиграны ВСЕ группы, — его
 *                  участники берутся межгрупповым сравнением.
 *   3. плей-офф:   ни один человек не стоит в одном круге дважды — ни на
 *                  одном шаге, а не только в конце.
 *   4. правка:     после ручной перестановки мест дублей по-прежнему нет, и
 *                  переставленный стоит в клетке своего нового места.
 */
(function () {
    'use strict';
    var A = window.KSLT_ADMIN;
    var П = window.ПРОГОН;

    function чисто() {
        ['tournaments', 'tournament_registrations', 'matches', 'players'].forEach(function (т) {
            П.Б[т].length = 0;
        });
        A.прогонСообщения = [];
    }

    /* НОМЕР ГРУППЫ ПО МЕТКЕ — ТОЙ ЖЕ ТАБЛИЦЕЙ, ЧТО И ПРОДУКТ.
       Своя `[A-H]` здесь уже соврала: после того как алфавит групп вырос до
       24 букв, прогон записал метку `J2` в межгрупповые и обвинил продукт в
       том, чего не было. Прибор со своей шкалой — не прибор. */
    function группаМетки(метка) {
        if (typeof метка !== 'string') return null;
        if (!/^[A-Z]\d+$/.test(метка)) return null;
        return window.KSLT_RULES.группаПоБукве(метка.charAt(0));
    }
    function этоГрупповой(m) { return !!m.group_number; }

    П.одинРасклад = async function (н) {
        чисто();
        П.засеять(н.зерно || (н.людей * 1000 + н.групп * 10 + н.выходят));

        var турнир = {
            id: 't', title: 'прогон', bracket_type: 'round_robin', format: 'singles',
            status: 'ongoing', group_count: н.групп, qualifiers_per_group: н.выходят,
            max_participants: н.людей, court_count: 2, match_duration: 90,
            start_time: '09:00', date_start: '2026-10-01', date_end: '2026-10-02',
            gender: 'men', category_id: null, level_id: null, manual_group_places: {},
            playoff_format: н.формат || null
        };
        П.Б.tournaments.push(турнир);

        /* ГОСТЬ — ЗАЯВКА БЕЗ КАРТОЧКИ. `bracket.js:1164` ставит
           `is_external = !гостьПервый.id`, то есть у гостя `player_id` пуст,
           а имя лежит в `external_name`. Жеребьёвка кладёт в матч именно
           `player_id` (`:7527`) — значит у гостя в матче пустая ссылка.
           Меряем, а не предполагаем: `гостей: K` делает последних K заявок
           гостевыми, как это делает админка. */
        var заявки = [], playersMap = {};
        var гостей = Number(н.гостей) || 0;
        for (var i = 0; i < н.людей; i++) {
            var гость = i >= н.людей - гостей;
            var з;
            if (гость) {
                з = { id: 'r' + i, tournament_id: 't', player_id: null, partner_id: null,
                    is_external: true, external_name: 'Гость ' + i,
                    status: 'approved', seed_number: null, group_number: null };
            } else {
                var игрок = { id: 'p' + i, name: 'Игрок ' + i, name_en: 'Player ' + i,
                    ntrp_singles: (5.5 - i * 0.05).toFixed(2), rating_points: 1000 - i * 7 };
                П.Б.players.push(игрок);
                playersMap[игрок.id] = игрок;
                з = { id: 'r' + i, tournament_id: 't', player_id: игрок.id, partner_id: null,
                    is_external: false, external_name: null,
                    status: 'approved', seed_number: null, group_number: null };
            }
            П.Б.tournament_registrations.push(з);
            заявки.push(з);
        }

        var находки = [];
        var сказать = function (т) { находки.push(т); };

        // ---- ЭТАП 1: жеребьёвка групп ----
        /* Ходим в ТУ ЖЕ дверь, что и менеджер: `генерироватьСетку` держит
           проверки, которых у `generateGroupDraw` нет — гость без карточки,
           состав на рассмотрении, порог в два человека. */
        await A.прогон.сеткуЦеликом(турнир, заявки, playersMap);

        var матчи = П.Б.matches;
        var групповые = матчи.filter(этоГрупповой);
        if (!групповые.length) {
            сказать('жеребьёвка не создала ни одного группового матча; сообщения: ' +
                (A.прогонСообщения || []).join(' | '));
            return { настройка: н, находки: находки, числа: {} };
        }

        // 1a. каждый ровно в одной группе
        var группаИгрока = {};
        var вДвух = [];
        групповые.forEach(function (m) {
            [m.player1_id, m.player2_id].forEach(function (id) {
                if (!id) return;
                if (группаИгрока[id] === undefined) группаИгрока[id] = m.group_number;
                else if (группаИгрока[id] !== m.group_number) вДвух.push(id);
            });
        });
        if (вДвух.length) сказать('игрок в двух группах: ' + вДвух.slice(0, 3).join(', '));

        // 1b. каждая пара ровно один раз + 1c. никто дважды в одном туре
        var поГруппам = {};
        групповые.forEach(function (m) {
            (поГруппам[m.group_number] = поГруппам[m.group_number] || []).push(m);
        });
        var ждалиМатчей = 0;
        Object.keys(поГруппам).forEach(function (г) {
            var сп = поГруппам[г];
            var люди = {};
            сп.forEach(function (m) { люди[m.player1_id] = 1; люди[m.player2_id] = 1; });
            var n = Object.keys(люди).length;
            ждалиМатчей += n * (n - 1) / 2;

            var пары = {};
            сп.forEach(function (m) {
                var к = [m.player1_id, m.player2_id].sort().join('|');
                пары[к] = (пары[к] || 0) + 1;
            });
            var дважды = Object.keys(пары).filter(function (к) { return пары[к] > 1; });
            if (дважды.length) сказать('группа ' + г + ': пара встречается дважды (' + дважды.length + ')');
            if (Object.keys(пары).length !== n * (n - 1) / 2) {
                сказать('группа ' + г + ': пар ' + Object.keys(пары).length + ', а должно быть ' + (n * (n - 1) / 2));
            }

            var вТуре = {};
            сп.forEach(function (m) {
                [m.player1_id, m.player2_id].forEach(function (id) {
                    var к = m.round_number + '|' + id;
                    вТуре[к] = (вТуре[к] || 0) + 1;
                });
            });
            var двАТуре = Object.keys(вТуре).filter(function (к) { return вТуре[к] > 1; });
            if (двАТуре.length) сказать('группа ' + г + ': кто-то стоит дважды в одном туре (' + двАТуре.length + ')');
        });
        if (групповые.length !== ждалиМатчей) {
            сказать('групповых матчей ' + групповые.length + ', а по числу людей в группах должно быть ' + ждалиМатчей);
        }

        // 1d. сетка создана пустой, с метками
        var внеГрупп = матчи.filter(function (m) { return !этоГрупповой(m); });
        if (!внеГрупп.length) сказать('сетка плей-офф не создана вовсе');
        var сИменами = внеГрупп.filter(function (m) { return m.player1_id || m.player2_id; });
        if (сИменами.length) сказать('сразу после жеребьёвки в сетке уже стоят имена: ' + сИменами.length + ' клеток');
        var первыйКруг = внеГрупп.filter(function (m) { return m.round_number === 1 && m.round !== 'IG'; });
        var безМеток = первыйКруг.filter(function (m) { return !m.slot1_label && !m.slot2_label; });
        if (первыйКруг.length && безМеток.length === первыйКруг.length) {
            сказать('в первом круге ни у одной клетки нет метки — источник потерян');
        }

        // ---- ЭТАП 2: играем группы, после каждого счёта — пересчёт ----
        var шагов = 0;
        for (var k = 0; k < групповые.length; k++) {
            var м = П.Б.matches.find(function (x) { return x.id === групповые[k].id; });
            м.score = (k % 3 === 0) ? '6/3 6/4' : (k % 3 === 1) ? '6/2 7/5' : '7/6(7-4) 6/1';
            м.winner_id = (k % 2 === 0) ? м.player1_id : м.player2_id;
            м.status = 'completed';
            await A.прогон.пересчитать('t');
            шагов++;

            var все = П.Б.matches;
            var дубли = A.прогон.дубли(все);
            if (дубли.length) {
                сказать('после ' + шагов + '-го счёта в сетке дубль: ' +
                    дубли.map(function (д) { return д.playerId + ' в ' + д.клетки.length + ' клетках круга ' + д.клетки[0].round_number; }).join('; '));
                break;
            }

            var всеГруппыДоиграны = все.filter(этоГрупповой).every(function (x) { return x.status === 'completed'; });
            var доиграна = {};
            Object.keys(поГруппам).forEach(function (г) {
                доиграна[г] = все.filter(function (x) { return x.group_number == г; })
                    .every(function (x) { return x.status === 'completed'; });
            });

            var рано = [], раноIG = [];
            все.filter(function (x) { return !этоГрупповой(x); }).forEach(function (m) {
                [['slot1_label', 'player1_id'], ['slot2_label', 'player2_id']].forEach(function (п) {
                    var метка = m[п[0]], стоит = m[п[1]];
                    if (!метка || !стоит) return;
                    var г = группаМетки(метка);
                    if (г !== null) {
                        if (!доиграна[г]) рано.push(метка + ' (группа ' + г + ' не доиграна)');
                    } else if (!всеГруппыДоиграны) {
                        раноIG.push(метка);
                    }
                });
            });
            if (рано.length) {
                сказать('клетка получила имя раньше своей группы: ' + рано.slice(0, 3).join(', '));
                break;
            }
            if (раноIG.length) {
                сказать('метка межгруппового сравнения (' + раноIG.slice(0, 3).join(', ') +
                    ') заполнена, пока не доиграны все группы');
                break;
            }
        }

        // ---- ЭТАП 3: сетка после групп ----
        var всеМатчи = П.Б.matches;
        var дубли3 = A.прогон.дубли(всеМатчи);
        if (дубли3.length) сказать('после групп в сетке дубль: ' + дубли3.length);

        var р1 = всеМатчи.filter(function (m) { return !этоГрупповой(m) && m.round_number === 1 && m.round !== 'IG'; });
        var земляки = 0;
        р1.forEach(function (m) {
            var г1 = группаИгрока[m.player1_id], г2 = группаИгрока[m.player2_id];
            if (г1 && г1 === г2) земляки++;
        });

        // ---- ЭТАП 4: ручная перестановка мест не ломает сетку ----
        var перваяГруппа = поГруппам[Object.keys(поГруппам)[0]];
        var людиГр = {};
        перваяГруппа.forEach(function (m) { людиГр[m.player1_id] = 1; людиГр[m.player2_id] = 1; });
        var спГр = Object.keys(людиГр);
        var местаДо = A.прогон.местаГруппы
            ? A.прогон.местаГруппы(спГр, всеМатчи.filter(function (m) { return m.group_number == перваяГруппа[0].group_number; }))
            : null;
        var переставленОК = null;
        if (местаДо && местаДо.length >= 2) {
            var о = {};
            о[местаДо[0].playerId] = местаДо[1].place;
            о[местаДо[1].playerId] = местаДо[0].place;
            турнир.manual_group_places = {};
            турнир.manual_group_places[String(перваяГруппа[0].group_number)] = о;
            var т = П.Б.tournaments[0];
            т.manual_group_places = турнир.manual_group_places;

            await A.прогон.пересчитать('t');
            var послеСвопа = A.прогон.дубли(П.Б.matches);
            if (послеСвопа.length) сказать('после ручной перестановки появился дубль: ' + послеСвопа.length);

            var буква = String.fromCharCode(64 + Number(перваяГруппа[0].group_number));
            var клетка1 = П.Б.matches.filter(function (m) { return !этоГрупповой(m); })
                .filter(function (m) { return m.slot1_label === буква + '1' || m.slot2_label === буква + '1'; })[0];
            if (клетка1) {
                var стоит = клетка1.slot1_label === буква + '1' ? клетка1.player1_id : клетка1.player2_id;
                переставленОК = (стоит === местаДо[1].playerId);
                if (стоит && !переставленОК) {
                    сказать('перестановка не доехала до сетки: в ' + буква + '1 стоит ' + стоит +
                        ', а руками поставлен ' + местаДо[1].playerId);
                }
            }
        }

        return {
            настройка: н,
            находки: находки,
            числа: {
                групповых: групповые.length,
                ждали: ждалиМатчей,
                клетокСетки: внеГрупп.length,
                допМатчей: внеГрупп.filter(function (m) { return m.round === 'IG'; }).length,
                земляковВПервомКруге: земляки,
                шагов: шагов,
                перестановкаДоехала: переставленОК,
                сообщения: (A.прогонСообщения || []).slice(0, 4)
            }
        };
    };

    /**
     * ГОДНЫЕ НАСТРОЙКИ ПЕРЕЧИСЛЯЕТ САМ ПРОДУКТ.
     *
     * Судья один — `KSLT_RULES.бедаНастройкиГрупп`, тот же, которым
     * жеребьёвка отказывает менеджеру. Свой список я бы выдумал и проверил
     * бы им свою выдумку.
     */
    П.годныеНастройки = function (пределЛюдей) {
        var итог = [];
        var максЛюдей = пределЛюдей || 45;
        for (var л = 4; л <= максЛюдей; л++) {
            for (var г = 2; г <= 22; г++) {
                for (var в = 1; в <= 3; в++) {
                    if (!window.KSLT_RULES.бедаНастройкиГрупп(г, в, л)) итог.push({ людей: л, групп: г, выходят: в });
                }
            }
        }
        return итог;
    };
})();
