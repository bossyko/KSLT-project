/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «МОЙ МАТЧ». На КОПИИ.
 *
 * Каждый откат возвращает ровно то, что было до 14 ноября, и обязан
 * уронить ИМЕННО своё правило. «У меня зелёное» ничего не доказывает.
 *
 *   node tools/check-svoy-match-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-svoy-match-'));
['js', 'tools', 'sql'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'mobile', 'www', 'js'),
          path.join(песок, 'mobile', 'www', 'js'), { recursive: true });

const САЙТ = 'js/match-score.js',
      КАБ  = 'js/my-match-actions.js',
      СЕТ  = 'js/my-match-buttons.js',
      ПРИЛ = 'mobile/www/js/match-score.js',
      СВОД = 'js/kslt-rules.js',
      АДМ  = 'js/admin/sections/bracket.js',
      SQL  = 'sql/функции/zakrytyy-turnir-ne-prinimaet-schyot-14noy.sql',
      SТОР = 'sql/схема/storona-vpisavshego-14noy.sql',
      СПОР = 'sql/функции/zakrytyy-turnir-spor-14noy.sql';
const ФАЙЛЫ = [САЙТ, КАБ, СЕТ, ПРИЛ, СВОД, АДМ, SQL, SТОР, СПОР];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-svoy-match.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['читать заявку без турнира (сайт)', САЙТ,
     ".select('player_id, tournament_id')",
     ".select('player_id')",
     'сайт складывает капитанов по турнирам, а не в один список'],

    ['убрать карточки под турнир (сайт)', САЙТ,
     'MS.myPlayerIdsIn = async function (tournamentId) {',
     'MS.myPlayerIdsIn = async function (т) {\n        var tournamentId = т;',
     'сайт отдаёт карточки ПОД ТУРНИР'],

    ['окно берёт широкий список', САЙТ,
     'var pid = await MS.myPlayerIdsIn(m.tournament_id);',
     'var pid = await MS.myPlayerIdsShirokо();',
     'окно счёта решает под турнир открытого матча'],

    ['кабинет решает по широкому списку', КАБ,
     'var мои = [пары.свой].concat(пары.поТурниру[m.tournament_id] || []);',
     'var мои = pid;',
     'кабинет решает под турнир каждого матча'],

    ['сетка берёт широкий список', СЕТ,
     '_pid = await MS.myPlayerIdsIn(id);',
     '_pid = await MS.myPlayerIdsShirokо();',
     'сетка берёт карточки под свой турнир'],

    ['читать заявку без турнира (приложение)', ПРИЛ,
     ".select('player_id, tournament_id')",
     ".select('player_id')",
     'приложение складывает капитанов по турнирам'],

    ['приложение решает по широкому списку', ПРИЛ,
     'return R.matchScoreState(match, MS.myIdsIn(match.tournament_id), MS.myUserId());',
     'return R.matchScoreState(match, MS.myIds(), MS.myUserId());',
     'приложение решает под турнир матча'],

    ['убрать признак закрытости у сайта', САЙТ,
     '    MS.турнирЗакрыт = function (t) {',
     '    MS.турнирЗакрытСайт = function (t) {',
     'признак закрытости у сайта один и назван'],

    ['убрать признак закрытости у приложения', ПРИЛ,
     '  MS.турнирЗакрыт = function (t) {',
     '  MS.турнирЗакрытПрил = function (t) {',
     'признак закрытости есть и у приложения'],

    /* ПОТОЛОК НАОБОРОТ: закрыть лишнее так же плохо, как не закрыть нужное. */
    ['записать закрытой и закрытую запись', САЙТ,
     "return t.status === 'completed' || t.status === 'cancelled';\n    };\n\n    /** Карточки",
     "return t.status === 'completed' || t.status === 'cancelled' || t.status === 'registration_closed';\n    };\n\n    /** Карточки",
     'идущий турнир с закрытой записью счёт принимает'],

    ['окно открывается на закрытом турнире', САЙТ,
     '        if (MS.турнирЗакрыт(m.tournament)) {',
     '        if (false) {',
     'окно закрытого турнира не открывается'],

    ['не читать статус турнира (сайт)', САЙТ,
     "title_kg, set_format, status)')",
     "title_kg, set_format)')",
     'статус турнира вообще читается запросом'],

    ['сетка размечается без статуса', СЕТ,
     "var т = await client.from('tournaments').select('status').eq('id', id).single();\n        if (т.data && MS.турнирЗакрыт(т.data)) return;",
     '',
     'сетка закрытого турнира кнопок не даёт'],

    ['убрать признак закрытости из базы', SQL,
     'CREATE OR REPLACE FUNCTION public.turnir_zakryt_dlya_schyota(p_match_id uuid)',
     'CREATE OR REPLACE FUNCTION public.turnir_zakryt_inache(p_match_id uuid)',
     'в базе есть один признак закрытости для счёта'],

    ['снять замок записи', SQL,
     "    -- ЗАКРЫТЫЙ ТУРНИР: дальше только организатор\n    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN\n        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');\n    END IF;\n",
     '',
     'вписать в закрытый турнир база не даёт'],

    ['снять замок подтверждения', SQL,
     "    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN\n        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');\n    END IF;\n\n    IF v_match.score_status IS DISTINCT FROM 'pending' THEN",
     "    IF v_match.score_status IS DISTINCT FROM 'pending' THEN",
     'подтвердить в закрытом турнире база не даёт'],

    ['снять замок со спора', СПОР,
     "    -- ЗАКРЫТЫЙ ТУРНИР: спорить не о чем, решает организатор\n    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN\n        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');\n    END IF;\n\n",
     '',
     'оспорить счёт в закрытом турнире база не даёт'],

    ['вернуть автоприём, который не смотрит на турнир', СПОР,
     '       AND NOT public.turnir_zakryt_dlya_schyota(m.id);',
     '       ;',
     'автоприём по часам закрытые турниры обходит'],

    ['админка пишет счёт ожидающим', АДМ,
     "                score_status: 'confirmed',",
     "                score_status: 'pending',",
     'админка пишет счёт сразу подтверждённым'],

    /* ВЕТКА СТОРОН ЦЕЛИКОМ: вернуть сравнение по человеку, как было
       до 14.11 — именно от него напарник видел «Подтвердить». */
    ['сравнивать человека, а не сторону', СВОД,
     "            var мояСторона = мои.indexOf(match.player1_id) !== -1 ? 1 : 2;\n" +
     "            var ихСторона = match.score_submitted_player\n" +
     "                ? (match.score_submitted_player === match.player1_id ? 1\n" +
     "                   : (match.score_submitted_player === match.player2_id ? 2 : null))\n" +
     "                : null;\n" +
     "            if (ихСторона !== null) return ихСторона === мояСторона ? 'wait' : 'confirm';\n",
     '',
     'подтверждает ДРУГАЯ СТОРОНА, а не другой человек'],

    ['не возить карточку вписавшего в кабинет', КАБ,
     'score_submitted_by, score_submitted_player, played_at',
     'score_submitted_by, played_at',
     'карточка вписавшего приезжает в выборках'],

    ['база не кладёт карточку вписавшего', SТОР,
     'score_submitted_player  = v_karta,',
     'score_submitted_at      = now(),',
     'карточку вписавшего кладёт база'],

    ['не досчитывать сторону старым записям', SТОР,
     'UPDATE public.matches m SET score_submitted_player = pr.player_id',
     'SELECT 1 WHERE false; -- UPDATE public.matches m SET pusto = pr.player_id',
     'старым записям сторона досчитана'],

    ['без карточки показывать пусто вместо прежнего правила', СВОД,
     "            return match.score_submitted_by === myUserId ? 'wait' : 'confirm';",
     "            return 'none';",
     'без карточки вписавшего правило не падает, а считает по-старому'],

    ['подтверждённый счёт снова спрашивать у игрока', СВОД,
     "        if (match.score_status === 'confirmed' || match.score_status === 'disputed') return 'done';",
     "        if (match.score_status === 'disputed') return 'done';",
     'подтверждённый счёт игроку делать нечего']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правила падают на ЧИСТОМ коде — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const n = исходник[ф].split(что).length - 1;
    if (n !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз в ' + ф);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}
