/**
 * ЗАМОРОЗКА ШКАЛЫ КЕГЛЕЙ.
 *
 * Шкала нарисована и согласована: Figma «Foundations» -> Typography (3:2),
 * десять ступеней, и та же шкала описана в css/tokens.css (--fs-2xs ... --fs-4xl).
 * Код с ней разошёлся на 1877 объявлений font-size, из которых 1589 были мимо
 * ступеней: 0.85rem, 0.8rem, 0.9rem и ещё шестьдесят вариантов.
 *
 * 21.09 всё сведено к токенам. Правило держит результат: СЫРОЙ font-size
 * ЖИВЁТ ТОЛЬКО В tokens.css. Везде остальное — var(--fs-*).
 *
 * Почему правилом, а не договорённостью: разнобой накопился не злым умыслом,
 * а по одному значению за раз. Договорённость этого не ловит, проверка ловит.
 *
 *   node tools/check-shkala.js
 */
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');
const ПАПКА = path.join(КОРЕНЬ, 'css');
const ошибки = [];      /* сырое число сразу за font-size — этого быть не должно */
const вДолг  = [];      /* число внутри clamp / calc / min / max — известный долг */
let объявлений = 0;

/* ПОТОЛОК ДОЛГА. 24.09 сторож научился видеть числа внутри clamp — и нашёл
   55 штук по всему сайту. Разбирать их разом значит уйти с маршрута, а
   забыть — значит копить дальше. Поэтому долг посчитан и заморожен числом:
   правило падает, если их стало БОЛЬШЕ. Каждая секция, дойдя до своей
   очереди, снимает свои и опускает потолок. */
const ПОТОЛОК = 55;

fs.readdirSync(ПАПКА).filter(ф => ф.endsWith('.css') && ф !== 'tokens.css').forEach(ф => {
    const строки = fs.readFileSync(path.join(ПАПКА, ф), 'utf8').split('\n');
    строки.forEach((стр, i) => {
        /* ДЫРА, НАЙДЕННАЯ 24.09: якорь требовал число СРАЗУ за font-size,
           и clamp(1.15rem, 5vw, 1.32rem) в .pl-guest-title проходил мимо
           три дня. Кегль плавал 18.4…21.1 — не ступень ни в одной точке.
           Теперь ловится и сырое число, и любое внутри calc / clamp /
           min / max. var(--fs-*) по-прежнему проходит. */
        if (/font-size:\s*[0-9.]+(rem|px|em)/.test(стр)) {
            ошибки.push(ф + ':' + (i + 1) + '  ' + стр.trim());
        } else if (/font-size:\s*(?:clamp|calc|min|max)\([^)]*?[0-9.]+(rem|px|em)/.test(стр)) {
            вДолг.push(ф + ':' + (i + 1) + '  ' + стр.trim());
        }
    });
});

fs.readdirSync(ПАПКА).forEach(ф => {
    if (!ф.endsWith('.css')) return;
    объявлений += (fs.readFileSync(path.join(ПАПКА, ф), 'utf8').match(/font-size:/g) || []).length;
});

console.log('');
if (ошибки.length === 0 && вДолг.length <= ПОТОЛОК) {
    console.log('  ок      шкала кеглей: сырых font-size вне tokens.css нет');
    console.log('          всего объявлений font-size в проекте: ' + объявлений);
    console.log('          плавающих кеглей в clamp / calc: ' + вДолг.length + ' из ' + ПОТОЛОК +
                ' — известный долг, растить нельзя');
    console.log('');
    process.exit(0);
}
if (ошибки.length === 0) {
    console.log('  НЕ ТАК  плавающих кеглей стало больше: ' + вДолг.length + ' против потолка ' + ПОТОЛОК);
    console.log('          clamp(1.15rem, 5vw, 1.32rem) — это кегль 18.4…21.1, не ступень');
    console.log('          ни в одной точке, и сторож не видел его три дня: якорь требовал');
    console.log('          число СРАЗУ за font-size. Долг посчитан и заморожен — он может');
    console.log('          только уменьшаться. Опустите ПОТОЛОК в этом файле, когда снимете');
    console.log('          свои, и не добавляйте новых.');
    console.log('');
    вДолг.slice(0, 40).forEach(е => console.log('          ' + е));
    if (вДолг.length > 40) console.log('          … ещё ' + (вДолг.length - 40));
    console.log('');
    process.exit(1);
}
console.log('  НЕ ТАК  сырой font-size вне tokens.css — ' + ошибки.length + ' шт');
console.log('          Шкала согласована на доске Figma «Foundations» -> Typography и');
console.log('          описана в css/tokens.css. Новый сырой размер — это новая ступень');
console.log('          мимо шкалы, и через полгода их снова будет шестьдесят.');
console.log('          Возьмите ближайшую ступень: var(--fs-2xs) 11 · --fs-xs 12 ·');
console.log('          --fs-sm 14 · --fs-base 16 · --fs-md 18 · --fs-lg 21 ·');
console.log('          --fs-xl 26 · --fs-2xl 32 · --fs-3xl 40 · --fs-4xl 64.');
console.log('');
ошибки.slice(0, 40).forEach(е => console.log('          ' + е));
if (ошибки.length > 40) console.log('          … ещё ' + (ошибки.length - 40));
console.log('');
process.exit(1);
