// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-OCHKI: экран рейтинговых очков — по МЕСТАМ, а не по раундам.
 *
 * До 03.10 экран правил `points_rules` (очки по стадиям), а начисление
 * читает `points_by_place` (очки за место): правка на экране ни на что не
 * влияла. Здесь проверяется, что экран показывает места, уважает предел
 * уровня и не даёт поправить число незаметно.
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ, ТЕЛЕФОНА У НЕЁ НЕТ, ТОЛЬКО РУССКИЙ.
 * Поэтому виды `mobile` и `phone-landscape` пропускаются целиком, а не
 * «проверяются мягче».
 *
 * ТЕСТ ЖДЁТ ПРИЗНАКИ, А НЕ ТИШИНУ СЕТИ: каждая проверка ждёт появления
 * конкретного узла или числа, ни одна не спит по таймеру.
 *
 * КНОПКУ, КОТОРАЯ ПИШЕТ В БАЗУ, НЕ НАЖИМАЕМ. Крестик удаления уровня и
 * «Сохранить» здесь только ищутся глазами теста: порог у крестика разобран
 * чтением кода и заморожен правилами (`tools/check-ochki-i-ligi.js`), а
 * проверять его нажатием значило бы рискнуть уровнем в тестовой базе.
 */

test.use({ storageState: require('../../auth-setup').adminState });

test.describe('Экран очков', () => {
    test.skip(({}, info) => /mobile|phone/.test(info.project.name),
        'админка: десктоп и планшет, телефона нет');

    test.beforeEach(async ({ page }) => {
        await page.goto('/pages/admin.html#settings', { waitUntil: 'domcontentloaded' });
        // Ждём ПРИЗНАК — первую строку таблицы мест, а не загрузку страницы
        await page.waitForSelector('#setRulesTable tbody tr .ad-pts-in', { timeout: 20000 });
    });

    test('колонки идут от старшей категории к младшей', async ({ page }) => {
        const имена = await page.$$eval('#setRulesTable thead th span:first-child',
            узлы => узлы.map(у => у.textContent.trim()));
        expect(имена).toEqual([
            'Высшая категория', '1 категория', '2 категория', '3 категория', 'Итоговый турнир'
        ]);
    });

    test('у итогового восемь мест, у остальных шестьдесят четыре', async ({ page }) => {
        // 4 × 64 + 8 = 264 поля и 56 прочерков — то же, что в базе
        await expect(page.locator('#setRulesTable .ad-pts-in')).toHaveCount(264);
        await expect(page.locator('#setRulesTable .ad-pts-off')).toHaveCount(56);

        // Прочерки стоят ТОЛЬКО в последней колонке
        const чужие = await page.$$eval('#setRulesTable .ad-pts-off',
            узлы => узлы.filter(у => у.closest('td').cellIndex !== 5).length);
        expect(чужие).toBe(0);
    });

    test('предел подписан одним числом, без «до»', async ({ page }) => {
        const предел = page.locator('#setRulesTable .ad-pts-limit');
        await expect(предел).toHaveCount(1);
        await expect(предел).toHaveText('8');
    });

    test('первое место видно сразу: прокрутки внутри прокрутки нет', async ({ page }) => {
        const первое = page.locator('#setRulesTable tbody tr').first();
        await expect(первое.locator('.ad-pts-place')).toHaveText('1');

        const своих = await page.$$eval('.ad-pts-scroll, .ad-table-card', узлы =>
            узлы.filter(у => {
                const s = getComputedStyle(у);
                return (s.overflowY === 'auto' || s.overflowY === 'scroll')
                    && у.scrollHeight > у.clientHeight + 1;
            }).length);
        expect(своих, 'у карточки не должно быть своего окна прокрутки').toBe(0);
    });

    test('шапка липнет к шапке сайта', async ({ page }) => {
        const шапка = page.locator('#setRulesTable thead th').first();
        const ст = await шапка.evaluate(э => {
            const s = getComputedStyle(э);
            return { position: s.position, top: s.top };
        });
        expect(ст.position).toBe('sticky');
        // --header-h: 64 на десктопе, 56 на узком. Важно ОТНОШЕНИЕ: не ноль
        expect(parseInt(ст.top, 10)).toBeGreaterThan(0);
    });

    test('поле очков без стрелок, и колесо его не меняет', async ({ page }) => {
        const поле = page.locator('#setRulesTable .ad-pts-in').first();
        await expect(поле).toHaveJSProperty('type', 'number');
        const вид = await поле.evaluate(э => getComputedStyle(э).appearance);
        expect(['textfield', 'none']).toContain(вид);

        const было = await поле.inputValue();
        await поле.focus();
        await поле.hover();
        await page.mouse.wheel(0, -240);
        await expect(поле).toHaveValue(было);   // ждём признак, а не таймер
    });

    test('плашка на месте, переключателя нет', async ({ page }) => {
        await expect(page.locator('.ad-pts-band-text')).toContainText('двумя способами');
        await expect(page.locator('[data-ptstab]')).toHaveCount(0);
    });

    test('версия в силе названа в шапке', async ({ page }) => {
        await expect(page.locator('.ad-pts-ver')).toContainText('2021-01-01');
        await expect(page.locator('.ad-pts-ver')).toContainText('25');
        await expect(page.locator('.ad-pts-ver')).toContainText('10');
    });

    test('первые четыре места отбиты от остальных', async ({ page }) => {
        await expect(page.locator('#setRulesTable tr.ad-pts-tbl')).toHaveCount(4);
        await expect(page.locator('#setRulesTable tr.ad-pts-sep')).toHaveCount(1);
    });

    test('у администратора есть обе кнопки, и они не нажимаются тестом', async ({ page }) => {
        await expect(page.locator('#setSaveRulesBtn')).toBeVisible();
        await expect(page.locator('#setAddLevelBtn')).toBeVisible();
        await expect(page.locator('.set-del-level')).toHaveCount(5);
    });

    test('горизонтальной прокрутки страницы нет', async ({ page }) => {
        const шире = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(шире).toBe(false);
    });
});
