#!/usr/bin/env node
/** ПРУВЕР К ЗАМОРОЗКЕ «ЛИГИ СТОЯТ С ПЕРВОГО ДНЯ» (04.11). */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-ligi-s-pervogo-dnya.js';
const СЕТКА = 'js/admin/sections/bracket.js';
const ГЕН = 'js/tournament-generator.js';

const ОТКАТЫ = [
    { имя: 'лиги снова собираются своим ходом',
      ждём: 'свой ход лиг убран из продукта', файл: СЕТКА,
      было: "            await создатьПустыеЛиги(tournament, groupCount, grpMatches);",
      станет: "            var пл = buildLeagueSEBracket(tournament, plQualified, 'PL', 1);\n            void пл;" },

    { имя: 'ветка сборки не знает про лиги',
      ждём: 'лиги собираются там же, где плей-офф', файл: СЕТКА,
      было: "            if (своёИмя === 'group_league') {\n                await создатьПустыеЛиги(tournament, tournament.group_count || 2,\n                    matches.filter(isGroupMatch));\n            } else {",
      станет: "            if (false) {\n            } else {" },

    { имя: 'размер группы берётся из настроек, а не из матчей',
      ждём: 'размер группы считается по людям в матчах', файл: СЕТКА,
      было: "            размерГруппы[г - 1] = Object.keys(люди).length;",
      станет: "            размерГруппы[г - 1] = (tournament.qualifiers_per_group || 2) + 2;" },

    { имя: 'расклад ставит метки на несуществующие места',
      ждём: 'расклад пропускает места, которых в группе нет', файл: СЕТКА,
      было: "                if (размерГруппы && м > (размерГруппы[г] || 0)) continue;",
      станет: "                if (false) continue;" },

    { имя: 'утешительная начинается с первого места',
      ждём: 'утешительная берёт места сразу под проходными', файл: СЕТКА,
      было: "            { префикс: 'CL', от: qualifiers + 1, до: максМест }",
      станет: "            { префикс: 'CL', от: 1, до: максМест }" },

    { имя: 'лигам включили доп. матчи',
      ждём: 'лигам доп. матчи не разыгрываются', файл: СЕТКА,
      было: "                безДопМатчей: true",
      станет: "                безДопМатчей: false" },

    { имя: 'выключатель доп. матчей обезврежен',
      ждём: 'выключатель доп. матчей действует', файл: СЕТКА,
      было: "        var формат = опции.безДопМатчей ? 'direct' : tournament.playoff_format;",
      станет: "        var формат = tournament.playoff_format;" },

    { имя: 'в клетки лиг кладутся игроки вместо меток',
      ждём: 'метки кладутся в слоты, а не игроки', файл: СЕТКА,
      было: "                    slot1_label: лев ? лев.метка : null,",
      станет: "                    slot1_label: null," },

    { имя: 'серпантин по рейтингу сломан',
      ждём: 'игроки раскладываются по группам по рейтингу', файл: ГЕН,
      было: "        var gi = (row % 2 === 0)\n            ? (idx % groupCount)\n            : (groupCount - 1 - (idx % groupCount));",
      станет: "        var gi = idx % groupCount;" },

    /* ── ОТКАТ НА МОЛЧАНИЕ ── подпись это не код. */
    { имя: 'МОЛЧАНИЕ: подпись к сборке лиг переписана',
      ждём: null, файл: СЕТКА,
      было: "     * Пустые сетки ОБЕИХ ЛИГ — сразу после жеребьёвки групп (04.11).",
      станет: "     * Сборка лиг. Что-то про сетки." }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lig-'));
    fs.cpSync(path.join(КОРЕНЬ, 'tools'), path.join(к, 'tools'), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(к, 'js'), { recursive: true });
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ЛИГИ С ПЕРВОГО ДНЯ\n');
{
    const к = копия(); const в = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (в.indexOf('НЕ ТАК') !== -1) { console.log('  ОСТАНОВ  копия уже не проходит\n' + в); process.exit(1); }
    console.log('  база    исходный код правил проходит\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия(); const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const n = было.split(о.было).length - 1;
    if (n !== 1) { console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + n + ' РАЗ'); беда++; fs.rmSync(к, {recursive:true,force:true}); continue; }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
    catch (e) { console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС'); беда++; fs.rmSync(к,{recursive:true,force:true}); continue; }
    const в = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (о.ждём === null) {
        if (в.indexOf('НЕ ТАК') === -1) console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        else { console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать'); беда++; }
        continue;
    }
    if (в.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (в.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) { console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');
