/**
 * СТРАНИЦА ТУРНИРА: МЕРА АБЗАЦА, ЛЕНТА БЛОКОВ И ПОЛОСА «СЫГРАННЫЕ» — 05.10.
 *
 * Замер пяти видов нашёл: заголовок раздела на 56, а его текст на 306 —
 * разрыв 250 и 94 знака в строке; сетку «все места» 32 высотой 5267, из
 * которых основная 1416; страницу в девять и двенадцать экранов.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • СОВПАДЕНИЕ ДВУХ КРАЁВ — заголовка и его текста. Заморозка читает
 *     файлы по одному и сравнить их на экране не может;
 *   • ЧТО ВЫШЛО ИЗ `80ch` В БРАУЗЕРЕ. В файле единица, число говорит замер;
 *   • ДОХОДИТ ЛИ НАЖАТИЕ до чипа ленты — высота коробки и цель нажатия
 *     разные вещи, и слой ::after уже один раз обрезался обёрткой;
 *   • ПЕРЕСЧИТАЛСЯ ЛИ СДВИГ матчей за места после показа блока: ЭЛЕМЕНТ СО
 *     СКРЫТЫМ РОДИТЕЛЕМ ОТДАЁТ НУЛИ, и правило этого не ловит;
 *   • ДВА УСЛОВИЯ ПОЛОСЫ «СЫГРАННЫЕ» — они про ДАННЫЕ, а не про css.
 *
 * ОТВЕТ БАЗЫ ПОДСТАВЛЯЕТСЯ ПЕРЕХВАТОМ, А НЕ ЗАПИСЬЮ В БАЗУ. Турнира, где
 * часть матчей сыграна, а часть ждёт, в тестовой базе нет: у
 * `tsikl-odinochka` сыграны все 42. Поэтому случай «полоса ЕСТЬ» получаем
 * перехватом ответа — база не трогается, квота не тратится.
 *
 * ПОРОГИ: если на экране нет чипов, строк расписания или абзаца описания,
 * проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА_КНОПОК = [28, 36, 44, 52];

const ЯЗЫКИ = [
    { имя: 'ru', файл: '/pages/tournament.html' },
    { имя: 'en', файл: '/pages/tournament-en.html' },
    { имя: 'kg', файл: '/pages/tournament-kg.html' },
];

/* Турниры тестовой базы, заведённые севом */
const СЕТКА = 'trial-fic-32';       // «все места» 32 — восемь блоков, лента
const РАСПИСАНИЕ = 'tsikl-odinochka'; // 42 матча, ВСЕ сыграны

async function открыть(page, файл, ид, ждём) {
    await page.goto(файл + '?id=' + ид);
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0,
        ждём, { timeout: 20000 });
    await page.waitForTimeout(1000);
}

/* Ждём ОСТАНОВКИ величины, а не истечения времени: плавная прокрутка на
   7774 пикселя идёт 95 кадров, и таймер на 900 мс уже соврал мне 05.10. */
async function дождатьсяПокоя(page) {
    await page.evaluate(async () => {
        const кадр = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        let прошл = -1, тихо = 0, шагов = 0;
        while (тихо < 6 && шагов < 400) {
            await кадр();
            const сейчас = Math.round(window.scrollY);
            if (сейчас === прошл) тихо++; else { тихо = 0; прошл = сейчас; }
            шагов++;
        }
    });
}

