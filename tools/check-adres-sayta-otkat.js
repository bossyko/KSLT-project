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
/* `pages` добавлена 06.11: в песочнице должен лежать и документ,
   иначе откату нечего портить. */
['js', 'tools', 'supabase', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ФАЙЛЫ = ['js/supabase-config.js', 'js/dashboard.js', 'js/courts.js',
                'js/coaches.js', 'js/kslt-vaucher-kartochka.js',
                /* ДОБАВЛЕН 26.10: сюда переехала ссылка проверки ваучера —
                   её унёс кусок 145, а откат остался на `courts.js`. */
                'js/kslt-vaucher-blok.js',
                'supabase/functions/send-email/index.ts',
                /* ДОБАВЛЕН 06.11: правило «в документах адрес без `www`»
                   стережёт оферту, и откат должен иметь что портить. */
                'pages/offer.html',
                /* ДОБАВЛЕН 07.11: правилу «метатег ведёт на нынешний дом»
                   нужна страница с метатегами, чтобы откат имел что портить. */
                'index.html',
                /* ДОБАВЛЕН 07.11 вместе с десятым откатом: правило «на
                   удалённый сайт нет ссылки» стережёт описание продукта.
                   Внести файл в песочницу я сперва забыл, и прувер упал
                   на `undefined.split` — ОТКАТУ НЕЧЕГО БЫЛО ПОРТИТЬ. */
                'README.md'];
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
      ВК = 'js/kslt-vaucher-kartochka.js',
      E = 'supabase/functions/send-email/index.ts';

const ОТКАТЫ = [
    ['вписать адрес строкой в кабинете', D,
     'var baseUrl = window.KSLT_SAYT.адрес;',
     "var baseUrl = 'https://kslt.netlify.app';",
     'адрес сайта нигде не зашит строкой'],

    /* ЯКОРЬ ПЕРЕЕХАЛ 26.10, И ЭТО ДОЛГ СТАРШЕ МОЕЙ ПРАВКИ. Откат стоял на
       `js/courts.js` со строкой `var verifyUrl = …`, но ссылку QR унёс
       КУСОК 145 («ваучерный блок один на продукт»): `KSLT_SAYT` в
       `courts.js` не осталось вовсе, и откат одиннадцать дней копировал
       текст, которого в файле нет, — «якорь встречается 0 раз». Переведён
       туда, где ссылка живёт теперь. ЯКОРЬ, ПОТЕРЯВШИЙ СОДЕРЖИМОЕ, НЕ
       ПАДАЕТ КРАСНЫМ САМ — ОН ПРОСТО ПЕРЕСТАЁТ ПРОВЕРЯТЬ. */
    ['вернуть зашитый адрес в ссылку проверки ваучера', 'js/kslt-vaucher-blok.js',
     "return window.KSLT_SAYT.адрес + '/pages/verify'",
     "return 'https://kslt.netlify.app/pages/verify'",
     'адрес сайта нигде не зашит строкой'],

    /* ПОДПИСЬ ПЕРЕЕХАЛА В ДОМ КАРТОЧКИ (круг 18, 19.10): рисование сведено
       в одно место, и в трёх прежних её больше нет. Откат идёт туда, где
       подпись живёт теперь. */
    ['вернуть зашитую подпись на картинке', ВК,
     'ctx.fillText(window.KSLT_SAYT.подпись',
     "ctx.fillText('kslt.netlify.app'",
     'подпись на картинке берёт адрес из дома'],

    ['снести дом адреса', C,
     'window.KSLT_SAYT = {',
     'window.KSLT_SAYT_СНЕСЁН = {',
     'дом адреса объявлен и отдаёт адрес браузера'],

    ['перестать брать адрес у браузера', C,
     'get адрес() { return window.location.origin; }',
     "get адрес() { return 'https://kslt.netlify.app'; }",
     'дом адреса объявлен и отдаёт адрес браузера'],

    /* ЯКОРЬ ОБНОВЛЁН 06.11 ВМЕСТЕ С ПРАВКОЙ. Запасное значение в
       одиннадцати функциях переведено с `kslt.netlify.app` на
       `tennis.kg`, и прежний якорь перестал встречаться — прувер
       показал «якорь встречается 0 раз», то есть откат одиннадцать
       строк ничего не проверял бы молча. */
    ['убрать чтение окружения в письмах', E,
     "const SITE_URL = Deno.env.get('SITE_URL') || 'https://tennis.kg'",
     "const SITE_URL = 'https://tennis.kg'",
     'адрес сайта нигде не зашит строкой'],
    /* ВОСЬМОЙ ОТКАТ, 06.11: адрес в документе снова с `www`. Оферту и
       политику печатают и подписывают — адрес, которым сайт не
       отвечает, переживёт сам себя. */
    ['вернуть `www` в адрес оферты', 'pages/offer.html',
     'на сайте организатора по адресу: tennis.kg',
     'на сайте организатора по адресу: www.tennis.kg',
     'в документах адрес сайта написан без `www` и без `new`'],

    /* ДЕВЯТЫЙ ОТКАТ, 07.11: прежний дом в метатеге предпросмотра. Это и
       лежало в 94 страницах — 188 ссылок на `bossyko.github.io`, по
       которым предпросмотр в мессенджере и выдача поиска вели на вторую
       живую копию продукта, работающую с той же базой. Сторож их не
       видел: про этот адрес ему не сказали. */
    ['вернуть прежний дом в og:url главной', 'index.html',
     '<meta property="og:url" content="https://tennis.kg/index.html">',
     '<meta property="og:url" content="https://bossyko.github.io/KSLT-project/index.html">',
     'метатег предпросмотра ведёт на нынешний дом, а не на прежний'],

    /* ДЕСЯТЫЙ ОТКАТ, 07.11: сайт на Netlify удалён, и ссылка на него
       ведёт в пустоту, а при занятом поддомене — на чужую страницу.
       Откат возвращает ровно то, что лежало в README одиннадцать
       месяцев: «Live Demo» со ссылкой на удалённый адрес. */
    ['вернуть ссылку на удалённый сайт в README', 'README.md',
     '[tennis.kg](https://tennis.kg)',
     '[kslt.netlify.app](https://kslt.netlify.app)',
     'на удалённый сайт нет ни одной ссылки, по которой можно уйти'],
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
