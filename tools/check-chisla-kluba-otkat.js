#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ЧИСЕЛ КЛУБА (кусок 209). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-chisla-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['js', 'mobile/www/js', 'index.html', 'pages', 'tools/check-chisla-kluba.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-chisla-kluba.js')],
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
    console.log('  БЕДА    в песке правила НЕ проходят — откаты бессмысленны\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const ДОМ = 'js/kslt-chisla-kluba.js';
const КОПИЯ = 'mobile/www/js/kslt-chisla-kluba.js';
const ГЛАВНАЯ = 'mobile/www/js/screens/home-blocks.js';
const СТАТ = 'js/stats.js';
const I18N = 'mobile/www/js/i18n.js';

const ОТКАТЫ = [
    ['дом перестал отдавать формулу', ДОМ,
     '    Д.турнировВсего = function (изБазы) {', '    Д.турнировВсегоБыло = function (изБазы) {',
     'дом чисел клуба объявлен'],

    ['копия дома уехала от сайтовой', КОПИЯ,
     '    var АРХИВ_ТУРНИРОВ = 300;', '    var АРХИВ_ТУРНИРОВ = 301;',
     'копия дома в приложении совпадает до байта'],

    ['главная приложения снова зовёт базу сама', ГЛАВНАЯ,
     '    ЧИСЛА.прочитать(supabaseClient).then(function (d) {',
     "    supabaseClient.rpc('get_club_stats').then(function (d) {",
     'функцию базы зовёт только дом'],

    ['архив снова зашит у зовущего', ГЛАВНАЯ,
     '    var ЧИСЛА = window.KSLT_CHISLA_KLUBA;\n    var cards = [',
     '    var ЧИСЛА = window.KSLT_CHISLA_KLUBA;\n    var ARCHIVE = 300;\n    var cards = [',
     'число архива турниров не зашито у зовущих'],

    ['главная снова просит поле, которого нет', ГЛАВНАЯ,
     '      [d.ranked, I18N.t(', '      [d.members, I18N.t(',
     'никто не читает поле «members»'],

    ['подпись осталась в одном языке', I18N,
     "'home.stRanked':      { ru: 'В рейтинге',        en: 'Ranked',         kg: 'Рейтингде' },",
     "'home.stRanked':      { ru: 'В рейтинге' },",
     'подпись «В рейтинге» заведена на трёх языках'],

    ['старый ключ вернулся в словарь', I18N,
     "    'home.stRanked':", "    'home.stMembers':     { ru: 'Членов клуба' },\n    'home.stRanked':",
     'старый ключ «Членов клуба» снят'],

    ['дом сняли с главной страницы сайта', 'index.html',
     '<script src="js/kslt-chisla-kluba.js?v=1"></script>\n', '',
     'дом подключён раньше тех, кто его зовёт'],

    ['сайт снова зовёт базу сам', СТАТ,
     '    ЧИСЛА.прочитать(client).then(function(d) {',
     "    client.rpc('get_club_stats').then(function(d) {",
     'функцию базы зовёт только дом']
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
        console.log(стр + '\n      ✗ ждали падения правила «' + ждём + '», код ' + р.код);
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