for (const Я of ЯЗЫКИ) {

test.describe('страница турнира · ' + Я.имя, () => {

    test('заголовок раздела и его текст стоят на одной левой границе', async ({ page }) => {
        await открыть(page, Я.файл, СЕТКА, '.td-description-text');
        const r = await page.evaluate(() => {
            const з = document.querySelector('#description h2');
            const т = document.querySelector('.td-description-text');
            if (!з || !т) return null;
            return { заголовок: Math.round(з.getBoundingClientRect().left),
                     текст: Math.round(т.getBoundingClientRect().left) };
        });
        expect(r, 'ПОРОГ: абзаца описания нет на экране — мерить нечего').not.toBeNull();
        expect(Math.abs(r.текст - r.заголовок),
            'разрыв левых краёв: заголовок ' + r.заголовок + ', текст ' + r.текст +
            '. Было 250 из-за margin: 0 auto').toBeLessThanOrEqual(1);
    });

    test('мера абзаца не длиннее читаемой', async ({ page }) => {
        await открыть(page, Я.файл, СЕТКА, '.td-description-text');
        const знаков = await page.evaluate(() => {
            const т = document.querySelector('.td-description-text');
            if (!т) return null;
            const c = getComputedStyle(т);
            const пр = document.createElement('span');
            пр.textContent = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя ';
            пр.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + c.font;
            document.body.appendChild(пр);
            const ш = пр.getBoundingClientRect().width / 34;
            пр.remove();
            return Math.round(т.getBoundingClientRect().width / ш);
        });
        expect(знаков, 'ПОРОГ: абзаца нет').not.toBeNull();
        /* Верхняя граница читаемости. Было 94 — на такой строке глаз теряет
           начало следующей. Нижней границы не ставим: на телефоне меру
           задаёт экран, и там выходит 37. */
        expect(знаков, 'знаков в строке: ' + знаков).toBeLessThanOrEqual(88);
    });

    test('лента блоков: один выбран, чип на ступени, нажатие доходит', async ({ page }) => {
        await открыть(page, Я.файл, СЕТКА, '.td-fic-chip');
        const r = await page.evaluate(() => {
            const чипы = Array.from(document.querySelectorAll('.td-fic-chip'));
            const первый = чипы[0];
            /* ЭЛЕМЕНТ ВНЕ ОКНА НЕ ОТДАЁТ ПОПАДАНИЯ. Первая редакция мерила
               elementFromPoint, не прокрутив к ленте: сетка лежит на третьем
               экране, точка уходила за край окна, и браузер честно возвращал
               null. Прогон сказал «пусто» — и это врал прибор, а не код. */
            первый.scrollIntoView({ block: 'center' });
            const к = первый.getBoundingClientRect();
            /* Цель нажатия меряем ПОПАДАНИЕМ, а не наличием правила: слой
               ::after однажды уже обрезался обёрткой с overflow. */
            const точка = (y) => {
                const э = document.elementFromPoint(Math.round(к.left + к.width / 2), Math.round(y));
                return э ? (э.closest('.td-fic-chip') ? 'чип' : э.className.toString().slice(0, 24)) : 'пусто';
            };
            const центр = к.top + к.height / 2;
            return {
                чипов: чипы.length,
                высота: Math.round(к.height),
                активных: document.querySelectorAll('.td-fic-chip.is-active').length,
                отмеченных: чипы.filter(c => c.getAttribute('aria-checked') === 'true').length,
                группа: !!document.querySelector('[role="radiogroup"]'),
                верх_цели: точка(центр - 21),
                низ_цели: точка(центр + 21),
                видно_блоков: Array.from(document.querySelectorAll('.td-fic-section'))
                    .filter(б => б.offsetParent !== null).length
            };
        });
        expect(r.чипов, 'ПОРОГ: ленты нет — у этого турнира восемь блоков, она обязана быть')
            .toBeGreaterThan(1);
        expect(ШКАЛА_КНОПОК, 'высота чипа ' + r.высота + ' мимо шкалы').toContain(r.высота);
        expect(r.активных, 'выбранных чипов должно быть ровно один').toBe(1);
        expect(r.отмеченных, 'aria-checked="true" должен стоять ровно у одного').toBe(1);
        expect(r.группа, 'лента обязана назваться диктору набором выбора').toBe(true);
        expect(r.видно_блоков, 'на экране должен быть ровно один блок сетки').toBe(1);
        expect(r.верх_цели, 'нажатие на 21 выше центра не доходит до чипа').toBe('чип');
        expect(r.низ_цели, 'нажатие на 21 ниже центра не доходит до чипа').toBe('чип');
    });

    test('смена блока меняет показанное и пересчитывает сдвиг матчей за места', async ({ page }) => {
        await открыть(page, Я.файл, СЕТКА, '.td-fic-chip');
        const было = await page.evaluate(() => {
            const в = Array.from(document.querySelectorAll('.td-fic-section')).find(б => б.offsetParent !== null);
            return в ? в.getAttribute('data-fic-blok') : null;
        });
        await page.evaluate(() => {
            const ч = document.querySelectorAll('.td-fic-chip');
            ч[ч.length - 1].click();
        });
        await page.waitForTimeout(600);
        const стало = await page.evaluate(() => {
            const видные = Array.from(document.querySelectorAll('.td-fic-section')).filter(б => б.offsetParent !== null);
            const б = видные[0];
            const мест = б ? Array.from(б.querySelectorAll('.td-place-match')) : [];
            return {
                видно: видные.length,
                блок: б ? б.getAttribute('data-fic-blok') : null,
                активных: document.querySelectorAll('.td-fic-chip.is-active').length,
                отмеченных: Array.from(document.querySelectorAll('.td-fic-chip'))
                    .filter(c => c.getAttribute('aria-checked') === 'true').length,
                мест: мест.length,
                /* ЭЛЕМЕНТ СО СКРЫТЫМ РОДИТЕЛЕМ ОТДАЁТ НУЛИ: если сдвиг не
                   пересчитали после показа, все матчи за места окажутся у
                   левого края с нулевым marginLeft. */
                нулевых_сдвигов: мест.filter(м => !м.style.marginLeft || м.style.marginLeft === '0px').length
            };
        });
        expect(стало.видно, 'после нажатия на экране должен остаться один блок').toBe(1);
        expect(стало.блок, 'блок не сменился').not.toBe(было);
        expect(стало.активных, 'выбранных чипов должно быть ровно один').toBe(1);
        expect(стало.отмеченных, 'отмеченных для диктора должно быть ровно один').toBe(1);
        if (стало.мест > 0) {
            expect(стало.нулевых_сдвигов,
                'сдвиг не пересчитан после показа: ' + стало.нулевых_сдвигов + ' из ' + стало.мест +
                ' матчей за места стоят у левого края').toBe(0);
        }
    });

    test('полосы «Сыгранные» нет, когда играть больше нечего', async ({ page }) => {
        await открыть(page, Я.файл, РАСПИСАНИЕ, '#scheduleContainer table tbody tr');
        const r = await page.evaluate(() => {
            const sc = document.querySelector('#scheduleContainer');
            const строки = Array.from(sc.querySelectorAll('tbody tr'));
            return {
                полоса: !!sc.querySelector('.td-sched-ranshe'),
                всего: строки.length,
                видимых: sc.querySelectorAll('tbody tr:not([hidden])').length
            };
        });
        expect(r.всего, 'ПОРОГ: расписания нет — проверять нечего').toBeGreaterThan(0);
        expect(r.полоса,
            'ПОЛОСА ПРЯЧЕТ ЛИШНЕЕ ТОЛЬКО ТОГДА, КОГДА ЕСТЬ ГЛАВНОЕ: тут сыграно всё, ' +
            'и прятать не от чего — раздел схлопнулся бы в одну кнопку').toBe(false);
        expect(r.видимых, 'при отсутствии полосы видны должны быть ВСЕ строки').toBe(r.всего);
    });

    test('полоса «Сыгранные» появляется, когда часть матчей ещё ждёт', async ({ page }) => {
        /* Подставляем ответ базы ПЕРЕХВАТОМ: половина матчей становится
           несыгранной. База не трогается. */
        await page.route('**/rest/v1/matches*', async route => {
            const ответ = await route.fetch();
            let тело;
            try { тело = await ответ.json(); } catch (e) { return route.fulfill({ response: ответ }); }
            if (Array.isArray(тело)) {
                /* Делаем несыгранной ПОЛОВИНУ, и именно вперемешку: прогон
                   05.10 этим и поймал настоящую беду. Один запуск бывает
                   доигран наполовину — на четырёх кортах матчи кончаются в
                   разное время, — и первая редакция, уводившая сыгранные в
                   отдельное тело таблицы, рвала порядок по времени. */
                тело = тело.map((м, i) => (i % 2 === 1)
                    ? Object.assign({}, м, { status: 'scheduled', score: null, winner_id: null })
                    : м);
            }
            await route.fulfill({ response: ответ, body: JSON.stringify(тело) });
        });
        await открыть(page, Я.файл, РАСПИСАНИЕ, '#scheduleContainer table tbody tr');
        const закрыто = await page.evaluate(() => {
            const sc = document.querySelector('#scheduleContainer');
            const п = sc.querySelector('.td-sched-ranshe');
            return {
                есть: !!п,
                высота: п ? Math.round(п.getBoundingClientRect().height) : null,
                aria: п ? п.getAttribute('aria-expanded') : null,
                управляет: п ? п.getAttribute('aria-controls') : null,
                всего: sc.querySelectorAll('tbody tr').length,
                видимых: sc.querySelectorAll('tbody tr:not([hidden])').length
            };
        });
        expect(закрыто.всего, 'ПОРОГ: расписания нет').toBeGreaterThan(0);
        expect(закрыто.есть, 'часть матчей ждёт — полоса обязана быть').toBe(true);
        expect(ШКАЛА_КНОПОК, 'высота полосы ' + закрыто.высота + ' мимо шкалы').toContain(закрыто.высота);
        expect(закрыто.aria, 'закрытая полоса обязана сказать aria-expanded="false"').toBe('false');
        expect(закрыто.управляет, 'полоса обязана назвать, чем управляет').toBeTruthy();
        expect(закрыто.видимых, 'закрытая полоса обязана прятать часть строк')
            .toBeLessThan(закрыто.всего);

        await page.click('.td-sched-ranshe');
        await page.waitForTimeout(400);
        const открыто = await page.evaluate(() => {
            const sc = document.querySelector('#scheduleContainer');
            const номера = Array.from(sc.querySelectorAll('tr:not([hidden]) .td-sched-num'))
                .map(e => parseInt(e.innerText.trim(), 10));
            return {
                aria: sc.querySelector('.td-sched-ranshe').getAttribute('aria-expanded'),
                видимых: номера.length,
                всего: sc.querySelectorAll('tbody tr').length,
                по_возрастанию: номера.every((n, i) => i === 0 || n > номера[i - 1])
            };
        });
        expect(открыто.aria, 'раскрытая полоса обязана сказать aria-expanded="true"').toBe('true');
        expect(открыто.видимых, 'после раскрытия видны все строки').toBe(открыто.всего);
        expect(открыто.по_возрастанию,
            'ХРОНОЛОГИЯ ПОРВАЛАСЬ: номера запусков после раскрытия идут не по возрастанию. ' +
            'Сыгранные обязаны стоять ПЕРВЫМ телом таблицы').toBe(true);
    });

    test('вкладка доводит свой заголовок под полосу и называет себя диктору', async ({ page }) => {
        await открыть(page, Я.файл, СЕТКА, '.td-tab');
        const вкладок = await page.evaluate(() => document.querySelectorAll('.td-tab').length);
        expect(вкладок, 'ПОРОГ: вкладок нет').toBeGreaterThan(1);

        /* БЕРЁМ НЕ ПОСЛЕДНЮЮ ВКЛАДКУ. Прогон 05.10 дал зазор 31 на десктопе и
           58 на планшете — и это не промах смещения: прокрутка УПЁРЛАСЬ В
           КОНЕЦ СТРАНИЦЫ. Ниже «Очков» содержимого почти нет, и заголовок
           физически не может встать выше. На телефоне страница длиннее, и
           там выходило ровно 12 — то самое число.
           Мерим «Сетку»: под ней лежат ещё два раздела, запас прокрутки есть
           наверняка. И всё равно проверяем упор — ПРОВЕРКА ОБЯЗАНА ЗНАТЬ,
           КОГДА ЕЁ УСЛОВИЕ НЕ ДЕЙСТВУЕТ. */
        const средняя = 3;
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
        await page.waitForTimeout(200);
        await page.evaluate(i => document.querySelectorAll('.td-tab')[i].click(), средняя);
        await дождатьсяПокоя(page);

        const r = await page.evaluate(i => {
            const вк = document.querySelectorAll('.td-tab')[i];
            const узел = document.getElementById(вк.getAttribute('data-target'));
            const полоса = document.querySelector('.td-tabs-bar');
            const пр = узел.getBoundingClientRect();
            const пол = полоса.getBoundingClientRect();
            const предел = document.documentElement.scrollHeight - window.innerHeight;
            return {
                зазор: Math.round(пр.top - (пол.top + пол.height)),
                упёрлись: Math.round(window.scrollY) >= Math.round(предел) - 2,
                отмечена: вк.getAttribute('aria-current'),
                отмеченных: Array.from(document.querySelectorAll('.td-tab'))
                    .filter(t => t.getAttribute('aria-current') === 'true').length
            };
        }, средняя);

        /* Зазор — ступень 12 плюс округление полосы. Раньше смещение
           писалось числом 120 при полосе 45, и выходило 11 — не со шкалы. */
        if (!r.упёрлись) {
            expect(r.зазор, 'заголовок встал не под полосой: зазор ' + r.зазор)
                .toBeGreaterThanOrEqual(0);
            expect(r.зазор, 'заголовок уехал далеко вниз: зазор ' + r.зазор).toBeLessThanOrEqual(24);
        } else {
            /* Упор — не повод промолчать: заголовок обязан хотя бы быть виден
               и не уехать под липкую полосу. */
            expect(r.зазор, 'упёрлись в конец страницы, но заголовок уехал ПОД полосу: ' + r.зазор)
                .toBeGreaterThanOrEqual(0);
        }
        expect(r.отмечена, 'выбранная вкладка не помечена для диктора').toBe('true');
        expect(r.отмеченных, 'помеченной для диктора должна быть ровно одна вкладка').toBe(1);
    });

    test('ни одна секция не переливает за край экрана', async ({ page }) => {
        await открыть(page, Я.файл, СЕТКА, '.td-fic-chip');
        const перелив = await page.evaluate(() =>
            Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
        expect(перелив, 'страница переливает вбок на ' + перелив).toBe(0);
    });

    /* ОТСЕЧКА ДЛИННОЙ ТАБЛИЦЫ — 06.10, слово Кости: «10 везде».
       Чего заморозка не видит: СКОЛЬКО СТРОК ОСТАЛОСЬ НА ЭКРАНЕ и доходит
       ли нажатие. Класс в файле есть, а строка может быть видна. */
    test('длинная таблица показывает десять строк, а хвост прячет классом', async ({ page }) => {
        await открыть(page, Я.файл, РАСПИСАНИЕ, '#scheduleContainer table tbody tr');
        const до = await page.evaluate(() => {
            const вид = э => э && э.offsetParent !== null && !э.hidden;
            const длинные = [...document.querySelectorAll('table')]
                .filter(t => t.offsetParent !== null && t.querySelectorAll('tbody tr').length > 10)
                .map(t => ({
                    всего: t.querySelectorAll('tbody tr').length,
                    видно: [...t.querySelectorAll('tbody tr')].filter(вид).length
                }));
            const кн = [...document.querySelectorAll('.td-more')].map(b => ({
                текст: b.textContent.trim(),
                высота: Math.round(b.getBoundingClientRect().height),
                aria: b.getAttribute('aria-expanded')
            }));
            return { длинные, кн };
        });
        expect(до.длинные.length, 'ПОРОГ: длинных таблиц на экране нет — мерить нечего')
            .toBeGreaterThan(0);
        for (const т of до.длинные) {
            expect(т.видно, 'таблица из ' + т.всего + ' строк показывает ' + т.видно +
                ', а должна десять').toBe(10);
        }
        expect(до.кн.length, 'кнопок отсечки меньше, чем длинных таблиц')
            .toBe(до.длинные.length);
        for (const к of до.кн) {
            expect(ШКАЛА_КНОПОК, 'кнопка «' + к.текст + '» высотой ' + к.высота +
                ' — такой ступени на шкале нет').toContain(к.высота);
            expect(к.aria, 'кнопка не сказала диктору, что раздел свёрнут').toBe('false');
            expect(/\(\d+\)/.test(к.текст), 'кнопка не называет, сколько прячет: ' + к.текст)
                .toBe(true);
        }

        /* НАЖАТИЕ, А НЕ ЧТЕНИЕ КЛАССА: слой цели уже однажды съедал кнопку. */
        const сколько = await page.locator('.td-more').count();
        for (let i = 0; i < сколько; i++) await page.locator('.td-more').first().click();
        await page.waitForTimeout(300);
        const после = await page.evaluate(() => {
            const вид = э => э && э.offsetParent !== null && !э.hidden;
            return {
                спрятанных: [...document.querySelectorAll('table')]
                    .filter(t => t.offsetParent !== null && t.querySelectorAll('tbody tr').length > 10)
                    .map(t => [...t.querySelectorAll('tbody tr')].filter(r => !вид(r)).length)
                    .reduce((a, b) => a + b, 0),
                кнопок: document.querySelectorAll('.td-more').length
            };
        });
        expect(после.спрятанных, 'после нажатия часть строк осталась скрытой').toBe(0);
        expect(после.кнопок, 'кнопка осталась после раскрытия').toBe(0);
    });

    /* ДВЕ ПРЯТАЛКИ НЕ РАБОТАЮТ ВМЕСТЕ. Это про ДАННЫЕ, и заморозка такого
       не видит: условие стоит в коде, а истина — в статусах матчей. */
    test('у идущего турнира прячет полоса «Сыгранные», а отсечка молчит', async ({ page }) => {
        await page.route('**/rest/v1/matches*', async route => {
            const ответ = await route.fetch();
            let тело;
            try { тело = await ответ.json(); } catch (e) { return route.fulfill({ response: ответ }); }
            if (Array.isArray(тело)) {
                тело = тело.map((м, i) => (i % 2 === 1)
                    ? Object.assign({}, м, { status: 'scheduled', score: null, winner_id: null })
                    : м);
            }
            await route.fulfill({ response: ответ, body: JSON.stringify(тело) });
        });
        await открыть(page, Я.файл, РАСПИСАНИЕ, '#scheduleContainer table tbody tr');
        const r = await page.evaluate(() => {
            const sc = document.querySelector('#scheduleContainer');
            return {
                полоса: !!sc.querySelector('.td-sched-ranshe'),
                отсечка: sc.querySelectorAll('.td-more').length,
                спрятаноКлассом: sc.querySelectorAll('.td-row-skryta').length,
                строк: sc.querySelectorAll('tbody tr').length
            };
        });
        expect(r.строк, 'ПОРОГ: строк расписания нет').toBeGreaterThan(10);
        expect(r.полоса, 'у идущего турнира пропала полоса «Сыгранные»').toBe(true);
        expect(r.отсечка, 'отсечка по длине включилась вместе с полосой — ' +
            'ждущие матчи спрятаны длиной, а они и есть главное').toBe(0);
        expect(r.спрятаноКлассом, 'строки расписания спрятаны классом отсечки ' +
            'при живой полосе').toBe(0);
    });

});

}
