#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «КАРТОЧКА СТАТИСТИКИ». */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'kart-stat-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-kartochki-statistiki.js'),
        path.join(двор, 'tools/check-kartochki-statistiki.js'));
    fs.cpSync(path.join(корень, 'js/admin'), path.join(двор, 'js/admin'), { recursive: true });
    return двор;
}

const ОТКАТЫ = [
    {
        имя: 'Тренеры снова перевёрнуты: подпись над числом',
        правка(двор) {
            const п = path.join(двор, 'js/admin/sections/coaches.js');
            const т = fs.readFileSync(п, 'utf8');
            const было = "'<div class=\"ad-cch-stat-value\" id=\"adCchStatTotal\">...</div>' +\n                    '<div class=\"ad-cch-stat-label\">' + L.cchStatTotal + '</div>' +";
            if (т.split(было).length - 1 !== 1) return 'якорь встречается ' + (т.split(было).length - 1) + ' раз';
            const станет = "'<div class=\"ad-cch-stat-label\">' + L.cchStatTotal + '</div>' +\n                    '<div class=\"ad-cch-stat-value\" id=\"adCchStatTotal\">...</div>' +";
            fs.writeFileSync(п, т.replace(было, станет));
        },
        ждём: /подпись стоит НАД числом в 1 карточке/,
    },
    {
        имя: 'Сетка снова перевёрнута: подпись над числом',
        правка(двор) {
            const п = path.join(двор, 'js/admin/sections/bracket.js');
            const т = fs.readFileSync(п, 'utf8');
            const было = "'<div class=\"ad-stat-value\">' + totalPoints + '</div>' +\n                '<div class=\"ad-stat-label\">' + L.brkTotalOchkovRaspredeleno + '</div>' +";
            if (т.split(было).length - 1 !== 1) return 'якорь встречается ' + (т.split(было).length - 1) + ' раз';
            const станет = "'<div class=\"ad-stat-label\">' + L.brkTotalOchkovRaspredeleno + '</div>' +\n                '<div class=\"ad-stat-value\">' + totalPoints + '</div>' +";
            fs.writeFileSync(п, т.replace(было, станет));
        },
        ждём: /подпись стоит НАД числом в 1 карточке/,
    },
    {
        имя: 'карточки статистики вынесли из админки — прибору нечего мерить',
        правка(двор) {
            const д = path.join(двор, 'js/admin/sections');
            for (const ф of fs.readdirSync(д)) {
                const п = path.join(д, ф);
                fs.writeFileSync(п, fs.readFileSync(п, 'utf8').split('stat-card').join('kartochka-ushla'));
            }
        },
        ждём: /прибор ослеп либо раздел снесли/,
    },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-kartochki-statistiki.js')],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер карточек статистики: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);
