/**
 * РАЗДЕЛ РЕЙТИНГА НА ГЛАВНОЙ `#rankings` И ПЬЕДЕСТАЛ — решения Кости 24.09,
 * доска 378:152.
 *
 * Что здесь проверяется и почему именно так:
 *
 *  · ОТНОШЕНИЕ, А НЕ ЧИСЛО. Тумбы стоят лесенкой — значит низы у всех трёх на
 *    ОДНОЙ линии, а имя у всех троих начинается на одинаковом расстоянии от
 *    верха СВОЕЙ тумбы. Числа при этом свободны меняться.
 *  · ТРОЙКА НЕ ПОВТОРЯЕТСЯ. Имена с пьедестала не должны встречаться в
 *    таблице под ним: она начинается с четвёртого места.
 *  · ПАРА ЕДЕТ ОДНОЙ ГРАНИЦЕЙ. Где колонок две, обе таблицы обязаны
 *    начинаться на одной высоте — иначе длина фамилии победителя двигает
 *    вёрстку.
 *  · КЕГЛЬ ИДЁТ ЗА ДИАМЕТРОМ. Инициалы в кружке держат долю около 0.36 на
 *    ЛЮБОМ виде. Именно это сломалось на телефоне: кружок 68, кегль 40.
 *  · ЛАЙМ ПРИНАДЛЕЖИТ ДЕЙСТВИЮ. Ни номер, ни кольцо, ни очки его не берут.
 *  · ДВИЖЕНИЕ СПРАШИВАЕТ РАЗРЕШЕНИЯ. При prefers-reduced-motion пьедестал
 *    виден сразу и не анимируется.
 *  · ОБНОВЛЕНИЕ ОТКРЫВАЕТ СВЕРХУ. Костя 24.09: страница открывалась в конце.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: лендинг опрашивает базу и тянет чужие
 * картинки, networkidle там может не наступить вовсе (поймано 23.09).
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

/** Ждём не сеть, а признак: панель разряда с содержимым. */
async function дождаться(page, адрес) {
    await page.goto(адрес);
    await page.waitForSelector('#rankings .rankings-panel.active', { timeout: 15000 });
    await page.waitForFunction(() => {
        const п = document.querySelector('#rankings .rankings-panel.active');
        return п && (п.querySelector('.pl-podium') || п.querySelector('.rk-empty'));
    }, null, { timeout: 15000 });
}

const снимок = page => page.evaluate(() => {
    const сек = document.getElementById('rankings');
    if (!сек) return null;

    const короб = э => { const r = э.getBoundingClientRect();
        return { л: Math.round(r.left), в: Math.round(r.top), н: Math.round(r.bottom),
                 ш: Math.round(r.width), вы: Math.round(r.height) }; };

    const колонки = [...сек.querySelectorAll('.rankings-col')]
        .filter(к => getComputedStyle(к).display !== 'none' && к.getClientRects().length);

    const разбор = s => (s.match(/[\d.]+/g) || []).map(Number);

    return {
        колонокВидно: колонки.length,
        переключательПола: (() => {
            const п = сек.querySelector('.rk-gender-switch');
            if (!п || !п.getClientRects().length) return null;
            return [...п.querySelectorAll('.rk-gender')].map(к => короб(к).вы);
        })(),
        лента: (() => {
            const л = сек.querySelector('.rankings-panel.active')
                ? сек.querySelector('.rankings-tabs') : null;
            if (!л) return null;
            const чип = л.querySelector('.rankings-tab');
            return { высота: короб(л).вы, чип: чип ? короб(чип).вы : null,
                     перенос: getComputedStyle(л).flexWrap };
        })(),
        лаймНаНомере: [...сек.querySelectorAll('.rk-row:not(.rk-head) .rk-rank')]
            .some(э => {
                const c = разбор(getComputedStyle(э).color);
                return c[0] > 180 && c[1] > 230 && c[2] < 80;   /* #CCFF00 */
            }),
        колонки: колонки.map(кол => {
            const пан = кол.querySelector('.rankings-panel.active');
            if (!пан) return null;
            const пьед = пан.querySelector('.pl-podium');
            const строки = [...пан.querySelectorAll('.rk-row:not(.rk-head)')];
            const голова = пан.querySelector('.rk-head');
            const места = ['first', 'second', 'third'].map(м => {
                const к = пан.querySelector('.pl-podium-' + м);
                if (!к) return null;
                const тумба = к.querySelector('.pl-podium-base');
                const имя = к.querySelector('.pl-podium-name');
                const фото = к.querySelector('.pl-podium-photo');
                const ст = фото ? getComputedStyle(фото) : null;
                return {
                    место: м,
                    лево: короб(к).л,
                    тумбаНиз: тумба ? короб(тумба).н : null,
                    тумбаВерх: тумба ? короб(тумба).в : null,
                    имяВерх: имя ? короб(имя).в : null,
                    имя: имя ? имя.textContent.trim() : '',
                    диаметр: фото ? короб(фото).ш : null,
                    кегль: ст ? parseFloat(ст.fontSize) : null,
                    инициалы: фото ? фото.classList.contains('avatar-initials') : false,
                    кольцо: ст ? разбор(ст.borderTopColor) : null
                };
            });
            const ячейки = строки.length ? (() => {
                const р = строки[0];
                const кег = с => { const э = р.querySelector(с);
                    return э && э.getClientRects().length ? parseFloat(getComputedStyle(э).fontSize) : null; };
                return { номер: кег('.rk-rank'), ntrp: кег('.rk-ntrp'), очки: кег('.rk-points'), дельта: кег('.rk-change') };
            })() : null;
            return {
                естьПьедестал: !!пьед,
                места,
                головаВерх: голова ? короб(голова).в : null,
                номера: строки.map(р => (р.querySelector('.rk-rank') || {}).textContent),
                именаСтрок: строки.map(р => {
                    const и = р.querySelector('.rk-player');
                    return и ? и.textContent.trim() : '';
                }),
                ячейки
            };
        })
    };
});

