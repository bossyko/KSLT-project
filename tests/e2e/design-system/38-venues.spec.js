/**
 * ВИТРИНА «ГДЕ ИГРАТЬ И У КОГО УЧИТЬСЯ» `#venues` НА ГЛАВНОЙ — решения Кости
 * 24.09 и доска 419:9.
 *
 * Что здесь проверяется и почему именно так:
 *
 *  · ОТНОШЕНИЕ СТОРОН — СВОЙСТВО КАРТОЧКИ. До 24.09 высота фотографии была
 *    объявлена числом трижды (200 · 168 · 92) при текучей ширине, и отношение
 *    гуляло от 1.79 до 3.91. Тест меряет ОТНОШЕНИЕ, а не высоту.
 *  · ТОЛЬКО ЦЕЛЫЕ РЯДЫ. Тест не знает, сколько записей в базе, и проверяет
 *    отношение: в каждом ряду, кроме единственного, карточек столько же,
 *    сколько колонок.
 *  · ХВОСТ НЕ ГАСИТ ЕДИНСТВЕННУЮ ЗАПИСЬ. Тренер в базе пока один: ряд обязан
 *    остаться с карточкой, а не с пустотой.
 *  · СТРЕЛКИ ОДНОГО РЯДА НА ОДНОЙ ЛИНИИ. У одной карточки есть покрытие,
 *    цена и скидка, у другой ничего — низы всё равно совпадают.
 *  · ЛЕСТНИЦА ЧИТАЕТСЯ ПАРАМИ. Подзаголовок ряда строго крупнее имени
 *    карточки, имя строго крупнее меты — на каждом виде и на каждом языке.
 *  · МЕТКА НЕ ЛЕЖИТ НА ПОРТРЕТЕ. Прямоугольники метки и фотографии не
 *    пересекаются.
 *  · МЕЛКИЙ ТЕКСТ ПРОХОДИТ ПОРОГ WCAG 1.4.3 = 4.5.
 *  · КНОПКИ-ОБМАНКИ НЕТ. Нажимается карточка целиком, стрелка скрыта от
 *    диктора, «Подробнее» как <span> из витрины убран.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: лендинг опрашивает базу и тянет
 * чужие картинки, networkidle там может не наступить вовсе.
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

async function дождаться(page, адрес) {
    await page.goto(адрес);
    await page.waitForSelector('#venues .courts-grid', { timeout: 15000 });
    await page.waitForFunction(() => {
        const с = document.querySelector('#venues .courts-grid');
        return с && (с.querySelector('.court-card') || с.querySelector('.vn-notice'));
    }, null, { timeout: 15000 });
    /* Фотографии задают высоту карточки: без них меряется недогруженное.
       ПРОКРУТКА ОБЯЗАТЕЛЬНА: у картинок loading="lazy", и ниже сгиба они не
       грузятся вовсе — ожидание «все complete» висело полные 15 секунд и
       заканчивалось ничем. Ждём признак ПОСЛЕ того, как раздел попал в поле
       зрения, и только у видимых картинок. */
    await page.evaluate(() => {
        const с = document.getElementById('venues');
        if (с) с.scrollIntoView({ block: 'start' });
    });
    await page.waitForFunction(() => {
        const ф = [...document.querySelectorAll('#venues img')]
            .filter(и => и.getClientRects().length);
        return ф.length > 0 && ф.every(и => и.complete);
    }, null, { timeout: 8000 }).catch(() => {});
}

