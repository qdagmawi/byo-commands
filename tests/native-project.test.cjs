const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {syncNativeProject,nativeCommandName}=require('../src/utils/native-project.ts');

test('saved custom commands become stable manifest entries with individual preferences',async()=>{
 const root=await fs.mkdtemp(path.join(require('node:os').tmpdir(), 'native-project-'));
 await fs.mkdir(path.join(root,'src'));
 await fs.writeFile(path.join(root,'package.json'),JSON.stringify({name:'personal-ai-commands',commands:[{name:'providers',title:'Models & Providers'}]}));
 let commands={custom:{id:'custom',name:'My Rewrite',icon:'pencil'}};
 await syncNativeProject(root,async()=>commands);
 let manifest=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 const entry=manifest.commands.find(c=>c.name===nativeCommandName('custom'));
 assert.equal(entry.title,'My Rewrite');assert.equal(entry.icon,'command-icons/pencil.png');
 assert.ok(entry.preferences.some(p=>p.name==='aiPromptOverride'));
 assert.ok(entry.preferences.some(p=>p.name==='aiModelOverride'));
 assert.match(await fs.readFile(path.join(root,'src',entry.name+'.tsx'),'utf8'),/commandId=\{"custom"\}/);
 commands.custom={...commands.custom,name:'Renamed Rewrite'};
 await syncNativeProject(root,async()=>commands);
 manifest=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 assert.equal(manifest.commands.find(c=>c.title==='Renamed Rewrite').name,entry.name);
 await syncNativeProject(root,async()=>({}));
 manifest=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 assert.ok(!manifest.commands.some(c=>c.name===entry.name));
 assert.ok(manifest.commands.some(c=>c.name==='providers'));
 assert.ok(!manifest.commands.some(c=>c.name==='settings'));
});
