const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');

test('concurrent provider updates preserve profiles, preferences and separately stored credentials', async () => {
  const supportPath=await fs.mkdtemp(path.join(require('node:os').tmpdir(), 'provider-storage-'));
  const items=new Map();
  const original=Module._load;
  Module._load=function(id,...args){
    if(id==='@raycast/api')return { environment:{supportPath}, LocalStorage:{
      getItem:async key=>items.get(key),setItem:async(key,value)=>{await new Promise(r=>setTimeout(r,1));items.set(key,value);},removeItem:async key=>items.delete(key)
    }};
    return original.call(this,id,...args);
  };
  let storage;
  try {storage=require('../src/utils/provider-storage.ts');} finally {Module._load=original;}
  const {secretKey,PROVIDERS_KEY}=require('../src/utils/providers.ts');
  const profile=(id)=>({id,name:id,kind:'gemini',endpoint:'https://example.com/v1',models:[],favorites:[],hidden:[]});
  await Promise.all(Array.from({length:8},(_,i)=>storage.saveProvider(profile('p'+i),'test-secret-'+i)));
  assert.equal((await storage.readProviders()).providers.length,8);
  await Promise.all([
    storage.updateProvider('p0',p=>({...p,models:['model-a','model-b']})),
    storage.updateProvider('p0',p=>({...p,favorites:['model-a']})),
    storage.updateProvider('p0',p=>({...p,hidden:['model-b']}))
  ]);
  const current=(await storage.readProviders()).providers.find(p=>p.id==='p0');
  assert.deepEqual(current.models,['model-a','model-b']);
  assert.deepEqual(current.favorites,['model-a']);
  assert.deepEqual(current.hidden,['model-b']);
  assert.ok(!items.get(PROVIDERS_KEY).includes('test-secret'));
  await storage.saveProvider({...current,endpoint:'https://other.example.com/v1'},'replacement-secret');
  assert.equal(items.get(secretKey('p0')),'replacement-secret');
  assert.deepEqual((await storage.readProviders()).providers.find(p=>p.id==='p0').models,[]);
});

test('default selection updates untouched built-ins without changing prompts or explicit connections', () => {
  const {migrateCatalog,selectDefaultModel,mapCommandToModel}=require('../src/utils/model-catalog.ts');
  let catalog=migrateCatalog({}, {}, new Date().toISOString());
  const ids=Object.keys(catalog.commands);
  catalog.commands[ids[1]]={...catalog.commands[ids[1]],providerId:'explicit',model:'chosen-model'};
  catalog=selectDefaultModel(catalog,'google','gemini-test');
  assert.equal(mapCommandToModel(catalog.commands[ids[0]],catalog.models).option,'gemini-test');
  assert.equal(mapCommandToModel(catalog.commands[ids[0]],catalog.models).providerId,'google');
  assert.equal(mapCommandToModel(catalog.commands[ids[1]],catalog.models).option,'chosen-model');
  const prompt=catalog.commands[ids[0]].prompt;
  catalog=selectDefaultModel(catalog,'other','other-model');
  assert.equal(mapCommandToModel(catalog.commands[ids[0]],catalog.models).option,'other-model');
  assert.equal(catalog.commands[ids[0]].prompt,prompt);
});
