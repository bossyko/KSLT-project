/**
 * ЦВЕТ СТАТУСОВ ТУРНИРА — пять видов, три языка.
 *
 * Что здесь проверяется и почему именно в браузере, а не правилом в tools:
 *
 * 1. КОНТРАСТ СЧИТАЕТСЯ ПО ТОМУ, ЧТО НАРИСОВАЛ БРАУЗЕР. Правило в tools читает
 *    css и разворачивает переменные само. Браузер разворачивает их по-своему:
 *    учитывает каскад, медиазапросы и то, что на телефоне у бейджа свой блок.
 *    Два независимых способа — требование Кости, и оно уже ловило расхождения.
 * 2. ПОДЛОЖКА НЕПРОЗРАЧНА. Бейдж лежит на афише турнира: под ним фотография,
 *    а не карточка. Прозрачную подложку видно по альфе в computed-значении.
 * 3. ВЫСОТА 24 НА ВСЕХ ПЯТИ ВИДАХ. Край дан inset-тенью именно ради этого:
 *    рамка добавила бы 2px, и бейдж на телефоне стал бы другим компонентом.
 * 4. ЛАЙМА В БЕЙДЖАХ И ДАТЕ НЕТ. Правило 109:370 — лайм принадлежит одному
 *    главному действию в поле зрения, кнопке записи.
 *
 * Тест НЕ зависит от базы: шесть тонов он ставит фикстурой той же разметки,
 * что строит js/tournament-card.js. Иначе он был бы зелёным ровно тогда,
 * когда в базе нет турнира нужного состояния — то есть почти всегда.
 *
 * Прогон: npx playwright test tests/e2e/design-system/32-turniry-cvet.spec.js
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

const ТОНА = ['live', 'open', 'soon', 'closed', 'done', 'cancelled'];
const ПОРОГ = 4.5;          /* WCAG 1.4.3: подпись 11px — мелкий текст */
const ЛАЙМ = /204,\s*255,\s*0|#CCFF00/i;

/** Готовит ОДИН заведомо видимый бейдж, на котором дальше перебираются тона.

    Первая версия ставила по карточке на тон и падала на телефоне: высота
    бейджа выходила 0. Причина не в бейдже — css/style.css:5603 прячет на
    телефоне всё, начиная с пятой карточки (`nth-child(n+5) { display: none }`),
    а фикстуры дописывались в конец. Перебор тонов на одном видимом бейдже от
    правил сетки не зависит вовсе — и заодно честнее: тон в жизни меняется
    именно так, на одной и той же карточке. */
async function готовыйБейдж(page) {
    return page.evaluate(() => {
        const сетка = document.querySelector('.tournaments-grid');
        if (!сетка) return 'нет сетки турниров';
        if (!сетка.querySelector('.tc')) {
            const карта = document.createElement('div');
            карта.className = 'tc';
            карта.innerHTML =
                '<div class="tc-image"><div class="tc-noimage">T</div></div>'
              + '<div class="tc-body"><div class="tc-date">19 сентября 2026</div>'
              + '<h3 class="tc-title">Фикстура</h3></div>';
            сетка.prepend(карта);
        }
        const первая = сетка.querySelector('.tc');
        let бейдж = первая.querySelector('.tc-badge');
        if (!бейдж) {
            бейдж = document.createElement('span');
            бейдж.className = 'tc-badge tc-badge-soon';
            бейдж.textContent = 'Регистрация закрыта';
            (первая.querySelector('.tc-image') || первая).appendChild(бейдж);
        }
        бейдж.id = 'бейдж-под-замером';
        return 'готов';
    });
}

/** Контраст считаем в странице: цвета берём computed, полупрозрачный текст
    складываем с подложкой — иначе 72% белого посчитались бы как чистый белый. */
const замерБейджей = (page, тона) => page.evaluate(тона => {
    const разбор = s => {
        const м = String(s).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/);
        return м ? [+м[1], +м[2], +м[3], м[4] === undefined ? 1 : +м[4]] : null;
    };
    const яркость = c => {
        const l = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    };
    const поверх = (в, н) => [0, 1, 2].map(i => в[i] * в[3] + н[i] * (1 - в[3])).concat(1);
    const э = document.getElementById('бейдж-под-замером');
    if (!э) return null;
    const было = э.className;
    const итог = тона.map(т => {
        э.className = 'tc-badge tc-badge-' + т;
        const c = getComputedStyle(э);
        const ф = разбор(c.backgroundColor), т2 = разбор(c.color);
        const k = (ф && т2) ? (() => {
            const a = яркость(поверх(т2, ф)), b = яркость(ф);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        })() : null;
        return {
            тон: т, фон: c.backgroundColor, текст: c.color,
            альфаФона: ф ? ф[3] : null, контраст: k,
            высота: +э.getBoundingClientRect().height.toFixed(1),
            рамка: c.borderTopWidth, край: c.boxShadow, кегль: c.fontSize
        };
    });
    э.className = было;
    return итог;
}, тона);

