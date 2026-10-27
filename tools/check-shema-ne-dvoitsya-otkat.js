/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СХЕМЫ ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-shema-ne-dvoitsya-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['sql/схема/zerno-zhrebiya.sql',
                'sql/схема/news-reactions-poll-votes.sql',
                'sql/схема/entity-payments-migration.sql',
                'sql/схема/entity-payments-add-club.sql',
                'js/admin/sections/bracket.js',
                'js/bracket-draw.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const З = 'sql/схема/zerno-zhrebiya.sql', Р = 'sql/схема/news-reactions-poll-votes.sql',
      П = 'sql/схема/entity-payments-migration.sql', Д = 'sql/схема/entity-payments-add-club.sql',
      Б = 'js/admin/sections/bracket.js';

const ОТКАТЫ = [

/* ГЛАВНЫЙ ОТКАТ: ровно то, что нашлось замером — один столбец двумя
   типами, и какой выйдет, зависит от порядка применения файлов. */
['вернуть зерну жребия второй тип', З,
 'ADD COLUMN IF NOT EXISTS draw_seed integer;',
 'ADD COLUMN IF NOT EXISTS draw_seed bigint;',
 'один столбец — один тип во всех файлах схемы'],

/* СОЗДАТЕЛЬ ОТСТАЁТ — беда, НЕ ВИДНАЯ НА БОЕВОЙ: она вылезает на чистой
   базе, где создатель отрабатывает первым. */
['вернуть создателю реакций список из трёх значений', Р,
 "    reaction_type TEXT NOT NULL CHECK (reaction_type IN\n" +
 "        ('tennis', 'fire', 'clap', 'star', 'heart', 'like', 'trophy', 'muscle', 'target', 'wow')),",
 "    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('tennis', 'fire', 'clap')),",
 'файл, создающий таблицу, не отстаёт от расширения списка'],

/* РАСХОЖДЕНИЕ БЕЗ СНЯТИЯ ПРЕЖНЕГО. Поздний файл перестаёт снимать старое
   ограничение — и в базе остаётся то, которое успело лечь первым.
   СПИСОК В ОТКАТЕ КОРОЧЕ СОЗДАТЕЛЯ НАМЕРЕННО: иначе упало бы заодно
   правило «создатель не отстаёт», и откат доказывал бы не то, что
   обещает. */
['отнять у расширения снятие прежнего CHECK', Д,
 "ALTER TABLE entity_payments\n  DROP CONSTRAINT IF EXISTS entity_payments_entity_type_check;\n" +
 "\nALTER TABLE entity_payments\n  ADD CONSTRAINT entity_payments_entity_type_check\n" +
 "  CHECK (entity_type IN ('court', 'coach', 'player', 'club'));",
 "ALTER TABLE entity_payments\n  ADD CONSTRAINT entity_payments_entity_type_check\n" +
 "  CHECK (entity_type IN ('court', 'coach'));",
 'расходящихся списков CHECK без снятия прежнего нет'],

/* ЧИСЛО В СХЕМЕ И ЧИСЛО В КОДЕ — ОДНО ПОНЯТИЕ. Поднимут диапазон в коде,
   не тронув тип, — повторяемость жребия поедет молча. */
['поднять диапазон зерна в коде мимо типа', Б,
 'Math.random() * 2147483000',
 'Math.random() * 9007199254740000',
 'тип зерна жребия сходится с диапазоном, который пишет код']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-shema-'));
['sql', 'js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-shema-ne-dvoitsya.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят правило.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].split(что).join(на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
