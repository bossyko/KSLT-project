/**
 * ОБЩИЙ СЛОЙ КАБИНЕТА — 11.10.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ВЫСОТУ ПЛИТКИ РАЗДЕЛА. В файле написано «min-height 52, а на коротком
 *     виде 44». Сколько плитка занимает НА САМОМ ДЕЛЕ — решает сумма полей,
 *     значка и подписи: замер 11.10 дал 60 при трёх верных числах в файле;
 *   • ПОДПИСЬ ПЛИТКИ В ОДНУ СТРОКУ. Самая длинная — киргизское «Менин
 *     оюндарым», 14 знаков. Влезла ли она в 114 на телефоне, видно только
 *     на живой странице, и только на своём языке;
 *   • ЦЕЛЬ НАЖАТИЯ. Чип красится 27 в высоту, а нажимается 44 прозрачным
 *     слоем. Файл покажет правило, живая страница — настоящий прямоугольник;
 *   • ВИДИМЫЙ ФОКУС. Правило в css есть, а рисует ли браузер контур —
 *     решает живой focus();
 *   • ОКНО. Оно открывается нажатием, в списке элементов его нет: имя для
 *     диктора, фокус на себе при открытии, ловушка Tab, возврат фокуса;
 *   • ЛЕСТНИЦУ ТЕКСТА. Кегли и межстрочные складываются из каскада пяти
 *     файлов, и мимо шкалы уезжает не объявление, а ВЫЧИСЛЕННОЕ значение;
 *   • БРАУЗЕРНЫЙ alert(). Что его не зовут, в файле видно. Что его не
 *     зовут В ЖИЗНИ, показывает только подменённый window.alert.
 *
 * ПОРОГ: кабинет не открылся или в нём нет ни одного раздела — проверка
 * ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

test.use({ storageState: playerState });

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];
const ШКАЛА_КНОПОК = [28, 36, 44, 52];
const СИСТЕМА_ВЕСОВ = [400, 500, 600, 700];
const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];

/** Цель 44 — своей высотой либо прозрачным слоем. */
const ЦЕЛЬ_44 = ['.db-btn', '.db-sidebar-link', '.db-avatar-btn', '.db-subsection-toggle',
    '.db-loy-redeem', '.db-modal-close'];
const ЦЕЛЬ_СЛОЕМ = ['.db-chip', '.db-notif-all-read', '.db-choice', '.db-btn-sm',
    '.db-tg-off', '.db-pw-eye'];

/**
 * ПОЗДРАВЛЕНИЕ С ДОСТИЖЕНИЕМ ЗАКРЫВАЕТСЯ ЕГО ЖЕ КНОПКОЙ.
 *
 * Прогон 11.10 уронил десять проверок: `.ach-overlay.show` перехватывал
 * нажатия (`js/badge-celebration.js:76`). Оно показывается, пока в базе у
 * игрока есть достижения с пустым `seen_at`, и гасит их `mark_badges_seen()`
 * — а в тестовом проекте выложена одна функция из тридцати трёх, так что
 * отметка не встаёт и окно всплывает КАЖДЫЙ раз.
 *
 * Не подменяем продукт и не прячем окно стилем: нажимаем его кнопку, как
 * нажал бы человек, и ждём, пока оно само уйдёт. Очередь может быть длинной
 * — по достижению на нажатие.
 */
async function погаситьПоздравление(page) {
    const окно = page.locator('.ach-overlay.show');
    for (let и = 0; и < 20; и++) {
        if (!(await окно.count()) || !(await окно.first().isVisible())) return;
        const кнопка = page.locator('.ach-overlay .ach-btn');
        if (!(await кнопка.count())) return;
        await кнопка.first().click({ force: true });
        await page.waitForTimeout(250);
    }
}

