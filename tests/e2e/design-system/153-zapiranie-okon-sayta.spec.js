// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ЗАПИРАНИЕ ФОКУСА В ОКНАХ САЙТА — ЧЕТЫРЕ КОПИИ УШЛИ В ДОМ. Кусок 153, 24.10.
 *
 * ЧТО БЫЛО. Ловушка жила в ДЕСЯТИ местах, а не в шести: шесть звали дом
 * (кусок 152), и ЧЕТЫРЕ копии жили вне него, каждая со своим списком и
 * своим алгоритмом — `sponsors-loader.js` (на подложке, видимость не
 * проверял вовсе), `news.js` (кольцо по видимым КНОПКАМ), `sponsors-page.js`
 * (поля и видимость через `offsetParent`), `battles-overview.js` (фаза
 * ПЕРЕХВАТА). Ни одна не возвращала фокус из-под окна, ни одна не гасила
 * Tab в пустом окне. Плюс ДВА окна вызова на странице игрока, у которых
 * ловушки не было вовсе, а в одном из них есть ПОЛЕ.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и
 * говорит, что `'Tab'` вне дома не разбирает никто. Он не может сказать,
 * ДЕРЖИТ ли Tab внутри окна на живом экране. А вся цена куска именно в
 * этом: под открытым окном лежит страница с кнопками, и слепой обход по
 * ней из окна — нажатие вслепую.
 *
 * ЧЕГО ПРОБА НЕ ДОСТАЁТ, И ЭТО СКАЗАНО ВСЛУХ:
 *   · ОКНО СПОНСОРА ВИТРИНЫ — рисуется только для спонсора с контактами, а
 *     в тестовой базе таких НОЛЬ; глобального входа у него нет. Держит
 *     сторож `check-sponsors.js` чтением.
 *   · ДВА ОКНА ВЫЗОВА на странице игрока — за входом: кнопка «Вызвать»
 *     гостю не рисуется. Держит сторож `check-lovushka-zapiranie.js`.
 * Остальные три окна достаются на ПУБЛИЧНЫХ страницах, и мерятся они
 * настоящим нажатием, а не чтением кода.
 *
 * ТРИ ОКНА ОТКРЫВАЮТСЯ ТРЕМЯ РАЗНЫМИ ПУТЯМИ, И КАЖДЫЙ — ПУТЬ ПРОДУКТА:
 *   A · «обсудим сотрудничество» — НАЖАТИЕМ на настоящую кнопку страницы;
 *   B · смотрелка снимков — зовом `openPhotoViewer`, объявленной на верхнем
 *       уровне файла, то есть ровно так, как её зовёт код новостей;
 *   C · окно карты — вставкой `.bo-meta-venue` в настоящий контейнер
 *       `#battlesContent` и нажатием: клик там ДЕЛЕГИРОВАН, и разметку я
 *       даю ту же, что рисует продукт. Данных о месте в тестовой базе нет.
 */

const ЯЗЫКИ = [
    { имя: 'ru', спонсоры: '/pages/sponsors.html', новости: '/pages/news.html', баттлы: '/pages/battles-overview.html' },
    { имя: 'en', спонсоры: '/pages/sponsors-en.html', новости: '/pages/news-en.html', баттлы: '/pages/battles-overview-en.html' },
    { имя: 'kg', спонсоры: '/pages/sponsors-kg.html', новости: '/pages/news-kg.html', баттлы: '/pages/battles-overview-kg.html' }
];

const ТОЧКА = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

async function открыть(page, адрес) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: дом подключён тегом, и его появление
       и есть признак того, что страница доехала до наших скриптов. */
    await page.waitForFunction(() => !!(window.KSLT_FOKUS && window.KSLT_FOKUS.запереть), null, { timeout: 15000 });
    return беды;
}

const открытых = page => page.evaluate(() => window.KSLT_FOKUS.открытых());
const фокусВнутри = (page, селектор) => page.evaluate(с => {
    const окно = document.querySelector(с);
    return !!окно && окно.contains(document.activeElement);
}, селектор);
const подОкно = page => page.evaluate(() => {
    /* ФОКУС СТАВИТСЯ НА ЭЛЕМЕНТ СТРАНИЦЫ ПОД ОКНОМ — ровно та ветвь, что
       была мертва у всех четырёх копий: нажатие под окном до подложки не
       всплывает, и ловушка на подложке его не слышит. */
    const под = document.querySelectorAll('a')[0];
    под.focus();
    return document.activeElement === под;
});

