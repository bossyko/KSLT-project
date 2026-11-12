/**
 * ПРУВЕР СТОРОЖА СОСТАВА ПО ЯЗЫКАМ.
 *
 * Первый откат — настоящая чёрная дыра 21.09: <div class="hero-video-bg">
 * с роликом, который стоял только на кыргызской главной. Остальные —
 * те же расхождения с других сторон.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
const ФАЙЛЫ = ['tools/check-sostav-yazykov.js', 'index.html', 'index-en.html', 'index-kg.html'];

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'sostav-'));
    for (const ф of ФАЙЛЫ) {
        const к = path.join(двор, ф);
        fs.mkdirSync(path.dirname(к), { recursive: true });
        fs.copyFileSync(path.join(корень, ф), к);
    }
    return двор;
}

const ОТКАТЫ = [
    {
        имя: 'видео-фон вернулся на кыргызскую главную',
        правка(двор) {
            const п = path.join(двор, 'index-kg.html');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.search(/<section[^>]*class="hero[^"]*"[^>]*>/);
            if (i < 0) return 'героя нет';
            const j = т.indexOf('>', i) + 1;
            fs.writeFileSync(п, т.slice(0, j) +
                '\n<div class="hero-video-bg"><video autoplay muted loop><source src="https://assets.mixkit.co/x.mp4"></video></div>\n' +
                т.slice(j));
        },
        ждём: /вернулся класс hero-video|вернулся <video>/,
    },
    {
        имя: 'на английской пропала секция',
        /* ЯКОРЬ ПРОВЕРЯЕТСЯ, А НЕ ПРЕДПОЛАГАЕТСЯ: первая редакция искала
           `<section class="section-venues"`, а в разметке стоит
           `<section id="venues" class="section-venues">` — замена молча не
           происходила, и прувер показывал «сторож не упал», хотя откат не
           состоялся. ОТКАТ, КОТОРЫЙ НЕ СОСТОЯЛСЯ, НИЧЕГО НЕ ДОКАЗЫВАЕТ. */
        правка(двор) {
            const п = path.join(двор, 'index-en.html');
            const т = fs.readFileSync(п, 'utf8');
            const м = т.match(/<section[^>]*class="section-venues[^"]*"[^>]*>/);
            if (!м) return 'секции section-venues нет в разметке';
            fs.writeFileSync(п, т.replace(м[0], м[0].replace('<section', '<div')));
        },
        ждём: /состав секций разошёлся/,
    },
    {
        имя: 'герой кыргызской сложен иначе',
        правка(двор) {
            const п = path.join(двор, 'index-kg.html');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.search(/<section[^>]*class="hero[^"]*"[^>]*>/);
            const j = т.indexOf('>', i) + 1;
            fs.writeFileSync(п, т.slice(0, j) + '\n<div class="hero-lishnii-blok"><p>x</p></div>\n' + т.slice(j));
        },
        ждём: /герой сложен иначе/,
    },
    {
        имя: 'видео появилось на русской',
        правка(двор) {
            const п = path.join(двор, 'index.html');
            const т = fs.readFileSync(п, 'utf8');
            fs.writeFileSync(п, т.replace('</body>', '<video src="x.mp4"></video></body>'));
        },
        ждём: /вернулся <video>/,
    },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error(`  ✗ ${о.имя}: ${беда}`); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-sostav-yazykov.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер состава по языкам: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);
