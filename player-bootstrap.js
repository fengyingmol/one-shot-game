// Load the same 3D player before entry, but only after first-level art is ready.
// If the local renderer is slow, settle on the pose sprite for this whole session.
window.playerModelReady=Promise.resolve();
window.loadPlayerModel=()=>{
 if(location.protocol==='file:')return Promise.resolve();
 if(window.playerModelLoad)return window.playerModelLoad;
 let expired=false,timer;
 window.playerModelLoad=Promise.race([
  import('./player-renderer.js').then(({createPlayerRenderer})=>expired?null:createPlayerRenderer()),
  new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve(null);},10000);})
 ]).then(renderer=>{if(renderer)window.playerModel=renderer;}).catch(()=>{window.playerModel=null;}).finally(()=>clearTimeout(timer));
 window.playerModelReady=window.playerModelLoad;
 return window.playerModelLoad;
};
