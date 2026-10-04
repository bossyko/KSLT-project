/**
 * ОБЛОЖКА РАЗДЕЛА — ОДНА ЛЕСТНИЦА НА СТРАНИЦУ КАТЕГОРИИ И НА ОБЗОРНУЮ.
 *
 * 04.10 страница категории турниров приведена к обложке обзорной. Решение не
 * новое: оно принято Костей 28.09 («обложка 460 → 360», доска 482:9, блок M.1),
 * применено к обзорной и не донесено до категории. Замер 04.10 нашёл, что у
 * категории девять значений из десяти не стоят ни на одной ступени.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • что из `var(--fs-hero)` получилось В БРАУЗЕРЕ. В файле написано имя,
 *     а число говорит замер;
 *   • СРАВНЕНИЕ ДВУХ ЭКРАНОВ между собой — заморозка читает файлы по одному;
 *   • что высота обложки не зависит от данных: цифры тянутся из базы и бывают
 *     в один знак и в пять, а название категории — в 16 знаков и в 47.
 *
 * ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО: «кегль категории равен кеглю
 * обзорной на каждом виде», а не «кегль равен 40».
 *
 * КРАЙНИЕ ДАННЫЕ ПОДСТАВЛЯЮТСЯ В РАЗМЕТКУ, А НЕ В БАЗУ. База не трогается:
 * проверяется вёрстка, а не запрос.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА = [11, 12, 14, 16, 18, 21, 26, 32, 40];

const ЯЗЫКИ = [
    { имя: 'ru', категория: '/pages/tournaments.html?category=friendly', обзор: '/pages/tournaments-overview.html' },
    { имя: 'en', категория: '/pages/tournaments-en.html?category=friendly', обзор: '/pages/tournaments-overview-en.html' },
    { имя: 'kg', категория: '/pages/tournaments-kg.html?category=friendly', обзор: '/pages/tournaments-overview-kg.html' },
];

/** Ждём ПРИЗНАК — обложку с заголовком, а не тишину сети. Данные могут и не
 *  прийти: в тестовой базе этой категории нет, а кегли от данных не зависят. */
async function открыть(page, адрес, герой) {
    await page.goto(адрес);
    await page.waitForFunction(
        с => { const э = document.querySelector(с + ' h1'); return э && э.getBoundingClientRect().height > 0; },
        герой, { timeout: 15000 });
}

const снять = (page, герой) => page.evaluate(с => {
    const окр = v => Math.round(parseFloat(v) * 100) / 100;
    const hero = document.querySelector(с);
    const у = s => {
        const э = hero && hero.querySelector(s);
        if (!э || !э.getBoundingClientRect().height) return null;
        const c = getComputedStyle(э);
        return { кегль: окр(c.fontSize), вес: c.fontWeight, межстр: c.lineHeight };
    };
    return {
        высота: Math.round(hero.getBoundingClientRect().height),
        h1: у('h1'),
        цифра: у('.hero-stat-value'),
        подпись: у('.hero-stat-label'),
        перелив: document.documentElement.scrollWidth - window.innerWidth,
    };
}, герой);

