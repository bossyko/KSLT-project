#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ВИТРИНА ИГРОКОВ ЧИТАЕТСЯ ГОСТЕМ» (06.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ПЕРВЫЙ ОТКАТ — ТА САМАЯ ПОЛОМКА 04.11: признак `zakryt` снова читает
 * закрытый столбец. Если прибор на нём молчит, он не стережёт ничего.
 *
 *   node tools/check-vitrina-prava-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-vitrina-prava.js';
const ЖИВОЙ = 'sql/доступ/vitrina-zakryt-cherez-funkciyu-06nov.sql';
const СТАРЫЙ = 'sql/доступ/players-public-zakryt-04nov.sql';

const ОТКАТЫ = [
    { имя: 'признак снова читает закрытый столбец (поломка 04.11)',
      ждём: 'в теле витрины нет столбцов, закрытых для гостя',
      файл: ЖИВОЙ,
      было: '       public.igrok_zakryt(p.id) AS zakryt\n  FROM public.players p;',
      станет: '       (p.banned_until IS NOT NULL AND p.banned_until > now()) AS zakryt\n  FROM public.players p;' },

    { имя: 'витрина снова ходит в profiles сама',
      ждём: 'витрина не ходит в profiles напрямую',
      файл: ЖИВОЙ,
      было: '       public.igrok_zakryt(p.id) AS zakryt\n  FROM public.players p;',
      станет: '       EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.player_id = p.id) AS zakryt\n  FROM public.players p;' },

    { имя: 'признак «закрыт» пропал из витрины вовсе',
      ждём: 'признак «закрыт» считает функция',
      файл: ЖИВОЙ,
      было: '       public.igrok_zakryt(p.id) AS zakryt\n  FROM public.players p;',
      станет: '       false AS zakryt\n  FROM public.players p;' },

    { имя: 'с функции снято SECURITY DEFINER',
      ждём: 'функция объявлена как SECURITY DEFINER с прибитым search_path',
      файл: ЖИВОЙ,
      было: 'STABLE\nSECURITY DEFINER\nSET search_path = public, pg_temp',
      станет: 'STABLE\nSET search_path = public, pg_temp' },

    { имя: 'у функции прибитый search_path убран',
      ждём: 'функция объявлена как SECURITY DEFINER с прибитым search_path',
      файл: ЖИВОЙ,
      было: 'STABLE\nSECURITY DEFINER\nSET search_path = public, pg_temp',
      станет: 'STABLE\nSECURITY DEFINER' },

    { имя: 'право вызова оставлено всем подряд',
      ждём: 'право вызова выдано поимённо, а не всем',
      файл: ЖИВОЙ,
      было: 'REVOKE ALL ON FUNCTION public.igrok_zakryt(text) FROM PUBLIC;\n',
      станет: '' },

    { имя: 'проверка перестала смотреть глазами гостя',
      ждём: 'проверка файла смотрит глазами гостя',
      файл: ЖИВОЙ,
      было: 'SET LOCAL ROLE anon;',
      станет: '-- SET LOCAL ROLE anon;' },

    { имя: 'со старого определения снята пометка «устарело»',
      ждём: 'действующее определение витрины одно',
      файл: СТАРЫЙ,
      было: '-- ОПРЕДЕЛЕНИЕ УСТАРЕЛО, И ИМЕННО ОНО ЗАКРЫЛО ГОСТЮ ВИТРИНУ.',
      станет: '-- Старое определение витрины.' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-prava-'));
    for (const о of ['tools', 'sql']) {
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

console.log('\n  ПРУВЕР: ВИТРИНА ИГРОКОВ И ПРАВА ГОСТЯ\n');

{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n');
        console.log(вывод);
        process.exit(1);
    }
    console.log('  база    исходные файлы правил проходят\n');
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
if (беда) { console.log('  ИТОГ  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали своё правило\n'); process.exit(1); }
console.log('  ИТОГ  все ' + ОТКАТЫ.length + ' откатов уронили ровно своё правило\n');
