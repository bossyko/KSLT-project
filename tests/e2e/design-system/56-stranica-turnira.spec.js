/**
 * СТРАНИЦА ТУРНИРА — ВКЛАДКИ, ШАПКИ ТАБЛИЦ И ПУСТОЕ СОСТОЯНИЕ.
 *
 * Три пункта списка Кости от 04.10, закрытые в тот же день:
 *   • шесть вкладок были по 35 при норме 44 — и это главная навигация;
 *   • шапка таблицы группы давала контраст 3.21 при норме 4.5;
 *   • ненайденный турнир показывал шесть пустых заголовков разделов и
 *     предлагал ВОЙТИ — человеку, у которого просто устарела ссылка.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • ДОХОДИТ ЛИ НАЖАТИЕ. Высота коробки и цель нажатия — разные вещи:
 *     04.10 слой 44 стоял, а нажатие в него не попадало, потому что лента
 *     вкладок обрезала его своим overflow. Меряем elementFromPoint, а не
 *     высоту;
 *   • КОНТРАСТ С УЧЁТОМ НАЛОЖЕНИЯ. Краска полупрозрачная, и её отношение
 *     зависит от того, что лежит под ней;
 *   • ЧТО ОСТАЛОСЬ НА ЭКРАНЕ, когда данных нет.
 *
 * Экран «турнир не найден» показывается ВОШЕДШЕМУ: отличить «нет такого
 * турнира» от «нет доступа» по ответу базы нельзя — RLS прячет строку тем же
 * нулём строк. Прогон идёт гостем, поэтому ветку выбора доказывают правило
 * заморозки и чтение, а ВИД экрана проверяется здесь прямым вызовом.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', файл: 'tournament.html', ненайден: 'Турнир не найден', назад: 'Назад к турнирам' },
    { имя: 'en', файл: 'tournament-en.html', ненайден: 'Tournament not found', назад: 'Back to Tournaments' },
    { имя: 'kg', файл: 'tournament-kg.html', ненайден: 'Мелдеш табылган жок', назад: 'Мелдештерге кайтуу' },
];

const НЕТ_ТАКОГО = '00000000-0000-0000-0000-000000000000';

/** Контраст с наложением полупрозрачной краски на непрозрачную подложку. */
const КОНТРАСТ = `(() => {
    const L = c => { const [r,g,b] = c.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r + 0.7152*g + 0.0722*b; };
    const parse = s => { const m = (s.match(/[\\d.]+/g) || [0,0,0]).map(Number); return { rgb: m.slice(0,3), a: m.length > 3 ? m[3] : 1 }; };
    const фон = n => { let e = n; while (e && e !== document.documentElement) { const b = parse(getComputedStyle(e).backgroundColor); if (b.a > 0.9) return b.rgb; e = e.parentElement; } return [10,10,10]; };
    return n => { const f = parse(getComputedStyle(n).color), bg = фон(n); const sm = f.rgb.map((v,i) => v*f.a + bg[i]*(1-f.a)); const l1 = L(sm), l2 = L(bg); return Math.round(((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05))*100)/100; };
})()`;

async function открытьТурнир(page, файл, id) {
    await page.goto('/pages/' + файл + '?id=' + id);
    // Признак, а не тишина сети: обложка с заголовком нарисована
    await page.waitForFunction(
        () => { const t = document.querySelector('.td-hero h1'); return t && t.getBoundingClientRect().height > 0; },
        null, { timeout: 20000 });
}

for (const Я of ЯЗЫКИ) {

test.describe('страница турнира · ' + Я.имя, () => {

    /* ══ ПУСТОЕ СОСТОЯНИЕ ════════════════════════════════════════════════ */

    test('у ненайденного турнира не остаётся пустых заголовков разделов', async ({ page }) => {
        await открытьТурнир(page, Я.файл, НЕТ_ТАКОГО);
        const з = await page.evaluate(() => {
            const видимых = с => Array.from(document.querySelectorAll(с))
                .filter(n => n.getBoundingClientRect().height > 0).length;
            const бар = document.getElementById('tabsBar');
            return {
                заголовковРазделов: видимых('.td-section-header'),
                разделов: видимых('main > .td-section'),
                вкладкиВидны: !!бар && getComputedStyle(бар).display !== 'none',
            };
        });
        expect(з.заголовковРазделов,
            'было шесть: Описание · Место · Участники · Сетка · Расписание · Очки').toBe(0);
        expect(з.разделов).toBe(0);
        expect(з.вкладкиВидны).toBe(false);
    });

    test('экран «турнир не найден» говорит словами и даёт дорогу назад', async ({ page }) => {
        await открытьТурнир(page, Я.файл, НЕТ_ТАКОГО);
        const з = await page.evaluate(() => {
            if (typeof renderNotFoundPage !== 'function') return { нетФункции: true };
            renderNotFoundPage();
            const назад = document.querySelector('.td-notfound-back');
            return {
                заголовок: (document.querySelector('.td-hero h1') || {}).textContent || '',
                подпись: (document.querySelector('.td-locked-subtitle') || {}).textContent || '',
                назад: назад ? (назад.textContent || '').trim() : null,
                кнопкаВхода: !!document.querySelector('.td-locked-btn'),
                инлайновВГерое: document.querySelectorAll('.td-hero [style]').length,
                титул: document.title,
                перелив: document.documentElement.scrollWidth - window.innerWidth,
            };
        });
        expect(з.нетФункции, 'функция renderNotFoundPage должна существовать').toBeFalsy();
        expect(з.заголовок.trim()).toBe(Я.ненайден);
        expect(з.подпись.trim().length, 'подпись объясняет, почему пусто').toBeGreaterThan(10);
        expect(з.назад).toBe(Я.назад);
        expect(з.кнопкаВхода, 'человек уже вошёл — звать его войти значит врать о причине').toBe(false);
        expect(з.инлайновВГерое, 'отступы ступенями, а не числом в атрибуте style').toBe(0);
        expect(з.титул, 'титул в порядке страницы: «КСЛТ — X»').toContain(Я.ненайден);
        if (Я.имя !== 'ru') expect(з.титул, 'на нерусской странице латиница').toContain('KSLT');
        expect(з.перелив).toBe(0);
    });

});

}

