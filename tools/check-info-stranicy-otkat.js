#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ СТРАНИЦ РАЗДЕЛА «ИНФО».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Откаты — ровно
 * то, что стояло в общем файле до 09.10.
 *
 *   node tools/check-info-stranicy-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ip-'));
['css', 'js', 'tools', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/info-pages.css';

const ОТКАТЫ = [
  [CSS, 'min-height: var(--oblozhka-pol);', 'min-height: 340px;',
   'высота обложки — общая крутилка раздела'],

  [CSS, 'padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);',
        'padding: var(--section-y) var(--pad-x) var(--section-y);',
   'воздух обложки — общие крутилки'],

  /* Ступень взята, но не крутилка: шкалу не нарушает, а с соседними
     разделами страница разойдётся. */
  [CSS, '    font-size: var(--fs-hero);', '    font-size: var(--fs-2xl);',
   'заголовок обложки — крутилка --fs-hero'],

  [CSS, '    font-size: var(--fs-hero-sub);', '    font-size: var(--fs-md);',
   'подзаголовок обложки — крутилка --fs-hero-sub'],

  [CSS, '.ip-about-text {\n    color: var(--text-secondary);\n    font-size: var(--fs-base);',
        '.ip-about-text {\n    color: var(--text-secondary);\n    font-size: clamp(1rem, 2vw, 1.05rem);',
   'ни одного clamp для кегля во всём файле'],

  [CSS, '.ip-hero-subtitle {\n    /* Подзаголовок обложки — та же крутилка, что у восьми соседних\n       разделов: 21 · 18 · 16. */\n    font-size: var(--fs-hero-sub);\n    color: var(--text-secondary);\n    max-width: 540px;\n    margin: 0 auto;\n    line-height: 1.65;',
        '.ip-hero-subtitle {\n    /* Подзаголовок обложки — та же крутилка, что у восьми соседних\n       разделов: 21 · 18 · 16. */\n    font-size: var(--fs-hero-sub);\n    color: var(--text-secondary);\n    max-width: 540px;\n    margin: 0 auto;\n    line-height: 1.6;',
   'межстрочные — только ступени лестницы'],

  [CSS, '    font-weight: 600;\n    line-height: 1.3;\n    text-align: left;',
        '    font-weight: 600;\n    text-align: left;',
   'у кнопки вопроса межстрочный задан, а не оставлен шрифту'],

  [CSS, '@media (max-width: 992px) {\n    .ip-mission-grid {',
        '@media (max-width: 768px) {\n    .ip-mission-grid {',
   'границ ровно две — 640 и 992'],

  [CSS, '.ip-doc-revision {\n    color: rgba(255, 255, 255, 0.6);',
        '.ip-doc-revision {\n    margin-top: 28px;\n    color: rgba(255, 255, 255, 0.6);',
   'ни одного отступа мимо шкалы'],

  [CSS, '.ip-cta-btn:focus-visible,', '.ip-cta-btn:focus-net,',
   'фокус с клавиатуры виден у вопроса и у кнопки призыва'],

  [CSS, '@media (prefers-reduced-motion: reduce) {', '@media (prefers-reduced-motion: net) {',
   'движение спрашивает системную настройку'],

  /* ОТКАТ, КОТОРЫЙ НЕ ПРАВИТ, А ВОЗВРАЩАЕТ СНЯТОЕ: мёртвое правило. */
  /* Якорь взят с соседней строкой: сам по себе `.ip-doc-lead {` встречается
     в файле дважды — в базовом правиле и в узком блоке. */
  [CSS, '.ip-doc-lead {\n    color: rgba(255, 255, 255, 0.8);',
        '.ip-team-photo { width: 96px; height: 96px; }\n\n.ip-doc-lead {\n    color: rgba(255, 255, 255, 0.8);',
   'мёртвые правила не вернулись'],

  [CSS, '.ip-doc-revision {\n    color: rgba(255, 255, 255, 0.6);\n    font-size: var(--fs-base);',
        '.ip-doc-revision {\n    color: rgba(255, 255, 255, 0.6);',
   'кегль вводного абзаца и строки о редакции задан классами'],

  /* Второе объявление кегля перебивки — ровно то, что стояло в блоке ≤992
     до вечера 09.10. Ступень законная, а лестница обложки — третья своя. */
  [CSS, '    .ip-hero-subtitle {\n        line-height: 1.5;',
        '    .ip-hero-subtitle {\n        font-size: var(--fs-sm);\n        line-height: 1.5;',
   'кегль перебивки обложки объявлен в файле РОВНО ОДИН раз'],

  ['pages/faq-kg.html', 'info-pages.css?v=', 'info-pages.css?v=11&bylo=',
   'версия стиля поднята и одинакова на всех восемнадцати страницах'],
];

function прогон() {
    try {
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-info-stranicy.js')],
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
