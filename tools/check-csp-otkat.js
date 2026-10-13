/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ПОЛИТИКИ ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает.
 *
 * ПЕСОК ЗДЕСЬ БОЛЬШОЙ: правила читают ВСЕ страницы продукта и сборку,
 * поэтому в копию уезжают и они.
 *
 *   node tools/check-csp-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = [
    'tools/build-partials.js', 'js/kslt-video.js', 'js/kslt-lenta.js',
    ...fs.readdirSync(КОРЕНЬ).filter(ф => /^index.*\.html$/.test(ф)),
    ...fs.readdirSync(path.join(КОРЕНЬ, 'pages')).filter(ф => ф.endsWith('.html'))
        .map(ф => 'pages/' + ф)
];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const СБ = 'tools/build-partials.js';

/** Политика целиком у страницы — чтобы подменять её одной строкой. */
const политика = ф => (исходник[ф].match(/Content-Security-Policy"\s+content="([^"]*)"/) || [])[1];

const ОТКАТЫ = [

/* ── одно объявление ─────────────────────────────────────────────────── */

['убрать базу политики из сборки', СБ,
 'const CSP_БАЗА = {', 'const CSP_OSNOVA = {',
 'политика объявляется один раз и разносится сборкой'],

['убрать маркеры политики из сборки', СБ,
 "start: '<!-- CSP:START -->', end: '<!-- CSP:END -->',",
 "start: '<!-- CSP:NACHALO -->', end: '<!-- CSP:KONEC -->',",
 'у сборки есть маркеры политики и вставка туда, где её не было'],

['убрать вставку туда, где политики не было', СБ,
 'after: /[ \\t]*<meta name="viewport"[^>]*>\\n?/,',
 'posle: /[ \\t]*<meta name="viewport"[^>]*>\\n?/,',
 'у сборки есть маркеры политики и вставка туда, где её не было'],

['собрать политику готовой строкой вместо частей', СБ,
 "    const текст = Object.keys(политика)\n        .map(д => д + ' ' + политика[д].join(' '))\n        .join('; ') + ';';",
 "    const текст = \"default-src 'self';\";",
 'политика собирается из частей, а не лежит готовой строкой'],

/* ── каждая страница несёт политику ──────────────────────────────────── */

['снять политику со страницы входа', 'pages/auth.html',
 '<meta http-equiv="Content-Security-Policy"', '<meta name="csp-byla"',
 'каждая страница продукта несёт политику безопасности'],

['снять маркеры политики со страницы рейтинга', 'pages/players.html',
 '<!-- CSP:START -->', '<!-- CSP:BYLA -->',
 'политика на каждой странице стоит между маркерами сборки'],

/* ── три языка — одна политика ───────────────────────────────────────── */

['развести лендинг по языкам, как было до 13.10', 'index-en.html',
 политика('index-en.html'),
 политика('index-en.html') + ' frame-src https://www.youtube.com;',
 'три языка одной страницы несут одну политику'],

['дать заглушке админки политику русской админки', 'pages/admin-en.html',
 политика('pages/admin-en.html'),
 политика('pages/admin.html'),
 'у перенаправления английской админки своя, УЗКАЯ политика'],

/* ── разрешение там, где нужно ───────────────────────────────────────── */

['закрыть новостям ролики YouTube', 'pages/news.html',
 'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
 'frame-src https://www.youtube-nocookie.com',
 'есть разрешение там, где нужно: news.html · ролики новостей'],

['закрыть новостям Instagram', 'pages/news.html',
 'https://player.vimeo.com https://www.instagram.com;',
 'https://player.vimeo.com;',
 'есть разрешение там, где нужно: news.html · ролики новостей'],

['закрыть трансляции вебсокет', 'pages/live-match.html',
 'https://accounts.google.com wss://*.supabase.co',
 'https://accounts.google.com',
 'есть разрешение там, где нужно: live-match.html · счёт идёт по вебсокету'],

['закрыть табло вебсокет', 'pages/scoreboard.html',
 'https://accounts.google.com wss://*.supabase.co',
 'https://accounts.google.com',
 'есть разрешение там, где нужно: scoreboard.html · табло слушает тот же сокет'],

/* Якорь держится за cdnjs: он есть в script-src и нет в connect-src, иначе
   строка «accounts.google.com challenges.cloudflare.com» встречается дважды. */
['закрыть входу скрипт Turnstile', 'pages/auth.html',
 'cdnjs.cloudflare.com https://accounts.google.com https://challenges.cloudflare.com;',
 'cdnjs.cloudflare.com https://accounts.google.com;',
 'есть разрешение там, где нужно: auth.html · Turnstile на входе'],

['закрыть входу кадр Turnstile', 'pages/auth.html',
 'frame-src https://challenges.cloudflare.com;', 'frame-src https://maps.google.com;',
 'есть разрешение там, где нужно: auth.html · Turnstile рисует кадр'],

['закрыть карточке корта карту', 'pages/court.html',
 'frame-src https://maps.google.com https://www.google.com;', 'frame-src https://www.google.com;',
 'есть разрешение там, где нужно: court.html · карта корта'],

['закрыть админке выгрузку в Excel', 'pages/admin.html',
 'https://accounts.google.com https://cdn.sheetjs.com;', 'https://accounts.google.com;',
 'есть разрешение там, где нужно: admin.html · выгрузка в Excel'],

/* ── нет лишнего ─────────────────────────────────────────────────────── */

['вернуть лендингу кадр YouTube, которого там нет', 'index.html',
 'media-src \'self\';', 'media-src \'self\'; frame-src https://www.youtube.com;',
 'нет лишнего разрешения: index.html · frame-src'],

['вернуть лендингу вебсокет, которого он не открывает', 'index.html',
 'https://*.supabase.co https://accounts.google.com;',
 'https://*.supabase.co wss://*.supabase.co https://accounts.google.com;',
 'нет лишнего разрешения: index.html · connect-src'],

['вернуть входу кадр Google', 'pages/auth.html',
 'frame-src https://challenges.cloudflare.com;',
 'frame-src https://challenges.cloudflare.com https://accounts.google.com;',
 'нет лишнего разрешения: auth.html · frame-src'],

['вернуть заглушке админки выгрузку в Excel', 'pages/admin-en.html',
 'cdnjs.cloudflare.com https://accounts.google.com;',
 'cdnjs.cloudflare.com https://accounts.google.com https://cdn.sheetjs.com;',
 'нет лишнего разрешения: admin-en.html · script-src'],

['завести кадры на странице рейтинга', 'pages/players.html',
 'media-src \'self\';', 'media-src \'self\'; frame-src https://example.com;',
 'нет лишнего разрешения: players.html · frame-src'],

/* ── база ────────────────────────────────────────────────────────────── */

['развести основание политики', 'pages/courts.html',
 "default-src 'self';", "default-src 'self' https:;",
 'у всех страниц один и тот же default-src'],

['разрешить свой кадр', 'pages/news.html',
 'frame-src https://www.youtube.com', "frame-src 'self' https://www.youtube.com",
 'своего кадра продукт не делает, и `self` в кадрах не нужен']

];

/* ── Песок ───────────────────────────────────────────────────────────── */

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-csp-'));
['js', 'tools', 'pages'].forEach(д => fs.mkdirSync(path.join(песок, д), { recursive: true }));
fs.copyFileSync(path.join(__dirname, 'check-csp.js'), path.join(песок, 'tools', 'check-csp.js'));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-csp.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-csp.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)   { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
