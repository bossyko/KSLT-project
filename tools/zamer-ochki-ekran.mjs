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
      горизПрокрутка: document.documentElement.scrollWidth > document.documentElement.clientWidth
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