const снимок = page => page.evaluate(() => {
    const сек = document.getElementById('venues');
    if (!сек) return null;

    const короб = э => { const r = э.getBoundingClientRect();
        return { л: Math.round(r.left), п: Math.round(r.right), в: Math.round(r.top),
                 н: Math.round(r.bottom), ш: Math.round(r.width), вы: Math.round(r.height) }; };
    const кегль = э => э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null;

    const ч = c => (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
    const яркость = ([r, g, b]) => { const f = v => { v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    /* Фон ищется до НЕПРОЗРАЧНОГО: полупрозрачная подложка сама по себе
       фоном не является, и замер по ней врёт — поймано 24.09 на метке */
    const фон = э => { let n = э; while (n) { const v = ч(getComputedStyle(n).backgroundColor);
        if (v.length === 4 && v[3] > 0 && v[3] < 1) { n = n.parentElement; continue; }
        if (v.length < 4 || v[3] > 0) return v.slice(0, 3); n = n.parentElement; } return [0, 0, 0]; };
    const смесь = (fg, bg) => { const a = fg[3] === undefined ? 1 : fg[3];
        return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)); };
    const контраст = э => { const b = фон(э); const a = яркость(смесь(ч(getComputedStyle(э).color), b));
        const c = яркость(b); return +(((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05)).toFixed(2)); };

    function ряд(сетка, класс) {
        const видимые = [...сетка.querySelectorAll(класс)]
            .filter(к => getComputedStyle(к).display !== 'none' && к.getClientRects().length);
        const поРядам = {};
        видимые.forEach(к => { const в = короб(к).в; (поРядам[в] = поРядам[в] || []).push(к); });
        const ряды = Object.keys(поРядам).sort((a, b) => a - b).map(в => поРядам[в]);
        return {
            колонок: getComputedStyle(сетка).gridTemplateColumns.split(' ').length,
            видимых: видимые.length,
            вРазметке: сетка.querySelectorAll(класс).length,
            вРядах: ряды.map(р => р.length),
            высоты: ряды.map(р => [...new Set(р.map(к => короб(к).вы))]),
            низыСтрелок: ряды.map(р => р.map(к => {
                const с = к.querySelector('.vn-go');
                return с ? короб(с).н : null;
            })),
            отношения: видимые.map(к => {
                const и = к.querySelector('img');
                if (!и) return null;
                const б = короб(и);
                return б.вы ? +(б.ш / б.вы).toFixed(2) : null;
            }),
            ссылки: видимые.map(к => к.tagName.toLowerCase() + ':' + (к.getAttribute('href') ? 'есть' : 'нет')),
            стрелкиСкрыты: видимые.map(к => {
                const с = к.querySelector('.vn-go');
                return с ? с.getAttribute('aria-hidden') === 'true' : null;
            })
        };
    }

    const корты = ряд(сек.querySelector('.courts-grid'), '.court-card');
    const тренеры = ряд(сек.querySelector('.coaches-grid'), '.coach-card');

    const метки = [...сек.querySelectorAll('.vn-partner')].map(м => {
        const карта = м.closest('.court-card, .coach-card');
        const и = карта && карта.querySelector('img');
        if (!и) return null;
        const a = короб(м), b = короб(и);
        return { пересекается: !(a.п <= b.л || a.л >= b.п || a.н <= b.в || a.в >= b.н) };
    }).filter(Boolean);

    const мелкие = [...сек.querySelectorAll('.court-info span, .coach-info span')]
        .filter(э => э.getClientRects().length)
        .map(э => ({ класс: э.className || 'город', кегль: кегль(э), контраст: контраст(э) }));

    return {
        корты, тренеры, метки, мелкие,
        заголовок: кегль(сек.querySelector('.section-header h2')),
        подзаголовок: кегль(сек.querySelector('.vn-row-head h3')),
        имяКарточки: кегль(сек.querySelector('.court-card h4')),
        имяТренера: кегль(сек.querySelector('.coach-card h4')),
        /* Уровень меты берётся ПО МЕСТУ В КАРТОЧКЕ, а не по классу: покрытие
           есть не у каждого корта, а pick() перемешивает список при каждой
           загрузке. На en в телефон боком попали четыре корта без покрытия —
           .court-surface не было в разметке вовсе, и якорь дал null. */
        мета: (() => {
            const сп = [...сек.querySelectorAll('.court-info span, .coach-info span')]
                .filter(э => э.getClientRects().length && !э.classList.contains('vn-partner'));
            return сп.length ? кегль(сп[0]) : null;
        })(),
        стрелка: кегль(сек.querySelector('.vn-go')),
        обманки: сек.querySelectorAll('.court-card-details, .coach-card-details').length,
        видимыхОбманок: [...сек.querySelectorAll('.court-card-details, .coach-card-details')]
            .filter(э => э.getClientRects().length).length,
        строкИмени: [...сек.querySelectorAll('.court-card h4, .coach-card h4')]
            .filter(э => э.getClientRects().length)
            .map(э => Math.round(э.getBoundingClientRect().height /
                     parseFloat(getComputedStyle(э).lineHeight))),
        горПрокрутка: document.documentElement.scrollWidth > window.innerWidth + 1
    };
});

СТРАНИЦЫ.forEach(({ имя, адрес }) => {
    test.describe('«Где играть» · ' + имя, () => {

        test('фотография держит одно отношение сторон на всех карточках', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с, 'раздел #venues на странице').not.toBeNull();
            const все = [...с.корты.отношения, ...с.тренеры.отношения].filter(x => x !== null);
            expect(все.length, 'фотографии нашлись').toBeGreaterThan(0);
            все.forEach((о, i) => {
                expect(Math.abs(о - 1.33), 'карточка ' + (i + 1) + ': отношение ' + о + ', ждали 1.33')
                    .toBeLessThanOrEqual(0.03);
            });
        });

        test('только целые ряды — и у кортов, и у тренеров', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            [['корты', с.корты], ['тренеры', с.тренеры]].forEach(([имяР, р]) => {
                if (!р.видимых) return;
                if (р.вРядах.length > 1) {
                    р.вРядах.forEach((n, i) => {
                        expect(n, имяР + ': ряд ' + (i + 1) + ' из ' + р.вРядах.length + ' заполнен целиком')
                            .toBe(р.колонок);
                    });
                } else {
                    expect(р.вРядах[0], имяР + ': единственный ряд не шире числа колонок')
                        .toBeLessThanOrEqual(р.колонок);
                }
            });
        });

        test('хвост не гасит единственную запись', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            [['корты', с.корты], ['тренеры', с.тренеры]].forEach(([имяР, р]) => {
                if (р.вРазметке > 0) {
                    expect(р.видимых, имяР + ': в разметке ' + р.вРазметке + ', видно ' + р.видимых)
                        .toBeGreaterThan(0);
                }
            });
        });

        test('карточки ряда одной высоты, стрелки на одной линии', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            [['корты', с.корты], ['тренеры', с.тренеры]].forEach(([имяР, р]) => {
                р.высоты.forEach((набор, i) => {
                    expect(набор.length, имяР + ': ряд ' + (i + 1) + ' — высоты ' + набор.join(', ')).toBe(1);
                });
                р.низыСтрелок.forEach((ряд, i) => {
                    const набор = [...new Set(ряд.filter(x => x !== null))];
                    if (!набор.length) return;
                    expect(набор.length, имяР + ': ряд ' + (i + 1) + ' — низы стрелок ' + ряд.join(', ')).toBe(1);
                });
            });
        });

        test('лестница читается парами: подзаголовок > имя > мета', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.подзаголовок, 'подзаголовок ' + с.подзаголовок + ' крупнее имени ' + с.имяКарточки)
                .toBeGreaterThan(с.имяКарточки);
            expect(с.мета, 'уровень меты нашёлся').not.toBeNull();
            expect(с.имяКарточки, 'имя ' + с.имяКарточки + ' крупнее меты ' + с.мета)
                .toBeGreaterThan(с.мета);
            /* Тренер в базе один, и на каком-то виде ряд может оказаться пустым:
               тогда сравнивать нечего, а не «не совпало». */
            if (с.имяТренера !== null) {
                expect(с.имяТренера, 'имя тренера и имя корта — один уровень').toBe(с.имяКарточки);
            }
            expect(с.заголовок, 'заголовок раздела не мельче подзаголовка')
                .toBeGreaterThan(с.подзаголовок);
            expect(с.стрелка, 'стрелка стоит на ступени 18').toBe(18);
        });

        test('имя карточки не длиннее двух строк', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            с.строкИмени.forEach((n, i) => {
                expect(n, 'карточка ' + (i + 1) + ': строк в имени ' + n).toBeLessThanOrEqual(2);
            });
        });

        test('метка партнёра не лежит на фотографии', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            с.метки.forEach((м, i) => {
                expect(м.пересекается, 'метка ' + (i + 1) + ' пересекается с фотографией').toBe(false);
            });
        });

        test('мелкий текст проходит порог WCAG 4.5', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.мелкие.length, 'мелкий текст нашёлся').toBeGreaterThan(0);
            с.мелкие.forEach(м => {
                expect(м.контраст, м.класс + ' (' + м.кегль + 'px): контраст ' + м.контраст)
                    .toBeGreaterThanOrEqual(4.5);
            });
        });

        test('нажимается карточка целиком, кнопки-обманки нет', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.видимыхОбманок, 'видимых «Подробнее» в витрине').toBe(0);
            [...с.корты.ссылки, ...с.тренеры.ссылки].forEach((з, i) => {
                expect(з, 'карточка ' + (i + 1) + ' — ссылка с адресом').toBe('a:есть');
            });
            [...с.корты.стрелкиСкрыты, ...с.тренеры.стрелкиСкрыты]
                .filter(x => x !== null)
                .forEach((скрыта, i) => {
                    expect(скрыта, 'стрелка ' + (i + 1) + ' скрыта от диктора').toBe(true);
                });
            expect(с.горПрокрутка, 'горизонтальной прокрутки нет').toBe(false);
        });
    });
});
