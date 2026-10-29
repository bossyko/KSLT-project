// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-OKNA: окна приложения — ни одно без оснастки.
 *
 * Дом `mobile/www/js/kslt-okno.js` (кусок 230) СЛУШАЕТ появление класса
 * `open` и сам ставит окну `role="dialog"`, `aria-modal`, подпись для
 * диктора, уводит фокус внутрь, держит Tab, слушает Esc и возвращает
 * фокус тому, кто окно открыл.
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Сторож читает файлы и видит,
 * что класс окна попал в список дома. Он НЕ ВИДИТ, доехало ли это до
 * живого дерева: встала ли роль, ушёл ли фокус внутрь, держится ли Tab,
 * вернулся ли фокус после Esc. Это работа прогона.
 *
 * ЗАМЕР 29.10: класс `open` ставят в 26 местах, а в списке дома было
 * ВОСЕМЬ классов — СЕМЬ окон в него не попали. Для диктора их не
 * существовало. Здесь проверяются ровно те, что добавлены.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ: окна открываются ПРЯМОЙ ПОСТАНОВКОЙ КЛАССА, как
 * это делает продукт, без нажатия кнопок, которые пишут.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

/* Окна, добавленные в список дома 29.10. Накладку рисуем сами — ровно с
   тем классом, что носит продукт, и с подписью внутри: проверяется
   ПОВЕДЕНИЕ ДОМА, а не путь, которым продукт до окна добирается. */
const ОКНА = [
    { класс: 'ar-overlay', имя: 'возврат учётной записи' },
    { класс: 'onboarding-overlay', имя: 'онбординг' },
    { класс: 'otp-pw-overlay', имя: 'смена пароля' },
    { класс: 'tg-reg-overlay', имя: 'вход через Telegram' },
    { класс: 'gi-overlay', имя: 'приглашения на игру' },
    { класс: 'pd-h2h-modal', имя: 'личные встречи' }
];

async function дождатьсяДома(page) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.KSLT_OKNO, null, { timeout: 20000 });
    return ошибки;
}

test.describe('Окна приложения — ни одно без оснастки', () => {

    for (const о of ОКНА) {
        test('оснастка встала · ' + о.имя, async ({ page }) => {
            const ошибки = await дождатьсяДома(page);

            const снимок = await page.evaluate(async (класс) => {
                /* Кнопка снаружи — чтобы проверить ВОЗВРАТ фокуса. */
                const кнопка = document.createElement('button');
                кнопка.id = 'ктоОткрыл';
                кнопка.textContent = 'открыть';
                document.body.appendChild(кнопка);
                кнопка.focus();
                const фокусДо = document.activeElement.id;

                const окно = document.createElement('div');
                окно.className = класс;
                окно.innerHTML = '<h3>Заголовок окна</h3>' +
                    '<button class="перваяЦель">первая</button>' +
                    '<button class="втораяЦель">вторая</button>';
                document.body.appendChild(окно);

                окно.classList.add('open');
                /* Дом слушает смену класса — ждём, пока наблюдатель сработает. */
                await new Promise(r => setTimeout(r, 120));

                const послеОткрытия = {
                    role: окно.getAttribute('role'),
                    ariaModal: окно.getAttribute('aria-modal'),
                    подпись: окно.getAttribute('aria-label') || окно.getAttribute('aria-labelledby'),
                    фокусВнутри: окно.contains(document.activeElement)
                };

                /* Esc — выход с клавиатуры. */
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                окно.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                await new Promise(r => setTimeout(r, 160));

                const послеEsc = {
                    классСнят: !окно.classList.contains('open'),
                    фокусВернулся: document.activeElement && document.activeElement.id === 'ктоОткрыл'
                };

                окно.remove();
                кнопка.remove();
                return { фокусДо, послеОткрытия, послеEsc };
            }, о.класс);

            expect(снимок.фокусДо, 'до открытия фокус был на кнопке').toBe('ктоОткрыл');
            expect(снимок.послеОткрытия.role, 'диктору сказано, что это окно').toBe('dialog');
            expect(снимок.послеОткрытия.ariaModal, 'и что оно модальное').toBe('true');
            expect(снимок.послеОткрытия.подпись, 'у окна есть имя для диктора').toBeTruthy();
            expect(снимок.послеОткрытия.фокусВнутри,
                'фокус уведён ВНУТРЬ: иначе следующий Tab читает то, что окно закрыло').toBe(true);

            expect(снимок.послеEsc.классСнят, 'Esc закрывает окно').toBe(true);
            expect(снимок.послеEsc.фокусВернулся,
                'фокус вернулся тому, кто окно открыл').toBe(true);

            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('Tab держится внутри окна', async ({ page }) => {
        await дождатьсяДома(page);
        const снимок = await page.evaluate(async () => {
            const окно = document.createElement('div');
            окно.className = 'ar-overlay';
            окно.innerHTML = '<h3>Окно</h3><button id="ц1">1</button><button id="ц2">2</button>';
            document.body.appendChild(окно);
            окно.classList.add('open');
            await new Promise(r => setTimeout(r, 120));

            const шаг = (сдвиг) => {
                окно.dispatchEvent(new KeyboardEvent('keydown',
                    { key: 'Tab', shiftKey: сдвиг, bubbles: true, cancelable: true }));
            };
            document.getElementById('ц2').focus();
            шаг(false);                       // с последней цели вперёд
            const послеВперёд = document.activeElement.id;
            document.getElementById('ц1').focus();
            шаг(true);                        // с первой назад
            const послеНазад = document.activeElement.id;

            окно.classList.remove('open');
            await new Promise(r => setTimeout(r, 60));
            окно.remove();
            return { послеВперёд, послеНазад };
        });
        expect(снимок.послеВперёд, 'с последней цели Tab идёт на первую, а не наружу').toBe('ц1');
        expect(снимок.послеНазад, 'Shift+Tab с первой идёт на последнюю').toBe('ц2');
    });

    test('плашка «корт открыт» окном не считается', async ({ page }) => {
        await дождатьсяДома(page);
        const роль = await page.evaluate(async () => {
            const плашка = document.createElement('span');
            плашка.className = 'tc-status';
            плашка.textContent = 'открыт';
            document.body.appendChild(плашка);
            плашка.classList.add('open');
            await new Promise(r => setTimeout(r, 120));
            const р = плашка.getAttribute('role');
            плашка.remove();
            return р;
        });
        expect(роль, 'класс `open` носит и не-окно — дом не должен уводить в него фокус').toBeNull();
    });
});
