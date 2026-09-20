// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * ЦЕЛИ НАЖАТИЯ В ШАПКЕ — снимок, а не приговор.
 *
 * Прибор, как и 20-header-offsets: ничего не утверждает, записывает размеры.
 * Норму выбирает Костя, глядя на макеты, а не проверка на своё усмотрение.
 *
 * ЧТО ВЫЯСНИЛОСЬ ЗАМЕРОМ 20.09 И ПРОТИВОРЕЧИТ ЗАМЫСЛУ НИЖЕ:
 *   1) разделы работают ГАРМОШКОЙ — раскрытие одного закрывает соседний,
 *      поэтому «раскрыть все» невозможно в принципе: открытым остаётся
 *      последний нажатый (в снимке это «Инфо», остальные четыре закрыты);
 *   2) на замер высот это не влияет: свёрнутый список — это max-height: 0
 *      с overflow: hidden, а не display: none, поэтому вложенные ссылки
 *      продолжают занимать место и меряются все сорок одна. Отсев 0 из 41
 *      теперь виден в самом снимке — не на слово;
 *   3) тумблер раздела — НАСТОЯЩАЯ ССЫЛКА, и нажатие уводит со страницы.
 *      На tablet ушло на третьем шаге. Раньше это проглатывалось в catch и
 *      остаток замера тихо снимался с чужой страницы.
 *
 * ИСХОДНЫЙ ЗАМЫСЕЛ — БУРГЕР РАСКРЫВАЕТСЯ ЦЕЛИКОМ.
 * Перепись 19.09 насчитала в бургер-меню шесть строк и все по 48 — норма.
 * На деле их 41, и 35 ниже нормы: тридцать два элемента прячутся внутри
 * свёрнутых разделов, и на экране их просто не было. «Не вижу» записали как
 * «нет» — та же ошибка, что с переключателем языка (f34). Поэтому здесь
 * сначала открывается бургер, потом раскрываются ВСЕ разделы, и только
 * потом снимаются размеры.
 *
 * Норма для справки: 44x44 — Apple HIG и WCAG 2.5.5 (AAA).
 * Минимум WCAG 2.5.8 (AA) — 24x24, и там есть исключение по расстоянию,
 * которое надо считать отдельно, а не объявлять на глаз.
 *
 * Запуск:
 *   npx playwright test tests/e2e/design-system/21-header-tap-targets.spec.js
 * Результат: tests/reports/header-taps/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'header-taps');
const ИНТЕРАКТИВНЫЕ = 'a, button, [role="button"], input, select, summary';

function метка() {
    try {
        return fs.readFileSync(path.join(__dirname, '..', '..', 'reports', '.run-id'), 'utf8').trim();
    } catch (e) { return ''; }
}

async function снять(page, где) {
    return page.evaluate(({ сел, где }) => {
        const корень = document.querySelector(где);
        if (!корень) return { нет: где, итог: [], отсев: null };
        const окр = v => Math.round(v * 10) / 10;
        const итог = [];
        // ОТСЕВ СЧИТАЕМ ПОИМЁННО.
        // 20.09 прибор вернул одну ссылку из сорока двух, и объяснить это по
        // исходникам не вышло: «ничего не нашлось» и «всё отбраковано» с виду
        // одинаковы. Пока прибор молчит о причине отсева, любой его результат
        // недоказуем. Поэтому он теперь называет, сколько и за что выбросил.
        const отсев = { всего: 0, нулевойРазмер: 0, скрытСтилем: 0 };
        for (const el of корень.querySelectorAll(сел)) {
            отсев.всего++;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) { отсев.нулевойРазмер++; continue; }
            const c = getComputedStyle(el);
            if (c.visibility === 'hidden' || c.display === 'none') { отсев.скрытСтилем++; continue; }
            const кл = (el.className && typeof el.className === 'string')
                ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
            итог.push({
                ключ: (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + кл).slice(0, 60),
                текст: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24),
                ш: окр(r.width), в: окр(r.height),
                // Кегль и вес мерим здесь же. 19.09 они были записаны с живой
                // страницы (14.4 и 450), а в исходниках сегодня стоит 0.875rem
                // и 500. Откуда бралось расхождение — по коду не видно, и
                // писать правку на числа годичной свежести нельзя.
                кегль: окр(parseFloat(c.fontSize)),
                вес: c.fontWeight,
                отступы: c.padding,
                строка: c.lineHeight
            });
        }
        return { итог, отсев };
    }, { сел: ИНТЕРАКТИВНЫЕ, где });
}

