import fs from 'node:fs';
import {ValidationError} from './schema.js';

export const bowDirectory=Array.from({length:13},(_,grade)=>({grade,label:grade===0?'Kindergarten':`Grade ${grade}`,url:`https://sites.google.com/deped.gov.ph/lsguide/budgets-of-work/${grade<=1?'kindergarten-and-grade-1':`grade-${grade}`}`,status:'source-directory',checkedAt:'2026-10-02',notice:grade===0?'Kindergarten planning is supported; source rows still require import and review.':grade===11?'Academic electives await updates; check core and TechPro coverage.':grade===12?'Academic electives currently refer to curriculum guides; check rollout applicability.':'Embedded source documents have not been imported.'}));
export function validateBOW(record,validateRecord,operator=true){
 validateRecord(record,operator);
 if(record.kind!=='budget-of-work'||record.source.status!==(operator?'verified':'teacher-confirmed'))throw new ValidationError('BOW rows require kind budget-of-work and the appropriate reviewed source provenance');
 for(const field of ['schoolYear','curriculumVersion'])if(typeof record[field]!=='string'||!record[field].trim())throw new ValidationError(`BOW ${field} is required`);
 if(!['Term 1','Term 2','Term 3'].includes(record.term))throw new ValidationError('BOW term must be Term 1, Term 2 or Term 3');
 if(record.week!=null&&(!Number.isInteger(record.week)||record.week<1||record.week>52))throw new ValidationError('BOW week must be an exact source week or null');
 if(record.weekStart!=null||record.weekEnd!=null){if(record.week!=null||![record.weekStart,record.weekEnd].every(n=>Number.isInteger(n)&&n>=1&&n<=52)||record.weekStart>record.weekEnd)throw new ValidationError('Use an exact source week or a valid inclusive source-week range');}
 if(typeof record.source.reviewer!=='string'||!record.source.reviewer.trim())throw new ValidationError('BOW reviewer is required');
 for(const field of ['contentStandard','performanceStandard'])if(record[field]&&!record.source.excerpt.includes(record[field]))throw new ValidationError(`BOW ${field} must occur verbatim in its source excerpt`);
 return record;
}
export function loadBOW(validateRecord){
 const file=process.env.ILAW_BOW_FILE;if(!file)return [];
 const rows=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(rows))throw new ValidationError('BOW file must be an array');
 const ids=new Set();for(const row of rows){validateBOW(row,validateRecord);if(ids.has(row.id))throw new ValidationError('Duplicate BOW id');ids.add(row.id);}return rows;
}
export function matchesBOW(record,input){
 const week=Number(input.week);const mapped=record.weekMapping==='unspecified'?false:record.weekStart!=null?week>=record.weekStart&&week<=record.weekEnd:record.week==null||record.week===week;
 return record.grade===Number(input.grade)&&record.subject===input.subject&&record.curriculum===input.curriculum&&record.schoolYear.replace(/[–—]/g,'-')===String(input.schoolYear||'').replace(/[–—]/g,'-')&&record.term===input.term&&mapped;
}
export function bowCoverage(records){return bowDirectory.map(source=>({...source,verifiedRows:records.filter(r=>r.kind==='budget-of-work'&&r.grade===source.grade&&r.source.status==='verified').length,teacherConfirmedRows:records.filter(r=>r.kind==='budget-of-work'&&r.grade===source.grade&&r.source.status==='teacher-confirmed').length,importedRows:records.filter(r=>r.kind==='budget-of-work'&&r.grade===source.grade).length}));}
