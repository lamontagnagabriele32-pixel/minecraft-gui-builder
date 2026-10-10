const fs=require("fs"),path=require("path");
function walk(d,out,lim,ex){let es;try{es=fs.readdirSync(d,{withFileTypes:true})}catch(e){return}
 for(const e of es){if(out.length>=lim)return;if(/^(\.|build$|node_modules$|run$|out$)/.test(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f,out,lim,ex);else if(ex.test(e.name))out.push(f)}}
function pngDim(b){return b.length>24&&b.toString("ascii",1,4)==="PNG"?[b.readUInt32BE(16),b.readUInt32BE(20)]:null}
const uniq=a=>[...new Set(a)];
function scanMod(root){const r={root,ok:false,modId:"",pkg:"",items:[],blocks:[],sounds:[],entities:[],screens:[],menus:[],textures:[]};
 const js=[];walk(path.join(root,"src","main","java"),js,3000,/\.java$/);r.ok=js.length>0;let id2="";
 for(const f of js){let s;try{s=fs.readFileSync(f,"utf8")}catch(e){continue}const pk=(/^\s*package\s+([\w.]+);/m.exec(s)||[])[1]||"";
  const m=/@Mod\(\s*"([^"]+)"\s*\)/.exec(s);if(m&&!r.modId){r.modId=m[1];r.pkg=pk}
  const c=/MOD_ID\s*=\s*"([^"]+)"/.exec(s);if(c&&!id2)id2=c[1];
  for(const q of s.matchAll(/(\w+)\s*\.\s*register\(\s*"([a-z0-9_./]+)"/g)){const n=q[1].toUpperCase(),id=q[2];
   if(/BLOCK/.test(n))r.blocks.push(id);else if(/ITEM/.test(n))r.items.push(id);else if(/SOUND/.test(n))r.sounds.push(id);else if(/ENTIT/.test(n))r.entities.push(id)}
  for(const q of s.matchAll(/class\s+(\w+)(?:<[^>]*>)?\s+extends\s+(Screen|AbstractContainerScreen)\b(?:\s*<\s*(\w+)\s*>)?/g)){const k=(new RegExp("public\\s+"+q[1]+"\\s*\\(([^)]*)\\)").exec(s)||[])[1]||"";r.screens.push({cls:q[1],pkg:pk,kind:q[2],ctor:k.trim(),menu:q[3]||"",file:f})}
  for(const q of s.matchAll(/class\s+(\w+)\s+extends\s+AbstractContainerMenu\b/g))r.menus.push({cls:q[1],pkg:pk,file:f})}
 if(!r.modId)r.modId=id2;
 if(!r.modId)for(const n of["neoforge.mods.toml","mods.toml"]){try{const t=fs.readFileSync(path.join(root,"src/main/resources/META-INF",n),"utf8"),m=/modId\s*=\s*"([^"]+)"/.exec(t);if(m){r.modId=m[1];break}}catch(e){}}
 for(const k of["items","blocks","sounds","entities"])r[k]=uniq(r[k]);
 if(r.modId){const base=path.join(root,"src/main/resources/assets",r.modId,"textures","gui"),ps=[];walk(base,ps,60,/\.png$/i);
  for(const f of ps){try{const b=fs.readFileSync(f);if(b.length>300000)continue;r.textures.push({name:path.relative(base,f).replace(/\.png$/i,"").toLowerCase().replace(/[^a-z0-9]+/g,"_"),b64:b.toString("base64"),dim:pngDim(b)||[16,16]})}catch(e){}}}
 try{const lf=path.join(root,'src/main/resources/assets',r.modId,'lang','en_us.json');const j=JSON.parse(fs.readFileSync(lf,'utf8'));r.lang={};for(const k of Object.keys(j).slice(0,3000))if(typeof j[k]==='string')r.lang[k]=j[k]}catch(e){r.lang=r.lang||{}}
 return r}

function split(s){const out=[];let d=0,q=false,cur="";for(let i=0;i<s.length;i++){const c=s[i];if(q){cur+=c;if(c==="\\")cur+=s[++i]||"";else if(c==='"')q=false;continue}
 if(c==='"'){q=true;cur+=c}else if("([{".includes(c)){d++;cur+=c}else if(")]}".includes(c)){d--;cur+=c}else if(c===","&&d===0){out.push(cur.trim());cur=""}else cur+=c}if(cur.trim())out.push(cur.trim());return out}
