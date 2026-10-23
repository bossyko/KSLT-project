/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 133. На КОПИИ ВСЕГО ДЕРЕВА.
 *
 * Правила этого куска считают по всему продукту — 37 файлов, 99 страниц,
 * 167 объявлений языка, версии скриптов. ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО
 * ЧИТАЕТ ПРАВИЛО.
 *
 *   node tools/check-yazyk-odin-dom-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-133-'));
const ТЯЖЁЛЫЕ = /^(node_modules|\.git|test-results|playwright-report|_figma|mobile|slepki|tests)$/;
fs.cpSync(КОРЕНЬ, ВРЕМ, {
    recursive: true,
    filter: ист => {
        const отн = path.relative(КОРЕНЬ, ист);
        return !отн || !отн.split(path.sep).some(ч => ТЯЖЁЛЫЕ.test(ч));
    }
});

const ДОМ = 'js/kslt-yazyk.js', IX = 'index.html',
      TO = 'js/tournaments-overview.js', SV = 'js/services.js',
      CR = 'pages/courts.html';

const ОТКАТЫ = [
  ['заставить дом читать адрес вместо разметки', ДОМ,
   "document.documentElement.getAttribute('lang')",
   "window.location.pathname",
   'дом языка читает <html lang>, а не адрес'],

  ['вернуть в дом вычисление по пути', ДОМ,
   "    var код;",
   "    var путь = window.location.pathname;\n    var код;",
   'дом языка не вычисляет язык из пути'],

  ['отнять у дома понимание ky', ДОМ,
   "else if (объявлен.indexOf('ky') === 0 || объявлен.indexOf('kg') === 0) код = 'kg';",
   "else if (объявлен.indexOf('kg') === 0) код = 'kg';",
   'дом мирит ky и kg'],

  ['сравнить язык точным равенством вместо приставки', ДОМ,
   "if (объявлен.indexOf('en') === 0) код = 'en';",
   "if (объявлен === 'en') код = 'en';",
   'дом сравнивает по приставке, а не по точному равенству'],

  ['переименовать выбор по языку', ДОМ,
   "Я.выбрать = function (en, kg, ru) {",
   "Я.выборЯзыка = function (en, kg, ru) {",
   'дом отдаёт выбор по языку одним зовом'],

  ['переставить доводы выбора местами', ДОМ,
   "Я.выбрать = function (en, kg, ru) {",
   "Я.выбрать = function (ru, en, kg) {",
   'дом отдаёт выбор по языку одним зовом'],

  ['вернуть одному файлу вычисление языка из пути', TO,
   "    var isEn = KSLT_YAZYK.en;",
   "    var isEn = window.location.pathname.indexOf('-en') !== -1;",
   'ни один файл не вычисляет язык из пути'],

  /* ОТКАТ ОБЯЗАН УБРАТЬ ВСЕ ЗОВЫ, А НЕ ОДИН. Первая попытка снимала только
     `isEn`, и файл продолжал звать дом строкой ниже — счёт оставался 37, и
     правило молчало по делу. ФАЙЛ ПЕРЕСТАЁТ ЗАВИСЕТЬ, КОГДА УХОДИТ
     ПОСЛЕДНИЙ ЗОВ, А НЕ ПЕРВЫЙ. */
  ['отнять у одного файла зависимость от дома', SV,
   "    var isEn = KSLT_YAZYK.en;\n    var isKg = KSLT_YAZYK.kg;",
   "    var isEn = false;\n    var isKg = false;",
   'дом зовут 37 файлов — и это замерено, а не вспомнено'],

  ['снять дом с одной страницы', IX,
   '    <script src="js/kslt-yazyk.js?v=1"></script>\n',
   '',
   'дом подключён на каждой такой странице'],

  /* ЯКОРЬ ВЗЯТ ИЗ ФАЙЛА, А НЕ ПО ПАМЯТИ. Первая попытка ставила перед домом
     `contact-icons.js` — он стоит рядом, но дома НЕ зовёт, и потому дом
     вставлен не перед ним, а перед `auth-nav.js`. Якорь из двух строк
     держится на их соседстве: уедет версия — прувер скажет «якорь
     встречается 0 раз», и это честнее тихого зелёного. */
  ['подключить дом ПОЗЖЕ его потребителя', IX,
   '    <script src="js/kslt-yazyk.js?v=1"></script>\n    <script src="js/auth-nav.js?v=27"></script>\n',
   '    <script src="js/auth-nav.js?v=27"></script>\n    <script src="js/kslt-yazyk.js?v=1"></script>\n',
   'дом стоит раньше своих потребителей'],

  ['подключить дом дважды', IX,
   '    <script src="js/kslt-yazyk.js?v=1"></script>\n',
   '    <script src="js/kslt-yazyk.js?v=1"></script>\n    <script src="js/kslt-yazyk.js?v=1"></script>\n',
   'дом подключён не больше одного раза на страницу'],

  ['снять <html lang> со страницы', IX,
   '<html lang="ru">',
   '<html>',
   'у каждой страницы с домом объявлен <html lang>'],

  ['соврать в <html lang>', IX,
   '<html lang="ru">',
   '<html lang="en">',
   'объявленный язык совпадает с языком пути'],

  ['развести версии одного скрипта по страницам', IX,
   'battle-cards.js?v=23',
   'battle-cards.js?v=22',
   'у каждого скрипта одна версия на все страницы'],

  ['добавить тернарник по языку сверх потолка', TO,
   "    var isKg = KSLT_YAZYK.kg;",
   "    var isKg = KSLT_YAZYK.kg;\n    var лишний = isEn ? 1 : 2;",
   'тернарников по языку не больше замеренных 1157'],

  ['снять дом со страницы в подпапке', CR,
   '    <script src="../js/kslt-yazyk.js?v=1"></script>\n',
   '',
   'дом подключён на каждой такой странице']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-yazyk-odin-dom.js')],
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
console.log('\n  база    все 12 правил проходят на чистой копии дерева\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  x откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    плохо++; return;
  }
  fs.writeFileSync(путь, ориг.split(было).join(стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  x ' + имя);
    console.log('      ждали «' + ждём + '», упало: ' + (упали.join(' · ') || '— ничего —'));
    плохо++;
  } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');
