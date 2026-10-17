(() => {
 'use strict';
 // One continuous ground below the transparent gameplay canvas and all targets.
 let surface,context,key='',draws=0,diagnostics={},groundImage,groundSource='',sampleCanvas;
 const imageReady=img=>!!img?.complete&&img.naturalWidth>0&&img.naturalHeight>0;
 const lawnTone=Object.freeze({saturation:.68,contrast:.82,pivot:Object.freeze([145,171,113]),shift:Object.freeze([-5,0,8])});
 function groundArtwork(img){
  if(!imageReady(img))throw new Error('Ground image is not ready');
  const source=`${img.src}/${img.naturalWidth}/${img.naturalHeight}`;
  if(groundImage===img&&groundSource===source)return sampleCanvas;
  const layer=document.createElement('canvas');layer.width=img.naturalWidth;layer.height=img.naturalHeight;
  const c=layer.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);
  const pixels=c.getImageData(0,0,layer.width,layer.height),data=pixels.data;
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  // Continuous colour mask: the SAME treatment inside and outside the court.
  // Warm sandstone, white flowers and all separate gameplay sprites retain colour.
  for(let i=0;i<data.length;i+=4){
   const r=data[i],g=data[i+1],b=data[i+2],mask=smooth(6,22,g-r)*smooth(16,42,g-b);
   if(!mask)continue;
   const luminance=.2126*r+.7152*g+.0722*b;
   for(let ch=0;ch<3;ch++){
    const muted=luminance+(data[i+ch]-luminance)*lawnTone.saturation;
    const target=lawnTone.pivot[ch]+(muted-lawnTone.pivot[ch])*lawnTone.contrast+lawnTone.shift[ch];
    data[i+ch]+=mask*(target-data[i+ch]);
   }
  }
  c.putImageData(pixels,0,0);groundImage=img;groundSource=source;sampleCanvas=layer;return layer;
 }
 function tile(c,img,source,area,k,axis='both'){
  const [sx,sy,sw,sh]=source,[x,y,w,h]=area,tw=sw*k,th=sh*k;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let row=0;row<(axis==='x'?1:Math.ceil(h/th));row++)for(let col=0;col<(axis==='y'?1:Math.ceil(w/tw));col++)c.drawImage(img,sx,sy,sw,sh,x+col*tw,y+row*th,tw,th);
  c.restore();
 }
 function cover(c,img,x,y,width,height,anchor=.5){
  const scale=Math.max(width/img.naturalWidth,height/img.naturalHeight),sw=width/scale,sh=height/scale;
  c.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)*anchor,sw,sh,x,y,width,height);
 }
 function scenery(c,{sky,ground,width,height,top,bottom}){
  const hasSky=!!sky?.naturalWidth,hasGround=!!ground?.naturalWidth;
  if(hasSky)cover(c,sky,0,0,width,Math.max(1,top));
  const groundTop=Math.max(0,top-10);
  // The first stone faces start below 70% of this artwork. Keep them outside
  // even tall rooms on short phones; crop only excess foreground at the bottom.
  const groundHeight=Math.max(height-groundTop,(bottom+12-groundTop)/.70);
  // Draw the entire illustration ONCE, across both sides of the open exit.
  // The top edge sits under the stone wall; there is no grass crop or blend.
  if(hasGround)c.drawImage(groundArtwork(ground),0,groundTop,width,groundHeight);
  return{sky:hasSky,ground:hasGround,groundTop,groundHeight};
 }
 function render({canvas,W,H,bounds,courtyard,decor,sky,ground}){
  // Dimensions may arrive before pixels: never cache a partial background.
  if(![courtyard,decor,sky,ground].every(imageReady))return false;
  const wrap=canvas.parentElement,r=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
  const width=wr.width,height=wr.height,fit=r.width/W,dpr=Math.min(devicePixelRatio||1,2);
  if(!(fit>0)||!(width>0)||!(height>0))return false;
  const next=[width,height,r.left-wr.left,r.top-wr.top,r.width,r.height,W,H,courtyard.src,decor.src,sky?.src,sky?.naturalWidth,ground?.src,ground?.naturalWidth,dpr].join('/');
  if(key===next)return true;
  if(!surface){surface=document.createElement('canvas');surface.id='gardenFrame';surface.setAttribute('aria-hidden','true');wrap.prepend(surface);context=surface.getContext('2d');}
  surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);const c=context;
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const x=r.left-wr.left,y=r.top-wr.top,left=x+bounds.left*fit,right=x+bounds.right*fit,top=y+bounds.top*fit,bottom=y+bounds.bottom*fit;
  const scenes=scenery(c,{sky,ground,width,height,top,bottom});
  c.save();c.beginPath();c.rect(0,0,width,height);c.rect(left,top,right-left,bottom-top);c.clip('evenodd');
  const k=.4,strip=96*k,topHeight=112*k;
  tile(c,courtyard,[0,300,96,480],[left-strip,top,strip,bottom-top],k,'y');
  tile(c,courtyard,[courtyard.naturalWidth-96,300,96,480],[right,top,strip,bottom-top],k,'y');
  tile(c,courtyard,[96,0,courtyard.naturalWidth-192,112],[left,top-topHeight,right-left,topHeight],k,'x');
  // Outer-side embellishments retain their own scale; no room-sized sprite stretch.
  const half=decor.naturalWidth/2;
  const stamp=(col,row,cx,cy,size)=>c.drawImage(decor,col*half,row*half,half,half,cx-size/2,cy-size/2,size,size);
  for(const [cx,col]of [[left-12,0],[right+12,1]]){
   stamp(col,0,cx,top-13,66);stamp(col,0,cx,bottom-5,62);
   const count=Math.max(1,Math.floor((bottom-top)/150));
   for(let n=1;n<=count;n++)stamp((n+col)%2,1,cx+(col?8:-8),top+(bottom-top)*n/(count+1),62);
  }
  // The entrance stays open; shrubs occupy corners, never a wall across the bottom.
  stamp(1,1,0,height-48,100);stamp(0,1,width,height-52,100);
  c.restore();key=next;draws++;diagnostics={draws,width,height,fit,wallScale:k,scenes,inner:{left,right,top,bottom},canvas:{x,y,width:r.width,height:r.height},groundContinuous:true,groundDraws:scenes.ground?1:0,tiled:false,lawnTone};return true;
 }
 function sample(x,y){
  if(!groundImage?.naturalWidth||!diagnostics.scenes)return[145,190,65];
  const d=diagnostics,px=Math.max(0,Math.min(sampleCanvas.width-1,Math.floor((d.canvas.x+x*d.fit)/d.width*sampleCanvas.width))),py=Math.max(0,Math.min(sampleCanvas.height-1,Math.floor((d.canvas.y+y*d.fit-d.scenes.groundTop)/d.scenes.groundHeight*sampleCanvas.height)));
  return Array.from(sampleCanvas.getContext('2d').getImageData(px,py,1,1).data).slice(0,3);
 }
 // A separate, transparent layer keeps the full background cache static.
 let leafSurface,leafContext,leafSprites,lastLeafTick=0,leafTime=0,leafVisible=false,leafDraws=0,leafPositions=[];
 function createLeafSprites(){
  return [['#d5df82','#92ad4d','#4b712f'],['#eedb92','#c4aa55','#8b7037'],['#b7cf6e','#7a9c3f','#41652e']].map(colors=>{
   const sprite=document.createElement('canvas');sprite.width=128;sprite.height=96;const c=sprite.getContext('2d');c.translate(64,48);
   const shape=new Path2D();shape.moveTo(-35,4);shape.bezierCurveTo(-33,-11,-15,-28,7,-25);shape.quadraticCurveTo(25,-24,46,-16);shape.quadraticCurveTo(33,-7,28,7);shape.bezierCurveTo(13,29,-17,24,-35,4);
   const fill=c.createLinearGradient(-8,-24,8,22);colors.forEach((color,i)=>fill.addColorStop(i/2,color));c.fillStyle=fill;c.fill(shape);c.strokeStyle='#50612a99';c.lineWidth=1.8;c.stroke(shape);
   c.save();c.clip(shape);c.strokeStyle='#f6ebad9c';c.lineWidth=1.7;
   for(const x of [-23,-10,3,16,28]){const y=4-(x+35)*.24;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-2,y-6,x-7,y-15);c.moveTo(x,y);c.quadraticCurveTo(x+7,y+4,x+10,y+12);c.stroke();}
   c.strokeStyle='#fff2bccc';c.lineWidth=2.8;c.beginPath();c.moveTo(-34,4);c.quadraticCurveTo(6,-6,44,-16);c.stroke();c.restore();
   c.strokeStyle='#786c39';c.lineWidth=2.8;c.lineCap='round';c.beginPath();c.moveTo(-47,11);c.quadraticCurveTo(-41,7,-31,3);c.stroke();return sprite;
  });
 }
 let leafShadow;
 function createLeafShadow(){const c=document.createElement('canvas');c.width=96;c.height=48;const p=c.getContext('2d');p.translate(48,24);p.scale(48,24);const fill=p.createRadialGradient(0,0,0,0,0,1);fill.addColorStop(0,'#33452699');fill.addColorStop(1,'#33452600');p.fillStyle=fill;p.fillRect(-1,-1,2,2);return c;}
 function leafPose(i,clock,d){
  const fall=9+i*1.15,hold=7.5,fade=2.5,cycle=fall+hold+fade+2,offset=clock+i*5.3,age=offset%cycle,round=Math.floor(offset/cycle),side=i%2===0?-1:1;
  const edge=side<0?Math.max(20,d.inner.left+15):Math.min(d.width-20,d.inner.right-15),groundX=edge+Math.sin(round*1.7+i)*2;
  const groundY=d.inner.top+(d.inner.bottom-d.inner.top)*([.34,.58,.81,.47][i]+Math.sin(round+i)*.018);
  const progress=Math.min(1,age/fall),height=Math.pow(1-progress,1.4),start=Math.max(82,Math.min(d.inner.top-45,150));
  const phase=age<fall?'falling':age<fall+hold?'resting':age<fall+hold+fade?'fading':'waiting';
  const landAngle=side*.45+Math.sin(i*2.3+round)*.7,settle=age>=fall?Math.sin((age-fall)*9)*Math.exp(-(age-fall)*7)*.08:0;
  const x=groundX+(Math.sin(age*1.15+i)*6+Math.sin(age*.55+i)*2)*height,y=groundY-(groundY-start)*height;
  const angle=landAngle+(Math.sin(age*1.8+i)*.7+Math.sin(age*.6)*.3)*height+settle;
  const alpha=.9*Math.min(1,age/.65,clock/.8)*(phase==='fading'?1-(age-fall-hold)/fade:phase==='waiting'?0:1);
  return{x,y,groundX,groundY,height,angle,age,fallDuration:fall,size:17+i%3*2,alpha:Math.max(0,alpha),flip:.72+height*(.12+.16*Math.cos(age*2+i)),phase};
 }
 let birdSprites,birdPositions=[];
 function createBirdSprites(){
  return Array.from({length:12},(_,frame)=>{
   const sprite=document.createElement('canvas');sprite.width=96;sprite.height=84;const c=sprite.getContext('2d');c.translate(48,42);c.scale(3,3);
   const lift=-2-Math.sin(frame/12*Math.PI*2)*10;
   c.fillStyle='#637b83';c.beginPath();c.moveTo(-1,1);c.bezierCurveTo(-5,-2,-9,lift*.7,-10,lift);c.quadraticCurveTo(0,lift*.65,4,1);c.fill();
   c.fillStyle='#344e5c';c.beginPath();c.moveTo(-4,1);c.lineTo(-10,-1);c.lineTo(-8,2);c.lineTo(-10,4);c.lineTo(-3,4);c.fill();
   c.fillStyle='#607887';c.beginPath();c.ellipse(0,2,6,2.8,-.12,0,Math.PI*2);c.fill();
   c.fillStyle='#c9d1c0';c.beginPath();c.ellipse(1,3,4.7,1.4,-.1,0,Math.PI*2);c.fill();
   c.fillStyle='#3b5665';c.beginPath();c.arc(5.4,.4,2.6,0,Math.PI*2);c.fill();c.fillStyle='#c6a66b';c.beginPath();c.moveTo(7,.1);c.lineTo(10,1);c.lineTo(7,1.6);c.fill();
   c.fillStyle='#293f4d';c.beginPath();c.moveTo(1,1);c.bezierCurveTo(-1,2,-5,lift*.65,-7,lift+2);c.quadraticCurveTo(1,lift*.55,4,1);c.fill();
   c.fillStyle='#172b35';c.beginPath();c.arc(6,-.1,.45,0,Math.PI*2);c.fill();return sprite;
  });
 }
 function drawBirds(c,d,clock){
  birdPositions=[];const round=Math.floor(clock/26),age=clock%26,start=2+round%3*1.2,duration=7.2+round%3*.5,skyBottom=Math.max(0,d.inner.top-45);
  if(skyBottom<24||age<start||age>start+duration+.65)return;
  birdSprites??=createBirdSprites();const count=round%3===1?1:2,direction=round%2===0?1:-1;
  const base=skyBottom<100?Math.max(14,skyBottom*.2):Math.max(80,skyBottom*.56);
  c.save();c.beginPath();c.rect(0,0,d.width,skyBottom);c.clip();
  for(let i=0;i<count;i++){
   const elapsed=age-start-i*.65,p=elapsed/duration;if(p<0||p>1)continue;
   const progress=direction>0?p:1-p,x=-24+(d.width+48)*progress,y=Math.min(skyBottom-12,base+i*12+Math.sin(p*Math.PI*2+i*.8)*3);
   const beat=elapsed%2.4,frame=beat<1.5?Math.floor(elapsed*9+i*3)%12:2,size=i?25:30;
   const fade=Math.max(0,Math.min(1,p/.14,(1-p)/.14));c.save();c.globalAlpha=.88*fade;c.translate(x,y);c.scale(direction,1);c.rotate(Math.cos(p*Math.PI*2+i*.8)*.045);c.drawImage(birdSprites[frame],-size/2,-size*.4375,size,size*.875);c.restore();
   birdPositions.push({x,y,size,frame,direction,alpha:.88*fade,skyBottom});
  }
  c.restore();
 }
 function animateAmbience({active,reduced}){
  if(!active||reduced||document.hidden||!surface){
   if(leafVisible){leafContext.clearRect(0,0,leafSurface.width,leafSurface.height);leafVisible=false;}
   lastLeafTick=0;leafPositions=[];birdPositions=[];return;
  }
  const d=diagnostics,dpr=Math.min(devicePixelRatio||1,2),width=d.width,height=d.height,t=performance.now();
  const resized=!leafSurface||leafSurface.width!==Math.round(width*dpr)||leafSurface.height!==Math.round(height*dpr);
  if(!resized&&lastLeafTick&&t-lastLeafTick<1000/30-1)return;
  if(!leafSurface){leafSurface=document.createElement('canvas');leafSurface.id='gardenLeaves';leafSurface.setAttribute('aria-hidden','true');surface.after(leafSurface);leafContext=leafSurface.getContext('2d');}
  if(resized){leafSurface.width=Math.round(width*dpr);leafSurface.height=Math.round(height*dpr);}
  leafTime+=lastLeafTick?Math.min(.08,(t-lastLeafTick)/1000):0;lastLeafTick=t;
  leafSprites??=createLeafSprites();const c=leafContext;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);leafPositions=[];
  leafShadow??=createLeafShadow();
  for(let i=0;i<4;i++){
   const p=leafPose(i,leafTime,d),{x,y,size,alpha,angle,height,groundX,groundY,flip}=p;
   c.save();c.globalAlpha=alpha*(.15+.2*(1-height));c.translate(groundX+height*6,groundY+3+height*5);c.rotate(angle);c.drawImage(leafShadow,-size*.7,-size*.22,size*1.4,size*.44);c.restore();
   c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.scale(1,flip);c.drawImage(leafSprites[i%3],-size*.775,-size*.58,size*1.55,size*1.16);c.restore();
   leafPositions.push(p);
  }
  drawBirds(c,d,leafTime);leafVisible=true;leafDraws++;
 }
 window.gardenFrame={render,sample,animateAmbience,get birdDiagnostics(){return{active:leafVisible&&birdPositions.length>0,time:leafTime,count:birdPositions.length,birds:birdPositions.map(p=>({...p}))};},get diagnostics(){return diagnostics;},get leafDiagnostics(){return{active:leafVisible,draws:leafDraws,time:leafTime,count:leafPositions.length,leaves:leafPositions.map(p=>({...p}))};}};
})();
