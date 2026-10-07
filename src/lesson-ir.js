import {createHash} from 'node:crypto';
import {mathSegments} from '../public/math.js';
export const lessonHash=plan=>createHash('sha256').update(JSON.stringify({title:plan.title,input:plan.input,source:plan.source,sessions:plan.sessions,assets:plan.assets||[]})).digest('hex');
// An adapter over accepted strings, never a second writable lesson authority.
export function lessonIR(plan){
 const blocks=[];const equations=[];const add=(id,role,text)=>{blocks.push({id,kind:'text',role,text,protected:['source','criterion','answer-key'].includes(role)});for(const [i,segment]of mathSegments(text).entries())if(segment.type==='math')equations.push({id:`${id}:eq${i}`,blockId:id,originalLaTeX:segment.source,displayMode:segment.display?'block':'inline',validationStatus:'teacher-review-required',renderStatus:segment.tree?'supported':'unsupported',assumptions:[],units:null});};
 add('lesson:title','title',plan.title);add('source:competency','source',plan.source.competency);
 for(const s of plan.sessions){add(`${s.id}:title`,'session-title',s.title);add(`${s.id}:keyConcept`,'concept',s.keyConcept);for(const o of s.objectives){add(`${o.id}:text`,'objective',o.text);add(`${o.id}:criterion`,'criterion',o.criterion);add(`${o.id}:evidence`,'evidence',o.evidence);}for(const a of s.experiences){add(`${a.id}:teacher`,'teacher-instruction',a.teacher);add(`${a.id}:learners`,'learner-task',a.learners);}for(const a of s.assessment){add(`${a.id}:prompt`,'assessment-prompt',a.prompt);add(`${a.id}:answerKey`,'answer-key',a.answerKey);add(`${a.id}:rubric`,'rubric',a.rubric);}}
 return {schemaVersion:1,planId:plan.id,revision:plan.revision,contentHash:lessonHash(plan),blocks,equations,assets:plan.assets||[],legacy:structuredClone(plan)};
}
export function fromLessonIR(ir){if(ir?.schemaVersion!==1||!ir.legacy||lessonHash(ir.legacy)!==ir.contentHash)throw Error('LessonIR source mismatch');return structuredClone(ir.legacy);}
