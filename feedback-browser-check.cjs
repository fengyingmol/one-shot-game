const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const tab=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page');
 const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout')):setTimeout(poll,50);poll()})`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async selector=>tap(await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const fireAt=async index=>tap(await run(`(()=>{const e=demo.state.enemies[${index}],r=game.getBoundingClientRect();return{x:r.x+e.x/demo.stage.W*r.width,y:r.y+e.y/demo.stage.H*r.height}})()`));
 const capture=async name=>{await run('demo.render()');const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(shot.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');
  // Freeze only the QA renderer; use real pointer input, then deterministic game steps.
  await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,80))');
  await run('window.__shadowDraws=[];window.__newShadowGradients=0;const oldGradient=CanvasRenderingContext2D.prototype.createRadialGradient;CanvasRenderingContext2D.prototype.createRadialGradient=function(...a){window.__newShadowGradients++;return oldGradient.apply(this,a)};const oldShadowDraw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(a[0].tagName==="CANVAS"&&a[0].width===256&&a[0].height===128)__shadowDraws.push({args:a.slice(1),alpha:this.globalAlpha});return oldShadowDraw.apply(this,a)}');
  await run('window.__spriteDraws=[];const saved=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(args[0].src)window.__spriteDraws.push({src:args[0].src,args:args.slice(1),width:args[0].naturalWidth,height:args[0].naturalHeight});return saved.apply(this,args)}');
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});
   await run('demo.load(11);window.__spriteDraws=[];demo.render()');
   assert.equal(await run('__spriteDraws.filter(d=>d.src.includes("toy-normal-sculpt-v2")).length'),4);
   assert.equal(await run('__spriteDraws.some(d=>d.src.includes("toy-monster.webp"))'),false);
   assert.equal(await run('__spriteDraws.filter(d=>d.src.includes("toy-normal-sculpt-v2")).every(d=>Math.abs(d.args[6]/d.args[2]-d.args[7]/d.args[3])<1e-9&&Math.max(d.args[6],d.args[7])===36)'),true);
   assert.equal(await run('(()=>{const before=JSON.stringify(demo.state.enemies),e=demo.state.enemies[0],poses=Array.from({length:120},(_,n)=>demo.enemyIdlePose(e,n*.05));return JSON.stringify(demo.state.enemies)===before&&poses.some(p=>Math.abs(p.angle)>.06)&&poses.some(p=>p.lift<-1.7)&&poses.every(p=>Math.abs(p.angle)<.1&&p.lift>=-1.8&&p.lift<=0&&p.sx>.92&&p.sx<1.08&&p.sy>.92&&p.sy<1.08)})()'),true,'Breathing / cheeky tilt / hop are small pure visual poses');
   await capture(`demo-normal-pilot-${width}.png`);
   await run('demo.step(.6)');await capture(`demo-normal-idle-${width}.png`);

   const normalHold=await run('(()=>{const r=game.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()'),normalPose=await run('demo.enemyIdlePose(demo.state.enemies[0],1)'),normalPhysics=await run('JSON.stringify(demo.state.enemies)');
   await send('Input.dispatchMouseEvent',{type:'mousePressed',...normalHold,button:'left',clickCount:1});assert.deepEqual(await run('demo.enemyIdlePose(demo.state.enemies[0],1)'),normalPose,'Normal idle keeps full motion while aiming');await capture(`demo-normal-aim-a-${width}.png`);
   const heldNormalA=await run('demo.enemyIdlePose(demo.state.enemies[0])');await run('for(let n=0;n<30;n++)demo.step(.03)');assert.notDeepEqual(await run('demo.enemyIdlePose(demo.state.enemies[0])'),heldNormalA,'Normal pose advances while held');await capture(`demo-normal-aim-b-${width}.png`);assert.equal(await run('JSON.stringify(demo.state.enemies)'),normalPhysics);
   await run('game.dispatchEvent(new PointerEvent("pointercancel"))');await send('Input.dispatchMouseEvent',{type:'mouseReleased',...normalHold,button:'left',clickCount:1});assert.equal(await run('demo.state.shotsUsed'),0);
   await run('demo.load(2);window.__spriteDraws=[];demo.render()');
   assert.equal(await run('(()=>{const e=demo.state.enemies[0],before=JSON.stringify(demo.state),poses=Array.from({length:160},(_,n)=>demo.enemyIdlePose(e,n*.05)),bare={...e,hp:1};return before===JSON.stringify(demo.state)&&poses.some(p=>p.angle>.06)&&poses.some(p=>p.angle<-.06)&&poses.some(p=>p.lift<-1.35)&&poses.every(p=>Math.abs(p.angle)<.1&&p.lift>=-1.4&&p.lift<=0&&p.sx===1&&p.sy===1)&&JSON.stringify(demo.enemyIdlePose(e,2))===JSON.stringify(demo.enemyIdlePose(bare,2))&&JSON.stringify(demo.enemyIdlePose({...e,alive:false},2))===JSON.stringify({angle:0,lift:0,sx:1,sy:1})})()'),true,'Whole toy gently rocks and bobs, keeps rigid proportions, same bare pose and immutable physics');
   await capture(`demo-windup-idle-a-${width}.png`);const idleA=await run('demo.enemyIdlePose(demo.state.enemies[0])');
   await run('for(let n=0;n<60;n++)demo.step(.03)');await capture(`demo-windup-idle-b-${width}.png`);
   const idleB=await run('demo.enemyIdlePose(demo.state.enemies[0])');assert.ok(Math.abs(idleA.angle-idleB.angle)>.06,'Real stepped frames visibly change tilt');
   await run('for(let n=0;n<78;n++)demo.step(.03)');await capture(`demo-windup-idle-hop-${width}.png`);assert.ok(await run('demo.enemyIdlePose(demo.state.enemies[0]).lift<-1.35'));
   const heldPoint=await run('(()=>{const r=game.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()'),calm=await run('demo.enemyIdlePose(demo.state.enemies[0],1)');
   await send('Input.dispatchMouseEvent',{type:'mousePressed',...heldPoint,button:'left',clickCount:1});
   const held=await run('demo.enemyIdlePose(demo.state.enemies[0],1)');assert.ok(Math.abs(held.angle-calm.angle)<1e-9,'Actual pointer hold keeps full idle amplitude');await capture(`demo-windup-aim-${width}.png`);const heldHelmetA=await run('demo.enemyIdlePose(demo.state.enemies[0])'),heldHelmetState=await run('JSON.stringify(demo.state.enemies)');await run('for(let n=0;n<30;n++)demo.step(.03)');assert.notDeepEqual(await run('demo.enemyIdlePose(demo.state.enemies[0])'),heldHelmetA);assert.equal(await run('JSON.stringify(demo.state.enemies)'),heldHelmetState);
   await run('game.dispatchEvent(new PointerEvent("pointercancel"))');await send('Input.dispatchMouseEvent',{type:'mouseReleased',...heldPoint,button:'left',clickCount:1});assert.equal(await run('demo.state.shotsUsed'),0);
   await run('demo.load(2);window.__spriteDraws=[];demo.render()');
   assert.equal(await run('__newShadowGradients'),0,'Soft shadow masks are reused, not rebuilt per frame/level');
   assert.ok(await run('__shadowDraws.length>=4&&__shadowDraws.every(d=>d.args.every(Number.isFinite)&&d.alpha>=0&&d.alpha<=1)'));
   assert.equal(await run('__spriteDraws.filter(d=>d.src.includes("toy-windup-armored-v1")).length'),1);
   assert.equal(await run('(()=>{const d=__spriteDraws.find(d=>d.src.includes("toy-windup-armored-v1")),a=d.args,k=a[2]/d.width;return Math.abs(k-a[3]/d.height)<1e-9&&Math.abs(a[0]+575*k)<1e-9&&Math.abs(a[1]+664*k)<1e-9&&Math.abs(k*920-36)<1e-9&&demo.state.enemies[0].r===18})()'),true,'Whole wind-up toy uses the original body diameter and uniform scale');
   assert.equal(await run('__spriteDraws.some(d=>d.src.includes("toy-helmet-v3")||d.src.includes("toy-monster.webp"))'),false);
   await capture(`demo-integrated-helmet-${width}.png`);
   await run('demo.load(5);window.__spriteDraws=[];demo.render()');
   assert.equal(await run('__spriteDraws.filter(d=>d.src.includes("toy-shield-peek-v1")).length'),2);
   assert.equal(await run('__spriteDraws.some(d=>d.src.includes("toy-shield-v3")||d.src.includes("toy-monster.webp"))'),false);
   assert.equal(await run('(()=>{const ds=__spriteDraws.filter(d=>d.src.includes("toy-shield-peek-v1")),a=ds[1].args,k=a[6]/a[2],e=demo.state.enemies[0],s=demo.shieldGeometry(e);return ds.length===2&&a[0]===887&&a[1]===0&&a[2]===887&&a[3]===887&&Math.abs(k-a[7]/a[3])<1e-9&&Math.abs(a[4]+438*k)<1e-9&&Math.abs(a[5]+453*k-(s.y-e.y))<1e-9&&Math.abs(354*k-24)<1e-9&&Math.abs(s.y-e.y-8.05)<1e-9})()'),true,'Fixed shield-and-hands layer matches raised circular collider');
   await capture(`demo-integrated-shield-${width}.png`);
   const shieldState=await run('JSON.stringify(demo.state.enemies)'),shieldFace=await run('JSON.stringify(demo.shieldGeometry(demo.state.enemies[0]))');
   assert.ok(await run('(()=>{const e=demo.state.enemies[0],before=JSON.stringify(demo.state),p=Array.from({length:320},(_,i)=>demo.shieldPeekPose(e,i*.025));return before===JSON.stringify(demo.state)&&p.some(v=>v.x===-12.5)&&p.some(v=>v.x===12.5)&&p.some(v=>v.x===0)&&p.every(v=>Math.abs(v.x)<=12.5)})()'),'Peek cycle has left, hiding, right and rest without mutating physics');
   const fixedShield=await run('JSON.stringify(__spriteDraws.filter(d=>d.src.includes("toy-shield-peek-v1")).at(-1).args)');
   await run('for(let n=0;n<48;n++)demo.step(.03);window.__spriteDraws=[]');await capture(`demo-shield-peek-left-${width}.png`);
   assert.equal(await run('demo.shieldPeekPose(demo.state.enemies[0]).x'),-12.5);
   assert.equal(await run('JSON.stringify(__spriteDraws.filter(d=>d.src.includes("toy-shield-peek-v1")).at(-1).args)'),fixedShield,'Shield and both hands do not move with the peeking body');
   await run('for(let n=0;n<90;n++)demo.step(.03);window.__spriteDraws=[]');await capture(`demo-shield-peek-right-${width}.png`);
   assert.equal(await run('demo.shieldPeekPose(demo.state.enemies[0]).x'),12.5);
   assert.equal(await run('JSON.stringify(__spriteDraws.filter(d=>d.src.includes("toy-shield-peek-v1")).at(-1).args)'),fixedShield);
   assert.equal(await run('JSON.stringify(demo.state.enemies)'),shieldState);assert.equal(await run('JSON.stringify(demo.shieldGeometry(demo.state.enemies[0]))'),shieldFace);
   const p=await run('(()=>{const r=game.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');
   await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});assert.equal(await run('demo.shieldPeekPose(demo.state.enemies[0]).x'),12.5,'Keep peeking while aiming');await capture(`demo-shield-aim-a-${width}.png`);await run('for(let n=0;n<40;n++)demo.step(.03);window.__spriteDraws=[]');await capture(`demo-shield-aim-b-${width}.png`);assert.equal(await run('demo.shieldPeekPose(demo.state.enemies[0]).x'),0,'Peek cycle keeps advancing while held');assert.equal(await run('JSON.stringify(demo.state.enemies)'),shieldState);assert.equal(await run('JSON.stringify(demo.shieldGeometry(demo.state.enemies[0]))'),shieldFace);assert.equal(await run('JSON.stringify(__spriteDraws.filter(d=>d.src.includes("toy-shield-peek-v1")).at(-1).args)'),fixedShield);
   await run('game.dispatchEvent(new PointerEvent("pointercancel"))');await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});assert.equal(await run('demo.state.shotsUsed'),0);
   await fireAt(0);await run('for(let n=0;n<200&&!demo.state.bounces;n++)demo.step(.008)');
   assert.ok(await run('demo.state.bounces>0'));assert.equal(await run('demo.state.kills'),0);
   await run('demo.load(0)');await fireAt(0);
   await run('for(let n=0;n<500&&!demo.state.kills;n++)demo.step(.008)');
   assert.equal(await run('demo.state.kills'),1);assert.equal(await run('Number.isFinite(demo.state.enemies.find(e=>!e.alive).defeatedAt)'),true);
   await run('demo.step(.045)');await capture(`demo-feedback-hit-${width}.png`);
   await run('demo.load(2)');await fireAt(0);
   await run('for(let n=0;n<500&&!demo.state.helmetBreaks;n++)demo.step(.008)');
   assert.equal(await run('(()=>{const e=demo.state.enemies[0],a=demo.enemyIdlePose(e,1);return Math.abs(a.angle)<=.012&&Math.abs(a.lift)<=.168})()'),true,'Flight reduces idle motion to 12 percent');
   assert.equal(await run('demo.state.enemies[0].hp'),1);assert.equal(await run('demo.state.kills'),0);
   assert.equal(await run('demo.state.enemies[0].surprisedUntil>demo.state.time'),true);
   await run('demo.step(.13);window.__spriteDraws=[]');await capture(`demo-feedback-helmet-${width}.png`);
   assert.equal(await run('__spriteDraws.filter(d=>d.src.includes("toy-windup-bare-v1")).length'),1);
   assert.equal(await run('__spriteDraws.filter(d=>d.src.includes("toy-windup-cover-v1")).length'),1);
   assert.equal(await run('__spriteDraws.some(d=>d.src.includes("toy-windup-armored-v1")||d.src.includes("toy-normal-sculpt-v2"))'),false,'Broken armor reveals the matching toy body, not the old organic monster');
   assert.equal(await run('(()=>{const d=__spriteDraws.find(d=>d.src.includes("toy-windup-bare-v1")),a=d.args,k=a[2]/d.width;return Math.abs(k-a[3]/d.height)<1e-9&&Math.abs(a[0]+580*k)<1e-9&&Math.abs(a[1]+674*k)<1e-9&&Math.abs(k*905-36)<1e-9})()'),true,'Bare body retains its original round size and anchor');
   await run('for(let n=0;n<80&&!demo.state.helmets[0]?.bounces;n++)demo.step(.008)');
   assert.equal(await run('demo.state.helmets[0]?.bounces'),1);assert.equal(await run('demo.state.helmets[0].vy<0'),true);
   await capture(`demo-feedback-landing-${width}.png`);
   await click('#retry');assert.equal(await run('demo.state.helmets.length'),0);assert.equal(await run('demo.state.enemies[0].hp'),2);
   await run('demo.load(6)');await fireAt(0);await run('for(let n=0;n<500&&!demo.state.bombExplosions;n++)demo.step(.008)');
   assert.equal(await run('demo.state.kills'),4);assert.equal(await run('demo.state.hitCount'),4);assert.equal(await run('demo.state.rings.some(r=>r.blast)'),true);
   assert.equal(await run('demo.state.particles.some(p=>p.toy)'),true);assert.ok(await run('demo.state.particles.length<=160'));
   await run('demo.step(.07)');await capture(`demo-feedback-chain-${width}.png`);
   assert.equal(await run('(()=>{const r=game.getBoundingClientRect();return Math.abs(r.width/r.height-demo.stage.W/demo.stage.H)<.001&&document.documentElement.scrollWidth<=innerWidth})()'),true);
   await run('for(let n=0;n<150;n++)demo.step(.008)');assert.equal(await run('demo.state.helmets.length+demo.state.particles.length+demo.state.rings.length'),0);
  }
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});
   await run('demo.load(demo.levels.findIndex(l=>l.name==="效率测试 · 四区回廊"));window.__wallBefore=JSON.stringify(demo.state.walls);window.__spriteDraws=[];demo.render()');
   assert.equal(await run('JSON.stringify(demo.state.walls)===__wallBefore'),true,'Drawing raised faces must not move or mutate colliders');
   for(const type of ['obstacle','brick','iron']){
    const valid=await run(`(()=>{const w=demo.state.walls.find(w=>w.type===${JSON.stringify(type)}),v=demo.terrainVolume(w),file={obstacle:"toy-wood-satin-v2.webp",brick:"toy-limestone-v1.webp",iron:"toy-basalt-v1.webp"}[w.type],d=__spriteDraws.find(d=>d.src.endsWith(file)),a=d?.args;return !!a&&v.rise>0&&v.side>0&&v.rise<=Math.min(w.w,w.h)*.65&&Math.abs(a[0]-(w.x-v.side))<1e-8&&Math.abs(a[1]-(w.y-v.rise))<1e-8&&Math.abs(a[2]/d.width-a[3]/d.height)<1e-8})()`);
    assert.equal(valid,true,type+' top uses a uniformly scaled texture at its visual elevation');
   }
   await capture(`demo-volume-${width}.png`);
   assert.equal(await run('(()=>{const r=game.getBoundingClientRect();return Math.abs(r.width/r.height-demo.stage.W/demo.stage.H)<.001&&document.documentElement.scrollWidth<=innerWidth})()'),true);
   await run('demo.load(demo.levels.findIndex(l=>l.name==="效率测试 · 分弹拆局"));window.__spriteDraws=[];demo.render()');
   assert.equal(await run('(()=>{const e=demo.state.enemies.find(e=>e.type==="shield"),shield=__spriteDraws.findIndex(d=>d.src.includes("toy-shield-peek-v1")),s=demo.shieldGeometry(e),depth=s.y+s.r;return shield>=0&&demo.state.walls.filter(w=>w.type==="brick").every(w=>{const v=demo.terrainVolume(w),index=__spriteDraws.findIndex(d=>d.src.includes("toy-limestone-v1.webp")&&Math.abs(d.args[0]-(w.x-v.side))<1e-8&&Math.abs(d.args[1]-(w.y-v.rise))<1e-8);return index>=0&&(w.y+w.h>depth?index>shield:index<shield)})})()'),true,'Occlusion follows shield geometry and actual wall depths');
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await run('demo.load(11)');
  assert.equal(await run('JSON.stringify(demo.enemyIdlePose(demo.state.enemies[0],123))'),JSON.stringify({angle:0,lift:0,sx:1,sy:1}));
  await run('demo.load(2)');assert.equal(await run('JSON.stringify(demo.enemyIdlePose(demo.state.enemies[0],123))'),JSON.stringify({angle:0,lift:0,sx:1,sy:1}));
  await run('demo.load(5)');assert.equal(await run('JSON.stringify(demo.shieldPeekPose(demo.state.enemies[0],1))===JSON.stringify(demo.shieldPeekPose(demo.state.enemies[0],100))'),true,'Reduced motion uses a still peeking pose');
  await run('demo.load(6)');await fireAt(0);await run('for(let n=0;n<500&&!demo.state.kills;n++)demo.step(.008);demo.render()');
  assert.equal(await run('demo.state.particles.some(p=>p.toy)'),false);assert.equal(errors.length,0);
  console.log('PASS: 390/320px normal/helmet/shield motion continues during real pointer aiming, immutable colliders and cancel without firing, normal sculpt sprite and pure idle breathing/tilt/hop, raised terrain, unchanged colliders, depth ordering, cached shadows, integrated helmet/shield, pointer shots, death/helmet/chain feedback, retry, reduced-motion and no runtime errors');
 }finally{await send('Emulation.setEmulatedMedia',{features:[]});await run('if(window.gameAudio?.state.music||window.gameAudio?.state.sfx)document.getElementById("sound").click()');await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