function close(s,i){let d=0,q=false;for(;i<s.length;i++){const c=s[i];if(q){if(c==="\\")i++;else if(c==='"')q=false;continue}if(c==='"')q=true;else if(c==="(")d++;else if(c===")"&&--d===0)return i}return-1}
function calls(s,re){const out=[],g=new RegExp(re.source,"g");let m;while((m=g.exec(s))){const o=m.index+m[0].length-1;if(s[o]!=="(")continue;const c=close(s,o);if(c<0)continue;out.push({args:split(s.slice(o+1,c)),at:m.index,end:c,m})}return out}
function stmtEnd(s,i){let d=0,q=false;for(;i<s.length;i++){const c=s[i];if(q){if(c==="\\")i++;else if(c==='"')q=false;continue}if(c==='"')q=true;else if("({[".includes(c))d++;else if(")}]".includes(c)){if(--d<0)return i}else if(c===";"&&d===0)return i}return s.length}
function bodyEnd(s,i){while(/\s/.test(s[i]||"x"))i++;if(s[i]==="{"){let d=0;for(;i<s.length;i++){if(s[i]==="{")d++;else if(s[i]==="}"&&--d===0)return i+1}return s.length}
 if(/^for\s*\(/.test(s.slice(i,i+8))){const c=close(s,s.indexOf("(",i));return bodyEnd(s,c+1)}return stmtEnd(s,i)+1}
function parseScreen(src,msrc="",ctx={}){const all=src+"\n"+msrc,el=[],notes=[],slots=[];let skipped=0,n=0;
 const decl={};for(const m of all.matchAll(/(?:\b(?:static|final|private|public|protected)\s+)*\bint\s+(\w+)\s*=\s*([^;]+);/g))decl[m[1]]=m[2];
 for(const m of all.matchAll(/\bthis\.(imageWidth|imageHeight)\s*=\s*([^;]+);/g))decl[m[1]]=m[2];
 const ID={leftPos:1,topPos:1,guiLeft:1,guiTop:1};
 const ev=(t,V={},dep=0)=>{if(t==null||dep>8)return null;let bad=false,s=String(t).replace(/\(\s*(?:int|float|double|long)\s*\)\s*/g,"").replace(/\bthis\./g,"").replace(/(\d)[fFdDlL]\b/g,"$1").replace(/\bMath\.(?:floor|round|ceil)\s*\(/g,"(");
  s=s.replace(/\b[A-Za-z_]\w*\b/g,w=>{if(w in V)return`(${V[w]})`;if(w in ID)return"0";if(w in decl){const v=ev(decl[w],V,dep+1);if(v===null){bad=true;return"0"}return`(${v})`}
   if(w==="width"||w==="height"){const v=ev(w==="width"?"imageWidth":"imageHeight",V,dep+1);return`(${v===null?(w==="width"?176:166):v})`}bad=true;return"0"});
  if(bad||!/^[\d\s+\-*/%().]+$/.test(s)||!/\d/.test(s))return null;try{const v=Function(`return (${s})`)();return Number.isFinite(v)?Math.trunc(v):null}catch(e){return null}};
 const TEXC={};for(const m of all.matchAll(/ResourceLocation\s+(\w+)\s*=\s*[^;]*?"([^"]+)"\s*\)\s*;/g))TEXC[m[1]]=m[2].replace(/^[^:]*:/,"");
 const texName=p=>p.replace(/^.*?textures\/gui\//,"").replace(/\.png$/i,"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
 const id=(t,d)=>(String(t).toLowerCase().replace(/\W+/g,"_").replace(/^_|_$/g,"").slice(0,24)||d)+"_"+(++n);
 const add=(e,r)=>el.push({e,r});
 const txt=(e,V)=>{if(e==null)return null;e=e.trim();let m;if(m=/^Component\.(literal|translatable)\s*\(\s*"([^"]*)"\s*\)$/.exec(e))return m[1]==="translatable"?((ctx.lang&&ctx.lang[m[2]])||m[2].split(".").pop().replace(/_/g," ")):m[2];
  if(m=/^Component\.literal\s*\(\s*"([^"]*)"\s*\+\s*(.+)\)$/.exec(e)){const v=ev(m[2],V);return v===null?m[1]:m[1]+v}if(m=/^"([^"]*)"$/.exec(e))return m[1];if(/^Component\.empty\(\)$/.test(e))return"";return null};
 const evs=t=>{const k=[];if(/onClose\s*\(/.test(t))k.push({action:"close_gui",target:"",cond:""});let m=/setScreen\(\s*new\s+(\w+)\(/.exec(t);if(m)k.push({action:"open_gui",target:m[1],cond:""});
  m=/sendCommand\(\s*"([^"]*)"/.exec(t);if(m)k.push({action:"run_command",target:m[1],cond:""});m=/sendSystemMessage\(\s*Component\.literal\(\s*"([^"]*)"/.exec(t);if(m)k.push({action:"send_message",target:m[1],cond:""});
  if(!k.length&&t.includes(";"))k.push({action:"custom_java_hook",target:t.replace(/\s+/g," ").slice(0,80),cond:""});return k.length?{click:k}:{}};
 const num=(a,V,c)=>{const v=a.map(q=>ev(q,V));if(v.includes(null)){skipped++;notes.push("coordinate non valutabili: "+a.join(", ").slice(0,60));return null}return v};
 function grab(s,V){
  for(const c of calls(s,/\bButton\.builder\s*\(/)){const ch=s.slice(c.end+1,stmtEnd(s,c.end+1)),b=calls(ch,/\.bounds\s*\(/)[0],p=calls(ch,/\.pos\s*\(/)[0],z=calls(ch,/\.size\s*\(/)[0];let v;
   if(b)v=num(b.args,V);else if(p&&z){const a=num(p.args,V),d=num(z.args,V);v=a&&d?[...a,...d]:null}else{skipped++;notes.push("Button senza bounds/pos+size");continue}if(!v)continue;const t=txt(c.args[0],V);add({type:"button",id:id(t,"button"),text:t??"",x:v[0],y:v[1],width:v[2],height:v[3],events:evs(c.args[1]||"")},4)}
  for(const c of calls(s,/\bnew\s+Button\s*\(/)){const v=num(c.args.slice(0,4),V);if(!v)continue;const t=txt(c.args[4],V);add({type:"button",id:id(t,"button"),text:t??"",x:v[0],y:v[1],width:v[2],height:v[3],events:evs(c.args[5]||"")},4)}
  for(const c of calls(s,/\bnew\s+ImageButton\s*\(/)){const tk=c.args.find(q=>TEXC[q.trim()]),v=num(c.args.slice(0,4),V);if(!tk||!v)continue;add({type:"image",id:id("imagebutton","image"),x:v[0],y:v[1],width:v[2],height:v[3],texture:texName(TEXC[tk.trim()])},4)}
  for(const c of calls(s,/\bnew\s+EditBox\s*\(/)){const v=num(c.args.slice(1,5),V);if(v)add({type:"input",id:id("input","input"),x:v[0],y:v[1],width:v[2],height:v[3]},4)}
  for(const c of calls(s,/\bnew\s+Checkbox\s*\(/)){const v=num(c.args.slice(0,4),V);if(v){const t=txt(c.args[4],V)??"";add({type:"checkbox",id:id(t,"checkbox"),text:t,x:v[0],y:v[1],width:v[2],height:v[3],checked:/true/.test(c.args[5]||"")},4)}}
  for(const c of calls(s,/\bCheckbox\.builder\s*\(/)){const ch=s.slice(c.end+1,stmtEnd(s,c.end+1)),p=calls(ch,/\.pos\s*\(/)[0],v=p&&num(p.args,V);if(v){const t=txt(c.args[0],V)??"";add({type:"checkbox",id:id(t,"checkbox"),text:t,x:v[0],y:v[1],width:70,height:17,checked:/selected\(\s*true/.test(ch)},4)}}
  for(const c of calls(s,/\bblit\s*\(/)){const a=c.args,tn=TEXC[a[0]]||((/"([^"]*textures\/gui\/[^"]+)"/.exec(a[0])||[])[1]);if(!tn)continue;const k=a.length===11?[3,4]:[5,6],v=num([a[1],a[2],a[k[0]],a[k[1]]],V);if(v)add({type:"image",id:id(texName(tn),"image"),x:v[0],y:v[1],width:v[2],height:v[3],texture:texName(tn)},0)}
  for(const c of calls(s,/\bfill\s*\(/)){const a=c.args;if(a.length!==5)continue;const v=a.slice(0,4).map(q=>ev(q,V)),cm=/^0x([0-9a-fA-F]{6,8})\b/.exec(a[4].trim());if(v.includes(null)||!cm){skipped++;continue}const hx=cm[1].padStart(8,"F");if(hx.slice(0,2)==="00")continue;add({type:"panel",id:id("fill","panel"),bg:true,color:"#"+hx.slice(2).toLowerCase(),x:v[0],y:v[1],width:v[2]-v[0],height:v[3]-v[1],children:[]},1)}
  for(const c of calls(s,/\bdraw(?:Centered)?String\s*\(/)){const a=c.args;if(a.length<5)continue;const t=/^(this\.)?title$/.test(a[1].trim())?"Title":txt(a[1],V),x0=ev(a[2],V),y=ev(a[3],V);if(t===null||x0===null||y===null){skipped++;notes.push("testo non valutabile: "+a[1].slice(0,30));continue}
   const w=Math.max(9,t.length*6),x=/Centered/.test(c.m[0])?x0-Math.floor(w/2):x0,cm=/^0x([0-9a-fA-F]{6,8})\b/.exec(a[4].trim());add({type:"label",id:id(t,"label"),text:t,x,y,width:w,height:9,color:cm?"#"+cm[1].slice(-6).toLowerCase():"#404040"},5)}
  for(const c of calls(s,/\bnew\s+(?:Slot|SlotItemHandler)\s*\(/)){const a=c.args,v=num([a[2],a[3]],V);if(!v)continue;const i=ev(a[1],V);slots.push({t:/inv|player/i.test(a[0])?"player":"container",i:i===null?slots.length:i,x:v[0]-1,y:v[1]-1})}}
 function run(s,V){const fm=/\bfor\s*\(\s*int\s+(\w+)\s*=\s*([^;]+);\s*\1\s*(<=?)\s*([^;]+?)\s*;\s*(?:\1\+\+|\+\+\1|\1\s*\+=\s*1)\s*\)\s*/.exec(s);if(!fm){grab(s,V);return}
  const bs=fm.index+fm[0].length,be=bodyEnd(s,bs),a=ev(fm[2],V),b=ev(fm[4],V);run(s.slice(0,fm.index),V);
  if(a===null||b===null||b-a>80){skipped++;notes.push("ciclo non valutabile: "+fm[0].trim().slice(0,50))}else for(let k=a;k<b+(fm[3]==="<="?1:0);k++)run(s.slice(bs,be),{...V,[fm[1]]:k});run(s.slice(be),V)}
 run(all,{});
 const mk=(s,ox,oy,t)=>({type:"slot",id:id("slot","slot"),x:s.x-ox,y:s.y-oy,width:18,height:18,slotIndex:s.i,slotType:t});
 slots.filter(s=>s.t!=="player").forEach(s=>add(mk(s,0,0,"container"),2));
 const grp=(L,nm)=>{if(!L.length)return;const ox=Math.min(...L.map(s=>s.x)),oy=Math.min(...L.map(s=>s.y));add({type:"panel",id:id(nm,"panel"),bg:false,x:ox,y:oy,width:Math.max(...L.map(s=>s.x))-ox+18,height:Math.max(...L.map(s=>s.y))-oy+18,children:L.map(s=>mk(s,ox,oy,"player"))},2)};
 const pl=slots.filter(s=>s.t==="player");grp(pl.filter(s=>s.i>=9),"inventory");grp(pl.filter(s=>s.i<9),"hotbar");
 const w=ev("imageWidth"),h=ev("imageHeight"),out=el.sort((a,b)=>a.r-b.r).map(o=>o.e);
 return{elements:out,screen:{width:w||176,height:h||166},found:out.length,skipped,notes:notes.slice(0,6),src:out.length?"":src.slice(0,12000)}}
module.exports={scanMod,parseScreen};
