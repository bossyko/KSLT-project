/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ОТСЧЁТ — ОЖИДАНИЕ» ОТКАТОМ. На КОПИИ.
 *
 *   node tools/check-otschet-ozhidanie-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tournaments.css', 'css/tournaments-overview.css', 'css/battles-overview.css',
               'css/style.css', 'css/courts.css', 'css/services.css', 'css/tournament-detail.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const T2 = 'css/tournaments.css', TO = 'css/tournaments-overview.css', BO = 'css/battles-overview.css',
      S = 'css/style.css', C = 'css/courts.css', SV = 'css/services.css', TD = 'css/tournament-detail.css';

const ОТКАТЫ = [

['вернуть красный градиент отсчёту', T2,
 '    background: var(--alpha-white-08);\n    border: var(--bw-hair) solid var(--alpha-white-12);',
 '    background: linear-gradient(135deg, rgba(220,38,38,0.9), rgba(185,28,28,0.95));\n    border: var(--bw-hair) solid rgba(255,100,100,0.3);',
 'обычный отсчёт — ожидание, а не тревога'],

['вернуть белый текст отсчёту на карточке', S,
 '    line-height: 1;\n    color: var(--accent);\n}',
 '    line-height: 1;\n    color: var(--neutral-white);\n}',
 'обычный отсчёт — ожидание, а не тревога'],

['снять тревогу со срочного', BO,
 '    background: var(--danger-subtle);\n    border-color: var(--danger);\n    color: var(--danger);',
 '    background: var(--alpha-white-12);',
 'срочный отсчёт — единственная тревога на карточке'],

/* ЯКОРЬ С ИМЕНЕМ СЕЛЕКТОРА, А НЕ ПРОСТО С ПАРОЙ КРАСОК. Первая редакция
   этих двух откатов искала `background: var(--accent); color:
   var(--neutral-black)` — и попадала в `.ct-discount-btn`, у которой та
   же пара. Правило честно молчало: оверлей-то оставался лаймовым.
   Откат, который меняет не то, что проверяет правило, ничего не
   доказывает, даже когда «падает». */
['вернуть красную скидку на обложку корта', C,
 '.ct-discount-overlay {\n    position: absolute;',
 '.ct-discount-overlay {\n    background: rgba(220, 38, 38, 0.9);\n    position: absolute;',
 'скидка говорит лаймом, а не тревогой'],

['вернуть красную скидку на обложку услуги', SV,
 '.sv-discount-overlay {',
 '.sv-discount-overlay {\n    background: rgba(220, 38, 38, 0.9);',
 'скидка говорит лаймом, а не тревогой'],

['вернуть своё число предупреждению', TD,
 '.td-cd-reg-warning {\n    margin-top: var(--space-sm);',
 '.td-cd-reg-warning {\n    color: #ffaa00;\n    margin-top: var(--space-sm);',
 'предупреждение о регистрации берёт роль, а не своё число'],

['спрятать чужой красный в КАДР анимации срочного', TO,
 '@keyframes toCdUrgentPulse {\n    0%, 100% { box-shadow: 0 2px 12px var(--alpha-red-30); }',
 '@keyframes toCdUrgentPulse {\n    0%, 100% { box-shadow: 0 2px 12px rgba(239,68,68,0.3); }',
 'кадры анимаций отсчёта тоже без чужого красного'],

/* ── МОЛЧАНИЕ ── */
['красный у ОТКАЗА — правило МОЛЧИТ', S,
 '.kslt-status-refused',
 '.kslt-status-refused-ПРОБА { background: rgba(220, 38, 38, 0.9); }\n.kslt-status-refused',
 null],

['лайм у СКИДКИ в списке — правило МОЛЧИТ', C,
 '.ct-discount-percent',
 '.ct-discount-percent-ПРОБА { color: var(--accent); }\n.ct-discount-percent',
 null]

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-otschet-'));
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
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-otschet-ozhidanie.js')], { encoding: 'utf8' });
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
