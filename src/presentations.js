import PptxGenJS from 'pptxgenjs';
import {plainMath,mathSegments} from '../public/math.js';
const error=message=>Object.assign(Error(message),{status:422});
// Split display capacity within an existing instructional role; never invent content.
function chunks(text,max=420){const words=plainMath(String(text||'')).trim().split(/\s+/);const pages=[];let page='';for(const word of words){if(word.length>30)throw error('A presentation field has a long unbroken token. Shorten it or add spaces before exporting.');if(page&&page.length+word.length+1>max){pages.push(page);page='';}page+=(page?' ':'')+word;}if(page)pages.push(page);return pages.length?pages:[''];}
export function presentationStoryboard(plan){
 if(plan.metadata.status!=='reviewed')throw error('Review and approve the saved lesson before preparing its classroom presentation.');
 if(plan.quality?.counts?.error)throw error('Resolve lesson validation errors before presentation export.');
 const slides=[];const warnings=[];
 const add=(role,title,text,notes,sessionId=null,minutes=null)=>{
  if(mathSegments(text).some(s=>s.error))warnings.push(`${title}: unsupported math markup remains in its original form.`);
  const pages=chunks(text);pages.forEach((body,i)=>slides.push({role,title:plainMath(title)+(pages.length>1?` (${i+1}/${pages.length})`:''),body,notes:String(notes||''),sessionId,minutes}));
 };
 add('title',plan.title,`${Number(plan.input.grade)===0?'Kindergarten':`Grade ${plan.input.grade}`} ${plan.input.subject}${plan.input.section?`\n${plan.input.section}`:''}`,`Teacher-reviewed revision ${plan.revision}.\n${plan.metadata.aiDeclaration||''}\nCompetency: ${plan.source.competency}\nSource status: ${plan.source.source.status}. ${plan.source.source.title}\n${plan.source.source.url||''}\n${plan.policy?.notice||'Verify policy applicability.'}\nThese slides use the accepted lesson. Confirm notation and pacing before class.`);
 for(const session of plan.sessions){
  for(const objective of session.objectives)add('goal',session.title,objective.text,`Our learning intention: ${objective.text}\nSuccess criterion: ${objective.criterion}\nEvidence to collect: ${objective.evidence}\nPrerequisite: ${objective.prerequisite}`,session.id);
  for(const activity of session.experiences)add('activity',activity.title,activity.learners,`Teacher instruction / spiel:\n${activity.teacher}\n\nFormative check:\n${activity.check}\n\nMaterials: ${activity.materials.join(', ')}\nSupport: ${activity.supports}\nTransition: ${activity.transition}\nAllocated activity time: ${activity.minutes} minutes. Continuation slides share this time; do not add it again.`,session.id,activity.minutes);
  for(const assessment of session.assessment)add('assessment',assessment.title,assessment.prompt,`Present the task, then collect evidence using ${assessment.method}.\n\nTeacher key / expected response (keep separate from learner slides):\n${assessment.answerKey}\n\nScoring / rubric:\n${assessment.rubric}\n\nWatch for: ${assessment.misconception}\nCheck against the reviewed success criterion.`,session.id);
  add('reflection','Learning check',session.objectives.map(o=>o.criterion).join('\n'),`Ask learners to compare their work with the reviewed criterion. Do not infer mastery without evidence.\n\nAccess / language support:\n${session.differentiation.language}\n${session.differentiation.accessibility}\n\nConditional follow-up:\n${session.ways.map(w=>`If ${w.condition}: ${w.response} Next: ${w.nextSession}`).join('\n')}`,session.id);
 }
 if(slides.length>120)throw error('This lesson would exceed 120 slides. Shorten the classroom text or export fewer sessions.');
 return {schemaVersion:1,planId:plan.id,revision:plan.revision,title:plan.title,design:{aspectRatio:'16:9',font:'Aptos',titleSize:32,bodySize:28},warnings:[...new Set(warnings)],slides};
}
export async function exportPPTX(plan){
 const storyboard=presentationStoryboard(plan);const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author=plan.input.teacherName||'ILAW teacher';pptx.subject=`${plan.input.subject}, accepted lesson revision ${plan.revision}`;pptx.title=plan.title;pptx.company=plan.input.schoolName||'ILAW';pptx.lang='en-PH';pptx.theme={headFontFace:'Aptos',bodyFontFace:'Aptos',lang:'en-PH'};
 for(const [index,item] of storyboard.slides.entries()){
  const slide=pptx.addSlide();const titleSlide=item.role==='title';slide.background={color:titleSlide?'162D46':'FFFFFF'};const ink=titleSlide?'FFFFFF':'183148';
  const titlePages=chunks(item.title,55);if(titlePages.length>2||item.title.length>110)throw error('A slide title is too long. Shorten the lesson or activity title before exporting.');
  slide.addText(item.title,{x:.75,y:.7,w:11.8,h:1.25,fontFace:'Aptos',fontSize:32,bold:true,color:ink,margin:0,breakLine:false,vertAnchor:'mid'});
  slide.addText(item.body,{x:.75,y:2.2,w:11.8,h:4.4,fontFace:'Aptos',fontSize:28,color:ink,margin:0,breakLine:false,vertAnchor:'top',paraSpaceAfterPt:14});
  if(item.minutes)slide.addText(`${item.minutes} min activity`,{x:.75,y:6.9,w:5,h:.25,fontFace:'Aptos',fontSize:12,color:titleSlide?'C3D3E2':'53677A',margin:0});
  slide.addText(String(index+1),{x:12,y:6.9,w:.55,h:.25,fontFace:'Aptos',fontSize:12,color:titleSlide?'C3D3E2':'53677A',align:'right',margin:0});
  slide.addNotes(`${item.notes}\n\nSource lesson ID: ${plan.id}. Revision: ${plan.revision}.\n${storyboard.warnings.join('\n')}`);
 }
 return Buffer.from(await pptx.write({outputType:'nodebuffer',compression:true}));
}
