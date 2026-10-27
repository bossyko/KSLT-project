#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ГЛАВНОЙ (кусок 211). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-glavnaya-'));

['mobile/www/css/app.css', 'tools/check-glavnaya-prilozheniya.js'].forEach(отн => {
    const куда = path.join(песок, отн);
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.copyFileSync(path.join(КОРЕНЬ, отн), куда);
});

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-glavnaya-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз';
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

const ОТКАТЫ = [
    ['дробный кегель вернулся', C,
     '.hh-text {', '.hh-text { font-size: 12.5px;',
     'ни одного дробного кегля'],

    ['кегель ушёл со ступени', C,
     '.tcv-name {', '.tcv-name { font-size: 13px;',
     'каждый кегель главной — ступень шкалы'],

    ['подпись под числом снова 8px', C,
     '.hh-stat-cap {', '.hh-stat-cap { font-size: 8px;',
     'подпись под числом клуба не ниже низа шкалы'],

    ['отступ ушёл с сетки', C,
     '.tcv-meta {', '.tcv-meta { gap: 5px;',
     'каждый отступ главной на сетке восьмёрки'],

    /* Якорь берёт ОДНО объявление: `.hb-sponsor {` встречается дважды
       (второй раз — одной строкой с курсором). ФОРМА ОТКАТА ЧИТАЕТСЯ У
       СОСЕДА, А НЕ ВСПОМИНАЕТСЯ. */
    ['размер ушёл с сетки', C,
     '.hb-sp-logo {', '.hb-sp-logo { height: 74px;',
     'каждый размер главной на сетке'],

    ['границу 414 вернули на главную', C,
     '@media (min-width: 414px) {',
     '@media (min-width: 414px) {\n  .news-card { min-width: 280px; }',
     'главная не стоит ни на одной границе ширины'],

    ['сетка «о клубе» снова на двух колонках', C,
     'grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));',
     'grid-template-columns: 1fr 1fr;',
     'сетка «о клубе» сама кладёт столько колонок, сколько влезает'],

    ['ряд чисел снова жёсткой ширины', C,
     '  flex: 1 1 96px;\n  max-width: 160px;',
     '  flex: 0 0 calc((100% - 12px) / 3);',
     'ряд чисел клуба тянется, а не переключается границей'],

    ['карточка новости перестала тянуться', C,
     '  width: 72vw;\n', '',
     'карточка новости тянется между своими пределами'],

    ['главной кнопке опустили цель нажатия', C,
     '  min-height: 44px;\n  margin-top: var(--space-4); padding: var(--space-3) var(--space-6);',
     '  margin-top: var(--space-4); padding: var(--space-3) var(--space-6);',
     'цель нажатия: главное действие «Найти игрока»'],

    ['ссылке «Все» вернули высоту 21', C,
     '  display: inline-flex;\n  align-items: center;\n  min-height: 44px;\n  padding: 0 var(--space-2);',
     '  padding: 0;',
     'цель нажатия: ссылка «Все»'],

    ['второй призыв снова залит акцентом', C,
     '  background: transparent; border: 2px solid var(--accent); color: var(--accent-text);',
     '  background: var(--accent); color: #0A0A0A;',
     'второй призыв не залит акцентом'],

    ['главное действие потеряло заливку', C,
     '  background: var(--accent); color: #0A0A0A; font-size: 14px; font-weight: 800;',
     '  background: transparent; color: var(--accent-text); font-size: 14px; font-weight: 800;',
     'главное действие экрана залито акцентом']
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
