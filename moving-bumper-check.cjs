const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),buttons=[];
const get=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b);},setAttribute(){},getContext(){return {};}});return elements.get(id);};
const document={hidden:false,getElementById:get,querySelectorAll:s=>buttons.filter(b=>'.'+b.className===s),addEventListener(){},createElement:()=>({dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}})};
const sandbox={window:{},document,requestAnimationFrame(){},Math,console};vm.runInNewContext(fs.readFileSync('game.js','utf8'),sandbox);const d=sandbox.window.demo,index=d.levels.findIndex(l=>l.movers?.length);
assert.equal(index,30);assert.equal(d.levels[index].group,'test');assert.equal(d.levels[index].number,4);
const advance=(time,dt=.008)=>{for(let t=0;t<time-1e-10;t+=dt)d.step(Math.min(dt,time-t));};
const settle=dt=>{let n=0;while(['flying','settling'].includes(d.state.phase)&&n++<4000)d.step(dt);assert.ok(n<4000);};
for(const dt of [.008,.016,.032]){
 d.load(index);const m=d.state.movers[0],start=m.x;advance(1.1,dt);assert.equal(m.x,290);advance(.5,dt);assert.equal(m.x,290,'Endpoint pauses');advance(2.2,dt);assert.ok(m.x<start,'Returns to the other side');assert.ok(m.x>=70&&m.x<=290);
 d.load(index);d.shootAt(230,80);settle(dt);assert.equal(d.state.kills,0,'Immediate central shot is blocked');assert.equal(d.state.moverHits,1);assert.equal(d.state.phase,'aim');assert.equal(d.state.inventory.normal,1);assert.ok(d.state.motionTime>0);
 const clock=d.state.motionTime;d.step(.1);assert.ok(d.state.motionTime>clock,'Does not reset between shots');get('retry').onclick();assert.equal(d.state.motionTime,0);assert.equal(d.state.movers[0].x,180);assert.equal(d.state.inventory.normal,2);
 advance(1.1,dt);d.shootAt(230,80);settle(dt);assert.equal(d.state.kills,3);assert.equal(d.state.stars,3);assert.equal(d.state.score,65);assert.equal(d.state.shotsUsed,1);assert.equal(d.state.moverHits,0);
 const done=d.state.motionTime;d.step(1);assert.equal(d.state.motionTime,done,'Result freezes motion');
}
// Loading, menus, background tabs and ammo UI pause the complete moving arena.
for(const [id,key] of [['loadingScreen','hidden'],['levelPanel','open'],['settingsDialog','hidden'],['ammoPicker','hidden'],[null,'hidden']]){
 d.load(index);const el=id?get(id):document,old=el[key];el[key]=key==='open'||!id?true:false;const before=JSON.stringify(d.state);d.step(.3);assert.equal(JSON.stringify(d.state),before);el[key]=old;
}
function fixture(type){d.load(index);d.state.enemies=[{id:99,x:10000,y:10000,r:18,type:'normal',alive:true}];d.state.inventory[type]=1;d.selectAmmo(type);d.shootAt(230,80);const b=d.state.bullets[0];d.state.bullets=[b];b.spreading=false;return b;}
for(const type of ['normal','fast','explosive','scatter']){const b=fixture(type),speed=Math.hypot(b.vx,b.vy),energy=b.energy;advance(.24,.032);assert.equal(d.state.moverHits,1);assert.ok(b.vy>0);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-speed)<1e-8,'No momentum injection');assert.ok(Math.abs(b.energy-(energy-.24))<1e-8,'No recharge');assert.equal(d.state.explosions,0);assert.equal(d.state.terrainDestroyed,0);assert.equal(d.state.score,0);assert.equal(d.state.movers.length,1);}
// Sweep catches crossing even if both endpoints lie outside the bumper.
const m={previousX:100,x:180,y:200,w:20,h:18};assert.ok(d.moverSweep(m,150,210,150,210,4),'Bumper sweeps over stationary projectile');assert.equal(d.moverSweep(m,150,240,150,240,4),null);assert.ok(d.moverSweep({...m,previousX:100,x:100},110,260,110,150,4),'Fast projectile crosses thin bumper');
// A nearby explosion cannot destroy the reinforced mechanical bumper.
const b=fixture('explosive');b.x=230;b.y=350;d.state.enemies.push({id:100,x:230,y:330,r:18,type:'normal',alive:true});advance(.03);assert.equal(d.state.explosions,1);assert.equal(d.state.movers.length,1);
console.log('PASS: moving bumper timing at 8/16/32ms, endpoint pauses, swept contact, all-ammo reflection without speed/energy bonus, explosion immunity, spare ammo, retry, continuous shot clock and UI/background/result pause');
