/**
 * ЗАМЕР 27.10: ТРИДЦАТЬ ШЕСТЬ ОТКРЫТЫХ ЗАПИСЕЙ ВЕТКИ D ПРОТИВ КОДА.
 * Кусок 191.
 *
 * Слово Кости: «закрывай D быстро, качественно, без переделок».
 * Быстро — значит сперва не чинить то, что уже закрыто. ЧИТАТЬ ЗАПИСЬ —
 * ЗНАЧИТ ПЕРЕМЕРИТЬ ЕЁ.
 *
 *   node tools/razovye/191-vetka-d.js
 */
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const чит = п => { try { return fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8'); } catch (e) { return null; } };
const гасить = т => т.replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[^\n]/g, ' '))
                     .replace(/^([ \t]*)\/\/[^\n]*$/gm, (м, о) => о);

function собрать(корень, расш, кроме) {
    const из = [];
    (function идти(д) {
        let сп = [];
        try { сп = fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }); } catch (e) { return; }
        сп.forEach(э => {
            const п = д ? д + '/' + э.name : э.name;
            if (кроме.some(к => п === к || п.indexOf(к + '/') === 0)) return;
            if (э.isDirectory()) идти(п);
            else if (расш.some(р => э.name.endsWith(р))) из.push(п);
        });
    })(корень);
    return из;
}
const КРОМЕ = ['node_modules', '.git', 'test-results', 'builds', 'mobile/android', 'mobile/ios'];
const JS      = собрать('js', ['.js'], КРОМЕ);
const АДМ     = JS.filter(ф => ф.indexOf('js/admin') === 0);
const ПУБ     = JS.filter(ф => ф.indexOf('js/admin') !== 0);
const CSS     = собрать('css', ['.css'], КРОМЕ);
const HTML    = собрать('pages', ['.html'], КРОМЕ).concat(['index.html']);

const строки = [];
const св = (н, что, записано, замер, пояснение) =>
    строки.push({ н, что, записано, замер, пояснение: пояснение || '' });

const счёт = (набор, при, безК) => набор.reduce((н, ф) => {
    let т = чит(ф); if (т === null) return н;
    if (безК) т = гасить(т);
    return н + (т.match(при) || []).length;
}, 0);
const файлов = (набор, при, безК) => набор.filter(ф => {
    let т = чит(ф); if (т === null) return false;
    if (безК) т = гасить(т);
    return при.test(т);
}).length;

/* 6. английское «без рейтинга» двумя словами */
св(6, 'мест с No rating / Unranked', '2 разных слова',
   'No rating ' + счёт(JS.concat(HTML), /No rating/g, true) +
   ' · Unranked ' + счёт(JS.concat(HTML), /Unranked/g, true),
   'запись: крупная карточка говорит одно, полоса другое');

/* 11. money(n) объявлен дважды, девять мест не зовут */
св(11, 'объявлений money(', 2, счёт(JS, /function\s+money\s*\(/g, true));
св(11, 'мест с разделителем тысяч мимо money', 9,
   счёт(JS, /replace\(\/\\B\(\?=\(\\d\{3\}\)\+\(\?!\\d\)\)\/g/g, true),
   'признак: та самая регулярка разделителя');

/* 14. девять файлов рисуют кружок инициалов сами */
св(14, 'файлов, рисующих инициалы сами', 9,
   файлов(JS, /initials|инициал/i, true));
св(14, 'зовущих дом KSLT_LICO.кружок', 2,
   счёт(JS, /KSLT_LICO\.кружок/g, true));

/* 15. четырнадцать админских окон без запирания */
св(15, 'админских окон без запирания', 14, -1, 'мерит свой сторож оснастки окон');

/* 18. домов продукта */
св(18, 'домов продукта KSLT_*', 39,
   new Set((JS.map(ф => чит(ф) || '').join('\n').match(/\bKSLT_[A-ZА-Я_]+\b/g) || [])).size);

/* 31. восемь мест считали «сегодня» по Гринвичу */
св(31, 'мест с new Date().toISOString().slice(0,10)', 8,
   счёт(JS, /toISOString\(\)\s*\.\s*slice\(0,\s*10\)/g, true),
   'шесть из восьми — в админке, по записи');
св(31, 'зовущих дом KSLT_VREMYA', 2,
   файлов(JS, /KSLT_VREMYA/, true));

/* 32. своя граница админки 768 */
св(32, 'медиа на 768 в css/admin.css', 'есть',
   счёт(['css/admin.css'], /max-width:\s*768px/g, true));
св(32, 'медиа на 640 и 992 в css/admin.css', 'шкала',
   счёт(['css/admin.css'], /max-width:\s*(640|992)px/g, true));

/* 33. три редактора RU/EN/KG живут в DOM одновременно */
св(33, 'редакторов новостей в разметке админки', 3,
   счёт(АДМ, /newsEditor|quill|editor-(ru|en|kg)/gi, true),
   'грубый признак — СВЕРИТЬ ЧТЕНИЕМ');

/* 36. мёртвые английские подписи */
св(36, 'вхождений _en в js', 1540, счёт(JS, /_en\b/g, true),
   'число прежним прибором не воспроизводится — так и записано');

/* 4,5,7,19,23,24,27,28 — под храповиками сторожей */
const храп = [
  ['4 доводов без зовущего', 'tools/check-dovody.js', /<=\s*(\d+)/, 19],
  ['5 голых переменных', 'tools/check-dannye-v-razmetku.js', /П\.переменных <= (\d+)/, 1501],
  ['7 зовов в склейках', 'tools/check-dannye-v-razmetku.js', /П\.зовы <= (\d+)/, 254],
  ['7 отдают разметку', 'tools/check-dannye-v-razmetku.js', /П\.отдают <= (\d+)/, 217],
  ['7 копят через +=', 'tools/check-dannye-v-razmetku.js', /П\.копят <= (\d+)/, 344],
  ['7 склеек', 'tools/check-dannye-v-razmetku.js', /П\.склеек <= (\d+)/, 2153],
  ['23 капсул числом', 'tools/check-radiusy.js', /КАПСУЛ[^=]*=\s*(\d+)/, 9],
  ['24 радиусов мимо шкалы', 'tools/check-radiusy.js', /ПОТОЛОК[^=]*=\s*(\d+)/, 62]
];
храп.forEach(([имя, ф, при, записано]) => {
    const т = чит(ф);
    const м = т && т.match(при);
    св(имя.split(' ')[0], имя + ' (храповик)', записано, м ? Number(м[1]) : -1,
       т ? 'потолок в ' + ф : 'файла сторожа нет');
});

console.log('');
console.log('  ВЕТКА D — ТРИДЦАТЬ ШЕСТЬ ЗАПИСЕЙ ПРОТИВ КОДА, 27.10');
console.log('');
let разошлось = 0;
строки.forEach(с => {
    const совпало = String(с.записано) === String(с.замер);
    if (!совпало) разошлось++;
    console.log('  ' + (совпало ? 'v' : 'x') + ' [' + с.н + '] ' + с.что);
    console.log('      записано ' + с.записано + '   ·   замер ' + с.замер +
        (совпало ? '' : '   <-- РАЗОШЛОСЬ'));
    if (с.пояснение) console.log('      ' + с.пояснение);
});
console.log('');
console.log('  сверено ' + строки.length + ', разошлось ' + разошлось);
console.log('');
