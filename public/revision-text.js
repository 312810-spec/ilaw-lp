export function revisionText(section,value){
 if(typeof value==='string')return value;if(!value)return '';
 if(section==='differentiation')return Object.entries(value).map(([k,v])=>`${k}: ${v}`).join('\n\n');
 const fields={objectives:[['text','Objective'],['criterion','Success criterion'],['evidence','Evidence'],['prerequisite','Prerequisite']],experiences:[['title','Activity'],['minutes','Minutes'],['teacher','Teacher'],['learners','Learners'],['materials','Materials'],['check','Check'],['supports','Support'],['transition','Transition']],assessment:[['title','Task'],['prompt','Learner question'],['answerKey','Teacher key'],['method','Method'],['rubric','Scoring'],['misconception','Watch for']],ways:[['condition','If'],['evidence','Evidence'],['response','Then'],['nextSession','Next session']]};
 return value.map(node=>(fields[section]||[]).map(([key,label])=>`${label}: ${Array.isArray(node[key])?node[key].join(', '):node[key]??''}`).join('\n')).join('\n\n');
}
