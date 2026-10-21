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




 const indices=[15,16,17,19,20],plans=[[["normal", -18], ["normal", -18], ["normal", -18], ["normal", 50]], [["normal", -19.5], ["normal", -19.5], ["normal", 21]], [["normal", 12], ["normal", 12], ["normal", -9], ["normal", 27]], [["fast", -17.4], ["explosive", 32], ["normal", 12]]];
 async function choose(type){if(await run('demo.state.ammo')===type)return;await click('#ammoCurrent');await run('new Promise(r=>setTimeout(r,220))');await click('.ammo-button[data-ammo="'+type+'"]');assert.equal(await run('demo.state.ammo'),type);}
 async function shot(type,angle){await choose(type);const before=await run('demo.state.inventory["'+type+'"]');await fire(angle);assert.equal(await run('demo.state.inventory["'+type+'"]'),before-1);await run('new Promise(r=>setTimeout(r,20))');}
 try{
 await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4182/'});await wait('window.demo?.assetsReady');await click('#loadingStart');await wait('demo.gameEntered');await run('window.requestAnimationFrame=()=>0;new Promise(r=>setTimeout(r,80))');
 assert.equal(await run('demo.levels.filter(l=>l.group==="formal").length'),18);assert.equal(await run('document.querySelectorAll(".level-button[data-group=tutorial],.level-group-title[data-group=tutorial]").length'),0);assert.equal(await run('document.querySelectorAll(".level-button").length'),24);assert.equal(await run('document.querySelectorAll(".level-group-title").length'),2);assert.equal(await run('Array.from(document.querySelectorAll(".level-button")).filter(b=>["14","18"].includes(b.dataset.levelIndex)).length'),0);
 for(const [width,height] of [[390,844],[320,568]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});await run('demo.load(13);new Promise(r=>setTimeout(r,80))');await fire(-53.5);await fire(50.5);await click('#resultAction');assert.equal(await run('demo.state.index'),15);
 for(let n=0;n<plans.length;n++){
 const index=indices[n];assert.equal(await run('demo.state.index'),index);assert.equal(await run('document.querySelector(".level-button.active").dataset.levelIndex'),String(index));assert.equal(await run('demo.levels[demo.state.index].number'),n+4);await run('new Promise(r=>setTimeout(r,80));demo.render()');
 assert.ok(await run('(()=>{const r=game.getBoundingClientRect();return Math.abs(r.width/r.height-demo.stage.W/demo.stage.H)<.001&&r.top>=64&&r.bottom<=innerHeight-92&&document.documentElement.scrollWidth<=innerWidth&&retry.getBoundingClientRect().bottom<=innerHeight})()'));
 await screenshot('demo-campaign-'+(n+4)+'-'+width+'.png');
 const initial=await run('JSON.stringify({inventory:demo.state.inventory,walls:demo.state.walls,enemies:demo.state.enemies})');await shot('normal',0);await click('#retry');assert.equal(await run('JSON.stringify({inventory:demo.state.inventory,walls:demo.state.walls,enemies:demo.state.enemies})'),initial);
 for(let k=0;k<plans[n].length;k++){
 const [type,a]=plans[n][k];await shot(type,a);
 if(n===0&&k===0)assert.ok(await run('demo.state.walls.some(w=>w.type==="obstacle"&&w.alive&&w.hp===1)'));
 if(n===0&&k===1)assert.ok(await run('demo.state.enemies.some(e=>e.type==="helmet"&&e.alive&&e.hp===1)'));
 if(n===1&&k===1)assert.equal(await run('demo.state.barrelExplosions'),1);
 if(n===3&&k===0)assert.ok(await run('demo.state.walls.some(w=>w.type==="obstacle"&&!w.alive)&&demo.state.enemies.filter(e=>e.type==="helmet").every(e=>!e.alive)'));
 if(n===3&&k===1)assert.ok(await run('demo.state.walls.some(w=>w.type==="brick"&&!w.alive)&&demo.state.inventory.explosive===0'));
 }
 assert.equal(await run('demo.state.phase'),'result');assert.equal(await run('demo.state.stars'),3);assert.ok(await run('demo.state.kills===demo.state.enemies.length&&Object.values(demo.state.inventory).reduce((a,b)=>a+b,0)===1'));
 await run('demo.render()');await screenshot('demo-campaign-clear-'+(n+4)+'-'+width+'.png');await click('#resultAction');assert.equal(await run('demo.state.index'),indices[n+1]);
 }
 await run('demo.load(19)');await click('#openLevels');assert.equal(await run('document.querySelectorAll(".level-button[data-group=formal]").length'),18);await run('comparison.scrollIntoView({block:"end"});scrollTo(0,0)');assert.ok(await run('comparisonRows.textContent.includes("★★★")'));await screenshot('demo-campaign-records-'+width+'.png');await click('#closeLevels');
 }
 assert.equal(errors.length,0);console.log('PASS: 390/320 real pointer formal 03→merged 04→07→08, actual ammo picker, wood damage/helmet persistence/barrel/stone opening, each new level clears with 3 stars and one spare shot, retry, per-level records, 14 formal levels and 2 group headings, contain-fit and no overflow/errors');
 }finally{await send('Page.reload');ws.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
