const assert=require('node:assert/strict'),fs=require('node:fs');
async function main(){
 const t=(await(await fetch('http://127.0.0.1:9410/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params)});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=expression=>run(`new Promise((resolve,reject)=>{const deadline=Date.now()+30000;const poll=()=>(${expression})?resolve():Date.now()>deadline?reject(Error('timeout')):setTimeout(poll,100);poll()})`);
 const tap=async p=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const click=async selector=>tap(await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});scrollTo(0,0);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`));
 const fire=async angle=>{await tap(await run(`(()=>{const r=game.getBoundingClientRect(),o=demo.stage.origin,a=${angle}*Math.PI/180;return{x:r.x+(o.x+Math.sin(a)*180)/demo.stage.W*r.width,y:r.y+(o.y-Math.cos(a)*180)/demo.stage.H*r.height}})()`));await run('for(let n=0;n<2500&&["flying","settling"].includes(demo.state.phase);n++)demo.step(.008)');};
 const screenshot=async name=>{await run('new Promise(r=>setTimeout(r,80))');const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(name,Buffer.from(shot.data,'base64'));};





 const plans=[[["fast", -17.4], ["normal", 32], ["normal", 12]], [["fast", -18], ["scatter", 17], ["normal", 12]], [["normal", 0], ["fast", 0], ["normal", 15]], [["normal", 0], ["fast", 0], ["explosive", -20], ["normal", -22], ["scatter", 20]]],missAngles=[0,0,50,-36];
 async function choose(type){if(await run('demo.state.ammo')===type)return;await click('#ammoCurrent');await run('new Promise(r=>setTimeout(r,220))');await click('.ammo-button[data-ammo="'+type+'"]');assert.equal(await run('demo.state.ammo'),type);}
 async function shot(type,angle){await choose(type);const before=await run('demo.state.inventory["'+type+'"]');await fire(angle);assert.equal(await run('demo.state.inventory["'+type+'"]'),before-1);await run('new Promise(r=>setTimeout(r,20))');}
 try{
 await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,80))');
 assert.equal(await run('document.querySelectorAll(".level-button").length'),15);assert.equal(await run('document.querySelectorAll(".level-button[data-group=formal]").length'),12);assert.equal(await run('document.querySelectorAll(".level-button[data-group=tutorial]").length'),0);
 for(const [width,height]of [[390,844],[320,568]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});await click('#openLevels');await click('.level-button[data-level-index="18"]');
 for(const [type,a]of [['explosive',-28],['normal',-17.4],['normal',-17.4],['normal',32],['normal',12]])await shot(type,a);await click('#resultAction');assert.equal(await run('demo.state.index'),19);
 for(let n=0;n<4;n++){
 const index=19+n;assert.equal(await run('demo.state.index'),index);assert.equal(await run('document.querySelector(".level-button.active").dataset.levelIndex'),String(index));await run('new Promise(r=>setTimeout(r,80));demo.render()');
 assert.ok(await run('(()=>{const r=game.getBoundingClientRect();return Math.abs(r.width/r.height-demo.stage.W/demo.stage.H)<.001&&r.top>=64&&r.bottom<=innerHeight-92&&document.documentElement.scrollWidth<=innerWidth})()'));await screenshot('demo-late-level-'+(9+n)+'-'+width+'.png');
 const initial=await run('JSON.stringify({inventory:demo.state.inventory,walls:demo.state.walls,enemies:demo.state.enemies,rotors:demo.state.rotors,barrels:demo.state.barrels})');await shot('normal',missAngles[n]);await click('#retry');assert.equal(await run('JSON.stringify({inventory:demo.state.inventory,walls:demo.state.walls,enemies:demo.state.enemies,rotors:demo.state.rotors,barrels:demo.state.barrels})'),initial);
 for(let k=0;k<plans[n].length;k++){
 await shot(...plans[n][k]);
 if(n===0&&k===0)assert.ok(await run('demo.state.kills===4&&demo.state.enemies.filter(e=>e.type==="helmet").every(e=>!e.alive)&&demo.state.walls.some(w=>w.type==="obstacle"&&!w.alive)'));
 if(n===1&&k===1)assert.ok(await run('demo.state.enemies.filter(e=>e.alive).length===1&&demo.state.enemies.find(e=>e.alive).type==="shield"'));
 if(n===2&&k<2){assert.equal(await run('demo.state.rotors[0].turns'),k+1);await run('demo.render()');await screenshot('demo-late-rotor-'+(k+1)+'-'+width+'.png');}
 if(n===3&&k===0)assert.ok(await run('demo.state.bombExplosions===1&&demo.state.barrelExplosions===1&&!demo.state.walls[2].alive'));
 if(n===3&&k===2)assert.ok(await run('!demo.state.walls[1].alive&&demo.state.walls.filter(w=>w.type==="obstacle").every(w=>!w.alive)'));
 }
 assert.equal(await run('demo.state.phase'),'result');assert.equal(await run('demo.state.stars'),3);assert.equal(await run('demo.state.inventory.normal'),1);assert.equal(await run('demo.state.kills===demo.state.enemies.length'),true);await run('demo.render()');await screenshot('demo-late-clear-'+(9+n)+'-'+width+'.png');await click('#resultAction');assert.equal(await run('demo.state.index'),n<3?index+1:index);
 }
 await click('#openLevels');await run('comparison.scrollIntoView({block:"end"});scrollTo(0,0)');assert.ok(await run('comparisonRows.textContent.includes("★★★")'));await screenshot('demo-late-records-'+width+'.png');await click('#closeLevels');
 }
 assert.equal(errors.length,0);console.log('PASS: 390/320 real pointer 08→09→12, all ammo selection, piercing wood/helmets, scatter group plus shield, persistent rotor turns/reset, bomb→barrel→stone chain, 3 stars with spare ammo, per-level records and no tutorials/overflow/runtime errors');
 }finally{await send('Page.reload');ws.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
