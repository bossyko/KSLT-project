const fs=require('fs'),path=require('path'),acorn=require('acorn');
function обойти(у,дело){if(!у||typeof у.type!=='string')return;дело(у);
 for(const к of Object.keys(у)){if(['type','start','end','loc'].includes(к))continue;const v=у[к];
  if(Array.isArray(v))v.forEach(x=>x&&typeof x.type==='string'&&обойти(x,дело));
  else if(v&&typeof v.type==='string')обойти(v,дело);}}
const найдено=[];
(function о(д){fs.readdirSync(д,{withFileTypes:true}).forEach(э=>{const п=path.join(д,э.name);
 if(э.isDirectory()){о(п);return;} if(!э.name.endsWith('.js'))return;
 if(/core[\/\\]utils\.js$/.test(п))return;
 const т=fs.readFileSync(п,'utf8');let дер;try{дер=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 обойти(дер,у=>{if(у.type==='BinaryExpression'&&у.operator==='==='&&у.right&&у.right.type==='Literal'&&
   (у.right.value==='admin'||у.right.value==='manager')){
   const лев=т.slice(у.left.start,у.left.end);
   if(лев==='A.currentRole')return;
   найдено.push(п+':'+у.loc.start.line+'  '+лев);}});
});})('js/admin');
найдено.forEach(с=>console.log(с));
console.log('ВСЕГО '+найдено.length);
