/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СПОНСОРОВ И УСЛУГ ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает. Якорь держится на содержимом блока.
 *
 *   node tools/check-sponsory-uslugi-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tokens.css', 'css/sponsors.css', 'css/services.css', 'js/sponsors-page.js',
               'pages/sponsors.html', 'pages/sponsors-en.html', 'pages/sponsors-kg.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const С = 'css/sponsors.css', У = 'css/services.css', Д = 'js/sponsors-page.js';
const Р = 'pages/sponsors.html';

const ОТКАТЫ = [

['вернуть заголовку раздела кегль обложки на телефоне', С,
 '    .sn-h2 {\n        font-size: var(--fs-xl);\n    }',
 '    .sn-h2 {\n        font-size: var(--fs-2xl);\n    }',
 'на телефоне заголовок раздела мельче заголовка обложки'],

['вернуть цифре аудитории кегль 40 на телефоне', С,
 '    .sn-num-val {\n        font-size: var(--fs-2xl);\n    }',
 '    .sn-num-val {\n        font-size: var(--fs-3xl);\n    }',
 'на телефоне цифра аудитории не крупнее заголовка обложки'],

['снять меру абзаца у лида страницы', С,
 'line-height: var(--lh-relaxed); max-width: 62ch; }',
 'line-height: var(--lh-relaxed); max-width: 720px; }',
 'у лида страницы есть мера абзаца и ступень межстрочного'],

['вернуть межстрочный числом', С,
 '.sn-num-cap { display: block; margin-top: 10px; color: var(--text-secondary); font-size: var(--fs-sm); line-height: var(--lh-normal); }',
 '.sn-num-cap { display: block; margin-top: 10px; color: var(--text-secondary); font-size: var(--fs-sm); line-height: 1.5; }',
 'межстрочных числом в файле спонсоров не осталось'],

['вернуть кнопке высоту полем', С,
 '    min-height: var(--btn-h-md); line-height: var(--lh-none);\n    padding-inline: 32px;',
 '    padding: 15px 32px;',
 'кнопка страницы держит высоту свойством'],

['снять межстрочный у кнопки обзорной «Услуги»', У,
 '    line-height: var(--lh-none);\n    cursor: pointer;\n    transition: border-color 0.2s, color 0.2s;',
 '    cursor: pointer;\n    transition: border-color 0.2s, color 0.2s;',
 'у кнопки обзорной «Услуги» задан межстрочный'],

['вернуть подписи контакта краску text-dim', С,
 '.sn-final-contact { display: block; margin-top: 8px; color: var(--text-muted);',
 '.sn-final-contact { display: block; margin-top: 8px; color: var(--text-dim);',
 'подписи контактов красятся text-muted, а не text-dim'],

['вернуть границу 1000 вместо домашней', С,
 '@media (max-width: 992px) {\n    .sn-nums { grid-template-columns: 1fr 1fr; }',
 '@media (max-width: 1000px) {\n    .sn-nums { grid-template-columns: 1fr 1fr; }',
 'в файле спонсоров только домашние границы'],

['завести второй блок ≤992 в «Услугах»', У,
 '   ГРАНИЦА 768 СВЕДЕНА К 992',
 '   ГРАНИЦА 768 СВЕДЕНА К 992 */\n@media (max-width: 992px) { .sv-columns { gap: 0; } }\n/*',
 'блок ≤992 в «Услугах» объявлен один раз'],

['вернуть отступ атрибутом style', Р,
 '<div class="sn-nums sn-otstup-32">',
 '<div class="sn-nums" style="margin-top:32px;">',
 'в разметке страницы спонсоров нет атрибута style'],

['снять у окна роль и имя', Р,
 'id="snModal" role="dialog" aria-modal="true" aria-labelledby="snModalTitle"',
 'id="snModal"',
 'окно контактов называет себя окном'],

['снять ловушку Tab у окна', Д,
 "            if (e.key !== 'Tab') return;",
 "            if (e.key !== 'Tab-nope') return;",
 'окно держит фокус и возвращает его'],

['снять видимый фокус со страницы спонсоров', С,
 '.sn-btn:focus-visible,',
 '.sn-btn-nope:focus-visible,',
 'у страницы спонсоров есть видимый фокус'],
['снять общий отказ от движения', 'css/tokens.css',
 '    *,\n    *::before,\n    *::after {',
 '    .db-mobile-tab,\n    .site-header {',
 'движение страницы спонсоров спрашивает разрешения'],

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-spons-'));
fs.mkdirSync(path.join(песок, 'css'), { recursive: true });
/* Общий блок отказа от движения живёт в tokens.css, и правило читает
   его по соседству — без копии песочница не проходит сама по себе. */
fs.copyFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), path.join(песок, 'css', 'tokens.css'));
fs.mkdirSync(path.join(песок, 'js'), { recursive: true });
fs.mkdirSync(path.join(песок, 'pages'), { recursive: true });
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'dvizhenie.js'), path.join(песок, 'tools', 'dvizhenie.js'));
fs.writeFileSync(path.join(песок, 'tools', 'check-sponsory-uslugi.js'),
                 fs.readFileSync(path.join(__dirname, 'check-sponsory-uslugi.js')));

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-sponsory-uslugi.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-sponsory-uslugi.js.');
    console.log(база.вывод); process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)  { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
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
