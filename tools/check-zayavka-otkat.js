#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ЗАЯВКИ (шаг A3.7д, 29.10).
 *
 * Берёт КОПИЮ файлов, возвращает прежнее значение и требует, чтобы упало
 * ИМЕННО то правило, которое за это отвечает. Якорь держится на
 * содержимом, а не на положении строки.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-zayavka.js';
const ДОМ_П = 'mobile/www/js/kslt-zayavka.js';
const СЛОВА = 'js/zayavka-texts.js';
const СЛОВА_П = 'mobile/www/js/zayavka-texts.js';
const САЙТ = 'js/tournament-register.js';
const ПРИЛ = 'mobile/www/js/tournament-register.js';

const ОТКАТЫ = [
  { имя: 'из дома убрано действие', ждём: 'дом объявлен и отдаёт все четыре действия',
    файл: ДОМ, было: '    API.создана = function (data) {',
    станет: '    API.создан = function (data) {' },

  { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
    файл: ДОМ_П, было: '    var API = global.KSLT_ZAYAVKA = {};',
    станет: '    var API = global.KSLT_ZAYAVKA = {}; /* уехало */' },

  { имя: 'копии надписей разошлись', ждём: 'копии надписей побайтово равны',
    файл: СЛОВА_П, было: '    T.ru = {', станет: '    T.ru = { /* уехало */' },

  { имя: 'адрес функции в доме испорчен', ждём: 'адрес серверной функции назван один раз',
    файл: ДОМ, было: "    API.ФУНКЦИЯ = 'tournament-register';",
    станет: "    API.ФУНКЦИЯ = 'tournament-registr';" },

  { имя: 'ветка смены напарника отодвинута', ждём: 'ветка смены напарника стоит ПЕРВОЙ',
    файл: ДОМ, было: '        if (д.partner_changed) {',
    станет: "        if (д.error === 'already_registered' && д.partner_changed) {" },

  { имя: 'в дом попало слово', ждём: 'дом не знает ни одного слова',
    файл: ДОМ, было: '            текст = L.stPrefix + разбор.статус;',
    станет: "            текст = 'Статус заявки: ' + разбор.статус;" },

  { имя: 'из надписей пропал код отказа', ждём: 'у дома девятнадцать кодов отказа — и у надписей столько же',
    файл: СЛОВА, было: "            not_paid: 'Сначала оплатите членство',\n", станет: '' },

  { имя: 'у ключа дома пропало слово на одном языке',
    ждём: 'у каждого ключа дома есть слово на всех трёх языках',
    файл: СЛОВА, было: "        shortChanged: 'Partner changed',\n", станет: '' },

  // ---- сайт ----
  { имя: 'сайт снова зовёт функцию сам', ждём: 'у сайта нет своего зова функции допуска',
    файл: САЙТ, было: '        return window.KSLT_ZAYAVKA.зов(client, tournamentId, extra);',
    станет: "        return fetch(SUPABASE_URL + '/functions/v1/tournament-register', { method: 'POST' });" },

  { имя: 'сайт снова смотрит на причину сам', ждём: 'у сайта нет своего дерева решений',
    файл: САЙТ, было: '    function resultText(data, isEn, isKg) {\n        var Z = window.KSLT_ZAYAVKA;',
    станет: "    function resultText(data, isEn, isKg) {\n        if (data && data.reason === 'top_rank') { data.note = 1; }\n        var Z = window.KSLT_ZAYAVKA;" },

  { имя: 'сайт снова держит своё слово на код', ждём: 'у сайта нет своих слов на коды отказа',
    файл: САЙТ, было: '    /** Надписи окна заявки — общий файл js/zayavka-texts.js. */',
    станет: "    var СВОИ = { no_membership: 'Требуется активное членство KSLT' };\n\n    /** Надписи окна заявки — общий файл js/zayavka-texts.js. */" },

  { имя: 'сайт снова считает признак создания сам', ждём: 'у сайта нет своего признака «заявка создана»',
    файл: САЙТ, было: '        info.created = window.KSLT_ZAYAVKA.создана(reg.data);',
    станет: "        info.created = !(reg.data && reg.data.error && reg.data.error !== 'already_registered');" },

  { имя: 'сайт перестал звать склейку дома', ждём: 'у сайта дом зовётся',
    файл: САЙТ, было: '        var слова = Z.словами(Z.разобрать(data), надписи(), data);',
    станет: '        var слова = Z.СЛОВАМИ(Z.разобрать(data), надписи(), data);' },

  { имя: 'сайт перестал брать общий словарь', ждём: 'у сайта язык выбирается продуктом',
    файл: САЙТ, было: '        var T = window.KSLT_ZAYAVKA_TEXTS;',
    станет: '        var T = window.KSLT_CHUZHIE_TEXTS;' },

  // ---- приложение ----
  { имя: 'приложение снова зовёт функцию само', ждём: 'у приложения нет своего зова функции допуска',
    файл: ПРИЛ, было: '        return window.KSLT_ZAYAVKA.зов(window.supabaseClient, tournamentId, extra);',
    станет: "        return fetch(SUPABASE_URL + '/functions/v1/tournament-register', { method: 'POST' });" },

  { имя: 'приложение снова разбирает смену напарника само', ждём: 'у приложения нет своего дерева решений',
    файл: ПРИЛ, было: '    function resultText(data) {\n        var Z = window.KSLT_ZAYAVKA;',
    станет: '    function resultText(data) {\n        if (data && data.partner_changed) { data.ok = 1; }\n        var Z = window.KSLT_ZAYAVKA;' },

  { имя: 'приложение снова держит своё слово на код', ждём: 'у приложения нет своих слов на коды отказа',
    файл: ПРИЛ, было: '    /** Язык приложения.',
    станет: "    var СВОИ = { entry_in_draw: 'Сетка сформирована' };\n\n    /** Язык приложения." },

  { имя: 'приложение снова считает признак создания само', ждём: 'у приложения нет своего признака «заявка создана»',
    файл: ПРИЛ, было: '            info.created = window.KSLT_ZAYAVKA.создана(reg.data);',
    станет: "            info.created = !(reg.data && reg.data.error && reg.data.error !== 'already_registered');" },

  { имя: 'приложение перестало звать склейку дома', ждём: 'у приложения дом зовётся',
    файл: ПРИЛ, было: '        var слова = Z.словами(Z.разобрать(data), надписи(), data);',
    станет: '        var слова = Z.СЛОВАМИ(Z.разобрать(data), надписи(), data);' },

  { имя: 'приложение перестало брать общий словарь', ждём: 'у приложения язык выбирается продуктом',
    файл: ПРИЛ, было: '        var T = window.KSLT_ZAYAVKA_TEXTS;',
    станет: '        var T = window.KSLT_CHUZHIE_TEXTS;' },

  // ---- вид, краска, экранирование, разметка ----
  { имя: 'вид окна снова вписывается строкой в <head>',
    ждём: 'вид окна заявки приложения живёт в css, а не в строке js',
    файл: ПРИЛ, было: '    /** Показывает окно с результатом подачи. */',
    станет: "    function injectStyles() {\n        var s = document.createElement('style');\n        s.textContent = '.mob-reg-overlay {position:fixed;inset:0}';\n        document.head.appendChild(s);\n    }\n\n    /** Показывает окно с результатом подачи. */" },

  { имя: 'четвёртый красный вернулся', ждём: 'четвёртого красного `#ff3b30` в окне заявки больше нет',
    файл: 'mobile/www/css/app.css',
    было: '.mob-reg-btn.is-error {\n  background: var(--danger);',
    станет: '.mob-reg-btn.is-error {\n  background: #ff3b30;' },

  { имя: 'приложение снова вставляет текст сервера как есть',
    ждём: 'приложение экранирует то, что пришло от сервера',
    файл: ПРИЛ,
    было: "                '<p class=\"mob-reg-text\">' + esc(info.text) + '</p>' +",
    станет: "                '<p class=\"mob-reg-text\">' + info.text + '</p>' +" },

  { имя: 'страница грузит заявку без надписей',
    ждём: 'дом и надписи подключены во всех разметках, где подключена заявка',
    файл: 'pages/tournaments-overview-kg.html',
    было: '    <script src="../js/zayavka-texts.js?v=1"></script>\n', станет: '' },

  { имя: 'дом поставлен ПОСЛЕ зовущего', ждём: 'дом и надписи грузятся ДО того, кто их зовёт',
    файл: 'mobile/www/index.html',
    было: '<script src="js/kslt-zayavka.js?v=1"></script>\n<script src="js/tournament-register.js?v=2"></script>',
    станет: '<script src="js/tournament-register.js?v=2"></script>\n<script src="js/kslt-zayavka.js?v=1"></script>' }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-zayav-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools', 'maket'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  for (const ф of ['index.html', 'index-en.html', 'index-kg.html'])
    fs.cpSync(path.join(КОРЕНЬ, ф), path.join(к, ф));
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-zayavka.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ЗАЯВКА НА ТУРНИР\n');
let беда = 0;
for (const о of ОТКАТЫ) {
  const к = копия(); const п = path.join(к, о.файл);
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
