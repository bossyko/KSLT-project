/**
 * МЁРТВОЕ И ЛИШНЕЕ. 14.10, ветка B, заход B2.
 *
 * Замер: в 29 файлах css объявлено 3551 имя, 408 не встречаются в коде ни
 * разу. 111 живут склейкой, 7 принадлежат чужим библиотекам — кандидатов в
 * мёртвые 290, снесено 187 плюс четыре, которых первый прибор не поймал.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО СНОС НЕ УНЁС ЖИВОЕ. Заморозка считает имена в файлах; что
 *     страница после сноса выглядит ТАК ЖЕ — говорит браузер. Снос css
 *     ломает тихо: элемент остаётся на месте, просто теряет вид, и ни одна
 *     ошибка в консоли об этом не скажет;
 *   • ЧТО НИ ОДИН СНЕСЁННЫЙ КЛАСС НЕ ВСПЛЫЛ В DOM. Прибор по коду слеп к
 *     трём вещам: к склейке, к разметке из базы и к тому, что видно только
 *     после входа. Живой обход закрывает первые две;
 *   • ЧТО МЕТКИ ИДУТ НА ЯЗЫКЕ СТРАНИЦЫ. Словарь страницы игрока был
 *     однозначно русским на всех трёх языках, и файл сам об этом знал
 *     (js/player.js:1203). Заморозка видит три ветки в коде; что на
 *     английской странице нет русского слова — показывает только загрузка;
 *   • ЧТО ВЫДУМАННЫХ ТУРНИРОВ НЕТ. При недоступной базе страница рисовала
 *     четыре придуманных турнира, а результат к ним выбирался СЛУЧАЙНЫМ
 *     числом от id игрока. Проверено чтением обеих баз 14.10: ни «KSLT
 *     Open 2026», ни «Winter Cup 2025» в них нет.
 *
 * ПОРОГ: страница не отрисовалась — проверка ПАДАЕТ, а не проходит
 * вхолостую. Пустая страница не доказывает ничего.
 */
const { test, expect } = require('../../fixtures');

const ВИДЫ = [
    { имя: 'десктоп 1512',    w: 1512, h: 900  },
    { имя: 'планшет 1024',    w: 1024, h: 768  },
    { имя: 'телефон гор 844', w: 844,  h: 390  },
    { имя: 'планшет 768',     w: 768,  h: 1024 },
    { имя: 'телефон 390',     w: 390,  h: 844  }
];

const ЯЗЫКИ = [
    { код: 'ru', хвост: '' },
    { код: 'en', хвост: '-en' },
    { код: 'kg', хвост: '-kg' }
];

/* Снесённые имена, которых на экране быть не может. Выборка из семей:
   старая главная, прежняя страница турниров, прежняя карточка вызова,
   старые уведомления, сведённые заходом B1. */
const СНЕСЕНО = [
    'past-tournament-card', 'past-tournaments-grid', 'trn-strip', 'winner-trophy',
    'tournament-card-body', 'tournament-card-footer', 'ranking-column', 'ranking-header',
    'preview-status', 'preview-category', 'btn-cta', 'hero-buttons', 'players-grid',
    'court-status', 'court-price', 'coach-level', 'logo-text', 'logo-icon', 'tennis-ball',
    'co-toast', 'ct-toast', 'pt-toast', 'bo-toast', 'bc-toast', 'court-toast', 'coach-toast',
    'pp-challenge-venue', 'pp-form-dot', 'sv-carousel-track', 'sv-compact-initials',
    'date-day', 'date-month', 'td-tab-content', 'tc-status', 'full-bleed', 'section-pad'
];

/* Русские метки словаря страницы игрока — на английской и киргизской
   странице их быть не должно ни одной. */
const РУССКИЕ_МЕТКИ = [
    'Вызвать на матч', 'Пригласить поиграть', 'Поражения', 'Достижения',
    'История рейтинга', 'Мои игры', 'Отправить вызов', 'Бросить вызов',
    'Игрок не найден', 'Оформите членство', 'Войдите в аккаунт'
];

/* Выдуманные турниры: в боевой базе 52 турнира, в тестовой 24 — этих нет
   ни в одной, проверено чтением 14.10. */
const ВЫДУМАННЫЕ = ['KSLT Open 2026', 'Winter Cup 2025', 'Autumn Classic 2025', 'KSLT Summer Series 2025'];

/* ЖДЁМ ПРИЗНАК, РАДИ КОТОРОГО ОТКРЫЛИ СТРАНИЦУ, А НЕ `body`. Первая
   редакция ждала body: он есть сразу, а карточки приходят из базы позже —
   и проверка либо уходила в skip, либо считала классы на ПУСТОЙ странице
   и зеленела вхолостую. ПУСТАЯ СТРАНИЦА НЕ ДОКАЗЫВАЕТ НИЧЕГО. */
async function открыть(page, адрес, вид, признак) {
    await page.setViewportSize({ width: вид.w, height: вид.h });
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 });
    await page.waitForTimeout(400);
}

/** Все классы, реально оказавшиеся в DOM. Признак, а не тишина сети. */
async function классыНаЭкране(page) {
    return page.evaluate(() => {
        const из = new Set();
        document.querySelectorAll('*').forEach(e => {
            const cl = e.classList;
            if (cl) cl.forEach(c => из.add(c));
        });
        return [...из];
    });
}

