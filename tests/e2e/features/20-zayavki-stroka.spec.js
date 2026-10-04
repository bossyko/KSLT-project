// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-ZAYAVKI-STROKA: строка заявки на вкладке «Заявки».
 *
 * У строки ДВЕ ветки, и это главное, что здесь проверяется. Одиночная
 * несёт «Место» и «Категорию», парная — личные NTRP, напарника и общий
 * NTRP; «Места» у неё нет вовсе. Правка одиночной ветки 02.10 парную не
 * тронула, Костя открыл дружеский парный и увидел прокрутку вбок там,
 * где её только что убрали. ПРИБОР, ПОМЕРИВШИЙ ОДИН СЛУЧАЙ, НЕ ЗНАЕТ
 * ДРУГОГО — поэтому обе ветки гоняются одним файлом и одними порогами.
 *
 * ЧТО ЗАМОРОЖЕНО ЗДЕСЬ, А НЕ ПРАВИЛАМИ: заморозка (tools/check-zayavki-
 * verstka.js) читает файл как текст и не видит НИ ОДНОЙ величины. Сколько
 * колонок осталось видимыми, вернулась ли прокрутка, какого роста плашка
 * и достаёт ли контраст шапки до 4.5 — работа теста.
 *
 * Админка ведётся только на русском (js/auth-nav.js:89), и виды у неё
 * два — десктоп и планшет: телефоном админку не ведут.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ. Кнопки, меняющие данные, лежат под «⋯» и каждая
 * спрашивает подтверждение. Тест нажимает «Отклонить» ровно чтобы
 * ОТКРЫТЬ окно (запись живёт в обработчике согласия, bracket.js:3331) и
 * закрывает его Esc. Ни одного согласия не даётся.
 */

test.use({ storageState: require('../../auth-setup').adminState });

/* 768 — планшет вертикально, он же граница медиа-правила (992).
   1024 — планшет боком: по решению 02.10 он остаётся при широкой
   раскладке, и прокрутка вбок у парного там ЗАКОННА. Порог на неё
   ставится только на 768, иначе тест запретил бы принятое решение. */
const ВИДЫ = [
    { имя: 'Десктоп 1512', w: 1512, h: 900,  узкий: false },
    { имя: 'Планшет 1024', w: 1024, h: 768,  узкий: false },
    { имя: 'Планшет 768',  w: 768,  h: 1024, узкий: true  }
];

/* Турниры заводит tests/seed.js — края в них крайние: посев, долг,
   внешний, очередь, одна и три причины; у парного — своя пара с длинными
   фамилиями обоих, пара без напарника, внешний напарник и пара без
   парного рейтинга. */
const ТУРНИРЫ = [
    { имя: 'Одиночный', id: 'test-zayavki',      парный: false, колонокШироко: 7  },
    { имя: 'Парный',    id: 'test-zayavki-pary', парный: true,  колонокШироко: 10 }
];

// На 768 обе ветки сходятся к пяти видимым колонкам — остальное уходит
// в подпись под именем, а не под прокрутку
const КОЛОНОК_УЗКО = 5;

/**
 * Открыть вкладку «Заявки» у существующего турнира.
 *
 * ТЕСТ ЖДЁТ ПРИЗНАКИ, А НЕ ТИШИНУ СЕТИ: таблица рисуется после ответа
 * базы, и признак её готовности — галочка заявки `.ad-reg-check`. Она
 * есть у ОБЕИХ ветк��в, в отличие от «Места»: ЯКОРЬ ДЕРЖИТСЯ НА ТОМ, ЧТО
 * ЕСТЬ ВСЕГДА.
 */
async function открытьЗаявки(page, id) {
    const ошибкиСтраницы = [];
    page.on('pageerror', e => ошибкиСтраницы.push(String(e.message || e)));

    await page.goto('/pages/admin.html#tournaments/edit/' + id);
    try {
        await page.locator('#adTrnCat').waitFor({ state: 'visible', timeout: 20000 });
    } catch (e) {
        const след = await page.evaluate(() => ({
            адрес: location.href,
            наВходе: /auth\.html/.test(location.pathname),
            полей: document.querySelectorAll('.ad-field').length
        }));
        throw new Error('турнир ' + id + ' не открылся. След: ' + JSON.stringify(след) +
            ' · ошибки страницы: ' + (ошибкиСтраницы.length ? ошибкиСтраницы.join(' | ') : 'нет'));
    }

    await page.click('[data-trn-nav="regs"]');
    try {
        await page.locator('.ad-reg-check').first().waitFor({ timeout: 20000 });
    } catch (e) {
        const след = await page.evaluate(() => ({
            вкладкаАктивна: !!document.querySelector('[data-trn-nav="regs"].active'),
            таблиц: document.querySelectorAll('table').length,
            строк: document.querySelectorAll('tbody tr').length,
            текстПанели: (document.querySelector('.ad-brk-panel') || {}).textContent
                ? document.querySelector('.ad-brk-panel').textContent.trim().slice(0, 160) : 'панели нет'
        }));
        throw new Error('таблица заявок у ' + id + ' не появилась. След: ' + JSON.stringify(след) +
            ' · ошибки страницы: ' + (ошибкиСтраницы.length ? ошибкиСтраницы.join(' | ') : 'нет'));
    }
}

