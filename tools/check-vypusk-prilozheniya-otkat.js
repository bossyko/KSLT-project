#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ВЫПУСКА (кусок 228). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vypusk-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/android/app/build.gradle', 'mobile/android/build.gradle',
 'mobile/android/variables.gradle', 'mobile/android/app/src/main/AndroidManifest.xml',
 'mobile/capacitor.config.ts', 'tools/check-vypusk-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-vypusk-prilozheniya.js')],
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

const СБ = 'mobile/android/app/build.gradle';
const КОРН = 'mobile/android/build.gradle';
const ПЕР = 'mobile/android/variables.gradle';
const МАН = 'mobile/android/app/src/main/AndroidManifest.xml';
const НАС = 'mobile/capacitor.config.ts';

/* ЧИСЛО БЕРЁТСЯ ИЗ ПРИБОРА, УСТНЫЙ СЧЁТ ЗАПРЕЩЁН: номер выпуска читается из
   сборки, пол — из самого правила. Якорь с зашитым числом ломался на каждом
   подъёме versionCode. */
const ТЕК_НОМЕР = (fs.readFileSync(path.join(КОРЕНЬ, СБ), 'utf8')
    .match(/versionCode\s+(\d+)/) || [])[1];
const ПОЛ_НОМЕРА = Number((fs.readFileSync(path.join(КОРЕНЬ, 'tools', 'check-vypusk-prilozheniya.js'), 'utf8')
    .match(/ПОЛ_НОМЕРА\s*=\s*(\d+)/) || [])[1]);

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const ОТКАТЫ = [
    ['номер выпуска опущен', СБ,
     'versionCode ' + ТЕК_НОМЕР, 'versionCode ' + (ПОЛ_НОМЕРА - 1),
     'номер выпуска не опускается ниже уже загруженного'],

    ['целевой уровень откатили на 35', ПЕР,
     'targetSdkVersion = 36', 'targetSdkVersion = 35',
     'целевой уровень не ниже того, что требует Play'],

    ['сборка снова молча подписывается чем попало', СБ,
     "                    'RELEASE_STORE_FILE не задан в local.properties — подписывать релиз нечем')",
     "                    'нечем')",
     'релиз подписывается ключом из local.properties, и без него падает'],

    ['ключ вернулся в репозиторий', СБ,
     '                storeFile file(storePath)',
     "                storeFile file('kslt-release.keystore')",
     'ключа подписи нет в репозитории'],

    ['выпуск перестал ужиматься', СБ, 'minifyEnabled true', 'minifyEnabled false',
     'релиз ужимается и чистится'],

    ['разрешили смешанное содержимое', НАС,
     'allowMixedContent: false', 'allowMixedContent: true',
     'открытого http в приложении нет'],

    ['вернули системную резервную копию', МАН,
     'android:allowBackup="false"', 'android:allowBackup="true"',
     'приложение не разрешает системную резервную копию'],

    ['плагин сборки откатили назад', КОРН,
     "classpath 'com.android.tools.build:gradle:8.13.0'",
     "classpath 'com.android.tools.build:gradle:8.2.1'",
     'сборочные инструменты не откатываются назад']
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
