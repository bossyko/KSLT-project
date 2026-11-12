#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «ВИД ГРАФИКА». */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'grafik-vid-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-grafiki-vid.js'), path.join(двор, 'tools/check-grafiki-vid.js'));
    fs.mkdirSync(path.join(двор, 'js/admin/sections'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'pages'), { recursive: true });
    fs.copyFileSync(path.join(корень, 'js/kslt-grafik-vid.js'), path.join(двор, 'js/kslt-grafik-vid.js'));
    fs.copyFileSync(path.join(корень, 'js/admin/sections/analytics.js'), path.join(двор, 'js/admin/sections/analytics.js'));
    fs.copyFileSync(path.join(корень, 'pages/admin.html'), path.join(двор, 'pages/admin.html'));
    return двор;
}
const замена = (файл, было, стало) => function (двор) {
    const п = path.join(двор, файл);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n < 1) return 'якорь не найден';
    fs.writeFileSync(п, т.split(было).join(стало));
};

const ОТКАТЫ = [
    { имя: 'подписи значений сняты — числа только под мышью',
      правка: замена('js/admin/sections/analytics.js', 'plugins: [В.подписиЗначений]', 'plugins: []'),
      ждём: /числа на полосах рисуются/ },

    { имя: 'вернулась стопка — подпись ляжет на чужой сегмент',
      правка: замена('js/admin/sections/analytics.js', 'x: В.ось({})', 'x: В.ось({ стопкой: true })'),
      ждём: /полосы стоят рядом, а не стопкой/ },

    { имя: 'аналитика снова красит графики сама',
      правка: замена('js/admin/sections/analytics.js', "В.набор('Site', siteValues, 'site', { тонкая: true })",
          "{ label: 'Site', data: siteValues, backgroundColor: window.KSLT_KRASKA.цвет('--accent') }"),
      ждём: /краски графиков не задаются в аналитике на месте/ },

    { имя: 'дом переехал ПОСЛЕ зовущего',
      правка(двор) {
          const п = path.join(двор, 'pages/admin.html');
          const т = fs.readFileSync(п, 'utf8');
          const стр = '    <script src="../js/kslt-grafik-vid.js?v=1"></script>\n';
          if (т.split(стр).length - 1 !== 1) return 'якорь встречается не один раз';
          const без = т.replace(стр, '');
          fs.writeFileSync(п, без.replace('</body>', стр + '</body>'));
      },
      ждём: /дом подключён ДО аналитики/ },

    { имя: 'толщина полосы вернулась числом на месте',
      правка: замена('js/kslt-grafik-vid.js', 'barThickness: о.тонкая ? API.ПОЛОСА_МАЛАЯ : API.ПОЛОСА', 'barThickness: 40'),
      ждём: /толщина полосы — имя, а не число на месте/ },

    { имя: 'из дома пропала часть вида',
      правка: замена('js/kslt-grafik-vid.js', 'API.легенда =', 'API.легендаУбрана ='),
      ждём: /дом вида объявлен и полон/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-grafiki-vid.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер вида графика: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);
