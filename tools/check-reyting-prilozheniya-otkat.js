#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ РАЗДЕЛА РЕЙТИНГА (кусок 208). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-reyting-'));

['mobile/www/css/app.css', 'mobile/www/js/screens/rating.js', 'mobile/www/js/i18n.js',
 'mobile/www/index.html', 'tools/check-reyting-prilozheniya.js'].forEach(отн => {
    const куда = path.join(песок, отн);
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.copyFileSync(path.join(КОРЕНЬ, отн), куда);
});

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-reyting-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз в ' + отн;
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}
function вернуть(отн) { fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн)); }

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят — откаты бессмысленны\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const C = 'mobile/www/css/app.css';
const J = 'mobile/www/js/screens/rating.js';
const I = 'mobile/www/js/i18n.js';

const ОТКАТЫ = [
    /* ГРАНИЦЫ 414 В ФАЙЛЕ БОЛЬШЕ НЕТ ВОВСЕ — её и снял этот кусок, —
       поэтому якорь на неё встречался ноль раз: откат ничего не
       доказывал. Теперь он ЗАВОДИТ такую границу заново, рядом с
       единственной живой (640), и правило обязано упасть. */
    ['границу 414 вернули в раздел', C,
     '@media (min-width: 640px) and (min-height: 640px) {',
     '@media (min-width: 414px) {\n  .rr-name { font-size: 14px; }\n}\n@media (min-width: 640px) and (min-height: 640px) {',
     'раздел рейтинга не стоит ни на одной границе ширины'],

    ['имя снова тянется по ширине', C,
     '  font-size: 14px;\n  font-weight: 500;\n  min-width: 0;',
     '  font-size: clamp(11px, calc(11px + 3 * (100vw - 340px) / 90), 14px);\n  font-weight: 500;\n  min-width: 0;',
     'кегель раздела не тянется по ширине'],

    ['кегель имени вернули на 13', C,
     '  font-size: 14px;\n  font-weight: 500;\n  min-width: 0;',
     '  font-size: 13px;\n  font-weight: 500;\n  min-width: 0;',
     'каждый кегель раздела — ступень шкалы'],

    ['отступ строки вернули на 10 · 14', C,
     '  padding: var(--space-3) var(--space-4);\n  border-bottom: 1px solid var(--border);\n}\n.rating-table-head {',
     '  padding: 10px 14px;\n  border-bottom: 1px solid var(--border);\n}\n.rating-table-head {',
     'каждый отступ раздела — ступень шкалы'],

    ['фото на пьедестале вернули на 60', C,
     '  width: 52px;\n  height: 52px;\n  border-radius: 50%;\n  overflow: hidden;',
     '  width: 60px;\n  height: 60px;\n  border-radius: 50%;\n  overflow: hidden;',
     'фото первого больше остальных на одну ступень'],

    ['столбец очков снова определён дважды', C,
     '.rr-pts {\n  width: var(--rt-ochki);',
     '.rr-pts {\n  width: 50px;',
     'столбец «ochki» берётся из одного определения шапкой и строкой'],

    ['переменные столбцов сняты', C,
     '  --rt-mesto: 24px;', '  --rt-mesto-bylo: 24px;',
     'столбцы таблицы объявлены переменными на одном узле'],

    ['цель выпадашки опущена ниже 44', C,
     '  /* ЦЕЛЬ НАЖАТИЯ 44. Было 33 по высоте: выпадашку приходилось целить. */\n  min-height: 44px;\n',
     '',
     'цель нажатия: выпадашка не ниже 44'],

    ['видимый фокус у выпадашки снят', C,
     '.rf-select:focus-visible {\n  outline: 2px solid var(--accent-text);\n  outline-offset: 2px;\n}\n',
     '',
     'видимый фокус: выпадашка'],

    ['обрезка имени снята', C,
     '  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.rr-pts {',
     '}\n.rr-pts {',
     'имя в таблице обрезается многоточием'],

    ['ячейка игрока снова не сжимается', C,
     '  gap: var(--space-3);\n  min-width: 0;\n}\n.rr-avatar {',
     '  gap: var(--space-3);\n}\n.rr-avatar {',
     'ячейка игрока умеет сжиматься'],

    ['карточки пьедестала снова фиксированной ширины', C,
     '  flex: 1 1 0;\n  min-width: 0;\n  max-width: 112px;',
     '  flex: 0 0 auto;\n  width: 90px;',
     'карточки пьедестала делят полосу'],

    ['роли таблицы сняты', J,
     'role="table"', 'data-bylo-table',
     'таблица представляется диктору таблицей'],

    ['роли пьедестала сняты', J,
     'role="list"', 'data-bylo-list',
     'пьедестал представляется диктору списком'],

    ['медаль снова читается диктору', J,
     'class="rp-medal" aria-hidden="true"', 'class="rp-medal"',
     'медаль и аватар от диктора скрыты'],

    ['переключатель снова крупнее выпадашки', C,
     '  padding: var(--space-2) var(--space-6);\n  font-size: var(--fs-xs);',
     '  padding: var(--space-2) var(--space-6);\n  font-size: 16px;',
     'переключатель пола мельче выпадашки разряда'],

    ['переключатель снова во всю полосу', C,
     '  /* По содержимому, а не во всю полосу */\n  flex: 0 0 auto;',
     '  flex: 1;',
     'переключатель пола не занимает всю полосу'],

    ['приглушение опустило цель нажатия', C,
     '  /* ЦЕЛЬ НАЖАТИЯ 44. Было 41 — с рамкой 2 и отступом 10 не дотягивал. */\n  min-height: 44px;\n  padding: var(--space-2) var(--space-6);',
     '  padding: var(--space-2) var(--space-6);',
     'тише — значит уже и мельче, а не ниже ростом'],

    ['ширину колонки снова зашили в разметку', 'mobile/www/index.html',
     '<div class="rf-col">',
     '<div class="rf-col" style="max-width:280px">',
     'в разметке раздела нет зашитых стилей'],

    ['подпись таблицы осталась в одном языке', I,
     "'rating.tableLabel':  { ru: 'Таблица рейтинга', en: 'Rating table',   kg: 'Рейтинг таблицасы' },",
     "'rating.tableLabel':  { ru: 'Таблица рейтинга' },",
     'подписи для диктора заведены на трёх языках']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    const стр = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(стр + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0) {
        console.log(стр + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(стр + '\n      ✗ ждали падения правила «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 3)
            .map(с => '        ' + с.trim()).join('\n'));
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не доказали своих правил: ' + плохо + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила\n');
}
