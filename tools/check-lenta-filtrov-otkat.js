/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ЛЕНТЫ ФИЛЬТРОВ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что
 * оно зелёное всегда. Каждое правило check-lenta-filtrov.js проверяем
 * обратным ходом — возвращаем прежнее значение, и ИМЕННО ТО правило
 * обязано упасть. Работаем на КОПИИ, оригиналы не трогаем.
 *
 *   node tools/check-lenta-filtrov-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lenta-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, 'index.html'), path.join(ВРЕМ, 'index.html'));

const CSS = 'css/style.css';
const JSФ = 'js/tournaments-overlay.js';
const RU  = 'pages/tournaments.html';
const EN  = 'pages/tournaments-en.html';
const ЛЕНД = 'index.html';

/* [файл, что ищем, на что меняем, какое правило обязано упасть] */
const ОТКАТЫ = [

  [ЛЕНД, `<body`, `<body data-trn-filters="завелась на лендинге"`,
   'лента есть на всех трёх языках и нигде не на лендинге'],

  [RU, `<div class="trn-chip-group" role="radiogroup" aria-label="Пол">`,
       `<div class="trn-chip-group-pol">`,
   'фильтры собраны в ДВЕ группы с ролью, на каждом языке'],

  [EN, `aria-label="Tournament status"`, `aria-label=""`,
   'у каждой группы есть подпись для диктора, и она переведена'],

  [RU, `<button role="radio" aria-checked="false" class="trn-chip" data-filter="gender" data-value="men">`,
       `<button class="trn-chip" data-filter="gender" data-value="men">`,
   'каждый чип несёт роль и состояние'],

  [JSФ, `                    c.setAttribute('aria-checked', 'false');\n`, ``,
   'состояние едет вместе с видом, а не отдельно'],

  [JSФ, `if (чип && чип.dataset.value !== 'all') чип.disabled = !v;`,
        `/* гашение снято */`,
   'чип, который ничего не найдёт, гаснет'],

  [CSS, `    line-height: var(--lh-none);\n    min-height: var(--btn-h-md);`,
        `    line-height: var(--lh-none);`,
   'цель нажатия чипа — ступень кнопки, и задана ВЫСОТОЙ'],

  [CSS, `    .pl-category-pill.pl-category-pill,\n    .db-chip.db-chip {`,
        `    .trn-chip.trn-chip,\n    .pl-category-pill.pl-category-pill,\n    .db-chip.db-chip {`,
   'чип не вернулся в общий блок мелких кнопок'],

  [CSS, `.trn-search-input {\n    min-height: var(--btn-h-md);\n}`,
        `.trn-search-input {\n    min-height: 39px;\n}`,
   'поле поиска — ступень кнопки, а не 39'],

  [CSS, `    font-size: var(--fs-xs);\n    font-family: var(--font-primary);`,
        `    font-size: var(--fs-sm);\n    font-family: var(--font-primary);`,
   'кегль чипа один на все виды'],

  [CSS, `    line-height: var(--lh-none);\n    min-height: var(--btn-h-md);\n    padding: 8px 18px;`,
        `    line-height: 1.15;\n    min-height: var(--btn-h-md);\n    padding: 8px 18px;`,
   'межстрочный чипа — ступень, а не число'],

  [CSS, `    .trn-filters {\n        position: static;\n        padding: 8px 0;\n    }`,
        `    .trn-filters {\n        padding: 8px 0;\n    }`,
   'на низком горизонтальном лента НЕ липнет'],

  [CSS, `    gap: 12px;\n    padding: 0 var(--pad-x);\n}`,
        `    gap: 12px;\n    max-width: var(--container-max);\n    margin: 0 auto;\n    padding: 0 var(--gutter);\n}`,
   'левый край ленты считается ТОЙ ЖЕ формулой, что содержимое'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-lenta-filtrov.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*✗\s/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

console.log('');
const база = прогон();
if (база.length) {
  console.log('  НЕ ТАК  копия падает ещё ДО откатов — ' + база.length + ' правил');
  база.forEach(п => console.log('          ✗ ' + п));
  console.log('');
  process.exit(1);
}

let плохо = 0;
ОТКАТЫ.forEach(([ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ откат ' + (i + 1) + ': ждали «' + ждём + '»');
    console.log('    упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else {
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём + (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо === 0) {
  console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
  console.log('');
  process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);
