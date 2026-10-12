/* Original procedural score and sound design. No recordings or third-party samples. */
(function(root,factory){const score=factory();if(typeof module==='object'&&module.exports)module.exports=score;else root.OneShotScore=score;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const bpm=96,beat=60/bpm,bars=16,duration=bars*4*beat;
 const hz=n=>440*Math.pow(2,(n-69)/12);
 function music(rate=22050){const length=Math.round(duration*rate),left=new Float32Array(length),right=new Float32Array(length);
  function note(midi,start,seconds,amp,kind,pan=0){const f=hz(midi),count=Math.ceil(seconds*rate),begin=Math.round(start*rate);for(let i=0;i<count;i++){const t=i/rate,u=t/seconds,attack=Math.min(1,t/.007),release=Math.min(1,(seconds-t)/.035),phase=2*Math.PI*f*t;let v;if(kind==='bass')v=(Math.sin(phase)+.15*Math.sin(phase*2))*Math.exp(-t*3);else if(kind==='bell')v=(Math.sin(phase)*Math.exp(-t*4.2)+.25*Math.sin(phase*3)*Math.exp(-t*12)+.10*Math.sin(phase*7)*Math.exp(-t*22));else v=(Math.sin(phase)+.35*Math.sin(phase*2)+.16*Math.sin(phase*3)+.06*Math.sin(phase*4))*Math.exp(-t*7);v*=amp*attack*release*(1-u*.25);const index=(begin+i)%length;left[index]+=v*(1-pan)*.5;right[index]+=v*(1+pan)*.5;}}
  const chords=[[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62]];
  const melody=[[72,76,79,76,74,72],[76,79,81,79,76,74],[72,76,79,81,79,76],[74,72,69,72,76,72],[77,79,81,79,77,76],[76,72,74,76,72,69],[74,79,81,79,76,74],[74,72,69,67,69,72]];
  const positions=[.5,1.25,2,2.75,3.25,3.5];
  for(let bar=0;bar<bars;bar++){const chord=chords[Math.floor(bar/2)%4],start=bar*4*beat;note(chord[0],start,.55,.21,'bass',-.05);note(chord[0]+7,start+2*beat,.4,.13,'bass',.05);
   for(let step=0;step<8;step++)note(chord[1+(step%4)],start+step*.5*beat,.42,step%2?.075:.11,'pluck',step%2?.28:-.28);
   melody[bar%8].forEach((n,i)=>{if(bar>=8&&i===1)n+=2;note(n,start+positions[i]*beat,i===5?.58:.32,.12,'bell',.12);});
   // Quiet brushed shaker and woody offbeat taps; deterministic noise.
   let seed=bar+41;for(let step=0;step<8;step++){const begin=Math.round((start+step*.5*beat)*rate);for(let i=0;i<rate*.04;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=((seed/4294967296)*2-1)*.012*Math.sin(Math.PI*i/(rate*.04))*Math.exp(-i/(rate*.013));const index=(begin+i)%length;left[index]+=v*.6;right[index]+=v*.4;}}
   for(const at of [1,3])note(48,start+at*beat,.06,.035,'pluck',-.1);
  }
  // Circular short echo makes the tail belong to the following loop.
  for(const data of [left,right]){const dry=data.slice(),delay=Math.round(.14*rate);for(let i=0;i<length;i++)data[(i+delay)%length]+=dry[i]*.12;}
  let peak=0;for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));const scale=.68/(peak||1);for(let i=0;i<length;i++){left[i]*=scale;right[i]*=scale;}return {rate,duration,left,right};
 }
 const effects={
  ui:{duration:.10,tones:[[720,520,.08,.25,'sine',0]]},
  shot:{duration:.13,tones:[[340,110,.10,.5,'sine',0]],noise:.18},
  fast:{duration:.17,tones:[[800,230,.14,.35,'sine',0]],noise:.13},
  scatter:{duration:.19,tones:[[390,130,.12,.4,'triangle',0],[540,170,.12,.2,'sine',.025]],noise:.23},
  explosiveShot:{duration:.16,tones:[[260,90,.12,.45,'sine',0]],noise:.2},
  bounce:{duration:.10,tones:[[980,780,.07,.21,'sine',0],[1470,1100,.06,.09,'sine',0]]},
  hit:{duration:.14,tones:[[660,880,.10,.32,'sine',0],[990,1100,.08,.12,'sine',.025]]},
  helmet:{duration:.26,tones:[[1450,950,.15,.22,'sine',0],[2120,1340,.2,.09,'sine',.02]],noise:.05},
  shield:{duration:.17,tones:[[450,290,.12,.28,'triangle',0],[820,650,.11,.10,'sine',0]]},
  crack:{duration:.12,tones:[[185,100,.08,.15,'sine',0]],noise:.32},
  break:{duration:.26,tones:[[240,100,.17,.22,'sine',0]],noise:.36},
  explosion:{duration:.40,tones:[[135,40,.35,.65,'sine',0],[70,32,.3,.25,'sine',0]],noise:.43},
  win:{duration:.95,tones:[[523,523,.19,.32,'sine',0],[659,659,.19,.32,'sine',.14],[784,784,.24,.32,'sine',.28],[1047,1047,.45,.25,'sine',.46]]},
  lose:{duration:.62,tones:[[392,392,.20,.25,'sine',0],[330,330,.20,.22,'sine',.17],[262,262,.24,.20,'sine',.34]]}
 };
 function effect(name,rate=22050,pitch=1){const spec=effects[name]||effects.ui,data=new Float32Array(Math.ceil(spec.duration*rate));for(const [f,end,d,amp,type,start] of spec.tones){const offset=Math.round(start*rate);let phase=0;for(let i=0;i<Math.ceil(d*rate)&&offset+i<data.length;i++){const t=i/rate,u=t/d;phase+=2*Math.PI*(f*Math.pow(end/f,u))*pitch/rate;const wave=type==='triangle'?Math.asin(Math.sin(phase))*2/Math.PI:Math.sin(phase);data[offset+i]+=wave*amp*Math.min(1,t/.005)*Math.pow(1-u,2);}}
  if(spec.noise){let seed=9381,previous=0;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;previous=previous*.65+(seed/4294967296*2-1)*.35;const t=i/data.length;data[i]+=previous*spec.noise*Math.min(1,i/(rate*.003))*Math.pow(1-t,3);}}
  return {rate,duration:data.length/rate,left:data,right:data};
 }
 return {title:'小院散步',bpm,bars,duration,music,effect,effects};
});
