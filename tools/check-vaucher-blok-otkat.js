/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ВАУЧЕРНОГО БЛОКА. На КОПИИ.
 *   node tools/check-vaucher-blok-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vauch-'));
/* ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО: с куска 146 правило
   читает и страницы кабинета — там проверяется порядок подключения. */
['js', 'tools', 'maket', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/kslt-vaucher-blok.js', ТР = 'js/coaches.js', КТ = 'js/courts.js',
      СТ = 'maket/stend-vaucher-blok.html', КАБ = 'js/dashboard.js',
      СТРК = 'pages/dashboard.html';
const ФАЙЛЫ = [ДОМ, ТР, КТ, СТ, КАБ, СТРК];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-vaucher-blok.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1–6: понятия уходят из дома по одному */
    ['отнять у дома услуги по кнопке', ДОМ, '    Б.услугиПоКнопке = async function',
     '    Б.услугиПоКнопкеИначе = async function', '`услугиПоКнопке` объявлено в доме'],
    ['отнять у дома выбор услуги', ДОМ, '    Б.выборУслуги = function',
     '    Б.выборУслугиИначе = function', '`выборУслуги` объявлено в доме'],
    ['отнять у дома заведение ваучера', ДОМ, '    Б.завести = async function',
     '    Б.завестиИначе = async function', '`завести` объявлено в доме'],
    ['отнять у дома окно ваучера', ДОМ, '    Б.окноВаучера = function',
     '    Б.окноВаучераИначе = function', '`окноВаучера` объявлено в доме'],
    ['отнять у дома окно лимита', ДОМ, '    Б.окноЛимита = function',
     '    Б.окноЛимитаИначе = function', '`окноЛимита` объявлено в доме'],
    ['отнять у дома историю', ДОМ, '    Б.история = async function',
     '    Б.историяИначе = async function', '`история` объявлено в доме'],

    /* 7–8: свой зов базы вернулся к близнецам */
    ['вернуть тренерам свой зов generate_voucher', ТР,
     "    function coShowLimitModal(причина) {",
     "    function coSvoyVaucher() {\n" +
     "        return window.supabaseClient.rpc('generate_voucher', {});\n" +
     "    }\n\n    function coShowLimitModal(причина) {",
     'у тренеров своего ваучерного пути нет'],
    ['вернуть кортам своё рисование QR', КТ,
     "    function showLimitModal(причина) {",
     "    function ctSvoyQR(коробка) {\n        return new QRCode(коробка, {});\n    }\n\n" +
     "    function showLimitModal(причина) {",
     'у кортов своего ваучерного пути нет'],

    /* 9: дом узнал о разделе */
    ['научить дом виду сущности', ДОМ,
     "    Б.завести = async function (о) {",
     "    Б.завести = async function (о) {\n        о.видСущности = о.видСущности || 'coach';",
     'дом ваучерного блока не знает о разделах'],

    /* 10: имя класса стало склейкой */
    ['склеить у тренеров имя класса из приставки', ТР,
     "            подложка: 'co-picker-overlay',",
     "            подложка: 'co' + '-picker-overlay',",
     'у тренеров имена классов ваучера стоят целиком'],

    /* 11: ветвь без QR снесена. ЯКОРЬ ПЕРЕЕХАЛ КУСКОМ 146 — надпись живёт
          в `Б.нарисоватьQR`, а не внутри окна ваучера; прувер сказал об
          этом сам: «якоря нет». */
    ['снести надпись «библиотеки QR нет»', ДОМ,
     "        коробка.textContent = KSLT_YAZYK.выбрать(\n" +
     "            'QR could not be drawn — show this screen at the venue',",
     "        if (false) KSLT_YAZYK.выбрать(\n" +
     "            'QR could not be drawn — show this screen at the venue',",
     'без библиотеки QR надпись есть'],

    /* 12: надпись снова одноязычная — присваивание ЕСТЬ, но не зовом языка */
    ['сделать надпись без QR одноязычной', ДОМ,
     "        коробка.textContent = KSLT_YAZYK.выбрать(",
     "        коробка.textContent = 'QR library not loaded'; if (false) KSLT_YAZYK.выбрать(",
     'надпись без QR говорит на языке страницы'],

    /* 13: рисование QR ушло из дома */
    ['отнять у дома рисование QR', ДОМ,
     "            new QRCode(коробка, {",
     "            window.КакНибудьПотом(коробка, {",
     'QR рисует дом, и рисует он его сам'],

    /* 13: экранирование убрано — пол пробит */
    ['снять в доме одно экранирование', ДОМ,
     "KSLT_экранировать(в.entity_name)",
     "(в.entity_name)",
     'данные из базы в разметке дома экранируются'],

    /* 14: крайние случаи ушли ИЗ ОТВЕТОВ подставного клиента, а не из
          ссылок сверху. Первая запись отката правила ссылки — и правило,
          переведённое на разбор ТЕЛА ответов, её не заметило. ОТКАТ ОБЯЗАН
          ЛОМАТЬ ТО, ЧТО ПРАВИЛО ЗАЩИЩАЕТ, а не то, что рядом лежит. */
    ['убрать из ответов стенда лимиты и отказ', СТ,
     "            if (сост === 'limit-active') return Promise.resolve({ data: { error: 'active_voucher_exists' }, error: null });",
     "            if (сост === 'udobnyy') return Promise.resolve({ data: { error: 'nothing' }, error: null });",
     'стенд показывает крайние случаи, а не удобные'],

    /* 16–17: кабинет снова строит своё (кусок 146) */
    ['вернуть кабинету свой адрес проверки', КАБ,
     "        var verifyUrl = KSLT_VAUCHER_BLOK.адресПроверки(token);",
     "        var verifyUrl = window.KSLT_SAYT.адрес + '/pages/verify.html?token=' + token;",
     'кабинет зовёт `адресПроверки` у дома 1 раз'],
    ['вернуть кабинету свой формат срока', КАБ,
     "        var expiresStr = KSLT_VAUCHER_BLOK.дата(voucher.expires_at, true);",
     "        var expiresStr = String(voucher.expires_at || '');",
     'кабинет зовёт `дата` у дома 3 раз'],
    ['убрать дом ваучера со страницы кабинета', СТРК,
     '    <script src="../js/kslt-vaucher-blok.js?v=2"></script>\n',
     '',
     'дом ваучерного блока стоит в кабинете раньше dashboard.js'],

    /* 15: стенд перестал гонять дом */
    ['отключить дом от стенда', СТ,
     '<script src="../js/kslt-vaucher-blok.js?v=2"></script>',
     '<script src="../js/kslt-vaucher-net.js?v=2"></script>',
     'стенд ваучерного блока на месте']
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
