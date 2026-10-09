// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ПРОБА ВКЛАДКИ «НОВОСТИ» ВНУТРИ ТУРНИРА.
 *
 * ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила читают файлы как текст: что вкладка
 * ЗОВЁТ форму раздела. А что из этого вышло в браузере — приехали ли
 * обложка, редактор и предел подзаголовка, не осталось ли двух пар кнопок,
 * заполнился ли заголовок заготовкой — видно только прогоном.
 *
 * СТЕНД, А НЕ АДМИНКА. Панель рисует НАСТОЯЩАЯ `renderNewsPanel`
 * (js/admin/sections/bracket.js), которая зовёт НАСТОЯЩУЮ форму
 * (js/admin/sections/news.js). Подменён только клиент базы.
 * АДМИНКУ ИЗ ОБОЛОЧКИ НЕ ОТКРЫТЬ — она за входом, и пароля там быть не
 * должно: админские экраны меряются стендами.
 *
 * В БАЗУ НЕ ПИШЕТ НИЧЕГО: у заглушки нет ни insert, ни update, ни delete.
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ, ТОЛЬКО РУССКИЙ (решение Кости 29.09).
 */

const СТЕНД = '/maket/stend-admin-turnir-novost.html';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

test.describe('Вкладка «Новости» турнира', () => {

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
            'админка — десктоп и планшет, телефонной раскладки в ней нет');
        await page.goto(СТЕНД);
        await page.waitForSelector('body[data-stend-gotov="1"]', { timeout: 15000 });
        await page.waitForSelector('#adNewsTitle', { timeout: 15000 });
    });

    test('ЭТО ТА ЖЕ ФОРМА, ЧТО В РАЗДЕЛЕ: обложка, публикация, редактор', async ({ page }) => {
        await expect(page.locator('#adNewsImgZone')).toHaveCount(1);
        await expect(page.locator('#adNewsCat')).toHaveCount(1);
        await expect(page.locator('#adNewsContent')).toHaveCount(1);
        await expect(page.locator('#adNewsPreview')).toHaveCount(1);
        // Карточки все до одной — от формы раздела, своих у вкладки нет
        expect(await page.locator('.ad-form-card').count()).toBeGreaterThanOrEqual(10);
    });

    test('старой копии полей не осталось ни одного', async ({ page }) => {
        for (const id of ['adTrnNewsTitle', 'adTrnNewsContent', 'adTrnNewsExcerpt',
                          'adTrnNewsSave', 'adTrnNewsPublish']) {
            await expect(page.locator('#' + id)).toHaveCount(0);
        }
    });

    test('заголовок приезжает заготовкой генератора', async ({ page }) => {
        await expect(page.locator('#adNewsTitle')).toHaveValue(/Результаты/);
        await expect(page.locator('#adNewsContent')).toHaveValue(/Призовые места/);
    });

    test('ОЧКИ ИЗ ТЕКСТА УШЛИ', async ({ page }) => {
        const текст = await page.locator('#adNewsContent').inputValue();
        expect(текст).not.toMatch(/очков/);
        expect(текст).not.toMatch(/рейтинговых/);
        // А победители остались — ради них всё и затевалось
        expect(текст).toMatch(/Призовые места/);
    });

    test('ФОТО ЖИВЁТ В ОДНОМ МЕСТЕ: блока «Фото с турнира» больше нет', async ({ page }) => {
        /* Он был вторым местом под фотографии, и на странице это давало
           ДВЕ РАЗНЫЕ карусели — нижнюю и внутри текста. Снят по слову
           Кости 09.10: замер базы показал, что из девяти статей с непустой
           `gallery` ни одна не из турнира — блоком не пользовались ни разу */
        await expect(page.locator('#adTrnPhotoGrid')).toHaveCount(0);
        await expect(page.locator('#adTrnPhotoInput')).toHaveCount(0);
        // Фото вставляются редактором — он на месте
        await expect(page.locator('#adNewsContentImgInput')).toHaveCount(1);
    });

    test('«Рассылка в ТГ» есть и погашена, пока статья не опубликована', async ({ page }) => {
        const тг = page.locator('#adTrnNewsTg');
        await expect(тг).toHaveCount(1);
        await expect(тг).toBeDisabled();
    });

    test('ряд кнопок ОДИН, а не два', async ({ page }) => {
        await expect(page.locator('.ad-btn-row')).toHaveCount(1);
        await expect(page.locator('#adNewsSave')).toHaveCount(1);
        await expect(page.locator('#adNewsPublish')).toHaveCount(1);
        // Своя кнопка турнира стоит в том же ряду, а не в своём
        await expect(page.locator('.ad-btn-row #adTrnNewsTg')).toHaveCount(1);
    });

    test('своей шапки раздела у вкладки нет', async ({ page }) => {
        await expect(page.locator('.ad-section-title')).toHaveCount(0);
        await expect(page.locator('#adNewsBack')).toHaveCount(0);
    });

    test('предел подзаголовка приехал вместе с формой', async ({ page }) => {
        const счётчик = page.locator('#adNewsExcerptSchet');
        await expect(счётчик).toHaveCount(1);
        await page.locator('#adNewsExcerpt').fill('а'.repeat(100));
        await expect(счётчик).toContainText('140');
    });

    test('три языка у заголовка, и вкладки переключаются', async ({ page }) => {
        const вкладки = page.locator('#adNewsTitle').locator('xpath=ancestor::div[contains(@class,"ad-form-card")]')
            .locator('.ad-lang-tab');
        await expect(вкладки).toHaveCount(3);
        await вкладки.nth(1).click();
        await expect(page.locator('#adNewsTitleEn')).toBeVisible();
    });

});
