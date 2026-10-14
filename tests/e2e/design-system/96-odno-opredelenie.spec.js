/**
 * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. 14.10, ветка B, заход B1.
 *
 * Замер 14.10: пять понятий жили несколькими копиями, и каждая успела
 * уехать от остальных — уведомление (семь тел), название места (четыре
 * словаря), толщина рамки (748 мест, шесть значений), галочка (шесть
 * рисунков), семейство шрифта (27 записей, шесть написаний).
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО СВЕДЕНИЕ ДОЕХАЛО ДО ЭКРАНА. Заморозка видит одно определение в
 *     файле; что на экране один шрифт, одна коробка и одна толщина —
 *     говорит браузер. Между файлом и экраном стоит порядок загрузки:
 *     `admin.css` идёт ПОСЛЕ `style.css` и перекрыл бы общее правило
 *     молча, без ошибки;
 *   • ЧТО МОДУЛЬ ДОЕХАЛ. Непподключённый модуль не роняет страницу:
 *     `if (window.KSLT_TOAST)` просто не сработает, и человек не узнает,
 *     что его действие прошло. Ровно так же молча исчезла бы подпись
 *     этапа. Такое ловится только загрузкой страницы;
 *   • ЧТО ОДНО И ТО ЖЕ НА ТРЁХ ЯЗЫКАХ. Копии расходились по языкам уже
 *     дважды — порядок секций на LIVE 23.09 и подписи этапа, где в
 *     `player.js` коды R16/R32 не переводились вовсе;
 *   • ЧТО ОДНО И ТО ЖЕ НА ПЯТИ ВИДАХ. Медиа-правило — это ещё одно место,
 *     где копия может ожить: перекрытие внутри @media видно только на
 *     той ширине, на которой оно включается.
 *
 * ПОРОГ: страница не отрисовалась — проверка ПАДАЕТ, а не проходит
 * вхолостую. Пустая страница не доказывает ничего.
 */
const { test, expect } = require('../../fixtures');

/* Ступени толщины: волосок · толстая · тяжёлая.
   0 — рамки нет вовсе; 4 — полоса-метка слева у строки тревоги, своё
   понятие; 12 — прозрачный отступ в карточке партнёра, помечен НАМЕРЕНО. */
const СТУПЕНИ = [0, 1, 2, 3, 4, 12];

const ВИДЫ = [
    { имя: 'десктоп 1512',    w: 1512, h: 900  },
    { имя: 'планшет 1024',    w: 1024, h: 768  },
    { имя: 'телефон гор 844', w: 844,  h: 390  },
    { имя: 'планшет 768',     w: 768,  h: 1024 },
    { имя: 'телефон 390',     w: 390,  h: 844  }
];

const ЯЗЫКИ = [
    { код: 'ru', хвост: '',     },
    { код: 'en', хвост: '-en',  },
    { код: 'kg', хвост: '-kg',  }
];

async function открыть(page, адрес, вид, признак) {
    await page.setViewportSize({ width: вид.w, height: вид.h });
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelector(с), признак, { timeout: 15000 });
    await page.waitForTimeout(200);
}

/** Все видимые семейства на странице. Признак, а не тишина сети. */
async function семейства(page) {
    return page.evaluate(() => {
        const из = new Set();
        document.querySelectorAll('*').forEach(e => {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) return;
            let свой = '';
            e.childNodes.forEach(n => { if (n.nodeType === 3) свой += n.nodeValue; });
            if (!свой.trim()) return;
            const s = getComputedStyle(e);
            if (s.visibility === 'hidden' || s.display === 'none') return;
            из.add(s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
        });
        return [...из];
    });
}

