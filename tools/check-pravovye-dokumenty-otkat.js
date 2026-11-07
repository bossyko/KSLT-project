/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПОЛИТИКИ (06.11.2026). На КОПИИ.
 *   node tools/check-politika-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее состояние и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Часть откатов повторяет беды, которые и правда случились:
 * редакции разошлись по числу пунктов, адрес разработчиков стоял в
 * публичном документе, страницу правили мимо источника.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-dokumenty-'));
['pages', 'tools', 'sql'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const RU  = 'tools/dokumenty/politika-ru.html',
      EN  = 'tools/dokumenty/politika-en.html',
      KG  = 'tools/dokumenty/politika-kg.html',
      СТР = 'pages/privacy-policy.html',
      СОГЛ_RU = 'tools/dokumenty/soglashenie-ru.html',
      СОГЛ_KG = 'tools/dokumenty/soglashenie-kg.html',
      /* ИМЯ ФАЙЛА ПЕРЕНОСА — ДАТА РЕДАКЦИИ, и зашивать его здесь значит
         ломать откат при каждой новой редакции. Берётся самый свежий,
         как и в самом стороже. */
      SQL = (function () {
          const д = path.join(КОРЕНЬ, 'sql', 'схема');
          const е = fs.readdirSync(д)
              .filter(и => /^dokumenty-perenos-v-bazu-.*\.sql$/.test(и)).sort();
          if (!е.length) throw new Error('нет файла переноса документов');
          return 'sql/схема/' + е[е.length - 1];
      })();

const ФАЙЛЫ = [RU, EN, KG, СТР, 'pages/privacy-policy-en.html', 'pages/privacy-policy-kg.html', SQL,
    СОГЛ_RU, 'tools/dokumenty/soglashenie-en.html', СОГЛ_KG,
    'pages/terms.html', 'pages/terms-en.html', 'pages/terms-kg.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => {
    const п = path.join(КОРЕНЬ, ф);
    исходник[ф] = fs.existsSync(п) ? fs.readFileSync(п, 'utf8') : null;
});