for (const вид of ВИДЫ) {
for (const язык of ЯЗЫКИ) {

test.describe('мёртвое и лишнее · ' + вид.имя + ' · ' + язык.код, () => {

    test('снесённых классов нет в DOM страницы турниров', async ({ page }) => {
        await открыть(page, '/pages/tournaments' + язык.хвост + '.html', вид, '.trn-block, .to-compact, .trn-block-empty');
        const классы = await классыНаЭкране(page);
        expect(классы.length, 'ПОРОГ: страница не отрисовалась').toBeGreaterThan(20);
        const всплыли = СНЕСЕНО.filter(к => классы.indexOf(к) !== -1);
        expect(всплыли, 'снесённый класс оказался на экране: ' + JSON.stringify(всплыли)).toHaveLength(0);
    });

    test('снесённых классов нет в DOM главной', async ({ page }) => {
        await открыть(page, язык.код === 'ru' ? '/index.html' : '/index' + язык.хвост + '.html', вид, '.vn-four .court-card, .vn-four .coach-card');
        const классы = await классыНаЭкране(page);
        expect(классы.length, 'ПОРОГ: главная не отрисовалась').toBeGreaterThan(40);
        const всплыли = СНЕСЕНО.filter(к => классы.indexOf(к) !== -1);
        expect(всплыли, 'снесённый класс оказался на экране: ' + JSON.stringify(всплыли)).toHaveLength(0);
    });

    test('витрина кортов и тренеров цела после сноса', async ({ page }) => {
        await открыть(page, язык.код === 'ru' ? '/index.html' : '/index' + язык.хвост + '.html', вид, '.vn-four .court-card, .vn-four .coach-card');
        /* .vn-four — живой блок, у которого сносились соседи по селектору
           (.court-card-actions, .coach-card-details). Если снос задел его,
           карточки потеряют вид, оставшись в разметке. */
        const целость = await page.evaluate(() => {
            const карточки = document.querySelectorAll('.vn-four .court-card, .vn-four .coach-card');
            if (!карточки.length) return null;
            let схлопнутых = 0;
            карточки.forEach(к => {
                const r = к.getBoundingClientRect();
                if (r.height < 40) схлопнутых++;
            });
            return { всего: карточки.length, схлопнутых: схлопнутых };
        });
        /* ПОРОГ, А НЕ ПРОПУСК: витрина есть на всех пяти видах и трёх
           языках — померено 14.10, два блока .vn-four и пять карточек.
           Пропуск выглядел как успех, а доказывал он ровно ничего:
           девять проверок уходили в skip на ЖИВОЙ витрине, потому что
           тест ждал `body`, а карточки приходят из базы позже. */
        expect(целость, 'ПОРОГ: витрина не отрисована').not.toBeNull();
        expect(целость.всего, 'ПОРОГ: карточек витрины ноль').toBeGreaterThan(0);
        expect(целость.схлопнутых, 'карточки витрины схлопнулись: ' + JSON.stringify(целость)).toBe(0);
    });

    test('страница турниров не осталась без стиля', async ({ page }) => {
        await открыть(page, '/pages/tournaments' + язык.хвост + '.html', вид, '.trn-block, .to-compact, .trn-block-empty');
        /* самый грубый признак потери стиля: страница схлопнулась в
           несколько экранов текста без коробок */
        const м = await page.evaluate(() => ({
            высота: document.documentElement.scrollHeight,
            сРамкой: [...document.querySelectorAll('*')].filter(e => {
                const s = getComputedStyle(e);
                return parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
            }).length
        }));
        expect(м.высота, 'ПОРОГ: страница пуста').toBeGreaterThan(600);
        expect(м.сРамкой, 'на странице не осталось ни одной рамки — стиль потерян').toBeGreaterThan(5);
    });

});

}
}

/* ─────────── словарь страницы игрока: один язык на одну страницу ─────────── */

for (const вид of ВИДЫ) {

test.describe('словарь страницы игрока · ' + вид.имя, () => {

    test('на английской странице нет русских меток', async ({ page }) => {
        await открыть(page, '/pages/player-en.html?id=kseniya-han', вид, '[class^="pp-"]');
        const html = await page.evaluate(() => document.body.innerHTML);
        expect(html.length, 'ПОРОГ: страница не отрисовалась').toBeGreaterThan(2000);
        const нашлись = РУССКИЕ_МЕТКИ.filter(с => html.includes(с));
        expect(нашлись, 'русские метки на английской странице: ' + JSON.stringify(нашлись)).toHaveLength(0);
    });

    test('на киргизской странице нет русских меток', async ({ page }) => {
        await открыть(page, '/pages/player-kg.html?id=kseniya-han', вид, '[class^="pp-"]');
        const html = await page.evaluate(() => document.body.innerHTML);
        expect(html.length, 'ПОРОГ: страница не отрисовалась').toBeGreaterThan(2000);
        const нашлись = РУССКИЕ_МЕТКИ.filter(с => html.includes(с));
        expect(нашлись, 'русские метки на киргизской странице: ' + JSON.stringify(нашлись)).toHaveLength(0);
    });

    test('выдуманных турниров нет ни на одном языке', async ({ page }) => {
        for (const хвост of ['', '-en', '-kg']) {
            await открыть(page, '/pages/player' + хвост + '.html?id=kseniya-han', вид, '[class^="pp-"]');
            const html = await page.evaluate(() => document.body.innerHTML);
            const нашлись = ВЫДУМАННЫЕ.filter(с => html.includes(с));
            expect(нашлись, 'выдуманный турнир на player' + хвост + ': ' + JSON.stringify(нашлись)).toHaveLength(0);
        }
    });

});

}
