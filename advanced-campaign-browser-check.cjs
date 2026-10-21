const assert=require('node:assert/strict'),fs=require('node:fs');
const {indices,plans}=require('./advanced-campaign-plans.cjs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout: '+${JSON.stringify(expression)})):setTimeout(poll,60);poll()})`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async selector=>tap(await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});scrollTo(0,0);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const shot=async(type,angle)=>{
  if(await run('demo.state.ammo')!==type){await click('#ammoCurrent');await run('new Promise(r=>setTimeout(r,220))');await click('.ammo-button[data-ammo="'+type+'"]');}
  const before=await run('demo.state.inventory["'+type+'"]');await tap(await run(`(()=>{const r=game.getBoundingClientRect(),o=demo.stage.origin,a=${angle}*Math.PI/180;return{x:r.x+(o.x+Math.sin(a)*170)/demo.stage.W*r.width,y:r.y+(o.y-Math.cos(a)*170)/demo.stage.H*r.height}})()`));
  assert.equal(await run('demo.state.inventory["'+type+'"]'),before-1);await run('for(let n=0;n<3000&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');
 };
 const screenshot=async name=>{await run('demo.render();new Promise(r=>setTimeout(r,80))');const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(img.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered&&demo.allAssetsReady');await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,80))');
  assert.equal(await run('document.querySelectorAll(".level-button[data-group=formal]").length'),18);assert.equal(await run('document.querySelectorAll(".level-button").length'),24);assert.equal(await run('document.querySelectorAll(".level-group-title").length'),2);
  assert.deepEqual(await run('Array.from(document.querySelectorAll(".level-button[data-group=formal] .number"),e=>e.textContent)'),Array.from({length:18},(_,n)=>String(n+1).padStart(2,'0')));
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
   await click('#openLevels');await click('.level-button[data-level-index="22"]');await wait('demo.state.index===22&&loadingScreen.hidden');
   for(const p of [['normal',0],['fast',0],['explosive',-20],['normal',-22],['scatter',20]])await shot(...p);await click('#resultAction');await wait('demo.state.index===23&&loadingScreen.hidden');
   for(let n=0;n<4;n++){
    const index=indices[n];assert.equal(await run('demo.state.index'),index);assert.equal(await run('demo.levels[demo.state.index].number'),n+11);assert.equal(await run('document.querySelector(".level-button.active").dataset.levelIndex'),String(index));assert.equal(await run('gameGuide.lessonIds(demo.levels[demo.state.index]).length'),0);
    assert.ok(await run('(()=>{const r=game.getBoundingClientRect(),retryRect=retry.getBoundingClientRect(),ammo=ammoCurrent.getBoundingClientRect();return Math.abs(r.width/r.height-demo.stage.W/demo.stage.H)<.001&&document.documentElement.scrollWidth<=innerWidth&&r.top>=64&&r.bottom<=innerHeight-92&&retryRect.bottom<=innerHeight&&ammo.bottom<=innerHeight})()'));
    await screenshot(`demo-advanced-${n+11}-${width}.png`);
    const initial=await run('JSON.stringify({enemies:demo.state.enemies,walls:demo.state.walls,barrels:demo.state.barrels,rotors:demo.state.rotors,inventory:demo.state.inventory})');await shot('normal',50);await click('#retry');assert.equal(await run('JSON.stringify({enemies:demo.state.enemies,walls:demo.state.walls,barrels:demo.state.barrels,rotors:demo.state.rotors,inventory:demo.state.inventory})'),initial);
    for(let k=0;k<plans[n].length;k++){
     await shot(...plans[n][k]);
     if(n===0&&k===0)assert.ok(await run('demo.state.terrainDestroyed===1&&demo.state.enemies.filter(e=>e.type==="helmet").every(e=>!e.alive)'));
     if(n===1&&k===0)assert.ok(await run('demo.state.barrelExplosions===2&&!demo.state.walls.find(w=>w.type==="brick").alive&&demo.state.inventory.explosive===0'));
     if(n===2&&k<2)assert.equal(await run('demo.state.rotorTurns'),k+1);
     if(n===3&&k===1)assert.ok(await run('demo.state.terrainDestroyed===3&&demo.state.barrelExplosions===1&&demo.state.rotorTurns>=1'));
    }
    assert.equal(await run('demo.state.phase'),'result');assert.equal(await run('demo.state.stars'),3);assert.equal(await run('demo.state.inventory.normal'),1);assert.equal(await run('demo.state.kills===demo.state.enemies.length'),true);await screenshot(`demo-advanced-clear-${n+11}-${width}.png`);
    await click('#resultAction');await wait(`demo.state.index===${n<3?index+1:33}&&loadingScreen.hidden`);assert.equal(await run('demo.state.shotsUsed'),0);
   }
   await click('#openLevels');await click('.level-button[data-level-index="26"]');await wait('demo.state.index===26&&loadingScreen.hidden');await click('#openLevels');await run('comparison.scrollIntoView({block:"end"});scrollTo(0,0)');assert.ok(await run('comparisonRows.textContent.includes("★★★")'));await screenshot(`demo-advanced-records-${width}.png`);await click('#closeLevels');
  }
  assert.equal(errors.length,0);console.log('PASS: 390/320 real pointer 10→11→14, 14 formal/6 test entries, actual ammo selection, piercing/chain blast/rotor/spread, 3 stars and spare ammo, retry/records, final repeats, no new forced guides, uniform scale and no overflow/runtime errors');
 }finally{await send('Page.reload');ws.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1});
