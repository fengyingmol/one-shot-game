const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function createEngine(){const elements=new Map(),buttons=[];const get=id=>{if(!elements.has(id))elements.set(id,{value:'800',style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b);},setAttribute(){},getContext(){return {};}});return elements.get(id);};const sandbox={window:{},document:{getElementById:get,querySelectorAll(s){return buttons.filter(b=>'.'+b.className===s);},addEventListener(){},createElement(){return {dataset:{},style:{setProperty(){}},setAttribute(){},classList:{toggle(){}}};}},requestAnimationFrame(){},Math,console};vm.runInNewContext(fs.readFileSync('game.js','utf8'),sandbox);return {demo:sandbox.window.demo,get};}

const {demo:d,get}=createEngine(),plans=[[["fast", -17.4], ["explosive", 32], ["normal", 12]], [["fast", -18], ["scatter", 17], ["normal", 12]], [["normal", 0], ["fast", 0], ["normal", 15]], [["normal", 0], ["fast", 0], ["explosive", -20], ["normal", -22], ["scatter", 20]]],missAngles=[0,0,50,-36];
const formal=d.levels.map((l,i)=>l.group==='formal'?i:-1).filter(i=>i>=0);
assert.deepEqual(Array.from(formal),[11,12,13,15,16,17,19,20,21,22]);assert.equal(d.levels.length,26);
function fire(type,a,dt=.008){assert.equal(d.state.phase,'aim');assert.equal(d.selectAmmo(type),true);const o=d.stage.origin,r=a*Math.PI/180;d.shootAt(o.x+Math.sin(r)*400,o.y-Math.cos(r)*400);let n=0;while(['flying','settling'].includes(d.state.phase)&&n++<3000)d.step(dt);assert.ok(n<3000);}
function solve(index,plan,dt=.008){d.load(index);for(const [type,a]of plan){if(d.state.phase!=='aim')break;fire(type,a,dt)}return d.state.kills===d.state.enemies.length;}
function longest(values){let best=0,start=null,last=null;for(const value of values){if(last===null||Math.abs(value-last-.5)>1e-8)start=value;best=Math.max(best,value-start);last=value}return best;}
const report=[];
for(let n=0;n<4;n++){
 const index=19+n,plan=plans[n],level=d.levels[index];assert.equal(level.number,n+7);assert.equal(Object.values(level.ammo).reduce((s,v)=>s+v,0),plan.length+1);
 const scores=[];for(const dt of [.008,.016,.032]){assert.ok(solve(index,plan,dt),`${level.name} clears at ${dt}`);assert.equal(d.state.stars,3);assert.equal(d.state.inventory.normal,1);scores.push(d.state.score);assert.ok(solve(index,[['normal',missAngles[n]],...plan],dt),'An ordinary missed shot leaves a recovery route');}
 const windows=[];for(let k=0;k<plan.length;k++){const wins=[];for(let delta=-3;delta<=3;delta+=.5){const varied=plan.map(p=>[...p]);varied[k][1]+=delta;if([.008,.016,.032].every(dt=>solve(index,varied,dt)))wins.push(varied[k][1])}assert.ok(longest(wins)>=2,`${level.name} shot ${k+1} has continuous two-degree margin`);windows.push({shot:k+1,width:longest(wins),samples:wins});}
 for(const type of Object.keys(level.ammo))for(let a=-78;a<=78;a+=2){d.load(index);fire(type,a);assert.ok(d.state.kills<d.state.enemies.length,`${level.name} must not collapse to one ${type} shot at ${a}`);}
 d.load(index);while(d.state.phase==='aim'){const type=Object.keys(d.state.inventory).find(t=>d.state.inventory[t]>0);fire(type,0)}assert.ok(d.state.kills<d.state.enemies.length,'Repeated straight shots do not solve');
 solve(index,plan);assert.equal(d.comparison[index].bestStars,3);get('resultAction').onclick();assert.equal(d.state.index,n<3?index+1:index,'12 repeats and does not enter test levels');assert.equal(d.state.score,0);solve(index,plan);get('retry').onclick();assert.equal(d.state.shotsUsed,0);assert.equal(d.state.score,0);assert.ok(d.state.rotors.every(r=>r.turns===0));
 report.push({number:n+7,name:level.name,ammo:level.ammo,shots:plan.length,scores,windows});
}
// Isolate the introduction: piercing clears the wooden route and both helmets in one shot.
d.load(19);fire('fast',plans[0][0][1]);assert.equal(d.state.kills,4);assert.ok(d.state.walls.some(w=>w.type==='obstacle'&&!w.alive));assert.ok(d.state.enemies.filter(e=>e.type==='helmet').every(e=>!e.alive));
d.load(19);fire('normal',plans[0][0][1]);assert.ok(d.state.kills<4);assert.ok(d.state.walls.some(w=>w.type==='obstacle'&&w.alive));
// The consolidated stone gate needs the explosive tool, not a redundant barrel.
d.load(19);fire(...plans[0][0]);assert.ok(d.state.walls.find(w=>w.type==='brick').alive);fire(...plans[0][1]);assert.equal(d.state.walls.find(w=>w.type==='brick').alive,false);assert.equal(d.state.inventory.explosive,0);assert.equal(d.state.barrels.length,0);assert.equal(d.state.enemies.find(e=>e.type==='shield').alive,false);
// The spread handles a far group; a shield remains to make a distinct final decision.
d.load(20);fire(...plans[1][0]);fire(...plans[1][1]);assert.equal(d.state.enemies.filter(e=>e.alive).length,1);assert.equal(d.state.enemies.find(e=>e.alive).type,'shield');
// Two shots reuse the evolved rotor; retry restores its initial angle and both gates.
d.load(21);fire('normal',0);assert.equal(d.state.rotors[0].turns,1);const turned=d.state.rotors[0].angle;assert.equal(d.state.enemies.filter(e=>e.type==='helmet')[0].alive,true);fire('fast',0);assert.equal(d.state.rotors[0].turns,2);assert.notEqual(d.state.rotors[0].angle,turned);assert.ok(d.state.walls.filter(w=>w.type==='obstacle').every(w=>!w.alive));
// Final level contains every existing gameplay element, and the reference actively uses each.
const final=d.levels[22];assert.deepEqual(Object.keys(final.ammo).sort(),['explosive','fast','normal','scatter']);assert.deepEqual([...new Set(final.enemies.map(e=>e[2]||'normal'))].sort(),['bomb','helmet','normal','shield']);assert.deepEqual([...new Set(final.walls.map(w=>w.type))].sort(),['brick','iron','obstacle']);assert.ok(final.barrels.length&&final.rotors.length);
d.load(22);fire(...plans[3][0]);assert.equal(d.state.bombExplosions,1);assert.equal(d.state.barrelExplosions,1);assert.ok(!d.state.walls[2].alive);fire(...plans[3][1]);assert.ok(d.state.walls.filter(w=>w.type==='obstacle').every(w=>!w.alive));fire(...plans[3][2]);assert.ok(!d.state.walls[1].alive);
assert.ok(d.levels.filter(l=>l.group==='test').every((l,i)=>l.number===i+1));
console.log(JSON.stringify({checks:'PASS: formal 07–10 after consolidation, 26 internal layouts, per-ammo quotas, three-star and missed-shot recovery at 8/16/32ms, per-shot aiming margin, progression/retry/records, every gameplay element present and used in final level',report},null,2));
