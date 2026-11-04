#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПРИЛОЖЕНИЕ САМОДОСТАТОЧНО» (04.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-prilozhenie-samo-sebe-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-prilozhenie-samo-sebe.js';
const СТР = 'mobile/www/index.html';
const ШРИФТЫ = 'mobile/www/css/fonts.css';
const РЕЙТИНГ = 'mobile/www/js/screens/rating.js';

const ОТКАТЫ = [
    { имя: 'supabase снова грузится с unpkg',
      ждём: 'страница приложения не тянет чужой код и оформление',
      файл: СТР,
      было: '<script src="js/vendor/supabase.js?v=1"></script>',
      станет: '<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>' },

    { имя: 'шрифт снова с Google Fonts',
      ждём: 'страница приложения не тянет чужой код и оформление',
      файл: СТР,
      было: '<link rel="stylesheet" href="css/fonts.css?v=1">',
      станет: '<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">' },

    { имя: 'подключение дома базы без версии',
      ждём: 'у подключения дома базы есть версия',
      файл: СТР,
      было: 'js/vendor/supabase.js?v=1',
      станет: 'js/vendor/supabase.js' },

    { имя: 'дом базы подключён ПОСЛЕ своего конфига',
      ждём: 'дом базы подключён раньше своего конфига',
      файл: СТР,
      было: '<script src="js/vendor/supabase.js?v=1"></script>\n',
      станет: '' },

    /* ОТКАТ СНОСИТ ОБЪЯВЛЕНИЕ ЦЕЛИКОМ, А НЕ ПОДМЕНЯЕТ АДРЕС ВНУТРИ НЕГО.
       Первая попытка меняла только `src` — `@font-face` оставался на
       месте, счёт восемнадцати сходился, и правило молчало. ПРАВИЛО,
       СЧИТАЮЩЕЕ ОБЪЯВЛЕНИЯ, ЛОМАЕТСЯ СНЯТИЕМ ОБЪЯВЛЕНИЯ, А НЕ ПРАВКОЙ
       ЕГО НУТРА. */
    { имя: 'один вес шрифта выкинут ради веса сборки',
      ждём: 'объявлены все веса всех трёх наборов',
      файл: ШРИФТЫ,
      было: "@font-face {\n    font-family: 'Inter';\n    font-style: normal;\n" +
             "    font-weight: 900;\n    font-display: swap;\n" +
             "    src: url('../fonts/inter-cyrillic-ext-900-normal.woff2') format('woff2');",
      станет: "@font-face-ВЫКИНУТ {\n    font-family: 'Inter';\n    font-style: normal;\n" +
             "    font-weight: 900;\n    font-display: swap;\n" +
             "    src: url('../fonts/inter-cyrillic-ext-900-normal.woff2') format('woff2');" },

    { имя: 'кыргызский набор потерял свои буквы',
      ждём: 'шрифт покрывает знак Ң на каждом весе',
      файл: ШРИФТЫ,
      было: "url('../fonts/inter-cyrillic-ext-400-normal.woff2') format('woff2');\n    unicode-range: U+460-479, U+480-48F, U+492-49D, U+4A0-4AF, U+4B2-4FF, U+52F, U+20B4, U+2DFF, U+A69F;",
      станет: "url('../fonts/inter-cyrillic-ext-400-normal.woff2') format('woff2');\n    unicode-range: U+20B4, U+2DFF, U+A69F;" },

    { имя: 'объявлен файл шрифта, которого нет на диске',
      ждём: 'каждый объявленный файл шрифта лежит на диске',
      файл: ШРИФТЫ,
      было: "url('../fonts/inter-latin-400-normal.woff2')",
      станет: "url('../fonts/inter-latin-350-normal.woff2')" },

    { имя: 'наборы снова перекрываются: латиница в кириллице',
      ждём: 'наборы шрифта не перекрываются',
      файл: ШРИФТЫ,
      было: "url('../fonts/inter-cyrillic-400-normal.woff2') format('woff2');\n    unicode-range: U+400-45F, U+490-491, U+4B0-4B1, U+2116;",
      станет: "url('../fonts/inter-cyrillic-400-normal.woff2') format('woff2');\n    unicode-range: U+41, U+400-45F, U+490-491, U+4B0-4B1, U+2116;" },

    { имя: 'подиум снова идёт за картинкой на чужой сервер',
      ждём: 'картинки не берутся с чужих серверов',
      файл: РЕЙТИНГ,
      было: "      var фото = p.photo",
      станет: "      var заглушка = 'https://placehold.co/60x60';\n      var фото = p.photo" },

    /* ── ОТКАТ НА МОЛЧАНИЕ ──
       Ссылка, по которой человек нажимает сам, — это содержимое, а не
       часть приложения. Правило её трогать не должно, иначе телеграм
       клуба и видео матча станут «нарушением». */
    { имя: 'МОЛЧАНИЕ: добавлена ссылка на чужой сайт, по которой жмут сами',
      ждём: null,
      файл: СТР,
      было: '<a class="menu-item" href="https://t.me/kslt_admin" target="_blank">',
      станет: '<a class="menu-item" href="https://instagram.com/kslt" target="_blank">\n        <a class="menu-item" href="https://t.me/kslt_admin" target="_blank">' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-samo-'));
    fs.cpSync(path.join(КОРЕНЬ, 'tools'), path.join(к, 'tools'), { recursive: true });
    fs.mkdirSync(path.join(к, 'mobile'), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, 'mobile/www'), path.join(к, 'mobile/www'), { recursive: true });
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПРИЛОЖЕНИЕ САМОДОСТАТОЧНО\n');

{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n');
        console.log(вывод);
        process.exit(1);
    }
    console.log('  база    исходный код правил проходит\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия();
    const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        беда++;
        fs.rmSync(к, { recursive: true, force: true });
        continue;
    }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    if (о.файл.endsWith('.js')) {
        try {
            execFileSync('node', ['--check', п], { encoding: 'utf8' });
        } catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) {
            console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        } else {
            console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать');
            беда++;
        }
        continue;
    }
    if (вывод.indexOf('НЕ ТАК') === -1) {
        console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    } else if (вывод.indexOf(о.ждём) === -1) {
        console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»');
        беда++;
    } else {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    }
}

console.log('');
if (беда) {
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');
