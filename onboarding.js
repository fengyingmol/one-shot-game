/* Presentation-only lessons: no shot simulation or game-state mutation. */
(() => {
 'use strict';
 const demo=window.demo,canvas=document.getElementById('game');if(!demo||!canvas)return;
 const storageKey='one-shot-guide-v1';let seen=new Set();
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))seen=new Set(saved.filter(id=>typeof id==='string'));}catch{/* Storage can be unavailable. */}
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify([...seen]));}catch{/* Session-only fallback. */}};
 const lessons={
  drag:{title:'先试着瞄准',text:'拖动瞄准，松手开枪。'},
  bounce:{title:'让墙帮个忙',text:'借墙反弹，一枪可以经过更多目标。加固石墙不会被打坏。'},
  indirect:{title:'不一定要直接瞄准小球',text:'有时不必直接瞄准小球，试着瞄准墙面，借反弹绕过障碍。'},
  wood:{title:'木门会留下伤痕',text:'普通弹打两次就能破坏木头，受损会留到下一枪。'},
  helmet:{title:'先掉头盔，再补一击',text:'普通弹先打掉头盔，再次命中才能消灭小怪。'},
  barrel:{title:'借一次爆炸清场',text:'击中炸药桶，会炸到附近的怪物，也能引爆其他桶。'},
  shield:{title:'别只盯着盾牌',text:'盾面会弹开子弹，试着借反弹命中后方露出的身体。'},
  piercing:{title:'换一种工具试试',text:'点击底部子弹换成穿甲弹，能贯穿木头，一击击倒头盔怪。'},
  explosive:{title:'石门要用爆炸打开',text:'换成爆炸弹：爆炸能破坏浅色石墙，也能绕过盾牌。引爆后子弹消失。'},
  scatter:{title:'瞄准一片区域',text:'散弹近处集中、远处散开。瞄准怪群中间，不必逐只直射。'},
  rotor:{title:'为下一枪铺路',text:'子弹先反弹，机关再转90°。下一枪可以利用新的方向。'},
  bomb:{title:'小怪也是连锁起点',text:'红色炸弹怪被击倒后会爆炸，看看它附近还有谁。'},
  challenge:{title:'顺手玩个小挑战',text:'彩旗瓶子不挡子弹。一枪击倒三只可加分，不做挑战也能正常过关。'},
  mover:{title:'观察空隙再出手',text:'滑轨上的加固挡板会往返移动，不能打碎。瞄准线只显示它现在的位置。'},
  lever:{title:'射击拉杆打开木闸',text:'红球拉杆控制连杆另一端的木闸，同枪只拨一次；门的状态保留到下一枪。'}
 };
 function lessonIds(level){if(level.group!=='formal')return [];return ({1:['drag','bounce'],3:['indirect'],4:['wood','helmet'],5:['barrel'],6:['shield'],7:['piercing','explosive'],8:['scatter'],9:['rotor'],10:['bomb'],15:['challenge'],16:['mover'],17:['lever']})[level.number]||[];}
 const root=document.createElement('div');root.id='gameGuide';root.hidden=true;
 root.innerHTML='<svg class="guide-scene" aria-hidden="true"><defs><mask id="guideSpotlight" maskUnits="userSpaceOnUse"><rect class="guide-mask-base" fill="white"/><circle class="guide-hole" fill="black"/></mask></defs><rect class="guide-dim" fill="#162a26" fill-opacity=".2" mask="url(#guideSpotlight)"/><circle class="guide-focus" fill="none" stroke="#ffe8a4"/><path class="guide-path-under" fill="none" stroke="#4b3b37"/><path class="guide-path" fill="none" stroke="#fff7d4"/><g class="guide-hand"><circle r="16" fill="#fff5d2" fill-opacity=".25"/><path d="M-3 14 C-9 9 -13 5 -11 2 C-9 -1 -6 2 -3 4 L-3 -13 C-3 -18 3 -18 3 -13 L3 -3 C8 -7 12 -3 12 1 L12 10 C12 18 6 21 1 20 Z" fill="#fff9eb" stroke="#76502f" stroke-width="2" stroke-linejoin="round"/></g></svg><div class="guide-card" role="status" aria-live="polite"><small class="guide-kicker"></small><strong class="guide-title"></strong><p class="guide-copy"></p><span>示意轨迹，不是完整解法 · 开始瞄准即收起</span></div>';
 root.querySelector('.guide-card>span').textContent='局部示意 · 开始瞄准即收起';
 document.querySelector('main').append(root);
 const find=s=>root.querySelector(s),svg=find('svg'),card=find('.guide-card'),path=find('.guide-path'),under=find('.guide-path-under'),focus=find('.guide-focus'),hole=find('.guide-hole'),hand=find('.guide-hand');
 const spread=document.createElementNS('http://www.w3.org/2000/svg','path');spread.setAttribute('class','guide-spread');spread.setAttribute('fill','none');spread.setAttribute('stroke','#ffe8b2');svg.insertBefore(spread,hand);
 let stateRef=null,queue=[],active=null,elapsed=0,lastTime=0,lastTick=0,waitForShot=null,sequenceTotal=0,sequenceIndex=0;
 const visited=new Set(),replay=document.getElementById('replayGuide');
 function resetForLevel(force=false){
  const state=demo.state,ids=lessonIds(demo.levels[state.index]);stateRef=state;root.hidden=true;active=null;elapsed=0;waitForShot=null;
  queue=force?ids:visited.has(state.index)?[]:ids.filter(id=>!seen.has(id));visited.add(state.index);sequenceTotal=queue.length;sequenceIndex=0;
  if(replay){replay.disabled=!ids.length;replay.textContent=ids.length?'重看本关教学':'本关没有新元素教学';}
 }
 function begin(){const id=queue.shift();if(!id)return;active=id;elapsed=0;sequenceIndex++;seen.add(id);save();find('.guide-kicker').textContent=`小院课堂 · ${sequenceIndex} / ${sequenceTotal}`;find('.guide-title').textContent=lessons[id].title;find('.guide-copy').textContent=lessons[id].text;root.dataset.lesson=id;}
 function dismiss(){if(!active)return;active=null;root.hidden=true;waitForShot=demo.state.shotsUsed;}
 canvas.addEventListener('pointerdown',()=>{if(demo.gameEntered&&demo.state.phase==='aim')dismiss();},{capture:true});
 replay?.addEventListener('click',()=>{document.getElementById('closeSettings').click();resetForLevel(true);});
 // Read-only ray tracing for the opening normal-ammo lessons. Coordinates are
 // bullet centres, including radius 4, exactly as the gameplay collision shapes.
 function ricochetLesson(kind){
  const {origin:o,bounds:b}=demo.stage,s=demo.state,r=4;
  const trace=angle=>{
   let dx=Math.sin(angle*Math.PI/180),dy=-Math.cos(angle*Math.PI/180),x=o.x,y=o.y,distance=0,bounces=0;
   const points=[[x,y]],hit=new Set();
   for(let n=0;n<18&&distance<1200;n++){
    let event={t:Infinity};const accept=(t,data)=>{if(t>1e-6&&t<event.t)event={t,...data};};
    if(dx>0)accept((b.right-r-x)/dx,{axis:'x'});if(dx<0)accept((b.left+r-x)/dx,{axis:'x'});
    if(dy<0)accept((b.top+r-y)/dy,{axis:'y'});if(dy>0)accept((b.bottom-y)/dy,{exit:true});
    for(const w of s.walls){
     if(!w.alive)continue;
     const xs=Math.abs(dx)<1e-10?[-Infinity,Infinity]:[(w.x-r-x)/dx,(w.x+w.w+r-x)/dx].sort((a,b)=>a-b),ys=Math.abs(dy)<1e-10?[-Infinity,Infinity]:[(w.y-r-y)/dy,(w.y+w.h+r-y)/dy].sort((a,b)=>a-b);
     if(Math.abs(dx)<1e-10&&(x<w.x-r||x>w.x+w.w+r))continue;if(Math.abs(dy)<1e-10&&(y<w.y-r||y>w.y+w.h+r))continue;
     const near=Math.max(xs[0],ys[0]);if(near<Math.min(xs[1],ys[1]))accept(near,{axis:xs[0]>ys[0]?'x':'y'});
    }
    for(const e of s.enemies){if(!e.alive||hit.has(e.id)||e.type!=='normal')continue;const ex=x-e.x,ey=y-e.y,B=ex*dx+ey*dy,D=B*B-ex*ex-ey*ey+(e.r+r)**2;if(D>=0)accept(-B-Math.sqrt(D),{enemy:e});}
    if(!Number.isFinite(event.t)||event.exit||distance+event.t>1200)return null;
    x+=dx*event.t;y+=dy*event.t;distance+=event.t;
    if(event.enemy){
     hit.add(event.enemy.id);
     if(kind==='drag'||bounces>0){points.push([x,y]);const [firstX,firstY]=points[1],length=Math.hypot(firstX-o.x,firstY-o.y),reach=Math.min(145,length-12);return {points,target:{x:event.enemy.x,y:event.enemy.y,r:event.enemy.r+10},aimPoint:{x:o.x+(firstX-o.x)*reach/length,y:o.y+(firstY-o.y)*reach/length},targetId:event.enemy.id,bounces,angle,distance,accurate:true};}
    }else{points.push([x,y]);bounces++;if(bounces>3)return null;if(event.axis==='x')dx=-dx;else dy=-dy;}
    x+=dx*1e-5;y+=dy*1e-5;
   }
   return null;
  };
  const preferred=s.index===13?[-53.5,50.5]:[45,-45];
  for(const a of preferred){const result=trace(a);if(result)return result;}
  let best=null;for(let a=-75;a<=75;a+=1.5){const result=trace(a);if(result&&(!best||result.bounces*1000+result.distance<best.bounces*1000+best.distance))best=result;}
  return best;
 }
 function geometry(kind){
  const {W,H,origin:o,bounds:b}=demo.stage,s=demo.state;
  const enemy=type=>s.enemies.find(e=>e.alive&&e.type===type)||s.enemies.find(e=>e.type===type),wall=type=>s.walls.find(w=>w.alive&&w.type===type)||s.walls.find(w=>w.type===type);
  let target,points;
  if(['drag','bounce','indirect'].includes(kind))return ricochetLesson(kind);
  else if(['challenge','mover','lever'].includes(kind)){
   const p=kind==='challenge'?s.props.find(p=>p.challenge&&!p.down):kind==='mover'?s.movers[0]:s.switches[0];if(!p)return null;
   target={x:p.x+(kind==='mover'?p.w/2:0),y:p.y+(kind==='mover'?p.h/2:0),r:kind==='mover'?p.w/2+8:28};
   points=[[target.x-25,target.y+70],[target.x,target.y+12]];
  }else if(['wood','piercing','explosive'].includes(kind)){
   const w=wall(kind==='explosive'?'brick':'obstacle');if(!w)return null;target={x:w.x+w.w*.62,y:w.y+w.h/2,r:32};points=[[target.x-22,target.y+82],[target.x,target.y+5]];
   if(kind==='wood')points.push([target.x+22,target.y+82]);if(kind==='piercing')points.push([target.x+22,target.y-70]);
  }else if(kind==='rotor'){
   const g=s.rotors[0];if(!g)return null;target={x:g.x,y:g.y,r:g.length/2+9};const hit=demo.rotorRay(g,g.x,g.y+82,0,-1);if(!hit)return null;const y=g.y+82-hit.t,dot=-hit.ny;points=[[g.x,g.y+82],[g.x,y],[g.x-2*dot*hit.nx*65,y+(-1-2*dot*hit.ny)*65]];
  }else if(kind==='scatter'){
   const group=s.enemies.filter(e=>e.type==='normal'&&e.x>W/2&&e.y<H*.4);if(!group.length)return null;
   target={x:group.reduce((n,e)=>n+e.x,0)/group.length,y:group.reduce((n,e)=>n+e.y,0)/group.length,r:65};points=[[target.x,target.y+95],[target.x,target.y+10]];
  }else{
   const e=kind==='barrel'?(s.barrels.find(b=>b.alive)||s.barrels[0]):enemy(kind==='scatter'?'normal':kind);if(!e)return null;target={x:e.x,y:e.y,r:(e.r||18)+16};points=kind==='shield'?[[e.x-36,e.y-84],[e.x,e.y-12]]:[[e.x-18,e.y+83],[e.x,e.y+10]];
  }
  return {target,points:points.map(([x,y])=>[Math.max(22,Math.min(W-22,x)),Math.max(22,Math.min(H-22,y))])};
 }
 function paint(){
  const {W,H}=demo.stage,r=canvas.getBoundingClientRect(),g=geometry(active);if(!g||!r.width||!r.height){root.hidden=true;return;}
  root.hidden=false;Object.assign(svg.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  for(const rect of root.querySelectorAll('.guide-mask-base,.guide-dim')){rect.setAttribute('width',W);rect.setAttribute('height',H);}
  const fit=r.width/W,ring=Math.max(g.target.r,28/fit);
  for(const c of [focus,hole]){c.setAttribute('cx',g.target.x);c.setAttribute('cy',g.target.y);c.setAttribute('r',ring+(c===hole?12/fit:0));}focus.setAttribute('stroke-width',2/fit);
  const d=g.points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');path.setAttribute('d',d);under.setAttribute('d',d);path.setAttribute('stroke-width',2.5/fit);under.setAttribute('stroke-width',5/fit);path.setAttribute('stroke-dasharray',`${7/fit} ${5/fit}`);
  find('.guide-card>span').textContent=g.accurate?'沿枪口出发的线瞄准 · 开始操作即收起':'局部机制示意 · 开始瞄准即收起';
  spread.setAttribute('d',active==='scatter'?[-35,35].map(dx=>`M${g.points[0][0]} ${g.points[0][1]} Q${g.points[0][0]+dx*.15} ${g.points[0][1]-35} ${g.points[1][0]+dx} ${g.points[1][1]}`).join(' '):'');spread.setAttribute('stroke-width',2/fit);
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,progress=reduced?1:Math.min(1,(elapsed%3.2)/1.8),t=progress*progress*(3-2*progress),start=g.points[0],end=g.aimPoint?[g.aimPoint.x,g.aimPoint.y]:g.points[1],x=start[0]+(end[0]-start[0])*t,y=start[1]+(end[1]-start[1])*t;hand.setAttribute('transform',`translate(${x} ${y}) scale(${1/fit})`);
  const width=Math.min(272,r.width-20);card.style.width=width+'px';card.style.left=(r.width-width)/2+'px';
  const h=card.offsetHeight,actorY=demo.stage.origin.y*fit;
  const objects=[...demo.state.enemies.filter(e=>e.alive).map(e=>({x:e.x*fit,y:e.y*fit,w:(e.r+14)*fit,h:(e.r+16)*fit,weight:20})),...demo.state.walls.filter(w=>w.alive).map(w=>({x:(w.x+w.w/2)*fit,y:(w.y+w.h/2)*fit,w:w.w*fit/2+5,h:w.h*fit/2+8,weight:2})),{x:g.target.x*fit,y:g.target.y*fit,w:ring*fit+12,h:ring*fit+12,weight:50},{x:r.width/2,y:actorY+26,w:32,h:51,weight:100}];
  const overlap=(x,y,e)=>Math.max(0,Math.min(x+width,e.x+e.w)-Math.max(x,e.x-e.w))*Math.max(0,Math.min(y+h,e.y+e.h)-Math.max(y,e.y-e.h));
  const hud=document.querySelector('.arena-top').getBoundingClientRect(),candidates=[];
  // Free sky above a short board is also usable; never overlap the HUD or controls.
  const minY=Math.max(8,hud.bottom+12)-r.top,maxY=Math.min(r.height-h-8,actorY-27-h);
  for(let y=minY;y<=maxY;y+=10)for(const x of [(r.width-width)/2,10,r.width-width-10])candidates.push({x,y,cost:objects.reduce((sum,e)=>sum+overlap(x,y,e)*e.weight,0)+Math.abs(x-(r.width-width)/2)*.1+Math.abs(y-(g.target.y*fit-h-45))*.03});
  candidates.sort((a,b)=>a.cost-b.cost);const pos=candidates[0]||{x:(r.width-width)/2,y:8};card.style.left=(r.left+pos.x)+'px';card.style.top=(r.top+pos.y)+'px';
 }
 function frame(time){
  requestAnimationFrame(frame);if(time-lastTick<32)return;lastTick=time;const dt=Math.min(.1,(time-lastTime)/1000||0);lastTime=time;
  if(demo.state!==stateRef)resetForLevel();
  const paused=!demo.gameEntered||!document.getElementById('loadingScreen').hidden||document.hidden||document.getElementById('levelPanel').open||!document.getElementById('settingsDialog').hidden||!document.getElementById('ammoPicker').hidden||document.getElementById('challengePanel').open;
  if(paused||demo.state.phase!=='aim'){root.hidden=true;return;}
  if(waitForShot!==null){if(demo.state.shotsUsed<=waitForShot)return;waitForShot=null;}
  if(!active)begin();if(!active){root.hidden=true;return;}elapsed+=dt;if(elapsed>6.5&&queue.length){active=null;begin();}paint();
 }
 window.gameGuide={get active(){return active;},get seen(){return [...seen];},get pending(){return [...queue];},lessonIds,geometry};requestAnimationFrame(frame);
})();
