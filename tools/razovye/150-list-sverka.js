/**
 * РАЗОВЫЙ ПРИБОР 150 — СВЕРКА ПЕЧАТНОГО ЛИСТА ПРАВИЛО К ПРАВИЛУ.
 *
 * Он не судит и не чинит. Он берёт css листа У ДОМА и css трёх прежних
 * копий ИЗ GIT (HEAD до куска 150) и сравнивает их ПО СЕЛЕКТОРАМ.
 *
 * ЗАЧЕМ. Дом я собирал, набирая правила с экрана, а вывод прибора обрезан
 * по ширине — и три объявления из семнадцати я перенабрал неверно: `body`
 * потерял `font-size`, у `th` граница стала `#333` вместо `#ddd`, у подвала
 * краска `#666` вместо `#888`. Глазами это не видно ни на экране, ни в
 * коде. СОДЕРЖИМОЕ ФАЙЛА НЕ ПЕРЕНАБИРАЕТСЯ ИЗ ВЫВОДА, А СВЕРЯЕТСЯ С
 * ФАЙЛОМ — вот этим прибором.
 *
 *   node tools/razovye/150-list-sverka.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..', '..');
const голова = (ф) => execFileSync('git', ['show', 'HEAD:' + ф],
    { cwd: КОРЕНЬ, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 }).split('\n');

function правила(строки) {
    const из = {};
    строки.forEach(с => {
        const m = /^\s*([^{]+)\{(.*)\}\s*$/.exec(с);
        if (m) из[m[1].trim()] = m[2].trim().replace(/\s+/g, ' ');
    });
    return из;
}
const литералы = (строки) => {
    const из = [];
    строки.forEach(l => {
        const re = /'([^']*)'/g; let m;
        while ((m = re.exec(l)) !== null) из.push(m[1]);
    });
    return из;
};

/* ПРЕЖНИЕ КОПИИ — ИЗ GIT, А НЕ ИЗ ПАМЯТИ. Границы блоков те, что были до
   куска 150; файл в рабочем дереве уже переписан. */
const КОПИИ = {
    users:    ['js/admin/sections/users.js', 1662, 1678],
    vouchers: ['js/admin/sections/vouchers.js', 591, 605],
    finances: ['js/admin/sections/finances.js', 1023, 1037]
};
const было = {};
Object.keys(КОПИИ).forEach(имя => {
    const [ф, a, b] = КОПИИ[имя];
    было[имя] = правила(литералы(голова(ф).slice(a - 1, b)));
});

/* CSS ДОМА: берём блок между `<style>` и `</style>` ВНУТРИ `печатныйЛист`
   и разворачиваем оба положения доводов `плотный` и `разбивка`. */
const домТекст = fs.readFileSync(path.join(КОРЕНЬ, 'js/admin/core/export.js'), 'utf8').split('\n');
const начФ = домТекст.findIndex(l => /function печатныйЛист/.test(l));
const начС = домТекст.findIndex((l, i) => i > начФ && /'<style>'/.test(l));
const конС = домТекст.findIndex((l, i) => i > начС && /'<\/style>'/.test(l));
const блок = домТекст.slice(начС + 1, конС);

function собрать(плотный, сРазбивкой) {
    const из = [];
    блок.forEach(l => {
        let s = '';
        const re = /'([^']*)'|\(о\.плотный \? '([^']*)' : '([^']*)'\)/g;
        let m;
        while ((m = re.exec(l)) !== null) {
            if (m[2] !== undefined || m[3] !== undefined) s += (плотный ? m[2] : m[3]);
            else s += m[1];
        }
        if (!s || s.indexOf('{') === -1) return;
        /* правила разбивки стоят под доводом — отбрасываем, если его нет */
        if (!сРазбивкой && /^\.breakdown/.test(s.trim())) return;
        из.push(s);
    });
    return правила(из);
}

const ЗАКОННЫЕ = {
    /* ЕДИНСТВЕННОЕ ЗАКОННОЕ РАСХОЖДЕНИЕ: мёртвое правило `.no-print` у
       ваучеров не перенесено. Замерено: класс `no-print` не носит ни один
       элемент продукта, живое понятие зовётся `ad-no-print`. */
    vouchers: { '@media print': 'body { padding: 15px; } .no-print { display: none; }' }
};

let плохо = 0;
[['users', true], ['vouchers', false], ['finances', false]].forEach(([имя, плотный]) => {
    const сРазбивкой = имя === 'users';
    const с = собрать(плотный, сРазбивкой), б = было[имя];
    const пропало = Object.keys(б).filter(k => !(k in с));
    const добавилось = Object.keys(с).filter(k => !(k in б));
    const разошлось = Object.keys(б).filter(k => k in с && б[k] !== с[k]);
    const законно = ЗАКОННЫЕ[имя] || {};
    const беды = [];
    пропало.forEach(k => беды.push('пропало правило ' + k));
    добавилось.forEach(k => беды.push('добавилось правило ' + k));
    разошлось.forEach(k => {
        if (законно[k] === б[k]) return;   // названное заранее расхождение
        беды.push('разошлось ' + k + '\n      было:  ' + б[k] + '\n      стало: ' + с[k]);
    });
    console.log('');
    console.log('  ' + (беды.length ? 'НЕ ТАК ' : 'ок     ') + имя +
                ' (дом: ' + (плотный ? 'плотный' : 'обычный') +
                (сРазбивкой ? ' + разбивка' : '') + ') — правил было ' +
                Object.keys(б).length + ', у дома ' + Object.keys(с).length);
    беды.forEach(т => { console.log('          x ' + т); плохо++; });
    Object.keys(законно).forEach(k => {
        if (б[k] !== undefined && с[k] !== б[k])
            console.log('          i ' + k + ' — расхождение названо заранее и законно');
    });
});

console.log('');
console.log(плохо === 0
    ? '  ок      лист дома совпал с тремя прежними копиями правило к правилу\n'
    : '  НЕ ТАК  расхождений: ' + плохо + '\n');
if (плохо) process.exitCode = 1;
