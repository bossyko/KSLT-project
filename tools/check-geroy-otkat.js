/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило может быть написано так,
 * что оно зелёное всегда. Поэтому каждое правило check-geroy.js проверяем
 * обратным ходом: возвращаем в CSS прежнее значение — и правило ОБЯЗАНО
 * упасть. Не упало — значит оно ничего не держит, и его надо переписать.
 *
 * Работаем на КОПИИ: оригинал css/style.css не трогаем вообще.
 *
 *   node tools/check-geroy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ИСХОДНЫЙ = fs.readFileSync(path.join(КОРЕНЬ, 'css', 'style.css'), 'utf8');
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-geroy.js'), 'utf8');

/* [имя отката, что ищем, на что меняем, какое правило должно упасть] */
const ОТКАТЫ = [
    ['вернуть центровку героя',
     'justify-content: flex-start;\n    /* ОТБИВКА ШАПКИ',
     'justify-content: center;\n    /* ОТБИВКА ШАПКИ',
     '.hero течёт сверху вниз'],

    ['вернуть прежнюю отбивку шапки',
     'padding: calc(var(--header-h) + var(--hero-vozduh)) var(--pad-x) var(--space-8);',
     'padding: clamp(40px, 8vh, 96px) var(--pad-x) clamp(12px, 2vh, 20px);',
     'отбивку шапки ставит ОДНО объявление .hero'],

    ['вернуть второе объявление .hero с padding',
     '    .hero-content {\n        width: 95%;\n    }',
     '    .hero {\n        padding: clamp(12px, 2vh, 16px) var(--pad-x) 0;\n    }\n\n' +
     '    .hero-content {\n        width: 95%;\n    }',
     'у .hero ровно пять объявлений, и все известны'],

    ['вернуть общий gap колонке',
     '    gap: 0;\n    flex: 1;',
     '    gap: clamp(6px, 1.5vh, 16px);\n    flex: 1;',
     'у колонки героя gap: 0'],

    ['вернуть второй gap на 768',
     '    .hero-content {\n        width: 100%;\n    }',
     '    .hero-content {\n        width: 100%;\n        gap: clamp(4px, 1vh, 10px);\n    }',
     'gap у .hero-content больше нигде не задаётся'],

    ['вернуть 26px слогану',
     '    margin-top: var(--hero-shag);\n    animation: fadeInUp 0.6s ease 0.15s both;',
     '    margin-top: 26px;\n    animation: fadeInUp 0.6s ease 0.15s both;',
     'шаг у .hero-slogan = var(--hero-shag) (24)'],

    ['вернуть 2px подзаголовку',
     '    max-width: 580px;\n    margin-top: var(--space-3);',
     '    max-width: 580px;\n    margin-top: 2px;',
     'шаг у .hero-subtitle = var(--space-3) (12)'],

    ['вернуть медиазапрос на main:has(.hero)',
     'main:has(.hero) {\n    padding-top: 0;\n}',
     '@media (max-width: 768px), (min-width: 993px) {\n    main:has(.hero) {\n        padding-top: 0;\n    }\n}',
     'main:has(.hero) — без медиазапроса'],

    ['вернуть прежний padding полосе спонсоров',
     'padding: var(--space-8) 0 0;',
     'padding: clamp(8px, 1.5vh, 16px) 0 clamp(8px, 1vh, 12px);',
     'полоса спонсоров отбита сверху на 32, снизу 0'],

    ['вернуть clamp заголовку «Спонсоры»',
     '    margin-bottom: var(--space-2);\n}',
     '    margin-bottom: clamp(8px, 1vh, 14px);\n}',
     'между «Спонсоры» и лентой — var(--space-2) (8)'],

    ['вернуть ленте нижний margin в герое',
     '.hero-sponsors-section .sponsors-carousel-infinite {\n    margin-bottom: 0;\n    padding-bottom: 0;\n}',
     '.hero-sponsors-section .sponsors-carousel-infinite {\n    margin-bottom: var(--space-xl);\n    padding-bottom: 0;\n}',
     'лента внутри героя не отбивается снизу ни margin, ни padding'],

    ['вернуть ленте внутренний padding снизу — ТОТ, что я проглядел',
     '.hero-sponsors-section .sponsors-carousel-infinite {\n    margin-bottom: 0;\n    padding-bottom: 0;\n}',
     '.hero-sponsors-section .sponsors-carousel-infinite {\n    margin-bottom: 0;\n}',
     'лента внутри героя не отбивается снизу ни margin, ни padding'],

    /* ---- телефон, вариант принят 22.09 ---- */

    ['вернуть цифрам горизонтальную прокрутку',
     '        align-self: stretch;\n        display: flex;\n        flex-wrap: wrap;\n        justify-content: center;',
     '        align-self: stretch;\n        display: flex;\n        flex-wrap: nowrap;\n        overflow-x: auto;\n        justify-content: center;',
     'на телефоне ряд цифр переносится, а не прокручивается'],

    ['сбить ширину карточки цифры с трети',
     '        flex: 0 0 calc(33.333% - 6px);',
     '        flex: 0 0 auto;',
     'карточка цифры занимает ровно треть ряда'],

    ['убрать растяжение у ряда цифр',
     '        align-self: stretch;\n        display: flex;\n        flex-wrap: wrap;',
     '        display: flex;\n        flex-wrap: wrap;',
     'ряд цифр растянут явно (align-self: stretch)'],

    ['вернуть размеры цифр на чужие классы',
     '    .hero-stats .stat-value {',
     '    .hero-stats .hero-stat-value {',
     'мобильные размеры цифр заданы для классов ГЛАВНОЙ'],

    ['снять у полосы спонсоров свой фон',
     '        padding: var(--space-8) var(--pad-x);\n        background: var(--bg);',
     '        padding: var(--space-8) var(--pad-x);',
     'полоса спонсоров на телефоне — своя поверхность, а не фото'],

    ['убрать воздух над швом',
     '        margin-top: var(--space-8);\n        padding: var(--space-8) var(--pad-x);',
     '        margin-top: auto;\n        padding: var(--space-8) var(--pad-x);',
     'над швом есть воздух'],

    ['убрать растяжение у полосы спонсоров',
     '        align-self: stretch;\n        width: auto;',
     '        width: auto;',
     'полоса спонсоров растянута явно'],

    /* ---- телефон боком, вариант B ---- */

    ['снести блок короткого экрана целиком',
     '@media (any-pointer: coarse) and (max-height: 820px) {',
     '@media (any-pointer: coarse) and (max-height: 9999px) and (min-height: 9998px) {',
     'у короткого экрана есть свой блок'],

    ['завести на коротком экране второй padding у .hero',
     '        --hero-vozduh: var(--space-6);   /* 40 -> 24 */',
     '        padding-top: 88px;',
     'короткий экран крутит крутилки, а не заводит второй padding'],

    ['вернуть ленте прежнюю отбивку на тесном экране',
     /* якорь включает хвост комментария: тот же блок стоит и в max-width: 768px,
        и без хвоста замена правила бы не то место — поймано прувером 22.09 */
     'не доезжает. */\n    .hero-sponsors-section .sponsors-carousel-infinite {\n        padding-top: var(--space-4);',
     'не доезжает. */\n    .hero-sponsors-section .sponsors-carousel-infinite {\n        padding-top: var(--space-lg);',
     'на тесном экране лента отбита сверху на 16, а не на 40'],

    ['вернуть расшифровку на коротком экране',
     '    .hero-full {\n        display: none;\n    }',
     '    .hero-full {\n        opacity: 0.9;\n    }',
     'расшифровку аббревиатуры на коротком экране не показываем'],

    ['вернуть шаг 16 туда, где сгиб режет цифры',
     '@media (any-pointer: coarse) and (max-height: 440px) {\n    .hero-stats {\n        margin-top: var(--space-8);\n    }\n}',
     '@media (any-pointer: coarse) and (max-height: 440px) {\n    .hero-stats {\n        margin-top: var(--space-4);\n    }\n}',
     'на самых коротких экранах сгиб не режет цифры'],

    /* ---- широкий невысокий экран: ноутбук ---- */

    ['снести ноутбучный слой целиком',
     '@media (min-width: 993px) and (max-height: 880px) {',
     '@media (min-width: 993px) and (max-height: 1px) {',
     'у широкого невысокого экрана есть свой слой, и он трогает только воздух'],

    ['спрятать содержимое вместо воздуха на ноутбуке',
     '        --hero-shag:   var(--space-4);   /* 24 -> 16 */\n    }\n\n    .hero-sponsors-section',
     '        --hero-shag:   var(--space-4);   /* 24 -> 16 */\n    }\n\n    .hero-full { display: none; }\n\n    .hero-sponsors-section',
     'у широкого невысокого экрана есть свой слой, и он трогает только воздух'],

    ['поменять слои местами — сенсорный выше ноутбучного',
     '@media (min-width: 993px) and (max-height: 880px) {',
     '@media (any-pointer: coarse) and (max-height: 820px) { .hero { --hero-vozduh: var(--space-6); } }\n\n@media (min-width: 993px) and (max-height: 880px) {',
     'сенсорный слой идёт ПОСЛЕ ноутбучного'],

    ['вернуть сырой px в отбивку',
     '.hero-title {\n    margin-top: var(--space-3);',
     '.hero-title {\n    margin-top: 12px;',
     'в отбивках первого экрана нет сырых пикселей']
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'geroy-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-geroy.js'), ПРАВИЛО);

