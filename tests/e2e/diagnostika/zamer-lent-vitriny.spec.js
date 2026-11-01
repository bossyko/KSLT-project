/**
 * ЗАМЕР: ИЗ ЧЕГО СКЛАДЫВАЕТСЯ ВЫСОТА КАРТОЧКИ ЛЕНТЫ (01.11).
 *
 * ЗАЧЕМ. Полный прогон 01.11 дал 15 падений «карточки лент разной высоты:
 * 281 против 255». Прежде этого было не видно: тренеров в тестовой базе не
 * было вовсе, вторая лента не рисовалась, и ветка сравнения живых карточек
 * не работала ни разу. Посев тренеров её включил.
 *
 * ПОЧЕМУ ЗАМЕР, А НЕ ПРАВКА. Разница 26 пикселей, и догадок у меня три:
 * цена, подпись и коробка портрета. СНАЧАЛА ПОМЕРИТЬ, ПОТОМ НАЗЫВАТЬ
 * ПРОБЛЕМОЙ — поэтому здесь снимаются ВСЕ части карточки по каждой ленте,
 * а решение принимается по таблице, а не по рассуждению.
 *
 * Это диагностика, а не заморозка: она ничего не требует, она пишет файл.
 */
const { test, expect } = require('../../fixtures');
const fs = require('fs');
const path = require('path');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/services.html' },
    { имя: 'en', адрес: '/pages/services-en.html' },
    { имя: 'kg', адрес: '/pages/services-kg.html' }
];

const ОТЧЁТ = path.join(__dirname, '..', '..', 'reports', 'zamer-lent-vitriny.json');
const собрано = {};

test.describe('замер лент витрины', () => {

    for (const я of ЯЗЫКИ) {
        test('из чего высота карточки · ' + я.имя, async ({ page }, info) => {
            test.setTimeout(90000);
            await page.goto(я.адрес);
            await page.waitForFunction(
                () => document.querySelector('.sv-hero h1') !== null,
                null, { timeout: 20000 });
            /* ЖДЁМ ПОКОЯ СПИСКОВ, А НЕ ТИШИНЫ СЕТИ: карточки приходят
               ответом базы, и их число перестаёт меняться позже загрузки. */
            await page.waitForFunction(() => {
                const n = document.querySelectorAll('.sv-compact, .sv-player').length;
                const было = window.__скольколент;
                window.__скольколент = n;
                return n > 0 && n === было;
            }, null, { timeout: 20000, polling: 400 });
            await page.evaluate(() => document.fonts && document.fonts.ready);
            await page.waitForTimeout(400);

            const замер = await page.evaluate(() => {
                const ч = e => e ? Math.round(e.getBoundingClientRect().height * 10) / 10 : null;
                const ш = e => e ? Math.round(e.getBoundingClientRect().width * 10) / 10 : null;
                const кегль = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 : null;
                const строк = e => {
                    if (!e) return null;
                    const лх = parseFloat(getComputedStyle(e).lineHeight);
                    return лх ? Math.round(e.getBoundingClientRect().height / лх * 10) / 10 : null;
                };

                const ленты = [...document.querySelectorAll('.sv-carousel')].map(л => {
                    const к = л.querySelector('.sv-compact');
                    if (!к) return { тип: л.dataset.type || '(нет)', карточек: 0 };
                    const с = getComputedStyle(к);
                    const обёртка = к.querySelector('.sv-compact-img-wrap');
                    const фото = к.querySelector('.sv-compact-photo');
                    const портрет = к.querySelector('.sv-compact-avatar');
                    const значок = к.querySelector('.sv-compact-icon');
                    const h4 = к.querySelector('h4');
                    const подпись = к.querySelector('.sv-compact-sub');
                    const цена = к.querySelector('.sv-compact-price');
                    return {
                        тип: л.dataset.type || '(нет)',
                        карточек: л.querySelectorAll('.sv-compact').length,
                        карточка: { ш: ш(к), в: ч(к) },
                        поля: с.padding,
                        части: {
                            обёртка: ч(обёртка),
                            'обёртка.aspectRatio': обёртка ? getComputedStyle(обёртка).aspectRatio : null,
                            'обёртка.marginBottom': обёртка ? getComputedStyle(обёртка).marginBottom : null,
                            фото: ч(фото),
                            портрет: ч(портрет),
                            'портрет.margin': портрет ? getComputedStyle(портрет).margin : null,
                            значок: ч(значок),
                            h4: ч(h4),
                            'h4.кегль': кегль(h4),
                            'h4.строк': строк(h4),
                            'h4.minHeight': h4 ? getComputedStyle(h4).minHeight : null,
                            подпись: ч(подпись),
                            'подпись.есть': !!подпись,
                            'подпись.текст': подпись ? подпись.textContent.trim().slice(0, 40) : null,
                            цена: ч(цена),
                            'цена.есть': !!цена,
                            'цена.текст': цена ? цена.textContent.trim() : null
                        }
                    };
                });

                const сетки = [...document.querySelectorAll('.sv-card-grid')].map(г => ({
                    главная: ч(г.querySelector('.sv-featured')),
                    лента: ч(г.querySelector('.sv-compact')),
                    типЛенты: (г.querySelector('.sv-carousel') || {}).dataset
                        ? (г.querySelector('.sv-carousel').dataset.type || '(нет)') : null
                }));

                return { экран: window.innerWidth + 'x' + window.innerHeight, ленты, сетки };
            });

            собрано[info.project.name + ' · ' + я.имя] = замер;
            fs.mkdirSync(path.dirname(ОТЧЁТ), { recursive: true });
            fs.writeFileSync(ОТЧЁТ, JSON.stringify(собрано, null, 2), 'utf8');

            /* ЗАМЕР НЕ ТРЕБУЕТ — ОН ПИШЕТ. Единственное, что здесь
               проверяется: что мерить вообще было что. Иначе пустой файл
               выглядел бы как «разницы нет». */
            expect(замер.ленты.length, 'лент на странице нет — мерить нечего')
                .toBeGreaterThan(0);
        });
    }
});
