import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
let OK = 0, BAD = 0;
const check = (имя, ок, что) => { if (ок) { console.log('  [+] ' + имя); OK++; } else { console.log('  [-] ' + имя + ' → ' + JSON.stringify(что)); BAD++; } };

for (const в of [{имя:'десктоп',w:1440,h:900},{имя:'телефон',w:390,h:844}]) {
  const p = await (await b.newContext({ viewport: { width: в.w, height: в.h } })).newPage();
  const ош = []; p.on('pageerror', e => ош.push(e.message));
  /* ВНЕШНИЙ ШРИФТ НЕ СЧИТАЕТСЯ ОШИБКОЙ ПРОДУКТА, И ПРИЧИНА НАЗВАНА.
     fonts.googleapis.com не пускает прокси МОЕЙ оболочки
     (ERR_TUNNEL_CONNECTION_FAILED); на машине Кости он грузится. Пропускаем
     ИМЕННО его, по адресу, а не все ошибки загрузки подряд. */
  p.on('requestfailed', r => {
    if (!r.url().startsWith('https://fonts.googleapis.com/')) {
      ош.push('не загрузилось: ' + r.url());
    }
  });
  p.on('console', m => {
    if (m.type() !== 'error') return;
    if (m.text().includes('Failed to load resource')) return;
    ош.push('console: ' + m.text());
  });
  await p.goto('file://' + process.cwd() + '/maket/proba-itogi-lig.html');
  await p.waitForTimeout(600);
  console.log('\n--- ' + в.имя + ' ' + в.w + ' ---');
  const м = await p.evaluate(() => {
    const q = (s, r = document) => [...r.querySelectorAll(s)];
    const лиги = document.getElementById('лиги');
    const много = document.getElementById('много');
    const обычно = document.getElementById('обычно');
    const видимых = t => q('tbody tr', t).filter(r => getComputedStyle(r).display !== 'none').length;
    return {
      таблицЛиг: q('.td-results-table', лиги).length,
      заголовкиЛиг: q('.td-results-title', лиги).map(e => e.textContent.trim()),
      очкиЛиг: q('.td-results-table', лиги).map(t => q('.td-res-pts', t).slice(1).map(e => e.textContent.trim())),
      кнопокВлигах: q('.td-more', лиги).length,
      многоВсего: q('tbody tr', много).length,
      многоВидно: видимых(много),
      кнопка: много.querySelector('.td-more') ? много.querySelector('.td-more').textContent.trim() : null,
      кнопкаВысота: много.querySelector('.td-more') ? Math.round(много.querySelector('.td-more').getBoundingClientRect().height) : null,
      обычноВидно: видимых(обычно),
      обычноКнопка: obычноБтн()
    };
    function obычноБтн(){ return !!document.getElementById('обычно').querySelector('.td-more'); }
  });
  check('в лигах три таблицы (PL, CL, вне лиг)', м.таблицЛиг === 3, м.таблицЛиг);
  check('заголовки лиг верные', JSON.stringify(м.заголовкиЛиг) === JSON.stringify(['Высшая лига','Утешительная лига','Итоги турнира']), м.заголовкиЛиг);
  check('верхняя лига платится своей таблицей', JSON.stringify(м.очкиЛиг[0]) === JSON.stringify(['360','215','150','130']), м.очкиЛиг[0]);
  check('нижняя лига — на ступень ниже', JSON.stringify(м.очкиЛиг[1]) === JSON.stringify(['215','130','90','77']), м.очкиЛиг[1]);
  check('у коротких лиг кнопки нет', м.кнопокВлигах === 0, м.кнопокВлигах);
  check('64 строки в разметке все', м.многоВсего === 64, м.многоВсего);
  check('видно восемь', м.многоВидно === 8, м.многоВидно);
  check('кнопка называет настоящее число', м.кнопка === 'Показать всех (64)', м.кнопка);
  check('высота кнопки 44', м.кнопкаВысота === 44, м.кнопкаВысота);
  check('у восьми строк кнопки нет', м.обычноКнопка === false, м.обычноКнопка);
  check('в обычной видно все восемь', м.обычноВидно === 8, м.обычноВидно);

  await p.click('#много .td-more');
  const после = await p.evaluate(() => {
    const t = document.querySelector('#много .td-results-table');
    return { видно: [...t.querySelectorAll('tbody tr')].filter(r => getComputedStyle(r).display !== 'none').length,
             кнопка: !!t.querySelector('.td-more') };
  });
  check('после нажатия видны все 64', после.видно === 64, после.видно);
  check('кнопка исчезла', после.кнопка === false, после.кнопка);
  check('ошибок страницы нет', ош.length === 0, ош.slice(0,2));
  await p.context().close();
}
await b.close();
console.log('\nИТОГ: прошло ' + OK + ', не прошло ' + BAD);
process.exit(BAD ? 1 : 0);
