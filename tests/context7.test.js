import test from 'node:test';
import assert from 'node:assert/strict';
import {Context7TechnicalProvider,buildTechnicalQuery,parseTechnicalLibraries} from '../src/context7.js';

test('technical library hints are bounded, de-duplicated and sanitized',()=>{
 assert.deepEqual(parseTechnicalLibraries('React, @tauri-apps/api, React, bad?<tag>, Node.js, extra'),['React','@tauri-apps/api','badtag','Node.js']);
});

test('technical query contains only public lesson topic fields',()=>{
 const query=buildTechnicalQuery({subject:'ICT',competency:'Use React hooks to manage component state'});
 assert.match(query,/ICT/);assert.match(query,/React hooks/);assert.doesNotMatch(query,/learner|class size|teacher name/i);
});

test('Context7 lookup is opt-in, authenticated and fail-open',async()=>{
 let called=0;
 const disabled=new Context7TechnicalProvider({key:'secret',enabled:false,fetchImpl:async()=>{called++;}});
 assert.equal(await disabled.lookup({subject:'ICT',competency:'React state'}),null);assert.equal(called,0);

 let seen;
 const provider=new Context7TechnicalProvider({key:'test-key',enabled:true,fetchImpl:async(url,options)=>{seen={url,options};return {ok:true,status:200,text:async()=> 'Current React documentation excerpt'};}});
 const result=await provider.lookup({subject:'ICT',competency:'Use React hooks',libraries:'React, Vite'});
 assert.equal(result.provider,'Context7');assert.equal(result.classification,'supplemental technical documentation');assert.deepEqual(result.libraries,['React','Vite']);
 assert.equal(seen.options.headers.Authorization,'Bearer test-key');assert.equal(seen.url.searchParams.get('type'),'txt');assert.match(seen.url.searchParams.get('query'),/Use React hooks/);assert.deepEqual(seen.url.searchParams.getAll('library'),['React','Vite']);

 const missing=new Context7TechnicalProvider({key:'test-key',enabled:true,fetchImpl:async()=>({ok:false,status:404,text:async()=>''})});
 assert.equal(await missing.lookup({subject:'ICT',competency:'Unknown library'}),null);
 const rateLimited=new Context7TechnicalProvider({key:'test-key',enabled:true,fetchImpl:async()=>({ok:false,status:429,text:async()=>''})});
 assert.equal(await rateLimited.lookup({subject:'ICT',competency:'React'}),null);
 const offline=new Context7TechnicalProvider({key:'test-key',enabled:true,fetchImpl:async()=>{throw Error('offline');}});
 assert.equal(await offline.lookup({subject:'ICT',competency:'React'}),null);
});

test('Context7 response is bounded before it enters the AI context',async()=>{
 const provider=new Context7TechnicalProvider({key:'test-key',enabled:true,fetchImpl:async()=>({ok:true,status:200,text:async()=> 'x'.repeat(12000)})});
 const result=await provider.lookup({subject:'ICT',competency:'React'});
 assert.equal(result.text.length,8000);
});

test('failed generation resumes with the same bounded technical snapshot, including an empty result',async()=>{
 const {generateAI,ProviderError}=await import('../src/ai.js');const {generateGuided}=await import('../src/engine.js');const {examples}=await import('../src/curriculum.js');
 const input={grade:5,subject:'Mathematics',competencyId:examples[1].id,competency:examples[1].competency,aiWorkflow:'staged',technicalReference:true,technicalLibraries:'React'};
 const guided=await generateGuided(input);const fixtures={unpack:guided.unpacking,context:guided.analysis,outcomes:{sessions:guided.sessions.map(({id,title,keyConcept,objectives})=>({id,title,keyConcept,objectives}))},review:guided.review};for(const key of ['assessment','experiences','differentiation','ways'])fixtures[key]={sessions:guided.sessions.map(s=>({id:s.id,[key]:s[key]}))};
 for(const snapshot of [null,{provider:'Context7',classification:'supplemental technical documentation',libraries:['React'],text:'First retrieved documentation'}]){
  let lookups=0,fail=true;const parts={};const checkpoint={save:async(key,value)=>parts[key]=structuredClone(value)};
  const docs={available:true,lookup:async()=>{lookups++;return snapshot;}};const contexts=[];
  const provider={available:true,designModel:'fixture',fastModel:'fixture',generateStructured:async({stage,context})=>{contexts.push(context);if(stage==='assessment'&&fail){fail=false;throw new ProviderError('Fixture interruption');}return {output:fixtures[stage]};}};
  await assert.rejects(()=>generateAI(input,{provider,technicalDocsProvider:docs,checkpoint}),/Fixture interruption/);
  const plan=await generateAI(input,{provider,technicalDocsProvider:docs,checkpoint:{...checkpoint,parts}});assert.equal(lookups,1);assert.equal(plan.metadata.technicalReference.used,Boolean(snapshot));assert.ok(!plan.metadata.retainedStages.includes('__technicalReference'));assert.ok(contexts.every(c=>snapshot?c.technicalReference.text===snapshot.text:!c.technicalReference));
 }
});

test('cancellation aborts a pending technical lookup before any model call',async()=>{
 const {generateAI}=await import('../src/ai.js');const {examples}=await import('../src/curriculum.js');const controller=new AbortController();let started;const pending=new Promise(resolve=>started=resolve);let calls=0;
 const docs=new Context7TechnicalProvider({key:'fixture',enabled:true,fetchImpl:async(_,options)=>{started();return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));}});
 const running=generateAI({grade:5,subject:'Mathematics',competencyId:examples[1].id,competency:examples[1].competency,technicalReference:true},{provider:{available:true,signal:controller.signal,generateStructured:async()=>calls++},technicalDocsProvider:docs});await pending;controller.abort();await assert.rejects(running,{name:'AbortError'});assert.equal(calls,0);
});
