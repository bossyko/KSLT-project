#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ НОВОСТЕЙ ПРИЛОЖЕНИЯ (кусок 219). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-novosti-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'js/kslt-video.js', 'js/kslt-setka.js',
 'tools/check-novosti-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-novosti-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз в ' + отн;
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}
function вернуть(отн) { fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн)); }

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const H = 'mobile/www/index.html';
const G = 'mobile/www/js/screens/home.js';
const M = 'mobile/www/js/news-media.js';
const C = 'mobile/www/css/app.css';
const V = 'mobile/www/js/kslt-video.js';
const S = 'js/kslt-setka.js';

const ОТКАТЫ = [
    ['дом кадров не подключён', H,
     '<script src="js/kslt-video.js?v=1"></script>\n',
     '',
     'дом внешнего видео лежит в приложении и подключён'],

    ['копия дома кадров уехала', V,
     "    function вид(url) {",
     "    function видБыло(url) { return ''; }\n    function вид(url) {",
     'копия дома кадров совпадает до байта'],

    ['починка кадров снята', G,
     '      if (window.KSLT_VIDEO) KSLT_VIDEO.починитьКадры(detail);\n',
     '',
     'кадры чинятся при отрисовке новости'],

    ['врезка снова высотой, а не отношением', C,
     '  --ig-kadr: 4 / 5;',
     '  --ig-kadr-было: 4 / 5;',
     'вертикальная врезка описана отношением, а не высотой'],

    ['кнопки просмотра снесены', M,
     "'<button type=\"button\" class=\"nm-viewer-nav nm-prev\" aria-label=\"Предыдущий\">&#8249;</button>'",
     "''",
     'в просмотре есть кнопки листания'],

    ['кнопки карусели снесены', M,
     "'<button type=\"button\" class=\"nm-nav nm-prev\" aria-label=\"Предыдущий\">&#8249;</button>' +",
     "",
     'в карусели есть кнопки листания'],

    ['нажатие по снимку снова закрывает', M,
     '      if (e.target === overlay) close();',
     '      if (e.target === overlay || e.target === img) close();',
     'нажатие по снимку больше не закрывает просмотр'],

    ['клавиши сняты', M,
     "        if (e.key === 'ArrowLeft') show(index - 1);",
     "        if (e.key === 'Arrow-было') show(index - 1);",
     'листать можно и с клавиатуры'],

    ['свайп в просмотре потерян', M,
     '    onSwipe(overlay, function(dir) { show(index + dir); });',
     '',
     'свайп остался'],

    ['цель нажатия кнопок мимо шкалы', C,
     '  width: 44px; height: 44px;\n  display: flex; align-items: center; justify-content: center;\n  border: 0;\n  border-radius: 50%;\n  background: rgba(0,0,0,0.45);',
     '  width: 40px; height: 40px;\n  display: flex; align-items: center; justify-content: center;\n  border: 0;\n  border-radius: 50%;\n  background: rgba(0,0,0,0.45);',
     'у кнопок листания цель нажатия со шкалы'],

    ['посев снова после имени', S,
     "                 (st.seed ? '<span class=\"td-gt-seed\">[' + st.seed + ']</span> ' : '') +\n                 имя(st.playerId) + '</td>';",
     "                 имя(st.playerId) + (st.seed ? ' [' + st.seed + ']' : '') + '</td>';",
     'посев стоит перед именем'],

    ['версия правленого файла не поднята', H,
     'js/news-media.js?v=2',
     'js/news-media.js?v=1',
     'версии правленых файлов подняты']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    const стр = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(стр + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0) {
        console.log(стр + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(стр + '\n      ✗ ждали падения «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 3)
            .map(с => '        ' + с.trim()).join('\n'));
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не уронило своё правило: ' + плохо + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили ИМЕННО своё правило\n');
}
