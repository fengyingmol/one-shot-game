const assert=require('node:assert/strict');
async function main(){
 const T=await import('./3d-lab/vendor/three.module.js'),{createPlayerModel}=await import('./player-model.js');
 const scene=new T.Scene(),m=createPlayerModel(scene),camera=new T.OrthographicCamera(-1.9,1.9,1.9,-1.9,.1,30);
 camera.position.set(0,6,4.2);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 const v=new T.Vector3(),b=new T.Vector3(),groundScale=5/Math.hypot(5,4.2),feet=JSON.stringify(m.diagnostics.feet),anchor=m.muzzleBase.clone().project(camera);
 const objects=[];scene.traverse(o=>objects.push(o));const geometry=new Set(objects.filter(o=>o.isMesh).map(o=>o.geometry)),materials=new Set(objects.filter(o=>o.isMesh).map(o=>o.material));
 let maxError=0,minReach=Infinity,maxRecoil=0;
 for(let degree=-89;degree<=89;degree++)for(const kick of [0,.5,1])for(const time of [0,1,2]){
  const a=degree*Math.PI/180,yaw=Math.atan2(-Math.sin(a)*groundScale,Math.cos(a));m.setAim(yaw,{kick,time});scene.updateMatrixWorld(true);const d=m.diagnostics;
  assert.equal(d.bodyYaw,0);assert.equal(d.torsoPitch,0);assert.equal(d.torsoRoll,0);assert.equal(JSON.stringify(d.feet),feet);assert.ok(Math.abs(d.torsoYaw)<.421&&Math.abs(d.headYaw)<=1.05);
  assert.ok(d.armError<1e-9&&d.handGap<1e-9&&d.reachMargin>.02,'Reachable rigid arms across full aim/recoil range');
  maxError=Math.max(maxError,d.armError);minReach=Math.min(minReach,d.reachMargin);
  m.gun.localToWorld(v.copy(m.muzzleLocal));m.gun.localToWorld(b.copy(m.barrelBackLocal));v.project(camera);b.project(camera);
  const dx=v.x-b.x,dy=-(v.y-b.y),len=Math.hypot(dx,dy);assert.ok(Math.abs(dx/len-Math.sin(a))<1e-9&&Math.abs(dy/len+Math.cos(a))<1e-9);
  const displacement=Math.hypot(v.x-anchor.x,v.y-anchor.y)*192*.34;maxRecoil=Math.max(maxRecoil,displacement);if(!kick)assert.ok(displacement<1e-9,'No aiming foot slide or muzzle drift');else assert.ok(displacement<1.3);
 }
 assert.equal(m.diagnostics.hairLocks,6);m.setAim(1,{kick:1,time:20,reduced:true});assert.equal(m.diagnostics.kick,0);
 const after=[];scene.traverse(o=>after.push(o));assert.equal(after.length,objects.length);assert.deepEqual(new Set(after.filter(o=>o.isMesh).map(o=>o.geometry)),geometry);assert.deepEqual(new Set(after.filter(o=>o.isMesh).map(o=>o.material)),materials);
 const meshes=objects.filter(o=>o.isMesh);console.log(JSON.stringify({result:'PASS',poses:179*3*3,meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),geometries:geometry.size,materials:materials.size,maxArmError:maxError,minReachMargin:minReach,maxRecoilWorldPixels:maxRecoil,fixedFeet:true,projectedMuzzleAligned:true}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
