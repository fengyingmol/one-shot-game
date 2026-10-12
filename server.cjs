const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const host = process.env.ONE_SHOT_HOST || '127.0.0.1';
const runtimeFiles = new Set(['index.html','style.css','casual.css','game.js','soundtrack.js','audio.js']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wav':'audio/wav'};
http.createServer((req,res)=>{
 let filename;
 try { filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); } catch { res.writeHead(400); return res.end(); }
 if(filename===root)filename=path.join(root,'index.html');
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 const relative = path.relative(root,filename).replaceAll('\\','/');
 // LAN preview serves game resources only, never Git data, tools or profiles.
 if(!runtimeFiles.has(relative)&&!(relative.startsWith('assets/')&&!relative.split('/').some(part=>part.startsWith('.'))&&/\.(png|svg|wav|woff2)$/i.test(relative))){res.writeHead(403);return res.end('Not public');}
 fs.readFile(filename,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(4180,host,()=>console.log(`Demo listening on ${host}:4180`));
