#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ СРОКА ВОЗВРАТА (шаг A3.7, 29.10). */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'срок снесён из дома', ждём: 'срок объявлен в доме правил',
      файл: 'js/kslt-rules.js',
      было: '    R.ДНЕЙ_НА_ВОЗВРАТ = 30;',
      станет: '    R.ДНЕЙ_ОТКЛЮЧЁН = 30;' },

    { имя: 'расчёт даты убран из дома', ждём: 'дом умеет считать дату удаления',
      файл: 'js/kslt-rules.js',
      было: '    R.датаУдаления = function (откуда) {',
      станет: '    R.датаУдаленияОткл = function (откуда) {' },

    { имя: 'копии дома правил разошлись', ждём: 'копии дома правил побайтово равны',
      файл: 'mobile/www/js/kslt-rules.js',
      было: '    R.ДНЕЙ_НА_ВОЗВРАТ = 30;',
      станет: '    R.ДНЕЙ_НА_ВОЗВРАТ = 14;' },

    { имя: 'сайт снова объявил свой срок',
      ждём: 'у сайта нет своего объявления срока',
      файл: 'js/account-restore.js',
      было: '    function днейНаВозврат() {',
      станет: '    var GRACE_DAYS = 30;\n    function днейНаВозврат() {' },

    { имя: 'приложение снова объявило свой срок',
      ждём: 'у приложения нет своего объявления срока',
      файл: 'mobile/www/js/account-restore.js',
      было: '  /** Дата, когда учётная запись исчезнет насовсем. */',
      станет: '  var GRACE_DAYS = 30;\n  /** Дата, когда учётная запись исчезнет насовсем. */' },

    { имя: 'сайт стал читать срок жадно',
      ждём: 'сайт читает срок ЛЕНИВО, а не при загрузке',
      файл: 'js/account-restore.js',
      было: '        get graceDays() { return днейНаВозврат(); }',
      станет: '        graceDays: днейНаВозврат()' },

    { имя: 'серверная функция разошлась с домом',
      ждём: 'серверные функции держат тот же срок',
      файл: 'supabase/functions/purge-deleted-accounts/index.ts',
      было: 'const GRACE_DAYS = 30',
      станет: 'const GRACE_DAYS = 14' },

    { имя: 'текст страницы называет другой срок',
      ждём: 'тексты страниц удаления называют тот же срок',
      файл: 'pages/delete-account.html',
      было: 'как вернуть в течение 30 дней',
      станет: 'как вернуть в течение 14 дней' }
];

function копия() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-srok-'));
    for (const отн of ['js', 'mobile/www', 'pages', 'supabase/functions', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}
function прогон(корень) {
    try {
        return execFileSync('node', [path.join(корень, 'tools/check-srok-vozvrata.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: СРОК ВОЗВРАТА\n');
let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копия();
    const п = path.join(корень, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        console.log('    Якорь: ' + JSON.stringify(о.было.slice(0, 70)));
        беда++; fs.rmSync(корень, { recursive: true, force: true }); continue;
    }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    const вывод = прогон(корень);
    if (вывод.includes('✗ ' + о.ждём)) {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    } else {
        console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    }
    fs.rmSync(корень, { recursive: true, force: true });
}
console.log('');
if (беда) {
    console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
}
