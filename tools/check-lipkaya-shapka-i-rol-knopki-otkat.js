/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 123. На КОПИИ.
 *   node tools/check-lipkaya-shapka-i-rol-knopki-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-123-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const AD = 'css/admin.css',
      FIN = 'js/admin/sections/finances.js', VCH = 'js/admin/sections/vouchers.js',
      USR = 'js/admin/sections/users.js', НАСТР = 'js/admin/sections/settings.js',
      ТУРН = 'js/admin/sections/tournaments.js';

const ОТКАТЫ = [
  ['снять липкость с шапки очков', AD,
   'position: sticky; top: var(--header-h); z-index: 2;',
   'position: relative; z-index: 2;',
   'шапка таблицы очков объявлена липкой и липнет к шапке сайта'],

  ['увести липкость со своего числа', AD,
   'position: sticky; top: var(--header-h); z-index: 2;',
   'position: sticky; top: 64px; z-index: 2;',
   'шапка таблицы очков объявлена липкой и липнет к шапке сайта'],

  ['вернуть таблицу очков в обычную карточку', НАСТР,
   'ad-table-card ad-table-card-pts',
   'ad-table-card',
   'карточка таблицы очков помечена своим классом'],

  ['вернуть переполнение карточке очков', AD,
   '.ad-table-card-pts { overflow: visible; }',
   '.ad-table-card-pts { overflow-x: auto; }',
   'у карточки таблицы очков переполнения нет'],

  ['завести переполнение в пустой обёртке', AD,
   '.ad-pts-scroll { /* пусто намеренно: см. выше */ }',
   '.ad-pts-scroll { overflow-x: auto; }',
   'обёртка `.ad-pts-scroll` осталась пустой'],

  ['свести роли публикации в один тон', ТУРН,
   "(t.published_at ? 'ad-btn-warning' : 'ad-btn-primary')",
   "'ad-btn-secondary'",
   'кнопка публикации берёт роль по состоянию, а не один тон на оба'],

  ['покрасить публикацию разрушительным', ТУРН,
   "(t.published_at ? 'ad-btn-warning' : 'ad-btn-primary')",
   "(t.published_at ? 'ad-btn-danger' : 'ad-btn-primary')",
   'кнопка публикации не носит разрушительный тон'],

  ['покрасить «Сетку» заодно с остальными', ТУРН,
   'ad-btn ad-btn-sm ad-btn-secondary ad-brk-btn',
   'ad-btn ad-btn-sm ad-btn-warning ad-brk-btn',
   '«Сетка» осталась нейтральной'],
  /* ── полоса фильтров, кусок 125 ── */
  ['вернуть мёртвое имя полосе фильтров «Финансов»', FIN,
   '<div class="ad-filter-row ad-filter-sticky">',
   '<div class="ad-filter-row sticky">',
   'ни одна полоса фильтров не носит имени, под которым нет правила'],

  ['вернуть мёртвое имя полосе фильтров «Скидок»', VCH,
   '<div class="ad-filter-row ad-filter-sticky">',
   '<div class="ad-filter-row sticky">',
   'липнут ВСЕ двенадцать полос фильтров'],

  ['снять липкость у полосы «Пользователей»', USR,
   '<div class="ad-filter-row ad-filter-sticky">',
   '<div class="ad-filter-row">',
   'липнут ВСЕ двенадцать полос фильтров'],

  ['завести правило `.sticky` — второе имя тому же понятию', AD,
   '.ad-filter-sticky {\n    position: sticky;',
   '.sticky {\n    position: sticky;\n}\n\n.ad-filter-sticky {\n    position: sticky;',
   'правила `.sticky` в admin.css по-прежнему нет'],

  ['унести полосу фильтров «Финансов» — правилу станет нечего считать', FIN,
   'class="ad-filter-row ad-filter-sticky"',
   'class="ad-NETU-filter-row ad-filter-sticky"',
   'полосы фильтров найдены, и их 12'],

];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-lipkaya-shapka-i-rol-knopki.js')], { encoding: 'utf8' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*✗/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

if (прогон().length) {
  console.log('\n  ✗ БАЗА: правило не проходит на ЧИСТОЙ копии — песок неполон\n');
  console.log('    ' + прогон().join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    исходный код правила проходит\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('      ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++; return;
  }
  fs.writeFileSync(путь, ориг.split(было).join(стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ ' + имя);
    console.log('      ждали «' + ждём + '»');
    console.log('      упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не трогались — работа шла на копии\n');
