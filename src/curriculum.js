import fs from 'node:fs';
import {ValidationError} from './schema.js';
import {loadBOW,matchesBOW} from './bow.js';
const practice=(id,grade,subject,title,competency,focus)=>({id,grade,subject,title,competency,focus,curriculum:'Practice example — curriculum not verified',curriculumVersion:null,schoolYear:null,term:null,week:null,code:null,contentStandard:null,performanceStandard:null,source:{status:'practice',title:'ILAW instructional-design practice example',url:null,date:null,section:null,excerpt:null,verifiedAt:null,policyVersion:null,effectiveFrom:null,effectiveTo:null}});
export const examples=[
 practice('reading-1',1,'Reading and Literacy','Reading short words','Blend letter sounds to read simple consonant-vowel-consonant words.','cvc'),
 practice('math-5',5,'Mathematics','Adding unlike fractions','Add fractions with unlike denominators using visual models and equivalent fractions.','fractions'),
 practice('science-7',7,'Science','Separating mixtures','Choose and demonstrate an appropriate method for separating components of a mixture.','mixtures'),
 practice('math-10',10,'Mathematics','Solving quadratic equations','Solve quadratic equations by factoring and verify the solutions.','quadratic'),
 practice('shs-11',11,'Oral Communication','Communication for an audience','Deliver a short persuasive message adapted to a specific audience and purpose.','communication')
];
export function loadCurriculum(){
 const file=process.env.ILAW_CURRICULUM_FILE;
 if(!file){const all=[...examples,...loadBOW(validateRecord)];if(new Set(all.map(r=>r.id)).size!==all.length)throw Error('Duplicate curriculum record id');return all;}
 const records=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Array.isArray(records))throw Error('Curriculum file must contain an array');
 for(const r of records)validateRecord(r,true);
 const all=[...examples,...records,...loadBOW(validateRecord)];
 if(new Set(all.map(r=>r.id)).size!==all.length)throw Error('Duplicate curriculum record id');
 return all;
}
export function officialURL(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='deped.gov.ph'||u.hostname.endsWith('.deped.gov.ph')||(u.hostname==='sites.google.com'&&u.pathname.startsWith('/deped.gov.ph/lsguide/')))&&!u.username&&!u.password;}catch{return false;}}
export function validateRecord(r,operator=false){
 if(!r||typeof r!=='object')throw new ValidationError('Curriculum record must be an object');
 for(const field of ['id','subject','competency','curriculum'])if(typeof r[field]!=='string'||!r[field].trim()||r[field].length>4000)throw new ValidationError(`Curriculum ${field} is required`);
 if(!Number.isInteger(r.grade)||r.grade<0||r.grade>12)throw new ValidationError('Invalid curriculum grade');
 if(!r.source||!officialURL(r.source.url)||typeof r.source.title!=='string'||!r.source.title.trim()||typeof r.source.section!=='string'||!r.source.section.trim()||typeof r.source.excerpt!=='string'||!r.source.excerpt.trim())throw new ValidationError('An official DepEd HTTPS URL, source title, exact section/page and excerpt are required');
 if(!r.source.excerpt.includes(r.competency))throw new ValidationError('The competency must occur verbatim in the supplied source excerpt');
 if(r.source.status==='verified'&&(!operator||!r.source.verifiedAt||!r.source.policyVersion))throw new ValidationError('Verified records need operator review, verification date and policy version');
 if(!['teacher-confirmed','verified'].includes(r.source.status))throw new ValidationError('Invalid source verification status');
 if(r.code!=null&&(typeof r.code!=='string'||!r.source.excerpt.includes(r.code)))throw new ValidationError('An official code must occur in the source excerpt');
 for(const field of ['contentStandard','performanceStandard'])if(r[field]&&(typeof r[field]!=='string'||!r.source.excerpt.includes(r[field])))throw new ValidationError(`${field} must occur verbatim in the source excerpt`);
 for(const k of ['effectiveFrom','effectiveTo'])if(r.source[k]&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.source[k])||Number.isNaN(Date.parse(r.source[k]))||new Date(r.source[k]).toISOString().slice(0,10)!==r.source[k]))throw new ValidationError('Invalid source effective date');
 if(r.source.effectiveFrom&&r.source.effectiveTo&&r.source.effectiveFrom>r.source.effectiveTo)throw new ValidationError('Source effective dates are reversed');
 return r;
}
export function resolveCompetency(input,records=loadCurriculum()){
 const record=records.find(r=>r.id===input.competencyId);
 if(record){
  if(record.kind==='budget-of-work'&&!matchesBOW(record,input))throw new ValidationError('The selected Budget of Work does not match the school year, curriculum, term or source week. Select an applicable row.');
  if(record.grade!==input.grade||record.subject!==input.subject)throw new ValidationError('The selected competency does not match the grade and subject. Select again or enter a custom competency.');
  if(record.competency!==input.competency)throw new ValidationError('The competency text was changed. Choose custom input to preserve honest provenance.');
  const date=input.lessonDate||new Date().toISOString().slice(0,10);if((record.source.effectiveFrom&&record.source.effectiveFrom>date)||(record.source.effectiveTo&&record.source.effectiveTo<date))throw new ValidationError('Selected source is outside its effective dates for this lesson');
  if(record.source.status==='verified'&&record.curriculum!==input.curriculum)throw new ValidationError('The selected curriculum differs from the verified record');
  return structuredClone(record);
 }
 if(input.competencyId)throw new ValidationError('The selected curriculum record is unavailable');
 return {id:'manual',grade:input.grade,subject:input.subject,title:'Teacher-provided competency',competency:input.competency,focus:null,curriculum:input.curriculum,curriculumVersion:null,schoolYear:input.schoolYear,term:input.term,week:input.week,code:null,contentStandard:input.contentStandard||null,performanceStandard:input.performanceStandard||null,source:{status:'teacher-provided',title:'Teacher-provided text — verify against your current curriculum guide',url:null,date:null,section:null,excerpt:null,verifiedAt:null,policyVersion:null,effectiveFrom:null,effectiveTo:null}};
}
export const policySources=[
 {id:'ilaw-current',title:'DepEd LS ILAW implementation guidance',category:'Official implementation guidance; applicability review required',url:'https://sites.google.com/deped.gov.ph/lsguide/lesson-planning',date:null,section:'ILAW guides / Lesson Plan Guide',interpretation:'Official guidance describes simplified ILAW as a guide, not a checklist, and contextual adaptation of exemplars.',behavior:'Flexible detail; no automatic compliance claim.'},
 {id:'national-current',title:'Current national orders and enclosures',category:'Official order register; signed enclosures require review',url:'https://www.deped.gov.ph/2026/06/?cat=8',date:'2026-06',section:'June order register',interpretation:'Review lesson-planning, assessment, continuity and SHS issuances with their exact effective scope.',behavior:'Dates, school year and division are checked against operator-reviewed registry records.'},
 {id:'bow-current',title:'Three-term Budget of Work directory',category:'Official source directory; full competency coverage not imported',url:'https://sites.google.com/deped.gov.ph/lsguide/budgets-of-work',date:null,section:'Grade-level learning-area guides',interpretation:'Source links do not establish a complete competency dataset.',behavior:'Exact excerpts, source status and grade/subject/year/term/week matching.'},
 {id:'ai-policy',title:'Cebu Province dissemination of lesson-planning guidance',category:'Official document located; full-text verification pending',url:'https://www.cebuprovince.deped.gov.ph/Memoranda/memo2026/DM_s2026_375.pdf',date:null,section:'DO 016 attachment; exact paragraph review pending',interpretation:'Research found an indexed restriction on fully AI-generated plans. Review the signed applicable guidance before use.',behavior:'AI drafts disclose drafting assistance and require teacher verification; no DepEd approval claim.'},
 {id:'observation',title:'Multi-year PMES for teachers',category:'Official baseline; current-year instructions and annexes require review',url:'https://www.deped.gov.ph/wp-content/uploads/DM_s2025_089r.pdf',date:'2025-10-01',section:'Observation / feedback provisions',interpretation:'Do not carry school-year-specific exceptions or draft alternatives into current requirements.',behavior:'Developmental coaching and preparation only; formal scoring remains unavailable.'}
];
