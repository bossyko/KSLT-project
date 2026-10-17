/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА АДРЕСА САЙТА. На КОПИИ.
 *
 *   node tools/check-adres-sayta-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-adres-'));
['js', 'tools', 'supabase'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ФАЙЛЫ = ['js/supabase-config.js', 'js/dashboard.js', 'js/courts.js',
                'js/coaches.js', 'supabase/functions/send-email/index.ts'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-adres-sayta.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const C = 'js/supabase-config.js', D = 'js/dashboard.js',
      K = 'js/courts.js', T = 'js/coaches.js',
      E = 'supabase/functions/send-email/index.ts';

const ОТКАТЫ = [
    ['вписать адрес строкой в кабинете', D,
     'var baseUrl = window.KSLT_SAYT.адрес;',
     "var baseUrl = 'https://kslt.netlify.app';",
     'адрес сайта нигде не зашит строкой'],

    ['вернуть зашитый адрес в QR корта', K,
     "var verifyUrl = window.KSLT_SAYT.адрес + '/pages/verify'",
     "var verifyUrl = 'https://kslt.netlify.app/pages/verify'",
     'ваучер в `courts.js` берёт адрес из дома'],

    ['вернуть зашитую подпись на картинке у тренера', T,
     'ctx.fillText(window.KSLT_SAYT.подпись',
     "ctx.fillText('kslt.netlify.app'",
     'ваучер в `coaches.js` берёт адрес из дома'],

    ['снести дом адреса', C,
     'window.KSLT_SAYT = {',
     'window.KSLT_SAYT_СНЕСЁН = {',
     'дом адреса объявлен и отдаёт адрес браузера'],

    ['перестать брать адрес у браузера', C,
     'get адрес() { return window.location.origin; }',
     "get адрес() { return 'https://kslt.netlify.app'; }",
     'дом адреса объявлен и отдаёт адрес браузера'],

    ['убрать чтение окружения в письмах', E,
     "const SITE_URL = Deno.env.get('SITE_URL') || 'https://kslt.netlify.app'",
     "const SITE_URL = 'https://kslt.netlify.app'",
     'адрес сайта нигде не зашит строкой'],
];

console.log('');
if (прогон(null).упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let плохих = 0;
    ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
        const сколько = исходник[ф].split(что).length - 1;
        if (сколько !== 1) {
            console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return;
        }
        const р = прогон({ файл: ф, текст: исходник[ф].split(что).join(на) });
        if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
        else if (р.вывод.indexOf(ждём) === -1) {
            console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
        } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
    });
    прогон(null);
    fs.rmSync(песок, { recursive: true, force: true });
    console.log('');
    if (плохих === 0) {
        console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
        console.log('          оригиналы не трогались — работа шла на копии\n');
    } else {
        console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
        process.exitCode = 1;
    }
}
