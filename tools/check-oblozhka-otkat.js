/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ОБЛОЖКИ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что оно
 * зелёное всегда. Каждое правило check-oblozhka.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 *
 * Работаем на КОПИИ. Оригиналы не трогаем вообще.
 *
 *   node tools/check-oblozhka-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-oblozhka.js'), 'utf8');

/* [имя, файл, что ищем, на что меняем, какое правило должно упасть] */
const ОТКАТЫ = [

['вернуть кегль обложки на доли ширины', 'css/tokens.css',
 '--fs-hero:     var(--fs-3xl);',
 '--fs-hero:     clamp(1.9rem, 4.4vw, 3.1rem);',
 '--fs-hero не на доле ширины'],

['вернуть подзаголовок обложки числом', 'css/tokens.css',
 '--fs-hero-sub: var(--fs-lg);',
 '--fs-hero-sub: 1.3rem;',
 'крутилка --fs-hero-sub заведена и стоит на ступени'],

['вернуть цифру обложки числом', 'css/tokens.css',
 '--fs-hero-num: var(--fs-3xl);',
 '--fs-hero-num: 2.5rem;',
 'крутилка --fs-hero-num заведена и стоит на ступени'],

['вернуть подпись цифры числом', 'css/tokens.css',
 '--fs-hero-cap: var(--fs-sm);',
 '--fs-hero-cap: 0.875rem;',
 'крутилка --fs-hero-cap заведена и стоит на ступени'],

['увести имя пола обложки', 'css/tokens.css',
 '--oblozhka-pol:        360px;',
 '--oblozhka-vysota:     360px;',
 '--oblozhka-pol заведён крутилкой'],

['увести имя воздуха обложки', 'css/tokens.css',
 '--oblozhka-vozduh-niz: var(--space-2);',
 '--oblozhka-niz-vozduha: var(--space-2);',
 '--oblozhka-vozduh и --oblozhka-vozduh-niz заведены'],

['вернуть выдуманную ступень пола на 992', 'css/tokens.css',
 '    --fs-hero:     var(--fs-2xl);  /* 32 */',
 '    --oblozhka-pol: 320px;\n    --fs-hero:     var(--fs-2xl);  /* 32 */',
 'пол обложки меняется ОДИН раз, на 640'],

['убрать ступень кегля на 992', 'css/tokens.css',
 '    --fs-hero:     var(--fs-2xl);  /* 32 */',
 '    /* ступень убрана */',
 'на ступени 992 объявлен --fs-hero'],

['убрать ступень подписи на 640', 'css/tokens.css',
 '    --fs-hero-cap: var(--fs-2xs);  /* 11 */',
 '    /* ступень убрана */',
 'на ступени 640 объявлен --fs-hero-cap'],

['вернуть пол на низком горизонтальном', 'css/tokens.css',
 '    --oblozhka-pol: 0px;',
 '    --oblozhka-pol: 275px;',
 'на низком горизонтальном пола нет вовсе'],

['снять вес с крутилки цифр', 'css/tokens.css',
 '.tournament-hero .tournament-hero-stats .hero-stat-value,',
 '.hero-stat-value,',
 'крутилка цифр записана весом выше общего правила'],

['снять вес с крутилки подписей', 'css/tokens.css',
 '.tournament-hero .tournament-hero-stats .hero-stat-label,',
 '.hero-stat-label,',
 'крутилка подписей записана тем же весом'],

['увести страницу турнира из общего правила', 'css/tokens.css',
 '.td-hero .td-hero-stats .hero-stat-value {',
 '.td-hero .td-hero-stats .hero-stat-znachenie {',
 'в том же правиле стоит и обзорная, и страница турнира'],

/* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ СВОЕГО БЛОКА. Голая строка clamp встречается в
   style.css ДВАЖДЫ — второй раз у .hero-stats .stat-value, другого понятия.
   Прувер поймал это сразу: «якорь встречается 2 раз». Берём вместе с соседней
   строкой селектора, которая у этого блока своя. */
['тронуть общее правило долями ширины', 'css/style.css',
 '.bo-hero-stats .hero-stat-value {\n        font-size: clamp(1.35rem, 6.4vw, 1.9rem);',
 '.bo-hero-stats .hero-stat-value {\n        font-size: var(--fs-hero-num);',
 'общее правило долями ширины НЕ тронуто'],

['вернуть обложке категории своё число высоты', 'css/tournaments.css',
 '    min-height: var(--oblozhka-pol);',
 '    min-height: 460px;',
 '.tournament-hero не держит своего числа высоты'],

['вернуть обложке категории свой воздух', 'css/tournaments.css',
 '    padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);',
 '    padding: var(--section-y) var(--pad-x) var(--section-y);',
 '.tournament-hero берёт воздух крутилками, одним объявлением'],

['вернуть заголовку категории clamp', 'css/tournaments.css',
 '    font-size: var(--fs-hero);',
 '    font-size: clamp(1.9rem, 4.4vw, 3.1rem);',
 'заголовок категории стоит на --fs-hero'],

['вернуть межстрочный заголовка числом', 'css/tournaments.css',
 '    line-height: var(--lh-tight);',
 '    line-height: 1.1;',
 'межстрочный заголовка — ступень, а не число'],

['вернуть вес заголовка числом', 'css/tournaments.css',
 '    font-weight: var(--fw-extrabold);\n    line-height: var(--lh-tight);',
 '    font-weight: 800;\n    line-height: var(--lh-tight);',
 'вес заголовка — из системы, а не числом'],

['вернуть подзаголовку категории clamp', 'css/tournaments.css',
 '    font-size: var(--fs-hero-sub);',
 '    font-size: clamp(1.05rem, 2.2vw, 1.3rem);',
 'подзаголовок категории на --fs-hero-sub'],

['вернуть цифру категории на ступень числом', 'css/tournaments.css',
 '    font-size: var(--fs-hero-num);',
 '    font-size: var(--fs-3xl);',
 'цифра обложки на --fs-hero-num'],

['вернуть подпись категории на --fs-sm', 'css/tournaments.css',
 '    font-size: var(--fs-hero-cap);',
 '    font-size: var(--fs-sm);',
 'подпись цифры на --fs-hero-cap'],

['вернуть пол и воздух в узкий медиазапрос', 'css/tournaments.css',
 '    .tournament-hero {\n        /* Пол и воздух пришли из tokens.css',
 '    .tournament-hero {\n        min-height: 275px;\n        /* Пол и воздух пришли из tokens.css',
 'в узком медиа обложка категории не возвращает себе пол и воздух'],


['вернуть обложке турнира своё число высоты', 'css/tournament-detail.css',
 '    min-height: var(--oblozhka-pol);\n    display: flex;\n    align-items: flex-end;',
 '    min-height: 300px;\n    display: flex;\n    align-items: flex-end;',
 '.td-hero не держит своего числа высоты'],

['вернуть заголовку турнира clamp', 'css/tournament-detail.css',
 '    font-size: var(--fs-hero);\n    font-weight: var(--fw-extrabold);\n    color: var(--text-primary);',
 '    font-size: clamp(1.8rem, 4vw, 3rem);\n    font-weight: var(--fw-extrabold);\n    color: var(--text-primary);',
 'заголовок турнира стоит на --fs-hero'],

['вернуть межстрочный заголовка турнира числом', 'css/tournament-detail.css',
 '    margin-bottom: var(--space-sm);\n    line-height: var(--lh-tight);',
 '    margin-bottom: var(--space-sm);\n    line-height: 1.1;',
 'межстрочный заголовка турнира — ступень'],

['вернуть второе объявление кегля заголовка турнира', 'css/tournament-detail.css',
 '    .td-hero-content h1 {\n        margin-bottom: var(--space-3);',
 '    .td-hero-content h1 {\n        font-size: var(--fs-lg);\n        margin-bottom: var(--space-3);',
 'кегль заголовка турнира объявлен ОДИН раз'],

['вернуть цифрам турнира собственный размер долями ширины', 'css/tournament-detail.css',
 '        --fs-hero-num: var(--fs-md);',
 '        --fs-hero-num: clamp(1rem, 4.4vw, 1.35rem);',
 'исключение страницы турнира выражено КРУТИЛКОЙ, а не своим размером'],


['снять с вкладки настоящую высоту', 'css/tournament-detail.css',
 '    min-height: var(--btn-h-md);\n    display: inline-flex;',
 '    display: inline-flex;',
 'вкладка не ниже ступени кнопки'],

['вернуть вкладке прозрачный слой вместо высоты', 'css/tournament-detail.css',
 '.td-tab:hover {',
 '.td-tab::after { content: \'\'; position: absolute; height: var(--btn-h-md); }\n.td-tab:hover {',
 'цель вкладки задана ВЫСОТОЙ, а не прозрачным слоем'],

/* ЯКОРЬ ДЕРЖИТСЯ ЗА СВОЙ БЛОК, А НЕ ЗА ДВЕ СТРОКИ, КОТОРЫЕ МОГУТ ПОВТОРИТЬСЯ.
   05.10 прувер уронил этот откат: «якорь встречается 2 раз». Пары
   `line-height: var(--lh-none);` + `cursor: pointer;` хватало, пока она была
   одна на файл; у новой полосы «Сыгранные» вышла ровно такая же пара, и
   откат перестал что-либо доказывать. Правило не менялось — перевязан
   якорь: к нему добавлен вес, который принадлежит ИМЕННО вкладке. */
['вернуть межстрочный вкладки на normal', 'css/tournament-detail.css',
 '    font-weight: 500;\n    /* ОДНА СТРОКА, ВЫСОТУ ЗАДАЮТ ОТСТУПЫ. Было `normal` на всех пяти видах —\n       оно считается ОТ МЕТРИК ШРИФТА, и у разных людей выходит своё число. */\n    line-height: var(--lh-none);',
 '    font-weight: 500;\n    line-height: normal;',
 'межстрочный вкладки — ступень, а не normal'],

/* ОТКАТ ОБЯЗАН ВЕРНУТЬ ЗНАЧЕНИЕ, А НЕ ПЕРЕПИСАТЬ КОММЕНТАРИЙ. Первая попытка
   меняла только текст пояснения — правило, понятно, не падало: «откат прошёл
   НЕЗАМЕЧЕННЫМ». Вторая берёт само объявление вместе с соседней строкой,
   которая есть только у полосы вкладок: у самой вкладки min-height такой же. */
['снять пол с полосы вкладок', 'css/tournament-detail.css',
 '    min-height: var(--btn-h-md);\n    /* Override global nav styles */',
 '    /* Override global nav styles */',
 'полоса вкладок не ниже цели, которую несёт'],

['вернуть отступы вкладки числами', 'css/tournament-detail.css',
 '    padding: var(--space-3) var(--space-6);',
 '    padding: 16px 24px;',
 'отступы вкладки стоят на шкале'],


['вернуть шапку таблицы группы на тусклую краску', 'css/tournament-detail.css',
 '.td-group-table thead th {\n    background: var(--bg-elevated);\n    color: var(--text-muted);',
 '.td-group-table thead th {\n    background: var(--bg-elevated);\n    color: var(--text-dim);',
 'шапка group не на --text-dim'],

['притушить саму краску --text-muted', 'css/tokens.css',
 '--text-muted:     var(--alpha-white-50);',
 '--text-muted:     var(--alpha-white-35);',
 '--text-muted не опущен ниже половины'],

['убрать экран «турнир не найден»', 'js/tournament-detail.js',
 'function renderNotFoundPage() {',
 'function renderNotFoundPageOtkl() {',
 'экран «турнир не найден» существует'],

['прятать разделы без их заголовков', 'js/tournament-detail.js',
 "querySelectorAll('.td-section, .td-section-header')",
 "querySelectorAll('.td-section')",
 'тело страницы прячется вместе с ЗАГОЛОВКАМИ разделов'],

['решать экран по ошибке базы, а не по сессии', 'js/tournament-detail.js',
 'if (вошёл) renderNotFoundPage(); else renderLockedPage(id);',
 'renderLockedPage(id);',
 'какой экран показать, решает СЕССИЯ, а не ошибка базы'],

['увести кыргызскую подпись «не найден»', 'js/tournament-detail.js',
 "title: 'Мелдеш табылган жок',",
 "title: 'Tournament not found',",
 'у экрана «не найден» есть подпись «Мелдеш табылган жок»'],

['вернуть кириллицу в английский титул', 'js/tournament-detail.js',
 "(isEn || isKg ? 'KSLT' : 'КСЛТ')",
 "('КСЛТ')",
 'титул «не найден» латиницей на английской и кыргызской'],

['вернуть отступ дороги назад инлайном', 'css/tournament-detail.css',
 '.td-notfound-back {\n    margin-top: var(--space-4);',
 '.td-notfound-back {\n    margin-top: 16px;',
 'дорога назад на экране «не найден» отступает ступенью, а не инлайном'],

];

