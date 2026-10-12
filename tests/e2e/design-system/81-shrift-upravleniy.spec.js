/**
 * ШРИФТ УПРАВЛЕНИЙ И КАРТОЧКА ПРОФИЛЯ. 12.10, кусок 62-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • КТО В КАКОМ ШРИФТЕ НА ЭКРАНЕ. В файле `font-family: inherit`
 *     написан 82 раза, и по файлу не видно, какому элементу его не
 *     досталось: `button` и `input` не наследуют семейство от body.
 *     Замер 12.10 на 390 нашёл 12 управлений из 26 в системном Arial —
 *     включая общую шапку всех страниц. Это видно ТОЛЬКО на живой
 *     странице;
 *   • ПАРА «ИМЯ + СТРОКИ» МЕРЯЕТСЯ НА КАЖДОМ ВИДЕ. Имя было опущено до
 *     ступени строк на узких, и файл об этом молчит: правило лежит в
 *     медиа-блоке, а побеждает последний;
 *   • ПОДЧЁРКИВАНИЕ У ССЫЛКИ-КНОПКИ браузерное, в css его нет вовсе —
 *     найдено ГЛАЗАМИ на снимке, доказывается замером;
 *   • ШИРЕ ШРИФТ — ДРУГИЕ ПЕРЕЛИВЫ. Inter шире Arial, и подпись, которая
 *     влезала, может перестать. Меряется прямоугольником текста против
 *     доступной ширины, а не «на глаз».
 */
const { test, expect } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

test.use({ storageState: playerState });

const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];

async function погаситьНакладки(page) {
    const окно = page.locator('.ach-overlay.show');
    for (let и = 0; и < 20; и++) {
        if (!(await окно.count()) || !(await окно.first().isVisible())) break;
        const кнопка = page.locator('.ach-overlay .ach-btn');
        if (!(await кнопка.count())) break;
        await кнопка.first().click({ force: true });
        await page.waitForTimeout(250);
    }
}

