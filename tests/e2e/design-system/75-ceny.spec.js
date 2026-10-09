/**
 * СТРАНИЦА «ЦЕНЫ» — 09.10.
 *
 * Три языка. До правки это были два разных продукта: на русской прайс из
 * трёх строк и окно с периодами, на en и kg — одиночная карточка с ценой
 * 1 000 KGS, вписанной в разметку. Теперь механизм один, и проба идёт по
 * всем трём одинаково.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧИСЛА ИЗ БРАУЗЕРА. В файле имя крутилки; что из него вышло на этом
 *     виде, видно только на живой странице;
 *   • ДОЛЮ ЭКРАНА. Обложка лёжа забирала 77% — в пикселях это 300, и
 *     число само по себе ничего не говорит;
 *   • ПАРУ «ЗАГОЛОВОК + ПЕРЕБИВКА». Она обязана ехать одной связкой на
 *     три ступени: 40↔21, 32↔18, 26↔16. Проверка «кегль со шкалы» этого
 *     не видит — 14 тоже ступень, и пара разъезжается молча;
 *   • СУММЫ ИЗ БАЗЫ. Пустая сумма — не ошибка, а состояние: строка пишет
 *     «уточняется», и кнопка оплаты выключена. Файл этого не покажет;
 *   • БЛОК БЕСПЛАТНОГО ПЕРИОДА. Он появляется, только если в app_settings
 *     лежит непрошедшая дата. Разметка всегда скрыта;
 *   • ОКНО. Оно открывается нажатием, в списке элементов его состояния
 *     нет: ширина, выбор одной границей, цель закрытия, ловушка Tab;
 *   • ФОКУС. Правило в css есть, а рисует ли браузер контур — решает
 *     живой focus().
 *
 * ПОРОГ: нет обложки или нет прайса — проверка ПАДАЕТ, а не проходит
 * вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];
const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.pr-hero-title') !== null, null, { timeout: 20000 });
    await page.waitForFunction(
        () => document.querySelectorAll('.pm-row').length >= 3, null, { timeout: 20000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(500);
}

for (const Я of ЯЗЫКИ) {
test.describe('цены · ' + Я.имя, () => {

    test('обложка не забирает экран, пара едет одной связкой', async ({ page }) => {
        await открыть(page, '/pages/pricing' + Я.хвост + '.html');
        const з = await page.evaluate(() => {
            const г = document.querySelector('.pr-hero');
            const ч = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 100) / 100 : null;
            return {
                высота: Math.round(г.getBoundingClientRect().height),
                окно: window.innerHeight,
                заголовок: ч(г.querySelector('.pr-hero-title')),
                перебивка: ч(г.querySelector('.pr-hero-subtitle')),
            };
        });

        expect(з.высота, 'ПОРОГ: обложки нет вовсе').toBeGreaterThan(80);
        const доля = з.высота / з.окно;
        expect(доля, 'обложка съела ' + Math.round(доля * 100) + '% экрана (было 77% лёжа)')
            .toBeLessThanOrEqual(0.6);

        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок мимо шкалы: ' + з.заголовок).toContain(з.заголовок);
        expect(ШКАЛА_КЕГЛЕЙ, 'перебивка мимо шкалы: ' + з.перебивка).toContain(з.перебивка);

        /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО. */
        const шагов = ШКАЛА_КЕГЛЕЙ.indexOf(з.заголовок) - ШКАЛА_КЕГЛЕЙ.indexOf(з.перебивка);
        expect(шагов, 'пара обложки разъехалась: ' + з.заголовок + ' и ' + з.перебивка +
               ' — ' + шагов + ' ступеней вместо трёх').toBe(3);
    });

    test('лестница текста — каждый уровень на ступени', async ({ page }) => {
        await открыть(page, '/pages/pricing' + Я.хвост + '.html');
        const беды = await page.evaluate(({ кегли, строки }) => {
            const плохо = [];
            document.querySelectorAll('main *, .pmm-overlay *').forEach(el => {
                if (!el.textContent || !el.textContent.trim()) return;
                if (el.children.length && !['BUTTON', 'A', 'LI', 'H1', 'H2', 'H3', 'H4', 'P', 'SPAN'].includes(el.tagName)) return;
                const s = getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden') return;
                const fs = Math.round(parseFloat(s.fontSize) * 100) / 100;
                const lh = parseFloat(s.lineHeight);
                if (!кегли.includes(fs)) плохо.push('кегль ' + fs + ' у ' + el.tagName + '.' + (el.className || ''));
                if (lh && fs) {
                    const o = Math.round(lh / fs * 100) / 100;
                    if (!строки.some(с => Math.abs(с - o) < 0.02))
                        плохо.push('межстрочный ' + o + ' у ' + el.tagName + '.' + (el.className || ''));
                }
            });
            return [...new Set(плохо)].slice(0, 6);
        }, { кегли: ШКАЛА_КЕГЛЕЙ, строки: ЛЕСТНИЦА_СТРОК });

        expect(беды, 'мимо лестницы: ' + беды.join(' · ')).toEqual([]);
    });

    test('суммы и блок бесплатного периода — из базы, а не из разметки', async ({ page }) => {
        await открыть(page, '/pages/pricing' + Я.хвост + '.html');
        const д = await page.evaluate(() => {
            const блок = document.getElementById('prFree');
            const суммы = [...document.querySelectorAll('[data-plan]')].map(e => e.textContent.trim());
            const go = document.getElementById('payGo');
            return {
                строк: суммы.length,
                суммы,
                сВеличиной: [...document.querySelectorAll('[data-plan]')].filter(e => e.classList.contains('set')).length,
                блокЕсть: !!блок,
                блокВиден: блок ? !блок.hidden : false,
                заголовокБлока: блок ? (document.getElementById('prFreeTitle').textContent || '').trim() : '',
                кнопкаОплаты: go ? go.disabled : null,
                ценаВРазметке: /1[,.\s]?000/.test(document.querySelector('.pm-card').textContent),
            };
        });

        expect(д.строк, 'ПОРОГ: прайса нет вовсе').toBeGreaterThanOrEqual(3);
        expect(д.блокЕсть, 'блок бесплатного периода пропал из разметки').toBe(true);
        expect(д.ценаВРазметке, 'в карточку вернулась сумма из разметки').toBe(false);

        /* СОСТОЯНИЕ — ПРОИЗВОДНОЕ ОТ ДАННЫХ, А НЕ ОТ РАЗМЕТКИ: сумма пришла —
           строка её показывает и кнопка живёт; не пришла — «уточняется» и
           кнопка выключена. Обе ветки законны, незаконна только третья. */
        if (д.сВеличиной === 0) {
            expect(д.кнопкаОплаты, 'сумм нет, а кнопка оплаты включена').toBe(true);
        } else {
            expect(д.кнопкаОплаты, 'суммы есть, а кнопка оплаты так и выключена').toBe(false);
        }

        /* Блок виден ровно тогда, когда у него есть заголовок с датой. */
        if (д.блокВиден) {
            expect(д.заголовокБлока.length, 'блок бесплатного периода виден, а заголовка в нём нет')
                .toBeGreaterThan(3);
        }
    });

    test('окно оплаты: ширина, выбор границей, цели и ловушка Tab', async ({ page }) => {
        await открыть(page, '/pages/pricing' + Я.хвост + '.html');
        await page.click('#prPayBtn');
        await page.waitForSelector('.pmm', { state: 'visible', timeout: 5000 });

        const о = await page.evaluate(() => {
            const окно = document.querySelector('.pmm');
            const цель = e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
            const вариант = document.querySelector('.pmm-opt');
            const другой = document.querySelectorAll('.pmm-opt')[1];
            return {
                ширина: Math.round(окно.getBoundingClientRect().width),
                закрытие: цель(document.querySelector('.pmm-close')),
                способы: [...document.querySelectorAll('.pmm-way')].map(w => ({ тег: w.tagName, ...цель(w) })),
                кнопка: цель(document.querySelector('.pmm-go')),
                вариантТег: вариант.tagName,
                выбранФон: getComputedStyle(вариант).backgroundColor,
                невыбранФон: другой ? getComputedStyle(другой).backgroundColor : null,
                выбранКрай: getComputedStyle(вариант).borderTopColor,
                невыбранКрай: другой ? getComputedStyle(другой).borderTopColor : null,
            };
        });

        expect(о.ширина, 'окно шире ступени md 520').toBeLessThanOrEqual(520);
        expect(о.закрытие.w, 'цель закрытия уже 44 (было 15 × 26)').toBeGreaterThanOrEqual(44);
        expect(о.закрытие.h, 'цель закрытия ниже 44').toBeGreaterThanOrEqual(44);
        expect(о.кнопка.h, 'кнопка оплаты ниже 44').toBeGreaterThanOrEqual(44);

        о.способы.forEach((с, i) => {
            expect(с.тег, 'способ оплаты ' + (i + 1) + ' снова не кнопка: ' + с.тег).toBe('BUTTON');
            expect(с.h, 'способ оплаты ' + (i + 1) + ' ниже 44').toBeGreaterThanOrEqual(44);
        });

        /* ВЫБОР МЕНЯЕТ ТОЛЬКО ГРАНИЦУ — правило Card 29:65. */
        expect(о.выбранФон, 'выбранному варианту вернули заливку: выбор и наведение станут неразличимы')
            .toBe(о.невыбранФон);
        expect(о.выбранКрай === о.невыбранКрай,
               'выбранный вариант ничем не отличается от невыбранного').toBe(false);

        /* Ловушка Tab: с последнего уходим на первый, а не за окно. */
        const вловушке = await page.evaluate(async () => {
            /* ТОТ ЖЕ СПИСОК, ЧТО У КОДА. Первая редакция брала «.pmm button»
               без оговорки про disabled, и последней целью оказывалась
               выключенная кнопка оплаты: фокус на неё не встаёт вовсе, и
               проба падала на здоровом продукте. ПРИБОР ВРЁТ РАНЬШЕ, ЧЕМ
               ПРОДУКТ. */
            const цели = document.querySelectorAll('.pmm button:not([disabled]), .pmm [href], .pmm [tabindex]:not([tabindex="-1"])');
            if (!цели.length) return false;
            цели[цели.length - 1].focus();
            const до = document.activeElement;
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
            await new Promise(r => setTimeout(r, 100));
            return document.activeElement !== до && document.querySelector('.pmm').contains(document.activeElement);
        });
        expect(вловушке, 'из окна уходит Tab — фокус оказывается за ним').toBe(true);

        /* Escape закрывает и возвращает фокус на кнопку, с которой открыли. */
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        const закрыто = await page.evaluate(() => ({
            скрыто: document.getElementById('payModal').hidden,
            фокус: document.activeElement && document.activeElement.id,
        }));
        expect(закрыто.скрыто, 'Escape не закрыл окно').toBe(true);
        expect(закрыто.фокус, 'фокус не вернулся на кнопку, с которой открыли окно').toBe('prPayBtn');
    });

    test('фокус виден, цели карточки 44, перелива нет', async ({ page }) => {
        await открыть(page, '/pages/pricing' + Я.хвост + '.html');
        const р = await page.evaluate(() => {
            const кн = document.getElementById('prPayBtn');
            const r = кн.getBoundingClientRect();
            кн.focus();
            const s = getComputedStyle(кн);
            return {
                кнопка: { w: Math.round(r.width), h: Math.round(r.height) },
                контур: s.outlineStyle + ' ' + s.outlineWidth,
                перелив: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            };
        });
        expect(р.кнопка.h, 'кнопка карточки ниже 44 (замер до правки: 41)').toBeGreaterThanOrEqual(44);
        expect(р.контур, 'браузер не рисует контур фокуса на кнопке карточки').not.toContain('none');
        expect(р.перелив, 'страница едет вбок на ' + р.перелив).toBeLessThanOrEqual(1);
    });

    test('вопросы раскрываются по одному', async ({ page }) => {
        await открыть(page, '/pages/pricing' + Я.хвост + '.html');
        const вопросов = await page.locator('.ip-faq-question').count();
        expect(вопросов, 'ПОРОГ: вопросов нет вовсе').toBeGreaterThanOrEqual(3);

        await page.locator('.ip-faq-question').first().click();
        await page.waitForTimeout(500);
        const п = await page.evaluate(() => {
            const и = document.querySelector('.ip-faq-item.active');
            return { открыт: !!и, высота: и ? Math.round(и.querySelector('.ip-faq-answer').getBoundingClientRect().height) : 0 };
        });
        expect(п.открыт, 'первый вопрос не раскрылся').toBe(true);
        expect(п.высота, 'ответ раскрыт, но высота нулевая').toBeGreaterThan(10);

        await page.locator('.ip-faq-question').nth(1).click();
        await page.waitForTimeout(400);
        const открытых = await page.locator('.ip-faq-item.active').count();
        expect(открытых, 'открыто больше одного ответа сразу').toBe(1);
    });
});
}
