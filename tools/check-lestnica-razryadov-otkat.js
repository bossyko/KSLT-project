/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ЛЕСТНИЦЫ РАЗРЯДОВ. На КОПИИ.
 *
 *   node tools/check-lestnica-razryadov-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lestn-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ДОМ = 'js/kslt-rules.js', ОБЗ = 'js/tournaments-overview.js',
      БР = 'js/admin/sections/bracket.js', ИГР = 'js/player.js';
const ФАЙЛЫ = [ДОМ, ОБЗ, БР, ИГР];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-lestnica-razryadov.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. ТРЕТИЙ ЗАШИТЫЙ СПИСОК — копия, которая разойдётся */
    /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, А НЕ НА ОБЩЕЙ СТРОКЕ: `(function() {`
       встречается в `player.js` ДЕСЯТЬ раз, и прувер это сказал. Берём
       первую строку файла — его заголовок. */
    ['завести третий зашитый список разрядов', ИГР,
     "'use strict';",
     "'use strict';\n    var РАЗРЯДЫ = ['promasters', 'masters', 'tour', 'challenger', 'futures'];",
     'зашитых списков разрядов два и оба названы'],

    /* 2. ПЕРЕСТАВИТЬ ПОРЯДОК В ДОМЕ — у посева и рейтинга разный ответ
       на вопрос «какая категория выше» */
    ['переставить порядок разрядов в доме', ДОМ,
     "R.CATEGORY_ORDER = ['promasters', 'masters', 'tour', 'challenger', 'futures'];",
     "R.CATEGORY_ORDER = ['masters', 'promasters', 'tour', 'challenger', 'futures'];",
     'порядок разрядов в доме совпадает с замеренным в базе'],

    /* 3. ВЕРНУТЬ РАЗОШЕДШЕЕСЯ ИМЯ — то самое «Challengers» */
    ['вернуть разошедшееся имя в запасной набор', ОБЗ,
     "{ key: 'challenger', name: 'Challenger' },",
     "{ key: 'challenger', name: 'Challengers' },",
     'имена в запасном наборе совпадают с замеренными в базе'],

    /* 4. ВЕРНУТЬ ВЫБРАСЫВАНИЕ НЕЗНАКОМОГО РАЗРЯДА — беда до 21.10:
       категория из админки не показалась бы на сайте вовсе */
    ['вернуть выбрасывание незнакомого разряда', ДОМ,
     "        return out.concat(хвост);",
     "        return out;",
     'незнакомый разряд из базы не выбрасывается, а встаёт в хвост'],

    /* 5. ЗАВЕСТИ ВТОРОЙ ЗАПРОС К `categories` — шов возвращается */
    ['завести второй запрос к categories в bracket.js', БР,
     "    var _лестницаКэш = null;",
     "    var _лестницаКэш = null;\n    async function своя() { return await A.client.from('categories').select('id'); }",
     'лестница в bracket.js одна: один помощник и один запрос к categories'],

    /* 5б. СНЯТЬ ЗАПАСНОЙ ПУТЬ — пустая лестница молча отправит посев в жребий */
    ['снять запасной путь лестницы', БР,
     "            список = ((window.KSLT_RULES && KSLT_RULES.CATEGORY_ORDER) || []).slice();",
     "            список = [];",
     'запасной путь лестницы назван, а не молчит'],

    /* 5в. ВЕРНУТЬ ЛИТЕРАЛ `'friendly'` — главная цена перевода на базу:
       место из дружеского турнира попало бы в посев */
    ['вернуть литерал friendly вместо дома', БР,
     "        var нерейтинговые = (window.KSLT_RULES && KSLT_RULES.NON_RATING) || ['friendly'];",
     "        var нерейтинговые = ['friendly'];",
     'нерейтинговые отсеивает ДОМ, а не литерал в строке'],

    /* 6. СНЯТЬ ФИЛЬТР ПОЛА — у женщин разрядов три, решение клуба */
    ['снять фильтр пола в доме', ДОМ,
     "            if (allowed.indexOf(id) === -1) return;",
     "            if (false) return;",
     'фильтр пола и нерейтинговых в доме назван, а не спрятан']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правила падают на ЧИСТОМ коде — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const n = исходник[ф].split(что).length - 1;
    if (n !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз в ' + ф);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}
