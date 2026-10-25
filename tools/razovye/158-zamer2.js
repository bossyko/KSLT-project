/** ЗАМЕР 158, второй проход: ЛЮБАЯ склейка, несущая разметку, — где бы она
 *  ни кончалась. Признак безопасности взят ИЗ сторожа 157 без изменений. */
const fs = require('fs'), path = require('path');
const acorn = require(path.join(__dirname, '..', '..', 'node_modules', 'acorn'));
const КОРЕНЬ = path.join(__dirname, '..', '..');
function всеJS(д, и) { и = и || [];
    for (const э of fs.readdirSync(д, { withFileTypes: true })) { const п = path.join(д, э.name);
        if (э.isDirectory()) всеJS(п, и); else if (э.name.endsWith('.js')) и.push(path.relative(КОРЕНЬ, п).split(path.sep).join('/')); } return и; }

const ЭКРАНЫ = ['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом'];
const СЛОВАРИ = ['L','L2','SUB','labels','ТЕКСТЫ','T','LB','EMPTY','SL','texts','EMOJI_MAP','getLabels',
    /* прочитаны по месту: собраны литералами или через KSLT_YAZYK.выбрать */
    'LH','CL','ICON','L_labels','CONTACT_ICON','statusLabels','catLabels'];
/* ЧИСЛОВЫЕ И ДАТОВЫЕ СТОЛБЦЫ — ТИП ВЗЯТ ИЗ СХЕМЫ БАЗЫ, А НЕ ИЗ ИМЕНИ.
   Каждое имя ниже проверено в supabase/migrations: integer, numeric или date. */
const НЕ_ТЕКСТ = /(_id$|_count$|_participants$|_spots$|^fee_|_duration$|_per_group$|_at$|_start$|_end$|_percent$|_order$|^birth_|_day$|_month$|_year$|^sort_|_number$|_earned$|_sent$|_change$|^per_win$|^per_entry$|^current_game|_wins$|_losses$|^best_of$|^ntrp|^price$|^cost$|^points$|^wins$|^losses$|^amount$|^rowspan$|^колонок$)/;
const НАЗВАН_РАЗМЕТКОЙ = /Html$/;
const ДОМА = ['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS'];
const ПИШЕТ_ЧЕЛОВЕК = /(title|name|text|note|message|description|venue|comment|address|city|club|reason|nickname|bio|label|slug|email|phone)/i;
function имяЗова(у){ if(!у.callee) return null;
    if(у.callee.type==='Identifier') return у.callee.name;
    if(у.callee.type==='MemberExpression'){ const об=у.callee.object, св=у.callee.property;
        const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
        return (и?и+'.':'')+(св.type==='Identifier'?св.name:''); } return null; }
function безопасно(у){ if(!у) return true;
    if(у.type==='Literal'||у.type==='TemplateLiteral') return true;
    if(у.type==='BinaryExpression'&&у.operator==='+') return безопасно(у.left)&&безопасно(у.right);
    if(у.type==='ConditionalExpression') return безопасно(у.consequent)&&безопасно(у.alternate);
    if(у.type==='LogicalExpression') return безопасно(у.left)&&безопасно(у.right);
    if(у.type==='UnaryExpression') return безопасно(у.argument);
    if(у.type==='CallExpression'){ const имя=имяЗова(у)||'';
        const после=имя.indexOf('.')!==-1?имя.split('.')[1]:имя;
        if(ЭКРАНЫ.indexOf(после)!==-1||ЭКРАНЫ.indexOf(имя)!==-1) return true;
        if(ДОМА.indexOf(имя.split('.')[0])!==-1) return true; return 'зов'; }
    if(у.type==='MemberExpression'){
        const корень=(function к(x){ while(x&&x.type==='MemberExpression') x=x.object; return x&&x.type==='Identifier'?x.name:null; })(у);
        if(корень&&(СЛОВАРИ.indexOf(корень)!==-1||ДОМА.indexOf(корень)!==-1)) return true;
        const св=у.property&&у.property.type==='Identifier'?у.property.name:null;
        if(!св) return true;
        if(НАЗВАН_РАЗМЕТКОЙ.test(св)) return true;
        if(НЕ_ТЕКСТ.test(св)) return true;
        return !(св.indexOf('_')!==-1||ПИШЕТ_ЧЕЛОВЕК.test(св)); }
    if(у.type==='Identifier') return true;
    return true; }

const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function части(у,и){ и=и||[];
    if(у.type==='BinaryExpression'&&у.operator==='+'){ части(у.left,и); части(у.right,и); } else и.push(у); return и; }
function естьРазметка(спис){ return спис.some(ч =>
    (ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value)) ||
    (ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw)))); }

const дыры=[], зовы=[]; let склеек=0;
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
    const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
    let д; try{ д=acorn.parse(т,{ecmaVersion:2020,locations:true}); }catch(e){ return; }
    (function х(у,родитель){
        if(!у||typeof у!=='object') return;
        if(Array.isArray(у)) return у.forEach(н=>х(н,родитель));
        if(у.type==='BinaryExpression'&&у.operator==='+'&&
           !(родитель&&родитель.type==='BinaryExpression'&&родитель.operator==='+')){
            const сп=части(у);
            if(естьРазметка(сп)){ склеек++;
                сп.forEach(ч=>{ const р=безопасно(ч);
                    const метка=ф+':'+ч.loc.start.line+'  '+т.slice(ч.start,ч.end).replace(/\s+/g,' ').slice(0,52);
                    if(р===false) дыры.push(метка); else if(р==='зов') зовы.push(метка); }); } }
        for(const к in у) if(к!=='loc'&&к!=='start'&&к!=='end') х(у[к],у);
    })(д,null);
});
const пф={}; дыры.forEach(д=>{ const ф=д.split(':')[0]; пф[ф]=(пф[ф]||0)+1; });
console.log('склеек, несущих разметку:', склеек);
console.log('ДЫР (поле человека в склейке с разметкой):', дыры.length, 'в', Object.keys(пф).length, 'файлах');
console.log('зовов своих функций внутри таких склеек:', зовы.length);
console.log('\n--- дыры по файлам ---');
console.log(Object.entries(пф).sort((a,b)=>b[1]-a[1]).map(([ф,н])=>'  '+String(н).padStart(3)+'  '+ф).join('\n'));

console.log('\n--- ВСЕ ДЫРЫ ---');
дыры.forEach((д,i)=>console.log(String(i+1).padStart(3)+'. '+д));
