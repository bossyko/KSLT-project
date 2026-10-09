/**
 * СТРАНИЦЫ РАЗДЕЛА «ИНФО» — 09.10.
 *
 * ОДИН ФАЙЛ СТИЛЕЙ НА ШЕСТЬ СТРАНИЦ, поэтому и проба идёт по всем шести:
 * «О проекте», «Правила», FAQ, «Условия», «Политика», «Оферта» — на трёх
 * языках. Поломка в общем слое ломает шесть страниц сразу.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧИСЛА ИЗ БРАУЗЕРА. В файле имя крутилки — что из него вышло, видно
 *     только на живой странице, и на каждом виде своё;
 *   • ДОЛЮ ЭКРАНА. Высота обложки в пикселях ничего не говорит;
 *   • ТЕКСТ, ПРИШЕДШИЙ ИЗ БАЗЫ. «Оферта» и «Политика» берут тело из
 *     `site_documents`; 09.10 оттуда сняты восемь инлайновых кеглей.
 *     ФАЙЛ ЭТОГО НЕ ПОКАЖЕТ — только замер в браузере;
 *   • ФОКУС. Правило в css есть, а рисует ли браузер контур — решает живой
 *     `focus()`;
 *   • РАСКРЫВАШКУ FAQ. Она открывается нажатием, в разметке её состояния
 *     нет.
 *
 * ПОРОГ: нет обложки или нет текста — проверка ПАДАЕТ, а не проходит
 * вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];

const СТРАНИЦЫ = [
    { имя: 'о проекте', файл: 'about' },
    { имя: 'правила',   файл: 'rules' },
    { имя: 'вопросы',   файл: 'faq' },
    { имя: 'условия',   файл: 'terms' },
    { имя: 'политика',  файл: 'privacy-policy' },
    { имя: 'оферта',    файл: 'offer' },
];
const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];

/* ЖДАТЬ НАДО ПРИЗНАКА, А НЕ ТИШИНЫ СЕТИ. У «Оферты» и «Политики» тело
   приезжает из базы — ждём, пока текст перестанет расти два замера подряд. */
