const {app,BrowserWindow,ipcMain,dialog,Menu}=require("electron");const fs=require("fs"),path=require("path");
function win(){const w=new BrowserWindow({width:1400,height:900,title:"Minecraft GUI Builder",icon:path.join(__dirname,"build","icon.png"),webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false}});w.loadFile(path.join(__dirname,"renderer","index.html"))}
function emitCmd(w,name){if(!w)return;const wc=w.webContents;
 if(["undo","redo","cut","copy","paste","selectAll"].includes(name))wc.executeJavaScript("(()=>{const a=document.activeElement;return !!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)})()").then(inp=>{if(inp)wc[name]();else wc.send("menu-cmd",name)});else wc.send("menu-cmd",name)}
function buildMenu(){if(process.platform!=="darwin"){Menu.setApplicationMenu(null);return}
 const it=(label,acc,name)=>({label,accelerator:acc,click:(_,w)=>emitCmd(w||BrowserWindow.getFocusedWindow(),name)});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{role:"appMenu"},{label:"File",submenu:[it("New","CmdOrCtrl+N","new"),it("Open…","CmdOrCtrl+O","open"),it("Save","CmdOrCtrl+S","save"),{type:"separator"},{role:"close"}]},
  {label:"Edit",submenu:[it("Undo","CmdOrCtrl+Z","undo"),it("Redo","Shift+CmdOrCtrl+Z","redo"),{type:"separator"},it("Cut","CmdOrCtrl+X","cut"),it("Copy","CmdOrCtrl+C","copy"),it("Paste","CmdOrCtrl+V","paste"),it("Select All","CmdOrCtrl+A","selectAll"),{type:"separator"},it("Duplicate","CmdOrCtrl+D","dup")]},
  {label:"Vista",submenu:[{role:"togglefullscreen"},{role:"toggleDevTools"}]},{role:"windowMenu"}]))}
app.whenReady().then(()=>{buildMenu();win();app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)win()})});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
ipcMain.handle("save",async(_,o)=>{const r=await dialog.showSaveDialog({defaultPath:o.name,filters:[{name:o.ext,extensions:[o.ext]}]});if(r.canceled)return null;
 fs.writeFileSync(r.filePath,o.b64?Buffer.from(o.b64,"base64"):o.text,o.b64?undefined:"utf8");return r.filePath});
ipcMain.handle("open",async()=>{const r=await dialog.showOpenDialog({filters:[{name:"GUI project",extensions:["json"]}],properties:["openFile"]});return r.canceled?null:fs.readFileSync(r.filePaths[0],"utf8")});
ipcMain.handle("mod",async(_,o)=>{if(!/^[a-z][a-z0-9_]*$/.test(o.mod)||!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)*$/.test(o.pkg)||!/^[A-Z]\w*$/.test(o.cls))return null;const r=await dialog.showOpenDialog({title:"Choose destination folder",properties:["openDirectory","createDirectory"]});if(r.canceled)return null;
 const root=path.join(r.filePaths[0],o.mod),w=(p,t)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
 if(o.java)w(`src/main/java/${o.pkg.replace(/\./g,"/")}/${o.cls}.java`,o.java);
 w(`src/main/resources/assets/${o.mod}/textures/gui/.gitkeep`,"");
 w("src/main/resources/pack.mcmeta",JSON.stringify({pack:{description:o.mod+" resources",pack_format:15}},null,2));
 (o.files||[]).forEach(f=>{const p=path.join(root,f.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.b64?Buffer.from(f.b64,"base64"):f.text)});w("gui-project.json",o.json);w("gui/"+o.cls+".gui.json",o.json);return root});

let ctl=null;
ipcMain.handle("ai-stop",()=>{ctl&&ctl.abort()});
ipcMain.handle("ai",async(ev,o)=>{ctl=new AbortController();try{const r=await fetch((o.host||"http://127.0.0.1:11434").replace(/\/$/,"")+"/api/chat",{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({model:o.model,stream:true,format:"json",options:{temperature:0.1,seed:1,num_ctx:o.ctx||16384},messages:[{role:"system",content:o.system},{role:"user",content:o.user}]})});
 if(!r.ok)return{error:`Ollama HTTP ${r.status}: modello "${o.model}" installato? (ollama pull ${o.model})`};
 let buf="",txt="";const dec=new TextDecoder();for await(const c of r.body){buf+=dec.decode(c,{stream:true});let i;while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i);buf=buf.slice(i+1);if(!line.trim())continue;const j=JSON.parse(line);if(j.error)return{error:"Ollama: "+j.error};const t=(j.message&&j.message.content)||"";if(t){txt+=t;ev.sender.send("ai-chunk",t)}}}
 return{text:txt}}catch(e){return{error:e.name==="AbortError"?"Aborted by user":"Ollama not reachable on 127.0.0.1:11434 (run 'ollama serve'): "+e.message}}finally{ctl=null}});
ipcMain.handle("openjava",async()=>{const r=await dialog.showOpenDialog({filters:[{name:"Java",extensions:["java"]}],properties:["openFile"]});return r.canceled?null:fs.readFileSync(r.filePaths[0],"utf8")});
const {scanMod,parseScreen}=require("./scan.js");let LAST=null;
ipcMain.handle("scan",async(_,p)=>{let root=p;if(!root){const r=await dialog.showOpenDialog({title:"Choose mod folder",properties:["openDirectory"]});if(r.canceled)return null;root=r.filePaths[0]}LAST=scanMod(root);return LAST});
ipcMain.handle("startdir",()=>{const c=[...process.argv.slice(app.isPackaged?1:2).filter(a=>!a.startsWith("-")),process.cwd()];return c.find(d=>{try{return fs.existsSync(path.join(d,"src","main","java"))}catch(e){return false}})||null});
ipcMain.handle("write",async(_,o)=>{const root=path.resolve(o.root),L=o.files.map(f=>({...f,abs:path.resolve(root,f.path)}));if(L.some(f=>!f.abs.startsWith(root+path.sep)))return{error:"Invalid path"};
 const ex=L.filter(f=>fs.existsSync(f.abs));if(ex.length){const b=await dialog.showMessageBox({type:"question",buttons:["Overwrite","Cancel"],defaultId:1,message:`${ex.length} files already exist and will be overwritten:\n`+ex.slice(0,6).map(f=>f.path).join("\n")});if(b.response!==0)return null}
 for(const f of L){fs.mkdirSync(path.dirname(f.abs),{recursive:true});fs.writeFileSync(f.abs,f.b64?Buffer.from(f.b64,"base64"):f.text)}return{ok:true,n:L.length}});

ipcMain.handle("importscreen",(_,cls)=>{try{const s=LAST&&LAST.screens.find(x=>x.cls===cls);if(!s)return{error:"Screen not found: re-link the mod"};const mn=s.menu&&LAST.menus.find(x=>x.cls===s.menu);return parseScreen(fs.readFileSync(s.file,"utf8"),mn?fs.readFileSync(mn.file,"utf8"):"",{lang:LAST.lang})}catch(e){return{error:e.message}}});
