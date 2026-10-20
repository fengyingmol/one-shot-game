const sharp=require('./.local-tools/node_modules/sharp'),fs=require('node:fs');
async function main(){
 const source='assets/toy-courtyard-lawn-v1.webp';
 const regions=await Promise.all([{left:0,top:0,width:1024,height:112},{left:0,top:300,width:96,height:480},{left:928,top:300,width:96,height:480}].map(r=>sharp(source).extract(r).png().toBuffer()));
 const wall=await sharp({create:{width:1024,height:800,channels:4,background:'#0000'}}).composite([{input:regions[0],left:0,top:0},{input:regions[1],left:0,top:300},{input:regions[2],left:928,top:300}]).png().toBuffer();
 fs.writeFileSync('assets/toy-courtyard-frame-v1.png',wall);await sharp(wall).webp({quality:90,alphaQuality:100,effort:6}).toFile('assets/toy-courtyard-frame-v1.webp');
 await sharp('assets/toy-garden-decor-v1.webp').resize(512,512).png().toFile('assets/toy-garden-decor-small-v1.png');
 await sharp('assets/toy-garden-decor-small-v1.png').webp({quality:92,alphaQuality:100,effort:6}).toFile('assets/toy-garden-decor-small-v1.webp');
 for(const name of ['control','pill','ammo'])await sharp('assets/ui/cream-v1/'+name+'.png').webp({quality:92,alphaQuality:100,effort:6}).toFile('assets/ui/cream-v1/'+name+'.webp');
 console.log(JSON.stringify(['assets/toy-courtyard-frame-v1.webp','assets/toy-garden-decor-small-v1.webp',...['control','pill','ammo'].map(n=>'assets/ui/cream-v1/'+n+'.webp')].map(file=>({file,bytes:fs.statSync(file).size})),null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
