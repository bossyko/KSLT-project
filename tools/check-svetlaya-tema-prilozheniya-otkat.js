#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ СВЕТЛОЙ ТЕМЫ (кусок 207).
 * Работает на КОПИИ: возвращает прежнее значение по одному и требует, чтобы
 * упало ИМЕННО то правило, которое за это отвечает.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-svet-'));

['mobile/www/css/app.css', 'mobile/www/css/tokens.css',
 'mobile/www/js/screens/battles.js',
 'tools/check-svetlaya-tema-prilozheniya.js'].forEach(отн => {
    const куда = path.join(песок, отн);
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.copyFileSync(path.join(КОРЕНЬ, отн), куда);
});

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-svetlaya-tema-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}

function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const сколько = т.split(было).length - 1;
    if (сколько !== 1) return 'ЯКОРЬ встречается ' + сколько + ' раз в ' + отн;
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}

function вернуть(отн) {
    fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн));
}

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

const СТИЛИ = 'mobile/www/css/app.css';
const ТОКЕНЫ = 'mobile/www/css/tokens.css';
const БАТТЛЫ = 'mobile/www/js/screens/battles.js';

const ОТКАТЫ = [
    ['светлая тема снова без своего основного цвета текста', СТИЛИ,
     '  --text-primary: #111111;\n', '',
     'светлая тема задаёт свой основной цвет текста'],

    ['основной цвет текста светлой темы снова белый', СТИЛИ,
     '  --text-primary: #111111;', '  --text-primary: #FFFFFF;',
     'основной цвет текста светлой темы не белый'],

    /* ЯКОРЬ ПЕРЕЕХАЛ ВМЕСТЕ С ТОКЕНОМ 02.11: объявление по умолчанию
       ушло из одежды приложения в общий `tokens.css`, потому что
       `--accent-text` зовут компоненты обоих продуктов. */
    ['имя акцентного текста снято', ТОКЕНЫ,
     '--accent-text: var(--accent);', '--accent-text-pereimenovan: var(--accent);',
     'акцентный текст имеет своё имя'],

    ['в светлой теме акцентный текст снова равен акценту', СТИЛИ,
     '  --accent-text: #3D7500;', '  --accent-text: var(--accent);',
     'в светлой теме акцентный текст НЕ равен заливочному акценту'],

    ['одно место вернулось на заливочный акцент как цвет текста', СТИЛИ,
     '.rr-rank.top { color: var(--accent-text); }',
     '.rr-rank.top { color: var(--accent); }',
     'цвет текста нигде не идёт через заливочный акцент'],

    ['светлая тема снова красит заполненные кнопки в белый', СТИЛИ,
     '/* ===== RESET & BASE ===== */',
     '[data-theme="light"] .btn-accent { color: #fff; }\n/* ===== RESET & BASE ===== */',
     'светлая тема не перекрашивает заполненные кнопки в белый'],

    ['светлая тема снова ослабляет плашку бейджа', СТИЛИ,
     '  --accent-text: #3D7500;',
     '  --accent-text: #3D7500;\n  --badge-overlay: rgba(0,0,0,0.5);',
     'плашка бейджа определена один раз — в токенах'],

    ['текст бейджа снова зависит от темы', СТИЛИ,
     '  color: var(--lime-500);', '  color: var(--accent-text);',
     'текст бейджа на картинке не зависит от темы'],

    /* ЯКОРЬ ПЕРЕВЯЗАН: кегль в блоке стал ступенью (`var(--fs-xs)`
       вместо 11px), и якорь встречался ноль раз. Строки взяты из файла. */
    ['имя на пьедестале снова на голой белой краске', СТИЛИ,
     '.rp-name {\n  font-size: var(--fs-xs);\n  font-weight: 600;\n  color: var(--text-primary);',
     '.rp-name {\n  font-size: var(--fs-xs);\n  font-weight: 600;\n  color: #fff;',
     'имя на пьедестале идёт через токен'],

    /* ЯКОРЬ ПЕРЕВЯЗАН: между краской и кеглем встало пояснение о паре
       «выпадашка и переключатель», и кегль стал 14 — якорь держался на
       соседе, который уехал. Берём две строки блока `.rf-select`,
       которые и есть само правило: заливка и краска текста. */
    ['выпадашка рейтинга снова на голой белой краске', СТИЛИ,
     '  background: var(--glass);\n  color: var(--text-primary);\n  /* ВЫПАДАШКА И ПЕРЕКЛЮЧАТЕЛЬ',
     '  background: var(--glass);\n  color: #fff;\n  /* ВЫПАДАШКА И ПЕРЕКЛЮЧАТЕЛЬ',
     'выпадашка рейтинга идёт через токен'],

    ['запрос баттлов снова тянет несуществующую связь', БАТТЛЫ,
     "opponent_player:players!challenges_opponent_player_id_fkey(name, photo, country)')",
     "opponent_player:players!challenges_opponent_player_id_fkey(name, photo, country), challenger_partner:players!challenges_challenger_partner_id_fkey(name, photo, country)')",
     'запрос баттлов не тянет связи на партнёров'],

    ['плашка бейджа исчезла из токенов', ТОКЕНЫ,
     '  --badge-overlay:', '  --badge-overlay-bylo:',
     'плашка бейджа определена один раз — в токенах']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    const строка = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(строка + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0) {
        console.log(строка + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(строка + '\n      ✗ ждали падения правила «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 4)
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
