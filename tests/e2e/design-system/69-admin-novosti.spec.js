// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ПРОБА РАЗДЕЛА «НОВОСТИ» В АДМИНКЕ — форма заведения статьи.
 *
 * ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила читают файлы как текст: что отношение
 * написано, что класс назван, что порядок в разметке такой. Но ЧТО ВЫШЛО В
 * БРАУЗЕРЕ — какой ширины короба, одна ли у них высота, не поехал ли ряд,
 * собралась ли галерея предпросмотра — видно только прогоном.
 *
 * СТЕНД, А НЕ АДМИНКА. Форму рисует НАСТОЯЩИЙ модуль
 * `js/admin/sections/news.js` на стенде `maket/stend-admin-novosti.html`:
 * там подменён только клиент базы. Так прогон не требует входа, не ест
 * квоту и не зависит от того, что лежит в тестовой базе.
 * РАЗМЕТКА В СТЕНД НЕ СКОПИРОВАНА — скопированная остаётся зелёной после
 * того, как админку поменяли.
 *
 * В БАЗУ НЕ ПИШЕТ НИЧЕГО. Кнопки «Сохранить», «Опубликовать» и «Удалить»
 * не нажимаются вовсе. Автосохранение формы уходит сразу, пока заголовок
 * пуст, — а проба заголовок не трогает.
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ, ТОЛЬКО РУССКИЙ (решение Кости 29.09).
 * Телефонные виды пропускаются: раскладки для них в админке нет.
 */

const СТЕНД = '/maket/stend-admin-novosti.html';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

/** Отношение сторон коробки, округлённое до сотых. */
const k = коробка => Number((коробка.width / коробка.height).toFixed(2));

