/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ТАБЛО И ВАУЧЕРА ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает. Якорь держится на содержимом своего
 * блока, а не на положении и не на соседе.
 *
 * ПЕСОК ЗДЕСЬ БОЛЬШЕ ОБЫЧНОГО: сторож покрытия читает ВСЮ папку pages и
 * ВСЕ чекеры, поэтому в копию уезжают и они.
 *
 *   node tools/check-tablo-vaucher-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tokens.css', 
    'css/scoreboard.css', 'pages/scoreboard.html', 'js/scoreboard.js',
    'css/verify.css', 'pages/verify.html', 'pages/verify-en.html',
    'pages/verify-kg.html', 'js/verify.js',
    'js/courts.js', 'js/coaches.js', 'js/dashboard.js'
];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const ТАБ = 'css/scoreboard.css', СТРТ = 'pages/scoreboard.html', ДТ = 'js/scoreboard.js';
const ВАУ = 'css/verify.css', СТРВ = 'pages/verify.html', ДВ = 'js/verify.js';
const КОРТЫ = 'js/courts.js', ТРЕН = 'js/coaches.js', КАБ = 'js/dashboard.js';

const ОТКАТЫ = [

/* ── Табло ───────────────────────────────────────────────────────────── */

['вернуть табло английский lang', СТРТ,
 '<html lang="ru">', '<html lang="en">',
 'язык страницы табло совпадает с её содержимым'],

/* ЯКОРЬ ДЕРЖАЛСЯ ЗА НОМЕР ВЕРСИИ и падал от каждого её подъёма — на
   круге 19 ветки D (19.10) версия стала 3. Якорь перевязан на ОТНОШЕНИЕ:
   «версия есть», а не «версия равна двум». */
['снять версию со скрипта табло', СТРТ,
 '../js/scoreboard.js?v=', '../js/scoreboard.js"></script><!--',
 'скрипт табло подключён с версией'],

['отключить словарь живого матча от табло', СТРТ,
 '    <script src="../js/live-texts.js?v=1"></script>\n', '',
 'словарь живого матча подключён к табло'],

['вернуть лайм гейма числом', ТАБ,
 '.sb-game-val { color: var(--accent); }', '.sb-game-val { color: #CCFF00; }',
 'лайм в табло зовётся токеном, а не числом'],

['вернуть имени кегль 0.95rem', ТАБ,
 '    font-size: var(--fs-sm);\n    font-weight: var(--fw-bold);\n    line-height: var(--lh-tight);',
 '    font-size: 0.95rem;\n    font-weight: var(--fw-bold);\n    line-height: var(--lh-tight);',
 'имя на ступени шкалы и на лестнице межстрочного'],

['вернуть имени межстрочный normal', ТАБ,
 '    line-height: var(--lh-tight);\n    color: var(--text-primary);',
 '    line-height: normal;\n    color: var(--text-primary);',
 'имя на ступени шкалы и на лестнице межстрочного'],

['вернуть имени потолок 160', ТАБ,
 '    max-width: 320px;', '    max-width: 160px;',
 'имени отведено вдвое больше, чем было, и не меньше ширины счёта'],

['вернуть подачу эмодзи', ДТ,
 "var serveDot = '<span class=\"sb-serve\" aria-hidden=\"true\"></span>';",
 "var serveDot = '<span class=\"sb-serve\">\u{1F3BE}</span>';",
 'подача — точка, а не эмодзи'],

['вернуть точке подачи угловатость', ТАБ,
 '    height: 8px;\n    border-radius: var(--radius-full);',
 '    height: 8px;\n    border-radius: 2px;',
 'подача — точка, а не эмодзи'],

['оживить сборщик подписей колонок', ДТ,
 "        setsP1Html += '<div class=\"sb-set-val\">' + s.g1 + '</div>';",
 "        setsHeaderHtml += '<div class=\"sb-col-header\">S</div>';\n            setsP1Html += '<div class=\"sb-set-val\">' + s.g1 + '</div>';",
 'подписи колонок счёта не существует ни в js, ни в css'],

['убрать вызов перерыва из табло', ДТ,
 '                renderPause(res.data);\n', '',
 'причину перерыва на табло называет общий словарь'],

['вернуть табло молчание о перерыве целиком', ТАБ,
 '.sb-pause {', '.sb-pauza {',
 'причину перерыва на табло называет общий словарь'],

['завести табло свой словарь паузы', ДТ,
 "                  : наПаузе ? Т.пауза(m.pause_reason)",
 "                  : наПаузе ? 'ПАУЗА'",
 'своего словаря состояний у табло нет'],

['вернуть плашке перерыва свою высоту', ТАБ,
 '    height: 24px;\n    padding: 0 var(--space-2);\n    margin-bottom: var(--space-2);',
 '    height: 30px;\n    padding: 0 var(--space-2);\n    margin-bottom: var(--space-2);',
 'плашка перерыва стоит на геометрии Badge 27:53'],

['вернуть плашке перерыва разрядку 1px', ТАБ,
 '    letter-spacing: 0.5px;\n    text-transform: uppercase;\n}\n\n/* ── Логотипы',
 '    letter-spacing: 1px;\n    text-transform: uppercase;\n}\n\n/* ── Логотипы',
 'плашка перерыва стоит на геометрии Badge 27:53'],

['снять потолок ширины с обёртки табло', ТАБ,
 '    max-width: calc(100% - var(--space-10));', '    width: auto;',
 'доска не вылезает за узкий экран'],

['убрать правило телефона из табло', ТАБ,
 '    .sb-scores .sb-set-val:nth-last-child(n + 4) { display: none; }',
 '    .sb-board { min-width: 300px; }',
 'на телефоне ранние сеты уходят, а последний остаётся'],

['вернуть табло границу 480', ТАБ,
 '@media (max-width: 640px) {', '@media (max-width: 480px) {',
 'границ в табло ровно одна и та из системы'],

['размножить подложку накладки', ТАБ,
 '    background: var(--sb-podlozhka);', '    background: rgba(10, 10, 10, 0.88);',
 'подложка накладки объявлена один раз'],

['вернуть табло своё перечисление шрифтов', ТАБ,
 '    font-family: var(--font-sans);', "    font-family: 'Inter', sans-serif;",
 'семейство шрифта табло зовётся токеном'],

/* ── Ваучер ──────────────────────────────────────────────────────────── */

['вернуть странице ваучера градиент', ВАУ,
 '    background: var(--bg-base);\n}',
 '    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);\n}',
 'фон страницы ваучера — общий фон продукта'],

['вернуть метке строки rgba 0.45', ВАУ,
 '.vr-row-label { color: var(--text-muted); }',
 '.vr-row-label { color: rgba(255, 255, 255, 0.45); }',
 'метка строки взята с контрастной ступени'],

['вернуть красный числом', ВАУ,
 '    border-color: var(--danger);\n    background: var(--danger-subtle);',
 '    border-color: #ff4757;\n    background: var(--danger-subtle);',
 'красный в ваучере — токен, а не число'],

['вернуть кнопке высоту полями', ВАУ,
 '    height: var(--btn-h-lg);\n    padding: 0 var(--space-4);\n    background: var(--accent);',
 '    padding: 14px;\n    background: var(--accent);',
 'высота кнопки задана свойством со ступени, а не полями'],

['вернуть кнопке радиус 12', ВАУ,
 '    border-radius: var(--radius-full);\n    font-family: var(--font-sans);',
 '    border-radius: var(--radius-md);\n    font-family: var(--font-sans);',
 'кнопка несёт радиус и цвет текста компонента'],

['вернуть запертой кнопке 50%', ВАУ,
 '    opacity: 0.45;', '    opacity: 0.5;',
 'запертая кнопка гасится на 45%, как в компоненте'],

['вернуть полю PIN высоту 56', ВАУ,
 '    height: var(--btn-h-lg);\n    font-size: var(--fs-2xl);',
 '    height: 56px;\n    font-size: var(--fs-2xl);',
 'поле PIN стоит на ступени и на радиусе компонента'],

['вернуть карточке радиус 20', ВАУ,
 '    border-radius: var(--radius-lg);\n    padding: var(--space-6);',
 '    border-radius: 20px;\n    padding: var(--space-6);',
 'карточка стоит на геометрии Card 29:65'],

['вернуть плашке ваучера кегль 12', ВАУ,
 '    font-size: 11px;\n    font-weight: var(--fw-medium);\n    line-height: var(--lh-none);\n    letter-spacing: 0.5px;\n    text-transform: uppercase;\n    margin-bottom: var(--space-5);',
 '    font-size: var(--fs-xs);\n    font-weight: var(--fw-medium);\n    line-height: var(--lh-none);\n    letter-spacing: 0.5px;\n    text-transform: uppercase;\n    margin-bottom: var(--space-5);',
 'плашка ваучера стоит на геометрии Badge 27:53'],
['снять общий отказ от движения', 'css/tokens.css',
 '    *,\n    *::before,\n    *::after {',
 '    .db-mobile-tab,\n    .site-header {',
 'обе анимации ваучера знают про prefers-reduced-motion'],

['снять видимый фокус с кнопки', ВАУ,
 '.vr-confirm-btn:focus-visible {', '.vr-confirm-btn:focus {',
 'у поля и у кнопки есть свой видимый фокус'],

['вернуть ваучеру границу 480', ВАУ,
 '@media (max-width: 640px) {\n    .vr-card { padding: var(--space-5) var(--space-4); }',
 '@media (max-width: 480px) {\n    .vr-card { padding: var(--space-5) var(--space-4); }',
 'граница ваучера одна и та из системы'],

['вернуть мёртвый селектор логотипа', ВАУ,
 '.vr-header .logo {', '.vr-header .logo-text { font-size: var(--fs-xl); }\n\n.vr-header .logo {',
 'мёртвых селекторов логотипа в файле нет'],

['снять for у подписи поля PIN', ДВ,
 '<label class="vr-pin-label" for="vrPinInput">', '<label class="vr-pin-label">',
 'поле PIN подписано и связано с сообщением об ошибке'],

['снять role=alert с сообщения об ошибке', ДВ,
 'id="vrPinError" role="alert"', 'id="vrPinError"',
 'поле PIN подписано и связано с сообщением об ошибке'],

['вернуть автофокусу прокрутку', ДВ,
 'pinInput.focus({ preventScroll: true });', 'pinInput.focus();',
 'автофокус в поле PIN не утаскивает экран вниз'],

['вернуть короткому PIN молчание', ДВ,
 '                pinError.textContent = L.errorPinShort;\n', '',
 'короткий PIN получает слово, а не одну красную рамку'],

['вернуть отказу два довода вместо трёх', ДВ,
 'function showError(title, text, next) {', 'function showError(title, text) {',
 'каждый отказ говорит, что делать дальше'],

['вернуть техническое сообщение человеку', ДВ,
 "            showError(L.errorSystem, L.errorSystemText, L.nextRetry);\n            return;\n        }\n        card.innerHTML",
 "            showError('Error', 'Supabase not loaded');\n            return;\n        }\n        card.innerHTML",
 'техническое сообщение человеку не показывается'],

['вернуть дате ваучера двухходовку', ДВ,
 "var ЛОКАЛЬ = isEn ? 'en-US' : (isKg ? 'ky-KG' : 'ru-RU');",
 "var ЛОКАЛЬ = isEn ? 'en-US' : 'ru-RU';",
 'дата ваучера знает три языка, а не два'],

['вернуть инлайновое умолчание в разметку', ДВ,
 '\'<div class="vr-pin-error-msg" id="vrPinError" role="alert"></div>\'',
 '\'<div class="vr-pin-error-msg" id="vrPinError" role="alert" style="display:none;"></div>\'',
 'умолчание сообщения — свойство данных, а не разметки'],

/* якорь на имени, а не на номере версии: номер поднимается при правке */
['снять версию со стиля ваучера', СТРВ,
 '../css/verify.css?v=', '../css/verify.css?нет=',
 'стиль и скрипт ваучера подключены с версией на всех трёх языках'],

/* ЯКОРЬ ОБНОВЛЁН 17.10: адрес сайта уехал из строк в `window.KSLT_SAYT`
   (круг «адрес сайта»), и откат держался за написание, которого больше
   нет. Держимся за хвост, который живёт в этом месте постоянно. */
['вернуть кортам русский адрес ваучера', КОРТЫ,
 "window.KSLT_SAYT.адрес + '/pages/verify' + verifySuffix + '.html?token='",
 "'https://kslt.netlify.app/pages/verify.html?token='",
 'русского адреса ваучера в генераторах QR не осталось'],

['вернуть кабинету русский адрес ваучера', КАБ,
 "window.KSLT_SAYT.адрес + '/pages/verify' + verifySuffix + '.html?token='",
 "'https://kslt.netlify.app/pages/verify.html?token='",
 'русского адреса ваучера в генераторах QR не осталось'],

['завести четвёртое место, где строится адрес ваучера', ТРЕН,
 "        var verifyUrl = window.KSLT_SAYT.адрес + '/pages/verify' + verifySuffix + '.html?token=' + voucher.qr_token;",
 "        var verifyUrl = window.KSLT_SAYT.адрес + '/pages/verify' + verifySuffix + '.html?token=' + voucher.qr_token;\n        var verifyUrl2 = 'https://kslt.netlify.app/pages/verify.html?token=' + voucher.qr_token;",
 'мест, где строится адрес ваучера, ровно три — во всей папке js']

];

