/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ЗНАЧКОВ ОТКАТОМ. Работаем на КОПИИ.
 *   node tools/check-znachki-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'js/home-badges.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-znachki.js'), 'utf8');

const ОТКАТЫ = [
['вернуть подписи значков лайм', 'css/style.css',
 '    font-weight: var(--fw-bold);\n    color: var(--text-primary);\n}\n\n.badge-cta-desc',
 '    font-weight: var(--fw-bold);\n    color: var(--accent);\n}\n\n.badge-cta-desc',
 'подпись значка нейтральная, а не лаймовая'],

['вернуть плитке самодельные поля 12/10', 'css/style.css',
 '    padding: var(--space-3);          /* 12 — Padding=Dense */',
 '    padding: 12px 10px;',
 'плитка — Padding=Dense 12, одна плотность на все виды'],

['снять с плитки радиус компонента', 'css/style.css',
 '    border-radius: var(--radius-lg);\n    padding: var(--space-3);',
 '    border-radius: 12px;\n    padding: var(--space-3);',
 'плитка держит остальное от компонента Card'],

['вернуть перебивке clamp и вес раздела', 'css/style.css',
 '.badges-cta-text h2 {\n    font-size: var(--fs-lg);\n    font-weight: var(--fw-bold);',
 '.badges-cta-text h2 {\n    font-size: clamp(1.05rem, 1.8vw, 1.25rem);\n    font-weight: 800;',
 'перебивка набрана ступенью h3, а не голосом раздела'],

/* ПЕРЕЯКОРЕНО 24.09: якорь держался на СОСЕДЯХ по списку селекторов, и
   список вырос — блоку «Станьте спонсором» добавили .sp-offer h2. Держимся
   за один свой селектор и вставляем перебивку перед ним. */
['вернуть перебивку в правило заголовков разделов', 'css/style.css',
 '    section > h2 {\n        font-size: var(--fs-lg);   /* 21 */',
 '    .badges-cta-text h2,\n    section > h2 {\n        font-size: var(--fs-lg);   /* 21 */',
 'перебивка НЕ входит в правило заголовков разделов'],

['отодвинуть переключение перебивки с 768 на 640', 'css/style.css',
 '@media (max-width: 768px) {\n    .badges-cta-text h2 { font-size: var(--fs-base); }',
 '@media (max-width: 639px) {\n    .badges-cta-text h2 { font-size: var(--fs-base); }',
 'перебивка падает на ступень ниже там же, где заголовок раздела (768)'],

['уронить подзаголовок обратно на 16 — пара схлопывается', 'css/style.css',
 '    .badges-cta-text p { font-size: var(--fs-sm); }',
 '    .badges-cta-text p { font-size: var(--fs-base); }',
 'подзаголовок на ступень НИЖЕ заголовка перебивки'],

/* ДВА ОТКАТА НА БЕДУ, КОТОРУЮ ПОЙМАЛ PLAYWRIGHT 24.09, А НЕ ЭТА ПРОВЕРКА.
   Первый воспроизводит её дословно: подзаголовок уезжает обратно на 640,
   заголовок остаётся на 768, и в полосе 641-768 оба сидят на 16. */
['развести пару по разным границам: подзаголовок обратно на 640', 'css/style.css',
 '    .badges-cta-text p { font-size: var(--fs-sm); }\n}\n\n/* ТЕЛЕФОН.',
 '}\n\n/* ТЕЛЕФОН.',
 'заголовок и подзаголовок перебивки падают на ОДНОЙ границе'],

['завести подзаголовку третью границу', 'css/style.css',
 '/* ТЕЛЕФОН. Подпись значка',
 '@media (max-width: 480px) { .badges-cta-text p { font-size: var(--fs-xs); } }\n\n/* ТЕЛЕФОН. Подпись значка',
 'кегль подзаголовка перебивки задан ровно дважды: база и одна граница'],

['вернуть подписи значка кегль 11 на телефоне', 'css/style.css',
 '    .badge-cta-name {\n        font-size: var(--fs-sm);\n        line-height: 1.2;',
 '    .badge-cta-name {\n        font-size: var(--fs-2xs);\n        line-height: 1.2;',
 'подпись значка на телефоне — телефонная ступень card title'],

['вернуть кнопке высоту из полей', 'css/style.css',
 '    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    height: var(--btn-h-md);          /* 44 */\n    padding: 0 var(--space-8);        /* 32; было 36 — не ступень */',
 '    display: inline-block;\n    padding: 13px 36px;',
 'высота кнопки задаётся свойством, а не полями'],

['вернуть кнопке поле 36', 'css/style.css',
 '    padding: 0 var(--space-8);        /* 32; было 36 — не ступень */',
 '    padding: 0 36px;',
 'горизонтальное поле кнопки — ступень шкалы'],

/* ЯКОРЬ ПЕРЕПИСАН 24.09: он держался на соседе по списку — .pt-invite-btn,
   которого 24.09 из этого яруса вынули четвёртым по счёту. Держится теперь
   на том, что в блоке постоянно, — на первой строке самого списка. */
['вернуть кнопку в ступень «обычная 40»', 'css/style.css',
 '    .btn-secondary.btn-secondary,\n    .ct-card-btn.ct-card-btn,',
 '    .btn-secondary.btn-secondary,\n    .badges-cta-btn.badges-cta-btn,\n    .ct-card-btn.ct-card-btn,',
 'кнопка вынута из ступени «обычная 40»'],

['сделать кнопку круглой в обход решения', 'css/style.css',
 '    font-weight: 800;\n    border-radius: 12px;\n    text-decoration: none;',
 '    font-weight: 800;\n    border-radius: var(--radius-full);\n    text-decoration: none;',
 'радиус кнопки не тронут — он решается вместе с коробкой'],

['сломать базовые шесть колонок', 'css/style.css',
 '.badges-cta-cards {\n    display: grid;\n    grid-template-columns: repeat(6, 1fr);',
 '.badges-cta-cards {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);',
 'база — шесть колонок'],

['вернуть колонкам границу 768 вместо 992', 'css/style.css',
 '@media (max-width: 992px) {\n    .badges-cta-cards {\n        grid-template-columns: repeat(3, 1fr);',
 '@media (max-width: 768px) {\n    .badges-cta-cards {\n        grid-template-columns: repeat(3, 1fr);',
 'от 992 и уже — три колонки'],

['отнять у ленты возврат на шесть колонок', 'css/style.css',
 '    .badges-cta-cards { grid-template-columns: repeat(6, 1fr); }',
 '    .badges-cta-cards { grid-template-columns: repeat(3, 1fr); }',
 'в тесной по высоте ленте колонки ВОЗВРАЩАЮТСЯ на шесть'],

['показать пояснение на узких', 'css/style.css',
 '    .badge-cta-desc { display: none; }\n}',
 '    .badge-cta-desc { display: block; }\n}',
 'пояснение скрыто ОДНИМ правилом, от 992 и уже'],

['воскресить мёртвый слой 480', 'css/style.css',
 '.badges-cta-cards.badges-all {',
 '@media (max-width: 480px) {\n    .badges-cta-cards { grid-template-columns: 1fr 1fr; }\n}\n\n.badges-cta-cards.badges-all {',
 'мёртвых слоёв 540 и 480 больше нет'],

['воскресить второй слой 768 с колонками', 'css/style.css',
 '/* ЛЕСТНИЦА ГРАНИЦ. Решение 23.09',
 '@media (max-width: 768px) {\n    .badges-cta-cards { gap: 8px; }\n}\n\n/* ЛЕСТНИЦА ГРАНИЦ. Решение 23.09',
 'слоя 768 с колонками больше нет'],

['снять с тумана размытие', 'css/style.css',
 '    filter: blur(2.5px);',
 '    filter: none;',
 'туман не тронут: размытие и маска на месте'],

['разрешить туману ловить мышь', 'css/style.css',
 '    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 62%);\n    pointer-events: none;',
 '    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 62%);\n    pointer-events: auto;',
 'закрытый ряд не ловит мышь'],

['убрать наезд коробки', 'css/style.css',
 '    margin-top: -46px;',
 '    margin-top: 0;',
 'коробка наезжает на закрытый ряд'],

['вернуть коробке поля 22/34', 'css/style.css',
 '    padding: var(--space-6) var(--space-8);   /* 24 / 32 */',
 '    padding: 22px 34px;',
 'поля коробки встали на шкалу'],

['убрать защиту от движения', 'css/style.css',
 '@media (prefers-reduced-motion: reduce) {\n    .badges-cta-box::before,',
 '@media (prefers-reduced-motion: no-preference) {\n    .badges-cta-box::before,',
 'движение выключается тем, кто попросил его выключить'],

['вернуть эмодзи в дерево доступности', 'js/home-badges.js',
 "        icon.setAttribute('aria-hidden', 'true');",
 "        icon.dataset.decorative = 'true';",
 'эмодзи скрыт от экранного диктора'],

['вернуть закрытый ряд диктору', 'js/home-badges.js',
 "        locked.setAttribute('aria-hidden', 'true');",
 "        locked.dataset.locked = 'true';",
 'закрытый ряд выведен из дерева доступности'],

['воскресить мёртвый hover плитки', 'css/style.css',
 '.badge-cta-card:hover {\n    transform: translateY(-3px);',
 '.badge-cta-card:hover {\n    transform: translateY(-4px);\n    border-color: var(--accent);\n}\n\n.badge-cta-card:hover {\n    transform: translateY(-3px);',
 'мёртвый hover плитки убран']
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'znachki-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'js'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-znachki.js'), ПРАВИЛО);

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-znachki.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-znachki.js.');
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
