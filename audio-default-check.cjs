const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params)});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const pause=ms=>run(`new Promise(r=>setTimeout(r,${ms}))`);
 const wait=expression=>run(`new Promise((resolve,reject)=>{const deadline=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>deadline?reject(Error('timeout')):setTimeout(poll,50);poll()})`);
 const click=async selector=>{const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await pause(80);await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const navigate=async()=>{await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo?.assetsReady&&window.gameAudio');};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await navigate();
  assert.deepEqual(await run('({music:gameAudio.state.music,sfx:gameAudio.state.sfx,context:gameAudio.state.context,starts:gameAudio.state.musicStarts})'),{music:true,sfx:true,context:'not-created',starts:0});assert.equal(await run('sound.getAttribute("aria-pressed")'),'true');
  assert.equal(await run('demo.gameEntered'),false);await run('demo.shootAt(240,100)');assert.equal(await run('demo.state.shotsUsed'),0);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('demo-entry-mobile.png',Buffer.from(shot.data,'base64'));
  await click('#loadingStart');await wait('demo.gameEntered&&gameAudio.state.musicPlaying');await pause(400);
  assert.equal(await run('gameAudio.state.context'),'running');assert.ok(await run('gameAudio.state.rms>.001'));assert.equal(await run('demo.state.shotsUsed'),0,'Music before first shot');assert.equal(await run('gameAudio.state.musicStarts'),1);
  await run('demo.load(0)');await click('#game');assert.ok(await run('gameAudio.state.played.shot>0'),'First shot SFX');
  await run('demo.load(2);demo.load(0)');assert.equal(await run('gameAudio.state.musicStarts'),1);
  await click('#openSettings');await click('#sound');await wait('gameAudio.state.context==="suspended"');await click('#closeSettings');await click('#retry');assert.equal(await run('gameAudio.state.musicPlaying'),false);assert.equal(await run('gameAudio.state.context'),'suspended');
  await click('#openSettings');await click('#sound');await wait('gameAudio.state.musicPlaying');assert.equal(await run('gameAudio.state.musicStarts'),2);
  await click('#musicToggle');await pause(100);assert.equal(await run('gameAudio.state.musicPlaying'),false);assert.equal(await run('gameAudio.state.sfx'),true);
  await click('#musicToggle');await wait('gameAudio.state.musicPlaying');await click('#sfxToggle');assert.equal(await run('gameAudio.state.sfx'),false);
  await run('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');await wait('gameAudio.state.context==="suspended"');await run('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))');await wait('gameAudio.state.context==="running"');assert.equal(await run('gameAudio.state.musicStarts'),3);
  await run('audioVolume.value=0;audioVolume.dispatchEvent(new Event("input",{bubbles:true}))');await pause(450);assert.ok(await run('gameAudio.state.rms<.0001'));assert.equal(errors.length,0);
  await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*courtyard-loop.wav*']});await send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:2,mobile:true});await navigate();await click('#loadingStart');await wait('demo.gameEntered&&gameAudio.state.musicPlaying');assert.equal(await run('demo.state.shotsUsed'),0);assert.equal(await run('gameAudio.state.musicStarts'),1);assert.ok(await run('document.documentElement.scrollWidth<=innerWidth'));await send('Network.setBlockedURLs',{urls:[]});
  console.log('PASS: explicit entry gesture, music output before any shots, gated firing, no duplicate loops, manual mute, independent controls, background resume and 320px music-download synthesis fallback');
 }finally{await run('if(window.gameAudio?.state.music||window.gameAudio?.state.sfx)document.getElementById("sound").click()');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
