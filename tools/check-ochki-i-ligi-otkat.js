/**
 * ПРУВЕР ЗАМОРОЗКИ ОЧКОВ И ЛИГ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — то, что жило в коде до 30.09: сложение таблицы с победами,
 * одна таблица на две лиги, деление пополам и цветной треугольник.
 *
 *   node tools/check-ochki-i-ligi-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ochki-'));

/* `sql` в копии — потому что замораживается и миграция предела мест.
   Без неё `чит('sql/схема/predel-mest-urovnya.sql')` падает в копии, и
   КАЖДЫЙ откат «роняет правило» по чужой причине: прибор обязан
   называть свою причину, а не соседскую. */
/* `tests` в копии — по той же причине, что и `sql`: замораживается и сам
   тест экрана. Без него `чит` падает в копии, и КАЖДЫЙ откат «роняет
   правило» по чужой причине. Прибор обязан называть свою причину. */
['js', 'css', 'tools', 'pages', 'maket', 'sql', 'tests'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.mkdirSync(path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js'), path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });

const ОЧКИ  = 'js/rating-points.js';
const СЕТКА = 'js/admin/sections/bracket.js';
const CSS   = 'css/admin.css';
const СТР   = 'pages/admin.html';
const СТЕНД_ЗАМЕР = 'maket/setka-zamer.html';
const ПУБЛИЧНАЯ = 'js/tournament-detail.js';
const ПУБЛCSS   = 'css/tournament-detail.css';
const ПРЕДЕЛ_SQL = 'sql/схема/predel-mest-urovnya.sql';
const НАСТРОЙКИ = 'js/admin/sections/settings.js';
const СЛОВАРЬ   = 'js/admin/core/constants.js';
const УТИЛИТЫ   = 'js/admin/core/utils.js';
const МАКЕТ_ОЧКИ = 'maket/ochki-ekran.html';
const АДМИН_CSS = 'css/admin.css';
const ЗАМЕР_ФАЙЛ = 'tools/zamer-ochki-ekran.mjs';
const ТЕСТ_ФАЙЛ  = 'tests/e2e/features/19-ekran-ochkov.spec.js';
const СТАТ_SQL   = 'sql/функции/stats-rating-only.sql';

const ОТКАТЫ = [
  /* ─── завершённый турнир виден экраном ─── */
  [УТИЛИТЫ, 'id="adBrkFinalize"', 'id="adBrkFinalizeБыло"',
   'кнопка завершения объявлена ОДИН раз, и не в рисовальщиках'],

  [УТИЛИТЫ, "                'id=\"adBrkRecalc\">' + (L.recalcPoints || '') + '</button>' +",
            "                '>' + (L.recalcPoints || '') + '</button>' +",
   'полоса завершения знает ТРИ состояния, а не два'],

  [СЕТКА, "                L.generateLeagues + '</button></div>';\n        }\n\n        html += A.полосаЗавершения({",
          "                L.generateLeagues + '</button></div>';\n        }\n\n        html += ({",
   'полосу завершения зовут ВСЕ четыре раскладки'],

  [УТИЛИТЫ, " disabled title=\"' + пояснение + '\"'", " style=\"opacity:0.5\"'",
   'погасание висит на `[disabled]`, а не вторым способом'],

  [СЕТКА, "(isTournamentCompleted ? ' ad-brk-zavershyon' : '')", "('')",
   'завершённость доходит до панели сетки одним признаком'],

  [СЕТКА, "L.doneEditWarn", "L.tournamentDone",
   'завершённый турнир предупреждает о цене правки словом'],

  [АДМИН_CSS, '.ad-brk-zavershyon .ad-brk-edit,\n.ad-brk-zavershyon .ad-sq-fix {\n    background: rgba(255, 255, 255, 0.03);\n    color: var(--text-muted);',
              '.ad-brk-zavershyon .ad-brk-edit,\n.ad-brk-zavershyon .ad-sq-fix {\n    background: rgba(204,255,0,0.05);\n    color: var(--accent);',
   'клетки завершённого турнира перестают звать лаймом'],


  /* ─── порядок: причина раньше следствия ─── */
  [СЕТКА,
   '                await saveRatingHistory(tournament, toUpsert, isDblGrp);\n' +
   '                if (isDblGrp) {',
   '                if (isDblGrp) {',
   'история рейтинга пишется РАНЬШЕ пересчёта очков — во всех четырёх завершениях'],

  [СЕТКА,
   '                await saveRatingHistory(tournament, toUpsert, isDblFic);\n',
   '                await saveRatingHistory(tournament, toUpsert, isDblFic);\n' +
   '                await saveRatingHistory(tournament, toUpsert, isDblFic);\n',
   'завершений ровно четыре, и пятая копия не завелась'],

  [СТАТ_SQL,
   '        SET points = EXCLUDED.points, updated_at = now();',
   '        SET points = player_categories.points + EXCLUDED.points, updated_at = now();',
   'пересчёт категорий КЛАДЁТ сумму истории, а не прибавляет к прежней'],
  /* ─── одно или другое, а не оба разом ─── */
  [ОЧКИ,
   '            if (место && место <= МЕСТ_ПО_ТАБЛИЦЕ) return заМесто(место, таблица);',
   '',
   'первые места платятся только таблицей и выходят сразу'],

  [ОЧКИ,
   '            return побед > 0 ? побед * заПобеду : заУчастие;',
   '            var сумма = заМесто(место, таблица);\n            сумма += побед > 0 ? побед * ЗА_ПОБЕДУ : ЗА_УЧАСТИЕ;\n            return сумма;',
   'остальным платятся ТОЛЬКО победы, без таблицы'],

  [ОЧКИ,
   '    var МЕСТ_ПО_ТАБЛИЦЕ = 4;',
   '    var МЕСТ_ПО_ТАБЛИЦЕ_БЫЛО = 4;',
   'граница названа отношением, а не числом в теле'],

  [СЕТКА,
   '            KSLT_POINTS.поТурниру(кОплате, таблицаМест, {});',
   '            KSLT_POINTS.поТурниру(кОплате, таблицаМест, { заПобеды: true });',
   'олимпийка платит только таблицей'],

  /* ─── итоговый турнир возле лестницы, а не на ней ─── */
  [СЕТКА,
   '        var ниже = наЛестнице.find(function(у) { return у.sort_order < свой.sort_order; });',
   '        var ниже = список.find(function(у) { return у.sort_order < свой.sort_order; });',
   'сосед снизу ищется только среди уровней НА лестнице'],

  [СЕТКА,
   "            .select('id, sort_order, on_ladder')",
   "            .select('id, sort_order')",
   'уровень спрашивается вместе с признаком лестницы'],

  /* ─── этап даёт полосу, а не одно число ─── */
  [ОЧКИ,
   '        var сколько = РАЗМЕР_КРУГА[код];',
   '        var сколько = ({ SF: 2, QF: 4, R16: 8, R32: 16, R64: 32 })[код];',
   'полоса выводится из размера круга, а не перечислена числами'],

  [ОЧКИ,
   "    var МЕСТО_ПО_РАУНДУ = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 4, QF: 5, R16: 9, R32: 17, R64: 33 };",
   "    var МЕСТО_ПО_РАУНДУ = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 4, QF: 5, R16: 9, R32: 17, R64: 33, G2: 3 };",
   'место в группе числа не получает, а этапы сетки получают'],

  [ОЧКИ,
   '            хвост[к] = parseInt(к, 10) + неразыгранные[к] - 1;',
   '            хвост[к] = parseInt(к, 10);',
   'неразыгранное место платится по ПОСЛЕДНЕМУ в полосе'],

  [ОЧКИ,
   "        kg: { W: 'Жеңүүчү', F: 'Финалист', '3RD': '3-орун', '4TH': '4-орун',",
   "        kgg: { W: 'Жеңүүчү', F: 'Финалист', '3RD': '3-орун', '4TH': '4-орун',",
   'подписи этапа объявлены один раз и на трёх языках'],

  [ПУБЛИЧНАЯ,
   '                var подпись = своё !== null ? String(своё)\n                    : KSLT_POINTS.подписьМеста(р.round_reached);',
   '                var подпись = место === null ? null : String(место);',
   'публичная страница турнира своего счёта мест не ведёт'],

  /* ─── итоги: одна таблица на все четыре типа сетки ─── */
  [ПУБЛИЧНАЯ,
   '                    показатьРаскладкуОчков(t, resultsPodium, resHtml, isEn, isKg, pName, местаФика);',
   '                    void местаФика;',
   'итоги рисует одна функция, и зовут её все ветки'],

  [ПУБЛИЧНАЯ,
   "    supabaseClient.from('tournament_results')",
   "    supabaseClient.from('rating_history')",
   'итоги читают tournament_results, и второго источника нет'],

  /* ЯКОРЬ ПЕРЕВЯЗАН 03.10: рисование переехало внутрь функции `таблица`,
     отступ стал другим, и прежний якорь с двенадцатью пробелами перестал
     встречаться. Держимся за СОДЕРЖИМОЕ — открытие блока разметки, — а не
     за отступ и не за имя переменной. */
  [ПУБЛИЧНАЯ,
   "'<div class=\"td-results-table\">' +",
   "'<table style=\"border-collapse:collapse\"></table><div class=\"td-results-table\">' +",
   'своей таблицы с зашитыми стилями под пьедесталом нет'],

  /* ─── две лиги: два результата, и отсечка ─── */
  [ПУБЛИЧНАЯ,
   "                                : m.round && m.round.indexOf('CL-') === 0 ? 'CL' : null;",
   "                                : null;",
   'лига игрока берётся из приставки матча, а не выводится'],

  [ПУБЛИЧНАЯ,
   "                html = блок('PL', своиЛиги('PL')) +",
   "                html = таблица(строки, подписьЛиги('PL', isEn, isKg)) + '' +",
   'в двух лигах рисуются два результата, а не один список'],

  [ПУБЛИЧНАЯ,
   "                var пьедесталЦЛ = пьедесталЛиги('CL');",
   "                var пьедесталЦЛ = '';",
   'у каждой лиги свой пьедестал'],

  [ПУБЛИЧНАЯ,
   "                        return m.round === вид + '-3RD' && m.status === 'completed' && m.winner_id;",
   "                        return m.round_number === 1 && m.status === 'completed' && m.winner_id;",
   'третье место на пьедестале лиги даёт только матч за третье место'],

  [ПУБЛИЧНАЯ,
   "                    return пьед + таблица(свои, пьед ? '' : подписьЛиги(вид, isEn, isKg));",
   "                    return пьед + таблица(свои, подписьЛиги(вид, isEn, isKg));",
   'название лиги стоит один раз: на пьедестале либо над таблицей'],

  [ПУБЛИЧНАЯ,
   "                if (свои.length > СТРОК_СРАЗУ) {",
   "                if (false) {",
   'отсечка названа отношением, а не вываливается целиком'],

  [ПУБЛИЧНАЯ,
   "                    ? ' td-res-hidden' : '';",
   "                    ? '' : '';",
   'лишняя строка скрывается классом, а не выбрасывается'],

  [ПУБЛИЧНАЯ,
   "kg: 'Жогорку лига' }",
   "kg: '' }",
   'названия лиг объявлены один раз и на трёх языках'],

  [ОЧКИ,
   '    function подписьМатчаЗаМеста(место, язык) {',
   '    function подписьМатчаЗаМеста_БЫЛО(место, язык) {',
   'этап называет матч за места там, где места разыграны'],

  [ОЧКИ,
   '        var начало = (м % 2) ? м : м - 1;',
   "        var начало = ({ 3: 3, 4: 3, 5: 5, 6: 5, 7: 7, 8: 7 })[м] || м;",
   'пара мест выводится из места, а не перечислена'],

  [ПУБЛCSS,
   '.td-results-table .td-res-winner .td-res-pts { font-weight: 700; }',
   '.td-results-table .td-res-winner .td-res-pts { color: inherit; }',
   'победитель не теряет вес в колонке очков'],

  /* ─── две лиги — две таблицы ─── */
  [СЕТКА,
   '    async function таблицаУровнемНиже(tournament) {',
   '    async function таблицаУровнемНиже(tournament) { return {}; }\n    async function таблицаУровнемНиже(tournament) {',
   'таблица уровнем ниже объявлена ровно один раз'],

  [СЕТКА,
   "            processLeague(matches.filter(isCLMatch), нижняяКатегория, 'CL', таблицаНижней);",
   "            processLeague(matches.filter(isCLMatch), нижняяКатегория, 'CL', таблицаМест);",
   'нижняя лига платится своей таблицей, верхняя своей'],

  /* ЯКОРЬ ПОЕХАЛ ЗА ПРАВКОЙ 02.10: отбор соседа снизу идёт теперь по
     списку `наЛестнице`, а не по всему. Правило прежнее — «сосед берётся
     ПО ПОРЯДКУ, а не какой попало», — и откат возвращает именно это. */
  [СЕТКА,
   '        var ниже = наЛестнице.find(function(у) { return у.sort_order < свой.sort_order; });',
   '        var ниже = наЛестнице.find(function(у) { return у.id !== свой.id; });',
   'нижняя таблица берётся соседом снизу по порядку уровней'],

  /* ─── зачёт идёт вниз ─── */
  [СЕТКА,
   '                var ниже = категории.find(function(к) { return к.sort_order < своя.sort_order; });',
   '                var ниже = категории.find(function(к) { return к.sort_order > своя.sort_order; });',
   'зачёт нижней лиги идёт ВНИЗ по категориям, а не вверх'],

  [СЕТКА,
   "            var категории = (катОтвет.data || []).filter(function(к) { return к.id !== 'friendly'; });",
   '            var категории = (катОтвет.data || []);',
   'дружеские исключены из лестницы зачёта'],

  /* ─── кто в какую лигу ─── */
  [СЕТКА,
   '    function лигаМеста(tournament, place) {',
   '    function лигаМеста(tournament, place) { return "CL"; }\n    function лигаМеста(tournament, place) {',
   'деление по лигам объявлено один раз'],

  [СЕТКА,
   "                    if (лигаМеста(tournament, st.place) === 'PL') {",
   '                    if (st.place <= qualifiers) {',
   'генератор лиг и групповая таблица делят одинаково'],

  [СЕТКА,
   '        return (place && place <= выходит) ? \'PL\' : \'CL\';',
   '        return (place && place <= Math.floor(выходит / 2)) ? \'PL\' : \'CL\';',
   'деление считает от «выходят из группы», а не от половины'],

  /* ─── словом, а не цветом ─── */
  [СЕТКА,
   "                    (isPLRow ? ' <span class=\"ad-badge ad-league-go ad-league-pl\">' + L.leagueGoPL + '</span>' : '') +",
   "                    (isPLRow ? ' <span style=\"color:var(--accent);font-size:0.65rem;\">&#9654;</span>' : '') +",
   'в строке стоит название лиги, а не значок'],

  [СЕТКА,
   "                var isPLRow = вЛигу === 'PL' && группаДоиграна;",
   "                var isPLRow = вЛигу === 'PL' && allGroupCompleted;",
   'пометка появляется, когда доиграна СВОЯ группа'],

  [CSS,
   '    font-size: var(--fs-2xs);\n    font-weight: 600;\n    padding: 2px 8px;',
   '    font-size: 0.65rem;\n    font-weight: 600;\n    padding: 2px 8px;',
   'бейдж лиги стоит на шкале и не раздвигает строку'],

  [CSS,
   '.ad-league-pl {\n    background: var(--accent);\n    color: #0A0A0A;\n}',
   '.ad-league-pl {\n    background: var(--accent);\n    color: #FFFFFF;\n}',
   'высшая лига красится акцентом с почти-чёрным текстом'],

  /* Стенд остался на прежней версии, страница ушла вперёд: глазами на
     странице всё хорошо, а стенд меряет вчерашний файл. */
  /* Якорь без номера: сам номер меняется при каждой правке, и откат,
     записанный числом, состарится ровно так же, как состарилось правило,
     которое он проверяет. */
  [СТЕНД_ЗАМЕР,
   'rating-points.js?v=',
   'rating-points.js?v=0',
   'версия rating-points.js одна на странице и стендах'],

  /* ─── предел мест у уровня: восьмёрка платит восемь ─── */
  [УТИЛИТЫ,
   "        return (у && у.max_place) || 64;",
   "        return 64;",
   'предел читается из уровня, а не зашит'],

  [УТИЛИТЫ,
   "            return с.place <= A.пределМест(с.level_id);",
   "            return true;",
   'место за пределом не доходит до читателя'],

  [СЕТКА,
   "        return await A.местаУровня(ниже.id);",
   "        var ответ = await A.client.from('points_by_place')\n            .select('place, points')\n            .eq('level_id', ниже.id);\n        var таблица = {};\n        (ответ.data || []).forEach(function(с) { таблица[с.place] = с.points; });\n        return таблица;",
   'нижняя лига берёт места через общее чтение'],

  [УТИЛИТЫ,
   "        var у = (A.cachedLevels || []).find(function(l) { return l.id === levelId; });\n        return (у && у.max_place) || 64;",
   "        var у = (A.cachedLevels || []).find(function(l) { return l.id === levelId; });\n        return у.max_place;",
   'пока колонки нет, предел равен 64'],

  [УТИЛИТЫ,
   "    A.пределМест = function(levelId) {",
   "    A.пределМест = function(levelId) { var _ = 'max_place on_ladder'; }\n    A.пределМест = function(levelId) {",
   'предел не склеен с лестницей'],

  [ОЧКИ,
   "    var МЕСТ_ПО_ТАБЛИЦЕ = 4;",
   "    var МЕСТ_ПО_ТАБЛИЦЕ = 4;\n    var предел = 64;",
   'предел не заводит своего условия в правиле очков'],

  [ПРЕДЕЛ_SQL,
   "   SET max_place = 8",
   "   SET max_place = 64",
   'восьмёрка названа в миграции числом, а не словом'],

  [ПРЕДЕЛ_SQL,
   " WHERE sort_order = 1;\n\n-- ---- Шаг 4.",
   " WHERE name = 'Итоговый турнир';\n\n-- ---- Шаг 4.",
   'миграция предела привязана к порядку, а не к имени'],

  [ПРЕДЕЛ_SQL,
   "    IF итоговых <> 1 THEN",
   "    IF итоговых < 0 THEN",
   'миграция предела отказывается при чужом числе уровней'],

  [ПРЕДЕЛ_SQL,
   "    IF восьмёрок <> 1 THEN",
   "    IF восьмёрок < 0 THEN",
   'миграция предела перечитывает внутри транзакции'],

  /* ─── крестик удаления уровня: числа до вопроса ─── */
  [НАСТРОЙКИ,
   "        var что = await чтоПотеряетУровень(levelId);\n        if (!что) return;\n        if (что.турниров > 0) {\n            A.showToast(\n                L.ratLevelHasTournaments\n                    .replace('{n}', что.турниров)\n                    .replace('{m}', что.строкИтогов),\n                'error');\n            return;\n        }\n\n        // Unlink tournaments",
   "        // Unlink tournaments",
   'порог стоит у самого удаления, а не только у кнопки'],

  [НАСТРОЙКИ,
   "        if (турниры.error || места.error) {\n            A.showToast((турниры.error || места.error).message, 'error');\n            return null;\n        }",
   "        if (турниры.error || места.error) {\n            return { турниров: 0, мест: 0, строкИтогов: 0 };\n        }",
   'ошибка чтения не превращается в ноль'],

  [СЛОВАРЬ,
   "        ratDeleteLevelConfirm: 'Удалить уровень? Вместе с ним исчезнут {n} строк таблицы очков за место. Отката нет.',",
   "        ratDeleteLevelConfirm: 'Удалить этот уровень и все его правила?',",
   'диалог называет, сколько мест исчезнет'],

  [СЛОВАРЬ,
   "в них {m} строк итогов",
   "в них несколько строк итогов",
   'отказ называет и турниры, и строки итогов'],

  [НАСТРОЙКИ,
   "            var что = await чтоПотеряетУровень(levelId);\n            if (!что) return;",
   "            var что = { турниров: 0, мест: 64, строкИтогов: 0 };",
   'кнопка считает прежде, чем спрашивать'],

  [НАСТРОЙКИ,
   "    async function чтоПотеряетУровень(levelId) {",
   "    async function чтоПотеряетУровень(levelId) { return null; }\n    async function чтоПотеряетУровень(levelId) {",
   'подсчёт потерь живёт ОДНИМ определением'],

  /* ─── экран очков по местам ─── */
  [НАСТРОЙКИ,
   "        var места = _местаЭкрана || [];",
   "        var места = _местаЭкрана || []; var ROUND_KEYS = A.ROUND_KEYS;",
   'экран читает места, а не раунды'],

  [УТИЛИТЫ,
   "    A.местаВсехУровней = async function(обновить) {",
   "    A.местаВсехУровней2 = async function(обновить) {\n        var _ = await A.client.from('points_by_place').select('place');\n    };\n    A.местаВсехУровней = async function(обновить) {",
   'чтение мест живёт ОДНИМ определением, в core'],

  [УТИЛИТЫ,
   "        return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bishkek' });",
   "        return new Date().toLocaleDateString('sv-SE');",
   'сегодня считается по Бишкеку, а не по браузеру'],

  [УТИЛИТЫ,
   "        var в = все.filter(function(в) { return в.effective_from <= сегодня; })[0] || null;",
   "        var в = все[0] || null;",
   'действующая версия — последняя наступившая'],

  [УТИЛИТЫ,
   "        if (versionId) запрос = запрос.eq('version_id', versionId);",
   "        запрос = запрос.eq('version_id', versionId);",
   'нет версий — таблица читается целиком'],

  [НАСТРОЙКИ,
   "            if (новое === было[id]) return;         // не тронуто",
   "",
   'сохранение пишет только изменённое'],

  [НАСТРОЙКИ,
   "                .eq('id', правки[i].id);",
   "                .eq('level_id', правки[i].id);",
   'правка идёт по id строки, а не по отбору заново'],

  [НАСТРОЙКИ,
   "        var сверка = await перечитатьМеста();\n        var разошлось = правки.filter(function(п) { return сверка[п.id] !== п.points; });",
   "        var разошлось = [];",
   'результат записи проверяется чтением'],

  [НАСТРОЙКИ,
   "        if (правит) {\n            var saveBtn = document.getElementById('setSaveRulesBtn');",
   "        if (true) {\n            var saveBtn = document.getElementById('setSaveRulesBtn');",
   'у менеджера кнопок нет вовсе'],

  [НАСТРОЙКИ,
   "        if (!правит && A.currentRole !== 'manager') {",
   "        if (!правит) {",
   'менеджер видит вкладку очков'],

  [НАСТРОЙКИ,
   "            html += '<div class=\"ad-pts-band\"><div class=\"ad-pts-band-text\">' +",
   "            html += '<div class=\"ad-pts-nope\"><div class=\"ad-pts-band-text\">' +",
   'плашка вместо переключателя'],

  [НАСТРОЙКИ,
   "                    if (место > A.пределМест(lv.id)) {",
   "                    if (false) {",
   'место за пределом рисуется прочерком'],

  [НАСТРОЙКИ,
   "            for (var место = 1; место <= строк; место++) {",
   "            for (var место = 1; место <= 64; место++) {",
   'число строк берётся из пределов, а не зашито'],

  [НАСТРОЙКИ,
   "            await завестиМестаУровня(name);",
   "",
   'новый уровень получает места'],

  [АДМИН_CSS,
   ".ad-pts-band {",
   ".ad-pts-band-NOPE {",
   'классы экрана очков живут в admin.css, а не в макете'],

  [ЗАМЕР_ФАЙЛ,
   "  { имя: 'планшет стоя',       w: 820,  h: 1180 }",
   "  { имя: 'планшет стоя',       w: 820,  h: 1180 },\n  { имя: 'телефон',            w: 390,  h: 844 }",
   'у макета экрана нет четвёртого вида'],

  /* ─── прокрутка, порядок колонок и шапка ─── */
  [АДМИН_CSS,
   ".ad-pts-scroll { /* пусто намеренно: см. выше */ }",
   ".ad-pts-scroll { max-height: 560px; overflow: auto; }",
   'прокрутки внутри прокрутки нет'],

  [АДМИН_CSS,
   "    position: sticky; top: var(--header-h); z-index: 2;",
   "    position: sticky; top: 0; z-index: 2;",
   'шапка липнет к шапке сайта, а не к краю окна'],

  [НАСТРОЙКИ,
   "        var cachedLevels = (A.cachedLevels || []).slice().sort(function(a, b) {\n            return (b.sort_order || 0) - (a.sort_order || 0);\n        });",
   "        var cachedLevels = A.cachedLevels || [];",
   'колонки идут от старшей категории к младшей'],

  [АДМИН_CSS,
   ".ad-pts-limit {\n    display: block;",
   ".ad-pts-limit {\n    display: inline;",
   'предел подписан отдельной строкой, а не встык'],

  [АДМИН_CSS,
   ".ad-pts th .set-del-level {\n    position: absolute; top: 2px; right: 2px;",
   ".ad-pts th .set-del-level {\n    top: 2px; right: 2px;",
   'крестик стоит в углу шапки, а не строкой под ней'],

  [МАКЕТ_ОЧКИ,
   "    h += '<th><span>' + у.имя + '</span>' +",
   "    h += '<th>' + у.имя + '' +",
   'макет рисует шапку ТОЙ ЖЕ разметкой, что продукт'],

  [АДМИН_CSS,
   ".ad-pts-in { -moz-appearance: textfield; appearance: textfield; }",
   ".ad-pts-in { }",
   'у поля очков нет стрелок «на 1»'],

  [НАСТРОЙКИ,
   "                e.target.blur();",
   "                var _ = e;",
   'колесо над полем не меняет число'],

  [СЛОВАРЬ,
   /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, А НЕ НА СОСЕДЕ. Здесь стояла пара
      «ratPlacesLimit + ratBeyondLimit», и соседа отодвинул вставленный
      между ними блок подписей версий — откат перестал применяться. */
   "           Колонка и так называется местами, «до» в ней ничего не добавляет. */\n        ratPlacesLimit: '{n}',",
   "           Колонка и так называется местами, «до» в ней ничего не добавляет. */\n        ratPlacesLimit: 'до {n}',",
   'предел подписан одним числом, без «до»'],

  [ТЕСТ_ФАЙЛ,
   "        test.skip(/mobile|phone/.test(info.project.name),",
   "        test.skip(false && /mobile/.test(info.project.name),",
   'тест экрана пропускает телефон, а не мерит его мягче'],

  [ТЕСТ_ФАЙЛ,
   "        await expect(поле).toHaveValue(было);   // ждём признак, а не таймер",
   "        await page.waitForTimeout(300);",
   'тест экрана ждёт признаки, а не таймеры'],

  [ТЕСТ_ФАЙЛ,
   "        await expect(page.locator('.set-del-level')).toHaveCount(0);",
   "        await page.locator('#setNewVerBtn').click();",
   'тест не нажимает кнопок, которые пишут в базу'],

  [ТЕСТ_ФАЙЛ,
   "        await expect(page.locator('#setRulesTable .ad-pts-in')).toHaveCount(264);",
   "        await expect(page.locator('#setRulesTable .ad-pts-in')).not.toHaveCount(0);",
   'тест держит числа, а не «примерно столько»'],

  [СЛОВАРЬ,
   "        ratBandTitle: 'Таблица одна, а начисляет она двумя способами.',",
   "        ratBandTitle: 'Таблица одна, а платит она двумя способами.',",
   'в плашке очки НАЧИСЛЯЮТСЯ, а не «платятся»'],

  /* Откат повторяет ровно ту ошибку, что легла 03.10: русская подпись
     уезжает в английский словарь, и в русской админке ключа нет вовсе. */
  [СЛОВАРЬ,
   "        ratPerWin: 'за победу',",
   "",
   'каждая подпись экрана очков есть ровно на двух языках'],

  [МАКЕТ_ОЧКИ,
   "    background: var(--accent); color: var(--bg-base); font-weight: 600;",
   "    color: var(--text-primary); font-weight: 600;",
   'полоса версий — переключатель, а не подпись'],

  [МАКЕТ_ОЧКИ,
   '        <span class="st-ver st-ver-more">Ещё 3</span>',
   '        <span class="st-ver">В силе с 01.01.2021</span>',
   'длинный список версий отсекается, как итоги двух лиг'],

  /* ─── версии: третья часть и окно ─── */
  /* Якорь берётся ВМЕСТЕ С СОСЕДОМ: сама строка стоит в коде дважды — в
     завершении групп и в завершении двух лиг, — и одиночный якорь ронял
     прувер сообщением «встречается 2 раза». */
  [СЕТКА,
   "            var правилаОчков = await A.правилаНачисления(true);\n\n            var toUpsert = [];",
   "            var правилаОчков = { заПобеды: true };\n\n            var toUpsert = [];",
   'числа версии доходят до начисления'],

  [ОЧКИ,
   "            var заУчастие = typeof правила.заУчастие === 'number' ? правила.заУчастие : ЗА_УЧАСТИЕ;",
   "            var заУчастие = правила.заУчастие || ЗА_УЧАСТИЕ;",
   'ноль за участие — законное число версии'],

  [НАСТРОЙКИ,
   "        var места = _местаЭкрана || [];",
   "        var места = A._местаОчков || [];",
   'экран держит свои места, а не общий кэш начисления'],

  [УТИЛИТЫ,
   "        var версия = await A.действующаяВерсия();\n        var все = await A.местаВерсии(версия ? версия.id : null);",
   "        var все = await A.местаВерсии(A._местаВерсииId);",
   'начисление всегда берёт действующую версию'],

  [НАСТРОЙКИ,
   "        var правит = A.currentRole === 'admin' && версия !== null && !вСиле;",
   "        var правит = A.currentRole === 'admin';",
   'правится только невступившая, и это условие, а не вежливость'],

  [НАСТРОЙКИ,
   "        завтра.setUTCDate(завтра.getUTCDate() + 1);",
   "        завтра.setUTCDate(завтра.getUTCDate());",
   'новая версия заводится не раньше завтрашнего дня'],

  [НАСТРОЙКИ,
   "            .select('level_id, place, points')",
   "            .select('level_id, place')",
   'копия версии полная, а не обрезанная пределом'],

  [НАСТРОЙКИ,
   "                var id = поКлючу[правки[i].level_id + '|' + правки[i].place];",
   "                var id = правки[i].id;",
   'правки переносятся по месту и уровню, а не по id'],

  [НАСТРОЙКИ,
   "        if (сверка.error || сверка.count !== строки.length) {",
   "        if (false) {",
   'заведение версии проверяется чтением'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-ochki-i-ligi.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*·\s/.test(с))
                .map(с => с.replace(/^\s*·\s*/, '').trim());
  }
}

let плохо = 0;
console.log('');
ОТКАТЫ.forEach(([ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ откат ' + (i + 1) + ': ждали «' + ждём + '»');
    console.log('    упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else {
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём + (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо === 0) {
  console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
  console.log('');
  process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);
