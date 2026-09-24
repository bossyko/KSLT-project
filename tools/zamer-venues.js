/**
 * ЗАМЕР РАЗДЕЛА «ГДЕ ИГРАТЬ И У КОГО УЧИТЬСЯ» — пять видов, три языка.
 *
 * Почему отдельный скрипт, а не браузер из сессии:
 *   · окно Chrome перестало слушаться resize (записано 24.09);
 *   · iframe-зонд с 25.09 не работает — Chrome начал исполнять
 *     `<meta http-equiv="X-Frame-Options" content="DENY">` в index.html:10,
 *     и страница больше не открывается во фрейме;
 *   · встроенный браузер до localhost:8080 не достаёт.
 * Playwright грузит страницу НА НУЖНОЙ ШИРИНЕ по-настоящему — это и есть
 * правило «вид меряется загрузкой, а не сжатием».
 *
 * Это НЕ тест: бегунок не запускается, globalSetup не трогается, в базу
 * скрипт не пишет. Только читает и печатает числа.
 *
 *   node tools/zamer-venues.js
 *   node tools/zamer-venues.js > /tmp/venues.json
 */
const { chromium } = require('@playwright/test');

const ВИДЫ = [
    { имя: 'десктоп',      w: 1280, h: 800  },
    { имя: 'планшет ↔',    w: 1024, h: 768  },
    { имя: 'планшет ↕',    w: 768,  h: 1024 },
    { имя: 'телефон ↔',    w: 844,  h: 390  },
    { имя: 'телефон ↕',    w: 375,  h: 812  }
];
const ЯЗЫКИ = [
    { имя: 'ru', адрес: 'http://localhost:8080/index.html' },
    { имя: 'en', адрес: 'http://localhost:8080/index-en.html' },
    { имя: 'kg', адрес: 'http://localhost:8080/index-kg.html' }
];

const СНЯТЬ = `(() => {
  const сек = document.getElementById('venues');
  if (!сек) return null;
  const кор = э => { const r = э.getBoundingClientRect();
    return { ш: Math.round(r.width), вы: Math.round(r.height), в: Math.round(r.top) }; };
  const сн = sel => { const e = сек.querySelector(sel); if (!e) return null;
    const s = getComputedStyle(e);
    const t = (e.textContent || '').trim().replace(/\\s+/g, ' ');
    return { к: Math.round(parseFloat(s.fontSize)), в: s.fontWeight,
             м: s.lineHeight, ц: s.color, зн: t.length }; };
  const сетки = [...сек.querySelectorAll('.vn-four')];
  const видно = с => [...сек.querySelectorAll(с)].filter(e => e.offsetParent);
  const карты = видно('.court-card'), тр = видно('.coach-card');
  const ряды = л => { const m = {}; л.forEach(c => {
      const y = Math.round(c.getBoundingClientRect().top); (m[y] = m[y] || []).push(c); });
    return Object.values(m).map(r => r.length); };
  const b = сек.querySelector('.court-card-details');
  const bt = сек.querySelector('.coach-card-details');
  const фото = сек.querySelector('.court-card img');
  const круг = сек.querySelector('.coach-photo');
  const шапки = [...сек.querySelectorAll('.vn-row-head')];
  return {
    окно: innerWidth + 'x' + innerHeight,
    колонок: сетки[0] ? getComputedStyle(сетки[0]).gridTemplateColumns.split(' ').length : null,
    зазор: сетки[0] ? getComputedStyle(сетки[0]).gap : null,
    кортов: карты.length, рядыК: ряды(карты),
    тренеров: тр.length, рядыТ: ряды(тр),
    карточкаКорта: карты[0] ? кор(карты[0]).ш + 'x' + кор(карты[0]).вы : null,
    карточкаТренера: тр[0] ? кор(тр[0]).ш + 'x' + кор(тр[0]).вы : null,
    фото: фото ? кор(фото).ш + 'x' + кор(фото).вы : null,
    кружок: круг ? кор(круг).ш + 'x' + кор(круг).вы : null,
    кнопкаКорта: b ? кор(b).вы : null,
    кнопкаТренера: bt ? кор(bt).вы : null,
    поляКнопки: b ? getComputedStyle(b).padding : null,
    отступШапки: шапки[0] ? getComputedStyle(шапки[0]).margin : null,
    уровни: {
      'h2 раздела':   сн('.section-header h2'),
      'h3 ряда':      сн('.vn-row-head h3'),
      'ссылка все':   сн('.link-all'),
      'имя корта':    сн('.court-info h4'),
      'мета корта':   сн('.court-info span'),
      'кнопка корта': сн('.court-card-details'),
      'имя тренера':  сн('.coach-info h4'),
      'мета тренера': сн('.coach-info span'),
      'партнёр':      сн('.vn-partner'),
      'скидка':       сн('.vn-discount')
    },
    обрезано: [...сек.querySelectorAll('h4, span, a')]
      .filter(э => э.scrollWidth > э.clientWidth + 1 && getComputedStyle(э).overflow === 'visible')
      .map(э => э.className || э.tagName).slice(0, 8),
    прокрутка: document.documentElement.scrollWidth > innerWidth + 1
  };
})()`;

