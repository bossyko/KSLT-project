/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 138. На КОПИИ `js/` плюс acorn.
 * ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО, И ПАРСЕР ТОЖЕ.
 *
 *   node tools/check-kyrgyzskiy-polnyy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-138-'));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(ВРЕМ, 'js'), { recursive: true });
fs.copyFileSync(path.join(КОРЕНЬ, 'tools', 'check-kyrgyzskiy-polnyy.js'),
                path.join(ВРЕМ, 'tools', 'check-kyrgyzskiy-polnyy.js'));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(ВРЕМ, 'node_modules', 'acorn'), { recursive: true });

const ST = 'js/stats.js', DB = 'js/dashboard.js', RL = 'js/kslt-rules.js',
      CO = 'js/coaches.js', VF = 'js/verify.js';

const ОТКАТЫ = [
  ['сломать разбор одного файла', ST,
   "    var isEn = KSLT_YAZYK.en;",
   "    var isEn = KSLT_YAZYK.en;\n    var ) = 1;",
   'файлы сайта разбираются парсером'],

  ['вернуть пару по языку без кыргызского', ST,
   "    var isEn = KSLT_YAZYK.en;",
   "    var isEn = KSLT_YAZYK.en;\n    var п = isEn ? 'Points' : 'Очки';",
   'каждый выбор по языку называет все три языка'],

  ['обернуть зов внешним условием isKg', ST,
   "    var isEn = KSLT_YAZYK.en;",
   "    var isEn = KSLT_YAZYK.en;\n    var isKg = KSLT_YAZYK.kg;\n" +
   "    var п = isKg ? 'Очко' : KSLT_YAZYK.выбрать('Points', 'Очко', 'Очки');",
   'выбор языка делается ОДНИМ зовом, а не двумя условиями'],

  ['вернуть кыргызу русский код локали', CO,
   "KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU')",
   "isEn ? 'en-US' : 'ru-RU'",
   'код локали у кыргызского свой, а не русский'],

  ['записать код языка заново вместо дома', ST,
   "    var isEn = KSLT_YAZYK.en;",
   "    var isEn = KSLT_YAZYK.en;\n    var я = isEn ? 'en' : 'ru';",
   'код языка берётся у дома, а не пишется заново'],

  ['увести кыргыза на русскую страницу', DB,
   "KSLT_YAZYK.выбрать('pricing-en.html', 'pricing-kg.html', 'pricing.html')",
   "isEn ? 'pricing-en.html' : 'pricing.html'",
   'адрес страницы не уводит с кыргызской на русскую'],

  ['забыть ключ в кыргызской ветви словаря', VF,
   "        validBadge: 'ЖАРАКТУУ ВАУЧЕР',",
   "",
   'состав ключей словарей одинаков во всех трёх ветвях'],

  ['отнять у подписей NTRP кыргызский', RL,
   "lang === 'kg' ? 'жекече'",
   "lang === 'xx' ? 'жекече'",
   'подписи NTRP знают три языка'],

  ['поставить русский текст в кыргызскую ветвь сверх потолка', DB,
   "KSLT_YAZYK.выбрать('Expiry', 'Мөөнөт бүтүшү', 'Сгорание')",
   "KSLT_YAZYK.выбрать('Expiry', 'Сгорание', 'Сгорание')",
   'мест, где кыргызский текст равен русскому, не больше 17']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-kyrgyzskiy-polnyy.js')],
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
  if (n < 1) {
    console.log('  x откат ' + (i + 1) + ' (' + ф + '): якоря нет');
    плохо++;
    return;
  }
  /* замена ВСЕХ вхождений: отнимая зовы, нельзя отнять один из многих —
     ФАЙЛ ПЕРЕСТАЁТ ЗАВИСЕТЬ, КОГДА УХОДИТ ПОСЛЕДНИЙ ЗОВ, А НЕ ПЕРВЫЙ. */
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
