#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ СЛОВАРЯ ПРИЛОЖЕНИЯ (кусок 214). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-slovar-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www/js', 'js', 'tools/check-slovar-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-slovar-prilozheniya.js')],
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

const I = 'mobile/www/js/i18n.js';
const HB = 'mobile/www/js/screens/home-blocks.js';
const CO = 'mobile/www/js/screens/courts.js';
const TO = 'mobile/www/js/screens/tournaments.js';
const PA = 'mobile/www/js/screens/partners.js';
const SC = 'mobile/www/js/site-content.js';

const ОТКАТЫ = [
    ['имя языка снова читается несуществующим именем', HB,
     '  function field(row, base) { return I18N.поле(row, base); }',
     '  function field(row, base) { var l = I18N.currentLang; return row[base + l] || row[base]; }',
     'язык читается одним именем'],

    ['дом языкового поля снят', I,
     '  I18N.поле = function (строка, основа) {',
     '  I18N.полеБыло = function (строка, основа) {',
     'дом языкового поля объявлен'],

    ['языковое поле снова выбирается руками', HB,
     '  function field(row, base) { return I18N.поле(row, base); }',
     "  function field(row, base) { return row[base + '_en'] || row[base]; }",
     'языковое поле нигде не выбирается руками'],

    ['покрытия снова зашиты по-русски', CO,
     '  function покрытие(ключ) { return I18N.t(\'surface.\' + ключ); }',
     "  var SURFACE_MAP = { hard: 'Хард', clay: 'Грунт' };\n  function покрытие(ключ) { return SURFACE_MAP[ключ]; }",
     'не зашито по-русски: покрытия кортов'],

    ['формат турнира снова зашит', TO,
     "    if (formatText === 'singles') formatText = I18N.t('format.singles');",
     "    if (formatText === 'singles') formatText = 'Одиночный';",
     'не зашито по-русски: формат турнира'],

    ['окно гостя на кортах снова зашито', CO,
     "'<div class=\"rr-guest-title\">' + I18N.t('guest.courtsTitle') + '</div>' +",
     "'<div class=\"rr-guest-title\">Все корты доступны</div>' +",
     'не зашито по-русски: окно гостя на кортах'],

    ['окно гостя в поиске игрока снова зашито', PA,
     "'<div class=\"rr-guest-title\">' + I18N.t('guest.partnersTitle') + '</div>' +",
     "'<div class=\"rr-guest-title\">Все партнёры доступны</div>' +",
     'не зашито по-русски: окно гостя в поиске игрока'],

    ['ключ покрытия остался в одном языке', I,
     "    'surface.hard':        { ru: 'Хард',                   en: 'Hard',            kg: 'Катуу' },",
     "    'surface.hard':        { ru: 'Хард' },",
     'ключ заведён на трёх языках: покрытия кортов'],

    ['копия общего файла уехала от сайтовой', SC,
     '        if (window.KSLT_I18N && window.KSLT_I18N.lang) return window.KSLT_I18N.lang;',
     '        if (window.KSLT_I18N && window.KSLT_I18N.lang) return window.KSLT_I18N.lang; // уехало',
     'общий `site-content.js` читает язык одинаково в обеих копиях']
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
