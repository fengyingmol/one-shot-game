const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout: '+${JSON.stringify(expression)})):setTimeout(poll,60);poll()})`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async s=>tap(await run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.scrollIntoView({block:'nearest'});scrollTo(0,0);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const point=async(x,y)=>run(`(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return{x:r.x+${x}/s.W*r.width,y:r.y+${y}/s.H*r.height}})()`);
 const shot=async(x,y)=>{await tap(await point(x,y));await settle();};
 const settle=()=>run('for(let n=0;n<3000&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');
 const screenshot=async name=>{await run('demo.render();new Promise(r=>setTimeout(r,80))');const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(img.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered&&demo.allAssetsReady');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await click('#openLevels');await click('.level-button[data-level-index="31"]');await wait('demo.state.index===31&&loadingScreen.hidden');
  await tap(await point(95,390));await wait('demo.state.switchHits===1&&demo.state.gates[0].openness===1');assert.equal(await run('demo.state.shotsUsed'),1,'Real RAF opens gate without manual stepping');
  await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,100))');await settle();
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});await click('#retry');await run('demo.render()');
   assert.equal(await run('document.querySelectorAll(".level-button[data-group=test]").length'),6);assert.equal(await run('document.querySelectorAll(".level-button[data-group=formal]").length'),18);assert.equal(await run('gameGuide.lessonIds(demo.levels[31]).length'),0);
   await screenshot(`demo-clockwork-closed-${width}.png`);
   assert.ok(await run('(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return Math.abs(r.width/r.height-s.W/s.H)<.001&&document.documentElement.scrollWidth<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()'));
   await shot(230,200);assert.equal(await run('demo.state.kills'),0);assert.equal(await run('demo.state.switchHits'),0);
   await click('#retry');await tap(await point(95,390));await run('for(let n=0;n<40;n++)demo.step(.008)');assert.equal(await run('demo.state.switchHits'),1);assert.ok(await run('demo.state.gates[0].openness>0&&demo.state.gates[0].openness<1'));await screenshot(`demo-clockwork-opening-${width}.png`);
   await click('#openSettings');const paused=await run('JSON.stringify(demo.state)');await run('demo.step(.3)');assert.equal(await run('JSON.stringify(demo.state)'),paused);await click('#closeSettings');await settle();
   assert.equal(await run('demo.state.gates[0].openness'),1);assert.equal(await run('demo.state.kills'),0);await screenshot(`demo-clockwork-open-${width}.png`);
   await shot(95,390);assert.equal(await run('demo.state.switchHits'),2);assert.equal(await run('demo.state.gates[0].openness'),0);assert.equal(await run('demo.state.inventory.normal'),1);await screenshot(`demo-clockwork-reclosed-${width}.png`);
   await click('#retry');await shot(95,390);const p=await point(230,200);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await screenshot(`demo-clockwork-aim-${width}.png`);await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await settle();
   assert.equal(await run('demo.state.kills'),3);assert.equal(await run('demo.state.stars'),3);assert.equal(await run('demo.state.score'),65);assert.equal(await run('demo.state.inventory.normal'),1);await screenshot(`demo-clockwork-win-${width}.png`);
   await click('#resultAction');assert.equal(await run('demo.state.index'),32);await click('#openLevels');await click('.level-button[data-level-index="31"]');await wait('demo.state.index===31&&loadingScreen.hidden');assert.equal(await run('demo.state.gates[0].openness'),0);assert.equal(await run('demo.state.switches[0].turns'),0);
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await shot(95,390);assert.equal(await run('demo.state.gates[0].openness'),1);await run('demo.render()');await send('Emulation.setEmulatedMedia',{features:[]});
  assert.equal(errors.length,0);console.log('PASS: 390/320 real pointer closed/open/reclose gate, actual RAF, visible slide + logical extent, settings pause, no forced guide, 2-shot 3-star route with spare ammo, reset/final navigation, reduced motion and no overflow/runtime errors');
 }finally{await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
