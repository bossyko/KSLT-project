#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ОТМЕНА — СОСТОЯНИЕ» (06.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ: матч турнира со своим `status ===
 * 'cancelled'` (другое понятие с тем же словом) и слова в комментарии.
 *
 *   node tools/check-otmena-battla-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-otmena-battla.js';
const ДОМ = 'js/battle-format.js';
const ДОМ_ПРИЛ = 'mobile/www/js/battle-format.js';
const СПИСОК = 'mobile/www/js/screens/battles.js';
const ГЛАВНАЯ = 'mobile/www/js/screens/home.js';
const САЙТ = 'js/battles-overview.js';
const ФУНКЦИЯ = 'sql/функции/battle-vote-rpc.sql';

const ОТКАТЫ = [
    { имя: 'убрать отмену из дома состояния',
      ждём: 'отмена — состояние в доме',
      файл: ДОМ,
      было: "        if (b.status === 'cancelled') return 'cancelled';",
      станет: '' },

    { имя: 'поставить отмену ПОСЛЕ завершения',
      ждём: 'отмена стоит в доме РАНЬШЕ завершения',
      файл: ДОМ,
      было: "        if (b.status === 'cancelled') return 'cancelled';\n        if (b.status === 'completed') return 'done';",
      станет: "        if (b.status === 'completed') return 'done';\n        if (b.status === 'cancelled') return 'cancelled';" },

    { имя: 'развести дом сайта и дом приложения',
      ждём: 'дом состояния один на два продукта',
      файл: ДОМ_ПРИЛ,
      было: '    BF.isCancelled = function(b) {',
      станет: '    /* копия разошлась */\n    BF.isCancelled = function(b) {' },

    { имя: 'вернуть списку своё сравнение со строкой',
      ждём: 'экраны спрашивают дом',
      файл: СПИСОК,
      /* ЯКОРЬ ВЗЯТ С СОСЕДОМ: сам зов дома встречается в файле ДВАЖДЫ —
         в фильтре вкладок и в карточке. Якорь, встречающийся дважды, не
         доказывает ничего, и прувер честно об этом сказал. */
      было: '      var BF = window.KSLT_BATTLE_FORMAT;\n      var отменён = BF && BF.isCancelled && BF.isCancelled(b);',
      станет: "      var отменён = b.status === 'cancelled';" },

    { имя: 'вернуть главной своё сравнение со строкой',
      ждём: 'главная спрашивает дом',
      файл: ГЛАВНАЯ,
      было: '      if (BFэкран && BFэкран.isCancelled(_battleData)) {',
      станет: "      if (_battleData.status === 'cancelled') {" },

    { имя: 'снять метку отмены с карточки приложения',
      ждём: 'карточка говорит об отмене',
      файл: СПИСОК,
      было: "'<div class=\"battle-badge-cancelled\">' +",
      станет: "'<div class=\"battle-badge-net\">' +" },

    { имя: 'снять запрет голоса из функции базы',
      ждём: 'запрет голоса за отменённый стоит в базе',
      файл: ФУНКЦИЯ,
      было: "    IF v_challenge.status = 'cancelled' THEN\n        RETURN json_build_object('ok', false, 'error', 'cancelled');\n    END IF;",
      станет: '' },

    { имя: 'ослепить прибор: пусть читает комментарии как код',
      ждём: 'прибор не принимает комментарий за код',
      файл: ПРИБОР,
      было: "    return т.replace(/\\/\\*[\\s\\S]*?\\*\\//g, ' ').replace(/(^|[^:])\\/\\/[^\\n]*/g, '$1 ');",
      станет: '    return т;' },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: матч турнира со своим статусом отмены',
      ждём: null,
      файл: ГЛАВНАЯ,
      было: "      if (m.status === 'cancelled') return false;",
      станет: "      if (m.status === 'cancelled') return false;\n      // второй такой же матчевый случай\n      if (m.status === 'cancelled') return false;" },

    { имя: 'МОЛЧАНИЕ: сторожимые слова помянуты в комментарии',
      ждём: null,
      файл: САЙТ,
      было: '    function battleState(b) {',
      станет: "    /* состояние считает дом: status === 'cancelled' там */\n    function battleState(b) {" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-otmena-'));
    for (const о of ['js', 'mobile/www', 'tools', 'sql']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ОТМЕНА — СОСТОЯНИЕ\n');

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
    if (о.файл.endsWith('.js')) {
        try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
        catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        else { console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать'); беда++; }
        continue;
    }
    if (вывод.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (вывод.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) {
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');
