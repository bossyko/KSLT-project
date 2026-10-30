#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ЗНАЧКОВ (29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-znachki.js';
const ДОМ_П = 'mobile/www/js/kslt-znachki.js';
const САЙТ = 'js/players.js';
const ПРИЛ = 'mobile/www/js/screens/rating.js';

const ОТКАТЫ = [
  { имя: 'из дома убрано понятие', ждём: 'дом объявлен и отдаёт все четыре понятия',
    файл: ДОМ, было: '    API.название = function (слепок, значокId, язык) {',
    станет: '    API.подпись = function (слепок, значокId, язык) {' },

  { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
    файл: ДОМ_П, было: '    var API = global.KSLT_ZNACHKI = {};',
    станет: '    var API = global.KSLT_ZNACHKI = {}; /* уехало */' },

  { имя: 'число значков в строке изменено', ждём: 'сколько значков в строке — одно число',
    файл: ДОМ, было: '    API.СКОЛЬКО = 5;', станет: '    API.СКОЛЬКО = 8;' },

  { имя: 'порядок стал задаваться не базой', ждём: 'порядок задаёт БАЗА, а не продукт',
    файл: ДОМ, было: ".order('earned_at', { ascending: true });",
    станет: ".order('badge_id', { ascending: false });" },

  { имя: 'добавлен третий запрос', ждём: 'грузится двумя запросами, а не по запросу на игрока',
    файл: ДОМ, было: '                var поИгрокам = {};',
    станет: "                client.from('players').select('id');\n                var поИгрокам = {};" },

  { имя: 'бросок на месте перестал ловиться',
    ждём: 'дом не бросает ни при отказе, ни при броске на месте',
    файл: ДОМ, было: '        } catch (e) {\n            return Promise.resolve({ поИгрокам: {}, определения: определения });\n        }',
    станет: '        } catch (e) {\n            throw e;\n        }' },

  { имя: 'в дом попала разметка', ждём: 'дом не знает ни разметки, ни экранирования',
    файл: ДОМ, было: '        return все.slice(0, n);',
    станет: "        return все.slice(0, n).map(function (з) { return '<span>' + з.icon; });" },

  { имя: 'сайт перестал звать дом', ждём: 'у сайта дом зовётся',
    файл: САЙТ, было: 'KSLT_ZNACHKI', станет: 'KSLT_CHUZHIE', всеВхождения: true },

  { имя: 'приложение перестало звать дом', ждём: 'у приложения дом зовётся',
    файл: ПРИЛ, было: 'KSLT_ZNACHKI', станет: 'KSLT_CHUZHIE', всеВхождения: true },

  { имя: 'сайт снова грузит значки сам', ждём: 'у сайта нет своей загрузки значков',
    файл: САЙТ, было: '        _значки = await window.KSLT_ZNACHKI.загрузить(window.supabaseClient);',
    станет: "        await window.supabaseClient.from('player_badges').select('player_id');\n        _значки = await window.KSLT_ZNACHKI.загрузить(window.supabaseClient);" },

  { имя: 'приложение снова грузит значки само', ждём: 'у приложения нет своей загрузки значков',
    файл: ПРИЛ, было: '    if (!_значки && window.KSLT_ZNACHKI) {',
    станет: "    supabaseClient.from('badge_definitions').select('*');\n    if (!_значки && window.KSLT_ZNACHKI) {" },

  { имя: 'сайт снова режет список своим числом', ждём: 'у сайта нет своего числа значков в строке',
    файл: САЙТ, было: '        var show = window.KSLT_ZNACHKI.первые(_значки, playerId, maxCount);',
    станет: '        var show = (_значки.поИгрокам[playerId] || []).slice(0, maxCount || 5);' },

  { имя: 'приложение режет список своим числом',
    ждём: 'у приложения нет своего числа значков в строке',
    файл: ПРИЛ, было: '    var список = Z.первые(_значки, игрокId);',
    станет: '    var список = (_значки.поИгрокам[игрокId] || []).slice(0, 5);' },

  { имя: 'у сайта значок пошёл в разметку сырым',
    ждём: 'у сайта значок И подсказка экранируются',
    файл: САЙТ, было: "'\">' + KSLT_экранировать(b.icon || '') + '</span>'",
    станет: "'\">' + (b.icon || '') + '</span>'" },

  { имя: 'у приложения значок пошёл в разметку сырым',
    ждём: 'у приложения значок И подсказка экранируются',
    файл: ПРИЛ, было: "'\">' + esc(з.icon) + '</span>'", станет: "'\">' + з.icon + '</span>'" },

  { имя: 'у значка в приложении снят вид', ждём: 'у значка в строке есть вид в обоих продуктах',
    файл: 'mobile/www/css/app.css', было: '.rr-badge {', станет: '.rr-znachok {' },

  { имя: 'дом поставлен ПОСЛЕ зовущего', ждём: 'дом подключён и грузится ДО того, кто его зовёт',
    файл: 'pages/players-kg.html',
    было: '    <script src="../js/kslt-znachki.js?v=1"></script>\n', станет: '' },

  { имя: 'список стал ждать значки', ждём: 'список рисуется НЕ ДОЖИДАЯСЬ значков',
    файл: ПРИЛ,
    было: '    loadCategories();\n  };',
    станет: '  };' }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-zn-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools', 'css'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-znachki.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ЗНАЧКИ\n');
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
