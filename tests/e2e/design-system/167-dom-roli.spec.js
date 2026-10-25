// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ЗНАЧОК РОЛИ — ОДИН ДОМ, И ОН ЭКРАНИРУЕТ ОБА КОНЦА. Кусок 167, 25.10.
 *
 * ЧТО БЫЛО. Значок роли собирали ЧЕТЫРЕ места в трёх файлах:
 * `admin/sections/users.js`, `admin/core/layout.js` (дважды) и
 * `dashboard.js`. Каждое писало свой класс `kslt-role kslt-role-<роль>` и
 * брало подпись из СВОЕГО словаря, причём ключи у словарей были разные:
 * `roleAdmin` в админке, `role_admin` в кабинете — два перевода одного
 * понятия. И все четыре ставили роль в ИМЯ КЛАССА СЫРОЙ, хотя
 * `profiles.role` — текстовый столбец базы: кавычка там закрывает атрибут.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и видит
 * зов экранирования. Он НЕ МОЖЕТ сказать, что на живом экране атрибут не
 * разъехался и обработчик не родился, и не может сказать, что подпись роли
 * на кыргызском и английском пришла из ОДНОГО словаря. Это и мерится здесь.
 *
 * ДОМ ЗОВЁТСЯ СНАРУЖИ, И ПОТОМУ ПРОБА ВООБЩЕ ВОЗМОЖНА: `KSLT_DOSTUP` стоит
 * на странице кабинета раньше своих потребителей. Четыре зовущих — местные
 * функции за входом, их держит сторож с прувером.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155.
 */

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/dashboard.html', админ: 'Администратор', игрок: 'Игрок' },
    { имя: 'en', адрес: '/pages/dashboard-en.html', админ: 'Admin', игрок: 'Player' },
    { имя: 'kg', адрес: '/pages/dashboard-kg.html', админ: 'Администратор', игрок: 'Оюнчу' }
];

/* КРАЙНЯЯ РОЛЬ: кавычка закрывает атрибут класса, дальше идёт имя
   обработчика. Обработчик намеренно безобидный: цену называют, а не
   эксплуатируют. */
const КРАЙНЯЯ_РОЛЬ = 'admin" onmouseover="1" data-podlog="1';

async function открыть(page, адрес) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403|406/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    await page.waitForFunction(
        () => !!window.KSLT_DOSTUP && !!window.KSLT_DOSTUP.значокРоли,
        null, { timeout: 20000 });
    return беды;
}

async function собрать(page, роль, о) {
    return page.evaluate(([р, оп]) => {
        const песок = document.createElement('div');
        document.body.appendChild(песок);
        песок.innerHTML = window.KSLT_DOSTUP.значокРоли(р, оп || undefined);
        const у = песок.firstElementChild;
        const итог = у ? {
            есть: true,
            тег: у.tagName.toLowerCase(),
            классы: у.className,
            текст: у.textContent,
            обработчиков: у.getAttributeNames().filter(а => а.indexOf('on') === 0),
            подложных: у.getAttributeNames().filter(а => а.indexOf('data-podlog') === 0),
            атрибуты: у.getAttributeNames().slice().sort(),
            детей: у.children.length
        } : { есть: false };
        песок.remove();
        return итог;
    }, [роль, о || null]);
}

for (const я of ЯЗЫКИ) {

    test(`A · крайняя роль не закрывает атрибут класса · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.адрес + '?proba=167a');
        const о = await собрать(page, КРАЙНЯЯ_РОЛЬ);

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(о.есть, 'значок собрался').toBe(true);
        expect(о.обработчиков, 'обработчиков не появилось').toEqual([]);
        expect(о.подложных, 'подложного атрибута не появилось').toEqual([]);
        expect(о.атрибуты, 'атрибут только один — класс').toEqual(['class']);
        expect(о.детей, 'лишних узлов внутри нет').toBe(0);
        /* СЛОВО В ЗНАЧЕНИИ — НЕ ОБРАБОТЧИК (правило доски 159): кавычка и
           слово `onmouseover` ОБЯЗАНЫ остаться в значении класса текстом. */
        expect(о.классы, 'роль осталась ОДНИМ значением, целиком').toContain(КРАЙНЯЯ_РОЛЬ);
        expect(о.классы, 'общий класс на месте').toContain('kslt-role');
    });

    test(`B · подпись роли — из одного словаря, на языке страницы · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.адрес + '?proba=167b');
        const админ = await собрать(page, 'admin');
        const игрок = await собрать(page, 'player');
        const пусто = await собрать(page, '');
        const панель = await собрать(page, 'manager', { тег: 'div', класс: 'db-sidebar-role' });

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(админ.текст, 'подпись администратора').toBe(я.админ);
        expect(игрок.текст, 'подпись игрока').toBe(я.игрок);
        /* УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ: пустая роль читается
           как «пользователь», и класс у неё тот же. */
        expect(пусто.классы, 'пустая роль становится пользователем').toContain('kslt-role-user');
        expect(админ.тег, 'по умолчанию — span').toBe('span');
        expect(панель.тег, 'тег приходит доводом').toBe('div');
        expect(панель.классы, 'свой класс панели приходит доводом').toContain('db-sidebar-role');
        expect(панель.классы, 'и роль на месте рядом с ним').toContain('kslt-role-manager');
    });
}
