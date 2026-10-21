const assert=require('node:assert/strict'),fs=require('node:fs');
const {indices,plans,challengePlans}=require('./garden-campaign-plans.cjs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout '+${JSON.stringify(expression)})):setTimeout(poll,40);poll()})`);
 const pause=ms=>run(`new Promise(r=>setTimeout(r,${ms}))`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async s=>tap(await run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.scrollIntoView({block:'nearest'});scrollTo(0,0);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const screenshot=async name=>{await run('demo.render()');await pause(70);const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(img.data,'base64'));};
 const select=async index=>{await click('#openLevels');await click(`.level-button[data-level-index="${index}"]`);await wait(`demo.state.index===${index}&&loadingScreen.hidden`);await pause(90);};
 const shot=async(type,angle,delay=0)=>{
  if(await run('demo.state.ammo')!==type){await click('#ammoCurrent');await pause(220);await click(`.ammo-button[data-ammo="${type}"]`);}
  await run(`for(let t=0;t<${delay}-1e-9;t+=.008)demo.step(Math.min(.008,${delay}-t))`);
  const before=await run(`demo.state.inventory.${type}`);
  await tap(await run(`(()=>{const r=game.getBoundingClientRect(),s=demo.stage,a=${angle}*Math.PI/180;return{x:r.x+(s.origin.x+Math.sin(a)*170)/s.W*r.width,y:r.y+(s.origin.y-Math.cos(a)*170)/s.H*r.height}})()`));
  if(await run(`demo.state.inventory.${type}`)!==before-1){await screenshot('demo-garden-browser-failure.png');throw Error(JSON.stringify(await run(`({index:demo.state.index,ammo:demo.state.ammo,phase:demo.state.phase,shots:demo.state.shotsUsed,inventory:demo.state.inventory,type:${JSON.stringify(type)},angle:${angle},picker:ammoPicker.hidden,settings:settingsDialog.hidden,levels:levelPanel.open})`)));}
  await run('for(let n=0;n<4000&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008);demo.render()');
 };
 try{
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');
  await click('#loadingStart');await wait('demo.gameEntered&&demo.allAssetsReady&&window.gameGuide');
  // Freeze physics for exact replay, but keep the real, presentation-only guide RAF.
  await run(`window.qaOriginalRaf=requestAnimationFrame;window.requestAnimationFrame=callback=>callback.toString().includes('time-lastTick')?qaOriginalRaf(callback):0`);await pause(100);
  assert.deepEqual(await run('Array.from(document.querySelectorAll(".level-button[data-group=formal] .number"),e=>e.textContent)'),Array.from({length:18},(_,i)=>String(i+1).padStart(2,'0')));
  assert.equal(await run('document.querySelectorAll(".level-button").length'),24);assert.equal(await run('document.querySelectorAll(".level-group-title").length'),2);
  for(const [width,height]of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
   for(let n=0;n<4;n++){
    const index=indices[n];await select(index);assert.equal(await run('demo.levels[demo.state.index].number'),n+15);
    assert.equal(await run('document.querySelector(".level-button.active").dataset.levelIndex'),String(index));
    assert.ok(await run('(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return Math.abs(r.width/r.height-s.W/s.H)<.001&&document.documentElement.scrollWidth<=innerWidth&&r.top>=64&&r.bottom<=innerHeight-92})()'));
    if(n<3){await click('#openSettings');assert.equal(await run('replayGuide.disabled'),false);await click('#replayGuide');await wait(`gameGuide.active===${JSON.stringify(['challenge','mover','lever'][n])}&&!document.getElementById('gameGuide').hidden`);assert.ok(await run(`document.querySelector('.guide-copy').textContent.length>10`));await screenshot(`demo-garden-guide-${n+15}-${width}.png`);}
    await screenshot(`demo-garden-level-${n+15}-${width}.png`);
    if(await run('!!demo.state.challenge')){
     const before=await run('JSON.stringify({rect:game.getBoundingClientRect(),shots:demo.state.shotsUsed,score:demo.state.score,inventory:demo.state.inventory})');
     await click('#challengePanel summary');await run('demo.render()');await pause(80);assert.equal(await run('challengePanel.open'),true);assert.equal(await run('document.getElementById("gameGuide").hidden'),true,'Expanded task does not overlap teaching card');assert.equal(await run('JSON.stringify({rect:game.getBoundingClientRect(),shots:demo.state.shotsUsed,score:demo.state.score,inventory:demo.state.inventory})'),before);await screenshot(`demo-garden-task-${n+15}-${width}.png`);await click('#challengePanel summary');
    }
    for(const p of plans[n])await shot(...p);
    assert.equal(await run('demo.state.kills===demo.state.enemies.length'),true);assert.equal(await run('demo.state.stars'),3);assert.equal(await run('demo.state.inventory.normal'),1);assert.equal(await run('demo.state.challengeBonus'),0);
    await screenshot(`demo-garden-clear-${n+15}-${width}.png`);
    await click('#resultAction');await wait(`demo.state.index===${n<3?indices[n+1]:index}&&loadingScreen.hidden`);
    if(challengePlans[n]){
     await select(index);for(const p of challengePlans[n]){if(await run('demo.state.phase')==='result')break;await shot(...p);}
     assert.equal(await run('demo.state.challenge.done'),true);assert.equal(await run('demo.state.challengeBonus'),[30,0,35,40][n]);assert.equal(await run('demo.state.kills===demo.state.enemies.length'),true);assert.equal(await run('demo.state.stars'),3);assert.ok(await run('resultBreakdown.textContent.includes("挑战奖励")'));
     await screenshot(`demo-garden-bonus-${n+15}-${width}.png`);await click('#retry');assert.equal(await run('demo.state.challengeBonus'),0);assert.equal(await run('demo.state.props.some(p=>p.down)'),false);assert.equal(await run('demo.state.gates.some(g=>g.open)'),false);
    }
   }
  }
  await select(26);for(const p of require('./advanced-campaign-plans.cjs').plans[3])await shot(...p);await click('#resultAction');await wait('demo.state.index===33&&loadingScreen.hidden');
  assert.equal(errors.length,0);console.log('PASS: 390/320 real pointer formal15–18, sorted 18+6 menu, three new guides, optional transparent tasks, all weapons, quotas/three stars/spare ammo, challenge+clear, reset/records, 14→15→18, final replay, contain/no overflow/runtime errors');
 }finally{await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
