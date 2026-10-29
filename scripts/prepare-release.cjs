const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const output=path.resolve(process.argv[2]||path.join(root,'release-source'));
if(fs.existsSync(output))throw Error('Choose a new staging directory; nothing will be overwritten.');
fs.mkdirSync(output,{recursive:true});
const directories=['src','scripts','tests'];
for(const dir of directories)fs.cpSync(path.join(root,dir),path.join(output,dir),{recursive:true,filter:(file)=>!/^custom-ai-.*\.tsx$/.test(path.basename(file))});
for(const file of ['package.json','package-lock.json','tsconfig.json','eslint.config.js','.prettierrc','.gitignore','LICENSE','README.md','INSTALL.md','RELEASE-NOTES.md','Start-AI-Commands.cmd','Start-AI-Commands.ps1'])fs.copyFileSync(path.join(root,file),path.join(output,file));
fs.mkdirSync(path.join(output,'assets','command-icons'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'assets','command-icons')))if(/\.(png|svg)$/.test(file)||file==='NOTICE.txt')fs.copyFileSync(path.join(root,'assets','command-icons',file),path.join(output,'assets','command-icons',file));
fs.copyFileSync(path.join(root,'assets','icon-teal.png'),path.join(output,'assets','icon-teal.png'));
const manifest=JSON.parse(fs.readFileSync(path.join(output,'package.json'),'utf8'));
manifest.commands=manifest.commands.filter(c=>!c.name.startsWith('custom-ai-'));
const builtins={'fix-spelling-and-grammar':['Fix Spelling and Grammar','checkmark'],'improve-writing':['Improve Writing','pencil'],'summarize-webpage':['Summarize Webpage','text']};
for(const c of manifest.commands){
 if(builtins[c.name]){c.title=builtins[c.name][0];c.icon='command-icons/'+builtins[c.name][1]+'.png';}
 for(const pref of c.preferences||[])if(pref.name==='aiProviderOverride')pref.data=pref.data.filter(x=>x.value==='saved'||x.value==='default');
}
fs.writeFileSync(path.join(output,'package.json'),JSON.stringify(manifest,null,2)+'\n');
const genericReadme='# Commands\n\nWindows personal preview. Start with INSTALL.md for package selection, installation and the local-builder requirement. RELEASE-NOTES.md describes scope and limitations.\n\nMIT source fork of https://github.com/raycast/extensions/tree/main/extensions/chatgpt. Original attribution is retained in LICENSE and package.json.\n';
fs.writeFileSync(path.join(output,'README.md'),genericReadme);
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const licenses=Object.entries(lock.packages).filter(([name])=>name).map(([name,p])=>`${name.replace(/^node_modules\//,'')} ${p.version||''} — ${p.license||'see dependency license'}`).sort().join('\n');
fs.writeFileSync(path.join(output,'THIRD-PARTY-NOTICES.txt'),'Source license: LICENSE (MIT, original author attribution retained).\nDependency license summary from the lockfile; installed packages retain their full license notices.\n\n'+licenses+'\n\nRelease icon symbols are original geometric artwork; see assets/command-icons/NOTICE.txt.\n');
console.log(output);
