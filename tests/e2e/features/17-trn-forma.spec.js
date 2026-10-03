// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-TRN-FORMA: вкладка «Редактирование» формы турнира.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: форма рисуется из базы, и ждать
 * «сеть замолчала» здесь бессмысленно — дожидаемся появления полей.
 *
 * Админка ведётся только на русском (js/auth-nav.js:89), и виды у неё два —
 * десктоп и планшет: телефоном админку не ведут. Так записано в трекере.
 *
 * ЧТО ЗАМОРОЖЕНО ЗДЕСЬ, А НЕ ПРАВИЛАМИ: заморозка читает файл как текст и
 * не видит НИ ОДНОЙ величины. Ширина поля, высота кнопки и перелив —
 * работа теста.
 */

test.use({ storageState: require('../../auth-setup').adminState });

/* ПОЧЕМУ ЗАПАС ПО ВРЕМЕНИ СНЯТ.
   29.09 я записал здесь догадку: «обработчик появляется позже». Она была
   неверна, и след Playwright её убил: `{"полей":0,...,"событиеДоходит":true,
   "послеСвоегоНажатия":35}` и `element was detached from the DOM` на
   #adTrnFormat. Форма ОТКРЫВАЛАСЬ — её стирала вторая отрисовка раздела:
   init.js рисовал его сам, и switchTab рисовал его же. Шов убран, точка
   входа одна, и десять нажатий подряд больше не нужны. */

const ВИДЫ = [
    { имя: 'Десктоп 1512',  w: 1512, h: 900 },
    { имя: 'Планшет 1024',  w: 1024, h: 768 },
    { имя: 'Планшет 768',   w: 768,  h: 1024 }
];

/**
 * Открыть форму создания турнира и дождаться её полей.
 *
 * ТЕСТ ЖДЁТ, ЧТО РАЗМЕТКА ПЕРЕСТАЛА МЕНЯТЬСЯ, А НЕ ЧТО ОНА ПОЯВИЛАСЬ.
 * Кнопка «+ Добавить турнир» рисуется вместе с шапкой раздела, а слушатель
 * на неё вешается позже — после того как список турниров пришёл из базы.
 * Клик по видимой кнопке до этого момента не делает ничего, и форма не
 * открывается: первый прогон падал именно здесь.
 *
 * Признак готовности раздела — счётчик турниров: он стоит '...' до ответа
 * базы и заполняется числом после.
 */
async function открытьФорму(page) {
    await page.goto('/pages/admin.html#tournaments');

    const добавить = page.locator('#adTrnAdd');
    await добавить.waitFor({ state: 'visible', timeout: 15000 });

    /* ТЕСТ ЖДЁТ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ. Раздел готов, когда счётчик
       турниров перестал быть многоточием: до ответа базы он '...'. */
    await page.waitForFunction(() => {
        const с = document.getElementById('adTrnStatTotal');
        return с && с.textContent.trim() !== '...' && с.textContent.trim() !== '';
    }, null, { timeout: 20000 });

    // Ошибки страницы собираем ДО нажатия: падение отрисовки видно только так
    const ошибкиСтраницы = [];
    page.on('pageerror', e => ошибкиСтраницы.push(String(e.message || e)));

    await добавить.click();

    /* ДИАГНОСТИКА ВМЕСТО ДОГАДОК. Первый прогон сказал только «#adTrnCat не
       появился» — по такому следу причину не назвать. Теперь при неудаче
       тест говорит, ГДЕ он оказался и что случилось. Именно этот след и
       вывел на двойную отрисовку. */
    try {
        await page.locator('#adTrnCat').waitFor({ state: 'visible', timeout: 15000 });
        await page.locator('#adTrnBracketType').waitFor({ state: 'visible', timeout: 15000 });
    } catch (e) {
        const след = await page.evaluate(() => ({
            адрес: location.href,
            наВходе: /auth\.html/.test(location.pathname),
            вКонтейнере: (document.getElementById('ad-tournaments') || {}).innerHTML
                ? document.getElementById('ad-tournaments').innerHTML.length : 0,
            кнопкаЕсть: !!document.getElementById('adTrnAdd'),
            счётчик: (document.getElementById('adTrnStatTotal') || {}).textContent || 'нет',
            полей: document.querySelectorAll('.ad-field').length,
            ктоНадКнопкой: (() => {
                const b = document.getElementById('adTrnAdd');
                if (!b) return 'кнопки нет';
                const r = b.getBoundingClientRect();
                const верх = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                if (!верх) return 'за экраном';
                return верх === b ? 'сама кнопка' : (верх.id || верх.className || верх.tagName);
            })(),
            кнопокСЭтимId: document.querySelectorAll('[id="adTrnAdd"]').length
        }));
        throw new Error('форма не открылась. След: ' + JSON.stringify(след) +
            ' · ошибки страницы: ' + (ошибкиСтраницы.length ? ошибкиСтраницы.join(' | ') : 'нет'));
    }
}

