/**
 * ПУБЛИЧНАЯ СТРАНИЦА ИГРОКА — 09.10.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЛЕВУЮ ГРАНИЦУ. В файле написано «обе коробки берут --pp-gutter».
 *     Совпали ли они на этом виде — видно только на живой странице: до
 *     09.10 шапка стояла левее тела на 24 на широких и правее на 4 на
 *     узких, и оба файла по отдельности выглядели правильными;
 *   • ВОЗДУХ НАД ПЕРВЫМ ЗАГОЛОВКОМ. Он складывался из padding контейнера
 *     и margin заголовка. Сумма двух верных чисел — число неверное, и
 *     увидеть её можно только сложением в браузере;
 *   • ОТСЕЧКУ. Её поведение — нажатие: десять строк, кнопка со счётом,
 *     после нажатия все строки и кнопки нет. В разметке этого нет;
 *   • ЦЕЛЬ НАЖАТИЯ. Кнопка H2H красится 23 в высоту, а нажимается 44
 *     прозрачным слоем. Файл покажет правило, живая страница — настоящий
 *     прямоугольник;
 *   • ОКНО H2H. Оно открывается нажатием, в списке элементов его нет:
 *     имя для диктора, ловушка Tab, возврат фокуса;
 *   • ФОКУС. Правило в css есть, а рисует ли браузер контур — решает
 *     живой focus().
 *
 * ПОРОГ: игрок не нашёлся или страница пуста — проверка ПАДАЕТ, а не
 * проходит вхолостую.
 */
const { test, expect, db } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

/* СТРАНИЦА ИГРОКА ЗАКРЫТА ВХОДОМ, И ЭТО ВЫЯСНИЛОСЬ ПРОГОНОМ 09.10.
   Без сессии detectAccess ставит «guest» (js/player.js:556-570) и рисуется
   заглушка renderGuestBlock (js/player.js:583): ни шапки, ни заголовков
   разделов, ни показателей, ни матчей — обложка и та скрыта. Первый прогон
   упал двенадцатью тестами подряд по одной причине: «No players found».
   Поэтому проверка поднимает готовую сессию игрока, а из конфига «без базы»
   файл исключён поимённо — там входа нет по построению. */
test.use({ storageState: playerState });

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ШКАЛА_ОТСТУПОВ = [8, 12, 16, 24, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];
const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];

/**
 * КОГО ПРОВЕРЯТЬ — СПРАШИВАЕМ У БАЗЫ, А НЕ У СТРАНИЦЫ, И ПОД КАЖДУЮ НАДОБНОСТЬ
 * СВОЕГО.
 *
 * Первый заход брал первую ссылку со страницы рейтинга — и все двенадцать
 * проверок упали с «No players found». Сетевой след прогона 09.10: база
 * ответила 200 на всё, players_public отдал 97 КБ, а player_categories — 1 КБ.
 * Игроки есть, в категориях рейтинга почти никого.
 *
 * Второй заход требовал от одного игрока И категории, И матчей — и отсечка
 * ушла в пропуск на всех пяти видах, то есть вхолостую. Замер по следу:
 * в категориях 12 игроков, из них с одиночными матчами 6, у лучшего 6 матчей
 * при отсечке в 10. А игрок с 38 одиночными в базе есть — он просто не стоит
 * в категории.
 *
 * Поэтому надобности разведены. Показателям и лестнице нужна КАТЕГОРИЯ: без
 * неё на странице нет ни цифр, ни подписей. Отсечке нужны ДЛИННЫЕ СПИСКИ:
 * меньше одиннадцати строк — прятать нечего. Один игрок редко даёт и то, и
 * другое, и требовать этого от данных — значит проверять вхолостую.
 *
 * Зашитый id не годится вовсе: он живёт ровно до первой правки данных.
 */
