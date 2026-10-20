const fs=require('node:fs'),esbuild=require('./.local-tools/node_modules/esbuild');
async function main(){
 const license=fs.readFileSync('3d-lab/vendor/LICENSE','utf8');
 await esbuild.build({entryPoints:['player-renderer-source.js'],bundle:true,minify:true,format:'esm',platform:'browser',target:'es2020',legalComments:'eof',banner:{js:'/*! Generated from player-renderer-source.js with esbuild '+esbuild.version+'. Three.js license: 3d-lab/vendor/LICENSE */'},footer:{js:'/*\n'+license+'\n*/'},outfile:'player-renderer.js',metafile:true}).then(r=>fs.writeFileSync('.local-tools/player-bundle-meta.json',JSON.stringify(r.metafile)));
 // Vendored shader strings contain line-end spaces; strip them for clean diffs.
 const output=fs.readFileSync('player-renderer.js','utf8').replace(/[\t ]+$/gm,'');
 fs.writeFileSync('player-renderer.js',output);
 console.log(JSON.stringify({esbuild:esbuild.version,bundleBytes:fs.statSync('player-renderer.js').size}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
