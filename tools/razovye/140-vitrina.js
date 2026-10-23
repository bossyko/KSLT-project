/* РАЗОВЫЙ ПРИБОР куска 140: три понятия витрины — к дому.
   Имена функций у зовущих остаются: правка меняет, ГДЕ живёт поведение. */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');

const ЦЕЛИ = {
  'js/coaches.js':  { сетка: '.co-grid', ряды: '--co-ryadov', коробка: 'coachesGrid' },
  'js/courts.js':   { сетка: '.ct-grid', ряды: '--ct-ryadov', коробка: 'courtsGrid' },
  'js/partners.js': { сетка: '.pt-grid', ряды: '--pt-ryadov', коробка: 'ptGrid' }
};

function тело(имя, о) {
  if (имя === 'пересчитатьШаг') return `{
        /* ШАГ СЧИТАЕТ ДОМ (js/kslt-vitrina.js). Здесь остаётся только своё
           имя сетки и свой PER_PAGE: число живёт у зовущего. */
        var шаг = KSLT_VITRINA.шаг('${о.сетка}', '${о.ряды}');
        if (!шаг || шаг === PER_PAGE) return false;
        PER_PAGE = шаг;
        return true;
    }`;
  if (имя === 'следитьЗаШагом') return `{
        KSLT_VITRINA.следитьЗаШириной(document.getElementById('${о.коробка}'), function () {
            if (пересчитатьШаг()) renderGrid();
        });
    }`;
  if (имя === 'initPaginationClicks') return `{
        KSLT_VITRINA.нажатияПолосы(document.getElementById('${о.коробка}'),
            function () { return _currentPage; },
            function (n) { _currentPage = n; },
            renderGrid);
    }`;
  if (имя === 'sortPromotedFirst') return `{
        return KSLT_VITRINA.продвинутыеПервыми(arr);
    }`;
  return null;
}

let сделано = 0;
Object.keys(ЦЕЛИ).forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  let т = fs.readFileSync(полный, 'utf8');
  for (;;) {
    const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
    let цель = null;
    (function обойти(у) {
      if (!у || typeof у.type !== 'string' || цель) return;
      if (у.type === 'FunctionDeclaration' && у.id && тело(у.id.name, ЦЕЛИ[ф])) {
        const своё = т.slice(у.body.start, у.body.end);
        if (своё.indexOf('KSLT_VITRINA') === -1) { цель = у; return; }
      }
      for (const к of Object.keys(у)) {
        if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
        const v = у[к];
        if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x));
        else if (v && typeof v.type === 'string') обойти(v);
      }
    })(д);
    if (!цель) break;
    const н = т.slice(0, цель.body.start) + тело(цель.id.name, ЦЕЛИ[ф]) + т.slice(цель.body.end);
    acorn.parse(н, { ecmaVersion: 2020 });
    т = н;
    сделано++;
    console.log('  ' + ф + '  ' + цель.id.name);
  }
  fs.writeFileSync(полный, т, 'utf8');
});
console.log('переведено на дом витрины: ' + сделано);
/* ЗАМЕР: 3 файла × шаг, слежение, нажатия + 2 файла × продвинутые = 11. */
if (сделано !== 11 && сделано !== 0) { console.error('ЖДАЛИ 11 или 0'); process.exit(1); }
