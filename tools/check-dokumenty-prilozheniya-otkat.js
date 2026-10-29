#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ДОКУМЕНТОВ (29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'mobile/www/js/kslt-dokumenty.js';
const ПРОФИЛЬ = 'mobile/www/js/screens/profile.js';

const ОТКАТЫ = [
  { имя: 'из дома убрано действие', ждём: 'дом документов объявлен',
    файл: ДОМ, было: '    API.все = function (язык) {', станет: '    API.всё = function (язык) {' },

  { имя: 'список в доме испорчен', ждём: 'список документов прочитан из дома',
    файл: ДОМ, было: '    API.СПИСОК = [', станет: '    API.СПИСОК_ИНАЧЕ = [' },

  { имя: 'в список попал документ, которого нет на сайте',
    ждём: 'каждый документ есть на сайте на всех трёх языках',
    файл: ДОМ, было: "        { имя: 'terms',   страница: 'terms' }",
    станет: "        { имя: 'terms',   страница: 'terms' },\n        { имя: 'нет',     страница: 'takoy-net' }" },

  { имя: 'политика выпала из списка', ждём: 'политика конфиденциальности в списке есть',
    файл: ДОМ, было: "        { имя: 'privacy', страница: 'privacy-policy' },", станет: '' },

  { имя: 'в дом вписан адрес сайта', ждём: 'адрес сайта дом берёт у настроек, а не вписывает',
    файл: ДОМ, было: '        var сайт = global.KSLT_SAYT;',
    станет: "        var сайт = global.KSLT_SAYT || { адрес: 'https://kslt.netlify.app' };" },

  { имя: 'отказ дома стал тихим', ждём: 'без дома адреса ссылки не угадываются',
    файл: ДОМ, было: "                console.error('KSLT_DOKUMENTY: нет KSLT_SAYT.адрес — ' +",
    станет: "                воздух('KSLT_DOKUMENTY: нет KSLT_SAYT.адрес — ' +" },

  { имя: 'язык перестал попадать в адрес', ждём: 'язык выбирает продукт, а не дом',
    файл: ДОМ, было: "        if (язык === 'en' || язык === 'kg') файл = страница + '-' + язык;",
    станет: '        файл = страница;' },

  { имя: 'строка документов осталась без обработчика',
    ждём: 'в меню профиля есть строка документов',
    файл: ПРОФИЛЬ, было: "    bindRowClick('profDocsRow', showDocuments);\n", станет: '' },

  { имя: 'окно склеивает адрес само', ждём: 'окно документов строит ссылки через дом',
    файл: ПРОФИЛЬ, было: '    var список = D ? D.все(язык) : [];',
    станет: "    var список = [{ имя: 'privacy', страница: 'privacy-policy', адрес: '/pages/privacy-policy.html' }];" },

  { имя: 'документ открывается внутри накладки',
    ждём: 'документ открывается системным браузером',
    файл: ПРОФИЛЬ, было: "'_system');", станет: "'_blank');" },

  { имя: 'у документа пропало название на одном языке',
    ждём: 'у каждого документа есть название на всех трёх языках',
    файл: 'mobile/www/js/i18n.js',
    было: "    'profile.docRules':         { ru: 'Правила клуба', en: 'Club Rules', kg: 'Клубдун эрежелери' },",
    станет: "    'profile.docRules':         { ru: 'Правила клуба', en: 'Club Rules' }," },

  { имя: 'дом поставлен ПОСЛЕ профиля', ждём: 'дом подключён и грузится ДО профиля',
    файл: 'mobile/www/index.html',
    было: '<script src="js/kslt-dokumenty.js?v=1"></script>\n', станет: '' },

  { имя: 'третий адрес сайта вернулся', ждём: 'третьего адреса сайта в приложении больше нет',
    файл: 'mobile/www/js/auth.js',
    было: '  AUTH.logout = function() {',
    станет: "  AUTH.resetPassword = function(email) {\n    var siteUrl = 'https://bossyko.github.io/KSLT-project';\n    return supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: siteUrl + '/pages/reset-password.html' });\n  };\n\n  AUTH.logout = function() {" },

  { имя: 'на сайте завелась мёртвая копия дома',
    ждём: 'на сайте копии дома нет — и это намеренно',
    файл: 'partials/footer-ru.html', было: 'offer.html', станет: 'oferta-net.html', всеВхождения: true }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-dok-'));
  for (const о of ['mobile/www', 'pages', 'tools', 'partials', 'js'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-dokumenty-prilozheniya.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ДОКУМЕНТЫ\n');
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
