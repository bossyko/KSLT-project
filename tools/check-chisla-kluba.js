#!/usr/bin/env node
/**
 * ЧИСЛА КЛУБА — ОДИН ДОМ. ЗАМОРОЗКА КУСКА 209 (27.10).
 *
 * ЧТО БЫЛО. Числа клуба считает одна функция базы `get_club_stats`, а
 * читали её ТРИ места своими руками, и два уже разошлись:
 *   1. Сайт (`js/stats.js`) брал `d.ranked`, приложение
 *      (`mobile/www/js/screens/home-blocks.js`) — `d.members`. Поля с
 *      таким именем функция НЕ ОТДАЁТ ВОВСЕ: проверено чтением базы,
 *      она отдаёт ranked · users · tournaments · courts · coaches.
 *      На главной приложения стояло **undefined**, и Костя увидел это
 *      глазами раньше любой проверки.
 *      Решение Кости 09.10 — «Членов клуба» → «В рейтинге»: счётчик
 *      членств показывал один, идёт бесплатный период. Сайт перевели
 *      тогда же, приложение забыли на восемнадцать дней.
 *   2. Архив турниров до 2025 года — 300 — был зашит ДВАЖДЫ.
 *
 * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ — И БЕДА РОДИТСЯ РОВНО НА ШВЕ.
 * Это правило уже стояло комментарием в `js/stats.js` после того, как
 * главная показывала 340 турниров, а обзорная 49. Шов просто переехал
 * на границу сайта и приложения.
 *
 * Запуск: node tools/check-chisla-kluba.js
 */

const fs = require('fs');
const path = require('path');

const КОРЕНЬ = process.env.KSLT_KOREN
    ? path.resolve(process.env.KSLT_KOREN)
    : path.join(__dirname, '..');

let упало = 0, держится = 0;

function чит(отн) {
    const п = path.join(КОРЕНЬ, отн);
    return fs.existsSync(п) ? fs.readFileSync(п, 'utf8') : '';
}
function правило(имя, условие, объяснение) {
    if (условие) { держится++; return; }
    упало++;
    console.log('  ✗ ' + имя);
    console.log('    ' + объяснение.split('\n').join('\n    '));
}

const дом = чит('js/kslt-chisla-kluba.js');
const домКопия = чит('mobile/www/js/kslt-chisla-kluba.js');

/* ── 1. ДОМ ЕСТЬ И ОТДАЁТ ОБА ПОНЯТИЯ ── */
правило(
    'дом чисел клуба объявлен',
    /window\.KSLT_CHISLA_KLUBA\s*=/.test(дом) &&
    /Д\.турнировВсего\s*=/.test(дом) && /Д\.прочитать\s*=/.test(дом) &&
    /Д\.АРХИВ_ТУРНИРОВ\s*=/.test(дом),
    'Дом обязан отдавать `АРХИВ_ТУРНИРОВ`, `турнировВсего` и `прочитать`\n' +
    'через `window.KSLT_CHISLA_KLUBA`.');

правило(
    'копия дома в приложении совпадает до байта',
    дом.length > 0 && дом === домКопия,
    'Файл общий: `js/kslt-chisla-kluba.js` и его копия в\n' +
    '`mobile/www/js/` обязаны совпадать знак в знак. Разошлись — значит\n' +
    'понятие снова определено дважды.');

/* ── 2. НИКТО НЕ ЧИТАЕТ ФУНКЦИЮ БАЗЫ МИМО ДОМА ── */
(function мимоДома() {
    const иголка = 'get_club' + '_stats';
    const папки = ['js', 'mobile/www/js'];
    const мимо = [];
    const обойти = function (дир) {
        const п = path.join(КОРЕНЬ, дир);
        if (!fs.existsSync(п)) return;
        for (const э of fs.readdirSync(п, { withFileTypes: true })) {
            const отн = dirJoin(дир, э.name);
            if (э.isDirectory()) { обойти(отн); continue; }
            if (!э.name.endsWith('.js')) continue;
            if (э.name === 'kslt-chisla-kluba.js') continue;   /* сам дом */
            const т = чит(отн);
            if (new RegExp("rpc\\(\\s*'" + иголка + "'").test(т)) мимо.push(отн);
        }
    };
    function dirJoin(a, b) { return a + '/' + b; }
    обойти('js'); обойти('mobile/www/js');
    правило(
        'функцию базы зовёт только дом',
        мимо.length === 0,
        'Числа клуба читаются ТОЛЬКО через `KSLT_CHISLA_KLUBA.прочитать`.\n' +
        'Свой `rpc` мимо дома — это второе определение, и ровно на нём\n' +
        'сайт и приложение разошлись полями.\n' +
        'Зовут мимо дома: ' + мимо.join(', '));
})();

