/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ УДАЛЕНИЯ ТУРНИРА ОТКАТОМ.
 *
 * Каждое правило check-udalenie-turnira.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ: оригиналы не трогаются.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ И ОБЯЗАН БЫТЬ ЕДИНСТВЕННЫМ НЕ ТОЛЬКО ПО
 * ТЕКСТУ, НО И ПО СМЫСЛУ: вторая копия той же строки держит правило вместо
 * испорченной, и откат зеленеет впустую. Поймано прувером 09.10 на голосах.
 *
 *   node tools/check-udalenie-turnira-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-udalenie-'));
['js', 'tools', 'css', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ТРН   = 'js/admin/sections/tournaments.js';
const УТИЛ  = 'js/admin/core/utils.js';
const CSS   = 'css/admin.css';
const СТЕНД = 'maket/stend-udalenie-turnira.html';

const ОТКАТЫ = [

  [ТРН, `    async function считатьПотери(ids) {`,
        `    async function считатьПотериБыло(ids) {`,
   'окно считает потери, а не предполагает их'],

  /* ВТОРОЕ ТЕЛО ОКНА. Именно так и начинается расхождение: копию заводят
     «на время», и она остаётся. */
  /* ВТОРОЕ ТЕЛО ПОД ТЕМ ЖЕ ИМЕНЕМ. Первая редакция отката заводила копию
     под именем `текстПотерьВторое` — и правило устояло, потому что считает
     объявления ИМЕННО `текстПотерь`. Прувер поймал: откат обязан ломать то
     самое отношение, а не похожее. */
  [ТРН, `    function текстПотерь(п, турниров) {`,
        `    function текстПотерь(п, турниров) { return ''; }\n    function текстПотерь(п, турниров) {`,
   'тело окна описано один раз и его зовут ОБА пути'],

  [ТРН, `                потериПередУдалением = await считатьПотери(ids);`,
        `                потериПередУдалением = null;`,
   'игроки собираются ДО удаления'],

  /* ПЕРЕСЧЁТА НЕТ — ровно то состояние, в котором массовое удаление жило
     до 09.10. Зов остаётся один, у одиночного. */
  [ТРН, `                var пересчёт = await A.client.rpc('recalc_player_categories', { p_ids: игроки });`,
        `                var пересчёт = { error: null };`,
   'массовое удаление пересчитывает очки'],

  [УТИЛ, `            if (opts.доУдаления) {`,
         `            if (true) {`,
   'полоса массового удаления зовёт крючки, но не требует их'],

  /* ПОРЯДОК ПЕРЕВЁРНУТ: сначала перерисовать, потом пересчитать. */
  [УТИЛ, `                    if (opts.послеУдаления) {
                        try { await opts.послеУдаления(ids); }
                        catch (e) { showToast(e.message || 'Error', 'error'); }
                    }
                    await Promise.resolve(opts.reloadFn());`,
         `                    await Promise.resolve(opts.reloadFn());
                    if (opts.послеУдаления) {
                        try { await opts.послеУдаления(ids); }
                        catch (e) { showToast(e.message || 'Error', 'error'); }
                    }`,
   'своё доделывается ДО перерисовки списка'],

  [ТРН, `                   '<ul class="ad-udalenie-spisok">' + строки + '</ul>' +`,
        `                   '<ul class="ad-udalenie-spisok">' + строки + '</ul>' +\n                   '<p>Останется: статей — 2, потеряют связь с турниром</p>' +`,
   'окно не обещает того, о чём решено молчать'],

  /* ТРЕТЬЯ СТУПЕНЬ ШИРИНЫ — выдуманное число мимо компонента. */
  [CSS, `.ad-confirm-modal:has(.ad-udalenie) {
    max-width: 520px;
}`,
        `.ad-confirm-modal:has(.ad-udalenie) {
    max-width: 560px;
}`,
   'ширина окна — ступень, уже заведённая в файле, а не новое число'],

  [CSS, `.ad-udalenie {
    text-align: left;
}`,
        `.ad-udalenie {
    text-align: center;
}`,
   'список читается слева, а число не рвётся пополам'],

  [ТРН, `    A.текстПотерьТурнира = текстПотерь;`,
        `    /* откат: стенд остаётся без живого кода */`,
   'стенд зовёт живой код, а не копию разметки'],
];

let упало = 0;
ОТКАТЫ.forEach(([файл, было, стало, правило], i) => {
    const путь = path.join(ВРЕМ, файл);
    const цел = fs.readFileSync(путь, 'utf8');
    const сколько = цел.split(было).length - 1;
    if (сколько !== 1) {
        console.log(`  ✗ ${i + 1}  якорь встречается ${сколько} раз: ${правило}`);
        упало++;
        return;
    }
    fs.writeFileSync(путь, цел.replace(было, стало));
    let вывод = '';
    try {
        вывод = execFileSync('node', [path.join(ВРЕМ, 'tools/check-udalenie-turnira.js')],
                             { encoding: 'utf8' });
    } catch (e) { вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.writeFileSync(путь, цел);

    const своё = вывод.includes(`✗ ${правило}`);
    const сколькоУпало = (вывод.match(/^  ✗ /gm) || []).length;
    if (своё && сколькоУпало === 1) {
        console.log(`  ок  ${i + 1}  ${правило}`);
    } else {
        console.log(`  ✗ ${i + 1}  ${правило} — упало ${сколькоУпало}, своё: ${своё}`);
        упало++;
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
if (упало === 0) {
    console.log(`\n  ок      все ${ОТКАТЫ.length} откатов доказали свои правила`);
    console.log('          оригиналы не изменялись — работа шла на копии\n');
    process.exit(0);
}
console.log(`\n  НЕ ТАК  откатов ${ОТКАТЫ.length}, не доказали ${упало}\n`);
process.exit(1);
