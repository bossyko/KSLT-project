#!/usr/bin/env node
/** ПРУВЕР К СТОРОЖУ ОКОН ПРИЛОЖЕНИЯ (29.10). */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'mobile/www/js/kslt-okno.js';
const СТОРОЖ = 'tools/check-okna-prilozheniya.js';

const ОТКАТЫ = [
  { имя: 'дом перестал слушать смену класса', ждём: 'дом окон объявлен и слушает смену класса',
    файл: ДОМ, было: 'MutationObserver', станет: 'НетТакогоНаблюдателя', всеВхождения: true },

  /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, А НЕ НА НОМЕРЕ ВЕРСИИ. Прежде здесь
     стояло `kslt-okno.js?v=2`, и первая же правка дома уронила откат с
     «ЯКОРЬ ВСТРЕЧАЕТСЯ 0 РАЗ» — поймано 02.11 подъёмом версии до 3. */
  { имя: 'дом отключён от разметки', ждём: 'дом подключён в разметке',
    файл: 'mobile/www/index.html',
    было: 'js/kslt-okno.js?v=', станет: 'js/kslt-okno-net.js?v=' },

  { имя: 'дом перестал слушать аппаратную «назад»',
    ждём: 'аппаратная «назад» закрывает окно, а не приложение',
    файл: ДОМ,
    было: "П.App.addListener('backButton'", станет: "П.App.addListener('netTakoy'" },

  { имя: 'плагин аппаратной кнопки выпал из сборки',
    ждём: 'плагин аппаратной кнопки объявлен в сборке',
    файл: 'mobile/package.json',
    было: '"@capacitor/app"', станет: '"@capacitor/app-net"' },

  { имя: 'из списка дома выпало окно возврата записи',
    ждём: 'ни одно окно не осталось без оснастки',
    файл: ДОМ, было: " ' .ar-overlay, .onboarding-overlay, .otp-pw-overlay,' +",
    станет: " ' .onboarding-overlay, .otp-pw-overlay,' +" },

  { имя: 'список дома снесён целиком', ждём: 'прибор нашёл места, где открываются окна',
    файл: ДОМ, было: '    var ОКНА = ', станет: '    var ОКНА_ИНАЧЕ = ' },

  { имя: 'в приложении завелось новое окно без оснастки',
    ждём: 'ни одно окно не осталось без оснастки',
    файл: 'mobile/www/js/app.js',
    было: '  // === Toast ===',
    станет: "  function новоеОкно() {\n    var ov = document.createElement('div');\n    ov.className = 'xx-novoe-okno';\n    document.body.appendChild(ov);\n    ov.classList.add('open');\n  }\n\n  // === Toast ===" },

  { имя: 'прибор ослеп на место без переменной',
    ждём: 'прибор видит ВСЕ места, а не часть',
    файл: СТОРОЖ,
    было: '            if (с.indexOf("classList.add(\'open\')") === -1) return;',
    станет: '            if (с.indexOf("classList.add(\'open\')") === -1) return;\n            if (!/[\\w$]\\s*\\.classList\\.add\\(\\s*\'open\'/.test(с)) return;' },

  /* ОТКАТ ОБЯЗАН ОСТАВИТЬ СТОРОЖА РАБОЧИМ: первая редакция ломала
     синтаксис, сторож падал с SyntaxError, и в выводе не было ни одного
     `✗` — упавший сторож это НЕ упавшее правило. */
  { имя: 'у исключения стёрта причина', ждём: 'у каждого исключения названа причина',
    файл: СТОРОЖ,
    было: "'ЭТО НЕ ОКНО ПОВЕРХ СТРАНИЦЫ, А САМ ЭКРАН ВХОДА. Под ним ' +\n        'нет страницы, к которой можно вернуться, и возвращать фокус ' +\n        'некому: вошёл — экран уходит, не вошёл — он единственное, что ' +\n        'есть. `role=\"dialog\"` здесь сказал бы диктору неправду.'",
    станет: "'потом'" },

  { имя: 'исключение объявлено ещё и окном', ждём: 'исключение не объявлено окном в доме',
    /* ЯКОРЬ ПЕРЕЕХАЛ 02.11: список окон дома дорос новой строкой
       (`.push-prime-overlay`), и хвост `';` съехал с прежней строки.
       Держимся за последний класс списка, а не за конец строки. */
    файл: ДОМ, было: " ' .push-prime-overlay';",
    станет: " ' .push-prime-overlay, .auth-screen';" },

  { имя: 'сторож снова держит список руками',
    ждём: 'список окон дома читается, а не держится в сторожe руками',
    файл: СТОРОЖ,
    было: "    const м = безКом(чит(ДОМ)).match(/var ОКНА = ([\\s\\S]*?);/);",
    станет: "    const м = безКом(чит(ДОМ)).match(/var ОКНА = ([\\s\\S]*?);/);\n    if (0) return ['td-overlay'];" },

  { имя: 'плашка «корт открыт» объявлена окном',
    ждём: 'класс `open` у не-окна не объявлен окном',
    файл: ДОМ, было: " ' .menu-overlay, .live-full, .nm-viewer, .msa-overlay,' +",
    станет: " ' .menu-overlay, .live-full, .nm-viewer, .msa-overlay, .tc-status,' +" }
];

function копия() {
  const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-okna-'));
  for (const о of ['mobile/www', 'tools'])
    fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
  /* `mobile/package.json` — не папка, а один файл, и в копию он не
     попадал: сторож с 02.11 читает его (плагин аппаратной кнопки), и
     прувер падал с ENOENT ещё до первого отката. КОПИЯ ОБЯЗАНА СОДЕРЖАТЬ
     ВСЁ, ЧТО ЧИТАЕТ СТОРОЖ, иначе доказывается не правило, а нехватка
     файла. */
  fs.copyFileSync(path.join(КОРЕНЬ, 'mobile/package.json'),
                  path.join(к, 'mobile/package.json'));
  return к;
}
function прогон(к) {
  try { return execFileSync('node', [path.join(к, СТОРОЖ)],
    { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
console.log('\n  ПРУВЕР: ОКНА ПРИЛОЖЕНИЯ\n');
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
