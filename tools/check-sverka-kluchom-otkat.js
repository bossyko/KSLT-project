/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА СВЕРКИ КЛЮЧОМ (кусок 190). На КОПИИ.
 *   node tools/check-sverka-kluchom-otkat.js
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО
 * то правило, которое за него отвечает. Четыре отката возвращают ровно те
 * формы, что стояли в коде до 27.10.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sverka-'));
['supabase', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const MN = 'supabase/functions/match-notify/index.ts',
      NF = 'supabase/functions/news-fetch/index.ts',
      SP = 'supabase/functions/send-push/index.ts',
      AU = 'supabase/functions/auto-unban/index.ts';
const ФАЙЛЫ = [MN, NF, SP, AU];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правка) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            правка && правка[0] === ф ? исходник[ф].replace(правка[1], правка[2]) : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-sverka-kluchom.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть вхождение в match-notify (как было до 27.10)',
     [MN, "    const isServiceRole = (serviceKey !== '' &&\n            (authHeader === 'Bearer ' + serviceKey || authHeader === serviceKey))",
          "    const isServiceRole = authHeader.includes(serviceKey)"],
     'доступ нигде не сверяется вхождением'],

    ['вернуть половинчатую защиту в news-fetch (как было до 27.10)',
     [NF, "  if (!(serviceKey !== '' &&\n          (authHeader === 'Bearer ' + serviceKey || authHeader === serviceKey))) {",
          "  if (!serviceKey || !authHeader.includes(serviceKey)) {"],
     'доступ нигде не сверяется вхождением'],

    /* Равенство остаётся, но отказ на пустом ключе снимается: падает
       ровно правило про пустой ключ, а не про вхождение. */
    ['снять отказ на пустом ключе в send-push',
     [SP, "    const isInternal = (serviceKey !== '' &&\n            (authHeader === 'Bearer ' + serviceKey || authHeader === serviceKey))",
          "    const isInternal = (authHeader === 'Bearer ' + serviceKey || authHeader === serviceKey)"],
     'пустой ключ никого не пускает'],

    /* Форма меняется на свою, но остаётся строгой: падает правило про
       ЕДИНЫЙ ВИД, а не про безопасность. */
    ['развести формы: своя строгая сверка в send-push',
     [SP, "    const isInternal = (serviceKey !== '' &&\n            (authHeader === 'Bearer ' + serviceKey || authHeader === serviceKey))",
          "    const isInternal = (serviceKey !== '' && authHeader === 'Bearer ' + serviceKey)"],
     'сверка служебного ключа везде одной формы'],

    ['сверять пароль расписания вхождением в auto-unban',
     [AU, "if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {",
          "if (!cronSecret || !authHeader.includes(cronSecret)) {"],
     'пароль расписания сверяется полной строкой, а не вхождением']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, правка, ждём]) => {
    const n = исходник[правка[0]].split(правка[1]).length - 1;
    if (n !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз'); плохих++; return; }
    const р = прогон(правка);
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
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
