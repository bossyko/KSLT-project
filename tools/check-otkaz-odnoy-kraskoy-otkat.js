/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ОТКАЗ ОДНОЙ КРАСКОЙ» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Это правило особенно легко подпереть обманом: оно запрещает не число, а
 * число В РОЛИ, и откат, вернувший `#ef4444` туда, где тот законен — в
 * эфир, — «пройдёт», ничего не доказав. Поэтому последний откат ЖДЁТ
 * МОЛЧАНИЯ: та же краска в чужой роли правило трогать не должна.
 *
 *   node tools/check-otkaz-odnoy-kraskoy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/player.css', 'css/players.css', 'css/style.css',
               'css/challenge-detail.css', 'css/tournament-detail.css', 'css/tokens.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const PL = 'css/player.css', PS = 'css/players.css', S = 'css/style.css',
      CH = 'css/challenge-detail.css', TD = 'css/tournament-detail.css', T = 'css/tokens.css';

const ОТКАТЫ = [

/* ── чужая краска вернулась в роль ── */
['вернуть #ef4444 проигрышу матча', PL,
 '.pp-match-result.loss {\n    background: var(--danger-subtle);\n    color: var(--danger);',
 '.pp-match-result.loss {\n    background: rgba(239, 68, 68, 0.15);\n    color: #ef4444;',
 'отказ и проигрыш говорят одной краской'],

['вернуть #ff6b6b ошибке входа', S,
 '.auth-message-error {\n    background: var(--danger-subtle);',
 '.auth-message-error {\n    background: rgba(255, 59, 48, 0.15);',
 'отказ и проигрыш говорят одной краской'],

/* ПЕРВАЯ РЕДАКЦИЯ ЭТОГО ОТКАТА БЫЛА ОБМАНОМ, и правило его не приняло:
   она вставляла блок-самозванец `.kslt-status-refused-ZAGLUSHKA`, у
   которого искомое имя — лишь префикс. Правило справедливо молчало.
   Откат возвращает чужую краску в НАСТОЯЩИЙ блок. */
['вернуть #f44336 отказу в заявке', S,
 '.kslt-status-refused {\n    background: rgba(255, 71, 87, 0.14);',
 '.kslt-status-refused {\n    background: rgba(244, 67, 54, 0.14);',
 'отказ и проигрыш говорят одной краской'],

['вернуть #ff6b62 полосе проигрыша', PL,
 '.pp-cat-bar-l { background: var(--danger); }',
 '.pp-cat-bar-l { background: #ff6b62; }',
 'отказ и проигрыш говорят одной краской'],

['вернуть #ef4444 падению рейтинга', PS,
 '.pl-change-down {\n    color: var(--danger);',
 '.pl-change-down {\n    color: #ef4444;',
 'отказ и проигрыш говорят одной краской'],

/* Самозванец с тем же префиксом правило трогать НЕ должно: имя роли в
   нём — лишь начало другого имени. Это вторая проверка на молчание. */
['блок-самозванец с тем же префиксом — правило МОЛЧИТ', PS,
 '.pl-change-down {',
 '.pl-change-down-PROBA { color: #ef4444; }\n.pl-change-down {',
 null],

['вернуть #f87171 проигранным очкам вызова', CH,
 '.ch-stat-l { color: var(--danger); }',
 '.ch-stat-l { color: #f87171; }',
 'отказ и проигрыш говорят одной краской'],

['вернуть #ef4444 отменённому турниру', TD,
 '.td-status-badge.cancelled {\n    background: rgba(255, 71, 87, 0.2);\n    color: var(--danger);',
 '.td-status-badge.cancelled {\n    background: rgba(239, 68, 68, 0.2);\n    color: #ef4444;',
 'отказ и проигрыш говорят одной краской'],

/* ── роль подменена в системе ── */
['отвязать --danger от системного красного', T,
 '--danger:         var(--red-500);',
 '--danger:         #ef4444;',
 '--danger остаётся системным красным'],

['сменить прозрачность тинта роли', T,
 '--alpha-red-15:    rgba(255, 71, 87, 0.15);',
 '--alpha-red-15:    rgba(255, 71, 87, 0.25);',
 '--danger-subtle остаётся тинтом того же красного'],

/* ── МОЛЧАНИЕ: та же краска в ЧУЖОЙ роли правило не трогает ── */
/* ЯКОРЬ ПЕРЕВЯЗАН 22.10 на живого носителя: `.td-status-pill.live` снят
   куском 117 вместе с мёртвым блоком. */
['та же краска в ЭФИРЕ — правило МОЛЧИТ', TD,
 '.td-status-badge.live',
 '.td-status-badge.live-ПРОБА { color: #ef4444; background: rgba(239, 68, 68, 0.15); }\n.td-status-badge.live',
 null]

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-otkaz-'));
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
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-otkaz-odnoy-kraskoy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-otkaz-odnoy-kraskoy.js.');
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
        if (р.упало) { console.log('  x ' + имя); console.log('      правило упало там, где должно МОЛЧАТЬ:'); console.log(р.вывод.split('\n').filter(l => l.includes('x ')).join('\n')); плохих++; }
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