for (const Я of ЯЗЫКИ) {

test.describe('обложка раздела · ' + Я.имя, () => {

    /* ══ ЛЕСТНИЦА СТОИТ НА СТУПЕНЯХ ══════════════════════════════════════ */

    test('каждый уровень обложки стоит на ступени шкалы', async ({ page }) => {
        await открыть(page, Я.категория, '.tournament-hero');
        const з = await снять(page, '.tournament-hero');
        for (const имя of ['h1', 'цифра', 'подпись']) {
            if (!з[имя]) continue;
            expect(ШКАЛА, имя + ' на ступени (получилось ' + з[имя].кегль + ')')
                .toContain(з[имя].кегль);
        }
    });

    test('межстрочный задан ступенью, а не normal', async ({ page }) => {
        await открыть(page, Я.категория, '.tournament-hero');
        const з = await снять(page, '.tournament-hero');
        expect(з.h1.межстр, 'normal считается от шрифта — у разных людей разное число')
            .not.toBe('normal');
    });

    /* ══ ГЛАВНОЕ ОТНОШЕНИЕ: ДВЕ СТРАНИЦЫ ОДНОГО РАЗДЕЛА ══════════════════ */

    test('кегли категории и обзорной совпадают на этом виде', async ({ page }) => {
        await открыть(page, Я.категория, '.tournament-hero');
        const кат = await снять(page, '.tournament-hero');
        await открыть(page, Я.обзор, '.to-hero');
        const обз = await снять(page, '.to-hero');

        expect(кат.h1.кегль, 'заголовок обложки').toBe(обз.h1.кегль);
        if (кат.цифра && обз.цифра) expect(кат.цифра.кегль, 'цифра обложки').toBe(обз.цифра.кегль);
        if (кат.подпись && обз.подпись) expect(кат.подпись.кегль, 'подпись цифры').toBe(обз.подпись.кегль);
    });

    test('подпись строго мельче цифры', async ({ page }) => {
        await открыть(page, Я.категория, '.tournament-hero');
        const з = await снять(page, '.tournament-hero');
        if (!з.цифра || !з.подпись) test.skip(true, 'цифры не нарисованы в этой базе');
        expect(з.подпись.кегль).toBeLessThan(з.цифра.кегль);
    });

    /* ══ ПОЛ: ОБЛОЖКА НЕ СЪЕДАЕТ ЭКРАН ══════════════════════════════════ */

    test('на низком горизонтальном обложка ниже экрана', async ({ page }) => {
        const { width, height } = page.viewportSize();
        test.skip(!(height <= 500 && width >= height), 'вид не низкий горизонтальный');
        await открыть(page, Я.категория, '.tournament-hero');
        const з = await снять(page, '.tournament-hero');
        expect(з.высота, 'было 460 при экране 390 — фотография съедала первый экран целиком')
            .toBeLessThan(height);
    });

    /* ══ ДАННЫЕ ТЯНУТСЯ ИЗ БАЗЫ — РАЗМЕР ОТ НИХ НЕ ЗАВИСИТ ══════════════ */

    test('высота обложки не меняется от длины цифр и названия', async ({ page }) => {
        await открыть(page, Я.категория, '.tournament-hero');
        const подставить = (ц, т) => page.evaluate(([ц, т]) => {
            const hero = document.querySelector('.tournament-hero');
            hero.querySelector('h1').textContent = т;
            document.querySelectorAll('.hero-stat-value').forEach((n, i) => {
                if (ц[i] !== undefined) n.textContent = ц[i];
            });
            return {
                высота: Math.round(hero.getBoundingClientRect().height),
                перелив: document.documentElement.scrollWidth - window.innerWidth,
            };
        }, [ц, т]);

        const обычное = await подставить(['13', '2', '11'], 'Friendly Weekend');
        const пятьЗнаков = await подставить(['12 480', '98 300', '1 386'], 'Турниры Pro-Masters');
        const длинноеИмя = await подставить(['13', '2', '11'], 'Кыргызстандын теннис боюнча ачык чемпионаты 2026');

        expect(пятьЗнаков.высота, 'пятизначные цифры не двигают обложку').toBe(обычное.высота);
        expect(длинноеИмя.высота, 'название в 47 знаков не двигает обложку').toBe(обычное.высота);
        expect(пятьЗнаков.перелив, 'пятизначные цифры не дают перелива вбок').toBe(0);
        expect(длинноеИмя.перелив, 'длинное название не даёт перелива вбок').toBe(0);
    });

    test('перелива вбок нет на живых данных', async ({ page }) => {
        await открыть(page, Я.категория, '.tournament-hero');
        const з = await снять(page, '.tournament-hero');
        expect(з.перелив).toBe(0);
    });

});

}
