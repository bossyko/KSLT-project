/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ССЫЛКИ ВМЕСТО DIV» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает. Якорь держится на содержимом своего
 * блока, а не на положении и не на соседе: шесть слоёв в пяти файлах
 * написаны одинаковыми строками, и якорь из двух общих строк встречался бы
 * шесть раз.
 *
 *   node tools/check-ssylki-kartochek-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = [
    'js/kslt-sloy.js', 'js/partners.js', 'js/battles-overview.js',
    'js/battle-cards.js', 'js/tournament-featured.js', 'js/services.js',
    'js/tournaments-overview.js', 'js/home-partners.js', 'js/players.js',
    'js/tournament-blocks.js',
    'css/partners.css', 'css/battles-overview.css', 'css/battle-cards.css',
    'css/tournaments-overview.css', 'css/services.css'
];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const СБ = 'js/kslt-sloy.js', П = 'js/partners.js', ОБ = 'js/battles-overview.js';
const КБ = 'js/battle-cards.js', КТ = 'js/tournament-featured.js', У = 'js/services.js';
const CП = 'css/partners.css', CБ = 'css/battles-overview.css', CК = 'css/battle-cards.css';
const CТ = 'css/tournaments-overview.css', CУ = 'css/services.css';

const ОТКАТЫ = [

/* ── сборщик ─────────────────────────────────────────────────────────── */

['отнять у слоя имя для диктора', СБ,
 "               ' aria-label=\"' + экр(имя) + '\"></a>';",
 "               '></a>';",
 'общий сборщик слоя существует и отдаёт ссылку с именем'],

['перестать экранировать адрес', СБ,
 'href="\' + экр(href) + \'"', 'href="\' + href + \'"',
 'сборщик экранирует всё, что в него кладут'],

['увести поиск от общего сборщика', П,
 "window.KSLT_SLOY.слой('pt-card-cover', адрес, p.full_name || '')",
 "'<a class=\"pt-card-cover\" href=\"' + адрес + '\"></a>'",
 'четыре семьи карточек зовут общий сборщик'],

['завести третий рукописный сборщик слоя', ОБ,
 "                ? window.KSLT_SLOY.слой('bo-featured-cover', linkHref, b.battle_title || '')",
 "                ? '<a class=\"bo-featured-cover\" href=\"' + linkHref + '\"></a>'",
 'рукописных сборщиков слоя ровно два, и оба старше общего'],

/* ── порядок слоёв ───────────────────────────────────────────────────── */

['опустить слой поиска под содержимое', CП,
 '.pt-card-link > .pt-card-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 2;',
 '.pt-card-link > .pt-card-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 0;',
 'слой лежит ВЫШЕ содержимого: поиск игрока'],

['снять у слоя поиска растяжку', CП,
 '.pt-card-link > .pt-card-cover {\n    position: absolute;\n    inset: 0;',
 '.pt-card-link > .pt-card-cover {\n    position: static;\n    inset: auto;',
 'слой растянут на карточку, а не на своё содержимое: поиск игрока'],

['снять кольцо фокуса у слоя поиска', CП,
 '.pt-card-link > .pt-card-cover:focus-visible {',
 '.pt-card-link > .pt-card-cover:hover {',
 'у слоя виден фокус с клавиатуры: поиск игрока'],

['опустить «Пригласить» под слой', CП,
 '.pt-card .pt-invite-btn {\n    position: relative;\n    z-index: 3;\n}',
 '.pt-card .pt-invite-btn {\n    position: relative;\n    z-index: 1;\n}',
 'своё действие лежит ВЫШЕ слоя: поиск игрока'],

['опустить слой крупного баттла под содержимое', CБ,
 '.bo-featured > .bo-featured-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 2;',
 '.bo-featured > .bo-featured-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 0;',
 'слой лежит ВЫШЕ содержимого: крупный баттл'],

/* ОТКАТ К БЕДЕ 17.10: короб содержимого снова заводит свой слой
   наложения — и запирает в себе место и кнопку голоса. */
['вернуть коробу крупного баттла свой слой наложения', CБ,
 '.bo-featured-content {\n    padding: var(--space-lg);\n}',
 '.bo-featured-content {\n    position: relative;\n    z-index: 2;\n    padding: var(--space-lg);\n}',
 'короб содержимого не заводит своего слоя наложения: крупный баттл'],

['снять кольцо фокуса у слоя крупного баттла', CБ,
 '.bo-featured > .bo-featured-cover:focus-visible {',
 '.bo-featured > .bo-featured-cover:active {',
 'у слоя виден фокус с клавиатуры: крупный баттл'],

['опустить слой карточки баттла под содержимое', CК,
 '.bc-card > .bc-card-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 2;',
 '.bc-card > .bc-card-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 1;',
 'слой лежит ВЫШЕ содержимого: карточка баттла'],

['снять кольцо фокуса у слоя карточки баттла', CК,
 '.bc-card > .bc-card-cover:focus-visible {',
 '.bc-card > .bc-card-cover:active {',
 'у слоя виден фокус с клавиатуры: карточка баттла'],

['опустить слой крупного турнира под содержимое', CТ,
 '.to-featured > .to-featured-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 2;',
 '.to-featured > .to-featured-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 0;',
 'слой лежит ВЫШЕ содержимого: крупный турнир'],

['снять кольцо фокуса у слоя крупного турнира', CТ,
 '.to-featured > .to-featured-cover:focus-visible {',
 '.to-featured > .to-featured-cover:active {',
 'у слоя виден фокус с клавиатуры: крупный турнир'],

['вернуть слой «Услуг» под содержимое', CУ,
 '.sv-player > .sv-player-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 2;',
 '.sv-player > .sv-player-cover {\n    position: absolute;\n    inset: 0;\n    z-index: 0;',
 'слой лежит ВЫШЕ содержимого: игрок на «Услугах»'],

['опустить «Предложить игру» под слой', CУ,
 '.sv-player > .sv-player-btn {\n    z-index: 3;\n}',
 '.sv-player > .sv-player-btn {\n    z-index: 1;\n}',
 'своё действие лежит ВЫШЕ слоя: игрок на «Услугах»'],

['снять кольцо фокуса у слоя «Услуг»', CУ,
 '.sv-player > .sv-player-cover:focus-visible {',
 '.sv-player > .sv-player-cover:hover {',
 'у слоя виден фокус с клавиатуры: игрок на «Услугах»'],

/* ── переход ровно один ──────────────────────────────────────────────── */

['вернуть «Подробнее» баттла второй ссылкой', ОБ,
 '\'<span class="bo-featured-link" aria-hidden="true">\' + L.details + \'</span>\'',
 '\'<a class="bo-featured-link" href="\' + linkHref + \'">\' + L.details + \'</a>\'',
 'у крупной карточки баттла переход один: надпись, а не вторая ссылка'],

['вернуть «Подробнее» карточки баттла второй ссылкой', КБ,
 '\'<span class="bc-details-link" aria-hidden="true">\' + L.moreDetails + \' →</span>\'',
 '\'<a href="\' + detailUrl(battle.id) + \'" class="bc-details-link">\' + L.moreDetails + \' →</a>\'',
 'у карточки баттла переход один: надпись, а не вторая ссылка'],

['вернуть обработчику переход по крупной карточке', ОБ,
 '        });\n    }\n\n    /* Поиск и чипы над списком',
 '        window.location.href = card.dataset.href;\n        });\n    }\n\n    /* Поиск и чипы над списком',
 'обработчик больше не уводит с крупной карточки баттла'],

/* Якорь держится за СВОЙ класс: строка про data-gender одинакова у крупной
   карточки и у её варианта боком — без класса якорь встречался бы дважды. */
['вернуть крупному турниру адрес атрибутом', КТ,
 "'<div class=\"to-featured\" data-status=\"' + esc(t.status) + '\"' +\n            ' data-gender=\"' + esc(t._gender || 'all') + '\">' +",
 "'<div class=\"to-featured\" data-status=\"' + esc(t.status) + '\"' +\n            ' data-gender=\"' + esc(t._gender || 'all') + '\" data-href=\"' + esc(t.href) + '\">' +",
 'крупная карточка турнира не несёт адреса атрибутом'],

['снять страховку у карточки баттла', КБ,
 'if (!window.KSLT_SLOY) window.location.href = detailUrl(card.dataset.battle);',
 'window.location.href = detailUrl(card.dataset.battle);',
 'обработчик карточки баттла уводит только без общего сборщика'],

['вернуть инлайновый cursor в разметку поиска', П,
 '            (слой ? \' pt-card-link\' : \'\') + \'" data-player-url="\' + адрес + \'">\' +',
 '            (слой ? \' pt-card-link\' : \'\') + \'" data-player-url="\' + адрес + \'" style="cursor:pointer;">\' +',
 'инлайнового cursor в разметке поиска не осталось'],

/* ── гость ───────────────────────────────────────────────────────────── */

['дать гостю слой-ссылку', П,
 "        var слой = (_accessLevel !== 'guest' && window.KSLT_SLOY)",
 "        var слой = (window.KSLT_SLOY)",
 'гостю слоя не дают: карточка открывает окно, а не профиль'],

['вешать класс слоя на все карточки', П,
 "            (слой ? ' pt-card-link' : '') + '\" data-player-url=\"' + адрес + '\">' +",
 "            ' pt-card-link\" data-player-url=\"' + адрес + '\">' +",
 'класс слоя вешается только вместе со слоем']

];

/* ── Песок ───────────────────────────────────────────────────────────── */

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ssylki-'));
['css', 'js', 'tools'].forEach(д => fs.mkdirSync(path.join(песок, д), { recursive: true }));
fs.copyFileSync(path.join(__dirname, 'check-ssylki-kartochek.js'),
                path.join(песок, 'tools', 'check-ssylki-kartochek.js'));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-ssylki-kartochek.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-ssylki-kartochek.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)   { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
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
