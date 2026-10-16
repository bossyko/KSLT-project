/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПОСЕВА. На КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее поведение и требует, чтобы упало
 * ИМЕННО правило посева. Якоря держатся на содержимом — на строках, которые
 * живут внутри `раскладСлотов` постоянно, — а не на номерах строк: номера
 * уедут от любой правки выше, и сегодня это уже случилось четыре раза с
 * другими приборами.
 *
 *   node tools/check-posev-polovin-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const врем = fs.mkdtempSync(path.join(os.tmpdir(), 'posev-'));
fs.mkdirSync(path.join(врем, 'js', 'admin', 'sections'), { recursive: true });
fs.mkdirSync(path.join(врем, 'tools'));
[['js', 'tournament-generator.js'], ['js', 'kslt-rules.js'],
 ['js', 'admin', 'sections', 'bracket.js']].forEach(ч =>
    fs.copyFileSync(path.join(КОРЕНЬ, ...ч), path.join(врем, ...ч)));
fs.copyFileSync(path.join(__dirname, 'check-posev-polovin.js'),
                path.join(врем, 'tools', 'check-posev-polovin.js'));

const ЦЕЛЬ = path.join(врем, 'js', 'admin', 'sections', 'bracket.js');
const чистый = fs.readFileSync(ЦЕЛЬ, 'utf8');

function прогон() {
    try {
        execFileSync('node', [path.join(врем, 'tools', 'check-posev-polovin.js')], { encoding: 'utf8' });
        return 0;
    } catch (e) { return 1; }
}

/* [имя, что ищем в файле, чем подменяем] — ровно одно место на откат.
   Если якорь встречается не один раз, откат останавливается: подменять
   наугад нельзя. */
const ОТКАТЫ = [
    ['выключить проход обменов — прежнее поведение до 16.10',
     'while (текущая > 0 && проходов < 100) {',
     'while (false) {'],
    ['убрать из цены плату за раннюю встречу земляков',
     'if (доКонца > планкаДоКонца) ц += 1000 * (доКонца - планкаДоКонца);',
     ''],
    ['убрать из цены плату за пару слабейших в первом круге',
     'if (a.группа < 0 && b.группа < 0 && кругПары(i, j) === 1) ц += 10;',
     ''],
    ['сдвинуть планку так, что любая встреча сходит за норму',
     'var планкаДоКонца = (qualifiers >= 3) ? 1 : 0;',
     'var планкаДоКонца = 99;'],
    ['пустить слабейших ПЕРЕД вторыми местами — ловушка очерёдности',
     '        var неПоместились = [];\n',
     '        var неПоместились = [];\n        безГруппы.forEach(function(у) { поставить(у, false); });\n'],
];

console.log('');
if (прогон() !== 0) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(врем, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let бед = 0;
    ОТКАТЫ.forEach(([имя, якорь, подмена]) => {
        const сколько = чистый.split(якорь).length - 1;
        if (сколько !== 1) {
            console.log('  ✗ ' + имя + '  ->  якорь встречается ' + сколько + ' раз, откат не сделан');
            бед++; return;
        }
        fs.writeFileSync(ЦЕЛЬ, чистый.replace(якорь, подмена));
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
