// Smoke test of the real app: npm run test:app  (Linux: xvfb-run -a npm run test:app)
const {app}=require("electron");const errs=[];const os=require("os"),fs=require("fs"),path=require("path");app.setPath("userData",fs.mkdtempSync(path.join(os.tmpdir(),"guibuilder-")));
const TEST=`(async()=>{const o={},wait=ms=>new Promise(r=>setTimeout(r,ms)),S=[
 ["add-all",()=>{for(const t of Object.keys(D))add(t)}],["grids",()=>{add("panel",[9,3]);add("panel",[9,1])}],
 ["canvas",()=>{o.nodes=document.querySelectorAll("#gui .n").length}],["gen",()=>{o.java=gen().length}],["genExtra",()=>{o.extra=genExtra().length}],
 ["events",()=>{sel=P.elements[0].id;cur().e.events={click:[{action:"set_variable",target:"a=1",cond:""},{action:"run_command",target:"/say hi",cond:"a>=1"}],tick:[{action:"change_variable",target:"a+=1",cond:""}]};push();ui()}],
 ["graph",()=>{gopen();o.gn=document.querySelectorAll("#gv .gn").length;gpal({clientX:50,clientY:50},null);o.pal=document.querySelectorAll("#gp .gpi").length;$("gv").style.display="none";$("gp").style.display="none"}],
 ["flow",()=>{flow();$("fl").style.display="none"}],["settings",()=>{openSettings();$("st").style.display="none"}],
 ["texmaker",()=>{texMaker();tmSave();$("tm").style.display="none"}],["pixel",()=>{pxOpen();$("pe").style.display="none"}],
 ["preview",async()=>{togglePrev();await wait(300);togglePrev()}],
 ["draw",()=>{drawStart();const ov=$("pxv"),r=ov.getBoundingClientRect();PX.tool="pen";pxDo({clientX:r.left+10,clientY:r.top+10},true);drawEnd(true);o.layer=!!(P.assets&&P.assets.draw_layer)}],
 ["menu",()=>{P.container=true;o.menu=genExtra().map(f=>f.name);P.container=false}],
 ["neo",()=>{P.loader="neoforge121";o.neo=gen().includes("fromNamespaceAndPath");P.loader="forge"}],
 ["overlay",()=>{setOverlay("title");add("button");o.ov=gen().includes("ScreenEvent.Init.Post");setOverlay("inventory");add("button");o.ov2=gen().includes("(screen.width - 176) / 2");setOverlay("");helpOpen();$("st").style.display="none"}],["colors",()=>{add("label");cpPick("#3366cc");colorsRender();const ap=document.querySelector("#colp [data-ap]");ap.click();o.lblColor=cur().e.color;P.customTheme=themeFrom("#3366cc");THEMES.custom=P.customTheme;P.theme="custom";ui();o.themeBtn=gen().length>0;P.theme="vanilla";switchTab("right","p-col");switchTab("right","p-el")}],["tabs",()=>{document.querySelectorAll(".mb").forEach(b=>b.click());document.body.click();o.menus=document.querySelectorAll(".menu").length}],["research",()=>{tplNew("chest3");o.chest=P.screen.height;add("button");cur().e.x=300;cur().e.y=4;o.lint=lint().length;probRender();const l=[...cmds()];cmdkOpen();$("cki").value="ch";ckRender("ch");o.ck=CK.L.length;ckRun(0);o.tpl=P.screen.id;setMulti=0;multi=new Set(P.elements.slice(0,2).map(e=>e.id));alignSel("c");groupSel();ungroupSel();zSel(1);distSel("h");tplOpen();$("st").style.display="none";$("gui").dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,clientX:300,clientY:300}));o.ctx=$("ctx").style.display;$("ctx").style.display="none";document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true,bubbles:true}));o.ckOpen=$("cmdk").style.display;$("cmdk").style.display="none"}],["launcher",async()=>{launchOpen();o.cards=document.querySelectorAll("#launch .lc").length;launchPick("ov:title");o.ovTitle=P.overlay&&P.overlay.target;add("button");const b=cur().e;cur().e.text="My screen";cur().e.x=60;cur().e.y=204;
 addScreen("blank");add("label");cur().e.text="Screen 2";const l2=P.screens[0];switchScreen(0);b.events={click:[{action:"open_gui",target:clsOf(1)}]};push();ui();
 o.tabs=document.querySelectorAll("#stabs .stab").length;const f=genAllFiles();o.files=f.map(x=>x.path.split("/").pop());
 togglePrev();await wait(100);previewOpen(1);o.inPrev=P.cur;previewBack();o.back=P.cur;togglePrev();o.final=P.cur;o.lintNav=lint().filter(p=>/not found/.test(p.msg)).length;
 launchOpen();$("launch").style.display="none"}],["undo",()=>{undo();redo();o.json=JSON.stringify(P).length}]];
 o.fail=[];for(const[n,f]of S){try{await f()}catch(e){o.fail.push(n+": "+e.message+" | "+String(e.stack).split("\\n").slice(1,3).join(" <- "))}}
 return o})()`;
app.on("browser-window-created",(_,w)=>{const c=w.webContents;
 c.on("console-message",(e,l,m,line,src)=>{if(l>=2)errs.push(m+" @"+String(src).split("/").pop()+":"+line)});
 c.on("render-process-gone",(e,d)=>errs.push("gone "+d.reason));
 c.on("did-finish-load",async()=>{try{console.log("RESULT",JSON.stringify(await c.executeJavaScript(TEST)))}catch(e){errs.push("exec: "+e.message)}console.log("ERRORS",JSON.stringify(errs,null,1));app.exit(errs.length?1:0)})});
require("../main.js");
setTimeout(()=>{console.log("TIMEOUT",JSON.stringify(errs));app.exit(2)},40000);
