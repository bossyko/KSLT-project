/* РАЗОВЫЙ ПРИБОР куска 141: 31 копия экранирования → один дом.
 *
 * ПРАВКА ИДЁТ ПО ДЕРЕВУ, А НЕ ПО ТЕКСТУ: имя `esc` встречается и в чужих
 * словах (`escape`, `_esc`), и в строках. Трогаются ровно два вида узлов:
 *   · объявление функции `esc`/`escHtml`/`escapeHtml` — удаляется;
 *   · зов такой функции по имени — имя заменяется на зов дома.
 * Остальное не трогается, и после каждой правки файл разбирается заново.
 *
 * АДМИНКА — ОСОБЫЙ СЛУЧАЙ, И ОН НАЗВАН: её дом `A.esc` остаётся как имя,
 * привычное 200+ зовам, но перестаёт быть ВТОРЫМ ОПРЕДЕЛЕНИЕМ — он
 * становится ссылкой на общий дом. Это делается руками, не прибором.
 */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const ДОМ = 'KSLT_экранировать';
const ИМЕНА = /^(esc|escHtml|escapeHtml)$/;

const файлы = [];
(function обход(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/^node_modules$/.test(э.name)) обход(п); }
    else if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');

function обойти(у, дело) {
  if (!у || typeof у.type !== 'string') return;
  дело(у);
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, дело));
    else if (v && typeof v.type === 'string') обойти(v, дело);
  }
}

let убрано = 0, переписано = 0, файловТронуто = 0;
файлы.forEach(ф => {
  /* дом и админка — не здесь */
  if (/kslt-ekranirovanie\.js$/.test(ф) || ф.indexOf(path.join('js', 'admin')) === 0) return;
  const полный = path.join(КОРЕНЬ, ф);
  const т = fs.readFileSync(полный, 'utf8');
  let д;
  try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }

  const правки = [];
  обойти(д, у => {
    if ((у.type === 'FunctionDeclaration' || у.type === 'FunctionExpression') &&
        у.id && ИМЕНА.test(у.id.name)) {
      /* объявление целиком, вместе с отступом и переводом строки */
      let s = у.start, e = у.end;
      правки.push({ s: s, e: e, текст: null, вид: 'объявление' });
      return;
    }
    if (у.type === 'CallExpression' && у.callee && у.callee.type === 'Identifier' &&
        ИМЕНА.test(у.callee.name)) {
      правки.push({ s: у.callee.start, e: у.callee.end, текст: ДОМ, вид: 'зов' });
    }
  });
  if (!правки.length) return;

  let н = т;
  правки.sort((a, b) => b.s - a.s).forEach(п => {
    if (п.текст === null) {
      let s = п.s, e = п.e;
      while (s > 0 && /[ \t]/.test(н[s - 1])) s--;
      if (н[s - 1] === '\n') s--;
      while (е(н, e) === '\n' && н[e] === '\n') break;
      if (н[e] === '\n') e++;
      н = н.slice(0, s) + н.slice(e);
      убрано++;
    } else {
      н = н.slice(0, п.s) + п.текст + н.slice(п.e);
      переписано++;
    }
  });
  function е(с, i) { return с[i]; }
  acorn.parse(н, { ecmaVersion: 2020 });
  fs.writeFileSync(полный, н, 'utf8');
  файловТронуто++;
  console.log('  ' + ф + '  объявлений убрано, зовов переписано: ' +
              правки.filter(p => p.текст).length);
});
console.log('файлов: ' + файловТронуто + ', объявлений убрано: ' + убрано +
            ', зовов переписано: ' + переписано);
