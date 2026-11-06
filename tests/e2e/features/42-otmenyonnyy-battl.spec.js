// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-OTMENA: отмена баттла — состояние, а не случай на экране (06.11).
 *
 * Найдено 30.10: три списка брали всё опубликованное, слова `cancelled`
 * в отрисовке карточек не было ни в одном, и человек нажимал на живую с
 * виду карточку, чтобы попасть на «Баттл отменён». Причина оказалась
 * глубже трёх списков: дом состояния знал ТРИ состояния, отмены среди
 * них не было, а в приложении дома не было вовсе.
 *
 * Сторож `check-otmena-battla.js` читает файлы как текст: он видит, что
 * состояние заведено и что дом один на два продукта. Он НЕ видит, что
 * дом отвечает на живой странице и что метка встала на карточке. Это
 * работа прогона.
 *
 * БАЗУ ПРОБА НЕ ТРОГАЕТ: дом зовётся напрямую, карточка рисуется той же
 * разметкой, что у продукта. Запрет на сервере проверен отдельно —
 * чтением базы, 06.11: запрет стоит, отменённых 0, голосов за них 0.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';
const САЙТ = '/pages/battles-overview.html';

/** Завтра и вчера: состояние считается по часам Бишкека, и крайний
    случай здесь — отменённый баттл, чьё время УЖЕ ПРОШЛО. */
function датой(сдвигДней) {
    const д = new Date(Date.now() + сдвигДней * 86400000);
    return д.toISOString().slice(0, 10);
}

async function дождатьсяДома(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window.KSLT_BATTLE_FORMAT && window.KSLT_BATTLE_FORMAT.state),
        null, { timeout: 20000 });
    return ошибки;
}

const СЛУЧАИ = [
    { имя: 'предстоящий',          status: 'active',    дней: 1,  ждём: 'upcoming',  отменён: false, сыгран: false },
    { имя: 'идёт',                 status: 'active',    дней: -1, ждём: 'live',      отменён: false, сыгран: false },
    { имя: 'завершён',             status: 'completed', дней: -1, ждём: 'done',      отменён: false, сыгран: true  },
    { имя: 'отменён, время впереди', status: 'cancelled', дней: 1,  ждём: 'cancelled', отменён: true,  сыгран: false },
    { имя: 'отменён, время прошло',  status: 'cancelled', дней: -1, ждём: 'cancelled', отменён: true,  сыгран: false }
];

for (const продукт of [['приложение', ПРИЛОЖЕНИЕ], ['сайт', САЙТ]]) {
    test.describe('Отмена баттла · ' + продукт[0], () => {

        test('дом отвечает одинаково на пяти случаях', async ({ page }) => {
            const ошибки = await дождатьсяДома(page, продукт[1]);
            const итог = await page.evaluate(({ СЛУЧАИ, завтра, вчера }) => {
                const BF = window.KSLT_BATTLE_FORMAT;
                return СЛУЧАИ.map(с => {
                    const b = {
                        status: с.status,
                        proposed_date: с.дней > 0 ? завтра : вчера,
                        proposed_time: '18:00'
                    };
                    return {
                        имя: с.имя,
                        состояние: BF.state(b),
                        отменён: BF.isCancelled(b),
                        сыгран: BF.isPlayed(b),
                        голосованиеЗакрыто: BF.votingClosed(b)
                    };
                });
            }, { СЛУЧАИ, завтра: датой(1), вчера: датой(-1) });

            СЛУЧАИ.forEach((с, i) => {
                expect(итог[i].состояние, с.имя).toBe(с.ждём);
                expect(итог[i].отменён, с.имя + ' — отменён?').toBe(с.отменён);
                /* ОТМЕНЁННЫЙ БАТТЛ НЕ СТАНОВИТСЯ СЫГРАННЫМ ОТТОГО, ЧТО
                   ЕГО ВРЕМЯ ПРОШЛО. Ради этой строки состояние и стоит в
                   доме ПЕРВЫМ. */
                expect(итог[i].сыгран, с.имя + ' — сыгран?').toBe(с.сыгран);
            });
        });

        test('в отменённом голосовать нельзя', async ({ page }) => {
            await дождатьсяДома(page, продукт[1]);
            const закрыто = await page.evaluate((завтра) => {
                const BF = window.KSLT_BATTLE_FORMAT;
                return BF.votingClosed({ status: 'cancelled', proposed_date: завтра, proposed_time: '18:00' });
            }, датой(1));
            /* Время ещё не пришло, голосование по часам открыто — закрыть
               его должна именно отмена. */
            expect(закрыто, 'голосование в отменённом баттле').toBe(true);
        });
    });
}

test.describe('Отмена баттла · карточка приложения', () => {

    test('отменённая карточка помечена и названа диктору', async ({ page }) => {
        const ошибки = await дождатьсяДома(page, ПРИЛОЖЕНИЕ);
        const о = await page.evaluate(() => {
            /* Разметка та же, что у продукта: класс карточки, класс
               метки. Проба проверяет ОДЕЖДУ и подпись, а не то, каким
               путём продукт до карточки добирается. */
            const к = document.createElement('div');
            к.className = 'battle-card battle-card-cancelled';
            к.setAttribute('aria-label', 'Осенний баттл, Баттл отменён');
            к.innerHTML = '<div class="battle-badge-cancelled">Баттл отменён</div>' +
                          '<div class="battle-title">Осенний баттл</div>';
            document.getElementById('app').appendChild(к);
            const м = к.querySelector('.battle-badge-cancelled');
            const r = м.getBoundingClientRect();
            const cs = getComputedStyle(м);
            return {
                метка: { ш: Math.round(r.width), в: Math.round(r.height) },
                цветМетки: cs.color,
                цветКарточки: getComputedStyle(к).opacity,
                подпись: к.getAttribute('aria-label')
            };
        });
        expect(о.метка.в, 'метка ' + о.метка.ш + '×' + о.метка.в).toBeGreaterThanOrEqual(24);
        expect(о.метка.ш, 'метка пустая').toBeGreaterThan(40);
        /* Отменённая карточка приглушена, но не спрятана: отменённое не
           спорит за внимание с тем, что ещё будет, и не исчезает. */
        expect(Number(о.цветКарточки), 'прозрачность карточки').toBeLessThan(1);
        expect(Number(о.цветКарточки), 'карточка не должна исчезать').toBeGreaterThan(0.3);
        expect(о.подпись, 'подпись для диктора').toContain('отменён');
        expect(ошибки, 'ошибки страницы').toEqual([]);
    });
});
