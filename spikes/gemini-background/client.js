// Isolated opt-in prototype. Not selected by the production lesson server.
import {createHash} from 'node:crypto';import {setTimeout as delay} from 'node:timers/promises';
import {validate} from '../../src/schema.js';
const endpoint='https://generativelanguage.googleapis.com/v1beta/interactions';
const hash=value=>createHash('sha256').update(value).digest('hex');
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,512}$/.test(id);
export class GeminiBackgroundClient{
 constructor({enabled=false,key,model='gemini-3.8-flash',fetchImpl=fetch,sleep=(ms,options={})=>delay(ms,undefined,options),pollMs=5000,maxPolls=120,requestTimeoutMs=30000}={}){this.enabled=enabled;this.key=key;this.model=model;this.fetch=fetchImpl;this.sleep=sleep;this.pollMs=pollMs;this.maxPolls=maxPolls;this.requestTimeoutMs=requestTimeoutMs;}
 async request(method,suffix='',body,signal){
  if(!this.enabled||!this.key)throw Error('Gemini background prototype requires explicit opt-in and a server-side key.');signal?.throwIfAborted();
  const controller=new AbortController();const combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;let timer,handler;
  const stopped=new Promise((_,reject)=>{handler=()=>reject(Error('Background request interrupted; retain the interaction state.'));combined.addEventListener('abort',handler,{once:true});timer=setTimeout(()=>controller.abort(),this.requestTimeoutMs);});
  try{return await Promise.race([stopped,(async()=>{const r=await this.fetch(endpoint+suffix,{method,headers:{'x-goog-api-key':this.key,'Content-Type':'application/json','Api-Revision':'2026-05-20'},...(body?{body:JSON.stringify(body)}:{}),signal:combined});if(!r.ok)throw Error(`Background request rejected (HTTP ${r.status}).`);if(method==='DELETE')return null;return await r.json();})()]);}
  catch(e){if(/^Background request (?:rejected|interrupted)/.test(e.message))throw e;throw Error('Background response could not be read. Retain any known interaction state.');}
  finally{clearTimeout(timer);combined.removeEventListener('abort',handler);}
 }
 async run({prompt,schema,state=null,onState=async()=>{},onAttempt=async()=>{},validateOutput=()=>{},signal}={}){
  const fingerprint=hash(JSON.stringify({model:this.model,prompt,schema,credential:hash(this.key||'')}));let interaction;
  try{
  if(state){if(!validId(state.id)||state.fingerprint!==fingerprint)throw Error('Background state belongs to different input, model or credentials.');interaction=await this.request('GET',`/${state.id}`,undefined,signal);}
  else{await onAttempt();interaction=await this.request('POST','',{model:this.model,input:prompt,background:true,response_format:{type:'text',mime_type:'application/json',schema}},signal);if(!validId(interaction.id))throw Error('Background provider omitted a valid interaction ID.');state={id:interaction.id,fingerprint};await onState(state);}
   for(let polls=0;interaction.status==='in_progress'&&polls<this.maxPolls;polls++){signal?.throwIfAborted();await this.sleep(this.pollMs,{signal});signal?.throwIfAborted();interaction=await this.request('GET',`/${state.id}`,undefined,signal);}
   if(interaction.status==='in_progress')throw Error('Background polling limit reached. Resume the retained interaction without creating another.');
   if(interaction.status!=='completed')throw Error(`Background interaction did not complete (${['failed','cancelled','requires_action'].includes(interaction.status)?interaction.status:'unknown'}).`);
   const steps=(interaction.steps||[]).filter(s=>s.type==='model_output');const text=steps.at(-1)?.content?.filter(c=>c.type==='text').map(c=>c.text).join('')||interaction.output_text;
   let output;try{output=JSON.parse(text);}catch{throw Error('Background output is not valid JSON.');}validate(output,schema);validateOutput(output);
   const usage=interaction.usage;return {output,state,usage:usage?{input:usage.total_input_tokens??null,output:usage.total_output_tokens??null,thinking:usage.total_thought_tokens??null}:null};
  }catch(e){if(signal?.aborted&&state?.id){try{await this.cancel(state.id);}catch{/* State remains available for explicit remote cleanup. */}}throw e;}
 }
 async cancel(id){if(!validId(id))throw Error('Invalid interaction ID');return this.request('POST',`/${id}/cancel`);}
 async remove(id){if(!validId(id))throw Error('Invalid interaction ID');return this.request('DELETE',`/${id}`);}
}
