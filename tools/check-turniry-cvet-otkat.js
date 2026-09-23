/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ЦВЕТА ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что оно
 * зелёное всегда. Каждое правило check-turniry-cvet.js проверяем обратным
 * ходом — возвращаем прежнее значение, правило ОБЯЗАНО упасть.
 *
 * Работаем на КОПИИ. Оригиналы не трогаем вообще.
 *
 *   node tools/check-turniry-cvet-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tokens.css', 'css/style.css', 'index.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-turniry-cvet.js'), 'utf8');

/* [имя, файл, что ищем, на что меняем, какое правило должно упасть] */
const ОТКАТЫ = [

['вернуть белый текст на красную заливку', 'css/tokens.css',
 '--danger-on:      var(--neutral-950);',
 '--danger-on:      #FFFFFF;',
 'контраст: бейдж «идёт сейчас» ≥ 4.5'],

['опустить синий обратно на #3B82F6', 'css/tokens.css',
 '--info:           var(--blue-400);',
 '--info:           var(--blue-500);',
 'контраст: бейдж «скоро» ≥ 4.5'],

['оставить прозрачную подложку от старого синего', 'css/tokens.css',
 '--alpha-blue-15:   rgba(96, 165, 250, 0.15);',
 '--alpha-blue-15:   rgba(59, 130, 246, 0.15);',
 '--alpha-blue-15 собран из того же тона, что --info'],

['сделать подложку «скоро» полупрозрачной', 'css/tokens.css',
 '--info-surface:    #1F2A37;',
 '--info-surface:    rgba(96, 165, 250, 0.15);',
 'подложка --info-surface непрозрачная'],

['убрать токен непрозрачной подложки «открыта»', 'css/tokens.css',
 '--success-surface: #183122;',
 '',
 'токен --success-surface объявлен и читается как цвет'],

['вернуть бейджу «идёт» белую подпись', 'css/style.css',
 '.tc-badge-live {\n    background: var(--danger);\n    color: var(--danger-on);',
 '.tc-badge-live {\n    background: var(--danger);\n    color: #fff;',
 'тон .tc-badge-live берёт текст var(--danger-on)'],

['вернуть «открыта» на прозрачную подложку', 'css/style.css',
 '    background: var(--success-surface);',
 '    background: var(--success-subtle);',
 'тон .tc-badge-open берёт подложку var(--success-surface)'],

['заменить у «скоро» край на рамку', 'css/style.css',
 '    color: var(--info);\n    box-shadow: inset 0 0 0 1px var(--border-light);',
 '    color: var(--info);\n    border: 1px solid var(--border-light);',
 'тон .tc-badge-soon не рисует рамку'],

['снять с «открыта» край вовсе', 'css/style.css',
 '    color: var(--success);\n    box-shadow: inset 0 0 0 1px var(--border-light);',
 '    color: var(--success);',
 'тон .tc-badge-open даёт край inset-тенью'],

['вернуть дате лайм', 'css/style.css',
 'Контраст 9.88. */\n    color: var(--text-secondary);',
 'Контраст 9.88. */\n    color: var(--accent);',
 'в .tc-date нет лайма'],

['вернуть лайм бейджу «идёт сейчас»', 'css/style.css',
 '.tc-badge-live {\n    background: var(--danger);',
 '.tc-badge-live {\n    background: var(--accent);',
 'в .tc-badge-live нет лайма'],

['развести «закрыта» и «завершён» по разным тонам', 'css/style.css',
 '.tc-badge-closed,\n.tc-badge-done {',
 '.tc-badge-closed { background: var(--neutral-surface); color: var(--text-secondary); }\n.tc-badge-done {',
 '«закрыта» и «завершён» — один тон'],

['притушить подложку отменённого до прежней', 'css/tokens.css',
 '--danger-surface:  #2A1517;',
 '--danger-surface:  #4A2226;',
 'контраст: бейдж «отменён» ≥ 4.5'],

['вернуть дату на стопроцентную ступень', 'css/style.css',
 'Контраст 9.88. */\n    color: var(--text-secondary);',
 'Контраст 9.88. */\n    color: var(--text-primary);',
 'ступень цвета: дата — var(--text-secondary)'],

['вернуть «местам» 35% белого', 'css/style.css',
 'просто плохо. */\n    color: var(--text-muted);',
 'просто плохо. */\n    color: var(--text-dim);',
 '«места» больше не на --text-dim'],

['оставить страницу на старых токенах', 'index.html',
 'tokens.css?v=19',
 'tokens.css?v=18',
 'tokens.css на всех страницах не ниже v=19']
];

/* отменённый турнир: вырезаем его тон целиком — до 22.09 его и не было */
(function () {
    const s = исходник['css/style.css'];
    const i = s.indexOf('.tc-badge-cancelled {');
    if (i !== -1) {
        const j = s.indexOf('}', i) + 1;
        ОТКАТЫ.push(['убрать тон отменённого турнира', 'css/style.css',
            s.slice(i, j), '', 'тон .tc-badge-cancelled объявлен']);
    }
})();

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'turniry-cvet-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-turniry-cvet.js'), ПРАВИЛО);

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-turniry-cvet.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-turniry-cvet.js.');
    console.log('          Сначала почини код, потом доказывай откатом.');
    console.log(база.вывод);
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(о => {
    const [имя, ф, что, на, ждём] = о;
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) {
        console.log('  ? ' + имя); console.log('      якоря нет в ' + ф + '. Правило НЕ доказано.'); плохих++; return;
    }
    if (сколько > 1) {
        console.log('  ! ' + имя); console.log('      якорь в ' + ф + ' встречается ' + сколько + ' раз — откат правит не то место.'); плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало, но ДРУГОЕ правило. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
    console.log('');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
