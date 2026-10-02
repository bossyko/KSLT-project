/**
 * ПРУВЕР ЗАМОРОЗКИ ОЧКОВ И ЛИГ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — то, что жило в коде до 30.09: сложение таблицы с победами,
 * одна таблица на две лиги, деление пополам и цветной треугольник.
 *
 *   node tools/check-ochki-i-ligi-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ochki-'));

['js', 'css', 'tools', 'pages', 'maket'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.mkdirSync(path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js'), path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });

const ОЧКИ  = 'js/rating-points.js';
const СЕТКА = 'js/admin/sections/bracket.js';
const CSS   = 'css/admin.css';
const СТР   = 'pages/admin.html';
const СТЕНД_ЗАМЕР = 'maket/setka-zamer.html';
const ПУБЛИЧНАЯ = 'js/tournament-detail.js';

const ОТКАТЫ = [
  /* ─── одно или другое, а не оба разом ─── */
  [ОЧКИ,
   '            if (место && место <= МЕСТ_ПО_ТАБЛИЦЕ) return заМесто(место, таблица);',
   '',
   'первые места платятся только таблицей и выходят сразу'],

  [ОЧКИ,
   '            return побед > 0 ? побед * ЗА_ПОБЕДУ : ЗА_УЧАСТИЕ;',
   '            var сумма = заМесто(место, таблица);\n            сумма += побед > 0 ? побед * ЗА_ПОБЕДУ : ЗА_УЧАСТИЕ;\n            return сумма;',
   'остальным платятся ТОЛЬКО победы, без таблицы'],

  [ОЧКИ,
   '    var МЕСТ_ПО_ТАБЛИЦЕ = 4;',
   '    var МЕСТ_ПО_ТАБЛИЦЕ_БЫЛО = 4;',
   'граница названа отношением, а не числом в теле'],

  [СЕТКА,
   '            KSLT_POINTS.поТурниру(кОплате, таблицаМест, {});',
   '            KSLT_POINTS.поТурниру(кОплате, таблицаМест, { заПобеды: true });',
   'олимпийка платит только таблицей'],

  /* ─── этап даёт полосу, а не одно число ─── */
  [ОЧКИ,
   '        var сколько = РАЗМЕР_КРУГА[код];',
   '        var сколько = ({ SF: 2, QF: 4, R16: 8, R32: 16, R64: 32 })[код];',
   'полоса выводится из размера круга, а не перечислена числами'],

  [ОЧКИ,
   "    var МЕСТО_ПО_РАУНДУ = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 4, QF: 5, R16: 9, R32: 17, R64: 33 };",
   "    var МЕСТО_ПО_РАУНДУ = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 4, QF: 5, R16: 9, R32: 17, R64: 33, G2: 3 };",
   'место в группе числа не получает, а этапы сетки получают'],

  [ОЧКИ,
   '            хвост[к] = parseInt(к, 10) + неразыгранные[к] - 1;',
   '            хвост[к] = parseInt(к, 10);',
   'неразыгранное место платится по ПОСЛЕДНЕМУ в полосе'],

  [ОЧКИ,
   "        kg: { W: 'Жеңүүчү', F: 'Финалист', '3RD': '3-орун', '4TH': '4-орун',",
   "        kgg: { W: 'Жеңүүчү', F: 'Финалист', '3RD': '3-орун', '4TH': '4-орун',",
   'подписи этапа объявлены один раз и на трёх языках'],

  [ПУБЛИЧНАЯ,
   '                var подпись = KSLT_POINTS.подписьМеста(р.round_reached);',
   '                var подпись = место === null ? null : String(место);',
   'публичная страница турнира своего счёта мест не ведёт'],

  /* ─── две лиги — две таблицы ─── */
  [СЕТКА,
   '    async function таблицаУровнемНиже(tournament) {',
   '    async function таблицаУровнемНиже(tournament) { return {}; }\n    async function таблицаУровнемНиже(tournament) {',
   'таблица уровнем ниже объявлена ровно один раз'],

  [СЕТКА,
   "            processLeague(matches.filter(isCLMatch), нижняяКатегория, 'CL', таблицаНижней);",
   "            processLeague(matches.filter(isCLMatch), нижняяКатегория, 'CL', таблицаМест);",
   'нижняя лига платится своей таблицей, верхняя своей'],

  [СЕТКА,
   '        var ниже = список.find(function(у) { return у.sort_order < свой.sort_order; });',
   '        var ниже = список.find(function(у) { return у.id !== свой.id; });',
   'нижняя таблица берётся соседом снизу по порядку уровней'],

  /* ─── зачёт идёт вниз ─── */
  [СЕТКА,
   '                var ниже = категории.find(function(к) { return к.sort_order < своя.sort_order; });',
   '                var ниже = категории.find(function(к) { return к.sort_order > своя.sort_order; });',
   'зачёт нижней лиги идёт ВНИЗ по категориям, а не вверх'],

  [СЕТКА,
   "            var категории = (катОтвет.data || []).filter(function(к) { return к.id !== 'friendly'; });",
   '            var категории = (катОтвет.data || []);',
   'дружеские исключены из лестницы зачёта'],

  /* ─── кто в какую лигу ─── */
  [СЕТКА,
   '    function лигаМеста(tournament, place) {',
   '    function лигаМеста(tournament, place) { return "CL"; }\n    function лигаМеста(tournament, place) {',
   'деление по лигам объявлено один раз'],

  [СЕТКА,
   "                    if (лигаМеста(tournament, st.place) === 'PL') {",
   '                    if (st.place <= qualifiers) {',
   'генератор лиг и групповая таблица делят одинаково'],

  [СЕТКА,
   '        return (place && place <= выходит) ? \'PL\' : \'CL\';',
   '        return (place && place <= Math.floor(выходит / 2)) ? \'PL\' : \'CL\';',
   'деление считает от «выходят из группы», а не от половины'],

  /* ─── словом, а не цветом ─── */
  [СЕТКА,
   "                    (isPLRow ? ' <span class=\"ad-badge ad-league-go ad-league-pl\">' + L.leagueGoPL + '</span>' : '') +",
   "                    (isPLRow ? ' <span style=\"color:var(--accent);font-size:0.65rem;\">&#9654;</span>' : '') +",
   'в строке стоит название лиги, а не значок'],

  [СЕТКА,
   "                var isPLRow = вЛигу === 'PL' && группаДоиграна;",
   "                var isPLRow = вЛигу === 'PL' && allGroupCompleted;",
   'пометка появляется, когда доиграна СВОЯ группа'],

  [CSS,
   '    font-size: var(--fs-2xs);\n    font-weight: 600;\n    padding: 2px 8px;',
   '    font-size: 0.65rem;\n    font-weight: 600;\n    padding: 2px 8px;',
   'бейдж лиги стоит на шкале и не раздвигает строку'],

  [CSS,
   '.ad-league-pl {\n    background: var(--accent);\n    color: #0A0A0A;\n}',
   '.ad-league-pl {\n    background: var(--accent);\n    color: #FFFFFF;\n}',
   'высшая лига красится акцентом с почти-чёрным текстом'],

  /* Стенд остался на прежней версии, страница ушла вперёд: глазами на
     странице всё хорошо, а стенд меряет вчерашний файл. */
  /* Якорь без номера: сам номер меняется при каждой правке, и откат,
     записанный числом, состарится ровно так же, как состарилось правило,
     которое он проверяет. */
  [СТЕНД_ЗАМЕР,
   'rating-points.js?v=',
   'rating-points.js?v=0',
   'версия rating-points.js одна на странице и стендах']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-ochki-i-ligi.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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
