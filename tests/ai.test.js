import test from 'node:test';import assert from 'node:assert/strict';
import {AIProvider,generateAI,regenerateAI} from '../src/ai.js';
import {generateGuided} from '../src/engine.js';import {examples} from '../src/curriculum.js';import {stages} from '../src/schema.js';
const input={grade:5,subject:'Mathematics',competencyId:examples[1].id,competency:examples[1].competency,mode:'ai'};
test('missing credential never produces fake AI output',async()=>{const provider=new AIProvider({key:''});await assert.rejects(()=>generateAI(input,{provider}),/not configured/);});
test('malformed JSON, invalid schema, refusal, limit and upstream failures fail safely',async()=>{
 for(const payload of [{choices:[{message:{content:'not json'}}]},{choices:[{message:{content:'{}'}}]},{choices:[{message:{refusal:'No'}}]},{choices:[{finish_reason:'length',message:{content:'{}'}}]}]){const provider=new AIProvider({key:'fixture',fetchImpl:async()=>({ok:true,json:async()=>payload})});await assert.rejects(()=>provider.generateStructured({stage:'unpack',schema:stages.unpack,context:{},instruction:'test'}));}
 const provider=new AIProvider({key:'fixture',fetchImpl:async()=>({ok:false,status:429})});await assert.rejects(()=>provider.generateStructured({stage:'unpack',schema:stages.unpack,context:{},instruction:'test'}),/rate limit/);
});
test('real pipeline orchestration uses eight small validated calls and records usage',async()=>{
 const guided=await generateGuided({...input,mode:'guided'});const fixtures={unpack:guided.unpacking,context:guided.analysis,outcomes:{sessions:guided.sessions.map(({id,title,keyConcept,objectives})=>({id,title,keyConcept,objectives}))},review:guided.review};for(const k of ['assessment','experiences','differentiation','ways'])fixtures[k]={sessions:guided.sessions.map(s=>({id:s.id,[k]:s[k]}))};
 const calls=[];const provider=new AIProvider({key:'test-only-fixture',fetchImpl:async(url,options)=>{const req=JSON.parse(options.body);const {stage,context}=JSON.parse(req.messages[1].content);calls.push({stage,context,model:req.model});return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(fixtures[stage])}}],usage:{prompt_tokens:100,completion_tokens:200}})};}});
 const visited=[];const result=await generateAI(input,{provider,onStage:async s=>visited.push(s)});assert.equal(calls.length,8);assert.equal(result.metadata.mode,'ai');assert.equal(result.metadata.tokens.input,800);assert.equal(result.metadata.tokens.output,1600);assert.equal(result.source.code,null);assert.equal(result.quality.counts.error,0);assert.ok(!('experiences' in calls.find(c=>c.stage==='ways').context));assert.equal(visited[0],'resolve');assert.equal(calls.find(c=>c.stage==='unpack').model,provider.fastModel);
});
test('targeted AI rewrite protects IDs and minutes and does not send all sessions',async()=>{
 const p=await generateGuided({...input,mode:'guided',sessions:2});const node={...p.sessions[0].experiences[0],teacher:'A fixture rewrite'};let context;const provider=new AIProvider({key:'fixture',fetchImpl:async(u,opts)=>{context=JSON.parse(JSON.parse(opts.body).messages[1].content).context;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(node)}}]})};}});
 const result=await regenerateAI(p,{sessionId:'s1',section:'experiences',nodeId:node.id,action:'simplify'},provider);assert.equal(result.sessions[0].experiences[0].teacher,node.teacher);assert.deepEqual(result.sessions[1],p.sessions[1]);assert.ok(!context.sessions);node.minutes++;await assert.rejects(()=>regenerateAI(p,{sessionId:'s1',section:'experiences',nodeId:node.id},provider),/timing/);
});
test('unsupported official-policy claims and invented codes are rejected even when JSON is valid',async()=>{
 const {rejectUnsupportedClaims}=await import('../src/ai.js');assert.throws(()=>rejectUnsupportedClaims({text:'This lesson is DepEd approved.'},{code:null}),/unsupported/);assert.throws(()=>rejectUnsupportedClaims({text:'Official competency code: M5FA99.'},{code:null}),/invented/);assert.doesNotThrow(()=>rejectUnsupportedClaims({text:'This lesson is not DepEd approved; verify current policy.'},{code:null}));assert.doesNotThrow(()=>rejectUnsupportedClaims({text:'Competency code: M5FA99.'},{code:'M5FA99'}));
});

test('AI context includes teacher references and source excerpt without administrative identities',async()=>{
 const {classroomContext}=await import('../src/ai.js');
 const context=classroomContext({...input,teacherName:'Private name',schoolName:'Private school',lessonReferences:'Textbook p. 12: equivalent fractions'});
 assert.equal(context.lessonReferences,'Textbook p. 12: equivalent fractions');
 assert.ok(!('teacherName' in context));assert.ok(!('schoolName' in context));
 const p=await generateGuided({...input,mode:'guided',teacherName:'Private name',lessonReferences:context.lessonReferences});
 const original=p.sessions[0].experiences[0];let received;
 const provider=new AIProvider({key:'fixture',fetchImpl:async(u,opts)=>{received=JSON.parse(JSON.parse(opts.body).messages[1].content).context;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({...original,teacher:'Revised wording'})}}]})};}});
 const revised=await regenerateAI(p,{sessionId:'s1',section:'experiences',nodeId:original.id,instructions:'Use Cebuano and preserve the worked example'},provider);
 assert.equal(received.revisionRequest,'Use Cebuano and preserve the worked example');assert.equal(received.classroom.lessonReferences,context.lessonReferences);assert.ok(!('teacherName' in received.classroom));
 assert.deepEqual(revised.sessions[0].assessment,p.sessions[0].assessment);assert.equal(revised.input.teacherName,'Private name');
 await assert.rejects(()=>regenerateAI(p,{sessionId:'s1',section:'experiences',instructions:'x'.repeat(1001)},provider),/1000/);
});
