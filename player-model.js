import * as THREE from './3d-lab/vendor/three.module.js';

// Appearance only: planted feet, independently aimed toy gun, fixed-length IK arms.
export function createPlayerModel(scene){
 const mat=(color,roughness=.72)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
 const skin=mat(0xf7c18f),yellow=mat(0xffbe32),cuff=mat(0xeda625),hair=mat(0x503325,.8),blue=mat(0x258bc8),gunBlue=mat(0x179bdc,.38),sole=mat(0x79766b),white=mat(0xfff4da),ink=mat(0x302c2b),orange=mat(0xffa02c,.46);
 const sphere=new THREE.SphereGeometry(1,24,16);
 function mesh(geo,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;}
 function ball(parent,material,x,y,z,sx,sy=sx,sz=sx){const m=mesh(sphere,material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
 function cylinder(parent,material,r,length,z){const m=mesh(new THREE.CylinderGeometry(r,r,length,20),material,parent,0,0,z);m.rotation.x=Math.PI/2;return m;}
 const actor=new THREE.Group();scene.add(actor);
 const upper=new THREE.Group();actor.add(upper);
 const headRig=new THREE.Group();upper.add(headRig);headRig.position.z=.20;
 const body=mesh(new THREE.LatheGeometry([new THREE.Vector2(0,.70),new THREE.Vector2(.23,.70),new THREE.Vector2(.31,.75),new THREE.Vector2(.34,.91),new THREE.Vector2(.32,1.15),new THREE.Vector2(.27,1.31),new THREE.Vector2(.18,1.36),new THREE.Vector2(0,1.36)],28),yellow,upper);body.scale.z=.9;
 ball(upper,cuff,0,.755,0,.30,.055,.26);
 ball(upper,cuff,0,1.29,.21,.29,.21,.17);
 const hood=ball(upper,yellow,0,1.27,.25,.31,.20,.18);hood.rotation.x=-.24;
 ball(upper,yellow,0,1.37,.20,.26,.075,.16);
 const shoes=[];
 for(const side of [-1,1]){
  const leg=ball(actor,blue,side*.21,.47,0,.165,.28,.17);leg.rotation.z=side*.045;
  shoes.push(ball(actor,sole,side*.23,.075,-.075,.205,.06,.285));
  ball(actor,white,side*.23,.18,-.08,.205,.145,.28);
  ball(actor,white,side*.23,.26,-.06,.17,.07,.20);
 }
 ball(headRig,skin,0,1.75,0,.47,.46,.435);
 for(const side of [-1,1]){
  ball(headRig,skin,side*.45,1.69,0,.082,.105,.075);
  ball(headRig,ink,side*.15,1.75,-.415,.037,.055,.024);
  const brow=ball(headRig,hair,side*.15,1.87,-.404,.074,.023,.026);brow.rotation.z=side*.12;
 }
 ball(headRig,skin,0,1.64,-.435,.055,.055,.042);
 const smile=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.07,1.57,-.407),new THREE.Vector3(0,1.53,-.44),new THREE.Vector3(.07,1.57,-.407));
 mesh(new THREE.TubeGeometry(smile,10,.009,6,false),ink,headRig);
 mesh(new THREE.SphereGeometry(.49,28,18,0,Math.PI*2,0,1.55),hair,headRig,0,1.77,.015);
 ball(headRig,hair,0,1.77,.25,.42,.31,.235);
 // Broad sculpted hair masses replace the old 22 small tufts.
 const locks=[[-.23,2.10,.10,.26,.085,.17,-.45],[-.05,2.19,.035,.27,.09,.16,-.42],[.15,2.13,-.11,.27,.085,.17,-.4],[-.18,1.99,-.28,.28,.085,.12,-.35],[.20,1.97,-.27,.22,.075,.13,-.5],[.30,1.88,.015,.10,.17,.15,-.15]];
 for(const [x,y,z,sx,sy,sz,angle] of locks){const lock=ball(headRig,hair,x,y,z,sx,sy,sz);lock.rotation.z=angle;lock.rotation.y=-.24;}
 const gun=new THREE.Group();actor.add(gun);
 ball(gun,gunBlue,0,-.005,-.42,.14,.14,.17);
 cylinder(gun,gunBlue,.105,.24,-.52);
 cylinder(gun,orange,.118,.075,-.665);
 cylinder(gun,ink,.064,.078,-.667);
 cylinder(gun,orange,.085,.008,-.709);
 ball(gun,gunBlue,0,-.155,-.42,.075,.14,.08);
 const muzzleLocal=new THREE.Vector3(0,0,-.715),barrelBackLocal=new THREE.Vector3(0,0,-.48),muzzleBase=new THREE.Vector3(0,1.55,-.78);
 const armLength=.445,yAxis=new THREE.Vector3(0,1,0),zAxis=new THREE.Vector3(0,0,1);
 const armGeometry=new THREE.CapsuleGeometry(.105,armLength-.21,6,14),cuffGeometry=new THREE.TorusGeometry(.088,.018,6,14);
 const arms=[1,-1].map((side,i)=>({side,shoulder:new THREE.Vector3(side*.31,1.42-.7,-.025),target:new THREE.Vector3(i===0?.105:-.09,i===0?-.155:-.07,i===0?-.42:-.55),top:mesh(armGeometry,yellow,actor),bottom:mesh(armGeometry,yellow,actor),elbow:ball(actor,yellow,0,0,0,.107),hand:ball(actor,skin,0,0,0,.087,.085,.085),cuff:mesh(cuffGeometry,cuff,actor)}));
 // Horizontal upper-body assistance pivots at the waist; pitch/roll stay zero.
 for(const child of upper.children)child.position.y-=.7;
 // Scratch vectors are reused. No per-frame mesh, material or geometry allocation.
 const shoulder=new THREE.Vector3(),target=new THREE.Vector3(),delta=new THREE.Vector3(),axis=new THREE.Vector3(),pole=new THREE.Vector3(),elbow=new THREE.Vector3(),boneDirection=new THREE.Vector3(),rotatedTip=new THREE.Vector3();
 let handGap=0,armError=0,reachMargin=0,torsoYaw=0,headYaw=0,currentYaw=0,currentKick=0;
 function positionBone(bone,a,b){bone.position.copy(a).add(b).multiplyScalar(.5);bone.quaternion.setFromUnitVectors(yAxis,boneDirection.subVectors(b,a).normalize());}
 function updateArms(){
  actor.updateMatrixWorld(true);handGap=0;armError=0;reachMargin=Infinity;
  for(const arm of arms){
   shoulder.copy(arm.shoulder).applyMatrix4(upper.matrix);target.copy(arm.target).applyMatrix4(gun.matrix);
   delta.subVectors(target,shoulder);const d=delta.length();axis.copy(delta).normalize();reachMargin=Math.min(reachMargin,2*armLength-d);
   pole.set(arm.side,-.75,.28);pole.addScaledVector(axis,-pole.dot(axis)).normalize();
   elbow.copy(shoulder).addScaledVector(axis,d/2).addScaledVector(pole,Math.sqrt(Math.max(0,armLength**2-d*d/4)));
   positionBone(arm.top,shoulder,elbow);positionBone(arm.bottom,elbow,target);arm.elbow.position.copy(elbow);
   arm.hand.position.copy(target);arm.hand.quaternion.copy(gun.quaternion);
   arm.cuff.position.copy(target).lerp(elbow,.16);arm.cuff.quaternion.setFromUnitVectors(zAxis,boneDirection.subVectors(target,elbow).normalize());
   handGap=Math.max(handGap,arm.hand.position.distanceTo(target));armError=Math.max(armError,Math.abs(elbow.distanceTo(shoulder)-armLength),Math.abs(elbow.distanceTo(target)-armLength));
  }
 }
 function setAim(yaw,{kick=0,time=0,reduced=false}={}){
  currentYaw=yaw;currentKick=reduced?0:Math.max(0,Math.min(1,kick));actor.rotation.set(0,0,0);
  torsoYaw=Math.tanh(yaw*1.5)*.42;headYaw=Math.max(-1.05,Math.min(1.05,yaw*.7));
  upper.rotation.set(0,torsoYaw,0);upper.position.set(0,.7+(reduced?0:Math.sin(time*2)*.006),currentKick*.025);
  headRig.rotation.y=headYaw-torsoYaw;gun.rotation.set(0,yaw,0);
  rotatedTip.copy(muzzleLocal).applyQuaternion(gun.quaternion);
  // Camera ray (0,5,4.2): raising along it does not move the projected muzzle.
  const rise=Math.sin(yaw)**2*.38;
  gun.position.copy(muzzleBase).sub(rotatedTip);gun.position.y+=rise;gun.position.z+=rise*.84;
  gun.position.x+=Math.sin(yaw)*currentKick*.035;gun.position.z+=Math.cos(yaw)*currentKick*.035;
  updateArms();
 }
 setAim(0,{reduced:true});
 return {actor,upper,gun,setAim,updateArms,muzzleLocal,barrelBackLocal,muzzleBase,get diagnostics(){return {handGap,armError,armLength,reachMargin,bodyYaw:actor.rotation.y,torsoYaw,torsoPitch:upper.rotation.x,torsoRoll:upper.rotation.z,headYaw,gunYaw:currentYaw,kick:currentKick,hairLocks:locks.length,feet:shoes.map(m=>m.position.toArray())};}};
}
