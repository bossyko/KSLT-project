/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ЗАПИРАНИЯ ФОКУСА (кусок 152). На КОПИИ.
 *   node tools/check-lovushka-zapiranie-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ — на том, что живёт в блоке
 * постоянно, — а не на номере строки и не на соседе, который может уехать.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-fokus-'));
['js', 'tools', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/kslt-fokus.js',
      DASH = 'js/dashboard.js',
      ADMIN = 'js/admin/core/utils.js',
      SPON = 'js/sponsors-page.js',
      PHONE = 'js/phone.js',
      COURTS = 'js/courts.js',
      NEWS = 'js/news.js',
      СТЕНД = 'maket/fokus-zamer.html';
const ФАЙЛЫ = [ДОМ, DASH, ADMIN, SPON, PHONE, COURTS, NEWS, СТЕНД];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-lovushka-zapiranie.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['снять запирание с вывески дома', ДОМ,
     '        запереть: запереть,',
     '        запертьОкно: запереть,',
     'дом отдаёт запирание, список фокусируемого и число открытых окон'],

    ['вернуть видимость через offsetParent', ДОМ,
     '        return э.getBoundingClientRect().height > 0;',
     '        return э.offsetParent !== null;',
     'дом спрашивает высоту, а не `offsetParent`'],

    ['заставить ловушку брать список сама, минуя видимость', ДОМ,
     '            var сп = фокусируемые(корень);',
     '            var сп = корень.querySelectorAll(ФОКУСИРУЕМОЕ);',
     'ловушка читает список через `фокусируемые` — иначе видимость обойдена'],

    ['отнять у стека снятие мёртвого окна', ДОМ,
     '        while (стек.length && !стек[стек.length - 1].корень.isConnected) стек.pop();',
     '        /* признак снят */',
     'стек снимает запись по признаку «узел ушёл из документа» и пустеет'],

    ['оставить слушателя на пустом стеке', ДОМ,
     '            if (!стек.length) убратьСлушателя();',
     '            /* слушателя не снимаем */',
     'стек снимает запись по признаку «узел ушёл из документа» и пустеет'],

    ['вернуть окну QR голую ловушку вместо запирания', DASH,
     '        var снятьQR = window.KSLT_FOKUS.запереть(overlay, { поEsc: закрытьQR });',
     '        var снятьQR = window.KSLT_FOKUS.ловушка(overlay);',
     'ни одно окно не берёт голую ловушку — только запирание'],

    ['перестать звать снятие у окна обмена баллов', DASH,
     '            снятьОбмен();',
     '            /* снятие не зовём */',
     'у каждого запирания снятие не просто присвоено, а позвано'],

    ['отнять запирание у оболочки окна админки', ADMIN,
     '        var снять = window.KSLT_FOKUS.запереть(окно, { поEsc: закрыть });',
     '        var снять = function () {};',
     'запирание берут шесть окон — замерено, и по путям'],

    ['увести слушателя страницы спонсоров с document', SPON,
     "        document.addEventListener('keydown', function(e) {",
     "        modal.addEventListener('keydown', function(e) {",
     'слушателей keydown на `document` вне дома замеренные десять'],

    ['завести ПЯТУЮ копию разбора Tab — в телефоне раздела', PHONE,
     "            if (e.key === 'Escape') {",
     "            if (e.key === 'Tab') { e.preventDefault(); return; }\n            if (e.key === 'Escape') {",
     'Tab разбирают четыре файла вне дома — замерено, и каждый по разу'],

    ['отнять Escape у окна кортов', COURTS,
     "            if (e.key === 'Escape') {",
     "            if (e.key === 'Esc') {",
     'Escape вне дома разбирают одиннадцать мест — замерено'],

    ['развести один разбор Tab на два — у смотрелки новостей', NEWS,
     "            if (e.key !== 'Tab') return;",
     "            if (e.key !== 'Tab' && e.code !== 'Tab') return;",
     'Tab разбирают четыре файла вне дома — замерено, и каждый по разу'],

    ['убрать со стенда свидетеля на подложке', СТЕНД,
     "    if (есть) окноA.addEventListener('keydown', window.KSLT_FOKUS.ловушка(окноA));",
     '    /* свидетеля убрали */',
     'стенд держит свидетеля на подложке и четыре окна через запирание'],

    ['убрать со стенда скрытую кнопку — крайний случай видимости', СТЕНД,
     'id="dСкрытый"',
     'id="dБылаСкрытой"',
     'стенд держит свидетеля на подложке и четыре окна через запирание']
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