async function найтиИгрока(page, что = 'с категорией') {
    await page.goto('/index.html');
    const найдено = await page.evaluate(async ({ url, key, что }) => {
        const взять = async путь => {
            const r = await fetch(url + '/rest/v1/' + путь, {
                headers: { apikey: key, Authorization: 'Bearer ' + key }
            });
            return r.ok ? r.json() : null;
        };
        /* СЧИТАЕМ ТОЛЬКО ОДИНОЧНЫЕ. У пар и микста кнопки H2H нет вовсе
           (js/player.js:1081), и игрок с одними парными матчами уводит
           проверку окна в пропуск — то есть вхолостую. */
        const матчи = await взять('matches?select=player1_id,player2_id,match_type,' +
            'tournament:tournaments(format)&winner_id=not.is.null&limit=5000');
        const вКатегориях = await взять('player_categories?select=player_id');
        if (!матчи || !вКатегориях) return { беда: 'база не ответила на запрос кандидатов' };

        const скольких = {};
        матчи.forEach(м => {
            const ф = м.tournament && м.tournament.format;
            if (ф === 'doubles' || ф === 'mixed_doubles') return;
            [м.player1_id, м.player2_id].forEach(i => { if (i) скольких[i] = (скольких[i] || 0) + 1; });
        });
        const по_убыванию = Object.keys(скольких).sort((a, b) => скольких[b] - скольких[a]);
        const свои = new Set(вКатегориях.map(с => с.player_id));

        const годные = что === 'с длинным списком'
            ? по_убыванию
            : по_убыванию.filter(i => свои.has(i));

        if (!годные.length) return {
            беда: что === 'с длинным списком'
                ? 'в базе нет ни одного игрока с одиночными матчами'
                : 'в базе нет игрока, у которого есть и матчи, и место в категории'
        };
        return { id: годные[0], матчей: скольких[годные[0]] };
    }, { url: db.url, key: db.key, что });

    expect(найдено.беда, 'ПОРОГ: ' + (найдено.беда || '')).toBeUndefined();
    return найдено.id;
}

