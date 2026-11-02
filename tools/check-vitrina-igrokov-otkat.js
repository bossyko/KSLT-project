#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «КАРТОЧКИ ИГРОКОВ ЧИТАЮТСЯ ИЗ ВИТРИНЫ» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Витрина и таблица различаются одним хвостом
 * имени, и прибор, который их путает, назвал бы бедой ровно верный код.
 *
 *   node tools/check-vitrina-igrokov-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-vitrina-igrokov.js';
const ИГРОК = 'mobile/www/js/screens/player-detail.js';
const РЕЙТИНГ = 'mobile/www/js/screens/rating.js';
const SQL = 'sql/доступ/players-public-view.sql';

const ОТКАТЫ = [
    { имя: 'страница игрока снова просит звёздочку у таблицы',
      ждём: 'звёздочки у таблицы игроков нет',
      файл: ИГРОК,
      было: "    supabaseClient.from('players_public')\n      .select('*')\n      .eq('id', playerId)",
      станет: "    supabaseClient.from('players')\n      .select('*')\n      .eq('id', playerId)" },

    { имя: 'рейтинг снова читает таблицу напрямую',
      ждём: 'карточки игроков читаются из витрины',
      файл: РЕЙТИНГ,
      было: "    supabaseClient.from('players_public')\n      .select('id', { count: 'exact', head: true })",
      станет: "    supabaseClient.from('players')\n      .select('id', { count: 'exact', head: true })" },

    { имя: 'у исключения стёрта причина',
      ждём: 'у каждого исключения названа причина',
      файл: ПРИБОР,
      было: "        'нужны `banned_until` и `ban_reason` — ими объясняют отказ в записи',",
      станет: "        '',", },

    { имя: 'витрина снята из sql',
      ждём: 'витрина заведена и описана в sql',
      файл: SQL,
      было: 'CREATE VIEW public.players_public',
      станет: 'CREATE VIEW public.players_vitrina' },

    { имя: 'прибор перестал отличать витрину от таблицы',
      ждём: 'прибор отличает таблицу от витрины',
      файл: ПРИБОР,
      было: "    return (безКом(т).match(/from\\(\\s*['\"]players['\"]\\s*\\)/g) || []).length;",
      станет: "    return (безКом(т).match(/from\\(\\s*['\"]players[\\w]*['\"]\\s*\\)/g) || []).length;" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: звёздочка у витрины законна',
      ждём: null,
      файл: РЕЙТИНГ,
      было: "    supabaseClient.from('players_public')\n      .select('id', { count: 'exact', head: true })",
      станет: "    supabaseClient.from('players_public')\n      .select('*')\n      .select('id', { count: 'exact', head: true })" },

    { имя: 'МОЛЧАНИЕ: чтение таблицы в подписи к коду',
      ждём: null,
      файл: РЕЙТИНГ,
      было: "    supabaseClient.from('players_public')\n      .select('id', { count: 'exact', head: true })",
      станет: "    /* прежде здесь стояло from('players').select('*') */\n" +
              "    supabaseClient.from('players_public')\n      .select('id', { count: 'exact', head: true })" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vitrina-'));
    for (const о of ['mobile/www/js', 'tools', 'sql']) {
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

console.log('\n  ПРУВЕР: ВИТРИНА ИГРОКОВ\n');

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
        try {
            execFileSync('node', ['--check', п], { encoding: 'utf8' });
        } catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) {
            console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        } else {
            console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать');
            беда++;
        }
        continue;
    }
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
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');
