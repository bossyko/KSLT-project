#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ПОЗДРАВЛЕНИЯ (шаг A3.7б, 29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ОТКАТЫ = [
    { имя: 'дом снесён', ждём: 'дом объявлен',
      файл: 'js/kslt-pozdravlenie.js',
      было: '    API.карточка = function (значок, осталось, слова, шарики) {',
      станет: '    API.карточкаОткл = function (значок, осталось, слова, шарики) {' },
    { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
      файл: 'mobile/www/js/kslt-pozdravlenie.js',
      было: '    API.ШАРИКОВ = 24;',
      станет: '    API.ШАРИКОВ = 22;' },
    { имя: 'ЗНАЧОК СНОВА СЫРОЙ', ждём: 'ЗНАЧОК ЭКРАНИРОВАН В ДОМЕ',
      файл: 'js/kslt-pozdravlenie.js',
      было: "экр(значок.icon || '🏅')",
      станет: "(значок.icon || '🏅')" },
    { имя: 'отбор непоказанных убран', ждём: 'очередь отбирает непоказанные и сортирует',
      файл: 'js/kslt-pozdravlenie.js',
      было: "            .is('seen_at', null)",
      станет: '' },
    { имя: 'отметка о показе убрана', ждём: 'отметка ставится сразу, а не после просмотра',
      файл: 'js/kslt-pozdravlenie.js',
      было: "client.rpc('mark_badges_seen')",
      станет: 'Promise.resolve({})' },
    { имя: 'ошибку чтения стали глотать', ждём: 'ошибку чтения дом не глотает',
      файл: 'js/kslt-pozdravlenie.js',
      было: "console.error('[KSLT] достижения не проверены:',",
      станет: "void (" },
    { имя: 'число шариков убрано из дома', ждём: 'число шариков — одно на оба продукта',
      файл: 'js/kslt-pozdravlenie.js',
      было: '    API.ШАРИКОВ = 24;',
      станет: '    var ШАРИКОВ_СВОЙ = 24;' },
    { имя: 'сайт снова читает достижения сам',
      ждём: 'у сайта нет своего чтения достижений',
      файл: 'js/badge-celebration.js',
      было: '            queue = await KSLT_POZDRAVLENIE.очередь(client, prof.data.player_id);',
      станет: "            queue = (await client.from('player_badges').select('*')).data || [];" },
    { имя: 'приложение снова рисует карточку само',
      ждём: 'у приложения нет своей разметки карточки',
      файл: 'mobile/www/js/badge-celebration.js',
      было: "      window.KSLT_POZDRAVLENIE.карточка(b, left,",
      станет: "      '<div class=\"ach-emoji\">' + b.icon + '</div>' + window.KSLT_POZDRAVLENIE.карточка(b, left," },
    { имя: 'приложение перестало звать дом',
      ждём: 'у приложения дом зовётся',
      файл: 'mobile/www/js/badge-celebration.js',
      было: 'KSLT_POZDRAVLENIE',
      станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },
    { имя: 'кабинет грузит поздравление без дома',
      ждём: 'дом подключён: pages/dashboard.html',
      файл: 'pages/dashboard.html',
      было: '<script src="../js/kslt-pozdravlenie.js?v=1"></script>',
      станет: '' },
    /* ТОТ САМЫЙ СЛУЧАЙ, РАДИ КОТОРОГО ПРАВИЛО ПЕРЕПИСАНО НА ПОИСК:
       главная сайта. Со старым списком из двух разметок этот откат
       не ронял ничего — беда жила в продукте, а сторож был зелёный. */
    { имя: 'ГЛАВНАЯ грузит поздравление без дома (беда h290)',
      ждём: 'дом подключён: index.html',
      файл: 'index.html',
      было: '<script src="js/kslt-pozdravlenie.js?v=1"></script>\n    ',
      станет: '' },
    { имя: 'главная на кыргызском — то же самое',
      ждём: 'дом подключён: index-kg.html',
      файл: 'index-kg.html',
      было: '<script src="js/kslt-pozdravlenie.js?v=1"></script>\n    ',
      станет: '' },
    { имя: 'дом поставлен ПОСЛЕ зовущего (приложение)',
      ждём: 'дом грузится ДО зовущего: mobile/www/index.html',
      файл: 'mobile/www/index.html',
      было: '<script src="js/kslt-pozdravlenie.js?v=1"></script>\n',
      станет: '' },
    { имя: 'на главной дом переехал ПОСЛЕ зовущего',
      ждём: 'дом грузится ДО зовущего: index.html',
      файл: 'index.html',
      было: '<script src="js/kslt-pozdravlenie.js?v=1"></script>\n    <script src="js/badge-celebration.js?v=7"></script>',
      станет: '<script src="js/badge-celebration.js?v=7"></script>\n    <script src="js/kslt-pozdravlenie.js?v=1"></script>' }
];
function копия() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-pozdr-'));
    for (const отн of ['js', 'mobile/www', 'pages', 'tools'])
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: сторож с 12.11 обходит разметки
       сам, и главные страницы сайта лежат в корне. Без них откаты про
       главную падали на «файла нет», а не на своём правиле. */
    for (const ф of fs.readdirSync(КОРЕНЬ))
        if (ф.endsWith('.html')) fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(куда, ф));
    return куда;
}
function прогон(к) {
    try { return execFileSync('node', [path.join(к, 'tools/check-pozdravlenie.js')],
        { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
    catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ПОЗДРАВЛЕНИЕ\n');
let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия(); const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const n = было.split(о.было).length - 1;
    if (n === 0 || (!о.всеВхождения && n !== 1)) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + n + ' РАЗ');
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    fs.writeFileSync(п, о.всеВхождения ? было.split(о.было).join(о.станет)
                                       : было.replace(о.было, о.станет));
    const в = прогон(к);
    if (в.includes('✗ ' + о.ждём)) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    fs.rmSync(к, { recursive: true, force: true });
}
console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }
