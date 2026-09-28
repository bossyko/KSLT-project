/**
 * ЗАМОРОЗКА СТАТУСА ТУРНИРА — одно определение на одно понятие.
 *
 * Решение Кости 28.09. Лестница состояний:
 *   Скоро → Рег. открыта → Рег. закрыта → Идёт → Завершён, плюс Отменён.
 *
 * До этого одно и то же состояние называлось в коде «Скоро»,
 * «Скоро открытие» и «Предстоящий», а вычисление статуса лежало четырьмя
 * одинаковыми копиями. Дубликат ловит проверка, а не память: правила ниже
 * падают, как только заведётся вторая карта подписей или вторая копия
 * вычисления.
 *
 *   node tools/check-status.js
 */
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');
const чит = ф => fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
const безКом = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

const ИСТОЧНИК = чит('js/tournament-status.js');
const ИСТч = безКом(ИСТОЧНИК);

/* Все файлы, которые рисуют или считают статус турнира */
const ПОТРЕБИТЕЛИ = [
    'js/tournaments-overview.js',
    'js/tournaments-overlay.js',
    'js/tournament-detail.js',
    'js/admin/core/constants.js'
];

const ошибки = [];
let ВСЕГО = 0;
const правило = (имя, условие, подсказка) => {
    ВСЕГО++;
    if (!условие) ошибки.push({ имя, подсказка });
};

/* ══ 1. ИСТОЧНИК ОДИН ═══════════════════════════════════════════════════ */

правило('источник статусов существует и объявляет KSLT_STATUS',
    /window\.KSLT_STATUS\s*=/.test(ИСТч),
    'js/tournament-status.js должен класть KSLT_STATUS в window');

правило('в источнике ровно шесть состояний, столько же, сколько в базе',
    (ИСТч.match(/ПОРЯДОК\s*=\s*\[([^\]]+)\]/) || [, ''])[1]
        .split(',').filter(x => x.trim()).length === 6,
    'состояний шесть: upcoming, registration_open, registration_closed, ongoing, completed, cancelled');

['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled']
    .forEach(с => правило('состояние ' + с + ' названо на всех трёх языках',
        (ИСТч.match(new RegExp('\\b' + с + ":\\s*'[^']+'", 'g')) || []).length === 3,
        'ровно три непустые подписи: ru, en, kg'));

/* ══ 2. СЛОВА КОСТИ ═════════════════════════════════════════════════════ */

const РУС = {
    upcoming: 'Скоро',
    registration_open: 'Рег. открыта',
    registration_closed: 'Рег. закрыта',
    ongoing: 'Идёт',
    completed: 'Завершён',
    cancelled: 'Отменён'
};
Object.keys(РУС).forEach(с => правило('по-русски ' + с + ' — «' + РУС[с] + '»',
    ИСТч.includes(с + ": '" + РУС[с] + "'"),
    'слова названы Костей 28.09, менять только его словом'));

правило('ряд регистрации читается как ряд: открыта и закрыта сокращены одинаково',
    ИСТч.includes("registration_open: 'Рег. открыта'") &&
    ИСТч.includes("registration_closed: 'Рег. закрыта'"),
    'пара «открыта / закрыта» едет одной границей');

/* ══ 3. ВТОРОЙ КАРТЫ ПОДПИСЕЙ НЕТ ═══════════════════════════════════════ */

ПОТРЕБИТЕЛИ.forEach(ф => {
    const s = безКом(чит(ф));
    /* Карта ПОДПИСЕЙ — человеческие слова: пробел, заглавная или кириллица.
       Карта КЛАССОВ («open», «past») — другое понятие, у каждого компонента
       свой словарь имён, и сводить их — отдельная работа. Записано. */
    const подписьВидна = /registration_open:\s*'[^']*(?:[ A-ZА-ЯЁа-яё])[^']*'/;
    правило(ф + ' берёт подписи у источника, а не держит свою карту',
        !подписьВидна.test(s),
        'карта подписей живёт только в js/tournament-status.js');
    правило(ф + ' не держит своей копии вычисления статуса',
        !/now\s*<\s*regStart/.test(s) && !/сегодня\s*<\s*regStart/.test(s),
        'вычисление живёт только в js/tournament-status.js');
    правило(ф + ' зовёт KSLT_STATUS',
        /KSLT_STATUS/.test(s),
        'иначе файл отвязался от источника и разойдётся с ним');
});

/* ══ 4. ФАЙЛ ПОДКЛЮЧЁН РАНЬШЕ ТЕХ, КТО ЕГО ЗОВЁТ ════════════════════════ */

const СТРАНИЦЫ = [
    'pages/tournaments.html', 'pages/tournaments-en.html', 'pages/tournaments-kg.html',
    'pages/tournament.html', 'pages/tournament-en.html', 'pages/tournament-kg.html',
    'pages/tournaments-overview.html', 'pages/tournaments-overview-en.html', 'pages/tournaments-overview-kg.html',
    'pages/admin.html'
];
СТРАНИЦЫ.forEach(п => {
    const h = чит(п);
    const свой = h.indexOf('tournament-status.js');
    правило(п + ' подключает источник статусов', свой !== -1,
        'без него KSLT_STATUS не существует и страница падает');
    ['tournaments-overview.js', 'tournaments-overlay.js', 'tournament-detail.js', 'admin/core/constants.js']
        .forEach(потр => {
            const где = h.indexOf(потр);
            if (где === -1 || свой === -1) return;
            правило(п + ': источник стоит раньше ' + потр, свой < где,
                'KSLT_STATUS читается на загрузке файла, порядок строк решает');
        });
});

/* ══ ВЫВОД ═════════════════════════════════════════════════════════════ */

if (ошибки.length) {
    console.log('\n  упало ' + ошибки.length + ' из ' + ВСЕГО + ':\n');
    ошибки.forEach(о => console.log('  ✗ ' + о.имя + '\n      ' + о.подсказка));
    process.exit(1);
}
console.log('  ок статус турнира: ' + ВСЕГО + ' правил');
