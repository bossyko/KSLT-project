/**
 * РАЗДЕЛ «ДАВАЙ СЫГРАЕМ» `#players` НА ГЛАВНОЙ — решения Кости 24.09,
 * доска 406:9 и три снимка вечером.
 *
 * Что здесь проверяется и почему именно так:
 *
 *  · ТОЛЬКО ЦЕЛЫЕ РЯДЫ. Ряд с дырой на месте недостающей карточки читается
 *    как поломка. Тест не знает, сколько игроков в базе, и проверяет
 *    ОТНОШЕНИЕ: в каждом ряду, кроме случая «ряд всего один», карточек
 *    столько же, сколько колонок.
 *  · КНОПКИ РЯДА НА ОДНОЙ ЛИНИИ. У одной карточки есть разряд, форма и
 *    метка NTRP, у другой ничего — низы «Пригласить» всё равно совпадают.
 *  · МЕТКА НЕ ЛЕЖИТ НА ПОРТРЕТЕ. Прямоугольники метки и кружка не
 *    пересекаются ни на одном виде и ни на одном языке.
 *  · ДВА КРУЖКА — ОДНО ПОВЕДЕНИЕ. Обёртка кружка с фотографией и обёртка
 *    кружка с инициалами одной высоты, и имена под ними на одной линии.
 *  · ВЫСОТА КНОПКИ — СТУПЕНЬ. Красится 44 на всех пяти видах.
 *  · ПАРА ЕДЕТ ОДНОЙ ГРАНИЦЕЙ. Подзаголовок строго мельче заголовка
 *    раздела на каждом виде, и разрыв между ними не схлопывается.
 *  · НИЧЕГО НЕ ВЫЛЕЗАЕТ. Ни горизонтальной прокрутки, ни обрезанного
 *    текста в карточке.
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

/** Ждём не сеть, а признак: в сетке появились карточки либо пустое состояние. */
async function дождаться(page, адрес) {
    await page.goto(адрес);
    await page.waitForSelector('#players .pt-grid', { timeout: 15000 });
    await page.waitForFunction(() => {
        const с = document.querySelector('#players .pt-grid');
        return с && (с.querySelector('.pt-card') || document.querySelector('#players .pg-empty'));
    }, null, { timeout: 15000 });
    /* Кружки подтягиваются картинками: без них обёртка меряется до загрузки */
    await page.waitForFunction(() => {
        const ф = [...document.querySelectorAll('#players .pt-avatar')];
        return ф.every(и => и.complete);
    }, null, { timeout: 15000 }).catch(() => {});
}

const снимок = page => page.evaluate(() => {
    const сек = document.getElementById('players');
    if (!сек) return null;

    const короб = э => { const r = э.getBoundingClientRect();
        return { л: Math.round(r.left), п: Math.round(r.right), в: Math.round(r.top),
                 н: Math.round(r.bottom), ш: Math.round(r.width), вы: Math.round(r.height) }; };
    const кегль = э => э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null;

    const сетка = сек.querySelector('.pt-grid');
    const видимые = [...сек.querySelectorAll('.pt-card')]
        .filter(к => getComputedStyle(к).display !== 'none' && к.getClientRects().length);

    /* Ряды считаются по верхней кромке: сетка выравнивает их сама */
    const поРядам = {};
    видимые.forEach(к => { const в = короб(к).в; (поРядам[в] = поРядам[в] || []).push(к); });
    const ряды = Object.keys(поРядам).sort((a, b) => a - b).map(в => поРядам[в]);

    return {
        колонок: сетка ? getComputedStyle(сетка).gridTemplateColumns.split(' ').length : null,
        видимых: видимые.length,
        всегоВРазметке: сек.querySelectorAll('.pt-card').length,
        рядов: ряды.length,
        вРядах: ряды.map(р => р.length),

        /* низы кнопок внутри каждого ряда */
        низыКнопок: ряды.map(р => р.map(к => {
            const б = к.querySelector('.pt-invite-btn');
            return б ? короб(б).н : null;
        })),

        /* верхние кромки имён внутри каждого ряда */
        верхИмён: ряды.map(р => р.map(к => {
            const и = к.querySelector('.pt-name');
            return и ? короб(и).в : null;
        })),

        обёртки: [...new Set(видимые.map(к => {
            const о = к.querySelector('.pt-avatar-wrap');
            return о ? короб(о).вы : null;
        }))],

        нахлёстМетки: видимые.map((к, i) => {
            const м = к.querySelector('.pt-ntrp-badge');
            const а = к.querySelector('.pt-avatar, .pt-avatar-placeholder');
            if (!м || !а) return null;
            const rм = короб(м), rа = короб(а);
            const пересек = !(rм.п <= rа.л || rм.л >= rа.п || rм.н <= rа.в || rм.в >= rа.н);
            return пересек ? i : null;
        }).filter(x => x !== null),

        кнопка: (() => {
            const б = сек.querySelector('.pt-invite-btn');
            if (!б) return null;
            const s = getComputedStyle(б);
            return { цель: короб(б).вы,
                     красится: Math.round(короб(б).вы - parseFloat(s.borderTopWidth)),
                     кегль: кегль(б) };
        })(),

        заголовок: кегль(сек.querySelector('.section-header h2')),
        подзаголовок: кегль(сек.querySelector('.pg-sub')),

        обрезано: видимые.map((к, i) => {
            const плохие = [...к.querySelectorAll('.pt-name, .pt-category, .pt-ntrp-badge, .pt-invite-btn')]
                .filter(э => э.scrollWidth > э.clientWidth + 1 &&
                             getComputedStyle(э).overflow === 'visible');
            return плохие.length ? i + ':' + плохие.map(э => э.className).join(',') : null;
        }).filter(x => x !== null),

        горПрокрутка: document.documentElement.scrollWidth > window.innerWidth + 1,

        плашка: (() => {
            const п = сек.querySelector('.guest-cta-card');
            if (!п || !п.getClientRects().length) return null;
            const б = сек.querySelector('.guest-cta-btn');
            const s = getComputedStyle(п);
            return { поля: s.padding, радиус: s.borderRadius,
                     кнопка: б ? короб(б).вы : null };
        })()
    };
});

