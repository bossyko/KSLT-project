/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА НАЖАТИЙ ПОЛОСЫ СТРАНИЦ. На КОПИИ.
 *   node tools/check-polosa-nazhatiya-otkat.js
 *
 * ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО: правило о подключении
 * обходит ВСЕ страницы продукта, поэтому в песок идут и корневые.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-polosa-'));
['js', 'tools', 'pages', 'maket', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.readdirSync(КОРЕНЬ).filter(ф => /\.html$/.test(ф)).forEach(ф =>
    fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф)));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/polosa-stranic.js', ВИТ = 'js/kslt-vitrina.js',
      КАБ = 'js/dashboard.js', НОВ = 'js/news.js', ИГР = 'js/players.js',
      СТР = 'pages/news.html', СТЕНД = 'maket/stend-polosa-nazhatiya.html';
const ФАЙЛЫ = [ДОМ, ВИТ, КАБ, НОВ, ИГР, СТР, СТЕНД];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-polosa-nazhatiya.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть своё тело «Новостям»', НОВ,
     "        ключ: 'новости',",
     "        ключ: 'новости', /* pl-page-prev pl-page-next */",
     'решение о нажатии полосы определено только в доме'],

    ['снести понятие из дома', ДОМ,
     'полосаСтраниц.нажатия = function (о) {',
     'полосаСтраниц.нажатияСтарое = function (о) {',
     'дом полосы отдаёт понятие `нажатия`'],

    ['отнять у дома память о ключах', ДОМ,
     '        var ключи = область.__ksltПолосаКлючи || (область.__ksltПолосаКлючи = {});\n        if (ключи[о.ключ]) return;\n        ключи[о.ключ] = true;\n',
     '',
     'повторный зов не вешает второго слушателя'],

    ['вернуть витрине своё тело', ВИТ,
     '        window.KSLT_полосаСтраниц.нажатия({',
     '        if (document.querySelector(".pl-page-prev, .pl-page-next")) { return; }\n        window.KSLT_полосаСтраниц.нажатия({',
     'витрина зовёт дом полосы, а не держит своё тело'],

    ['убрать зов у «Новостей»', НОВ,
     '    window.KSLT_полосаСтраниц.нажатия({',
     '    var неЗовём = ({',
     'зовут дом все семь мест'],

    ['отнять ключ у зова «Новостей»', НОВ,
     "        ключ: 'новости',\n",
     '',
     'у каждого зова есть ключ'],

    ['отнять `перерисовать` у зова «Новостей»', НОВ,
     '        перерисовать: renderGrid,\n',
     '',
     'обязательные доводы на месте у каждого зова'],

    ['снять счёт с нуля у «Моих игр»', КАБ,
     '            сНуля: true,\n',
     '',
     'счёт с нуля назван доводом ровно в одном месте'],

    ['замкнуть доводы вместо хранилки', КАБ,
     '                renderPaged(container, состояние.items, состояние.renderRows,\n                    состояние.page, состояние.afterRender);',
     '                renderPaged(container, items, renderRows, состояние.page, afterRender);',
     'кабинет берёт доводы из хранилки, а не из замыкания'],

    ['отнять у дома проверку своей кнопки', ДОМ,
     '            if (своя && !своя.contains(кнопка)) return;\n',
     '',
     'дом берёт свою кнопку, а не любую на странице'],

    ['сделать стенд удобным — одна полоса вместо трёх', СТЕНД,
     "                полоса: имя === 'C' ? null : полоса,\n",
     '',
     'стенд полосы на месте и показывает крайний случай'],

    ['снести дом со страницы «Новостей»', СТР,
     'polosa-stranic.js?v=4',
     'polosa-stranic-net.js?v=4',
     'дом полосы стоит на каждой странице, где его зовут']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правило падает на ЧИСТОМ коде — чинить сторож, а не код\n');
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
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
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
