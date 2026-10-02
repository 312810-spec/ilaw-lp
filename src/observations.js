import {ValidationError} from './schema.js';
const error=(status,message)=>Object.assign(Error(message),{status});
const text=(value,label,max=2000)=>{if(typeof value!=='string'||value.length>max)throw new ValidationError(`${label} must be text of at most ${max} characters`);return value.trim();};
export function observationStore(db){
 db.exec(`CREATE TABLE IF NOT EXISTS observations(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),observer_id TEXT REFERENCES users(id),revision INTEGER NOT NULL,payload TEXT NOT NULL,modified_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS observation_owner ON observations(owner_id,modified_at);
 CREATE INDEX IF NOT EXISTS observation_observer ON observations(observer_id,modified_at);
 CREATE TABLE IF NOT EXISTS observation_events(id INTEGER PRIMARY KEY,observation_id TEXT NOT NULL REFERENCES observations(id),actor_id TEXT NOT NULL,revision INTEGER NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);`);
 const get=(id,user)=>{const row=db.prepare('SELECT * FROM observations WHERE id=? AND (owner_id=? OR observer_id=?)').get(id,user,user);if(!row)throw error(404,'Observation not found');return JSON.parse(row.payload);};
 const save=(value,user,expected,isNew=false)=>{
  db.exec('BEGIN IMMEDIATE');try{
   const row=db.prepare('SELECT revision FROM observations WHERE id=?').get(value.id);
   if(!isNew&&(!row||row.revision!==expected))throw error(409,'This observation has a newer revision. Reload it before saving; keep your notes to copy into the latest record.');
   const updated={...value,revision:(row?.revision||0)+1,modifiedAt:new Date().toISOString()};const payload=JSON.stringify(updated);
   if(payload.length>350000)throw new ValidationError('Observation exceeds the supported size');
   if(isNew)db.prepare('INSERT INTO observations VALUES(?,?,?,?,?,?)').run(updated.id,updated.ownerId,updated.observerId,updated.revision,payload,updated.modifiedAt);
   else db.prepare('UPDATE observations SET revision=?,payload=?,modified_at=? WHERE id=?').run(updated.revision,payload,updated.modifiedAt,updated.id);
   db.prepare('INSERT INTO observation_events(observation_id,actor_id,revision,payload,created_at) VALUES(?,?,?,?,?)').run(updated.id,user,updated.revision,payload,updated.modifiedAt);
   db.exec('COMMIT');return updated;
  }catch(e){db.exec('ROLLBACK');throw e;}
 };
 return {
  get,
  list:user=>db.prepare('SELECT payload FROM observations WHERE owner_id=? OR observer_id=? ORDER BY modified_at DESC LIMIT 100').all(user,user).map(r=>{const o=JSON.parse(r.payload);return {id:o.id,title:o.snapshot.title,focus:o.focus,purpose:o.purpose,status:o.status,revision:o.revision,scheduledAt:o.scheduledAt,modifiedAt:o.modifiedAt,role:o.ownerId===user?'teacher':'observer'};}),
  history:(id,user)=>{get(id,user);return db.prepare('SELECT revision,actor_id,created_at FROM observation_events WHERE observation_id=? ORDER BY revision DESC').all(id);},
  revision:(id,user,revision)=>{get(id,user);const row=db.prepare('SELECT payload FROM observation_events WHERE observation_id=? AND revision=?').get(id,revision);if(!row)throw error(404,'Observation revision not found');return JSON.parse(row.payload);},
  create:(plan,user,body)=>{
   const focus=text(body.focus,'Focus');if(!focus)throw new ValidationError('Choose an observation focus');
   const purpose=body.purpose||'developmental';if(!['developmental','formal-preparation'].includes(purpose))throw new ValidationError('Choose developmental coaching or formal preparation');
   const scheduledAt=text(body.scheduledAt||'','Schedule',40);if(scheduledAt&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledAt)||Number.isNaN(Date.parse(scheduledAt))))throw new ValidationError('Choose a valid schedule');
   let observerId=null;if(body.observerEmail){const email=text(body.observerEmail,'Observer email',254).toLowerCase();observerId=db.prepare('SELECT id FROM users WHERE email=?').get(email)?.id;if(!observerId)throw new ValidationError('The observer needs an existing account. Check the email address.');if(observerId===user)throw new ValidationError('Assign another account as observer; use teacher-reported notes for self-reflection');}
   return save({id:crypto.randomUUID(),ownerId:user,observerId,planId:plan.id,planRevision:plan.revision,snapshot:structuredClone(plan),purpose,focus,scheduledAt,status:'open',notes:[],reflection:'',coaching:{strengths:'',nextStep:'',support:'',followUpDate:''},createdAt:new Date().toISOString(),notice:'Developmental record / preparation only. Planned opportunities are not observed performance. No official rating is calculated.'},user,null,true);
  },
  update:(id,user,body)=>{
   const o=get(id,user);if(o.revision!==body.revision)throw error(409,'This observation has a newer revision. Reload it before saving.');
   if(body.action==='reopen'){if(user!==o.ownerId)throw error(403,'Only the teacher can reopen this record');o.status='open';return save(o,user,body.revision);}
   if(o.status==='finalized')throw error(409,'This record is finalized. The teacher can reopen it for a recorded amendment.');
   if(body.action==='note'){
    const content=text(body.text,'Note');if(!content)throw new ValidationError('Enter factual evidence');
    if(!['observed','teacher-reported','planned','not-observed'].includes(body.kind))throw new ValidationError('Choose an evidence status');
    if(body.kind==='observed'&&o.observerId!==user)throw error(403,'Only the assigned observer can record observed evidence');
    if(body.kind==='teacher-reported'&&o.ownerId!==user)throw error(403,'Only the teacher can add teacher-reported evidence');
    const interpretation=text(body.interpretation||'','Interpretation');
    const activityId=text(body.activityId||'','Activity reference',60);if(activityId&&!o.snapshot.sessions.some(s=>s.experiences.some(a=>a.id===activityId)))throw new ValidationError('Activity is not in the observation snapshot');
    const amends=body.amends||null;if(amends&&!o.notes.some(n=>n.id===amends&&n.authorId===user))throw new ValidationError('Amend only your own existing note');
    o.notes.push({id:crypto.randomUUID(),authorId:user,kind:body.kind,text:content,interpretation,activityId,amends,recordedAt:new Date().toISOString()});
   }else if(body.action==='reflection'){if(user!==o.ownerId)throw error(403,'Only the teacher can write the reflection');o.reflection=text(body.text,'Teacher reflection',4000);
   }else if(body.action==='coaching'){
    o.coaching={};for(const k of ['strengths','nextStep','support'])o.coaching[k]=text(body[k],k);o.coaching.followUpDate=text(body.followUpDate||'','Follow-up date',10);if(o.coaching.followUpDate&&!/^\d{4}-\d{2}-\d{2}$/.test(o.coaching.followUpDate))throw new ValidationError('Follow-up date must use YYYY-MM-DD');
    o.coaching.authorId=user;o.coaching.recordedAt=new Date().toISOString();
   }else if(body.action==='finalize'){if(user!==o.ownerId)throw error(403,'Only the teacher can finalize this developmental record');o.status='finalized';
   }else throw new ValidationError('Unknown observation action');
   return save(o,user,body.revision);
  }
 };
}
export function observationExport(o){
 const escape=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rows=[['Observation / coaching',o.snapshot.title],['Purpose',o.purpose],['Status',o.status],['Scope',o.notice],['Focus',o.focus],['Schedule',o.scheduledAt],['Lesson snapshot',`Revision ${o.planRevision}; Grade ${o.snapshot.input.grade} ${o.snapshot.input.subject}`],...o.notes.flatMap(n=>[[`${n.kind} · ${n.recordedAt}${n.amends?' · amendment':''}`,n.text],['Interpretation',n.interpretation]]),['Teacher reflection',o.reflection],['Strengths',o.coaching.strengths],['Next step',o.coaching.nextStep],['Support',o.coaching.support],['Follow-up',o.coaching.followUpDate]];
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Observation</title><link rel="stylesheet" href="/print.css"><script src="/print.js" defer></script></head><body><nav><button id="print">Print / Save as PDF</button></nav><main>${rows.map(([k,v])=>`<h3>${escape(k)}</h3><p>${escape(v)}</p>`).join('')}</main></body></html>`;
}
