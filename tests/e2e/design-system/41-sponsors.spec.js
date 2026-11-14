/**
 * СЕКЦИЯ СПОНСОРОВ `#sponsors` И ОКНО СПОНСОРА — доски 73:9 и 285:9,
 * решения Кости 24.09.
 *
 * Что проверяется и почему именно так:
 *
 *  · ПЛИТКИ РАВНЫ. Логотипы приходят из базы разной ширины при одной высоте —
 *    замерено на 1280: от 39 до 140. Без общей коробки вес на экране выходил
 *    втрое разный. Тест меряет ОТНОШЕНИЕ: все плитки одного размера.
 *  · ЦЕЛЬ НАЖАТИЯ — ВСЯ ПЛИТКА. Было: целью был сам логотип, и «STRETCH»
 *    давал 39 в ширину, мимо порога 44.
 *  · РЯДЫ. Ряд заполняется целиком, последний неполный встаёт по центру.
 *  · ЛАЙМА НЕТ. Он принадлежит кнопке «Подробнее о спонсорстве» выше.
 *  · ОКНО. role="dialog", метка, страница заперта, фокус внутри, крестик и
 *    «Закрыть» не ниже 44. Всё это проверяется НАСТОЯЩИМ нажатием.
 *  · ПОРЯДОК ОДИН. Карусель в шапке и секция внизу берут один и тот же
 *    список: два разных порядка на одном экране читаются как поломка.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети.
 */
const { test, expect } = require('../../fixtures');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

async function дождаться(page, адрес) {
    await page.goto(адрес);
    /* Секция приходит из базы. Ждём признак — что плитки появились, — а не
       таймер и не тишину сети. */
    await page.waitForFunction(() => {
        const c = document.querySelector('#sponsors .sponsors-cloud');
        return c && c.children.length > 0;
    }, null, { timeout: 15000 });
    await page.evaluate(() => {
        const s = document.getElementById('sponsors');
        if (s) s.scrollIntoView({ block: 'start' });
    });
    await page.waitForFunction(() => {
        const i = document.querySelector('#sponsors .sponsors-cloud img');
        return !i || i.complete || !i.getClientRects().length;
    }, null, { timeout: 8000 }).catch(() => {});
}

const снимок = page => page.evaluate(() => {
    const с = document.getElementById('sponsors');
    if (!с) return null;
    const R = э => { const r = э.getBoundingClientRect();
        return { л: Math.round(r.left), в: Math.round(r.top), ш: Math.round(r.width), вы: Math.round(r.height) }; };
    const плитки = [...с.querySelectorAll('.sponsors-cloud > *')];
    const поРядам = {};
    плитки.forEach(п => { const в = R(п).в; (поРядам[в] = поРядам[в] || []).push(п); });
    const ряды = Object.keys(поРядам).sort((a, b) => a - b).map(в => поРядам[в]);

    const лайм = [...с.querySelectorAll('*')].filter(э => {
        const c = getComputedStyle(э).color;
        return /204,\s*255,\s*0/.test(c);
    }).length;

    return {
        экран: { ш: window.innerWidth, вы: window.innerHeight },
        секция: R(с),
        плиток: плитки.length,
        размеры: [...new Set(плитки.map(п => R(п).ш + 'x' + R(п).вы))],
        вРядах: ряды.map(р => р.length),
        малые: плитки.filter(п => R(п).ш < 44 || R(п).вы < 44).length,
        облакоЛевый: (() => { const o = с.querySelector('.sponsors-cloud'); return o ? R(o).л : null; })(),
        лаймовых: лайм,
        логотипов: с.querySelectorAll('.sponsors-cloud img').length,
        горПрокрутка: document.documentElement.scrollWidth > window.innerWidth + 1
    };
});

