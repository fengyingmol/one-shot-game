const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const base=process.argv[2]||'http://127.0.0.1:4182/',tab=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+60000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout')):setTimeout(poll,50);poll()})`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async sel=>tap(await run(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const capture=async name=>{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(shot.data,'base64'));};
 try{
  await send('Runtime.enable');await send('Page.enable');
  for(const [width,height] of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});await send('Page.navigate',{url:base});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');assert.equal(await run('demo.playerMode'),'3d');await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,80))');
   let planted;const records=[];
   for(const degree of [-80,-40,0,40,80]){
    const p=await run(`(()=>{const a=${degree}*Math.PI/180,s=demo.stage,r=game.getBoundingClientRect();return{x:r.x+(s.origin.x+Math.sin(a)*160)/s.W*r.width,y:r.y+(s.origin.y-Math.cos(a)*160)/s.H*r.height}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await run('demo.render()');const d=await run('playerModel.diagnostics'),aim=await run('demo.playerRig.angle');
    assert.equal(d.bodyYaw,0);assert.equal(d.torsoPitch,0);assert.equal(d.torsoRoll,0);assert.ok(d.armError<1e-9&&d.handGap<1e-9&&d.reachMargin>.02);assert.ok(Math.abs(d.direction.x-Math.sin(aim))<1e-8&&Math.abs(d.direction.y+Math.cos(aim))<1e-8);
    const foot=[d.foot.x-d.anchor.x,d.foot.y-d.anchor.y];if(!planted)planted=foot;else assert.ok(Math.hypot(foot[0]-planted[0],foot[1]-planted[1])<1e-8);assert.ok(Math.hypot(d.muzzle.x-d.anchor.x,d.muzzle.y-d.anchor.y)<1e-8);
    records.push({degree,body:d.bodyYaw,shoulders:d.torsoYaw,head:d.headYaw,calls:d.calls,triangles:d.triangles});await capture(`demo-player-toy-${width}-${degree}.png`);
    const count=await run('demo.state.shotsUsed');await run('game.dispatchEvent(new PointerEvent("pointercancel"))');await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});assert.equal(await run('demo.state.shotsUsed'),count);
   }
   // Fresh native animation loop: capture an actual shot-driven recoil, not a
   // manually injected kick or a screenshot after the recoil has already ended.
   await send('Page.navigate',{url:base});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');await run('demo.load(0);window.__shotKick=null;const nativeFrame=requestAnimationFrame;window.requestAnimationFrame=cb=>nativeFrame(t=>{cb(t);if(playerModel.diagnostics.kick>.1){window.__shotKick=playerModel.diagnostics;window.requestAnimationFrame=()=>0;}})');
   const p=await run('(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return{x:r.x+s.origin.x/s.W*r.width,y:r.y+100/s.H*r.height}})()');await tap(p);await wait('window.__shotKick');assert.ok(await run('__shotKick.kick>.1&&__shotKick.armError<1e-9&&__shotKick.handGap<1e-9&&__shotKick.torsoRoll===0&&__shotKick.torsoPitch===0'));await capture(`demo-player-recoil-${width}.png`);await run('for(let i=0;i<350;i++)demo.step(.008);demo.render()');assert.equal(await run('demo.state.kills'),3);await click('#retry');assert.equal(await run('demo.state.shotsUsed'),0);
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await run('demo.render()');const count=await run('playerModel.diagnostics.draws');await run('demo.step(.1);demo.render()');assert.equal(await run('playerModel.diagnostics.draws'),count);await send('Emulation.setEmulatedMedia',{features:[]});console.log(JSON.stringify({width,result:'PASS',records}));
  }assert.equal(errors.length,0);console.log('PASS: planted feet, independent two-arm aiming, rigid grips, aligned muzzle, recoil/shot/retry and reduced motion at 390/320px');
 }finally{await send('Emulation.setEmulatedMedia',{features:[]});await send('Page.navigate',{url:base});ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