const шаг = т => process.stderr.write(т + '\n');

(async () => {
    шаг('');
    шаг('  Запускаю браузер…');
    const браузер = await chromium.launch();
    шаг('  Браузер поднят. Пятнадцать загрузок: пять видов на трёх языках.');
    шаг('');
    const всё = [];
    for (const я of ЯЗЫКИ) {
        for (const в of ВИДЫ) {
            const кон = await браузер.newContext({
                viewport: { width: в.w, height: в.h },
                hasTouch: в.w < 1280, isMobile: в.w < 1280
            });
            const стр = await кон.newPage();
            process.stderr.write('  ' + я.имя + ' ' + в.w + 'x' + в.h + ' … ');
            try {
                await стр.goto(я.адрес, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch (e) {
                шаг('НЕ ОТКРЫЛОСЬ');
                шаг('');
                шаг('  Страница ' + я.адрес + ' не отвечает.');
                шаг('  Локальный сервер на localhost:8080 поднят? Это тот же адрес,');
                шаг('  что открыт в Chrome. Подними его и запусти скрипт заново.');
                шаг('');
                await браузер.close();
                process.exit(1);
            }
            /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ */
            await стр.waitForFunction(
                () => { const g = document.getElementById('venuesCourts');
                        return g && (g.querySelector('.court-card') || g.querySelector('.vn-notice')); },
                null, { timeout: 20000 }).catch(() => {});
            await стр.waitForFunction(
                () => [...document.querySelectorAll('#venues img')].every(i => i.complete),
                null, { timeout: 15000 }).catch(() => {});
            const р = await стр.evaluate(СНЯТЬ);
            if (!р) { шаг('раздела #venues на странице нет'); }
            else { шаг('кортов ' + р.кортов + ', колонок ' + р.колонок + ', карточка ' + р.карточкаКорта); }
            всё.push({ язык: я.имя, вид: в.имя, ширина: в.w, высота: в.h, ...(р || {}) });
            await кон.close();
        }
    }
    await браузер.close();

    const ЦЕЛЬ = require('path').join(__dirname, '..', 'zamer-venues.json');
    require('fs').writeFileSync(ЦЕЛЬ, JSON.stringify(всё, null, 1));

    /* таблица для глаз */
    console.error('');
    console.error('  вид             кол  gap   карточка   фото      кнопка  h2/h3  имя/мета');
    console.error('  ' + '-'.repeat(74));
    всё.filter(р => р.язык === 'ru').forEach(р => {
        const у = р.уровни;
        console.error('  ' + (р.вид + ' ' + р.ширина).padEnd(16) +
            String(р.колонок).padEnd(5) + String(р.зазор).padEnd(6) +
            String(р.карточкаКорта).padEnd(11) + String(р.фото).padEnd(10) +
            String(р.кнопкаКорта).padEnd(8) +
            (у['h2 раздела'].к + '/' + у['h3 ряда'].к).padEnd(7) +
            (у['имя корта'].к + '/' + у['мета корта'].к));
    });
    console.error('');
    console.error('  кортов / тренеров по рядам:');
    всё.filter(р => р.язык === 'ru').forEach(р => {
        console.error('  ' + (р.вид + ' ' + р.ширина).padEnd(16) +
            'корты [' + р.рядыК.join(',') + ']   тренеры [' + р.рядыТ.join(',') + ']');
    });
    console.error('');
    const разошлись = [];
    ВИДЫ.forEach(в => {
        const набор = всё.filter(р => р.ширина === в.w)
            .map(р => JSON.stringify(р.уровни));
        if (new Set(набор).size !== 1) разошлись.push(в.имя);
    });
    console.error(разошлись.length
        ? '  ЯЗЫКИ РАЗОШЛИСЬ на видах: ' + разошлись.join(', ')
        : '  RU / EN / KG совпали на всех пяти видах.');
    console.error('');

    шаг('  Полный замер записан: ' + ЦЕЛЬ);
    шаг('');
})();
