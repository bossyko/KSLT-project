// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-UVED-DOM: настройки уведомлений — экран не расходится с сервером
 * (кусок A2.3).
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Сторож читает файлы как текст:
 * он видит, что имена каналов в доме совпадают с теми, что спрашивает
 * серверный код, и не видит, доехал ли дом до страницы и что отдаёт
 * живое правило. Это работа прогона.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ: ни один ползунок не нажимается. Правило и списки
 * спрашиваются у живого дома напрямую.
 *
 * ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ — ТРИ БЕДЫ, ЖИВШИЕ В ПРОДУКТЕ:
 *   1. на сайте был канал `site`, которого не спрашивает ни одна из
 *      шестнадцати серверных функций: человек выключал — и ничего не
 *      менялось;
 *   2. разделов на экране было четыре против шести серверных —
 *      `security` (письма о входе с нового устройства) и `general`
 *      нельзя было выключить вовсе;
 *   3. приложение писало в таблицу `notification_preferences`, которой
 *      в базе нет ни в одной схеме, своими именами каналов и разделов.
 *
 * ПРАВИЛО СВЕРЯЕТСЯ С СЕРВЕРНЫМ: `shouldNotify` переписан здесь знак в
 * знак с `supabase/functions/<функция>/index.ts` и прогоняется по всей решётке
 * случаев. Разойдись дом — экран показывал бы одно, а сервер делал
 * другое, и прав всегда сервер.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/dashboard.html' },
    { язык: 'en', адрес: '/pages/dashboard-en.html' },
    { язык: 'kg', адрес: '/pages/dashboard-kg.html' }
];

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождатьсяДома(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    try {
        await page.waitForFunction(
            () => window.KSLT_UVEDOMLENIYA &&
                  typeof window.KSLT_UVEDOMLENIYA.включено === 'function',
            null, { timeout: 20000 });
    } catch (e) {
        throw new Error('дом уведомлений не объявился на ' + адрес +
            ' · ошибки страницы: ' + (ошибки.length ? ошибки.join(' | ') : 'нет'));
    }
    return ошибки;
}

function снятьДом(page) {
    return page.evaluate(() => {
        const U = window.KSLT_UVEDOMLENIYA;

        /* ПРАВИЛО СЕРВЕРА, переписанное знак в знак из
           `supabase/functions/<функция>/index.ts` (`shouldNotify`). */
        const серверное = (prefs, channel, cat) => {
            if (!prefs) return true;
            const ch = prefs[channel];
            if (!ch) return true;
            return ch[cat] !== false;
        };

        const настройки = [null, undefined, {}, { tg: {} },
            { tg: { matches: false } }, { tg: { matches: true } },
            { email: { general: false } },
            { tg: { matches: false }, email: { matches: true } },
            { site: { matches: false } }];
        const каналы = ['tg', 'email', 'site'];
        const разделы = ['tournaments', 'challenges', 'membership', 'matches',
                         'security', 'general', 'чужой'];

        const расхождения = [];
        let сверено = 0;
        for (const н of настройки) {
            for (const к of каналы) {
                for (const р of разделы) {
                    сверено++;
                    if (U.включено(н, к, р) !== серверное(н, к, р)) {
                        расхождения.push(JSON.stringify(н) + ' ' + к + '/' + р);
                    }
                }
            }
        }

        /* `переключить` не должен трогать то, что ему дали. */
        const было = { tg: { matches: false }, email: { general: false } };
        const слепок = JSON.stringify(было);
        const стало = U.переключить(было, 'tg', 'matches', true);

        return {
            каналы: U.КАНАЛЫ.slice(),
            разделы: U.РАЗДЕЛЫ.slice(),
            расхождения, сверено,
            переключение: {
                новое: стало.tg.matches,
                чужойКаналЦел: стало.email.general,
                прежнийСлепокЦел: JSON.stringify(было) === слепок
            },
            изПустоты: U.переключить(null, 'tg', 'security', false),
            прочитать: {
                безПрофиля: U.прочитать(null),
                безСтолбца: U.прочитать({}),
                есть: U.прочитать({ notify_preferences: { tg: { matches: false } } })
            },
            бот: {
                безБота: U.каналДоступен('tg', {}),
                сБотом: U.каналДоступен('tg', { telegram_chat_id: 1 }),
                почтаВсегда: U.каналДоступен('email', {})
            }
        };
    });
}

