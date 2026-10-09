#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ ОБЗОРНОЙ «ИНФО».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Откаты — ровно
 * то, что стояло в коде до 09.10.
 *
 *   node tools/check-info-obzor-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-info-'));
['css', 'js', 'tools', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/info-overview.css';
const JS  = 'js/info-overview.js';

const ОТКАТЫ = [
  [CSS, 'min-height: var(--oblozhka-pol);', 'min-height: none;',
   'высота обложки — общая крутилка, а не своё число'],

  [CSS, 'padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);',
        'padding: var(--section-y) var(--pad-x) var(--section-y);',
   'воздух обложки — общие крутилки'],

  /* ОТКАТ, КОТОРЫЙ НЕ ПРАВИТ, А ДОБАВЛЯЕТ. Прежняя беда была именно такой:
     в узком блоке стояла своя высота обложки поверх общей. */
  [CSS, '    .io-grid {\n        grid-template-columns: 1fr;\n    }',
        '    .io-hero.io-hero {\n        min-height: 275px;\n    }\n\n    .io-grid {\n        grid-template-columns: 1fr;\n    }',
   'своих высот обложки в узких блоках не осталось'],

  /* ПОЛ СНИМАЕТСЯ ЦЕЛИКОМ, А НЕ ПОДМЕНЯЕТСЯ ЧИСЛОМ. Первая редакция ставила
     сюда `1px` — и роняла ЗАОДНО правило о своих высотах в узких блоках:
     оно ищет как раз число с `px` у `.io-hero`. Откат, валящий два правила,
     не доказывает ни одного. */
  [CSS, '        min-height: 0;\n        --oblozhka-vozduh:', '        --oblozhka-vozduh:',
   'на низком горизонтальном экране пола нет'],

  [CSS, '@media (max-height: 500px) and (orientation: landscape) {\n    .io-hero {',
        '@media (max-height: 500px) and (orientation: landscape) {\n    .io-hero h1 { font-size: var(--fs-lg); }\n    .io-hero {',
   'кегли на низком горизонтальном не трогаются'],

  /* Ступень взята, но не крутилка: раздел снова может разойтись с соседями
     по одному виду, а шкалу при этом не нарушить. */
  [CSS, '    font-size: var(--fs-hero);', '    font-size: var(--fs-2xl);',
   'заголовок обложки — крутилка --fs-hero'],

  [CSS, '    font-size: var(--fs-hero-sub);', '    font-size: var(--fs-xl);',
   'название КСЛТ — крутилка подзаголовка обложки'],

  [CSS, '.io-card h3 {\n    font-size: var(--fs-md);',
        '.io-card h3 {\n    font-size: clamp(1rem, 2vw, 1.125rem);',
   'ни одного clamp для кегля во всём файле'],

  [CSS, '.io-docrow-sub {\n    display: block;', '.io-docrow-sub {\n    line-height: 1.35;\n    display: block;',
   'межстрочные — только ступени лестницы'],

  [CSS, '    .io-group-title {\n        margin: 0 0 var(--space-3);',
        '    .io-group-title {\n        font-size: var(--fs-sm);\n        margin: 0 0 var(--space-3);',
   'метка группы не крупнее на узком виде, чем на широком'],

  [CSS, '@media (max-width: 640px) {\n    .io-hero p {', '@media (max-width: 480px) {\n    .io-hero p {',
   'границ ровно две — 640 и 992'],

  [CSS, '    padding: var(--space-md);\n    background: var(--bg-card);',
        '    padding: var(--space-lg);\n    background: var(--bg-card);',
   'поля карточки — ступень Regular 24'],

  /* Ступень снимается, поля остаются прежними: иначе откат валит заодно
     правило об отступах мимо шкалы — 10px на шкале нет. */
  [CSS, '    min-height: 44px;\n    padding: 0 var(--space-8);',
        '    padding: 0 var(--space-8);',
   'цель нажатия кнопки — ступень 44, а не сумма полей'],

  [CSS, '.io-docrow:last-child { border-bottom: none; }',
        '.io-docrow:last-child { border-bottom: none; margin-top: 18px; }',
   'ни одного отступа мимо шкалы'],

  [CSS, '.io-featured:focus-visible,', '.io-featured:focus-net,',
   'фокус с клавиатуры виден'],

  [CSS, '@media (prefers-reduced-motion: reduce) {', '@media (prefers-reduced-motion: net) {',
   'движение спрашивает системную настройку'],

  ['pages/info-en.html', 'info-overview.css?v=', 'info-overview.css?v=11&bylo=',
   'версия стиля поднята и одинакова на трёх языках'],

  [JS, "        heroSub: 'an amateur tennis community platform',",
       "        heroSub: 'an amateur tennis community platform',\n        heroSubRu: 'площадка любительского тенниса',\n        heroSub: 'дубль',",
   'четвёртая строка обложки — только у английского словаря'],
];

function прогон() {
    try {
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-info-obzor.js')],
                     { encoding: 'utf8' });
        return [];
    } catch (e) {
        const вывод = (e.stdout || '') + (e.stderr || '');
        return (вывод.match(/^    · .+$/gm) || []).map(с => с.replace('    · ', '').trim());
    }
}

if (прогон().length) {
    console.log('\n  ✗ копия не зелёная до откатов — чинить сперва её\n');
    process.exit(1);
}

let бед = 0;
console.log('');
ОТКАТЫ.forEach(([файл, было, стало, ждём], и) => {
    const путь = path.join(ВРЕМ, файл);
    const исход = fs.readFileSync(путь, 'utf8');
    const сколько = исход.split(было).length - 1;
    if (сколько !== 1) {
        console.log(`  ✗ откат ${и + 1} (${файл}): якорь встречается ${сколько} раз`);
        console.log(`      ${было.slice(0, 64).replace(/\n/g, ' ')}`);
        бед++;
        return;
    }
    fs.writeFileSync(путь, исход.replace(было, стало));
    const упавшие = прогон();
    fs.writeFileSync(путь, исход);

    if (!упавшие.length) {
        console.log(`  ✗ откат ${и + 1}: НИЧЕГО НЕ УПАЛО — правило «${ждём}» пустое`);
        бед++;
    } else if (упавшие.length === 1 && упавшие[0] === ждём) {
        console.log(`  ок  ${String(и + 1).padStart(2)}  ${ждём}`);
    } else {
        console.log(`  ✗ откат ${и + 1}: ждали «${ждём}», упало: ${упавшие.join(' | ')}`);
        бед++;
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (бед) {
    console.log(`  НЕ ТАК  прувер: ${бед} откатов из ${ОТКАТЫ.length} не доказали правило\n`);
    process.exit(1);
}
console.log(`  ок      все ${ОТКАТЫ.length} откатов доказали свои правила\n`);
