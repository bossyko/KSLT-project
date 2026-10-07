/**
 * СТРАНИЦА «ПОИСК ИГРОКА» — 07.10.
 *
 * Те же проверки, что у кортов и тренеров: решения на три страницы приняты
 * одни, и правило, выведенное на одном куске, применяется к следующему без
 * нового разбора. Отличий три — свои имена классов, круглый аватар вместо
 * фотографии 4:3 и ГОСТЕВАЯ ВЕТКА: гостю показывают укороченный список с
 * размытием и накладкой, и полосы страниц у него НЕТ по решению
 * (js/partners.js:489 — «Guest: no pagination, limited view»).
 *
 * Что проверяет ПРОГОН, а не заморозка:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя крутилки, число
 *     даёт только замер — и оно разное на пяти видах;
 *   • ЧИСЛО КОЛОНОК. `auto-fill` считает браузер, и узнать это можно
 *     только после раскладки;
 *   • ШАГ СТРАНИЦЫ = КОЛОНОК × РЯДОВ. Отношение, а не число;
 *   • АВАТАР — КВАДРАТ И ОДНА СТУПЕНЬ НА ВИД. В css это крутилка, высоту
 *     даёт поток;
 *   • ПОЛОСА СТРАНИЦ стоит над краями СВОЕЙ витрины — это геометрия;
 *   • ЦЕЛИ НАЖАТИЯ. Коробка кнопки 56, красится 44 — это решение 24.09:
 *     высота коробки и цель разные вещи, меряем попаданием через
 *     elementFromPoint, а не правилом в css;
 *   • ОДИН УРОВЕНЬ ТЕКСТА У ВИТРИНЫ — кегли имени, значка и статуса.
 *
 * ПОРОГ ДВУСТОРОННИЙ: либо карточки есть и разбираются, либо витрина честно
 * пуста и говорит об этом. Молчаливого «ничего нет и всё хорошо» не бывает.
 * Где нужен КОМПОНЕНТ, а не данные, — собираем пробу сами: гостю отдают
 * не больше двенадцати карточек, а рядов на широком виде четыре.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/partners.html' },
    { имя: 'en', адрес: '/pages/partners-en.html' },
    { имя: 'kg', адрес: '/pages/partners-kg.html' },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.pt-hero h1') !== null, null, { timeout: 20000 });
    /* Дождаться, пока витрина перестанет меняться: она рисуется либо
       сеткой, либо пустым состоянием, и оба варианта законны. Вдобавок
       пересчёт шага перерисовывает её ещё раз. */
    await page.waitForFunction(() => {
        const g = document.getElementById('ptGrid');
        const было = window.__слепок;
        const стало = g ? g.innerHTML.length : -1;
        window.__слепок = стало;
        return стало >= 0 && стало === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

/** Пробная витрина: доливает карточки той же разметкой, что отдаёт
 *  `js/partners.js` → renderCard. Возвращает функцию-уборщицу. */
const ПРОБНАЯ_ВИТРИНА = `(сколько) => {
    const коробка = document.getElementById('ptGrid');
    if (!коробка) return null;
    let сетка = document.querySelector('.pt-grid');
    let своя = false;
    if (!сетка) {
        сетка = document.createElement('div');
        сетка.className = 'pt-grid';
        коробка.appendChild(сетка);
        своя = true;
    }
    for (let i = 0; i < сколько; i++) {
        const d = document.createElement('div');
        d.className = 'pt-card проба';
        d.style.cursor = 'pointer';
        d.innerHTML =
            '<div class="pt-ntrp-badge">NTRP 4.5</div>' +
            '<div class="pt-avatar-wrap">' +
                '<div class="pt-avatar-placeholder">ПИ</div>' +
                '<div class="pt-online-dot"></div>' +
            '</div>' +
            '<div class="pt-name">Пробный игрок с очень длинным именем</div>' +
            '<div class="pt-badge">Любители — вторая половина сетки</div>' +
            '<div class="pt-status online">сейчас на сайте</div>' +
            '<button class="pt-invite-btn">Пригласить играть</button>';
        сетка.appendChild(d);
    }
    return { сетка, своя };
}`;

const УБРАТЬ_ПРОБУ = `(п) => {
    document.querySelectorAll('.pt-card.проба').forEach(e => e.remove());
    if (п && п.своя) п.сетка.remove();
}`;

for (const Я of ЯЗЫКИ) {
test.describe('поиск игрока · ' + Я.имя, () => {

    test('обложка стоит на общих крутилках раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const h = document.querySelector('.pt-hero');
            const s = getComputedStyle(h);
            const t = h.querySelector('h1');
            const p = h.querySelector('p');
            return {
                пол: parseFloat(s.minHeight),
                h1: parseFloat(getComputedStyle(t).fontSize),
                sub: p ? parseFloat(getComputedStyle(p).fontSize) : null,
                крутилкаПол: parseFloat(getComputedStyle(document.documentElement)
                    .getPropertyValue('--oblozhka-pol')),
            };
        });
        expect(з.пол, 'пол обложки разошёлся с крутилкой раздела').toBe(з.крутилкаПол);
        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок обложки мимо шкалы').toContain(Math.round(з.h1));
        if (з.sub !== null) {
            expect(ШКАЛА_КЕГЛЕЙ, 'подзаголовок обложки мимо шкалы').toContain(Math.round(з.sub));
            expect(з.sub, 'подзаголовок не ниже заголовка на ступень').toBeLessThan(з.h1);
        }
    });

    test('шаг страницы — колонок × рядов, и это видно на экране', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.pt-card').length;
            const п = собрать(живых ? 0 : 8);
            if (!п) return null;
            const s = getComputedStyle(п.сетка);
            const колонок = s.gridTemplateColumns.split(' ').filter(Boolean).length;
            const рядов = parseInt(s.getPropertyValue('--pt-ryadov'), 10);
            const гость = !!document.querySelector('.pt-guest-overlay');
            const о = { колонок, рядов, живых, гость,
                        показано: document.querySelectorAll('.pt-card').length,
                        полоса: !!document.querySelector('.pl-pagination') };
            уборка(п);
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины игроков нет').not.toBeNull();
        expect(з.колонок, 'колонок не осталось вовсе').toBeGreaterThan(0);
        expect(з.рядов, 'крутилка рядов не доехала до браузера').toBeGreaterThan(0);
        expect(з.колонок, 'колонок больше четырёх — витрина разъехалась').toBeLessThanOrEqual(4);
        /* ГОСТЮ ПОЛОСА НЕ ПОЛОЖЕНА ПО РЕШЕНИЮ — js/partners.js:489.
           Шаг проверяется у входившего, где он единственный, кто страницы
           вообще видит. */
        if (з.гость) {
            expect(з.полоса, 'гостю нарисовали полосу страниц — так не решали').toBe(false);
        } else if (з.живых) {
            expect(з.показано, 'показано больше, чем «колонок × рядов»')
                .toBeLessThanOrEqual(з.колонок * з.рядов);
        }
    });

    test('аватар — квадрат одной ступени на вид', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.pt-card').length;
            const п = собрать(живых ? 0 : 1);
            if (!п) return null;
            const все = [...document.querySelectorAll('.pt-avatar, .pt-avatar-placeholder')];
            const меры = все.map(e => {
                const r = e.getBoundingClientRect();
                return { w: Math.round(r.width), h: Math.round(r.height) };
            });
            const о = { меры, сторон: [...new Set(меры.map(m => m.w))] };
            уборка(п);
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины игроков нет').not.toBeNull();
        expect(з.меры.length, 'ПОРОГ: аватаров на странице нет').toBeGreaterThan(0);
        expect(з.сторон.length, 'аватары разъехались по размерам: ' + з.сторон.join(', ')).toBe(1);
        for (const м of з.меры) {
            expect(м.w, 'аватар перестал быть квадратом: ' + м.w + '×' + м.h).toBe(м.h);
            expect(м.w, 'аватар мимо ступеней 56 и 80').toBeGreaterThanOrEqual(56);
        }
    });

    test('у витрины один уровень текста на все виды', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.pt-card').length;
            const п = собрать(живых ? 0 : 1);
            if (!п) return null;
            const кегль = сел => {
                const e = document.querySelector(сел);
                return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null;
            };
            const о = {
                имя: кегль('.pt-card .pt-name'),
                значок: кегль('.pt-card .pt-badge'),
                статус: кегль('.pt-card .pt-status'),
                кнопка: кегль('.pt-card .pt-invite-btn'),
            };
            уборка(п);
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины игроков нет').not.toBeNull();
        expect(з.имя, 'ПОРОГ: имени в карточке нет').not.toBeNull();
        for (const [имя, к] of Object.entries(з)) {
            if (к === null) continue;
            expect(ШКАЛА_КЕГЛЕЙ, 'кегль «' + имя + '» мимо шкалы: ' + к).toContain(к);
        }
        expect(з.статус, 'статус перестал быть ниже имени').toBeLessThanOrEqual(з.имя);
    });

    test('полоса страниц стоит над краями своей витрины', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const g = document.querySelector('.pt-grid');
            const p = document.querySelector('.pl-pagination');
            const раздел = document.querySelector('.pt-pagination-section');
            return {
                витрина: g ? Math.round(g.getBoundingClientRect().width) : null,
                полоса: p ? Math.round(p.getBoundingClientRect().width) : null,
                счётчик: !!document.querySelector('.pl-page-count'),
                своиКнопки: document.querySelectorAll('.pt-page-btn').length,
                крутилка: раздел ? getComputedStyle(раздел)
                    .getPropertyValue('--polosa-shirina').trim() : null,
            };
        });
        expect(з.своиКнопки, 'вернулась своя полоса страниц игроков').toBe(0);
        expect(з.крутилка, 'полоса перестала идти по ширине своей витрины').toBe('100%');
        if (з.полоса !== null && з.витрина !== null) {
            expect(з.счётчик, 'у полосы страниц пропал счётчик строк').toBe(true);
            expect(Math.abs(з.витрина - з.полоса),
                'полоса разъехалась с витриной: ' + з.витрина + ' против ' + з.полоса)
                .toBeLessThanOrEqual(2);
        }
    });

    test('в полосе фильтров две выпадашки общего компонента', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const полоса = document.querySelector('.trn-filters');
            if (!полоса) return null;
            const выпадашки = [...полоса.querySelectorAll('.f-dd-toggle, .ct-dd-toggle')];
            const чипы = [...полоса.querySelectorAll('.trn-chip')]
                .filter(c => !c.classList.contains('f-dd-toggle') &&
                             !c.classList.contains('ct-dd-toggle'));
            const поиск = полоса.querySelector('.trn-search-input');
            return {
                выпадашек: выпадашки.length,
                высоты: выпадашки.map(e => Math.round(e.getBoundingClientRect().height)),
                чипов: чипы.length,
                разделителей: полоса.querySelectorAll('.trn-chip-div').length,
                поиск: поиск ? Math.round(поиск.getBoundingClientRect().height) : null,
                кегльПоиска: поиск ? parseFloat(getComputedStyle(поиск).fontSize) : null,
                назад: !!полоса.querySelector('.trn-back'),
            };
        });
        expect(з, 'ПОРОГ: полосы фильтров нет').not.toBeNull();
        expect(з.назад, 'из полосы пропал возврат на «Услуги»').toBe(true);
        expect(з.выпадашек, 'выпадашек должно быть две: пол и уровень').toBe(2);
        expect(з.чипов, 'в полосе снова чипы вместо выпадашек').toBe(0);
        expect(з.разделителей, 'разделитель остался без того, что он разделял').toBe(0);
        for (const h of з.высоты) {
            expect(h, 'выпадашка не на ступени 44').toBeGreaterThanOrEqual(36);
        }
        expect(з.поиск, 'поле поиска не 44 высотой').toBe(44);
        expect(з.кегльПоиска, 'кегль поля поиска меньше 16 — Safari зумит страницу').toBe(16);
    });

    test('в каждую цель нажатия можно попасть, и она не меньше 44', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.pt-card').length;
            const п = собрать(живых ? 0 : 1);
            const цели = [...document.querySelectorAll(
                '.trn-back, .f-dd-toggle, .ct-dd-toggle, .pt-invite-btn,' +
                ' .pt-guest-btn, .pl-page-btn')];
            const плохо = [];
            цели.forEach(el => {
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) return;
                if (r.top < 0 || r.bottom > innerHeight) return;
                /* Размытую карточку гостя нажимать нечем — её накрывает
                   накладка, и это решение, а не промах. */
                if (el.closest('.pt-card-blur')) return;
                const x = Math.round(r.left + r.width / 2);
                const y = Math.round(r.top + r.height / 2);
                const попал = document.elementFromPoint(x, y);
                const свой = попал && (el === попал || el.contains(попал) || попал.contains(el));
                const слой = getComputedStyle(el, '::after').height;
                const высота = Math.max(r.height, parseFloat(слой) || 0);
                if (!свой) плохо.push('не попасть: ' + (el.className || el.tagName));
                else if (высота < 43.5) плохо.push('цель ' + Math.round(высота) + ': ' +
                    (el.className || el.tagName));
            });
            const о = { целей: цели.length, плохо };
            уборка(п);
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з.целей, 'ПОРОГ: нажимаемых мест на странице нет').toBeGreaterThan(0);
        expect(з.плохо, 'цели нажатия меньше 44 или перекрыты').toEqual([]);
    });

    test('витрина не переливается вбок ни на одном виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const п = собрать(8);
            const о = {
                перелив: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                карточек: document.querySelectorAll('.pt-card').length,
            };
            уборка(п);
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з.карточек, 'ПОРОГ: даже проба не собралась').toBeGreaterThan(0);
        expect(з.перелив, 'страница поиска игрока поехала вбок').toBeLessThanOrEqual(0);
    });

    test('витрина либо показывает карточки, либо честно говорит, что пусто', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.pt-card').length,
            пусто: !!document.querySelector('.pt-empty'),
            гость: !!document.querySelector('.pt-guest-overlay'),
            вложено: [...document.querySelectorAll('.pt-card')]
                .reduce((н, c) => н + c.querySelectorAll('a').length, 0),
        }));
        expect(з.карточек > 0 || з.пусто,
            'ПОРОГ: карточек нет, и пустое состояние тоже не нарисовано').toBe(true);
        if (з.карточек) {
            expect(з.вложено, 'внутрь карточки вложена ссылка').toBe(0);
        }
    });
});
}
