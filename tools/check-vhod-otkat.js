#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ВХОДА (шаг A3.7е, 29.10).
 *
 * Берёт КОПИЮ файлов, возвращает прежнее значение и требует, чтобы упало
 * ИМЕННО то правило, которое за это отвечает.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-vhod.js';
const ДОМ_П = 'mobile/www/js/kslt-vhod.js';
const САЙТ = 'js/auth.js';
const ПРИЛ = 'mobile/www/js/auth.js';
const ЗАЯВКА = 'js/tournament-register.js';
const КАБИНЕТ = 'js/dashboard.js';
const ЧИТ = ф => fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');

const ОТКАТЫ = [
  { имя: 'из дома убрано понятие', ждём: 'дом объявлен и отдаёт все одиннадцать понятий',
    файл: ДОМ, было: '    API.письмоБезопасности = function (client, событие, подробности) {',
    станет: '    API.письмоБезопасностиОткл = function (client, событие, подробности) {' },

  { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
    файл: ДОМ_П, было: '    var API = global.KSLT_VHOD = {};',
    станет: '    var API = global.KSLT_VHOD = {}; /* уехало */' },

  { имя: 'в дом вписан адрес базы', ждём: 'дом берёт адрес базы у настроек, а не вписывает',
    файл: ДОМ, было: '            адрес: global.SUPABASE_URL,',
    станет: "            адрес: global.SUPABASE_URL || 'https://qqkzszesviukopgjbead.supabase.co'," },

  { имя: 'лестница сведена к одному числу', ждём: 'лестница повтора одна и ровно та, что замерена',
    файл: ДОМ, было: '    API.ЛЕСТНИЦА_ПОВТОРА = [30, 60, 120, 300];',
    станет: '    API.ЛЕСТНИЦА_ПОВТОРА = [60, 60, 60, 60];' },

  { имя: 'разбор ответа стал слепым', ждём: 'дом разбирает ответ, пришедший не в JSON',
    файл: ДОМ, было: '        return resp.text().then(function (текст) {',
    станет: '        return resp.json().then(function (текст) {' },

  { имя: 'язык перестал уходить', ждём: 'язык уходит в send-otp всегда',
    файл: ДОМ, было: "            lang: о.язык || 'ru'",
    станет: '            identifier_only: true' },

  { имя: 'почта объявлена второй раз', ждём: 'правило почты объявлено один раз — в доме',
    файл: ПРИЛ, было: '    return window.KSLT_VHOD.почтой(адрес);',
    станет: "    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$/.test(адрес || '');" },

  { имя: 'третья копия хеша вернулась в кабинет', ждём: 'простой хеш объявлен один раз — в доме',
    файл: КАБИНЕТ, было: '        return window.KSLT_VHOD.отпечаток();',
    станет: "        var строка = navigator.userAgent;\n        var hash = 0;\n        for (var i = 0; i < строка.length; i++) { hash = ((hash << 5) - hash) + строка.charCodeAt(i); hash |= 0; }\n        return hash.toString(36);" },

  { имя: 'письмо безопасности собирается в кабинете само',
    ждём: 'письмо безопасности отправляется одним местом',
    файл: КАБИНЕТ, было: "            window.KSLT_VHOD.письмоБезопасности(client, 'password_changed');",
    станет: "            fetch('/x', { body: JSON.stringify({ event_type: 'password_changed' }) });" },

  { имя: 'сайт снова зовёт verify-otp сам', ждём: 'у сайта нет ни одного зова своей функции руками',
    файл: САЙТ, было: "                var verifyData = await window.KSLT_VHOD.проверитьКод('forgot_password', identifier, code);",
    станет: "                var verifyData = await (await fetch(SUPABASE_URL + '/functions/v1/verify-otp', { method: 'POST' })).json();" },

  { имя: 'приложение снова зовёт send-otp само', ждём: 'у приложения нет ни одного зова своей функции руками',
    файл: ПРИЛ, было: '    return window.KSLT_VHOD.отправитьКод({',
    станет: "    if (0) return fetch(window.SUPABASE_URL + '/functions/v1/send-otp');\n    return window.KSLT_VHOD.отправитьКод({" },

  { имя: 'заявка снова зовёт карточку сама', ждём: 'у заявки нет ни одного зова своей функции руками',
    файл: ЗАЯВКА, было: '        return window.KSLT_VHOD.завестиКарточку(client);',
    станет: "        return fetch(SUPABASE_URL + '/functions/v1/ensure-player-card', { method: 'POST' });" },

  { имя: 'кабинет снова зовёт карточку сам', ждём: 'у кабинета нет ни одного зова своей функции руками',
    файл: КАБИНЕТ, было: '            var д = (await window.KSLT_VHOD.карточкаИгрока(client)) || {};',
    станет: "            var д = await (await fetch(SUPABASE_URL + '/functions/v1/ensure-player-card', { method: 'POST' })).json();" },

  { имя: 'в сайт вписан адрес базы', ждём: 'у сайта не зашит адрес базы',
    файл: САЙТ, было: '    function похоже_на_почту(адрес) {',
    станет: "    var _адрес = 'https://qqkzszesviukopgjbead.supabase.co';\n    function похоже_на_почту(адрес) {" },

  { имя: 'в приложение вписан адрес базы', ждём: 'у приложения не зашит адрес базы',
    файл: ПРИЛ, было: '  function похоже_на_почту(адрес) {',
    станет: "  var _адрес = 'https://qqkzszesviukopgjbead.supabase.co';\n  function похоже_на_почту(адрес) {" },

  { имя: 'в заявку вписан адрес базы', ждём: 'у заявки не зашит адрес базы',
    файл: ЗАЯВКА, было: '    function callRegister(client, tournamentId, extra) {',
    станет: "    var _адрес = 'https://qqkzszesviukopgjbead.supabase.co';\n    function callRegister(client, tournamentId, extra) {" },

  { имя: 'в кабинет вписан адрес базы', ждём: 'у кабинета не зашит адрес базы',
    файл: КАБИНЕТ, было: '    function отпечатокУстройства() {',
    станет: "    var _адрес = 'https://qqkzszesviukopgjbead.supabase.co';\n    function отпечатокУстройства() {" },

  { имя: 'сайт перестал звать дом', ждём: 'у сайта дом зовётся',
    файл: САЙТ, было: 'KSLT_VHOD', станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },

  { имя: 'приложение перестало звать дом', ждём: 'у приложения дом зовётся',
    файл: ПРИЛ, было: 'KSLT_VHOD', станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },

  { имя: 'заявка перестала звать дом', ждём: 'у заявки дом зовётся',
    файл: ЗАЯВКА, было: 'KSLT_VHOD', станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },

  { имя: 'кабинет перестал звать дом', ждём: 'у кабинета дом зовётся',
    файл: КАБИНЕТ, было: 'KSLT_VHOD', станет: 'KSLT_ЧУЖОЙ', всеВхождения: true },

  { имя: 'в приложение вернулась плоская задержка', ждём: 'у приложения нет плоской задержки повтора',
    файл: ПРИЛ, было: '      startResendCooldown(window.KSLT_VHOD.задержкаПовтора());',
    станет: '      startResendCooldown(60);' },

  { имя: 'вход через Apple снесён у сайта', ждём: 'вход через Apple у сайта на месте',
    файл: САЙТ, было: '    if (window.KSLT_APPLE) {', станет: '    if (false) {' },

  /* ДВА ОТКАТА БЕРУТ ЯКОРЬ ИЗ ФАЙЛА — см. `тегиИзФайла` ниже. Здесь
     стояли теги целиком, с `?v=1` и `?v=2` внутри; я же сам поднял эти
     версии через час, и оба отката стали отвечать «якорь встречается 0
     раз». ВЕРСИЯ В ЯКОРЕ — ЭТО ЯКОРЬ НА ПОЛОЖЕНИИ, А НЕ НА
     СОДЕРЖИМОМ. */
];

