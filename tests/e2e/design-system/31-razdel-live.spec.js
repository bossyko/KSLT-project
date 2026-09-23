/**
 * РАЗДЕЛ #live И ОБЩАЯ ШАПКА РАЗДЕЛА — пять видов, три языка.
 *
 * Раздел скрыт инлайном и не отрисовывается вовсе, пока в live_matches нет
 * строк. Поэтому тест НЕ зависит от базы: если живого матча нет, он ставит
 * фикстуру той же разметки, что строит скрипт страницы. Иначе тест был бы
 * зелёным ровно тогда, когда проверять нечего.
 *
 * Ожидания СОБИРАЮТСЯ ИЗ СЛОЁВ, которые назвал сам браузер, а не хранятся
 * таблицей: иначе с каждым новым слоем появлялась бы ещё одна таблица, и
 * однажды она разошлась бы с css.
 *
 * Прогон: npx playwright test tests/e2e/design-system/31-razdel-live.spec.js
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

/** Какие слои css сработали — спрашиваем у браузера теми же медиазапросами. */
async function слои(page) {
    return page.evaluate(() => ({
        ноутбук: matchMedia('(min-width: 993px) and (max-height: 880px)').matches,
        сенсорТесный: matchMedia('(any-pointer: coarse) and (max-height: 820px)').matches,
        телефон: matchMedia('(max-width: 768px)').matches
    }));
}

/* Порядок ветвей повторяет порядок слоёв в css, снизу вверх:
     телефон (max-width: 768)          — стоит последним, побеждает всех
     сенсорный тесный (coarse, <=820)  — ниже ноутбучного
     ноутбучный (>=993 и <=880)
     базовый
   23.09 этой первой ветви здесь не было, и на 375x812 тест ждал 24, потому что
   телефон случайно попадает под max-height: 820. Он не тесный — он просто
   телефон, и воздух между секциями от высоты экрана не зависит. */
const ожидаемыйВоздух = с => с.телефон ? 40
                           : с.сенсорТесный ? 24
                           : с.ноутбук ? 32 : 40;

/** Ставит карточку матча, если база её не дала. Разметка — ровно та, что
    строит встроенный скрипт страницы: те же классы и та же вложенность. */
async function матчиИлиФикстура(page) {
    return page.evaluate(() => {
        const с = document.querySelector('#live');
        const г = document.querySelector('#liveMatchesGrid');
        if (!с || !г) return 'нет раздела в разметке';
        if (г.querySelector('.live-match')) { с.style.display = ''; return 'база'; }
        const игрок = (ини, имя, счёт, подаёт) =>
            '<div class="player">'
          + '<span class="live-avatar" aria-hidden="true">' + ини + '</span>'
          + '<span class="player-name">' + имя + '</span>'
          + '<span class="player-score' + (подаёт ? ' serving' : '') + '">' + счёт + '</span>'
          + '</div>';
        г.innerHTML =
            '<a href="pages/live-match.html?id=fixture" class="live-match"'
          + ' style="text-decoration:none;color:inherit;cursor:pointer;">'
          + '<div class="match-status">'
          + '<span class="live-badge is-warmup">РАЗМИНКА</span>'
          + '<span class="match-set">Тестовый корт</span>'
          + '</div>'
          + '<div class="match-players">'
          + игрок('ИК', 'Иван Корабельников', '0', true)
          + игрок('П', 'Петя', '0', false)
          + '</div></a>';
        с.style.display = '';
        return 'фикстура';
    });
}

const коробка = (page, сел) => page.evaluate(с => {
    const n = document.querySelector(с);
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
}, сел);

const стиль = (page, сел, свойства) => page.evaluate(([с, п]) => {
    const n = document.querySelector(с);
    if (!n) return null;
    const c = getComputedStyle(n);
    const o = {}; п.forEach(k => o[k] = c[k]); return o;
}, [сел, свойства]);