for (const стр of СТРАНИЦЫ) {

    test.describe('цвет статусов турнира · ' + стр.имя, () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(стр.адрес);
            await page.waitForLoadState('networkidle');
            expect(await готовыйБейдж(page), 'бейдж под замером').toBe('готов');
        });

        test('каждый тон читается — контраст не ниже 4.5', async ({ page }) => {
            const б = await замерБейджей(page, ТОНА);
            expect(б, 'замер получился').not.toBeNull();
            expect(б.length, 'все шесть тонов замерены').toBe(ТОНА.length);
            for (const э of б) {
                expect(э.контраст, 'тон ' + э.тон + ': ' + э.текст + ' на ' + э.фон).not.toBeNull();
                expect(э.контраст, 'тон ' + э.тон + ' контраст ' + (э.контраст || 0).toFixed(2)
                    + ' (' + э.текст + ' на ' + э.фон + ')').toBeGreaterThanOrEqual(ПОРОГ);
            }
        });

        test('подложка бейджа непрозрачна — под ним афиша, а не карточка', async ({ page }) => {
            const б = await замерБейджей(page, ТОНА);
            for (const э of б) {
                expect(э.альфаФона, 'тон ' + э.тон + ' фон ' + э.фон).toBe(1);
            }
        });

        test('высота бейджа 24 и край не рамкой', async ({ page }) => {
            const б = await замерБейджей(page, ТОНА);
            for (const э of б) {
                expect(э.высота, 'тон ' + э.тон).toBe(24);
                expect(э.рамка, 'тон ' + э.тон + ' рисует рамку — она добавит 2px к высоте').toBe('0px');
            }
        });

        test('у тёмных тонов есть край, иначе бейдж сольётся с тёмной афишей', async ({ page }) => {
            const б = await замерБейджей(page, ТОНА);
            for (const э of б.filter(x => x.тон !== 'live')) {
                expect(э.край, 'тон ' + э.тон).toContain('inset');
            }
        });

        test('лайма нет ни в бейджах, ни в дате', async ({ page }) => {
            const найдено = await page.evaluate(тона => {
                const лайм = /204,\s*255,\s*0/;
                const плохие = [];
                const э = document.getElementById('бейдж-под-замером');
                const было = э.className;
                тона.forEach(т => {
                    э.className = 'tc-badge tc-badge-' + т;
                    const c = getComputedStyle(э);
                    ['color', 'backgroundColor', 'borderTopColor', 'boxShadow'].forEach(п => {
                        if (лайм.test(c[п])) плохие.push('tc-badge-' + т + ' · ' + п + ' = ' + c[п]);
                    });
                });
                э.className = было;
                document.querySelectorAll('.tc-date').forEach(д => {
                    const c = getComputedStyle(д);
                    if (лайм.test(c.color)) плохие.push('.tc-date · color = ' + c.color);
                });
                return плохие;
            }, ТОНА);
            expect(найдено, 'лайм принадлежит кнопке записи — правило 109:370').toEqual([]);
        });

        test('живой матч не белым по красному', async ({ page }) => {
            /* Та же пара цветов, что у бейджа турнира: заливка --danger.
               Правка тона обязана чинить оба раздела разом, а не один. */
            const к = await page.evaluate(() => {
                const г = document.querySelector('#liveMatchesGrid');
                if (!г) return null;
                const э = document.createElement('span');
                э.className = 'live-badge is-live';
                э.textContent = 'LIVE';
                г.appendChild(э);
                const c = getComputedStyle(э);
                const разбор = s => {
                    const м = String(s).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/);
                    return м ? [+м[1], +м[2], +м[3], м[4] === undefined ? 1 : +м[4]] : null;
                };
                const яркость = c2 => {
                    const l = c2.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
                    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
                };
                const ф = разбор(c.backgroundColor), т = разбор(c.color);
                const см = [0, 1, 2].map(i => т[i] * т[3] + ф[i] * (1 - т[3])).concat(1);
                const a = яркость(см), b = яркость(ф);
                э.remove();
                return { текст: c.color, фон: c.backgroundColor, k: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
            });
            test.skip(к === null, 'на этой странице нет раздела live');
            expect(к.k, 'live-бейдж: ' + к.текст + ' на ' + к.фон).toBeGreaterThanOrEqual(ПОРОГ);
        });
    });
}
