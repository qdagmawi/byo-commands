const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { syncLauncherFiles } = require('../src/utils/launcher-files.ts');

test('overlapping real launcher saves preserve icons, complete scripts and unrelated files', async () => {
  const root = await fs.mkdtemp(path.join(require('node:os').tmpdir(), 'launcher-regression-'));
  const directory = path.join(root,'launchers');
  const options = {directory,assetsPath:path.resolve('assets'),author:'author',extension:'extension',commands:{one:{id:'one',name:'Grammar',icon:'pencil'}}};
  await syncLauncherFiles(options);
  await fs.writeFile(path.join(directory,'personal.ps1'),'Keep me');
  const results = await Promise.allSettled(Array.from({length:16},()=>syncLauncherFiles(options)));
  assert.deepEqual(results.filter(r=>r.status==='rejected').map(r=>r.reason.message),[]);
  assert.equal(await fs.readFile(path.join(directory,'personal.ps1'),'utf8'),'Keep me');
  const scripts=(await fs.readdir(directory)).filter(f=>/^ai-command-.*\.ps1$/.test(f));
  assert.equal(scripts.length,1);
  const content=await fs.readFile(path.join(directory,scripts[0]),'utf8');
  assert.match(content,/# @raycast.platform windows/);
  const icon=content.match(/# @raycast.icon (.*)/)[1].trim();
  assert.ok((await fs.stat(path.join(directory,icon))).size>0);
});
