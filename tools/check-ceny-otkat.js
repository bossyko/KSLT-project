#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ СТРАНИЦЫ «ЦЕНЫ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Откаты — ровно
 * то, что стояло в файлах до 09.10.
 *
 *   node tools/check-ceny-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ceny-'));
['css', 'js', 'tools', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/pricing.css';
const RU = 'pages/pricing.html';
const EN = 'pages/pricing-en.html';
const MEMB = 'js/membership.js';
const VREM = 'js/kslt-vremya.js';
const TOAST = 'js/kslt-toast.js';
const SETT = 'js/admin/sections/settings.js';

const ОТКАТЫ = [
  [CSS, 'min-height: var(--oblozhka-pol);', 'min-height: 300px;',
   'высота обложки — общая крутилка раздела'],

  [CSS, 'padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);',
        'padding: var(--section-y) var(--pad-x) var(--section-y);',
   'воздух обложки — общие крутилки'],

  /* Ступень взята, но не крутилка: шкалу не нарушает, а с соседними
     разделами страница разойдётся. */
  [CSS, '    font-size: var(--fs-hero);', '    font-size: var(--fs-2xl);',
   'заголовок обложки — крутилка --fs-hero'],

  [CSS, '    font-size: var(--fs-hero-sub);', '    font-size: var(--fs-md);',
   'перебивка обложки — крутилка --fs-hero-sub'],

  /* Второе объявление кегля перебивки — тот самый шов шести страниц. */
  [CSS, '.pr-hero-subtitle {\n    font-size: var(--fs-hero-sub);',
        '.pr-hero-subtitle {\n    font-size: var(--fs-hero-sub);\n    font-size: var(--fs-sm);',
   'кегль перебивки объявлен в файле РОВНО ОДИН раз'],

  [CSS, '@media (max-height: 500px) and (orientation: landscape) {',
        '@media (max-height: 500px) and (orientation: portrait) {',
   'у обложки есть правило низкого горизонтального'],

  [CSS, '.pm-free {\n    max-width: 900px;', '.pm-free {\n    max-width: clamp(600px, 80vw, 900px);',
   'плавающих чисел clamp в файле нет вовсе'],

  [CSS, '.pm-free-text {\n    font-size: var(--fs-base);',
        '.pm-free-text {\n    font-size: 1.05rem;',
   'все кегли берутся крутилкой --fs-*'],

  [CSS, '.pm-free-text {\n    font-size: var(--fs-base);\n    line-height: 1.5;',
        '.pm-free-text {\n    font-size: var(--fs-base);\n    line-height: 1.6;',
   'межстрочные — только ступени лестницы'],

  [CSS, '.pm-free {\n    max-width: 900px;\n    margin: 0 auto var(--space-6);',
        '.pm-free {\n    max-width: 900px;\n    margin: 0 auto var(--space-5);',
   'отступы — только ступени шкалы 8 · 12 · 16 · 24 · 32 · 40'],

  [CSS, '.pm-free-title {\n    font-size: var(--fs-2xs);',
        '.pm-free-title {\n    margin: 22px;\n    font-size: var(--fs-2xs);',
   'голых пикселей в отступах нет, кроме цели нажатия 44'],

  [CSS, '@media (max-width: 640px) {', '@media (max-width: 780px) {',
   'границ по ширине ровно две — 640 и 992'],

  [CSS, '    width: 100%;\n    min-height: 44px;\n    margin-top: var(--space-6);',
        '    width: 100%;\n    margin-top: var(--space-6);',
   'высота кнопки карточки держится свойством, а не полями'],

  [CSS, '.pmm-close {\n    position: absolute;\n    top: var(--space-2);\n    right: var(--space-2);\n    width: 44px;',
        '.pmm-close {\n    position: absolute;\n    top: var(--space-2);\n    right: var(--space-2);\n    width: auto;',
   'закрытие окна — цель 44 × 44'],

  [CSS, '.pmm-way {\n    min-height: 44px;', '.pmm-way {\n    min-height: 0;',
   'у способа оплаты есть своя высота цели'],

  [CSS, '.pmm-go:focus-visible {', '.pmm-go:focus {',
   'фокус с клавиатуры виден у всех пяти нажимаемых'],

  [CSS, '@media (prefers-reduced-motion: reduce) {', '@media (min-width: 1px) {',
   'движение спрашивает системную настройку'],

  [CSS, '    transition: border-color var(--transition-base);\n}\n\n.pmm-opt:hover',
        '    transition: all var(--transition-base);\n}\n\n.pmm-opt:hover',
   'transition: all не вернулся'],

  [CSS, '    color: var(--text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n}',
        '    color: var(--text-dim);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n}',
   'тихий цвет --text-dim в тексте не вернулся'],

  [CSS, '.pmm-opt.on { border-color: var(--accent); }',
        '.pmm-opt.on { border-color: var(--accent); background: rgba(204, 255, 0, 0.06); }',
   'выбранный период меняет ТОЛЬКО границу'],

  [CSS, '    max-width: 520px;\n    max-height: 90vh;', '    max-width: 460px;\n    max-height: 90vh;',
   'окно шириной md 520 по Modal 26:143'],

  [CSS, '.pm-card {', '.pr-card { padding: 40px 36px; }\n\n.pm-card {',
   'классы старого механизма не вернулись в css'],

  /* ЯКОРЬ БЕЗ НОМЕРА ВЕРСИИ: она уезжает при каждой правке общего файла,
     и прувер падал на «якорь встречается 0 раз» — поймал это сам, когда
     09.10 версия ушла с 42 на 43. Держимся за имя файла, а не за число. */
  [RU, '../css/info-pages.css?v=', '../css/info-pages-net.css?v=',
   'раскрывашка берётся из общего файла раздела'],

  [EN, '<span class="pm-val" data-plan="year">to be announced</span>',
       '<span class="pm-val" data-plan="year">1,000 KGS</span>',
   'цена не вписана в разметку ни на одном языке'],

  [MEMB, '    // ТРЕТЬЯ КОПИЯ ЦЕНЫ СНЯТА 09.10.',
         '    window.KSLT_MEMBERSHIP_PLAN = { price: 1000 };\n    // ТРЕТЬЯ КОПИЯ ЦЕНЫ СНЯТА 09.10.',
   'третья копия цены в коде не вернулась'],

  [RU, "from('pricing_plans')", "from('pricing_plans_staroe')",
   'суммы читаются из таблицы pricing_plans'],

  [RU, '<div class="pm-free" id="prFree" hidden>', '<div class="pm-free" id="prFree">',
   'блок бесплатного периода есть и по умолчанию скрыт'],

  [RU, "заголовок = window.KSLT_CONTENT.get('pricing_free_title', заголовок);",
       "заголовок = заголовок;",
   'текст блока берётся из site_content, а не из разметки'],

  [RU, 'var ч = String(до).slice(0, 10).split(\'-\');',
       'var ч = String(до).slice(0, 10).split(\'-\'); var _ = new Date(до);',
   'дата блока разбирается по частям, а не через Date'],

  [VREM, 'var СМЕЩЕНИЕ_МИНУТ = 6 * 60;', 'var СМЕЩЕНИЕ_МИНУТ = 0;',
   'день считается по Бишкеку, а не по Гринвичу'],

  [RU, 'var r = await window.supabaseClient.auth.getSession();',
       "var r = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');",
   'ключ сессии спрашивается у клиента, а не вписан строкой'],

  /* Переименование ДОЛЖНО быть полным: «фокусируемыеНеТе» содержит
     «фокусируемые» как подстроку, и правило оставалось зелёным — прувер
     уронил эту редакцию отката. */
  [RU, 'function фокусируемые()', 'function списокЦелей()',
   'у окна есть ловушка Tab и возврат фокуса'],

  [RU, "            if (go) go.addEventListener('click', скоро);",
       "            if (go) go.title = 'скоро';",
   'у кнопки оплаты есть обработчик'],

  [RU, '<button type="button" class="pmm-way"><span class="pmm-way-soon">скоро</span>Элкарт</button>',
       '<div class="pmm-way"><span class="pmm-way-soon">скоро</span>Элкарт</div>',
   'способы оплаты — кнопки, а не div'],

  [TOAST, '    window.KSLT_TOAST = T;', '    window.KSLT_TOAST_SVOY = T;',
   'уведомление берётся из общего, а не заводится седьмым'],

  [SETT, "                { key: 'prices', label: isEn ? 'Prices' : 'Цены' },", '',
   'карточка цен в админке есть и зовётся только администратору'],

  [SETT, "from('site_content').upsert", "from('site_content_staroe').upsert",
   'админка правит суммы в pricing_plans и текст в site_content'],

  [EN, 'pricing.css?v=25', 'pricing.css?v=24',
   'версия стиля поднята и одинакова на всех трёх страницах'],
];

function прогон() {
    const r = spawnSync('node', [path.join(ВРЕМ, 'tools/check-ceny.js')], { encoding: 'utf8', cwd: ВРЕМ });
    const вывод = (r.stdout || '') + (r.stderr || '');
    return (вывод.match(/^    · .+$/gm) || []).map(с => с.replace('    · ', '').trim());
}

if (прогон().length) {
    console.log('\n  ✗ копия не зелёная до откатов — чинить сперва её\n');
    console.log(прогон().join('\n'));
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
        console.log(`      ${было.slice(0, 70).replace(/\n/g, ' ')}`);
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
