#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ШКАЛЫ ПРИЛОЖЕНИЯ (кусок 213). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-shkala-'));

['mobile/www/css/app.css', 'tools/check-shkala-prilozheniya.js'].forEach(отн => {
    const куда = path.join(песок, отн);
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.copyFileSync(path.join(КОРЕНЬ, отн), куда);
});

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-shkala-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз';
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

const C = 'mobile/www/css/app.css';
const ОТКАТЫ = [
    ['дробный кегель вернулся', C, '.gi-text {', '.gi-text { font-size: 13.5px;',
     'ни одного дробного кегля во всём приложении'],
    ['кегель ушёл со ступени', C, '.bs-title {', '.bs-title { font-size: 15px;',
     'каждый кегель приложения — ступень шкалы'],
    ['отступ ушёл с сетки', C, '.bs-options {', '.bs-options { gap: 10px;',
     'каждый отступ приложения на сетке восьмёрки'],
    ['размер ушёл с сетки', C, '.bs-option {', '.bs-option { min-width: 70px;',
     'каждый размер приложения на сетке'],
    ['вернули границу 500', C, '@media (min-width: 640px) and (min-height: 640px) {',
     '@media (min-width: 500px) { .tab-item { min-width: 60px; } }\n@media (min-width: 640px) and (min-height: 640px) {',
     'во всём приложении нет границ ширины мимо шкалы'],
    ['граница перестала смотреть на высоту', C,
     '@media (min-width: 640px) and (min-height: 640px) {',
     '@media (min-width: 992px) {',
     'граница шкалы делится ещё и высотой'],
    ['предел ширины вернули на body безусловно', C,
     '  margin: 0 auto;\n  position: relative;\n}\n@media (min-width: 640px)',
     '  max-width: 600px;\n  margin: 0 auto;\n  position: relative;\n}\n@media (min-width: 640px)',
     'предел ширины не висит на body без условия'],
    ['фишке фильтра опустили цель нажатия', C,
     '  display: inline-flex;\n  align-items: center;\n  min-height: 44px;\n  white-space: nowrap;',
     '  white-space: nowrap;',
     'цель нажатия: фишка фильтра (четыре экрана)'],
    ['заполненной кнопке опустили цель', C,
     '  /* ЦЕЛЬ НАЖАТИЯ 44. Было 41. */\n  min-height: 44px;\n  padding: 12px 24px;',
     '  padding: 12px 24px;',
     'цель нажатия: заполненная кнопка']
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
    console.log('  БЕДА    откатов не доказали своих правил: ' + плохо + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила\n');
}
