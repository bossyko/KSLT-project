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
   'букву никто не строит сам — только общей таблицей'],

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

  /* ─── участник без личности ─── */
  [СЕТКА,
   '        var безКарточки = approved.filter(function(r) { return !r.player_id; });',
   '        var безКарточки = [];',
   'сторож «нет карточки игрока» стоит в двери менеджера'],

  [СЕТКА,
   "                (безКарточки.length > 8 ? ' … +' + (безКарточки.length - 8) : '') + '</p>',\n                null, 'warn');\n            return;",
   "                (безКарточки.length > 8 ? ' … +' + (безКарточки.length - 8) : '') + '</p>',\n                null, 'warn');",
   'отказ громкий и до жеребьёвки, а не тихий расчёт после'],

  ['js/admin/core/constants.js',
   "        drawNoCardTitle: 'У части заявок нет карточки игрока',",
   "        drawNoCardTitleXX: 'У части заявок нет карточки игрока',",
   'отказ назван словами на обоих языках'],

  [ДВИЖ,
   '        await A.прогон.сеткуЦеликом(турнир, заявки, playersMap);',
   '        await A.прогон.жеребьёвкаГрупп(турнир, заявки, playersMap);',
   'прогон ходит в дверь менеджера, а не мимо неё'],

  /* ЯКОРЬ ДЕРЖИТСЯ НА ФОРМЕ, А НЕ НА ЧИСЛЕ. Здесь стояло `v=24` прямым
     текстом, и откат протух ровно тогда, когда версия стала 25 — та же беда,
     от которой 30.09 переписали само правило. Берём любую версию и ставим
     заведомо другую: правило ловит расхождение, а не конкретное число. */
  [СТР,
   /kslt-rules\.js\?v=\d+/,
   'kslt-rules.js?v=1',
   'версия файла одна на все страницы и стенды']
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
  /* Якорь бывает строкой и бывает формой: версия файла меняется по замыслу,
     и держать откат на её числе — значит растить протухающее правило. */
  const n = (было instanceof RegExp)
    ? (ориг.match(new RegExp(было.source, было.flags.replace('g', '') + 'g')) || []).length
    : ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + String(было instanceof RegExp ? было.source : было).replace(/\n/g, ' ⏎ ').slice(0, 90));
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