for (const я of ЯЗЫКИ) {

    test('A · окно «обсудим сотрудничество» запирает фокус и возвращает его · ' + я.имя, async ({ page }) => {
        const беды = await открыть(page, я.спонсоры);
        expect(беды, 'страница ругается в консоль').toEqual([]);
        expect(await открытых(page), 'до открытия стек пуст').toBe(0);

        const кнопка = page.locator('[data-open-contacts]').first();
        await кнопка.click();

        expect(await открытых(page), 'окно заперто домом').toBe(1);
        expect(await page.evaluate(() => document.getElementById('snModal').hidden),
            'окно показано').toBe(false);
        /* ФОКУС УЕХАЛ ВНУТРЬ: первый фокусируемый — закрывашка. */
        expect(await page.evaluate(() => document.activeElement.id), 'фокус внутри окна').toBe('snModalClose');

        /* ВЕТВЬ, КОТОРОЙ У ЭТОГО ОКНА НЕ БЫЛО ВОВСЕ. */
        expect(await подОкно(page), 'фокус поставлен под окно').toBe(true);
        await page.keyboard.press('Tab');
        expect(await фокусВнутри(page, '#snModal'), 'Tab вернул фокус в окно').toBe(true);

        /* Escape ПРИХОДИТ ДОВОДОМ ДОМУ, а снятие — на пути закрытия. ОКНО
           ПРЯЧЕТСЯ АТРИБУТОМ, узел остаётся в документе: признак «узел ушёл»
           дом здесь не выручит, и снятие обязано быть позвано. */
        await page.keyboard.press('Escape');
        expect(await page.evaluate(() => document.getElementById('snModal').hidden),
            'Escape закрыл окно').toBe(true);
        expect(await открытых(page), 'стек опустел').toBe(0);
        expect(await page.evaluate(() => document.activeElement.className),
            'фокус вернулся на кнопку, которой открыли').toContain('sn-btn');
    });

    test('A2 · спрятанное окно не запирает Tab на странице · ' + я.имя, async ({ page }) => {
        await открыть(page, я.спонсоры);
        /* ЗАМЕР 24.10 ДО ПРАВКИ ДОМА: у спрятанного атрибутом окна
           фокусируемого НОЛЬ, дом принимал его за ПУСТОЕ окно — гасил
           нажатие, заводил спрятанному узлу `tabindex="-1"` и звал
           `focus()`. Фокус на спрятанном не ставится, и Tab переставал
           работать НА ВСЕЙ СТРАНИЦЕ. Проверяем, что этого больше нет: окно
           прячем, НЕ дав окну позвать снятие. */
        await page.locator('[data-open-contacts]').first().click();
        expect(await открытых(page), 'окно заперто').toBe(1);
        await page.evaluate(() => { document.getElementById('snModal').hidden = true; });
        await подОкно(page);
        await page.keyboard.press('Tab');
        expect(await открытых(page), 'дом снял запись спрятанного окна сам').toBe(0);
        expect(await page.evaluate(() => document.activeElement.id),
            'и фокус не заперт на спрятанном окне').not.toBe('snModal');
        expect(await page.evaluate(() => document.getElementById('snModal').getAttribute('tabindex')),
            'дом не писал tabindex в спрятанный узел').toBeNull();
    });

    test('B · смотрелка снимков: Tab внутри, стрелки листают, Escape закрывает · ' + я.имя, async ({ page }) => {
        const беды = await открыть(page, я.новости);
        expect(беды, 'страница ругается в консоль').toEqual([]);
        await page.evaluate(т => window.openPhotoViewer([т, т, т], 0), ТОЧКА);

        expect(await открытых(page), 'окно заперто домом').toBe(1);
        expect(await page.evaluate(() => document.activeElement.className),
            'фокус внутри окна').toContain('news-viewer-close');
        /* ДОМ СЧИТАЕТ СКРЫТОЕ ПО ВЫСОТЕ: при одном снимке стрелки прячутся, и
           фокусируемых становится меньше. На трёх снимках их три. */
        expect(await page.evaluate(() =>
            window.KSLT_FOKUS.фокусируемые(document.querySelector('.news-viewer')).length),
            'кнопок в обходе').toBe(3);

        expect(await подОкно(page), 'фокус поставлен под окно').toBe(true);
        await page.keyboard.press('Tab');
        expect(await фокусВнутри(page, '.news-viewer'), 'Tab вернул фокус в окно').toBe(true);

        /* СТРЕЛКИ ОСТАЛИСЬ У ОКНА: листание — не фокус, и дому оно не
           принадлежит. Если бы я унёс в дом и их, проба это заметила бы. */
        await page.keyboard.press('ArrowRight');
        expect(await page.evaluate(() => document.querySelector('.news-viewer-count').textContent),
            'стрелка листает').toBe('2 / 3');

        await page.keyboard.press('Escape');
        expect(await page.evaluate(() => !document.querySelector('.news-viewer')),
            'Escape закрыл окно').toBe(true);
        expect(await открытых(page), 'стек опустел').toBe(0);
        expect(await page.evaluate(() => document.body.style.overflow),
            'страница снова листается').toBe('');
    });

    test('C · окно карты: запирание домом вместо фазы перехвата · ' + я.имя, async ({ page }) => {
        const беды = await открыть(page, я.баттлы);
        expect(беды, 'страница ругается в консоль').toEqual([]);
        /* ПРОБА УПАЛА ЗДЕСЬ 15 РАЗ — НА ВСЕХ ПЯТИ ВИДАХ И ТРЁХ ЯЗЫКАХ, — И
           ВИНОВАТА БЫЛА ПРОБА. Разобрано по следу в `test-results`, а не по
           словам: консоль чиста, клик прошёл, а окно не открылось. Причина в
           продукте законная: `#battlesContent` в разметке ПУСТ, содержимое
           рисует js (`container.innerHTML = html; attachEvents();`) — и
           делегированный слушатель появляется ТОЛЬКО ПОСЛЕ ответа базы.
           Дом же подключён тегом и доступен сразу, поэтому `KSLT_FOKUS` —
           ПЛОХОЙ признак готовности страницы: он проходит моментально.
           ПРИЗНАК ГОТОВНОСТИ — ТОТ, КОТОРЫЙ СТАВИТ ИМЕННО ЭТА ОТРИСОВКА.
           Ждём, пока контейнер перестанет быть пустым. */
        await page.waitForFunction(
            () => { const к = document.getElementById('battlesContent'); return !!к && к.children.length > 0; },
            null, { timeout: 15000 });
        /* РАЗМЕТКА ТА ЖЕ, ЧТО РИСУЕТ ПРОДУКТ, А НАЖАТИЕ — НАСТОЯЩЕЕ: клик в
           `#battlesContent` делегирован, и место баттла в тестовой базе
           пусто. Подделываю ДАННЫЕ, а не код. */
        await page.evaluate(() => {
            const спис = document.getElementById('battlesContent');
            const э = document.createElement('span');
            э.className = 'bo-meta-venue';
            э.dataset.venue = 'Корт КСЛТ, Бишкек';
            э.textContent = 'место';
            спис.appendChild(э);
        });
        await page.locator('.bo-meta-venue').first().click();

        expect(await page.evaluate(() => !!document.getElementById('boMapModal')),
            'окно карты открылось').toBe(true);
        expect(await открытых(page), 'окно заперто домом').toBe(1);
        expect(await page.evaluate(() =>
            window.KSLT_FOKUS.фокусируемые(document.getElementById('boMapModal')).length),
            'две ссылки и отмена').toBe(3);
        expect(await page.evaluate(() => document.activeElement.className),
            'фокус внутри окна').toContain('bo-map-2gis');

        expect(await подОкно(page), 'фокус поставлен под окно').toBe(true);
        await page.keyboard.press('Tab');
        expect(await фокусВнутри(page, '#boMapModal'), 'Tab вернул фокус в окно').toBe(true);

        await page.keyboard.press('Escape');
        expect(await page.evaluate(() => !document.getElementById('boMapModal')),
            'Escape закрыл окно').toBe(true);
        expect(await открытых(page), 'стек опустел').toBe(0);
    });
}

test('D · повторное запирание одного окна не плодит записей в стеке', async ({ page }) => {
    await открыть(page, '/maket/fokus-zamer.html?' + Date.now());
    /* НАШЛОСЬ ЗАМЕРОМ 24.10, А НЕ ЗАМЫСЛОМ: окно, снятое домом по
       невидимости, и показанное снова, запиралось бы ВТОРОЙ записью того же
       корня — и нижняя не снялась бы уже ничем, её корень в документе и
       виден. Стек тёк бы по записи на каждое открытие. */
    expect(await page.evaluate(() => {
        const С = window.СТЕНД;
        С.запереть('окноF');
        const первый = С.открытых();
        С.запереть('окноF');
        const второй = С.открытых();
        С.снять('окноF');
        return { первый, второй, послеСнятия: С.открытых() };
    })).toEqual({ первый: 1, второй: 1, послеСнятия: 0 });
});
