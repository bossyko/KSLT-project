#!/usr/bin/env node
/**
 * ПРУВЕР СТОРОЖА «ПОДПИСЬ ЛИГИ, ПЬЕДЕСТАЛ МЕСТ И ПАРА В КЛЕТКЕ».
 *
 * Берёт КОПИЮ дерева, возвращает в ней прежнее значение и требует, чтобы
 * упало ИМЕННО ТО правило, которое за это отвечает. «У меня зелёное»
 * ничего не доказывает — доказывает упавший откат.
 *
 * ОТКАТ ДОЛЖЕН БЫТЬ ПОД СТАТЬ ПРАВИЛУ: каждый откат возвращает ровно тот
 * текст, что стоял до починки 07.11, а не ломает файл наугад.
 *
 * Запуск: node tools/check-podpis-ligi-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
let упало = 0, держится = 0;

/* ── копия дерева ───────────────────────────────────────────────── */
function копия() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-podpis-'));
    for (const д of ['js', 'css', 'pages', 'tools', 'mobile']) {
        const от = path.join(КОРЕНЬ, д);
        if (fs.existsSync(от)) fs.cpSync(от, path.join(куда, д), { recursive: true });
    }
    return куда;
}

function прогон(корень) {
    try {
        execFileSync(process.execPath, [path.join(корень, 'tools/check-podpis-ligi.js')],
            { env: Object.assign({}, process.env, { KSLT_KOREN: корень }), encoding: 'utf8' });
        return '';
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
}

function откат(имя, правилоЖдём, действие) {
    const корень = копия();
    try {
        действие(корень);
        const вывод = прогон(корень);
        const упалоНужное = вывод.includes('✗ ' + правилоЖдём);
        if (упалоНужное) { держится++; console.log('  ✓ ' + имя); }
        else {
            упало++;
            console.log('  ✗ ' + имя);
            console.log('    ждали падения правила «' + правилоЖдём + '», а вывод:');
            console.log('    ' + (вывод.trim() ? вывод.trim().split('\n').slice(0, 6).join('\n    ') : 'прогон ЧИСТЫЙ — сторож этого не видит'));
        }
    } finally {
        fs.rmSync(корень, { recursive: true, force: true });
    }
}

function правка(корень, файл, было, стало) {
    const п = path.join(корень, файл);
    const т = fs.readFileSync(п, 'utf8');
    if (т.split(было).length - 1 !== 1)
        throw new Error('откат не под стать: якорь не один раз — ' + файл + ' / ' + было.slice(0, 50));
    fs.writeFileSync(п, т.replace(было, стало), 'utf8');
}

console.log('\nПРУВЕР: ПОДПИСЬ ЛИГИ, ПЬЕДЕСТАЛ МЕСТ И ПАРА В КЛЕТКЕ\n');

/* 1. раздел мест снова сносится */
откат('раздел «Места» снова удаляют целиком',
    'раздел с пьедесталом у нерейтинговых не удаляется',
    (к) => правка(к, 'js/tournament-detail.js',
        `        var заголовок = document.querySelector('#results h2');`,
        `        var заголовок = document.getElementById('results');
        if (заголовок) заголовок.remove();
        var _з = document.querySelector('#results h2');`));

/* 2. раздел снова зовётся «Очки» */
откат('раздел без очков снова зовётся по-старому',
    'вкладка и заголовок у нерейтинговых зовутся «Места»',
    (к) => правка(к, 'js/tournament-detail.js',
        `KSLT_YAZYK.выбрать('Places', 'Орундар', 'Места');`,
        `KSLT_YAZYK.выбрать('Points', 'Упай', 'Очки');`));

/* 3. дверь таблицы очков убрана */
откат('дверь в «показатьРаскладкуОчков» убрана',
    'таблица очков закрыта ОДНОЙ дверью в самой функции',
    (к) => правка(к, 'js/tournament-detail.js',
        `    if (!isRatingTournament(t)) return;`,
        `    // дверь снята`));

/* 4. пьедестал снова один на две лиги */
откат('пьедестал снова один на две лиги',
    'у каждой лиги свой пьедестал',
    (к) => правка(к, 'js/tournament-detail.js',
        `resultsPodium.innerHTML = пьедесталПЛ + пьедесталЦЛ;`,
        `resultsPodium.innerHTML = пьедесталПЛ;`));

/* 5. полоса между пьедесталами убрана */
откат('полоса между пьедесталами убрана',
    'между пьедесталами есть полоса',
    (к) => правка(к, 'css/tournament-detail.css',
        `.td-podium + .td-league-title { margin-top: 32px; }`,
        `/* полоса снята */`));

/* 6. дом имени снова не отдаёт частей */
откат('дом имени снова отдаёт только склейку',
    'части пары отдаёт дом имени, а не выковыривает зовущий',
    (к) => правка(к, 'js/tournament-detail.js',
        `    if (партнёр) return { текст: капитан + ' / ' + партнёр, пара: true,
                          капитан: капитан, партнёр: партнёр };`,
        `    if (партнёр) return { текст: капитан + ' / ' + партнёр, пара: true };`));

/* 7. имя пьедестала снова оттирается регуляркой */
откат('имя на пьедестале снова оттирается регуляркой',
    'имя на пьедестале не выковыривается регуляркой из разметки',
    (к) => правка(к, 'js/tournament-detail.js',
        `                var и = isDbl && player.id`,
        `                var _стар = isDbl ? getPublicTeamName(player.id, regsMap, playersMap, isEn, isKg).replace(/<[^>]*>/g, '') : '';
                var и = isDbl && player.id`));

/* 8. пара рисуется не везде двумя блоками */
откат('пару снова рисуют мимо дома',
    'пару собирает ОДИН дом, а не каждый экран по-своему',
    (к) => правка(к, 'js/tournament-detail.js',
        `        return паруРазметкой(участник) || KSLT_экранировать(участник.name);`,
        `        return KSLT_экранировать(участник.name);`));

/* 9. разделитель выброшен из разметки */
откат('разделитель пары выброшен из разметки',
    'разделитель пары остаётся в разметке',
    (к) => правка(к, 'js/tournament-detail.js',
        `'</span><span class="td-team-sep"> / </span><span class="td-team-p">' +`,
        `'</span><span class="td-team-p">' +`));

/* 10. правило частей снова привязано к обёртке */
откат('правило частей пары снова привязано к обёртке',
    'правило частей пары не привязано к обёртке',
    (к) => правка(к, 'css/tournament-detail.css',
        `.td-team-p { display: block; }`,
        `.td-team-name .td-team-p { display: block; }`));

/* 11. у пары вернулся nowrap */
откат('у пары вернулось обрезание многоточием',
    'имя в клетке не обрезается многоточием у пары',
    (к) => правка(к, 'css/tournament-detail.css',
        `.td-bracket .td-player-name:has(.td-team-p) {
    white-space: normal;
    text-overflow: clip;
}`,
        `/* перенос снят */`));

/* 12. лиги снова в ряд */
откат('парные лиги снова делят ширину пополам',
    'парные лиги встают друг под другом',
    (к) => правка(к, 'css/tournament-detail.css',
        `.td-dual-league:has(.td-team-p) {
    flex-direction: column;
}`,
        `/* лиги снова в ряд */`));

/* 13. подпись лиги снова без тега — и перебивается */
откат('подпись лиги снова записана без тега',
    'подпись лиги записана с тегом и потому не перебивается',
    (к) => правка(к, 'css/tournament-detail.css',
        `h3.td-league-title {`,
        `.td-league-title {`));

/* 14. подпись лиги снова крупнее имени победителя */
откат('подпись лиги снова крупнее имени победителя',
    'подпись лиги строго мельче имени победителя',
    (к) => правка(к, 'css/tournament-detail.css',
        `h3.td-league-title {
    display: inline-block;
    padding: 8px 16px;
    border-radius: var(--radius-sm, 6px);
    font-size: var(--fs-base);`,
        `h3.td-league-title {
    display: inline-block;
    padding: 8px 16px;
    border-radius: var(--radius-sm, 6px);
    font-size: var(--fs-lg);`));

/* 15. новый беззащитный класс на h3 */
откат('новый беззащитный класс на h3 прибавился',
    'беззащитных классов на h3 не прибавилось',
    (к) => {
        const пCss = path.join(к, 'css/tournament-detail.css');
        fs.appendFileSync(пCss, '\n.td-proba-shva-title { font-size: var(--fs-lg); }\n', 'utf8');
        const пJs = path.join(к, 'js/tournament-detail.js');
        fs.appendFileSync(пJs, '\n/* проба шва */ var _проба = \'<h3 class="td-proba-shva-title">x</h3>\';\n', 'utf8');
    });

console.log('\nоткатов уронило своё правило: ' + держится + ', не уронило: ' + упало);
process.exit(упало ? 1 : 0);
