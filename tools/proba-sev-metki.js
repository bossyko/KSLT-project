/**
 * ЧТО ЛЕЖИТ В ТЕСТОВОЙ БАЗЕ ПОД ТУРНИРАМИ 48-й и 50-й ПРОБ.
 *
 * Три проверки упали с «меток нет» и «таблиц группы нет». Это может быть
 * вёрстка, а может быть сев: если групповых матчей в базе нет, то и метке
 * не из чего взяться, и таблице группы нечего рисовать. Отличить можно
 * только чтением базы — ответ «Success» от сева ничего не доказывает.
 *
 * Только читает. Ничего не пишет.
 *
 * Запускать:  node tools/proba-sev-metki.js
 */

const { url, key } = require('../tests/test-db');

const ЗАГОЛОВКИ = { apikey: key, Authorization: 'Bearer ' + key };

function пусто(значение) {
    return (значение === null || значение === undefined) ? '—' : String(значение);
}

async function взять(путь) {
    const ответ = await fetch(url + путь, { headers: ЗАГОЛОВКИ });
    const текст = await ответ.text();
    if (!ответ.ok) return { ошибка: ответ.status + ' ' + текст.slice(0, 200) };
    try { return { данные: JSON.parse(текст) }; }
    catch (е) { return { ошибка: 'не разобрал ответ: ' + текст.slice(0, 200) }; }
}

async function разбор(ид) {
    console.log('\n=== ' + ид);

    const турниры = await взять('/rest/v1/tournaments?id=eq.' + ид +
        '&select=id,title,status,bracket_type,group_count,qualifiers_per_group,manual_group_places');
    if (турниры.ошибка) { console.log('  турнир не прочитался: ' + турниры.ошибка); return; }
    if (!турниры.данные.length) {
        console.log('  ТУРНИРА В БАЗЕ НЕТ — сев не прогнан: node tests/seed.js');
        return;
    }

    const т = турниры.данные[0];
    console.log('  турнир есть: ' + т.title);
    console.log('  тип сетки ' + пусто(т.bracket_type) + ', групп ' + пусто(т.group_count) +
        ', выходит из группы ' + пусто(т.qualifiers_per_group) +
        ', состояние ' + пусто(т.status));
    console.log('  ручные места: ' +
        (т.manual_group_places ? JSON.stringify(т.manual_group_places) : 'нет'));

    const матчи = await взять('/rest/v1/matches?tournament_id=eq.' + ид +
        '&select=id,group_number,round,round_number,status,winner_id,score' +
        '&order=group_number,round_number');
    if (матчи.ошибка) { console.log('  матчи не прочитались: ' + матчи.ошибка); return; }

    const все = матчи.данные || [];
    const групповые = все.filter(function (м) { return м.group_number > 0; });
    const сеточные = все.filter(function (м) { return !м.group_number; });
    const сыграны = групповые.filter(function (м) { return м.status === 'completed'; });

    console.log('  матчей всего ' + все.length +
        ': в группах ' + групповые.length + ' (сыграно ' + сыграны.length + ')' +
        ', в сетке ' + сеточные.length);

    const поГруппам = {};
    групповые.forEach(function (м) {
        поГруппам[м.group_number] = (поГруппам[м.group_number] || 0) + 1;
    });
    const ключи = Object.keys(поГруппам);
    console.log('  по группам: ' + (ключи.length
        ? ключи.map(function (г) { return 'группа ' + г + ' → ' + поГруппам[г]; }).join(', ')
        : 'НИ ОДНОГО ГРУППОВОГО МАТЧА'));

    сеточные.forEach(function (м) {
        console.log('    сетка: круг ' + пусто(м.round) + ' №' + пусто(м.round_number) +
            ', состояние ' + пусто(м.status) + ', счёт ' + пусто(м.score));
    });

    const заявки = await взять('/rest/v1/tournament_registrations?tournament_id=eq.' + ид +
        '&select=id,status');
    if (заявки.ошибка) {
        console.log('  заявки не прочитались: ' + заявки.ошибка);
    } else {
        const д = заявки.данные || [];
        console.log('  заявок ' + д.length + ', одобрено ' +
            д.filter(function (з) { return з.status === 'approved'; }).length);
    }

    let вывод;
    if (групповые.length === 0) {
        вывод = 'ПРИЧИНА ПАДЕНИЙ ЗДЕСЬ: групповых матчей в базе нет. Метке не из ' +
            'чего взяться, таблице группы нечего рисовать. Это сев, а не вёрстка.';
    } else if (сыграны.length !== групповые.length) {
        вывод = 'групповые есть, но сыграны не все — порядок в группе неоднозначен';
    } else {
        вывод = 'данные на месте: группы есть и сыграны. Тогда падение — отрисовка, ' +
            'и разбирать надо код.';
    }
    console.log('  ВЫВОД: ' + вывод);
}

(async function () {
    console.log('база: ' + url);
    await разбор('test-metka');
    await разбор('test-sloty');
    console.log('');
})();
