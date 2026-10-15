const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const t=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params)});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const deadline=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>deadline?reject(Error('timeout')):setTimeout(poll,100);poll()})`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async selector=>tap(await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const fire=async angle=>{await tap(await run(`(()=>{const r=game.getBoundingClientRect(),o=demo.stage.origin,a=${angle}*Math.PI/180;return{x:r.x+(o.x+Math.sin(a)*180)/demo.stage.W*r.width,y:r.y+(o.y-Math.cos(a)*180)/demo.stage.H*r.height}})()`));await run('for(let n=0;n<2500&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');};
 const screenshot=async name=>{await run('new Promise(r=>setTimeout(r,80))');const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(shot.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');assert.equal(await run('levelName.textContent'),'正式 01 / 折返小院');
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});await click('#openLevels');await click('.level-button[data-level-index="11"]');
   for(const [n,plan] of [[1,[45]],[2,[44,38]],[3,[-53.5,50.5]]]){
    assert.equal(await run('demo.state.index'),10+n);await screenshot(`demo-early-${n}-${width}.png`);assert.ok(await run('(()=>{const r=game.getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&Math.abs(r.width/r.height-demo.stage.W/demo.stage.H)<.001&&r.bottom<=innerHeight&&retry.getBoundingClientRect().bottom<=innerHeight})()'));
    for(const a of plan)await fire(a);assert.equal(await run('demo.state.phase'),'result');assert.equal(await run('demo.state.kills===demo.state.enemies.length'),true);assert.equal(await run('demo.state.shotsUsed'),plan.length);assert.equal(await run('demo.state.inventory.normal'),1);await click('#resultAction');assert.equal(await run('demo.state.index'),n<3?11+n:13);
   }
   await click('#openLevels');await click('.level-button[data-level-index="13"]');await fire(0);assert.equal(await run('demo.state.kills'),0);await fire(-53.5);assert.equal(await run('demo.state.kills'),2);assert.equal(await run('demo.state.phase'),'aim');await fire(50.5);assert.equal(await run('demo.state.kills'),4);await click('#retry');assert.equal(await run('demo.state.kills'),0);assert.equal(await run('demo.state.inventory.normal'),3);
  }
  assert.equal(errors.length,0);console.log('PASS: 390/320px actual pointer routes, default first formal level, 01→02→03/replay progression, spare ammo, missed-shot recovery, retry, no stretching or runtime errors');
 }finally{await run('if(window.gameAudio?.state.music||window.gameAudio?.state.sfx)document.getElementById("sound").click()');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
