/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ИМЕНИ ИГРОКА ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает. Каждое правило проверяется
 * обратным ходом: возвращаем прежнее поведение — правило ОБЯЗАНО упасть,
 * и упасть должно ИМЕННО ТО, которое за это отвечает.
 *
 * Работаем на КОПИИ, оригиналы не трогаем.
 *
 *   node tools/check-imya-igroka-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/kslt-lico.js', 'js/scoreboard.js', 'js/live-match.js',
               'index.html', 'index-en.html', 'index-kg.html',
               'pages/scoreboard.html', 'maket/stend-tablo.html'];

/* [файл, что ищем, на что меняем, какое правило должно упасть] */
const ОТКАТЫ = [
  /* ОТКАТ ОБЯЗАН ВЕРНУТЬ ИМЕННО ПРЕЖНЕЕ ПОВЕДЕНИЕ, А НЕ ПОХОЖЕЕ.
     Первая редакция этого отката переписывала последнюю строку на две,
     порядка не меняя, — и правило честно молчало. Снимок должен встать
     ПЕРВЫМ, иначе доказывать нечего. */
  ['js/kslt-lico.js',
   '        if (игрок) {',
   '        if (снимок) return снимок;\n        if (игрок) {',
   'в доме карточка идёт раньше снимка'],

  ['js/kslt-lico.js',
   'function имяНаЯзыке(игрок, снимок, заглушка) {',
   'function имяНаЯзыке(игрок) {\n        var снимок = null, заглушка = null;',
   'дом имени принимает снимок вторым доводом'],

  ['index-en.html',
   "                            var p1Name = KSLT_LICO.имяНаЯзыке(p1, m.player1_name, 'TBD');",
   '                            var p1Name = m.player1_name || p1.name_en || p1.name;',
   'снимок не стоит первым: index-en.html'],

  ['js/scoreboard.js',
   "        var p1Name = window.KSLT_LICO.имяНаЯзыке(m.player1, m.player1_name, 'Игрок 1');",
   "        var p1Name = m.player1_name || (m.player1 && m.player1.name) || 'Игрок 1';",
   'снимок не стоит первым: js/scoreboard.js'],

  ['js/live-match.js',
   "        return window.KSLT_LICO.имяНаЯзыке(p, n === 1 ? m.player1_name : m.player2_name, '—');",
   '        return getPlayerName(p, n === 1 ? m.player1_name : m.player2_name);\n' +
   '    }\n' +
   '    function getPlayerName(p, fallbackName) {\n' +
   '        if (p && p.name) return p.name;\n' +
   "        return fallbackName || '—';",
   'в странице матча нет своей функции имени'],

  ['maket/stend-tablo.html',
   '    <script src="../js/kslt-lico.js?v=10"></script>\n',
   '',
   'дом подключён на каждой странице, которая его зовёт'],

  ['pages/scoreboard.html',
   '    <script src="../js/kslt-lico.js?v=10"></script>',
   '    <script src="../js/kslt-lico.js?v=8"></script>',
   'версия дома имени одна на весь сайт'],
];

const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-imya-'));
/* КОПИЯ ДЕЛАЕТСЯ ЦЕЛИКОМ: прибор обходит каталоги и считает версии по
   всем страницам, поэтому ему нужен весь сайт, а не три файла. */
fs.cpSync(КОРЕНЬ, ВРЕМ, {
    recursive: true,
    filter: (и) => !/node_modules|\.git$|\.git[\/\\]|test-results|mobile[\/\\](android|ios|node_modules)|backups/.test(и)
});

function прогон() {
    try {
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools', 'check-imya-igroka.js')],
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