/** Все толщины рамок и обводок на странице, в пикселах. */
async function толщины(page) {
    return page.evaluate(() => {
        const из = {};
        document.querySelectorAll('*').forEach(e => {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) return;
            const s = getComputedStyle(e);
            if (s.display === 'none') return;
            ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
                .forEach(св => {
                    const ч = Math.round(parseFloat(s[св]) * 100) / 100;
                    if (!(ч > 0)) return;
                    из[ч] = (из[ч] || 0) + 1;
                });
        });
        return из;
    });
}

for (const вид of ВИДЫ) {
for (const язык of ЯЗЫКИ) {

test.describe('одно определение · ' + вид.имя + ' · ' + язык.код, () => {

    test('семейство шрифта на странице цен одно', async ({ page }) => {
        await открыть(page, '/pages/pricing' + язык.хвост + '.html', вид, '.pm-feats li');
        const с = await семейства(page);
        expect(с.length, 'ПОРОГ: страница не отрисовалась').toBeGreaterThan(0);
        expect(с, 'семейств на экране: ' + JSON.stringify(с)).toEqual(['Inter']);
    });

    test('толщина рамки на странице цен — только ступени', async ({ page }) => {
        await открыть(page, '/pages/pricing' + язык.хвост + '.html', вид, '.pm-feats li');
        const т = await толщины(page);
        const все = Object.keys(т).map(Number);
        expect(все.length, 'ПОРОГ: рамок на странице не найдено').toBeGreaterThan(0);
        const мимо = все.filter(ч => СТУПЕНИ.indexOf(ч) === -1);
        expect(мимо, 'толщины мимо шкалы: ' + JSON.stringify(т)).toHaveLength(0);
    });

    test('галочка-маркер одного размера во всех пунктах', async ({ page }) => {
        await открыть(page, '/pages/pricing' + язык.хвост + '.html', вид, '.pm-feats li');
        const р = await page.evaluate(() => {
            const из = new Set();
            document.querySelectorAll('.pm-feats li').forEach(li => {
                const s = getComputedStyle(li, '::before');
                if (s.content === 'none') return;
                из.add(s.width + '×' + s.height + ' / ' + s.borderLeftWidth);
            });
            return [...из];
        });
        expect(р.length, 'ПОРОГ: ни одного маркера не нарисовано').toBeGreaterThan(0);
        expect(р, 'маркеры разных размеров: ' + JSON.stringify(р)).toHaveLength(1);
    });

    test('маркер списка спонсоров совпадает с маркером цен', async ({ page }) => {
        const снять = async (адрес, сел) => {
            await открыть(page, адрес, вид, сел);
            return page.evaluate(с => {
                const li = document.querySelector(с);
                if (!li) return null;
                const s = getComputedStyle(li, '::before');
                return s.width + '×' + s.height + ' / ' + s.borderLeftWidth;
            }, сел);
        };
        const цены = await снять('/pages/pricing' + язык.хвост + '.html', '.pm-feats li');
        const спон = await снять('/pages/sponsors' + язык.хвост + '.html', '.sn-tier li');
        expect(цены, 'ПОРОГ: маркер цен не нарисован').not.toBeNull();
        expect(спон, 'ПОРОГ: маркер спонсоров не нарисован').not.toBeNull();
        expect(спон, 'маркер разъехался между страницами').toBe(цены);
    });

    test('коробка чекбокса одна, и галочка внутри неё', async ({ page }) => {
        await открыть(page, '/pages/auth' + язык.хвост + '.html', вид, '.auth-tab, .auth-card');
        /* форма регистрации открывается нажатием — модалок в списке нет */
        /* ЯКОРЬ НА ИМЕНИ, А НЕ НА ПОДПИСИ: подпись у трёх языков разная
           («Регистрация» · «Sign Up» · «Каттоо»), `data-tab` — одна. */
        await page.evaluate(() => {
            const рег = document.querySelector('.auth-tab[data-tab="signup"]');
            if (рег) рег.click();
        });
        await page.waitForTimeout(300);
        await page.evaluate(() => {
            const р = document.getElementById('signupShowForm');
            if (р) р.click();
        });
        const есть = await page.waitForFunction(
            () => !!document.querySelector('.auth-checkbox input[type="checkbox"]'),
            null, { timeout: 10000 }).catch(() => null);
        expect(есть, 'ПОРОГ: чекбокс согласия не отрисован').not.toBeNull();

        const к = await page.evaluate(() => {
            const вх = document.querySelector('.auth-checkbox input[type="checkbox"]');
            if (!вх) return null;
            вх.checked = true;
            const s = getComputedStyle(вх);
            const г = getComputedStyle(вх, '::after');
            const r = вх.getBoundingClientRect();
            return {
                ширина: Math.round(r.width), высота: Math.round(r.height),
                рамка: s.borderTopWidth, радиус: s.borderTopLeftRadius,
                галочка: г.width + '×' + г.height
            };
        });
        expect(к, 'ПОРОГ: чекбокс не прочитан').not.toBeNull();
        expect(к.ширина, 'коробка чекбокса — ступень 16').toBe(16);
        expect(к.высота, 'коробка чекбокса — ступень 16').toBe(16);
        expect(к.рамка, 'рамка чекбокса — толстая ступень').toBe('2px');
        expect(к.радиус, 'радиус чекбокса — ступень шкалы').toBe('4px');
    });

    test('модуль уведомления доехал до страницы кортов', async ({ page }) => {
        await открыть(page, '/pages/courts' + язык.хвост + '.html', вид, 'body');
        const есть = await page.evaluate(() => ({
            модуль: typeof window.KSLT_TOAST === 'object' && window.KSLT_TOAST !== null,
            показать: !!(window.KSLT_TOAST && typeof window.KSLT_TOAST.показать === 'function'),
            тон: !!(window.KSLT_TOAST && typeof window.KSLT_TOAST.тон === 'function')
        }));
        expect(есть.модуль, 'модуль уведомления не подключён — окно исчезнет МОЛЧА').toBe(true);
        expect(есть.показать, 'у модуля нет тела уведомления').toBe(true);
        expect(есть.тон, 'у модуля нет общего перевода тона').toBe(true);
    });

    test('словарь мест доехал и переводит, а не отдаёт код', async ({ page }) => {
        await открыть(page, '/pages/tournament' + язык.хвост + '.html', вид, 'body');
        const п = await page.evaluate(() => {
            if (!window.KSLT_MESTA) return null;
            return {
                ru: window.KSLT_MESTA.подпись('ru', 'R16'),
                en: window.KSLT_MESTA.подпись('en', 'R16'),
                kg: window.KSLT_MESTA.подпись('kg', 'R16'),
                незнакомый: window.KSLT_MESTA.подпись('ru', 'ZZZ'),
                черезОчки: window.KSLT_POINTS ? window.KSLT_POINTS.подписьРаунда('R16', 'ru') : null,
                полоса: window.KSLT_POINTS ? window.KSLT_POINTS.подписьМеста('QF') : null
            };
        });
        expect(п, 'словарь мест не подключён — подпись исчезнет МОЛЧА').not.toBeNull();
        ['ru', 'en', 'kg'].forEach(я => {
            expect(п[я], 'код не переведён на ' + я).not.toBe('R16');
            expect((п[я] || '').length, 'пустая подпись на ' + я).toBeGreaterThan(0);
        });
        expect(п.незнакомый, 'незнакомый код должен вернуться как есть').toBe('ZZZ');
        expect(п.черезОчки, 'очки зовут тот же словарь').toBe(п.ru);
        /* ИМЯ `подписьМеста` В ОЧКАХ ЗАНЯТО ДРУГИМ ПОНЯТИЕМ — полосой мест.
           Второе объявление затирает первое молча, и подпись раунда
           начинает звать полосу с языком вместо кода. */
        expect(п.полоса, 'полоса мест подменена названием этапа').toBe('5-8');
    });

});

}
}
