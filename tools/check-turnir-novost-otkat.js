/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ВКЛАДКИ «НОВОСТИ» ТУРНИРА ОТКАТОМ.
 *
 * Каждое правило check-turnir-novost.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ: оригиналы не трогаются.
 *
 *   node tools/check-turnir-novost-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-turnir-novost-'));
['css', 'tools', 'js', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const BRK = 'js/admin/sections/bracket.js';
const NJS = 'js/admin/sections/news.js';
const СТД = 'maket/stend-admin-turnir-novost.html';

const ОТКАТЫ = [

  [BRK, `        A.renderNewsForm(статья, {`,
        `        A.renderNewsFormКопия(статья, {`,
   'вкладка зовёт ТУ ЖЕ форму, что раздел «Новости»'],

  [BRK, `                    '<input type="file" id="adTrnPhotoInput" multiple accept="image/*" class="ad-trn-photo-file">' +`,
        `                    '<input type="file" id="adTrnNewsTitle" multiple accept="image/*" class="ad-trn-photo-file">' +`,
   'своих полей `adTrnNews*` у вкладки не осталось'],

  [NJS, `    A.renderNewsForm = renderNewsForm;`,
        `    A.renderNewsForm = renderNewsForm; var adTrnNewsTg = 1;`,
   '«Рассылка в ТГ» осталась своей — её в разделе нет'],

  [BRK, `                var поля = { gallery: галерея };`,
        `                var поля = {};`,
   '«Фото с турнира» осталось своим и дописывается в запись входом'],

  [BRK, `            tournamentId: tournament.id,`,
        `            tournamentIdНеТот: tournament.id,`,
   'статья помнит свой турнир'],

  [BRK, `                ? 'Thank you to all participants for a great game!'
                : 'Благодарим всех участников за отличную игру!';`,
        `                ? 'A total of ' + totalPoints + ' rating points were distributed.'
                : 'Всего распределено ' + totalPoints + ' рейтинговых очков.';`,
   'ОЧКИ НЕ ПИШУТСЯ В ТЕКСТ СТАТЬИ'],

  [BRK, `        initNewsPanel.перерисовать = function() {`,
        `        initNewsPanel.перерисоватьНеТа = function() {`,
   'состояние кнопки рассылки — из перечитанной статьи, а не из памяти'],

  [BRK, `            безШапки: true,`,
        `            безШапкиНеТа: true,`,
   'у вкладки нет своей шапки раздела'],

  [СТД, `    A.renderNewsPanel(document.getElementById('adBrkNewsContent'), ТУРНИР, null, ЗАГОТОВКА);`,
        `    document.getElementById('adBrkNewsContent').innerHTML = '<textarea></textarea>';`,
   'стенд рисует НАСТОЯЩУЮ панель, а не её пересказ'],

  [СТД, `  body { opacity: 1 !important; }`,
        `  body { opacity: 0.99; }`,
   'стенд зажигает `body` сам'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-turnir-novost.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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
if (плохо) {
  console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило\n');
  process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии\n');
