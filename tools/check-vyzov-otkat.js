#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ВЫЗОВА (29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-vyzov.js';
const ДОМ_П = 'mobile/www/js/kslt-vyzov.js';
const САЙТ = 'js/player.js';
const ПРИЛ = 'mobile/www/js/screens/player-detail.js';
const БАЗА = 'supabase/migrations/20260210000000_baseline.sql';

const ОТКАТЫ = [
  { имя: 'ограничение статусов в базе испорчено', ждём: 'ограничение статусов прочитано из базы',
    файл: БАЗА, было: '"challenges_status_check" CHECK', станет: '"challenges_status_chek" CHECK' },

  { имя: '`pending` добавлен в ограничение базы',
    ждём: 'статуса `pending` в базе действительно нет',
    файл: БАЗА, было: "CONSTRAINT \"challenges_status_check\" CHECK ((\"status\" = ANY (ARRAY['active'::\"text\"",
    станет: "CONSTRAINT \"challenges_status_check\" CHECK ((\"status\" = ANY (ARRAY['pending'::\"text\", 'active'::\"text\"" },

  { имя: 'из дома убрано понятие', ждём: 'дом объявлен и отдаёт все четыре понятия',
    файл: ДОМ, было: '    API.занят = function (client, мойId, егоId) {',
    станет: '    API.занятость = function (client, мойId, егоId) {' },

  { имя: 'копии дома разошлись', ждём: 'копии дома побайтово равны',
    файл: ДОМ_П, было: "    API.ФУНКЦИЯ = 'create-challenge';",
    станет: "    API.ФУНКЦИЯ = 'create-challenge'; /* уехало */" },

  { имя: 'в живые статусы вернулся `pending`',
    ждём: 'живые статусы дома ЕСТЬ в ограничении базы',
    файл: ДОМ, было: "    API.ЖИВЫЕ = ['active', 'accepted'];",
    станет: "    API.ЖИВЫЕ = ['pending', 'accepted'];" },

  { имя: 'дом снова пишет в таблицу', ждём: 'дом зовёт серверную функцию, а не пишет в таблицу',
    файл: ДОМ, было: "        return V.зовОтИмени(client, API.ФУНКЦИЯ, тело).then(function (д) {",
    станет: "        return client.from('challenges').insert(тело).then(function (д) {" },

  { имя: 'зов пошёл без токена', ждём: 'зов идёт ОТ ИМЕНИ человека',
    файл: ДОМ, было: 'return V.зовОтИмени(client, API.ФУНКЦИЯ, тело)',
    станет: 'return V.зовФункции(API.ФУНКЦИЯ, тело)' },

  { имя: 'из дома выпал код отказа', ждём: 'дом разбирает все восемь кодов отказа функции',
    файл: ДОМ, было: "        match_pending:      'chalMatchSet'", станет: "        match_otlozhen:     'chalMatchSet'" },

  { имя: 'дом смотрит вызов в одну сторону', ждём: 'дом смотрит вызов В ОБЕ СТОРОНЫ',
    файл: ДОМ,
    было: "        var обратно = 'and(challenger_player_id.eq.' + егоId +\n                      ',opponent_player_id.eq.' + мойId + ')';",
    станет: "        var обратно = пара;" },

  { имя: 'отказ дома стал тихим', ждём: 'без дома входа вызов не отправляется и говорит вслух',
    файл: ДОМ, было: "                console.error('KSLT_VYZOV: нет KSLT_VHOD.зовОтИмени — ' +",
    станет: "                воздух('KSLT_VYZOV: нет KSLT_VHOD.зовОтИмени — ' +" },

  { имя: 'сайт снова пишет вызов в таблицу', ждём: 'у сайта нет прямой записи вызова в таблицу',
    файл: САЙТ, было: '            var итог = await window.KSLT_VYZOV.создать(client, _playerId,',
    станет: "            await client.from('challenges').insert({ status: 'pending' });\n            var итог = await window.KSLT_VYZOV.создать(client, _playerId," },

  { имя: 'приложение снова пишет вызов в таблицу',
    ждём: 'у приложения нет прямой записи вызова в таблицу',
    файл: ПРИЛ, было: "    window.KSLT_VYZOV.создать(supabaseClient, _playerId, '').then(function (итог) {",
    станет: "    supabaseClient.from('challenges').insert({ status: 'pending' });\n    window.KSLT_VYZOV.создать(supabaseClient, _playerId, '').then(function (итог) {" },

  { имя: 'сайт снова разбирает коды базы', ждём: 'у сайта нет своего разбора кодов базы',
    файл: САЙТ, было: "            } else if (итог.ключ === 'chalExists') {",
    станет: "            } else if (итог.ключ === 'chalExists' || итог.код === 'too_many_pending') {" },

  { имя: 'приложение снова разбирает коды базы',
    ждём: 'у приложения нет своего разбора кодов базы',
    файл: ПРИЛ, было: "      window.KSLT_APP.toast(итог.ок ? I18N.t('pd.chalSent') : словоВызова(итог.ключ));",
    станет: "      if (итог.код === 'not_member') { window.KSLT_APP.toast('нет'); return; }\n      window.KSLT_APP.toast(итог.ок ? I18N.t('pd.chalSent') : словоВызова(итог.ключ));" },

  { имя: 'сайт снова спрашивает базу сам', ждём: 'у сайта нет своего запроса «вызов уже есть»',
    файл: САЙТ, было: '        var итог = await window.KSLT_VYZOV.занят(client, _myPlayerId, player.id);',
    станет: "        var итог = await client.from('challenges').select('status').or('and(challenger_player_id.eq.' + _myPlayerId + ')');" },

  { имя: 'приложение спрашивает базу само', ждём: 'у приложения нет своего запроса «вызов уже есть»',
    файл: ПРИЛ, было: '  function handleChallenge() {',
    станет: "  function проверитьВызов() {\n    return supabaseClient.from('challenges').select('status').eq('challenger_player_id.eq.1', 1);\n  }\n\n  function handleChallenge() {" },

  { имя: 'сайт перестал звать дом', ждём: 'у сайта дом зовётся',
    файл: САЙТ, было: 'KSLT_VYZOV', станет: 'KSLT_CHUZHOY', всеВхождения: true },

  { имя: 'приложение перестало звать дом', ждём: 'у приложения дом зовётся',
    файл: ПРИЛ, было: 'KSLT_VYZOV', станет: 'KSLT_CHUZHOY', всеВхождения: true },

  { имя: 'у сайта пропало слово на ключ', ждём: 'у сайта есть слово на каждый ключ дома',
    файл: САЙТ, было: "        chalLimit:     'challengeLimit',\n", станет: '' },

  { имя: 'у приложения пропало слово на ключ', ждём: 'у приложения есть слово на каждый ключ дома',
    файл: ПРИЛ, было: "    chalLimit:     ['pd.chalLimit', 'Слишком много висящих вызовов — дождитесь ответа'],\n", станет: '' },

];

/* ЯКОРЬ БЕРЁТСЯ ИЗ ФАЙЛА — `tools/yakor-tega.js`: тут стояли версии
   `kslt-vhod.js?v=2` и `kslt-vyzov.js?v=1`, и первая поднялась
   переездом зова в свой дом. */
const Я = require('./yakor-tega.js');
{
    const пара = Я.переставить(КОРЕНЬ, 'pages/player-kg.html',
        'kslt-vhod.js', 'kslt-vyzov.js');
    if (пара) ОТКАТЫ.push({ имя: 'дом вызова поставлен ДО дома входа',
        ждём: 'на страницах игрока подключены оба дома, и в нужном порядке',
        файл: 'pages/player-kg.html', было: пара.было, станет: пара.станет });
}

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vyz-'));
  for (const о of ['js', 'mobile/www', 'pages', 'tools', 'supabase'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, 'tools/check-vyzov.js')],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ВЫЗОВ НА БАТТЛ\n');
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
