/**
 * ЗАМЕР ВКЛАДКИ «ЗАЯВКИ» В АДМИНКЕ ТУРНИРА.
 *
 * ПОСТОЯННОЕ УСЛОВИЕ КОСТИ: АДМИНКА — ДЕСКТОП И ПЛАНШЕТ. ТЕЛЕФОНА У НЕЁ
 * НЕТ. ТОЛЬКО РУССКИЙ. Видов три, четвёртый сюда не добавляется.
 *
 * ПРИБОР ХОДИТ В ТЕСТОВУЮ БАЗУ, А НЕ В БОЕВУЮ. Адрес подставляется до
 * загрузки страницы через window.KSLT_DB — так же, как это делает
 * tests/fixtures.js. Сессия берётся из tests/.auth/admin.json, которую
 * завёл сам tests/auth-setup.js: пароль прибор не знает и не вводит.
 *
 * КОНТРАСТ СЧИТАЕТСЯ ПО СОСТАВЛЕННОМУ ЦВЕТУ. Цвета продукта
 * полупрозрачные: прибор, взявший 255 за белый, показывает благополучие
 * там, где его надо проверять. Альфа накладывается на фактический фон,
 * собранный проходом по родителям.
 *
 * ПОРОГ. Замер идёт по турниру test-zayavki, где сев развёл крайние случаи:
 * посев, длинное ФИО, одна причина, три причины, гость, внешний, двое в
 * очереди. Если хотя бы одного края нет — прибор ПАДАЕТ, а не меряет
 * ровную таблицу: замер без крайних случаев ничего не доказывает.
 *
 *   node tools/zamer-zayavki.mjs
 *   BASE=http://localhost:8000 node tools/zamer-zayavki.mjs
 */
import { chromium } from '@playwright/test';
import { createRequire } from 'module';
import fs from 'fs';
import { spawn } from 'child_process';
const require = createRequire(import.meta.url);
const db = require('../tests/test-db');
const авт = require('../tests/auth-setup');

/* АДРЕС БЕРЁТСЯ ИЗ САМОЙ СЕССИИ, А НЕ УГАДЫВАЕТСЯ. Первый прогон ушёл на
   localhost:8080 — там живёт сервер Кости, — и страница увела на форму
   входа. Причина не в сессии: `storageState` раскладывает localStorage ПО
   ИСТОЧНИКАМ, а `auth-setup` заводил её на localhost:8000 (baseURL
   конфига). Другой порт — другой источник, и ключ `sb-...-auth-token`
   просто не доезжает.
   СЕССИЯ ПРИВЯЗАНА К ИСТОЧНИКУ, А НЕ К МАШИНЕ. */
const состояние = JSON.parse(fs.readFileSync(авт.adminState, 'utf8'));
const изСессии = (состояние.origins || [])[0] && состояние.origins[0].origin;
const BASE = process.env.BASE || изСессии || 'http://localhost:8000';
if (изСессии && !process.env.BASE && изСессии !== BASE) {
  console.log('  внимание: сессия завелась на ' + изСессии + ', а мерим на ' + BASE);
}

/* Сервер на нужном порту может быть не поднят: ворота тестов поднимают его
   сами (playwright.config, webServer). Прибор делает то же и гасит за
   собой — иначе он требует от человека помнить про отдельное окно. */
let свойСервер = null;
async function живСервер() {
  try { const r = await fetch(BASE + '/pages/admin.html', { method: 'HEAD' }); return r.ok || r.status === 405; }
  catch (e) { return false; }
}
if (!(await живСервер())) {
  const порт = new URL(BASE).port || '80';
  console.log('  сервер на ' + BASE + ' не отвечает — поднимаю свой на ' + порт);
  свойСервер = spawn('python3', ['-m', 'http.server', порт], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', detached: false
  });
  for (let i = 0; i < 40; i++) { if (await живСервер()) break; await new Promise(r => setTimeout(r, 250)); }
  if (!(await живСервер())) {
    console.log('\n  ✗ сервер так и не поднялся. Запусти сам: python3 -m http.server ' + порт +
                ' из корня репозитория, либо укажи BASE=http://localhost:<порт>\n');
    if (свойСервер) свойСервер.kill();
    process.exit(1);
  }
}
/* ДВА ТУРНИРА, А НЕ ОДИН. У строки заявки две ветки: одиночная и парная,
   и у парной СВОИ девять колонок. 03.10 Костя открыл дружеский парный и
   увидел прокрутку вбок там, где её только что убрали: прибор мерил
   одиночный и о парной ветке не знал ничего.
   ПРИБОР, ПОМЕРИВШИЙ ОДИН СЛУЧАЙ, НЕ ЗНАЕТ ДРУГОГО. */