СТРАНИЦЫ.forEach(({ имя, адрес }) => {
    test.describe('«Давай сыграем» · ' + имя, () => {

        test('только целые ряды: в ряду столько карточек, сколько колонок', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с, 'раздел #players на странице').not.toBeNull();
            expect(с.видимых, 'хотя бы одна карточка видна').toBeGreaterThan(0);

            /* Один ряд может быть неполным — игроков просто мало. Два и больше
               рядов обязаны быть полными все до единого: дыра в ряду и есть то,
               что Костя назвал поломкой. */
            if (с.рядов > 1) {
                с.вРядах.forEach((n, i) => {
                    expect(n, 'ряд ' + (i + 1) + ' из ' + с.рядов + ' заполнен целиком').toBe(с.колонок);
                });
            } else {
                expect(с.вРядах[0], 'единственный ряд не шире числа колонок')
                    .toBeLessThanOrEqual(с.колонок);
            }
            expect(с.видимых, 'потолок вида не превышен').toBe(с.вРядах.reduce((a, b) => a + b, 0));
        });

        test('кнопки одного ряда стоят на одной линии', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            с.низыКнопок.forEach((ряд, i) => {
                const набор = [...new Set(ряд.filter(x => x !== null))];
                expect(набор.length, 'ряд ' + (i + 1) + ': низы «Пригласить» — ' + ряд.join(', ')).toBe(1);
            });
        });

        test('имена одного ряда начинаются на одной высоте', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            /* Кружок с фотографией и кружок с инициалами обязаны вести себя
               одинаково: <img> строчный, и без display:block под ним остаётся
               зазор базовой линии — имя уезжает на шесть пикселей вниз. */
            expect(с.обёртки.length, 'обёртки кружков одной высоты: ' + с.обёртки.join(', ')).toBe(1);
            с.верхИмён.forEach((ряд, i) => {
                const набор = [...new Set(ряд.filter(x => x !== null))];
                expect(набор.length, 'ряд ' + (i + 1) + ': верх имён — ' + ряд.join(', ')).toBe(1);
            });
        });

        test('метка NTRP не лежит на портрете', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.нахлёстМетки, 'карточки, где метка задевает кружок').toEqual([]);
        });

        test('кнопка «Пригласить» красится ступенью 44', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            if (!с.кнопка) test.skip(true, 'кнопок нет — пустое состояние');
            expect(с.кнопка.красится, 'высота кнопки — ступень md компонента Button 17:82')
                .toBe(44);
            expect(с.кнопка.цель, 'цель нажатия не меньше 44').toBeGreaterThanOrEqual(44);
        });

        test('подзаголовок строго мельче заголовка раздела', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.заголовок, 'заголовок раздела найден').toBeTruthy();
            expect(с.подзаголовок, 'подзаголовок найден').toBeTruthy();
            /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО: пара обязана стоять через
               две ступени шкалы 11·12·14·16·18·21·26 на КАЖДОМ виде. Заголовок
               падает 26 → 21 на 768; если подзаголовок там не поедет следом,
               разрыв схлопнется — именно это и ловится. */
            const ШКАЛА = [11, 12, 14, 16, 18, 21, 26, 32, 40];
            const iЗ = ШКАЛА.indexOf(с.заголовок);
            const iП = ШКАЛА.indexOf(с.подзаголовок);
            expect(iЗ, 'заголовок ' + с.заголовок + ' стоит на ступени').toBeGreaterThan(-1);
            expect(iП, 'подзаголовок ' + с.подзаголовок + ' стоит на ступени').toBeGreaterThan(-1);
            expect(iЗ - iП, 'разрыв пары ' + с.заголовок + '/' + с.подзаголовок + ' — две ступени')
                .toBe(2);
        });

        test('ничего не вылезает и не обрезается', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.обрезано, 'обрезанный текст в карточках').toEqual([]);
            expect(с.горПрокрутка, 'горизонтальной прокрутки нет').toBe(false);
        });

        test('плашка-гейт держит числа эталона', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            if (!с.плашка) test.skip(true, 'вошедший пользователь — плашки нет');
            /* Эталон .badges-cta-box: 24/32 на широком, 16/24 на телефоне,
               радиус 24 на всех видах, кнопка ступенью md 44. */
            expect(['24px 32px', '16px 24px'],
                'поля плашки — одна из двух ступеней эталона, сейчас ' + с.плашка.поля)
                .toContain(с.плашка.поля);
            expect(с.плашка.радиус, 'радиус коробки-гейта один на всех видах').toBe('24px');
            expect(с.плашка.кнопка, 'кнопка плашки — ступень md 44').toBe(44);
        });
    });
});
