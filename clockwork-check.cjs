const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),buttons=[];
const get=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b);},setAttribute(){},getContext(){return {};}});return elements.get(id);};
const document={hidden:false,getElementById:get,querySelectorAll:s=>buttons.filter(b=>'.'+b.className===s),addEventListener(){},createElement:()=>({dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}})};
const sandbox={window:{},document,requestAnimationFrame(){},Math,console};vm.runInNewContext(fs.readFileSync('game.js','utf8'),sandbox);const d=sandbox.window.demo,index=d.levels.findIndex(l=>l.switches?.length);
const advance=(time,dt=.008)=>{for(let t=0;t<time-1e-10;t+=dt)d.step(Math.min(dt,time-t));};
const settle=dt=>{let n=0;while(['flying','settling'].includes(d.state.phase)&&n++<4000)d.step(dt);assert.ok(n<4000);};
assert.equal(index,31);assert.equal(d.levels[index].number,5);assert.equal(d.levels[index].group,'test');
for(const dt of [.008,.016,.032]){
 d.load(index);d.shootAt(230,95);settle(dt);assert.equal(d.state.kills,0,'Closed door blocks direct route');assert.equal(d.state.switchHits,0);assert.equal(d.state.inventory.normal,2);
 d.load(index);d.shootAt(95,390);settle(dt);assert.equal(d.state.switchHits,1);assert.equal(d.state.gates[0].open,true);assert.equal(d.state.gates[0].openness,1);assert.equal(d.state.phase,'aim');assert.equal(d.state.kills,0);assert.equal(d.state.score,0);assert.equal(d.state.terrainDestroyed,0);
 d.shootAt(230,95);settle(dt);assert.equal(d.state.kills,3);assert.equal(d.state.shotsUsed,2);assert.equal(d.state.inventory.normal,1);assert.equal(d.state.score,65);assert.equal(d.state.stars,3);
 get('resultAction').onclick();assert.equal(d.state.index,32,'Test05 advances to the optional prop arena');d.load(index);assert.equal(d.state.switchHits,0);assert.equal(d.state.gates[0].open,false);assert.equal(d.state.gates[0].openness,0);assert.equal(d.state.switches[0].turns,0);
 // A different shot can toggle it shut; repeated travel through it in one shot cannot.
 d.shootAt(95,390);settle(dt);d.shootAt(95,390);settle(dt);assert.equal(d.state.switchHits,2);assert.equal(d.state.gates[0].open,false);assert.equal(d.state.gates[0].openness,0);assert.equal(d.state.switches[0].turns,2);
}
function fixture(type='normal'){d.load(index);d.state.enemies=[{id:99,x:10000,y:10000,r:18,type:'normal',alive:true}];d.state.inventory[type]=1;d.selectAmmo(type);d.shootAt(95,390);return d.state.bullets[0];}
for(const type of ['normal','fast','scatter']){const b=fixture(type),energy=b.energy;advance(.27);assert.ok(Math.abs(b.energy-(energy-.27))<1e-8,'Switch never recharges');b.x=95;b.y=390;b.spreading=false;advance(.002);assert.equal(d.state.switchHits,1,'Same projectile returning to the switch cannot toggle again this shot');}
for(const type of ['normal','fast','scatter','explosive']){const b=fixture(type);d.state.bullets=[b];const speed=Math.hypot(b.vx,b.vy);Object.assign(b,{x:230,y:335,vx:0,vy:-speed,spreading:false});advance(.07);assert.ok(b.vy>0,type+' reflects on reinforced shutter');assert.equal(d.state.explosions,0);assert.equal(d.state.switchHits,0);assert.equal(d.state.gates[0].open,false);assert.equal(d.state.terrainDestroyed,0);}
for(const type of ['normal','fast','scatter','explosive']){const b=fixture(type),s=d.state.switches[0],speed=Math.hypot(b.vx,b.vy);advance(.27);assert.equal(d.state.switchHits,1,type+' triggers once per shot');assert.equal(s.turns,1);assert.equal(d.state.score,0);assert.equal(d.state.terrainDestroyed,0);if(type==='explosive'){assert.equal(d.state.explosions,1);assert.equal(b.alive,false);}else{assert.equal(d.state.explosions,0);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-speed)<1e-8);}assert.equal(d.state.gates[0].open,true);}
// Close only into empty space: never spawn a barrier through a live projectile.
let b=fixture(),g=d.state.gates[0];Object.assign(g,{open:false,openness:1});Object.assign(b,{x:g.x+50,y:g.y+10,vx:0,vy:0});advance(.4);assert.equal(g.pending,true);assert.ok(g.openness>.5&&g.openness<.6);b.x=400;advance(.4);assert.equal(g.pending,false);assert.equal(g.openness,0);
// Gate extent agrees with the displayed slide; full opening removes collision.
assert.equal(d.gateBounds({...g,openness:1}),null);assert.equal(d.gateBounds({...g,openness:.5}).w,g.w/2);
// Blasts do not toggle a distant switch or destroy a reinforced shutter.
b=fixture('explosive');b.x=230;b.y=350;b.vx=0;b.vy=-800;d.state.enemies.push({id:100,x:230,y:330,r:18,type:'normal',alive:true});advance(.04);assert.equal(d.state.explosions,1);assert.equal(d.state.switchHits,0);assert.equal(d.state.gates[0].open,false);
for(const [id,key] of [['loadingScreen','hidden'],['levelPanel','open'],['settingsDialog','hidden'],['ammoPicker','hidden'],[null,'hidden']]){d.load(index);d.state.gates[0].open=true;const el=id?get(id):document,old=el[key];el[key]=key==='open'||!id?true:false;const before=JSON.stringify(d.state);d.step(.3);assert.equal(JSON.stringify(d.state),before);el[key]=old;}
console.log('PASS: clockwork switch/gate 8/16/32ms real quota route, reversible toggle, one trigger per shot across scatter, collision matches shutter width, no score/recharge, blast immunity, explosive consumed, safe closing, state persistence/reset/navigation and pause');
