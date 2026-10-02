import {AIProvider,generateAI} from '../src/ai.js';
import {examples} from '../src/curriculum.js';
import {exportDOCX,exportHTML} from '../src/exports.js';
// Opt-in real-provider smoke check. Never print keys, prompts or lesson contents.
const provider=new AIProvider();
if(!provider.available){console.error('AI check blocked: set AI_API_KEY, AI_BASE_URL, AI_DESIGN_MODEL and AI_FAST_MODEL in .env or the server environment.');process.exitCode=1;}
else{
 try{
  const record=examples[1];
  const plan=await generateAI({grade:record.grade,subject:record.subject,competencyId:record.id,competency:record.competency,mode:'ai',aiWorkflow:'staged',duration:45,sessions:1,offline:true,resources:['board'],lessonReferences:'Teacher-provided practice example; no external document supplied.'},{provider,onStage:async stage=>console.log(`AI check: ${stage}`)});
  if(plan.quality.counts.error)throw Error('Generated plan has disconnected alignment links.');
  const docx=exportDOCX(plan);const html=exportHTML(plan);
  if(docx.readUInt32LE(0)!==0x04034b50||!html.startsWith('<!doctype html>'))throw Error('Export validation failed.');
  console.log(`AI check passed: ${plan.metadata.tokens.calls} real provider calls; valid structured lesson, DOCX and printable HTML. No plan was stored. Review actual classroom content before use.`);
 }catch(error){console.error(error.status?error.message:'AI check failed; review provider configuration and lesson validation.');process.exitCode=1;}
}