/**
 * КТО ПЕРЕКРЫВАЕТ ЭКРАН — СПРАШИВАЕМ ПРЯМО, А НЕ ЖДЁМ ТАЙМАУТА.
 *
 * Два прогона 11.10 ушли в тридцатисекундный таймаут `locator.click`, и оба
 * раза виновником была накладка поверх кабинета — сначала окно знакомства,
 * потом поздравление с достижением. Имя виновника лежало в следе, а не в
 * отчёте, и за ним приходилось лезть в trace.zip.
 *
 * Эта проверка называет его вслух и падает сразу: берём точку, куда
 * собираемся нажать, и спрашиваем у браузера, КТО там сверху.
 */
async function ктоСверху(page, цель) {
    const к = await цель.boundingBox();
    if (!к) return null;
    return page.evaluate(([x, y]) => {
        const э = document.elementFromPoint(x, y);
        if (!э) return null;
        const пути = [];
        for (let у = э; у && у !== document.body; у = у.parentElement) {
            пути.push(у.tagName.toLowerCase() + (у.className ? '.' + String(у.className).trim().split(/\s+/).join('.') : ''));
        }
        return пути.slice(0, 3).join(' < ');
    }, [к.x + к.width / 2, к.y + к.height / 2]);
}

/** Нажать, назвав перекрывшего, если нажатие не проходит. */
async function нажать(page, цель, имя) {
    const сверху = await ктоСверху(page, цель);
    try {
        await цель.click({ timeout: 5000 });
    } catch (e) {
        throw new Error('нажатие по «' + имя + '» не прошло: сверху ' +
            (сверху || 'неизвестно что') + '. Это накладка поверх кабинета, ' +
            'и она должна гаситься до проверки, а не ждать таймаута');
    }
}