const ТУРНИРЫ = [
  { имя: 'одиночный', id: 'test-zayavki',      колонок: 7 },
  { имя: 'парный',    id: 'test-zayavki-pary', колонок: 9 }
];
const виды = [
  { имя: 'десктоп',      w: 1512, h: 950 },
  { имя: 'планшет лежа', w: 1024, h: 768 },
  { имя: 'планшет стоя', w: 768,  h: 1024 }
];

/* ВЫВОД ЛОЖИТСЯ В ФАЙЛ, А НЕ ТОЛЬКО В ОКНО. Копировать длинный замер из
   терминала в чат — потеря: 03.10 из трёх видов до меня дошла одна строка
   геометрии, и порог остался неизвестным. Файл лежит рядом с отчётами
   прогона и в репозиторий не идёт. */
const СЛЕД = new URL('../tests/reports/zamer-zayavki.txt', import.meta.url).pathname;
const буфер = [];
const _лог = console.log;
console.log = (...а) => { буфер.push(а.join(' ')); _лог(...а); };
function сохранить() {
  try {
    fs.mkdirSync(СЛЕД.replace(/\/[^/]+$/, ''), { recursive: true });
    fs.writeFileSync(СЛЕД, буфер.join('\n') + '\n', 'utf8');
    _лог('\n  след замера: tests/reports/zamer-zayavki.txt');
  } catch (e) { _лог('  след не записался: ' + e.message); }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
let плохо = 0;

for (const т of ТУРНИРЫ) {
for (const в of виды) {
  const ctx = await browser.newContext({
    viewport: { width: в.w, height: в.h },
    storageState: авт.adminState
  });
  await ctx.addInitScript(cfg => { window.KSLT_DB = cfg; }, { url: db.url, key: db.key });
  await ctx.route('**/*', r => {
    const t = r.request().resourceType();
    if (t === 'image' || t === 'font' || t === 'media')
      return r.fulfill({ status: 200, contentType: 'image/gif', body: '' });
    return r.continue();
  });
  const page = await ctx.newPage();
  const ошибки = [];
  page.on('pageerror', e => ошибки.push(String(e.message)));

  await page.goto(BASE + '/pages/admin.html#tournaments/edit/' + т.id,
                  { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('#adTrnCat', { state: 'visible', timeout: 25000 });
  } catch (e) {
    console.log('\n  ✗ ' + т.имя + ' · ' + в.имя + ': форма турнира не открылась. Адрес: ' + page.url() +
                (ошибки.length ? '\n    ошибки страницы: ' + ошибки.join(' | ') : ''));
    плохо++; await ctx.close(); continue;
  }
  await page.click('[data-trn-nav="regs"]');
  try {
    await page.waitForSelector('.ad-reg-check', { timeout: 25000 });
  } catch (e) {
    console.log('\n  ✗ ' + т.имя + ' · ' + в.имя + ': таблица заявок не появилась' +
                (ошибки.length ? '\n    ошибки страницы: ' + ошибки.join(' | ') : ''));
    плохо++; await ctx.close(); continue;
  }

  const м = await page.evaluate(() => {
    const ч = x => Math.round(x * 100) / 100;
    const разбор = s => {
      const m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
    };
    const поверх = (п, ф) => ({ r: п.r * п.a + ф.r * (1 - п.a),
                                g: п.g * п.a + ф.g * (1 - п.a),
                                b: п.b * п.a + ф.b * (1 - п.a), a: 1 });
    const фонПод = э => {
      let слои = [], у = э;
      while (у && у !== document.documentElement) {
        const c = разбор(getComputedStyle(у).backgroundColor);
        if (c && c.a > 0) слои.push(c);
        у = у.parentElement;
      }
      слои.push({ r: 10, g: 10, b: 10, a: 1 });
      let ф = слои.pop();
      while (слои.length) ф = поверх(слои.pop(), ф);
      return ф;
    };
    const св = c => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const контраст = (т, ф) => {
      const a = св(т), b = св(ф);
      return ч((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
    };
    const мера = (э, подпись) => {
      if (!э) return { у: подпись, нет: true };
      const c = getComputedStyle(э), r = э.getBoundingClientRect();
      const ф = фонПод(э);
      const т = поверх(разбор(c.color), ф);
      return { у: подпись, кегль: ч(parseFloat(c.fontSize)), вес: c.fontWeight,
               мс: c.lineHeight === 'normal' ? 'NORMAL' : ч(parseFloat(c.lineHeight)),
               h: ч(r.height), w: ч(r.width), контраст: контраст(т, ф),
               знаков: (э.textContent || '').trim().length };
    };

    /* ТАБЛИЦ НА ВКЛАДКЕ ДВЕ: основа и лист ожидания. Первая редакция
       прибора считала строки ОДНОЙ и требовала восьми — порог падал на
       всех трёх видах, хотя в продукте 6 + 2. ПРИБОР СО СВОЕЙ ШКАЛОЙ —
       НЕ ПРИБОР: считать надо так, как рисует продукт. */
    /* У ПАРНОГО КОЛОНКИ «МЕСТО» НЕТ ВОВСЕ — цепляться за неё нельзя.
       Таблицу находим по строке с галочкой заявки: она есть у обеих
       веток. ЯКОРЬ ДЕРЖИТСЯ НА ТОМ, ЧТО ЕСТЬ ВСЕГДА. */
    const якорь = document.querySelector('.ad-reg-check');
    const табл = якорь ? якорь.closest('table') : null;
    if (!табл) return { беда: 'таблицы заявок нет' };
    const панель = табл.closest('.ad-brk-panel') || табл.parentElement;
    const всеТаблицы = [...панель.querySelectorAll('table')]
        .filter(т => т.querySelector('tbody tr'));
    const строкВсего = всеТаблицы.reduce((н, т) => н + т.querySelectorAll('tbody tr').length, 0);
    const стр = [...табл.querySelectorAll('tbody tr')];
    const ждёт = панель.querySelector('.ad-reg-row-reshenie');
    const долг = панель.querySelector('.ad-reg-row-dolg');
    const длинная = стр.map(r => ({ r, n: (r.children[4] ? r.children[4].textContent.trim().length : 0) }))
                       .sort((a, b) => b.n - a.n)[0];
    const к = стр[0].children;

    return {
      края: {
        строк: стр.length,
        таблиц: всеТаблицы.length,
        строкВсего: строкВсего,
        строкПоТаблицам: всеТаблицы.map(т => т.querySelectorAll('tbody tr').length),
        ждётРешения: панель.querySelectorAll('.ad-reg-row-reshenie').length,
        сДолгом: панель.querySelectorAll('.ad-reg-row-dolg').length,
        /* ПРИБОР СЛЕДУЕТ ЗА ПРОДУКТОМ. 03.10 плашка посева переехала с
           `.ad-badge-accent` на `.ad-reg-mark-seed` (компонент Badge), и
           порог упал на «плашки посева нет» — беда была в селекторе, не в
           экране. Ищем оба: старый на случай, если где-то остался. */
        посев: панель.querySelectorAll('.ad-reg-mark-seed, .ad-badge-accent').length,
        внешних: [...панель.querySelectorAll('td')].filter(t => /EXT|🇰🇿/.test(t.textContent)).length,
        местоЕсть: !!панель.querySelector('.ad-reg-mesto'),
        прочерковВМесте: [...панель.querySelectorAll('.ad-reg-mesto')]
                           .filter(t => /^[—-]$/.test(t.textContent.trim())).length,
        самоеДлинноеФИО: длинная ? длинная.n : 0
      },
      лестница: [
        мера(document.querySelector('.ad-tab.active'), 'вкладка раздела'),
        мера(табл.querySelector('thead th:nth-child(3)'), 'шапка колонки'),
        мера(к[2], 'место'), мера(к[3], 'категория'), мера(к[4], 'ФИО'),
        мера(к[к.length - 2], 'регистрация'),
        мера(панель.querySelector('.ad-reg-mark-seed, .ad-badge-accent'), 'плашка посева'),
        мера(панель.querySelector('.ad-reg-act-reshit'), 'кнопка «Решить»'),
        мера(панель.querySelector('.ad-btn-replace'), 'кнопка «Заменить»'),
        мера(панель.querySelector('.ad-reg-menu-btn'), 'кнопка «⋯»'),
        мера(панель.querySelector('.ad-btn'), 'кнопка полосы выгрузки'),
        ждёт ? мера(ждёт.children[4], 'ФИО в строке «ждёт решения»') : { у: 'ФИО в строке «ждёт решения»', нет: true },
        долг ? мера(долг.children[4], 'ФИО в строке «с долгом»') : { у: 'ФИО в строке «с долгом»', нет: true },
        длинная ? мера(длинная.r.children[4], 'самое длинное ФИО') : { у: 'самое длинное ФИО', нет: true }
      ],
      /* ПРОЧЕРК В КОЛОНКЕ «МЕСТО» — РЕШЕНИЕ 02.10 ГОВОРИТ, ЧТО ЕГО НЕ
         ДОЛЖНО БЫТЬ: место и категория стоят ВСЕГДА, прочерк только у
         того, кого нет нигде. Прибор нашёл 8 прочерков из 8. Прежде чем
         называть это бедой продукта, спрашиваем САМ ПРОДУКТ его же
         функцией и печатаем ВХОД: пол турнира, пол карточки, домашнюю
         категорию и очки. Беда может быть и в севе. */
      почемуПрочерк: (() => {
        const R = window.KSLT_RULES;
        const о = { правилаЕсть: !!R, вРейтингеЕсть: !!(R && R.вРейтинге),
                    рейтингКатегорииЕсть: !!(R && R.рейтингКатегории) };
        const я = document.querySelector('.ad-reg-mesto');
        о.чтоВЯчейке = я ? JSON.stringify(я.textContent.trim()) : 'ячейки нет';
        const к = я && я.parentElement ? я.parentElement.children[3] : null;
        о.чтоВКатегории = к ? JSON.stringify(к.textContent.trim()) : 'нет';
        return о;
      })(),
      геометрия: {
        высотыСтрок: [...new Set(стр.map(r => ч(r.getBoundingClientRect().height)))].sort((a, b) => a - b),
        ширинаТаблицы: ч(табл.getBoundingClientRect().width),
        /* КОЛОНОК СЧИТАЕМ ВИДИМЫХ. В разметке их семь всегда: на узком
           виде две скрыты медиа-правилом, а не удалены. */
        колонок: к.length,
        колонокВидимых: [...табл.querySelectorAll('thead th')]
            .filter(т => т.getBoundingClientRect().width > 0).length,
        /* СЛОЙ ЦЕЛИ 44 — ЧАСТЬ ОТВЕТА. В админке низкая кнопка законна,
           если у неё есть прозрачный слой ростом 44 (решение 29.09,
           admin.css:938). Прибор, не смотрящий на слой, обвиняет
           исправное — я на этом уже попался в макете. У `input` своих
           псевдоэлементов нет, слой живёт на обёртке. */
        целиНиже44: [...new Set([...панель.querySelectorAll('button, input[type=checkbox], a')]
          .map(b => {
            const h = Math.round(b.getBoundingClientRect().height);
            if (!(h > 0 && h < 44)) return null;
            const свой = parseFloat(getComputedStyle(b, '::after').height) || 0;
            const род = b.parentElement ? (parseFloat(getComputedStyle(b.parentElement, '::after').height) || 0) : 0;
            if (Math.max(свой, род) >= 44) return null;
            const кл = (b.className || '').toString().split(' ')[0] || b.type || b.tagName;
            return кл + ':' + h;
          }).filter(Boolean))],
        прокруткаВбок: (() => { const o = табл.closest('.ad-table-wrap, .ad-table-scroll');
          return o ? (o.scrollWidth > o.clientWidth + 1) : 'обёртки нет'; })(),
        страницаШире: document.documentElement.scrollWidth > window.innerWidth + 1
      }
    };
  });

  /* ПОРОГ: без крайних случаев замер ничего не доказывает */
  const к = м.края;
  const нет = [];
  if (т.имя === 'парный') {
    /* У парного свои края и свой счёт: четыре строки, девять колонок,
       «Места» и «Категории» нет вовсе — значит и порогов по ним нет. */
    if (к.строкВсего !== 4) нет.push('строк всего ' + к.строкВсего + ', а сев завёл 4');
    if (к.колонокВидимых < 5) нет.push('видимых колонок ' + к.колонокВидимых);
    if (!к.ждётРешения) нет.push('ни одной строки, ждущей решения');
  } else {
  if (к.строкВсего !== 8) нет.push('строк всего ' + к.строкВсего + ' (' +
      JSON.stringify(к.строкПоТаблицам) + '), а сев завёл 8: шесть в основе и двое в очереди');
  if (к.таблиц !== 2) нет.push('таблиц на вкладке ' + к.таблиц + ', а должно быть две — основа и лист ожидания');
  if (!к.ждётРешения) нет.push('ни одной строки, ждущей решения');
  if (!к.сДолгом) нет.push('ни одной строки с задолженностью');
  if (!к.посев) нет.push('плашки посева нет');
  if (!к.внешних) нет.push('внешнего участника нет');
  if (к.самоеДлинноеФИО < 30) нет.push('длинного ФИО нет (самое длинное ' + к.самоеДлинноеФИО + ' знаков)');
  }

  console.log('\n────────── ' + т.имя + ' · ' + в.имя + '  ' + в.w + '×' + в.h + ' ──────────');
  if (нет.length) {
    console.log('  ✗ ПОРОГ НЕ ПРОЙДЕН, замер не считается:');
    нет.forEach(с => console.log('      · ' + с));
    плохо++;
  }
  console.log('  края: ' + JSON.stringify(к));
  console.log('  почему прочерк: ' + JSON.stringify(м.почемуПрочерк));
  console.log('  уровень                        кегль/вес/межстрочный   высота  контраст  знаков');
  м.лестница.forEach(у => {
    if (у.нет) { console.log('    ' + у.у.padEnd(30) + ' НА ЭКРАНЕ НЕТ'); return; }
    const мимо = у.контраст < 4.5 ? '  ← МИМО AA' : '';
    console.log('    ' + у.у.padEnd(30) + ' ' +
      String(у.кегль + '/' + у.вес + '/' + у.мс).padEnd(22) +
      String(у.h).padEnd(8) + String(у.контраст).padEnd(10) + у.знаков + мимо);
  });
  console.log('  геометрия: ' + JSON.stringify(м.геометрия));

  /* ─────────── ОБХОД: НАЖАТЬ ВСЁ, НО НЕ ПИСАТЬ В БАЗУ ───────────
     Модалки ищутся нажатием — в списке элементов их нет. Кнопку, которая
     ПИШЕТ в базу, прибор не нажимает: он открывает окно, снимает его
     лестницу и закрывает Esc. Подтверждение разбирается чтением кода. */
  const окна = [
    { имя: 'Решить',    сел: '.ad-reg-act-reshit' },
    { имя: 'Заменить',  сел: '.ad-btn-replace' },
    { имя: '⋯',         сел: '.ad-reg-menu-btn' }
  ];
  for (const о of окна) {
    const есть = await page.locator(о.сел).first().count();
    if (!есть) { console.log('  обход · ' + о.имя + ': кнопки на экране нет'); continue; }
    await page.locator(о.сел).first().click();
    await page.waitForTimeout(700);   // слушатели окон навешиваются через 100мс
    const окно = await page.evaluate(() => {
      const ч = x => Math.round(x * 100) / 100;
      /* МЕНЮ «⋯» — ЭТО НЕ ОКНО. `.ad-reg-menu` — обёртка вокруг самой
         кнопки, она видна ВСЕГДА и всегда 34×28, а список лежит в
         `.ad-reg-menu-list` с `display:none` до класса `open`
         (admin.css:472). Первая редакция прибора мерила обёртку и
         показала пункты высотой 0 — я почти записал «меню не
         открывается». ПРИБОР, МЕРЯЮЩИЙ ОБЁРТКУ, НЕ МЕРИТ СОДЕРЖИМОЕ. */
      const м = [...document.querySelectorAll('.ad-confirm-modal, [class*=modal], .ad-reg-menu.open .ad-reg-menu-list')]
        .filter(э => э.getBoundingClientRect().width > 0);
      if (!м.length) return { открылось: false };
      const о = м[м.length - 1];
      const r = о.getBoundingClientRect();
      const кнопки = [...о.querySelectorAll('button')].map(b => ({
        т: (b.textContent || '').trim().slice(0, 22),
        h: Math.round(b.getBoundingClientRect().height)
      }));
      const уровни = [...о.querySelectorAll('h2,h3,h4,label,p,span,div')]
        .filter(э => э.children.length === 0 && (э.textContent || '').trim())
        .slice(0, 8).map(э => { const c = getComputedStyle(э);
          return ч(parseFloat(c.fontSize)) + '/' + c.fontWeight +
                 '/' + (c.lineHeight === 'normal' ? 'NORMAL' : ч(parseFloat(c.lineHeight))); });
      return { открылось: true, класс: о.className.slice(0, 40),
               ш: ч(r.width), в: ч(r.height), кнопок: кнопки.length, кнопки,
               уровниВнутри: [...new Set(уровни)],
               естьПоиск: !!о.querySelector('input[type=text], input[type=search]'),
               фокусВнутри: о.contains(document.activeElement) };
    });
    console.log('  обход · ' + о.имя + ': ' + JSON.stringify(окно));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    /* ПРОВЕРКА ЗАКРЫТИЯ СМОТРИТ НА ТО ЖЕ, ЧТО И ПРОВЕРКА ОТКРЫТИЯ.
       Первая редакция искала `.ad-reg-menu` — вечно видимую обёртку, — и
       отвечала «Esc не закрыл» всегда, даже когда окна уже не было.
       А Esc в продукте работает: слушатель стоит на document
       (utils.js:365). ПРОВЕРКА, СМОТРЯЩАЯ НЕ НА ТО, ЧТО ПРОВЕРЯЕТ,
       ОБВИНЯЕТ ИСПРАВНОЕ. */
    const закрылось = await page.evaluate(() =>
      ![...document.querySelectorAll('.ad-confirm-modal, [class*=modal], .ad-reg-menu.open .ad-reg-menu-list')]
        .some(э => э.getBoundingClientRect().width > 0));
    console.log('  обход · ' + о.имя + ': Esc закрыл — ' + закрылось +
      (о.имя === '⋯' ? ' (у меню Esc в коде не предусмотрен — закрывается кликом мимо, bracket.js:3858)' : ''));
    if (!закрылось) {   // меню закрываем кликом мимо, чтобы не мешало дальше
      await page.mouse.click(5, 5);
      await page.waitForTimeout(200);
    }
  }
  if (ошибки.length) console.log('  ошибки страницы: ' + ошибки.join(' | '));
  await ctx.close();
}
}

await browser.close();
if (свойСервер) свойСервер.kill();
console.log('\n' + (плохо ? '  ✗ видов с бедой: ' + плохо : '  ок — три вида сняты, пороги пройдены') + '\n');
сохранить();
process.exit(плохо ? 1 : 0);
