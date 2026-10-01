import {normalizeInput,validate,stages,validateSessions,ValidationError} from './schema.js';
import {resolveCompetency} from './curriculum.js';
import {qualityCheck} from './quality.js';
import {policySnapshot} from './policy.js';
export const stageLabels={resolve:'Resolving competency and provenance',unpack:'Unpacking the competency',context:'Analyzing learner and classroom context',outcomes:'Defining outcomes and success criteria',assessment:'Designing assessment evidence',experiences:'Building learning experiences',differentiation:'Adding access and readiness supports',ways:'Preparing evidence-based Ways Forward',review:'Checking alignment and feasibility',save:'Saving your draft'};
const textContext=input=>input.localContext.trim()||'a familiar household or school situation';
export function selectProfile(input,source){
 const text=input.competency.toLowerCase();const f=source.focus;
 if(f==='fractions'||(/add/.test(text)&&/fraction/.test(text)))return {
  type:'fractions',concept:'Unlike fractions describe equal parts of differently partitioned wholes. Rename them with a common denominator before adding.',
  component:'represent and add fractions with unlike denominators',prerequisite:'Recognize numerator/denominator, equal partitions and simple equivalent fractions.',
  misconception:'Adding denominators produces an incorrect total; a common denominator preserves the size of the parts.',
  objective:'Add fractions with unlike denominators using an equivalent-fraction model, then justify the sum.',criterion:'Solve at least 3 of 4 sums correctly and explain why denominators are made equal. This is an editable app-default criterion.',
  evidence:'Four fraction sums, including one drawn model and a short explanation of equivalent fractions.',
  model:'Draw two equal-length bars. Partition one into halves and the other into fourths. Rename 1/2 as 2/4; combine 2/4 + 1/4 = 3/4. Ask why the whole must have the same size.',
  guided:'Pairs draw equal-size bars for 1/3 + 1/6. Agree on sixths, show 2/6 + 1/6 = 3/6 = 1/2, and explain each step.',
  task:'Solve: (1) 1/2 + 1/4; (2) 1/3 + 1/6; (3) 2/5 + 1/10; (4) 3/4 + 1/8. Draw equal-whole models for one item. Explain why adding denominators does not represent the total.',
  key:'1) 3/4; 2) 1/2; 3) 1/2; 4) 7/8. Accept equivalent unsimplified fractions unless simplification is part of the teacher’s stated criterion. Models must preserve equal wholes.',
  method:'Constructed response and visual-model explanation',rubric:'One point per correct sum (4 points); model: same-size whole and correct partition (2 points); explanation: renames equivalent fractions and preserves part size (2 points). Judge the objective criterion separately from total points.',
  support:'Use pre-drawn equal bars, denominators 2 and 4 first, then fade the labels. Invite a spoken explanation before written notation.',extension:'Compare two valid common denominators for the same sum and justify which makes the calculation more efficient.'
 };
 if(f==='quadratic'||/quadratic|factoring.*equation/.test(text))return {
  type:'quadratic',concept:'A product is zero when at least one factor is zero. A quadratic may have two, one or no real solutions; factoring is useful when factors can be found.',
  component:'factor solvable quadratic equations, apply the zero-product property and verify roots',prerequisite:'Expand binomials, identify factor pairs and solve linear equations.',misconception:'A factor equal to zero gives a possible root; dividing by x can lose the root x = 0.',
  objective:'Solve factorable quadratic equations and verify each root by substitution.',criterion:'Solve and verify at least 3 of 4 factorable equations, including one equation with a zero root. Editable app default.',evidence:'Written factorizations, both candidate roots and substitutions into the original equations.',
  model:'Use x² − 5x + 6 = 0. Factor as (x − 2)(x − 3) = 0. Derive x = 2 or x = 3, then substitute each into the original equation. Contrast a nonzero product with a zero product.',
  guided:'Pairs solve x² + x − 6 = 0 and check both roots. Ask them to diagnose the claim that only x = 2 is needed.',
  task:'Solve and verify both roots: (1) x² − 5x + 6 = 0; (2) x² + x − 6 = 0; (3) x² − 9 = 0; (4) x² − 4x = 0. Explain why dividing the fourth equation by x can lose a solution.',
  key:'1) x = 2, 3; 2) x = 2, −3; 3) x = 3, −3; 4) x = 0, 4. Substitution must yield zero in each original expression. Dividing by x assumes x ≠ 0 and discards the zero root.',method:'Worked solutions with verification',rubric:'For each equation: correct factoring (1), complete roots (1), accurate substitution for each root (1). Explanation of lost zero root (1). Success criterion is assessed independently of the point total.',
  support:'Provide a multiplication/factor-pair table and one partly worked example; require learners to finish and verify rather than copy.',extension:'Create a quadratic with specified roots and compare factoring with another valid method.'
 };
 if(f==='cvc'||/blend|consonant.vowel.consonant|cvc/.test(text))return {
  type:'cvc',concept:'Letters represent sounds; blending the sounds in order helps a reader identify a word.',component:'connect known letter sounds and blend them into short words',prerequisite:'Recognize the letter sounds used in the selected word set.',misconception:'Naming letters instead of producing sounds can interrupt blending; vowel sounds may need explicit practice.',
  objective:'Blend known letter sounds to read four simple consonant-vowel-consonant words aloud.',criterion:'Read at least 3 of 4 words by blending in an individual check; self-correction counts. Adjust this app-default criterion to language and readiness.',evidence:'Individual oral reading of a teacher-selected four-word set; note sounds attempted and self-corrections.',
  model:'For an English word set, point to m–a–t, produce each sound, then blend /m/ /a/ /t/ into mat. Ask learners to track left to right. Use an equivalent familiar word set when teaching in another language.',
  guided:'Pairs practice mat, sat, pin and cup, taking turns as reader and pointer. Check that the learner blends rather than simply repeats a partner. Teach only words whose sounds have been introduced.',
  task:'Individually read mat, sat, pin and cup by blending. Replace words before use if these English sounds are not yet taught or the target language differs. Record independent reading, prompted reading and self-correction for each word.',
  key:'English draft set: mat (/m/ /æ/ /t/), sat (/s/ /æ/ /t/), pin (/p/ /ɪ/ /n/), cup (/k/ /ʌ/ /p/). Accept locally intelligible pronunciation. This key does not apply to a translated word set; teacher must replace it.',method:'Individual oral-reading observation',rubric:'For each word: independent or self-corrected (achieved), blended with a prompt (developing), sounds not yet secure (needs sound practice). Do not treat accent differences as reading failure.',
  support:'Reduce to two known sounds and one familiar vowel; use large letters, finger tracking and an oral rehearsal. Avoid public comparison.',extension:'Read a new word with the same sound pattern and explain which sound changed.'
 };
 if(f==='mixtures'||/separat.*mixture/.test(text))return {
  type:'mixtures',concept:'Components of a mixture retain properties. A separation method should match a property difference such as particle size or solubility.',component:'select a feasible separation method and explain the property used',prerequisite:'Distinguish a mixture from a single material; recognize visible particle-size differences.',misconception:'Filtering cannot remove dissolved salt from water; a clear liquid is not necessarily a pure substance.',
  objective:'Choose and demonstrate a safe method to separate a visible dry mixture, then justify the property used.',criterion:'Separate most components safely, identify the relevant property and explain why the method suits the mixture. Editable app-default criterion.',evidence:'Demonstration or a labelled step-by-step model plus explanation; teacher confirms real performance when demonstration is required.',
  model:'Demonstrate hand sorting a small dry mixture of clean paper squares and strips. Explain the visible size/shape difference. Contrast with salt dissolved in water: ordinary filtering would not remove dissolved salt.',
  guided:'Pairs predict how to separate clean paper squares and strips; compare hand sorting with a drawn sieve design. Explain what a sieve would need to retain and what would pass through.',
  task:'Demonstrate separating a small clean dry mixture of paper squares and strips using safe hand sorting. If no physical materials are available, draw the ordered steps and explain the limitation of this evidence. Explain why an ordinary filter cannot separate dissolved salt from water.',
  key:'Hand sorting is appropriate for visibly distinguishable dry components. Size/shape allows selection; no heating or tasting is needed. Dissolved salt passes through ordinary filter paper with water; a different method such as evaporation could recover salt but is not performed in this activity.',method:'Safe demonstration with explanatory response',rubric:'Method-property match (0–2), safe and orderly procedure (0–2), separation effectiveness (0–2), explanation including filter limitation (0–2). If only a drawing is collected, direct procedural performance remains unobserved.',
  support:'Use two clearly different shapes; give picture-based steps and sentence starters linking property to method.',extension:'Propose a method for another mixture and state its limitations without performing unsafe procedures.'
 };
 if(f==='communication'||/persuas|audience|oral communicat/.test(text))return {
  type:'communication',concept:'An effective persuasive message connects a clear claim and reasons to the audience’s needs, using respectful and accurate language.',component:'plan, deliver and adapt a message to audience and purpose',prerequisite:'Identify a claim and supporting reason; listen respectfully to a speaker.',misconception:'A forceful delivery does not replace evidence; persuasion should not misrepresent facts or pressure an audience.',
  objective:'Deliver a 60–90 second persuasive message adapted to a stated audience and revise it using feedback.',criterion:'State a clear claim, use two relevant reasons, address the audience respectfully and make one justified revision. Editable app-default criterion.',evidence:'A short spoken message, peer/teacher observation and an explained revision.',
  model:'Model a short message inviting classmates to reduce disposable waste at school. Identify the audience, claim, two practical reasons and a respectful call to action. Distinguish a factual claim that needs verification from a personal opinion.',
  guided:'Pairs choose a school or community issue, plan a claim and two reasons, and rehearse for a specific audience. Partner feedback must describe one observable choice and one useful revision.',
  task:'Deliver a 60–90 second persuasive message for a named audience on a safe, familiar school/community issue. Include a clear claim and two relevant reasons. Use feedback to change one part; explain why the change better serves the audience. Do not invent statistics.',
  key:'No single correct message. Expected evidence: audience is identified; claim is clear; two reasons support the claim; delivery is respectful; revision responds to feedback. Any factual assertion needs a reliable source or qualified wording.',method:'Spoken performance and revision reflection',rubric:'Claim/purpose (0–2), relevance of reasons (0–2), audience adaptation (0–2), respectful intelligible delivery (0–2), justified revision (0–2). Accent or disability must not be equated with reasoning quality.',
  support:'Provide a claim–reason–example organizer, rehearsal with a partner and an alternative accessible communication format; agree on any adjusted performance evidence.',extension:'Adapt the same message for a second audience and justify the changes.'
 };
 return {type:'custom',concept:`Teacher-confirmed key concept for: ${input.competency}`,component:input.competency,prerequisite:input.priorKnowledge||'Identify and check the knowledge or skill needed before attempting this competency.',misconception:input.difficulty||'Elicit a likely error with an example/non-example; do not assume a misconception without learner evidence.',
 objective:`Demonstrate the action described in this competency: ${input.competency}`,criterion:'Meet the teacher-agreed observable criteria for accuracy, reasoning and independence. Specify a subject-appropriate threshold before using this lesson.',evidence:'A subject-appropriate performance or worked response to the competency, with an explanation of the process.',
 model:`Work through a teacher-prepared example of “${input.competency}”. Explain the decision at each step and compare a non-example. Confirm subject accuracy before class.`,guided:`Pairs attempt a second teacher-prepared example of “${input.competency}”, explain their choices and compare their work against the criteria.`,
 task:`Complete an independent task that directly demonstrates “${input.competency}”. Explain the key steps or choices. Teacher: supply the actual subject-specific task and expected response before use.`,key:'Teacher must supply and verify the subject-specific expected response. This guided scaffold cannot establish an answer key for an arbitrary competency.',method:'Teacher-specified authentic response or performance',rubric:'Draft criteria: accurate application of the competency, justified choices and independent completion. Replace with content-specific descriptors and thresholds before classroom use.',support:'Break the task into visible steps, provide one worked example and fade prompts as evidence improves.',extension:'Apply the competency to a new context and explain which decisions remain valid.'};
}
function distribution(duration){const weights=[.1,.24,.26,.26,.14];const times=weights.map(x=>Math.floor(duration*x));times[4]+=duration-times.reduce((a,b)=>a+b,0);return times;}
function outcomes(input,p){
 const phases=input.sessions===1?['Learn and demonstrate']:['Establish the foundation','Apply with guidance','Demonstrate independently','Transfer to a new situation','Consolidate and extend'].slice(0,input.sessions);
 return {sessions:phases.map((phase,i)=>({id:`s${i+1}`,title:`Session ${i+1} · ${phase}`,keyConcept:p.concept,objectives:[{id:`s${i+1}-o1`,text:i===0?p.objective:i===input.sessions-1?`${p.objective} Apply it independently in a new example.`:`${p.objective} Use evidence from the previous session to improve independence.`,criterion:p.criterion,evidence:p.evidence,prerequisite:i===0?p.prerequisite:`Review Session ${i} evidence; reteach the unresolved prerequisite before extending the task.`}]}))};
}
function parallelTask(profile,index){
 if(!index)return {prompt:profile.task,key:profile.key};
 if(profile.type==='fractions'){
  const gcd=(a,b)=>b?gcd(b,a%b):a;const items=Array.from({length:4},(_,j)=>{const d=2+(index+j)%5;return {a:1,b:d,c:1,e:d*2};});
  const sums=items.map(({a,b,c,e})=>{const n=a*e+c*b,d=b*e,g=gcd(n,d);return `${n/g}/${d/g}`;});
  return {prompt:`Solve these new sums: ${items.map((x,j)=>`(${j+1}) ${x.a}/${x.b} + ${x.c}/${x.e}`).join('; ')}. Draw an equal-whole model for one item and justify renaming with a common denominator.`,key:items.map((x,j)=>`${j+1}) ${sums[j]}`).join('; ')+'. Accept equivalent fractions; the model must preserve equal wholes.'};
 }
 if(profile.type==='quadratic'){
  const roots=[[index, index+3],[-index-1,index+4],[index+2,-index-2],[0,index+5]];
  const expr=([a,b])=>{const t=-(a+b),c=a*b;return `x²${t===0?'':`${t<0?' − ':' + '}${Math.abs(t)}x`}${c===0?'':`${c<0?' − ':' + '}${Math.abs(c)}`} = 0`;};
  return {prompt:`Solve and verify both roots: ${roots.map((r,j)=>`(${j+1}) ${expr(r)}`).join('; ')}. Explain why a zero root must not be discarded.`,key:roots.map((r,j)=>`${j+1}) x = ${r.join(', ')}`).join('; ')+'. Check by substitution in each original equation. Dividing by x would exclude x = 0.'};
 }
 if(profile.type==='cvc'){
  const sets=[['mat','sat','pin','cup'],['cat','nap','sit','red'],['map','pan','lip','dog'],['sun','top','net','bag'],['cap','hen','log','bat']];const words=sets[index%sets.length];
  return {prompt:`Individually blend and read ${words.join(', ')}. Use only words whose English sounds have been taught; replace the set for a different target language. Record independent, prompted and self-corrected responses.`,key:`English draft set: ${words.join(', ')}. Listen for each letter sound blended in order. Accept locally intelligible pronunciation and self-correction. Verify or replace the key for the taught language.`};
 }
 if(profile.type==='mixtures'){
  const variants=['two clearly different paper shapes','two clearly different paper sizes','two clearly different paper colors','a combination of paper shapes and sizes'];
  return {prompt:`Independently demonstrate a safe method to separate a clean dry paper mixture containing ${variants[(index-1)%variants.length]}. Explain the property used, compare a second possible method and state a limitation. Do not heat, taste or inhale materials.`,key:`For ${variants[(index-1)%variants.length]}, safe hand sorting is appropriate. The explanation must identify the actual ${['shape','size','color','shape and size'][(index-1)%variants.length]} distinction and justify why selection works. A sieve relies on size; a color difference alone would not justify sieving.`};
 }
 if(profile.type==='communication'){
  const audiences=['classmates','school staff','a community youth group','families'];
  return {prompt:`Adapt and deliver a 60–90 second message for ${audiences[index%audiences.length]}, using the same safe school/community issue as before. Include a clear claim and two relevant reasons, identify one audience-specific change, and revise from observable feedback. Do not invent statistics.`,key:`For ${audiences[index%audiences.length]}, look for a clear claim, relevant reasons, respectful audience adaptation and a justified revision. No single correct message. The learner must explain how this audience affects wording or emphasis; verify factual assertions.`};
 }
 return {prompt:profile.task+' Use a new teacher-prepared example matched to the previous evidence; verify the corresponding expected response.',key:profile.key};
}
function assessments(input,p,outcome){return {sessions:outcome.sessions.map((s,i)=>{const task=parallelTask(p,i);return {id:s.id,assessment:[{id:`${s.id}-a1`,title:input.sessions===1?'Independent evidence check':i===input.sessions-1?'Independent transfer check':'Readiness and progression check',method:p.method,prompt:task.prompt,answerKey:task.key,rubric:p.rubric,misconception:p.misconception,objectiveIds:s.objectives.map(o=>o.id)}]};})};}
function experiences(input,p,outcome,assessment){
 const times=distribution(input.duration);const context=textContext(input);const basic=input.lowResource||input.offline||!input.resources.includes('projector');
 return {sessions:outcome.sessions.map((s,i)=>{
 const ids=s.objectives.map(o=>o.id); const evidence=assessment.sessions.find(a=>a.id===s.id).assessment[0];
 const large=input.classSize>40; const reading=p.type==='cvc';
 let tasks=[
  ['Notice and check readiness',i===0?`Ask learners to show what they already know: ${p.prerequisite} Use one quick oral or board response; note who needs a prerequisite prompt.`:`Use the previous session’s actual evidence to choose a brief prerequisite reteach or a more demanding parallel example. Do not assume mastery.`, 'Attempt the quick check without looking at the model; explain or point to what is known.','Use the responses to choose how much modelling is needed.','Connect the observed starting point to today’s success criteria.'],
  ['Model the key decision',p.model+` Frame the example through ${context} only when the connection is accurate and useful.`,'Watch or listen to the model. Predict the next step, then explain why the decision works.','Ask one learner to explain a step and another to identify a possible error.','Keep the model visible for supported practice.'],
  ['Practice and compare',p.guided+` Use ${input.grouping.toLowerCase()}. ${large?'Use fixed seat partners and sample 6–8 responses; avoid complex station movement.':'Circulate and sample different readiness levels.'}`,'Attempt the task, compare reasoning with a partner and use the criterion to improve one response.','Collect one short response from each pair; identify the error pattern, not just completion.','Remove one prompt and move toward independent evidence.'],
  ['Show the learning',`Collect evidence for ${s.objectives[0].id}. ${reading&&input.classSize>25?`An individual check of ${input.classSize} learners may exceed the available ${times[3]} minutes. Check a feasible rotating subset; carry remaining individual checks forward. Partner reading is practice, not verified individual evidence.`:'Allow independent work first, then use the rubric to sample evidence.'} ${evidence.prompt}`,`Complete the assessment independently or using the agreed access adjustment. ${p.evidence}`,'Apply the success criterion; record observed evidence without learner names in this application.','Use evidence categories to select the next instructional action.'],
  ['Reflect and decide the next step','Ask learners to explain one decision and identify one remaining question. Sort the assessment evidence into needs-support, developing, ready and extension pathways.','Explain what helped, what remains uncertain and which next practice would be useful.','Compare the exit explanation with the assessment; check inconsistent evidence.','Choose a conditional Ways Forward response; do not record invented results.']
 ];
 if(input.readiness==='Beginning')tasks[2][1]=p.support+' '+tasks[2][1];
 if(input.readiness==='Advanced')tasks[2][1]+=' '+p.extension;
 const approach=input.approach;
 if(approach==='5Es'){
  tasks[0][0]='Engage · notice and predict';tasks[1][0]='Explore · attempt and notice';tasks[1][1]='Before the model, offer a short accessible example for learners to attempt and describe. '+tasks[1][1];tasks[2][0]='Explain · compare and justify';tasks[3][0]='Elaborate · apply independently';tasks[4][0]='Evaluate · interpret the evidence';
 }else if(approach==='4As'){
  tasks[0][0]='Activity · establish the starting point';tasks[1][0]='Analysis · compare decisions';tasks[2][0]='Abstraction · state the idea';tasks[2][2]+=' State the general idea in your own words.';tasks[3][0]='Application · show learning';
 }else if(['Guided inquiry','Problem-based learning','Experiential learning'].includes(approach)){
  tasks[0][0]='Pose a purposeful question';tasks[0][1]='Present a safe, age-appropriate question or problem grounded in the competency. '+tasks[0][1];tasks[1][0]='Investigate and test an idea';tasks[1][1]='Allow a brief attempt and compare two possible approaches before explicit feedback. '+tasks[1][1];tasks[2][0]='Discuss evidence and refine';
 }else if(approach==='Collaborative learning'){
  tasks[2][1]+=' Assign reader/explainer/checker roles, then switch. Require each learner to attempt the independent evidence task.';
 }
 return {id:s.id,experiences:tasks.map((t,n)=>({id:`${s.id}-l${n+1}`,title:t[0],minutes:times[n],teacher:t[1],learners:t[2],materials:basic?['Board or reusable paper','Pencil / accessible response medium']:['Board','Projector (optional visual display; board equivalent available)'],check:t[3],transition:t[4],objectiveIds:ids,supports:p.support+` Use ${input.language}; accept oral, written or pointed responses for practice where they preserve the objective.`}))};
 })};
}
function differentiation(input,p,outcome){return {sessions:outcome.sessions.map(s=>({id:s.id,differentiation:{support:p.support+(input.support?` Teacher context: ${input.support}`:''),language:`Use ${input.language}. Preteach the essential terms, invite a familiar-language explanation, then connect it to the subject language. Preserve the assessed construct; do not translate a reading word set mechanically.`,extension:p.extension+(input.advanced?` Teacher context: ${input.advanced}`:''),accessibility:'Use large, high-contrast text, read directions aloud, allow additional processing time and offer an accessible response format. Agree on adjustments with the learner/teacher without inventing diagnoses.'}}))};}
function ways(input,p,outcome){return {sessions:outcome.sessions.map((s,i)=>({id:s.id,ways:[
 {id:`${s.id}-w1`,pathway:'support',evidence:s.objectives[0].evidence,condition:'Significant difficulty: prerequisite is insecure or the learner cannot begin independently. Editable app-default evidence category.',response:`Reteach the prerequisite in a small group using an alternative representation. ${p.support} Check one parallel task before resuming the sequence.`,nextSession:i<input.sessions-1?'Start the next session with a prerequisite check; defer the extension until evidence improves.':'Plan a short targeted intervention and collect new evidence before advancing.',objectiveIds:s.objectives.map(o=>o.id)},
 {id:`${s.id}-w2`,pathway:'developing',evidence:s.objectives[0].evidence,condition:'Partial mastery: some correct work, but the explanation or independence is not yet secure.',response:`Give focused feedback on one observed error: ${p.misconception} Use guided practice and recheck with a similar task.`,nextSession:'Use a brief correction-and-explanation task before reducing support.',objectiveIds:s.objectives.map(o=>o.id)},
 {id:`${s.id}-w3`,pathway:'mastery',evidence:s.objectives[0].evidence,condition:'Mastery: the learner meets the teacher-approved success criterion and explains the process.',response:`Ask for application in a new example connected to ${textContext(input)}. Confirm transfer rather than repeating the same question.`,nextSession:i<input.sessions-1?'Proceed to the next session’s planned application, adjusting challenge to actual evidence.':'Connect to the next competency only after checking its prerequisites.',objectiveIds:s.objectives.map(o=>o.id)},
 {id:`${s.id}-w4`,pathway:'extension',evidence:s.objectives[0].evidence,condition:'Advanced mastery: accurate independent performance with a justified explanation and successful transfer.',response:p.extension,nextSession:'Offer extension without requiring the learner to replace the teacher in supporting others.',objectiveIds:s.objectives.map(o=>o.id)}
 ]}))};}
