const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const manifest=require('../package.json');
// Raycast 2.9 Windows backend: yx() -> ~/.config/raycast; bx() -> extensions/<name>; xx() -> <command>.js.
const directory=path.join(os.homedir(),'.config','raycast','extensions',manifest.name);
const missing=manifest.commands.filter(c=>!fs.existsSync(path.join(directory,c.name+'.js')));
if(missing.length){console.error('Missing executable:',missing.map(c=>c.name).join(', ')); console.error('Expected directory:',directory); process.exitCode=1;}
else console.log('PASS: every command executable exists in the installed Raycast loader directory.');

