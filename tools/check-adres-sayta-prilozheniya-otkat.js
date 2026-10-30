#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ АДРЕСА САЙТА (шаг A3.4, 29.10).
 *
 * Берёт КОПИЮ файлов, возвращает прежнее значение и требует, чтобы упало
 * ИМЕННО то правило, которое за это отвечает. «У меня зелёное» ничего не
 * доказывает: правило, потерявшее место, не падает — оно молчит, и это
 * хуже падения.
 *
 * Запуск: node tools/check-adres-sayta-prilozheniya-otkat.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'дом адреса снесён',
      ждём: 'дом адреса заведён',
      файл: 'mobile/www/js/supabase-config.js',
      было: 'window.KSLT_SAYT = window.KSLT_SAYT || {',
      станет: 'window.KSLT_SAYT_OTKLYUCHEN = {' },

    { имя: 'у дома отняли подпись',
      ждём: 'у дома есть и адрес, и подпись',
      файл: 'mobile/www/js/supabase-config.js',
      было: "    подпись: 'kslt.netlify.app'",
      станет: "    хвост: 'kslt.netlify.app'" },

    { имя: 'третий адрес вписан в дом',
      ждём: 'в доме адрес написан ровно 2 раза',
      файл: 'mobile/www/js/supabase-config.js',
      было: "    адрес:   'https://kslt.netlify.app',",
      станет: "    адрес:   'https://kslt.netlify.app',\n    запас:   'https://kslt.netlify.app'," },

    { имя: 'мёртвая настройка возвращена',
      ждём: 'мёртвой настройки KSLT_SITE_URL не осталось',
      файл: 'mobile/www/js/screens/home-blocks.js',
      было: "img = window.KSLT_SAYT.адрес + '/'",
      станет: "img = (window.KSLT_SITE_URL || window.KSLT_SAYT.адрес) + '/'" },

    /* ОТКАТ «ВЕРСИЯ ФАЙЛА ОПУЩЕНА» СНЯТ ВМЕСТЕ СО СВОИМ ПРАВИЛОМ
       (30.10): правило было порогом с запасом, а якорь — номером
       версии, то есть якорем на ПОЛОЖЕНИИ. Понятие переехало к
       `check-versii-fajlov`, и правило переехало за ним. */
];

function копияДерева() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-adres-'));
    for (const отн of ['mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}

function прогон(корень) {
    try {
        return execFileSync('node',
            [path.join(корень, 'tools/check-adres-sayta-prilozheniya.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
}

console.log('\n  ПРУВЕР: АДРЕС САЙТА В ПРИЛОЖЕНИИ\n');

let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копияДерева();
    const п = path.join(корень, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;

    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        console.log('    Якорь: ' + JSON.stringify(о.было));
        беда++;
        fs.rmSync(корень, { recursive: true, force: true });
        continue;
    }

    fs.writeFileSync(п, было.replace(о.было, о.станет));
    const вывод = прогон(корень);
    const упалоНужное = вывод.includes('✗ ' + о.ждём);

    if (упалоНужное) {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    } else {
        console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        console.log('      значит сторож смотрит не туда');
        беда++;
    }
    fs.rmSync(корень, { recursive: true, force: true });
}

console.log('');
if (беда) {
    console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');
}
