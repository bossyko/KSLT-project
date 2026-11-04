#!/usr/bin/env node
/** ПРУВЕР К ЗАМОРОЗКЕ «ЖАЛОБЫ, БЛОКИРОВКИ И ЗАСЛОН» (04.11).
 *
 *  Берёт КОПИЮ файлов, возвращает прежнее значение и требует, чтобы
 *  упало ИМЕННО то правило, которое за это отвечает. «У меня зелёное»
 *  ничего не доказывает. Оригиналы не трогаются.
 */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-zhaloby-i-blokirovki.js';

const ФУНКЦИИ = 'sql/схема/apple-1-2-funkcii.sql';
const ЗАСЛОН  = 'sql/схема/apple-1-2-zaslon.sql';
const КОНТАКТЫ= 'sql/схема/apple-1-2-kontakty.sql';
const ВИТРИНА = 'sql/доступ/players-public-zakryt-04nov.sql';
const СПИСОК  = 'js/players.js';
const РЕЙТИНГ = 'js/rankings-data.js';
const РЕЙТПРИЛ= 'mobile/www/js/screens/rating.js';
const ПРАВА   = 'sql/схема/apple-1-2-prava.sql';
const БАНЫ    = 'sql/схема/apple-1-2-bany-vse.sql';
const КАРТОЧКА= 'mobile/www/js/screens/player-detail.js';
const КАБИНЕТ = 'mobile/www/js/screens/profile.js';
const ВХОД    = 'mobile/www/js/auth.js';
const СЛОВАРЬ = 'mobile/www/js/i18n.js';
const СТРАНИЦА= 'js/player.js';
const КАБСАЙТА= 'js/dashboard.js';
const АДМИНКА = 'js/admin/sections/safety.js';
const ОДЕЖДА  = 'mobile/www/css/app.css';

