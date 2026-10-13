(() => {
 'use strict';
 const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
 let W=600,H=900;
 const origin={x:300,y:816},bounds={left:18,right:582,top:18,bottom:882};
 const $=id=>document.getElementById(id);
 // Art changes presentation only; all collisions remain in the original flat room.
 const art={};
 const artFiles={courtyard:'toy-courtyard',player:'toy-player-poses',monster:'toy-monster',helmet:'toy-helmet-v3',shield:'toy-shield-v3',barrel:'toy-barrel',obstacle:'toy-wood',woodDamaged:'toy-wood-damaged',brick:'toy-brick',iron:'toy-iron-tile'};
 let assetsReady=typeof Image==='undefined';
 if(!assetsReady)for(const key of Object.keys(artFiles))art[key]=new Image();
 // Count decoded assets, not estimated download bytes. Keep the game gated on failure.
 function prepareAssets(){
  if(assetsReady)return;
  const jobs=[...Object.entries(artFiles).map(([key,file])=>({img:art[key],file})),...Array.from(document.querySelectorAll('img[data-asset]'),img=>({img,file:img.dataset.asset}))];
  const progress=$('loadingProgress'),status=$('loadingStatus'),retry=$('loadingRetry'),main=document.querySelector('main');
  let running=false;
  const completed=()=>jobs.filter(job=>job.done).length;
  const report=()=>{progress.max=jobs.length;progress.value=completed();status.textContent=`素材准备 ${completed()} / ${jobs.length} · ${Math.round(completed()/jobs.length*100)}%`;};
  const fetchImage=(job,attempt)=>new Promise((resolve,reject)=>{
   const img=job.img;let finished=false;
   const finish=error=>{if(finished)return;finished=true;clearTimeout(timer);img.onload=img.onerror=null;error?reject(error):resolve();};
   const timer=setTimeout(()=>finish(new Error('timeout')),45000);
   img.onload=async()=>{try{if(img.decode)await img.decode();if(!img.naturalWidth)throw new Error('empty');finish();}catch(error){finish(error);}};
   img.onerror=()=>finish(new Error('image'));
   // The third attempt is the original PNG, also a fallback for older WebP decoders.
   img.src=`assets/${job.file}.${attempt===2?'png':'webp'}${attempt===1?`?retry=${Date.now()}`:''}`;
  });
  async function run(){
   if(running)return;running=true;retry.hidden=true;report();
   await Promise.all(jobs.filter(job=>!job.done).map(async job=>{
    for(let attempt=0;attempt<3;attempt++)try{await fetchImage(job,attempt);job.done=true;report();return;}catch{/* Retry only this failed asset; keep all successful downloads. */}
   }));
   running=false;
   if(completed()!==jobs.length){status.textContent=`还有 ${jobs.length-completed()} 个素材未加载成功，请检查网络后重试。`;retry.hidden=false;return;}
   assetsReady=true;dragging=false;main.inert=false;document.body.classList.remove('loading');syncCanvas();draw();$('loadingScreen').hidden=true;
  }
  retry.onclick=run;run();
 }
 const ready=img=>img&&img.complete&&img.naturalWidth>0;
 let recoilUntil=0;
 let renderScale=1;
 const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 function syncCanvas(){const wrap=canvas.parentElement;if(wrap?.clientHeight){const availableHeight=Math.max(60,wrap.clientHeight-(wrap.querySelector('.arena-top')?.offsetHeight||0)-(wrap.querySelector('.arena-bottom')?.offsetHeight||0));const fit=Math.min(wrap.clientWidth/W,availableHeight/H);canvas.style.width=`${W*fit}px`;}const displayWidth=canvas.getBoundingClientRect?.().width||W;renderScale=Math.max(1,Math.min(3,window.devicePixelRatio||1)*displayWidth/W);const pixelWidth=Math.round(W*renderScale),pixelHeight=Math.round(H*renderScale);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}canvas.style.aspectRatio=`${W} / ${H}`;}
 window.addEventListener?.('resize',syncCanvas);
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(syncCanvas);observer.observe(canvas);if(canvas.parentElement)observer.observe(canvas.parentElement);}
 const levels=[
  {name:'基础 · 穿透与续能',sub:'普通 ×1 · 一条线三个目标',lesson:'瞄准一条线，一颗子弹穿过多个怪物。',hint:'拖动瞄准，松手开枪。把三个紫色怪串在同一路线上，命中会给子弹续能。',ammo:{normal:1},walls:[],enemies:[[300,680],[300,530],[300,380]],barrels:[]},
  {name:'铁墙 · 借墙绕路',sub:'普通 ×1 · 正面被挡住',lesson:'铁墙无法破坏，利用侧墙改变路线。',hint:'中间的铁墙挡住直射。朝侧墙找角度，让子弹反弹到墙后的怪物；底部落下就没了。',ammo:{normal:1},walls:[{x:180,y:550,w:240,h:22,type:'iron'}],enemies:[[300,420]],barrels:[]},
  {name:'头盔 · 两次命中',sub:'普通 ×2 · 先破盔再击倒',lesson:'头盔掉落会保留到下一枪。',hint:'第一枪打飞头盔，第二枪击倒。子弹结束后场景不会重置，等待下一枪即可；重试整关才会恢复头盔。',ammo:{normal:2},walls:[],enemies:[[300,620,'helmet']],barrels:[]},
  {name:'障碍 · 打开通道',sub:'普通 ×2 · 两枪打穿木障碍',lesson:'先让障碍出现裂纹，再打穿通道。',hint:'铁墙围住了目标，只能从下方的木色障碍进去。第一枪让它裂开，第二枪穿过碎掉的障碍，命中里面的怪物。',ammo:{normal:2},walls:[{x:200,y:200,w:20,h:320,type:'iron'},{x:380,y:200,w:20,h:320,type:'iron'},{x:200,y:180,w:200,h:20,type:'iron'},{x:200,y:520,w:200,h:22,type:'obstacle'}],enemies:[[300,460]],barrels:[]},
  {name:'爆炸 · 先炸砖墙',sub:'爆炸 ×1 + 普通 ×1',lesson:'先用爆炸弹开路，再用普通弹清怪。',hint:'砖墙打多少次都不会碎。爆炸弹炸开下方砖墙后就消失，距离较远的怪还活着，留普通弹补最后一枪。',ammo:{explosive:1,normal:1},walls:[{x:200,y:40,w:20,h:500,type:'iron'},{x:380,y:40,w:20,h:500,type:'iron'},{x:200,y:18,w:200,h:22,type:'iron'},{x:200,y:540,w:200,h:24,type:'brick'}],enemies:[[300,450]],barrels:[]},
  {name:'盾牌 · 从背后打',sub:'普通 ×1 · 顶墙回程',lesson:'盾牌正面挡弹，从上方返回可击倒。',hint:'蓝色怪的盾牌朝下。直接瞄它会被挡回底部，试着先射向顶部，让子弹回程命中背后。',ammo:{normal:1},walls:[],enemies:[[420,500,'shield']],barrels:[]},
  {name:'炸弹怪 · 借它清场',sub:'普通 ×1 · 找到红色突破口',lesson:'炸弹怪击倒后爆炸，可以绕过护甲和盾牌。',hint:'一颗普通弹不够逐个处理所有护甲。先打红色炸弹怪，它的小爆炸能带走附近的头盔怪、盾牌怪和普通怪。',ammo:{normal:1},walls:[],enemies:[[300,610,'bomb'],[335,585,'helmet'],[265,585,'shield'],[300,560]],barrels:[]},
  {name:'炸药桶 · 串起爆炸',sub:'普通 ×1 · 三个桶接力',lesson:'桶不是清怪目标，但能把爆炸传到远处。',hint:'先击中下方的桶，让三个桶接力引爆。一次子弹接触能解决左右分散的目标，桶本身不加分。',ammo:{normal:1},walls:[],enemies:[[230,630,'helmet'],[370,530,'shield'],[230,430]],barrels:[[300,650],[300,550],[300,450]]},
  {name:'穿甲 · 跑完长路线',sub:'穿甲 ×1 · 远距离回程',lesson:'穿甲弹的动能和速度更高，能完成长回程。',hint:'下方铁墙挡住盾牌正面。先向顶墙发射，再让穿甲弹跑到右侧盾牌的背后；路程较长，要用好穿甲弹。',ammo:{fast:1},walls:[{x:420,y:750,w:160,h:22,type:'iron'}],enemies:[[540,700,'shield']],barrels:[]},
  {name:'散弹 · 扇形覆盖',sub:'散弹 ×1 · 瞄准一片区域',lesson:'散弹从枪口集中射出，逐渐展开为扇形；距离越远，覆盖越宽。',hint:'用一条瞄准线对准怪群中间。弹丸会在飞行中逐渐向两侧展开，试着用扇形边缘覆盖左右目标；近处更集中，远处更分散。',ammo:{scatter:1},walls:[],enemies:[[90,606],[300,516],[510,606]],barrels:[]},
  {name:'策略 · 先开路再破盔',sub:'爆炸 ×1 + 普通 ×2',lesson:'有限弹药下，射击顺序也决定胜负。',hint:'先用爆炸弹打开砖墙，保留两颗普通弹处理头盔。先打普通弹会把它浪费在砖墙上；观察上一枪留下的状态再选弹。',ammo:{explosive:1,normal:2},walls:[{x:200,y:40,w:20,h:700,type:'iron'},{x:380,y:40,w:20,h:700,type:'iron'},{x:200,y:18,w:200,h:22,type:'iron'},{x:200,y:740,w:200,h:24,type:'brick'}],enemies:[[300,620,'helmet']],barrels:[]}
 ];
 levels.push({name:'效率测试 · 四区回廊',sub:'18 只怪 · 三种地形',hint:'木色障碍两次命中可打穿，砖墙需要爆炸，铁墙始终反弹。爆炸弹碰到可破坏地形会引爆，也能借炸弹怪和桶打开通道。',walls:[{x:245,y:615,w:145,h:22,type:'obstacle'},{x:180,y:320,w:90,h:22,type:'brick'},{x:400,y:150,w:90,h:22,type:'iron'}],enemies:[[115,595,'helmet'],[170,595,'shield'],[120,660,'bomb'],[175,650],[150,575],[345,65,'helmet'],[410,65,'shield'],[340,110,'bomb'],[410,115],[470,265,'helmet'],[535,275,'shield'],[465,330,'bomb'],[535,330],[505,350],[65,705,'helmet'],[130,700,'shield'],[65,760,'bomb'],[135,760]],barrels:[[145,620],[380,85],[505,300],[100,735]]});
 const terrainTypes={obstacle:{name:'普通障碍物',color:'#b59466',hp:2},brick:{name:'砖墙',color:'#b86f5b',hp:1},iron:{name:'铁墙',color:'#7d939e',hp:Infinity}};
 levels[levels.length-1].ammo={normal:2,fast:1,explosive:1,scatter:1};
 levels[levels.length-1].lesson='综合运用弹种、怪物和地形，在五发以内清场。';
 // Room size follows the lesson; physical radii, speed and ammo stay unchanged.
 const roomSizes=[[360,420],[420,520],[360,480],[360,480],[360,520],[420,520],[360,400],[360,560],[600,900],[420,420],[420,640],[600,900]];
 levels[0].enemies=[[300,740],[300,640],[300,540]];
 levels[1].walls=[{x:200,y:550,w:200,h:22,type:'iron'}];
 levels[2].enemies=[[360,620,'helmet']];
 levels[3].walls=[{x:200,y:530,w:20,h:170,type:'iron'},{x:380,y:530,w:20,h:170,type:'iron'},{x:200,y:520,w:200,h:10,type:'iron'},{x:200,y:700,w:200,h:22,type:'obstacle'}];
 levels[3].enemies=[[300,640]];
 levels[4].walls=[{x:200,y:500,w:20,h:190,type:'iron'},{x:380,y:500,w:20,h:190,type:'iron'},{x:200,y:490,w:200,h:10,type:'iron'},{x:200,y:690,w:200,h:24,type:'brick'}];
 levels[4].enemies=[[300,560]];
 levels[9].enemies=[[235,576],[300,596],[365,576]];
 levels[10].walls=[{x:200,y:300,w:20,h:440,type:'iron'},{x:380,y:300,w:20,h:440,type:'iron'},{x:200,y:278,w:200,h:22,type:'iron'},{x:200,y:740,w:200,h:24,type:'brick'}];
 levels[10].enemies=[[340,620,'helmet']];
 levels.forEach((l,i)=>{const [width,height]=roomSizes[i],offsetX=300-width/2,offsetY=816-(height-84);l.room={width,height};l.enemies=l.enemies.map(([x,y,type])=>[x-offsetX,y-offsetY,type]);l.barrels=l.barrels.map(([x,y])=>[x-offsetX,y-offsetY]);l.walls=l.walls.map(w=>({...w,x:w.x-offsetX,y:w.y-offsetY}));});
 // Formal levels use final room coordinates, after legacy tutorial translation.
 levels.splice(11,0,{name:'正式 · 分弹拆局',sub:'10只怪 · 四种弹各1发 · 8段障碍',lesson:'观察射击留下的变化，为四种弹药分配路线和目标。',hint:'先观察木障碍、砖墙和怪物的分布。开路之后，再考虑下一发能覆盖哪些目标；剩下的护甲和盾牌，也需要提前留出处理方式。',ammo:{normal:1,fast:1,explosive:1,scatter:1},room:{width:480,height:680},walls:[{x:230,y:18,w:20,h:280,type:'iron'},{x:18,y:330,w:120,h:20,type:'iron'},{x:345,y:315,w:117,h:20,type:'iron'},{x:185,y:500,w:100,h:20,type:'iron'},{x:80,y:440,w:110,h:20,type:'obstacle'},{x:285,y:440,w:110,h:20,type:'obstacle'},{x:65,y:255,w:165,h:22,type:'brick'},{x:250,y:250,w:180,h:22,type:'brick'}],enemies:[[70,140],[150,155,'helmet'],[105,180],[340,165,'helmet'],[410,155],[375,210,'shield'],[175,350],[235,335],[305,350],[387,385,'helmet']],barrels:[[90,225]]});
 const levelGroups={tutorial:{name:'教学关卡',short:'教学'},formal:{name:'正式关卡',short:'正式'},test:{name:'测试关卡',short:'测试'}};
 const groupCounts={tutorial:0,formal:0,test:0};
 levels.forEach(l=>{l.group=l.name.startsWith('正式 · ')?'formal':l.name.startsWith('效率测试 · ')?'test':'tutorial';l.number=++groupCounts[l.group];});
 function nextLevel(index){const group=levels[index].group;if(levels[index+1]?.group===group)return index+1;if(group==='tutorial'){const first=levels.findIndex(l=>l.group==='formal');if(first>=0)return first;}return index;}
 function configureRoom(index){recoilUntil=0;({width:W,height:H}=levels[index].room);origin.x=W/2;origin.y=H-84;bounds.right=W-18;bounds.bottom=H-18;$('gameLayout').style.setProperty?.('--stage-width',W+'px');syncCanvas();$('roomSize').textContent=`${W} × ${H}`;}
 const comparison={};
 const scoreRules={hit:10,comboStep:5,comboWindow:1};
 // Relative power is separate from the engine's time-based energy budget.
 const energyBalance={base:1.6,cap:4*2/3,recharge:.38*2/3};
 const ammoTypes={normal:{name:'普通子弹',sub:'动能 ×1 · 穿透弹射',power:1,color:'#c7f681',speed:1,duration:5.5,count:1,hint:'动能比例 1：一颗穿透弹，击中小怪续能。找好角度，借墙完成连击。'},fast:{name:'穿甲子弹',sub:'动能 ×1.5 · 贯穿木障与头盔',armorPiercing:true,power:1.5,color:'#7de0ff',speed:1.5,duration:7,count:1,hint:'动能比例 1.5，速度为普通弹的 1.5 倍。一击穿透木障碍、一击击倒头盔怪；砖墙、铁墙和盾牌仍会反弹。'},explosive:{name:'爆炸子弹',sub:'动能 ×0.8 · 一次爆炸',power:.8,color:'#ffab70',speed:1,duration:5.5,count:1,hint:'动能比例 0.8：首次碰到怪物或炸药桶，触发一次小范围爆炸。没命中则在耗尽时爆炸。'},scatter:{name:'散弹',sub:'动能 ×0.5 · 渐展扇形',power:.5,color:'#f4a7e8',speed:.9,duration:4,count:8,spread:48*Math.PI/180,startSpread:4*Math.PI/180,spreadTime:.25,hint:'每颗散弹动能比例 0.5：八颗弹丸沿瞄准方向射出，逐渐展开成扇形。近处集中、远处分散，瞄准怪群中间；每颗独立反弹和续能。'}};
 ammoTypes.explosive.hint+='爆炸后子弹立即消失，可引爆附近的炸药桶。';
 // Darker trails remain readable over the light courtyard; balance is unchanged.
 Object.assign(ammoTypes.normal,{color:'#8060bb'});Object.assign(ammoTypes.fast,{color:'#24769c'});Object.assign(ammoTypes.explosive,{color:'#cb692e'});Object.assign(ammoTypes.scatter,{color:'#a34d94'});
 for(const type of Object.values(ammoTypes)){type.energy=energyBalance.base*type.power;type.maxEnergy=energyBalance.cap*type.power;type.recharge=energyBalance.recharge*type.power;}
 let selectedAmmo='normal',state,aim={x:0,y:-1},dragging=false,previous=[],showPrevious=false,lastTime=0,screenShake=0,slow=0;
 const stats={shots:0};
 function newState(index){const l=levels[index];return {index,phase:'aim',ammo:selectedAmmo,inventory:Object.fromEntries(Object.keys(ammoTypes).map(key=>[key,l.ammo[key]||0])),shotsUsed:0,shotLog:[],enemies:l.enemies.map(([x,y,type='normal'],id)=>({x,y,type,id,r:type==='shield'?23:18,hp:type==='helmet'?2:1,alive:true,flash:0})),barrels:l.barrels.map(([x,y],id)=>({x,y,id,r:14,alive:true})),walls:l.walls.map((w,id)=>({...w,id,type:w.type||'iron',hp:terrainTypes[w.type||'iron'].hp,alive:true})),terrainDestroyed:0,bullet:null,bullets:[],score:0,baseScore:0,comboBonus:0,hitCount:0,comboCount:0,maxCombo:0,lastHitTime:-Infinity,explosions:0,bombExplosions:0,barrelExplosions:0,helmetBreaks:0,dropped:0,segments:[],particles:[],helmets:[],rings:[],labels:[],time:0,kills:0,bounces:0};}
 function remainingAmmo(){return Object.values(state.inventory).reduce((sum,n)=>sum+n,0);}
 function refreshAmmo(){document.querySelectorAll('.ammo-button').forEach(b=>{const key=b.dataset.ammo;b.hidden=!levels[state.index].ammo[key];b.classList.toggle('active',key===selectedAmmo);b.setAttribute('aria-pressed',String(key===selectedAmmo));b.disabled=state.phase!=='aim'||state.inventory[key]<=0;b.title=levels[state.index].ammo[key]?`本关配发 ${levels[state.index].ammo[key]} 发，剩余 ${state.inventory[key]} 发`:'本关未配发';b.setAttribute('aria-label',`${ammoTypes[key].name}，${b.title}`);});for(const key of Object.keys(ammoTypes))$('stock-'+key).textContent=levels[state.index].ammo[key]?`× ${state.inventory[key]}`:'本关未配发';$('ammoSummary').textContent=`本关剩余 ${remainingAmmo()} 发 · 已射击 ${state.shotsUsed} 次`;$('ammoHint').textContent=ammoTypes[selectedAmmo].hint;$('speed').value='800';$('speed').disabled=true;if(state.phase==='aim')$('combo').textContent=ammoTypes[selectedAmmo].name;refreshTrajectory();}
 function refreshTrajectory(){const button=$('viewTrajectory');button.disabled=state.phase!=='aim'||!previous.length||showPrevious;button.textContent=showPrevious?'上一枪轨迹已显示':'查看上一枪轨迹';button.title=previous.length?'只在本次瞄准中显示，下一枪或重试恢复隐藏':'先射击一次，下一枪或重试时可查看';}
 $('viewTrajectory').onclick=()=>{if(state.phase!=='aim'||!previous.length||showPrevious)return;showPrevious=true;refreshTrajectory();};
 function selectAmmo(type){if(!ammoTypes[type]||state.phase!=='aim'||state.inventory[type]<=0)return false;selectedAmmo=type;state.ammo=type;refreshAmmo();return true;}
 function load(index,keep=false){previous=keep&&state?.index===index?(state.segments.length?state.segments.map(s=>({...s})):previous):[];showPrevious=false;configureRoom(index);state=newState(index);if(!state.inventory[selectedAmmo])selectedAmmo=Object.keys(levels[index].ammo)[0];state.ammo=selectedAmmo;dragging=false;slow=0;screenShake=0;$('result').hidden=true;$('levelName').textContent=`${levelGroups[levels[index].group].short} ${String(levels[index].number).padStart(2,'0')} / ${levels[index].name.split(' · ')[1]}`;$('hint').textContent=levels[index].hint;$('lessonGoal').textContent=levels[index].lesson;$('stateText').textContent='拖动瞄准 · 松手开枪';refreshAmmo();updateCounter();refreshComparison();document.querySelectorAll('.level-button').forEach((b,i)=>b.classList.toggle('active',i===index));}
 function refreshComparison(){const r=comparison[state.index];$('comparison').hidden=false;$('comparisonRows').innerHTML=`<tr><td>本关</td><td>${r?r.last+'/'+state.enemies.length:'—'}</td><td>${r?r.best+'/'+state.enemies.length:'—'}</td><td>${r?r.bestScore:'—'}</td><td>${r?r.tries:0}</td></tr>`;refreshLessonElements();}
 function refreshLessonElements(){const l=levels[state.index],kinds=new Set(l.enemies.map(e=>e[2]||'normal'));for(const w of l.walls)kinds.add(w.type||'iron');if(l.barrels.length)kinds.add('barrel');document.querySelectorAll('[data-kind]').forEach(el=>el.hidden=!kinds.has(el.dataset.kind));const nav=$('levels'),active=nav.querySelector?.(`[data-level-index="${state.index}"]`);if(active){const top=active.getBoundingClientRect().top-nav.getBoundingClientRect().top+nav.scrollTop;if(top<nav.scrollTop)nav.scrollTop=top;else if(top+active.offsetHeight>nav.scrollTop+nav.clientHeight)nav.scrollTop=top+active.offsetHeight-nav.clientHeight;}}
 function updateCounter(){$('counter').textContent=`剩余 ${state.enemies.filter(e=>e.alive).length} 只`;$('scoreHud').textContent=`得分 ${state.score}`;}
 function scoreHit(e){e.hitVisualAt=state.time;state.hitCount++;state.comboCount=state.time-state.lastHitTime<=scoreRules.comboWindow+1e-9?state.comboCount+1:1;state.lastHitTime=state.time;state.maxCombo=Math.max(state.maxCombo,state.comboCount);const bonus=(state.comboCount-1)*scoreRules.comboStep;state.baseScore+=scoreRules.hit;state.comboBonus+=bonus;state.score=state.baseScore+state.comboBonus;$('scoreHud').textContent=`得分 ${state.score}`;if(!reducedMotion())$('scoreHud').animate?.([{transform:'scale(1)'},{transform:'scale(1.16)',offset:.3},{transform:'scale(1)'}],{duration:220});$('combo').textContent=state.comboCount>1?`${state.comboCount} 连击 · 额外 +${bonus}`:'命中 +10';state.labels.push({x:e.x,y:e.y-12,text:bonus?`+${scoreRules.hit} · 连击 +${bonus}`:`+${scoreRules.hit}`,life:.9});}
 function tone(name,pitch=1){window.gameAudio?.play(name,pitch);}
 function resultTone(won){if(won)slow=.15;tone(won?'win':'lose');}
 function burst(x,y,color,n=15){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*200;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,max:.7,color});}}
 function dropHelmet(e,bullet,label=true){if(e.hp!==2)return;e.hp=1;state.helmetBreaks++;state.helmets.push({x:e.x,y:e.y-12,vx:bullet&&bullet.vx<0?-105:105,vy:-160,angle:0,spin:bullet&&bullet.vx<0?-8:8,life:.85});burst(e.x,e.y-12,'#e8c879',8);if(label)state.labels.push({x:e.x,y:e.y-35,text:'头盔掉了！',life:.8});tone('helmet');}
 function hitEnemy(e,bullet){if(e.type==='helmet'&&e.hp===2&&!bullet.armorPiercing){scoreHit(e);dropHelmet(e,bullet);return;}kill(e,bullet);}
 function kill(e,bullet){if(!e.alive)return;if(e.type==='helmet')dropHelmet(e,bullet,false);e.alive=false;e.hp=0;state.kills++;scoreHit(e);if(bullet)bullet.energy=Math.min(bullet.maxEnergy,bullet.energy+bullet.recharge);burst(e.x,e.y,e.type==='shield'?'#85b9d1':e.type==='bomb'?'#ff8179':'#bd9cf5');tone('hit',1+Math.min(state.comboCount-1,7)*.07);updateCounter();if(e.type==='bomb'){state.bombExplosions++;blast(e.x,e.y,70,bullet,'#ff8179');}}
 function rectangleDistance(x,y,w){return Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)));}
 // The visible shield disk is also its collider; there is no hidden front sector.
 function shieldGeometry(e){return{x:e.x,y:e.y+e.r+5,r:e.r+1};}
 function destroyTerrain(w){if(w.alive===false||w.type==='iron'||!w.type)return;w.alive=false;w.hp=0;state.terrainDestroyed++;tone('break');burst(w.x+w.w/2,w.y+w.h/2,terrainTypes[w.type].color,20);}
 function blast(x,y,radius,bullet,color='#ffb075'){state.rings.push({x,y,r:0,max:radius,life:.38,color});burst(x,y,color,26);screenShake=5;slow=Math.max(slow,.13);tone('explosion');for(const w of state.walls)if(w.alive!==false&&rectangleDistance(x,y,w)<=radius)destroyTerrain(w);for(const e of state.enemies)if(e.alive&&Math.hypot(e.x-x,e.y-y)<radius+e.r)kill(e,bullet);for(const b of state.barrels)if(b.alive&&Math.hypot(b.x-x,b.y-y)<radius+b.r)explode(b,bullet);}
 function explode(barrel,bullet){if(!barrel.alive)return;barrel.alive=false;state.barrelExplosions++;blast(barrel.x,barrel.y,102,bullet);}
 function detonate(bullet){if(!bullet.explosionReady)return;bullet.explosionReady=false;bullet.alive=false;state.explosions++;blast(bullet.x,bullet.y,64,bullet);state.labels.push({x:bullet.x,y:bullet.y-25,text:'爆炸弹引爆！',life:.9});}
 function bounce(x,y,bullet){if(bullet)bullet.spreading=false;state.bounces++;state.rings.push({x,y,r:0,max:17,life:.16});tone('bounce',1+(state.bounces%4)*.03);}
 function shoot(){if(!assetsReady||state.phase!=='aim'||state.inventory[selectedAmmo]<=0)return false;state.inventory[selectedAmmo]--;state.shotsUsed++;state.shotLog.push(selectedAmmo);stats.shots++;state.phase='flying';state.ammo=selectedAmmo;state.comboCount=0;state.lastHitTime=-Infinity;showPrevious=false;const type=ammoTypes[selectedAmmo],speed=800*type.speed,angle=Math.atan2(aim.y,aim.x);state.bullets=Array.from({length:type.count},(_,i)=>{const position=type.count>1?i/(type.count-1)-.5:0,spreadAngle=position*(type.startSpread||0),a=angle+spreadAngle;return {id:i,x:origin.x,y:origin.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4,energy:type.energy,maxEnergy:type.maxEnergy,recharge:type.recharge,duration:type.duration,elapsed:0,spreadAngle,targetSpread:position*(type.spread||0),startSpread:spreadAngle,spreadTime:type.spreadTime||0,spreading:!!type.spread,shieldLock:0,armorPiercing:!!type.armorPiercing,hitEnemies:new Set(),hitWalls:new Set(),color:type.color,alive:true,explosionReady:selectedAmmo==='explosive'};});state.bullet=state.bullets[0];refreshAmmo();$('stateText').textContent=`第 ${state.shotsUsed} 枪 · ${type.count>1?'扇形散射':'正在飞行'}`;tone({normal:'shot',fast:'fast',scatter:'scatter',explosive:'explosiveShot'}[selectedAmmo]);return true;}
 function finish(){if(state.phase!=='flying')return;state.phase='settling';state.settle=.45;}
 function showResult(){
  const left=state.enemies.filter(e=>e.alive).length,won=left===0;
  if(!won&&remainingAmmo()>0){previous=state.segments.map(s=>({...s}));state.segments=[];showPrevious=false;state.bullet=null;state.bullets=[];state.phase='aim';state.comboCount=0;state.lastHitTime=-Infinity;if(!state.inventory[selectedAmmo])selectedAmmo=Object.keys(state.inventory).find(key=>state.inventory[key]>0);state.ammo=selectedAmmo;$('stateText').textContent=`第 ${state.shotsUsed} 枪结束 · 还有 ${remainingAmmo()} 发`;$('result').hidden=true;refreshAmmo();return;}
  state.phase='result';const old=comparison[state.index]||{tries:0,best:0,bestScore:0};comparison[state.index]={tries:old.tries+1,last:state.kills,best:Math.max(old.best,state.kills),lastScore:state.score,bestScore:Math.max(old.bestScore,state.score),lastShots:state.shotsUsed};refreshComparison();$('resultTag').textContent=won?'LEVEL CLEARED':'AMMO EMPTY';$('resultTitle').textContent=won?'漂亮，过关！':`弹药用尽 · 剩 ${left} 只`;$('resultScore').textContent=`${state.score} 分`;$('resultBreakdown').textContent=`命中 ${state.baseScore} 分 + 连击奖励 ${state.comboBonus} 分 · 最高 ${state.maxCombo} 连击`;$('resultDesc').textContent=`使用 ${state.shotsUsed} 发 · 清怪 ${state.kills}/${state.enemies.length} · ${state.bounces} 次反弹 · ${state.dropped} 颗落底`;$('resultAction').textContent=won?(nextLevel(state.index)===state.index?'再挑战一次':levels[nextLevel(state.index)].group!==levels[state.index].group?'进入正式关卡 →':'下一关 →'):'重试整关';$('result').hidden=false;$('stateText').textContent=won?'关卡完成':'重新规划弹药和角度';refreshAmmo();resultTone(won);
 }
 function update(dt){state.time+=dt;for(const h of state.helmets){h.x+=h.vx*dt;h.y+=h.vy*dt;h.vy+=480*dt;h.angle+=h.spin*dt;h.life-=dt;}state.helmets=state.helmets.filter(h=>h.life>0);for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-3*dt);p.vy*=Math.exp(-3*dt);if(p.wood){p.angle+=p.spin*dt;p.vy+=160*dt;}p.life-=dt;}state.particles=state.particles.filter(p=>p.life>0);for(const r of state.rings){r.r+=r.max*dt/.22;r.life-=dt;}state.rings=state.rings.filter(r=>r.life>0);for(const l of state.labels){l.y-=20*dt;l.life-=dt;}state.labels=state.labels.filter(l=>l.life>0);screenShake=Math.max(0,screenShake-dt*25);if(state.phase==='settling'){state.settle-=dt;if(state.settle<=0)showResult();return;}if(state.phase!=='flying')return;for(const b of state.bullets){if(!b.alive)continue;updateBullet(b,dt);if(!state.enemies.some(e=>e.alive)){finish();break;}}if(state.phase==='flying'&&!state.bullets.some(b=>b.alive))finish();}
 function updateBullet(b,dt){if(state.comboCount>0&&state.time-state.lastHitTime>scoreRules.comboWindow+1e-9){state.comboCount=0;$('combo').textContent='连击中断';}const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/3)),step=dt/steps;
  for(let i=0;i<steps;i++){const ox=b.x,oy=b.y;b.elapsed+=step;b.energy-=step;b.shieldLock=Math.max(0,b.shieldLock-step);
   if(b.spreading){const progress=Math.min(1,b.elapsed/b.spreadTime),ease=progress*progress*(3-2*progress),angle=b.startSpread+(b.targetSpread-b.startSpread)*ease,delta=angle-b.spreadAngle,c=Math.cos(delta),s=Math.sin(delta),vx=b.vx;b.vx=vx*c-b.vy*s;b.vy=vx*s+b.vy*c;b.spreadAngle=angle;if(progress===1)b.spreading=false;}
   b.x+=b.vx*step;b.y+=b.vy*step;
   if(b.y>=bounds.bottom){b.alive=false;b.explosionReady=false;b.exitReason='bottom';state.dropped++;state.segments.push({x1:ox,y1:oy,x2:b.x,y2:bounds.bottom,t:state.time,id:b.id,color:b.color});break;}
   if(b.x<bounds.left+b.r){b.x=bounds.left+b.r;b.vx=Math.abs(b.vx);bounce(b.x,b.y,b);}if(b.x>bounds.right-b.r){b.x=bounds.right-b.r;b.vx=-Math.abs(b.vx);bounce(b.x,b.y,b);}if(b.y<bounds.top+b.r){b.y=bounds.top+b.r;b.vy=Math.abs(b.vy);bounce(b.x,b.y,b);}
   for(const w of state.walls){
    if(w.alive===false)continue;
    if(rectangleDistance(b.x,b.y,w)>b.r+2)b.hitWalls.delete(w.id);
    if(!(b.x>w.x-b.r&&b.x<w.x+w.w+b.r&&b.y>w.y-b.r&&b.y<w.y+w.h+b.r))continue;
    if(b.explosionReady&&w.type&&w.type!=='iron'){detonate(b);break;}
    if(w.type==='obstacle'&&!b.hitWalls.has(w.id)){b.hitWalls.add(w.id);w.hp=b.armorPiercing?0:w.hp-1;if(w.hp<=0){destroyTerrain(w);continue;}w.crackedAt=state.time;w.damageX=Math.max(w.x,Math.min(w.x+w.w,b.x));w.damageY=Math.max(w.y,Math.min(w.y+w.h,b.y));tone('crack');woodSplinters(w.damageX,w.damageY);}
    if(ox<=w.x-b.r){b.x=w.x-b.r;b.vx=-Math.abs(b.vx);}else if(ox>=w.x+w.w+b.r){b.x=w.x+w.w+b.r;b.vx=Math.abs(b.vx);}else if(oy<=w.y-b.r){b.y=w.y-b.r;b.vy=-Math.abs(b.vy);}else{b.y=w.y+w.h+b.r;b.vy=Math.abs(b.vy);}bounce(b.x,b.y,b);
   }
   for(const e of state.enemies){
    const distance=Math.hypot(b.x-e.x,b.y-e.y);
    const shield=e.type==='shield'?shieldGeometry(e):null,shieldDistance=shield?Math.hypot(b.x-shield.x,b.y-shield.y):Infinity;
    if(distance>e.r+b.r+2&&(!shield||shieldDistance>shield.r+b.r+2))b.hitEnemies.delete(e.id);
    if(b.alive&&e.alive&&shield&&shieldDistance<shield.r+b.r&&!b.hitEnemies.has(e.id)&&(b.x-shield.x)*b.vx+(b.y-shield.y)*b.vy<0){
     b.hitEnemies.add(e.id);detonate(b);if(!b.alive)break;if(!e.alive)continue;
     if(!b.shieldLock){const length=shieldDistance||1,nx=(b.x-shield.x)/length,ny=(b.y-shield.y)/length,dot=b.vx*nx+b.vy*ny;b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.x=shield.x+nx*(shield.r+b.r+1);b.y=shield.y+ny*(shield.r+b.r+1);b.shieldLock=.06;e.blockVisualAt=state.time;bounce(b.x,b.y,b);tone('shield');state.labels.push({x:e.x,y:e.y-30,text:'盾牌挡住了',life:.6});}continue;
    }
    if(!b.alive||!e.alive||distance>=e.r+b.r||b.hitEnemies.has(e.id))continue;
    b.hitEnemies.add(e.id);detonate(b);if(!b.alive)break;if(!e.alive)continue;
    hitEnemy(e,b);
   }
   for(const barrel of state.barrels)if(b.alive&&barrel.alive&&Math.hypot(b.x-barrel.x,b.y-barrel.y)<barrel.r+b.r){detonate(b);explode(barrel,b);}
   state.segments.push({x1:ox,y1:oy,x2:b.x,y2:b.y,t:state.time,id:b.id,color:b.color});if(!b.alive||!state.enemies.some(e=>e.alive))break;if(b.energy<=0||b.elapsed>=b.duration){detonate(b);b.alive=false;break;}
  }
 }
 function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 function drawHelmet(x,y,angle=0,alpha=1){if(!ready(art.helmet))return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);const width=34,height=width*art.helmet.naturalHeight/art.helmet.naturalWidth;ctx.drawImage(art.helmet,-width/2,-height-3,width,height);ctx.restore();}
 // All background pieces use ONE uniform art scale. Larger rooms add pieces,
 // never stretch the source texture, wall bricks, grass or chalk drawings.
 const courtyardStyle={scale:18/96,floor:[320,420,320,320],wallWidth:96,topHeight:112,sideStart:300,sideHeight:480};
 let courtyardCache;
 function repeatArt(c,img,source,area,axis,mirror=false){const [sx,sy,sw,sh]=source,[x,y,w,h]=area,k=courtyardStyle.scale,tw=sw*k,th=sh*k;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const columns=axis==='y'?1:Math.ceil(w/tw),rows=axis==='x'?1:Math.ceil(h/th);for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){c.save();c.translate(x+col*tw+tw/2,y+row*th+th/2);if(mirror)c.scale(col%2?-1:1,row%2?-1:1);c.drawImage(img,sx,sy,sw,sh,-tw/2,-th/2,tw,th);c.restore();}c.restore();}
 function drawCourtyard(){ctx.fillStyle='#faf3e3';ctx.fillRect(0,0,W,H);if(!ready(art.courtyard))return;const key=`${W}/${H}/${canvas.width}/${canvas.height}`;if(courtyardCache?.key!==key){const surface=document.createElement('canvas');surface.width=canvas.width;surface.height=canvas.height;const c=surface.getContext('2d'),img=art.courtyard,s=courtyardStyle,k=s.scale,right=img.naturalWidth-s.wallWidth,topY=bounds.top-s.topHeight*k;
   c.setTransform(surface.width/W,0,0,surface.height/H,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';repeatArt(c,img,s.floor,[0,0,W,H],'both',true);
   // Include the photographed soft inward shadows, still at the same scale.
   const shadowWidth=64,shadow=shadowWidth*k;
   repeatArt(c,img,[0,s.sideStart,s.wallWidth+shadowWidth,s.sideHeight],[0,bounds.top,bounds.left+shadow,H-bounds.top],'y');
   repeatArt(c,img,[right-shadowWidth,s.sideStart,s.wallWidth+shadowWidth,s.sideHeight],[bounds.right-shadow,bounds.top,W-bounds.right+shadow,H-bounds.top],'y');
   repeatArt(c,img,[s.wallWidth,0,img.naturalWidth-s.wallWidth*2,s.topHeight+shadowWidth],[bounds.left,topY,bounds.right-bounds.left,(s.topHeight+shadowWidth)*k],'x');
   // Corners and the two entry ends keep their size. No wall across the bottom.
   c.drawImage(img,0,0,s.wallWidth,s.topHeight,0,topY,s.wallWidth*k,s.topHeight*k);c.drawImage(img,right,0,s.wallWidth,s.topHeight,bounds.right,topY,s.wallWidth*k,s.topHeight*k);
   courtyardCache={key,surface};
  }ctx.drawImage(courtyardCache.surface,0,0,W,H);}
 function groundShadow(x,y,width,height){ctx.save();ctx.fillStyle='#76543424';ctx.beginPath();ctx.ellipse(x+3,y+5,width,height,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 // Complete poses: arms, hands, gun and torso share a single immutable sprite.
 // Coordinates are measured on the 2172x724 atlas, with muzzle as pivot.
 const playerPoses=[{angle:-73,muzzle:[12,247]},{angle:-51,muzzle:[71,170]},{angle:0,muzzle:[229,67]},{angle:48,muzzle:[384,185]},{angle:73,muzzle:[431,269]}];
 function playerRig(){const angle=Math.atan2(aim.y,aim.x)+Math.PI/2;let index=0;for(let i=1;i<playerPoses.length;i++)if(Math.abs(angle-playerPoses[i].angle*Math.PI/180)<Math.abs(angle-playerPoses[index].angle*Math.PI/180))index=i;const pose=playerPoses[index];return{angle,index,frameAngle:pose.angle*Math.PI/180,residual:angle-pose.angle*Math.PI/180,scale:.12,muzzle:pose.muzzle};}
 function drawPlayer(){if(!ready(art.player))return;const rig=playerRig(),kick=reducedMotion()?0:Math.min(1,Math.max(0,recoilUntil-state.time)/.12)*3,img=art.player,cell=img.naturalWidth/5,k=rig.scale;ctx.save();ctx.translate(origin.x,origin.y+kick);ctx.rotate(rig.residual);groundShadow((cell/2-rig.muzzle[0])*k,(622-rig.muzzle[1])*k-3,20,6);ctx.drawImage(img,rig.index*cell,0,cell,img.naturalHeight,-rig.muzzle[0]*k,-rig.muzzle[1]*k,cell*k,img.naturalHeight*k);ctx.restore();if(kick>0){ctx.save();ctx.globalAlpha=kick/3;circle(origin.x,origin.y,7,'#ffd36b');circle(origin.x,origin.y,3,'#fff9e9');ctx.restore();}}
 // A terrain's dimensions define clipping, not independent image scales.
 // Long barriers repeat square pieces; their end pieces are clipped, never stretched.
 function woodSplinters(x,y){for(let i=0;i<9;i++){const a=i*Math.PI*2/9,s=45+(i%3)*25;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+(i%3)*.1,max:.55,color:i%2?'#d9a35d':'#885124',wood:true,angle:a,spin:(i%2?1:-1)*5,width:3+i%3,height:1.5});}}
 function drawTerrain(w){const type=w.type||'iron',damaged=type==='obstacle'&&w.hp===1,img=damaged&&ready(art.woodDamaged)?art.woodDamaged:art[type];groundShadow(w.x+w.w/2,w.y+w.h/2,Math.max(4,w.w/2),Math.max(4,w.h/2));ctx.save();
  if(damaged){const age=state.time-(w.crackedAt??-Infinity);if(!reducedMotion()&&age<.16)ctx.translate(Math.sin(age*75)*(1-age/.16)*1.2,0);}
  if(ready(img)){const side=Math.min(w.w,w.h),k=side/Math.min(img.naturalWidth,img.naturalHeight),tw=img.naturalWidth*k,th=img.naturalHeight*k;ctx.beginPath();ctx.rect(w.x,w.y,w.w,w.h);ctx.clip();for(let y=w.y;y<w.y+w.h;y+=th)for(let x=w.x;x<w.x+w.w;x+=tw)ctx.drawImage(img,x,y,tw,th);}ctx.restore();}
 function drawBarrel(b){if(!ready(art.barrel))return;groundShadow(b.x,b.y+6,13,6);const width=28,height=width*art.barrel.naturalHeight/art.barrel.naturalWidth;ctx.drawImage(art.barrel,b.x-width/2,b.y-height/2,width,height);}
 function drawEnemy(e){const bob=reducedMotion()?0:Math.sin(state.time*2+e.id)*.7;groundShadow(e.x,e.y+e.r*.55,e.r*.88,e.r*.38);if(ready(art.monster)){ctx.save();if(e.type==='bomb')ctx.filter='hue-rotate(95deg) saturate(1.4)';if(e.type==='shield')ctx.filter='hue-rotate(-45deg)';const width=e.r*2,height=width*954/964;ctx.drawImage(art.monster,145,167,964,954,e.x-width/2,e.y-height/2+bob,width,height);ctx.restore();}if(e.type==='helmet'&&e.hp===2)drawHelmet(e.x,e.y-6+bob);if(e.type==='bomb'){line(e.x,e.y-17+bob,e.x+7,e.y-29+bob,'#714931',3);circle(e.x+7,e.y-29+bob,3+Math.sin(state.time*9)*1.2,'#ffb52f');}if(e.type==='shield'&&ready(art.shield)){const s=shieldGeometry(e),age=e.blockVisualAt===undefined?Infinity:state.time-e.blockVisualAt;ctx.save();if(!reducedMotion()&&age<.18)ctx.filter=`brightness(${1+(1-age/.18)*.5})`;ctx.drawImage(art.shield,s.x-s.r,s.y-s.r,s.r*2,s.r*2);ctx.restore();}}
 function draw(){ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.clearRect(0,0,W,H);ctx.save();if(screenShake&&!reducedMotion())ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);drawCourtyard();line(bounds.left,bounds.bottom,bounds.left,bounds.top,'#655a46',1);line(bounds.left,bounds.top,bounds.right,bounds.top,'#655a46',1);line(bounds.right,bounds.top,bounds.right,bounds.bottom,'#655a46',1);
  if(state.phase==='aim'&&showPrevious&&previous.length){ctx.save();ctx.globalAlpha=.17;ctx.beginPath();for(const s of previous){ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);}ctx.strokeStyle=ammoTypes[selectedAmmo].color;ctx.lineWidth=1;ctx.stroke();ctx.restore();}
  for(const w of state.walls)if(w.alive!==false)drawTerrain(w);
  for(const b of state.barrels)if(b.alive)drawBarrel(b);
  for(const e of state.enemies)if(e.alive)drawEnemy(e);
  for(const e of state.enemies)if(e.alive&&e.hitVisualAt!==undefined){const age=state.time-e.hitVisualAt;if(age<.16){ctx.save();ctx.globalAlpha=(1-age/.16)*.45;circle(e.x,e.y,e.r,'#ffffff');ctx.restore();}}
  for(const h of state.helmets)drawHelmet(h.x,h.y,h.angle,Math.min(1,h.life*4));
  for(const r of state.rings){ctx.globalAlpha=Math.max(0,r.life/.38);ctx.strokeStyle=r.color||(r.max>20?'#ffb576':'#dbffa1');ctx.lineWidth=r.max>20?5:2;ctx.beginPath();ctx.arc(r.x,r.y,Math.min(r.max,r.r),0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  for(const s of state.segments){const age=state.time-s.t;if(age>.48)continue;ctx.globalAlpha=(1-age/.48)*.7;line(s.x1,s.y1,s.x2,s.y2,s.color,selectedAmmo==='scatter'?2:3);}ctx.globalAlpha=1;
  if(state.phase==='aim')drawAim();drawPlayer();
  if(state.phase==='flying'){for(const b of state.bullets)if(b.alive){ctx.shadowBlur=18;ctx.shadowColor=b.color;circle(b.x,b.y,selectedAmmo==='scatter'?3.5:5,'#fbffde');ctx.shadowBlur=0;if(b.explosionReady){ctx.strokeStyle=b.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,8,0,Math.PI*2);ctx.stroke();}}const living=state.bullets.filter(b=>b.alive),fraction=living.length?Math.max(...living.map(b=>Math.max(0,b.energy/b.maxEnergy))):0;ctx.fillStyle='#2e3d2e';ctx.fillRect(W/2-65,origin.y+32,130,3);ctx.fillStyle=ammoTypes[selectedAmmo].color;ctx.fillRect(W/2-65,origin.y+32,130*fraction,3);}
  for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life/.25);if(p.wood){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.fillRect(-p.width/2,-p.height/2,p.width,p.height);ctx.restore();}else circle(p.x,p.y,2.5,p.color);}ctx.globalAlpha=1;ctx.font='bold 13px "Microsoft YaHei",sans-serif';ctx.textAlign='center';for(const l of state.labels){ctx.globalAlpha=Math.min(1,l.life*3);ctx.fillStyle='#553779';ctx.fillText(l.text,l.x,l.y);}ctx.globalAlpha=1;ctx.restore();}
 function drawAim(){const dx=aim.x,dy=aim.y;let t=Infinity,axis='y';if(dx>0)t=(bounds.right-4-origin.x)/dx;if(dx<0)t=(bounds.left+4-origin.x)/dx;const ty=(bounds.top+4-origin.y)/dy;if(ty<t){t=ty;axis='y';}else axis='x';let hitWall=false;for(const w of state.walls){if(w.alive===false||(ammoTypes[selectedAmmo].armorPiercing&&w.type==='obstacle'))continue;if(dx===0&&(origin.x<w.x-4||origin.x>w.x+w.w+4))continue;const tx1=dx===0?-Infinity:(w.x-4-origin.x)/dx,tx2=dx===0?Infinity:(w.x+w.w+4-origin.x)/dx,ty1=(w.y-4-origin.y)/dy,ty2=(w.y+w.h+4-origin.y)/dy;const nearX=Math.min(tx1,tx2),farX=Math.max(tx1,tx2),nearY=Math.min(ty1,ty2),farY=Math.max(ty1,ty2),near=Math.max(nearX,nearY);if(near>0&&near<Math.min(farX,farY)&&near<t){t=near;axis=nearX>nearY?'x':'y';hitWall=true;}}
  const x=origin.x+dx*t,y=origin.y+dy*t;ctx.save();ctx.setLineDash([5,7]);line(origin.x,origin.y,x,y,'#72608790',1.5);line(x,y,x+(axis==='x'?-dx:dx)*85,y+(axis==='y'?-dy:dy)*85,'#72608760',1.5);ctx.setLineDash([]);circle(x,y,3,'#826799');ctx.restore();}
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
 function setAim(e){const p=point(e),dx=p.x-origin.x,dy=Math.min(-30,p.y-origin.y),len=Math.hypot(dx,dy);aim={x:dx/len,y:dy/len};}
 canvas.addEventListener('pointerdown',e=>{if(!assetsReady||state.phase!=='aim')return;dragging=true;canvas.setPointerCapture(e.pointerId);setAim(e);});canvas.addEventListener('pointermove',e=>{if(dragging)setAim(e);});canvas.addEventListener('pointerup',e=>{if(!dragging)return;setAim(e);dragging=false;shoot();});canvas.addEventListener('pointercancel',()=>dragging=false);
 $('retry').onclick=()=>{tone('ui');load(state.index,true);};$('resultAction').onclick=()=>{tone('ui');const won=!state.enemies.some(e=>e.alive);load(won?nextLevel(state.index):state.index,!won);};document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&e.target.tagName!=='SELECT')load(state.index,true);});
 $('openLevels').onclick=()=>{const panel=$('levelPanel');panel.open=!panel.open;$('openLevels').setAttribute('aria-expanded',String(panel.open));if(panel.open)panel.scrollIntoView?.({behavior:'smooth',block:'nearest'});};
 $('levelPanel').addEventListener('toggle',()=>{$('openLevels').setAttribute('aria-expanded',String($('levelPanel').open));if($('levelPanel').open)$('closeLevels')?.focus?.();});
 if($('closeLevels'))$('closeLevels').onclick=()=>{$('levelPanel').open=false;$('openLevels').focus?.();};
 document.addEventListener('keydown',e=>{if(!$('levelPanel').open)return;if(e.key==='Escape'){$('levelPanel').open=false;$('openLevels').focus?.();}if(e.key==='Tab'){const controls=Array.from(document.querySelectorAll('aside button,aside summary,aside input')).filter(el=>!el.disabled&&el.getClientRects().length),first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
 levels.forEach((l,i)=>{if(i===0||l.group!==levels[i-1].group){const title=document.createElement('h3');title.className='level-group-title';title.dataset.group=l.group;title.innerHTML=`<span>${levelGroups[l.group].name}</span><small>${groupCounts[l.group]} 关</small>`;$('levels').append(title);}const b=document.createElement('button');b.className='level-button';b.dataset.levelIndex=String(i);b.dataset.group=l.group;b.innerHTML=`<span class="number">${String(l.number).padStart(2,'0')}</span><span><strong>${l.name.split(' · ')[1]}</strong><small>${l.sub}</small></span>`;b.onclick=()=>{load(i);$('levelPanel').open=false;};$('levels').append(b);});
 Object.entries(ammoTypes).forEach(([key,type])=>{const b=document.createElement('button');b.className='ammo-button';b.dataset.ammo=key;b.style.setProperty('--bullet-color',type.color);b.innerHTML=`<img class="ammo-icon" data-asset="toy-${key}" alt=""><span><strong>${{normal:'普通',fast:'穿甲',explosive:'爆炸',scatter:'散弹'}[key]}</strong><small>${type.sub}</small><b class="ammo-count" id="stock-${key}"></b></span>`;b.onclick=()=>selectAmmo(key);$('ammoChoices').append(b);});
 load(Math.max(0,levels.findIndex(l=>l.group==='formal')));let lastShotCount=stats.shots;function frame(time){let dt=Math.min(.032,(time-lastTime)/1000||.016);lastTime=time;if(lastShotCount!==stats.shots){lastShotCount=stats.shots;recoilUntil=state.time+.12;}if(slow>0){slow-=dt;dt*=.35;}update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
 prepareAssets();
 // Small diagnostic surface for repeatable shot and physics verification.
 window.demo={get assetsReady(){return assetsReady;},get state(){return state;},get stage(){return {W,H,origin,bounds};},get playerRig(){return playerRig();},shieldGeometry,comparison,levels,ammoTypes,scoreRules,selectAmmo,load,shootAt(x,y){if(state.phase!=='aim')return;const dx=x-origin.x,dy=Math.min(-30,y-origin.y),length=Math.hypot(dx,dy);aim={x:dx/length,y:dy/length};shoot();},step:update,stats};
})();
