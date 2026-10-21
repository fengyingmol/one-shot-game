const assert=require('node:assert/strict');
const {createEngine}=require('./garden-campaign-tools.cjs');
const {indices,plans,challengePlans}=require('./garden-campaign-plans.cjs');
const {d,get,fire,solve,advance}=createEngine();
const steps=[.008,.016,.032],report=[];
function longest(values){let first=0,best=0;for(let i=0;i<values.length;i++){if(!i||values[i]-values[i-1]>.501)first=values[i];best=Math.max(best,values[i]-first);}return best;}
assert.equal(d.levels.length,37);assert.equal(d.levels.filter(l=>l.group==='formal').length,18);
assert.equal(d.levels.filter(l=>l.group==='test').length,6);
assert.deepEqual(Array.from(d.levels.map((l,i)=>l.group==='test'?i:-1).filter(i=>i>=0)),[27,28,29,30,31,32]);
for(let n=0;n<indices.length;n++){
 const index=indices[n],level=d.levels[index],plan=plans[n],scores=[];
 assert.equal(level.number,n+15);assert.equal(level.group,'formal');
 assert.equal(Object.values(level.ammo).reduce((a,b)=>a+b,0),plan.length+1,'Keep one spare round');
 for(const dt of steps){
  assert.ok(solve(index,plan,dt),`${level.name} reference at ${dt}`);
  assert.equal(d.state.stars,3);assert.equal(d.state.inventory.normal,1);
  assert.equal(d.state.challengeBonus,0,'Three stars never require a challenge');scores.push(d.state.score);
  if(challengePlans[n]){assert.ok(solve(index,challengePlans[n],dt),'Challenge and clear coexist within quota');assert.equal(d.state.challenge.done,true);assert.equal(d.state.challengeBonus,level.challenge.reward);assert.equal(d.state.stars,3);}
 }
 const margins=plan.map((_,k)=>{const wins=[];for(let delta=-3;delta<=3;delta+=.5){const p=plan.map(v=>[...v]);p[k][1]+=delta;if(steps.every(dt=>solve(index,p,dt)))wins.push(delta);}const width=longest(wins);assert.ok(width>=2,`${level.name} shot ${k+1}: continuous angle margin ${width}`);return width;});
 // Preserve rare, skillful piercing ricochets in the moving arena, rather than
 // forcing extra shots. Ordinary straight play must still require planning.
 const efficient=[];
 for(const type of Object.keys(level.ammo))for(const wait of level.movers?.length?[0,1.6]:[0])for(let angle=-78;angle<=78;angle+=2){if(solve(index,[[type,angle,wait]])){efficient.push({type,angle,wait});assert.ok(index===34&&type==='fast','Only the moving arena permits a high-skill piercing shortcut');}}
 assert.ok(efficient.length<=8,'Shortcut must not occupy a broad part of the scan');
 d.load(index);while(d.state.phase==='aim'){const type=Object.keys(d.state.inventory).find(t=>d.state.inventory[t]>0);fire(type,0);}assert.ok(d.state.kills<d.state.enemies.length,'Straight repeated shooting cannot solve');
 assert.ok(solve(index,plan));get('resultAction').onclick();assert.equal(d.state.index,n<3?indices[n+1]:index,'Formal progression skips the test group and final repeats');
 assert.ok(solve(index,plan));const best=d.comparison[index].bestStars;get('retry').onclick();assert.equal(d.state.score,0);assert.equal(d.state.shotsUsed,0);assert.equal(d.state.motionTime,0);assert.equal(d.state.challengeBonus,0);assert.ok(d.state.props.every(p=>!p.down));assert.ok(d.state.gates.every(g=>!g.open&&g.openness===0));assert.equal(d.comparison[index].bestStars,best);
 report.push({number:level.number,name:level.name,ammo:level.ammo,shots:plan.length,scores,angleWindows:margins,challenge:level.challenge?.reward||0,efficientRoutes:efficient.length});
}
// New elements actually participate in the reference routes.
d.load(34);d.shootAt(d.stage.origin.x,80);advance(.35);assert.ok(d.state.moverHits>0,'Immediate central shot sees moving barrier');
d.load(35);fire(...plans[2][0]);assert.equal(d.state.switchHits,1);assert.ok(d.state.gates[0].open);assert.equal(d.state.enemies.filter(e=>e.x<230&&!e.alive).length,0);fire(...plans[2][1]);assert.ok(d.state.enemies.filter(e=>e.x<230).every(e=>!e.alive),'Open gate enables enclosure clear');
solve(36,plans[3]);assert.ok(d.state.switchHits>0);assert.equal(d.state.barrelExplosions,2);assert.equal(d.state.walls.find(w=>w.type==='brick').alive,false);assert.ok(d.state.walls.some(w=>w.type==='obstacle'&&!w.alive));
// The moving phase has a forgiving time window, not a frame-perfect release.
for(const wait of [2.75,3,3.25])for(const dt of steps){const p=plans[3].map(v=>[...v]);p[1][2]=wait;assert.ok(solve(36,p,dt),'Half-second timing window');}
// Resetting a challenge never farms extra points; fixtures already cover per-shot dedup.
for(const index of [33,35,36]){const n=indices.indexOf(index);solve(index,[challengePlans[n][0]]);assert.equal(d.state.challenge.done,true);const bonus=d.state.challengeBonus;fire('normal',0);assert.equal(d.state.challengeBonus,bonus);get('retry').onclick();assert.equal(d.state.challengeBonus,0);assert.equal(d.state.challenge.done,false);}
console.log(JSON.stringify({checks:'PASS: formal15–18 real quotas, optional challenges and three stars, 8/16/32ms, broad aiming/timing margins, bounded high-skill shortcuts/no straight collapse, active new mechanisms, navigation/records/retry',report},null,2));
