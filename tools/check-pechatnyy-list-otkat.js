/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПЕЧАТНОГО ЛИСТА. На КОПИИ.
 *   node tools/check-pechatnyy-list-otkat.js
 *
 * ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО: правило о живом
 * `ad-no-print` читает `css/admin.css`, правило о своём листе обходит ВСЁ
 * дерево `js/`.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-list-'));
['js', 'tools', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/admin/core/export.js', U = 'js/admin/sections/users.js',
      V = 'js/admin/sections/vouchers.js', F = 'js/admin/sections/finances.js',
      CSS = 'css/admin.css';
const ФАЙЛЫ = [ДОМ, U, V, F, CSS];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-pechatnyy-list.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть свой лист «Финансам»', F,
     "            заголовок: L.payPdfTitle,",
     "            заголовок: L.payPdfTitle, /* .report-header { } */",
     'лист отчёта описан только в доме'],

    ['вернуть разделу своё открытие окна', V,
     "        A.печатныйЛист({\n            заголовок: L.vchReportTitle,",
     "        var win = window.open('', '_blank');\n        A.печатныйЛист({\n            заголовок: L.vchReportTitle,",
     'окно отчёта открывает дом, а не раздел'],

    ['снести понятие из дома', ДОМ,
     '    A.печатныйЛист = печатныйЛист;',
     '    A.печатныйЛистСтарый = печатныйЛист;',
     'дом отдаёт понятие `печатныйЛист`'],

    ['убрать зов у «Пользователей»', U,
     '        A.печатныйЛист({',
     '        var неЗовём = ({',
     'дом зовут три раздела — замерено'],

    ['отнять у зова ваучеров подвал', V,
     "            подвалСправа: L.vchReportDate + ': ' + reportDate\n",
     '',
     'у каждого зова на месте все обязательные доводы'],

    ['сделать плотным ещё один отчёт', F,
     '            заголовок: L.payPdfTitle,',
     '            заголовок: L.payPdfTitle,\n            плотный: true,',
     'плотный лист назван доводом ровно у одного отчёта'],

    ['завести разбивку ещё у одного отчёта', V,
     '            заголовок: L.vchReportTitle,',
     "            заголовок: L.vchReportTitle,\n            разбивка: '<span>1</span>',",
     'разбивка названа доводом ровно у одного отчёта'],

    ['выдавать правила разбивки всегда', ДОМ,
     "                (о.разбивка\n                    ? '.breakdown { display: flex; gap: 20px; margin-bottom: 24px; font-size:var(--fs-xs); color: #555; flex-wrap: wrap; }' +\n                      '.breakdown span { font-weight: 600; color: #1a1a1a; }'\n                    : '') +",
     "                '.breakdown { display: flex; gap: 20px; margin-bottom: 24px; font-size:var(--fs-xs); color: #555; flex-wrap: wrap; }' +\n                '.breakdown span { font-weight: 600; color: #1a1a1a; }' +",
     'правила разбивки выдаются только под своим доводом'],

    ['вернуть в лист мёртвое правило', ДОМ,
     "                '@media print { body { padding: 15px; } }' +",
     "                '@media print { body { padding: 15px; } .no-print { display: none; } }' +",
     'мёртвое правило `.no-print` не вернулось в лист'],

    ['снять правило живого `ad-no-print` из css', CSS,
     '    body.ad-printing .ad-no-print,',
     '    body.ad-printing .ad-no-print-snyato,',
     'живое `ad-no-print` имеет правило в css админки'],

    ['перестать гасить заголовок листа', ДОМ,
     "            '<title>' + гасить(о.заголовок) + '</title>' +",
     "            '<title>' + о.заголовок + '</title>' +",
     'текст, пришедший текстом, дом гасит сам'],

    ['звать печать сразу, а не из onload', ДОМ,
     "            '<script>window.onload=function(){window.print();}<\\/script>' +",
     "            '<script>window.print();<\\/script>' +",
     'печать зовётся из onload нового окна']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return; }
    if (сколько !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}
