const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map(),buttons=[];
const get=id=>{if(!elements.has(id))elements.set(id,{value:'800',style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b)},setAttribute(){},getContext(){return {}}});return elements.get(id)};
const sandbox={window:{},document:{getElementById:get,querySelectorAll(s){return buttons.filter(b=>'.'+b.className===s)},addEventListener(){},createElement(){return{dataset:{},style:{setProperty(){}},setAttribute(){},classList:{toggle(){}}}}},requestAnimationFrame(){},Math,console};
vm.runInNewContext(fs.readFileSync('game.js','utf8'),sandbox);const demo=sandbox.window.demo,index=demo.levels.findIndex(l=>l.group==='test'&&l.rotors?.length);
function settle(){let n=0;while(['flying','settling'].includes(demo.state.phase)&&n++<2500)demo.step(.008);assert.ok(n<2500)}
demo.load(index);demo.shootAt(demo.stage.origin.x,50);settle();assert.equal(demo.state.kills,1);assert.equal(demo.state.rotors[0].turns,1);assert.equal(demo.state.rotors[0].angle,Math.PI/4);assert.equal(demo.state.inventory.normal,1);
demo.shootAt(demo.stage.origin.x,50);settle();assert.equal(demo.state.kills,2);assert.equal(demo.state.rotors[0].turns,2);assert.equal(demo.state.phase,'result');get('retry').onclick();assert.equal(demo.state.rotors[0].angle,-Math.PI/4);assert.equal(demo.state.rotorTurns,0);
function fixture(type='normal',angle=-Math.PI/4){demo.load(index);demo.state.inventory={normal:0,fast:0,explosive:0,scatter:0};demo.state.inventory[type]=1;demo.selectAmmo(type);demo.state.enemies=[{x:10000,y:10000,id:99,r:18,type:'normal',alive:true}];demo.shootAt(300,50);const b=demo.state.bullets[0];demo.state.bullets=[b];b.x=300;b.y=420;b.vx=0;b.vy=-800;b.startSpread=b.targetSpread=b.spreadAngle=0;const g=demo.state.rotors[0];g.x=300;g.y=400;g.angle=angle;return{b,g};}
for(const type of ['normal','fast','explosive','scatter']){
 const {b,g}=fixture(type),energy=b.energy;for(let i=0;i<4&&!g.turns;i++)demo.step(.008);
 assert.equal(g.turns,1);assert.ok(b.vx>799&&Math.abs(b.vy)<1e-6);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-800)<1e-6);assert.ok(b.energy<energy);assert.equal(demo.state.score,0);assert.equal(demo.state.kills,0);assert.equal(demo.state.explosions,0);assert.equal(b.spreading,false);assert.equal(b.alive,true);
 for(let i=0;i<3;i++)demo.step(.008);assert.equal(g.turns,1,'No continuous-contact repeat or immediate swept-beam bounce');
 b.hitRotors.clear();b.x=300;b.y=420;b.vx=0;b.vy=-800;g.turnedAt=demo.state.time-.2;for(let i=0;i<4&&b.vy<0;i++)demo.step(.008);assert.equal(g.turns,1,'One bullet can turn each rotor only once');assert.ok(b.vx<-799,'Returning bullet still reflects on new angle');
}
const {g}=fixture('normal',0);const straight=demo.rotorRay(g,300,430,0,-1);assert.ok(Math.abs(straight.t-20)<1e-8);assert.equal(straight.ny,1);const end=demo.rotorRay(g,200,400,1,0);assert.ok(Math.abs(end.t-34)<1e-8);assert.equal(end.nx,-1);assert.equal(demo.rotorRay(g,200,411,1,0),null);assert.equal(demo.rotorContact(g,300,408).distance,8);
// Two distinct pellets in the same instant reflect, but do not flip back and forth.
const f=fixture('scatter'),b=f.b;demo.step(.008);const p={...b,x:300,y:420,vx:0,vy:-800,hitRotors:new Set(),turnedRotors:new Set()};demo.state.bullets=[p];for(let i=0;i<4&&p.vy<0;i++)demo.step(.008);assert.equal(f.g.turns,1);assert.ok(p.vx<0);
p.hitRotors.clear();p.x=300;p.y=420;p.vx=0;p.vy=-800;f.g.turnedAt=demo.state.time-.2;demo.step(.008);assert.equal(f.g.turns,2,'Independent pellet can turn after cooldown');
// A near miss must not trigger the beam's enclosing square.
const miss=fixture();miss.b.x=350;miss.b.y=430;miss.b.vx=0;miss.b.vy=-800;demo.step(.008);assert.equal(miss.g.turns,0);assert.equal(demo.state.bounces,0);
const cap=fixture('normal',0);cap.b.x=230;cap.b.y=400;cap.b.vx=800;cap.b.vy=0;demo.step(.008);assert.equal(cap.g.turns,1);assert.ok(cap.b.vx<-799,'Rounded end reflects along its normal');
const edgeMiss=fixture('normal',0);edgeMiss.b.x=240;edgeMiss.b.y=411;edgeMiss.b.vx=800;edgeMiss.b.vy=0;for(let n=0;n<4;n++)demo.step(.008);assert.equal(edgeMiss.g.turns,0,'Near the rounded corner but outside the true capsule');
const blast=fixture('explosive');blast.b.x=300;blast.b.y=480;demo.state.enemies.push({x:300,y:460,r:18,id:100,type:'normal',alive:true});for(let n=0;n<4&&blast.b.alive;n++)demo.step(.008);assert.equal(blast.b.alive,false);assert.equal(demo.state.explosions,1);assert.equal(blast.g.turns,0,'Nearby explosion does not turn or destroy the rotor');assert.equal(demo.state.rotors.length,1);
console.log('PASS: rotor two-shot route, persistent angle/reset, old-face reflection then 90-degree turn, one turn per bullet, contact/swept-region deduplication, cooldown, all ammo, no score/recharge, exact capsule aim and outside misses');
