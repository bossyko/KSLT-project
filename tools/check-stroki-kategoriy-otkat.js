#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «СТРОКИ КАТЕГОРИЙ В КАБИНЕТЕ» (30.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Зелёный сторож
 * без такого доказательства не значит ничего.
 *
 *   node tools/check-stroki-kategoriy-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const КАБИНЕТ = 'js/dashboard.js';
const СТРАНИЦА = 'js/player.js';

const ОТКАТЫ = [
    { имя: 'боковая колонка снова читает категории сама',
      ждём: 'кабинет читает категории игрока ровно одним местом',
      файл: КАБИНЕТ,
      было: "        var myCats = await строкиКатегорий(client,\n            { id: profile.player_id, gender: player.gender });",
      станет: "        var myCats = ((await client.from('player_categories')\n            .select('category_id, points, closed_at')\n            .eq('player_id', profile.player_id)).data || []);" },

    { имя: 'карточка профиля перестала звать общее определение',
      ждём: 'это место называется строкиКатегорий и его зовут оба экрана',
      файл: КАБИНЕТ,
      было: "                var мои = await строкиКатегорий(client,\n                    { id: profile.player_id, gender: игрок.data.gender });",
      станет: '                var мои = [];' },

    { имя: 'правило про friendly повторено вторым местом',
      ждём: '`friendly` выбрасывается в кабинете одним местом',
      файл: КАБИНЕТ,
      /* ОТКАТ ПЕРЕЕХАЛ ВСЛЕД ЗА ПОНЯТИЕМ (08.11). Он целился в фильтр с
         голым литералом; куском «Open Friendly» 07.11 признак стал
         спрашиваться у дома, литерал остался ЗАПАСНЫМ путём, и якорь
         исчез. Вторая копия заводится тем же приёмом, но по живому коду. */
      было: "        var мои = (pcRes.data || []).filter(function(r) {\n            return window.KSLT_RULES ? window.KSLT_RULES.рейтинговая(r.category_id)\n                                     : r.category_id !== 'friendly';\n        });",
      станет: "        var мои = (pcRes.data || []).filter(function(r) {\n            return window.KSLT_RULES ? window.KSLT_RULES.рейтинговая(r.category_id)\n                                     : r.category_id !== 'friendly';\n        }).filter(function(r) {\n            return r.category_id !== 'friendly';\n        });" },

    { имя: 'справочник снова читается одним русским именем',
      ждём: 'справочник категорий кабинет читает со всеми тремя именами',
      файл: КАБИНЕТ,
      /* В запросе прибавилось `is_rating` — тем же куском «Open Friendly»:
         признак рейтинговости стал свойством данных. */
      было: "        var спр = await client.from('categories').select('id, name, name_en, name_kg, is_rating');",
      станет: "        var спр = await client.from('categories').select('id, name');" },

    { имя: 'имя берётся мимо языка',
      ждём: 'имя категории выбирается по языку, а не берётся первым попавшимся',
      файл: КАБИНЕТ,
      было: "            имена[c.id] = KSLT_YAZYK.выбрать(c.name_en || c.name,\n                                             c.name_kg || c.name, c.name);",
      станет: '            имена[c.id] = c.name;' },

    { имя: 'страница игрока сузила справочник до русского имени',
      ждём: 'страница игрока читает справочник так же — по трём именам',
      файл: СТРАНИЦА,
      было: "select('id, name, name_en, name_kg, sort_order')",
      станет: "select('id, name, sort_order')" },

    { имя: 'место стало считаться на месте, а не домом',
      ждём: 'место в категории кабинет не считает сам',
      файл: КАБИНЕТ,
      было: "            var ступень = window.KSLT_RULES && KSLT_RULES.местоВКатегории\n                ? await KSLT_RULES.местоВКатегории(client, р.category_id,\n                                                   р.points, игрок.gender)\n                : null;",
      станет: "            var ступень = ((await client.from('player_categories')\n                .select('player_id').eq('category_id', р.category_id)\n                .gt('points', р.points || 0)).data || []).length + 1;" },

    { имя: 'пол снова спрашивается отдельным запросом',
      ждём: 'пол игрока боковая колонка берёт тем же запросом, а не отдельным',
      файл: КАБИНЕТ,
      было: "            .select('points, category_id, ntrp_singles, ntrp_doubles, gender')",
      станет: "            .select('points, category_id, ntrp_singles, ntrp_doubles')\n        ;var полИгрока = await client.from('players').select('gender')" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-katstroki-'));
    for (const о of ['js', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-stroki-kategoriy.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: СТРОКИ КАТЕГОРИЙ В КАБИНЕТЕ\n');

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
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

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
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
console.log('          оригиналы не трогались — работа шла на копии\n');
