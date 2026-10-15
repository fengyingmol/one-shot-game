const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0,blockPattern='',blocked=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.method==='Fetch.requestPaused'){const params={requestId:m.params.requestId};if(blockPattern&&m.params.request.url.includes(blockPattern.slice(1,-1))){blocked++;send('Fetch.failRequest',{...params,errorReason:'Failed'}).catch(console.error);}else send('Fetch.continueRequest',params).catch(console.error);}});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const until=Date.now()+90000;const poll=()=>(${expression})?resolve():Date.now()>until?reject(new Error('Timed out: '+${JSON.stringify(expression)})):setTimeout(poll,100);poll()})`);
 const click=async selector=>{const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const enter=async()=>{const start=await run('performance.now()');await click('#loadingStart');await wait('demo.gameEntered');return await run(`performance.now()-${start}`);};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(r.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await send('Network.emulateNetworkConditions',{offline:false,latency:200,downloadThroughput:200000,uploadThroughput:200000});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo');await run('new Promise(r=>setTimeout(r,2000))');
  assert.equal(await run('demo.assetsReady'),false);assert.ok(await run('!loadingScreen.hidden&&document.querySelector("main").inert&&document.body.classList.contains("loading")'));
  await run('demo.shootAt(240,100)');assert.equal(await run('demo.state.shotsUsed'),0);await screenshot('demo-loading-mobile.png');
  await wait('demo.assetsReady');const firstReadyMs=await run('demo.initialReadyMs');assert.ok(firstReadyMs<30000,`cold first entry took ${Math.round(firstReadyMs)}ms (limit 30000ms)`);
  assert.equal(await run('loadingProgress.max===1&&loadingProgress.value===1&&!loadingStart.hidden&&!demo.gameEntered'),true);
  assert.equal(await run('demo.allAssetsReady'),false);await run('demo.shootAt(240,100)');assert.equal(await run('demo.state.shotsUsed'),0);
  const entryMs=await enter();assert.ok(entryMs<500,`click-to-play took ${Math.round(entryMs)}ms`);const firstMode=await run('demo.playerMode');
  assert.equal(await run('document.querySelector("main").inert'),false);assert.equal(await run('demo.playerMode'),firstMode);
  assert.ok(await run('demo.assetReady("courtyard")&&demo.assetReady("gardenDecor")&&demo.assetReady("player")&&demo.assetReady("normalMonster")'));
  assert.ok(await run('document.documentElement.scrollWidth<=innerWidth&&document.querySelector("#loadingRetry").getBoundingClientRect().bottom<=innerHeight'));
  await screenshot('demo-loading-complete.png');console.log(`PASS: cold 390px mobile entry in ${Math.round(firstReadyMs)}ms at 200KB/s; game starts in ${Math.round(entryMs)}ms; player appearance stays stable`);

  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:2,mobile:true});
  blockPattern='*toy-normal-sculpt-v2*';await send('Fetch.enable',{patterns:[{urlPattern:blockPattern,requestStage:'Request'}]});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo&&!loadingRetry.hidden');
  assert.equal(await run('demo.assetsReady'),false);assert.ok(await run('document.querySelector("main").inert'));
  await screenshot('demo-loading-failed.png');blockPattern='';await click('#loadingRetry');await wait('demo.assetsReady');await enter();
  assert.ok(await run('loadingScreen.hidden&&!document.querySelector("main").inert&&document.documentElement.scrollWidth<=innerWidth'));
  await run('demo.load(0);demo.shootAt(300,380)');assert.equal(await run('demo.state.shotsUsed'),1);assert.equal(errors.length,0);
  console.log('PASS: critical WebP/PNG failure stays gated, retry restores 320px play and shooting');

  await send('Network.setCacheDisabled',{cacheDisabled:true});blockPattern='*toy-shield-peek-v1*';blocked=0;
  await send('Fetch.enable',{patterns:[{urlPattern:blockPattern,requestStage:'Request'}]});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo');await wait('window.demo.assetsReady');await enter();
  await wait('demo.gameEntered&&demo.allAssetsReady===false');await wait('performance.now()>1000');
  const blockUntil=Date.now()+30000;while(blocked<3&&Date.now()<blockUntil)await new Promise(resolve=>setTimeout(resolve,100));assert.ok(blocked>=3,'background preload did not reach the blocked shield asset');
  const targetIndex=await run('demo.levels.findIndex((l,i)=>i!==demo.state.index&&l.enemies.some(e=>e[2]==="shield"))');assert.ok(targetIndex>=0);
  await run(`void demo.load(${targetIndex})`);await wait('!loadingRetry.hidden');
  assert.ok(await run('!loadingScreen.hidden&&loadingStart.hidden&&document.querySelector("main").inert&&demo.state.index!=='+targetIndex));
  await screenshot('demo-level-art-wait.png');blockPattern='';await click('#loadingRetry');await wait('demo.state.index==='+targetIndex+'&&loadingScreen.hidden');
  assert.equal(await run('demo.assetReady("shield")'),true);await screenshot('demo-level-art-ready.png');assert.equal(errors.length,0);
  console.log('PASS: an unready later-level sprite keeps the old scene visible, retries, then switches with artwork ready');

  blockPattern='*three.core.js*';await send('Fetch.enable',{patterns:[{urlPattern:blockPattern,requestStage:'Request'}]});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo');await wait('window.demo.assetsReady');
  assert.equal(await run('demo.playerMode'),'sprite');await enter();await run('new Promise(r=>setTimeout(r,1500))');
  assert.equal(await run('demo.playerMode'),'sprite');assert.equal(await run('loadingScreen.hidden'),true);assert.equal(errors.length,0);
  console.log('PASS: failed 3D renderer uses the pose sprite from entry and never swaps the player mid-game');
 }finally{
  await send('Fetch.disable').catch(()=>{});await send('Network.setCacheDisabled',{cacheDisabled:false}).catch(()=>{});await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});ws.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