/* ── 3. ЧИСЛО АРХИВА ЖИВЁТ В ОДНОМ МЕСТЕ ── */
(function архив() {
    const зашито = [];
    [['js/stats.js'], ['js/tournaments-overview.js'],
     ['mobile/www/js/screens/home-blocks.js']].forEach(function (п) {
        const т = чит(п[0]).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        if (/\b300\b/.test(т)) зашито.push(п[0]);
    });
    правило(
        'число архива турниров не зашито у зовущих',
        зашито.length === 0,
        'Архив клуба до 2025 года — одно число, и живёт оно в доме.\n' +
        'Было зашито и в `js/stats.js`, и своим `var ARCHIVE = 300` в\n' +
        'приложении: совпадали, пока их не тронули.\n' +
        'Зашито у: ' + зашито.join(', '));
})();

/* ── 4. ПОЛЕ, КОТОРОГО БАЗА НЕ ОТДАЁТ, НИКТО НЕ ПРОСИТ ── */
/* Признак берёт ЗОВ, а не упоминание: имя поля стоит и в объяснении
   внутри файла — правило ловило чужой комментарий. */
function безСлов(отн) {
    return чит(отн).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
правило(
    'никто не читает поле «members»',
    !/\bd\.members\b/.test(безСлов('mobile/www/js/screens/home-blocks.js')) &&
    !/\bd\.members\b/.test(безСлов('js/stats.js')),
    'Функция базы отдаёт `ranked`, а не `members` — проверено чтением\n' +
    'базы. Главная приложения показывала `undefined` вместо числа.');

правило(
    'подпись «В рейтинге» заведена на трёх языках',
    (function () {
        const м = чит('mobile/www/js/i18n.js')
            .match(/'home\.stRanked':\s*\{([^}]*)\}/);
        return !!м && /ru:/.test(м[1]) && /en:/.test(м[1]) && /kg:/.test(м[1]);
    })(),
    'Вместе с полем сменилась и подпись: «Членов клуба» → «В рейтинге»\n' +
    '(слово Кости 09.10). Ключ обязан быть на трёх языках сразу.');

правило(
    'старый ключ «Членов клуба» снят',
    !/stMembers/.test(чит('mobile/www/js/i18n.js')) &&
    !/stMembers/.test(чит('mobile/www/js/screens/home-blocks.js')),
    'Ключ `home.stMembers` обязан исчезнуть целиком: оставленный, он\n' +
    'переживёт правку и однажды вернётся в разметку.');

/* ── 5. ДОМ ПОДКЛЮЧЁН РАНЬШЕ ЗОВУЩИХ ── */
(function podklyuchen() {
    const беды = [];
    const обойти = function (дир) {
        const п = path.join(КОРЕНЬ, дир);
        if (!fs.existsSync(п)) return;
        for (const э of fs.readdirSync(п, { withFileTypes: true })) {
            const отн = дир === '.' ? э.name : дир + '/' + э.name;
            if (э.isDirectory()) {
                if (/node_modules|backups|\.git/.test(э.name)) continue;
                обойти(отн);
                continue;
            }
            if (!э.name.endsWith('.html')) continue;
            const т = чит(отн);
            const зов = т.search(/<script src="(?:\.\.\/)*js\/(?:stats|tournaments-overview)\.js\?v=\d+"/);
            if (зов < 0) continue;
            const д = т.search(/<script src="(?:\.\.\/)*js\/kslt-chisla-kluba\.js/);
            if (д < 0) беды.push(отн + ' — дома нет');
            else if (д > зов) беды.push(отн + ' — дом позже зовущего');
        }
    };
    обойти('.');
    правило(
        'дом подключён раньше тех, кто его зовёт',
        беды.length === 0,
        'Страница, которая зовёт числа, обязана подключить дом ВЫШЕ.\n' +
        'Иначе зовущий получит пустое имя и промолчит.\n' + беды.slice(0, 6).join('\n'));
})();

console.log('');
if (упало) {
    console.log('  БЕДА    правил упало: ' + упало + ', держится: ' + держится + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      числа клуба: все ' + держится + ' правил держатся');
    console.log('          одна функция базы, один дом, одно число архива\n');
}
