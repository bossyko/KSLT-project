#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «СТРАНИЦЫ ПОД ПРОБОЙ». */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'stranicy-proba-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-stranicy-pod-proboy.js'),
        path.join(двор, 'tools/check-stranicy-pod-proboy.js'));
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: сторож читает ВСЕ страницы и ВСЕ
       пробы. Пробы везём целиком — их имена и есть предмет проверки. */
    fs.mkdirSync(path.join(двор, 'pages'));
    for (const и of fs.readdirSync(корень).filter(и => и.endsWith('.html'))) {
        fs.copyFileSync(path.join(корень, и), path.join(двор, и));
    }
    for (const и of fs.readdirSync(path.join(корень, 'pages')).filter(и => и.endsWith('.html'))) {
        fs.copyFileSync(path.join(корень, 'pages', и), path.join(двор, 'pages', и));
    }
    copyDir(path.join(корень, 'tests'), path.join(двор, 'tests'));
    return двор;
}
function copyDir(из, в) {
    fs.mkdirSync(в, { recursive: true });
    for (const э of fs.readdirSync(из, { withFileTypes: true })) {
        if (э.name === 'reports' || э.name === 'node_modules' || э.name === '.auth') continue;
        const и = path.join(из, э.name), о = path.join(в, э.name);
        if (э.isDirectory()) copyDir(и, о);
        else if (/\.(js|mjs)$/.test(э.name)) fs.copyFileSync(и, о);
    }
}

const ОТКАТЫ = [
    { имя: 'страницу перестали открывать пробы',
      правка(двор) {
          /* Правим ВСЕ упоминания имени файла в пробах: страница считается
             покрытой, если её открывает ХОТЬ ОДНА — значит и прятать надо
             из всех, иначе откат ничего не доказывает. */
          let тронуто = 0;
          (function обход(д) {
              for (const э of fs.readdirSync(д, { withFileTypes: true })) {
                  const п = path.join(д, э.name);
                  if (э.isDirectory()) { обход(п); continue; }
                  if (!/\.(js|mjs)$/.test(э.name)) continue;
                  const т = fs.readFileSync(п, 'utf8');
                  if (т.indexOf('privacy-policy.html') === -1) continue;
                  fs.writeFileSync(п, т.split('privacy-policy.html').join('politika-ubrana.html'));
                  тронуто++;
              }
          })(path.join(двор, 'tests'));
          if (!тронуто) return 'страницы нет ни в одной пробе уже сейчас';
      },
      ждём: /открывает хоть одна проба/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-stranicy-pod-proboy.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер страниц под пробой: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);
