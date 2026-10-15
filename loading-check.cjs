const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0,block=false;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.method==='Fetch.requestPaused'){const params={requestId:m.params.requestId};send(block?'Fetch.failRequest':'Fetch.continueRequest',block?{...params,errorReason:'Failed'}:params).catch(console.error);}});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const until=Date.now()+90000;const poll=()=>(${expression})?resolve():Date.now()>until?reject(new Error('Timed out')):setTimeout(poll,100);poll()})`);
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(r.data,'base64'));};
 const enter=async()=>{const p=await run('(()=>{const r=loadingStart.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await wait('demo.gameEntered');};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await send('Network.emulateNetworkConditions',{offline:false,latency:200,downloadThroughput:200000,uploadThroughput:200000});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo');await run('new Promise(r=>setTimeout(r,2000))');
  assert.equal(await run('demo.assetsReady'),false);assert.ok(await run('!loadingScreen.hidden&&document.querySelector("main").inert&&document.body.classList.contains("loading")'));
  await run('demo.shootAt(240,100)');assert.equal(await run('demo.state.shotsUsed'),0);await screenshot('demo-loading-mobile.png');
  await wait('demo.assetsReady');assert.equal(await run('loadingProgress.value===loadingProgress.max&&loadingProgress.max===19&&!loadingScreen.hidden&&!loadingStart.hidden&&!demo.gameEntered'),true);await run('demo.shootAt(240,100)');assert.equal(await run('demo.state.shotsUsed'),0);await enter();
  assert.ok(await run('Array.from(document.querySelectorAll("img[data-asset]")).every(i=>i.complete&&i.naturalWidth>0)'));
  assert.ok(await run('document.documentElement.scrollWidth<=innerWidth&&retry.getBoundingClientRect().bottom<=innerHeight'));
  await screenshot('demo-loading-complete.png');console.log('PASS: cold slow mobile load, real decoded progress, no early firing, complete scene before entry');
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:2,mobile:true});
  block=true;await send('Fetch.enable',{patterns:[{urlPattern:'*toy-shield-peek-v1*',requestStage:'Request'}]});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4180/'});await wait('window.demo&&!loadingRetry.hidden');
  assert.equal(await run('demo.assetsReady'),false);assert.equal(await run('loadingProgress.value'),18);assert.ok(await run('document.querySelector("main").inert'));
  await screenshot('demo-loading-failed.png');block=false;
  const p=await run('(()=>{const r=loadingRetry.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await wait('demo.assetsReady');
  await enter();assert.ok(await run('loadingScreen.hidden&&!document.querySelector("main").inert&&document.documentElement.scrollWidth<=innerWidth'));
  await run('demo.load(0);demo.shootAt(300,380)');assert.equal(await run('demo.state.shotsUsed'),1);assert.equal(errors.length,0);
  console.log('PASS: failed WebP/PNG attempts stay gated, visible retry works at 320px, firing restored, no runtime exceptions');
 }finally{
  await send('Fetch.disable');await send('Network.setCacheDisabled',{cacheDisabled:false});await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});ws.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