for (const стр of СТРАНИЦЫ) {

    test.describe('раздел live · ' + стр.имя, () => {

        let чужие = [];

        test.beforeEach(async ({ page }) => {
            чужие = [];
            page.on('request', r => {
                const u = r.url();
                if (/placehold\.co|placeholder\.com|via\.placeholder/.test(u)) чужие.push(u);
            });
            await page.goto(стр.адрес);
            await page.waitForFunction(() => {
                const s = document.querySelector('#live');
                return s && parseFloat(getComputedStyle(s).paddingTop) >= 20;
            });
            /* Ждём, пока страница перестанет расти. Турниры, рейтинг и новости
               дорисовываются запросами и двигают всё, что ниже. Без этого любой
               замер координат — гонка, и она уже один раз выстрелила. */
            await page.waitForFunction(() => {
                const h = document.documentElement.scrollHeight;
                if (window.__прежняяВысота === h) return true;
                window.__прежняяВысота = h;
                return false;
            }, null, { polling: 300, timeout: 15000 });
            const откуда = await матчиИлиФикстура(page);
            expect(откуда, 'раздела #live нет в разметке').not.toBe('нет раздела в разметке');
        });

        test('воздух секции — ступень шкалы по сработавшему слою', async ({ page }) => {
            const ждём = ожидаемыйВоздух(await слои(page));
            const s = await стиль(page, '#live', ['paddingTop', 'paddingBottom']);
            expect(Math.round(parseFloat(s.paddingTop))).toBe(ждём);
            /* Сверху и снизу поровну — признак того, что padding объявлен ОДИН раз
               и слои меняют значение, а не добавляют вторую отбивку. */
            expect(s.paddingBottom).toBe(s.paddingTop);
        });

        test('между секциями ритм один', async ({ page }) => {
            const ждём = ожидаемыйВоздух(await слои(page));
            /* БЕРЁМ СЛЕДУЮЩУЮ СЕКЦИЮ ПО РАЗМЕТКЕ, а не #tournaments по имени.
               23.09 тест падал на en и kg на всех пяти видах, и это была не
               ошибка вёрстки: порядок секций на трёх языках РАЗНЫЙ.
               ru:  герой -> live -> турниры
               en:  герой -> турниры -> live
               kg:  герой -> турниры -> live
               Тест не должен знать имя соседа — он проверяет ритм, а не порядок.
               Сам разнобой порядка записан в трекер и ждёт решения Кости. */
            /* ОБА ПРЯМОУГОЛЬНИКА СНИМАЮТСЯ В ОДИН ЗАХОД. 23.09 тест упал с
               «1082.6 больше 925.6», то есть секции будто наехали друг на друга
               на 157 пикселей. Вёрстка была ни при чём: соседа мерили одним
               вызовом, #live — следующим, а между ними дорисовывался блок выше
               по странице и сдвигал всё вниз. Замер из двух вызовов сравнивает
               две РАЗНЫЕ страницы. Атомарный замер даёт зазор ровно 0 на всех
               пяти видах и трёх языках — проверено вручную. */
            const пара = await page.evaluate(() => {
                const live = document.querySelector('#live');
                let n = live && live.nextElementSibling;
                while (n && (n.tagName !== 'SECTION' || getComputedStyle(n).display === 'none')) {
                    n = n.nextElementSibling;
                }
                if (!live || !n) return null;
                const a = live.getBoundingClientRect(), b = n.getBoundingClientRect();
                return { кто: n.id || n.className, низЖивого: a.bottom, верхСоседа: b.top,
                         padTop: getComputedStyle(n).paddingTop };
            });
            test.skip(!пара, 'после #live нет видимых секций');
            /* Секции соприкасаются: зазор между ними — сумма их отбивок.
               Между ними может стоять скрытый контейнер баттлов, поэтому
               сверяем отбивку соседа, а не расстояние. */
            expect(Math.round(parseFloat(пара.padTop)),
                   'воздух у соседней секции «' + пара.кто + '»').toBe(ждём);
            expect(пара.низЖивого,
                   'секции соприкасаются, зазор между ними — их собственные отбивки')
                .toBeLessThanOrEqual(пара.верхСоседа + 1);
        });

        test('заголовок раздела — ступень шкалы, вес Extra Bold', async ({ page }) => {
            const с = await слои(page);
            const s = await стиль(page, '#live h2', ['fontSize', 'fontWeight']);
            expect(s.fontWeight).toBe('800');
            /* Лестница 86:10: 26 на широком, 21 на телефоне. Одна на все 16 страниц. */
            expect(Math.round(parseFloat(s.fontSize))).toBe(с.телефон ? 21 : 26);
        });

        test('первая карточка начинается у левого края дорожки', async ({ page }) => {
            const ряд = await коробка(page, '#liveMatchesGrid');
            const карта = await коробка(page, '#liveMatchesGrid .live-match');
            /* Решение Кости 22.09, глазами: ряд идёт слева направо. Центрирование
               пробовали и отвергли — «по центру как бедный родственник».
               Карточка начинается там же, где заголовок раздела. */
            expect(Math.abs(карта.left - ряд.left)).toBeLessThanOrEqual(1);
            const заголовок = await коробка(page, '#live h2');
            expect(Math.abs(карта.left - заголовок.left)).toBeLessThanOrEqual(1);
        });

        test('вторая карточка встаёт правее, а не двигает первую', async ({ page }) => {
            const было = await коробка(page, '#liveMatchesGrid .live-match');
            const стало = await page.evaluate(() => {
                const г = document.querySelector('#liveMatchesGrid');
                const к = г.querySelector('.live-match');
                const клон = к.cloneNode(true);
                г.appendChild(клон);
                const r = г.getBoundingClientRect();
                const a = г.children[0].getBoundingClientRect();
                const b = г.children[г.children.length - 1].getBoundingClientRect();
                const о = { ширина: a.width, высота: a.height,
                            слева: a.left - r.left, перваяЛевее: a.left <= b.left,
                            одинРяд: Math.abs(a.top - b.top) < 1 };
                г.removeChild(клон);
                return о;
            });
            /* Первая не сдвинулась: ряд наполняется вправо, а не расползается. */
            expect(стало.слева).toBeLessThanOrEqual(1);
            expect(стало.высота).toBeCloseTo(было.h, 0);
            expect(стало.ширина).toBeCloseTo(было.w, 0);
            expect(стало.перваяЛевее).toBe(true);
            /* На узких видах вторая уезжает под первую — это нормально,
               проверяем только порядок, а не строку. */
        });

        test('карточка — padding 16 со всех сторон', async ({ page }) => {
            const s = await стиль(page, '.live-match',
                ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']);
            Object.values(s).forEach(v => expect(Math.round(parseFloat(v))).toBe(16));
        });

        test('бейдж собран по компоненту Badge', async ({ page }) => {
            const s = await стиль(page, '.live-badge',
                ['height', 'borderRadius', 'fontWeight', 'textTransform', 'letterSpacing',
                 'paddingLeft', 'paddingRight']);
            expect(Math.round(parseFloat(s.height))).toBe(24);
            expect(parseFloat(s.borderRadius)).toBeGreaterThanOrEqual(12);
            expect(s.fontWeight).toBe('500');
            expect(s.textTransform).toBe('uppercase');
            expect(parseFloat(s.letterSpacing)).toBeCloseTo(0.5, 1);
            expect(Math.round(parseFloat(s.paddingLeft))).toBe(8);
            expect(Math.round(parseFloat(s.paddingRight))).toBe(8);
        });

        test('разминка не красится как идущая игра', async ({ page }) => {
            const тона = await page.evaluate(() => {
                const б = document.querySelector('.live-badge');
                const снять = кл => {
                    б.className = 'live-badge ' + кл;
                    const c = getComputedStyle(б);
                    return { фон: c.backgroundColor, цвет: c.color, анимация: c.animationName };
                };
                const было = б.className;
                const о = { live: снять('is-live'), warmup: снять('is-warmup'), paused: снять('is-paused') };
                б.className = было;
                return о;
            });
            expect(тона.warmup.фон).not.toBe(тона.live.фон);
            expect(тона.paused.фон).not.toBe(тона.live.фон);
            /* Пульсирует ТОЛЬКО тот, что доминирует. Анимации здесь намеренно
               не глушим — иначе проверка стала бы зелёной всегда. */
            expect(тона.live.анимация).toBe('livePulse');
            expect(тона.warmup.анимация).toBe('none');
            expect(тона.paused.анимация).toBe('none');
        });

        test('аватар — инициалы, ни одного запроса на чужой CDN', async ({ page }) => {
            const ав = await page.evaluate(() => {
                const a = document.querySelector('.live-avatar');
                if (!a) return null;
                const r = a.getBoundingClientRect();
                const c = getComputedStyle(a);
                return { текст: a.textContent.trim(), w: r.width, h: r.height,
                         фон: c.backgroundColor, цвет: c.color };
            });
            expect(ав, 'заглушки аватара нет').not.toBeNull();
            expect(Math.round(ав.w)).toBe(32);
            expect(Math.round(ав.h)).toBe(32);
            expect(ав.текст.length).toBeGreaterThan(0);
            expect(ав.текст).not.toBe('?');
            expect(чужие, 'страница ходит за картинками наружу: ' + чужие.join(', ')).toHaveLength(0);
        });

        test('раздел не создаёт горизонтальной прокрутки', async ({ page }) => {
            const о = await page.evaluate(() => ({
                документ: document.documentElement.scrollWidth,
                окно: window.innerWidth,
                ряд: document.querySelector('#liveMatchesGrid').scrollWidth
            }));
            expect(о.документ).toBeLessThanOrEqual(о.окно + 1);
            expect(о.ряд).toBeLessThanOrEqual(о.окно + 1);
        });
    });
}
