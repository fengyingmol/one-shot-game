const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const page=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(p=>p.type==='page'),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>end?reject(Error('timeout')):setTimeout(poll,40);poll()})`);
 const pause=ms=>run(`new Promise(r=>setTimeout(r,${ms}))`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async s=>tap(await run(`(()=>{const r=document.querySelector(${JSON.stringify(s)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const capture=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(r.data,'base64'));};
 const fixture=()=>run(`(()=>{demo.load(33);demo.state.walls=[];demo.state.props=[];const o=demo.stage.origin;demo.state.enemies=Array.from({length:9},(_,id)=>({id,x:o.x,y:o.y-30-id*38,type:'normal',r:18,hp:1,alive:true,flash:0}));demo.selectAmmo('normal');demo.render()})()`);
 const fire=async()=>tap(await run('(()=>{const r=game.getBoundingClientRect(),s=demo.stage;return{x:r.x+s.origin.x/s.W*r.width,y:r.y+(s.origin.y-120)/s.H*r.height}})()'));
 const reach=count=>run(`for(let n=0;n<1000&&demo.state.comboCount<${count};n++)demo.step(.004);demo.render()`);
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered&&demo.allAssetsReady');await run('demo.load(0)');await pause(100);await run('window.requestAnimationFrame=()=>0');await pause(100);
  for(const [width,height]of [[390,844],[320,568]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});await fixture();const box=await run('JSON.stringify(game.getBoundingClientRect())');await fire();
   await reach(3);assert.equal(await run('demo.state.comboCount'),3);assert.equal(await run('comboFeedback.hidden'),true,'Three is not over three');
   await reach(4);assert.equal(await run('comboFeedback.hidden'),false);assert.equal(await run('comboFeedbackCount.textContent'),'4');await pause(300);await capture(`demo-combo-four-${width}.png`);
   assert.equal(await run('JSON.stringify(game.getBoundingClientRect())'),box,'No camera/layout zoom');
   assert.ok(await run('(()=>{const a=comboFeedback.getBoundingClientRect(),b=challengePanel.getBoundingClientRect();return getComputedStyle(comboFeedback).pointerEvents==="none"&&a.left>=0&&a.right<=innerWidth&&a.top>=64&&a.bottom<=innerHeight-92&&a.right<=b.left&&document.documentElement.scrollWidth<=innerWidth})()'),'Clear of challenge HUD and bottom controls');
   await reach(6);assert.equal(await run('comboFeedbackCount.textContent'),'6');assert.equal(await run('comboFeedback.dataset.tier'),'big');await pause(300);await capture(`demo-combo-six-${width}.png`);
   await click('#openSettings');await run('demo.render()');assert.equal(await run('comboFeedback.hidden'),true);await click('#closeSettings');
   await pause(1050);await run('demo.render()');assert.equal(await run('comboFeedback.hidden'),true,'Real-time expiry even with frozen simulation');
   await reach(7);assert.equal(await run('comboFeedbackCount.textContent'),'7');assert.equal(await run('comboFeedback.hidden'),false);await click('#retry');assert.equal(await run('comboFeedback.hidden'),true,'Retry immediately clears feedback');
   await fixture();await fire();await reach(4);await run('demo.load(11)');assert.equal(await run('comboFeedback.hidden'),true,'Load clears feedback');
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await fixture();await fire();await reach(4);assert.equal(await run('comboFeedback.hidden'),false);assert.equal(await run('comboFeedback.getAnimations().length'),0);await capture('demo-combo-reduced-320.png');await send('Emulation.setEmulatedMedia',{features:[]});
  assert.equal(errors.length,0);console.log('PASS: real pointer 390/320 combo threshold 3 hidden/4 visible, live 6/7 updates, big tier, one-second expiry, retry/load/menu cleanup, no layout shift/input capture/challenge overlap, reduced motion/no runtime errors');
 }finally{await send('Page.reload');ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