/* ══ ВКЛАДКИ И ШАПКИ — на одном языке: это геометрия и краска ═════════════ */

test.describe('страница турнира · вкладки и шапки', () => {

    test('нажатие доходит до верхнего и нижнего края вкладки', async ({ page }) => {
        await открытьТурнир(page, 'tournament.html', 'test-metka');
        // Полоса липкая: меряем то, что на экране, а не то, что в разметке
        await page.evaluate(() => {
            const b = document.querySelector('.td-tabs-bar');
            if (b) b.scrollIntoView({ block: 'center' });
        });
        await page.waitForTimeout(300);

        const з = await page.evaluate(() => {
            const вкладки = Array.from(document.querySelectorAll('.td-tab'))
                .filter(n => n.getBoundingClientRect().height > 0);
            const своя = (э, t) => !!(э && (э === t || t.contains(э)));
            const пробы = вкладки.map(t => {
                const r = t.getBoundingClientRect();
                const x = Math.round(r.left + r.width / 2);
                // только те, что целиком в окне: лента прокручивается вбок
                const вОкне = r.left >= 0 && r.right <= window.innerWidth;
                return {
                    в: Math.round(r.height), вОкне,
                    верх: своя(document.elementFromPoint(x, Math.round(r.top + 2)), t),
                    низ: своя(document.elementFromPoint(x, Math.round(r.bottom - 2)), t),
                };
            });
            return { вкладок: вкладки.length, пробы, бар: Math.round(document.querySelector('.td-tabs-bar').getBoundingClientRect().height) };
        });

        expect(з.вкладок, 'вкладки должны быть нарисованы').toBeGreaterThan(0);
        for (const п of з.пробы) {
            expect(п.в, 'цель нажатия у вкладки — ступень кнопки').toBeGreaterThanOrEqual(44);
        }
        expect(з.бар, 'полоса не ниже цели, которую несёт').toBeGreaterThanOrEqual(44);
        for (const п of з.пробы.filter(x => x.вОкне)) {
            expect(п.верх, 'нажатие доходит до верхнего края: слой, обрезанный overflow, не считается').toBe(true);
            expect(п.низ, 'нажатие доходит до нижнего края').toBe(true);
        }
    });

    test('межстрочный вкладки задан ступенью, а не метриками шрифта', async ({ page }) => {
        await открытьТурнир(page, 'tournament.html', 'test-metka');
        const м = await page.evaluate(() => {
            const t = Array.from(document.querySelectorAll('.td-tab')).find(n => n.getBoundingClientRect().height > 0);
            return t ? getComputedStyle(t).lineHeight : null;
        });
        expect(м, '`normal` считается от шрифта — у разных людей своё число').not.toBe('normal');
    });

    test('шапки таблиц проходят WCAG AA', async ({ page }) => {
        await открытьТурнир(page, 'tournament.html', 'test-metka');
        await page.waitForTimeout(1500);
        const з = await page.evaluate((выр) => {
            const контраст = eval(выр);
            return ['.td-group-table thead th', '.td-rr-table thead th', '.td-reg-table thead th', '.td-sched-table th']
                .map(с => {
                    const n = Array.from(document.querySelectorAll(с)).find(x => x.getBoundingClientRect().height > 0);
                    return { шапка: с, контраст: n ? контраст(n) : null };
                });
        }, КОНТРАСТ);

        const нарисованные = з.filter(x => x.контраст !== null);
        expect(нарисованные.length, 'хотя бы одна шапка должна быть на экране').toBeGreaterThan(0);
        for (const ш of нарисованные) {
            expect(ш.контраст, ш.шапка + ' — было 3.21 на --text-dim').toBeGreaterThanOrEqual(4.5);
        }
    });

});