function проверить(д) {
    // ТА САМАЯ БЕДА: канала `site` больше нет
    expect(д.каналы, 'каналы — ровно те, что спрашивает сервер').toEqual(['tg', 'email']);
    expect(д.каналы, 'канала `site` в доме нет').not.toContain('site');

    // ТА САМАЯ БЕДА: шесть разделов, а не четыре
    expect(д.разделы.slice().sort(), 'разделы — ровно те, что спрашивает сервер')
        .toEqual(['challenges', 'general', 'matches', 'membership', 'security', 'tournaments']);

    // Правило совпадает с серверным на всей решётке
    expect(д.сверено, 'решётка случаев прогнана целиком').toBe(189);
    expect(д.расхождения, 'правило дома совпадает с серверным').toEqual([]);

    expect(д.переключение.новое).toBe(true);
    expect(д.переключение.чужойКаналЦел, 'чужой канал не затёрт').toBe(false);
    expect(д.переключение.прежнийСлепокЦел, 'прежний слепок цел — его есть куда вернуть').toBe(true);
    expect(д.изПустоты).toEqual({ tg: { security: false } });

    expect(д.прочитать.безПрофиля).toEqual({});
    expect(д.прочитать.безСтолбца).toEqual({});
    expect(д.прочитать.есть).toEqual({ tg: { matches: false } });

    expect(д.бот.безБота, 'без привязанного бота телеграм гасится').toBe(false);
    expect(д.бот.сБотом).toBe(true);
    expect(д.бот.почтаВсегда).toBe(true);
}

test.describe('Уведомления — экран не расходится с сервером', () => {

    test.describe('кабинет сайта', () => {
        test.use({ storageState: require('../../auth-setup').playerState });

        for (const с of СТРАНИЦЫ) {
            test('дом доехал до кабинета · ' + с.язык, async ({ page }) => {
                const ошибки = await дождатьсяДома(page, с.адрес);
                проверить(await снятьДом(page));
                expect(ошибки, 'страница без ошибок').toEqual([]);
            });
        }

        test('в таблице настроек два столбца и шесть строк, и нет «На сайте»', async ({ page }) => {
            await дождатьсяДома(page, СТРАНИЦЫ[0].адрес);
            await page.goto(СТРАНИЦЫ[0].адрес + '#settings', { waitUntil: 'domcontentloaded' });
            const таблица = page.locator('.db-notify-table');
            await таблица.waitFor({ timeout: 20000 });
            const снимок = await page.evaluate(() => {
                const т = document.querySelector('.db-notify-table');
                if (!т) return null;
                return {
                    столбцов: т.querySelectorAll('thead th').length,
                    шапки: Array.from(т.querySelectorAll('thead th')).map(э => (э.textContent || '').trim()),
                    строк: т.querySelectorAll('tbody tr').length,
                    имена: Array.from(т.querySelectorAll('tbody .db-notify-name'))
                        .map(э => (э.textContent || '').trim()),
                    ползунков: т.querySelectorAll('input[type=checkbox]').length,
                    разделы: Array.from(т.querySelectorAll('input[type=checkbox]'))
                        .map(э => э.getAttribute('data-cat')),
                    каналы: Array.from(new Set(Array.from(т.querySelectorAll('input[type=checkbox]'))
                        .map(э => э.getAttribute('data-ch'))))
                };
            });
            expect(снимок, 'таблица настроек нарисована').not.toBeNull();
            expect(снимок.столбцов, 'пустая клетка плюс два канала').toBe(3);
            expect(снимок.шапки.join('|'), 'столбца «На сайте» нет')
                .toBe('|Telegram|Email');
            expect(снимок.строк, 'шесть разделов').toBe(6);
            expect(снимок.ползунков, 'шесть разделов на два канала').toBe(12);
            expect(снимок.каналы.sort(), 'в разметке только серверные каналы')
                .toEqual(['email', 'tg']);
            expect(снимок.разделы, 'в разметке все шесть серверных разделов')
                .toEqual(expect.arrayContaining(['security', 'general']));
            expect(снимок.имена.every(и => и.length > 0), 'ни одного пустого имени раздела').toBe(true);
        });
    });

    test('дом доехал до приложения — и три беды там закрыты', async ({ page }) => {
        const ошибки = await дождатьсяДома(page, ПРИЛОЖЕНИЕ);
        проверить(await снятьДом(page));
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });
});