for (const стр of СТРАНИЦЫ) {
    test.describe('рейтинг на главной · ' + стр.имя, () => {

        test('пьедестал: лесенка, имя внутри тумбы, тройка не повторяется', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            expect(с, 'раздела #rankings нет на странице').not.toBeNull();

            for (const кол of с.колонки) {
                if (!кол || !кол.естьПьедестал) continue;
                const м = кол.места.filter(Boolean);
                expect(м.length, 'на пьедестале должно быть до трёх мест').toBeGreaterThan(0);

                /* ── низы тумб на одной линии ────────────────────────────── */
                const низы = м.map(x => x.тумбаНиз).filter(v => v !== null);
                expect(Math.max(...низы) - Math.min(...низы),
                    'низы тумб разъехались: ' + низы.join(' · ')).toBeLessThanOrEqual(2);

                /* ── имя на одинаковом расстоянии от верха СВОЕЙ тумбы ───── */
                const отступы = м.filter(x => x.имяВерх !== null && x.тумбаВерх !== null)
                                 .map(x => x.имяВерх - x.тумбаВерх);
                expect(Math.max(...отступы) - Math.min(...отступы),
                    'имя стоит по-разному внутри тумб: ' + отступы.join(' · ')).toBeLessThanOrEqual(2);
                expect(Math.min(...отступы),
                    'имя вылезло за верхнюю грань тумбы').toBeGreaterThanOrEqual(0);

                /* ── первое место выше второго и третьего ────────────────── */
                const первый = м.find(x => x.место === 'first');
                const прочие = м.filter(x => x.место !== 'first');
                if (первый && прочие.length) {
                    expect(первый.тумбаВерх,
                        'первое место не выше остальных').toBeLessThan(Math.min(...прочие.map(x => x.тумбаВерх)));
                }

                /* ── порядок на экране 2 – 1 – 3 ─────────────────────────── */
                if (м.length === 3) {
                    const по = {}; м.forEach(x => { по[x.место] = x.лево; });
                    expect(по.second, 'порядок на экране должен быть 2 – 1 – 3').toBeLessThan(по.first);
                    expect(по.first, 'порядок на экране должен быть 2 – 1 – 3').toBeLessThan(по.third);
                }

                /* ── таблица начинается с четвёртого места ───────────────── */
                if (кол.номера.length) {
                    expect(String(кол.номера[0]).trim(),
                        'таблица обязана начинаться с четвёртого места').toBe('4');
                    const наПьедестале = м.map(x => x.имя).filter(Boolean);
                    for (const имя of наПьедестале) {
                        const корот = имя.split(/\s+/)[0];
                        expect(кол.именаСтрок.some(s => s.indexOf(корот) === 0 && s.length && имя.indexOf(s) === 0),
                            'имя «' + имя + '» повторилось в таблице под пьедесталом').toBeFalsy();
                    }
                }
            }
        });

        test('кегль инициалов идёт за диаметром кружка', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            let проверено = 0;
            for (const кол of с.колонки) {
                if (!кол) continue;
                for (const м of кол.места.filter(Boolean)) {
                    if (!м.инициалы || !м.диаметр || !м.кегль) continue;
                    const доля = м.кегль / м.диаметр;
                    expect(доля, 'место ' + м.место + ': кружок ' + м.диаметр +
                        ', кегль ' + м.кегль + ' — доля ' + доля.toFixed(2)).toBeGreaterThan(0.28);
                    expect(доля, 'место ' + м.место + ': кружок ' + м.диаметр +
                        ', кегль ' + м.кегль + ' — доля ' + доля.toFixed(2)).toBeLessThan(0.42);
                    проверено++;
                }
            }
            test.info().annotations.push({ type: 'кружков проверено', description: String(проверено) });
        });

        test('обе колонки начинают таблицу на одной высоте', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            if (с.колонокВидно < 2) { test.skip(true, 'на этом виде колонка одна'); return; }
            const верхи = с.колонки.filter(Boolean).map(к => к.головаВерх).filter(v => v !== null);
            if (верхи.length < 2) { test.skip(true, 'таблиц меньше двух'); return; }
            expect(Math.max(...верхи) - Math.min(...верхи),
                'таблицы начинаются на разной высоте: ' + верхи.join(' · ')).toBeLessThanOrEqual(2);
        });

        test('лента разрядов листается, а не переносится', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            expect(с.лента, 'ленты разрядов нет').not.toBeNull();
            expect(с.лента.перенос, 'лента не должна переноситься').toBe('nowrap');
            expect(с.лента.высота,
                'лента выше одной строки чипов — значит перенеслась').toBeLessThanOrEqual(с.лента.чип + 12);
        });

        test('ячейки строки набраны одним кеглем', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            for (const кол of с.колонки) {
                if (!кол || !кол.ячейки) continue;
                const я = кол.ячейки;
                const видимые = Object.keys(я).filter(k => я[k] !== null);
                const значения = видимые.map(k => я[k]);
                expect(new Set(значения).size,
                    'ячейки строки разного кегля: ' +
                    видимые.map(k => k + ' ' + я[k]).join(' · ')).toBe(1);
            }
        });

        test('лайм не берут ни номера, ни кольцо, ни очки', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            expect(с.лаймНаНомере, 'номер в таблице покрашен лаймом').toBeFalsy();
            for (const кол of с.колонки) {
                if (!кол) continue;
                const первый = (кол.места || []).find(x => x && x.место === 'first');
                if (первый && первый.кольцо) {
                    const [r, g, b] = первый.кольцо;
                    expect(r > 180 && g > 230 && b < 80,
                        'кольцо первого места лаймовое, а должно быть золотым').toBeFalsy();
                }
            }
        });

        test('переключатель пола держит цель нажатия', async ({ page }) => {
            await дождаться(page, стр.адрес);
            const с = await снимок(page);
            if (!с.переключательПола) { test.skip(true, 'на этом виде переключателя нет'); return; }
            for (const в of с.переключательПола) {
                expect(в, 'кнопка пола ниже порога цели нажатия').toBeGreaterThanOrEqual(44);
            }
        });
    });
}

