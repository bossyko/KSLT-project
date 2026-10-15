/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СТРАНИЦЫ КОРТА И ТРЕНЕРА ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает.
 *
 * Якорь держится на содержимом блока, а не на положении и не на соседе: ровно
 * на этом 13.10 упал откат 24 куска «Корты» — он цеплялся за строку
 * `.ct-new-badge {` под чужим блоком, и свод плашек в одно правило его снёс.
 *
 *   node tools/check-stranica-korta-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/courts.css', 'css/coaches.css', 'css/style.css',
               'css/tokens.css', 'js/courts.js', 'js/coaches.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const К = 'css/courts.css', Т = 'css/coaches.css', С = 'css/style.css';
const ТОК = 'css/tokens.css';
const ДК = 'js/courts.js', ДТ = 'js/coaches.js';

const ОТКАТЫ = [

/* ── цель нажатия ─────────────────────────────────────────────────────── */

['вернуть кнопке призыва корта высоту полем', К,
 '    min-height: var(--btn-h-md);\n    padding-inline: 32px;\n    border: none;',
 '    padding: 14px 36px;\n    border: none;',
 'кнопка призыва корта держит высоту свойством'],

['вернуть кнопке призыва тренера высоту полем', Т,
 '    min-height: var(--btn-h-md);\n    padding-inline: 32px;\n    border: none;',
 '    padding: 14px 36px;\n    border: none;',
 'кнопка призыва тренера держит высоту свойством'],

['вернуть контакту поле с отрицательным отступом', К,
 '.ct-detail-phone a {\n    display: inline-flex;\n    align-items: center;\n    min-height: var(--btn-h-md);',
 '.ct-detail-phone a {\n    padding-block: 12px;\n    margin-block: -12px;',
 'контакт корта сам 44 высотой'],

['снять слой цели у ссылки карты', К,
 '    transform: translateY(-50%);\n    height: var(--btn-h-md);\n}',
 '    transform: translateY(-50%);\n}',
 'ссылка карты — ступень 36 плюс слой цели 44'],

['вернуть ссылке карты высоту полем', К,
 '    min-height: var(--btn-h-sm);\n    padding-inline: 16px;',
 '    padding: 8px 16px;',
 'ссылка карты — ступень 36 плюс слой цели 44'],

/* ── абзац ────────────────────────────────────────────────────────────── */

['вернуть тексту о площадке межстрочный 1.8', К,
 '.ct-about-text {\n    color: var(--text-secondary);\n    font-size: var(--fs-base);\n    line-height: var(--lh-relaxed);',
 '.ct-about-text {\n    color: var(--text-secondary);\n    font-size: var(--fs-base);\n    line-height: 1.8;',
 'у текста о площадке есть мера абзаца и ступень межстрочного'],

['вернуть био тренера межстрочный 1.8', Т,
 '.co-bio-text {\n    color: var(--text-secondary);\n    font-size: var(--fs-base);\n    line-height: var(--lh-relaxed);',
 '.co-bio-text {\n    color: var(--text-secondary);\n    font-size: var(--fs-base);\n    line-height: 1.8;',
 'у био тренера те же мера и ступень'],

['вернуть меру 72ch вместо замеренной 62ch', К,
 '    max-width: 62ch;\n}\n\n/* Amenities */',
 '    max-width: 72ch;\n}\n\n/* Amenities */',
 'мера задана именно 62ch, а не 72ch'],

['снять меру у текста призыва корта', К,
 '    max-width: 62ch;\n    margin-inline: auto;\n    margin-bottom: 24px;',
 '    margin-bottom: 24px;',
 'у текста призыва тоже есть мера'],

['вернуть четвёртое межстрочное числом', К,
 '.ct-membership-modal p {\n    color: var(--text-secondary);\n    font-size: var(--fs-sm);\n    line-height: var(--lh-relaxed);',
 '.ct-membership-modal p {\n    color: var(--text-secondary);\n    font-size: var(--fs-sm);\n    line-height: 1.6;',
 'межстрочных мимо лестницы в двух файлах не больше трёх'],

/* ── ступень кегля и контраст ─────────────────────────────────────────── */

['вернуть заголовку призыва плавающий clamp', К,
 '        font-size: var(--fs-md);\n    }\n\n    .ct-cta p {',
 '        font-size: clamp(1.15rem, 5vw, 1.32rem);\n    }\n\n    .ct-cta p {',
 'заголовок призыва на телефоне стоит на ступени'],

['вернуть шапке таблицы краску text-dim', К,
 '    color: var(--text-muted);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    font-weight: 600;\n    border-bottom: var(--bw-hair) solid var(--alpha-white-08);',
 '    color: var(--text-dim);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    font-weight: 600;\n    border-bottom: var(--bw-hair) solid var(--alpha-white-08);',
 'шапка таблицы кортов красится text-muted'],

/* ── один h1 на страницу ──────────────────────────────────────────────── */

['вернуть второй h1 в карточку корта', ДК,
 '\'<div class="ct-detail-title-row"><div class="ct-detail-name">\' + court.name + \'</div>\' +',
 '\'<div class="ct-detail-title-row"><h1>\' + court.name + \'</h1>\' +',
 'имя в карточке корта — класс, а не заголовок'],

['вернуть второй h1 в карточку тренера', ДТ,
 '\'<div class="co-detail-title-row"><div class="co-detail-name">\' + coach.name + \'</div>\' +',
 '\'<div class="co-detail-title-row"><h1>\' + coach.name + \'</h1>\' +',
 'имя в карточке тренера — класс, а не заголовок'],

['вернуть правилу имени селектор по тегу', К,
 '.ct-detail-name {\n    font-size: var(--fs-2xl);',
 '.ct-detail-info h1 {\n    font-size: var(--fs-2xl);',
 'правила имени держатся за класс, а не за тег'],

/* ── плашки ───────────────────────────────────────────────────────────── */

['разнести плашки обратно по своим правилам', К,
 '.ct-new-badge,\n.ct-partner-badge {\n    display: inline-flex;',
 '.ct-new-badge {\n    display: inline-flex;',
 'плашки раздела объявлены одним правилом по компоненту'],

['вернуть партнёрской плашке инлайн-стиль', ДК,
 '<span class="ct-partner-badge">',
 '<span style="background:var(--accent);color:#000;font-size:0.72rem;padding:2px 8px;border-radius:100px;font-weight:700;">',
 'партнёрская плашка не вернулась инлайн-стилем в js'],

/* ── умолчание ────────────────────────────────────────────────────────── */

['вернуть «новый» всем кортам разом', ДК,
 '_isNew: новыйЛи(row.created_at),',
 '_isNew: true,',
 '«новый» считается по дате'],

['снять проверку пустой даты', ДК,
 '        if (!когда) return false;\n',
 '',
 'нет даты — не новый'],

/* ── доступность ──────────────────────────────────────────────────────── */

['снять видимый фокус со страницы корта', К,
 '.ct-cta-btn:focus-visible,\n.ct-map-link:focus-visible,',
 '.ct-gallery-img-nope:focus-visible,',
 'у страницы корта есть видимый фокус'],

['снять видимый фокус со страницы тренера', Т,
 '.co-cta-btn:focus-visible,\n.co-card:focus-visible,',
 '.co-nope:focus-visible,',
 'у страницы тренера есть видимый фокус'],

['снять у страницы корта спрос разрешения на движение', К,
 '    .ct-fade-in,\n    .ct-fade-in.visible {\n        transition: none;\n        transform: none;\n    }',
 '    .ct-nope {\n        transition: none;\n    }',
 'движение страницы корта спрашивает разрешения'],

['снять у страницы тренера спрос разрешения на движение', Т,
 '    .co-fade-in,\n    .co-fade-in.visible {\n        transition: none;\n        transform: none;\n    }',
 '    .co-nope {\n        transition: none;\n    }',
 'движение страницы тренера спрашивает разрешения'],


/* ── что пережило отмену колонки ──────────────────────────────────────── */

['вернуть возврату подложку на широких видах', С,
 '    .kslt-back-wrap.kslt-back-float::before {',
 '    .kslt-back-wrap.kslt-back-float-nope::before {',
 'возврат на широких видах стоит без подложки'],

['вернуть показателю кегль заголовка секции', К,
 '.ct-stat-item {\n    font-size: var(--fs-md);',
 '.ct-stat-item {\n    font-size: var(--fs-lg);',
 'показатель корта мельче заголовка секции'],

['вернуть пилюле поля мимо шкалы', К,
 '        padding: 12px 16px;\n    }\n\n    .ct-stat-item {',
 '        padding: 10px 14px;\n    }\n\n    .ct-stat-item {',
 'поля пилюли показателей стоят на ступенях шкалы'],

['снять у возврата поле под выступ слоя цели', С,
 '        padding-block: 12px;\n        padding-inline: var(--pad-x);',
 '        padding-block: 8px;\n        padding-inline: var(--pad-x);',
 'у возврата в потоке есть поле под выступ слоя цели'],

['вернуть границу возврата на 1300', С,
 '@media (max-width: 992px) {\n    .kslt-back-wrap.kslt-back-float {',
 '@media (max-width: 1300px) {\n    .kslt-back-wrap.kslt-back-float {',
 'граница возврата домашняя, а не 1300'],

['вернуть плитке тренера растяжение по колонке', Т,
 '        grid-template-columns: repeat(auto-fill, 220px);',
 '        grid-template-columns: repeat(4, 1fr);',
 'плитка тренера держит ширину компонента, а не делит колонку'],

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-korta-'));
fs.mkdirSync(path.join(песок, 'css'), { recursive: true });
fs.mkdirSync(path.join(песок, 'js'), { recursive: true });
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
fs.writeFileSync(path.join(песок, 'tools', 'check-stranica-korta.js'),
                 fs.readFileSync(path.join(__dirname, 'check-stranica-korta.js')));

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-stranica-korta.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-stranica-korta.js.');
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