/** Снять со страницы всё, что меряет этот файл, одним заходом. */
function снять(page) {
    return page.evaluate(() => {
        const ч = x => Math.round(x * 100) / 100;
        const видим = э => !!э && э.getBoundingClientRect().width > 0 &&
                                 э.getBoundingClientRect().height > 0;

        /* КОНТРАСТ СЧИТАЕТСЯ ПОВЕРХ ФОНА, А НЕ ПО ЦИФРЕ ИЗ ТОКЕНА:
           у наших серых есть альфа, и на разном фоне они разные. */
        const разбор = s => {
            const m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
            return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
        };
        const фонПод = э => {
            let у = э;
            while (у) {
                const ц = разбор(getComputedStyle(у).backgroundColor);
                if (ц && ц.a > 0) return ц;
                у = у.parentElement;
            }
            return { r: 0, g: 0, b: 0, a: 1 };
        };
        const яркость = ц => {
            const к = v => { const s = v / 255;
                return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
            return 0.2126 * к(ц.r) + 0.7152 * к(ц.g) + 0.0722 * к(ц.b);
        };
        const контраст = э => {
            const п = разбор(getComputedStyle(э).color);
            if (!п) return null;
            const ф = фонПод(э);
            const св = { r: п.r * п.a + ф.r * (1 - п.a),
                         g: п.g * п.a + ф.g * (1 - п.a),
                         b: п.b * п.a + ф.b * (1 - п.a) };
            const a = яркость(св), b = яркость(ф);
            return ч((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
        };
        const ступень = э => {
            if (!видим(э)) return null;
            const с = getComputedStyle(э);
            return { кегль: ч(parseFloat(с.fontSize)), вес: +с.fontWeight,
                     высота: ч(э.getBoundingClientRect().height), контраст: контраст(э) };
        };

        const якорь = document.querySelector('.ad-reg-check');
        const табл = якорь ? якорь.closest('table') : null;
        if (!табл) return { беда: 'таблицы заявок нет' };
        const панель = табл.closest('.ad-brk-panel') || табл.parentElement;
        const строки = [...табл.querySelectorAll('tbody tr')];

        return {
            колонокВидимых: [...табл.querySelectorAll('thead th')].filter(видим).length,
            строк: строки.length,
            ширинаТаблицы: ч(табл.getBoundingClientRect().width),
            ширинаОбёртки: (() => { const о = табл.closest('.ad-table-wrap, .ad-table-scroll');
                return о ? ч(о.getBoundingClientRect().width) : null; })(),
            прокруткаВбок: (() => { const о = табл.closest('.ad-table-wrap, .ad-table-scroll');
                return о ? (о.scrollWidth > о.clientWidth + 1) : 'обёртки нет'; })(),
            страницаШире: document.documentElement.scrollWidth > window.innerWidth + 1,

            // Лестница текста: каждый уровень, а не только тот, что правили
            лестница: {
                шапка:    ступень(табл.querySelector('thead th:not(:first-child)')),
                имя:      ступень(панель.querySelector('.ad-table-user-name')),
                подпись:  ступень(панель.querySelector('.ad-table-sub')),
                плашка:   ступень(панель.querySelector('.ad-reg-mark')),
                ntrp:     ступень(панель.querySelector('.ad-reg-ntrp')),
                ntrpВнутри: ступень(панель.querySelector('.ad-reg-ntrp-inline'))
            },

            // Что показывает узкий вид, а что широкий
            видно: {
                подписьОдиночная: видим(панель.querySelector('.ad-reg-sub-inline')),
                втораяСтрокаПары: видим(панель.querySelector('.ad-reg-pair-inline')),
                колонкаКатегории: видим(табл.querySelector('.ad-col-cat')),
                колонкаДаты:      видим(табл.querySelector('.ad-col-dt')),
                колонкаNtrp:      видим(табл.querySelector('.ad-col-ntrp')),
                колонкаПартнёра:  видим(табл.querySelector('.ad-col-partner')),
                колонкаОбщего:    видим(табл.querySelector('.ad-col-sum'))
            },
            ntrpВнутриИмени: строки.map(р =>
                [...р.querySelectorAll('.ad-reg-ntrp-inline')].filter(видим).length),

            /* СЛОЙ ЦЕЛИ 44 — ЧАСТЬ ОТВЕТА. В админке низкая кнопка
               законна, если у неё есть прозрачный слой ростом 44
               (решение 29.09, admin.css). У `input` своих
               псевдоэлементов нет — слой живёт на обёртке. */
            целиНиже44: [...new Set([...панель.querySelectorAll('button, input[type=checkbox], a')]
                .map(б => {
                    const h = Math.round(б.getBoundingClientRect().height);
                    if (!(h > 0 && h < 44)) return null;
                    const свой = parseFloat(getComputedStyle(б, '::after').height) || 0;
                    const род = б.parentElement
                        ? (parseFloat(getComputedStyle(б.parentElement, '::after').height) || 0) : 0;
                    if (Math.max(свой, род) >= 44) return null;
                    return ((б.className || '').toString().split(' ')[0] || б.type || б.tagName) + ':' + h;
                }).filter(Boolean))]
        };
    });
}

for (const т of ТУРНИРЫ) {
    for (const вид of ВИДЫ) {
        test.describe(`Заявки · ${т.имя} — ${вид.имя}`, () => {
            test.use({ viewport: { width: вид.w, height: вид.h } });

            /* ВИДЫ ЗАДАЁТ САМ ФАЙЛ, ЗНАЧИТ ПРОЕКТ НУЖЕН ОДИН: иначе
               конфиг прогонит те же виды пятикратно. Пропуск живёт в
               beforeEach — у test.skip(callback) второго довода нет
               (types/test.d.ts), а у beforeEach testInfo есть. */
            test.beforeEach(({}, инфо) => {
                инфо.skip(инфо.project.name !== 'desktop',
                          'виды заданы внутри файла — проект берём один');
            });

            test(`${т.имя} ${вид.имя}: колонок видимо столько, сколько решено`, async ({ page }) => {
                await открытьЗаявки(page, т.id);
                const м = await снять(page);
                expect(м.беда, String(м.беда)).toBeUndefined();
                expect(м.строк).toBeGreaterThan(0);
                expect(м.колонокВидимых,
                    'видимых колонок ' + м.колонокВидимых + ' при таблице ' + м.ширинаТаблицы)
                    .toBe(вид.узкий ? КОЛОНОК_УЗКО : т.колонокШироко);
            });

            test(`${т.имя} ${вид.имя}: таблица не шире своей обёртки`, async ({ page }) => {
                await открытьЗаявки(page, т.id);
                const м = await снять(page);
                if (вид.узкий) {
                    expect(м.прокруткаВбок,
                        'таблица ' + м.ширинаТаблицы + ' при обёртке ' + м.ширинаОбёртки)
                        .toBe(false);
                    expect(м.страницаШире).toBe(false);
                } else {
                    /* НА ШИРОКИХ ВИДАХ ПРОКРУТКА У ПАРНОГО ЗАКОННА — решение
                       02.10 о границе 992. Порог тут держит только то, что
                       страница целиком не разъехалась. */
                    expect(м.страницаШире).toBe(false);
                }
            });

            test(`${т.имя} ${вид.имя}: лестница текста стоит на ступенях`, async ({ page }) => {
                await открытьЗаявки(page, т.id);
                const м = await снять(page);
                const л = м.лестница;

                // Имя — ступень 14, обычный вес: это основа строки
                expect(л.имя, 'имени в строке нет').toBeTruthy();
                expect(л.имя.кегль).toBe(14);

                /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО: подпись СТРОГО
                   мельче имени на каждом виде — иначе два уровня читаются
                   как один. Именно это сломалось 02.10, когда напарник
                   уехал на уровень подписи. */
                expect(л.подпись, 'подписи в строке нет').toBeTruthy();
                expect(л.подпись.кегль,
                    'подпись ' + л.подпись.кегль + ' против имени ' + л.имя.кегль)
                    .toBeLessThan(л.имя.кегль);

                // Шапка колонки читается: WCAG AA для мелкого текста — 4.5
                expect(л.шапка, 'шапки колонок нет').toBeTruthy();
                expect(л.шапка.контраст,
                    'контраст шапки ' + л.шапка.контраст).toBeGreaterThanOrEqual(4.5);

                // Плашка (посев, долг, внешний) — ступень 24, кегль 11
                if (л.плашка) {
                    expect(л.плашка.высота).toBe(24);
                    expect(л.плашка.кегль).toBe(11);
                }
            });

            test(`${т.имя} ${вид.имя}: у каждой цели нажатия есть слой 44`, async ({ page }) => {
                await открытьЗаявки(page, т.id);
                const м = await снять(page);
                expect(м.целиНиже44,
                    'ниже 44 без слоя: ' + м.целиНиже44.join(' · ')).toEqual([]);
            });

            if (т.парный) {
                test(`${т.имя} ${вид.имя}: личные NTRP видны на любом виде`, async ({ page }) => {
                    await открытьЗаявки(page, т.id);
                    const м = await снять(page);

                    /* РЕШЕНИЕ КОСТИ 02.10: «важнее личные». Личные рейтинги
                       обоих видны ВСЕГДА — широко своими колонками, узко
                       внутри ячейки имени. Уходит общий, а не личные. */
                    if (вид.узкий) {
                        expect(м.видно.колонкаNtrp).toBe(false);
                        expect(м.видно.колонкаПартнёра).toBe(false);
                        expect(м.видно.колонкаОбщего).toBe(false);
                        expect(м.видно.втораяСтрокаПары).toBe(true);
                        // В ячейке имени два личных NTRP: свой и напарника
                        const сПарой = м.ntrpВнутриИмени.filter(н => н === 2).length;
                        expect(сПарой,
                            'строк с двумя личными NTRP: ' + JSON.stringify(м.ntrpВнутриИмени))
                            .toBeGreaterThan(0);
                        expect(м.лестница.ntrpВнутри.вес,
                            'личный NTRP не должен быть легче имени')
                            .toBeGreaterThanOrEqual(м.лестница.имя.вес);
                    } else {
                        expect(м.видно.колонкаNtrp).toBe(true);
                        expect(м.видно.колонкаПартнёра).toBe(true);
                        expect(м.видно.втораяСтрокаПары).toBe(false);
                    }
                });
            } else {
                test(`${т.имя} ${вид.имя}: категория и дата уходят в подпись`, async ({ page }) => {
                    await открытьЗаявки(page, т.id);
                    const м = await снять(page);
                    if (вид.узкий) {
                        expect(м.видно.колонкаКатегории).toBe(false);
                        expect(м.видно.колонкаДаты).toBe(false);
                        expect(м.видно.подписьОдиночная).toBe(true);
                    } else {
                        expect(м.видно.колонкаКатегории).toBe(true);
                        expect(м.видно.колонкаДаты).toBe(true);
                        expect(м.видно.подписьОдиночная).toBe(false);
                    }
                });
            }
        });
    }
}

/* ОКНО СОГЛАСИЯ — ОДИН РАЗ НА ОДНОМ ВИДЕ.
   Доступность окна от ширины не зависит: role, подпись, фокус и Esc
   одинаковы на всех видах, и гонять их пятнадцать раз — тратить время
   прогона на одно и то же. */
test.describe('Заявки · окно согласия', () => {
    test.use({ viewport: { width: 1512, height: 900 } });
    test.beforeEach(({}, инфо) => {
        инфо.skip(инфо.project.name !== 'desktop', 'вид задан внутри файла');
    });

    test('окно «Отклонить» зовёт диктора и закрывается Esc', async ({ page }) => {
        await открытьЗаявки(page, 'test-zayavki');

        /* БАЗУ НЕ ТРОГАЕМ. Нажатие «Отклонить» только ОТКРЫВАЕТ окно:
           запись живёт в обработчике согласия (bracket.js:3331), и
           согласия тест не даёт — закрывает Esc. */
        await page.locator('.ad-reg-menu-btn').first().click();
        const отклонить = page.locator('.ad-reg-menu.open .ad-btn-reject').first();
        await отклонить.waitFor({ state: 'visible', timeout: 5000 });
        await отклонить.click();

        const окно = page.locator('.ad-confirm-modal');
        await окно.waitFor({ state: 'visible', timeout: 5000 });

        const о = await page.evaluate(() => {
            const м = document.querySelector('.ad-confirm-modal');
            const по = м.getAttribute('aria-labelledby');
            return {
                роль: м.getAttribute('role'),
                модально: м.getAttribute('aria-modal'),
                подписьID: по,
                подписьНайдена: !!(по && document.getElementById(по)),
                подписейСЭтимID: по ? document.querySelectorAll('[id="' + по + '"]').length : 0,
                фокусВнутри: !!(document.activeElement && м.contains(document.activeElement))
            };
        });

        expect(о.роль).toBe('dialog');
        expect(о.модально).toBe('true');
        expect(о.подписьНайдена, 'aria-labelledby ведёт в пустоту: ' + о.подписьID).toBe(true);
        // ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: подпись окна уникальна, иначе
        // диктор прочитает чужой заголовок
        expect(о.подписейСЭтимID).toBe(1);
        expect(о.фокусВнутри, 'фокус остался на странице за окном').toBe(true);

        await page.keyboard.press('Escape');
        await окно.waitFor({ state: 'detached', timeout: 5000 });

        // Ничего не отклонили: строки на месте, согласия не давали
        const строк = await page.locator('.ad-reg-check').count();
        expect(строк).toBeGreaterThan(0);
    });
});
