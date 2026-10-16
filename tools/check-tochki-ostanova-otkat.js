/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ТОЧЕК ОСТАНОВА. На КОПИИ.
 *
 *   node tools/check-tochki-ostanova-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const врем = fs.mkdtempSync(path.join(os.tmpdir(), 'tochki-'));
fs.mkdirSync(path.join(врем, 'css'));
fs.mkdirSync(path.join(врем, 'tools'));
fs.readdirSync(path.join(КОРЕНЬ, 'css')).forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, 'css', ф), path.join(врем, 'css', ф)));
fs.copyFileSync(path.join(__dirname, 'check-tochki-ostanova.js'),
                path.join(врем, 'tools', 'check-tochki-ostanova.js'));

const ЦЕЛЬ = path.join(врем, 'css', 'style.css');
const чистый = fs.readFileSync(ЦЕЛЬ, 'utf8');

function прогон() {
    try {
        execFileSync('node', [path.join(врем, 'tools', 'check-tochki-ostanova.js')], { encoding: 'utf8' });
        return 0;
    } catch (e) { return 1; }
}

const ОТКАТЫ = [
    ['завести НОВУЮ чужую ширину, которой нет в списке решений',
     '@media (max-width: 820px) {\n    .trn-chip { font-size: 11px; }\n}\n'],
    ['добавить ЛИШНИЙ блок на уже названной ширине сверх разрешённого числа',
     '@media (max-width: 1300px) {\n    .trn-chip { font-size: 11px; }\n}\n'],
];

console.log('');
if (прогон() !== 0) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(врем, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let бед = 0;
    ОТКАТЫ.forEach(([имя, порча]) => {
        fs.writeFileSync(ЦЕЛЬ, чистый + '\n' + порча);
        const код = прогон();
        fs.writeFileSync(ЦЕЛЬ, чистый);
        if (код === 0) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); бед++; }
        else console.log('  v ' + имя);
    });
    fs.rmSync(врем, { recursive: true, force: true });
    if (бед === 0) {
        console.log('\n  ок      все ' + ОТКАТЫ.length + ' откатов доказали правило');
        console.log('          оригиналы не трогались — работа шла на копии\n');
    } else {
        console.log('\n  НЕ ТАК  ' + бед + ' откатов не доказали ничего\n');
        process.exitCode = 1;
    }
}
