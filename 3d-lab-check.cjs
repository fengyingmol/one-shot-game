const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const tab=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page');
 const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const pause=()=>run('new Promise(r=>setTimeout(r,350))');
 const click=async selector=>{const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:4181/3d-lab/index.html'});
  await run('new Promise((resolve,reject)=>{const end=Date.now()+30000;const poll=()=>window.lab3d?.state.ready?resolve():Date.now()>end?reject(Error(document.querySelector("#loading").textContent)):setTimeout(poll,50);poll()})');
  for(const [width,height] of [[390,844],[320,568],[1100,800]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:width<500});await send('Page.reload');await run('new Promise(r=>{const poll=()=>window.lab3d?.state.ready?r():setTimeout(poll,50);poll()})');await pause();
   assert.ok(await run('lab3d.state.calls>30&&lab3d.state.triangles>10000&&lab3d.state.shadow'));
   assert.equal(await run(`innerWidth===${width}&&document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll("button")].every(b=>b.getBoundingClientRect().height>=44)`),true);
   const initial=await run('lab3d.state.shots');await click('#fire');await pause();assert.equal(await run('lab3d.state.shots'),initial+1);
   for(const x of [width*.15,width*.85]){await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y:height*.42,button:'left',clickCount:1});await run('new Promise((resolve,reject)=>{const end=Date.now()+10000;const poll=()=>Math.abs(lab3d.state.angle-lab3d.state.targetAngle)<.04?resolve():Date.now()>end?reject(Error(JSON.stringify(lab3d.state))):setTimeout(poll,50);poll()})');assert.ok(await run('lab3d.state.handGap<1e-8&&lab3d.state.armError<1e-8'));await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y:height*.42,button:'left',clickCount:1});}
   await pause();
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`demo-3d-lab-${width}.png`,Buffer.from(shot.data,'base64'));
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Page.reload');await run('new Promise(r=>{const poll=()=>window.lab3d?.state.ready?r():setTimeout(poll,50);poll()})');
  const beforeTouch=await run('lab3d.state.shots');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:330}]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:270,y:330}]});
  await pause();await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await run('lab3d.state.shots'),beforeTouch+1);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:160,y:340}]});
  await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await run('lab3d.state.shots'),beforeTouch+1);
  await send('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' ',windowsVirtualKeyCode:32});
  await send('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' ',windowsVirtualKeyCode:32});
  assert.equal(await run('lab3d.state.shots'),beforeTouch+2);
  await run('new Promise((resolve,reject)=>{let frames=0;const check=()=>{if(lab3d.state.armError>1e-8||lab3d.state.handGap>1e-8)return reject(Error("recoil grip"));if(++frames>=12)return resolve();requestAnimationFrame(check)};check()})');
  for(let i=0;i<3;i++){await click('#view');await pause();const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`demo-3d-lab-view-${i}.png`,Buffer.from(shot.data,'base64'));}
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('#fire');await pause();assert.ok(await run('lab3d.state.handGap<1e-8'));
  assert.equal(errors.length,0);console.log('PASS: real WebGL mesh/shadows, 390/320/desktop, pointer aiming and firing, three camera views, grip anchors, reduced-motion, no runtime exceptions');console.log(await run('lab3d.state'));
 }finally{await send('Emulation.setEmulatedMedia',{features:[]});ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
