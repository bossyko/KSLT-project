#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ ПЛИТОК (шаг A3.5, 29.10).
 * Берёт КОПИЮ, возвращает прежнее значение и требует падения ИМЕННО
 * того правила, которое за это отвечает.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'дом снесён', ждём: 'дом объявлен',
      файл: 'js/kslt-plitki.js',
      было: '    API.плитка = function (значение, подпись, опции) {',
      станет: '    API.плиточка = function (значение, подпись, опции) {' },

    { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
      файл: 'mobile/www/js/kslt-plitki.js',
      было: '    API.сетка = function (плитки, опции) {',
      станет: '    API.сетка = function (плитки, опции) { /* копия уехала */' },

    { имя: 'экранирование убрано', ждём: 'дом экранирует значение',
      файл: 'js/kslt-plitki.js',
      было: "        return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) {",
      станет: "        return String(s == null ? '' : s).replace(/[\\u0000]/g, function (c) {" },

    { имя: 'ноль в сдвиге снова рисуется', ждём: 'ноль в сдвиге не рисуется',
      файл: 'js/kslt-plitki.js',
      было: "сдвиг !== 0 && сдвиг !== ''",
      станет: "сдвиг !== ''" },

    { имя: 'старое имя вернулось в кабинет',
      ждём: 'старых имён нет в `dashboard.js`',
      файл: 'js/dashboard.js',
      было: '            KSLT_PLITKI.подпись(L.statsNote) +',
      станет: "            '<div class=\"db-stats-note\">' + L.statsNote + '</div>' +" },

    { имя: 'старое имя вернулось в css кабинета',
      ждём: 'старых имён нет в `dashboard.css`',
      файл: 'css/dashboard.css',
      было: '.kst-note {',
      станет: '.db-stats-note {' },

    { имя: 'старое имя вернулось в профиль',
      ждём: 'старых имён нет в `profile.js`',
      файл: 'mobile/www/js/screens/profile.js',
      было: '      html += П.сетка([',
      станет: '      html += \'<div class="stat-card"></div>\'; html += П.сетка([' },

    { имя: 'состояния сломаны заменой подстрокой',
      ждём: '`db-status-*` не пострадал при переименовании',
      файл: 'css/dashboard.css',
      было: 'db-status',
      станет: 'status',
      всеВхождения: true },

    { имя: 'кабинет перестал звать дом',
      ждём: 'кабинет сайта зовёт дом',
      файл: 'js/dashboard.js',
      было: 'KSLT_PLITKI',
      станет: 'KSLT_ПЛИТКИ_НЕТ',
      всеВхождения: true },

    { имя: 'карточка игрока перестала звать дом',
      ждём: 'карточка игрока зовёт дом',
      файл: 'mobile/www/js/screens/player-detail.js',
      было: 'window.KSLT_PLITKI',
      станет: 'window.KSLT_ЧУЖОЙ',
      всеВхождения: true },

    { имя: 'страница грузит плитки без дома',
      ждём: 'дом подключён во всех разметках',
      файл: 'pages/dashboard.html',
      было: '<script src="../js/kslt-plitki.js?v=1"></script>',
      станет: '' },

    { имя: 'краска сдвига убрана у приложения',
      ждём: 'краска плитки есть у приложения',
      файл: 'mobile/www/css/app.css',
      было: '.kst-change { font-size: 11px; font-weight: 600; margin-top: 2px; }',
      станет: '' },

    { имя: 'причину долга страницы игрока стёрли',
      ждём: 'долг страницы игрока назван в коде, а не замолчан',
      файл: 'js/player.js',
      было: 'ПО СЛОВУ КОСТИ',
      станет: 'по решению',
      всеВхождения: true },

    { имя: 'размер вернули строкой в разметку',
      ждём: 'в разметке кабинета нет размеров строкой',
      файл: 'css/dashboard.css',
      было: '.kst-grid-pay { margin-bottom: var(--space-md); }',
      станет: '' }
];

function копия() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-plitki-'));
    for (const отн of ['js', 'css', 'mobile/www', 'pages', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}
function прогон(корень) {
    try {
        return execFileSync('node', [path.join(корень, 'tools/check-plitki.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПЛИТКИ\n');
let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копия();
    const п = path.join(корень, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;
    if (сколько === 0 || (!о.всеВхождения && сколько !== 1)) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        console.log('    Якорь: ' + JSON.stringify(о.было.slice(0, 70)));
        беда++; fs.rmSync(корень, { recursive: true, force: true }); continue;
    }
    fs.writeFileSync(п, о.всеВхождения ? было.split(о.было).join(о.станет)
                                       : было.replace(о.было, о.станет));
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
