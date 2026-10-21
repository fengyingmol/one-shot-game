const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const {indices,plans,misses}=require('./advanced-campaign-plans.cjs');
const elements=new Map(),buttons=[],get=id=>{if(!elements.has(id))elements.set(id,{value:'800',style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b)},setAttribute(){},getContext(){return{}}});return elements.get(id)};
const sandbox={window:{},document:{getElementById:get,querySelectorAll(s){return buttons.filter(b=>'.'+b.className===s)},addEventListener(){},createElement(){return{dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}}}},requestAnimationFrame(){},Math,console};vm.runInNewContext(fs.readFileSync('game.js','utf8'),sandbox);const d=sandbox.window.demo;
const dts=[.008,.016,.032];
function fire(type,angle,dt=.008){assert.equal(d.state.phase,'aim');assert.ok(d.selectAmmo(type));const r=angle*Math.PI/180,o=d.stage.origin,before=d.state.inventory[type];d.shootAt(o.x+Math.sin(r)*400,o.y-Math.cos(r)*400);assert.equal(d.state.inventory[type],before-1);let n=0;while(['flying','settling'].includes(d.state.phase)&&n++<3000)d.step(dt);assert.ok(n<3000);}
function solve(index,plan,dt=.008){d.load(index);for(const p of plan){if(d.state.phase!=='aim')break;fire(...p,dt);}return d.state.kills===d.state.enemies.length;}
function longest(values){let result=0,start=0;for(let n=0;n<values.length;n++){if(!n||values[n]-values[n-1]>.501)start=values[n];result=Math.max(result,values[n]-start)}return result;}
assert.equal(d.levels.length,37);assert.equal(d.levels.filter(l=>l.group==='formal').length,18);assert.deepEqual(Array.from(d.levels.map((l,i)=>l.group==='test'?i:-1).filter(i=>i>=0)),[27,28,29,30,31,32]);
const report=[];
for(let n=0;n<4;n++){
 const index=indices[n],plan=plans[n],level=d.levels[index],scores=[];assert.equal(level.number,n+11);assert.equal(level.group,'formal');assert.equal(Object.values(level.ammo).reduce((a,b)=>a+b,0),plan.length+1);
 for(const dt of dts){assert.ok(solve(index,plan,dt),`${level.name} at ${dt}`);assert.equal(d.state.stars,3);assert.equal(d.state.inventory.normal,1);scores.push(d.state.score);assert.ok(solve(index,[['normal',misses[n]],...plan],dt),'A spare ordinary round permits recovery');}
 const windows=[];for(let k=0;k<plan.length;k++){const wins=[];for(let delta=-4;delta<=4;delta+=.5){const p=plan.map(v=>[...v]);p[k][1]+=delta;if(dts.every(dt=>solve(index,p,dt)))wins.push(p[k][1]);}assert.ok(longest(wins)>=2,`${level.name} shot ${k+1} must have two degrees of continuous margin`);windows.push(longest(wins));}
 const singles=[];for(const type of Object.keys(level.ammo))for(let a=-78;a<=78;a+=2){if(solve(index,[[type,a]]))singles.push([type,a]);}
 assert.equal(singles.length,0,`${level.name} is not a single-shot demonstration`);
 d.load(index);while(d.state.phase==='aim'){const type=Object.keys(d.state.inventory).find(t=>d.state.inventory[t]>0);fire(type,0);}assert.ok(d.state.kills<d.state.enemies.length,'Repeated straight firing cannot solve');
 solve(index,plan);const best=d.comparison[index].bestStars;assert.equal(best,3);get('resultAction').onclick();assert.equal(d.state.index,n<3?index+1:33,'11–14 continue without entering test group');assert.equal(d.state.score,0);
 solve(index,plan);const initial=JSON.stringify({walls:level.walls,enemies:level.enemies,ammo:level.ammo});get('retry').onclick();assert.equal(d.state.shotsUsed,0);assert.equal(d.state.score,0);assert.equal(d.state.terrainDestroyed,0);assert.equal(d.state.rotorTurns,0);assert.ok(d.state.enemies.every(e=>e.alive&&e.hp===(e.type==='helmet'?2:1)));assert.ok(d.state.walls.every(w=>w.alive));assert.equal(d.comparison[index].bestStars,best);assert.equal(JSON.stringify({walls:level.walls,enemies:level.enemies,ammo:level.ammo}),initial);
 report.push({number:n+11,name:level.name,ammo:level.ammo,shots:plan.length,scores,angleWindows:windows});
}
// Reference mechanisms must actually participate, not merely decorate the board.
d.load(23);fire(...plans[0][0]);assert.equal(d.state.kills,3);assert.equal(d.state.terrainDestroyed,1);assert.ok(d.state.enemies.filter(e=>e.type==='helmet').every(e=>!e.alive));
d.load(24);fire(...plans[1][0]);assert.equal(d.state.kills,4);assert.equal(d.state.barrelExplosions,2);assert.ok(d.state.walls.find(w=>w.type==='brick').alive===false);assert.equal(d.state.inventory.explosive,0);
d.load(25);fire(...plans[2][0]);assert.equal(d.state.rotorTurns,1);assert.equal(d.state.kills,3);assert.equal(d.state.enemies.find(e=>e.type==='helmet').hp,1);fire(...plans[2][1]);assert.equal(d.state.rotorTurns,2);assert.equal(d.state.terrainDestroyed,1);assert.equal(d.state.kills,4);fire(...plans[2][2]);assert.equal(d.state.kills,7);
d.load(26);fire(...plans[3][0]);assert.equal(d.state.kills,4);fire(...plans[3][1]);assert.equal(d.state.barrelExplosions,1);assert.equal(d.state.terrainDestroyed,3);assert.ok(d.state.rotorTurns>=1);fire(...plans[3][2]);assert.equal(d.state.enemies.find(e=>e.type==='shield').alive,false);assert.equal(d.state.kills,8);
assert.ok(solve(22,[['normal',0],['fast',0],['explosive',-20],['normal',-22],['scatter',20]]));get('resultAction').onclick();assert.equal(d.state.index,23,'Formal10 advances into new11');
console.log(JSON.stringify({checks:'PASS: formal11–14, allocations, three-star references and spare-round recovery at 8/16/32ms, two-degree margins, distinct mechanisms, no straight/one-shot collapse, retry, per-level records and 10→11→14 progression',report},null,2));