const ОТКАТЫ = [
    { имя: 'триггер на вызовах снят',
      ждём: 'заслон стоит триггером на вызовах', файл: ЗАСЛОН,
      было: 'CREATE TRIGGER challenges_block_trg',
      станет: 'CREATE TRIGGER challenges_block_OFF' },

    { имя: 'триггер на приглашениях снят',
      ждём: 'заслон стоит триггером на приглашениях', файл: ЗАСЛОН,
      было: 'CREATE TRIGGER game_invites_block_trg',
      станет: 'CREATE TRIGGER game_invites_block_OFF' },

    { имя: 'заслон смотрит в одну сторону',
      ждём: 'заслон действует в обе стороны', файл: ЗАСЛОН,
      было: "            OR (blocker_profile_id = b AND blocked_profile_id = a)",
      станет: "" },

    /* САМЫЙ ВАЖНЫЙ ОТКАТ: тихая отмена превращается в громкую. */
    { имя: 'блокировка начала трубить клубу',
      ждём: 'блокировка не трубит клубу', файл: ФУНКЦИИ,
      было: "        INSERT INTO notification_log (profile_id, type, title, message, is_read)",
      станет: "        INSERT INTO push_log (admin_id, title, message, type, audience, recipients_count, fcm_sent)\n        VALUES (v_me, 'Баттл отменён', 'матч не состоится', 'battle', 'all', 0, 0);\n        INSERT INTO notification_log (profile_id, type, title, message, is_read)" },

    { имя: 'уведомление назвало блокировку по имени',
      ждём: 'уведомление не называет блокировку', файл: ФУНКЦИИ,
      было: "                 ELSE 'Вызов отклонён.' END,",
      станет: "                 ELSE 'Вас заблокировали.' END," },

    { имя: 'парные баттлы стали отменяться',
      ждём: 'отменяются только одиночные баттлы', файл: ФУНКЦИИ,
      было: "               AND coalesce(format, 'singles') = 'singles'\n               AND ( (challenger_id = v_me AND opponent_profile_id = v_him)",
      станет: "               AND ( (challenger_id = v_me AND opponent_profile_id = v_him)" },

    { имя: 'про парный матч перестали говорить',
      ждём: 'парные считаются отдельно и называются вслух', файл: КАРТОЧКА,
      было: "          if (о.parnyh > 0) слово += ' ' + I18N.t('blk.doneParnyh');",
      станет: "" },

    { имя: 'права снова снимают только у PUBLIC',
      ждём: 'права снимаются у anon, а не только у PUBLIC', файл: ПРАВА,
      было: "        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.подпись);",
      станет: "" },

    { имя: 'у authenticated права не снимают перед возвратом',
      ждём: 'права снимаются и у authenticated перед возвратом', файл: ПРАВА,
      было: "        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f.подпись);",
      станет: "" },

    { имя: 'внутренняя функция снова открыта вошедшим',
      ждём: 'внутренние функции не возвращаются никому', файл: ПРАВА,
      было: "GRANT EXECUTE ON FUNCTION public.kslt_tekst_chist(text) TO authenticated;",
      станет: "GRANT EXECUTE ON FUNCTION public.kslt_tekst_chist(text) TO authenticated;\nGRANT EXECUTE ON FUNCTION public.kslt_est_blokirovka(uuid, uuid) TO authenticated;" },

    /* ОТКАТ НА БЕДУ, КОТОРАЯ УЖЕ СЛУЧИЛАСЬ 04.11 И УБИЛА КАБИНЕТ. */
    { имя: 'связь profiles↔players снова без имени',
      ждём: 'кабинет приложения называет связь поимённо', файл: ВХОД,
      было: "\n      .select('*, players!profiles_player_id_fkey(id, name, name_en",
      станет: "\n      .select('*, players(id, name, name_en" },

    { имя: 'из окна блокировки пропал пункт',
      ждём: 'окно блокировки перечисляет шесть последствий', файл: КАРТОЧКА,
      было: "    var пункты = ['blk.w1', 'blk.w2', 'blk.w3', 'blk.w4', 'blk.w5', 'blk.w6']",
      станет: "    var пункты = ['blk.w1', 'blk.w2', 'blk.w3', 'blk.w4', 'blk.w5']" },

    { имя: 'плашка про результаты убрана',
      ждём: 'окно обещает сохранность турнирных результатов', файл: КАРТОЧКА,
      было: "      '<div class=\"pd-blk-keep\"><strong>' + esc(I18N.t('blk.keepTitle')) + '</strong>' +\n        '<span>' + esc(I18N.t('blk.keepText')) + '</span></div>' +",
      станет: "" },

    { имя: 'окно снова обещает исчезновение из списков',
      ждём: 'окно не обещает того, чего код не делает', файл: СЛОВАРЬ,
      было: "    'blk.w4':            { ru: 'не увидит ваши контакты в карточке',",
      станет: "    'blk.w4':            { ru: 'исчезнет из ваших списков и поиска'," },

    { имя: 'кыргызский потерян у ключа блокировки',
      ждём: 'ключ blk.do есть на трёх языках', файл: СЛОВАРЬ,
      было: "    'blk.do':            { ru: 'Заблокировать', en: 'Block',              kg: 'Бөгөттөө' },",
      станет: "    'blk.do':            { ru: 'Заблокировать', en: 'Block',              kg: '' }," },

    { имя: 'экран заблокированных убран из приложения',
      ждём: 'кабинет приложения показывает заблокированных', файл: КАБИНЕТ,
      было: "    supabaseClient.rpc('kslt_moi_blokirovki').then(function(r) {",
      станет: "    Promise.resolve({ data: [] }).then(function(r) {" },

    { имя: 'экран заблокированных убран из кабинета сайта',
      ждём: 'кабинет сайта показывает заблокированных', файл: КАБСАЙТА,
      было: "            r = await client.rpc('kslt_moi_blokirovki');",
      станет: "            r = { data: [] };" },

    { имя: 'сайт перестал звать жалобу',
      ждём: 'сайт зовёт kslt_pozhalovatsya', файл: СТРАНИЦА,
      было: "            client.rpc('kslt_pozhalovatsya', {",
      станет: "            Promise.resolve({ data: { ok: true } }).then(function(){}) || client.rpc('kslt_NET', {" },

    { имя: 'состояние блокировки перестали читать',
      ждём: 'кнопка, которая откажет, не рисуется', файл: СТРАНИЦА,
      было: "    var _заблокирован = false;",
      станет: "    window._заблокирован = false;" },

    { имя: 'вкладка банов снова читает только players',
      ждём: 'вкладка банов читает оба вида', файл: АДМИНКА,
      было: "            запрос = A.client.rpc('kslt_bany_vse');",
      станет: "            запрос = A.client.from('players')\n                .select('id, name, banned_until, ban_reason')\n                .gt('banned_until', new Date().toISOString());" },

    { имя: 'снятие бана перестало различать вид',
      ждём: 'снятие бана выбирает действие по виду', файл: АДМИНКА,
      было: "        var учётка = кнопка.getAttribute('data-vid') === 'uchyotka';",
      станет: "        var учётка = false;" },

    { имя: 'в админку пролезло снятие чужой блокировки',
      ждём: 'чужую блокировку админ не снимает', файл: АДМИНКА,
      было: "    function снятьБан(кнопка) {",
      станет: "    function снятьЧужуюБлокировку(id) { return A.client.rpc('kslt_razblokirovat', { p_player_id: id }); }\n    function снятьБан(кнопка) {" },

    { имя: 'общий список банов открыли анониму',
      ждём: 'общий список банов закрыт для anon', файл: БАНЫ,
      было: "REVOKE ALL ON FUNCTION public.kslt_bany_vse() FROM anon;",
      станет: "" },

    { имя: 'цель нажатия ушла ниже 44',
      ждём: 'кнопки безопасности держат 44', файл: ОДЕЖДА,
      было: ".pd-safety-btn {\n  flex: 1 1 0;\n  min-height: 44px;",
      станет: ".pd-safety-btn {\n  flex: 1 1 0;\n  min-height: 36px;" },

    { имя: 'галочка выбора причины убрана',
      ждём: 'причина жалобы несёт галочку, а не только подсветку', файл: ОДЕЖДА,
      было: ".pd-rep-tick {\n  flex: 0 0 auto;",
      станет: ".pd-rep-tickOFF {\n  flex: 0 0 auto;" },

    /* ── 04.11: ПЕРЕЗАГРУЗКА ВМЕСТО ПЕРЕРИСОВКИ ──
       Ровно то, что стояло на сайте и съедало тост о числе отменённых
       матчей. Якорь держится на содержимом — на зове перерисовки. */
    { имя: 'сайт снова перезагружает страницу после блокировки',
      ждём: 'сайт после блокировки перерисовывает, а не перезагружает',
      файл: СТРАНИЦА,
      было: "сказать(слово, 'ok');",
      станет: "сказать(слово, 'ok');\n                location.reload();\n                //" },

    { имя: 'снятие блокировки на сайте перестало перерисовывать',
      ждём: 'снятие блокировки на сайте тоже перерисовывает',
      файл: СТРАНИЦА,
      было: "/* ТОТ ЖЕ СПОСОБ, ЧТО У БЛОКИРОВКИ ВЫШЕ. */\n            renderProfile(data);",
      станет: "location.reload();" },

    { имя: 'приложение перестало перерисовывать после блокировки',
      ждём: 'приложение после блокировки перерисовывает тем же способом',
      файл: КАРТОЧКА,
      было: "toast(слово);\n          PD.open(_playerId);",
      станет: "toast(слово);\n          location.reload();" },

    /* ── 04.11: КОНТАКТЫ СНОВА ПРЯЧЕТ РАЗМЕТКА ──
       Ровно то, что висело долгом: прямой запрос телефона к таблице. */
    { имя: 'функция контактов открыта анониму',
      ждём: 'функция контактов заведена и закрыта анониму', файл: КОНТАКТЫ,
      было: 'REVOKE ALL ON FUNCTION public.kslt_kontakty(text) FROM anon;',
      станет: '' },

    { имя: 'функция контактов смотрит блокировку в одну сторону',
      ждём: 'функция контактов смотрит блокировку в обе стороны', файл: КОНТАКТЫ,
      было: 'public.kslt_est_blokirovka(v_me, v_him)',
      станет: 'EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_profile_id = v_me AND b.blocked_profile_id = v_him)' },

    { имя: 'сайт вернулся к прямому запросу телефона',
      ждём: 'сайт просит контакты у функции, а не у таблицы', файл: СТРАНИЦА,
      было: "var res = await client.rpc('kslt_kontakty', { p_player_id: playerId });",
      станет: "var res = await client.from('profiles').select('phone, show_phone').eq('player_id', playerId).maybeSingle();" },

    { имя: 'приложение вернулось к прямому запросу телефона',
      ждём: 'приложение просит контакты у функции, а не у таблицы', файл: КАРТОЧКА,
      было: "supabaseClient.rpc('kslt_kontakty', { p_player_id: playerId })",
      станет: "supabaseClient.from('profiles').select('phone, show_phone').eq('player_id', playerId).maybeSingle()" },

    { имя: 'кабинет сайта снова показывает сырую ошибку базы',
      ждём: 'кабинет сайта объясняет отказ фильтра', файл: КАБСАЙТА,
      было: "errMsg = L.errStopWord;",
      станет: "errMsg = L.errPhoneTaken;" },

    { имя: 'кабинет приложения снова показывает безымянный отказ',
      ждём: 'кабинет приложения объясняет отказ фильтра', файл: КАБИНЕТ,
      было: "var стоп = String(r.error.message || '').indexOf('KSLT_STOP_WORD') !== -1;",
      станет: "var стоп = false;" },

    { имя: 'витрина снова считает только бан карточки',
      ждём: 'витрина считает признак из обоих видов бана', файл: ВИТРИНА,
      было: 'EXISTS (SELECT 1 FROM public.profiles pr',
      станет: 'EXISTS (SELECT 1 FROM public.players pr' },

    { имя: 'список снова считает метку из срока бана',
      ждём: 'список читает готовый признак, а не срок бана', файл: СПИСОК,
      было: 'if (!p || !p.zakryt) return \'\';',
      станет: 'if (!p || !(p.banned_until && new Date(p.banned_until) > new Date())) return \'\';' },

    { имя: 'рейтинг снова дочитывает сроки отдельным запросом',
      ждём: 'рейтинг не дочитывает сроки бана отдельным запросом', файл: РЕЙТИНГ,
      было: 'zakryt: !!p.zakryt,',
      станет: 'banned_until: p.banned_until || null,' },

    { имя: 'метка снова нарисована инлайном',
      ждём: 'метка бана живёт классом, а не инлайном', файл: СПИСОК,
      было: '<span class="pl-zakryt">',
      станет: '<span style="padding:1px 6px">' },

    { имя: 'в рейтинге приложения метка считает бан сама',
      ждём: 'рейтинг приложения показывает метку тем же признаком', файл: РЕЙТПРИЛ,
      было: "if (!p || !p.zakryt) return '';",
      станет: "if (!p || !(p.banned_until && new Date(p.banned_until) > new Date())) return '';" },

    { имя: 'рейтинг приложения перестал просить признак у витрины',
      ждём: 'рейтинг приложения просит признак у витрины', файл: РЕЙТПРИЛ,
      было: "is_member, is_guest, zakryt'",
      станет: "is_member, is_guest'" },

    /* ── ОТКАТ НА МОЛЧАНИЕ ── подпись это не код. */
    { имя: 'МОЛЧАНИЕ: подпись к тихой отмене переписана',
      ждём: null, файл: ФУНКЦИИ,
      было: "-- ТИХАЯ ОТМЕНА — РЕШЕНИЕ КОСТИ 04.11",
      станет: "-- Тихая отмена. Решено так" }
];

