const contentTokens=s=>(s.toLowerCase().match(/[a-z]{4,}/g)||[]).filter(x=>!['with','this','that','from','their','they','will','using','show','after','before','learners','teacher','objective','evidence','assessment','within','through','correct','criteria','demonstrate','explain','session','independently'].includes(x));
export function qualityCheck(plan){
 const checks=[]; const add=(severity,code,message,target,detail='')=>checks.push({severity,code,message,target,detail});
 const input=plan.input;
 if(plan.metadata.timeReallocated)add('warning','retimed','Minutes were reallocated while preserving teacher text','s1:experiences','Review task demand, objectives and transition feasibility; a matching time sum alone is not sufficient.');
 if(plan.metadata.mode==='guided'&&(/blend|consonant.vowel.consonant/i.test(input.competency))&&!/english/i.test(input.language))add('warning','reading-language','Guided word set uses English sounds; adapt for the taught language','s1:assessment','Replace the words and expected responses with a verified target-language word set.');
 if(plan.sessions.some(s=>s.assessment.some(a=>/Teacher: supply|Teacher must supply|Teacher-specified/.test(a.prompt+' '+a.answerKey+' '+a.method))))add('warning','custom-task','Custom competency needs a subject-specific task, expected response and measurable criteria','s1:assessment','Guided mode provides a planning scaffold for arbitrary content. Complete these fields before classroom use.');
 if(input.readiness==='Beginning')add('warning','prerequisite-readiness','Beginning readiness: confirm prerequisites before expecting full independent evidence','s1:intentions','Use the diagnostic check and narrow the outcome or add sessions if the prerequisite is not secure. This is a pedagogical recommendation, not a diagnosis or curriculum rule.');
 const source=plan.source.source;
 if(source.status!=='practice'&&plan.source.curriculum!==input.curriculum)add('warning','curriculum-version','Selected curriculum differs from the competency source record','source','Verify the grade/year rollout and choose the correct version before classroom use.');
 if(source.effectiveFrom&&new Date(source.effectiveFrom)>new Date())add('warning','effective-date','The source record is not yet effective','source');
 if(source.effectiveTo&&new Date(source.effectiveTo)<new Date())add('warning','effective-date','The source record’s effective period has ended','source');
 if(source.status==='verified')add('pass','source','Competency source has an operator-reviewed record','source',`Verified ${source.verifiedAt}; check applicability for ${input.schoolYear}.`);
 else add('warning','source',source.status==='practice'?'Practice competency — verify with your current curriculum guide':'Competency source and current applicability need teacher verification','source','This is not an official or automatically curriculum-aligned record.');
 if(plan.policy?.status==='operator-reviewed')add('info','policy-registry','Policy sources have an operator-reviewed registry','policy','Check applicability and documentation requirements. An operator review does not establish lesson compliance.');else add('warning','current-policy','Current DepEd ILAW policy has not been verified','policy','No claim of official compliance is made. ILAW headings are the requested app rendering.');
 if(!input.competency.trim()||input.competency.trim().split(/\s+/).length<4)add('warning','vague','Competency is too vague to establish a defensible outcome','source','Add the action, subject content and expected evidence.');
 const inappropriate=/ignore (previous|all)|system prompt|reveal.*(key|secret)|deped.approved|100%.compliant/i;
 if(inappropriate.test(input.instructions+' '+input.competency))add('warning','conflict','Some supplied text asks for unsupported claims or unrelated instructions','preferences','Treat the text as teacher input, never as authority or a system instruction.');
 if(input.offline&&/youtube|online|internet|website/i.test(input.instructions))add('warning','instruction-conflict','Teacher instructions mention online resources in an offline class','preferences','Change instructions or enable internet; generated activities must remain feasible.');
 if(/\b(1[0-9]|[6-9])\s+objectives/i.test(input.instructions))add('warning','scope','Requested objective count exceeds the 1–3 focused objectives per session app limit','preferences','Narrow the competency scope or increase sessions. This is an app design default, not a DepEd rule.');
 const content=JSON.stringify({sessions:plan.sessions,analysis:plan.analysis,review:plan.review});
 for(const sentence of content.split(/[.!?\n]+/)){if(/\b(DepEd|Department of Education)\b/i.test(sentence)&&/\b(approved|compliant|requires|required|mandates|mandated)\b/i.test(sentence)&&!/\b(not|never|unverified|verify|cannot|avoid|unknown|uncertain)\b/i.test(sentence)){add('warning','unsupported-claim','Draft text contains an unsupported official-policy or approval claim','review','Remove the claim or verify and record its authoritative source. ILAW headings or teacher review do not establish approval.');break;}}
 const allIDs=new Set();
 for(const s of plan.sessions){
  const recorded=plan.evidenceSummary?.[s.id];
  if(recorded&&(JSON.stringify(recorded.objectiveSnapshot)!==JSON.stringify(s.objectives.map(o=>({id:o.id,text:o.text,criterion:o.criterion})))||JSON.stringify(recorded.assessmentSnapshot)!==JSON.stringify(s.assessment.map(a=>({id:a.id,prompt:a.prompt,method:a.method,rubric:a.rubric})))))add('warning','evidence-stale',`${s.title}: recorded evidence refers to an earlier outcome or assessment`,`${s.id}:assessment`,'Review the evidence against the revised criteria or collect new observations; do not assume an earlier category still applies.');
  const target=`${s.id}:experiences`;const minutes=s.experiences.reduce((n,a)=>n+a.minutes,0);
  if(minutes===input.duration)add('pass','timing',`${s.title}: activities fit ${minutes} minutes`,target);
  else add('warning','timing',`${s.title}: activities total ${minutes} minutes; class time is ${input.duration}`,target,'Include transitions and assessment time; shorten or reallocate activities.');
  const localIds=new Set(s.objectives.map(o=>o.id));
  for(const n of [s,...s.objectives,...s.experiences,...s.assessment,...s.ways]){if(allIDs.has(n.id))add('error','duplicate',`Duplicate graph ID ${n.id}`,`${s.id}:intentions`);allIDs.add(n.id);}
  for(const [section,list]of [['experiences',s.experiences],['assessment',s.assessment],['ways',s.ways]])for(const node of list){
   if(!node.objectiveIds.length)add('error','disconnected',`${node.title||'Follow-up'} has no objective link`,`${s.id}:${section}`);
   for(const id of node.objectiveIds)if(!localIds.has(id))add('error','bad-link',`An ${section} component links to an unknown objective`,`${s.id}:${section}`);
  }
  for(const o of s.objectives){
   const acts=s.experiences.filter(a=>a.objectiveIds.includes(o.id)); const assessments=s.assessment.filter(a=>a.objectiveIds.includes(o.id)); const ways=s.ways.filter(a=>a.objectiveIds.includes(o.id));
   if(acts.length&&assessments.length&&ways.length&&o.criterion.trim()&&o.evidence.trim())add('pass','alignment',`Objective ${s.objectives.indexOf(o)+1} connects to activities, assessment and next steps`,`${s.id}:intentions`,'Structural links checked. Teacher must still judge whether the evidence measures the actual learning.');
   else add('error','alignment',`Objective ${s.objectives.indexOf(o)+1} has incomplete evidence links`,`${s.id}:intentions`,'Check success criterion, observable evidence, activity, assessment and Ways Forward.');
   const words=contentTokens(o.text+' '+o.evidence); const evidence=contentTokens(assessments.map(a=>a.prompt+' '+a.rubric).join(' '));
   if(words.length&&!words.some(w=>evidence.includes(w)))add('warning','semantic',`Objective ${s.objectives.indexOf(o)+1}: review whether assessment content measures the revised objective`,`${s.id}:assessment`,'A lexical mismatch was detected. This heuristic can miss semantic errors; it never certifies alignment.');
   if(/demonstrat|perform|deliver|construct|create|investigat/i.test(o.text)&&assessments.every(a=>/multiple.choice|quiz/i.test(a.method)&&!/demonstr|perform|product/i.test(a.method)))add('warning','performance','Performance outcome needs observable performance evidence',`${s.id}:assessment`);
  }
  const evidenceMinutes=s.experiences.filter(a=>/show|elaborate|application/i.test(a.title)).reduce((n,a)=>n+a.minutes,0);
  if(/oral.reading/i.test(s.assessment.map(a=>a.method).join(' '))&&input.classSize*20>evidenceMinutes*60)add('warning','individual-check',`${s.title}: individual reading checks need a rotating schedule`,`${s.id}:assessment`,'App estimate: about 20 seconds per learner. Confirm feasibility and carry unobserved individual evidence forward; peer practice is not teacher-verified mastery.');
  if(/spoken performance/i.test(s.assessment.map(a=>a.method).join(' '))&&input.classSize>evidenceMinutes)add('warning','individual-check',`${s.title}: whole-class sequential speeches exceed the evidence window`,`${s.id}:assessment`,'Use simultaneous pairs with explicit peer criteria and a rotating teacher sample, or spread teacher-observed individual performances across sessions.');
  if(input.assessmentPreference==='Quiz with explanation'&&s.objectives.some(o=>/demonstrat|deliver|perform/i.test(o.text)))add('warning','preference','A quiz alone cannot establish the requested performance evidence',`${s.id}:assessment`,'The draft retains a performance task to preserve the objective; teacher preference needs adaptation.');
  if(['Station learning','Discussion'].includes(input.approach)&&plan.metadata.mode==='guided')add('warning','approach','The chosen approach needs teacher adaptation in guided mode',`${s.id}:experiences`,'Guided subject profiles support a focused sequence. Reorganize activities for your selected approach, or use live AI when configured.');
  for(const a of s.experiences){
   for(const material of a.materials){const m=material.toLowerCase();const dependency=[['internet',/internet|youtube|online|website|web video/],['projector',/projector|screen|\btv\b/],['computers',/computer|laptop/],['phones',/phone|mobile device/],['printer',/printout|printed/],['laboratory',/laboratory/],['manipulatives',/manipulative/]].find(([_,rx])=>rx.test(m));
    if(dependency&&(!input.resources.includes(dependency[0])||(dependency[0]==='internet'&&input.offline)))add('warning','resource',`${a.title} requires ${dependency[0]}, which is unavailable`,target,`Material: ${material}. Replace the resource or update classroom settings.`);
   }
   if(input.offline&&/visit (a |the )?(website|link)|watch.*youtube|search online/i.test(a.teacher+' '+a.learners))add('warning','offline',`${a.title} includes an online action in an offline classroom`,target);
   if(!a.supports.trim())add('warning','support',`${a.title} needs a concrete access or readiness scaffold`,target);
  }
  if(s.ways.some(w=>!w.condition.trim()||!w.evidence.trim()||!w.response.trim()))add('warning','follow-up','Ways Forward must connect evidence, a condition and an instructional response',`${s.id}:ways`);
  if(Object.values(s.differentiation).some(v=>!v.trim()))add('warning','differentiation','Complete support, language, extension and accessibility decisions',`${s.id}:differentiation`);
  if(input.classSize>45&&/station/i.test(plan.analysis.approach))add('warning','workload','Station rotation needs a practical supervision plan for a large class',target);
 }
 if(plan.metadata.mode==='guided')add('info','guided','Guided-design draft: deterministic instructional suggestions, not AI generation','review','Exact curriculum alignment and subject accuracy require teacher review.');
 else add('info','ai','AI-generated draft: review accuracy and classroom suitability','review');
 return {checks,counts:Object.fromEntries(['pass','warning','error','info'].map(k=>[k,checks.filter(c=>c.severity===k).length])),checkedAt:new Date().toISOString(),graph:plan.sessions.flatMap(s=>s.objectives.map(o=>({session:s.id,objective:o.id,criterion:o.criterion,activities:s.experiences.filter(a=>a.objectiveIds.includes(o.id)).map(a=>a.id),assessment:s.assessment.filter(a=>a.objectiveIds.includes(o.id)).map(a=>a.id),ways:s.ways.filter(a=>a.objectiveIds.includes(o.id)).map(a=>a.id)})))};
}
