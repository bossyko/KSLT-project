/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 132. На КОПИИ — база не трогается.
 *
 * Правила этого куска СЧИТАЮТ ПО ВСЕМУ ДЕРЕВУ (89 страниц, 98 якорей,
 * 6 ссылок на версию), поэтому песок обязан содержать всё дерево, а не
 * три папки: ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО.
 *
 *   node tools/check-puti-otnositelnye-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-132-'));
const ТЯЖЁЛЫЕ = /^(node_modules|\.git|test-results|playwright-report|_figma|mobile|slepki|tests)$/;

fs.cpSync(КОРЕНЬ, ВРЕМ, {
    recursive: true,
    filter: (ист) => {
        const отн = path.relative(КОРЕНЬ, ист);
        if (!отн) return true;
        return !отн.split(path.sep).some(ч => ТЯЖЁЛЫЕ.test(ч));
    }
});

const MF = 'manifest.json', IX = 'index.html', PG = 'pages/admin.html',
      KZ = 'maket/korty-zamer.html', BK = 'js/battle-cards.js';

const ОТКАТЫ = [
  ['вернуть start_url на корень домена', MF,
   '"start_url": "./"', '"start_url": "/"',
   'start_url манифеста относителен'],

  ['вернуть scope на корень домена', MF,
   '"scope": "./"', '"scope": "/"',
   'scope манифеста задан и относителен'],

  ['убрать scope совсем', MF,
   '  "scope": "./",\n', '',
   'scope манифеста задан и относителен'],

  ['вернуть иконке манифеста путь от корня', MF,
   '"src": "images/icons/icon-192.png"', '"src": "/images/icons/icon-192.png"',
   'иконки манифеста не просятся от корня домена'],

  /* ОТКАТ ОБЯЗАН ОСТАВИТЬ ФАЙЛ РАЗБИРАЕМЫМ: первая попытка снимала строку
     иконки без запятой предыдущей, JSON становился битым, JSON.parse бросал
     исключение — и прувер видел не падение правила, а падение разбора.
     ОТКАТ, ЛОМАЮЩИЙ РАЗБОР, НЕ ДОКАЗЫВАЕТ ПРАВИЛО. */
  ['отнять у манифеста одну иконку', MF,
   ', "type": "image/png", "purpose": "maskable" },\n    { "src": "images/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }',
   ', "type": "image/png", "purpose": "maskable" }',
   'иконки манифеста не просятся от корня домена'],

  ['вернуть apple-touch-icon путь от корня', IX,
   'rel="apple-touch-icon" href="images/icons/apple-touch-icon.png"',
   'rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png"',
   'ни одна страница не просит apple-touch-icon от корня домена'],

  ['снять apple-touch-icon с одной страницы', IX,
   '    <link rel="apple-touch-icon" href="images/icons/apple-touch-icon.png">\n',
   '',
   'страницы с apple-touch-icon найдены, и их 89'],

  ['дать странице в корне лишний ../', IX,
   'rel="apple-touch-icon" href="images/icons/apple-touch-icon.png"',
   'rel="apple-touch-icon" href="../images/icons/apple-touch-icon.png"',
   'страницы в корне ссылаются на иконку без ../, и их 3'],

  ['отнять ../ у страницы в подпапке', PG,
   'rel="apple-touch-icon" href="../images/icons/apple-touch-icon.png"',
   'rel="apple-touch-icon" href="images/icons/apple-touch-icon.png"',
   'страницы в подпапке ссылаются на иконку через ../, и их 86'],

  ['вернуть абсолютную ссылку в ОДИНАРНЫХ кавычках', KZ,
   "'../pages/courts.html'", "'/pages/courts.html'",
   'ни одной абсолютной ссылки на свой же файл'],

  ['вернуть сравнение адреса с корнем', BK,
   "var этоГлавная = файл === '' || файл.indexOf('index') === 0;",
   "var этоГлавная = path === '/' || path.indexOf('index') !== -1;",
   'никто не сравнивает pathname с корнем домена'],

  ['сломать признак имени файла', BK,
   "var файл = path.slice(path.lastIndexOf('/') + 1);",
   "var файл = path;",
   'главная узнаётся по имени файла'],

  ['поставить на страницу <base href>', IX,
   '<meta name="theme-color" content="#0A0A0A">',
   '<base href="/KSLT-project/">\n    <meta name="theme-color" content="#0A0A0A">',
   'ни одной страницы с <base href>'],

  ['убрать один якорь href="#"', IX,
   '<a href="#live" class="nav-item nav-item-live">',
   '<a href="live.html" class="nav-item nav-item-live">',
   'якорей href="#" не меньше замеренных 106'],

  ['развести версии battle-cards.js', IX,
   'battle-cards.js?v=22', 'battle-cards.js?v=21',
   'версия battle-cards.js одна на все 6 ссылок'],

  ['сделать og:image относительным', IX,
   '<meta property="og:image" content="https://bossyko.github.io/KSLT-project/images/KSLT.png">',
   '<meta property="og:image" content="images/KSLT.png">',
   'og:image остаётся полным URL — НАМЕРЕНО']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-puti-otnositelnye.js')],
                 { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*x\s/.test(с)).map(с => с.replace(/^\s*x\s*/, '').trim());
  }
}

const БАЗА = прогон();
if (БАЗА.length) {
  console.log('\n  x БАЗА: правило не проходит на ЧИСТОЙ копии\n');
  console.log('    ' + БАЗА.join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    все 14 правил проходят на чистой копии дерева\n');

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
