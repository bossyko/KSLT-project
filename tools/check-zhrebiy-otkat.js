#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ ЖЕРЕБЬЁВКИ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — ровно то, что жило в коде до 29.09: тасовка на месте, формула
 * копией, умолчание в коде, снос без счёта сыгранных.
 *
 *   node tools/check-zhrebiy-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-zhrebiy-'));
['js', 'css', 'tools', 'pages'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  /* Якорь берём с соседней строкой: сама тасовка встречается трижды */
  ['js/admin/sections/bracket.js',
   'var unseeded = approved.slice(seedCount);\n        KSLT_RULES.перемешать(unseeded, await жребийТурнира(tournament));',
   'var unseeded = approved.slice(seedCount);\n        for (var i = unseeded.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = unseeded[i]; unseeded[i] = unseeded[j]; unseeded[j] = t; }',
   'случайность в сетке берётся только для рождения зерна'],

  ['js/kslt-rules.js',
   '    R.перемешать = function (массив, бросок) {',
   '    R.peremeshat_net = function (массив, бросок) {',
   'тасовка живёт одним определением в общих правилах'],

  ['js/kslt-rules.js',
   "        if (typeof бросок !== 'function') {\n            throw new Error('перемешать: нужен бросок от зерна, иначе жеребьёвку не повторить');\n        }",
   "        if (typeof бросок !== 'function') { бросок = Math.random; }",
   'перемешать не работает без броска'],

  ['js/kslt-rules.js',
   '    R.бросок = function (зерно) {\n        var с = (Number(зерно) || 0) >>> 0;',
   '    R.бросок = function (зерно) {\n        var с = (Number(зерно) || Date.now()) >>> 0;',
   'бросок считается от зерна, а не от времени'],

  ['js/admin/sections/bracket.js',
   'return KSLT_RULES.бросок(tournament.draw_seed);',
   'return KSLT_RULES.бросок(1);',
   'жеребьёвка берёт зерно турнира'],

  /* Копия формулы РЯДОМ с зовом: ронять должно только правило про копии */
  ['js/admin/sections/bracket.js',
   'var расклад = KSLT_RULES.раскладСвободных(groupCount, свободно, формат);',
   'var расклад = KSLT_RULES.раскладСвободных(groupCount, свободно, формат);\n            var _копия = Math.min(groupCount, свободно * 2);',
   'формула свободных мест — одно определение'],

  ['js/admin/sections/tournaments.js',
   'var расклад = KSLT_RULES.раскладСвободных(групп, свободно, формат);',
   'var расклад = { матчей: 0, безИгры: 0, проходом: 0 };',
   'и сетка, и форма зовут её'],

  ['js/kslt-rules.js',
   '        return { матчей: матчей, безИгры: безИгры, проходом: с - матчей - безИгры };',
   '        return { матчей: матчей, безИгры: с - матчей, проходом: 0 };',
   'меток не больше, чем претендентов'],

  ['js/admin/sections/bracket.js',
   '        var groupCount = tournament.group_count;\n        var qualifiers = tournament.qualifiers_per_group;',
   '        var groupCount = tournament.group_count || 2;\n        var qualifiers = tournament.qualifiers_per_group || 2;',
   'групповая жеребьёвка не придумывает число групп'],

  ['js/admin/sections/tournaments.js',
   'var беда = KSLT_RULES.бедаНастройкиГрупп(\n                групп || null, выходят || null, участников);',
   'var беда = (групп < 2 ? \'групп_мало\' : null);',
   'настройку судит общее правило, а не две разные проверки'],

  ['js/kslt-rules.js',
   '    R.предупреждениеОГруппах = function (групп, выходят, участников) {',
   '    R.predupr_net = function (групп, выходят, участников) {',
   '«группа не отсеивает» — предупреждение, а не отказ'],

  ['js/admin/sections/bracket.js',
   '            var сыграно = await сыгранныхМатчей(tournamentId);',
   '            var сыграно = 0;',
   'сыгранное считается до сноса'],

  ['js/admin/sections/bracket.js',
   "await A.client.from('tournaments').update({ draw_seed: null }).eq('id', tournamentId);",
   "await A.client.from('tournaments').update({ status: tournament.status }).eq('id', tournamentId);",
   'пережеребьёвка бросает НОВЫЙ жребий'],

  ['js/admin/sections/bracket.js',
   "            html += кнопкаПережеребить('ad-btn-sm');",
   "            html += '<button class=\"ad-btn\" id=\"adBrkRegenerate\">' + L.regenerateDraw + '</button>';",
   'кнопка пережеребьёвки — одно определение'],

  ['css/admin.css',
   '.ad-brk-regen-podpis {',
   '.ad-brk-regen-podpis-net {',
   'подпись под кнопкой, а не по наведению'],

  ['js/admin/sections/bracket.js',
   "'<span class=\"ad-brk-zerno\">'",
   "'<span class=\"ad-brk-zerno-net\">'",
   'номер жребия виден в шапке сетки'],

  ['pages/admin.html',
   'kslt-rules.js?v=',
   'kslt-rules.js?v=11&bylo=',
   'версии подняты — иначе браузер отдаст старое из кеша'],

  /* ─── лестница категорий в посеве, 09.10 ─── */

  /* ТО, ЧТО БЫЛО В КОДЕ ДО 09.10: дверь «Пережеребить» брала игроков без
     категории, и ступень лестницы становилась нулём у всех. */
  ['js/admin/sections/bracket.js',
   ".select('id, name, name_en, points, category_id, ntrp_singles, ntrp_doubles').in('id', playerIds);",
   ".select('id, name, name_en, points, ntrp_singles, ntrp_doubles').in('id', playerIds);",
   'КАЖДАЯ дверь жеребьёвки берёт категорию игрока'],

  /* Дверь перестала находиться вовсе — сторожить стало нечего. */
  ['js/admin/sections/bracket.js',
   ".select('id, name, name_en, points, category_id, gender, ntrp_singles, ntrp_doubles')",
   ".select('id, imya, name_en, points, category_id, gender, ntrp_singles, ntrp_doubles')",
   'ни одна выборка игроков с очками не ускользает от сторожа'],

  /* Лестница снова своя, в коде, а не из базы — вторая копия понятия. */
  ['js/admin/sections/bracket.js',
   'return лестница[п.category_id] || 0;',
   "return ({ promasters: 5, masters: 4, tour: 3 })[п.category_id] || 0;",
   'ступень посева берётся из лестницы категорий, а не из своего порядка'],

  /* Место в рейтинге снова перебивает категорию: ключи переставлены. */
  ['js/admin/sections/bracket.js',
   'var сA = ступень(a), сB = ступень(b);\n            if (сA !== сB) return сB - сA;   // выше по лестнице — раньше\n',
   'var сA = ступень(a), сB = ступень(b);\n',
   'ступень решает РАНЬШЕ места в рейтинге'],

];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-zhrebiy.js')], { encoding: 'utf8' });
    return [];
  } catch (e) {
    return String(e.stdout || '').split('\n')
      .filter(l => l.trim().startsWith('·'))
      .map(l => l.replace(/^\s*·\s*/, '').trim());
  }
}

