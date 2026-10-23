/**
 * РАЗОВЫЙ ПРИБОР 148 — ДВОЙНАЯ ПРОВЕРКА ОТКРЫТЫХ ЗАПИСЕЙ ВЕТКИ D.
 * Слово Кости: «давай гони».
 *
 * Он НЕ чинит и НЕ судит. Он берёт КАЖДОЕ ЧИСЛО из записи трекера и
 * спрашивает код: столько ли там сегодня. Напротив каждого числа пишет
 * «сошлось» или «разошлось» — потому что 19.10 такая же сверка нашла шесть
 * записей, висевших открытыми при сделанной работе, и четыре числа,
 * разошедшихся с кодом.
 *   node tools/razovye/148-dvoynaya-proverka-D.js
 */
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..');

const чит = (ф) => { try { return fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); } catch (e) { return null; } };
const сколько = (т, re) => т === null ? null : (т.match(re) || []).length;
const строкаС = (ф, игла) => {
    const т = чит(ф); if (т === null) return [];
    return т.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.indexOf(игла) !== -1).map(([n]) => n);
};
const итог = [];
function сверка(запись, что, ждём, прибор) {
    const сошлось = String(ждём) === String(прибор);
    итог.push({ запись, что, ждём, прибор, сошлось });
}

/* ---- 1. печатный лист в трёх (четырёх) копиях ---- */
const ПЕЧАТЬ = [
    ['js/admin/sections/users.js', 10],
    ['js/admin/sections/vouchers.js', 8],
    ['js/admin/sections/finances.js', 8],
    ['js/admin/core/export.js', 3]
];
ПЕЧАТЬ.forEach(([ф, красок]) => {
    const т = чит(ф);
    const блоки = сколько(т, /@media\s+print|@page/g);
    const цвета = т === null ? null : (т.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || []).length;
    сверка('1 печатный лист', ф + ' — блоков печати есть', '>0', блоки > 0 ? '>0' : '0');
    сверка('1 печатный лист', ф + ' — красок', красок, цвета);
});
сверка('1 печатный лист', 'export.js без @page и @media print',
    'да', (сколько(чит('js/admin/core/export.js'), /@media\s+print|@page/g) === 0) ? 'да' : 'нет');
сверка('1 печатный лист', '@media print живёт и в admin.css',
    'да', skolkoCss());
function skolkoCss() {
    const n = сколько(чит('css/admin.css'), /@media\s+print/g);
    return n > 0 ? 'да' : 'нет';
}

/* ---- 2/3. обход: кнопки, пишущие в базу без подтверждения ---- */
const турниры = чит('js/admin/sections/tournaments.js');
сверка('2 обход админки', 'tournaments.js — update published_at',
    'есть', сколько(турниры, /published_at/g) > 0 ? 'есть' : 'нет');
сверка('2 обход админки', 'строки 491-541 помечены записью — там ли published_at',
    'да', (строкаС('js/admin/sections/tournaments.js', 'published_at').some(n => n >= 460 && n <= 580)) ? 'да' : 'нет: ' + строкаС('js/admin/sections/tournaments.js', 'published_at').join(','));
сверка('3 обход финансов', 'finances.js:320 — пустое состояние инлайнами',
    'да', (строкаС('js/admin/sections/finances.js', 'Оплат пока нет').join(',') || 'нет'));
['913', '917', '961'].forEach(() => {});
сверка('3 обход финансов', 'пишут в базу — Сохранить и Удалить',
    'строки 913/917/961', строкаС('js/admin/sections/finances.js', ".from('payments')").join(',') || 'не найдено');

/* ---- 4. слушатель на теле таблицы ---- */
const РАЗДЕЛЫ = [['coaches', 196], ['courts', 320], ['finances', 356], ['news', 539], ['players', 349], ['vouchers', 386]];
РАЗДЕЛЫ.forEach(([имя, строка]) => {
    const ф = 'js/admin/sections/' + имя + '.js';
    const места = строкаС(ф, "tbody.addEventListener('click'").concat(строкаС(ф, 'tbody.addEventListener("click"'));
    сверка('4 слушатель копится', ф + ' — строка слушателя', строка, места.join(',') || 'НЕТ');
});
сверка('4 слушатель копится', 'tournaments.js — tbody.onclick',
    '522', строкаС('js/admin/sections/tournaments.js', 'tbody.onclick').join(',') || 'НЕТ');