test.describe('Цели нажатия в шапке', () => {
    test('снимок размеров', async ({ page }, info) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);

        const адресДо = page.url();
        const шапкаСнимок = await снять(page, '.floating-header');
        const шапка = шапкаСнимок.итог;

        // --- бургер ---
        let бургерСнимок = { итог: [], отсев: null };
        let разделов = 0;
        let ушлиСоСтраницы = [];
        const кнопка = page.locator('#burgerMenu');
        const бургерЕсть = await кнопка.isVisible().catch(() => false);
        if (бургерЕсть) {
            await кнопка.click();
            await page.waitForTimeout(400);
            // Раскрыть ВСЕ свёрнутые разделы — иначе увидим шесть строк из сорока одной
            //
            // ОСТОРОЖНО: тумблер раздела — это НАСТОЯЩАЯ ССЫЛКА (<a href>), а не
            // кнопка. Нажатие force:true может увести со страницы, и тогда всё
            // дальнейшее меряется уже на другой странице с закрытым меню — молча,
            // потому что ошибка проглатывалась в .catch(). Теперь после каждого
            // нажатия сверяем адрес и, если ушли, возвращаемся и открываем заново.
            const тумблеры = page.locator('#mobileNav .mobile-dropdown-toggle');
            разделов = await тумблеры.count();
            for (let i = 0; i < разделов; i++) {
                await тумблеры.nth(i).click({ force: true }).catch(() => {});
                await page.waitForTimeout(120);
                if (page.url() !== адресДо) {
                    ушлиСоСтраницы.push({ шаг: i, куда: page.url() });
                    await page.goto('/');
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForTimeout(400);
                    await page.locator('#burgerMenu').click().catch(() => {});
                    await page.waitForTimeout(300);
                }
            }
            await page.waitForTimeout(300);
            бургерСнимок = await снять(page, '#mobileNav');
        }
        const бургер = бургерСнимок.итог;

        // --- состояние панели своими словами ---
        const состояние = await page.evaluate(() => {
            const нав = document.querySelector('#mobileNav');
            if (!нав) return { нет: true };
            const c = getComputedStyle(нав);
            const разделы = [...нав.querySelectorAll('.mobile-nav-dropdown')].map(d => ({
                имя: (d.querySelector('.mobile-dropdown-toggle')?.textContent || '').trim().slice(0, 16),
                раскрыт: d.classList.contains('active'),
                высотаСписка: Math.round(d.querySelector('.mobile-dropdown-menu')?.getBoundingClientRect().height || 0),
                ссылок: d.querySelectorAll('.mobile-dropdown-menu li a').length
            }));
            return {
                классы: нав.className,
                display: c.display, visibility: c.visibility, opacity: c.opacity,
                высотаПанели: Math.round(нав.getBoundingClientRect().height),
                ссылокВсего: нав.querySelectorAll('a').length,
                разделы
            };
        });

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(
            path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify({
                прогон: метка(),
                проект: info.project.name,
                окно: page.viewportSize(),
                бургерПоказан: бургерЕсть,
                разделовНайдено: разделов,
                ушлиСоСтраницы,
                адрес: page.url(),
                отсевШапки: шапкаСнимок.отсев,
                отсевБургера: бургерСнимок.отсев,
                состояние,
                шапка,
                бургер
            }, null, 2) + '\n', 'utf8');
    });
});
