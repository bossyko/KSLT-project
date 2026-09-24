/**
 * ПРОБА ФОРМЫ КАРТОЧКИ «ГДЕ ИГРАТЬ И У КОГО УЧИТЬСЯ» — снимки до и после.
 *
 * Ничего в проекте не меняет: предложение накладывается стилем поверх
 * живой страницы прямо в браузере Playwright. Обновишь сайт — всё как было.
 *
 * Почему скриптом, а не из сессии: окно Chrome не слушается resize, а во
 * фрейм страница больше не открывается (index.html:10 объявляет
 * X-Frame-Options в разметке, и Chrome стал его исполнять). Playwright
 * грузит на нужной ширине по-настоящему.
 *
 *   node tools/proba-venues.js
 *
 * Кладёт снимки в proba-venues/ внутри проекта.
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ПАПКА = path.join(__dirname, '..', 'proba-venues');
const ВИДЫ = [
    { имя: 'desktop-1280', w: 1280, h: 900 },
    { имя: 'tablet-land-1024', w: 1024, h: 768 },
    { имя: 'tablet-768', w: 768, h: 1100 },
    { имя: 'phone-land-844', w: 844, h: 390 },
    { имя: 'phone-375', w: 375, h: 900 }
];

/* ПРЕДЛОЖЕНИЕ. Границы только 640 и 992 — как в лестнице. */
const СТИЛЬ = `
  #venues .vn-four { gap: 24px !important; grid-template-columns: repeat(4, 1fr) !important; }
  @media (max-width: 992px) {
    #venues .vn-four { grid-template-columns: repeat(3, 1fr) !important; }
  }
  @media (max-width: 640px) {
    #venues .vn-four { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
  }
  #venues .vn-four .court-card img {
    height: auto !important; aspect-ratio: 4 / 3 !important; }
  #venues .vn-four .coach-photo { width: 96px !important; height: 96px !important; }
  #venues .vn-four .court-info,
  #venues .vn-four .coach-info {
    position: relative !important; padding: 12px 12px 10px !important;
    gap: 4px !important; padding-right: 34px !important; }
  #venues .vn-four .court-info h4,
  #venues .vn-four .coach-info h4 {
    font-size: 16px !important; line-height: 1.25 !important;
    display: -webkit-box !important; -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important; overflow: hidden !important; }
  #venues .vn-four .court-info span,
  #venues .vn-four .coach-info span {
    font-size: 12px !important; color: rgba(255,255,255,.5) !important; }
  #venues .vn-four .court-info::after,
  #venues .vn-four .coach-info::after {
    content: '\\2192'; position: absolute; right: 12px; bottom: 8px;
    color: #CCFF00; font-size: 18px; font-weight: 700; line-height: 1; }
  #venues .vn-four .court-card-actions,
  #venues .vn-four .coach-card-actions { display: none !important; }
`;

const шаг = т => process.stderr.write(т + '\n');

(async () => {
    if (!fs.existsSync(ПАПКА)) fs.mkdirSync(ПАПКА);
    шаг('');
    шаг('  Запускаю браузер…');
    const браузер = await chromium.launch();
    шаг('  Десять снимков: пять видов, до и после.');
    шаг('');

    for (const в of ВИДЫ) {
        const кон = await браузер.newContext({
            viewport: { width: в.w, height: в.h },
            hasTouch: в.w < 1280, isMobile: в.w < 1280, deviceScaleFactor: 2
        });
        const стр = await кон.newPage();
        process.stderr.write('  ' + в.имя.padEnd(18) + '… ');
        try {
            await стр.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (e) {
            шаг('НЕ ОТКРЫЛОСЬ — поднят ли сервер на localhost:8080?');
            await браузер.close(); process.exit(1);
        }
        await стр.waitForFunction(() => {
            const g = document.getElementById('venuesCourts');
            return g && (g.querySelector('.court-card') || g.querySelector('.vn-notice'));
        }, null, { timeout: 20000 }).catch(() => {});
        await стр.waitForFunction(
            () => [...document.querySelectorAll('#venues img')].every(i => i.complete),
            null, { timeout: 15000 }).catch(() => {});

        const раздел = стр.locator('#venues');
        await раздел.screenshot({ path: path.join(ПАПКА, в.имя + '-1-bylo.png') });

        await стр.addStyleTag({ content: СТИЛЬ });
        await стр.waitForTimeout(500);
        await раздел.screenshot({ path: path.join(ПАПКА, в.имя + '-2-stalo.png') });

        const ч = await стр.evaluate(() => {
            const с = document.querySelector('#venues .vn-four');
            const к = document.querySelector('#venues .court-card');
            const r = к.getBoundingClientRect();
            return { колонок: getComputedStyle(с).gridTemplateColumns.split(' ').length,
                     карточка: Math.round(r.width) + 'x' + Math.round(r.height) };
        });
        шаг('колонок ' + ч.колонок + ', карточка ' + ч.карточка);
        await кон.close();
    }

    await браузер.close();
    шаг('');
    шаг('  Снимки: ' + ПАПКА);
    шаг('');
})();
