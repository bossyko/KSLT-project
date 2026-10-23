/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 134. На КОПИИ.
 *   node tools/check-sluzhba-i-koren-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-134-'));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.mkdirSync(path.join(ВРЕМ, 'js'), { recursive: true });
['sw.js', 'favicon.svg'].forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф)));
fs.copyFileSync(path.join(КОРЕНЬ, 'tools/check-sluzhba-i-koren.js'),
                path.join(ВРЕМ, 'tools/check-sluzhba-i-koren.js'));
['css', 'js', 'images'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const SW = 'sw.js', SC = 'js/script.js';

const ОТКАТЫ = [
  ['вернуть регистрацию от корня домена', SC,
   "navigator.serviceWorker.register(new URL('sw.js', корень).href).catch(function() {});",
   "navigator.serviceWorker.register('/sw.js').catch(function() {});",
   'служба не просится от корня домена'],

  ['просить службу просто по имени', SC,
   "navigator.serviceWorker.register(new URL('sw.js', корень).href).catch(function() {});",
   "navigator.serviceWorker.register('sw.js').catch(function() {});",
   'служба не просится просто по имени'],

  ['перестать считать корень от манифеста', SC,
   "var объявлениеКорня = document.querySelector('link[rel=\"manifest\"]');",
   "var объявлениеКорня = document.body;",
   'адрес службы считается от объявленного корня проекта'],

  ['снять проверку наличия объявления корня', SC,
   "        if (объявлениеКорня) {",
   "        if (true) {",
   'регистрация обёрнута в проверку наличия объявления корня'],

  ['вернуть один путь предзагрузки к корню домена', SW,
   "  'css/style.css',",
   "  '/css/style.css',",
   'в списке предзагрузки семь путей, и все относительные'],

  ['добавить восьмой путь в предзагрузку', SW,
   "  'images/icons/icon-512.png'\n];",
   "  'images/icons/icon-512.png',\n  'css/podium.css'\n];",
   'в списке предзагрузки семь путей, и все относительные'],

  ['указать в предзагрузке несуществующий файл', SW,
   "  'favicon.svg',",
   "  'favicon-kotorogo-net.svg',",
   'каждый путь предзагрузки указывает на существующий файл'],

  ['отнять у службы знание своего корня', SW,
   "var КОРЕНЬ = new URL('./', self.location.href).pathname;",
   "var КОРЕНЬ = '/';",
   'служба берёт корень из своего адреса'],

  ['вернуть отсечку админки по полному пути', SW,
   "  if (/(?:^|\\/)admin/.test(свой)) return;",
   "  if (url.pathname.indexOf('/admin') !== -1) return;",
   'админка отсекается по пути ОТНОСИТЕЛЬНО корня проекта'],

  ['опустить версию кэша', SW,
   "var CACHE_NAME = 'kslt-v7';",
   "var CACHE_NAME = 'kslt-v6';",
   'версия кэша не ниже 7'],

  ['вернуть абсолютный путь в код службы', SW,
   "  if (url.hostname !== self.location.hostname) return;",
   "  if (url.hostname !== self.location.hostname) return;\n  if (url.pathname === '/zabytyy') return;",
   'в службе не осталось ни одного пути от корня домена'],

  /* ЭТОТ ОТКАТ ПРАВИТ САМ СТОРОЖ, А НЕ ПРОДУКТ — и это единственный способ
     доказать правило о слепоте прибора. Первая попытка открывала блочный
     комментарий в начале sw.js, но он закрывался на первом же закрывающем
     знаке ниже, и маска продолжала видеть код: ОТКАТ, КОТОРЫЙ НЕ ДЕЛАЕТ
     ТОГО, ЧТО ОБЕЩАЕТ, НИЧЕГО НЕ ДОКАЗЫВАЕТ.
     Знак закрытия комментария здесь НЕ ЦИТИРУЕТСЯ: он закрыл бы этот
     комментарий на середине фразы — первая попытка так и сломала файл. */
  ['ослепить маску комментариев', 'tools/check-sluzhba-i-koren.js',
   "const кодСлужбы = безКомментариев(СЛУЖБА);",
   "const кодСлужбы = СЛУЖБА;",
   'маска комментариев не ослепла']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-sluzhba-i-koren.js')],
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
console.log('\n  база    все 11 правил проходят на чистой копии\n');

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
