/**
 * ПРУВЕР ЗАМОРОЗКИ ПЛЕЙ-ОФФА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — ровно то, что жило в коде до 29.09: пересчёт из одной двери,
 * замок на всю сетку, пометка с именем, которое видно строкой выше.
 *
 *   node tools/check-setka-plei-off-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-pleioff-'));

['js', 'css', 'tools', 'pages', 'maket'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const СЕТКА = 'js/admin/sections/bracket.js';
const ПОДП  = 'js/admin/core/constants.js';
const CSS   = 'css/admin.css';
const СТР   = 'pages/admin.html';
const СТЕНД = 'maket/setka-zamer.html';
const ДАН   = 'maket/stend-setka-dannye.js';

const ОТКАТЫ = [
  /* ─── одно определение на одно понятие ─── */
  [СЕТКА,
   '    async function пересчитатьСоставСетки(tournamentId, tournament) {',
   '    async function пересчитатьСоставСетки(tournamentId, tournament) { /* копия ниже */ }\n' +
   '    async function пересчитатьСоставСетки(tournamentId, tournament) {',
   'пересчёт состава сетки объявлен ровно один раз'],

  [СЕТКА,
   '        var поМеткам = ктоПоМеткам(tournament, matches);\n        var кто = поМеткам.кто;\n        var группаИгрока = поМеткам.группаИгрока;',
   '        var поМеткам = { кто: {}, группаИгрока: {} };\n        var кто = поМеткам.кто;\n        var группаИгрока = поМеткам.группаИгрока;',
   'кто стоит за меткой — тоже одно определение'],

  [СЕТКА,
   '    function клеткаЗаперта(m) {',
   '    function клеткаЗаперта(m) { return false; }\n    function клеткаЗаперта(m) {',
   'запертость клетки считает одна функция'],

  /* ─── пять дверей ─── */
  [СЕТКА,
   '            if (isGroupMatch(match)) {\n                await пересчитатьСоставСетки(tournamentId);\n            }',
   '            if (isGroupMatch(match)) {\n                await Promise.resolve();\n            }',
   'правка счёта группового матча пересчитывает сетку'],

  [СЕТКА,
   '                if (групповой(match)) await пересчитатьСоставСетки(tournamentId, tournament);',
   '                if (групповой(match)) await Promise.resolve();',
   'проход без игры и снятие результата — тоже двери'],

  /* ШЕСТАЯ ДВЕРЬ — СНЯТИЕ СЧЁТА В ПЛЕЙ-ОФФ (01.10).
     До неё снятие счёта в плей-офф открывало клетку и на этом кончалось:
     подсказка обещала «снимите счёт — остальное встанет само», а по метке
     клетку никто не пересобирал. Турнир d8b39287: R1 #2 (метка `G2`) и
     R1 #7 (метка `G1`) остались с прежними именами. */
  [СЕТКА,
   "                await пересчитатьСоставСетки(tournamentId, tournament);\n                A.showToast(сыгранныеДальше.length",
   "                A.showToast(сыгранныеДальше.length",
   'дверь «снятие счёта в плей-офф» зовёт пересчёт'],

  /* ─── запирается клетка, а не сетка ─── */
  [СЕТКА,
   '            if (клеткаЗаперта(m)) return;\n            var изм = {};',
   '            var изм = {};',
   'сыгранный матч запирает СЕБЯ, а не всю сетку'],

  [СЕТКА,
   '        var снятия = [];',
   '        var ужеИграли = внеГрупп.some(function(m) { return m.status === \'completed\'; });\n' +
   '        if (ужеИграли) return false;\n        var снятия = [];',
   'раннего выхода «в плей-офф уже играли» больше нет'],

  /* ─── сторож на дубль ─── */
  [СЕТКА,
   "                var к = m.round_number + '|' + id;",
   "                var к = 'все|' + id;",
   'дубль меряется ВНУТРИ ОДНОГО КРУГА'],

  [СЕТКА,
   '            if (пометки[m.id]) return;\n',
   '',
   'дубль перебивает остальные пометки'],

  [СЕТКА,
   '            if (клеткаЗаперта(m)) {\n                var разошлись = [];',
   '            if (true) {\n                var разошлись = [];',
   'расхождение ищется только у запертых клеток'],

  /* ─── пометка не повторяет того, что видно рядом ─── */
  [ПОДП,
   "        brkNoticeDup: 'дважды в сетке — ещё в {где}',",
   "        brkNoticeDup: '{кто} стоит в сетке дважды: {где}',",
   'пометка дубля не повторяет имя из клетки'],

  [ПОДП,
   "        brkNoticeMismatch: 'ждали {метка} — {ждали}',",
   "        brkNoticeMismatch: 'ждали {метка} — {ждали}, играл {играл}',",
   'пометка расхождения не повторяет того, кто играл'],

  [СЕТКА,
   '                var другие = д.клетки.filter(function(о) { return о !== m; }).map(подпись).join(\', \');',
   '                var другие = д.клетки.map(подпись).join(\', \');',
   'дубль называет ДРУГИЕ клетки, а не все'],

  [СЕТКА,
   '                    лечение: клеткаЗаперта(m) ? L.brkNoticeDupFix : null',
   '                    лечение: L.brkNoticeDupFix',
   'подсказка «снимите счёт» стоит только там, где счёт есть'],

  /* ─── вид пометки ─── */
  [CSS,
   '.ad-brk-notice {\n    padding: 8px 12px;',
   '.ad-brk-notice {\n    width: 210px;\n    padding: 8px 12px;',
   'полоса пометки не задаёт себе ширину'],

  [CSS,
   '    padding: 8px 12px;\n    font-size: var(--fs-2xs);',
   '    padding: 8px 12px;\n    font-size: 11px;',
   'кегль пометки и подсказки — со шкалы'],

  [CSS,
   '.ad-brk-notice {\n    padding: 8px 12px;\n    font-size: var(--fs-2xs);',
   '.ad-brk-notice {\n    padding: 7px 10px;\n    font-size: var(--fs-2xs);',
   'отступы пометки — со шкалы'],

  [CSS,
   '    color: var(--danger-on);',
   '    color: #ffffff;',
   'дубль — сплошная заливка с почти-чёрным текстом, без границы'],

  [CSS,
   '    text-transform: none;\n    opacity: 0.8;',
   '    text-transform: uppercase;\n    opacity: 0.8;',
   'подсказка тише беды: обычный регистр и меньший вес'],

  /* ─── земляки ─── */
  [СЕТКА,
   'if (сосед && у.группа >= 0 && сосед.группа === у.группа) continue;',
   'if (false) continue;',
   'земляков разводят обе ступени, а не одна'],

  /* ─── стенд ─── */
  [ДАН,
   '            if (!вСетке[с.playerId]) запас.push({ id: с.playerId, группа: и });',
   '            запас.push({ id: с.playerId, группа: и });',
   'у стенда есть расклад со всеми тремя пометками'],

  /* ЯКОРЬ БЕЗ НОМЕРА */
  [СТЕНД,
   'stend-setka-dannye.js?v=',
   'stend-setka-dannye.js?v=9&bylo=',
   'версии подняты — иначе правка не доедет до того, у кого файл в кеше']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-setka-plei-off.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*·\s/.test(с))
                .map(с => с.replace(/^\s*·\s*/, '').trim());
  }
}

let плохо = 0;
console.log('');
ОТКАТЫ.forEach(([ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ откат ' + (i + 1) + ': ждали «' + ждём + '»');
    console.log('    упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else {
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём + (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо === 0) {
  console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
  console.log('');
  process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);
