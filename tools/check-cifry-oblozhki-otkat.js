/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ЦИФР ОБЛОЖКИ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что
 * оно зелёное всегда. Каждое правило check-cifry-oblozhki.js проверяем
 * обратным ходом — возвращаем прежнее значение, и ИМЕННО ТО правило
 * обязано упасть. Работаем на КОПИИ, оригиналы не трогаем.
 *
 *   node tools/check-cifry-oblozhki-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-cifry-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, 'index.html'), path.join(ВРЕМ, 'index.html'));

const СТИЛЬ = 'css/style.css';
const ТУРН  = 'css/tournaments.css';
const ОБЗОР = 'css/tournaments-overview.css';
const JSРАЗ = 'js/tournaments-overlay.js';
const JSОБЗ = 'js/tournaments-overview.js';
const ЛЕНД  = 'index.html';

/* [файл, что ищем, на что меняем, какое правило обязано упасть] */
const ОТКАТЫ = [

  [JSРАЗ, `            ячейка.remove();`,
          `            ячейка.style.display = 'none';`,
   'на странице разряда нулевой показатель УБИРАЕТСЯ из дерева'],

  [JSОБЗ, `                    ячейка.remove();`,
          `                    ячейка.style.display = 'none';`,
   'на обзорной нулевой показатель УБИРАЕТСЯ из дерева'],

  [СТИЛЬ, `    .tournament-hero .tournament-hero-stats:has(> :nth-child(3):last-child),`,
          `    .tournament-hero .tournament-hero-stats.troe,`,
   'счёт колонок по-прежнему идёт ПО ДЕТЯМ — иначе убирать нечего'],

  [СТИЛЬ, `    .bo-hero .bo-hero-stats:has(> :nth-child(2):last-child) {
        grid-template-columns: repeat(2, auto);`,
          `    .bo-hero .bo-hero-stats:has(> :only-child-staroe) {
        grid-template-columns: repeat(2, auto);`,
   'у пары показателей есть своё правило'],

  [СТИЛЬ, `        grid-template-columns: repeat(2, auto);
        justify-content: center;
        column-gap: var(--space-lg);`,
          `        grid-template-columns: 1fr 1fr;
        justify-content: center;
        column-gap: var(--space-lg);`,
   'дорожки пары — ПО СОДЕРЖИМОМУ, а не равными долями'],

  [СТИЛЬ, `        grid-template-columns: repeat(2, auto);
        justify-content: center;`,
          `        grid-template-columns: repeat(2, auto);
        justify-content: start;`,
   'пара выравнивается по центру обложки'],

  [СТИЛЬ, `        column-gap: var(--space-lg);`,
          `        column-gap: 40px;`,
   'зазор пары — ступень шкалы, а не число'],

  [ЛЕНД, `                    <div class="stat">
                        <span class="stat-value" id="statTournaments">&mdash;</span>
                        <span class="stat-label">Турниров</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="statCourts">&mdash;</span>
                        <span class="stat-label">Теннисных центров</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="statCoaches">&mdash;</span>
                        <span class="stat-label">Тренеров</span>
                    </div>
`,
         ``,
   'лендинг под правило пары не попадает — показателей у него не два'],

  [ТУРН, `    .tournament-hero-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }`,
         `    .tournament-hero-content {
        width: 100%;
        display: flex;
        flex-direction: column;
    }`,
   'на странице разряда заголовок и цифры собраны в одну группу'],

  [ОБЗОР, `    .to-hero-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }`,
          `    .to-hero-content {
        width: 100%;
        display: flex;
        flex-direction: column;
    }`,
   'на обзорной заголовок, подпись и цифры собраны так же'],

  [ТУРН, `    .tournament-hero-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }`,
         `    .tournament-hero-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }`,
   'ни на одном из двух экранов не вернулся развод по краям'],

  [ТУРН, `    .trn-hero-sub:empty + .tournament-hero-stats {
        margin-top: var(--space-6);
    }`,
         `    .trn-hero-sub:empty + .tournament-hero-stats {
        margin-top: 22px;
    }`,
   'зазор «заголовок → цифры» — ступень шкалы, а не число'],

  [ТУРН, `    min-height: var(--oblozhka-pol);`,
         `    min-height: 200px;`,
   'пол обложки раздела не тронут — он держит одну высоту у шести разрядов'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-cifry-oblozhki.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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
