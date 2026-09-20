// @ts-check
/**
 * Заморозка подвала: цели нажатия и раскладка.
 *
 * Эти числа добывались замерами по живой странице, и без теста они
 * держатся только на честном слове. Переименуют класс, поправят
 * медиазапрос, сдвинут константу — вёрстка молча вернётся к прежнему,
 * и заметят это не скоро: подвал никто не открывает специально.
 *
 * Что случилось до появления теста, чтобы не повторилось:
 *
 *   1. Ссылки правовых документов были высотой 17 при норме 44. Зона
 *      попадания — восемь пикселей вверх и восемь вниз; промах уводил
 *      либо в пустоту, либо в СОСЕДНИЙ документ.
 *   2. Кнопка «наверх» закреплена в правом нижнем углу и не знала о
 *      подвале. Правые 44px заголовков гармошки — вся зона стрелки —
 *      принимали нажатие на себя. Человек жал «раскрыть раздел» и
 *      улетал наверх страницы.
 *   3. Скрипт складывал разделы в гармошку до 640, а стили написаны до
 *      768. Полоса 641…768 — это iPad вертикально — не получала ни
 *      одного правила: четырнадцать ссылок по 15 пикселей.
 *   4. Гармошка дала 44 заголовку, а ссылки ВНУТРИ раскрытого раздела
 *      остались 15.
 *
 * Норма 44×44 — Apple HIG и WCAG 2.5.5. Минимум по WCAG 2.5.8 — 24×24,
 * и исключение по расстоянию тут не спасает: ряды стояли в 4px.
 *
 * Запуск:  npx playwright test tests/e2e/19-footer-tap-targets.spec.js
 */

const { test, expect } = require('@playwright/test');

const НОРМА = 44;

/** Ширина окна проекта решает, мобильная раскладка или десктопная. */
function мобильный(page) {
    const vp = page.viewportSize();
    return vp ? vp.width <= 768 : false;
}

async function кПодвалу(page) {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
}

test.describe('Подвал — цели нажатия', () => {

    test('ссылки правовых документов не меньше 44 в высоту', async ({ page }) => {
        await кПодвалу(page);
        const ссылки = page.locator('.footer-bottom-links a');
        await expect(ссылки).toHaveCount(3);

        const n = await ссылки.count();
        for (let i = 0; i < n; i++) {
            const box = await ссылки.nth(i).boundingBox();
            const текст = (await ссылки.nth(i).innerText()).trim();
            expect(box, `ссылка «${текст}» не отрисована`).not.toBeNull();
            if (!мобильный(page)) continue;   // на десктопе мышь, 44 не требуем
            expect(box.height, `цель нажатия «${текст}»`).toBeGreaterThanOrEqual(НОРМА);
        }
    });

    test('на мобильном правовые ссылки стоят в один ряд', async ({ page }) => {
        test.skip(!мобильный(page), 'проверка только для мобильной раскладки');
        await кПодвалу(page);
        const ряды = await page.evaluate(() => {
            const a = [...document.querySelectorAll('.footer-bottom-links a')];
            return [...new Set(a.map(el => Math.round(el.getBoundingClientRect().top)))].length;
        });
        // Перенос во второй ряд — это и есть возврат к дефекту: ряды
        // встают в 4px друг от друга, и цель нажатия схлопывается до 17.
        expect(ряды, 'ссылки перенеслись на второй ряд').toBe(1);
    });

    test('заголовки гармошки не меньше 44 и раскрываются', async ({ page }) => {
        test.skip(!мобильный(page), 'гармошка живёт только до 768');
        await кПодвалу(page);

        const подвал = page.locator('.footer-content');
        await expect(подвал).toHaveClass(/footer-acc/);

        const заголовки = page.locator('.footer-acc .footer-block:not(.footer-brand) h4');
        const n = await заголовки.count();
        expect(n).toBeGreaterThan(0);

        for (let i = 0; i < n; i++) {
            const box = await заголовки.nth(i).boundingBox();
            const текст = (await заголовки.nth(i).innerText()).trim();
            expect(box.height, `заголовок «${текст}»`).toBeGreaterThanOrEqual(НОРМА);
            await expect(заголовки.nth(i)).toHaveAttribute('role', 'button');
        }

        // Раскрытие работает и ссылки внутри тоже не мельче нормы
        const первый = заголовки.first();
        await первый.click();
        await page.waitForTimeout(350);
        await expect(первый).toHaveAttribute('aria-expanded', 'true');

        const внутри = page.locator('.footer-block.открыт .footer-links a');
        const m = await внутри.count();
        expect(m, 'раздел раскрылся, но ссылок в нём нет').toBeGreaterThan(0);
        for (let i = 0; i < m; i++) {
            const box = await внутри.nth(i).boundingBox();
            const текст = (await внутри.nth(i).innerText()).trim();
            expect(box.height, `ссылка внутри раздела «${текст}»`).toBeGreaterThanOrEqual(НОРМА);
        }
    });

    test('кнопка «наверх» не накрывает подвал', async ({ page }) => {
        await кПодвалу(page);

        const кнопка = page.locator('.scroll-to-top');
        const видна = await кнопка.evaluate(el => getComputedStyle(el).opacity !== '0');
        expect(видна, 'кнопка осталась видимой поверх подвала').toBe(false);

        // И по существу: нажатие в правый край заголовка должно попадать
        // в заголовок, а не в кнопку. Проверяем тычком, а не стилями.
        if (!мобильный(page)) return;
        const попал = await page.evaluate(() => {
            const h = document.querySelector('.footer-acc .footer-block:not(.footer-brand) h4');
            if (!h) return 'нет заголовка';
            const r = h.getBoundingClientRect();
            const el = document.elementFromPoint(r.right - 8, r.top + r.height / 2);
            if (!el) return 'пусто';
            if (el.closest('.scroll-to-top')) return 'кнопка';
            return el.closest('h4') ? 'заголовок' : el.tagName;
        });
        expect(попал, 'правый край заголовка перехватывает кнопка «наверх»').toBe('заголовок');
    });
});