/* Тег скрипта по имени файла — КАК ОН СЕЙЧАС НАПИСАН В РАЗМЕТКЕ, вместе
   со своим `?v=`. Возвращает null, если тега нет: тогда откат честно
   скажет, что ему нечего возвращать, вместо того чтобы латать мимо. */
function тегИзФайла(разметка, имя) {
  const стр = ЧИТ(разметка).split('\n');
  const i = стр.findIndex(с => с.indexOf('/' + имя + '?') !== -1 &&
                               с.indexOf('<script') !== -1);
  return i === -1 ? null : { строка: стр[i], номер: i };
}

(function откатыТегов() {
  const СТР = 'pages/auth-kg.html';
  const дом = тегИзФайла(СТР, 'kslt-vhod.js');
  if (дом) {
    ОТКАТЫ.push({ имя: 'страница грузит вход без дома',
      ждём: 'дом подключён во всех разметках, где подключён вход',
      файл: СТР, было: дом.строка + '\n', станет: '' });
  }
  const П = 'mobile/www/index.html';
  const стр = ЧИТ(П).split('\n');
  const д = стр.findIndex(с => с.indexOf('/kslt-vhod.js?') !== -1);
  const з = стр.findIndex((с, i) => i > д && с.indexOf('/auth.js?') !== -1);
  if (д !== -1 && з !== -1) {
    const кусок = стр.slice(д, з + 1);
    ОТКАТЫ.push({ имя: 'дом поставлен ПОСЛЕ зовущего',
      ждём: 'дом грузится ДО того, кто его зовёт',
      файл: П,
      было: кусок.join('\n'),
      станет: кусок.slice(1).concat(кусок[0]).join('\n') });
  }
})();

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vhod-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools', 'maket'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  for (const ф of ['index.html', 'index-en.html', 'index-kg.html'])
    fs.cpSync(path.join(КОРЕНЬ, ф), path.join(к, ф));
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-vhod.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ВХОД\n');
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
