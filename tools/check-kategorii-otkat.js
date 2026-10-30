#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ РАЗБИВКИ ПО КАТЕГОРИЯМ (шаг A3.6, 29.10).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'дом снесён', ждём: 'дом объявлен',
      файл: 'js/kslt-kategorii.js',
      было: '    API.строки = function (client, игрок) {',
      станет: '    API.строчки = function (client, игрок) {' },

    { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
      файл: 'mobile/www/js/kslt-kategorii.js',
      было: '    API.все = function (строки, о) {',
      станет: '    API.все = function (строки, о) { /* копия уехала */' },

    { имя: 'friendly вернулся в разбивку', ждём: 'в доме есть: friendly выброшен',
      файл: 'js/kslt-kategorii.js',
      было: " && r.category_id !== 'friendly'",
      станет: '' },

    { имя: 'домашняя категория без очков пропала',
      ждём: 'в доме есть: домашняя категория видна без очков',
      файл: 'js/kslt-kategorii.js',
      было: '                        points: 0, wins: 0, losses: 0',
      станет: '                        points: null, wins: null, losses: null' },

    { имя: 'место считается по всем, а не по своему полу',
      ждём: 'в доме есть: место считается по своему полу',
      файл: 'js/kslt-kategorii.js',
      было: "                    .eq('gender', игрок.gender)",
      станет: '' },

    { имя: 'чужая категория без очков пошла в счёт места',
      ждём: 'в доме есть: чужая категория без очков в счёт места не идёт',
      файл: 'js/kslt-kategorii.js',
      было: '                                if (o.category_id !== строка.category_id &&\n                                    !(очкиВ[o.id] > 0)) return false;',
      станет: '' },

    { имя: 'причину закрытия перестали показывать',
      ждём: 'в доме есть: метка закрытой категории с причиной',
      файл: 'js/kslt-kategorii.js',
      было: 'closed_reason',
      станет: 'closed_prichina',
      всеВхождения: true },

    { имя: 'число к склонению приписывает зовущий',
      ждём: 'число к склонению добавляет ДОМ',
      файл: 'js/kslt-kategorii.js',
      было: "            return н + ' ' + форма(н, один, немного, много);",
      станет: '            return форма(н, один, немного, много);' },

    { имя: 'экранирование убрано', ждём: 'дом экранирует данные',
      файл: 'js/kslt-kategorii.js',
      было: '        if (global.KSLT_экранировать) return global.KSLT_экранировать(s);',
      станет: '        if (false) return String(s);' },

    { имя: 'кабинет перестал звать дом', ждём: 'кабинет сайта зовёт дом',
      файл: 'js/dashboard.js',
      было: 'KSLT_KATEGORII',
      станет: 'KSLT_ЧУЖОЙ',
      всеВхождения: true },

    { имя: 'профиль приложения перестал звать дом',
      ждём: 'профиль приложения зовёт дом',
      файл: 'mobile/www/js/screens/profile.js',
      было: 'KSLT_KATEGORII',
      станет: 'KSLT_ЧУЖОЙ',
      всеВхождения: true },

    { имя: 'в кабинет вернулось своё чтение разбивки',
      ждём: 'в кабинете нет своего: своё чтение разбивки',
      файл: 'js/dashboard.js',
      было: '        var строки = await KSLT_KATEGORII.строки(client, p);',
      станет: "        var pc = await client.from('player_categories').select('category_id, points, wins, losses');\n        var строки = await KSLT_KATEGORII.строки(client, p);" },

    { имя: 'в кабинет вернулась своя полоса',
      ждём: 'в кабинете нет своего: своя полоса побед',
      файл: 'js/dashboard.js',
      было: '    /* ПОЛОСА ПОБЕД И ПРОЦЕНТ КАТЕГОРИИ',
      станет: '    function catBarHtml(row) { return 1; }\n    /* ПОЛОСА ПОБЕД И ПРОЦЕНТ КАТЕГОРИИ' },

    { имя: 'своё склонение вернулось в кабинет',
      ждём: 'в кабинете нет своего: своё склонение',
      файл: 'js/dashboard.js',
      было: '    /* `plural` УДАЛЁН',
      станет: '    function plural(n, forms) { return n; }\n    /* `plural` УДАЛЁН' },

    { имя: 'краска блока убрана у приложения',
      ждём: 'краска блока есть у приложения',
      файл: 'mobile/www/css/app.css',
      /* РАЗМЕР ТОЧКИ СТАЛ 8 (ступень шкалы вместо 10) — якорь с прежним
         числом встречался ноль раз. Строка взята из файла. */
      было: '.kst-cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }',
      станет: '' },

    { имя: 'мини-сетка приложения снесена',
      ждём: 'у приложения есть мини-сетка',
      файл: 'mobile/www/css/app.css',
      было: '.kst-grid-mini {\n  grid-template-columns: 72px repeat(3, 56px);',
      станет: '.kst-grid-mini-otkl {\n  grid-template-columns: 72px repeat(3, 56px);' },

    { имя: 'дом языка отключён от приложения',
      ждём: 'дом языка подключён в приложение',
      файл: 'mobile/www/index.html',
      было: '<script src="js/kslt-yazyk.js?v=1"></script>\n',
      станет: '' },

    { имя: 'страница грузит разбивку без дома',
      ждём: 'дом подключён во всех разметках',
      файл: 'pages/dashboard.html',
      было: '<script src="../js/kslt-kategorii.js?v=1"></script>',
      станет: '' }
];

function копия() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kat-'));
    for (const отн of ['js', 'css', 'mobile/www', 'pages', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}
function прогон(корень) {
    try {
        return execFileSync('node', [path.join(корень, 'tools/check-kategorii.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: РАЗБИВКА ПО КАТЕГОРИЯМ\n');
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
