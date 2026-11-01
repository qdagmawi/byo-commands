const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {inspectPromptTemplate,renderPromptTemplate}=require('../src/utils/prompt-template.ts');
const {DEFAULT_COMMANDS,DEFAULT_MODEL}=require('../src/utils/model-defaults.ts');
const {includeDefaultCommands,migrateCatalog,createModelCatalog,CATALOG_STORAGE_KEY}=require('../src/utils/model-catalog.ts');
const prompts=require('../src/utils/default-prompts.ts');
const page={title:'Page title',url:'https://example.com/',content:'A factual **page**. $& {argument name="Injected"}'};

test('the requested seven defaults retain their prompts, icons and native entries',()=>{
 const definitions=[['explainer','Explainer','EXPLAINER_PROMPT'],['rewriter','Rewriter','REWRITER_PROMPT'],['explain-simple','Explain This in Simple Terms','SIMPLE_EXPLANATION_PROMPT'],['ask-about-webpage','Ask About Webpage','ASK_WEBPAGE_PROMPT'],['summarize-webpage','Summarize Webpage','SUMMARIZE_WEBPAGE_PROMPT'],['critique-counterarguments','Critique & Counterarguments','CRITIQUE_PROMPT'],['synthesize-connect','Synthesize & Connect','SYNTHESIS_PROMPT']];
 const manifest=require('../package.json');
 for(const [slug,name,key]of definitions){const cmd=DEFAULT_COMMANDS['default-'+slug];assert.equal(cmd.name,name);assert.equal(cmd.prompt,prompts[key]);assert.equal(cmd.configurationMode,'inherit');assert.equal(cmd.baseModelId,'default');assert.equal(cmd.overridePrompt,true);assert.ok(fs.existsSync(path.join(__dirname,'../assets/command-icons',cmd.icon+'.png')));assert.ok(manifest.commands.some(entry=>entry.name===slug));}
});

test('question and webpage objects render exactly once as raw text',()=>{
 const info=inspectPromptTemplate(prompts.ASK_WEBPAGE_PROMPT);
 assert.deepEqual(info.argumentNames,['Question']);assert.equal(info.usesBrowser,true);
 const rendered=renderPromptTemplate(prompts.ASK_WEBPAGE_PROMPT,{browser:page,arguments:{Question:'What does it say?'}});
 assert.ok(rendered.includes('What does it say?'));assert.ok(rendered.includes('Title: Page title'));assert.ok(rendered.includes('URL: https://example.com/'));assert.ok(rendered.includes(page.content));
 assert.ok(!rendered.includes('{browser-tab.'));assert.ok(!rendered.includes('{argument name="Question"}'));
});

test('selection placeholders do not duplicate input or evaluate input placeholders',()=>{
 const text='A literal $& and {selection}';
 assert.equal(renderPromptTemplate('Text: {selection}',{selection:text}),'Text: '+text);
 assert.equal(inspectPromptTemplate(prompts.EXPLAINER_PROMPT).hasTokens,false);
 assert.ok(renderPromptTemplate(prompts.SIMPLE_EXPLANATION_PROMPT,{selection:'Philosophy'}).includes('Text:\nPhilosophy\n\nExplanation:'));
});

test('missing arguments, content and unsupported browser formats fail before sending',()=>{
 assert.throws(()=>renderPromptTemplate(prompts.ASK_WEBPAGE_PROMPT,{browser:page}),/Enter Question/);
 assert.throws(()=>renderPromptTemplate(prompts.SUMMARIZE_WEBPAGE_PROMPT,{}),/webpage content/);
 assert.throws(()=>renderPromptTemplate('{selection}',{}),/Select some text/);
 assert.throws(()=>inspectPromptTemplate('{browser-tab.content format="html" | raw}'),/Unsupported/);
});

test('existing saved configurations receive new defaults without replacing edited prompts or custom commands',async()=>{
 const old={version:1,models:{default:{...DEFAULT_MODEL,providerId:'my-provider',option:'my-model'}},commands:{custom:{...DEFAULT_COMMANDS['default-rewriter'],id:'custom',name:'My Rewriter',prompt:'Keep this',shortcutSlot:'4'},'default-explainer':{...DEFAULT_COMMANDS['default-explainer'],prompt:'My explanation instructions'}}};
 const storage=new Map([[CATALOG_STORAGE_KEY,JSON.stringify(old)]]);
 const store=createModelCatalog({getItem:async key=>storage.get(key),setItem:async(key,value)=>storage.set(key,value)});await store.load();
 const catalog=store.getSnapshot().catalog;
 assert.equal(catalog.commands.custom.prompt,'Keep this');assert.equal(catalog.commands.custom.shortcutSlot,'4');assert.equal(catalog.commands['default-explainer'].prompt,'My explanation instructions');assert.equal(catalog.models.default.option,'my-model');assert.ok(catalog.commands['default-synthesize-connect']);
});

test('only the unchanged legacy webpage summary is upgraded',()=>{
 const stock=migrateCatalog({}, {},'now');
 stock.commands['default-summarize-webpage']={...stock.commands['default-summarize-webpage'],prompt:'Read and summarize the main ideas and key points from this text. Summarize the information concisely and clearly.',providerId:'keep-me'};
 assert.equal(includeDefaultCommands(stock).commands['default-summarize-webpage'].prompt,prompts.SUMMARIZE_WEBPAGE_PROMPT);
 stock.commands['default-summarize-webpage'].prompt='My own summary';
 assert.equal(includeDefaultCommands(stock).commands['default-summarize-webpage'].prompt,'My own summary');
 assert.equal(includeDefaultCommands(stock).commands['default-summarize-webpage'].providerId,'keep-me');
});
