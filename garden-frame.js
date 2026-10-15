(() => {
 'use strict';
 // Decorative Canvas only. The inner rectangle is cut out: never cover targets.
 let surface,context,key='',draws=0,diagnostics={};
 function tile(c,img,source,area,k,axis='both'){
  const [sx,sy,sw,sh]=source,[x,y,w,h]=area,tw=sw*k,th=sh*k;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let row=0;row<(axis==='x'?1:Math.ceil(h/th));row++)for(let col=0;col<(axis==='y'?1:Math.ceil(w/tw));col++)c.drawImage(img,sx,sy,sw,sh,x+col*tw,y+row*th,tw,th);
  c.restore();
 }
 function render({canvas,W,H,bounds,courtyard,decor}){
  if(!courtyard?.complete||!courtyard.naturalWidth||!decor?.complete||!decor.naturalWidth||!window.lawnGround)return;
  const wrap=canvas.parentElement,r=canvas.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
  const width=wr.width,height=wr.height,fit=r.width/W,dpr=Math.min(devicePixelRatio||1,2);
  if(!(fit>0)||!(width>0)||!(height>0))return;
  const next=[width,height,r.left-wr.left,r.top-wr.top,r.width,r.height,W,H,courtyard.src,decor.src,dpr].join('/');
  if(key===next)return;key=next;
  if(!surface){surface=document.createElement('canvas');surface.id='gardenFrame';surface.setAttribute('aria-hidden','true');wrap.prepend(surface);context=surface.getContext('2d');}
  surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);const c=context;
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const x=r.left-wr.left,y=r.top-wr.top,left=x+bounds.left*fit,right=x+bounds.right*fit,top=y+bounds.top*fit,bottom=y+bounds.bottom*fit;
  c.save();c.beginPath();c.rect(0,0,width,height);c.rect(left,top,right-left,bottom-top);c.clip('evenodd');
  // Same world coordinates and uniform fit as the inner lawn, including negatives.
  c.save();c.translate(x,y);c.scale(fit,fit);
  window.lawnGround.paint(c,{x:-x/fit,y:-y/fit,width:width/fit,height:height/fit},bounds);c.restore();
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
  stamp(0,1,20,Math.max(28,top-62),105);stamp(1,1,width-20,Math.max(26,top-65),110);
  stamp(1,1,0,height-48,100);stamp(0,1,width,height-52,100);
  if(top>140){stamp(0,1,4,82,100);stamp(1,1,width-4,88,100);}
  c.restore();draws++;diagnostics={draws,width,height,fit,wallScale:k,inner:{left,right,top,bottom},canvas:{x,y,width:r.width,height:r.height},transparentInterior:true};
 }
 window.gardenFrame={render,get diagnostics(){return diagnostics;}};
})();
