const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout')):setTimeout(poll,60);poll()})`);
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async s=>tap(await run(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.scrollIntoView({block:'nearest'});scrollTo(0,0);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const screenshot=async name=>{await run('demo.render();new Promise(r=>setTimeout(r,80))');const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(img.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered&&demo.allAssetsReady');
  await click('#openLevels');await click('.level-button[data-level-index="30"]');await wait('loadingScreen.hidden&&demo.state.index===30');const before=await run('demo.state.movers[0].x');await delay(650);assert.ok(Math.abs((await run('demo.state.movers[0].x'))-before)>8,'Real animation loop moves bumper');
  await click('#openSettings');const paused=await run('demo.state.motionTime');await delay(250);assert.equal(await run('demo.state.motionTime'),paused);await click('#closeSettings');
  await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,100))');
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});await click('#retry');await run('demo.render()');assert.equal(await run('demo.state.motionTime'),0);
   assert.equal(await run('document.querySelectorAll(".level-button[data-group=test]").length'),6);assert.equal(await run('document.querySelectorAll(".level-button[data-group=formal]").length'),18);
   assert.equal(await run('gameGuide.lessonIds(demo.levels[30]).length'),0);
   await screenshot(`demo-mover-closed-${width}.png`);
   assert.ok(await run('(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return Math.abs(r.width/r.height-s.W/s.H)<.001&&document.documentElement.scrollWidth<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()'));
   const point=await run('(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return{x:r.x+s.origin.x/s.W*r.width,y:r.y+(s.origin.y-150)/s.H*r.height}})()');
   await tap(point);await run('for(let n=0;n<3000&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');assert.equal(await run('demo.state.kills'),0);assert.equal(await run('demo.state.moverHits'),1);assert.equal(await run('demo.state.inventory.normal'),1);
   await click('#retry');await run('for(let n=0;n<138;n++)demo.step(.008);demo.render()');await screenshot(`demo-mover-open-${width}.png`);
   await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await run('demo.render()');await screenshot(`demo-mover-aim-${width}.png`);await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
   await run('for(let n=0;n<3000&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');assert.equal(await run('demo.state.kills'),3);assert.equal(await run('demo.state.stars'),3);assert.equal(await run('demo.state.inventory.normal'),1);await screenshot(`demo-mover-win-${width}.png`);
   await click('#resultAction');assert.equal(await run('demo.state.index'),31,'Test04 now advances to the new test05');assert.equal(await run('demo.state.motionTime'),0);await click('#openLevels');await click('.level-button[data-level-index="30"]');await wait('demo.state.index===30&&loadingScreen.hidden');
  }
  assert.equal(errors.length,0);console.log('PASS: moving bumper real RAF, settings pause, test04 selection, 390/320 real pointer blocked/open shots, spare round/3 stars/retry/final navigation, aim drawing, contain sizing and no runtime errors');
 }finally{await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
