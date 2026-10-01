const xml=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function documentBlocks(plan){
 const blocks=[];const add=(text,style='Normal')=>blocks.push({text,style});
 add('ILAW · Lesson design','Title');add(plan.title,'Heading1');
 add(`${plan.metadata.status==='reviewed'?'TEACHER-REVIEWED':'DRAFT FOR TEACHER REVIEW'} · ${plan.metadata.origin}`);
 add('Review and adapt to your learners and classroom. Teacher review does not mean DepEd approval.');
 add(`School year: ${plan.input.schoolYear} | Grade ${plan.input.grade} | ${plan.input.subject} | ${plan.input.term}, Week ${plan.input.week}`);
 add(`Curriculum selected: ${plan.input.curriculum} (applicability requires verification) | ${plan.input.duration} minutes × ${plan.input.sessions} session(s) | ${plan.input.classSize} learners`);
 for(const [key,label] of [['schoolName','School'],['section','Section'],['teacherName','Designed by'],['checkedBy','Checked by'],['notedBy','Noted by']])if(plan.input[key])add(`${label}: ${plan.input[key]}`);
 if(plan.input.lessonReferences){add('Teacher-provided lesson references','Heading2');add(plan.input.lessonReferences);add('Listed by the teacher; not independently verified or an official curriculum approval.');}
 add('Curriculum provenance','Heading2');add(plan.source.competency);if(plan.source.code)add(`Code: ${plan.source.code}`);
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
  add(`W — ${plan.policy?.sections?.ways||'Ways Forward'}`,'Heading2');s.ways.forEach(w=>{add(`If [${w.pathway}]: ${w.condition}`,'Heading3');add(`Evidence: ${w.evidence}`);add(`Then: ${w.response}`);add(`Next session: ${w.nextSession}`);add(`Objective links: ${w.objectiveIds.join(', ')}`);});
 }
 add('Explainable checks','Heading2');for(const c of plan.quality.checks.filter(c=>c.severity!=='pass'))add(`${c.severity.toUpperCase()}: ${c.message}. ${c.detail}`);
 add(`Draft review: ${plan.review.teacherReview}`);for(const c of plan.review.concerns)add(`Review concern: ${c}`);
 add(`Modified: ${plan.metadata.modifiedAt} | Revision ${plan.revision||1} | Policy version: ${plan.metadata.policyVersion}`);
 return blocks;
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
export function exportDOCX(plan){
 const blocks=documentBlocks(plan);
 const paragraphs=blocks.map(b=>`<w:p><w:pPr><w:pStyle w:val="${b.style}"/></w:pPr><w:r><w:t xml:space="preserve">${xml(b.text).replace(/\n/g,'</w:t><w:br/><w:t xml:space="preserve">')}</w:t></w:r></w:p>`).join('');
 const styles=`<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault></w:docDefaults>${[['Normal',22],['Title',36],['Heading1',30],['Heading2',26],['Heading3',23]].map(([id,size])=>`<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/><w:pPr>${id!=='Normal'?'<w:keepNext/>':''}</w:pPr><w:rPr>${id!=='Normal'?'<w:b/>':''}<w:sz w:val="${size}"/></w:rPr></w:style>`).join('')}</w:styles>`;
 return zip({'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'word/styles.xml':styles,'word/document.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850"/></w:sectPr></w:body></w:document>`});
}
export function exportHTML(plan){const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(plan.title)}</title><link rel="stylesheet" href="/print.css"><script src="/print.js" defer></script></head><body><nav><button id="print">Print / Save as PDF</button><span>Use your browser’s “Save as PDF” destination.</span></nav><main>${documentBlocks(plan).map(b=>`<${({Title:'h1',Heading1:'h2',Heading2:'h3',Heading3:'h4'})[b.style]||'p'}>${escape(b.text)}</${({Title:'h1',Heading1:'h2',Heading2:'h3',Heading3:'h4'})[b.style]||'p'}>`).join('')}</main></body></html>`;}
