/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ НОВОСТЕЙ ОТКАТОМ. Работаем на КОПИИ.
 *   node tools/check-novosti-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'js/home-news.js', 'index.html', 'index-en.html', 'index-kg.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-novosti.js'), 'utf8');

const ОТКАТЫ = [
['вернуть одну колонку на 900 — та самая причина 1993', 'css/style.css',
 '@media (max-width: 900px) {\n    .hn-grid {\n        grid-template-columns: 1fr 1fr;\n    }\n}',
 '@media (max-width: 900px) {\n    .hn-grid {\n        grid-template-columns: 1fr;\n    }\n}',
 'от 900 и уже сетка новостей в ДВЕ колонки'],

['вернуть счёту карточек условие min-width: 641', 'css/style.css',
 '@media (min-width: 901px) {\n    .hn-grid > .hn-card:nth-child(n+4) {',
 '@media (min-width: 641px) {\n    .hn-grid > .hn-card:nth-child(n+4) {',
 'четвёртую карточку прячем только при трёх колонках'],

['отнять у ленты новостей снап', 'css/style.css',
 '        overflow-x: auto;\n        scroll-snap-type: x mandatory;\n        -webkit-overflow-scrolling: touch;\n        scrollbar-width: none;\n        padding-bottom: 4px;\n    }\n    .hn-grid::-webkit-scrollbar',
 '        overflow-x: auto;\n        -webkit-overflow-scrolling: touch;\n        scrollbar-width: none;\n        padding-bottom: 4px;\n    }\n    .hn-grid::-webkit-scrollbar',
 'в ленте сетка новостей становится полосой'],

['сделать карточку ленты новостей резиновой', 'css/style.css',
 '    .hn-grid > .hn-card:nth-child(n) {\n        flex: 0 0 340px;\n        width: 340px;',
 '    .hn-grid > .hn-card:nth-child(n) {\n        flex: 1 1 auto;\n        width: auto;',
 'в ленте карточка новости 340 × 270 и прилипает'],

['вернуть ленте обложку 16:9', 'css/style.css',
 '    .hn-grid .hn-img {\n        aspect-ratio: auto;\n        height: 150px;',
 '    .hn-grid .hn-img {\n        aspect-ratio: 16 / 9;\n        height: auto;',
 'в ленте обложка 150, а не 16:9'],

['спрятать в ленте всё после третьей', 'css/style.css',
 '    .hn-grid > .hn-card:nth-child(n+4) { display: flex; }',
 '    .hn-grid > .hn-card:nth-child(n+4) { display: none; }',
 'в ленте показаны ВСЕ карточки'],

['разрешить заголовку в ленте сжиматься', 'css/style.css',
 '    .hn-grid .hn-card h3 { flex-shrink: 0; }',
 '    .hn-grid .hn-card h3 { flex-shrink: 1; }',
 'в ленте заголовку запрещено сжиматься'],

['показать плитку «Все новости» в сетке', 'css/style.css',
 '\n.hn-more {\n    display: none;',
 '\n.hn-more {\n    display: flex;',
 'плитка «Все новости» по умолчанию скрыта'],

['вернуть заголовку новости вес числом', 'css/style.css',
 '    /* Ступень card title лестницы 86:10 — Bold, а не Semi Bold. Было 600,\n       и новости расходились с турнирами на один вес. Решение Кости 23.09. */\n    font-weight: var(--fw-bold);',
 '    font-weight: 600;',
 'заголовок новости — Bold, как ступень card title'],

['вернуть дате новости 35% белого', 'css/style.css',
 '       Лестница цвета одна на обе секции: 100 заголовок · 72 анонс · 50 дата. */\n    color: var(--text-muted);',
 '       Лестница цвета одна на обе секции: 100 заголовок · 72 анонс · 50 дата. */\n    color: var(--text-dim);',
 'дата новости на ступени 50%, а не 35%'],

['уронить заголовок новости на планшете до 14', 'css/style.css',
 '    .hn-grid .hn-card h3 {\n        font-size: var(--fs-base);\n    }\n}',
 '    .hn-card h3 {\n        font-size: var(--fs-base);\n    }\n}',
 'на планшете заголовок новости остаётся 16'],

['убрать плитку из скрипта новостей', 'js/home-news.js',
 "'<a class=\"hn-more\" href=\"'",
 "'<a class=\"hn-none\" href=\"'",
 'плитку рисует js/home-news.js'],

['увести плитку новостей на другой адрес в английской', 'js/home-news.js',
 "? { href: 'pages/news-en.html', текст: 'All news' }",
 "? { href: 'pages/news.html', текст: 'All news' }",
 'плитка ведёт туда же, куда ссылка раздела в index-en.html'],

/* ── хвосты 23.09: дубль, отступы заголовка, дата в тесной карточке ─────── */
['вернуть второе правило .hn-card h3 — тот самый дубль', 'css/style.css',
 '    .hn-card p {\n        display: none;\n    }',
 '    .hn-card h3 {\n        font-size: var(--fs-sm);\n    }\n\n    .hn-card p {\n        display: none;\n    }',
 'заголовок новости на телефоне описан РОВНО ОДНИМ правилом'],

['вернуть заголовку собственные отступы — лесенка по левому краю', 'css/style.css',
 '           padding тела, поэтому по высоте не сдвинулось ничего. */\n        margin: 0;',
 '           padding тела, поэтому по высоте не сдвинулось ничего. */\n        padding: 0 9px;\n        margin: 8px 0 0;',
 'заголовок не держит собственных отступов'],

['оставить тело с прежними 8 сверху — снятый воздух потерян', 'css/style.css',
 '.hn-card .hn-body { padding: 16px 9px 10px; }',
 '.hn-card .hn-body { padding: 8px 9px 10px; }',
 'воздух над заголовком перенесён в поля тела'],

['вернуть дате новости 12 на телефоне', 'css/style.css',
 '    .hn-card .hn-date {\n        font-size: var(--fs-2xs);\n    }',
 '    .hn-card .hn-date {\n        font-size: var(--fs-xs);\n    }',
 'дата в тесной карточке — 11, как у турнира той же ширины'],

['вернуть мёртвый селектор .hn-card time', 'css/style.css',
 '    .hn-card .hn-body {\n        font-size: var(--fs-2xs);\n    }',
 '    .hn-card .hn-body,\n    .hn-card time {\n        font-size: var(--fs-2xs);\n    }',
 'правило даты целится в класс, а не в <time>'],

['вернуть ленте широкий тип — 16/12 при карточке 340', 'css/style.css',
 '    .hn-grid > .hn-card:nth-child(n) h3 { font-size: var(--fs-sm); }',
 '    .hn-grid > .hn-card:nth-child(n) h3 { font-size: var(--fs-base); }',
 'в ленте карточка новости набрана телефонной ступенью, как турнирная'],

/* ── плашка категории ────────────────────────────────────────────────────── */
['вернуть плашке лайм', 'css/style.css',
 '    background: var(--neutral-surface);\n    color: var(--text-secondary);\n    box-shadow: inset 0 0 0 1px var(--border-light);\n    font-size: var(--fs-2xs);\n    font-weight: var(--fw-medium);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n}',
 '    background: var(--neutral-surface);\n    color: var(--accent);\n    box-shadow: inset 0 0 0 1px var(--border-light);\n    font-size: var(--fs-2xs);\n    font-weight: var(--fw-medium);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n}',
 'плашка категории — нейтральная, лайм принадлежит действию'],

/* ЯКОРЬ ОТ 'bottom: 10px' — НАРОЧНО. Две строки «background:
   var(--neutral-surface); color: var(--text-secondary);» слово в слово
   совпадают с .tc-badge-closed/.tc-badge-done: прувер отчитался «встречается
   2 раза». Шестой случай за три дня, когда якорь держался на общей строке,
   а не на том, что отличает блок. */
['вернуть плашке полупрозрачную подложку', 'css/style.css',
 '    bottom: 10px;\n    z-index: 2;\n    display: inline-flex;\n    align-items: center;\n    height: 24px;\n    padding: 0 var(--space-2);\n    border-radius: var(--radius-full);\n    background: var(--neutral-surface);',
 '    bottom: 10px;\n    z-index: 2;\n    display: inline-flex;\n    align-items: center;\n    height: 24px;\n    padding: 0 var(--space-2);\n    border-radius: var(--radius-full);\n    background: rgba(10, 10, 10, 0.75);',
 'подложка плашки НЕПРОЗРАЧНА — она лежит на афише'],

['вернуть плашке самодельные поля', 'css/style.css',
 '    height: 24px;\n    padding: 0 var(--space-2);\n    border-radius: var(--radius-full);\n    background: var(--neutral-surface);',
 '    height: 24px;\n    padding: 3px 10px;\n    border-radius: var(--radius-full);\n    background: var(--neutral-surface);',
 'геометрия плашки — по компоненту Badge 27:53'],

/* Седьмой: три строки набора (вес, uppercase, разрядка) — общие с .tc-badge.
   Тянем якорь до box-shadow и font-size, которых в том блоке нет. */
['вернуть плашке вес 700', 'css/style.css',
 '    box-shadow: inset 0 0 0 1px var(--border-light);\n    font-size: var(--fs-2xs);\n    font-weight: var(--fw-medium);',
 '    box-shadow: inset 0 0 0 1px var(--border-light);\n    font-size: var(--fs-2xs);\n    font-weight: 700;',
 'набор плашки — по компоненту: 11 Medium, разрядка 0.5'],

['снять у плашки край', 'css/style.css',
 '    box-shadow: inset 0 0 0 1px var(--border-light);\n    font-size: var(--fs-2xs);',
 '    font-size: var(--fs-2xs);',
 'у плашки есть край, как у бейджа турнира']
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'novosti-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'js'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-novosti.js'), ПРАВИЛО);

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-novosti.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-novosti.js.');
    console.log(база.вывод); process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)  { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
