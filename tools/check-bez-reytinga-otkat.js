#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ «БЕЗ РЕЙТИНГА» (кусок Open Friendly, 07.11).
 *
 * Берёт КОПИЮ файлов, возвращает прежнее значение и требует, чтобы упало
 * ИМЕННО то правило, которое за это отвечает. Якорь держится на
 * содержимом, и его единственность проверяется: ЗАМЕНА, КОТОРАЯ НЕ
 * ПРИМЕНИЛАСЬ, НИЧЕГО НЕ ДОКАЗАЛА.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');

const ДОМ = 'js/kslt-rules.js';
const ДОМ_П = 'mobile/www/js/kslt-rules.js';
const АДМИНКА = 'js/admin/sections/tournaments.js';
const СЕРВЕР = 'supabase/functions/tournament-register/index.ts';

function файлБазы(вид) {
    const д = path.join(КОРЕНЬ, 'sql', 'схема');
    const имя = fs.existsSync(д) ? fs.readdirSync(д).filter(и => вид.test(и)).sort().pop() : null;
    return имя ? 'sql/схема/' + имя : null;
}
const SQL = файлБазы(/^open-friendly-.*\.sql$/);

const ОТКАТЫ = [
  { имя: 'дом перестал отдавать признак', ждём: 'дом правил найден и отдаёт признак',
    файл: ДОМ, было: 'R.нерейтинговая = function', станет: 'R.нерейтинговаяСнесена = function' },

  { имя: 'признак снова считает по списку имён',
    ждём: 'признак читает `is_rating`, а не список имён',
    файл: ДОМ,
    было: '        var строки = R.knownCategories();',
    станет: '        var строки = [];' },

  { имя: 'в доме завелась вторая память категорий',
    ждём: 'память категорий в доме одна',
    файл: ДОМ,
    было: '    R.нерейтинговая = function (категорияId) {',
    станет: '    R.запомнитьКатегории = function (с) { R._категории = с; };\n' +
            '    R.нерейтинговая = function (категорияId) {' },

  { имя: 'продукт снова читает запасной список',
    ждём: '`NON_RATING` читается только внутри дома',
    файл: 'js/admin/sections/bracket.js',
    было: '    function isFriendlyTournament(tournament) {',
    станет: '    var нерейтинговые = (window.KSLT_RULES && KSLT_RULES.NON_RATING) || [];\n' +
            '    function isFriendlyTournament(tournament) {' },

  { имя: 'признак снова зашит словом в кабинете',
    ждём: 'признак нигде не зашит словом',
    файл: 'js/player.js',
    было: "            if (window.KSLT_RULES && window.KSLT_RULES.нерейтинговая(t.category_id)) return 'friendly';",
    станет: "            if (t.category_id === 'friendly') return 'friendly';" },

  { имя: 'сервер перестал спрашивать базу',
    ждём: 'сервер читает `is_rating` и решает допуск по нему',
    файл: СЕРВЕР,
    было: ", level_id, categories(is_rating)')",
    станет: ", level_id')" },

  { имя: 'в базе не стало определения признака',
    ждём: 'в базе объявлено одно определение признака',
    файл: SQL,
    было: 'CREATE OR REPLACE FUNCTION public."нерейтинговая_категория"(ид text)',
    станет: 'CREATE OR REPLACE FUNCTION public."нерейтинговая_категория_иначе"(ид text)' },

  { имя: 'в пересчёт вернулось слово',
    ждём: 'в новой редакции пересчёта слова `friendly` не осталось',
    файл: SQL,
    было: '        AND NOT public."нерейтинговая_категория"(rh.category_id)\n        AND (rh.is_doubles IS NOT TRUE)\n        AND rh.recorded_at >= oldest_date',
    станет: "        AND rh.category_id <> 'friendly'\n        AND (rh.is_doubles IS NOT TRUE)\n        AND rh.recorded_at >= oldest_date" },

  { имя: 'категория не заводится',
    ждём: 'файл заводит столбец признака и саму категорию',
    файл: SQL,
    было: 'INSERT INTO public.categories (id, name, name_en, name_kg, gender, sort_order, is_rating)',
    станет: 'INSERT INTO public.categories_чужая (id, name, name_en, name_kg, gender, sort_order, is_rating)' },

  { имя: 'у нерейтинговой категории снова спрашивают пол',
    ждём: 'у нерейтинговой категории пол не спрашивается, а ставится',
    файл: АДМИНКА,
    было: "                if (fmt === 'mixed_doubles' || дружескийТурнир()) {",
    станет: "                if (fmt === 'mixed_doubles') {" },

  { имя: 'загрузчик перестал отдавать категории дому',
    ждём: 'загрузчики категорий отдают список дому',
    файл: 'js/rankings-data.js',
    /* ЯКОРЬ ОБНОВЛЁН В ТОТ ЖЕ ДЕНЬ: форма защиты приведена к принятой в
       продукте (`KSLT_RULES && ...`), и прежний якорь перестал
       встречаться — откат ничего не доказывал бы молча. */
    было: '            window.KSLT_RULES && window.KSLT_RULES.rememberCategories(catResult.data);\n',
    станет: '' },

  { имя: 'копия дома в приложении разошлась',
    ждём: 'дома лежат побайтовыми копиями в приложении',
    файл: ДОМ_П,
    было: "    R.CATEGORY_ORDER = ['promasters', 'masters', 'tour', 'challenger', 'futures'];",
    станет: "    R.CATEGORY_ORDER = ['promasters', 'masters', 'tour', 'challenger', 'futures']; /* уехало */" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-bezr-'));
    for (const о of ['js', 'mobile/www', 'tools', 'supabase/functions', 'sql/схема']) {
        const и = path.join(КОРЕНЬ, о);
        if (fs.existsSync(и)) fs.cpSync(и, path.join(к, о), { recursive: true });
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-bez-reytinga.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: БЕЗ РЕЙТИНГА\n');
let беда = 0;
for (const о of ОТКАТЫ) {
    if (!о.файл) { console.log('  ✗ ' + о.имя + ' — ФАЙЛ НЕ НАЙДЕН'); беда++; continue; }
    const к = копия();
    const п = path.join(к, о.файл);
    if (!fs.existsSync(п)) {
        console.log('  ✗ ' + о.имя + ' — НЕТ ФАЙЛА ' + о.файл);
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    const было = fs.readFileSync(п, 'utf8');
    const n = было.split(о.было).length - 1;
    if (n !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + n + ' РАЗ');
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    const в = прогон(к);
    if (в.includes('✗ ' + о.ждём)) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    fs.rmSync(к, { recursive: true, force: true });
}
console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }
