(() => {
 'use strict';
 const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
 let W=600,H=900;
 const origin={x:300,y:816},bounds={left:18,right:582,top:18,bottom:882};
 const $=id=>document.getElementById(id);
 // Art changes presentation only; all collisions remain in the original flat room.
 const art={};
 const artFiles={courtyard:'toy-courtyard-lawn-v1',gardenDecor:'toy-garden-decor-v1',player:'toy-player-poses',monster:'toy-bomb-satin-v1',normalMonster:'toy-normal-sculpt-v2',helmet:'toy-windup-cover-v1',helmetMonster:'toy-windup-armored-v1',helmetBare:'toy-windup-bare-v1',shield:'toy-shield-peek-v1',barrel:'toy-barrel',obstacle:'toy-wood-satin-v2',woodDamaged:'toy-wood-damaged-satin-v2',brick:'toy-limestone-v1',iron:'toy-basalt-v1'};
 let assetsReady=typeof Image==='undefined';
 let gameEntered=assetsReady;
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
   status.textContent='正在准备持枪小人…';await window.playerModelReady;
   assetsReady=true;status.textContent=window.playerModel?.ready?'准备就绪 · 点击进入，音乐随即开启':'准备就绪 · 使用兼容人物画面';$('loadingStart').hidden=false;
  }
  $('loadingStart').onclick=async()=>{
   const button=$('loadingStart');if(!assetsReady||button.disabled)return;
   button.disabled=true;button.textContent='正在准备音乐…';
   try{await window.gameAudio?.start();}finally{
    gameEntered=true;dragging=false;main.inert=false;document.body.classList.remove('loading');syncCanvas();draw();$('loadingScreen').hidden=true;
   }
  };
  retry.onclick=run;run();
 }
 const ready=img=>img&&img.complete&&img.naturalWidth>0;
 let recoilUntil=0;
 let renderScale=1;
 const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 function syncCanvas(){const wrap=canvas.parentElement;if(wrap?.clientHeight){const availableHeight=Math.max(60,wrap.clientHeight-(wrap.querySelector('.arena-top')?.offsetHeight||0)-(wrap.querySelector('.arena-bottom')?.offsetHeight||0));const availableWidth=Math.max(60,wrap.clientWidth-(window.gardenFrame?32:0));const fit=Math.min(availableWidth/W,availableHeight/H);canvas.style.width=`${W*fit}px`;}const displayWidth=canvas.getBoundingClientRect?.().width||W;renderScale=Math.max(1,Math.min(3,window.devicePixelRatio||1)*displayWidth/W);const pixelWidth=Math.round(W*renderScale),pixelHeight=Math.round(H*renderScale);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}canvas.style.aspectRatio=`${W} / ${H}`;}
 window.addEventListener?.('resize',syncCanvas);
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(syncCanvas);observer.observe(canvas);if(canvas.parentElement)observer.observe(canvas.parentElement);}
 const levels=[
  {name:'基础 · 穿透与续能',sub:'普通 ×1 · 一条线三个目标',lesson:'瞄准一条线，一颗子弹穿过多个怪物。',hint:'拖动瞄准，松手开枪。把三个紫色怪串在同一路线上，命中会给子弹续能。',ammo:{normal:1},walls:[],enemies:[[300,680],[300,530],[300,380]],barrels:[]},
  {name:'加固石墙 · 借墙绕路',sub:'普通 ×1 · 正面被挡住',lesson:'加固石墙无法破坏，利用侧墙改变路线。',hint:'中间的加固石墙挡住直射。朝侧墙找角度，让子弹反弹到墙后的怪物；底部落下就没了。',ammo:{normal:1},walls:[{x:180,y:550,w:240,h:22,type:'iron'}],enemies:[[300,420]],barrels:[]},
  {name:'头盔 · 两次命中',sub:'普通 ×2 · 先破盔再击倒',lesson:'头盔掉落会保留到下一枪。',hint:'第一枪打飞头盔，第二枪击倒。子弹结束后场景不会重置，等待下一枪即可；重试整关才会恢复头盔。',ammo:{normal:2},walls:[],enemies:[[300,620,'helmet']],barrels:[]},
  {name:'障碍 · 打开通道',sub:'普通 ×2 · 两枪打穿木障碍',lesson:'先让障碍出现裂纹，再打穿通道。',hint:'加固石墙围住了目标，只能从下方的木色障碍进去。第一枪让它裂开，第二枪穿过碎掉的障碍，命中里面的怪物。',ammo:{normal:2},walls:[{x:200,y:200,w:20,h:320,type:'iron'},{x:380,y:200,w:20,h:320,type:'iron'},{x:200,y:180,w:200,h:20,type:'iron'},{x:200,y:520,w:200,h:22,type:'obstacle'}],enemies:[[300,460]],barrels:[]},
  {name:'爆炸 · 先炸石墙',sub:'爆炸 ×1 + 普通 ×1',lesson:'先用爆炸弹开路，再用普通弹清怪。',hint:'石墙打多少次都不会碎。爆炸弹炸开下方石墙后就消失，距离较远的怪还活着，留普通弹补最后一枪。',ammo:{explosive:1,normal:1},walls:[{x:200,y:40,w:20,h:500,type:'iron'},{x:380,y:40,w:20,h:500,type:'iron'},{x:200,y:18,w:200,h:22,type:'iron'},{x:200,y:540,w:200,h:24,type:'brick'}],enemies:[[300,450]],barrels:[]},
  {name:'盾牌 · 从背后打',sub:'普通 ×1 · 顶墙回程',lesson:'盾牌正面挡弹，从上方返回可击倒。',hint:'蓝色怪的盾牌朝下。直接瞄它会被挡回底部，试着先射向顶部，让子弹回程命中背后。',ammo:{normal:1},walls:[],enemies:[[420,500,'shield']],barrels:[]},
  {name:'炸弹怪 · 借它清场',sub:'普通 ×1 · 找到红色突破口',lesson:'炸弹怪击倒后爆炸，可以绕过护甲和盾牌。',hint:'一颗普通弹不够逐个处理所有护甲。先打红色炸弹怪，它的小爆炸能带走附近的头盔怪、盾牌怪和普通怪。',ammo:{normal:1},walls:[],enemies:[[300,610,'bomb'],[335,585,'helmet'],[265,585,'shield'],[300,560]],barrels:[]},
  {name:'炸药桶 · 串起爆炸',sub:'普通 ×1 · 三个桶接力',lesson:'桶不是清怪目标，但能把爆炸传到远处。',hint:'先击中下方的桶，让三个桶接力引爆。一次子弹接触能解决左右分散的目标，桶本身不加分。',ammo:{normal:1},walls:[],enemies:[[230,630,'helmet'],[370,530,'shield'],[230,430]],barrels:[[300,650],[300,550],[300,450]]},
  {name:'穿甲 · 跑完长路线',sub:'穿甲 ×1 · 远距离回程',lesson:'穿甲弹的动能和速度更高，能完成长回程。',hint:'下方加固石墙挡住盾牌正面。先向顶墙发射，再让穿甲弹跑到右侧盾牌的背后；路程较长，要用好穿甲弹。',ammo:{fast:1},walls:[{x:420,y:750,w:160,h:22,type:'iron'}],enemies:[[540,700,'shield']],barrels:[]},
  {name:'散弹 · 扇形覆盖',sub:'散弹 ×1 · 瞄准一片区域',lesson:'散弹从枪口集中射出，逐渐展开为扇形；距离越远，覆盖越宽。',hint:'用一条瞄准线对准怪群中间。弹丸会在飞行中逐渐向两侧展开，试着用扇形边缘覆盖左右目标；近处更集中，远处更分散。',ammo:{scatter:1},walls:[],enemies:[[90,606],[300,516],[510,606]],barrels:[]},
  {name:'策略 · 先开路再破盔',sub:'爆炸 ×1 + 普通 ×2',lesson:'有限弹药下，射击顺序也决定胜负。',hint:'先用爆炸弹打开石墙，保留两颗普通弹处理头盔。先打普通弹会把它浪费在石墙上；观察上一枪留下的状态再选弹。',ammo:{explosive:1,normal:2},walls:[{x:200,y:40,w:20,h:700,type:'iron'},{x:380,y:40,w:20,h:700,type:'iron'},{x:200,y:18,w:200,h:22,type:'iron'},{x:200,y:740,w:200,h:24,type:'brick'}],enemies:[[300,620,'helmet']],barrels:[]}
 ];
 levels.push({name:'效率测试 · 四区回廊',sub:'18 只怪 · 三种地形',hint:'木色障碍两次命中可打穿，石墙需要爆炸，加固石墙始终反弹。爆炸弹碰到可破坏地形会引爆，也能借炸弹怪和桶打开通道。',walls:[{x:245,y:615,w:145,h:22,type:'obstacle'},{x:180,y:320,w:90,h:22,type:'brick'},{x:400,y:150,w:90,h:22,type:'iron'}],enemies:[[115,595,'helmet'],[170,595,'shield'],[120,660,'bomb'],[175,650],[150,575],[345,65,'helmet'],[410,65,'shield'],[340,110,'bomb'],[410,115],[470,265,'helmet'],[535,275,'shield'],[465,330,'bomb'],[535,330],[505,350],[65,705,'helmet'],[130,700,'shield'],[65,760,'bomb'],[135,760]],barrels:[[145,620],[380,85],[505,300],[100,735]]});
 const terrainTypes={obstacle:{name:'普通障碍物',color:'#b59466',hp:2},brick:{name:'石墙',color:'#c5b89b',hp:1},iron:{name:'加固石墙',color:'#58616a',hp:Infinity}};
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
 levels.splice(11,0,{name:'正式 · 分弹拆局',sub:'10只怪 · 四种弹各1发 · 8段障碍',lesson:'观察射击留下的变化，为四种弹药分配路线和目标。',hint:'先观察木障碍、石墙和怪物的分布。开路之后，再考虑下一发能覆盖哪些目标；剩下的护甲和盾牌，也需要提前留出处理方式。',ammo:{normal:1,fast:1,explosive:1,scatter:1},room:{width:480,height:680},walls:[{x:230,y:18,w:20,h:280,type:'iron'},{x:18,y:330,w:120,h:20,type:'iron'},{x:345,y:315,w:117,h:20,type:'iron'},{x:185,y:500,w:100,h:20,type:'iron'},{x:80,y:440,w:110,h:20,type:'obstacle'},{x:285,y:440,w:110,h:20,type:'obstacle'},{x:65,y:255,w:165,h:22,type:'brick'},{x:250,y:250,w:180,h:22,type:'brick'}],enemies:[[70,140],[150,155,'helmet'],[105,180],[340,165,'helmet'],[410,155],[375,210,'shield'],[175,350],[235,335],[305,350],[387,385,'helmet']],barrels:[[90,225]]});
 const levelGroups={tutorial:{name:'教学关卡',short:'教学'},formal:{name:'正式关卡',short:'正式'},test:{name:'测试关卡',short:'测试'}};
 // Keep the original efficiency arena last so its benchmark remains unchanged.
 levels.splice(12,0,{name:'效率测试 · 转向工坊',sub:'转向挡板 · 普通弹 ×2',lesson:'先借当前斜面反弹，再利用转动后的斜面安排下一枪。',hint:'金色挡板碰到子弹会转90度。先看它当前把子弹送向哪边，再看下一枪的路线；重试会恢复原角度。',ammo:{normal:2},room:{width:420,height:560},walls:[],enemies:[[60,260],[360,260]],barrels:[],rotors:[{x:210,y:250,length:112,thickness:12,angle:-Math.PI/4}]});
 const groupCounts={tutorial:0,formal:0,test:0};
 // Early campaign: familiar rules first, with spare ammo and broad aiming windows.
 const legacyChallenge=levels.find(l=>l.name==='正式 · 分弹拆局');legacyChallenge.name='效率测试 · 分弹拆局';
 levels.splice(11,0,
  {name:'正式 · 折返小院',sub:'4只怪 · 普通弹 ×2',lesson:'观察挡板与分散目标，试着让一枪经过更多地方。',hint:'加固石墙不会损坏。先看目标之间的空隙，出手后再观察子弹实际经过了哪里。',ammo:{normal:2},room:{width:420,height:480},enemies:[[305,300],[350,150],[280,90],[140,100]],walls:[{x:160,y:320,w:100,h:14,type:'iron'}],barrels:[]},
  {name:'正式 · 错位回廊',sub:'4只怪 · 普通弹 ×3',lesson:'把挡板当作路线的一部分，给剩余目标留出处理空间。',hint:'不同挡板会影响不同方向的子弹。每一枪后，已经击倒的目标都会保留。',ammo:{normal:3},room:{width:440,height:560},enemies:[[90,255],[270,255],[140,135],[290,125]],walls:[{x:150,y:330,w:140,h:16,type:'iron'},{x:100,y:210,w:95,h:16,type:'iron'}],barrels:[]},
  {name:'正式 · 双庭回响',sub:'4只怪 · 普通弹 ×3',lesson:'比较两边的地形，安排各枪负责的目标。',hint:'两边的布局并不相同。先看这一枪能经过哪些目标，再决定下一枪的方向。',ammo:{normal:3},room:{width:460,height:600},enemies:[[90,300],[140,150],[350,260],[305,135]],walls:[{x:220,y:18,w:20,h:360,type:'iron'},{x:60,y:225,w:90,h:14,type:'iron'},{x:310,y:185,w:95,h:14,type:'iron'}],barrels:[]}
 );
 levels.forEach(l=>{l.group=l.name.startsWith('正式 · ')?'formal':l.name.startsWith('效率测试 · ')?'test':'tutorial';l.number=++groupCounts[l.group];});
 function nextLevel(index){const group=levels[index].group;if(levels[index+1]?.group===group)return index+1;if(group==='tutorial'){const first=levels.findIndex(l=>l.group==='formal');if(first>=0)return first;}return index;}
 function configureRoom(index){recoilUntil=0;({width:W,height:H}=levels[index].room);origin.x=W/2;origin.y=H-84;bounds.right=W-18;bounds.bottom=H-18;$('gameLayout').style.setProperty?.('--stage-width',W+'px');syncCanvas();$('roomSize').textContent=`${W} × ${H}`;}
 const comparison={};
 const scoreRules={hit:10,comboStep:5,comboWindow:1};
 // Relative power is separate from the engine's time-based energy budget.
 const energyBalance={base:1.6,cap:4*2/3,recharge:.38*2/3};
 const ammoTypes={normal:{name:'普通子弹',sub:'动能 ×1 · 穿透弹射',power:1,color:'#c7f681',speed:1,duration:5.5,count:1,hint:'动能比例 1：一颗穿透弹，击中小怪续能。找好角度，借墙完成连击。'},fast:{name:'穿甲子弹',sub:'动能 ×1.5 · 贯穿木障与头盔',armorPiercing:true,power:1.5,color:'#7de0ff',speed:1.5,duration:7,count:1,hint:'动能比例 1.5，速度为普通弹的 1.5 倍。一击穿透木障碍、一击击倒头盔怪；石墙、加固石墙和盾牌仍会反弹。'},explosive:{name:'爆炸子弹',sub:'动能 ×0.8 · 一次爆炸',power:.8,color:'#ffab70',speed:1,duration:5.5,count:1,hint:'动能比例 0.8：首次碰到怪物或炸药桶，触发一次小范围爆炸。没命中则在耗尽时爆炸。'},scatter:{name:'散弹',sub:'动能 ×0.5 · 渐展扇形',power:.5,color:'#f4a7e8',speed:.9,duration:4,count:8,spread:48*Math.PI/180,startSpread:4*Math.PI/180,spreadTime:.25,hint:'每颗散弹动能比例 0.5：八颗弹丸沿瞄准方向射出，逐渐展开成扇形。近处集中、远处分散，瞄准怪群中间；每颗独立反弹和续能。'}};
 ammoTypes.explosive.hint+='爆炸后子弹立即消失，可引爆附近的炸药桶。';
 // Darker trails remain readable over the light courtyard; balance is unchanged.
 Object.assign(ammoTypes.normal,{color:'#8060bb'});Object.assign(ammoTypes.fast,{color:'#24769c'});Object.assign(ammoTypes.explosive,{color:'#cb692e'});Object.assign(ammoTypes.scatter,{color:'#a34d94'});
 for(const type of Object.values(ammoTypes)){type.energy=energyBalance.base*type.power;type.maxEnergy=energyBalance.cap*type.power;type.recharge=energyBalance.recharge*type.power;}
 let selectedAmmo='normal',state,aim={x:0,y:-1},dragging=false,previous=[],showPrevious=false,lastTime=0,screenShake=0,slow=0;
 const stats={shots:0};
 function newState(index){const l=levels[index];return {index,phase:'aim',ammo:selectedAmmo,inventory:Object.fromEntries(Object.keys(ammoTypes).map(key=>[key,l.ammo[key]||0])),shotsUsed:0,shotLog:[],enemies:l.enemies.map(([x,y,type='normal'],id)=>({x,y,type,id,r:type==='shield'?23:18,hp:type==='helmet'?2:1,alive:true,flash:0})),barrels:l.barrels.map(([x,y],id)=>({x,y,id,r:14,alive:true})),walls:l.walls.map((w,id)=>({...w,id,type:w.type||'iron',hp:terrainTypes[w.type||'iron'].hp,alive:true})),rotors:(l.rotors||[]).map((g,id)=>({...g,id,turnedAt:-Infinity,previousAngle:g.angle,turns:0})),rotorTurns:0,terrainDestroyed:0,bullet:null,bullets:[],score:0,baseScore:0,comboBonus:0,hitCount:0,comboCount:0,maxCombo:0,lastHitTime:-Infinity,explosions:0,bombExplosions:0,barrelExplosions:0,helmetBreaks:0,dropped:0,segments:[],particles:[],helmets:[],rings:[],labels:[],time:0,kills:0,bounces:0};}
 function remainingAmmo(){return Object.values(state.inventory).reduce((sum,n)=>sum+n,0);}
 function refreshAmmo(){document.querySelectorAll('.ammo-button').forEach(b=>{const key=b.dataset.ammo;b.hidden=!levels[state.index].ammo[key];b.classList.toggle('active',key===selectedAmmo);b.setAttribute('aria-pressed',String(key===selectedAmmo));b.disabled=state.phase!=='aim'||state.inventory[key]<=0;b.title=levels[state.index].ammo[key]?`本关配发 ${levels[state.index].ammo[key]} 发，剩余 ${state.inventory[key]} 发`:'本关未配发';b.setAttribute('aria-label',`${ammoTypes[key].name}，${b.title}`);});for(const key of Object.keys(ammoTypes))$('stock-'+key).textContent=levels[state.index].ammo[key]?`× ${state.inventory[key]}`:'本关未配发';$('ammoSummary').textContent=`本关剩余 ${remainingAmmo()} 发 · 已射击 ${state.shotsUsed} 次`;$('ammoHint').textContent=ammoTypes[selectedAmmo].hint;$('speed').value='800';$('speed').disabled=true;if(state.phase==='aim')$('combo').textContent=ammoTypes[selectedAmmo].name;refreshTrajectory();}
 function refreshTrajectory(){const button=$('viewTrajectory');button.disabled=state.phase!=='aim'||!previous.length||showPrevious;button.textContent=showPrevious?'上一枪轨迹已显示':'查看上一枪轨迹';button.title=previous.length?'只在本次瞄准中显示，下一枪或重试恢复隐藏':'先射击一次，下一枪或重试时可查看';}
 $('viewTrajectory').onclick=()=>{if(state.phase!=='aim'||!previous.length||showPrevious)return;showPrevious=true;refreshTrajectory();};
 function selectAmmo(type){if(!ammoTypes[type]||state.phase!=='aim'||state.inventory[type]<=0)return false;selectedAmmo=type;state.ammo=type;refreshAmmo();return true;}
 function load(index,keep=false){previous=keep&&state?.index===index?(state.segments.length?state.segments.map(s=>({...s})):previous):[];showPrevious=false;configureRoom(index);state=newState(index);if(!state.inventory[selectedAmmo])selectedAmmo=Object.keys(levels[index].ammo)[0];state.ammo=selectedAmmo;dragging=false;slow=0;screenShake=0;$('result').hidden=true;$('levelName').textContent=`${levelGroups[levels[index].group].short} ${String(levels[index].number).padStart(2,'0')} / ${levels[index].name.split(' · ')[1]}`;$('hint').textContent=levels[index].hint;$('lessonGoal').textContent=levels[index].lesson;$('stateText').textContent='拖动瞄准 · 松手开枪';refreshAmmo();updateCounter();refreshComparison();document.querySelectorAll('.level-button').forEach((b,i)=>b.classList.toggle('active',i===index));}
 function refreshComparison(){const r=comparison[state.index];$('comparison').hidden=false;$('comparisonRows').innerHTML=`<tr><td>本关</td><td>${r?r.last+'/'+state.enemies.length:'—'}</td><td>${r?r.best+'/'+state.enemies.length:'—'}</td><td>${r?r.bestScore:'—'}</td><td>${r?r.tries:0}</td></tr>`;refreshLessonElements();}
 function refreshLessonElements(){const l=levels[state.index],kinds=new Set(l.enemies.map(e=>e[2]||'normal'));for(const w of l.walls)kinds.add(w.type||'iron');if(l.rotors?.length)kinds.add('rotor');if(l.barrels.length)kinds.add('barrel');document.querySelectorAll('[data-kind]').forEach(el=>el.hidden=!kinds.has(el.dataset.kind));const nav=$('levels'),active=nav.querySelector?.(`[data-level-index="${state.index}"]`);if(active){const top=active.getBoundingClientRect().top-nav.getBoundingClientRect().top+nav.scrollTop;if(top<nav.scrollTop)nav.scrollTop=top;else if(top+active.offsetHeight>nav.scrollTop+nav.clientHeight)nav.scrollTop=top+active.offsetHeight-nav.clientHeight;}}
 function updateCounter(){$('counter').textContent=`剩余 ${state.enemies.filter(e=>e.alive).length} 只`;$('scoreHud').textContent=`得分 ${state.score}`;}
 function scoreHit(e){e.hitVisualAt=state.time;state.hitCount++;state.comboCount=state.time-state.lastHitTime<=scoreRules.comboWindow+1e-9?state.comboCount+1:1;state.lastHitTime=state.time;state.maxCombo=Math.max(state.maxCombo,state.comboCount);const bonus=(state.comboCount-1)*scoreRules.comboStep;state.baseScore+=scoreRules.hit;state.comboBonus+=bonus;state.score=state.baseScore+state.comboBonus;$('scoreHud').textContent=`得分 ${state.score}`;if(!reducedMotion())$('scoreHud').animate?.([{transform:'scale(1)'},{transform:'scale(1.16)',offset:.3},{transform:'scale(1)'}],{duration:220});$('combo').textContent=state.comboCount>1?`${state.comboCount} 连击 · 额外 +${bonus}`:'命中 +10';state.labels.push({x:e.x,y:e.y-e.r-8,text:`+${scoreRules.hit+bonus}`,life:.9});}
 function tone(name,pitch=1){window.gameAudio?.play(name,pitch);}
 function resultTone(won){if(won)slow=.15;tone(won?'win':'lose');}
 function burst(x,y,color,n=15){n=Math.min(n,Math.max(0,160-state.particles.length));for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*200;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,max:.7,color});}}
 function dropHelmet(e,bullet,label=true){if(e.hp!==2)return;e.hp=1;state.helmetBreaks++;state.helmets.push({x:e.x,y:e.y+6,vx:bullet&&bullet.vx<0?-105:105,vy:-135,angle:0,spin:bullet&&bullet.vx<0?-8:8,life:.85,floor:e.y+18,bounces:0});e.surprisedUntil=state.time+.8;burst(e.x,e.y-12,'#e8c879',8);if(label)state.labels.push({x:e.x,y:e.y-35,text:'保护盖掉了！',life:.8});tone('helmet');}
 function hitEnemy(e,bullet){if(e.type==='helmet'&&e.hp===2&&!bullet.armorPiercing){scoreHit(e);dropHelmet(e,bullet);return;}kill(e,bullet);}
 function kill(e,bullet){if(!e.alive)return;if(e.type==='helmet')dropHelmet(e,bullet,false);e.alive=false;e.hp=0;e.defeatedAt=state.time;e.defeatDirection=bullet&&bullet.vx<0?-1:1;state.kills++;scoreHit(e);if(bullet)bullet.energy=Math.min(bullet.maxEnergy,bullet.energy+bullet.recharge);burst(e.x,e.y,e.type==='shield'?'#85b9d1':e.type==='bomb'?'#ff8179':'#bd9cf5',8);tone('hit',1+Math.min(state.comboCount-1,7)*.07);updateCounter();if(e.type==='bomb'){state.bombExplosions++;blast(e.x,e.y,70,bullet,'#ff8179');}}
 function rectangleDistance(x,y,w){return Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)));}
 // The visible shield disk is also its collider; there is no hidden front sector.
 function shieldGeometry(e){return{x:e.x,y:e.y+e.r*.35,r:e.r+1};}
 const rotorRules={cooldown:.16};
 function rotorContact(g,x,y){const ux=Math.cos(g.angle),uy=Math.sin(g.angle),half=g.length/2,t=Math.max(-half,Math.min(half,(x-g.x)*ux+(y-g.y)*uy)),px=g.x+t*ux,py=g.y+t*uy,distance=Math.hypot(x-px,y-py);return{px,py,distance};}
 // Exact ray against a capsule: the same rounded beam used for drawing/collision.
 function rotorRay(g,x,y,dx,dy,r=4){const ux=Math.cos(g.angle),uy=Math.sin(g.angle),nx=-uy,ny=ux,half=g.length/2,R=g.thickness/2+r,lx=(x-g.x)*ux+(y-g.y)*uy,ly=(x-g.x)*nx+(y-g.y)*ny,vx=dx*ux+dy*uy,vy=dx*nx+dy*ny;let best=null;
  const accept=(t,ax,ay)=>{if(t>=0&&(!best||t<best.t))best={t,nx:ax*ux+ay*nx,ny:ax*uy+ay*ny};};
  if(Math.abs(vy)>1e-10)for(const sign of [-1,1]){const t=(sign*R-ly)/vy;if(Math.abs(lx+vx*t)<=half&&sign*vy<0)accept(t,0,sign);}
  for(const side of [-1,1]){const ex=lx-side*half,B=ex*vx+ly*vy,C=ex*ex+ly*ly-R*R,D=B*B-C;if(D<0)continue;const t=-B-Math.sqrt(D),hx=ex+vx*t,hy=ly+vy*t;if(side*(lx+vx*t)>=half)accept(t,hx/R,hy/R);}
  return best;
 }
 function hitRotor(g,b){const hit=rotorContact(g,b.x,b.y),limit=g.thickness/2+b.r;
  if(Math.hypot(b.x-g.x,b.y-g.y)>g.length/2+limit+2)b.hitRotors.delete(g.id);
  if(hit.distance>=limit||b.hitRotors.has(g.id))return;
  let nx,ny;if(hit.distance>1e-8){nx=(b.x-hit.px)/hit.distance;ny=(b.y-hit.py)/hit.distance;}else{nx=-Math.sin(g.angle);ny=Math.cos(g.angle);if(b.vx*nx+b.vy*ny>0){nx=-nx;ny=-ny;}}
  const dot=b.vx*nx+b.vy*ny;if(dot>=0)return;b.hitRotors.add(g.id);b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.x=hit.px+nx*(limit+.1);b.y=hit.py+ny*(limit+.1);bounce(b.x,b.y,b);
  if(!b.turnedRotors.has(g.id)&&state.time-g.turnedAt>=rotorRules.cooldown){b.turnedRotors.add(g.id);g.previousAngle=g.angle;g.angle=(g.angle+Math.PI/2)%Math.PI;g.turnedAt=state.time;g.turns++;state.rotorTurns++;tone('shield');state.rings.push({x:g.x,y:g.y,r:0,max:26,life:.22,color:'#e9bd4b'});}
 }
 function destroyTerrain(w){if(w.alive===false||w.type==='iron'||!w.type)return;w.alive=false;w.hp=0;state.terrainDestroyed++;tone('break');burst(w.x+w.w/2,w.y+w.h/2,terrainTypes[w.type].color,20);}
 function blast(x,y,radius,bullet,color='#ffb075'){state.rings.push({x,y,r:0,max:radius,life:.38,color,blast:true});toyFragments(x,y);burst(x,y,color,12);screenShake=5;slow=Math.max(slow,.13);tone('explosion');for(const w of state.walls)if(w.alive!==false&&rectangleDistance(x,y,w)<=radius)destroyTerrain(w);for(const e of state.enemies)if(e.alive&&Math.hypot(e.x-x,e.y-y)<radius+e.r)kill(e,bullet);for(const b of state.barrels)if(b.alive&&Math.hypot(b.x-x,b.y-y)<radius+b.r)explode(b,bullet);}
 function explode(barrel,bullet){if(!barrel.alive)return;barrel.alive=false;state.barrelExplosions++;blast(barrel.x,barrel.y,102,bullet);}
 function detonate(bullet){if(!bullet.explosionReady)return;bullet.explosionReady=false;bullet.alive=false;state.explosions++;blast(bullet.x,bullet.y,64,bullet);state.labels.push({x:bullet.x,y:bullet.y-25,text:'爆炸弹引爆！',life:.9});}
 function bounce(x,y,bullet){if(bullet)bullet.spreading=false;state.bounces++;state.rings.push({x,y,r:0,max:17,life:.16});tone('bounce',1+(state.bounces%4)*.03);}
 function shoot(){if(!gameEntered||state.phase!=='aim'||state.inventory[selectedAmmo]<=0)return false;state.inventory[selectedAmmo]--;state.shotsUsed++;state.shotLog.push(selectedAmmo);stats.shots++;state.phase='flying';state.ammo=selectedAmmo;state.comboCount=0;state.lastHitTime=-Infinity;showPrevious=false;const type=ammoTypes[selectedAmmo],speed=800*type.speed,angle=Math.atan2(aim.y,aim.x);state.bullets=Array.from({length:type.count},(_,i)=>{const position=type.count>1?i/(type.count-1)-.5:0,spreadAngle=position*(type.startSpread||0),a=angle+spreadAngle;return {id:i,x:origin.x,y:origin.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4,energy:type.energy,maxEnergy:type.maxEnergy,recharge:type.recharge,duration:type.duration,elapsed:0,spreadAngle,targetSpread:position*(type.spread||0),startSpread:spreadAngle,spreadTime:type.spreadTime||0,spreading:!!type.spread,shieldLock:0,armorPiercing:!!type.armorPiercing,hitEnemies:new Set(),hitWalls:new Set(),hitRotors:new Set(),turnedRotors:new Set(),color:type.color,alive:true,explosionReady:selectedAmmo==='explosive'};});state.bullet=state.bullets[0];refreshAmmo();$('stateText').textContent=`第 ${state.shotsUsed} 枪 · ${type.count>1?'扇形散射':'正在飞行'}`;tone({normal:'shot',fast:'fast',scatter:'scatter',explosive:'explosiveShot'}[selectedAmmo]);return true;}
 function finish(){if(state.phase!=='flying')return;state.phase='settling';state.settle=.45;}
 function showResult(){
  const left=state.enemies.filter(e=>e.alive).length,won=left===0;
  if(!won&&remainingAmmo()>0){previous=state.segments.map(s=>({...s}));state.segments=[];showPrevious=false;state.bullet=null;state.bullets=[];state.phase='aim';state.comboCount=0;state.lastHitTime=-Infinity;if(!state.inventory[selectedAmmo])selectedAmmo=Object.keys(state.inventory).find(key=>state.inventory[key]>0);state.ammo=selectedAmmo;$('stateText').textContent=`第 ${state.shotsUsed} 枪结束 · 还有 ${remainingAmmo()} 发`;$('result').hidden=true;refreshAmmo();return;}
  state.phase='result';const old=comparison[state.index]||{tries:0,best:0,bestScore:0};comparison[state.index]={tries:old.tries+1,last:state.kills,best:Math.max(old.best,state.kills),lastScore:state.score,bestScore:Math.max(old.bestScore,state.score),lastShots:state.shotsUsed};refreshComparison();$('resultTag').textContent=won?'LEVEL CLEARED':'AMMO EMPTY';$('resultTitle').textContent=won?'漂亮，过关！':`弹药用尽 · 剩 ${left} 只`;$('resultScore').textContent=`${state.score} 分`;$('resultBreakdown').textContent=`命中 ${state.baseScore} 分 + 连击奖励 ${state.comboBonus} 分 · 最高 ${state.maxCombo} 连击`;$('resultDesc').textContent=`使用 ${state.shotsUsed} 发 · 清怪 ${state.kills}/${state.enemies.length} · ${state.bounces} 次反弹 · ${state.dropped} 颗落底`;$('resultAction').textContent=won?(nextLevel(state.index)===state.index?'再挑战一次':levels[nextLevel(state.index)].group!==levels[state.index].group?'进入正式关卡 →':'下一关 →'):'重试整关';$('result').hidden=false;$('stateText').textContent=won?'关卡完成':'重新规划弹药和角度';refreshAmmo();resultTone(won);
 }
 function update(dt){state.time+=dt;for(const h of state.helmets){h.x+=h.vx*dt;h.y+=h.vy*dt;h.vy+=650*dt;h.angle+=h.spin*dt;if(h.y>=h.floor&&h.vy>0){h.y=h.floor;if(h.bounces===0){h.vy=-h.vy*.36;h.vx*=.6;h.spin*=.55;h.bounces++;tone('helmet',.65);}else{h.vy=0;h.vx*=Math.exp(-12*dt);h.spin*=Math.exp(-12*dt);}}h.life-=dt;}state.helmets=state.helmets.filter(h=>h.life>0);for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-3*dt);p.vy*=Math.exp(-3*dt);if(p.wood||p.toy){p.angle+=p.spin*dt;p.vy+=160*dt;}p.life-=dt;}state.particles=state.particles.filter(p=>p.life>0);for(const r of state.rings){r.r+=r.max*dt/.22;r.life-=dt;}state.rings=state.rings.filter(r=>r.life>0);for(const l of state.labels){l.y-=20*dt;l.life-=dt;}state.labels=state.labels.filter(l=>l.life>0);screenShake=Math.max(0,screenShake-dt*25);if(state.phase==='settling'){state.settle-=dt;if(state.settle<=0)showResult();return;}if(state.phase!=='flying')return;for(const b of state.bullets){if(!b.alive)continue;updateBullet(b,dt);if(!state.enemies.some(e=>e.alive)){finish();break;}}if(state.phase==='flying'&&!state.bullets.some(b=>b.alive))finish();}
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
   if(b.alive)for(const g of state.rotors)hitRotor(g,b);
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
 function drawHelmet(x,y,angle=0,alpha=1){if(!ready(art.helmet))return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);const width=34,height=width*807/1151;ctx.drawImage(art.helmet,56,235,1151,807,-width/2,-height,width,height);ctx.restore();}
 // All background pieces use ONE uniform art scale. Larger rooms add pieces,
 // never stretch the source texture, wall bricks, grass or chalk drawings.
 const courtyardStyle={scale:18/96,floor:[320,420,320,320],wallWidth:96,topHeight:112,sideStart:300,sideHeight:480};
 let courtyardCache;
 // Continuous world-space lawn: no repeated bitmap tile or room-sized stretching.
 let lawnSurface,lawnPaints=0;
 function lawnHash(x,y,seed=0){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
 function lawnNoise(x,y,size,seed){
  const px=x/size,py=y/size,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy;
  const smooth=t=>t*t*t*(t*(t*6-15)+10),u=smooth(fx),v=smooth(fy);
  const a=lawnHash(ix,iy,seed),b=lawnHash(ix+1,iy,seed),c=lawnHash(ix,iy+1,seed),d=lawnHash(ix+1,iy+1,seed);
  return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
 }
 function lawnSample(x,y,roomBounds){
  const broad=lawnNoise(x,y,210,71)*.65+lawnNoise(x+47,y-31,92,93)*.35;
  const soft=(lawnNoise(x,y,28,15)-.5)*3,grain=(lawnHash(Math.floor(x),Math.floor(y),23)-.5)*1.3;
  let shade=1;
  if(roomBounds){
   const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
   const root=d=>Math.max(0,1-Math.abs(d)/42)**2;
   const run=smooth((y-roomBounds.top+12)/28)*(1-smooth((y-roomBounds.bottom+24)/54));
   const across=smooth((x-roomBounds.left+18)/28)*(1-smooth((x-roomBounds.right-10)/28));
   shade-=.09*run*(root(x-roomBounds.left)+root(x-roomBounds.right))+.08*across*root(y-roomBounds.top);
  }
  return[(128+broad*36+soft+grain)*shade,(160+broad*46+soft+grain)*shade,(84+broad*32+soft*.6+grain)*shade];
 }
 function paintNaturalLawn(c,area,roomBounds){
  const step=2,x0=Math.floor(area.x/step)*step-step,y0=Math.floor(area.y/step)*step-step;
  const width=Math.ceil((area.x+area.width-x0)/step)+2,height=Math.ceil((area.y+area.height-y0)/step)+2;
  lawnSurface??=document.createElement('canvas');lawnSurface.width=width;lawnSurface.height=height;
  const lc=lawnSurface.getContext('2d'),pixels=lc.createImageData(width,height),data=pixels.data;
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
   const color=lawnSample(x0+col*step,y0+row*step,roomBounds),i=(row*width+col)*4;
   data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=255;
  }
  lc.putImageData(pixels,0,0);c.save();c.beginPath();c.rect(area.x,area.y,area.width,area.height);c.clip();
  c.drawImage(lawnSurface,x0,y0,width*step,height*step);
  // Irregular short-grass clusters, not uniform stipple or tiled carpet grain.
  const spacing=5.5;
  for(let row=Math.floor(area.y/spacing)-1;row<Math.ceil((area.y+area.height)/spacing)+1;row++)for(let col=Math.floor(area.x/spacing)-1;col<Math.ceil((area.x+area.width)/spacing)+1;col++){
   const x=col*spacing+lawnHash(col,row,31)*spacing,y=row*spacing+lawnHash(col,row,37)*spacing;
   const distance=Math.min(Math.abs(x-roomBounds.left),Math.abs(x-roomBounds.right),Math.abs(y-roomBounds.top));
   const root=Math.max(0,1-distance/28),chance=.12+lawnNoise(x,y,47,69)**1.7*.75+root*.24;
   if(lawnHash(col,row,41)>chance)continue;
   const count=2+Math.floor(lawnHash(col,row,43)*3),baseHeight=1.6+lawnHash(col,row,47)*1.7+root*1.5;
   for(let blade=0;blade<count;blade++){
    const jitter=lawnHash(col,row,53+blade),dx=(blade-(count-1)/2)*.75,h=baseHeight*(.65+jitter*.65),lean=(jitter-.5)*2.8;
    const half=.35+jitter*.2;c.fillStyle=blade%2?'#d5e8a954':'#4e792c4b';
    c.beginPath();c.moveTo(x+dx-half,y);c.quadraticCurveTo(x+dx-half+lean*.2,y-h*.65,x+dx+lean,y-h);
    c.quadraticCurveTo(x+dx+half+lean*.3,y-h*.35,x+dx+half,y);c.closePath();c.fill();
   }
  }
  c.restore();lawnPaints++;
 }
 window.lawnGround=Object.freeze({paint:paintNaturalLawn,sample:lawnSample,get diagnostics(){return{paints:lawnPaints,step:2,space:'world',version:1};}});
 // Fixed, sparse ground dressing. Never inserted into the collision/state arrays.
 function courtyardDetails(index,width=W,height=H){
  const level=levels[index],items=[];let seed=(index+1)*7919+width*31+height;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const clear=(x,y,pad)=>{
   if(Math.hypot(x-width/2,y-(height-84))<75+pad)return false;
   if(level.enemies.some(([ex,ey,type])=>Math.hypot(x-ex,y-ey)<(type==='shield'?80:44)+pad))return false;
   if(level.barrels.some(([bx,by])=>Math.hypot(x-bx,y-by)<34+pad))return false;
   if(level.walls.some(w=>x>w.x-20-pad&&x<w.x+w.w+20+pad&&y>w.y-25-pad&&y<w.y+w.h+20+pad))return false;
   return !(level.rotors||[]).some(g=>Math.hypot(x-g.x,y-g.y)<g.length/2+16+pad);
  };
  const count=Math.min(20,Math.max(8,Math.round(width*height/25000)));
  for(let n=0;n<count*12&&items.filter(i=>i.kind==='pebbles').length<count;n++){
   const x=38+random()*(width-76),y=42+random()*(height-100),size=3+random()*2.5;
   if(clear(x,y,10)&&items.every(i=>Math.hypot(x-i.x,y-i.y)>28))items.push({kind:'pebbles',x,y,size,angle:random()*1.6-.8,count:2+Math.floor(random()*2)});
  }
  for(const side of [-1,1])for(let y=64;y<height-65;y+=64+random()*34){const x=side<0?23+random()*7:width-23-random()*7;if(clear(x,y,6))items.push({kind:'grass',x,y,size:9+random()*4,angle:side*.3});}
  const patches=Math.min(8,Math.max(3,Math.round(width*height/70000)));
  for(let n=0;n<patches*12&&items.filter(i=>i.kind==='clover').length<patches;n++){
   const x=40+random()*(width-80),y=50+random()*(height-120),size=8+random()*4;
   if(clear(x,y,16)&&items.every(i=>Math.hypot(x-i.x,y-i.y)>34))items.push({kind:'clover',x,y,size,angle:random()*1.4-.7});
  }
  // A few flattened grass marks are ambience, never route hints.
  for(const side of [-1,1]){const x=width/2+side*width*.26,y=height-110;if(clear(x,y,24))items.push({kind:'prints',x,y,size:1,angle:side*.35});}
  const flowers=Math.min(7,Math.max(3,Math.round(width*height/65000)));
  for(let n=0;n<flowers*20&&items.filter(i=>i.kind==='flowers').length<flowers;n++){
   const side=random()<.5?-1:1,edge=n%4!==3;
   const x=edge?(side<0?35+random()*18:width-35-random()*18):45+random()*(width-90),y=65+random()*(height-140);
   if(clear(x,y,12)&&items.every(i=>Math.hypot(x-i.x,y-i.y)>(i.kind==='flowers'?48:24)))items.push({kind:'flowers',x,y,size:2+random()*.5,angle:random()*1.2-.6,count:2,tone:random()<.65?'cream':'butter'});
  }
  return items;
 }
 function paintCourtyardDetails(c,items){
  const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  for(const item of items){c.save();c.translate(item.x,item.y);c.rotate(item.angle);
   if(item.kind==='pebbles'){
    oval(0,2,item.size*2.8,item.size*1.2,'#ae895a0d');
    for(let n=0;n<item.count;n++){const x=(n-1)*item.size*1.7,y=n%2?3:-1,r=item.size*(n===1?1:.6);
     oval(x+1,y+1.4,r*1.1,r*.65,'#705b4228');
     const fill=c.createLinearGradient(x-r,y-r,x+r,y+r);fill.addColorStop(0,'#edddbc');fill.addColorStop(.45,'#d5c4a3');fill.addColorStop(1,'#b5a181');oval(x,y,r,r*.65,fill);oval(x-r*.25,y-r*.18,r*.5,r*.16,'#fff0d170');
    }
   }else if(item.kind==='flowers'){
    oval(1,2,6,2,'#395d2a18');
    for(let n=0;n<item.count;n++){
     const x=n?3:-2,y=n?-5:-1,r=item.size*(n?.8:1);
     c.strokeStyle='#5c823e';c.lineWidth=.7;c.beginPath();c.moveTo(x+1,y+5);c.quadraticCurveTo(x-1,y+2,x,y);c.stroke();
     oval(x-1,y+3,1.8,.65,'#79a34e');
     for(let p=0;p<5;p++){const a=p*Math.PI*2/5;oval(x+Math.cos(a)*r*.67,y+Math.sin(a)*r*.6,r*.57,r*.42,item.tone==='cream'?'#f6f0d8':'#e8d48c');}
     oval(x-.25,y-.15,r*.4,r*.34,'#d9ad4d');oval(x-.4,y-.35,r*.16,r*.12,'#ffebac');
    }
   }else if(item.kind==='clover'){
    oval(1,2,item.size*.9,item.size*.4,'#375c3010');
    for(let n=0;n<4;n++){const x=(n-1.5)*item.size*.45,y=(n%2)*item.size*.3;
     for(let leaf=0;leaf<3;leaf++){const a=leaf*Math.PI*2/3;oval(x+Math.cos(a)*2.5,y+Math.sin(a)*2.2,3.1,2.3,n%2?'#6c9e4e40':'#b2ce7838');}
    }
   }else if(item.kind==='grass'){
    oval(2,3,9,3,'#34592e36');oval(0,1,7,2,'#496b3630');
    for(let n=0;n<7;n++){const dx=(n-3)*2.2,h=item.size*(.6+(n%3)*.2);c.fillStyle=n%2?'#a7c46a':'#608d43';c.beginPath();c.moveTo(0,2);c.quadraticCurveTo(dx-3,-h*.5,dx,-h);c.quadraticCurveTo(dx+2,-h*.25,0,2);c.fill();}
   }else{
    for(let n=0;n<3;n++){const x=n%2?4:-4,y=n*12;c.save();c.translate(x,y);c.rotate(n%2?.1:-.1);oval(0,0,3.1,4.5,'#4e783419');oval(-.5,-1,1.8,3,'#d2df9b20');c.restore();}
   }
   c.restore();
  }
 }
 function repeatArt(c,img,source,area,axis,mirror=false){const [sx,sy,sw,sh]=source,[x,y,w,h]=area,k=courtyardStyle.scale,tw=sw*k,th=sh*k;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const columns=axis==='y'?1:Math.ceil(w/tw),rows=axis==='x'?1:Math.ceil(h/th);for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){c.save();c.translate(x+col*tw+tw/2,y+row*th+th/2);if(mirror)c.scale(col%2?-1:1,row%2?-1:1);c.drawImage(img,sx,sy,sw,sh,-tw/2,-th/2,tw,th);c.restore();}c.restore();}
 function drawCourtyard(){ctx.fillStyle='#a4bf75';ctx.fillRect(0,0,W,H);if(!ready(art.courtyard))return;const key=`${state.index}/${W}/${H}/${canvas.width}/${canvas.height}`;if(courtyardCache?.key!==key){const surface=document.createElement('canvas');surface.width=canvas.width;surface.height=canvas.height;const c=surface.getContext('2d'),img=art.courtyard,s=courtyardStyle,k=s.scale,right=img.naturalWidth-s.wallWidth,topY=bounds.top-s.topHeight*k;
   c.setTransform(surface.width/W,0,0,surface.height/H,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';paintNaturalLawn(c,{x:0,y:0,width:W,height:H},bounds);
   // Keep only the stone strip: baked lawn strips have a hard edge when repeated.
   const shadowWidth=0,shadow=shadowWidth*k;
   repeatArt(c,img,[0,s.sideStart,s.wallWidth+shadowWidth,s.sideHeight],[0,bounds.top,bounds.left+shadow,H-bounds.top],'y');
   repeatArt(c,img,[right-shadowWidth,s.sideStart,s.wallWidth+shadowWidth,s.sideHeight],[bounds.right-shadow,bounds.top,W-bounds.right+shadow,H-bounds.top],'y');
   repeatArt(c,img,[s.wallWidth,0,img.naturalWidth-s.wallWidth*2,s.topHeight],[bounds.left,topY,bounds.right-bounds.left,s.topHeight*k],'x');
   // One continuous inward shadow avoids dark vertical seams at tile ends.
   const wallShadow=c.createLinearGradient(0,bounds.top,0,bounds.top+14);wallShadow.addColorStop(0,'#78512c35');wallShadow.addColorStop(1,'#78512c00');c.fillStyle=wallShadow;c.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,14);
   // Corners and the two entry ends keep their size. No wall across the bottom.
   c.drawImage(img,0,0,s.wallWidth,s.topHeight,0,topY,s.wallWidth*k,s.topHeight*k);c.drawImage(img,right,0,s.wallWidth,s.topHeight,bounds.right,topY,s.wallWidth*k,s.topHeight*k);
   const details=courtyardDetails(state.index);paintCourtyardDetails(c,details);courtyardCache={key,surface,details};
  }ctx.drawImage(courtyardCache.surface,0,0,W,H);}
 // One fixed upper-left warm key. Presentation only, never collider geometry.
 const courtyardLighting=window.courtyardLighting=Object.freeze({sky:0xfff3dd,ground:0x899468,key:0xffeed5,ambient:1.35,intensity:2.8,exposure:1.1,sun:Object.freeze([-3,7,-4]),shadowX:.72,shadowY:1.2,shadowRGB:'78,61,48'});
 // Cached soft shadow masks: no per-frame blur/filter or new download.
 let shadowMasks;
 function softShadowMask(contact=false){
  const surface=document.createElement('canvas');surface.width=256;surface.height=128;
  const c=surface.getContext('2d');c.translate(128,64);c.scale(128,64);
  const gradient=c.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,`rgba(${courtyardLighting.shadowRGB},${contact?.65:.23})`);
  gradient.addColorStop(contact?.48:.4,`rgba(${courtyardLighting.shadowRGB},${contact?.32:.13})`);
  gradient.addColorStop(1,`rgba(${courtyardLighting.shadowRGB},0)`);c.fillStyle=gradient;c.fillRect(-1,-1,2,2);return surface;
 }
 function shadowGeometry(width,height,elevation=0){const lift=Math.min(1,Math.max(0,elevation)),spread=1+lift*.55,projectedHeight=width*(.65+lift*.8),dx=projectedHeight*courtyardLighting.shadowX,dy=projectedHeight*courtyardLighting.shadowY;return{lift,dx,dy,angle:Math.atan2(dy,dx),rx:(width*.72+Math.hypot(dx,dy)*.35)*spread,ry:(height*.85+width*.16)*spread};}
 function groundShadow(x,y,width,height,elevation=0,opacity=1){
  shadowMasks??={cast:softShadowMask(),contact:softShadowMask(true)};
  const {lift,dx,dy,angle,rx,ry}=shadowGeometry(width,height,elevation);
  ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,opacity));
  ctx.save();ctx.globalAlpha*=1-lift*.5;ctx.translate(x+dx*.48,y+dy*.48);ctx.rotate(angle);
  ctx.drawImage(shadowMasks.cast,-rx,-ry,rx*2,ry*2);ctx.restore();
  ctx.globalAlpha*=1-lift;const cw=width*.72,ch=height*.56;ctx.drawImage(shadowMasks.contact,x-cw,y+.25-ch,cw*2,ch*2);ctx.restore();
 }
 // Presentation-only ground anchors: sprite feet, not the collider centre.
 function enemyGrounding(e){const shield=e.type==='shield',s=shield?shieldGeometry(e):null;return{x:e.x,y:shield?s.y+s.r:e.y+e.r*(e.type==='helmet'?1.03:e.type==='normal'?.94:.98),width:e.r*(shield?.62:.58)};}
 function groundFringe(x,y,width,seed=0,opacity=1){
  if(opacity<=0)return;ctx.save();ctx.globalAlpha*=Math.min(1,opacity);ctx.lineCap='round';
  // A few short blades cross the foot silhouette, never a continuous green outline.
  for(let i=0;i<3;i++){const t=lawnHash(i,seed,91),px=x+(i-1)*width*.67+(t-.5)*width*.22,py=y+.45+lawnHash(i,seed,92)*.7;
   for(let j=0;j<2;j++){const h=1.4+lawnHash(i,j+seed,93)*1.4,lean=(lawnHash(j,i+seed,94)-.5)*1.8;
    ctx.fillStyle=j?'#b4cf79b0':'#537c38b8';ctx.beginPath();ctx.moveTo(px-.45+j*.8,py);ctx.quadraticCurveTo(px+lean,py-h*.55,px+lean*.8+j*.4,py-h);ctx.quadraticCurveTo(px+1+j*.6,py-h*.35,px+.55+j*.8,py);ctx.fill();
   }
  }ctx.restore();
 }
 function terrainGrounding(w){
  const y=w.y+w.h;ctx.save();ctx.globalAlpha=.24;
  // Low moss at uneven corner contacts; no thick band hiding the collision edge.
  for(const [x,r] of [[w.x+2,2.8],[w.x+w.w-2,2]]){ctx.fillStyle=w.type==='obstacle'?'#596b35':'#55723a';ctx.beginPath();ctx.ellipse(x,y-.35,r,1.2,0,0,Math.PI*2);ctx.fill();}ctx.restore();
  const count=Math.max(2,Math.floor(w.w/16));for(let i=0;i<count;i++){if(lawnHash(i,w.x+w.y,101)>.62&&i!==0&&i!==count-1)continue;groundFringe(w.x+2+(w.w-4)*i/(count-1),y,2,w.x+w.y+i,.78);}
 }
 // Raised top projects above its footprint; the lower front edge stays at the collider.
 const terrainDepth={obstacle:{rise:8,side:3,front:['#c8914d','#8b532e'],end:'#87502d'},brick:{rise:10,side:3,front:['#c9bda4','#92836d'],end:'#8c806b'},iron:{rise:9,side:3,front:['#737b7b','#434e51'],end:'#404a4c'}};
 function terrainVolume(w){const style=terrainDepth[w.type||'iron'];return{...style,rise:Math.min(style.rise,Math.min(w.w,w.h)*.65),side:Math.min(style.side,w.w*.18)};}
 function polygon(points,fill,stroke){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}}
 function terrainShadow(w){
  const volume=terrainVolume(w),dx=volume.rise*courtyardLighting.shadowX,dy=volume.rise*courtyardLighting.shadowY;
  ctx.save();for(const [scale,alpha] of [[1.15,.035],[1,.055],[.75,.08]]){
   const x=dx*scale,y=dy*scale;
   const gradient=ctx.createLinearGradient(w.x,w.y+w.h,w.x+x,w.y+w.h+y);
   gradient.addColorStop(0,`rgba(${courtyardLighting.shadowRGB},${alpha*2.2})`);gradient.addColorStop(1,`rgba(${courtyardLighting.shadowRGB},${alpha*.35})`);
   polygon([[w.x,w.y],[w.x+w.w,w.y],[w.x+w.w+x,w.y+y],[w.x+w.w+x,w.y+w.h+y],[w.x+x,w.y+w.h+y],[w.x,w.y+w.h]],gradient);
  }
  ctx.fillStyle=`rgba(${courtyardLighting.shadowRGB},.22)`;ctx.fillRect(w.x+1,w.y+w.h-1,Math.max(1,w.w-2),2.5);ctx.restore();
 }
 function drawRotor(g){const half=g.length/2,age=state.time-g.turnedAt;ctx.save();ctx.translate(g.x,g.y);ctx.lineCap='round';
  const beam=(angle,alpha)=>{const dx=courtyardLighting.shadowX*6,dy=courtyardLighting.shadowY*6;ctx.save();ctx.globalAlpha=alpha;ctx.translate(dx,dy);ctx.rotate(angle);line(-half,0,half,0,`rgba(${courtyardLighting.shadowRGB},.07)`,g.thickness+8);line(-half,0,half,0,`rgba(${courtyardLighting.shadowRGB},.12)`,g.thickness+2);ctx.restore();ctx.save();ctx.globalAlpha=alpha;ctx.rotate(angle);line(-half,0,half,0,'#927039',g.thickness);line(-half,0,half,0,'#edbf55',g.thickness-2);line(-half,-2,half,-2,'#fff0a1',2);ctx.restore();};
  if(age<rotorRules.cooldown&&!reducedMotion())beam(g.previousAngle,(1-age/rotorRules.cooldown)*.22);beam(g.angle,1);circle(0,0,6,'#3a6976');circle(-1,-1,3,'#b5e5df');
  ctx.save();ctx.rotate(age<rotorRules.cooldown&&!reducedMotion()?age/rotorRules.cooldown*Math.PI/2:Math.PI/2);ctx.strokeStyle='#587d80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,18,-1.5,.9);ctx.stroke();line(11,14,8,9,'#587d80',2);line(11,14,16,12,'#587d80',2);ctx.restore();ctx.restore();}
 // Complete poses: arms, hands, gun and torso share a single immutable sprite.
 // Coordinates are measured on the 2172x724 atlas, with muzzle as pivot.
 const playerPoses=[{angle:-73,muzzle:[12,247]},{angle:-51,muzzle:[71,170]},{angle:0,muzzle:[229,67]},{angle:48,muzzle:[384,185]},{angle:73,muzzle:[431,269]}];
 function playerRig(){const angle=Math.atan2(aim.y,aim.x)+Math.PI/2;let index=0;for(let i=1;i<playerPoses.length;i++)if(Math.abs(angle-playerPoses[i].angle*Math.PI/180)<Math.abs(angle-playerPoses[index].angle*Math.PI/180))index=i;const pose=playerPoses[index];return{angle,index,frameAngle:pose.angle*Math.PI/180,residual:angle-pose.angle*Math.PI/180,scale:.12,muzzle:pose.muzzle};}
 function drawPlayer(){const kick=reducedMotion()?0:Math.min(1,Math.max(0,recoilUntil-state.time)/.12);
  if(window.playerModel?.draw(ctx,origin,{...aim,kick,time:state.time,reduced:reducedMotion()},groundShadow)){if(kick>0){ctx.save();ctx.globalAlpha=kick;circle(origin.x,origin.y,6,'#ffd36b');circle(origin.x,origin.y,2.5,'#fff9e9');ctx.restore();}return;}
  drawSpritePlayer();
 }
 function drawSpritePlayer(){if(!ready(art.player))return;const rig=playerRig(),kick=reducedMotion()?0:Math.min(1,Math.max(0,recoilUntil-state.time)/.12)*3,img=art.player,cell=img.naturalWidth/5,k=rig.scale;const fx=(cell/2-rig.muzzle[0])*k,fy=(622-rig.muzzle[1])*k;groundShadow(origin.x+fx*Math.cos(rig.residual)-fy*Math.sin(rig.residual),origin.y+fx*Math.sin(rig.residual)+fy*Math.cos(rig.residual)-3,20,6);ctx.save();ctx.translate(origin.x,origin.y+kick);ctx.rotate(rig.residual);ctx.drawImage(img,rig.index*cell,0,cell,img.naturalHeight,-rig.muzzle[0]*k,-rig.muzzle[1]*k,cell*k,img.naturalHeight*k);ctx.restore();if(kick>0){ctx.save();ctx.globalAlpha=kick/3;circle(origin.x,origin.y,7,'#ffd36b');circle(origin.x,origin.y,3,'#fff9e9');ctx.restore();}}
 // A terrain's dimensions define clipping, not independent image scales.
 // Long barriers repeat square pieces; their end pieces are clipped, never stretched.
 function woodSplinters(x,y){for(let i=0;i<9&&state.particles.length<160;i++){const a=i*Math.PI*2/9,s=45+(i%3)*25;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+(i%3)*.1,max:.55,color:i%2?'#d9a35d':'#885124',wood:true,angle:a,spin:(i%2?1:-1)*5,width:3+i%3,height:1.5});}}
 function drawTerrain(w){
  const type=w.type||'iron',damaged=type==='obstacle'&&w.hp===1,img=damaged&&ready(art.woodDamaged)?art.woodDamaged:art[type],v=terrainVolume(w);
  terrainShadow(w);ctx.save();
  if(damaged){const age=state.time-(w.crackedAt??-Infinity);if(!reducedMotion()&&age<.16)ctx.translate(Math.sin(age*75)*(1-age/.16)*1.2,0);}
  const x=w.x-v.side,y=w.y-v.rise,bottom=w.y+w.h;
  // Uniform texture scale on the raised top, not a flattened/stretched image.
  ctx.save();ctx.beginPath();ctx.rect(x,y,w.w,w.h);ctx.clip();
  if(ready(img)){const side=32,k=side/Math.min(img.naturalWidth,img.naturalHeight),tw=img.naturalWidth*k,th=img.naturalHeight*k;for(let ty=y;ty<y+w.h;ty+=th)for(let tx=x;tx<x+w.w;tx+=tw)ctx.drawImage(img,tx,ty,tw,th);}
  const sheen=ctx.createLinearGradient(x,y,x+w.w,y+w.h);sheen.addColorStop(0,'#fff6dc20');sheen.addColorStop(1,'#23354c0a');ctx.fillStyle=sheen;ctx.fillRect(x,y,w.w,w.h);ctx.restore();
  const front=ctx.createLinearGradient(0,bottom-v.rise,0,bottom);front.addColorStop(0,v.front[0]);front.addColorStop(1,v.front[1]);
  // Both side faces terminate at the original footprint: no extra collision width.
  polygon([[x+w.w,y],[x+w.w,y+w.h],[w.x+w.w,bottom],[w.x+w.w,w.y]],v.end,'#47372950');
  polygon([[x,y+w.h],[x+w.w,y+w.h],[w.x+w.w,bottom],[w.x,bottom]],front,'#47372960');
  const unit=type==='brick'?24:type==='iron'?24:Math.max(16,w.h);
  for(let offset=unit;offset<w.w;offset+=unit){const topX=x+offset,baseX=w.x+offset;line(topX,bottom-v.rise,baseX,bottom,type==='brick'?'#ece1c580':'#443a3560',.8);}
  if(type==='iron'){for(let offset=12;offset<w.w;offset+=24){circle(x+offset,bottom-v.rise*.43,1.1,'#35485d');circle(x+offset-.3,bottom-v.rise*.43-.3,.45,'#dce8ee');}}
  if(type==='obstacle'&&damaged){for(let offset=13;offset<w.w;offset+=27){line(x+offset,bottom-v.rise,x+offset+2,bottom-v.rise*.3,'#684022',1.1);}}
  line(x+.5,y+.5,x+w.w-.5,y+.5,'#fff4d270',1);line(x+.5,y+.5,x+.5,y+w.h,'#fff4d245',.8);
  line(x,bottom-v.rise,x+w.w,bottom-v.rise,'#ffe5c24a',.8);ctx.restore();terrainGrounding(w);
 }
 function drawBarrel(b){if(!ready(art.barrel))return;const width=28,height=width*art.barrel.naturalHeight/art.barrel.naturalWidth,foot=b.y+height*.39;groundShadow(b.x,foot,11,4);ctx.drawImage(art.barrel,b.x-width/2,b.y-height/2,width,height);groundFringe(b.x,foot,9,b.id??b.x);}
 // Deformation is visual only: colliders, shot timing and shield geometry stay unchanged.
 // Shield's matching atlas keeps the body behind a fixed shield-and-hands layer.
 const enemySpriteRig={normal:{x:174,y:205,w:920,h:872},helmet:{x:575,y:664,bodyDiameter:920},helmetBare:{x:580,y:674,bodyDiameter:905},shield:{tile:887,bodyX:450,bodyY:462,bodyRadius:365,x:438,y:453,shieldRadius:354}};
 // Pure visual pose: fixed target coordinates and collision radius never change.
 function enemyIdlePose(e,time=state.time){
  if(reducedMotion()||!e.alive)return{angle:0,lift:0,sx:1,sy:1};
  if(e.type==='helmet'){
   const activity=state.phase==='aim'&&!dragging?1:.12,clock=time+e.id*.83+state.index*.23,cycle=((clock%6.4)+6.4)%6.4;
   let angle=Math.sin(clock*1.8)*.065,lift=0;
   // A rigid toy rocks on its rollers; no breathing squash or moving collider.
   if(cycle>1.6&&cycle<2.8){const u=(cycle-1.6)/1.2;angle+=Math.sin(u*Math.PI*4)*Math.sin(u*Math.PI)*.03;}
   if(cycle>4.2&&cycle<5){const u=(cycle-4.2)/.8;lift=-1.4*Math.sin(u*Math.PI)**2;}
   return{angle:angle*activity,lift:lift*activity,sx:1,sy:1};
  }
  if(e.type!=='normal')return{angle:0,lift:0,sx:1,sy:1};
  const activity=state.phase==='aim'&&!dragging?1:.15,clock=time+e.id*1.31+state.index*.37,cycle=((clock%5.8)+5.8)%5.8;
  const breath=Math.sin(clock*2.4)*.018*activity;
  let angle=Math.sin(clock*1.3)*.018*activity,lift=0,squash=0;
  if(cycle>1.8&&cycle<2.6)angle+=Math.sin((cycle-1.8)/.8*Math.PI*2)*.075*activity;
  if(cycle>3.8&&cycle<4.5){const u=(cycle-3.8)/.7;if(u<.2)squash=Math.sin(u/.2*Math.PI)*.055*activity;else lift=-Math.sin((u-.2)/.8*Math.PI)*1.8*activity;}
  return{angle,lift,sx:1+breath+squash,sy:1-breath-squash};
 }
 function shieldPeekPose(e,time=state.time){
  // Only the illustrated body peeks; the body collider and shield never move.
  if(!e.alive)return{x:0};
  if(reducedMotion())return{x:-12.5};
  if(state.phase!=='aim'||dragging)return{x:0};
  const cycle=((time+e.id*.91+state.index*.19)%8+8)%8;
  const peek=start=>{const u=cycle-start;if(u<0||u>2)return 0;const t=Math.min(1,u/.4,(2-u)/.4);return t*t*(3-2*t);};
  return{x:12.5*(peek(4.2)-peek(1.5))};
 }
 function drawEnemy(e){
  const motion=!reducedMotion(),age=e.alive?Infinity:state.time-e.defeatedAt,hitAge=state.time-(e.hitVisualAt??-Infinity);
  if(!e.alive&&(!motion||age>=.42))return;
  // Shield sprite stays fixed while alive, keeping its visible disk at its collider.
  const bob=motion&&e.type!=='shield'&&e.type!=='normal'&&e.type!=='helmet'?Math.sin(state.time*2+e.id)*.7:0;
  let sx=1,sy=1,lift=0,tilt=0,alpha=1;
  if(!e.alive){const t=Math.max(0,age/.42);if(t<.22){sx=1+.3*Math.sin(t/.22*Math.PI/2);sy=1-.35*Math.sin(t/.22*Math.PI/2);}else{const u=(t-.22)/.78;sx=1.3-.8*u;sy=.65+.45*Math.sin(u*Math.PI)-.4*u;lift=-Math.sin(u*Math.PI)*16;tilt=e.defeatDirection*u*.35;alpha=Math.min(1,(1-t)/.28);}}
  else if(motion&&e.type!=='shield'&&hitAge<.3){const pulse=Math.sin(hitAge/.3*Math.PI)*Math.exp(-hitAge*5);sx=1+.18*pulse;sy=1-.18*pulse;}
  const idle=enemyIdlePose(e);if(e.alive){sx*=idle.sx;sy*=idle.sy;lift+=idle.lift;tilt+=idle.angle;}
  const ground=enemyGrounding(e),elevation=Math.max(0,-lift-bob)/12;
  groundShadow(ground.x,ground.y,e.r*.88,e.r*.27,elevation,alpha);
  ctx.save();ctx.globalAlpha=alpha;const foot=e.alive?(e.type==='helmet'?e.r*1.03:e.type==='normal'?e.r*.8:0):0;ctx.translate(e.x,e.y+bob+lift+foot);ctx.rotate(tilt);ctx.scale(sx,sy);ctx.translate(0,-foot);
  if(e.type==='shield'&&ready(art.shield)){
   const rig=enemySpriteRig.shield,img=art.shield,s=shieldGeometry(e),k=s.r/rig.shieldRadius,bk=e.r/rig.bodyRadius,peek=shieldPeekPose(e);
   // Same generated toy/material on both layers; no mirrored lighting or stretched arms.
   ctx.drawImage(img,0,0,rig.tile,rig.tile,-rig.bodyX*bk+peek.x,-rig.bodyY*bk,rig.tile*bk,rig.tile*bk);
   const blockAge=state.time-(e.blockVisualAt??-Infinity);
   if(motion&&e.alive&&blockAge<.18)ctx.filter=`brightness(${1+(1-blockAge/.18)*.35})`;
   ctx.drawImage(img,rig.tile,0,rig.tile,rig.tile,-rig.x*k,s.y-e.y-rig.y*k,rig.tile*k,rig.tile*k);
   ctx.filter='none';
  }else if(e.alive&&e.type==='helmet'&&e.hp===2&&ready(art.helmetMonster)){
   const rig=enemySpriteRig.helmet,k=e.r*2/rig.bodyDiameter,img=art.helmetMonster;
   ctx.drawImage(img,-rig.x*k,-rig.y*k,img.naturalWidth*k,img.naturalHeight*k);
  }else if(e.type==='helmet'&&ready(art.helmetBare)){
   const rig=enemySpriteRig.helmetBare,k=e.r*2/rig.bodyDiameter,img=art.helmetBare;
   ctx.drawImage(img,-rig.x*k,-rig.y*k,img.naturalWidth*k,img.naturalHeight*k);
  }else if((e.type==='normal'||e.type==='helmet')&&ready(art.normalMonster)){
   const rig=enemySpriteRig.normal,k=e.r*2/Math.max(rig.w,rig.h);
   ctx.drawImage(art.normalMonster,rig.x,rig.y,rig.w,rig.h,-rig.w*k/2,-rig.h*k/2,rig.w*k,rig.h*k);
  }else if(ready(art.monster)){
   const k=e.r*2/912;ctx.drawImage(art.monster,-639*k,-700*k,art.monster.naturalWidth*k,art.monster.naturalHeight*k);
  }
  if(!e.alive&&e.type==='bomb'){for(const sign of [-1,1]){const x=sign*e.r*.38,y=e.r*.14;circle(x,y,e.r*.16,'#eb8b91');line(x-2,y-2,x+2,y+2,'#44314d',1.5);line(x+2,y-2,x-2,y+2,'#44314d',1.5);}}
  // The new toy face is part of each whole sprite; no flat face patches on it.
  // Bomb fuse is now part of its complete sprite, not a separate painted prop.
  ctx.restore();
  if(e.alive)groundFringe(ground.x,ground.y,ground.width,e.id,Math.max(0,1-elevation*5));
 }
 function toyFragments(x,y){if(reducedMotion())return;const colors=['#ffe19b','#ad8bdb','#e9a885','#a7ced4'];for(let i=0;i<8&&state.particles.length<160;i++){const a=i*Math.PI/4;state.particles.push({x,y,vx:Math.cos(a)*(65+i%3*25),vy:Math.sin(a)*80-35,life:.45,max:.45,color:colors[i%4],toy:true,angle:a,spin:(i%2?1:-1)*7,width:3+i%3,height:2});}}
 function drawBlast(r){const t=1-r.life/.38;ctx.save();if(reducedMotion()){ctx.globalAlpha=.15*(1-t);circle(r.x,r.y,r.max,'#ffd290');ctx.restore();return;}if(t<.32){ctx.globalAlpha=(1-t/.32)*.85;circle(r.x,r.y,8+t*55,'#fff5cf');}for(let i=0;i<6;i++){const a=i*Math.PI/3,spread=r.max*.38*t;ctx.globalAlpha=.3*(1-t);circle(r.x+Math.cos(a)*spread,r.y+Math.sin(a)*spread,8+15*t,'#e4c8ab');}ctx.restore();}
 function draw(){window.gardenFrame?.render({canvas,W,H,bounds,courtyard:art.courtyard,decor:art.gardenDecor});ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.clearRect(0,0,W,H);ctx.save();if(screenShake&&!reducedMotion())ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);drawCourtyard();line(bounds.left,bounds.bottom,bounds.left,bounds.top,'#655a46',1);line(bounds.left,bounds.top,bounds.right,bounds.top,'#655a46',1);line(bounds.right,bounds.top,bounds.right,bounds.bottom,'#655a46',1);
  if(state.phase==='aim'&&showPrevious&&previous.length){ctx.save();ctx.globalAlpha=.17;ctx.beginPath();for(const s of previous){ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);}ctx.strokeStyle=ammoTypes[selectedAmmo].color;ctx.lineWidth=1;ctx.stroke();ctx.restore();}
  // Sort a temporary render list, never the logical arrays / collision order.
  const solids=[...state.walls.filter(w=>w.alive!==false).map(w=>({depth:w.y+w.h,paint:()=>drawTerrain(w)})),...state.rotors.map(g=>({depth:g.y+Math.abs(Math.sin(g.angle))*g.length/2+g.thickness/2,paint:()=>drawRotor(g)})),...state.barrels.filter(b=>b.alive).map(b=>({depth:b.y+b.r,paint:()=>drawBarrel(b)})),...state.enemies.map(e=>({depth:e.type==='shield'?shieldGeometry(e).y+shieldGeometry(e).r:e.y+e.r,paint:()=>drawEnemy(e)}))];
  solids.sort((a,b)=>a.depth-b.depth);for(const item of solids)item.paint();
  for(const e of state.enemies)if(e.alive&&e.hitVisualAt!==undefined){const age=state.time-e.hitVisualAt;if(age<.16){ctx.save();ctx.globalAlpha=(1-age/.16)*.45;circle(e.x,e.y,e.r,'#ffffff');ctx.restore();}}
  for(const h of state.helmets){groundShadow(h.x,h.floor-2,13,4,reducedMotion()?0:Math.max(0,h.floor-h.y)/55,Math.min(1,h.life*4));drawHelmet(h.x,reducedMotion()?h.floor:h.y,reducedMotion()?0:h.angle,Math.min(1,h.life*4));}
  for(const r of state.rings){if(r.blast)drawBlast(r);ctx.globalAlpha=Math.max(0,r.life/.38);ctx.strokeStyle=r.color||(r.max>20?'#ffb576':'#dbffa1');ctx.lineWidth=r.max>20?5:2;ctx.beginPath();ctx.arc(r.x,r.y,Math.min(r.max,r.r),0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  for(const s of state.segments){const age=state.time-s.t;if(age>.48)continue;ctx.globalAlpha=(1-age/.48)*.7;line(s.x1,s.y1,s.x2,s.y2,s.color,selectedAmmo==='scatter'?2:3);}ctx.globalAlpha=1;
  if(state.phase==='aim')drawAim();drawPlayer();
  if(state.phase==='flying'){for(const b of state.bullets)if(b.alive){ctx.shadowBlur=18;ctx.shadowColor=b.color;circle(b.x,b.y,selectedAmmo==='scatter'?3.5:5,'#fbffde');ctx.shadowBlur=0;if(b.explosionReady){ctx.strokeStyle=b.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,8,0,Math.PI*2);ctx.stroke();}}const living=state.bullets.filter(b=>b.alive),fraction=living.length?Math.max(...living.map(b=>Math.max(0,b.energy/b.maxEnergy))):0;ctx.fillStyle='#2e3d2e';ctx.fillRect(W/2-65,origin.y+32,130,3);ctx.fillStyle=ammoTypes[selectedAmmo].color;ctx.fillRect(W/2-65,origin.y+32,130*fraction,3);}
  for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life/.25);if(p.wood||p.toy){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.fillRect(-p.width/2,-p.height/2,p.width,p.height);ctx.restore();}else circle(p.x,p.y,2.5,p.color);}ctx.globalAlpha=1;ctx.font='bold 13px "Microsoft YaHei",sans-serif';ctx.textAlign='center';for(const l of state.labels){ctx.globalAlpha=Math.min(1,l.life*3);ctx.fillStyle='#553779';ctx.fillText(l.text,l.x,l.y);}ctx.globalAlpha=1;ctx.restore();}
 function drawAim(){const dx=aim.x,dy=aim.y;let t=Infinity,axis='y';if(dx>0)t=(bounds.right-4-origin.x)/dx;if(dx<0)t=(bounds.left+4-origin.x)/dx;const ty=(bounds.top+4-origin.y)/dy;if(ty<t){t=ty;axis='y';}else axis='x';let hitWall=false;for(const w of state.walls){if(w.alive===false||(ammoTypes[selectedAmmo].armorPiercing&&w.type==='obstacle'))continue;if(dx===0&&(origin.x<w.x-4||origin.x>w.x+w.w+4))continue;const tx1=dx===0?-Infinity:(w.x-4-origin.x)/dx,tx2=dx===0?Infinity:(w.x+w.w+4-origin.x)/dx,ty1=(w.y-4-origin.y)/dy,ty2=(w.y+w.h+4-origin.y)/dy;const nearX=Math.min(tx1,tx2),farX=Math.max(tx1,tx2),nearY=Math.min(ty1,ty2),farY=Math.max(ty1,ty2),near=Math.max(nearX,nearY);if(near>0&&near<Math.min(farX,farY)&&near<t){t=near;axis=nearX>nearY?'x':'y';hitWall=true;}}
  let reflectedX=axis==='x'?-dx:dx,reflectedY=axis==='y'?-dy:dy;for(const g of state.rotors){const hit=rotorRay(g,origin.x,origin.y,dx,dy);if(hit&&hit.t<t){t=hit.t;const dot=dx*hit.nx+dy*hit.ny;reflectedX=dx-2*dot*hit.nx;reflectedY=dy-2*dot*hit.ny;}}
  const x=origin.x+dx*t,y=origin.y+dy*t;ctx.save();ctx.setLineDash([5,7]);line(origin.x,origin.y,x,y,'#72608790',1.5);line(x,y,x+reflectedX*85,y+reflectedY*85,'#72608760',1.5);ctx.setLineDash([]);circle(x,y,3,'#826799');ctx.restore();}
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
 function setAim(e){const p=point(e),dx=p.x-origin.x,dy=Math.min(-30,p.y-origin.y),len=Math.hypot(dx,dy);aim={x:dx/len,y:dy/len};}
 canvas.addEventListener('pointerdown',e=>{if(!gameEntered||state.phase!=='aim')return;dragging=true;canvas.setPointerCapture(e.pointerId);setAim(e);});canvas.addEventListener('pointermove',e=>{if(dragging)setAim(e);});canvas.addEventListener('pointerup',e=>{if(!dragging)return;setAim(e);dragging=false;shoot();});canvas.addEventListener('pointercancel',()=>dragging=false);
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
 window.demo={get gameEntered(){return gameEntered;},get assetsReady(){return assetsReady;},get state(){return state;},get stage(){return {W,H,origin,bounds};},get playerRig(){return playerRig();},courtyardDetails,get courtyardDecor(){return courtyardCache?.details.map(item=>({...item}))||[];},enemyIdlePose,shieldPeekPose,shadowGeometry,terrainVolume,shieldGeometry,rotorContact,rotorRay,rotorRules,comparison,levels,ammoTypes,scoreRules,selectAmmo,load,shootAt(x,y){if(state.phase!=='aim')return;const dx=x-origin.x,dy=Math.min(-30,y-origin.y),length=Math.hypot(dx,dy);aim={x:dx/length,y:dy/length};shoot();},step:update,render:draw,stats};
 window.demo.enemyGrounding=enemyGrounding;
})();