/**
 * Карточка «Тип сетки» — одним определением на весь файл.
 *
 * Искали её дважды, и обе копии падали без объяснения: `k` выходил
 * undefined, и бегунок говорил «Cannot read properties of undefined»
 * вместо «карточки нет». Теперь неудача называет себя сама.
 */
async function карточкаСетки(page, что) {
    const есть = await page.evaluate(() =>
        [...document.querySelectorAll('.ad-form-card')]
            .some(c => c.querySelector('#adTrnBracketType')));
    if (!есть) {
        const след = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.ad-form-card').length,
            полей: document.querySelectorAll('.ad-field').length,
            типСеткиЕсть: !!document.getElementById('adTrnBracketType')
        }));
        throw new Error('карточка «Тип сетки» не найдена (' + что + '). След: ' +
                        JSON.stringify(след));
    }
}

/**
 * Открыть СУЩЕСТВУЮЩИЙ турнир глубокой ссылкой.
 *
 * Новая форма афиши не несёт — у неё пустой короб. Два представления можно
 * увидеть только у турнира, у которого афиша уже лежит в базе: его заводит
 * `tests/seed.js` (`test-afisha`, два РАЗНЫХ источника, кадр в image_crop).
 *
 * Глубокая ссылка идёт в `loadAndEditTournament`, а та грузит категории и
 * уровни сама — вторая отрисовка раздела сюда не доезжает (замер 29.09).
 */
async function открытьТурнир(page, id) {
    await page.goto('/pages/admin.html#tournaments/edit/' + id);
    try {
        await page.locator('#adTrnCat').waitFor({ state: 'visible', timeout: 20000 });
    } catch (e) {
        const след = await page.evaluate(() => ({
            адрес: location.href,
            наВходе: /auth\.html/.test(location.pathname),
            полей: document.querySelectorAll('.ad-field').length,
            заголовок: (document.querySelector('.ad-section-title') || {}).textContent || 'нет'
        }));
        throw new Error('турнир ' + id + ' не открылся. След: ' + JSON.stringify(след));
    }
}

