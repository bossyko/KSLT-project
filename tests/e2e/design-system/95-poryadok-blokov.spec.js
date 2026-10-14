/**
 * ПОРЯДОК БЛОКОВ — ФУНКЦИЯ СОСТОЯНИЯ. 14.10, кусок 71.
 *
 * Замер: плей-офф клеился после групп БЕЗУСЛОВНО, а комментарий рядом
 * обещал условие «пока плей-офф пуст», которого в коде не было. На идущем
 * турнире 153bc688 группы были доиграны 12 из 12, плей-офф играл 3 из 9 —
 * и на телефоне зритель листал 771 пиксель законченных таблиц, прежде чем
 * увидеть играемую сетку.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ПОРЯДОК ДЕЙСТВИТЕЛЬНО МЕНЯЕТСЯ. Заморозка видит тернарник в
 *     файле; что блоки встали в этом порядке НА ЭКРАНЕ — говорит браузер;
 *   • ЧТО ОН МЕНЯЕТСЯ ОТ СОСТОЯНИЯ, А НЕ ОТ ВИДА. Один и тот же расклад
 *     на пяти видах должен дать один и тот же порядок;
 *   • ЧТО ОН ОДИНАКОВ НА ТРЁХ ЯЗЫКАХ. Порядок секций уже расходился по
 *     языкам однажды — на разделе LIVE, 23.09;
 *   • ЧТО СТУПЕНИ ЛЕСТНИЦЫ СТОЯТ НА ШКАЛЕ. Три уровня этого блока
 *     рисуются строкой из js и класса не имеют: прибор, ходящий по
 *     селекторам, их не видит вовсе;
 *   • ЧТО ПОДЗАГОЛОВОК СТРОГО МЕЛЬЧЕ ЗАГОЛОВКА РАЗДЕЛА. Замораживается
 *     ОТНОШЕНИЕ, а не число: 21 против 26 на широких, 16 против 21 на
 *     узких.
 *
 * ПОРОГ: блок сетки не отрисовался — проверка ПАДАЕТ, а не проходит
 * вхолостую. Пустая страница не доказывает ничего.
 */
const { test, expect } = require('../../fixtures');
const { подставить, ТУРНИР } = require('../../podstava-setki');

const ШКАЛА = [11, 12, 14, 16, 18, 21, 26, 32, 40, 64];

const ВИДЫ = [
    { имя: 'десктоп 1512',    w: 1512, h: 900  },
    { имя: 'планшет 1024',    w: 1024, h: 768  },
    { имя: 'телефон гор 844', w: 844,  h: 390  },
    { имя: 'планшет 768',     w: 768,  h: 1024 },
    { имя: 'телефон 390',     w: 390,  h: 844  }
];

const ЯЗЫКИ = [
    { код: 'ru', адрес: '/pages/tournament.html',    группы: 'Групповой этап', плейофф: 'Плей-офф'  },
    { код: 'en', адрес: '/pages/tournament-en.html', группы: 'Group Stage',    плейофф: 'Playoff'   },
    { код: 'kg', адрес: '/pages/tournament-kg.html', группы: 'Топтук этап',    плейофф: 'Плей-офф'  }
];

async function открыть(page, язык, расклад, вид) {
    await page.setViewportSize({ width: вид.w, height: вид.h });
    await подставить(page, расклад);
    await page.goto(язык.адрес + '?id=' + ТУРНИР);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => {
        const b = document.getElementById('bracketContainer');
        return b && b.querySelectorAll('h3').length >= 2;
    }, null, { timeout: 15000 });
    await page.waitForTimeout(250);
}

/** Верх блока по его заголовку. Признак, а не тишина сети. */
async function верх(page, текст) {
    return page.evaluate((т) => {
        const b = document.getElementById('bracketContainer');
        if (!b) return null;
        const h = Array.from(b.querySelectorAll('h3'))
            .find(x => x.textContent.trim().indexOf(т) === 0);
        if (!h) return null;
        return Math.round(h.getBoundingClientRect().top + window.scrollY);
    }, текст);
}