const НУЖНЫ = [ФУНКЦИИ, ЗАСЛОН, ПРАВА, БАНЫ, КОНТАКТЫ, ВИТРИНА, СПИСОК, РЕЙТИНГ, РЕЙТПРИЛ,
               КАРТОЧКА, КАБИНЕТ, ВХОД,
               СЛОВАРЬ, СТРАНИЦА, КАБСАЙТА, АДМИНКА, ОДЕЖДА,
               ПРИБОР, 'tools/bez-kommentariev.js'];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-1-2-'));
    for (const ф of НУЖНЫ) {
        const куда = path.join(к, ф);
        fs.mkdirSync(path.dirname(куда), { recursive: true });
        fs.copyFileSync(path.join(КОРЕНЬ, ф), куда);
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ЖАЛОБЫ, БЛОКИРОВКИ И ЗАСЛОН\n');
{
    const к = копия(); const в = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (в.indexOf('НЕ ТАК') !== -1) { console.log('  ОСТАНОВ  копия уже не проходит\n' + в); process.exit(1); }
    console.log('  база    исходный код правил проходит\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия(); const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const n = было.split(о.было).length - 1;
    if (n !== 1) { console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + n + ' РАЗ'); беда++; fs.rmSync(к,{recursive:true,force:true}); continue; }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    if (о.файл.endsWith('.js')) {
        try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
        catch (e) { console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС'); беда++; fs.rmSync(к,{recursive:true,force:true}); continue; }
    }
    const в = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (о.ждём === null) {
        if (в.indexOf('НЕ ТАК') === -1) console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        else { console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать'); беда++; }
        continue;
    }
    if (в.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (в.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) { console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');