for (const вид of ВИДЫ) {
    test.describe(`Форма турнира — ${вид.имя}`, () => {
        test.use({ viewport: { width: вид.w, height: вид.h } });

        /* ВИДЫ ЗАДАЁТ САМ ФАЙЛ, ЗНАЧИТ ПРОЕКТ НУЖЕН ОДИН.
           Конфиг гоняет пять проектов, а test.use выше переписывает вид
           каждому — и одни и те же три вида прогонялись пятикратно: 90
           прогонов вместо 18.

           ПРОПУСК ЖИВЁТ В beforeEach, И ЭТО НЕ ПРИХОТЬ. У test.skip(callback)
           в сигнатуре ОДИН довод — фикстуры теста (types/test.d.ts: «based on
           test fixtures»); второго, testInfo, там нет, и `инфо.project` падал
           `Cannot read properties of undefined`. Я это угадал вместо того,
           чтобы прочитать, и уронил все 18 прогонов разом. У beforeEach
           testInfo вторым доводом есть (test.d.ts:5794), а у TestInfo есть
           свой skip (2355). Проверено пробным прогоном на пяти проектах:
           1 прошёл, 4 пропущены. */
        test.beforeEach(({}, инфо) => {
            инфо.skip(инфо.project.name !== 'desktop',
                      'виды заданы внутри файла — проект берём один');
        });

        test(`${вид.имя}: карточка «Тип сетки» — ровно три ряда`, async ({ page }) => {
            await открытьФорму(page);
            await карточкаСетки(page, 'ряды');
            const рядов = await page.evaluate(() => {
                const k = [...document.querySelectorAll('.ad-form-card')]
                    .find(c => c.querySelector('#adTrnBracketType'));
                return [...k.children].filter(r => r.classList.contains('ad-field-row')).length;
            });
            expect(рядов).toBe(3);
        });

        test(`${вид.имя}: ширина поля — ступень, а не остаток колонки`, async ({ page }) => {
            await открытьФорму(page);
            await карточкаСетки(page, 'ширины');
            const ширины = await page.evaluate(() => {
                const k = [...document.querySelectorAll('.ad-form-card')]
                    .find(c => c.querySelector('#adTrnBracketType'));
                return [...k.querySelectorAll('.ad-field')]
                    .filter(p => p.offsetParent !== null)
                    .map(p => Math.round(p.getBoundingClientRect().width));
            });
            // На узком виде ряд схлопывается в одну колонку — там ступени не действуют
            const узкий = вид.w <= 640;
            if (!узкий) {
                const ступени = [160, 280, 360];
                for (const ш of ширины) {
                    expect(ступени, `ширина ${ш} не со ступени`).toContain(ш);
                }
            }
            expect(ширины.length).toBeGreaterThan(0);
        });

        test(`${вид.имя}: кнопки формы на ступени 44`, async ({ page }) => {
            await открытьФорму(page);
            const высоты = await page.evaluate(() =>
                [...document.querySelectorAll('#adTrnSave, #adTrnCancel, #adTrnDelete, #adTrnNotify')]
                    .filter(b => b.offsetParent !== null)
                    .map(b => Math.round(b.getBoundingClientRect().height)));
            expect(высоты.length).toBeGreaterThan(0);
            for (const h of высоты) expect(h).toBe(44);
        });

        test(`${вид.имя}: у каждой кнопки ниже 44 есть цель нажатия`, async ({ page }) => {
            await открытьФорму(page);
            /* МЕРЯЕМ СВОЙ КУСОК, А НЕ ВСЮ СТРАНИЦУ. Шапка сайта и боковое
               меню — закрытые куски со своей заморозкой: колокольчик и
               «Выйти» стоят 36 без слоя цели, и это их беда, записанная в
               трекер. Чужую находку нельзя чинить молча и нельзя вешать
               на свой тест: он тогда падает не на своём. */
            const без = await page.evaluate(() =>
                [...document.querySelectorAll('button')]
                    .filter(b => b.offsetParent !== null)
                    .filter(b => !b.closest('header, nav, .ad-sidebar, .nav-dropdown-menu, .site-header'))
                    .filter(b => {
                        const h = b.getBoundingClientRect().height;
                        if (h >= 44 || h === 0) return false;
                        return getComputedStyle(b, '::after').content === 'none';
                    })
                    .map(b => (b.className || 'инлайн') + ' ' + Math.round(b.getBoundingClientRect().height)));
            expect(без, 'кнопки ниже 44 без слоя цели: ' + без.join(' · ')).toEqual([]);
        });

        test(`${вид.имя}: уровень турнира виден только там, где есть очки`, async ({ page }) => {
            await открытьФорму(page);
            const виден = () => page.evaluate(() => {
                const e = document.getElementById('adTrnLevelWrap');
                return !!e && e.offsetParent !== null;
            });
            const общий = () => page.evaluate(() => {
                const e = document.getElementById('adTrnNtrpCombinedWrap');
                return !!e && e.offsetParent !== null;
            });

            // Парный — очков не даёт: уровня нет, зато есть общий NTRP
            await page.selectOption('#adTrnFormat', 'doubles');
            expect(await виден()).toBe(false);
            expect(await общий()).toBe(true);

            // Одиночный — наоборот
            await page.selectOption('#adTrnFormat', 'singles');
            expect(await виден()).toBe(true);
            expect(await общий()).toBe(false);

            // Дружеский одиночный — очков тоже нет
            const естьFriendly = await page.evaluate(() =>
                [...document.getElementById('adTrnCat').options].some(o => o.value === 'friendly'));
            if (естьFriendly) {
                await page.selectOption('#adTrnCat', 'friendly');
                expect(await виден()).toBe(false);
                const значение = await page.inputValue('#adTrnLevel');
                expect(значение, 'скрытый уровень должен обнуляться').toBe('');
            }
        });

        test(`${вид.имя}: текст не переливается из полей`, async ({ page }) => {
            await открытьФорму(page);
            const перелив = await page.evaluate(() => {
                const плохо = [];
                document.querySelectorAll('.ad-form-card .ad-field-label').forEach(l => {
                    if (l.scrollWidth > l.clientWidth + 1) плохо.push(l.textContent.trim());
                });
                return плохо;
            });
            expect(перелив, 'подписи не помещаются: ' + перелив.join(' · ')).toEqual([]);
        });

        /* ─────────── АФИША: ДВА ПРЕДСТАВЛЕНИЯ ───────────
           ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила держат, что в разметке названы
           две створки и второй источник. Но что в браузере стоят ДВЕ
           картинки и что они РАЗНЫЕ — видно только прогоном. */
        test(`${вид.имя}: афиша показана двумя створками, источники разные`, async ({ page }) => {
            await открытьТурнир(page, 'test-afisha');

            const створки = await page.evaluate(() => {
                const к = document.querySelector('.ad-afisha-pane--crop .ad-afisha-img');
                const п = document.querySelector('.ad-afisha-pane--thumb .ad-afisha-img');
                const вид = э => {
                    if (!э) return null;
                    const r = э.getBoundingClientRect();
                    return { src: э.getAttribute('src'), w: Math.round(r.width), h: Math.round(r.height),
                             виден: r.width > 0 && r.height > 0 };
                };
                return { кадр: вид(к), полная: вид(п),
                         подписей: document.querySelectorAll('.ad-afisha-cap').length,
                         короб: !!document.querySelector('.ad-afisha-drop') };
            });

            expect(створки.кадр, 'створки кадра нет').not.toBeNull();
            expect(створки.полная, 'створки полной афиши нет').not.toBeNull();
            expect(створки.кадр.виден).toBe(true);
            expect(створки.полная.виден).toBe(true);
            /* ПОРОГ: совпади источники — проверка прошла бы вхолостую при
               любом коде, в том числе при одной картинке, показанной дважды */
            expect(створки.кадр.src, 'источники створок совпали — делить окно незачем')
                .not.toBe(створки.полная.src);
            expect(створки.подписей, 'у створок нет подписей, что есть что').toBe(2);
            expect(створки.короб, 'коробa замены афиши нет').toBe(true);
            /* Пара читается как пара и едет одной границей: высота одна */
            expect(Math.abs(створки.кадр.h - створки.полная.h),
                   'створки разной высоты — пара разъехалась').toBeLessThanOrEqual(1);
        });

        /* Решение Кости: «ссылку на афишу убрать, пусть будут только свои» */
        test(`${вид.имя}: поля ссылки на афишу в форме нет`, async ({ page }) => {
            await открытьТурнир(page, 'test-afisha');
            const ссылки = await page.evaluate(() => {
                const зона = document.getElementById('adTrnImgZone');
                const карточка = зона && зона.closest('.ad-form-card');
                if (!карточка) return { карточкиНет: true };
                return {
                    вКарточке: [...карточка.querySelectorAll('input')]
                        .map(i => i.type + (i.id ? '#' + i.id : '')),
                    файловых: карточка.querySelectorAll('input[type="file"]').length
                };
            });
            expect(ссылки.карточкиНет, 'карточка афиши не найдена').toBeFalsy();
            expect(ссылки.вКарточке.filter(т => /^(url|text)/.test(т)),
                   'в карточку афиши вернулось поле ссылки на чужую картинку').toEqual([]);
            expect(ссылки.файловых, 'короб загрузки свой файл больше не берёт').toBe(1);
        });

        /* ─────────── ЛЕСТНИЦА ТЕКСТА ───────────
           Замер 03.10 нашёл пять уровней на `normal`: межстрочный считался
           от метрик шрифта, а Inter в админке не подключён вовсе
           (pages/admin.html его не грузит) — значит у разных людей выходило
           разное число. ЭТОГО ЗАМОРОЗКА НЕ ВИДИТ: в файле написано
           `line-height: var(--lh-none)`, а что из этого вышло в браузере,
           говорит только прогон. */
        test(`${вид.имя}: ни один уровень не берёт межстрочный от шрифта`, async ({ page }) => {
            await открытьТурнир(page, 'test-afisha');
            const лестница = await page.evaluate(() => {
                const уровни = ['.ad-section-title', '.ad-tab', '.ad-lang-tab', '.ad-btn',
                                '.ad-form-card-title', '.ad-field-label', '.ad-field-input',
                                '.ad-field-hint', '.ad-afisha-cap', '.ad-afisha-drop',
                                '.ad-image-upload-remove'];
                const вышло = [];
                уровни.forEach(с => {
                    const э = document.querySelector(с);
                    if (!э) return;
                    const c = getComputedStyle(э);
                    вышло.push({ уровень: с, кегль: parseFloat(c.fontSize),
                                 мс: c.lineHeight,
                                 высота: +э.getBoundingClientRect().height.toFixed(1) });
                });
                return вышло;
            });

            /* ПОРОГ: нашлось меньше восьми уровней — значит форма открылась
               не целиком, и пустой список «нарушений» ничего не доказывает */
            expect(лестница.length, 'уровней на экране меньше восьми — мерить нечего')
                .toBeGreaterThanOrEqual(8);
            expect(лестница.filter(у => у.мс === 'normal').map(у => у.уровень),
                   'межстрочный снова считается от шрифта').toEqual([]);

            const вкладка = лестница.find(у => у.уровень === '.ad-tab');
            /* Ступень шкалы кнопок. При 768 полоса вкладок становится
               колонкой, и `height` там перебивается `flex-basis: 0%` —
               вкладка схлопывалась до 14px. Держит порог, а не высота. */
            expect(вкладка.высота, 'вкладка раздела съехала со ступени 36').toBe(36);
        });
    });
}
