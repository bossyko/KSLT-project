/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ГОЛОСОВ ОТКАТОМ.
 *
 * Каждое правило check-golosa-storony.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ: оригиналы не трогаются.
 *
 *   node tools/check-golosa-storony-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-golosa-'));
['js', 'tools', 'mobile'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const АДМ = 'js/admin/sections/challenges.js';
const ДЕТ = 'js/challenge-detail.js';
const ОБЗ = 'js/battles-overview.js';

const ОТКАТЫ = [

  /* ЧИТАЛИ ПО ИГРОКУ — ровно это и было до 09.10 на странице вызова.
     Берём ВТОРУЮ сторону, а не первую: ключ `_votes[1]` обязан остаться в
     файле, иначе откат заодно уронит правило о единственном ключе, и
     доказательство ничего не докажет. ПРУВЕР ЭТО И ПОЙМАЛ. */
  [ДЕТ, `        var v2 = _votes[2] || 0;`,
        `        var v2 = _votes[b.opponent_player_id] || 0;`,
   'голос читается по стороне, а не по игроку'],

  /* НАПОЛНЕНИЕ УЕХАЛО С ЧТЕНИЯ. Берём админку: там эта строка ОДНА. В
     обзоре, в плитках, на странице вызова и в приложении она стоит дважды,
     и порча одной копии оставляла правило зелёным — второй экземпляр
     держал его за первую. ПРУВЕР ПОЙМАЛ И ЭТО. */
  [АДМ, `vm[v.side] = parseInt(v.votes) || 0;`,
        `vm[v.igrok] = parseInt(v.votes) || 0;`,
   'все пять мест наполняют голоса по стороне'],

  /* ТРЕТЬЕ ЗНАЧЕНИЕ СТОРОНЫ. Его не бывает, и правило обязано это знать. */
  [АДМ, `                var v2 = vm[2] || 0;`,
        `                var v2 = vm[3] || 0;`,
   'сторона — это 1 и 2, и ключ один на весь проект'],

  /* СТАРАЯ КОЛОНКА ВЕРНУЛАСЬ В КОД — и уборку в базе гонять нельзя.
     Якорь — карта игроков в обзоре, а не чтение голосов: так откат не
     задевает ни одного ключа и роняет ровно своё правило. */
  [ОБЗ, `        var p1 = _players[b.challenger_player_id] || {};`,
        `        var p1 = _players[b.predicted_winner_id] || {};`,
   'старой колонки predicted_winner_id в коде нет вовсе'],
];

let упало = 0;
ОТКАТЫ.forEach(([файл, было, стало, правило], i) => {
    const путь = path.join(ВРЕМ, файл);
    const цел = fs.readFileSync(путь, 'utf8');
    const сколько = цел.split(было).length - 1;
    if (сколько !== 1) {
        console.log(`  ✗ ${i + 1}  якорь встречается ${сколько} раз: ${правило}`);
        упало++;
        return;
    }
    fs.writeFileSync(путь, цел.replace(было, стало));
    let вывод = '';
    try {
        вывод = execFileSync('node', [path.join(ВРЕМ, 'tools/check-golosa-storony.js')],
                             { encoding: 'utf8' });
    } catch (e) { вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.writeFileSync(путь, цел);

    const упалоИменноОно = вывод.includes(`✗ ${правило}`);
    const сколькоУпало = (вывод.match(/^  ✗ /gm) || []).length;
    if (упалоИменноОно && сколькоУпало === 1) {
        console.log(`  ок  ${i + 1}  ${правило}`);
    } else {
        console.log(`  ✗ ${i + 1}  ${правило} — упало ${сколькоУпало}, своё: ${упалоИменноОно}`);
        упало++;
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
if (упало === 0) {
    console.log(`\n  ок      все ${ОТКАТЫ.length} откатов доказали свои правила`);
    console.log('          оригиналы не изменялись — работа шла на копии\n');
    process.exit(0);
}
console.log(`\n  НЕ ТАК  откатов ${ОТКАТЫ.length}, не доказали ${упало}\n`);
process.exit(1);
