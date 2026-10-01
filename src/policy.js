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
 if(value.gradeScope&&(!Array.isArray(value.gradeScope)||value.gradeScope.some(g=>!Number.isInteger(g)||g<1||g>12)))throw Error('Invalid policy grade scope');
 cachedFile=file;cachedMtime=mtime;cachedRegistry=value;return value;
}
export function policySnapshot(input={}){
 const r=loadPolicy();const today=new Date().toISOString().slice(0,10);
 const applicable=r&&(!r.effectiveFrom||r.effectiveFrom<=today)&&(!r.effectiveTo||r.effectiveTo>=today)&&(!r.gradeScope||!input.grade||r.gradeScope.includes(input.grade))&&(!r.curriculumScope||!input.curriculum||r.curriculumScope.includes(input.curriculum));
 return {status:applicable?'operator-reviewed':'unverified',policyVersion:applicable?r.policyVersion:'unverified-2026-09-30',verifiedAt:applicable?r.verifiedAt:null,effectiveFrom:applicable?r.effectiveFrom||null:null,effectiveTo:applicable?r.effectiveTo||null:null,sections:applicable?{...defaultSections,...r.sections}:defaultSections,sources:applicable?structuredClone(r.sources):[],notice:applicable?'An operator reviewed these policy sources. Teacher review of applicability and documentation remains necessary; this is not automatic compliance.':'Current DepEd policy has not been verified by this installation. ILAW is the requested app rendering, not a compliance claim.'};
}