/* ── Песок ───────────────────────────────────────────────────────────── */

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-tablo-'));
['css', 'js', 'tools', 'pages'].forEach(д => fs.mkdirSync(path.join(песок, д), { recursive: true }));
/* Общий блок отказа от движения живёт в tokens.css, и правило читает
   его по соседству — без копии песочница не проходит сама по себе. */
fs.copyFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), path.join(песок, 'css', 'tokens.css'));

/* Сторож покрытия читает ВСЮ папку pages и ВСЕ чекеры — копируем их. */
fs.readdirSync(path.join(КОРЕНЬ, 'pages')).filter(ф => ф.endsWith('.html')).forEach(ф => {
    fs.copyFileSync(path.join(КОРЕНЬ, 'pages', ф), path.join(песок, 'pages', ф));
});
fs.readdirSync(path.join(КОРЕНЬ, 'tools')).filter(ф => /^check-.*\.js$/.test(ф)).forEach(ф => {
fs.copyFileSync(path.join(КОРЕНЬ, 'tools', 'dvizhenie.js'), path.join(песок, 'tools', 'dvizhenie.js'));
    fs.copyFileSync(path.join(КОРЕНЬ, 'tools', ф), path.join(песок, 'tools', ф));
});

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-tablo-vaucher.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-tablo-vaucher.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)   { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
