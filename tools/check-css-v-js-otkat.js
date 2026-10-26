/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ВИД ЖИВЁТ В CSS». На КОПИИ. Кусок 174.
 *
 * Каждый откат возвращает ОДНО прежнее положение дел и обязан уронить
 * ИМЕННО то правило, которое за это отвечает. «У меня зелёное» ничего не
 * доказывает.
 *
 *   node tools/check-css-v-js-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-cssvjs-'));
['css', 'tools', 'js'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛИ = {
    admin: 'css/admin.css',
    style: 'css/style.css',
    bracket: 'js/admin/sections/bracket.js',
    doubles: 'js/doubles-entry.js',
    reg: 'js/tournament-register.js',
};
const чистые = {};
Object.entries(ЦЕЛИ).forEach(([к, п]) => { чистые[к] = fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8'); });

function прогон(правки) {
    Object.entries(ЦЕЛИ).forEach(([к, п]) => {
        fs.writeFileSync(path.join(песок, п), (правки && правки[к]) ? правки[к] : чистые[к]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-css-v-js.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЯ — на содержимом, которое живёт в блоке постоянно, и в НАЧАЛЕ
   списков, а не в хвосте: в хвост дописывают (урок куска 164). */
const Я = {
    чип: '.ad-outcome-chip {\n    min-height: var(--btn-h-xs);',
    чипВкл: '.ad-outcome-chip.active {',
    чипФокус: '.ad-outcome-chip:focus-visible {',
    строгий: '.ad-btn.ad-retired-btn.active,',
    пометка: '.ad-brk-outcome {',
    медиаЧип: '@media (max-width: 640px) {\n    .ad-outcome-chip {',
    подложка: '.de-overlay {\n    position: fixed;\n    inset: 0;\n    background: var(--overlay-modal);',
    заголовок: '.auth-modal-title,\n.trn-register-modal-title,\n.de-title {',
    полеКегль: '    color: var(--text-primary);\n    font-size: var(--input-fs);\n}',
    полеВысота: 'min-height: var(--input-h);',
    крестикПарной: '.de-ntrp {\n    color: var(--text-muted);',
    стилиПарной: 'function стили() {}',
    стилиЗаписи: 'function injectStyles() {}',
    ария: "chip.setAttribute('aria-pressed', 'true')",
};
Object.entries(Я).forEach(([имя, як]) => {
    const где = ['admin', 'style', 'bracket', 'doubles', 'reg'].filter(к => чистые[к].includes(як));
    const сколько = где.reduce((с, к) => с + чистые[к].split(як).length - 1, 0);
    if (сколько !== 1) {
        console.log('  ЯКОРЬ НЕГОДЕН: «' + имя + '» встречается ' + сколько + ' раз (' + где.join(', ') + ')');
        process.exitCode = 1;
    }
});

const ОТКАТЫ = [
    ['вернуть вписывание css из js',
     { bracket: чистые.bracket.replace("        /* ВИД ЖИВЁТ В CSS, А НЕ В СТРОКЕ JS (кусок 174)",
        "        var styleEl = document.createElement('style');\n" +
        "        styleEl.textContent = '.ad-outcome-chip{padding:5px 12px;}';\n" +
        "        document.head.appendChild(styleEl);\n" +
        "        /* ВИД ЖИВЁТ В CSS, А НЕ В СТРОКЕ JS (кусок 174)") },
     'ни один js не вписывает css строкой'],

    ['снять у чипа видимый фокус',
     { admin: чистые.admin.replace(Я.чипФокус, '.ad-outcome-chip-byl-fokus {') },
     'правила чипов исхода живут в css'],

    ['вернуть !important в кнопку выбывшего',
     { admin: чистые.admin.replace(Я.строгий + '\n.ad-btn.ad-winner-btn.active {\n    background: var(--accent);',
        Я.строгий + '\n.ad-btn.ad-winner-btn.active {\n    background: var(--accent) !important;') },
     'вид чипов и кнопки выбывшего обходится без !important'],

    ['вернуть чипу переход по `all`',
     { admin: чистые.admin.replace('    transition: background-color .15s, border-color .15s, color .15s;',
        '    transition: all .15s;') },
     'переход чипа перечисляет свойства, а не `all`'],

    ['завести пометке исхода второе определение в css',
     { admin: чистые.admin.replace(Я.пометка, '.ad-brk-outcome { font-weight: 400; }\n.ad-brk-outcome {') },
     'пометка исхода определена один раз'],

    ['описать пометку исхода снова в js',
     { bracket: чистые.bracket.replace("    function openScoreModal(",
        "    var СТАРОЕ_ПРАВИЛО = '.ad-brk-outcome{display:inline-block;}';\n" +
        "    function openScoreModal(") },
     'пометка исхода не описана в js'],

    ['отнять у пометки исхода вид, оставив положение',
     { admin: чистые.admin.replace(
        '    border-radius: var(--radius-xs);\n    background: var(--accent-subtle);\n    color: var(--accent);\n}\n.ad-brk-match',
        '    border-radius: var(--radius-xs);\n}\n.ad-brk-match') },
     'пометка исхода несёт и положение, и вид'],

    ['снять aria-pressed с разметки чипов',
     { bracket: чистые.bracket.replace(/aria-pressed="' \+ \([^)]*\) \+ '"/g, '') },
     'каждый чип исхода говорит состояние диктору'],

    ['развести класс и состояние для диктора',
     { bracket: чистые.bracket.replace(Я.ария, "chip.dataset.pressed = 'true'") },
     'состояние для диктора меняется вместе с классом'],

    ['вернуть чипу высоту мимо шкалы',
     { admin: чистые.admin.replace('    min-height: var(--btn-h-xs);\n    padding: var(--space-1) var(--space-3);',
        '    padding: 5px 12px;') },
     'высота чипа — ступень шкалы кнопок'],

    ['снять медиа, поднимающее чип до 44',
     { admin: чистые.admin.replace(Я.медиаЧип, '@media (max-width: 640px) {\n    .ad-outcome-chip-byl {') },
     'на узком виде чип дорастает до цели 44'],

    ['унести правила парного окна из css',
     { style: чистые.style.replace('.de-modal {\n    position: relative;', '.de-modal-byl {\n    position: relative;') },
     'правила окна парной заявки живут в css'],

    ['унести правила окна записи из css',
     { style: чистые.style.replace('.trn-register-modal {\n    position: relative;', '.trn-register-modal-byl {\n    position: relative;') },
     'правила окна записи живут в css'],

    ['вернуть телу функции вида строку css',
     { doubles: чистые.doubles.replace(Я.стилиПарной,
        "function стили() { var c = document.createElement('x'); c.textContent = '.de-modal{}'; }") },
     'функции вида в обоих окнах пусты'],

    ['вернуть запасное значение токену',
     { style: чистые.style.replace('.de-ntrp {\n    color: var(--text-muted);',
        '.de-ntrp {\n    color: var(--text-dim, #888);') },
     'в переехавших окнах нет запасных значений у токенов'],

    ['вернуть отступ числом мимо шкалы',
     { style: чистые.style.replace('.de-item {\n    display: flex;', '.de-item {\n    padding: 8px 10px;\n    display: flex;') },
     'отступы переехавших окон — ступени шкалы'],

    ['вернуть кегль числом в rem',
     { style: чистые.style.replace('.de-note {\n    margin: var(--space-3) 0 0;\n    font-size: var(--fs-xs);',
        '.de-note {\n    margin: var(--space-3) 0 0;\n    font-size: .8rem;') },
     'кегли переехавших окон — токены шкалы, а не числа'],

    ['вернуть полю кегль мельче 16',
     { style: чистые.style.replace(Я.полеКегль, '    color: var(--text-primary);\n    font-size: var(--fs-sm);\n}') },
     'поле ввода не мельче 16'],

    ['вернуть полю высоту 38',
     { style: чистые.style.replace(Я.полеВысота, 'min-height: 38px;') },
     'поле ввода и кнопки окон — ступень 44'],

    ['вернуть крестику размер 16×24',
     { style: чистые.style.replace(
        '    justify-content: center;\n    width: var(--btn-h-md);\n    height: var(--btn-h-md);\n    padding: 0;\n    background: none;\n    border: none;\n    border-radius: var(--radius-full);\n    color: var(--text-muted);\n    font-size: var(--fs-xl);',
        '    justify-content: center;\n    padding: 0;\n    background: none;\n    border: none;\n    border-radius: var(--radius-full);\n    color: var(--text-muted);\n    font-size: var(--fs-xl);') },
     'крестик окна — цель 44'],

    ['вернуть подложке своё число',
     { style: чистые.style.replace(Я.подложка, 'background: rgba(0, 0, 0, .72);') },
     'подложка обоих окон — понятие, а не своё число'],

    ['развести заголовки окон по своим правилам',
     { style: чистые.style.replace(Я.заголовок, '.auth-modal-title {') },
     'заголовок трёх окон сайта объявлен одним правилом'],
];

console.log('');
console.log('  ПРУВЕР СТОРОЖА «ВИД ЖИВЁТ В CSS» — песок ' + песок);
console.log('');

const чисто = прогон(null);
if (чисто.упало) {
    console.log('  НЕ ТАК  сторож падает на ЧИСТОЙ копии — песок неполон');
    console.log(чисто.вывод.split('\n').slice(0, 14).join('\n'));
    process.exit(1);
}
console.log('  v чистая копия зелена');

let беда = 0;
ОТКАТЫ.forEach(([имя, правки, ждём]) => {
    const р = прогон(правки);
    const тоСамое = р.упало && р.вывод.includes(ждём);
    if (!тоСамое) {
        беда++;
        console.log('  x ' + имя + '  ->  ' + (р.упало ? 'упало ДРУГОЕ правило' : 'НЕ УПАЛО') +
                    ' (ждали «' + ждём + '»)');
        if (р.упало) {
            const свои = (р.вывод.match(/^          x .*$/gm) || []).map(с => с.trim());
            console.log('      упали: ' + свои.join(' · '));
        }
    } else {
        console.log('  v ' + имя + '  ->  «' + ждём + '»');
    }
});

prodОтчёт();
function prodОтчёт() {
    console.log('');
    if (беда === 0) {
        console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
        console.log('          оригиналы не трогались — работа шла на копии');
        console.log('');
        process.exit(process.exitCode || 0);
    }
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
    console.log('');
    process.exit(1);
}