async function открыть(page, хвост, id) {
    await page.goto('/pages/player' + хвост + '.html?id=' + id);
    await page.waitForFunction(
        () => document.querySelector('.pp-name') !== null, null, { timeout: 25000 });
    /* СПИСКИ ДОРИСОВЫВАЮТСЯ ПОСЛЕ ШАПКИ. Прогон 09.10: на одном виде из пяти
       отсечка ушла в пропуск «списки короче отсечки» при тех же данных —
       проверка успела заглянуть до того, как матчи легли в разметку. */
    await page.waitForFunction(
        () => document.querySelectorAll('.pp-match, .pp-tournament').length > 0,
        null, { timeout: 25000 });
    /* Дождаться, пока тело страницы перестанет меняться: списки матчей и
       турниров дорисовываются после шапки, и замер до этого врёт. */
    await page.waitForFunction(() => {
        const к = document.querySelector('.pp-container');
        const было = window.__слепок;
        const стало = к ? к.innerHTML.length : -1;
        window.__слепок = стало;
        return стало > 0 && стало === было;
    }, null, { timeout: 25000, polling: 400 });
    /* Появление доигрывает трансформом: без этого замер верха врёт на 24. */
    await page.evaluate(() => document.querySelectorAll('.pp-fade-in').forEach(e => {
        e.style.transition = 'none'; e.style.transform = 'none'; e.style.opacity = 1;
    }));
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

for (const Я of ЯЗЫКИ) {
test.describe('страница игрока · ' + Я.имя, () => {

    test('шапка и тело стоят на одной левой границе', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        const г = await page.evaluate(() => {
            const Л = c => { const e = document.querySelector(c); return e ? Math.round(e.getBoundingClientRect().left) : null; };
            const П = c => { const e = document.querySelector(c); return e ? Math.round(e.getBoundingClientRect().right) : null; };
            return {
                шапка: Л('.pp-header'), заголовок: Л('.pp-section-title'),
                шапка_спр: П('.pp-header'), заголовок_спр: П('.pp-section-title'),
                прокрутка: document.documentElement.scrollWidth > window.innerWidth
            };
        });

        expect(г.шапка, 'ПОРОГ: шапки игрока на странице нет').not.toBeNull();
        expect(г.заголовок, 'ПОРОГ: ни одного заголовка раздела').not.toBeNull();
        expect(г.заголовок, 'шапка и тело разъехались по левой границе: ' +
               г.шапка + ' и ' + г.заголовок).toBe(г.шапка);
        expect(г.заголовок_спр, 'шапка и тело разъехались по правой границе: ' +
               г.шапка_спр + ' и ' + г.заголовок_спр).toBe(г.шапка_спр);
        expect(г.прокрутка, 'страница поехала вбок').toBe(false);
    });

    test('воздух над первым заголовком — одна ступень, а не сумма двух', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        const в = await page.evaluate(() => {
            const к = document.querySelector('.pp-container');
            const з = document.querySelector('.pp-section-title');
            if (!к || !з) return null;
            return Math.round(з.getBoundingClientRect().top - к.getBoundingClientRect().top);
        });
        expect(в, 'ПОРОГ: нет контейнера или заголовка').not.toBeNull();
        expect(ШКАЛА_ОТСТУПОВ, 'воздух над первым заголовком ' + в +
               ' — не ступень шкалы (было 80 = 40 контейнера + 40 заголовка)').toContain(в);
    });

    test('лестница текста — каждый уровень на ступени', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        const беды = await page.evaluate(({ кегли, строки }) => {
            const плохо = [];
            document.querySelectorAll('main *').forEach(el => {
                if (!el.textContent || !el.textContent.trim()) return;
                if (el.children.length && !el.matches('h1,h2,h3,h4,span,a,button,td,th,div.pp-stat-num,div.pp-stat-label')) return;
                const s = getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden') return;
                const к = Math.round(parseFloat(s.fontSize) * 100) / 100;
                if (кегли.indexOf(к) === -1) плохо.push('кегль ' + к + ' у ' + (el.className || el.tagName));
                const мс = s.lineHeight === 'normal' ? null
                    : Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100;
                if (мс !== null && строки.every(д => Math.abs(д - мс) > 0.03))
                    плохо.push('межстрочный ' + мс + ' у ' + (el.className || el.tagName));
            });
            return [...new Set(плохо)];
        }, { кегли: ШКАЛА_КЕГЛЕЙ, строки: ЛЕСТНИЦА_СТРОК });

        expect(беды, 'уровни мимо лестницы:\n' + беды.join('\n')).toEqual([]);
    });

    test('цифра показателя строго крупнее своей подписи', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        const п = await page.evaluate(() => {
            const ч = c => { const e = document.querySelector(c); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null; };
            return { цифра: ч('.pp-stat-num'), подпись: ч('.pp-stat-label') };
        });
        expect(п.цифра, 'ПОРОГ: на странице нет ни одного показателя').not.toBeNull();
        expect(ШКАЛА_КЕГЛЕЙ, 'цифра мимо шкалы: ' + п.цифра).toContain(п.цифра);
        expect(ШКАЛА_КЕГЛЕЙ, 'подпись мимо шкалы: ' + п.подпись).toContain(п.подпись);
        const шагов = ШКАЛА_КЕГЛЕЙ.indexOf(п.цифра) - ШКАЛА_КЕГЛЕЙ.indexOf(п.подпись);
        expect(шагов, 'пара «цифра + подпись» сошлась: ' + п.цифра + ' и ' + п.подпись)
            .toBeGreaterThanOrEqual(2);

        /* ЗАМЕРЕНО, А НЕ ПРИКИНУТО. Прогон 09.10 поймал меня на выдуманном
           числе: я написал коридор «две-три ступени», не померив. На шкале
           11·12·14·16·18·21·26·32·40 пара 21/12 — это ЧЕТЫРЕ ступени, а
           18/12 на телефоне — три. Замораживается отношение: на узком виде
           пара строго теснее, чем на широком. */
        const ширина = page.viewportSize().width;
        const предел = ширина <= 640 ? 3 : 4;
        expect(шагов, 'пара «цифра + подпись» на ширине ' + ширина + ': ' +
               п.цифра + ' и ' + п.подпись + ' — ' + шагов + ' ступеней при ' +
               предел + ' ожидаемых. На узком виде пара обязана быть ТЕСНЕЕ')
            .toBeLessThanOrEqual(предел);
    });

    test('имя игрока — единственный заголовок первого уровня', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);
        const h1 = await page.evaluate(() => {
            const все = document.querySelectorAll('main h1');
            return { штук: все.length, имя: все[0] ? все[0].className : null };
        });
        expect(h1.штук, 'у страницы игрока должен быть ровно один h1').toBe(1);
        expect(h1.имя, 'h1 — не имя игрока').toContain('pp-name');
    });

    test('отсечка: десять строк, кнопка со счётом, раскрытие', async ({ page }) => {
        // отсечке нужны длинные списки, а не место в категории
        const id = await найтиИгрока(page, 'с длинным списком');
        await открыть(page, Я.хвост, id);

        const есть = await page.evaluate(() => document.querySelectorAll('.kslt-more').length);
        test.skip(есть === 0, 'у этого игрока списки короче отсечки — прятать нечего');

        const до = await page.evaluate(() => {
            const вид = c => Array.from(document.querySelectorAll(c)).filter(e => e.offsetParent !== null).length;
            const к = document.querySelector('.kslt-more');
            const r = к.getBoundingClientRect();
            return {
                матчи_всего: document.querySelectorAll('.pp-match').length,
                матчи_видно: вид('.pp-match'),
                текст: к.textContent.trim(),
                высота: Math.round(r.height),
                aria: к.getAttribute('aria-expanded')
            };
        });

        if (до.матчи_всего > 10) {
            expect(до.матчи_видно, 'отсечка не на десяти: видно ' + до.матчи_видно).toBe(10);
        }
        expect(до.текст, 'кнопка не называет, сколько прячет: «' + до.текст + '»').toMatch(/\(\d+\)/);
        expect(до.высота, 'кнопка отсечки ушла со ступени цели нажатия 44').toBeGreaterThanOrEqual(44);
        expect(до.aria, 'кнопка не говорит диктору, что список свёрнут').toBe('false');

        await page.evaluate(() => document.querySelectorAll('.kslt-more').forEach(к => к.click()));
        await page.waitForTimeout(200);

        const после = await page.evaluate(() => ({
            скрыто: document.querySelectorAll('.kslt-skryta').length,
            кнопок: document.querySelectorAll('.kslt-more').length,
            матчи_видно: Array.from(document.querySelectorAll('.pp-match')).filter(e => e.offsetParent !== null).length
        }));
        expect(после.скрыто, 'после нажатия часть строк осталась спрятанной').toBe(0);
        expect(после.кнопок, 'кнопка осталась, хотя раскрывать больше нечего').toBe(0);
        expect(после.матчи_видно, 'после раскрытия видно не все матчи')
            .toBe(до.матчи_всего);
    });

    test('мелкие кнопки нажимаются на 44, даже если красятся мельче', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        const мелкие = await page.evaluate(() => {
            const беды = [];
            document.querySelectorAll('.pp-match-h2h, .kslt-back-wrap.pp-back-float .kslt-back, .pp-tournament-link')
                .forEach(e => {
                    if (e.offsetParent === null) return;
                    const сл = getComputedStyle(e, '::after');
                    const своя = Math.round(e.getBoundingClientRect().height);
                    const слой = parseFloat(сл.minHeight) || 0;
                    if (Math.max(своя, слой) < 44)
                        беды.push((e.className || e.tagName) + ': ' + своя + ' при слое ' + слой);
                });
            return [...new Set(беды)];
        });
        expect(мелкие, 'ниже цели нажатия 44:\n' + мелкие.join('\n')).toEqual([]);
    });

    test('фокус виден на самом деле, а не только в файле', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        /* ФОКУС СТАВИТСЯ ТОЛЬКО КЛАВИАТУРОЙ, И ТОЛЬКО ОБХОДОМ.
           Первая проверка звала el.focus() — :focus-visible по спецификации
           на программный фокус не отвечает. Вторая делала el.focus() плюс
           Shift+Tab и Tab — и соврала снова: такой возврат браузер не всегда
           считает клавиатурным. Настоящий способ один: идти по странице
           Tab-ом, как идёт человек, и мерить тот элемент, на котором фокус
           оказался сам. Заодно видно, добираются ли до цели вообще. */
        const цели = ['.kslt-back-wrap.pp-back-float .kslt-back', '.pp-match-h2h', '.kslt-more'];
        const найденные = {};
        await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });

        for (let шаг = 0; шаг < 160; шаг++) {
            await page.keyboard.press('Tab');
            const где = await page.evaluate(цели => {
                const e = document.activeElement;
                if (!e || e === document.body) return null;
                const чей = цели.find(c => e.matches(c));
                if (!чей) return null;
                const s = getComputedStyle(e);
                let видим = false;
                try { видим = e.matches(':focus-visible'); } catch (x) {}
                return {
                    чей: чей,
                    контур: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
                            s.boxShadow !== 'none',
                    /* ЧИСЛА, А НЕ «НЕ РИСУЕТ». Без них падение не говорит,
                       что именно сломалось: правило не доехало, контур нулевой
                       или браузер не счёл фокус клавиатурным. */
                    замер: 'outline ' + s.outlineStyle + ' ' + s.outlineWidth + ' ' +
                           s.outlineColor + ' · offset ' + s.outlineOffset +
                           ' · shadow ' + (s.boxShadow === 'none' ? 'нет' : 'есть') +
                           ' · :focus-visible ' + (видим ? 'да' : 'нет')
                };
            }, цели);
            if (где && !(где.чей in найденные)) найденные[где.чей] = где;
            if (Object.keys(найденные).length === цели.length) break;
        }

        const доступные = Object.keys(найденные);
        expect(доступные.length,
            'ПОРОГ: за 160 нажатий Tab фокус не дошёл ни до одной цели — ' +
            'до кнопок страницы не добраться с клавиатуры вовсе').toBeGreaterThan(0);

        const слепые = доступные.filter(c => !найденные[c].контур);
        expect(слепые, 'фокус невидим (проверено обходом Tab):\n' +
               слепые.map(c => c + ' → ' + найденные[c].замер).join('\n'))
            .toEqual([]);
    });

    test('окно H2H называет себя, держит Tab и возвращает фокус', async ({ page }) => {
        const id = await найтиИгрока(page);
        await открыть(page, Я.хвост, id);

        const есть = await page.evaluate(() =>
            document.querySelectorAll('.pp-match-h2h').length > 0);
        test.skip(!есть, 'у этого игрока нет одиночных матчей — окно H2H не открыть');

        await page.evaluate(() => document.querySelector('.pp-match-h2h').click());
        await page.waitForFunction(
            () => document.querySelector('[role="dialog"]') !== null, null, { timeout: 15000 });

        const о = await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"]');
            return {
                модально: d.getAttribute('aria-modal'),
                имя: d.getAttribute('aria-label'),
                внутри: d.querySelectorAll('button, a[href]').length
            };
        });
        expect(о.модально, 'окно не объявило себя модальным').toBe('true');
        expect(о.имя, 'у окна нет имени для диктора').toBeTruthy();
        expect(о.внутри, 'ПОРОГ: в окне нет ни одного места для фокуса').toBeGreaterThan(0);

        /* Tab НЕ УХОДИТ НАРУЖУ: с клавиатуры окно должно удерживать. */
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        const внутри = await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"]');
            return d ? d.contains(document.activeElement) : null;
        });
        expect(внутри, 'Tab ушёл из окна наружу').toBe(true);
    });
});
}
