/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 137. На КОПИИ ДЕРЕВА.
 *
 * Правила считают по всему `js/` — тернарники, зовы выбора, доводы,
 * суффикс. ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО, и ЕЩЁ ACORN:
 * правила читают ДЕРЕВО, а без парсера сторож падает целиком и прувер
 * видит «упало: — ничего —» у всех откатов разом.
 *
 *   node tools/check-vybor-yazyka-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-137-'));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(ВРЕМ, 'js'), { recursive: true });
fs.copyFileSync(path.join(КОРЕНЬ, 'tools', 'check-vybor-yazyka.js'),
                path.join(ВРЕМ, 'tools', 'check-vybor-yazyka.js'));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(ВРЕМ, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/kslt-yazyk.js', ST = 'js/stats.js', AG = 'js/auth-guard.js',
      AN = 'js/auth-nav.js';

const ЗОВ = "    var authPage = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');";
const ФЛАГ = "    var isEn = KSLT_YAZYK.en;";

const ОТКАТЫ = [
  ['сломать разбор одного файла', ST,
   ФЛАГ, ФЛАГ + "\n    var ) = 1;",
   'файлы сайта разбираются парсером'],

  /* ТРОЙКА БЕЗ ВЫЗОВА — ТА САМАЯ, ЧТО КУСОК СВОДИЛ. Ленивая законна,
     эта нет: правило держится на причине, а не на числе. */
  ['вернуть тройку isEn/isKg без вызова в ветвях', ST,
   ФЛАГ, ФЛАГ + "\n    var isKg = KSLT_YAZYK.kg;\n    var т = isEn ? 1 : isKg ? 2 : 3;",
   'каждая оставшаяся тройка оставлена РАДИ ЛЕНИ, а не забыта'],

  /* ТРОЙКА С ВЫЗОВОМ законна по правилу выше — и ровно поэтому её ловит
     потолок: иначе «ради лени» стало бы отговоркой на любое число. */
  ['добавить вторую тройку, уже с вызовом в ветви', ST,
   ФЛАГ, ФЛАГ + "\n    var isKg = KSLT_YAZYK.kg;\n    var т = isEn ? String(1) : isKg ? 2 : 3;",
   'троек ради лени ровно одна — замерено'],

  ['добавить тернарник по языку сверх потолка', ST,
   ФЛАГ, ФЛАГ + "\n    var пара = isEn ? 1 : 2;",
   'тернарников по языку не больше замеренных 127'],

  ['убрать один зов выбора языка', AG,
   ЗОВ, "    var authPage = 'auth.html';",
   'зовов выбора языка не меньше замеренных 502'],

  ['отнять у зова один довод', AG,
   ЗОВ, "    var authPage = KSLT_YAZYK.выбрать('auth-en.html', 'auth.html');",
   'каждый зов выбора несёт ровно три довода'],

  ['поставить вызов функции в довод выбора', AG,
   ЗОВ, "    var authPage = KSLT_YAZYK.выбрать(String('auth-en.html'), 'auth-kg.html', 'auth.html');",
   'в доводах выбора нет вызовов функций'],

  ['опустошить одну ветвь выбора', AG,
   ЗОВ, "    var authPage = KSLT_YAZYK.выбрать('auth-en.html', '', 'auth.html');",
   'ни одна ветвь выбора не пуста'],

  ['посчитать суффикс страницы мимо дома, зовом', AG,
   ЗОВ, ЗОВ + "\n    var суф = KSLT_YAZYK.выбрать('-en', '-kg', '');",
   'суффикс страницы считается только в доме'],

  ['посчитать суффикс страницы мимо дома, тернарником', AG,
   ЗОВ, ЗОВ + "\n    var isEn = KSLT_YAZYK.en;\n    var суф = isEn ? '-en' : '';",
   'суффикс страницы считается только в доме'],

  ['объявить суффикс в доме дважды', ДОМ,
   "    Я.суффикс = код === 'en' ? '-en' : (код === 'kg' ? '-kg' : '');",
   "    Я.суффикс = код === 'en' ? '-en' : (код === 'kg' ? '-kg' : '');\n    Я.суффикс = код === 'en' ? '-en' : '';",
   'дом объявляет суффикс ровно один раз'],

  ['отнять у одного места чтение суффикса', AN,
   "return в + 'dashboard' + (KSLT_YAZYK.суффикс) + '.html#games';",
   "return в + 'dashboard' + '' + '.html#games';",
   'суффикс читают не меньше замеренных 15 мест']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-vybor-yazyka.js')],
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
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  x откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало), 'utf8');
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
