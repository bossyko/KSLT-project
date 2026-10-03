/**
 * ЗАМЕР ЭКРАНА РЕЙТИНГОВЫХ ОЧКОВ.
 *
 * ПОСТОЯННОЕ УСЛОВИЕ КОСТИ, ДЕЙСТВУЕТ НА ВСЮ АДМИНКУ:
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ. ТЕЛЕФОНА У АДМИНКИ НЕТ. ТОЛЬКО РУССКИЙ.
 *
 * Поэтому видов здесь ТРИ, и четвёртый сюда не добавляется. 03.10 я снял
 * замер на пяти, включая телефон 390, и пошёл чинить найденное на телефоне.
 * Костя: «телефон не берём для админки», «АДМИНКА НЕТ ТЕЛЕФОНА».
 * Правило, выведенное на одном куске, применяется к следующему БЕЗ НОВОГО
 * РАЗБОРА — а я применил его заново и неверно.
 *
 * КОНТРАСТ СЧИТАЕТСЯ ПО СОСТАВЛЕННОМУ ЦВЕТУ, А НЕ ПО ЗАЯВЛЕННОМУ. Цвета
 * продукта полупрозрачные: `--text-secondary` это `rgba(255,255,255,0.72)`.
 * Прибор, взявший 255 за белый, даёт 18.88 вместо 9.86 — и показывает
 * благополучие там, где его надо проверять. Альфа накладывается на фон.
 *
 *   node tools/zamer-ochki-ekran.mjs
 *   CHROME=/путь/к/chrome node tools/zamer-ochki-ekran.mjs
 */
import { chromium } from '@playwright/test';

const виды = [
  { имя: 'десктоп',            w: 1440, h: 900 },
  { имя: 'планшет лежа',       w: 1024, h: 768 },
  { имя: 'планшет стоя',       w: 820,  h: 1180 }
];

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
let плохо = 0;

