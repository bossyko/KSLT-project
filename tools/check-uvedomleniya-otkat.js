#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ УВЕДОМЛЕНИЙ (шаг A2.3, 29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-uvedomleniya.js';
const ДОМ_П = 'mobile/www/js/kslt-uvedomleniya.js';
const САЙТ = 'js/dashboard.js';
const ПРИЛ = 'mobile/www/js/screens/profile.js';

const ОТКАТЫ = [
  { имя: 'из дома убрано понятие', ждём: 'дом объявлен и отдаёт все шесть понятий',
    файл: ДОМ, было: '    API.каналДоступен = function (канал, профиль) {',
    станет: '    API.каналГоден = function (канал, профиль) {' },

  { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
    файл: ДОМ_П, было: '    var API = global.KSLT_UVEDOMLENIYA = {};',
    станет: '    var API = global.KSLT_UVEDOMLENIYA = {}; /* уехало */' },

  { имя: 'канал `site` вернулся в дом', ждём: 'КАНАЛЫ дома — ровно те, что спрашивает сервер',
    файл: ДОМ, было: "    API.КАНАЛЫ = ['tg', 'email'];",
    станет: "    API.КАНАЛЫ = ['site', 'tg', 'email'];" },

  { имя: 'из разделов выпали security и general',
    ждём: 'РАЗДЕЛЫ дома — ровно те, что спрашивает сервер',
    файл: ДОМ,
    было: "    API.РАЗДЕЛЫ = ['tournaments', 'challenges', 'membership', 'matches',\n                   'security', 'general'];",
    станет: "    API.РАЗДЕЛЫ = ['tournaments', 'challenges', 'membership', 'matches'];" },

  { имя: 'правило разошлось с серверным',
    ждём: 'правило «включено ли» повторяет серверное знак в знак',
    файл: ДОМ, было: '        return ч[раздел] !== false;',
    станет: '        return ч[раздел] === true;' },

  { имя: '`переключить` стал править на месте',
    ждём: '`переключить` не трогает прежний слепок',
    файл: ДОМ, было: '        if (!н[канал]) н[канал] = {};\n        н[канал][раздел] = !!включить;\n        return н;',
    станет: '        if (!настройки[канал]) настройки[канал] = {};\n        настройки[канал][раздел] = !!включить;\n        return настройки;' },

  { имя: 'сайт снова держит свой список', ждём: 'у сайта нет своих списков каналов и разделов',
    файл: САЙТ, было: '    function NOTIF_CATS() { return window.KSLT_UVEDOMLENIYA.РАЗДЕЛЫ; }',
    станет: "    var NOTIF_CATS = ['membership', 'tournaments', 'matches', 'challenges'];" },

  { имя: 'приложение снова держит свой список',
    ждём: 'у приложения нет своих списков каналов и разделов',
    /* ОТКАТ ОБЯЗАН БЫТЬ НАСТОЯЩИМ: первая редакция прятала свой список
       в комментарий `// key: 'payment'`, а правило читает текст БЕЗ
       комментариев — и не падало. Второй раз за день та же ошибка
       отката, первый был с `invoke` в куске A3.7в. */
    файл: ПРИЛ,
    было: '    var настройки = U.прочитать(_profile);',
    станет: "    var свои = [{ key: 'payment' }, { key: 'marketing' }];\n    var настройки = U.прочитать(_profile);" },

  { имя: 'сайт снова считает «включено» сам', ждём: 'у сайта нет своего правила «включено ли»',
    файл: САЙТ, было: '        return window.KSLT_UVEDOMLENIYA.включено(prefs, channel, cat);',
    станет: '        if (!prefs || !prefs[channel]) return true;\n        return prefs[channel][cat] !== false;' },

  { имя: 'приложение снова считает «включено» само',
    ждём: 'у приложения нет своего правила «включено ли»',
    файл: ПРИЛ, было: '        var вкл = U.включено(настройки, канал, раздел);',
    станет: '        var вкл = !настройки[канал] || настройки[канал][раздел] !== false;\n        var prefs = настройки; if (prefs[key] !== false) {}' },

  { имя: 'сайт перестал звать дом', ждём: 'у сайта дом зовётся',
    файл: САЙТ, было: 'KSLT_UVEDOMLENIYA', станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },

  { имя: 'приложение перестало звать дом', ждём: 'у приложения дом зовётся',
    файл: ПРИЛ, было: 'KSLT_UVEDOMLENIYA', станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },

  { имя: 'сайт перестал писать в профиль',
    ждём: 'у сайта настройки пишутся в profiles.notify_preferences',
    файл: САЙТ, было: 'notify_preferences', станет: 'notify_prefs_old', всеВхождения: true },

  { имя: 'приложение перестало писать в профиль',
    ждём: 'у приложения настройки пишутся в profiles.notify_preferences',
    файл: ПРИЛ, было: 'notify_preferences', станет: 'notify_prefs_old', всеВхождения: true },

  { имя: 'приложение снова зовёт пропавшую таблицу',
    ждём: 'у приложения нет зова к несуществующей таблице',
    файл: ПРИЛ,
    было: "        supabaseClient.from('profiles')\n          .update({ notify_preferences: стало })",
    станет: "        supabaseClient.from('notification_preferences')\n          .update({ notify_preferences: стало })" },

  { имя: 'канал `site` вернулся на экран сайта',
    ждём: 'канала `site` не осталось ни в доме, ни на экранах',
    файл: САЙТ, было: '        var chLabels = { tg: L.notifTelegram, email: L.notifEmail };',
    станет: "        var chLabels = { site: 'На сайте', tg: L.notifTelegram, email: L.notifEmail };\n        var siteCh = 'site';" },

  { имя: 'серверная функция снова трогает пропавшую таблицу',
    ждём: 'ни одна серверная функция не трогает несуществующую таблицу',
    файл: 'supabase/functions/delete-account/index.ts',
    было: '    // ЗОВ СНЯТ (кусок A2.3, 29.10). Здесь удалялись строки из таблицы',
    станет: "    await db.from('notification_preferences').delete().eq('profile_id', userId)\n    // ЗОВ СНЯТ (кусок A2.3, 29.10). Здесь удалялись строки из таблицы" },

  { имя: 'разрешение на пуши снова просят ДО записи',
    ждём: 'в приложении разрешение на пуши просят ПОСЛЕ успешной записи',
    файл: ПРИЛ,
    было: '        var было = U.прочитать(_profile);',
    станет: '        if (вкл && window.KSLT_PUSH && window.KSLT_PUSH.спросить) window.KSLT_PUSH.спросить();\n        var было = U.прочитать(_profile);' },

  { имя: 'у раздела пропало слово на одном языке',
    ждём: 'у каждого раздела есть слово на всех трёх языках',
    файл: 'mobile/www/js/i18n.js',
    было: "    'profile.notifGeneral':     { ru: 'Общие', en: 'General', kg: 'Жалпы' },\n",
    станет: "    'profile.notifGeneral':     { ru: 'Общие', en: 'General' },\n" },

  { имя: 'страница грузит настройки без дома',
    ждём: 'дом подключён и грузится ДО того, кто его зовёт',
    файл: 'pages/dashboard-kg.html',
    было: '<script src="../js/kslt-uvedomleniya.js?v=1"></script>\n    ', станет: '' },

  { имя: 'гашение канала без бота снято у приложения',
    ждём: 'гашение канала без бота есть у обоих продуктов',
    файл: ПРИЛ, было: "' prof-notif-off'", станет: "''" },

  { имя: 'прибор ослеп на серверный код',
    ждём: 'сервер вообще найден и спрашивает настройки',
    файл: 'tools/check-uvedomleniya.js',
    было: "    обойти('supabase/functions');\n    return { каналы, разделы, функций };",
    станет: "    обойти('supabase/нет-такой-папки');\n    return { каналы, разделы, функций };" }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-uved-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools', 'supabase/functions'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-uvedomleniya.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: УВЕДОМЛЕНИЯ\n');
let беда = 0;
for (const о of ОТКАТЫ) {
  const к = копия(); const п = path.join(к, о.файл);
  const было = fs.readFileSync(п, 'utf8');
  const n = было.split(о.было).length - 1;
  if (n === 0 || (!о.всеВхождения && n !== 1)) {
    console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + n + ' РАЗ');
    беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
  }
  fs.writeFileSync(п, о.всеВхождения ? было.split(о.было).join(о.станет) : было.replace(о.было, о.станет));
  const в = прогон(к);
  if (в.includes('✗ ' + о.ждём)) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
  else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
  fs.rmSync(к, { recursive: true, force: true });
}
console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }
