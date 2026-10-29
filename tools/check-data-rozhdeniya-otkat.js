#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ДАТЫ РОЖДЕНИЯ (шаг A5, 29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
  { имя: 'required вернулся к полю дня', ждём: 'у полей даты рождения нет атрибута required',
    файл: 'pages/auth.html',
    было: '<select class="auth-input" id="tg-birth-day">',
    станет: '<select class="auth-input" id="tg-birth-day" required>' },

  { имя: 'звёздочка вернулась на страницу входа',
    ждём: 'у даты рождения на страницах входа нет звёздочки',
    файл: 'pages/auth-kg.html',
    было: '<label class="auth-label">Туулган күнү</label>',
    станет: '<label class="auth-label">Туулган күнү <span class="auth-required">*</span></label>' },

  { имя: 'звёздочка вернулась в кабинет', ждём: 'у даты рождения в кабинете нет звёздочки',
    файл: 'js/dashboard.js',
    было: "                    '<label class=\"db-field-label\">' + L.birthday + '</label>' +",
    станет: "                    '<label class=\"db-field-label\">' + L.birthday + ' <span class=\"db-required\">*</span></label>' +" },

  { имя: 'дата попала в проверку полноты профиля',
    ждём: 'обязательность не вернулась в проверку полноты профиля',
    файл: 'js/dashboard.js',
    было: '               p.phone && p.phone.trim() !== \'\';',
    станет: "               p.phone && p.phone.trim() !== '' && p.birth_year;" },

  { имя: 'подача заявки стала спрашивать дату',
    ждём: 'подача заявки не спрашивает дату рождения',
    файл: 'js/tournament-register.js',
    было: "                .select('full_name, gender, phone')",
    станет: "                .select('full_name, gender, phone, birth_year')" },

  { имя: 'приложение стало спрашивать дату', ждём: 'приложение дату рождения не спрашивает',
    файл: 'mobile/www/js/auth.js',
    было: '  AUTH.register = function(email, password, fullName) {',
    станет: '  AUTH.register = function(email, password, fullName) {\n    var birth_year = 2000;' },

  { имя: 'год снова читается без защиты', ждём: '`tg-birth-year` читается только защищённо',
    файл: 'js/auth.js',
    было: "            var birthYear = поле('tg-birth-year');",
    станет: "            var birthYear = document.getElementById('tg-birth-year').value;" },

  { имя: 'год появился в разметке',
    ждём: 'элемента `tg-birth-year` действительно нет ни в одной разметке',
    файл: 'pages/auth.html',
    было: '<select class="auth-input" id="tg-birth-month">',
    станет: '<select class="auth-input" id="tg-birth-year"></select>\n                        <select class="auth-input" id="tg-birth-month">' },

  { имя: 'защищённое чтение полей снято', ждём: 'чтение полей входа идёт через одно место',
    файл: 'js/auth.js',
    было: "        return э ? э.value : '';",
    станет: '        return э.value;' },

  { имя: 'дату рождения выбросили из кабинета',
    ждём: 'дата рождения по-прежнему СОБИРАЕТСЯ, а не выброшена',
    файл: 'js/dashboard.js', было: 'birth_day', станет: 'birth_den', всеВхождения: true }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-dr-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools', 'supabase/functions'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-data-rozhdeniya.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ДАТА РОЖДЕНИЯ\n');
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
