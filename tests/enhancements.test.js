import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../src/server.js';
import {openDatabase} from '../src/db.js';
import {dispatch,teacher,waitJob} from './helpers.js';
import {examples} from '../src/curriculum.js';
import {generateGuided} from '../src/engine.js';
import {generateAI,AIProvider} from '../src/ai.js';
import {policySnapshot} from '../src/policy.js';
import {exportPDF} from '../src/pdf.js';
import {documentBlocks} from '../src/exports.js';
import {qualityCheck} from '../src/quality.js';
import {normalizeInput,validateSessions} from '../src/schema.js';
const input={grade:5,subject:'Mathematics',competencyId:examples[1].id,competency:examples[1].competency};
async function lesson(app,t){const r=await dispatch(app,{method:'POST',url:'/api/jobs',headers:t.headers,body:input});const job=await waitJob(app,r.json().jobId,t.headers);assert.equal(job.status,'completed',job.error);return (await dispatch(app,{url:`/api/plans/${job.planId}`,headers:t.headers})).json().plan;}
test('IlawCraft workflow uses one validated call, tracks model and rejects broken timing',async()=>{
 const guided=await generateGuided(input);const parts={unpack:guided.unpacking,context:guided.analysis,outcomes:{sessions:guided.sessions.map(({id,title,keyConcept,objectives})=>({id,title,keyConcept,objectives}))},review:guided.review};for(const k of ['assessment','experiences','differentiation','ways'])parts[k]={sessions:guided.sessions.map(s=>({id:s.id,[k]:s[k]}))};
 const requests=[];const provider=new AIProvider({key:'test-only',fetchImpl:async(_,options)=>{const body=JSON.parse(options.body);requests.push(body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(parts)}}],usage:{prompt_tokens:100,completion_tokens:200}})};}});
 const plan=await generateAI({...input,detail:'expanded',objectiveFormat:'Knowledge, skills and attitudes'},{provider});assert.equal(requests.length,1);assert.equal(plan.metadata.tokens.calls,1);assert.equal(plan.metadata.promptVersion,'ilawcraft-adapted-v2');assert.deepEqual(plan.source,guided.source);assert.match(plan.metadata.aiDeclaration,/AI assisted/);assert.deepEqual(plan.metadata.models,[provider.designModel]);const request=JSON.parse(requests[0].messages[1].content);assert.match(request.instruction,/Teacher Says/);assert.match(request.instruction,/Teacher selected KSA/);
 parts.experiences.sessions[0].experiences[0].minutes++;await assert.rejects(()=>generateAI(input,{provider}),/schema|timing/);
});
test('policy applicability uses lesson date, year and division; missing scoped context fails closed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ilaw-scope-'));const file=path.join(dir,'policy.json');fs.writeFileSync(file,JSON.stringify({status:'operator-reviewed',policyVersion:'scope-test-fixture',verifiedAt:'2026-10-02',effectiveFrom:'2026-06-01',effectiveTo:'2026-07-01',divisionScope:['Test division'],schoolYearScope:['2026–2027'],gradeScope:[5],sources:[{url:'https://www.deped.gov.ph/',issuance:'Test fixture',date:'2026-06-01',section:'Fixture',excerpt:'Test data only',interpretation:'Test applicability',behavior:'Fixture behavior',reviewer:'Test'}]}));process.env.ILAW_POLICY_FILE=file;
 try{const context={grade:5,division:'Test division',schoolYear:'2026-2027',lessonDate:'2026-06-15'};assert.equal(policySnapshot(context).status,'operator-reviewed');assert.equal(policySnapshot({...context,lessonDate:'2026-08-01'}).status,'unverified');assert.equal(policySnapshot({...context,division:'Another division'}).status,'unverified');assert.equal(policySnapshot({...context,schoolYear:'2027-2028'}).status,'unverified');assert.equal(policySnapshot().status,'unverified');}finally{delete process.env.ILAW_POLICY_FILE;fs.rmSync(dir,{recursive:true});}
});
test('observation assignments, immutable snapshot, amendment history and finalization',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});process.env.ILAW_REGISTRATION_ENABLED='true';
 try{const owner=await teacher(app,'obs-owner@example.test'),observer=await teacher(app,'observer@example.test'),other=await teacher(app,'outsider@example.test');const p=await lesson(app,owner);
  let r=await dispatch(app,{method:'POST',url:'/api/observations',headers:owner.headers,body:{planId:p.id,planRevision:p.revision,focus:'Learner explanations',observerEmail:'observer@example.test'}});assert.equal(r.status,201,r.text);let o=r.json().observation;
  assert.equal((await dispatch(app,{url:`/api/observations/${o.id}`,headers:other.headers})).status,404);assert.equal((await dispatch(app,{url:'/api/observations',headers:observer.headers})).json().observations.length,1);
  const update=body=>dispatch(app,{method:'POST',url:`/api/observations/${o.id}`,headers:observer.headers,body:{revision:o.revision,...body}});
  assert.equal((await dispatch(app,{method:'POST',url:`/api/observations/${o.id}`,headers:owner.headers,body:{revision:o.revision,action:'note',kind:'observed',text:'Claimed observation'}})).status,403);
  r=await update({action:'note',kind:'observed',text:'Three groups explained equivalent fractions.',interpretation:'Review whether each learner can explain independently.',activityId:'s1-l1'});assert.equal(r.status,200,r.text);o=r.json().observation;const note=o.notes[0];
  assert.equal((await update({revision:1,action:'note',kind:'observed',text:'Stale note'})).status,409);
  p.sessions[0].experiences[0].teacher='Changed after snapshot.';await dispatch(app,{method:'PUT',url:`/api/plans/${p.id}`,headers:owner.headers,body:{revision:p.revision,title:p.title,sessions:p.sessions}});assert.notEqual(o.snapshot.sessions[0].experiences[0].teacher,p.sessions[0].experiences[0].teacher);
  r=await update({action:'note',kind:'observed',text:'Correction: two groups, not three.',amends:note.id});assert.equal(r.status,200);o=r.json().observation;assert.equal(o.notes[0].text,note.text);assert.equal(o.notes[1].amends,note.id);
  assert.equal((await update({action:'reflection',text:'Observer cannot impersonate teacher.'})).status,403);
  r=await dispatch(app,{method:'POST',url:`/api/observations/${o.id}`,headers:owner.headers,body:{revision:o.revision,action:'finalize'}});o=r.json().observation;assert.equal(o.status,'finalized');assert.equal((await update({action:'note',kind:'observed',text:'After finalization'})).status,409);
  const history=(await dispatch(app,{url:`/api/observations/${o.id}/history`,headers:owner.headers})).json().history;assert.equal(history.length,4);
  assert.match((await dispatch(app,{url:`/api/observations/${o.id}/print`,headers:observer.headers})).text,/Correction: two groups/);
 }finally{delete process.env.ILAW_REGISTRATION_ENABLED;storage.close();}
});
test('actual reflection persists, survives export and is cleared from duplicated lessons',async()=>{
 const storage=openDatabase(':memory:');const app=await createApp({database:storage});try{const t=await teacher(app),p=await lesson(app,t);let r=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/reflection`,headers:t.headers,body:{revision:p.revision,sessionId:'s1',observedEvidence:'Learners explained equivalent parts.',difficulty:'Unequal wholes.',adjustment:'Compare equal wholes.',supportNeeded:''}});assert.equal(r.status,200,r.text);assert.equal(r.json().plan.reflections.s1.kind,'teacher-authored actual reflection');assert.match((await dispatch(app,{url:`/api/plans/${p.id}/docx`,headers:t.headers})).text,/Unequal wholes/);const copy=(await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/duplicate`,headers:t.headers,body:{}})).json().plan;assert.equal(copy.reflections,undefined);}finally{storage.close();}
});
test('PDF is a real embedded-font document; concise/material exports retain revised tasks and keys',async()=>{
 const p=await generateGuided(input);p.sessions[0].assessment[0].prompt='Solve 3x − 4 = 8; explain why x = 4.';p.sessions[0].assessment[0].answerKey='x = 4; 3(4) − 4 = 8.';const before=JSON.stringify(p);const pdf=exportPDF(p,{detail:'concise'});assert.match(pdf.subarray(0,8).toString(),/%PDF-1.7/);assert.match(pdf.toString('latin1'),/\/FontFile2/);assert.match(pdf.toString('latin1'),/\/ToUnicode/);assert.match(pdf.toString('latin1'),/startxref/);assert.equal(JSON.stringify(p),before);
 for(const options of [{detail:'concise'},{materials:true}]){const text=documentBlocks(p,options).map(x=>x.text).join('\n');assert.match(text,/3x − 4 = 8/);assert.match(text,/3\(4\) − 4 = 8/);}
 const storage=openDatabase(':memory:'),app=await createApp({database:storage});try{const t=await teacher(app),saved=await lesson(app,t);const r=await dispatch(app,{url:`/api/plans/${saved.id}/pdf?detail=concise`,headers:t.headers});assert.equal(r.status,200,r.text);assert.equal(r.headers['content-type'],'application/pdf');assert.match(r.headers['content-disposition'],/Mathematics.*\.pdf/);}finally{storage.close();}
});
test('bulk BOW imports are transactional, teacher-confirmed and scope filtered',async()=>{
 const storage=openDatabase(':memory:'),app=await createApp({database:storage});try{const t=await teacher(app);const row={kind:'budget-of-work',grade:0,subject:'Test learning area',curriculum:'Revised K–10',curriculumVersion:'test-only',schoolYear:'2026–2027',term:'Term 1',week:null,competency:'Test competency excerpt.',source:{title:'Test fixture',url:'https://www.deped.gov.ph/',section:'Test page',excerpt:'Test competency excerpt.'}};
  let r=await dispatch(app,{method:'POST',url:'/api/curriculum/bulk',headers:t.headers,body:{records:[row,{...row,competency:'Not in source'}]}});assert.equal(r.status,400);assert.equal(storage.db.prepare('SELECT count(*) n FROM curriculum').get().n,0);
  r=await dispatch(app,{method:'POST',url:'/api/curriculum/bulk',headers:t.headers,body:{records:[row]}});assert.equal(r.status,201,r.text);const record=(await dispatch(app,{url:'/api/curriculum',headers:t.headers})).json().records.find(x=>x.kind==='budget-of-work');assert.equal(record.source.status,'teacher-confirmed');assert.equal(record.source.verifiedAt,null);assert.equal(record.grade,0);
 }finally{storage.close();}
});
test('optional preparation prose does not block a usable plan or create irrelevant support warnings',async()=>{
 const p=await generateGuided(input);for(const s of p.sessions){s.objectives.forEach(o=>o.prerequisite='');s.experiences.forEach(a=>{a.transition='';a.supports='';});s.differentiation={support:'',language:'',extension:'',accessibility:''};}assert.doesNotThrow(()=>validateSessions(p.sessions,1));assert.ok(!qualityCheck(p).checks.some(c=>['support','differentiation'].includes(c.code)));p.input.support='Teacher-reported need for an accessible response format.';assert.ok(qualityCheck(p).checks.some(c=>c.code==='differentiation'));
 assert.equal(normalizeInput({...input,grade:0,competencyId:'',competency:'Teacher-selected Kindergarten competency.'}).grade,0);assert.throws(()=>normalizeInput({...input,lessonDate:'2026-02-30'}),/date/);assert.throws(()=>normalizeInput(null),/object/);
});
test('selected wording assistance proposes edits without changing the plan, rejects altered numbers and records accepted use',async()=>{
 let revised='Solve 3x + 4 = 10 with an explanation.';const provider=new AIProvider({key:'fixture',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({revised})}}]})})});const storage=openDatabase(':memory:'),app=await createApp({database:storage,provider});try{const t=await teacher(app),p=await lesson(app,t);const body={revision:p.revision,text:'Solve 3x + 4 = 10 and explain.',instruction:'Improve wording only.'};let r=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/refine`,headers:t.headers,body});assert.equal(r.status,200,r.text);assert.equal(storage.getPlan(p.id,t.user.id).revision,p.revision);revised='Solve 3x + 4 = 12 with an explanation.';r=await dispatch(app,{method:'POST',url:`/api/plans/${p.id}/refine`,headers:t.headers,body});assert.equal(r.status,400);
  r=await dispatch(app,{method:'PUT',url:`/api/plans/${p.id}`,headers:t.headers,body:{title:p.title,sessions:p.sessions,revision:p.revision,wordingAssisted:true}});assert.equal(r.status,200);assert.equal(r.json().plan.metadata.wordingAssisted,true);assert.match(r.json().plan.metadata.aiDeclaration,/AI also assisted with selected wording/);
 }finally{storage.close();}
});
