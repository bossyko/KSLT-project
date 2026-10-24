/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 140. На КОПИИ дерева плюс acorn.
 *   node tools/check-vitrina-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-140-'));
const ТЯЖЁЛЫЕ = /^(node_modules|\.git|test-results|playwright-report|_figma|mobile|slepki|tests)$/;
fs.cpSync(КОРЕНЬ, ВРЕМ, {
    recursive: true,
    filter: ист => {
        const отн = path.relative(КОРЕНЬ, ист);
        return !отн || !отн.split(path.sep).some(ч => ТЯЖЁЛЫЕ.test(ч));
    }
});
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(ВРЕМ, 'node_modules', 'acorn'), { recursive: true });

const ДОСТУП = 'js/kslt-dostup.js', ВИТРИНА = 'js/kslt-vitrina.js',
      CO = 'js/coaches.js', CT = 'js/courts.js', PT = 'js/partners.js',
      IX = 'index.html', CRT = 'pages/courts.html';

function тег(файл, имя) {
    const т = fs.readFileSync(path.join(ВРЕМ, файл), 'utf8');
    const ш = new RegExp('[ \\t]*<script src="[^"]*' + имя.replace('.', '\\.') + '[^"]*"></script>\\n');
    const м = т.match(ш);
    if (!м) { console.log('\n  x нет тега ' + имя + ' в ' + файл); process.exit(1); }
    return м[0];
}

const ОТКАТЫ = [
  ['сломать разбор одного файла', CO,
   "    var _accessLevel = 'guest';",
   "    var _accessLevel = 'guest';\n    var ) = 1;",
   'файлы сайта разбираются парсером'],

  ['вернуть своё вычисление доступа', CO,
   "        _accessLevel = await KSLT_DOSTUP.уровень();",
   "        _accessLevel = 'registered';",
   'уровень доступа считается только в доме'],

  ['отнять у дома доступа память', ДОСТУП,
   "        if (_уровень) return _уровень;",
   "",
   'дом доступа помнит ответ на всю жизнь страницы'],

  /* ОТКАТ СНЯТ 23.10, КУСКОМ 149: его правило — «админ и менеджер
     считаются членами клуба» — УБРАНО куском 142, потому что сотрудник
     клуба не член клуба. Откат пережил своё правило и всё это время
     искал в файле строку, которой там нет.
     ОТКАТ БЕЗ ПРАВИЛА — НЕ ДОКАЗАТЕЛЬСТВО, А МУСОР; снимается вместе с
     правилом, а не позже. */
  
  ['завести в доме установку window.ksltUser', ДОСТУП,
   "        if (!вошёл) { _уровень = 'guest'; return _уровень; }",
   "        window.ksltUser = null;\n        if (!вошёл) { _уровень = 'guest'; return _уровень; }",
   'дом доступа не ставит window.ksltUser — и это замерено'],

  ['отнять у одного файла зависимость от дома доступа', PT,
   "        _accessLevel = await KSLT_DOSTUP.уровень();\n        _myPlayerId = KSLT_DOSTUP.мойИгрок();",
   "        _accessLevel = 'guest';\n        _myPlayerId = null;",
   'дома доступа зовут 7 файлов — замерено'],

  ['вернуть близнецу свой счёт шага', CT,
   /* ЯКОРЬ ПЕРЕВЕШЕН 23.10, КУСОК 149: `шаг` стал `пересчётШага` куском
      144 — дом ОТДАЁТ функцию, а не считает на месте. */
   "    var пересчитатьШаг = KSLT_VITRINA.пересчётШага({",
   /* ОТКАТ ДОПИСЫВАЕТ СВОЁ ЧТЕНИЕ, А НЕ ЗАМЕНЯЕТ ЗОВ: зов открывает
      объектный довод, и замена целой строки оставляла висящий `})` —
      падал РАЗБОР, а не правило. ОТКАТ, ЛОМАЮЩИЙ РАЗБОР, НЕ ДОКАЗЫВАЕТ
      ПРАВИЛО (правило куска 132, и вот оно снова). */
   "    var шаг = window.getComputedStyle(document.querySelector('.ct-grid')).gridTemplateColumns.split(' ').length;\n    var пересчитатьШаг = KSLT_VITRINA.пересчётШага({",
   'шаг сетки у близнецов считается только в доме витрины'],

  ['вернуть близнецу своего наблюдателя', CO,
   "        KSLT_VITRINA.следитьЗаШириной(document.getElementById('coachesGrid'), function () {",
   "        new ResizeObserver(function () {}).observe(document.body);\n        KSLT_VITRINA.следитьЗаШириной(document.getElementById('coachesGrid'), function () {",
   'за шириной у близнецов следит только дом витрины'],

  ['снять у наблюдателя дома сторож повторного входа', ВИТРИНА,
   "            if (идёт) return;",
   "",
   'наблюдатель дома защищён от повторного входа'],

  ['вернуть близнецу свой обработчик полосы', PT,
   "        KSLT_VITRINA.нажатияПолосы(document.getElementById('ptGrid'),",
   "        document.addEventListener('click', function (e) { e.target.closest('.pl-page-btn'); });\n        KSLT_VITRINA.нажатияПолосы(document.getElementById('ptGrid'),",
   'нажатия полосы у близнецов живут только в доме'],

  ['завести в доме витрины свой номер страницы', ВИТРИНА,
   "    В.нажатияПолосы = function (коробка, взять, поставить, перерисовать) {",
   "    var _currentPage = 1;\n    В.нажатияПолосы = function (коробка, взять, поставить, перерисовать) {",
   'номер страницы живёт у зовущего, а не в доме'],

  ['вернуть близнецу своё перемешивание', CT,
   "        return KSLT_VITRINA.продвинутыеПервыми(arr);",
   "        var p = [], r = [];\n        arr.forEach(function (x) { (x._promoted ? p : r).push(x); });\n        return p.concat(r);",
   'перемешивание карточек живёт только в доме'],

  /* СЧЁТ ЗОВУЩИХ РОНЯЕТСЯ СНЯТИЕМ ПОСЛЕДНЕГО ЗОВА, А НЕ ПЕРВОГО: у
     «Партнёров» зовов дома витрины три, и файл перестаёт зависеть,
     только когда уходят все. */
  ['отнять у одного файла зависимость от дома витрины', PT,
   "KSLT_VITRINA.",
   "НЕТ_ДОМА.",
   'дом витрины зовут 3 файла — замерено'],

  ['снять дом доступа со страницы', IX,
   () => тег(IX, 'kslt-dostup.js'),
   '',
   'дом доступа подключён на каждой своей странице'],

  ['подключить дом витрины ПОЗЖЕ его потребителя', CRT,
   () => тег(CRT, 'kslt-vitrina.js') + тег(CRT, 'courts.js'),
   () => тег(CRT, 'courts.js') + тег(CRT, 'kslt-vitrina.js'),
   'дом витрины стоит раньше своих потребителей']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-vitrina.js')],
                 { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*x\s/.test(с)).map(с => с.replace(/^\s*x\s*/, '').trim());
  }
}