/* ── прогон ──────────────────────────────────────────────────────────────── */

const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-oblozhka-'));
const копия = (отн) => {
    const dst = path.join(ВРЕМ, отн);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(КОРЕНЬ, отн), dst);
};
['css/tokens.css', 'css/tournaments.css', 'css/style.css', 'css/tournaments-overview.css', 'css/tournament-detail.css', 'js/tournament-detail.js'].forEach(копия);
fs.readdirSync(path.join(КОРЕНЬ, 'pages')).filter(ф => ф.endsWith('.html')).forEach(ф => копия('pages/' + ф));
fs.readdirSync(КОРЕНЬ).filter(ф => /^index.*\.html$/.test(ф)).forEach(копия);
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.writeFileSync(path.join(ВРЕМ, 'tools', 'check-oblozhka.js'), ПРАВИЛО);

const исходник = {};
['css/tokens.css', 'css/tournaments.css', 'css/style.css', 'css/tournament-detail.css', 'js/tournament-detail.js'].forEach(ф => {
    исходник[ф] = fs.readFileSync(path.join(ВРЕМ, ф), 'utf8');
});

const прогнать = () => {
    try {
        execFileSync('node', [path.join(ВРЕМ, 'tools', 'check-oblozhka.js')], { encoding: 'utf8' });
        return '';
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
};

console.log('');
const чисто = прогнать();
if (чисто !== '') {
    console.log('  НЕ ТАК  правила не держатся на НЕТРОНУТОЙ копии — прувер проверять нечего');
    console.log(чисто);
    process.exit(1);
}

let беды = 0;
ОТКАТЫ.forEach(([имя, файл, ищем, меняем, ждём], i) => {
    const было = исходник[файл];
    const сколько = было.split(ищем).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + (i + 1) + '. ' + имя);
        console.log('      якорь встречается ' + сколько + ' раз, а должен один — откат ничего не доказывает');
        беды++;
        return;
    }
    fs.writeFileSync(path.join(ВРЕМ, файл), было.replace(ищем, меняем));
    const вывод = прогнать();
    fs.writeFileSync(path.join(ВРЕМ, файл), было);

    if (вывод === '') {
        console.log('  ✗ ' + (i + 1) + '. ' + имя);
        console.log('      откат прошёл НЕЗАМЕЧЕННЫМ — правило «' + ждём + '» не держит');
        беды++;
    } else if (!вывод.includes(ждём)) {
        console.log('  ✗ ' + (i + 1) + '. ' + имя);
        console.log('      упало, но НЕ ТО: ждали «' + ждём + '»');
        console.log('      упало: ' + (вывод.match(/✗ [^\n]+/g) || []).join(' | '));
        беды++;
    } else {
        console.log('  ок ' + (i + 1) + '. ' + имя + '  →  упало «' + ждём + '»');
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (беды === 0) {
    console.log('  ок      обложка раздела: все ' + ОТКАТЫ.length + ' откатов уронили своё правило');
    console.log('');
    process.exit(0);
}
console.log('  НЕ ТАК  обложка раздела: ' + беды + ' откатов из ' + ОТКАТЫ.length + ' ничего не доказали');
console.log('');
process.exit(1);
