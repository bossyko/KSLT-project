/**
 * АДРЕС САЙТА — ОДНО ОПРЕДЕЛЕНИЕ (ветка D, пункт 82, 17.10).
 *
 * ЗАМЕР. `https://kslt.netlify.app` был вписан руками в 27 живых местах, и
 * число РОСЛО: 25 в замере 03.10, 27 к 17.10. Три из них — генерация
 * QR-ваучера (`dashboard.js`, `courts.js`, `coaches.js`), одиннадцать —
 * серверные функции в письмах и телеграме, остальное по мелочи.
 *
 * ЧЕМ ЭТО ОПАСНО. При переезде на свой домен каждое место надо найти
 * руками, а пропущенное МОЛЧИТ: ссылка ведёт на старый адрес и работает,
 * пока старый домен жив. Беда всплывёт у человека с ваучером в руках.
 *
 * ЧТО ЗАМОРОЖЕНО — ОТНОШЕНИЕ, А НЕ ЧИСЛО:
 *   • в браузере адрес берётся у браузера (`window.KSLT_SAYT`,
 *     `js/supabase-config.js`) — на каком домене открыли, туда и ведёт;
 *   • на сервере адрес берётся из окружения
 *     (`Deno.env.get('SITE_URL') || ...`), образец — `send-email/index.ts`;
 *   • зашитая строка допустима ТОЛЬКО как запасное значение В ТОЙ ЖЕ
 *     строке, где читается окружение. Везде ещё — правило падает.
 *
 *   node tools/check-adres-sayta.js
 */
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');
const АДРЕС = 'kslt.netlify.app';
const ошибки = [];
function правило(имя, держится, подсказка) {
    if (!держится) ошибки.push({ имя, подсказка });
}

/* ЧИТАЕМ ПРОДУКТ, А НЕ СБОРКИ: `mobile/android/app/build` — выход
   сборщика, он повторяет `mobile/www` и чинится пересборкой. */
const ФАЙЛЫ = [];
(function обойти(д) {
    fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
        const п = д + '/' + э.name;
        if (э.isDirectory()) {
            if (/node_modules|\.git|dist|test-results|tests|^build$/.test(э.name)) return;
            if (п.indexOf('mobile/android/app/build') !== -1) return;
            обойти(п);
        } else if (/\.(js|ts|html)$/.test(э.name)) ФАЙЛЫ.push(п.replace(/^\.\//, ''));
    });
})('.');

/* ЗАПАСНОЕ ЗНАЧЕНИЕ — это адрес В ОДНОЙ СТРОКЕ с чтением настройки.
   Так он виден рядом с тем, что его перекрывает, и не живёт сам по себе. */
function запасное(строка) {
    return /Deno\.env\.get\(\s*['"]SITE_URL['"]\s*\)/.test(строка) ||
           /window\.KSLT_SITE_URL/.test(строка) ||
           /KSLT_SAYT/.test(строка);
}

/* ЧИТАЕМ КОД, А НЕ ПОЯСНЕНИЯ. Первая редакция упала на СОБСТВЕННОМ
   комментарии в `js/supabase-config.js`, где адрес назван как пример
   того, чего больше нет. Вчера на том же споткнулось правило «каждая
   переменная объявлена»: ПРАВИЛО, СЧИТАЮЩЕЕ ТЕКСТ ПОЯСНЕНИЙ КОДОМ,
   ЛОВИТ СЛОВА, А НЕ БЕДУ. Строки сохраняем на месте, чтобы номер в
   отчёте оставался верным. */
function безКом(т) {
    return т
        .replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/[^\n]*/g, (м, п) => п + ' '.repeat(м.length - п.length))
        .replace(/<!--[\s\S]*?-->/g, м => м.replace(/[^\n]/g, ' '));
}

const зашитые = [];
ФАЙЛЫ.forEach(ф => {
    /* Сам сторож и его прувер говорят об адресе — это их работа */
    if (/^tools\/check-adres-sayta/.test(ф)) return;
    const т = безКом(fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'));
    if (т.indexOf(АДРЕС) === -1) return;
    т.split('\n').forEach((стр, i) => {
        if (стр.indexOf(АДРЕС) === -1) return;
        if (запасное(стр)) return;
        зашитые.push(ф + ':' + (i + 1));
    });
});

/* ИЗВЕСТНЫЕ ОСТАТКИ. Прувер чужого куска хранит адрес как ТЕКСТ отката —
   он ничего не красит и ничего не ведёт. */
const ИЗВЕСТНЫЕ = зашитые.filter(м => /^tools\/check-tablo-vaucher-otkat\.js/.test(м));
const живые = зашитые.filter(м => ИЗВЕСТНЫЕ.indexOf(м) === -1);

правило('адрес сайта нигде не зашит строкой',
    живые.length === 0,
    'Зашитый `' + АДРЕС + '` в ' + живые.length + ' местах:\n' +
    живые.slice(0, 10).join('\n') + '\n' +
    'В браузере адрес берётся у браузера (`window.KSLT_SAYT`), на сервере —\n' +
    'из окружения (`Deno.env.get(\'SITE_URL\')`). Зашитая строка допустима\n' +
    'только как запасное значение В ТОЙ ЖЕ строке, где читается настройка.');

правило('дом адреса объявлен и отдаёт адрес браузера',
    /window\.KSLT_SAYT\s*=/.test(fs.readFileSync(path.join(КОРЕНЬ, 'js/supabase-config.js'), 'utf8')) &&
    /window\.location\.origin/.test(fs.readFileSync(path.join(КОРЕНЬ, 'js/supabase-config.js'), 'utf8')),
    'В `js/supabase-config.js` пропал `window.KSLT_SAYT` или он перестал\n' +
    'брать адрес у браузера. Без него каждое место начнёт вписывать свой.');

/* ТРИ ГЕНЕРАТОРА ВАУЧЕРА ЗОВУТ ДОМ, А НЕ ПОВТОРЯЮТ АДРЕС */
['js/dashboard.js', 'js/courts.js', 'js/coaches.js'].forEach(ф => {
    const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
    правило('ваучер в `' + ф.replace('js/', '') + '` берёт адрес из дома',
        /KSLT_SAYT\.адрес/.test(т) && /KSLT_SAYT\.подпись/.test(т),
        'В `' + ф + '` ссылка QR или подпись на картинке перестала брать\n' +
        'адрес из `window.KSLT_SAYT`. Ваучер — картинка в телефоне у\n' +
        'человека: неверный адрес в ней не исправить задним числом.');
});

if (!ошибки.length) {
    console.log('');
    console.log('  ок      адрес сайта: ' + (3 + 2) + ' правил');
    console.log('          дом — window.KSLT_SAYT (js/supabase-config.js), адрес у браузера');
    console.log('          на сервере — Deno.env.get(\'SITE_URL\'), 11 функций');
    console.log('          зашитых строк в продукте: 0 (в пруверах чужих кусков ' + ИЗВЕСТНЫЕ.length + ')');
    console.log('');
    process.exit(0);
}
console.log('');
console.log('  НЕ ТАК  адрес сайта — ' + ошибки.length + ' правил не держится');
console.log('');
ошибки.forEach(е => {
    console.log('          ✗ ' + е.имя);
    console.log('            ' + е.подсказка.replace(/\n\s*/g, '\n            '));
    console.log('');
});
process.exit(1);
