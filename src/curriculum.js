import fs from 'node:fs';
import {ValidationError} from './schema.js';
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
 if(!file)return [...examples];
 const records=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Array.isArray(records))throw Error('Curriculum file must contain an array');
 for(const r of records)validateRecord(r,true);
 return [...examples,...records];
}
export function officialURL(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='deped.gov.ph'||u.hostname.endsWith('.deped.gov.ph'))&&!u.username&&!u.password;}catch{return false;}}
export function validateRecord(r,operator=false){
 if(!r||typeof r!=='object')throw new ValidationError('Curriculum record must be an object');
 for(const field of ['id','subject','competency','curriculum'])if(typeof r[field]!=='string'||!r[field].trim()||r[field].length>4000)throw new ValidationError(`Curriculum ${field} is required`);
 if(!Number.isInteger(r.grade)||r.grade<1||r.grade>12)throw new ValidationError('Invalid curriculum grade');
 if(!r.source||!officialURL(r.source.url)||typeof r.source.title!=='string'||!r.source.title.trim()||typeof r.source.section!=='string'||!r.source.section.trim()||typeof r.source.excerpt!=='string'||!r.source.excerpt.trim())throw new ValidationError('An official DepEd HTTPS URL, source title, exact section/page and excerpt are required');
 if(!r.source.excerpt.includes(r.competency))throw new ValidationError('The competency must occur verbatim in the supplied source excerpt');
 if(r.source.status==='verified'&&(!operator||!r.source.verifiedAt||!r.source.policyVersion))throw new ValidationError('Verified records need operator review, verification date and policy version');
 if(!['teacher-confirmed','verified'].includes(r.source.status))throw new ValidationError('Invalid source verification status');
 if(r.code!=null&&(typeof r.code!=='string'||!r.source.excerpt.includes(r.code)))throw new ValidationError('An official code must occur in the source excerpt');
 return r;
}
export function resolveCompetency(input,records=loadCurriculum()){
 const record=records.find(r=>r.id===input.competencyId);
 if(record){
  if(record.grade!==input.grade||record.subject!==input.subject)throw new ValidationError('The selected competency does not match the grade and subject. Select again or enter a custom competency.');
  if(record.competency!==input.competency)throw new ValidationError('The competency text was changed. Choose custom input to preserve honest provenance.');
  if(record.source.status==='verified'&&record.curriculum!==input.curriculum)throw new ValidationError('The selected curriculum differs from the verified record');
  return structuredClone(record);
 }
 if(input.competencyId)throw new ValidationError('The selected curriculum record is unavailable');
 return {id:'manual',grade:input.grade,subject:input.subject,title:'Teacher-provided competency',competency:input.competency,focus:null,curriculum:input.curriculum,curriculumVersion:null,schoolYear:input.schoolYear,term:input.term,week:input.week,code:null,contentStandard:input.contentStandard||null,performanceStandard:input.performanceStandard||null,source:{status:'teacher-provided',title:'Teacher-provided text — verify against your current curriculum guide',url:null,date:null,section:null,excerpt:null,verifiedAt:null,policyVersion:null,effectiveFrom:null,effectiveTo:null}};
}
export const policySources=[
 {id:'ilaw',title:'Current ILAW lesson documentation',category:'Unverified current policy',url:'https://www.deped.gov.ph/category/issuances/deped-orders/',date:null,section:'Latest applicable issuance not retrieved',interpretation:'ILAW is the requested document structure. A current national mandate has not been verified.',behavior:'No compliance or DepEd-approval claim; teacher review required.'},
 {id:'lesson-prep',title:'DO 42, s. 2016 — Daily Lesson Preparation',category:'Historical reference; current applicability unverified',url:'https://www.deped.gov.ph/2016/06/17/do-42-s-2016-policy-guidelines-on-daily-lesson-preparation-for-the-k-to-12-basic-education-program/',date:'2016-06-17',section:'Policy Guidelines — exact current section review pending',interpretation:'Do not presume older DLL/DLP guidance is the current controlling policy.',behavior:'No forced DLL/DLP requirement.'},
 {id:'assessment',title:'DO 8, s. 2015 — Classroom Assessment',category:'Historical reference; current applicability unverified',url:'https://www.deped.gov.ph/2015/04/01/do-8-s-2015-policy-guidelines-on-classroom-assessment-for-the-k-to-12-basic-education-program/',date:'2015-04-01',section:'Policy Guidelines — applicability review pending',interpretation:'No current grading or mastery-threshold claim.',behavior:'Assessment criteria are editable pedagogical recommendations.'},
 {id:'curriculum',title:'DepEd curriculum resources',category:'Primary-source entry point; guides not verified',url:'https://www.deped.gov.ph/matatag-curriculum/',date:null,section:'Grade and learning-area guides',interpretation:'Curriculum rollout and year/grade applicability need review.',behavior:'Practice records labelled; manual codes never inferred.'}
];
