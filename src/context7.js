const defaultBase='https://context7.com/api/v3/search';

const compact=(value,max)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
export function parseTechnicalLibraries(value=''){
 if(typeof value!=='string')return [];
 const out=[];for(const raw of value.split(',')){const item=compact(raw,80).replace(/[^A-Za-z0-9@._+/# -]/g,'').trim();if(item&&!out.some(x=>x.toLowerCase()===item.toLowerCase()))out.push(item);if(out.length===4)break;}return out;
}
export function buildTechnicalQuery({subject,competency}={}){
 const safeSubject=compact(subject,100),safeCompetency=compact(competency,1200);
 if(!safeSubject||!safeCompetency)return '';
 return `Current official software-library documentation relevant to a teacher lesson in ${safeSubject} about this public technical topic/competency: ${safeCompetency}. Return only current API, syntax, configuration, and code-example evidence. Do not infer curriculum, DepEd policy, learner characteristics, or lesson requirements.`;
}
export class Context7TechnicalProvider{
 constructor({key=process.env.CONTEXT7_API_KEY,enabled=process.env.ILAW_CONTEXT7_TECHNICAL_REFERENCES==='true',fetchImpl=fetch,base=process.env.CONTEXT7_SEARCH_URL||defaultBase}={}){
  this.key=key;this.enabled=enabled;this.fetch=fetchImpl;this.base=base;
 }
 get available(){return Boolean(this.enabled&&this.key);}
 async lookup({subject,competency,libraries=''}={}){
  if(!this.available)return null;
  const query=buildTechnicalQuery({subject,competency});if(!query)return null;
  const hints=parseTechnicalLibraries(libraries);const url=new URL(this.base);url.searchParams.set('query',query);url.searchParams.set('type','txt');for(const library of hints)url.searchParams.append('library',library);
  let response;try{response=await this.fetch(url,{headers:{Authorization:`Bearer ${this.key}`,Accept:'text/plain'},signal:AbortSignal.timeout(12000)});}catch{return null;}
  if(response.status===404||response.status===429||!response.ok)return null;
  let text;try{text=(await response.text()).trim();}catch{return null;}if(!text)return null;
  return {provider:'Context7',classification:'supplemental technical documentation',libraries:hints,text:text.slice(0,8000)};
 }
}