for (const в of виды) {
  const ctx = await browser.newContext({ viewport: { width: в.w, height: в.h } });
  const page = await ctx.newPage();
  const ошибки = [];
  page.on('console', m => { if (m.type() === 'error') ошибки.push(m.text()); });
  page.on('pageerror', e => ошибки.push('pageerror: ' + e.message));
  await page.goto('file://' + (process.env.KSLT || process.cwd()) + '/maket/ochki-ekran.html');
  await page.waitForSelector('#tblAdmin tbody tr');

  const м = await page.evaluate(() => {
    const ч = s => Math.round(parseFloat(s) * 100) / 100;
    const строки = document.querySelectorAll('#tblAdmin tbody tr:not(.ad-pts-sep)');
    const поле   = document.querySelector('#tblAdmin .ad-pts-in');
    const ячейка = document.querySelector('#tblAdmin tbody tr:nth-child(10) td:nth-child(2)');
    const шапка  = document.querySelector('#tblAdmin th');
    const место  = document.querySelector('#tblAdmin .ad-pts-place');
    const мен    = document.querySelector('#tblManager .ad-pts-in');
    const cs = e => getComputedStyle(e);
    const h = e => ч(e.getBoundingClientRect().height);
    const w = e => ч(e.getBoundingClientRect().width);
    return {
      строк: строки.length,
      полей: document.querySelectorAll('#tblAdmin .ad-pts-in').length,
      прочерков: document.querySelectorAll('#tblAdmin .ad-pts-off').length,
      отбито: document.querySelectorAll('#tblAdmin tr.ad-pts-tbl').length,
      высотаСтроки: h(ячейка.parentElement),
      высотаЯчейки: h(ячейка),
      поле: { в: h(поле), ш: w(поле), кегль: cs(поле).fontSize, вес: cs(поле).fontWeight },
      шапка: { в: h(шапка), кегль: cs(шапка).fontSize, цвет: cs(шапка).color },
      место: { кегль: cs(место).fontSize, цвет: cs(место).color },
      менеджерЧитает: мен.hasAttribute('readonly'),
      менеджерРамка: cs(мен).borderTopColor,
      кнопокУМенеджера: document.querySelectorAll('#tblManager').length
        ? document.querySelectorAll('.ad-table-card:has(#tblManager) .ad-btn').length : -1,
      липкаяШапка: cs(шапка).position,
      липкоеМесто: cs(место).position,
      горизПрокрутка: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      лестница: (function () {
        const отн = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        const разбор = s => { const n = (s.match(/[\d.]+/g) || []).map(Number);
            return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 }; };
        const непрозрачный = э => { let у = э;
            while (у) { const ц = разбор(getComputedStyle(у).backgroundColor);
                if (ц.a >= 0.999) return ц; у = у.parentElement; }
            return { r: 10, g: 10, b: 10, a: 1 }; };
        /* Полупрозрачное НАКЛАДЫВАЕТСЯ на фон, а не выдаётся за свой цвет */
        const поверх = (ц, фон) => ({
            r: ц.a * ц.r + (1 - ц.a) * фон.r,
            g: ц.a * ц.g + (1 - ц.a) * фон.g,
            b: ц.a * ц.b + (1 - ц.a) * фон.b });
        const св = ц => 0.2126 * отн(ц.r) + 0.7152 * отн(ц.g) + 0.0722 * отн(ц.b);
        const контраст = э => {
            const фон = непрозрачный(э);
            let слой = фон, у = э;
            while (у) { const ц = разбор(getComputedStyle(у).backgroundColor);
                if (ц.a >= 0.999) break;
                if (ц.a > 0) слой = поверх(ц, слой);
                у = у.parentElement; }
            const т = поверх(разбор(getComputedStyle(э).color), слой);
            const a = св(т), b = св(слой);
            return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100; };

        const уровни = [
          ['шапка столбца',   '#tblAdmin thead th:nth-child(2)'],
          ['номер места',     '#tblAdmin tbody tr:nth-child(10) .ad-pts-place'],
          ['место 1-4',       '#tblAdmin tr.ad-pts-tbl .ad-pts-place'],
          ['значение в поле', '#tblAdmin .ad-pts-in'],
          /* `значение, ноль` из лестницы убран 03.10: предел мест снял с
             экрана все нулевые строки итогового, и уровня больше нет.
             Уровень, которого нет, прибор обязан не искать, а не прощать. */
          ['плашка',          '.ad-pts-band-text'],
          ['кто правит',      '.ad-pts-who'],
          ['версия в силе',   '.ad-pts-ver'],
          ['подпись блока',   '.st-tag'],
          ['заголовок блока', '.st-h2'],
          ['текст диалога',   '.st-dialog-text'],
          ['отказ с числами', '.st-toast-bad']
        ];
        return уровни.map(([имя, сел]) => {
          const э = document.querySelector(сел);
          if (!э) return { имя, нет: true };
          const s = getComputedStyle(э);
          return { имя, кегль: s.fontSize, вес: s.fontWeight,
                   межстрочный: s.lineHeight, цвет: s.color,
                   контраст: контраст(э),
                   знаков: (э.textContent || '').trim().length };
        });
      })()
    };
  });

  console.log(`\n--- ${в.имя} ${в.w}×${в.h} ---`);
  console.log(`  строк ${м.строк} · полей ${м.полей} · прочерков ${м.прочерков} · отбито первых ${м.отбито}`);
  console.log(`  строка ${м.высотаСтроки} · ячейка ${м.высотаЯчейки}`);
  console.log(`  поле ${м.поле.в}×${м.поле.ш}, кегль ${м.поле.кегль}, вес ${м.поле.вес}`);
  console.log(`  шапка ${м.шапка.в}, кегль ${м.шапка.кегль}, цвет ${м.шапка.цвет}, position ${м.липкаяШапка}`);
  console.log(`  место кегль ${м.место.кегль}, position ${м.липкоеМесто}`);
  console.log(`  менеджер: readonly ${м.менеджерЧитает}, рамка ${м.менеджерРамка}, кнопок ${м.кнопокУМенеджера}`);
  console.log(`  горизонтальная прокрутка страницы: ${м.горизПрокрутка}`);
  if (м.горизПрокрутка) плохо++;
  console.log('  ЛЕСТНИЦА ТЕКСТА (контраст по составленному цвету):');
  for (const у of м.лестница) {
    if (у.нет) { console.log(`    [-] ${у.имя}: нет на странице`); плохо++; continue; }
    const мало = у.контраст < 4.5 ? '  <- НИЖЕ 4.5' : '';
    console.log(`    ${у.имя.padEnd(16)} ${String(у.кегль).padStart(5)} / вес ${у.вес} / ` +
                `${String(у.межстрочный).padStart(7)} / контраст ${String(у.контраст).padStart(6)}${мало}`);
  }
  if (ошибки.length) { console.log('  ОШИБКИ:', ошибки.slice(0,3)); плохо++; }

  const ждём = [
    ['строк 64', м.строк === 64],
    ['полей 264', м.полей === 264],
    ['прочерков 56', м.прочерков === 56],
    ['отбито 4', м.отбито === 4],
    ['строка 36', м.высотаСтроки === 36],
    ['поле 28', м.поле.в === 28],
    ['поле 64 шириной', м.поле.ш === 64],
    ['кегль значения 14', м.поле.кегль === '14px'],
    ['вес значения 600', м.поле.вес === '600'],
    ['шапка липкая', м.липкаяШапка === 'sticky'],
    ['место липкое', м.липкоеМесто === 'sticky'],
    ['менеджер только читает', м.менеджерЧитает === true],
    ['без горизонтальной прокрутки', м.горизПрокрутка === false]
  ];
  ждём.forEach(([имя, ок]) => { if (!ок) { console.log(`  [-] ${имя}`); плохо++; } });
  await ctx.close();
}
await browser.close();
console.log(плохо === 0 ? '\nВСЁ СОШЛОСЬ' : `\nНЕ СОШЛОСЬ: ${плохо}`);
process.exit(плохо === 0 ? 0 : 1);