/* ---- 13. инлайн чекбокса дважды ---- */
const утилиты = чит('js/admin/core/utils.js');
const чекбоксы = (утилиты || '').split('\n').map((l, i) => [i + 1, l])
    .filter(([, l]) => /width:\s*18px/.test(l) && /accent-color/.test(l)).map(([n]) => n);
сверка('13 инлайн чекбокса', 'utils.js — строки инлайна', '30,149 (или 29,148)', чекбоксы.join(',') || 'НЕТ');

/* ---- 15. одно имя на два понятия ---- */
сверка('15 одно имя два понятия', 'courts.js — crtServiceName', '1036,1557,1972',
    строкаС('js/admin/sections/courts.js', 'crtServiceName').join(',') || 'НЕТ');
сверка('15 одно имя два понятия', 'challenges.js — chalCancelBattle', '246,369,1899,1915,1940',
    строкаС('js/admin/sections/challenges.js', 'chalCancelBattle').join(',') || 'НЕТ');

/* ---- 16. пять окон навешивают ловушку на подложку ---- */
const ловушки = [];
['js/dashboard.js', 'js/player.js'].forEach(ф => {
    const т = чит(ф); if (т === null) return;
    т.split('\n').forEach((l, i) => {
        if (/overlay\.addEventListener\(\s*['"]keydown/.test(l)) ловушки.push(ф + ':' + (i + 1));
    });
});
сверка('16 ловушка на подложке', 'места overlay keydown', 'dashboard 1607,3701,4468 + player 1632', ловушки.join(' ') || 'НЕТ');

/* ---- 18. !important по всему css ---- */
let важностьCss = 0, важностьАдмин = 0, поФайлам = {};
const обойтиCss = (д) => {
    fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(e => {
        if (e.isDirectory()) return;
        if (!/\.css$/.test(e.name)) return;
        const n = скольно(д + '/' + e.name);
        if (n) { поФайлам[e.name] = n; важностьCss += n; if (e.name === 'admin.css') важностьАдмин = n; }
    });
};
function скольно(ф) { return сколько(чит(ф), /!important/g); }
обойтиCss('css');
сверка('18 !important', 'в admin.css', 69, важностьАдмин);
сверка('18 !important', 'по всему css/', 115, важностьCss);
сверка('18 !important', 'style.css', 21, поФайлам['style.css'] || 0);
сверка('18 !important', 'tournament-detail.css', 14, поФайлам['tournament-detail.css'] || 0);

/* ---- 11. 81 infinite в css ---- */
let бесконечных = 0;
fs.readdirSync(path.join(КОРЕНЬ, 'css')).forEach(ф => {
    if (/\.css$/.test(ф)) бесконечных += сколько(чит('css/' + ф), /\binfinite\b/g);
});
сверка('11 отказ-остаток', 'infinite в css', 81, бесконечных);

/* ---- 7. колонки, названные эмодзи без слов ---- */
const эмодзи = [];
['sponsors', 'coaches', 'news'].forEach(имя => {
    const ф = 'js/admin/sections/' + имя + '.js';
    const т = чит(ф); if (т === null) return;
    т.split('\n').forEach((l, i) => {
        if (/<th[^>]*>\s*(&#x1F|\uD83D|\uD83C|\u{1F441}|\u{1F44D}|\u{1F5F3})/u.test(l)) эмодзи.push(ф + ':' + (i + 1));
    });
});
сверка('7 колонки эмодзи', 'заголовки колонок одной картинкой', 'есть', эмодзи.length ? 'есть: ' + эмодзи.join(' ') : 'не найдено этим прибором');

/* ---- 12. прувер со списком правок ---- */
сверка('12 ветка конкурент-инлайн', 'check-badge-tona-otkat.js на месте',
    'да', fs.existsSync(path.join(КОРЕНЬ, 'tools', 'check-badge-tona-otkat.js')) ? 'да' : 'нет');

/* ---- вывод ---- */
const ш = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
console.log('');
console.log('  ' + ш('запись', 26) + ш('что мерим', 52) + ш('запись говорит', 30) + 'прибор говорит');
console.log('  ' + '-'.repeat(130));
итог.forEach(о => {
    console.log('  ' + (о.сошлось ? ' ' : '!') + ш(о.запись, 25) + ш(о.что, 52) + ш(о.ждём, 30) + о.прибор);
});
const плохо = итог.filter(о => !о.сошлось).length;
console.log('');
console.log('  сверок ' + итог.length + ', разошлось ' + плохо);
console.log('');
