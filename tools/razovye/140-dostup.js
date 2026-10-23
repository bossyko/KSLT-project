/* РАЗОВЫЙ ПРИБОР куска 140: тело `detectAccess` заменяется зовом дома.
   Имя функции и все её зовы ОСТАЮТСЯ — правка меняет, ОТКУДА берётся
   ответ, а не как он зовётся: так диф читается, и ничего больше не едет.
   Прибор падает, если нашёл не четыре места. */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const ЦЕЛИ = ['js/coaches.js', 'js/courts.js', 'js/players.js', 'js/player.js'];
const ТЕЛО = `{
        /* УРОВЕНЬ ДОСТУПА — У ДОМА (js/kslt-dostup.js). Здесь стояла своя
           копия: пять копий одного понятия разошлись, и эта не считала
           админа членом клуба. */
        _accessLevel = await KSLT_DOSTUP.уровень();
    }`;
const ТЕЛО_С_ИГРОКОМ = `{
        /* УРОВЕНЬ ДОСТУПА И СВОЯ КАРТОЧКА — У ДОМА (js/kslt-dostup.js). */
        _accessLevel = await KSLT_DOSTUP.уровень();
        _myPlayerId = KSLT_DOSTUP.мойИгрок();
    }`;
let сделано = 0;
ЦЕЛИ.forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  const т = fs.readFileSync(полный, 'utf8');
  const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  let цель = null;
  (function обойти(у) {
    if (!у || typeof у.type !== 'string' || цель) return;
    if (у.type === 'FunctionDeclaration' && у.id && у.id.name === 'detectAccess') { цель = у; return; }
    for (const к of Object.keys(у)) {
      if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
      const v = у[к];
      if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x));
      else if (v && typeof v.type === 'string') обойти(v);
    }
  })(д);
  if (!цель) { console.error('нет detectAccess в ' + ф); process.exit(1); }
  const своя = т.slice(цель.body.start, цель.body.end);
  const нужноИгрока = /_myPlayerId/.test(своя);
  const н = т.slice(0, цель.body.start) + (нужноИгрока ? ТЕЛО_С_ИГРОКОМ : ТЕЛО) + т.slice(цель.body.end);
  acorn.parse(н, { ecmaVersion: 2020 });
  fs.writeFileSync(полный, н, 'utf8');
  сделано++;
  console.log('  ' + ф + ':' + цель.loc.start.line + (нужноИгрока ? '  (+ своя карточка)' : ''));
});
console.log('переведено на дом: ' + сделано);
if (сделано !== 4) { console.error('ЖДАЛИ 4'); process.exit(1); }
