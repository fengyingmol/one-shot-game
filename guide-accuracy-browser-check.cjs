const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout')):setTimeout(poll,60);poll()})`);
 const click=async selector=>{const p=await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await tap(p);};
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const shot=async(kind,dt)=>{
  const probe=await run(`(()=>{const snapshot=()=>JSON.stringify({state:demo.state,comparison:demo.comparison,shots:demo.stats.shots,score:scoreHud.textContent,combo:combo.textContent}),before=snapshot(),g=gameGuide.geometry('${kind}');return{g,unchanged:snapshot()===before}})()`),g=probe.g;assert.ok(g&&g.accurate&&g.aimPoint);assert.deepEqual(g.points[0],await run('[demo.stage.origin.x,demo.stage.origin.y]'));if(kind!=='drag')assert.ok(g.bounces>=1);
  assert.equal(probe.unchanged,true,'Tracing does not mutate anything, measured atomically without animation-frame races');
  const stock=await run('demo.state.inventory.normal');
  const p=await run(`(()=>{const r=game.getBoundingClientRect();return{x:r.x+${g.aimPoint.x}/demo.stage.W*r.width,y:r.y+${g.aimPoint.y}/demo.stage.H*r.height}})()`);await tap(p);
  assert.equal(await run('demo.state.inventory.normal'),stock-1);
  await run(`for(let n=0;n<2500&&demo.state.enemies[${g.targetId}].alive&&demo.state.phase==='flying';n++)demo.step(${dt})`);
  assert.equal(await run(`demo.state.enemies[${g.targetId}].alive`),false,`Following the ${kind} hand point hits the highlighted target at ${dt}`);
  const error=await run(`(()=>{const points=${JSON.stringify(g.points)},segments=demo.state.segments;let length=0,max=0;const dist=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};for(const s of segments){length+=Math.hypot(s.x2-s.x1,s.y2-s.y1);if(length>${g.distance}-10)break;max=Math.max(max,...[[s.x1,s.y1],[s.x2,s.y2]].map(([x,y])=>Math.min(...points.slice(1).map((b,i)=>dist(x,y,points[i],b)))));}return max})()`);
  assert.ok(error<5,`Actual line remains close to teaching line: ${error}`);
  await run('for(let n=0;n<2500&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');return g;
 };
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.gameGuide&&demo.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
   for(const dt of [.008,.016,.032]){
    for(const [index,kind] of [[11,'drag'],[11,'bounce'],[13,'indirect']]){
     await run(`demo.load(${index})`);await wait(`demo.state.index===${index}&&loadingScreen.hidden`);await shot(kind,dt);
     if(kind==='indirect')await shot(kind,dt); // Replaying on a changed board picks a surviving target.
    }
   }
   await run('demo.load(13)');await wait('demo.state.index===13&&loadingScreen.hidden');await click('#openSettings');await wait('!replayGuide.disabled');await click('#replayGuide');await wait('gameGuide.active==="indirect"&&!document.getElementById("gameGuide").hidden');
   assert.ok(await run('document.querySelector(".guide-card>span").textContent.includes("沿枪口出发")'));
   const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`demo-guide-accurate-${width}.png`,Buffer.from(img.data,'base64'));
  }
  assert.equal(errors.length,0);console.log('PASS: 390/320 real-pointer following of drag/bounce/third-level guide, target hit at 8/16/32ms, accurate launch/bounce path within 5 logical units of actual substeps, changed-board target, no preview mutation, one-round consumption and no runtime errors');
 }finally{await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
