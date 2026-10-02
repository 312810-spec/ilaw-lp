import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createApp} from '../src/server.js';import {openDatabase} from '../src/db.js';import {dispatch,teacher,waitJob} from './helpers.js';import {examples} from '../src/curriculum.js';
const input={grade:5,subject:'Mathematics',competencyId:examples[1].id,competency:examples[1].competency};
test('full teacher journey: account, generation, edits, regeneration, review, exports, restore, duplicate, history, deletion',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{
 const t=await teacher(app);let res=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:input});assert.equal(res.status,202,res.text);const job=await waitJob(app,res.json().jobId,t.headers);assert.equal(job.status,'completed',job.error);const id=job.planId;
 res=await dispatch(app,{url:`/api/plans/${id}`,headers:t.headers});let p=res.json().plan;assert.equal(p.revision,1);p.sessions[0].objectives[0].criterion='Use the teacher’s revised criterion, preserving accuracy and explanation.';
 res=await dispatch(app,{method:'PUT',url:`/api/plans/${id}`,headers:t.headers,body:{revision:p.revision,title:p.title,sessions:p.sessions}});assert.equal(res.status,200,res.text);p=res.json().plan;assert.equal(p.revision,2);
 const stale=await dispatch(app,{method:'PUT',url:`/api/plans/${id}`,headers:t.headers,body:{revision:1,title:p.title,sessions:p.sessions}});assert.equal(stale.status,409);
 res=await dispatch(app,{method:'POST',url:`/api/plans/${id}/regenerate`,headers:t.headers,body:{revision:p.revision,sessionId:'s1',section:'experiences',nodeId:'s1-l3',action:'low-resource'}});assert.equal(res.status,200,res.text);p=res.json().plan;assert.match(p.sessions[0].objectives[0].criterion,/teacher’s revised/);
 res=await dispatch(app,{method:'POST',url:`/api/plans/${id}/review`,headers:t.headers,body:{revision:p.revision,confirm:true}});assert.equal(res.status,200,res.text);p=res.json().plan;assert.equal(p.metadata.status,'reviewed');
 const docx=await dispatch(app,{url:`/api/plans/${id}/docx`,headers:t.headers});assert.equal(docx.status,200);assert.equal(docx.bytes.readUInt32LE(0),0x04034b50);assert.match(docx.text,/teacher’s revised/);assert.match(docx.text,/TEACHER-REVIEWED/);assert.match(docx.text,/Ways Forward/);
 const print=await dispatch(app,{url:`/api/plans/${id}/print`,headers:t.headers});assert.equal(print.status,200);assert.match(print.text,/Save as PDF/);assert.match(print.text,/current|Current/);
 res=await dispatch(app,{method:'POST',url:`/api/plans/${id}/restore`,headers:t.headers,body:{revision:p.revision,targetRevision:1}});assert.equal(res.status,200);p=res.json().plan;assert.equal(p.metadata.status,'draft');assert.equal(p.revision,5);assert.doesNotMatch(p.sessions[0].objectives[0].criterion,/teacher’s revised/);
 const revisions=await dispatch(app,{url:`/api/plans/${id}/revisions`,headers:t.headers});assert.equal(revisions.json().revisions.length,5);
 const copy=await dispatch(app,{method:'POST',url:`/api/plans/${id}/duplicate`,headers:t.headers,body:{}});assert.equal(copy.status,201);assert.notEqual(copy.json().plan.id,id);
 const history=await dispatch(app,{url:'/api/plans',headers:t.headers});assert.equal(history.json().plans.length,2);
 const deletion=await dispatch(app,{method:'DELETE',url:`/api/plans/${id}`,headers:t.headers,body:{}});assert.equal(deletion.status,200);assert.equal((await dispatch(app,{url:`/api/plans/${id}`,headers:t.headers})).status,404);
 }finally{storage.close();}
});
test('authorization, CSRF, origin and secret exposure',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{const t=await teacher(app);assert.equal((await dispatch(app,{url:'/api/plans'})).status,401);assert.equal((await dispatch(app,{method:'POST',url:'/api/jobs',headers:{cookie:t.headers.cookie},body:input})).status,403);assert.equal((await dispatch(app,{method:'POST',url:'/api/jobs',headers:{...t.headers,origin:'https://attacker.example'},body:input})).status,403);
 const r=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:input});const job=await waitJob(app,r.json().jobId,t.headers);process.env.ILAW_REGISTRATION_ENABLED='true';const other=await teacher(app,'other@example.test');delete process.env.ILAW_REGISTRATION_ENABLED;
 assert.equal((await dispatch(app,{url:`/api/plans/${job.planId}`,headers:other.headers})).status,404);assert.equal((await dispatch(app,{url:`/api/jobs/${job.id}`,headers:other.headers})).status,404);const config=await dispatch(app,{url:'/api/config'});assert.ok(!('key' in config.json()));
 const html=await dispatch(app,{url:'/'});assert.equal(html.status,200);assert.ok(html.headers['content-security-policy'].includes("script-src 'self'"));assert.equal((await dispatch(app,{url:'/../src/server.js'})).status,404);
 }finally{storage.close();delete process.env.ILAW_REGISTRATION_ENABLED;}
});
test('durable plans survive reopen; restart marks interrupted job honestly',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ilaw-db-'));const file=path.join(dir,'plans.sqlite');let storage=openDatabase(file);const app=await createApp({database:storage});const t=await teacher(app);const r=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:input});const job=await waitJob(app,r.json().jobId,t.headers);
 storage.db.prepare('INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),t.user.id,'running','assessment','{}',null,null,new Date().toISOString(),new Date().toISOString());storage.close();storage=openDatabase(file);assert.equal(storage.getPlan(job.planId,t.user.id).sessions.length,1);assert.equal(storage.db.prepare("SELECT count(*) n FROM jobs WHERE status='failed'").get().n,1);storage.close();fs.rmSync(dir,{recursive:true});
});
test('live AI unavailable, source import, wrong excerpt, logout',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{const t=await teacher(app);const result=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:{...input,mode:'ai'}});assert.equal(result.status,503);
 const record={grade:5,subject:'Mathematics',curriculum:'MATATAG',competency:'Compute a whole-number sum.',code:'M-TEST',source:{title:'Teacher source test fixture, not a real guide',url:'https://www.deped.gov.ph/',section:'Fixture page 1',excerpt:'M-TEST Compute a whole-number sum.'}};
 let res=await dispatch(app,{method:'POST',url:'/api/curriculum',headers:t.headers,body:record});assert.equal(res.status,201,res.text);assert.equal(res.json().record.source.status,'teacher-confirmed');res=await dispatch(app,{method:'POST',url:'/api/curriculum',headers:t.headers,body:{...record,code:'INVENTED'}});assert.equal(res.status,400);assert.equal((await dispatch(app,{method:'POST',url:'/api/auth/logout',headers:t.headers,body:{}})).status,200);assert.equal((await dispatch(app,{url:'/api/plans',headers:t.headers})).status,401);
 }finally{storage.close();}
});
test('malformed AI generation becomes a recoverable failed job, never a stored fake draft',async()=>{
 const {AIProvider}=await import('../src/ai.js');const provider=new AIProvider({key:'test-only-fixture',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:'not JSON'}}]})})});const storage=openDatabase(':memory:');const app=await createApp({database:storage,provider});try{const t=await teacher(app);const r=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:{...input,mode:'ai'}});assert.equal(r.status,202);const job=await waitJob(app,r.json().jobId,t.headers);assert.equal(job.status,'failed');assert.equal(job.input.competency,input.competency);assert.match(job.error,/schema/);assert.equal((await dispatch(app,{url:'/api/plans',headers:t.headers})).json().plans.length,0);}finally{storage.close();}
});
test('session revision preserves other sessions; retiming preserves all teacher content',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{const t=await teacher(app);const r=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:{...input,sessions:2}});const job=await waitJob(app,r.json().jobId,t.headers);let p=(await dispatch(app,{url:`/api/plans/${job.planId}`,headers:t.headers})).json().plan;p.sessions[1].objectives[0].criterion='Keep my second-session criterion.';p=(await dispatch(app,{method:'PUT',url:`/api/plans/${p.id}`,headers:t.headers,body:{revision:p.revision,title:p.title,sessions:p.sessions}})).json().plan;
 let res=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/regenerate`,headers:t.headers,body:{revision:p.revision,sessionId:'s1',section:'session'}});assert.equal(res.status,200,res.text);p=res.json().plan;assert.equal(p.sessions[1].objectives[0].criterion,'Keep my second-session criterion.');res=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/retime`,headers:t.headers,body:{revision:p.revision,duration:30}});assert.equal(res.status,200,res.text);p=res.json().plan;assert.equal(p.input.duration,30);assert.equal(p.sessions[1].objectives[0].criterion,'Keep my second-session criterion.');assert.equal(p.sessions[0].experiences.reduce((n,a)=>n+a.minutes,0),30);
 }finally{storage.close();}
});
test('anonymous evidence counts persist, inform the next session, survive export and are not copied to new drafts',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{const t=await teacher(app);const jobResponse=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:{...input,sessions:2}});const job=await waitJob(app,jobResponse.json().jobId,t.headers);let p=(await dispatch(app,{url:`/api/plans/${job.planId}`,headers:t.headers})).json().plan;
 let r=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/evidence`,headers:t.headers,body:{revision:p.revision,sessionId:'s1',support:10,developing:15,mastery:10,extension:5,notes:'Equivalent fraction models need reinforcement.'}});assert.equal(r.status,200,r.text);p=r.json().plan;assert.equal(p.evidenceSummary.s1.support,10);assert.equal(p.evidenceSummary.s1.kind,'teacher-reported aggregate');
 r=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/evidence`,headers:t.headers,body:{revision:p.revision,sessionId:'s1',support:41,developing:0,mastery:0,extension:0,notes:''}});assert.equal(r.status,400);
 r=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/regenerate`,headers:t.headers,body:{revision:p.revision,sessionId:'s2',section:'session'}});assert.equal(r.status,200,r.text);p=r.json().plan;assert.match(p.sessions[1].experiences[0].teacher,/10 need prerequisite support/);
 const docx=await dispatch(app,{url:`/api/plans/${p.id}/docx`,headers:t.headers});assert.match(docx.text,/Teacher-reported aggregate evidence/);const copied=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/duplicate`,headers:t.headers,body:{}});assert.equal(copied.json().plan.evidenceSummary,undefined);
 }finally{storage.close();}
});
test('login verifies the password, rotates session; gzip assets decode to the original source',async()=>{
 const {gunzipSync}=await import('node:zlib');const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{const t=await teacher(app);let r=await dispatch(app,{method:'POST',url:'/api/auth/login',headers:{origin:'http://localhost:3000'},body:{email:'teacher@example.test',password:'the wrong long password'}});assert.equal(r.status,401);
 r=await dispatch(app,{method:'POST',url:'/api/auth/login',headers:{origin:'http://localhost:3000'},body:{email:'teacher@example.test',password:'a long test password 123'}});assert.equal(r.status,200);assert.notEqual(r.headers['set-cookie'].split(';')[0],t.headers.cookie);assert.ok(!storage.db.prepare('SELECT password_hash FROM users').get().password_hash.includes('a long test password'));
 const asset=await dispatch(app,{url:'/app.js',headers:{'accept-encoding':'gzip'}});assert.equal(asset.status,200);assert.equal(asset.headers['content-encoding'],'gzip');assert.match(gunzipSync(asset.bytes).toString(),/async function boot/);assert.ok(asset.bytes.length<30000);
 }finally{storage.close();}
});
test('account API keys are encrypted, owner scoped, CSRF protected and removable',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ilaw-keys-'));const filename=path.join(dir,'app.sqlite');let storage=openDatabase(filename);let app=await createApp({database:storage});
 try{const t=await teacher(app);const secret='test-private-api-key-123456';
 assert.equal((await dispatch(app,{url:'/api/account/ai'})).status,401);
 assert.equal((await dispatch(app,{method:'PUT',url:'/api/account/ai',headers:{cookie:t.headers.cookie},body:{provider:'groq',apiKey:secret}})).status,403);
 let r=await dispatch(app,{method:'PUT',url:'/api/account/ai',headers:t.headers,body:{provider:'groq',apiKey:secret}});assert.equal(r.status,200,r.text);assert.equal(r.json().configured,true);assert.ok(!r.text.includes(secret));
 assert.ok(!storage.db.prepare('SELECT secret FROM ai_credentials').get().secret.includes(secret));
 process.env.ILAW_REGISTRATION_ENABLED='true';const other=await teacher(app,'key-other@example.test');delete process.env.ILAW_REGISTRATION_ENABLED;
 assert.equal((await dispatch(app,{url:'/api/account/ai',headers:other.headers})).json().configured,false);
 assert.equal((await dispatch(app,{method:'PUT',url:'/api/account/ai',headers:t.headers,body:{provider:'http://localhost',apiKey:secret}})).status,400);
 storage.close();storage=openDatabase(filename);app=await createApp({database:storage});
 r=await dispatch(app,{url:'/api/account/ai',headers:t.headers});assert.equal(r.json().configured,true);assert.ok(!r.text.includes(secret));assert.equal(fs.statSync(filename+'.keys').mode&0o777,0o600);
 await dispatch(app,{method:'DELETE',url:'/api/account/ai',headers:other.headers,body:{}});assert.equal((await dispatch(app,{url:'/api/account/ai',headers:t.headers})).json().configured,true);
 await dispatch(app,{method:'DELETE',url:'/api/account/ai',headers:t.headers,body:{}});assert.equal((await dispatch(app,{url:'/api/account/ai',headers:t.headers})).json().configured,false);
 }finally{delete process.env.ILAW_REGISTRATION_ENABLED;storage.close();fs.rmSync(dir,{recursive:true,force:true});}
});
