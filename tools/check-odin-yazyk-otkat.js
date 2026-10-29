#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ «ОДИН ЯЗЫК» (29.10).
 *
 * Берёт КОПИЮ, возвращает прежнее значение и требует, чтобы упало ИМЕННО
 * то правило, которое за это отвечает.
 *
 * Запуск: node tools/check-odin-yazyk-otkat.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'выключатель снесён',
      ждём: 'выключатель объявлен в доме языка',
      файл: 'mobile/www/js/i18n.js',
      было: "  I18N.ОДИН_ЯЗЫК = 'ru';",
      станет: "  I18N.ОДИН_ЯЗЫК = null;" },

    { имя: 'язык снова берётся прямо из памяти',
      ждём: 'язык берётся через выключатель, а не прямо из памяти',
      файл: 'mobile/www/js/i18n.js',
      было: "  var _lang = I18N.ОДИН_ЯЗЫК || localStorage.getItem('kslt_lang') || 'ru';",
      станет: "  var _lang = localStorage.getItem('kslt_lang') || 'ru';" },

    { имя: 'setLang снова применяет язык',
      ждём: 'setLang не применяет язык, пока заперто',
      файл: 'mobile/www/js/i18n.js',
      было: "    if (I18N.ОДИН_ЯЗЫК) return;",
      станет: "" },

    { имя: 'чужой выбор стирается вместо запоминания',
      ждём: 'выбор человека ЗАПОМИНАЕТСЯ, а не стирается',
      файл: 'mobile/www/js/i18n.js',
      было: "    localStorage.setItem('kslt_lang', lang);\n    if (I18N.ОДИН_ЯЗЫК) return;",
      станет: "    if (I18N.ОДИН_ЯЗЫК) return;\n    localStorage.setItem('kslt_lang', lang);" },

    { имя: 'ряд языка вернули в боковое меню',
      ждём: 'переключателя языка в рабочей разметке нет',
      файл: 'mobile/www/index.html',
      было: '      <div class="menu-footer">',
      станет: '      <div class="seg-control" id="menuLangControl">\n' +
              '        <button class="seg-btn active" data-lang="ru">РУ</button>\n' +
              '      </div>\n      <div class="menu-footer">' },

    { имя: 'ряд языка в профиле рисуется всегда',
      ждём: 'ряд языка в профиле не рисуется, пока заперто',
      файл: 'mobile/www/js/screens/profile.js',
      было: "    if (!I18N.ОДИН_ЯЗЫК) {",
      станет: "    if (true) {" },

    { имя: 'заодно убрали и тему',
      ждём: 'тему не задели',
      файл: 'mobile/www/index.html',
      было: 'data-theme=',
      станет: 'data-tema-ubrana=',
      всеВхождения: true },

    { имя: 'словарь выброшен',
      ждём: 'словарь на месте: ключей не меньше 700',
      файл: 'mobile/www/js/i18n.js',
      было: "ru: '",
      станет: "rus: '",
      всеВхождения: true },

    { имя: 'версия i18n опущена',
      ждём: 'версия i18n поднята',
      файл: 'mobile/www/index.html',
      было: 'js/i18n.js?v=11',
      станет: 'js/i18n.js?v=10' }
];

function копияДерева() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-yazyk-'));
    for (const отн of ['mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}

function прогон(корень) {
    try {
        return execFileSync('node', [path.join(корень, 'tools/check-odin-yazyk.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
}

console.log('\n  ПРУВЕР: ОДИН ЯЗЫК\n');

let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копияДерева();
    const п = path.join(корень, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;

    if (сколько === 0 || (!о.всеВхождения && сколько !== 1)) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        console.log('    Якорь: ' + JSON.stringify(о.было.slice(0, 70)));
        беда++;
        fs.rmSync(корень, { recursive: true, force: true });
        continue;
    }

    fs.writeFileSync(п, о.всеВхождения
        ? было.split(о.было).join(о.станет)
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
