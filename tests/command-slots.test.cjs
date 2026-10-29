const { test } = require('node:test');
const assert = require('node:assert/strict');
const { commandSlots, commandForSlot, validateCommandSlot } = require('../src/utils/command-slots.ts');
const { attachCommand, migrateCatalog, createModelCatalog, CATALOG_STORAGE_KEY } = require('../src/utils/model-catalog.ts');
const { DEFAULT_MODEL } = require('../src/utils/model-defaults.ts');
const stamp = '2026-10-29T12:00:00Z';
const prompt = { id:'custom', name:'Rewrite', configurationMode:'independent', model:'test', prompt:'Rewrite', temperature:'0.2', contentSource:'clipboard', isDisplayInput:false, shortcutSlot:'1' };

test('slots are fixed, unique native commands disabled until enabled by the user', () => {
  const manifest = require('../package.json');
  const entries = manifest.commands.filter(c => /^command-slot-\d+$/.test(c.name));
  assert.equal(entries.length, 20);
  assert.equal(commandSlots.length, 20);
  assert.equal(new Set(entries.map(c => c.name)).size, 20);
  assert.ok(entries.every(c => c.disabledByDefault && c.preferences.some(p => p.name === 'aiModelOverride')));
});

test('slot assignment rejects invalid slots and conflicting owners, but permits editing its owner', () => {
  for (const shortcutSlot of ['0','21','01','1.5']) assert.throws(() => validateCommandSlot({}, {...prompt, shortcutSlot}), /Choose a slot/);
  assert.throws(() => validateCommandSlot({custom:prompt}, {...prompt, id:'other'}), /assigned to Rewrite/);
  assert.doesNotThrow(() => validateCommandSlot({custom:prompt}, {...prompt, name:'Renamed'}));
});

test('catalog saves, reloads, frees and reassigns slots without rewriting native entries', async () => {
  const storage = new Map();
  const io = {getItem:async k=>storage.get(k),setItem:async(k,v)=>{storage.set(k,v);}};
  const store = createModelCatalog(io);
  await store.load();
  await store.saveCommand(prompt);
  await assert.rejects(store.saveCommand({...prompt,id:'other'}), /assigned to Rewrite/);
  const second = createModelCatalog(io); await second.load();
  assert.equal(commandForSlot(second.getSnapshot().catalog.commands,'1').id,'custom');
  await second.removeCommand(prompt);
  await second.saveCommand({...prompt,id:'other'});
  assert.equal(commandForSlot(second.getSnapshot().catalog.commands,'1').id,'other');
  assert.ok(storage.has(CATALOG_STORAGE_KEY));
});

test('existing prompts remain unassigned and settings survive slot assignment', () => {
  const catalog=migrateCatalog({default:DEFAULT_MODEL},{legacy:{...prompt,id:'legacy',shortcutSlot:undefined}},stamp);
  assert.equal(commandForSlot(catalog.commands,'1'),undefined);
  const next=attachCommand(catalog,prompt,stamp);
  assert.equal(next.commands.custom.prompt,'Rewrite');
  assert.equal(next.commands.legacy.shortcutSlot,undefined);
});
