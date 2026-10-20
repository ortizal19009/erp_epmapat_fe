const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../src/app');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const buttons=/<button\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/button>/g;
const attribute=(s,name)=>s.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'="([^"]*)"'))?.[1];
function set(scope,p,value){const parts=p.split('.');let x=scope;for(const k of parts.slice(0,-1))x=x[k]??=(Object.create(null));x[parts.at(-1)]=value;}
function get(scope,p){return p.split('.').reduce((o,k)=>o[k],scope);}
const evaluate=(expression,scope)=>new Function('scope','with(scope){return ('+expression+');}')(scope);
let checked=0;
for(const file of files(root).filter(f=>f.endsWith('.html'))){
 for(const m of fs.readFileSync(file,'utf8').matchAll(buttons)){
  const button=m[0],label=attribute(button,'aria-label');
  if(!['Primera p&#225;gina','&#218;ltima p&#225;gina'].includes(label))continue;
  const disabled=attribute(button,'[disabled]'),click=attribute(button,'(click)');
  const dimensions=disabled.match(/([\w.]+) <= 1 \|\| ([\w.]+) (?:<= ([01])|>= ([\w.]+)( - 1)?)/);
  assert.ok(dimensions,'Boundary dimensions missing: '+file);
  const total=dimensions[1],current=dimensions[2],first=label.startsWith('Primera');
  const base=first?Number(dimensions[3]):dimensions[5]?0:1;
  const scope={};
  // Every original disabled expression is a combination of page counters and busy flags.
  for(const id of disabled.matchAll(/\b[a-zA-Z_]\w*(?:\.\w+)*/g))if(!['true','false'].includes(id[0]))set(scope,id[0],false);
  for(const count of [0,1,5]){
   set(scope,total,count);set(scope,current,base);
   if(count<=1)assert.equal(evaluate(disabled,scope),true,'Empty/single page: '+file);
   if(count===5){
    set(scope,current,first?base:count-(base===0?1:0));assert.equal(evaluate(disabled,scope),true,'Already at boundary: '+file);
    set(scope,current,base+2);assert.equal(evaluate(disabled,scope),false,'Middle page should be enabled: '+file);
    let calls=[];for(const call of click.matchAll(/\b([a-zA-Z_]\w*)\(/g))scope[call[1]]=(...args)=>calls.push({name:call[1],args});
    new Function('scope','with(scope){'+click+';}')(scope);
    const target=first?base:count-(base===0?1:0);
    const navigated=calls.find(c=>c.name!=='load'&&c.name!=='cargarAbonados');
    if(navigated){let actual=navigated.args.filter(a=>typeof a==='number').at(-1);if(navigated.name==='changeFacturasCobradasPage')actual+=base+2;assert.equal(actual,target,'Wrong destination: '+click);}
    else assert.equal(get(scope,current),target,'Assignment destination: '+click);
   }
  }
  checked++;
 }
}
assert.ok(checked>=60,'Expected system-wide boundary buttons');
console.log('Pagination boundaries verified: '+checked+' buttons; empty, single, first, last, and direct jumps.');
