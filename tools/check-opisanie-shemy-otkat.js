#!/usr/bin/env node
/**
 * Доказательство работоспособности правил описания схемы.
 *
 * Запуск: node tools/check-opisanie-shemy-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-opisanie-shemy.js';
const СЛЕПОК = 'supabase/migrations/20260210000000_baseline.sql';
const СНИМОК = 'sql/схема/schema-snapshot.sql';
const ЧУЖОЙ = 'tools/check-vyzov.js';

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-shema-'));
['tools', 'supabase/migrations', 'sql/схема'].forEach(д =>
    fs.mkdirSync(path.join(песок, д), { recursive: true }));
/* В песочницу едут ВСЕ приборы: правило «ни один прибор не читает
   слепок» считает их по папке, и с одним файлом оно считало бы один. */
fs.readdirSync(path.join(КОРЕНЬ, 'tools')).filter(ф => ф.endsWith('.js'))
    .forEach(ф => fs.copyFileSync(path.join(КОРЕНЬ, 'tools', ф), path.join(песок, 'tools', ф)));

const исходник = {};
[СНИМОК, ЧУЖОЙ].forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

/* Слепка в дереве больше нет: откат на него не правит файл, а СОЗДАЁТ
   его заново — именно это правило и стережёт. */
function прогон(файл, текст) {
    [СНИМОК, ЧУЖОЙ].forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), ф === файл ? текст : исходник[ф]);
    });
    const путьСлепка = path.join(песок, СЛЕПОК);
    if (файл === СЛЕПОК) fs.writeFileSync(путьСлепка, текст);
    else if (fs.existsSync(путьСлепка)) fs.rmSync(путьСлепка);
    try {
        execFileSync(process.execPath, [path.join(песок, ПРИБОР)],
            { env: Object.assign({}, process.env, { KSLT_ROOT: песок }), encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть слепок в дерево', СЛЕПОК,
     () => '-- CREATE TABLE public.vernulsya (id text);\n',
     'описание схемы ровно одно — слепок удалён и не вернулся'],

    ['вернуть снимок к состоянию до августовских таблиц', СНИМОК,
     т => т.split('player_link_requests').join('tablica_kotoroy_net'),
     'снимок знает таблицы, заведённые после слепка'],

    ['вернуть прибору чтение слепка', ЧУЖОЙ,
     т => т.replace("const БАЗА = 'sql/схема/schema-snapshot.sql';",
                    "const БАЗА = 'supabase/migrations/20260210000000_baseline.sql';"),
     'ни один прибор не читает слепок как описание схемы'],

    ['сделать снимок исполняемым', СНИМОК,
     т => "CREATE TABLE public.vzjalos_otkuda_to (id text);\n" + т,
     'снимок остался чтением, а не скриптом']
];

console.log('');
const чисто = прогон(null, null);
if (чисто.упало) {
    console.log('  ОСТАНОВ  копия исходников уже не проходит проверку');
    console.log(чисто.вывод);
    process.exit(1);
}
console.log('  база    исходный код проверку проходит\n');

let сошлось = 0;
const провал = [];
for (const [имя, файл, ломать, ждём] of ОТКАТЫ) {
    const испорчен = ломать(исходник[файл] || '');
    if (файл !== СЛЕПОК && испорчен === исходник[файл]) {
        провал.push(имя + ' — якорь не нашёлся');
        console.log('  x ' + имя + '  ->  якорь не нашёлся');
        continue;
    }
    const р = прогон(файл, испорчен);
    if (р.упало && р.вывод.indexOf(ждём) >= 0) {
        сошлось++;
        console.log('  v ' + имя + '  ->  «' + ждём + '»');
    } else {
        провал.push(имя + ' — правило не упало');
        console.log('  x ' + имя + '  ->  правило НЕ упало');
    }
}
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (провал.length) { console.log('  НЕ ТАК  ' + провал.length + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + сошлось + ' отката доказали свои правила\n');
