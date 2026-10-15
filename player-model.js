import * as THREE from './3d-lab/vendor/three.module.js';

// Same approved lab character. Only a reusable model factory; no game rules.
export function createPlayerModel(scene){
const mat=(color,roughness=.65)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const skin=mat(0xf7bd83),yellow=mat(0xffbc27),hair=mat(0x493021),blue=mat(0x2388d0),white=mat(0xfff5df),ink=mat(0x292b36),orange=mat(0xff982b);
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(parent,material,x,y,z,sx,sy=sx,sz=sx){const m=mesh(new THREE.SphereGeometry(1,28,20),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function rod(parent,material,r,length){return mesh(new THREE.CylinderGeometry(r,r,length,16),material,parent);}
const actor=new THREE.Group();scene.add(actor);actor.position.z=0;
const upper=new THREE.Group();actor.add(upper);
const torso=mesh(new THREE.LatheGeometry([new THREE.Vector2(0,.69),new THREE.Vector2(.28,.69),new THREE.Vector2(.32,.78),new THREE.Vector2(.32,1.04),new THREE.Vector2(.27,1.29),new THREE.Vector2(.18,1.34),new THREE.Vector2(0,1.34)],32),yellow,upper);torso.scale.z=.86;
ball(upper,yellow,0,1.25,.2,.26,.24,.17);
for(const x of [-.19,.19]){ball(actor,blue,x,.48,0,.15,.29,.15);ball(actor,white,x,.15,-.07,.17,.13,.26);ball(actor,mat(0xb4b4ab),x,.065,-.07,.17,.045,.26);}
const head=ball(upper,skin,0,1.71,0,.47,.49,.44);
for(const x of [-.45,.45])ball(upper,skin,x,1.64,0,.085,.12,.085);
for(const x of [-.15,.15])ball(upper,ink,x,1.71,-.416,.036,.053,.022);
ball(upper,skin,0,1.59,-.442,.06,.06,.047);
const smile=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.06,1.52,-.408),new THREE.Vector3(0,1.49,-.43),new THREE.Vector3(.06,1.52,-.408));
mesh(new THREE.TubeGeometry(smile,12,.009,6,false),ink,upper);
mesh(new THREE.SphereGeometry(.494,32,24,0,Math.PI*2,0,1.40),hair,upper,0,1.72,.015);
ball(upper,hair,0,1.72,.26,.4,.36,.23);
for(let j=0;j<22;j++){const a=j*2.399,rad=.045+(j%6)*.064;const tuft=ball(upper,j%3?hair:mat(0x543824),Math.cos(a)*rad,1.72+Math.sqrt(.494**2-rad**2)-.025,Math.sin(a)*rad,.105,.073,.22);tuft.rotation.y=-a+.5;tuft.rotation.z=Math.cos(a)*.35;}
const gun=new THREE.Group();upper.add(gun);
ball(gun,blue,0,1.12,-.47,.14,.13,.31);
const barrel=mesh(new THREE.CylinderGeometry(.073,.073,.43,20),blue,gun,0,1.16,-.82);barrel.rotation.x=Math.PI/2;
const muzzle=mesh(new THREE.CylinderGeometry(.081,.081,.075,20),orange,gun,0,1.16,-1.045);muzzle.rotation.x=Math.PI/2;
const bore=mesh(new THREE.CylinderGeometry(.043,.043,.077,16),ink,gun,0,1.16,-1.047);bore.rotation.x=Math.PI/2;
ball(gun,blue,.05,.99,-.36,.065,.15,.07);
const gripPoints=[new THREE.Vector3(.12,1.045,-.36),new THREE.Vector3(-.11,1.145,-.57)];
const armLength=.34;
const arms=[1,-1].map((side,i)=>({side,shoulder:new THREE.Vector3(side*.29,1.23,0),target:gripPoints[i],top:rod(upper,yellow,.105,armLength),bottom:rod(upper,yellow,.087,armLength),elbow:ball(upper,yellow,0,0,0,.098),hand:ball(upper,skin,0,0,0,.085)}));
const yAxis=new THREE.Vector3(0,1,0);
function positionBone(bone,a,b){bone.position.copy(a).add(b).multiplyScalar(.5);bone.quaternion.setFromUnitVectors(yAxis,b.clone().sub(a).normalize());}
let handGap=0,armError=0;
function updateArms(){handGap=0;armError=0;for(const arm of arms){const target=arm.target.clone().add(gun.position),delta=target.clone().sub(arm.shoulder),d=delta.length(),axis=delta.normalize();const pole=new THREE.Vector3(arm.side,-.6,.25);pole.addScaledVector(axis,-pole.dot(axis)).normalize();const elbow=arm.shoulder.clone().addScaledVector(axis,d/2).addScaledVector(pole,Math.sqrt(Math.max(0,armLength**2-d*d/4)));positionBone(arm.top,arm.shoulder,elbow);positionBone(arm.bottom,elbow,target);arm.elbow.position.copy(elbow);arm.hand.position.copy(target);handGap=Math.max(handGap,arm.hand.position.distanceTo(target));armError=Math.max(armError,Math.abs(elbow.distanceTo(arm.shoulder)-armLength),Math.abs(elbow.distanceTo(target)-armLength));}}

return {actor,upper,gun,updateArms,get diagnostics(){return {handGap,armError,armLength};}};
}
