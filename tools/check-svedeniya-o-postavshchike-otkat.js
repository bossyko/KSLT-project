/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «СВЕДЕНИЯ О ПОСТАВЩИКЕ» (Ю7). На КОПИИ.
 *   node tools/check-svedeniya-o-postavshchike-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ, а не на номере строки.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-svedeniya-'));
/* КОПИЯ, НЕПОЛНАЯ ОТНОСИТЕЛЬНО ПРОВЕРЯЕМОГО, НИЧЕГО НЕ ДОКАЗЫВАЕТ: сторож
   читает partials, pages, css, index.html и лежит в tools. */
['tools', 'partials', 'pages', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, 'index.html'), path.join(песок, 'index.html'));

const RU = 'partials/footer-ru.html', EN = 'partials/footer-en.html',
      KG = 'partials/footer-kg.html', CSS = 'css/style.css',
      СТР = 'pages/courts.html';
const ФАЙЛЫ = [RU, EN, KG, CSS, СТР];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правки) {
    ФАЙЛЫ.forEach(ф => {
        const п = (правки || []).find(([и]) => и === ф);
        let текст = исходник[ф];
        if (п) текст = текст.split(п[1]).join(п[2]);
        fs.writeFileSync(path.join(песок, ф), текст);
    });
    try {
        const вывод = execFileSync(process.execPath,
            [path.join(песок, 'tools/check-svedeniya-o-postavshchike.js')], { encoding: 'utf8' });
        return { упало: false, вывод };
    } catch (e) {
        return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') };
    }
}

const ОТКАТЫ = [
    ['убрать блок сведений из русского подвала', [[RU,
      'class="footer-entity"', 'class="footer-byloe"']],
     'подвал ru: блок сведений на месте'],

    ['стереть ИНН из английского подвала', [[EN,
      'TIN 01905202110030', 'TIN —']],
     'подвал en: ИНН и регистрационный номер'],

    ['стереть применимое право из кыргызского подвала', [[KG,
      'Кыргыз Республикасынын мыйзамдары', 'КР']],
     'подвал kg: применимое право названо'],

    ['перевести наименование вольно', [[EN,
      'Public Foundation “Kyrgyzstan Social Lawn Tennis Community” (KSLT)',
      'KSLT Tennis Community']],
     'подвал en: наименование на своём языке'],

    ['вынести ФИО директора в подвал', [[RU,
      'Применимое право: законодательство',
      'директор Чокоева Айсулуу Эриковна · Применимое право: законодательство']],
     'подвал ru: без ФИО директора'],

    ['забыть разнести образец по страницам', [[СТР,
      'class="footer-entity"', 'class="footer-nerazneseno"']],
     'сведения разнесены по всем страницам с подвалом'],

    ['задать сведениям свою краску числом', [[CSS,
      'color: var(--text-muted);\n    font-size: var(--fs-xs);\n    line-height: var(--lh-snug);',
      'color: #8a8a8a;\n    font-size: 11px;\n    line-height: var(--lh-snug);']],
     'сведения стоят на роли и ступени, а не на своих числах'],

    ['отнять у строки сведений полную ширину', [[CSS,
      '.footer-entity {\n    flex: 0 0 100%;',
      '.footer-entity {\n    flex: 0 1 auto;']],
     'строка сведений занимает всю ширину полосы'],
];

console.log('\n  ПРУВЕР «СВЕДЕНИЯ О ПОСТАВЩИКЕ» — на копии\n');
let плохих = 0;
const чистый = прогон(null);
if (чистый.упало) { console.log('  x чистая копия уже падает:\n' + чистый.вывод); плохих++; }
else console.log('  v чистая копия зелёная');

ОТКАТЫ.forEach(([имя, правки, ждём]) => {
    let беда = null;
    правки.forEach(([ф, было]) => {
        const n = исходник[ф].split(было).length - 1;
        if (n !== 1) беда = 'якорь встречается ' + n + ' раз в ' + ф;
    });
    if (беда) { console.log('  ? ' + имя + '  ->  ' + беда); плохих++; return; }
    const р = прогон(правки);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
прогон(null);
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' не доказали правило\n');
    process.exitCode = 1;
}
