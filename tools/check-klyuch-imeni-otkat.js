#!/usr/bin/env node
/**
 * Доказательство работоспособности пробы ключа имени.
 *
 * «У меня зелёное» ничего не значит, пока не показано, что проба умеет
 * краснеть. Прибор берёт КОПИЮ исходников, по очереди возвращает в неё
 * каждый дефект, который правило стережёт, и требует, чтобы
 * tools/check-klyuch-imeni.js упал И назвал именно это правило.
 *
 * Запуск: node tools/check-klyuch-imeni-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛ = 'supabase/functions/ensure-player-card/index.ts';
const ПРИБОР = 'tools/check-klyuch-imeni.js';

/* ПЕСОЧНИЦА ВНЕ ПРОЕКТА: копия в дереве попала бы под чужие приборы,
   которые ходят по файлам, и они нашли бы в ней вторую копию кода. */
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-klyuch-'));
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
fs.mkdirSync(path.join(песок, path.dirname(ФАЙЛ)), { recursive: true });
fs.copyFileSync(path.join(КОРЕНЬ, ПРИБОР), path.join(песок, ПРИБОР));
const исходник = fs.readFileSync(path.join(КОРЕНЬ, ФАЙЛ), 'utf8');

function прогон(текст) {
    fs.writeFileSync(path.join(песок, ФАЙЛ), текст);
    try {
        execFileSync(process.execPath, [path.join(песок, ПРИБОР)],
            { env: Object.assign({}, process.env, { KSLT_ROOT: песок }), encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/** [что ломаем, как ломаем, какое правило обязано упасть] */
const ОТКАТЫ = [
    ['вернуть ключу прежнюю слепоту к kh и j',
     т => т.replace(/  т = т\.replace\(\/shch\/g[\s\S]*?т = т\.replace\(\/ts\/g, 'c'\)\.replace\(\/tz\/g, 'c'\)[^\n]*\n/,
                    ''),
     'одно имя в разных написаниях даёт один ключ'],

    ['схлопнуть ключ до неразличимости',
     т => т.replace("т = т.replace(/y/g, 'i')",
                    "т = т.replace(/y/g, 'i'); т = т.replace(/[bcdfghjklmnpqrstvwxz]/g, 's')"),
     'разные люди не получают один ключ'],

    ['снять сортировку слов',
     т => т.replace(".split('-').filter(Boolean).sort().join('-')",
                    ".split('-').filter(Boolean).join('-')"),
     'ключ не зависит от порядка слов и регистра'],

    ['переименовать функцию ключа',
     т => т.replace('function ключ(имя: string): string {', 'function ключИмени(имя: string): string {'),
     'обе части ключа имени нашлись в продукте']
];

console.log('');
const чисто = прогон(исходник);
if (чисто.упало) {
    console.log('  ОСТАНОВ  копия исходников уже не проходит пробу — откаты бессмысленны');
    console.log(чисто.вывод);
    process.exit(1);
}
console.log('  база    исходный код пробу проходит\n');

let сошлось = 0;
const провал = [];
for (const [имя, ломать, ждём] of ОТКАТЫ) {
    const испорчен = ломать(исходник);
    if (испорчен === исходник) {
        провал.push(имя + ' — якорь не нашёлся, НИЧЕГО не сломано');
        console.log('  x ' + имя + '  ->  якорь не нашёлся');
        continue;
    }
    const р = прогон(испорчен);
    if (р.упало && р.вывод.indexOf(ждём) >= 0) {
        сошлось++;
        console.log('  v ' + имя + '  ->  «' + ждём + '»');
    } else {
        провал.push(имя + ' — правило не упало');
        console.log('  x ' + имя + '  ->  правило НЕ упало');
    }
}
fs.writeFileSync(path.join(песок, ФАЙЛ), исходник);
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (провал.length) { console.log('  НЕ ТАК  ' + провал.length + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + сошлось + ' отката доказали свои правила\n');
