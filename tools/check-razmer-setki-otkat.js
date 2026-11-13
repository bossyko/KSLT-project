/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ РАЗМЕРА СЕТКИ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает. Каждое правило проверяется
 * обратным ходом на КОПИИ: возвращаем прежнее поведение — правило
 * обязано упасть, и упасть должно именно то, которое за это отвечает.
 *
 *   node tools/check-razmer-setki-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/admin/sections/bracket.js', 'js/tournament-detail.js'];

/* [файл, что ищем, на что меняем, какое правило должно упасть] */
const ОТКАТЫ = [
  /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, КОТОРОЕ ЖИВЁТ ТОЛЬКО ЗДЕСЬ. Первая
     редакция брала пару строк «draw_size || 16» плюс log2 — а она
     встречается трижды, и откат отказался работать. Берём комментарий
     про групповой турнир: он в файле один. */
  ['js/admin/sections/bracket.js',
   '// в групповом турнире draw_size не задают',
   '// в групповом турнире draw_size не задают\n        var лишний = tournament.draw_size || 16;',
   'счёт по полю draw_size не расползается: ровно 14 мест'],

  ['js/admin/sections/bracket.js',
   'var размерСетки = первыйКруг ? первыйКруг * 2 : 16;',
   'var размерСетки = 16;',
   'счёт по матчам первого круга — ровно одно место'],

  ['js/tournament-detail.js',
   'var plDrawSize = groupCount * qualifiers;',
   'var plDrawSize = 8;',
   'публичная сетка группового турнира считает круги по настройкам групп'],

  ['js/tournament-detail.js',
   'var plTotalRounds = Math.log2(plDrawSize);',
   'var plTotalRounds = 3;',
   'число кругов берётся логарифмом, а не на глаз'],
];

const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-setka-'));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.mkdirSync(path.join(ВРЕМ, 'js', 'admin', 'sections'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'check-razmer-setki.js'),
                path.join(ВРЕМ, 'tools', 'check-razmer-setki.js'));
ФАЙЛЫ.forEach((ф) => {
    fs.mkdirSync(path.dirname(path.join(ВРЕМ, ф)), { recursive: true });
    fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф));
});

function прогон() {
    try {
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools', 'check-razmer-setki.js')],
                     { encoding: 'utf8', stdio: 'pipe' });
        return [];
    } catch (e) {
        const вывод = (e.stdout || '') + (e.stderr || '');
        return вывод.split('\n').filter(с => с.indexOf('  НЕ ТАК  ') === 0)
                    .map(с => с.replace('  НЕ ТАК  ', '').trim());
    }
}

console.log('');
const база = прогон();
if (база.length) {
    console.log('  НЕ ТАК  копия падает ещё ДО откатов — ' + база.length + ' правил');
    база.forEach(п => console.log('          ✗ ' + п));
    console.log('');
    fs.rmSync(ВРЕМ, { recursive: true, force: true });
    process.exit(1);
}

let плохо = 0;
ОТКАТЫ.forEach(([ф, было, стало, ждём], i) => {
    const путь = path.join(ВРЕМ, ф);
    const ориг = fs.readFileSync(путь, 'utf8');
    const n = ориг.split(было).length - 1;
    if (n !== 1) {
        console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
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
        console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём +
                    (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
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
