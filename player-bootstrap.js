// Fetch the bundled module alongside art; create the same player before entry.
// If the local renderer is slow, settle on the pose sprite for this whole session.
window.playerModelReady=Promise.resolve();
window.preloadPlayerModel=()=>{
 if(location.protocol==='file:')return Promise.resolve(null);
 return window.playerModuleLoad??=import('./player-renderer.js').catch(()=>null);
};
window.loadPlayerModel=()=>{
 if(location.protocol==='file:')return Promise.resolve();
 if(window.playerModelLoad)return window.playerModelLoad;
 let expired=false,timer;
 window.playerModelLoad=Promise.race([
  window.preloadPlayerModel().then(module=>expired||!module?null:module.createPlayerRenderer()),
  new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve(null);},10000);})
 ]).then(renderer=>{window.playerModel=renderer||null;}).catch(()=>{window.playerModel=null;}).finally(()=>clearTimeout(timer));
 window.playerModelReady=window.playerModelLoad;
 return window.playerModelLoad;
};