test.describe('рейтинг: движение и прокрутка', () => {

    test('при prefers-reduced-motion пьедестал виден сразу и не движется', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await дождаться(page, '/index.html');
        const итог = await page.evaluate(() => {
            const к = document.querySelector('#rankings .rankings-panel.active .pl-podium-card');
            if (!к) return null;
            const с = getComputedStyle(к);
            const ф = к.querySelector('.pl-podium-photo');
            return {
                прозрачность: parseFloat(с.opacity),
                сдвиг: с.transform,
                анимацияФото: ф ? getComputedStyle(ф).animationName : 'none',
                искр: document.querySelectorAll('.rk-iskra').length
            };
        });
        if (!итог) { test.skip(true, 'пьедестала нет — категория пуста'); return; }
        expect(итог.прозрачность, 'карточка должна быть видна сразу').toBe(1);
        expect(итог.сдвиг === 'none' || итог.сдвиг === 'matrix(1, 0, 0, 1, 0, 0)',
            'карточка не должна быть сдвинута: ' + итог.сдвиг).toBeTruthy();
        expect(итог.анимацияФото, 'кольцо не должно вспыхивать').toBe('none');
    });

    test('обновление страницы открывает её сверху', async ({ page }) => {
        await дождаться(page, '/index.html');
        await page.evaluate(() => window.scrollTo(0, 2500));
        await page.waitForFunction(() => window.scrollY > 2000);
        await page.reload();
        await дождаться(page, '/index.html');
        await page.waitForTimeout(600);
        const итог = await page.evaluate(() => ({
            y: Math.round(window.scrollY),
            режим: history.scrollRestoration
        }));
        expect(итог.режим, 'прокруткой должны управлять мы, а не браузер').toBe('manual');
        expect(итог.y, 'после обновления страница обязана открыться сверху').toBeLessThanOrEqual(2);
    });
});
