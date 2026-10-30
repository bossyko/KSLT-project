#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ «ОНЛАЙН» (29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
  { имя: 'правило «в сети» убрано из дома', ждём: 'правило «в сети» объявлено в доме и ровно одно',
    файл: 'js/kslt-lico.js', было: '    function вСети(когдаБылВидно) {',
    станет: '    function вСетиИначе(когдаБылВидно) {' },

  { имя: 'прибор ослеп на спрашивающих', ждём: 'спрашивающих нашлось, и все зовут дом',
    файл: 'tools/check-onlayn.js', было: "    обойти('js');\n    обойти('mobile/www/js');",
    станет: "    обойти('js/нет-такой-папки');" },

  { имя: 'у партнёров завёлся свой порог', ждём: 'ни у кого нет своего порога «в сети»',
    файл: 'js/partners.js', было: '        var online = window.KSLT_LICO.вСети(p.last_seen);',
    станет: '        var online = Date.now() - new Date(p.last_seen).getTime() < 5 * 60 * 1000;' },

  { имя: 'поле `online` вернулось на рейтинг', ждём: 'на рейтинге поля `online` больше нет',
    файл: 'js/rankings-data.js', было: '                                points: inCat[p.id] || 0,',
    станет: '                                online: false,\n                                points: inCat[p.id] || 0,' },

  { имя: 'мёртвая точка онлайна вернулась', ждём: 'мёртвое украшение онлайна снято',
    файл: 'css/players.css', было: '/* Badge */', станет: '.pl-online-dot { width: 10px; }\n\n/* Badge */' },

  { имя: 'запись «куда вернуть» стёрта', ждём: 'вернуть онлайн на рейтинг сказано ГДЕ, а не забыто',
    файл: 'js/rankings-data.js', было: '`KSLT_LICO.вСети(last_seen)`', станет: 'одним правилом' },

  /* ОТКАТ ПЕРЕПИСАН: прежний указывал на файл, которого в приложении нет
     — прувер так и сказал. Теперь откат заводит в приложении
     спрашивающего БЕЗ копии дома: ровно то, чего правило не должно
     допускать. */
  { имя: 'приложение стало считать «в сети» само',
    ждём: 'приложение last_seen пишет, а «в сети» не считает само',
    файл: 'mobile/www/js/screens/partners.js',
    было: '  function esc(s) {',
    станет: '  function вСети(когда) { return Date.now() - new Date(когда).getTime() < 5 * 60 * 1000; }\n\n  function esc(s) {' }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-onl-'));
  for (const о of ['js', 'mobile/www', 'css', 'tools'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-onlayn.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: «ОНЛАЙН»\n');
let беда = 0;
for (const о of ОТКАТЫ) {
  const к = копия(); const п = path.join(к, о.файл);
  if (!fs.existsSync(п)) { console.log('  ✗ ' + о.имя + ' — ФАЙЛА НЕТ: ' + о.файл); беда++; fs.rmSync(к, { recursive: true, force: true }); continue; }
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