async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.ip-hero-title') !== null, null, { timeout: 20000 });
    await page.waitForFunction(() => {
        const n = (document.querySelector('.ip-container') || document.body).textContent.length;
        const было = window.__длина;
        window.__длина = n;
        return n > 300 && n === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

for (const С of СТРАНИЦЫ) {
for (const Я of ЯЗЫКИ) {
test.describe('инфо · ' + С.имя + ' · ' + Я.имя, () => {

    test('обложка не забирает экран, кегли со шкалы', async ({ page }) => {
        await открыть(page, '/pages/' + С.файл + Я.хвост + '.html');
        const з = await page.evaluate(() => {
            const г = document.querySelector('.ip-hero');
            const ч = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 100) / 100 : null;
            return {
                высота: Math.round(г.getBoundingClientRect().height),
                окно: window.innerHeight,
                заголовок: ч(г.querySelector('.ip-hero-title')),
                подзаголовок: ч(г.querySelector('.ip-hero-subtitle')),
            };
        });
        expect(з.высота, 'ПОРОГ: обложки нет вовсе').toBeGreaterThan(80);
        const доля = з.высота / з.окно;
        expect(доля, 'обложка съела ' + Math.round(доля * 100) + '% экрана').toBeLessThanOrEqual(0.6);
        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок мимо шкалы: ' + з.заголовок).toContain(з.заголовок);
        if (з.подзаголовок !== null)
            expect(ШКАЛА_КЕГЛЕЙ, 'подзаголовок мимо шкалы: ' + з.подзаголовок).toContain(з.подзаголовок);

        /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО. Пара «заголовок + перебивка»
           едет ОДНОЙ связкой: 40↔21, 32↔18, 26↔16 — ровно три ступени шкалы
           на каждом виде. Первая редакция этой пробы мерила только «со
           шкалы», и шов пропустила: кегль перебивки был объявлен дважды, в
           блоке ≤992 побеждало --fs-sm, и замер давал 14 — ступень законную,
           но свою третью лестницу обложки. Пара разъезжалась молча. */
        if (з.подзаголовок !== null) {
            const шагов = ШКАЛА_КЕГЛЕЙ.indexOf(з.заголовок) - ШКАЛА_КЕГЛЕЙ.indexOf(з.подзаголовок);
            expect(шагов, 'пара обложки разъехалась: ' + з.заголовок + ' и ' + з.подзаголовок +
                   ' — ' + шагов + ' ступеней вместо трёх').toBe(3);
        }
    });

    test('лестница текста — каждый уровень на ступени, включая текст из базы',
         async ({ page }) => {
        await открыть(page, '/pages/' + С.файл + Я.хвост + '.html');
        const з = await page.evaluate(({ кегли, строки }) => {
            const беды = [], уровней = new Set();
            document.querySelectorAll('main *, .ip-hero *').forEach(el => {
                if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
                if (el.closest('.floating-header, .mobile-nav, footer, .footer-content, .section-sponsors-compact')) return;
                const s = getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden') return;
                уровней.add(el.className || el.tagName);
                const к = Math.round(parseFloat(s.fontSize) * 100) / 100;
                if (!кегли.includes(к)) беды.push('кегль ' + к + ' у ' + (el.className || el.tagName));
                if (s.lineHeight === 'normal') {
                    беды.push('межстрочный normal у ' + (el.className || el.tagName));
                } else {
                    const м = Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100;
                    if (!строки.includes(м)) беды.push('межстрочный ' + м + ' у ' + (el.className || el.tagName));
                }
            });
            return { беды: [...new Set(беды)], уровней: уровней.size };
        }, { кегли: ШКАЛА_КЕГЛЕЙ, строки: ЛЕСТНИЦА_СТРОК });
        expect(з.уровней, 'ПОРОГ: на странице нет текста').toBeGreaterThan(3);
        expect(з.беды, 'мимо лестницы: ' + з.беды.join(' · ')).toHaveLength(0);
    });

    test('фокус виден, перелива нет', async ({ page }) => {
        await открыть(page, '/pages/' + С.файл + Я.хвост + '.html');
        const з = await page.evaluate(() => {
            const ц = document.querySelector('.ip-cta-btn, .ip-faq-question, .ip-toc-list a, main a');
            let контур = 'цели нет';
            if (ц) { ц.focus(); const s = getComputedStyle(ц); контур = s.outlineStyle + ' ' + s.outlineWidth; }
            return { контур, перелив: document.documentElement.scrollWidth - window.innerWidth };
        });
        expect(з.перелив, 'страница едет вбок на ' + з.перелив).toBeLessThanOrEqual(1);
        if (з.контур !== 'цели нет')
            expect(з.контур, 'у элемента в фокусе нет контура').not.toMatch(/^none/);
    });

});
}
}

/* Раскрывашка проверяется нажатием: в разметке её состояния нет. */
for (const Я of ЯЗЫКИ) {
test('вопрос FAQ раскрывается нажатием · ' + Я.имя, async ({ page }) => {
    await открыть(page, '/pages/faq' + Я.хвост + '.html');
    const кнопка = page.locator('.ip-faq-question').first();
    await expect(кнопка, 'ПОРОГ: вопросов на странице нет').toBeVisible();
    const до = await page.evaluate(() =>
        Math.round(document.querySelector('.ip-faq-answer').getBoundingClientRect().height));
    await кнопка.click();
    await page.waitForTimeout(500);
    const после = await page.evaluate(() =>
        Math.round(document.querySelector('.ip-faq-answer').getBoundingClientRect().height));
    expect(после, 'ответ не раскрылся: было ' + до + ', стало ' + после).toBeGreaterThan(до);
});
}
