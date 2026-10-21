const assert=require('node:assert/strict');
const {createEngine}=require('./garden-campaign-tools.cjs');
const {d,get}=createEngine();
d.load(0);d.state.enemies=[{id:999,x:-10000,y:-10000,r:18,hp:1,alive:true,type:'normal'}];d.state.inventory.normal=2;
d.shootAt(d.stage.origin.x,d.stage.origin.y-100);
for(let n=1;n<=7;n++){
 const b=d.state.bullets[0];d.state.enemies.push({id:n,x:b.x,y:b.y-12,r:18,hp:1,alive:true,type:'normal'});d.step(.004);
 assert.equal(d.state.comboCount,n);
 assert.equal(get('comboFeedback').hidden,n<=3);
 if(n>3)assert.equal(get('comboFeedbackCount').textContent,String(n));
}
const score=d.state.score;assert.equal(score,175,'Presentation does not change existing combo score');
get('retry').onclick();assert.equal(get('comboFeedback').hidden,true);assert.equal(d.state.comboCount,0);
d.load(0);assert.equal(get('comboFeedback').hidden,true);
console.log('PASS: combo feedback hidden through 3 hits, updates at 4–7, original scoring and retry/load cleanup');
