#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ВОЗВРАТА (шаг A3.7в, 29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ОТКАТЫ = [
  { имя: 'дом снесён', ждём: 'дом объявлен', файл: 'js/kslt-vozvrat.js',
    было: '    API.вернуть = function (client) {', станет: '    API.вернутьОткл = function (client) {' },
  { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
    файл: 'mobile/www/js/kslt-vozvrat.js',
    было: "    API.метка = function (client) {", станет: "    API.метка = function (client) { /* уехало */" },
  { имя: 'invoke убран из дома', ждём: 'дом зовёт через invoke, когда клиент умеет',
    файл: 'js/kslt-vozvrat.js',
    было: 'if (client.functions && client.functions.invoke) {',
    станет: 'if (false) {' },
  /* ДВА ОТКАТА ПЕРЕЕХАЛИ ЗА ПОНЯТИЕМ (30.10): адрес, ключ и заголовки
     ушли в дом зова, и в этом файле их больше нет — прежние якоря
     (`адрес + '/functions/v1/…'`, `var адрес = global.SUPABASE_URL`)
     встречались ноль раз. Теперь откат снимает ЗОВ ДОМА, а второй
     вписывает адрес прямо здесь — ровно то, от чего правило сторожит. */
  { имя: 'откат на зов через дом убран', ждём: 'у дома есть откат на зов через дом',
    файл: 'js/kslt-vozvrat.js',
    было: "return З.отИмени(client, 'delete-account', { action: 'restore' })",
    станет: "return Promise.resolve({ ок: false, беда: 'нет' })" },
  { имя: 'адрес базы вписан в дом', ждём: 'адрес базы дом берёт у настроек, а не вписывает',
    файл: 'js/kslt-vozvrat.js',
    было: "        if (!(global.SUPABASE_URL && global.SUPABASE_ANON_KEY)) {",
    станет: "        var адрес = 'https://qqkzszesviukopgjbead.supabase.co';\n        if (!(адрес && global.SUPABASE_ANON_KEY)) {" },
  { имя: 'дом стал бросать вместо исхода', ждём: 'дом отдаёт исход, а не бросает',
    файл: 'js/kslt-vozvrat.js',
    было: 'ок: false', станет: 'оk: false', всеВхождения: true },
  { имя: 'сайт снова зовёт функцию сам', ждём: 'у сайта нет своего зова функции',
    файл: 'js/account-restore.js',
    было: '                var r = await KSLT_VOZVRAT.вернуть(client);',
    станет: "                var r = await client.functions.invoke('delete-account', { body: { action: 'restore' } });" },
  { имя: 'приложение перестало звать дом', ждём: 'у приложения дом зовётся',
    файл: 'mobile/www/js/account-restore.js',
    было: 'window.KSLT_VOZVRAT.вернуть', станет: 'window.KSLT_ЧУЖОЙ.вернуть' },
  { имя: 'сайт снова читает метку сам', ждём: 'у сайта нет своего чтения метки',
    файл: 'js/account-restore.js',
    было: '        var метка = await KSLT_VOZVRAT.метка(client);',
    станет: "        var pr = await client.from('profiles').select('deleted_at').eq('id', 1).maybeSingle();\n        var метка = pr.data && pr.data.deleted_at;" },
];

/* ДВА ОТКАТА БЕРУТ ЯКОРЬ ИЗ ФАЙЛА — `tools/yakor-tega.js`: они держали
   тег с `?v=1`, а версия дома поднялась до 2 вместе с переездом зова. */
const Я = require('./yakor-tega.js');
{
    const стр = Я.тегСтрокой(КОРЕНЬ, 'pages/dashboard.html', 'kslt-vozvrat.js');
    if (стр) ОТКАТЫ.push({ имя: 'страница грузит возврат без дома',
        ждём: 'дом подключён во всех разметках',
        файл: 'pages/dashboard.html', было: стр, станет: '' });
    const прил = Я.тегСтрокой(КОРЕНЬ, 'mobile/www/index.html', 'kslt-vozvrat.js');
    if (прил) ОТКАТЫ.push({ имя: 'дом поставлен ПОСЛЕ зовущего',
        ждём: 'дом грузится ДО того, кто его зовёт',
        файл: 'mobile/www/index.html', было: прил, станет: '' });
}
function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vozvr-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-vozvrat.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ВОЗВРАТ УЧЁТНОЙ ЗАПИСИ\n');
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
