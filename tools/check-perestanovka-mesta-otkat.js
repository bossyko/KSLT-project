#!/usr/bin/env node
/** ПРУВЕР К ЗАМОРОЗКЕ «ПЕРЕСТАНОВКА МЕСТА» (04.11). */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-perestanovka-mesta.js';
const СЕТКА = 'js/admin/sections/bracket.js';
const СЛОВА = 'js/admin/core/constants.js';
const ОДЕЖДА = 'css/admin.css';

const ОТКАТЫ = [
    { имя: 'выпадашки остаются живыми во время пересборки',
      ждём: 'выпадашки запираются на время пересборки', файл: СЕТКА,
      было: "                выпадашкиГруппы.forEach(function(в) { в.disabled = true; });",
      станет: "                void выпадашкиГруппы;" },

    { имя: 'запирается одна выпадашка вместо всей группы',
      ждём: 'запирается вся группа, а не одна выпадашка', файл: СЕТКА,
      было: "                var выпадашкиГруппы = container.querySelectorAll(\n                    '.ad-grp-place-select[data-group=\"' + window.KSLT_селектор(groupNum) + '\"]');",
      станет: "                var выпадашкиГруппы = [sel];" },

    { имя: 'работа перестала быть видна глазами',
      ждём: 'работа видна глазами', файл: СЕТКА,
      было: "                    таблицаГруппы.classList.add('ad-grp-busy');",
      станет: "                    void таблицаГруппы;" },

    { имя: 'одежда признака убрана из css',
      ждём: 'работа видна глазами', файл: ОДЕЖДА,
      было: ".ad-grp-busy {\n    opacity: 0.55;",
      станет: ".ad-grp-byloBusy {\n    opacity: 0.55;" },

    { имя: 'диктору о работе не сообщают',
      ждём: 'работа видна диктору', файл: СЕТКА,
      было: "                    таблицаГруппы.setAttribute('aria-busy', 'true');",
      станет: "                    void таблицаГруппы;" },

    { имя: 'на отказе группа остаётся запертой',
      ждём: 'запертое отпускается на удачном пути', файл: СЕТКА,
      было: "                    отпустить();\n                    A.showToast(error.message, 'error');",
      станет: "                    A.showToast(error.message, 'error');" },

    { имя: 'отпускание забыло снять приглушение',
      ждём: 'отпускание снимает всё, что надело', файл: СЕТКА,
      было: "                        таблицаГруппы.classList.remove('ad-grp-busy');",
      станет: "                        void таблицаГруппы;" },

    { имя: 'спрос причины вернулся',
      ждём: 'причина больше не спрашивается', файл: СЕТКА,
      было: "                var mgp = JSON.parse(JSON.stringify(tournament.manual_group_places || {}));",
      станет: "                var причина = (window.prompt(L.groupPlaceWhy) || '').trim();\n                void причина;\n                var mgp = JSON.parse(JSON.stringify(tournament.manual_group_places || {}));" },

    { имя: 'след перестановки перестал писаться',
      ждём: 'след перестановки пишется всегда', файл: СЕТКА,
      было: "                    mgp.__журнал.push({",
      станет: "                    if (false) mgp.__журнал.push({" },

    { имя: 'след потерял напарника',
      ждём: 'в следе названы обе стороны перестановки', файл: СЕТКА,
      было: "                        напарник: напарники[0] || '',",
      станет: "                        напарниkk: напарники[0] || ''," },

    /* ── ОТКАТ НА МОЛЧАНИЕ ── подпись это не код. */
    { имя: 'МОЛЧАНИЕ: подпись к отмене причины переписана',
      ждём: null, файл: СЕТКА,
      было: "                /* ПРИЧИНУ БОЛЬШЕ НЕ СПРАШИВАЕМ — СЛОВО КОСТИ 04.11:",
      станет: "                /* Причину не спрашиваем. Так решили." }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-per-'));
    fs.cpSync(path.join(КОРЕНЬ, 'tools'), path.join(к, 'tools'), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(к, 'js'), { recursive: true });
    fs.mkdirSync(path.join(к, 'css'), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, 'css/admin.css'), path.join(к, 'css/admin.css'));
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПЕРЕСТАНОВКА МЕСТА\n');
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
    if (n !== 1) { console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + n + ' РАЗ'); беда++; fs.rmSync(к,{recursive:true,force:true}); continue; }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    if (о.файл.endsWith('.js')) {
        try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
        catch (e) { console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС'); беда++; fs.rmSync(к,{recursive:true,force:true}); continue; }
    }
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
