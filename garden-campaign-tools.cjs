// Deterministic isolated physics harness, never used by the runtime game.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function createEngine(){
 const elements=new Map(),buttons=[];
 const get=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{toggle(){}},addEventListener(){},append(b){buttons.push(b)},setAttribute(){},getContext(){return {}}});return elements.get(id)};
 const sandbox={window:{},document:{hidden:false,getElementById:get,querySelectorAll:s=>buttons.filter(b=>'.'+b.className===s),addEventListener(){},createElement:()=>({dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}})},requestAnimationFrame(){},Math,console};
 vm.runInNewContext(fs.readFileSync(require.resolve('./game.js'),'utf8'),sandbox);
 const d=sandbox.window.demo;
 function advance(seconds,dt=.008){for(let t=0;t<seconds-1e-9;t+=dt)d.step(Math.min(dt,seconds-t));}
 function fire(type,angle,wait=0,dt=.008){
  assert.equal(d.state.phase,'aim');advance(wait,dt);assert.ok(d.selectAmmo(type));
  const o=d.stage.origin,a=angle*Math.PI/180,before=d.state.inventory[type];
  d.shootAt(o.x+Math.sin(a)*400,o.y-Math.cos(a)*400);
  assert.equal(d.state.inventory[type],before-1);
  let n=0;while(['flying','settling'].includes(d.state.phase)&&n++<4000)d.step(dt);
  assert.ok(n<4000,'Shot must settle');
 }
 function solve(index,plan,dt=.008){d.load(index);for(const [type,angle,wait=0]of plan){if(d.state.phase!=='aim')break;fire(type,angle,wait,dt);}return d.state.kills===d.state.enemies.length;}
 return {d,get,advance,fire,solve};
}
module.exports={createEngine};
