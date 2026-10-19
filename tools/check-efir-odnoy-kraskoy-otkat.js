/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ЭФИР ОДНОЙ КРАСКОЙ» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Правило запрещает не краску, а краску В РОЛИ, и откат, вернувший
 * `#ef4444` туда, где тот законен — в отсчёт, — «пройдёт», ничего не
 * доказав. Поэтому два отката ЖДУТ МОЛЧАНИЯ.
 *
 *   node tools/check-efir-odnoy-kraskoy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'css/tournament-detail.css', 'css/tournaments-overview.css',
               'css/tournaments.css', 'css/battles-overview.css', 'css/tokens.css',
               /* АДМИНКА, 18.10: роль эфира живёт и в ней. Без файла в этом
                  списке откат падал с ошибкой «исходник не определён» —
                  прувер не мог даже дотянуться до нового места. */
               'css/admin.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const S = 'css/style.css', TD = 'css/tournament-detail.css', TO = 'css/tournaments-overview.css',
      T2 = 'css/tournaments.css', BO = 'css/battles-overview.css', T = 'css/tokens.css',
      AD = 'css/admin.css';

const ОТКАТЫ = [

/* АДМИНКА, 18.10: роль эфира в ней красилась ОРАНЖЕВЫМ, и шестнадцать
   селекторов публичной части этого не видели. Откат возвращает оранжевый
   в сетку и в расписание — правило обязано упасть на обоих. */
['вернуть оранжевый живому матчу в сетке админки', AD,
 '.ad-brk-match.live {\n    border-color: var(--danger);\n    box-shadow: 0 0 8px var(--danger-border);',
 '.ad-brk-match.live {\n    border-color: var(--warning);\n    box-shadow: 0 0 8px var(--warning-border);',
 'эфир говорит одной краской'],

['вернуть оранжевый строке расписания админки', AD,
 '.ad-sched-row-live td {\n    background: var(--danger-faint);',
 '.ad-sched-row-live td {\n    background: var(--warning-faint);',
 'эфир говорит одной краской'],

['вернуть #FF3B30 точке в шапке', S,
 '.live-dot {\n    width: 8px;\n    height: 8px;\n    background: var(--danger);',
 '.live-dot {\n    width: 8px;\n    height: 8px;\n    background: #FF3B30;',
 'эфир говорит одной краской'],

['вернуть #ef4444 значку матча в эфире', TD,
 '.td-status-pill.live {\n    background: var(--danger-subtle);\n    color: var(--danger);',
 '.td-status-pill.live {\n    background: rgba(239, 68, 68, 0.12);\n    color: #ef4444;',
 'эфир говорит одной краской'],

['вернуть зелёную точку значку «идёт сейчас»', TO,
 '    background: var(--danger-on);\n    z-index: 1;',
 '    background: #4ade80;\n    z-index: 1;',
 'эфир говорит одной краской'],

['вернуть градиент значку «идёт сейчас»', T2,
 '    background: var(--danger);\n    border-color: transparent;',
 '    background: linear-gradient(135deg, rgba(255,71,87,0.9), rgba(255,71,87,0.95));\n    border-color: transparent;',
 'значок «идёт сейчас» плоский и с тёмным текстом'],

['вернуть белый текст значку «идёт сейчас»', TO,
 '    background: var(--danger);\n    border-color: transparent;\n    color: var(--danger-on);',
 '    background: var(--danger);\n    border-color: transparent;\n    color: var(--neutral-white);',
 'значок «идёт сейчас» плоский и с тёмным текстом'],

['покрасить ГОЛОСОВАНИЕ как эфир', BO,
 '.bo-strip-live {\n    background: var(--alpha-lime-12);\n    color: var(--accent);',
 '.bo-strip-live {\n    background: var(--danger-subtle);\n    color: var(--danger);',
 '«голосование» осталось лаймовым, а не стало тревогой'],

['убрать ступень 400 у красного', T,
 '  --red-400:    #FF707C;\n',
 '',
 'у красного есть ступень 400, и hover берёт её'],

['увести hover с соседней ступени на ручное число', T,
 '  --danger-hover:   var(--red-400);',
 '  --danger-hover:   #FF6961;',
 'у красного есть ступень 400, и hover берёт её'],

/* ── МОЛЧАНИЕ ── */
['та же краска в ОТСЧЁТЕ — правило МОЛЧИТ', T2,
 '.to-cd-urgent {',
 '.to-cd-urgent-ПРОБА { background: #ef4444; color: #ff3b30; }\n.to-cd-urgent {',
 null],

['зелёный в ПОБЕДЕ — правило МОЛЧИТ', S,
 '.pg-form .w',
 '.pg-form .w-ПРОБА { background: #4ade80; }\n.pg-form .w',
 null]

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-efir-'));
['css', 'tools'].forEach(д => {
    const от = path.join(КОРЕНЬ, д), до = path.join(песок, д);
    if (fs.existsSync(от)) fs.cpSync(от, до, { recursive: true });
});

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф),
                замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-efir-odnoy-kraskoy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-efir-odnoy-kraskoy.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    if (исходник[ф].indexOf(что) === -1) {
        console.log('  ? ' + имя); console.log('      якоря нет в ' + ф + ': ' + что.split('\n')[0]); плохих++; return;
    }
    const i = исходник[ф].indexOf(что);
    const текст = исходник[ф].slice(0, i) + на + исходник[ф].slice(i + что.length);
    const р = прогон({ файл: ф, текст });
    if (ждём === null) {
        if (р.упало) { console.log('  x ' + имя); console.log('      правило упало там, где должно МОЛЧАТЬ'); плохих++; }
        else console.log('  v ' + имя + '  ->  молчит, и это верно');
        return;
    }
    if (!р.упало) { console.log('  x ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
