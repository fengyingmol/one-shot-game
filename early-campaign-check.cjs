const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const els=new Map(),buttons=[];const get=id=>{if(!els.has(id))els.set(id,{style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b)},setAttribute(){},getContext(){return{}}});return els.get(id)};
const box={window:{},document:{getElementById:get,querySelectorAll(s){return buttons.filter(b=>'.'+b.className===s)},addEventListener(){},createElement(){return{dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}}}},requestAnimationFrame(){},console,Math};vm.runInNewContext(fs.readFileSync('game.js','utf8'),box);const d=box.window.demo;
const indices=d.levels.map((l,i)=>l.group==='formal'?i:-1).filter(i=>i>=0).slice(0,3),plans=[[45],[44,38],[-53.5,50.5]],budgets=[2,3,3];
assert.deepEqual(Array.from(indices),[11,12,13]);assert.equal(d.state.index,11);
function fire(a,dt=.008){assert.equal(d.state.phase,'aim');const o=d.stage.origin,r=a*Math.PI/180;d.shootAt(o.x+Math.sin(r)*400,o.y-Math.cos(r)*400);for(let n=0;n<2500&&['flying','settling'].includes(d.state.phase);n++)d.step(dt);assert.ok(['aim','result'].includes(d.state.phase));}
function solve(index,plan,dt=.008){d.load(index);for(const a of plan)if(d.state.phase==='aim')fire(a,dt);return d.state.kills===d.state.enemies.length;}
function ranges(values){const result=[];for(const a of values){const last=result.at(-1);if(last&&Math.abs(a-last[1]-.5)<1e-8)last[1]=a;else result.push([a,a]);}return result;}
const report=[];
for(let n=0;n<indices.length;n++){
 const i=indices[n];assert.equal(d.levels[i].ammo.normal,budgets[n]);assert.ok(solve(i,plans[n]));assert.equal(d.state.shotsUsed,plans[n].length);assert.ok(solve(i,[0,...plans[n]]),'One wasted straight shot can be recovered');
 for(const dt of [.008,.016,.032])assert.ok(solve(i,plans[n],dt),'Reference survives browser frame sizes');
 assert.equal(solve(i,Array(budgets[n]).fill(0)),false,'Repeated straight shots must not solve the level');
 const wins=[];let singleBest=0;
 for(let a=-80;a<=80;a+=.5){d.load(i);fire(a);singleBest=Math.max(singleBest,d.state.kills);if(d.state.kills===d.state.enemies.length)wins.push(a);}
 const windows=ranges(wins);
 if(n===0)assert.ok(windows.some(([a,b])=>b-a>=3),'Opening ricochet has a usable aiming window');
 if(n>0){if(n===2)assert.equal(singleBest,2,'Divider prevents a single-shot sweep');const doubles=[];for(let a=-80;a<=80;a+=.5)if(solve(i,[a,plans[n][1]]))doubles.push(a);const twoShotWindows=ranges(doubles);assert.ok(twoShotWindows.some(([a,b])=>b-a>=2),'Two-shot routes must not depend on a single exact angle');assert.ok(solve(i,[...plans[n]].reverse()),'Either route may go first');report.push({level:n+1,oneShotClearWindows:windows,twoShotAngleWindows:twoShotWindows,ammo:budgets[n]});}
 if(n===0)report.push({level:n+1,oneShotClearWindows:windows,ammo:budgets[n]});
}
solve(11,[45]);get('resultAction').onclick();assert.equal(d.state.index,12);solve(12,[44,38]);get('resultAction').onclick();assert.equal(d.state.index,13);solve(13,[-53.5,50.5]);assert.equal(get('resultAction').textContent,'下一关 →');get('resultAction').onclick();assert.equal(d.state.index,15,'Opening trio skips retired duplicate and continues into merged formal 04');
console.log(JSON.stringify({checks:'PASS: progressive 1/2/2-shot routes, one spare shot, recovery, real ammo, robust angles, 8/16/32ms physics and formal-only progression',report},null,2));
