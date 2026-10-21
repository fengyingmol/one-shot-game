const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),buttons=[];
const get=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b);},setAttribute(){},getContext(){return {};}});return elements.get(id);};
const document={hidden:false,getElementById:get,querySelectorAll:s=>buttons.filter(b=>'.'+b.className===s),addEventListener(){},createElement:()=>({dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}})};
const sandbox={window:{},document,requestAnimationFrame(){},Math,console};vm.runInNewContext(fs.readFileSync('game.js','utf8'),sandbox);const d=sandbox.window.demo,index=d.levels.findIndex(l=>l.challenge);
const advance=(time,dt=.008)=>{for(let t=0;t<time-1e-10;t+=dt)d.step(Math.min(dt,time-t));};
const settle=dt=>{let n=0;while(['flying','settling'].includes(d.state.phase)&&n++<4000)d.step(dt);assert.ok(n<4000);};
function shot(a,dt=.008){const o=d.stage.origin,r=a*Math.PI/180;d.shootAt(o.x+Math.sin(r)*400,o.y-Math.cos(r)*400);settle(dt);}
assert.equal(index,32);assert.equal(d.levels[index].number,6);assert.equal(d.levels.filter(l=>l.challenge).length,4);
for(const dt of [.008,.016,.032]){
 d.load(index);assert.equal(get('challengePanel').open,false);shot(-25,dt);assert.equal(d.state.challenge.done,true);assert.equal(d.state.challengeBonus,30);assert.equal(d.state.score,30);assert.equal(d.state.kills,0);assert.equal(d.state.hitCount,0);assert.equal(d.state.comboCount,0);assert.equal(d.state.phase,'aim');assert.equal(d.state.props.filter(p=>p.type==='bottle'&&p.down).length,3);
 const before=d.state.challengeBonus;shot(-25,dt);assert.equal(d.state.challengeBonus,before,'Reward cannot be farmed');shot(23.4,dt);assert.equal(d.state.kills,3);assert.equal(d.state.score,95);assert.ok(get('resultBreakdown').textContent.includes('挑战奖励 30'));assert.equal(d.comparison[index].lastScore,95);
 get('retry').onclick();assert.equal(d.state.challengeBonus,0);assert.equal(d.state.props.some(p=>p.down),false);assert.equal(d.state.challenge.done,false);assert.equal(get('challengePanel').open,false);
 // Challenge is genuinely optional: clear without touching bottles.
 shot(23.4,dt);assert.equal(d.state.kills,3);assert.equal(d.state.challenge.done,false);assert.equal(d.state.score,105);assert.equal(d.state.stars,3);assert.ok(d.state.props.some(p=>p.type==='pinwheel'&&Number.isFinite(p.hitAt)));assert.ok(d.state.props.some(p=>p.type==='dandelion'&&p.down));
}
// Completion remains awarded on a failed clear, but never grants success/stars.
d.load(index);d.state.inventory.normal=1;shot(-25);assert.equal(d.state.phase,'result');assert.equal(d.state.kills,0);assert.equal(d.state.challengeBonus,30);assert.equal(d.state.score,30);assert.equal(d.state.stars,0);assert.equal(d.comparison[index].lastScore,30);
function fixture(type='normal'){d.load(index);d.state.enemies=[{id:99,x:10000,y:10000,r:18,type:'normal',alive:true}];d.state.inventory[type]=1;d.selectAmmo(type);d.shootAt(240,30);const b=d.state.bullets[0];d.state.bullets=[b];b.spreading=false;return b;}
for(const type of ['normal','fast','scatter','explosive']){
 const b=fixture(type),p=d.state.props[0],speed=Math.hypot(b.vx,b.vy),energy=b.energy;Object.assign(b,{x:p.x,y:p.y+30,vx:0,vy:-speed});advance(.06);assert.equal(p.down,true);assert.equal(d.state.bounces,0);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-speed)<1e-8);assert.ok(Math.abs(b.energy-(energy-.06))<1e-8);assert.equal(d.state.hitCount,0);assert.equal(d.state.score,0);assert.equal(d.state.explosions,0);assert.equal(b.alive,true);
}
// Hitting all bottles in different shots is not a one-shot achievement.
fixture();for(let n=0;n<3;n++){const p=d.state.props[n],b=d.state.bullets[0];d.state.shotsUsed=n+1;Object.assign(b,{x:p.x,y:p.y+1,vx:0,vy:-800});d.step(.002);}assert.equal(d.state.challenge.done,false);assert.equal(d.state.challenge.progress,1);assert.equal(d.state.challengeBonus,0);
// Non-challenge props are free reactions; windmill motion settles and can be retriggered.
let b=fixture(),p=d.state.props.find(p=>p.type==='pinwheel');Object.assign(b,{x:p.x,y:p.y+1,vx:0,vy:-800});d.step(.002);assert.equal(d.state.score,0);assert.ok(d.propSpin(p,p.hitAt+1)>d.propSpin(p,p.hitAt+.2));assert.equal(d.propSpin(p,p.hitAt+3),d.propSpin(p,p.hitAt+4));
for(const [id,key] of [['loadingScreen','hidden'],['levelPanel','open'],['settingsDialog','hidden'],['ammoPicker','hidden'],[null,'hidden']]){fixture();const el=id?get(id):document,old=el[key];el[key]=key==='open'||!id?true:false;const before=JSON.stringify(d.state);d.step(.3);assert.equal(JSON.stringify(d.state),before);el[key]=old;}
d.load(11);assert.equal(get('challengePanel').hidden,true);assert.equal(d.state.props.length,0);
console.log('PASS: optional props/challenge at 8/16/32ms, 30-point reward once without clear, failure keeps bonus but no stars, successful/no-challenge routes, all-ammo nonblocking/no energy/score/combo changes, per-shot objective, windmill settling, reset, background/menu pause and no HUD on ordinary levels');
