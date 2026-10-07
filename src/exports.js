import {exportImages,imageCaption} from './export-images.js';
import {wordMathRuns,mathHTML} from '../public/math.js';
const gradeName=grade=>Number(grade)===0?'Kindergarten':`Grade ${grade}`;
const xml=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function expandedDocumentBlocks(plan){
 const blocks=[];const add=(text,style='Normal')=>blocks.push({text,style});
 add('ILAW · Lesson design','Title');add(plan.title,'Heading1');
 add(`${plan.metadata.status==='reviewed'?'TEACHER-REVIEWED':'DRAFT FOR TEACHER REVIEW'} · ${plan.metadata.origin}`);
 add(plan.metadata.aiDeclaration|| (plan.metadata.mode==='ai'?'AI assisted with lesson drafting; teacher verification and adaptation are required.':'No AI used in initial guided drafting.'));
 add('Review and adapt to your learners and classroom. Teacher review does not mean DepEd approval.');
 add(`School year: ${plan.input.schoolYear} | ${gradeName(plan.input.grade)} | ${plan.input.subject} | ${plan.input.term}, Week ${plan.input.week}`);
 add(`Curriculum selected: ${plan.input.curriculum} (applicability requires verification) | ${plan.input.duration} minutes × ${plan.input.sessions} session(s) | ${plan.input.classSize} learners`);
 for(const [key,label] of [['schoolName','School'],['section','Section'],['teacherName','Designed by'],['checkedBy','Checked by'],['notedBy','Noted by']])if(plan.input[key])add(`${label}: ${plan.input[key]}`);
 if(plan.input.minimumRoute)add(`Teacher minimum route: ${plan.input.minimumRoute}`);if(plan.input.continuityPlan)add(`Teacher continuity alternative: ${plan.input.continuityPlan}`);
 if(plan.input.lessonReferences){add('Teacher-provided lesson references','Heading2');add(plan.input.lessonReferences);add('Listed by the teacher; not independently verified or an official curriculum approval.');}
 add('Curriculum provenance','Heading2');add(plan.source.competency);if(plan.source.code)add(`Code: ${plan.source.code}`);
 if(plan.source.kind==='budget-of-work')add(`Budget of Work: ${plan.source.curriculumVersion} | ${plan.source.schoolYear} | ${plan.source.term}${plan.source.week==null?' | source week unspecified':` | Week ${plan.source.week}`}`);
 add(`Source status: ${plan.source.source.status} | ${plan.source.source.title}`);if(plan.source.source.url)add(`Source: ${plan.source.source.url}`);if(plan.source.source.section)add(`Section: ${plan.source.source.section}`);if(plan.source.source.excerpt)add(`Source excerpt: ${plan.source.source.excerpt}`);
 if(plan.source.contentStandard)add(`Content standard: ${plan.source.contentStandard}`);if(plan.source.performanceStandard)add(`Performance standard: ${plan.source.performanceStandard}`);
 add(plan.policy?.notice||'Current DepEd policy has not been verified by this installation. ILAW is the requested app rendering, not a compliance claim.');
 for(const source of plan.policy?.sources||[])add(`Policy source: ${source.issuance} (${source.date}), ${source.section}. ${source.url}. Interpretation: ${source.interpretation}`);
 add('Design rationale','Heading2');add(plan.analysis.rationale);add(`Approach: ${plan.analysis.approach}`);add(`Resources: ${plan.analysis.resourcePlan}`);add(`Learner context: ${plan.analysis.needs.join(' ')}`);
 add(`Competency unpacking: ${plan.unpacking.components.join('; ')}`);add(`Prerequisites: ${plan.unpacking.prerequisites.join('; ')}`);add(`Possible misconceptions: ${plan.unpacking.misconceptions.join('; ')}`);add(`Scope: ${plan.unpacking.scopeNote}`);
 for(const s of plan.sessions){
  add(s.title,'Heading1');
  const reported=plan.evidenceSummary?.[s.id];if(reported){add('Teacher-reported aggregate evidence','Heading3');add(`Support: ${reported.support}; developing: ${reported.developing}; met criterion: ${reported.mastery}; extension: ${reported.extension}; unobserved: ${plan.input.classSize-reported.support-reported.developing-reported.mastery-reported.extension}. Recorded ${reported.recordedAt}.`);if(reported.notes)add(`Anonymous notes: ${reported.notes}`);add('Categories are teacher judgments using the reviewed criteria, not official grading thresholds.');}
  add(`I — ${plan.policy?.sections?.intentions||'Intentions'}`,'Heading2');add(`Key concept: ${s.keyConcept}`);
  s.objectives.forEach((o,i)=>{add(`Objective ${i+1} [${o.id}]: ${o.text}`);add(`Success criterion: ${o.criterion}`);add(`Evidence: ${o.evidence}`);add(`Prerequisite: ${o.prerequisite}`);});
  add(`L — ${plan.policy?.sections?.experiences||'Learning Experiences'}`,'Heading2');s.experiences.forEach(a=>{add(`${a.title} · ${a.minutes} min [${a.id}]`,'Heading3');add(`Teacher: ${a.teacher}`);add(`Learners: ${a.learners}`);add(`Materials: ${a.materials.join(', ')}`);add(`Check: ${a.check}`);add(`Support: ${a.supports}`);add(`Transition: ${a.transition}`);add(`Objective links: ${a.objectiveIds.join(', ')}`);});
  add('Embedded differentiation','Heading3');for(const [k,v]of Object.entries(s.differentiation))add(`${k}: ${v}`);
  add(`A — ${plan.policy?.sections?.assessment||'Assessing Learning'}`,'Heading2');s.assessment.forEach(a=>{add(`${a.title} · ${a.method}`,'Heading3');add(`Task: ${a.prompt}`);add(`Draft key / expected response: ${a.answerKey}`);add(`Scoring / rubric: ${a.rubric}`);add(`Watch for: ${a.misconception}`);add(`Objective links: ${a.objectiveIds.join(', ')}`);});
  const reflection=plan.reflections?.[s.id];if(reflection){add('Actual post-lesson reflection','Heading3');for(const [k,label]of [['observedEvidence','Evidence observed'],['difficulty','Difficulty'],['adjustment','Next adjustment'],['supportNeeded','Support needed']])if(reflection[k])add(`${label}: ${reflection[k]}`);add(`Teacher recorded ${reflection.recordedAt} against revision ${reflection.basedOnRevision}.`);}
  add(`W — ${plan.policy?.sections?.ways||'Ways Forward'}`,'Heading2');s.ways.forEach(w=>{add(`If [${w.pathway}]: ${w.condition}`,'Heading3');add(`Evidence: ${w.evidence}`);add(`Then: ${w.response}`);add(`Next session: ${w.nextSession}`);add(`Objective links: ${w.objectiveIds.join(', ')}`);});
 }
 add('Explainable checks','Heading2');for(const c of plan.quality.checks.filter(c=>c.severity!=='pass'))add(`${c.severity.toUpperCase()}: ${c.message}. ${c.detail}`);
 add(`Draft review: ${plan.review.teacherReview}`);for(const c of plan.review.concerns)add(`Review concern: ${c}`);
 add(`Modified: ${plan.metadata.modifiedAt} | Revision ${plan.revision||1} | Policy version: ${plan.metadata.policyVersion}`);
 return blocks;
}
export function documentBlocks(plan,{detail='expanded',materials=false}={}){
 if(materials==='learner'||materials==='keys'){
  const blocks=[{text:materials==='learner'?'Learner tasks':'Teacher answer keys',style:'Title'},{text:plan.title,style:'Heading1'},{text:`${gradeName(plan.input.grade)} · ${plan.input.subject} · Revision ${plan.revision}`,style:'Normal'}];
  for(const session of plan.sessions){blocks.push({text:session.title,style:'Heading1'});for(const task of session.assessment){blocks.push({text:task.title,style:'Heading3'},{text:materials==='learner'?task.prompt:task.answerKey,style:'Normal'});if(materials==='keys')blocks.push({text:task.rubric,style:'Normal'});}}
  return blocks;
 }
 if(!materials&&detail!=='concise')return expandedDocumentBlocks(plan);
 const blocks=[];const add=(text,style='Normal')=>blocks.push({text,style});
 add(materials?'Teaching materials':'ILAW · Classroom plan','Title');add(plan.title,'Heading1');
 add(`${plan.metadata.status==='reviewed'?'TEACHER-REVIEWED':'DRAFT FOR TEACHER REVIEW'} · ${plan.metadata.origin}`);
 add(`${gradeName(plan.input.grade)} · ${plan.input.subject} · ${plan.input.term}, Week ${plan.input.week} · ${plan.input.duration} min × ${plan.input.sessions} sessions`);
 for(const [k,label]of [['schoolName','School'],['section','Section'],['teacherName','Designed by'],['lessonDate','Lesson date'],['checkedBy','Checked by'],['notedBy','Noted by']])if(plan.input[k])add(`${label}: ${plan.input[k]}`);
 add(plan.metadata.aiDeclaration||'Review the draft and disclose applicable AI assistance.');
 add(`Curriculum: ${plan.source.competency}`);add(`Source (${plan.source.source.status}): ${plan.source.source.title} · ${plan.source.source.section||'no section supplied'}${plan.source.source.url?' · '+plan.source.source.url:''}`);
 if(plan.source.code)add(`Competency code: ${plan.source.code}`);
 if(plan.input.minimumRoute)add(`Teacher minimum route: ${plan.input.minimumRoute}`);if(plan.input.continuityPlan)add(`Teacher continuity alternative: ${plan.input.continuityPlan}`);
 if(plan.input.lessonReferences)add(`Teacher references: ${plan.input.lessonReferences}`);
 for(const s of plan.sessions){add(s.title,'Heading1');
  if(materials){
   add('Learner tasks','Heading2');s.assessment.forEach((a,i)=>{add(`${i+1}. ${a.title}`,'Heading3');add(a.prompt);});
   add('Teacher answer keys and scoring guides','Heading2');add('Separate this section before distributing learner tasks. Verify subject accuracy before use.');s.assessment.forEach(a=>{add(a.title,'Heading3');add(a.answerKey);add(a.rubric);});
   add('Support and enrichment','Heading2');add(s.differentiation.support);add(s.differentiation.extension);continue;
  }
  add('I — Intentions','Heading2');s.objectives.forEach(o=>{add(o.text);add(`Success: ${o.criterion}`);add(`Evidence: ${o.evidence}`);});
  add('L — Learning experiences','Heading2');const commonSupport=s.experiences.every(a=>a.supports===s.experiences[0].supports)?s.experiences[0].supports:null;const commonResources=s.experiences.every(a=>JSON.stringify(a.materials)===JSON.stringify(s.experiences[0].materials))?s.experiences[0].materials:null;if(commonResources)add(`Resources throughout: ${commonResources.join(', ')}`);if(commonSupport)add(`Support throughout: ${commonSupport}`);s.experiences.forEach(a=>{add(`${a.title} · ${a.minutes} min`,'Heading3');add(`Teacher: ${a.teacher}`);add(`Learners: ${a.learners}`);if(!commonResources)add(`Resources: ${a.materials.join(', ')}`);add(`Check: ${a.check}`);if(!commonSupport&&a.supports)add(`Support: ${a.supports}`);});
  add(`Language / access: ${s.differentiation.language}; ${s.differentiation.accessibility}`);
  add('A — Assessing learning','Heading2');s.assessment.forEach(a=>{add(a.prompt);add(`Key / expected response: ${a.answerKey}`);add(`Scoring: ${a.rubric}`);});
  add('W — Ways forward','Heading2');s.ways.forEach(w=>add(`If ${w.condition}: ${w.response} Next: ${w.nextSession}`));
  const r=plan.reflections?.[s.id];if(r){add('Actual teacher reflection','Heading3');for(const k of ['observedEvidence','difficulty','adjustment','supportNeeded'])if(r[k])add(`${k}: ${r[k]}`);}
 }
 add(plan.policy?.notice||'Current policy applicability requires review.');add('Teacher review does not mean DepEd approval.');
 add(`Revision ${plan.revision||1} · ${plan.metadata.modifiedAt}`);return blocks;
}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function zip(files){
 const chunks=[],central=[];let offset=0;
 for(const [name,text]of Object.entries(files)){const n=Buffer.from(name),data=Buffer.from(text);const crc=crc32(data);const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(n.length,26);chunks.push(header,n,data);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);central.push(c,n);offset+=header.length+n.length+data.length;
 }
 const index=Buffer.concat(central);const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,index,end]);
}
export function exportDOCX(plan,options={}){
 const blocks=documentBlocks(plan,options);
 const images=exportImages(plan,options);const gallery=images.map((a,i)=>{const scale=Math.min(6.4/a.width,5.5/a.height),cx=Math.round(a.width*scale*914400),cy=Math.round(a.height*scale*914400);return `<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${i+1}" name="Lesson image ${i+1}" descr="${xml(a.alt)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${i+1}" name="Image ${i+1}" descr="${xml(a.alt)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="image${i}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p>${wordMathRuns(imageCaption(a))}</w:p>`;}).join('');
 const paragraphs=blocks.map(b=>`<w:p><w:pPr><w:pStyle w:val="${b.style}"/></w:pPr>${wordMathRuns(b.text)}</w:p>`).join('');
 const styles=`<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault></w:docDefaults>${[['Normal',22],['Title',36],['Heading1',30],['Heading2',26],['Heading3',23]].map(([id,size])=>`<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/><w:pPr>${id!=='Normal'?'<w:keepNext/>':''}</w:pPr><w:rPr>${id!=='Normal'?'<w:b/>':''}<w:sz w:val="${size}"/></w:rPr></w:style>`).join('')}</w:styles>`;
 return zip({'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${images.map((a,i)=>`<Relationship Id="image${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i}.png"/>`).join('')}</Relationships>`,
 ...Object.fromEntries(images.map((a,i)=>[`word/media/image${i}.png`,a.data])),
 'word/styles.xml':styles,'word/document.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${paragraphs}${gallery}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850"/></w:sectPr></w:body></w:document>`});
}
export function exportHTML(plan,options={}){const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(plan.title)}</title><link rel="stylesheet" href="/print.css"><script src="/print.js" defer></script></head><body><nav><button id="print">Print / Save as PDF</button><span>Use your browser’s “Save as PDF” destination.</span></nav><main>${documentBlocks(plan,options).map(b=>`<${({Title:'h1',Heading1:'h2',Heading2:'h3',Heading3:'h4'})[b.style]||'p'}>${mathHTML(b.text)}</${({Title:'h1',Heading1:'h2',Heading2:'h3',Heading3:'h4'})[b.style]||'p'}>`).join('')}${exportImages(plan,options).map(a=>`<figure><img src="/api/assets/${a.id}" alt="${escape(a.alt)}" style="max-width:100%;max-height:450px"><figcaption>${escape(imageCaption(a))}</figcaption></figure>`).join('')}</main></body></html>`;}