async function открытьПрофиль(page, хвост) {
    await page.addInitScript(() => {
        try { localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
    });
    await page.goto('/pages/dashboard' + хвост + '.html#profile');
    await page.waitForLoadState('networkidle');
    await погаситьНакладки(page);
    await page.locator('#dbProfileQr').waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(400);
}

/** Все видимые управления и их семейство — щуп функцией, не строкой. */
function мимоШрифта() {
    const плохие = [];
    let всего = 0;
    document.querySelectorAll('button, input, select, textarea').forEach(э => {
        const к = э.getBoundingClientRect();
        if (!к.width || !к.height) return;
        всего++;
        const сем = getComputedStyle(э).fontFamily;
        if (сем.indexOf('Inter') < 0) плохие.push((э.id || э.className || э.tagName) + ' :: ' + сем.slice(0, 24));
    });
    return { всего, плохие };
}

/* ══════════════════════════════════════════════════════════════════════
   1. ШРИФТ УПРАВЛЕНИЙ — НА ЖИВОЙ СТРАНИЦЕ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('кабинет: ни одно управление не выпало из Inter — ' + я.имя, async ({ page }) => {
        await открытьПрофиль(page, я.хвост);
        const { всего, плохие } = await page.evaluate(мимоШрифта);
        expect(всего, 'ПОРОГ: видимых управлений нет — страница не та').toBeGreaterThan(5);
        expect(плохие, 'эти элементы рисуются системным шрифтом вместо Inter:\n  ' +
            плохие.join('\n  ') + '\n(общее правило input, button, select, textarea стоит в style.css)')
            .toEqual([]);
    });

    test('публичная страница: шапка и подвал в Inter — ' + я.имя, async ({ page }) => {
        await page.goto('/pages/tournaments' + я.хвост + '.html');
        await page.waitForLoadState('networkidle');
        const { всего, плохие } = await page.evaluate(мимоШрифта);
        expect(всего, 'ПОРОГ: видимых управлений нет').toBeGreaterThan(3);
        expect(плохие, 'шапка общая на все страницы — её кнопки шли в системном\n' +
            'шрифте на каждой: ' + плохие.join(' · ')).toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   2. ЛЕСТНИЦА КАРТОЧКИ — ОТНОШЕНИЕ, А НЕ ЧИСЛО
   ══════════════════════════════════════════════════════════════════════ */
test('имя в карточке строго крупнее её строк', async ({ page }) => {
    await открытьПрофиль(page, '');
    const л = await page.evaluate(() => {
        const взять = sel => {
            const э = document.querySelector(sel);
            if (!э) return null;
            const с = getComputedStyle(э);
            return { кегль: parseFloat(с.fontSize), вес: +с.fontWeight };
        };
        return { имя: взять('.db-profile-card-name'), строка: взять('.db-profile-card-row span') };
    });
    expect(л.имя, 'ПОРОГ: имени в карточке нет').not.toBeNull();
    if (!л.строка) test.skip(true, 'у аккаунта проб нет строк карточки — пару не с чем сверять');
    expect(л.имя.кегль, 'пара «имя + строки» читается как пара и обязана отстоять\n' +
        'на ступень: имя ' + л.имя.кегль + ', строки ' + л.строка.кегль)
        .toBeGreaterThan(л.строка.кегль);
    expect(л.имя.вес, 'имя — заголовок карточки, вес из системы').toBeGreaterThanOrEqual(600);
});

test('кнопки карточки: ступень высоты, ступень подписи, один вид', async ({ page }) => {
    await открытьПрофиль(page, '');
    const к = await page.evaluate(() => {
        const ряд = document.querySelectorAll('.db-profile-card-actions .db-btn');
        return Array.from(ряд).map(э => {
            const с = getComputedStyle(э);
            const кор = э.getBoundingClientRect();
            return {
                кто: э.tagName, h: Math.round(кор.height), кегль: parseFloat(с.fontSize),
                подчёркнут: с.textDecorationLine.indexOf('underline') >= 0,
                вертПоле: parseFloat(с.paddingTop) + parseFloat(с.paddingBottom)
            };
        });
    });
    expect(к.length, 'ПОРОГ: в ряду действий карточки нет кнопок').toBeGreaterThanOrEqual(2);
    for (const э of к) {
        expect([28, 36, 44, 52], 'высота ' + э.h + ' мимо шкалы кнопок').toContain(э.h);
        expect([11, 12, 14, 16, 18, 21], 'кегль ' + э.кегль + ' мимо шкалы').toContain(э.кегль);
        expect(э.подчёркнут, 'в ряду одна кнопка шла подчёркнутой (это была ссылка),\n' +
            'а вторая нет — при одинаковой рамке и высоте').toBe(false);
    }
    const кегли = new Set(к.map(э => э.кегль));
    expect(кегли.size, 'соседи в одном ряду обязаны стоять на ОДНОЙ ступени: ' +
        [...кегли].join(', ')).toBe(1);
    const высоты = new Set(к.map(э => э.h));
    expect(высоты.size, 'высоты в ряду разошлись: ' + [...высоты].join(', ')).toBe(1);
});

test('карточка рисуется у игрока С КАТЕГОРИЯМИ, а не только без них', async ({ page }) => {
    await открытьПрофиль(page, '');
    /* ИМЕННО ЭТОТ СЛУЧАЙ И БЫЛ СЛОМАН. В функции карточки имя `место`
       означало и контейнер, и место игрока в категории; `var` живёт во
       всей функции, второе объявление затирало первое, и карточка не
       рисовалась у всякого, у кого есть хоть одна категория. У аккаунта,
       которым мерили в браузере, категорий нет — замер молчал, прогон
       уронил 60 тестов из 75 */
    const есть = await page.evaluate(() => {
        const карточка = document.querySelector('.db-profile-card');
        const строки = document.querySelectorAll('.db-profile-card-row');
        const вБоку = document.querySelectorAll('.db-sidebar-rating-row');
        return {
            карточка: !!карточка,
            строк: строки.length,
            категорийВБоку: вБоку.length,
            пусто: !!document.querySelector('.db-profile-card-empty')
        };
    });
    expect(есть.карточка, 'карточки профиля нет вовсе: контейнер #dbProfileCard\n' +
        'остался пустым — значит присваивание ушло не тому').toBe(true);
    if (есть.категорийВБоку > 0) {
        expect(есть.пусто, 'у игрока есть категории (' + есть.категорийВБоку +
            ' в боковом меню), а карточка показывает пустое состояние').toBe(false);
        expect(есть.строк, 'категории есть, а строк в карточке ноль').toBeGreaterThan(0);
    }
});

/* ══════════════════════════════════════════════════════════════════════
   3. ПОДПИСЬ ВЛЕЗАЕТ — ПРЯМОУГОЛЬНИКОМ ТЕКСТА, А НЕ НА ГЛАЗ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('подписи кнопок карточки влезают в одну строку — ' + я.имя, async ({ page }) => {
        await открытьПрофиль(page, я.хвост);
        const мера = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.db-profile-card-actions .db-btn')).map(э => {
                const с = getComputedStyle(э);
                const кор = э.getBoundingClientRect();
                const д = document.createRange();
                д.selectNodeContents(э);
                const куски = Array.from(д.getClientRects()).filter(r => r.height > 0);
                const ширТекста = куски.reduce((m, r) => Math.max(m, r.width), 0);
                return {
                    текст: (э.textContent || '').trim(),
                    строк: куски.length,
                    ширТекста: Math.round(ширТекста * 10) / 10,
                    доступно: Math.round((кор.width - parseFloat(с.paddingLeft) - parseFloat(с.paddingRight)) * 10) / 10
                };
            });
        });
        for (const м of мера) {
            expect(м.строк, 'подпись «' + м.текст + '» переносится на ' + м.строк +
                ' строки: Inter шире системного шрифта, и то, что влезало, могло перестать')
                .toBe(1);
            expect(м.ширТекста, 'подпись «' + м.текст + '» ' + м.ширТекста +
                ' при доступных ' + м.доступно).toBeLessThanOrEqual(м.доступно + 1);
        }
    });
}

/* ══════════════════════════════════════════════════════════════════════
   4. КНОПКА QR ДОСТИЖИМА ТАМ, ГДЕ БОКОВОЕ МЕНЮ СКРЫТО
   ══════════════════════════════════════════════════════════════════════ */
test('кнопка QR в карточке видна и ведёт в окно', async ({ page }) => {
    await открытьПрофиль(page, '');
    const состав = await page.evaluate(() => {
        const вид = э => {
            if (!э) return 'нет';
            const с = getComputedStyle(э);
            return (с.display === 'none' || с.visibility === 'hidden' || !э.getBoundingClientRect().width)
                ? 'скрыт' : 'виден';
        };
        return {
            боковушка: вид(document.querySelector('.db-sidebar')),
            вМеню: вид(document.querySelector('#dbQrBtn')),
            вКарточке: вид(document.querySelector('#dbProfileQr'))
        };
    });
    /* ОБЕ ЗАПИСИ РАЗОМ: на узких боковушка скрыта, и тогда карточка —
       единственный вход в окно. На широких видны оба, и это не беда */
    expect(состав.вКарточке, 'кнопка QR в карточке профиля — вход, который работает\n' +
        'на телефоне: боковое меню там скрыто (' + состав.боковушка + ')').toBe('виден');

    await page.locator('#dbProfileQr').focus();
    await page.locator('#dbProfileQr').click();
    const окно = page.locator('.db-qr-modal');
    await окно.waitFor({ state: 'visible', timeout: 10000 });

    const оболочка = await page.evaluate(() => {
        const о = document.querySelector('.db-qr-modal');
        return { role: о.getAttribute('role'), modal: о.getAttribute('aria-modal'), имя: о.getAttribute('aria-labelledby') };
    });
    expect(оболочка.role, 'окно обязано называть себя диктору').toBe('dialog');
    expect(оболочка.modal).toBe('true');
    expect(оболочка.имя, 'у окна нет имени').toBeTruthy();

    await page.keyboard.press('Escape');
    await окно.waitFor({ state: 'detached', timeout: 10000 }).catch(async () => {
        await окно.waitFor({ state: 'hidden', timeout: 5000 });
    });
    const куда = await page.evaluate(() => document.activeElement ? document.activeElement.id : null);
    expect(куда, 'после закрытия фокус обязан вернуться на кнопку, которая открыла')
        .toBe('dbProfileQr');
});

/* ══════════════════════════════════════════════════════════════════════
   5. ОТ ШИРОКОГО ШРИФТА НИЧЕГО НЕ ПОЕХАЛО
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('кабинет не поехал вбок от более широкого шрифта — ' + я.имя, async ({ page }) => {
        await открытьПрофиль(page, я.хвост);
        const бока = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(бока, 'страница поехала вбок на ' + бока + 'px').toBeLessThanOrEqual(1);
    });
}