export function makeUnpacking(input,p){return {focus:input.competency,components:[p.component],prerequisites:[input.priorKnowledge||p.prerequisite],misconceptions:[input.difficulty||p.misconception],scopeNote:input.sessions===1?'Keep one focused outcome; extend across more sessions if prerequisite evidence is insecure.':'Sessions share the competency and adapt from actual evidence; do not assume each previous session achieved mastery.'};}
export function makeContext(input,p){
 const approach=input.approach==='Recommend an approach'?(p.type==='mixtures'?'Guided inquiry':p.type==='communication'?'Collaborative rehearsal and feedback':'Gradual release with explicit modelling'):input.approach;
 return {needs:[`${input.classSize} learners; ${input.readiness.toLowerCase()}.`,input.difficulty||'Use the diagnostic check to establish actual difficulties.',input.support||'Offer access and language supports without assigning diagnostic labels.'],resourcePlan:input.offline?'Offline: board, reusable paper and spoken explanations; no links required.':`Use only selected resources: ${input.resources.join(', ')}. Always offer a board-based alternative.`,approach,rationale:`${approach} is suggested because the learner must ${p.component}; observable evidence is ${p.evidence.toLowerCase()} Teacher can override the approach.`};
}
export function assemblePlan(input,source,parts,mode){
 const sessions=parts.outcomes.sessions.map(s=>({...s,...Object.fromEntries(['assessment','experiences','differentiation','ways'].map(k=>[k,parts[k].sessions.find(x=>x.id===s.id)?.[k]]))}));
 validateSessions(sessions,input.sessions);
 const policy=policySnapshot(input);
 const plan={policy,id:crypto.randomUUID(),title:`Grade ${input.grade} ${input.subject} · ${source.title==='Teacher-provided competency'?input.competency.slice(0,70):source.title}`,input,source,unpacking:parts.unpack,analysis:parts.context,sessions,review:parts.review,metadata:{mode,origin:mode==='ai'?'AI draft':'Guided-design draft',promptVersion:'ilaw-staged-v1',policyVersion:policy.policyVersion,curriculumVersion:source.curriculumVersion||'unverified',status:'draft',createdAt:new Date().toISOString(),modifiedAt:new Date().toISOString(),tokens:parts.tokens||null}};
 plan.quality=qualityCheck(plan);return plan;
}
export async function generateGuided(raw,{records,onStage=async()=>{}}={}){
 const input=normalizeInput(raw);await onStage('resolve');const source=resolveCompetency(input,records);const p=selectProfile(input,source);const parts={};
 const run=async(k,fn)=>{await onStage(k);parts[k]=validate(fn(),stages[k],k);};
 await run('unpack',()=>makeUnpacking(input,p));await run('context',()=>makeContext(input,p));await run('outcomes',()=>outcomes(input,p));await run('assessment',()=>assessments(input,p,parts.outcomes));await run('experiences',()=>experiences(input,p,parts.outcomes,parts.assessment));await run('differentiation',()=>differentiation(input,p,parts.outcomes));await run('ways',()=>ways(input,p,parts.outcomes));await run('review',()=>({strengths:['Evidence is designed before activities.','All sections carry explicit objective links.'],concerns:p.type==='custom'?['This custom competency needs a teacher-supplied task, answer key and content-specific success criteria.']:['Practice items and answer keys need teacher accuracy and curriculum review.'],teacherReview:'Confirm curriculum applicability, content accuracy, feasibility and the evidence needed for your learners. No official-policy approval is implied.'}));
 return assemblePlan(input,source,parts,'guided');
}
export function checkStageSessionIds(output,outcomes,name){
 if(!output.sessions)return;
 const expected=outcomes.sessions.map(s=>s.id).sort().join('|'); const actual=output.sessions.map(s=>s.id).sort().join('|');
 if(expected!==actual)throw new ValidationError(`${name} returned incorrect session IDs`);
}
export async function regenerateGuided(plan,{sessionId,section,nodeId,action='replace'}){
 const fresh=await generateGuided({...plan.input,mode:'guided'},{records:[plan.source]});
 const result=structuredClone(plan);const original=result.sessions.find(s=>s.id===sessionId);const replacement=fresh.sessions.find(s=>s.id===sessionId);
 if(!original||!replacement)throw new ValidationError('Session not found');
 if(!['intentions','experiences','assessment','differentiation','ways','session'].includes(section))throw new ValidationError('Unknown section');
 if(section==='session'){
  Object.assign(original,replacement);
  const previous=plan.sessions[plan.sessions.findIndex(s=>s.id===sessionId)-1];const evidence=previous&&plan.evidenceSummary?.[previous.id];
  if(evidence)original.experiences[0].teacher=`Use the teacher-reported evidence from ${previous.title}: ${evidence.support} need prerequisite support, ${evidence.developing} need focused practice, ${evidence.mastery} met the criterion, ${evidence.extension} are ready for extension; ${plan.input.classSize-evidence.support-evidence.developing-evidence.mastery-evidence.extension} were not yet observed. Do not assume mastery for unobserved learners. ${original.experiences[0].teacher}`;
  return result;
 }
 const field=section==='intentions'?'objectives':section;
 if(nodeId){
  if(!Array.isArray(original[field]))throw new ValidationError('This section does not contain individual nodes');
  const index=original[field].findIndex(x=>x.id===nodeId); if(index<0)throw new ValidationError('Component not found');
  const replacementNode=replacement[field].find(x=>x.id===nodeId)||replacement[field][0]; const node={...structuredClone(replacementNode),id:nodeId};
  if(section!=='intentions')node.objectiveIds=original[field][index].objectiveIds;
  if(section==='experiences'){
   node.minutes=original[field][index].minutes;
   if(action==='simplify'){node.teacher=`Use one short, accurate worked example. ${node.teacher}`;node.learners='Attempt one step at a time, then explain the decision to a partner.';node.supports+=' Offer a partly completed response and fade one prompt.';}
   if(action==='low-resource'){node.materials=['Board','Reusable paper or accessible response medium'];node.teacher=node.teacher.replace(/projector/gi,'board');}
   if(action==='interactive'){node.teacher+=' Ask pairs to compare two possible responses and defend the one that meets the criterion.';node.learners+=' Take turns explaining and challenging one decision respectfully.';}
   if(action==='contextualize')node.teacher+=` Connect the example accurately to ${textContext(plan.input)}; confirm the connection before class.`;
  }
  original[field][index]=node;
 }else if(section==='intentions'){original.objectives=replacement.objectives;original.keyConcept=replacement.keyConcept;}
 else original[field]=replacement[field];
 return result;
}

export function retimePlan(plan,duration){
 if(!Number.isInteger(duration)||duration<20||duration>180)throw new ValidationError('Choose 20–180 minutes per session');
 const copy=structuredClone(plan);copy.metadata.timeReallocated={from:plan.input.duration,to:duration,at:new Date().toISOString()};copy.input.duration=duration;
 for(const session of copy.sessions){
  const total=session.experiences.reduce((n,a)=>n+a.minutes,0);if(!total)throw new ValidationError('Activities need valid times before retiming');
  const times=session.experiences.map(a=>Math.max(1,Math.floor(a.minutes/total*duration)));
  let difference=duration-times.reduce((a,b)=>a+b,0);
  while(difference!==0){for(let i=0;i<times.length&&difference!==0;i++){if(difference>0){times[i]++;difference--;}else if(times[i]>1){times[i]--;difference++;}}}
  session.experiences.forEach((a,i)=>a.minutes=times[i]);
 }
 return copy;
}