for (const вид of ВИДЫ) {
for (const язык of ЯЗЫКИ) {

test.describe('порядок блоков · ' + вид.имя + ' · ' + язык.код, () => {

    test('групповой этап ИДЁТ — группы выше плей-оффа', async ({ page }) => {
        await открыть(page, язык, 'идёт', вид);
        const г = await верх(page, язык.группы);
        const п = await верх(page, язык.плейофф);
        expect(г, 'ПОРОГ: блок групп не отрисовался').not.toBeNull();
        expect(п, 'ПОРОГ: блок плей-оффа не отрисовался').not.toBeNull();
        expect(г, 'группы должны стоять ВЫШЕ плей-оффа, пока этап идёт').toBeLessThan(п);
    });

    test('групповой этап ЗАКРЫТ — плей-офф поднялся наверх', async ({ page }) => {
        await открыть(page, язык, 'закрыт', вид);
        const г = await верх(page, язык.группы);
        const п = await верх(page, язык.плейофф);
        expect(г, 'ПОРОГ: блок групп не отрисовался').not.toBeNull();
        expect(п, 'ПОРОГ: блок плей-оффа не отрисовался').not.toBeNull();
        expect(п, 'плей-офф должен стоять ВЫШЕ групп, когда этап закрыт').toBeLessThan(г);
    });

    test('подзаголовок блока стоит на ступени и мельче заголовка раздела', async ({ page }) => {
        await открыть(page, язык, 'закрыт', вид);
        const м = await page.evaluate(() => {
            const b = document.getElementById('bracketContainer');
            const h3 = b && b.querySelector('h3');
            const h2 = document.querySelector('#bracket h2, .td-section-header h2');
            const с = x => x ? parseFloat(getComputedStyle(x).fontSize) : null;
            return { под: с(h3), раздел: с(h2), вес: h3 ? getComputedStyle(h3).fontWeight : null };
        });
        expect(м.под, 'ПОРОГ: подзаголовка блока нет').not.toBeNull();
        expect(ШКАЛА, 'кегль подзаголовка мимо шкалы: ' + м.под).toContain(м.под);
        expect(м.вес, 'подзаголовку положен вес Bold').toBe('700');
        if (м.раздел !== null) {
            expect(м.под, 'подзаголовок должен быть СТРОГО мельче заголовка раздела').toBeLessThan(м.раздел);
        }
    });

    test('название группы стоит на ступени', async ({ page }) => {
        await открыть(page, язык, 'закрыт', вид);
        const м = await page.evaluate(() => {
            const e = document.querySelector('#bracketContainer .td-group-name');
            if (!e) return null;
            const s = getComputedStyle(e);
            return { к: parseFloat(s.fontSize), вес: s.fontWeight };
        });
        expect(м, 'ПОРОГ: названия группы нет на странице').not.toBeNull();
        expect(ШКАЛА, 'кегль названия группы мимо шкалы: ' + м.к).toContain(м.к);
        expect(м.вес, 'названию группы положен вес Bold').toBe('700');
    });

    test('ни одного кегля мимо шкалы во всём блоке сетки', async ({ page }) => {
        await открыть(page, язык, 'закрыт', вид);
        const мимо = await page.evaluate((шкала) => {
            const b = document.getElementById('bracketContainer');
            if (!b) return null;
            const плохие = {};
            b.querySelectorAll('*').forEach(e => {
                const r = e.getBoundingClientRect();
                if (!r.width || !r.height) return;
                let свой = '';
                e.childNodes.forEach(n => { if (n.nodeType === 3) свой += n.nodeValue; });
                if (!свой.trim()) return;
                const s = getComputedStyle(e);
                if (s.visibility === 'hidden' || s.display === 'none') return;
                const к = Math.round(parseFloat(s.fontSize) * 10) / 10;
                /* Кегль 0 — приём гашения, а не ступень: полную подпись
                   гасят нулём и печатают короткую через ::after. */
                if (!(к > 0)) return;
                if (шкала.indexOf(к) === -1) плохие[к] = (плохие[к] || 0) + 1;
            });
            return плохие;
        }, ШКАЛА);
        expect(мимо, 'ПОРОГ: блок сетки не отрисовался').not.toBeNull();
        expect(Object.keys(мимо), 'кегли мимо шкалы: ' + JSON.stringify(мимо)).toHaveLength(0);
    });

});

}
}