test.describe('Админка «Новости»: форма статьи', () => {

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
            'админка — десктоп и планшет, телефонной раскладки в ней нет');
        await page.goto(СТЕНД);
        await page.waitForSelector('body[data-stend-gotov="1"]', { timeout: 15000 });
        await page.waitForSelector('#adNewsImgZone .ad-afisha-pane img', { timeout: 15000 });
    });

    test('обложка показана двумя коробами, и у каждого своя подпись', async ({ page }) => {
        const короба = page.locator('#adNewsImgZone .ad-afisha-pane');
        await expect(короба).toHaveCount(2);
        await expect(page.locator('#adNewsImgZone .ad-afisha-cap').first())
            .toHaveText('Вверху страницы новости');
        await expect(page.locator('#adNewsImgZone .ad-afisha-cap').nth(1))
            .toHaveText('Карточка в списке');
    });

    test('короб шапки ШИРЕ короба карточки — иначе превью врёт про потерю', async ({ page }) => {
        const шапка = await page.locator('.ad-afisha-pane--novost-hero img').boundingBox();
        const карточка = await page.locator('.ad-afisha-pane--novost-card img').boundingBox();
        expect(k(шапка)).toBeGreaterThan(k(карточка));
        // Карточка показывает обрезку 16:9 целиком
        expect(k(карточка)).toBeGreaterThan(1.7);
        expect(k(карточка)).toBeLessThan(1.85);
    });

    test('шапка режет и приближает, карточка вписывает', async ({ page }) => {
        const шапка = await page.locator('.ad-afisha-pane--novost-hero img')
            .evaluate(э => { const с = getComputedStyle(э); return { fit: с.objectFit, tr: с.transform }; });
        const карточка = await page.locator('.ad-afisha-pane--novost-card img')
            .evaluate(э => getComputedStyle(э).objectFit);
        expect(шапка.fit).toBe('cover');
        expect(шапка.tr).toContain('1.1');   // то же приближение, что у страницы
        expect(карточка).toBe('contain');
    });

    test('у пары коробов одна высота, и ряд не вылезает за колонку', async ({ page }) => {
        const шапка = await page.locator('.ad-afisha-pane--novost-hero img').boundingBox();
        const карточка = await page.locator('.ad-afisha-pane--novost-card img').boundingBox();
        expect(Math.abs(шапка.height - карточка.height)).toBeLessThanOrEqual(1);

        const перелив = await page.evaluate(() => {
            const з = document.getElementById('adNewsImgZone');
            return з.scrollWidth - з.clientWidth;
        });
        expect(перелив).toBeLessThanOrEqual(1);
    });

    test('порядок блоков формы = порядок, в котором читают страницу', async ({ page }) => {
        const имена = await page.locator('.ad-form-card-title').allTextContents();
        expect(имена.slice(0, 7)).toEqual([
            'Обложка', 'Публикация', 'Заголовок', 'Краткое описание',
            'Строка под заголовком', 'Содержание', 'Предпросмотр'
        ]);
    });

    test('безымянных карточек в форме не осталось', async ({ page }) => {
        const без = await page.evaluate(() =>
            [...document.querySelectorAll('#ad-content .ad-form-card')]
                .filter(к => !к.querySelector('.ad-form-card-title')).length);
        expect(без).toBe(0);
    });

    test('языковая вкладка — подчёркивание, а не таблетка', async ({ page }) => {
        const вкл = page.locator('.ad-lang-tabs').first().locator('.ad-lang-tab');
        const активная = await вкл.nth(0).evaluate(э => {
            const с = getComputedStyle(э);
            return { radius: с.borderTopLeftRadius, ten: с.boxShadow, fon: с.backgroundColor,
                     ves: с.fontWeight, kegl: с.fontSize, h: э.getBoundingClientRect().height };
        });
        const спящая = await вкл.nth(1).evaluate(э => {
            const с = getComputedStyle(э);
            return { ten: с.boxShadow, ves: с.fontWeight };
        });
        expect(активная.radius).toBe('0px');
        expect(активная.ten).toContain('inset');
        expect(активная.fon).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
        expect(активная.ves).toBe('600');
        expect(активная.kegl).toBe('14px');
        expect(Math.round(активная.h)).toBe(36);
        expect(спящая.ves).toBe('500');
        expect(спящая.ten).toContain('rgba(0, 0, 0, 0)');  // подчёркивания у спящей нет
    });

    test('у вкладки есть прозрачная цель нажатия 44', async ({ page }) => {
        const цель = await page.locator('.ad-lang-tab').first().evaluate(э => {
            const с = getComputedStyle(э, '::after');
            return { h: с.height, content: с.content };
        });
        expect(цель.content).not.toBe('none');
        expect(parseFloat(цель.h)).toBeGreaterThanOrEqual(44);
    });

    test('однострочное поле: короб 44, межстрочный на ступени лестницы', async ({ page }) => {
        const поле = await page.locator('#adNewsAuthor').evaluate(э => {
            const с = getComputedStyle(э);
            return { h: э.getBoundingClientRect().height, lh: с.lineHeight, kegl: с.fontSize };
        });
        expect(Math.round(поле.h)).toBe(44);
        // 1.3 от кегля поля — ступень лестницы 1 · 1.1 · 1.3 · 1.5 · 1.65
        expect(parseFloat(поле.lh) / parseFloat(поле.kegl)).toBeCloseTo(1.3, 2);
    });

    test('предпросмотр рисует настоящую страницу, а не свою вёрстку', async ({ page }) => {
        await expect(page.locator('#adNewsPreview .news-article-page .news-html')).toHaveCount(1);
        const абзац = await page.locator('#adNewsPreview .news-html p').first().evaluate(э => {
            const с = getComputedStyle(э);
            return { lh: с.lineHeight, kegl: с.fontSize, w: э.getBoundingClientRect().width };
        });
        // Межстрочный абзаца страницы — 1.65, а не админский
        expect(parseFloat(абзац.lh) / parseFloat(абзац.kegl)).toBeCloseTo(1.65, 1);
        expect(абзац.w).toBeGreaterThan(0);
    });

    test('галерея предпросмотра — компонент страницы, своей вёрстки нет', async ({ page }) => {
        await expect(page.locator('#adNewsPreview .news-carousel')).toHaveCount(1);
        await expect(page.locator('#adNewsPreview .news-thumbs-row')).toHaveCount(1);
        await expect(page.locator('#adNewsPreview .news-carousel-thumb')).toHaveCount(2);
        const своя = await page.evaluate(() =>
            document.querySelectorAll('[class*="ad-prev-"]').length);
        expect(своя).toBe(0);
    });

    test('у подзаголовка есть предел 240 и живой счётчик остатка', async ({ page }) => {
        await expect(page.locator('#adNewsExcerpt')).toHaveAttribute('maxlength', '240');
        await expect(page.locator('#adNewsExcerptSchet')).toContainText('осталось');
    });

    test('кнопки полосы редактора — ступень 36 и прозрачная цель 44', async ({ page }) => {
        /* ТОЛЬКО ВИДИМАЯ ВКЛАДКА. Редакторов в разметке ТРИ — ru, en и kg, —
           и два из них лежат в скрытых панелях. ЭЛЕМЕНТ СО СКРЫТЫМ РОДИТЕЛЕМ
           ОТДАЁТ НУЛИ: замер по всем тридцати кнопкам дал бы двадцать нулей
           и упал бы не на продукте, а на самом себе. */
        const кнопки = page.locator('.ad-lang-panel.active .ad-editor-btn');
        const сколько = await кнопки.count();
        expect(сколько).toBeGreaterThan(0);
        for (let i = 0; i < сколько; i++) {
            const замер = await кнопки.nth(i).evaluate(э => ({
                h: э.getBoundingClientRect().height,
                цель: parseFloat(getComputedStyle(э, '::after').height)
            }));
            expect(Math.round(замер.h)).toBe(36);
            expect(замер.цель).toBeGreaterThanOrEqual(44);
        }
    });
});