if (прогон().length) {
  console.log('\n  ✗ копия не зелёная до откатов — чинить сперва её\n');
  process.exit(1);
}

let бед = 0;
console.log('');
ОТКАТЫ.forEach(([файл, было, стало, ждём], и) => {
  const путь = path.join(ВРЕМ, файл);
  const исход = fs.readFileSync(путь, 'utf8');
  const сколько = исход.split(было).length - 1;
  if (сколько !== 1) {
    console.log(`  ✗ откат ${и + 1} (${файл}): якорь встречается ${сколько} раз`);
    console.log(`    ${было.slice(0, 70)}`);
    бед++;
    return;
  }
  fs.writeFileSync(путь, исход.replace(было, стало));
  const упавшие = прогон();
  fs.writeFileSync(путь, исход);

  if (!упавшие.length) {
    console.log(`  ✗ откат ${и + 1}: НИЧЕГО НЕ УПАЛО — правило «${ждём}» пустое`);
    бед++;
  } else if (упавшие.length === 1 && упавшие[0] === ждём) {
    console.log(`  ок  ${String(и + 1).padStart(2)}  ${ждём}`);
  } else {
    console.log(`  ✗ откат ${и + 1}: ждали «${ждём}», упало: ${упавшие.join(' | ')}`);
    бед++;
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (бед) { console.log(`  НЕ ТАК  прувер: ${бед} откатов из ${ОТКАТЫ.length} не доказали правило\n`); process.exit(1); }
console.log(`  ок      все ${ОТКАТЫ.length} откатов доказали свои правила\n`);