test.describe('Подвал — разметка и содержимое', () => {

    test('правовые ссылки лежат в nav и списком', async ({ page }) => {
        await кПодвалу(page);
        const список = page.locator('.footer-bottom-links');
        await expect(список).toHaveCount(1);
        const устройство = await список.evaluate(el => ({
            тег: el.tagName.toLowerCase(),
            пунктов: el.querySelectorAll('li').length,
            вНавигации: !!el.closest('nav'),
            метка: el.closest('nav') ? el.closest('nav').getAttribute('aria-label') : null
        }));
        expect(устройство.тег).toBe('ul');
        expect(устройство.пунктов).toBe(3);
        expect(устройство.вНавигации, 'ссылки вне <nav> — читалке не за что зацепиться').toBe(true);
        expect(устройство.метка, 'у <nav> нет aria-label').toBeTruthy();
    });

    test('год в копирайте подставляется, а не лежит текстом', async ({ page }) => {
        await кПодвалу(page);
        const год = page.locator('.footer-year');
        await expect(год).toHaveCount(1);
        const текущий = String(new Date().getFullYear());
        await expect(год).toHaveText(текущий);
    });

    test('эмодзи скрыты от читалки', async ({ page }) => {
        await кПодвалу(page);
        const строка = page.locator('.footer-made');
        await expect(строка).toHaveCount(1);
        const скрытых = await строка.locator('[aria-hidden="true"]').count();
        expect(скрытых, 'эмодзи читаются вслух как «красное сердце»').toBeGreaterThan(0);
    });

    test('длинные названия на десктопе, короткие на мобильном', async ({ page }) => {
        await кПодвалу(page);
        const видно = await page.evaluate(() => {
            const вид = sel => {
                const el = document.querySelector(sel);
                return el ? getComputedStyle(el).display !== 'none' : null;
            };
            return { полное: вид('.footer-legal-full'), короткое: вид('.footer-legal-short') };
        });
        // ОСОЗНАННЫЙ ДУБЛЬ: подпись стоит дважды. Полные русские названия
        // занимают 457 при доступных 358 и переносятся во второй ряд, из-за
        // чего цель нажатия падает до 17. Короткие дают 333 в один ряд.
        if (мобильный(page)) {
            expect(видно.короткое, 'на мобильном должна быть короткая подпись').toBe(true);
            expect(видно.полное, 'полная подпись на мобильном ломает ряд').toBe(false);
        } else {
            expect(видно.полное, 'на десктопе место есть — название должно быть полным').toBe(true);
            expect(видно.короткое).toBe(false);
        }
    });

    test('на десктопе подвал остаётся пятиколоночным и без гармошки', async ({ page }) => {
        test.skip(мобильный(page), 'проверка только для десктопной раскладки');
        await кПодвалу(page);
        const подвал = page.locator('.footer-content');
        await expect(подвал).not.toHaveClass(/footer-acc/);
        const колонок = await подвал.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
        expect(колонок, 'сетка подвала на десктопе поехала').toBe(5);
    });
});
