/** ПРИЗНАК ИЗ СХЕМЫ БАЗЫ. Поле — текст, если столбец объявлен текстом в
 *  supabase/migrations. Имена больше не угадываются. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
function всеJS(д,и){и=и||[];for(const э of fs.readdirSync(д,{withFileTypes:true})){const п=path.join(д,э.name);
 if(э.isDirectory())всеJS(п,и);else if(э.name.endsWith('.js'))и.push(path.relative(КОРЕНЬ,п).split(path.sep).join('/'));}return и;}
/* ---- текстовые столбцы прямо из схемы ---- */
const схема=fs.readdirSync(path.join(КОРЕНЬ,'supabase','migrations'))
 .filter(и=>и.endsWith('.sql')).map(и=>fs.readFileSync(path.join(КОРЕНЬ,'supabase','migrations',и),'utf8')).join('\n')
 + fs.readFileSync(path.join(КОРЕНЬ,'supabase','schema.sql'),'utf8');
const ТЕКСТОВЫЕ=new Set();
/* СТОЛБЕЦ ПИШЕТ ЧЕЛОВЕК, ЕСЛИ ОН ТЕКСТ, У НЕГО НЕТ CHECK СО СПИСКОМ
   ЗНАЧЕНИЙ И ОН НЕ ИДЕНТИФИКАТОР. Всё три признака читаются из схемы. */
схема.split('\n').forEach(с=>{
    const м=/["']?([a-z][a-z0-9_]*)["']?\s+["']?(?:text|character varying|varchar|citext)["']?/i.exec(с);
    if(!м)return;
    const имя=м[1];
    if(/\bCHECK\b/i.test(с))return;
    if(имя==='id'||/_id$/.test(имя)||/uuid/i.test(с))return;
    ТЕКСТОВЫЕ.add(имя);
});
/* Имена, совпадающие с ключами НАШИХ словарей: корень проверяется ниже,
   но эти встречаются в словарях чаще, чем в данных, и читаются по месту. */
const СЛОВАРНЫЕ=new Set(['title','name','text','label','icon','code','type','format','country','message','price','content','url','src','action','category','round','court','status','position','color','val','out','parts','form','score','season','reason','note','author','location','address','city','description','excerpt','slogan','tags','image','photo','email','phone','telegram','instagram','whatsapp','currency','purpose','audience','experience','specialization','surface','identifier','channel','executor','flow','building','district','street','limit_key','block_key','p_key','s_item','CONSTANT','achievements','badges','gallery','logo','condition_type','counter_step','first_name','last_name','patronymic','play_level','preferred_time','working_hours','short_desc','service_name','entity_name','player_name','tournament_name','tournament_label','partner_gender','voter_type','entity_type','reaction_type','match_type','bracket_type','set_format','device_hash','user_agent','fcm_token','qr_token','confirmed_by_ip','ip','postal_code','phone_country','whatsapp_country','phone_e164','avatar_url','banner_url','google_maps_url','twogis_url','youtube_url','sponsor_logo','image_original','new_badges','round_reached','final_score','score_draft','proposed_time','proposed_venue','counter_time','counter_venue','battle_title','external_name','external_country','partner_external_name','block_reason','ban_reason','prize_fund','start_time','scheduled_time','slug','bio','amenities','points_p1','points_p2','sets_arr','p_email','p_ids','p_news_ids','p_page_name','p_token','page_name','partner_pin','umpire_key','v_correct_pin','v_entity_name','v_existing','v_player_name','v_score','v_tg_vote','service_name_en','p_email']);
void СЛОВАРНЫЕ;
const ЭКРАНЫ=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом','encodeURIComponent'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','A'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function имяЗова(у){if(!у.callee)return null;if(у.callee.type==='Identifier')return у.callee.name;
 if(у.callee.type==='MemberExpression'){const об=у.callee.object,св=у.callee.property;
  const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
  return (и?и+'.':'')+(св.type==='Identifier'?св.name:'');}return null;}
function корень(x){while(x&&(x.type==='MemberExpression'||x.type==='CallExpression'))x=x.object||x.callee;return x&&x.type==='Identifier'?x.name:null;}
/** собираем ЧТЕНИЯ текстовых столбцов, не обёрнутые в экранирование/дом,
 *  и только в ветках ВЫВОДА (проверка на пустоту — не подстановка) */
function текстовыеВнутри(у,итог){ if(!у||typeof у!=='object')return итог;
 if(Array.isArray(у)){у.forEach(н=>текстовыеВнутри(н,итог));return итог;}
 if(у.type==='ConditionalExpression'){текстовыеВнутри(у.consequent,итог);текстовыеВнутри(у.alternate,итог);return итог;}
 if(у.type==='LogicalExpression'&&у.operator==='&&'){текстовыеВнутри(у.right,итог);return итог;}
 if(у.type==='CallExpression'){const имя=имяЗова(у)||'';const п=имя.indexOf('.')!==-1?имя.split('.')[1]:имя;
  if(ЭКРАНЫ.indexOf(п)!==-1||ЭКРАНЫ.indexOf(имя)!==-1)return итог;
  if(ДОМА.indexOf(корень(у))!==-1)return итог;}
 if(у.type==='MemberExpression'&&у.property&&у.property.type==='Identifier'&&ТЕКСТОВЫЕ.has(у.property.name)
    &&!(корень(у)&&ДОМА.indexOf(корень(у))!==-1)) итог.push(у);
 for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')текстовыеВнутри(у[к],итог);
 return итог;}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}
const дыры=[];
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп))сп.forEach(ч=>текстовыеВнутри(ч,[]).forEach(н=>
    дыры.push(ф+':'+н.loc.start.line+'  '+т.slice(н.start,н.end).replace(/\s+/g,' ').slice(0,44))));}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);
});
console.log('столбцов, которые пишет человек:',ТЕКСТОВЫЕ.size);
const у=[...new Set(дыры)];
const публ=у.filter(с=>!с.startsWith('js/admin/'));
const адм=у.filter(с=>s=>0||с.startsWith('js/admin/'));
console.log('ПУБЛИЧНАЯ ЧАСТЬ:',публ.length,'| АДМИНКА:',у.length-публ.length);
const пф={};у.forEach(с=>{const ф=с.split(':')[0];пф[ф]=(пф[ф]||0)+1;});
console.log('ТЕКСТОВЫЙ СТОЛБЕЦ В РАЗМЕТКЕ БЕЗ ЭКРАНИРОВАНИЯ:',у.length,'в',Object.keys(пф).length,'файлах\n');
у.forEach((д,i)=>console.log(String(i+1).padStart(3)+'. '+д));
