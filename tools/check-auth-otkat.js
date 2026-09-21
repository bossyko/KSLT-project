#!/usr/bin/env node
/**
 * Доказательство работоспособности заморозки входа.
 *
 * «У меня всё зелёное» ничего не значит, пока не показано, что проверка
 * умеет краснеть. Прибор берёт КОПИЮ исходников, по очереди возвращает в
 * неё каждый дефект, который правило стережёт, и убеждается, что
 * tools/check-auth.js падает И называет именно это правило.
 *
 * Боевые файлы не трогаются: работа идёт в отдельной папке под
 * tests/reports/, она затирается на каждом прогоне.
 *
 * Запуск: node tools/check-auth-otkat.js   (он же npm run check:auth:otkat)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ПЕСОЧНИЦА = path.join(ROOT, 'tests', 'reports', '_otkat-vhod');

/** [имя правила, файл, что вернуть, на что] */
const ОТКАТЫ = [
['раскладка переключается по высоте экрана, а не по ширине',
 'css/style.css', '@media (max-height: 680px) and (min-width: 600px)', '@media (max-width: 900px)'],

['две колонки включаются только на экране входа',
 'css/style.css', ':has(#signinForm.active)', ''],

['колонки — две обёртки, а не общая сетка строк',
 'css/style.css', '#signinForm > .auth-col-fields', '#signinForm > .auth-field'],

['обёртки колонок есть на всех трёх языках',
 'pages/auth-kg.html', 'class="auth-col-methods"', 'class="auth-social-group"'],

['форма входа раскрывается в ячейки сетки карточки',
 'css/style.css', '    #signinForm.active {\n        display: contents;', '    #signinForm.active {\n        display: flex;'],

['излишек высоты забирает вторая строка, а не обе',
 'css/style.css', 'grid-template-rows: auto 1fr', 'grid-template-rows: auto auto'],

['ячейки не растягиваются на высоту строки',
 'css/style.css', 'align-items: start;', 'align-items: stretch;'],

['Google, Telegram и Apple — одна семья кнопок, 52',
 'css/style.css', '.auth-col-methods .auth-apple-btn {\n    min-height: 52px;', '.auth-col-methods .auth-apple-btn {\n    min-height: 44px;'],

['глаз показа пароля — цель 44x44',
 'css/style.css', '    right: 4px;\n    top: 50%;\n    transform: translateY(-50%);\n    width: 44px;', '    right: 12px;\n    top: 50%;\n    transform: translateY(-50%);\n    width: 28px;'],

['«Забыли пароль?» — цель 44 по высоте',
 'css/style.css', '    align-items: center;\n    min-height: 44px;\n    padding: 0 8px;', '    align-items: center;\n    min-height: 19px;\n    padding: 0 8px;'],

['дорожка вкладок не добавляет своего паддинга',
 'css/style.css', '    border-radius: var(--radius-full);\n    padding: 0;\n    margin-bottom: 32px;', '    border-radius: var(--radius-full);\n    padding: 4px;\n    margin-bottom: 32px;'],

['вкладка ловит палец на 44',
 'css/style.css', '    flex: 1;\n    min-height: 44px;', '    flex: 1;\n    min-height: 36px;'],

['пилюля рисуется внутрь рамки, а не растягивается до 44',
 'css/style.css', 'background-clip: padding-box;', 'background-clip: border-box;'],

['атрибут hidden сильнее display в классе',
 'css/style.css', '[hidden] {\n    display: none !important;\n}', '[hidden] {\n    opacity: 0;\n}'],

['флаг Apple можно переопределить снаружи',
 'js/supabase-config.js', 'window.KSLT_APPLE = window.KSLT_APPLE || false;', 'window.KSLT_APPLE = false;'],

['кнопка Apple появляется только под флагом',
 'js/auth.js', 'if (window.KSLT_APPLE) {', 'if (true) {'],

['в разметке спрятаны и кнопка Apple, и её обёртка',
 'pages/auth.html', 'data-apple-slot hidden', 'data-apple-slot'],

['логотип Apple — слот под официальный файл, а не глиф',
 'pages/auth.html', '<img class="apple-logo" src="../images/apple-logo.svg" alt="" width="16" height="19">', ''],

// Порядок проверяется сравнением позиций в разметке. Откат ломает
// присутствие, а не порядок: поменять два блока местами построчно — это
// уже не «вернуть дефект», а переписать кусок. Правило падает в обоих
// случаях, потому что обе проверки живут в одном условии.
['порядок способов входа Google — Apple — Telegram',
 'pages/auth-kg.html', 'class="auth-apple-btn"', 'class="auth-apple-button"'],

['версия style.css одна на все страницы',
 'pages/auth-en.html', 'style.css?v=', 'style.css?v=9'],

['версия auth.js одна на все страницы',
 'pages/auth-en.html', '/auth.js?v=', '/auth.js?v=9'],

['версия supabase-config.js одна на все страницы',
 'pages/auth-kg.html', 'supabase-config.js?v=', 'supabase-config.js?v=9']
];

function песочницу() {
    fs.rmSync(ПЕСОЧНИЦА, { recursive: true, force: true });
    fs.mkdirSync(ПЕСОЧНИЦА, { recursive: true });
    for (const п of ['css', 'js', 'pages', 'tools']) {
        execFileSync('cp', ['-R', path.join(ROOT, п), ПЕСОЧНИЦА]);
    }
    for (const ф of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
        fs.copyFileSync(path.join(ROOT, ф), path.join(ПЕСОЧНИЦА, ф));
    }
}

function прогнать() {
    try {
        execFileSync('node', [path.join(ПЕСОЧНИЦА, 'tools', 'check-auth.js')],
            { env: Object.assign({}, process.env, { KSLT_ROOT: ПЕСОЧНИЦА }), encoding: 'utf8' });
        return { упала: false, вывод: '' };
    } catch (e) {
        return { упала: true, вывод: String(e.stdout || '') };
    }
}

console.log('');
песочницу();
const чисто = прогнать();
if (чисто.упала) {
    console.log('  ОСТАНОВ  копия исходников уже не проходит проверку — откаты бессмысленны');
    console.log(чисто.вывод);
    process.exit(1);
}
console.log('  ок       копия исходников проходит проверку начисто');
console.log('');

let сошлось = 0;
const провал = [];
for (const [правило, файл, было, стало] of ОТКАТЫ) {
    песочницу();
    const путь = path.join(ПЕСОЧНИЦА, файл);
    const текст = fs.readFileSync(путь, 'utf8');
    if (текст.indexOf(было) === -1) {
        провал.push([правило, 'откат не нашёл, что возвращать: ' + JSON.stringify(было.slice(0, 60))]);
        continue;
    }
    fs.writeFileSync(путь, текст.split(было).join(стало));
    const р = прогнать();
    const назвала = р.вывод.indexOf('НЕ ТАК  ' + правило) !== -1;
    if (р.упала && назвала) { сошлось++; console.log('  ок       ' + правило); }
    else провал.push([правило, р.упала ? 'проверка упала, но НЕ назвала это правило' : 'проверка НЕ УПАЛА — правило не работает']);
}

fs.rmSync(ПЕСОЧНИЦА, { recursive: true, force: true });

console.log('');
for (const [п, почему] of провал) {
    console.log('  НЕ ТАК  ' + п);
    console.log('          ' + почему);
}
console.log('');
console.log('Откат: доказано ' + сошлось + ' из ' + ОТКАТЫ.length + ' правил');
console.log('');
process.exit(провал.length ? 1 : 0);