СТРАНИЦЫ.forEach(({ имя, адрес }) => {
    test.describe('Спонсоры · ' + имя, () => {

        test('все плитки одного размера', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с, 'секция #sponsors на странице').not.toBeNull();
            expect(с.плиток, 'плитки отрисованы').toBeGreaterThan(0);
            expect(с.размеры.length, 'размеров найдено: ' + с.размеры.join(' · ')).toBe(1);
        });

        test('цель нажатия — вся плитка, и она не ниже 44', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.малые, 'плиток мельче 44: ' + с.малые + ' из ' + с.плиток).toBe(0);
        });

        test('ряды заполняются целиком, последний может быть неполным', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            const полные = с.вРядах.slice(0, -1);
            const первый = полные[0];
            полные.forEach((n, i) => {
                expect(n, 'ряд ' + (i + 1) + ' из ' + с.вРядах.join('+')).toBe(первый);
            });
            if (с.вРядах.length > 1) {
                expect(с.вРядах[с.вРядах.length - 1], 'последний ряд не больше полного')
                    .toBeLessThanOrEqual(первый);
            }
        });

        test('лайма в секции нет', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.лаймовых, 'лаймовых надписей в секции').toBe(0);
        });

        test('у каждого логотипа своя плитка, прокрутки нет', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.логотипов, 'логотипов ' + с.логотипов + ' при ' + с.плиток + ' плитках')
                .toBeLessThanOrEqual(с.плиток);
            expect(с.горПрокрутка, 'горизонтальной прокрутки нет').toBe(false);
        });

        test('кольцо фокуса приходит на плитку по настоящему Tab', async ({ page }) => {
            await дождаться(page, адрес);
            const есть = await page.evaluate(() => {
                const п = document.querySelector('#sponsors .sponsors-cloud a');
                if (!п) return 'нет ссылок';
                const все = [...document.querySelectorAll('a[href], button')];
                const i = все.indexOf(п);
                if (i > 0) все[i - 1].focus();
                return 'ок';
            });
            if (есть === 'нет ссылок') return;
            await page.keyboard.press('Tab');
            const кольцо = await page.evaluate(() => {
                const a = document.activeElement;
                if (!a.closest || !a.closest('#sponsors')) return { внутри: false };
                const s = getComputedStyle(a);
                return { внутри: true, видимо: a.matches(':focus-visible'),
                         стиль: s.outlineStyle, ширина: Math.round(parseFloat(s.outlineWidth)) };
            });
            expect(кольцо.внутри, 'Tab довёл фокус до плитки спонсора').toBe(true);
            expect(кольцо.видимо, 'плитка получила :focus-visible').toBe(true);
            expect(кольцо.стиль, 'кольцо нарисовано').not.toBe('none');
            expect(кольцо.ширина, 'толщина кольца ' + кольцо.ширина).toBeGreaterThanOrEqual(3);
        });

        test('окно спонсора объявлено, заперто и держит фокус', async ({ page }) => {
            await дождаться(page, адрес);
            const открылось = await page.evaluate(async () => {
                const a = document.querySelector('#sponsors .sponsors-cloud [data-sponsor-id]');
                if (!a) return false;
                a.click();
                await new Promise(r => setTimeout(r, 400));
                return !!document.querySelector('.spon-modal-overlay');
            });
            expect(открылось, 'нажатие на плитку открыло окно').toBe(true);

            const о = await page.evaluate(() => {
                const ov = document.querySelector('.spon-modal-overlay');
                const m = ov.querySelector('.spon-modal');
                const R = э => { const r = э.getBoundingClientRect();
                    return { ш: Math.round(r.width), вы: Math.round(r.height) }; };
                const кр = ov.querySelector('.spon-modal-close');
                const кн = ov.querySelector('.spon-modal-close-btn');
                return {
                    role: m.getAttribute('role'),
                    ariaModal: m.getAttribute('aria-modal'),
                    метка: m.getAttribute('aria-label'),
                    запор: getComputedStyle(document.body).overflow,
                    фокусВнутри: m.contains(document.activeElement),
                    крестик: R(кр), кнопка: кн ? R(кн) : null
                };
            });
            expect(о.role, 'role окна').toBe('dialog');
            expect(о.ariaModal, 'aria-modal').toBe('true');
            expect(о.метка, 'у окна есть имя').toBeTruthy();
            expect(о.запор, 'страница под окном заперта').toBe('hidden');
            expect(о.фокусВнутри, 'фокус ушёл внутрь окна').toBe(true);
            expect(Math.min(о.крестик.ш, о.крестик.вы), 'крестик ' + о.крестик.ш + 'x' + о.крестик.вы)
                .toBeGreaterThanOrEqual(44);
            if (о.кнопка) {
                expect(о.кнопка.вы, 'кнопка «Закрыть» высотой ' + о.кнопка.вы).toBeGreaterThanOrEqual(44);
            }
        });

        test('Escape закрывает окно и возвращает страницу', async ({ page }) => {
            await дождаться(page, адрес);
            await page.evaluate(async () => {
                const a = document.querySelector('#sponsors .sponsors-cloud [data-sponsor-id]');
                if (a) { a.click(); await new Promise(r => setTimeout(r, 400)); }
            });
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            const после = await page.evaluate(() => ({
                окно: !!document.querySelector('.spon-modal-overlay.visible'),
                запор: getComputedStyle(document.body).overflow
            }));
            expect(после.окно, 'окно закрылось').toBe(false);
            expect(после.запор, 'страница снова листается').not.toBe('hidden');
        });

        test('карусель в шапке и секция внизу показывают один порядок', async ({ page }) => {
            await дождаться(page, адрес);
            const п = await page.evaluate(() => {
                const шапка = [...document.querySelectorAll('#heroSponsorsCarousel .carousel-slide-infinite')]
                    .map(э => (э.getAttribute('title') || '').trim()).filter(Boolean);
                const низ = [...document.querySelectorAll('#sponsors .sponsors-cloud > *')]
                    .map(э => (э.getAttribute('title') || '').trim()).filter(Boolean);
                return { шапка, низ };
            });
            if (!п.шапка.length || !п.низ.length) return;
            /* СЕКЦИЯ ИДЁТ ПОДРЯД ВНУТРИ КАРУСЕЛИ, А НЕ С ЕЁ НАЧАЛА (01.11).
               Было: сравнивались НАЧАЛА обоих списков. Это верно только
               пока у клуба нет главного спонсора: карусель показывает
               ВСЕХ, а секция внизу — только не-главных
               (`js/sponsors-loader.js:342` и `:350`). Появился главный —
               и начала разошлись на нём, хотя порядок один и тот же.
               Поймалось посевом 01.11, когда в тестовой базе завелись
               два `is_hero`.
               ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ПОЛОЖЕНИЕ: «секция — это
               кусок карусели, идущий подряд». Порядок разъедется —
               вхождения не будет, и правило упадёт так же. */
            const вхождение = п.шапка.join('|').indexOf(п.низ.join('|'));
            expect(вхождение, 'шапка и секция идут одним порядком:\n' +
                '    шапка: ' + п.шапка.join(' · ') + '\n' +
                '    секция: ' + п.низ.join(' · ')).toBeGreaterThanOrEqual(0);
        });

        /* ОТКРЫВАЕТ ОКНО — ЗНАЧИТ КНОПКА (13.11). Плитка спонсора никуда
           не ведёт: она открывает окно с карточкой. До 13.11 она была
           `<a href="#">`, и диктор объявлял её ссылкой — незрячий ждал
           перехода на сайт спонсора, а получал окно.
           И ВТОРОЙ КРУГ ЛЕНТЫ: она склеена из двух одинаковых проходов,
           чтобы шов не был виден. Глазу это один ряд, диктору до 13.11 —
           каждый спонсор дважды, а Tab останавливался на нём два раза.
           ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ: помечена РОВНО половина ленты, и это
           вторая половина, а первая остаётся в обходе целиком. */
        test('плитка с окном — кнопка, и второй круг ленты не звучит дважды', async ({ page }) => {
            await дождаться(page, адрес);
            const о = await page.evaluate(() => {
                const плитки = [...document.querySelectorAll('[data-sponsor-id]')];
                const лента = [...document.querySelectorAll('#heroSponsorsCarousel .carousel-slide-infinite')];
                const половина = лента.length / 2;
                const имя = э => (э.getAttribute('title') || '').trim();
                const первый = плитки[0] ? getComputedStyle(плитки[0]) : null;
                return {
                    плиток: плитки.length,
                    неКнопки: плитки.filter(э => э.tagName !== 'BUTTON' ||
                        э.getAttribute('type') !== 'button').map(э => э.tagName),
                    решётки: document.querySelectorAll('a[href="#"]').length,
                    лента: лента.length,
                    скрытыхВсего: лента.filter(э => э.getAttribute('aria-hidden') === 'true').length,
                    скрытыхВПервой: лента.slice(0, половина)
                        .filter(э => э.getAttribute('aria-hidden') === 'true').length,
                    вОбходеВоВторой: лента.slice(половина).filter(э => э.tabIndex >= 0).length,
                    парыСовпали: лента.slice(0, половина).every((э, i) => имя(э) === имя(лента[половина + i])),
                    вид: первый ? {
                        шрифт: первый.fontFamily, кегль: первый.fontSize,
                        фон: первый.backgroundColor, курсор: первый.cursor,
                        выравн: первый.textAlign
                    } : null,
                    шрифтТела: getComputedStyle(document.body).fontFamily
                };
            });
            if (!о.плиток) return;

            expect(о.неКнопки, 'плитки с окном объявлены кнопками: ' + о.неКнопки.join(', ')).toEqual([]);
            expect(о.решётки, 'ссылок на решётку на странице не осталось').toBe(0);

            if (о.лента) {
                expect(о.лента % 2, 'лента склеена из двух одинаковых кругов').toBe(0);
                expect(о.парыСовпали, 'второй круг повторяет первый тем же порядком').toBe(true);
                expect(о.скрытыхВсего, 'от диктора спрятана ровно половина ленты').toBe(о.лента / 2);
                expect(о.скрытыхВПервой, 'первый круг слышен весь').toBe(0);
                expect(о.вОбходеВоВторой, 'второй круг выведен из обхода Tab').toBe(0);
            }

            /* ВИД НЕ ПОЕХАЛ. Умолчания кнопки не наследуются от страницы:
               без сброса сюда приедут системный шрифт 13.33, серая
               заливка, рамка, `text-align: center` и курсор-стрелка. */
            expect(о.вид.шрифт, 'шрифт плитки тот же, что у страницы').toBe(о.шрифтТела);
            expect(о.вид.кегль, 'кегль плитки').toBe('16px');
            expect(о.вид.фон, 'заливки у плитки нет').toBe('rgba(0, 0, 0, 0)');
            expect(о.вид.курсор, 'курсор над плиткой — рука').toBe('pointer');
            expect(о.вид.выравн, 'выравнивание не переехало в center').not.toBe('center');
        });
    });
});
