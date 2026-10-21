const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const target=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const deadline=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>deadline?reject(Error('Timeout: '+${JSON.stringify(expression)})):setTimeout(poll,60);poll()})`);
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const click=async selector=>{const p=await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const enter=async()=>{await wait('window.gameGuide&&demo.assetsReady');assert.ok(await run('gameGuide.active===null&&gameGuide.pending.length>=0&&gameGuideRootHidden()'));await click('#loadingStart');await wait('demo.gameEntered');};
 // A helper function is installed after navigation; no production state is changed.
 const initHelper=()=>run('window.gameGuideRootHidden=()=>document.getElementById("gameGuide").hidden');
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(r.data,'base64'));};
 const replay=async()=>{await click('#openSettings');await wait('!settingsDialog.hidden&&!replayGuide.disabled');assert.equal(await run('replayGuide.disabled'),false);await click('#replayGuide');await wait('!gameGuideRootHidden()');};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.gameGuide');await run('localStorage.removeItem("one-shot-guide-v1")');await send('Page.reload');await wait('window.gameGuide');await initHelper();await enter();await wait('gameGuide.active==="drag"&&!gameGuideRootHidden()');
  const snapshot=()=>run('JSON.stringify({index:demo.state.index,inventory:demo.state.inventory,enemies:demo.state.enemies,walls:demo.state.walls,shots:demo.state.shotsUsed,score:demo.state.score})');
  let before=await snapshot();const hand1=await run('document.querySelector(".guide-hand").getAttribute("transform")');await delay(500);assert.notEqual(await run('document.querySelector(".guide-hand").getAttribute("transform")'),hand1);assert.equal(await snapshot(),before);
  await screenshot('demo-guide-drag-390.png');await wait('gameGuide.active==="bounce"');await screenshot('demo-guide-bounce-390.png');
  // Real touch cancels the lesson immediately, without intercepting or firing on down.
  const p=await run('(()=>{const r=game.getBoundingClientRect();return{x:r.x+r.width*.6,y:r.y+r.height*.65}})()');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});assert.equal(await run('gameGuideRootHidden()'),true);assert.equal(await run('demo.state.shotsUsed'),0);
  await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await delay(150);assert.equal(await snapshot(),before);assert.equal(await run('gameGuideRootHidden()'),true);
  await click('#retry');await delay(150);assert.equal(await run('gameGuideRootHidden()'),true);await replay();assert.equal(await run('gameGuide.active'),'drag');
  await click('#openLevels');await delay(120);assert.equal(await run('gameGuideRootHidden()'),true);await click('#closeLevels');await wait('!gameGuideRootHidden()');
  // Persisted completion survives reload, while explicit replay remains available.
  await send('Page.reload');await wait('window.gameGuide');await initHelper();await enter();await delay(160);assert.equal(await run('gameGuideRootHidden()'),true);await replay();
  const ids=[[13,'indirect'],[15,'wood','helmet'],[16,'barrel'],[17,'shield'],[19,'piercing','explosive'],[20,'scatter'],[21,'rotor'],[22,'bomb']];
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
   for(const [index,first,second] of ids){
    await run(`demo.load(${index})`);await wait(`demo.state.index===${index}&&loadingScreen.hidden`);await delay(100);await replay();assert.equal(await run('gameGuide.active'),first);before=await snapshot();
    if(first==='indirect'){assert.equal(await run('document.querySelector(".guide-copy").textContent'),'有时不必直接瞄准小球，试着瞄准墙面，借反弹绕过障碍。');assert.equal(await run('gameGuide.geometry("indirect").points.length'),3);}
    assert.ok(await run('(()=>{const g=document.getElementById("gameGuide"),c=g.querySelector(".guide-card"),r=c.getBoundingClientRect(),b=game.getBoundingClientRect(),hud=document.querySelector(".arena-top").getBoundingClientRect(),o=demo.stage.origin,fit=b.width/demo.stage.W;return getComputedStyle(g).pointerEvents==="none"&&r.left>=b.left&&r.right<=b.right+1&&r.top>=hud.bottom+10&&r.bottom<=b.bottom&&!(r.left<b.left+o.x*fit+30&&r.right>b.left+o.x*fit-30&&r.bottom>b.top+o.y*fit-25&&r.top<b.top+o.y*fit+77)&&Math.abs(b.width/b.height-demo.stage.W/demo.stage.H)<.001&&document.documentElement.scrollWidth<=innerWidth&&document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===game})()'));
    assert.equal(await snapshot(),before);await screenshot(`demo-guide-${first}-${width}.png`);
    if(second){await wait(`gameGuide.active==="${second}"`);await screenshot(`demo-guide-${second}-${width}.png`);assert.equal(await snapshot(),before);}
    await click('#retry');await delay(100);assert.equal(await run('gameGuideRootHidden()'),true);
   }
   for(const index of [12,23,24,25,26,27,28,29,30,31,32]){await run(`demo.load(${index})`);await wait(`demo.state.index===${index}&&loadingScreen.hidden`);await delay(100);assert.equal(await run('gameGuideRootHidden()'),true);await click('#openSettings');assert.equal(await run('replayGuide.disabled'),true);await click('#closeSettings');}
  }
  await run('demo.load(15)');await wait('demo.state.index===15&&loadingScreen.hidden');await replay();
  // After a real first shot the second concept is shown; there is no forced angle.
  const origin=await run('(()=>{const r=game.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height*.85}})()');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...origin,button:'left',clickCount:1});assert.equal(await run('gameGuideRootHidden()'),true);await send('Input.dispatchMouseEvent',{type:'mouseReleased',...origin,button:'left',clickCount:1});await run('for(let n=0;n<3000&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');await wait('gameGuide.active==="helmet"&&!gameGuideRootHidden()');assert.equal(await run('demo.state.shotsUsed'),1);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(100);const still=await run('document.querySelector(".guide-hand").getAttribute("transform")');await delay(350);assert.equal(await run('document.querySelector(".guide-hand").getAttribute("transform")'),still);
  assert.equal(errors.length,0);console.log('PASS: 390/320 guide text, finger motion, local trajectory/focus, staged lessons, real touch cancel and shot, no game-state changes or auto-fire, retry/persistence/replay, menu pause, no guide on ordinary/test levels, reduced motion, contain-fit and no overflow/errors');
 }catch(error){console.error(await run('({index:demo.state.index,active:gameGuide.active,width:innerWidth,scroll:document.documentElement.scrollWidth,card:document.querySelector(".guide-card").getBoundingClientRect().toJSON(),board:game.getBoundingClientRect().toJSON()})'));await screenshot('demo-guide-failure.png');throw error;}
 finally{await send('Emulation.setEmulatedMedia',{features:[]});await run('localStorage.removeItem("one-shot-guide-v1")');await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
