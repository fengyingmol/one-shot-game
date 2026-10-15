// A bounded optional model load: keep the existing whole-pose sprite fallback.
window.playerModelReady=Promise.resolve();
if(location.protocol!=='file:'){
 let expired=false,timer;
 window.playerModelReady=Promise.race([
  import('./player-renderer.js').then(({createPlayerRenderer})=>expired?null:createPlayerRenderer()),
  new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve(null);},45000);})
 ]).then(renderer=>{if(renderer)window.playerModel=renderer;}).catch(()=>{window.playerModel=null;}).finally(()=>clearTimeout(timer));
}
