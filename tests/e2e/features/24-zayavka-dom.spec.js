// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-ZAYAVKA-DOM: заявка на турнир — один дом (кусок A3.7д).
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Заморозка читает файл как
 * текст: она видит, что ветка `partner_changed` стоит первой, и не
 * видит, доехал ли дом до страницы и что он отдаёт на самом деле.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ. Серверную функцию допуска никто не зовёт: дому
 * подсовывается подставной клиент и подставной `fetch`, который только
 * запоминает, чем его позвали, и возвращается на место после проверки.
 *
 * ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ — ДВЕ БЕДЫ, КОТОРЫЕ ЖИЛИ В ПРИЛОЖЕНИИ:
 *   1. ответ `partner_changed` не несёт ни `error`, ни `status`, и в
 *      приложении доезжал до последней ветки — человек после УСПЕШНОЙ
 *      замены напарника видел «⛔ Заявка не принята»;
 *   2. слов на коды отказа было девять из девятнадцати, и остальные
 *      человек видел СЫРЫМ КОДОМ базы.
 * Поэтому проверка идёт и на страницах сайта, и на приложении — одним
 * и тем же снимком.
 *
 * ПЯТЬ ВИДОВ приходят из пяти проектов конфига, а не из сжатия окна.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/tournaments.html' },
    { язык: 'en', адрес: '/pages/tournaments-en.html' },
    { язык: 'kg', адрес: '/pages/tournaments-kg.html' }
];

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождатьсяДома(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    try {
        await page.waitForFunction(
            () => window.KSLT_ZAYAVKA && window.KSLT_ZAYAVKA_TEXTS &&
                  typeof window.KSLT_ZAYAVKA.разобрать === 'function',
            null, { timeout: 20000 });
    } catch (e) {
        throw new Error('дом заявки не объявился на ' + адрес +
            ' · ошибки страницы: ' + (ошибки.length ? ошибки.join(' | ') : 'нет'));
    }
    return ошибки;
}

/** Снять с ЖИВОГО дома всё, что проверяет этот файл. */
function снятьДом(page) {
    return page.evaluate(async () => {
        const Z = window.KSLT_ZAYAVKA;
        const T = window.KSLT_ZAYAVKA_TEXTS;
        const словами = (data, язык) => Z.словами(Z.разобрать(data), T.of(язык || 'ru'), data);

        const КОДЫ = Object.keys(T.ru.err);
        const ОТВЕТЫ = [
            { partner_changed: true }, { partner_changed: true, guest: true },
            { error: 'already_registered', status: 'approved' },
            { error: 'already_registered', status: 'draw' },
            { error: 'already_registered', status: 'pending' },
            { error: 'already_registered', status: 'waitlist' },
            { error: 'already_registered', status: 'rejected' },
            { error: 'already_registered', status: 'withdrawn' },
            { error: 'already_registered', status: 'blocked' },
            { status: 'approved' }, { status: 'approved', reason: 'top_rank' },
            { status: 'waitlist' }, { status: 'waitlist', reason: 'no_category' },
            { status: 'waitlist', reason: 'rank_waitlist' },
            { status: 'waitlist', reason: 'draw_full' }, {}
        ];

        /* Пустых слов быть не может ни на одном языке: пустота здесь — это
           человек, смотрящий в молчащее окно. */
        const пусто = [];
        for (const язык of ['ru', 'en', 'kg']) {
            for (const о of ОТВЕТЫ) {
                const w = словами(о, язык);
                if (!w.титул || !w.текст || !w.коротко) пусто.push(язык + ' ' + JSON.stringify(о));
            }
            for (const к of КОДЫ) {
                const w = словами({ error: к }, язык);
                if (!w.текст || w.текст === к) пусто.push(язык + ' код ' + к);
            }
        }

        /* ЗОВ: подставной `fetch`, и он возвращается на место. */
        const былFetch = window.fetch;
        let поймано = null;
        window.fetch = (u, o) => {
            поймано = { u: String(u), заголовки: o.headers, тело: o.body, способ: o.method };
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'approved' }) });
        };
        let зов;
        try {
            const клиент = { auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'TOK-TEST' } } }) } };
            зов = await Z.зов(клиент, 'T-TEST', {
                partner_id: '', partner_external_name: 'Гость', partner_ntrp: null, лишнее: undefined
            });
        } finally {
            window.fetch = былFetch;
        }

        return {
            языки: {
                ru: словами({ partner_changed: true }, 'ru'),
                en: словами({ partner_changed: true }, 'en'),
                kg: словами({ partner_changed: true }, 'kg')
            },
            гость: словами({ partner_changed: true, guest: true }, 'ru'),
            уже: словами({ error: 'already_registered', status: 'rejected' }, 'ru'),
            незнакомыйСтатус: словами({ error: 'already_registered', status: 'чудной' }, 'ru'),
            долгийКод: словами({ error: 'entry_in_draw' }, 'ru'),
            чужойКод: словами({ error: 'ну-ка-что-это' }, 'ru'),
            верх: словами({ status: 'approved', reason: 'top_rank' }, 'ru'),
            ожидание: словами({ status: 'waitlist', reason: 'draw_full' }, 'ru'),
            свояПричина: словами({ block_reason: 'клуб закрыл набор' }, 'ru'),
            кодов: КОДЫ.length,
            пусто,
            создана: {
                принята: Z.создана({ status: 'approved' }),
                уже: Z.создана({ error: 'already_registered', status: 'approved' }),
                отказ: Z.создана({ error: 'banned' })
            },
            зов, поймано
        };
    });
}

