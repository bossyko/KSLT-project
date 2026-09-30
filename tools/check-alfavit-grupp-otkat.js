/**
 * ПРУВЕР ЗАМОРОЗКИ АЛФАВИТА ГРУПП И ПРОГОНА ЦЕПОЧКИ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — ровно то, что жило в коде до 30.09: восемь букв с запасным
 * числом, обратный перевод через код буквы, судья без верхней границы.
 *
 *   node tools/check-alfavit-grupp-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-alfavit-'));

['js', 'tools', 'pages', 'maket'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.mkdirSync(path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js'), path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'css'), path.join(ВРЕМ, 'css'), { recursive: true });

const ПРАВ  = 'js/kslt-rules.js';
const ПРМОБ = 'mobile/www/js/kslt-rules.js';
const СЕТКА = 'js/admin/sections/bracket.js';
const ЗАГЛ  = 'maket/progon-zaglushka.js';
const ДВИЖ  = 'maket/progon-dvizhok.js';
const СТР   = 'pages/admin.html';

const ОТКАТЫ = [
  /* ─── одно определение ─── */
  [ПРАВ,
   "    R.БУКВЫ_ГРУПП = ['A',",
   "    R.БУКВЫ_ГРУПП = ['A', 'B'];\n    R.БУКВЫ_ГРУПП = ['A',",
   'список букв групп объявлен ровно один раз, и он в правилах'],

  [СЕТКА,
   '    function isGroupMatch(m)',
   "    var букв = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];\n    function isGroupMatch(m)",
   'в сетке не осталось собственного списка букв'],

  [СЕТКА,
   'именаСлотов[KSLT_RULES.букваГруппы(g) + м.place] = м.playerId;',
   "именаСлотов[String.fromCharCode(64 + g) + м.place] = м.playerId;",
   'буквы берутся у правил во всех местах, где строится метка'],

  /* ─── занятые буквы ─── */
  [ПРАВ,
   "'G', 'H', 'J',",
   "'G', 'H', 'I',",
   'в алфавите групп нет I — она занята доп. матчем'],

  [ПРАВ,
   "'O', 'P', 'R',",
   "'O', 'P', 'Q',",
   'в алфавите групп нет Q — она занята добором'],

  /* ─── запасного варианта нет ─── */
  [ПРАВ,
   '        if (!н || н < 1 || н > R.БУКВЫ_ГРУПП.length) return null;\n        return R.БУКВЫ_ГРУПП[н - 1];',
   '        return R.БУКВЫ_ГРУПП[н - 1] || номер;',
   'буква вне таблицы — это отказ, а не число'],

  [ПРАВ,
   '        var и = R.БУКВЫ_ГРУПП.indexOf(буква.charAt(0).toUpperCase());\n        return и === -1 ? null : и + 1;',
   '        return буква.charCodeAt(0) - 64;',
   'обратный перевод идёт по той же таблице, а не по коду буквы'],

  [СЕТКА,
   '            return KSLT_RULES.группаПоБукве(метка.charAt(0));',
   '            return метка.charCodeAt(0) - 64;',
   'в сетке не осталось перевода буквы через код'],

  /* ─── судья ─── */
  [ПРАВ,
   "        if (г > R.БУКВЫ_ГРУПП.length) return 'групп_много';\n",
   '',
   'судья настроек ограничивает число групп длиной алфавита'],

  [СЕТКА,
   "            'групп_много': isEn",
   "            'групп_многоXX': isEn",
   'у отказа «групп много» есть слова, а не код'],

  [СЕТКА,
   "'At most ' + KSLT_RULES.БУКВЫ_ГРУПП.length + ' groups",
   "'At most 24 groups",
   'граница названа числом из таблицы в ОБОИХ языках'],

  /* ─── две копии ─── */
  [ПРМОБ,
   '    var R = {};',
   '    var R = {}; /* копия разошлась */',
   'копии kslt-rules.js в js/ и mobile/www/js/ совпадают'],

  /* ─── прогон не угадывает ─── */
  [ЗАГЛ,
   '        return new Proxy(о, {',
   '        return о; // eslint-disable-line\n        /* eslint-disable */ return new Proxy(о, {',
   'заглушка базы падает на непредусмотренной форме запроса'],

  [ЗАГЛ,
   '        if (о && typeof о.then === \'function\' && о instanceof Promise) return о;',
   '        if (false) return о;',
   'обещание заглушка не оборачивает'],

  [СЕТКА,
   '        жеребьёвкаГрупп: generateGroupDraw,',
   '        жеребьёвкаГрупп: function () {},',
   'прогон зовёт настоящие функции этапов'],

  [ДВИЖ,
   '        return window.KSLT_RULES.группаПоБукве(метка.charAt(0));',
   "        var м = String(метка || '').match(/^([A-H])(\\d+)$/);\n        return м ? (м[1].charCodeAt(0) - 64) : null;",
   'прогон берёт номер группы у продукта, а не своей шкалой'],

  [ДВИЖ,
   '                    if (!window.KSLT_RULES.бедаНастройкиГрупп(г, в, л)) итог.push({ людей: л, групп: г, выходят: в });',
   '                    if (л >= г * 2) итог.push({ людей: л, групп: г, выходят: в });',
   'годные настройки перечисляет судья продукта'],

  [ЗАГЛ,
   '    Math.random = function () {',
   '    var неЗасеян = function () {',
   'жребий прогона засеян'],

  [ДВИЖ,
   "            if (дважды.length) сказать('группа ' + г + ': пара встречается дважды (' + дважды.length + ')');",
   '            if (дважды.length) { /* молчим */ }',
   'прогон проверяет все четыре пункта'],

  [ДВИЖ,
   '            var дубли = A.прогон.дубли(все);',
   '            var дубли = [];',
   'дубль в сетке проверяется на КАЖДОМ шаге, а не в конце'],

  [СТР,
   'kslt-rules.js?v=23',
   'kslt-rules.js?v=22',
   'версии подняты — иначе правка не доедет до того, у кого файл в кеше']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-alfavit-grupp.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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
