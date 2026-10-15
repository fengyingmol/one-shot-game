const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const t=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params)});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const deadline=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>deadline?reject(Error('timeout')):setTimeout(poll,100);poll()})`);
 const click=async(selector,aim=false)=>{const p=await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height*${aim?.15:.5}}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const settle=()=>run('for(let n=0;n<2500&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');
 const screenshot=async name=>{await run('new Promise(r=>setTimeout(r,80))');const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(shot.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});await click('#openLevels');await click('.level-button[data-level-index="24"]');assert.equal(await run('demo.state.index'),24);assert.equal(await run('demo.state.rotors.length'),1);
   await screenshot(`demo-rotor-${width}.png`);assert.ok(await run('(()=>{const r=game.getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&Math.abs(r.width/r.height-3/4)<.001&&r.bottom<=innerHeight})()'));
   await click('#game',true);await settle();assert.equal(await run('demo.state.kills'),1);assert.equal(await run('demo.state.rotors[0].turns'),1);assert.equal(await run('demo.state.rotors[0].angle'),Math.PI/4);assert.equal(await run('demo.state.phase'),'aim');assert.equal(await run('demo.state.inventory.normal'),1);await screenshot(`demo-rotor-first-${width}.png`);
   await click('#game',true);await settle();assert.equal(await run('demo.state.kills'),2);assert.equal(await run('demo.state.phase'),'result');assert.equal(await run('demo.state.rotors[0].turns'),2);await click('#retry');assert.equal(await run('demo.state.rotors[0].angle'),-Math.PI/4);assert.equal(await run('demo.state.rotorTurns'),0);assert.equal(await run('demo.state.shotsUsed'),0);assert.equal(await run('demo.state.inventory.normal'),2);
  }
  assert.equal(errors.length,0);console.log('PASS: actual 390/320px menu selection, rotor sprite/legend, two pointer shots, persistent 90-degree state, clear within quota, full retry and no runtime errors');
 }finally{await run('if(window.gameAudio?.state.music||window.gameAudio?.state.sfx)document.getElementById("sound").click()');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