function прогон(css) {
    fs.writeFileSync(path.join(песок, 'css', 'style.css'), css);
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-geroy.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) {
        return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') };
    }
}

console.log('');
const исход = прогон(ИСХОДНЫЙ);
if (исход.упало) {
    console.log('  НЕ ТАК  исходный style.css сам по себе не проходит check-geroy.js.');
    console.log('          Сначала почини код, потом доказывай откатом.');
    console.log(исход.вывод);
    process.exit(1);
}
console.log('  база    исходный css правило проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(function (о) {
    const имя = о[0], что = о[1], на = о[2], ждём = о[3];
    const сколько = ИСХОДНЫЙ.split(что).length - 1;
    if (сколько === 0) {
        console.log('  ? ' + имя);
        console.log('      откат не применился: в css нет якоря. Правило НЕ доказано.');
        плохих++;
        return;
    }
    /* ЯКОРЬ ОБЯЗАН БЫТЬ ОДИН.
       22.09 откат «вернуть цифрам горизонтальную прокрутку» отчитался, что
       правило ничего не держит. На деле правило было в порядке: якорь
       встречался в файле дважды, replace правил ПЕРВОЕ вхождение — не то
       место, — телефонный блок оставался нетронутым, и проверка честно
       проходила. Неуникальный якорь доказывает не правило, а случайность. */
    if (сколько > 1) {
        console.log('  ? ' + имя);
        console.log('      якорь встречается ' + сколько + ' раза — откат правит не то место.');
        console.log('      Расширь якорь соседними строками, пока он не станет один.');
        плохих++;
        return;
    }
    const р = прогон(ИСХОДНЫЙ.replace(что, на));
    if (!р.упало) {
        console.log('  ✗ ' + имя);
        console.log('      правило не упало — значит оно ничего не держит');
        плохих++;
    } else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя);
        console.log('      упало, но ДРУГОЕ правило. Ждали: ' + ждём);
        плохих++;
    } else {
        console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
    console.log('');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригинал css/style.css не изменялся — работа шла на копии');
console.log('');
