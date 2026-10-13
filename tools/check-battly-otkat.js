/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ БАТТЛОВ ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает. Якорь держится на содержимом своего
 * блока, а не на положении и не на соседе.
 *
 *   node tools/check-battly-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/battles-overview.css', 'css/challenge-detail.css', 'css/tokens.css',
               'js/battles-overview.js', 'js/challenge-detail.js', 'js/battle-format.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const О = 'css/battles-overview.css', В = 'css/challenge-detail.css', Т = 'css/tokens.css';
const ДО = 'js/battles-overview.js', ДВ = 'js/challenge-detail.js', Ф = 'js/battle-format.js';

const ОТКАТЫ = [

['вернуть заголовку обзора свой clamp', О,
 '    font-size: var(--fs-hero);\n    font-weight: 800;\n    line-height: var(--lh-tight);',
 '    font-size: clamp(1.9rem, 4.4vw, 3.1rem);\n    font-weight: 800;\n    line-height: 1.1;',
 'заголовки обеих страниц зовут токен обложки'],

['вернуть обложке вызова своё число высоты', В,
 '    min-height: var(--oblozhka-pol);',
 '    min-height: 460px;',
 'пол обложки берётся общим токеном'],

['убрать баттлы из списка семейств токенов', Т,
 '.bo-hero .bo-hero-stats .bo-hero-stat-value {',
 '.bo-hero .bo-hero-stats .bo-hero-stat-znachenie {',
 'цифра обложки баттлов стоит в списке семейств токенов'],

['сравнять перебивку с заголовком на телефоне', В,
 '    .ch-vs-text { font-size: var(--fs-lg); }',
 '    .ch-vs-text { font-size: var(--fs-xl); }',
 'перебивка VS объявлена ступенью ниже заголовка на всех трёх видах'],

['вернуть VS карточки прежний кегль', О,
 '    font-size: var(--fs-base);\n    font-weight: 900;',
 '    font-size: var(--fs-lg);\n    font-weight: 900;',
 'перебивка в карточке мельче названия карточки'],

['вернуть полосам свою границу 860', О,
 '@media (max-width: 992px) {\n    .bo-strip-grid { grid-template-columns: 1fr; }',
 '@media (max-width: 860px) {\n    .bo-strip-grid { grid-template-columns: 1fr; }',
 'в обоих файлах только домашние границы 640 и 992'],

['вернуть подписи полосы межстрочный числом', О,
 '        -webkit-box-orient: vertical;\n        line-height: var(--lh-snug);',
 '        -webkit-box-orient: vertical;\n        line-height: 1.25;',
 'межстрочных числом в обоих файлах не осталось'],

['вернуть «Подробнее» высоту полями', О,
 '    min-height: var(--btn-h-sm);\n    padding-inline: 24px;\n    line-height: var(--lh-none);\n    background: var(--accent);',
 '    padding: 10px 28px;\n    background: var(--accent);',
 'высота управления свойством: .bo-featured-link'],

['вернуть кнопке голоса высоту полями', О,
 '    min-height: var(--btn-h-sm);\n    padding-inline: 12px;',
 '    padding: 8px 12px;',
 'высота управления свойством: .bo-vote-btn'],

['вернуть кнопке «ещё» высоту полями', О,
 '    min-height: var(--btn-h-sm);\n    padding-inline: 24px;\n    border-radius: var(--radius-full);',
 '    padding: 10px 26px;\n    border-radius: var(--radius-full);',
 'высота управления свойством: .bo-more'],

['снять высоту у места', О,
 '    min-height: var(--btn-h-sm);\n    cursor: pointer;',
 '    cursor: pointer;',
 'высота управления свойством: .bo-meta-venue'],

['ужать слой цели у места', О,
 '    height: var(--btn-h-md);\n    transform: translateY(-50%);\n}\n\n/* ═══ ВИДИМЫЙ ФОКУС',
 '    height: 20px;\n    transform: translateY(-50%);\n}\n\n/* ═══ ВИДИМЫЙ ФОКУС',
 'место и ссылки карт несут слой цели 44'],

['снять видимый фокус у обзора', О,
 '.bo-featured-link:focus-visible,\n.bo-vote-btn:focus-visible,\n.bo-more:focus-visible,\n.bo-meta-venue:focus-visible,\n.bo-strip:focus-visible {',
 '.bo-featured-link:hover,\n.bo-vote-btn:hover,\n.bo-more:hover,\n.bo-meta-venue:hover,\n.bo-strip:hover {',
 'видимый фокус есть в обоих файлах'],

['снять у обзора спрос разрешения на движение', О,
 '@media (prefers-reduced-motion: reduce) {\n    .bo-cd,',
 '@media (min-width: 0px) {\n    .bo-cd,',
 'движение спрашивает разрешения в обоих файлах'],

['вернуть подписи полосы краску text-dim', О,
 '    /* Контраст 3.21 при норме 4.5 — мерено по фактической краске 13.10 */\n    color: var(--text-muted);',
 '    color: var(--text-dim);',
 'краски text-dim в обоих файлах не осталось'],

['вернуть проценту в полосе белую краску', В,
 '.ch-bar-left span, .ch-bar-right span {\n    color: #0a0a0a;',
 '.ch-bar-left span, .ch-bar-right span {\n    color: #ffffff;',
 'процент в полосе голосования красится тёмным'],

['вернуть значку свою высоту', О,
 '.bo-status {\n    display: inline-flex;\n    align-items: center;\n    height: 24px;',
 '.bo-status {\n    display: inline-flex;\n    align-items: center;\n    height: 20px;',
 'значки держат геометрию компонента Badge 27:53'],

['вернуть карточке радиус 24', О,
 '.bo-featured {\n    position: relative;\n    border-radius: var(--radius-lg);',
 '.bo-featured {\n    position: relative;\n    border-radius: var(--radius-xl);',
 'карточка держит радиус компонента Card 29:65'],

['вернуть соперников лентой на телефоне', В,
 '    .ch-vs-container {\n        flex-direction: row;',
 '    .ch-vs-container {\n        flex-direction: column;',
 'соперники на телефоне стоят в строку, а не лентой'],

['снять сжатие снимка пары на телефоне', В,
 '    .ch-pair .ch-player-photo { width: 72px; height: 96px; }',
 '    .ch-pair .ch-player-foto { width: 72px; height: 96px; }',
 'снимок пары сжимается на телефоне вместе с одиночным'],

['снять у окна карты роль', ДО,
 "        overlay.setAttribute('role', 'dialog');",
 "        overlay.setAttribute('data-role', 'dialog');",
 'окно карты называет себя окном и держит фокус'],

['вернуть победителя сравнением игроков', ДВ,
 '        var сторона = BF ? BF.winnerSide(b, match.winner_id) : null;',
 '        var сторона = match.winner_id === p1 ? 1 : 2;',
 'победителя называет сторона, а не сравнение игроков'],

['вернуть закрытие голосования в файл обзора', ДО,
 '        var isClosed = BF.votingClosed(b);',
 '        var isClosed = !!b.voting_closed || (date && time && Date.now() >= new Date(date + \'T\' + time + \':00+06:00\').getTime());',
 'закрытие голосования объявлено один раз, в общем модуле'],

['вернуть значку слово «БАТТЛЫ»', ДО,
 '        var statusText = BF.stateLabel(b) || L.heroBadge;',
 '        var statusText = L.heroBadge;',
 'состояние называют общие слова, а не свой словарь'],

['вернуть сетке чужой класс', ДО,
 '                html += \'<div class="bo-card-grid">\';',
 '                html += \'<div class="to-card-grid">\';',
 'сетка карточек рисуется своим классом'],

['вернуть «Подробнее» нарисованной кнопкой', ДО,
 '\'<a class="bo-featured-link" href="\' + linkHref + \'">\' + L.details + \'</a>\'',
 '\'<span class="bo-featured-link">\' + L.details + \'</span>\'',
 '«Подробнее» — настоящая ссылка'],

['вернуть «ничего не найдено» при пустой базе', ДО,
 '        if (!_allBattles.length) {',
 '        if (_allBattles.length < 0) {',
 'пустая база не отвечает «ничего не найдено»'],

['вернуть оформление атрибутом style', ДО,
 '\'<div class="bo-featured-top">\' +',
 '\'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">\' +',
 'оформления в атрибуте style в обоих файлах не осталось'],

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-battly-'));
['css', 'js', 'tools'].forEach(д => fs.mkdirSync(path.join(песок, д), { recursive: true }));
fs.writeFileSync(path.join(песок, 'tools', 'check-battly.js'),
                 fs.readFileSync(path.join(__dirname, 'check-battly.js')));

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-battly.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-battly.js.');
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
