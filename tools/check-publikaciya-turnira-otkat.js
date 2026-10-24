/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПУБЛИКАЦИИ ТУРНИРА (кусок 154). На КОПИИ.
 *   node tools/check-publikaciya-turnira-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ, а не на номерах строк.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-pub-'));
['js', 'tools', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ТУР = 'js/admin/sections/tournaments.js',
      СЛО = 'js/admin/core/constants.js',
      ВАУЧ = 'js/admin/sections/vouchers.js',
      СТЕНД = 'maket/stend-udalenie-turnira.html';
const ФАЙЛЫ = [ТУР, СЛО, ВАУЧ, СТЕНД];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-publikaciya-turnira.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['снять спрос перед записью', ТУР,
     '                var ok = await A.showConfirmAsync(',
     '                var ok = true; var неСпрос = (function () { return function () {}; })(',
     'спрос стоит до записи, и при отказе записи не случается'],

    ['вернуть гашение кнопки ДО спроса', ТУР,
     '                pubBtn.disabled = true;\n\n                var данные =',
     '                var данные =',
     'кнопка гаснет после согласия, а не до спроса'],

    ['унести ключ заголовка снятия из словаря', СЛО,
     "        trnSprosSnyat: 'Снять с публикации?',",
     "        trnSprosSnyatNET: 'Снять с публикации?',",
     'шесть ключей спроса и имени заведены в словаре'],

    ['отнять подстановку у текста публикации', СЛО,
     "        trnSprosOpublikovatTekst: 'Турнир «{турнир}» появится на сайте: его увидят в списке и смогут записаться.',",
     "        trnSprosOpublikovatTekst: 'Турнир появится на сайте: его увидят в списке и смогут записаться.',",
     'текст спроса и имя диктору называют ПРЕДМЕТ подстановкой'],

    ['переписать текст снятия так, чтобы он повторял кнопку', СЛО,
     "        trnSprosSnyatTekst: 'Турнир «{турнир}» исчезнет с сайта. Заявки, сетка и результаты останутся, вернуть можно тем же нажатием.',",
     "        trnSprosSnyatTekst: 'Турнир «{турнир}» будет снят с публикации.',",
     'текст снятия называет последствие и обратимость'],

    ['зашить подпись кнопки окна литералом мимо словаря', ТУР,
     "                    открыт ? L.trnSnyatSPublikacii : L.trnOpublikovat);",
     "                    открыт ? 'Снять' : 'Опубликовать');",
     'подписи кнопок окна берутся теми же ключами, что подпись строки'],

    ['снять имя для диктора у кнопки строки', ТУР,
     "                        '\" data-pub-title=\"' + A.esc(t.title || '') + '\" aria-label=\"' +",
     "                        '\" data-pub-title=\"' + A.esc(t.title || '') + '\" data-aria-net=\"' +",
     'имя для диктора собрано домом `A.фраза` из ключа с предметом'],

    ['отнять экранирование у названия в данных кнопки', ТУР,
     "data-pub-title=\"' + A.esc(t.title || '')",
     "data-pub-title=\"' + (t.title || '')",
     'название турнира едет данными и экранировано'],

    ['снять экранирование у названия в тексте спроса', ТУР,
     "                            { турнир: A.esc(pubBtn.dataset.pubTitle || '') }),",
     "                            { турнир: pubBtn.dataset.pubTitle || '' }),",
     'название турнира экранируется перед подстановкой в текст спроса'],

    ['зашить русскую строку в обработчик публикации', ТУР,
     '                if (!ok) return;',
     "                if (!ok) { A.showToast('Отменено', 'success'); return; }",
     'в обработчике публикации нет зашитых русских строк'],

    ['завести голую запись в разделе турниров', ТУР,
     '            var brkBtn = e.target.closest(\'.ad-brk-btn\');',
     "            if (e.target.closest('.ad-nikogda')) { A.client.from('tournaments').update({}); }\n            var brkBtn = e.target.closest('.ad-brk-btn');",
     'в разделе турниров нет записи в базу из обработчика без спроса'],

    ['завести голую запись в другом разделе админки', ВАУЧ,
     "    'use strict';",
     "    'use strict';\n    document.addEventListener('click', function () { A.client.from('vouchers').update({}); });",
     'голых записей по всей админке — замеренные 39'],

    ['унести со стенда спрос снятия', СТЕНД,
     'data-spros="snyat"',
     'data-spros="snyatNET"',
     'стенд держит оба спроса и берёт текст у настоящего словаря'],

    ['подменить на стенде текст словаря своей копией', СТЕНД,
     '            снимаем ? L.trnSprosSnyat : L.trnSprosOpublikovat,',
     "            снимаем ? 'Снять с публикации?' : 'Опубликовать турнир?',",
     'стенд держит оба спроса и берёт текст у настоящего словаря'],

    ['убрать со стенда крайнее имя с кавычкой и амперсандом', СТЕНД,
     'Кубок «Ала-Тоо» & Co. <b>весна</b> 2026',
     'Кубок весна 2026',
     'стенд держит оба спроса и берёт текст у настоящего словаря']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return; }
    if (сколько !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}