async function открыть(page, хвост) {
    // ALERT ПОДМЕНЯЕТСЯ ДО ЗАГРУЗКИ: иначе первый же зов успеет пройти и
    // остановить страницу до того, как подмена встанет
    await page.addInitScript(() => {
        window.__алертов = 0;
        window.alert = function () { window.__алертов++; };
        /* ОКНО ЗНАКОМСТВА ЗАКРЫВАЕТ СОБОЙ ВЕСЬ КАБИНЕТ. Прогон 11.10 уронил
           двенадцать проверок подряд: `.db-onboarding-overlay` перехватывал
           нажатия, и клавиша Tab ходила по нему, а не по разделам. Оно
           показывается ровно один раз — пока в хранилище нет отметки
           (js/dashboard.js:1034), и у подставной сессии её не было, а у
           живого человека она есть после первого входа. Ставим отметку до
           загрузки: окно знакомства — отдельный кусок, и этот файл не о нём. */
        try { localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
    });
    await page.goto('/pages/dashboard' + хвост + '.html');
    await page.waitForLoadState('networkidle');
    await погаситьПоздравление(page);
    const разделов = await page.locator('.db-section').count();
    expect(разделов, 'ПОРОГ: кабинет не открылся — ни одного раздела на странице')
        .toBeGreaterThan(0);
}

/* ══════════════════════════════════════════════════════════════════════
   1. ПЛИТКА РАЗДЕЛА
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('плитка раздела стоит на ступени шкалы кнопок · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост);
        const { width: ш, height: в } = page.viewportSize();

        if (ш > 992) {
            // На широких видах разделы живут в боковом меню, плиток нет
            const видна = await page.locator('.db-mobile-tabs').isVisible();
            expect(видна, 'на виде ' + ш + 'x' + в + ' плитки разделов должны быть скрыты')
                .toBe(false);
            const меню = page.locator('.db-sidebar-link').first();
            const к = await меню.boundingBox();
            expect(Math.round(к.height),
                'ссылка бокового меню мимо шкалы кнопок на ' + ш + 'x' + в)
                .toBeGreaterThanOrEqual(44);
            return;
        }

        const плитки = page.locator('.db-mobile-tab');
        const сколько = await плитки.count();
        expect(сколько, 'ПОРОГ: на узком виде не нарисовано ни одной плитки раздела')
            .toBeGreaterThan(0);

        const ждём = в <= 480 ? 44 : 52;
        for (let и = 0; и < сколько; и++) {
            const к = await плитки.nth(и).boundingBox();
            expect(Math.round(к.height),
                'плитка ' + и + ' на ' + ш + 'x' + в + ': высота мимо ступени ' + ждём)
                .toBe(ждём);
            expect(ШКАЛА_КНОПОК).toContain(Math.round(к.height));
        }
    });

    test('подпись плитки раздела держится в одну строку · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост);
        const { width: ш } = page.viewportSize();
        if (ш > 992) { test.skip(true, 'плиток на широком виде нет по построению'); return; }

        const беды = await page.evaluate(() => {
            const плохо = [];
            document.querySelectorAll('.db-mobile-tab-label').forEach(п => {
                const высотаСтроки = parseFloat(getComputedStyle(п).lineHeight) ||
                                     parseFloat(getComputedStyle(п).fontSize);
                const строк = Math.round(п.getBoundingClientRect().height / высотаСтроки);
                if (строк > 1 || п.scrollWidth > п.clientWidth + 1) {
                    плохо.push((п.textContent || '').trim() + ': строк ' + строк +
                        ', просит ' + п.scrollWidth + ' при ' + п.clientWidth);
                }
            });
            return плохо;
        });
        expect(беды, 'подпись плитки переносится или обрезается: ' + беды.join(' · '))
            .toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   2. ЦЕЛИ НАЖАТИЯ И ВИДИМЫЙ ФОКУС
   ══════════════════════════════════════════════════════════════════════ */
test('у каждого нажимаемого места цель не меньше 44', async ({ page }) => {
    await открыть(page, '');
    const беды = await page.evaluate(({ своей, слоем }) => {
        const плохо = [];
        const видно = э => {
            const к = э.getBoundingClientRect();
            return к.width > 0 && к.height > 0;
        };
        своей.forEach(кл => {
            document.querySelectorAll(кл).forEach(э => {
                if (!видно(э)) return;
                const h = Math.round(э.getBoundingClientRect().height);
                if (h < 44) плохо.push(кл + ' красится и нажимается ' + h);
            });
        });
        слоем.forEach(кл => {
            document.querySelectorAll(кл).forEach(э => {
                if (!видно(э)) return;
                const слой = getComputedStyle(э, '::after');
                const мw = parseFloat(слой.minWidth) || 0;
                const мh = parseFloat(слой.minHeight) || 0;
                if (мw < 44 || мh < 44) {
                    плохо.push(кл + ' без слоя цели: ' + мw + 'x' + мh);
                }
            });
        });
        return плохо;
    }, { своей: ЦЕЛЬ_44, слоем: ЦЕЛЬ_СЛОЕМ });
    expect(беды, 'цели нажатия ниже 44: ' + беды.join(' · ')).toEqual([]);
});

test('фокус виден на том, до чего доходит клавиша Tab', async ({ page }) => {
    await открыть(page, '');

    /* ПРОХОДИМ КЛАВИШЕЙ, А НЕ ВЫЗОВОМ focus(). Первая редакция вызывала
       element.focus() — и два класса из четырнадцати показали «3px none»:
       `:focus-visible` в Chrome НЕ совпадает на программный фокус, он для
       клавиатуры. То есть проверка показывала беду там, где её нет, и
       молчала бы там, где есть. Клавиша Tab — настоящее событие, и
       `:focus-visible` на ней совпадает. Заодно это проверяет и порядок
       обхода: до чего клавиша не доходит, того для клавиатуры нет. */
    const ждём = ЦЕЛЬ_44.concat(ЦЕЛЬ_СЛОЕМ).concat(['.db-mobile-tab', '.db-field-input'])
        .map(к => к.slice(1));

    await погаситьПоздравление(page);
    /* Накладок у кабинета три, и каждая приходит из своего файла: окно
       знакомства (js/dashboard.js:1066), поздравление с достижением
       (js/badge-celebration.js:76) и восстановление удаляемого аккаунта
       (js/account-restore.js:65). Проверяем все три поимённо — список,
       который ищет «что-нибудь с overlay», молчит ровно тогда, когда
       появляется четвёртая. */
    const накладка = page.locator(
        '.ach-overlay.show, .db-onboarding-overlay.visible, .ar-overlay');
    expect(await накладка.count(),
        'накладка поверх кабинета осталась на экране — обход с клавиатуры пойдёт по ней')
        .toBe(0);
    /* ОБХОДИМ ВСЕ РАЗДЕЛЫ, А НЕ ОДИН. Первая редакция шла по стартовому
       разделу и дошла до ДВУХ нажимаемых мест из четырнадцати: у пустого
       аккаунта в «Моих играх» нет ни чипа, ни поля ввода, ни кнопки обмена
       — они живут в уведомлениях, профиле, настройках и баллах. Проверка
       при этом выглядела строгой, а проверяла два класса. */
    const разделы = await page.evaluate(() =>
        [...new Set([...document.querySelectorAll('[data-tab]')]
            .map(a => a.getAttribute('data-tab')))]);

    const встречено = new Set();
    const беды = [];
    for (const раздел of разделы) {
      await page.evaluate(к => { window.location.hash = к; }, раздел);
      await page.waitForTimeout(600);
      await погаситьПоздравление(page);
      await page.locator('body').click({ position: { x: 2, y: 2 } });
      for (let шаг = 0; шаг < 45; шаг++) {
        await page.keyboard.press('Tab');
        const где = await page.evaluate(() => {
            const э = document.activeElement;
            if (!э || э === document.body) return null;
            const с = getComputedStyle(э);
            return {
                классы: (э.className || '').toString().split(/\s+/),
                ширина: parseFloat(с.outlineWidth) || 0,
                стиль: с.outlineStyle,
                видимыйФокус: э.matches(':focus-visible')
            };
        });
        if (!где) continue;
        const свой = где.классы.find(к => ждём.includes(к));
        if (!свой || встречено.has(свой)) continue;
        встречено.add(свой);
        if (!где.видимыйФокус) {
            беды.push('.' + свой + ': :focus-visible не совпал на клавише');
        } else if (где.ширина < 1 || где.стиль === 'none') {
            беды.push('.' + свой + ': контур ' + где.ширина + ' ' + где.стиль);
        }

      }
    }

    expect(встречено.size,
        'ПОРОГ: клавиша дошла всего до ' + встречено.size + ' нажимаемых мест из ' +
        ждём.length + ' за обход всех разделов — встречены: ' +
        [...встречено].join(', '))
        .toBeGreaterThanOrEqual(5);
    expect(беды, 'фокус не виден: ' + беды.join(' · ')).toEqual([]);
});

/* ══════════════════════════════════════════════════════════════════════
   3. ОКНО КАБИНЕТА
   ══════════════════════════════════════════════════════════════════════ */
test('окно кабинета называет себя, держит Tab и возвращает фокус', async ({ page }) => {
    await открыть(page, '');

    /* Окно «несохранённое» зовётся без единой записи в базу: набрали пароль
       и ушли в другой раздел.

       В раздел входим АДРЕСОМ, а выходим НАЖАТИЕМ: на узких видах бокового
       меню нет вовсе, а спрашивает про несохранённое только обработчик
       нажатия (js/dashboard.js:1727) — переход по адресу эту проверку
       обходит. Поэтому уходим тем, что на этом виде видно. */
    await page.evaluate(() => { window.location.hash = 'settings'; });
    const поле = page.locator('#settingsNewPw');
    await expect(поле).toBeVisible();
    await поле.fill('Проба12345');

    // Поздравление приходит ответом базы и может всплыть позже загрузки
    await погаситьПоздравление(page);

    const уйти = page.locator('[data-tab]:not([data-tab="settings"]):visible').first();
    expect(await уйти.count(),
        'ПОРОГ: на этом виде не нашлось ни одного видимого перехода в другой раздел')
        .toBeGreaterThan(0);
    await нажать(page, уйти, 'переход в другой раздел');

    const окно = page.locator('.db-modal-back');
    await expect(окно).toBeVisible();

    const диалог = окно.locator('.db-modal');
    const имя = await диалог.getAttribute('aria-labelledby');
    expect(имя, 'у окна нет имени для диктора').toBeTruthy();
    const заголовок = окно.locator('.db-modal-title');
    expect(await заголовок.getAttribute('id'), 'имя окна показывает в пустоту').toBe(имя);
    expect((await заголовок.textContent()).trim().length,
        'заголовок окна пуст').toBeGreaterThan(0);

    expect(await page.evaluate(() => document.activeElement.className),
        'окно открылось, не взяв фокус').toContain('db-modal-close');

    const фокусных = await окно.evaluate(к => к.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])').length);
    expect(фокусных, 'в окне нет ни одного места для фокуса').toBeGreaterThan(1);

    // С последнего места Tab возвращает на первое, а не уводит под окно
    await окно.evaluate(к => {
        const сп = к.querySelectorAll('button:not([disabled]), a[href], ' +
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), ' +
            '[tabindex]:not([tabindex="-1"])');
        сп[сп.length - 1].focus();
    });
    await page.keyboard.press('Tab');
    const послеTab = await page.evaluate(() => ({
        вОкне: !!document.activeElement.closest('.db-modal-back'),
        класс: document.activeElement.className
    }));
    expect(послеTab.вОкне, 'Tab увёл фокус из окна на страницу под ним').toBe(true);
    expect(послеTab.класс, 'Tab с последнего места не вернулся на первое')
        .toContain('db-modal-close');

    // Shift+Tab с первого — на последнее
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('.db-modal-back')),
        'Shift+Tab увёл фокус из окна').toBe(true);

    // Esc закрывает, и фокус возвращается туда, откуда окно позвали
    /* Фокус возвращается ТУДА, ОТКУДА ОКНО ПОЗВАЛИ. Первая редакция ждала
       поле `#settingsNewPw` — и это была ошибка прибора, а не продукта:
       настоящее нажатие мышью САМО уводит фокус на нажатую кнопку, и окно
       открывается уже с фокусом на ней. В браузере я проверял программным
       `.click()`, который фокус не двигает, — оттого поле и «возвращалось».
       Ждём то, что есть: переход, который окно позвал, а не тело страницы. */
    await page.keyboard.press('Escape');
    await expect(окно).toHaveCount(0);
    const куда = await page.evaluate(() => {
        const э = document.activeElement;
        if (!э || э === document.body) return { тело: true };
        return { вкладка: э.getAttribute('data-tab'), класс: э.className };
    });
    expect(куда.тело, 'после закрытия окна фокус упал на тело страницы').toBeUndefined();
    expect(куда.вкладка,
        'фокус вернулся не туда, откуда окно позвали: ' + JSON.stringify(куда))
        .toBeTruthy();
    expect(await page.evaluate(() => document.body.style.overflow),
        'окно закрылось, а прокрутка страницы осталась запертой').toBe('');
});

