const {test}=require("node:test"),assert=require("node:assert"),fs=require("fs"),os=require("os"),path=require("path");const {scanMod}=require("../scan.js");
test("scan mod: id, item, blocks, sounds, screen, menu, GUI texture",()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),"mod-")),w=(p,t)=>{const f=path.join(d,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
 w("src/main/java/com/ex/MyMod.java",'package com.ex;\n@Mod("mymod")\npublic class MyMod { static{ ITEMS.register("ruby", ()->null); BLOCKS.register("ruby_block", ()->null); SOUNDS.register("ding", ()->null); } }');
 w("src/main/java/com/ex/gui/ShopScreen.java","package com.ex.gui;\npublic class ShopScreen extends AbstractContainerScreen<ShopMenu> { public ShopScreen(int a, String b) {} }");
 w("src/main/java/com/ex/gui/ShopMenu.java","package com.ex.gui;\npublic class ShopMenu extends AbstractContainerMenu {}");
 const png=Buffer.alloc(32);png.write("\x89PNG",0,"latin1");png.writeUInt32BE(24,16);png.writeUInt32BE(12,20);w("src/main/resources/assets/mymod/textures/gui/Panel Big.png",png);
 const r=scanMod(d);assert.ok(r.ok);assert.equal(r.modId,"mymod");assert.equal(r.pkg,"com.ex");assert.deepEqual(r.items,["ruby"]);assert.deepEqual(r.blocks,["ruby_block"]);assert.deepEqual(r.sounds,["ding"]);
 assert.equal(r.screens[0].cls,"ShopScreen");assert.equal(r.screens[0].ctor,"int a, String b");assert.equal(r.menus[0].cls,"ShopMenu");assert.deepEqual([r.textures[0].name,r.textures[0].dim],["panel_big",[24,12]]);
 assert.equal(scanMod(path.join(d,"nope")).ok,false);fs.rmSync(d,{recursive:true})});

const {parseScreen}=require("../scan.js");
test("import screen: expressions, loops, texture, lang, slot, events",()=>{const src=`public class ShopScreen extends AbstractContainerScreen<ShopMenu> {
 private static final ResourceLocation TEXTURE = new ResourceLocation(MyMod.MOD_ID, "textures/gui/shop_bg.png");
 private static final int W = 200;
 public ShopScreen(ShopMenu m, Inventory inv, Component t) { super(m, inv, t); this.imageWidth = W; this.imageHeight = 180; }
 @Override protected void init() { super.init(); int bx = (this.width - this.imageWidth) / 2; int by = (this.height - this.imageHeight) / 2;
  for (int i = 0; i < 3; i++) { addRenderableWidget(Button.builder(Component.literal("Item " + i), b -> { this.minecraft.player.connection.sendCommand("give @p diamond"); }).bounds(bx + 10, by + 20 + i * 24, 80, 20).build()); }
  addRenderableWidget(Button.builder(Component.translatable("gui.shop.close"), b -> this.onClose()).bounds(this.width / 2 - 30, this.height - 30, 60, 20).build());
  new EditBox(this.font, bx + 10, by + 100, 80, 14, Component.empty()); }
 @Override protected void renderBg(GuiGraphics g, float pt, int mx, int my) { g.blit(TEXTURE, this.leftPos, this.topPos, 0, 0, this.imageWidth, this.imageHeight); }
 @Override protected void renderLabels(GuiGraphics g, int mx, int my) { g.drawString(this.font, this.title, 8, 6, 0x404040, false); g.drawString(this.font, Component.translatable("gui.shop.name"), 8, 20, 0xFFFFFF, false); g.fill(5, 5, 15, 15, 0xFFFF0000); } }`,
 menu=`for (int r = 0; r < 3; ++r) for (int c = 0; c < 9; ++c) this.addSlot(new Slot(inv, c + r * 9 + 9, 8 + c * 18, 84 + r * 18));
 for (int c = 0; c < 9; ++c) this.addSlot(new Slot(inv, c, 8 + c * 18, 142)); this.addSlot(new Slot(container, 0, 80, 35));`;
 const r=parseScreen(src,menu,{lang:{"gui.shop.close":"Close","gui.shop.name":"Shop"}}),t=x=>r.elements.filter(e=>e.type===x);
 assert.deepEqual(r.screen,{width:200,height:180});assert.equal(r.skipped,0);assert.equal(r.elements[0].type,"image");assert.deepEqual([r.elements[0].texture,r.elements[0].x,r.elements[0].width,r.elements[0].height],["shop_bg",0,200,180]);
 const b=t("button");assert.deepEqual(b.map(x=>x.text),["Item 0","Item 1","Item 2","Close"]);assert.deepEqual(b.map(x=>[x.x,x.y]),[[10,20],[10,44],[10,68],[70,150]]);
 assert.deepEqual(b[0].events.click,[{action:"run_command",target:"give @p diamond",cond:""}]);assert.deepEqual(b[3].events.click,[{action:"close_gui",target:"",cond:""}]);
 assert.deepEqual([t("input")[0].x,t("input")[0].y],[10,100]);assert.deepEqual(t("label").map(x=>x.text),["Title","Shop"]);assert.equal(t("panel")[0].color,"#ff0000");
 const sl=t("slot");assert.deepEqual([sl[0].x,sl[0].y,sl[0].slotType],[79,34,"container"]);const g=t("panel").filter(p=>p.children.length);assert.equal(g.length,2);assert.equal(g[0].children.length,27);assert.equal(g[0].children[0].slotIndex,9);assert.deepEqual([g[0].x,g[0].y],[7,83]);assert.equal(g[1].children.length,9);
 assert.equal(parseScreen("class A extends Screen {}").found,0)});
