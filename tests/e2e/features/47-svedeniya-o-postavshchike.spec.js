/**
 * СВЕДЕНИЯ О ПОСТАВЩИКЕ В ПОДВАЛЕ (Ю7, 11.11.2026).
 *
 * Статья 33 требует, чтобы покупатель видел наименование, регистрационный
 * номер, юридический адрес и применимое право. Замер 11.11 по боевым
 * страницам: в подвале не было НИ ОДНОГО поля ни на одном из трёх языков.
 *
 * ЧТО ПРОВЕРЯЕТ ИМЕННО ПРОБА, А НЕ СТОРОЖ. Сторож читает файл как текст:
 * он видит, что строка написана, и не видит, ВИДНА ЛИ ОНА. Здесь меряется
 * то, чего в тексте нет: читаемость краски, перелив за край экрана и
 * горизонтальная прокрутка — на пяти видах и трёх языках.
 * ЗАМОРОЗКА ЧИТАЕТ ФАЙЛ КАК ТЕКСТ И НЕ ЗАМЕНЯЕТ НИ ТЕСТЫ, НИ ГЛАЗА.
 */
const { test, expect } = require('../../fixtures');

const ИНН = '01905202110030';
const РЕГ = '197575-3301';

const СТРАНИЦЫ = [
    { к: 'ru', адрес: '/index.html',    имя: 'Кыргызстанское сообщество любителей тенниса', право: /законодательств/i },
    { к: 'en', адрес: '/index-en.html', имя: 'Kyrgyzstan Social Lawn Tennis Community',     право: /laws of the Kyrgyz Republic/i },
    { к: 'kg', адрес: '/index-kg.html', имя: 'коомдук фонду',                                право: /мыйзамдар/i },
];

for (const стр of СТРАНИЦЫ) {
    test(`${стр.к}: сведения о поставщике видны и читаемы`, async ({ page }) => {
        await page.goto(стр.адрес, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.footer-entity', { timeout: 15000 });

        const о = await page.evaluate(() => {
            const p = document.querySelector('.footer-entity');
            const c = getComputedStyle(p), r = p.getBoundingClientRect();
            return {
                текст: p.textContent.replace(/\s+/g, ' ').trim(),
                видим: c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0,
                ширина: Math.round(r.width), высота: Math.round(r.height),
                кегль: parseFloat(c.fontSize),
                вылезает: r.right > innerWidth + 1 || r.left < -1,
                прокруткаСтраницы: document.documentElement.scrollWidth > innerWidth + 1,
                окно: innerWidth,
            };
        });

        expect(о.видим, 'блок сведений виден').toBe(true);
        expect(о.высота, 'блок сведений не схлопнут').toBeGreaterThan(8);

        /* ПОЛЯ ЗАКОНА — КАЖДОЕ НАЗЫВАЕТСЯ ОТДЕЛЬНО: «что-то есть» не ответ. */
        expect(о.текст, 'наименование на своём языке').toContain(стр.имя);
        expect(о.текст, 'ИНН').toContain(ИНН);
        expect(о.текст, 'регистрационный номер').toContain(РЕГ);
        expect(о.текст, 'юридический адрес').toMatch(/127/);
        expect(о.текст, 'применимое право').toMatch(стр.право);

        /* ПЕРСОНАЛЬНЫЕ ДАННЫЕ ЖИВОГО ЧЕЛОВЕКА В ПОДВАЛ НЕ ВЫНОСЯТСЯ. */
        expect(о.текст, 'без ФИО директора').not.toMatch(/Чокоев|Chokoeva/i);

        /* ПЕРЕЛИВ ЗА КРАЙ — ЭТО НЕ «МЕЛОЧЬ ВНИЗУ СТРАНИЦЫ»: он даёт
           горизонтальную прокрутку всему документу на узком виде. */
        expect(о.вылезает, `блок не вылезает за экран (окно ${о.окно})`).toBe(false);
        expect(о.прокруткаСтраницы, 'страница не поехала вбок').toBe(false);
    });

    test(`${стр.к}: сведения не ниже планки контраста`, async ({ page }) => {
        await page.goto(стр.адрес, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.footer-entity', { timeout: 15000 });

        /* СЧЁТ КОНТРАСТА В ПРОДУКТЕ ОДИН — зовём общий модуль, а не свою
           копию формулы (кусок 186). */
        const р = await page.evaluate(
            async () => (await import('/tools/kontrast.mjs')).замер(99));
        expect(Array.isArray(р.худшие),
            'модуль контраста отдал список: ключи ' + Object.keys(р).join(', ')).toBe(true);

        const наши = р.худшие.filter(о => /footer-entity/.test(о.путь));
        const список = наши.map(о =>
            `  ${о.путь} «${о.текст}» — ${о.контраст} при ${о.порог} (${о.кегль}px)`).join('\n');
        expect(наши.length, `сведения о поставщике ниже планки:\n${список}`).toBe(0);
    });
}
