import * as THREE from './3d-lab/vendor/three.module.js';
import {createPlayerModel} from './player-model.js';

// Render ONLY the player on a transparent surface, then compose in Canvas2D.
// There is no scene camera, projection, input or collision change in the game.
export function createPlayerRenderer(){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 const size=384,scale=.34;renderer.setSize(size,size,false);renderer.setClearColor(0,0);
 const light=window.courtyardLighting;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=light?.exposure??1.1;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1.9,1.9,1.9,-1.9,.1,30);
 camera.position.set(0,6,4.2);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 scene.add(new THREE.HemisphereLight(light?.sky??0xfff3dd,light?.ground??0xa58b70,light?.ambient??1.35));
 const sun=new THREE.DirectionalLight(light?.key??0xffeed5,light?.intensity??2.8);sun.position.set(...(light?.sun??[-3,7,-4]));scene.add(sun);
 const model=createPlayerModel(scene),snapshot=document.createElement('canvas');snapshot.width=snapshot.height=size;
 const copy=snapshot.getContext('2d');
 const groundScale=5/Math.hypot(5,4.2),muzzle=new THREE.Vector3(),foot=new THREE.Vector3(),barrelBack=new THREE.Vector3();
 let ready=true,previousKey='',draws=0,lastPose={};
 const project=v=>{v.project(camera);return{x:(v.x+1)*size/2,y:(1-v.y)*size/2};};
 function update({x,y,kick=0,time=0,reduced=false}){
  const yaw=Math.atan2(-x*groundScale,-y),key=`${yaw.toFixed(6)}/${kick.toFixed(5)}/${reduced?0:Math.floor(time*30)}`;
  if(previousKey===key)return;previousKey=key;
  model.setAim(yaw,{kick,time,reduced});scene.updateMatrixWorld(true);
  model.gun.localToWorld(muzzle.copy(model.muzzleLocal));model.actor.localToWorld(foot.set(0,.03,0));
  model.gun.localToWorld(barrelBack.copy(model.barrelBackLocal));const mp=project(muzzle),fp=project(foot),bp=project(barrelBack),anchor=project(model.muzzleBase.clone()),length=Math.hypot(mp.x-bp.x,mp.y-bp.y);
  renderer.render(scene,camera);copy.clearRect(0,0,size,size);copy.drawImage(renderer.domElement,0,0);draws++;
  lastPose={yaw,muzzle:mp,anchor,foot:fp,direction:{x:(mp.x-bp.x)/length,y:(mp.y-bp.y)/length},scale,draws,lighting:{sun:sun.position.toArray(),ambient:light?.ambient??1.35,intensity:sun.intensity,exposure:renderer.toneMappingExposure},...model.diagnostics,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
 }
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{ready=true;previousKey='';});
 return {get ready(){return ready;},get diagnostics(){return {...lastPose,ready};},draw(ctx,origin,pose,shadow){
  if(!ready)return false;try{update(pose);}catch{ready=false;return false;}
  const offsetX=origin.x-lastPose.anchor.x*scale,offsetY=origin.y-lastPose.anchor.y*scale;
  shadow(offsetX+lastPose.foot.x*scale,offsetY+lastPose.foot.y*scale,18,5);
  ctx.drawImage(snapshot,offsetX,offsetY,size*scale,size*scale);return true;
 }};
}
