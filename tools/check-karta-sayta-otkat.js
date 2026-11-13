#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «КАРТА САЙТА». */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'karta-sayta-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    for (const ф of ['check-karta-sayta.js', 'sitemap.js']) {
        fs.copyFileSync(path.join(корень, 'tools/' + ф), path.join(двор, 'tools/' + ф));
    }
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: сторож читает ВСЕ страницы, карту
       и robots — везём их целиком, иначе падать будет не на том. */
    fs.mkdirSync(path.join(двор, 'pages'));
    for (const и of fs.readdirSync(корень).filter(и => и.endsWith('.html'))) {
        fs.copyFileSync(path.join(корень, и), path.join(двор, и));
    }
    for (const и of fs.readdirSync(path.join(корень, 'pages')).filter(и => и.endsWith('.html'))) {
        fs.copyFileSync(path.join(корень, 'pages', и), path.join(двор, 'pages', и));
    }
    for (const ф of ['sitemap.xml', 'robots.txt']) {
        fs.copyFileSync(path.join(корень, ф), path.join(двор, ф));
    }
    return двор;
}
const правка = (файл, было, стало, разОдин) => function (двор) {
    const п = path.join(двор, файл);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n < 1) return 'якорь не найден';
    if (разОдин && n > 1) return 'якорь встречается ' + n + ' раз';
    fs.writeFileSync(п, разОдин ? т.replace(было, стало) : т.split(было).join(стало));
};

const ОТКАТЫ = [
    { имя: 'у страницы пропал canonical',
      правка: правка('pages/about.html', '<link rel="canonical" href="https://tennis.kg/pages/about.html">', '', true),
      ждём: /есть canonical/ },

    { имя: 'canonical английской страницы указывает на русскую',
      правка: правка('pages/about-en.html',
          '<link rel="canonical" href="https://tennis.kg/pages/about-en.html">',
          '<link rel="canonical" href="https://tennis.kg/pages/about.html">', true),
      ждём: /ведёт на себя/ },

    { имя: 'у тройки языков пропал x-default',
      правка: правка('pages/about.html',
          '<link rel="alternate" hreflang="x-default" href="https://tennis.kg/pages/about.html">', '', true),
      ждём: /hreflang и x-default/ },

    { имя: 'кыргызский записан кодом страны kg',
      правка: правка('pages/about.html', 'hreflang="ky"', 'hreflang="kg"', true),
      ждём: /кодом языка ky/ },

    { имя: 'служебной странице вернули canonical',
      правка: правка('pages/admin-en.html', '<meta name="robots" content="noindex, nofollow">',
          '<meta name="robots" content="noindex, nofollow">\n    <link rel="canonical" href="https://tennis.kg/pages/admin.html">', true),
      ждём: /не носит canonical/ },

    { имя: 'карта сайта отстала от файлов',
      правка: правка('sitemap.xml', '<loc>https://tennis.kg/pages/about.html</loc>',
          '<loc>https://tennis.kg/pages/about-staryy.html</loc>', true),
      ждём: /не отстала/ },

    { имя: 'служебная страница попала в карту',
      правка(двор) {
          const п = path.join(двор, 'sitemap.xml');
          const т = fs.readFileSync(п, 'utf8');
          fs.writeFileSync(п, т.replace('</urlset>',
              '  <url>\n    <loc>https://tennis.kg/pages/admin.html</loc>\n  </url>\n</urlset>'));
      },
      ждём: /нет служебных страниц|не отстала/ },

    { имя: 'robots перестал закрывать служебную страницу',
      правка: правка('robots.txt', 'Disallow: /pages/dashboard.html\n', '', true),
      ждём: /закрывает ровно служебные/ },

    { имя: 'robots перестал называть карту сайта',
      правка: правка('robots.txt', 'Sitemap: https://tennis.kg/sitemap.xml', '# карта убрана', true),
      ждём: /называет карту сайта/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-karta-sayta.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n'));
}
console.log('прувер карты сайта: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);
