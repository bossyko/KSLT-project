#!/usr/bin/env node
/**
 * ПРУВЕР К ПЕРЕПИСИ КОПИЙ (шаг A3.7, 29.10).
 *
 * Прувер здесь особый: сторож мерит СОСТОЯНИЕ ДЕРЕВА, а не текст одного
 * файла. Поэтому откаты трогают само дерево — ломают копию, заводят
 * новый файл под занятым именем, стирают причину.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

function копия() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kopii-'));
    for (const отн of ['js', 'mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}
function прогон(корень) {
    try {
        return execFileSync('node', [path.join(корень, 'tools/check-kopii-js.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

const ОТКАТЫ = [
    { имя: 'сведённый дом разошёлся обратно',
      ждём: 'побайтово равных не меньше замеренного',
      делать: (к) => {
          const п = path.join(к, 'mobile/www/js/kslt-plitki.js');
          fs.writeFileSync(п, fs.readFileSync(п, 'utf8') + '\n/* копия уехала */\n');
      } },

    { имя: 'завели новый файл под занятым именем',
      ждём: 'файлов с одним именем и разным телом не больше замеренного',
      делать: (к) => {
          fs.writeFileSync(path.join(к, 'mobile/www/js/phone.js'),
              '/* другое тело под тем же именем */\n');
      } },

    { имя: 'у расхождения стёрли причину',
      ждём: 'у каждого расхождения названа причина',
      делать: (к) => {
          const п = path.join(к, 'tools/check-kopii-js.js');
          const t = fs.readFileSync(п, 'utf8');
          fs.writeFileSync(п, t.replace("    'auth.js': {", "    'auth-byl.js': {"));
      } },

    { имя: 'причина осталась у сведённого файла',
      ждём: 'нет причин для того, что уже сведено',
      делать: (к) => {
          const п = path.join(к, 'tools/check-kopii-js.js');
          const t = fs.readFileSync(п, 'utf8');
          fs.writeFileSync(п, t.replace("    'auth.js': {",
              "    'phone.js': { вид: 'ДОЛГ', чем: 'выдуманная причина' },\n    'auth.js': {"));
      } },

    { имя: 'НАМЕРЕНО осталось без сторожа',
      ждём: 'у каждого НАМЕРЕНО есть свой сторож',
      делать: (к) => {
          fs.rmSync(path.join(к, 'tools/check-grafik-dannye.js'));
          fs.rmSync(path.join(к, 'tools/check-adres-sayta-prilozheniya.js'));
      } }
];

console.log('\n  ПРУВЕР: ПЕРЕПИСЬ КОПИЙ JS\n');
let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копия();
    о.делать(корень);
    const вывод = прогон(корень);
    if (вывод.includes('✗ ' + о.ждём)) {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    } else {
        console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    }
    fs.rmSync(корень, { recursive: true, force: true });
}
console.log('');
if (беда) {
    console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
}
