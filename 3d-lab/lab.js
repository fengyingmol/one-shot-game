import * as THREE from './vendor/three.module.js';

const stage=document.querySelector('#stage'),status=document.querySelector('#status');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0xf5ead3);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
stage.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3,3,4,-4,.1,40);
scene.add(new THREE.HemisphereLight(0xfff6df,0xa48e73,2.4));
const sun=new THREE.DirectionalLight(0xffefd2,3.2);sun.position.set(-3,7,4);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun);
const mat=(color,roughness=.65)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const skin=mat(0xf7bd83),yellow=mat(0xffbc27),hair=mat(0x493021),blue=mat(0x2388d0),white=mat(0xfff5df),ink=mat(0x292b36),orange=mat(0xff982b);
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(parent,material,x,y,z,sx,sy=sx,sz=sx){const m=mesh(new THREE.SphereGeometry(1,28,20),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function rod(parent,material,r,length){return mesh(new THREE.CylinderGeometry(r,r,length,16),material,parent);}
const floor=mesh(new THREE.BoxGeometry(6,.2,8),mat(0xe9cf9d),scene,0,-.13,-.6);floor.castShadow=false;
// A restrained physical setting: geometry, not a background picture.
for(let i=0;i<9;i++)ball(scene,mat(i%2?0xd7bd90:0xe5cba2),-2.8+i*.7,.12,-4.35,.35,.22,.25);
for(const x of [-2.7,2.7]){const pot=mesh(new THREE.CylinderGeometry(.18,.12,.28,18),mat(0xc28452),scene,x,.14,-3.8);for(let j=0;j<5;j++){const leaf=ball(scene,mat(0x75a34a),x+Math.sin(j*2)*.13,.4,-3.8+Math.cos(j*2)*.1,.08,.25,.07);leaf.rotation.z=Math.sin(j*2)*.7;}}
const actor=new THREE.Group();scene.add(actor);actor.position.z=.7;
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
const targetMark=mesh(new THREE.TorusGeometry(.15,.017,8,32),mat(0xd18c39),scene,0,.006,-2.8);targetMark.rotation.x=-Math.PI/2;targetMark.castShadow=false;
const flash=ball(gun,mat(0xffdc5d),0,1.16,-1.16,.14,.14,.22);flash.visible=false;
const bullets=[];let angle=0,targetAngle=0,recoil=0,shots=0,view=0,drag=null,last=performance.now(),lost=false;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function setView(){const locations=[[3.8,5.7,7],[4.8,4.7,-5.6],[-6,4.5,1.8]];camera.position.set(...locations[view]);camera.lookAt(0,.95,-.2);}
function resize(){const w=innerWidth,h=innerHeight,aspect=w/h,half=aspect<.8?4.3:3.4;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h);}
setView();resize();addEventListener('resize',resize);
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
function aim(x,y){ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),camera);if(ray.ray.intersectPlane(plane,hit)){const dx=hit.x-actor.position.x,dz=hit.z-actor.position.z;targetAngle=THREE.MathUtils.clamp(Math.atan2(-dx,-dz),-1.35,1.35);targetMark.position.set(-Math.sin(targetAngle)*3,.006,actor.position.z-Math.cos(targetAngle)*3);}}
function fire(){if(lost||document.hidden)return;shots++;recoil=1;actor.updateMatrixWorld(true);const p=new THREE.Vector3(0,1.16,-1.17);gun.localToWorld(p);const direction=new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle));const b=ball(scene,orange,p.x,p.y,p.z,.045);bullets.push({mesh:b,direction,age:0});if(bullets.length>20){const old=bullets.shift();scene.remove(old.mesh);old.mesh.geometry.dispose();}}
stage.addEventListener('pointerdown',e=>{if(drag!==null)return;drag=e.pointerId;stage.setPointerCapture(drag);aim(e.clientX,e.clientY);});
stage.addEventListener('pointermove',e=>{if(drag===e.pointerId)aim(e.clientX,e.clientY);});
stage.addEventListener('pointerup',e=>{if(drag!==e.pointerId)return;drag=null;fire();});
stage.addEventListener('pointercancel',()=>{drag=null;});
stage.addEventListener('lostpointercapture',()=>{drag=null;});
document.querySelector('#fire').onclick=fire;document.querySelector('#view').onclick=()=>{view=(view+1)%3;setView();};
addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&e.target.tagName!=='BUTTON'){e.preventDefault();fire();}});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;document.querySelector('#loading').hidden=false;document.querySelector('#loading').textContent='图形环境已暂停，请刷新恢复。';});
window.lab3d={get state(){return {ready:!lost,angle,targetAngle,shots,recoil,view,handGap,armError,armLength,projectiles:bullets.length,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,shadow:renderer.shadowMap.enabled};}};
document.querySelector('#loading').hidden=true;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.033);last=now;if(document.hidden||lost)return;angle+=(targetAngle-angle)*(1-Math.exp(-dt*16));actor.rotation.y=angle;recoil=Math.max(0,recoil-dt*5);gun.position.z=reduce.matches?0:Math.sin(recoil*Math.PI)*.075;upper.position.y=reduce.matches?0:Math.sin(now*.002)*.008;updateArms();flash.visible=recoil>.82;
for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.age+=dt;b.mesh.position.addScaledVector(b.direction,dt*9);if(b.age>1.1){scene.remove(b.mesh);b.mesh.geometry.dispose();bullets.splice(i,1);}}
status.textContent=`${Math.round(angle*180/Math.PI)}° · ${shots} 发`;renderer.render(scene,camera);}
requestAnimationFrame(animate);
