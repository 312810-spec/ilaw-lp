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