const БАЗА = прогон();
if (БАЗА.length) {
  console.log('\n  x БАЗА: правила не проходят на ЧИСТОЙ копии\n    ' + БАЗА.join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    все правила проходят на чистой копии\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было_, стало_, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const было = typeof было_ === 'function' ? было_() : было_;
  const стало = typeof стало_ === 'function' ? стало_() : стало_;
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n < 1) {
    console.log('  x откат ' + (i + 1) + ' (' + ф + '): якоря нет');
    плохо++;
    return;
  }
  /* ЗАМЕНЯЮТСЯ ВСЕ ВХОЖДЕНИЯ. ФАЙЛ ПЕРЕСТАЁТ ЗАВИСЕТЬ, КОГДА УХОДИТ
     ПОСЛЕДНИЙ ЗОВ, А НЕ ПЕРВЫЙ: у «Партнёров» зовов дома витрины три. */
  fs.writeFileSync(путь, ориг.split(было).join(стало), 'utf8');
  const упало = прогон();
  fs.writeFileSync(путь, ориг, 'utf8');
  if (упало.indexOf(ждём) !== -1) {
    console.log('  v ' + имя + '  ->  «' + ждём + '»');
  } else {
    console.log('  x ' + имя + '\n      ждали «' + ждём + '», упало: ' +
                (упало.length ? '«' + упало.join('», «') + '»' : '— ничего —'));
    плохо++;
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) {
  console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
  process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');