/** Один и тот же разбор для сайта и приложения. */
function проверить(д) {
    // 1. ТА САМАЯ БЕДА: смена напарника — успех, а не отказ
    expect(д.языки.ru.тон, 'смена напарника — успех').toBe('success');
    expect(д.языки.ru.титул).toBe('Напарник заменён');
    expect(д.языки.ru.текст).toBe('Ваше место в турнире сохраняется.');
    expect(д.языки.ru.коротко).toBe('Напарник заменён');
    expect(д.языки.en.титул).toBe('Partner changed');
    expect(д.языки.kg.титул).toBe('Өнөктөш алмаштырылды');
    expect(д.гость.коротко, 'замена на гостя — на рассмотрении').toBe('На рассмотрении');

    // 2. ТА САМАЯ БЕДА: девятнадцать слов на коды, ни одного сырого
    expect(д.кодов, 'кодов отказа девятнадцать').toBe(19);
    expect(д.долгийКод.текст, 'код не показывается сырым')
        .toBe('Сетка сформирована — состав закрыт. Чтобы сменить напарника, обратитесь в клуб');
    expect(д.чужойКод.текст, 'незнакомый код — как есть, иначе человек увидит пустоту')
        .toBe('ну-ка-что-это');
    expect(д.пусто, 'пустых слов нет ни на одном языке').toEqual([]);

    // Остальные ветки дерева
    expect(д.уже.тон).toBe('error');
    expect(д.уже.текст).toBe('Заявка отклонена администратором.');
    expect(д.уже.коротко).toBe('Отклонена');
    expect(д.незнакомыйСтатус.текст, 'незнакомый статус — «Статус: …», а не пустота')
        .toBe('Статус: чудной');
    expect(д.верх.заметка, 'место не закреплено — предупреждение')
        .toContain('Место не закреплено');
    expect(д.ожидание.титул).toBe('Заявка принята — на рассмотрении');
    expect(д.ожидание.текст).toBe('Основная сетка заполнена.');
    expect(д.свояПричина.текст, 'слово сервера важнее нашего общего')
        .toBe('клуб закрыл набор');

    // Признак «заявка создана» — по нему кнопка меняет вид
    expect(д.создана.принята).toBe(true);
    expect(д.создана.уже, 'уже подана — кнопку менять надо').toBe(true);
    expect(д.создана.отказ).toBe(false);

    // Зов: адрес, токен и ОТСЕВ ПУСТЫХ ПОЛЕЙ
    expect(д.поймано, 'зов дошёл до подставного fetch').not.toBeNull();
    expect(д.поймано.u).toContain('/functions/v1/tournament-register');
    expect(д.поймано.способ).toBe('POST');
    expect(д.поймано.заголовки.Authorization).toBe('Bearer TOK-TEST');
    expect(JSON.parse(д.поймано.тело), 'пустые поля отсеяны: пустой partner_id сервер понял бы как «напарник есть, имя пустое»')
        .toEqual({ tournament_id: 'T-TEST', partner_external_name: 'Гость' });
    expect(д.зов.ok).toBe(true);
}

test.describe('Заявка на турнир — один дом', () => {

    for (const с of СТРАНИЦЫ) {
        test('дом доехал до страницы турниров · ' + с.язык, async ({ page }) => {
            const ошибки = await дождатьсяДома(page, с.адрес);
            проверить(await снятьДом(page));
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('дом доехал до приложения — и обе беды там закрыты', async ({ page }) => {
        const ошибки = await дождатьсяДома(page, ПРИЛОЖЕНИЕ);
        проверить(await снятьДом(page));
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    test('вид окна заявки приложения живёт в css, а не в строке js', async ({ page }) => {
        await дождатьсяДома(page, ПРИЛОЖЕНИЕ);
        const вид = await page.evaluate(() => {
            let правил = 0, четвёртыйКрасный = 0;
            for (const л of Array.from(document.styleSheets)) {
                let правила = [];
                try { правила = Array.from(л.cssRules || []); } catch (e) { continue; }
                for (const п of правила) {
                    const с = п.selectorText || '';
                    if (/\.mob-reg-/.test(с)) {
                        правил++;
                        const т = (п.cssText || '').toLowerCase();
                        if (т.indexOf('255, 59, 48') !== -1 || т.indexOf('#ff3b30') !== -1) четвёртыйКрасный++;
                    }
                }
            }
            return { правил, четвёртыйКрасный, вписанных: document.querySelectorAll('#kslt-reg-modal-styles').length };
        });
        expect(вид.правил, 'правила окна заявки читаются из css').toBeGreaterThanOrEqual(10);
        expect(вид.вписанных, 'ничего не вписывается строкой в <head>').toBe(0);
        expect(вид.четвёртыйКрасный, 'четвёртого красного в окне заявки нет').toBe(0);
    });
});