/** Правка: [файл, что, на что] либо ['УДАЛИТЬ', файл] либо null. */
function прогон(правка) {
    ФАЙЛЫ.forEach(ф => {
        const цель = path.join(песок, ф);
        if (исходник[ф] === null) return;
        if (правка && правка[0] === 'УДАЛИТЬ' && правка[1] === ф) {
            if (fs.existsSync(цель)) fs.rmSync(цель);
            return;
        }
        let т = исходник[ф];
        if (правка && правка[0] === ф) {
            /* ПОРЯДОК ПРОВЕРОК ВАЖЕН: `includes` бросает на выражении
               с образцом, и при обратном порядке откат падал не на
               своём правиле, а на этой строке. Поймал сам прувер. */
            const естьЧтоПравить = правка[1] instanceof RegExp
                ? правка[1].test(т)
                : т.includes(правка[1]);
            if (!естьЧтоПравить) {
                throw new Error('откат не нашёл в ' + ф + ': ' + правка[1]);
            }
            т = т.replace(правка[1], правка[2]);
        }
        fs.mkdirSync(path.dirname(цель), { recursive: true });
        fs.writeFileSync(цель, т);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-pravovye-dokumenty.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['убрать раздел «Дети» из кыргызской редакции',
     [KG, /<details class="ip-doc-fold ip-fade-in" id="pp-12">[\s\S]*?<\/details>/, ''],
     'политика: три редакции устроены ОДИНАКОВО'],

    ['сдвинуть якорь раздела в английской редакции',
     [EN, 'id="pp-13"', 'id="pp-130"'],
     'политика: якоря разделов совпадают во всех трёх'],

    ['поправить страницу руками, минуя источник',
     [СТР, '</details>', '<p><strong>16.1.</strong> Лишний пункт.</p></details>'],
     'политика: в страницах лежит то же, что в источнике'],

    ['убрать ссылку на страницу удаления из кыргызской редакции',
     [KG, 'https://tennis.kg/pages/delete-account-kg.html', '#'],
     'политика: в каждой редакции есть ссылка на свою страницу удаления'],

    ['вернуть домашний адрес разработчиков в русскую редакцию',
     [RU, 'Константин Хан и Татьяна Нечаева, Кыргызская Республика',
          'Константин Хан и Татьяна Нечаева, адрес: ул. Токтоналиева 6в кв43, Бишкек'],
     'политика: в документе нет того, чего в нём быть не должно'],

    ['вернуть адрес с www в английскую редакцию',
     [EN, 'the <a href="https://tennis.kg">tennis.kg</a> website',
          'the <a href="https://www.tennis.kg">www.tennis.kg</a> website'],
     'политика: в документе нет того, чего в нём быть не должно'],

    ['вписать незаполненное место прямо в запрос к базе',
     /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, А НЕ НА ВИДЕ ЗАПРОСА. Был
        `UPDATE ... SET` — сборщик перешёл на `INSERT ... ON CONFLICT`
        (строки `delete-account` в таблице не было, и UPDATE по ней
        молча не сделал бы ничего), и откат перестал применяться. */
     [SQL, 'INSERT INTO public.site_documents',
           '-- ХОСТИНГ_НЕ_ЗАПОЛНЕН\nINSERT INTO public.site_documents'],
     'незаполненное место не уехало в базу'],

    ['убрать упоминание приказа из кыргызской редакции',
     [KG, /№ 1/g, 'б/н'],
     'политика: во всех редакциях назван приказ, которым документ утверждён'],

    ['подключить скрипт документа раньше дома языка',
     [СТР, /<script src="\.\.\/js\/kslt-yazyk\.js\?v=\d+"><\/script>\s*<script src="\.\.\/js\/kslt-dokument\.js\?v=\d+"><\/script>/,
           '<script src="../js/kslt-dokument.js?v=1"></script>\n    <script src="../js/kslt-yazyk.js?v=5"></script>'],
     'политика: скрипт документа подключён после дома языка'],

    ['снять с выжимки оговорку, что она не документ',
     [EN, 'ip-doc-gist-note', 'ip-doc-gist-plain'],
     'политика: выжимка помечена как пересказ, а не как документ'],

    ['убрать раздел из кыргызского Соглашения',
     [СОГЛ_KG, /<details class="ip-doc-fold ip-fade-in" id="ua-12">[\s\S]*?<\/details>/, ''],
     'соглашение: три редакции устроены ОДИНАКОВО'],

    ['вернуть www в русское Соглашение',
     [СОГЛ_RU, 'сайт <a href="https://tennis.kg">tennis.kg</a> (далее — Сайт)',
               'сайт <a href="https://www.tennis.kg">www.tennis.kg</a> (далее — Сайт)'],
     'соглашение: в документе нет того, чего в нём быть не должно'],

    ['потерять источник кыргызской редакции',
     ['УДАЛИТЬ', KG],
     'политика: источник и страницы на месте']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}

let плохо = 0;
console.log('\n  ПРУВЕР ПРАВОВЫХ ДОКУМЕНТОВ — ' + ОТКАТЫ.length + ' откатов на 9 правил\n');
ОТКАТЫ.forEach(([имя, правка, ждём]) => {
    let р;
    try { р = прогон(правка); }
    catch (e) { console.log('  x ' + имя + '\n      откат не применился: ' + e.message); плохо++; return; }

    if (!р.упало) {
        console.log('  x ' + имя + '\n      правило НЕ упало, а должно было: «' + ждём + '»');
        плохо++;
        return;
    }
    if (!р.вывод.includes(ждём)) {
        console.log('  x ' + имя + '\n      упало не то правило. Ждали: «' + ждём + '»');
        console.log('      А упало:\n' + р.вывод.split('\n').filter(с => с.trim().startsWith('x ')).map(с => '      ' + с.trim()).join('\n'));
        плохо++;
        return;
    }
    console.log('  v ' + имя + '\n      уронило: ' + ждём);
});

fs.rmSync(песок, { recursive: true, force: true });
if (плохо) {
    console.log('\n  ПРУВЕР УПАЛ: ' + плохо + ' из ' + ОТКАТЫ.length + '\n');
    process.exit(1);
}
console.log('\n  v все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');
