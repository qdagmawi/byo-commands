const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEndpoint, resolveProvider, visibleModels, endpoints } = require('../src/utils/providers.ts');
const { launcherContent } = require('../src/utils/launcher-content.ts');
const { resolveCommandSettings } = require('../src/utils/command-settings.ts');
const { DEFAULT_MODEL } = require('../src/utils/model-defaults.ts');

test('provider endpoints require HTTPS except loopback and reject embedded credentials', () => {
  assert.equal(validateEndpoint(endpoints.gemini), endpoints.gemini.slice(0,-1));
  assert.equal(validateEndpoint('http://localhost:11434/v1/'), 'http://localhost:11434/v1');
  for (const endpoint of ['http://example.com/v1', 'https://key:secret@example.com', 'https://example.com?key=secret', 'invalid']) assert.throws(()=>validateEndpoint(endpoint));
});
test('explicit provider takes priority over default and deleted providers never fall back silently', () => {
  const settings = {version:1,defaultProviderId:'google',providers:[{id:'google'},{id:'other'}]};
  assert.equal(resolveProvider(settings).id,'google');
  assert.equal(resolveProvider(settings,'other').id,'other');
  assert.throws(()=>resolveProvider(settings,'deleted'));
  assert.equal(resolveProvider({version:1,providers:[]}),undefined);
});
test('model picker hides excluded models and sorts favorites first without duplicates', () => {
  assert.deepEqual(visibleModels({models:['a','b','c','a'],favorites:['c'],hidden:['b']}),['c','a']);
});
test('provider and model inherit together and survive independent command settings', () => {
  const base = {...DEFAULT_MODEL,providerId:'google',option:'gemini-test'};
  const command = {id:'one',name:'Rewrite',configurationMode:'inherit',overrideModel:false,providerId:'other',model:'other-model'};
  assert.equal(resolveCommandSettings(command,base).providerId,'google');
  assert.equal(resolveCommandSettings({...command,overrideModel:true},base).providerId,'other');
  assert.equal(resolveCommandSettings({...command,configurationMode:'independent'},base).providerId,'other');
});
test('launcher neutralizes multiline metadata and encodes command IDs without shell interpolation', () => {
  const id = "id'$(Get-Content secret)&x";
  const script = launcherContent('Rewrite\n# @raycast.mode fullOutput', id, 'author','extension');
  assert.equal(script.split('\n').filter(l=>l.startsWith('# @raycast.mode')).length,1);
  assert.ok(!script.includes('$(Get-Content'));
  const url = script.match(/Start-Process -FilePath '(.*)'/)[1].replace(/''/g,"'");
  assert.equal(JSON.parse(new URL(url).searchParams.get('context')).commandId,id);
  assert.ok(!script.includes('apiKey'));
  assert.ok(script.includes('# @raycast.platform windows\n'));
  assert.ok(script.includes('# @raycast.icon command-icons/action.png\n'));
});
