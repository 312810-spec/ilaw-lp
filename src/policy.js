import fs from 'node:fs';
import {officialURL} from './curriculum.js';
const defaultSections={intentions:'Intentions',experiences:'Learning Experiences',assessment:'Assessing Learning',ways:'Ways Forward'};
let cachedFile=null,cachedMtime=0,cachedRegistry=null;
export function loadPolicy(){
 const file=process.env.ILAW_POLICY_FILE;if(!file)return null;const mtime=fs.statSync(file).mtimeMs;
 if(file===cachedFile&&mtime===cachedMtime)return cachedRegistry;
 const value=JSON.parse(fs.readFileSync(file,'utf8'));
 if(value.status!=='operator-reviewed'||typeof value.policyVersion!=='string'||!value.policyVersion||!value.verifiedAt||!Array.isArray(value.sources)||!value.sources.length)throw Error('Policy registry needs operator review, version, verification date and sources');
 for(const source of value.sources)for(const field of ['issuance','date','section','excerpt','interpretation','behavior','reviewer'])if(typeof source[field]!=='string'||!source[field].trim())throw Error(`Policy source ${field} is required`);
 for(const source of value.sources)if(!officialURL(source.url))throw Error('Policy sources need official DepEd HTTPS URLs');
 if(value.sections)for(const [key,label]of Object.entries(value.sections))if(!(key in defaultSections)||typeof label!=='string'||!label.trim()||label.length>100)throw Error('Invalid policy rendering section');
 if(value.gradeScope&&(!Array.isArray(value.gradeScope)||value.gradeScope.some(g=>!Number.isInteger(g)||g<0||g>12)))throw Error('Invalid policy grade scope');
 for(const key of ['effectiveFrom','effectiveTo'])if(value[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(value[key])||Number.isNaN(Date.parse(value[key]))))throw Error('Invalid policy effective date');
 if(value.effectiveFrom&&value.effectiveTo&&value.effectiveFrom>value.effectiveTo)throw Error('Policy effective dates are reversed');
 for(const key of ['divisionScope','schoolYearScope','curriculumScope'])if(value[key]&&(!Array.isArray(value[key])||!value[key].length||value[key].some(v=>typeof v!=='string'||!v.trim())))throw Error(`Invalid policy ${key}`);
 cachedFile=file;cachedMtime=mtime;cachedRegistry=value;return value;
}
export function policySnapshot(input={}){
 const r=loadPolicy();const today=input.lessonDate||new Date().toISOString().slice(0,10);
 const applicable=r&&(!r.effectiveFrom||r.effectiveFrom<=today)&&(!r.effectiveTo||r.effectiveTo>=today)&&(!r.gradeScope||r.gradeScope.includes(Number(input.grade)))&&(!r.curriculumScope||r.curriculumScope.includes(input.curriculum))&&(!r.divisionScope||r.divisionScope.includes(input.division))&&(!r.schoolYearScope||r.schoolYearScope.some(y=>y.replace(/[–—]/g,'-')===String(input.schoolYear||'').replace(/[–—]/g,'-')));
 return {evaluatedFor:{lessonDate:today,division:input.division||null,schoolYear:input.schoolYear||null},status:applicable?'operator-reviewed':'unverified',policyVersion:applicable?r.policyVersion:'unverified-2026-09-30',verifiedAt:applicable?r.verifiedAt:null,effectiveFrom:applicable?r.effectiveFrom||null:null,effectiveTo:applicable?r.effectiveTo||null:null,sections:applicable?{...defaultSections,...r.sections}:defaultSections,sources:applicable?structuredClone(r.sources):[],notice:applicable?'An operator reviewed these policy sources. Teacher review of applicability and documentation remains necessary; this is not automatic compliance.':'Current DepEd policy has not been verified by this installation. ILAW is the requested app rendering, not a compliance claim.'};
}