/* ══════════════════════════════════════════════════════════════════════
   4. ЛЕСТНИЦА ТЕКСТА
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('лестница текста кабинета стоит на ступенях · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост);

        /* Разделы открываются по одному: кегли вторичных уровней живут только
           в своём разделе, и замер «одной страницы» их не видит.

           ПЕРЕКЛЮЧАЕМСЯ АДРЕСОМ, А НЕ НАЖАТИЕМ. Первая редакция нажимала по
           боковому меню — а на узких видах его нет вовсе (css/dashboard.css:
           «.db-sidebar { display: none }» в медиа 992), и замер видел ровно
           один раздел из восьми: восемь уровней вместо пятидесяти.
           Кабинет слушает hashchange (js/dashboard.js:1751), и адрес открывает
           раздел на любом виде. */
        const ключи = await page.evaluate(() =>
            [...new Set([...document.querySelectorAll('[data-tab]')]
                .map(a => a.getAttribute('data-tab')))]);
        expect(ключи.length, 'ПОРОГ: в кабинете не нашлось ни одного раздела')
            .toBeGreaterThan(1);

        const уровни = {};
        for (const к of ключи) {
            await page.evaluate(ключ => { window.location.hash = ключ; }, к);
            await page.waitForTimeout(700);
            const снято = await page.evaluate(() => {
                const вышло = {};
                document.querySelectorAll('[class*="db-"]').forEach(э => {
                    const к = э.getBoundingClientRect();
                    if (!к.width || !к.height) return;
                    // Только те, у кого есть СВОЙ текст: иначе меряем коробку
                    const свой = [...э.childNodes].some(у =>
                        у.nodeType === 3 && у.textContent.trim().length);
                    if (!свой) return;
                    const с = getComputedStyle(э);
                    const имя = (э.className || '').toString().split(/\s+/)
                        .filter(к => к.indexOf('db-') === 0)[0] || 'db-?';
                    вышло[имя] = {
                        кегль: Math.round(parseFloat(с.fontSize) * 100) / 100,
                        вес: parseInt(с.fontWeight, 10),
                        мс: с.lineHeight === 'normal' ? 'normal'
                            : Math.round(parseFloat(с.lineHeight) / parseFloat(с.fontSize) * 100) / 100
                    };
                });
                return вышло;
            });
            Object.assign(уровни, снято);
        }

        /* ПОРОГ ПОСЧИТАН, А НЕ ВЗЯТ НА ГЛАЗ: замер 11.10 по пяти видам снял
           от 20 уровней на самом бедном аккаунте (все разделы пустые, видны
           только заголовки и пустые состояния) до 52 на полном. Ниже
           двадцати — значит разделы не открылись, и проверка идёт вхолостую. */
        const всего = Object.keys(уровни).length;
        expect(всего, 'ПОРОГ: снято всего ' + всего + ' уровней — разделы не открылись')
            .toBeGreaterThanOrEqual(20);

        const мимоКегля = [], мимоВеса = [], мимоСтроки = [];
        Object.keys(уровни).forEach(имя => {
            const у = уровни[имя];
            if (!ШКАЛА_КЕГЛЕЙ.includes(у.кегль)) мимоКегля.push(имя + '=' + у.кегль);
            if (!СИСТЕМА_ВЕСОВ.includes(у.вес)) мимоВеса.push(имя + '=' + у.вес);
            if (у.мс !== 'normal' && !ЛЕСТНИЦА_СТРОК.includes(у.мс)) {
                мимоСтроки.push(имя + '=' + у.мс);
            }
        });

        expect(мимоКегля, 'уровней снято ' + всего + ', кегли мимо шкалы: ' +
            мимоКегля.join(' · ')).toEqual([]);
        expect(мимоВеса, 'веса мимо системы: ' + мимоВеса.join(' · ')).toEqual([]);
        expect(мимоСтроки, 'межстрочные мимо лестницы: ' + мимоСтроки.join(' · ')).toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   5. ГОВОРИТ ОБЩЕЕ УВЕДОМЛЕНИЕ, А НЕ БРАУЗЕР
   ══════════════════════════════════════════════════════════════════════ */
test('кабинет говорит общим уведомлением, а не браузерным окном', async ({ page }) => {
    await открыть(page, '');

    expect(await page.evaluate(() =>
        !!(window.KSLT_TOAST && typeof window.KSLT_TOAST.показать === 'function')),
        'общее уведомление на странице кабинета не подключено').toBe(true);

    expect(await page.evaluate(() => typeof window.KSLT_полосаСтраниц),
        'общая полоса страниц на странице кабинета не подключена').toBe('function');

    // Пройтись по разделам: если где-то остался браузерный alert(), подмена
    // его поймает
    const ключи = await page.evaluate(() =>
        [...new Set([...document.querySelectorAll('[data-tab]')]
            .map(a => a.getAttribute('data-tab')))]);
    for (const к of ключи) {
        await page.evaluate(ключ => { window.location.hash = ключ; }, к);
        await page.waitForTimeout(500);
    }
    expect(await page.evaluate(() => window.__алертов),
        'кабинет позвал браузерный alert() вместо общего уведомления').toBe(0);
});
