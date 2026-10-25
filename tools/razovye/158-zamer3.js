/** ЗАМЕР 158, третий проход: БЕЛЫЙ СПИСОК. В склейке с разметкой безопасным
 *  считается только то, что названо безопасным: литерал, зов экранирования,
 *  дом, словарь. Всё прочее — кандидат, даже если имя поля ничего не говорит. */
const fs = require('fs'), path = require('path');
const acorn = require(path.join(__dirname, '..', '..', 'node_modules', 'acorn'));
const КОРЕНЬ = path.join(__dirname, '..', '..');
function всеJS(д, и) { и = и || [];
    for (const э of fs.readdirSync(д, { withFileTypes: true })) { const п = path.join(д, э.name);
        if (э.isDirectory()) всеJS(п, и); else if (э.name.endsWith('.js')) и.push(path.relative(КОРЕНЬ, п).split(path.sep).join('/')); } return и; }
const ЭКРАНЫ = ['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом'];
const СЛОВАРИ = ['L','L2','SUB','labels','ТЕКСТЫ','T','LB','EMPTY','SL','texts','EMOJI_MAP','getLabels','LH','CL','ICON','L_labels'];
const ДОМА = ['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','A'];
const РАЗМЕТКА = /<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function имяЗова(у){ if(!у.callee) return null;
    if(у.callee.type==='Identifier') return у.callee.name;
    if(у.callee.type==='MemberExpression'){ const об=у.callee.object, св=у.callee.property;
        const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
        return (и?и+'.':'')+(св.type==='Identifier'?св.name:''); } return null; }
function корень(x){ while(x&&(x.type==='MemberExpression'||x.type==='CallExpression')) x=x.object||x.callee; return x&&x.type==='Identifier'?x.name:null; }
/** белый список: true — безопасно, 'зов' — своя функция, false — кандидат */
function разбор(у){ if(!у) return true;
    if(у.type==='Literal'||у.type==='TemplateLiteral') return true;
    if(у.type==='BinaryExpression'&&у.operator==='+'){ const л=разбор(у.left), п=разбор(у.right);
        return (л===true&&п===true)?true:((л===false||п===false)?false:'зов'); }
    if(у.type==='ConditionalExpression'||у.type==='LogicalExpression'){
        const а=разбор(у.type==='LogicalExpression'?у.left:у.consequent);
        const б=разбор(у.type==='LogicalExpression'?у.right:у.alternate);
        return (а===true&&б===true)?true:((а===false||б===false)?false:'зов'); }
    if(у.type==='UnaryExpression') return разбор(у.argument);
    if(у.type==='CallExpression'){ const имя=имяЗова(у)||'';
        const после=имя.indexOf('.')!==-1?имя.split('.')[1]:имя;
        if(ЭКРАНЫ.indexOf(после)!==-1||ЭКРАНЫ.indexOf(имя)!==-1) return true;
        if(ДОМА.indexOf(корень(у))!==-1) return true;
        if(СЛОВАРИ.indexOf(имя)!==-1) return true;
        return 'зов'; }
    if(у.type==='MemberExpression'){ const к=корень(у);
        if(к&&(СЛОВАРИ.indexOf(к)!==-1||ДОМА.indexOf(к)!==-1)) return true;
        return false; }
    if(у.type==='Identifier') return 'перем';
    return false; }
function части(у,и){ и=и||[];
    if(у.type==='BinaryExpression'&&у.operator==='+'){ части(у.left,и); части(у.right,и); } else и.push(у); return и; }
function естьРазметка(с){ return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw)))); }

const канд=[], зовы=[], перем=[];
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
    const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
    let д; try{ д=acorn.parse(т,{ecmaVersion:2020,locations:true}); }catch(e){ return; }
    (function х(у,р){ if(!у||typeof у!=='object') return;
        if(Array.isArray(у)) return у.forEach(н=>х(н,р));
        if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
            const сп=части(у);
            if(естьРазметка(сп)) сп.forEach(ч=>{ const о=разбор(ч);
                const м=ф+':'+ч.loc.start.line+'  '+т.slice(ч.start,ч.end).replace(/\s+/g,' ').slice(0,46);
                if(о===false) канд.push(м); else if(о==='зов') зовы.push(м); else if(о==='перем') перем.push(м); }); }
        for(const к in у) if(к!=='loc'&&к!=='start'&&к!=='end') х(у[к],у);
    })(д,null);
});
const пф=о=>{ const m={}; о.forEach(с=>{ const ф=с.split(':')[0]; m[ф]=(m[ф]||0)+1; }); return m; };
console.log('КАНДИДАТЫ (чтение свойства не из словаря и не из дома):', канд.length, 'в', Object.keys(пф(канд)).length, 'файлах');
console.log('ПЕРЕМЕННЫЕ (голое имя, что в ней — неизвестно):', перем.length, 'в', Object.keys(пф(перем)).length, 'файлах');
console.log('ЗОВЫ своих функций:', зовы.length, 'в', Object.keys(пф(зовы)).length, 'файлах');
console.log('\n--- кандидаты по файлам (верх) ---');
console.log(Object.entries(пф(канд)).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([ф,н])=>'  '+String(н).padStart(3)+'  '+ф).join('\n'));
