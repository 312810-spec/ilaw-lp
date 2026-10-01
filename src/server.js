import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {scrypt,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {openDatabase} from './db.js';
import {normalizeInput,validateSessions,ValidationError,validate} from './schema.js';
import {loadCurriculum,policySources,validateRecord,resolveCompetency} from './curriculum.js';
import {generateGuided,regenerateGuided,retimePlan,stageLabels} from './engine.js';
import {AIProvider,generateAI,regenerateAI} from './ai.js';
import {qualityCheck} from './quality.js';
import {policySnapshot} from './policy.js';
import {exportDOCX,exportHTML} from './exports.js';
const scryptAsync=promisify(scrypt);const hash=s=>createHash('sha256').update(s).digest('hex');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const now=()=>new Date().toISOString();
const statusError=(status,message)=>Object.assign(Error(message),{status});
const publicFiles=new Set(['index.html','app.js','styles.css','favicon.svg','print.css','print.js','manifest.webmanifest']);
export async function createApp({database,provider=new AIProvider(),host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||3000),socketPath=process.env.ILAW_SOCKET}={}){
 const storage=database||openDatabase();const {db,getPlan,savePlan}=storage;const records=loadCurriculum();const rates=new Map();const activeJobs=new Set();const cookieName='ilaw_session';
 const publicOrigin=process.env.ILAW_PUBLIC_ORIGIN;
 if(!['127.0.0.1','localhost','::1'].includes(host)&&(!publicOrigin||!publicOrigin.startsWith('https://')))throw Error('External serving requires ILAW_PUBLIC_ORIGIN with HTTPS and a secure reverse proxy.');
 const limit=(key,max,windowMs)=>{const t=Date.now();let list=rates.get(key)||[];list=list.filter(x=>x>t-windowMs);if(list.length>=max)throw statusError(429,'Too many requests. Wait a little and try again.');list.push(t);rates.set(key,list);if(rates.size>10000)for(const [k,v]of rates)if(!v.some(x=>x>t-3600000))rates.delete(k);};
 const sessionFor=req=>{const value=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!value||!/^[a-f0-9]{64}$/.test(value))return null;return db.prepare('SELECT s.*,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash(value),Date.now());};
 const issueSession=(res,user)=>{const token=randomBytes(32).toString('hex');const csrf=randomBytes(24).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(hash(token),user.id,csrf,Date.now()+7*24*3600*1000);res.setHeader('Set-Cookie',`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${publicOrigin?'; Secure':''}`);return csrf;};
 const curriculumFor=user=>[...records,...db.prepare('SELECT payload FROM curriculum WHERE user_id=?').all(user).map(r=>JSON.parse(r.payload))];
 const readBody=async req=>{if(!req.headers['content-type']?.startsWith('application/json'))throw statusError(415,'Use application/json');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>400000)throw statusError(413,'Request is too large');}try{return JSON.parse(text||'{}');}catch{throw new ValidationError('Request body is not valid JSON');}};
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const requirePlan=(id,user)=>{const p=getPlan(id,user);if(!p)throw statusError(404,'Lesson not found');return p;};
 const checkRevision=(plan,revision)=>{if(!Number.isInteger(revision)||plan.revision!==revision)throw statusError(409,'This lesson has a newer revision. Reload the latest version before saving. Your current edits remain in recovery.');};
 const makeJob=async(job,input,user)=>{
  activeJobs.add(job);
  const stage=async name=>{db.prepare("UPDATE jobs SET status='running',stage=?,updated_at=? WHERE id=?").run(name,now(),job);await new Promise(resolve=>setImmediate(resolve));};
  try{const options={records:curriculumFor(user),provider,onStage:stage};const plan=input.mode==='ai'?await generateAI(input,options):await generateGuided(input,options);await stage('save');const saved=savePlan(plan,user,{isNew:true,label:plan.metadata.origin});db.prepare("UPDATE jobs SET status='completed',stage='save',plan_id=?,updated_at=? WHERE id=?").run(saved.id,now(),job);}
  catch(e){db.prepare("UPDATE jobs SET status='failed',error=?,updated_at=? WHERE id=?").run(e.status?e.message:'Generation failed safely. Your input is preserved; retry.',now(),job);console.error(`generation_failed: ${e.name}`);}
  finally{activeJobs.delete(job);}
 };
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");if(publicOrigin)res.setHeader('Strict-Transport-Security','max-age=31536000');
  try{
   const url=new URL(req.url,'http://localhost');const route=url.pathname;const method=req.method;
   const expected=publicOrigin||`http://${req.headers.host}`;
   if(!publicOrigin&&!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(req.headers.host||''))throw statusError(403,'Unrecognized host');
   if(req.headers.origin&&req.headers.origin!==expected)throw statusError(403,'Cross-origin request rejected');
   if(req.headers['sec-fetch-site']==='cross-site'&&method!=='GET')throw statusError(403,'Cross-site request rejected');
   if(route==='/api/config'&&method==='GET'){send(res,200,{aiAvailable:provider.available,registrationEnabled:process.env.ILAW_REGISTRATION_ENABLED==='true'||db.prepare('SELECT count(*) n FROM users').get().n===0,policyVerified:policySnapshot().status==='operator-reviewed',policy:policySnapshot(),appVersion:'1.0.0',modeLabel:'Guided design is a deterministic draft, not AI generation.'});return;}
   if(['/api/auth/register','/api/auth/login'].includes(route)&&method==='POST'){
    if(!req.headers.origin)throw statusError(403,'Origin header required');
    limit(`auth:${req.socket.remoteAddress}`,10,60000);const body=await readBody(req);
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';const password=typeof body.password==='string'?body.password:'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<12||password.length>200)throw new ValidationError('Use a valid email and a password of 12–200 characters.');
    if(route.endsWith('register')){
     if(process.env.ILAW_REGISTRATION_ENABLED!=='true'&&db.prepare('SELECT count(*) n FROM users').get().n!==0)throw statusError(403,'New-account registration is disabled by the administrator.');
     if(typeof body.name!=='string'||!body.name.trim()||body.name.length>80)throw new ValidationError('Enter a display name of 1–80 characters.');
     const salt=randomBytes(16).toString('hex');const derived=await scryptAsync(password,salt,64);const user={id:crypto.randomUUID(),name:body.name.trim(),email};
     try{db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(user.id,user.name,email,`${salt}:${derived.toString('hex')}`,now());}catch(e){if(e.code?.includes('SQLITE')||e.message.includes('UNIQUE'))throw statusError(409,'Unable to register that email. Try signing in.');throw e;}
     send(res,201,{user,csrf:issueSession(res,user)});return;
    }
    const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);const salt=user?.password_hash.split(':')[0]||'00000000000000000000000000000000';const derived=await scryptAsync(password,salt,64);const stored=user?Buffer.from(user.password_hash.split(':')[1],'hex'):Buffer.alloc(64);
    if(!user||!timingSafeEqual(derived,stored))throw statusError(401,'Email or password is incorrect.');
    send(res,200,{user:{id:user.id,name:user.name,email:user.email},csrf:issueSession(res,user)});return;
   }
   if(route.startsWith('/api/')){
    const session=sessionFor(req);if(!session)throw statusError(401,'Sign in to continue.');const user=session.user_id;
    if(method!=='GET'&&method!=='HEAD'&&req.headers['x-csrf-token']!==session.csrf)throw statusError(403,'Security token expired. Sign in again; your edits are preserved.');
    limit(`api:${user}`,180,60000);
    if(route==='/api/me'&&method==='GET'){send(res,200,{user:{id:user,name:session.name,email:session.email},csrf:session.csrf});return;}
    if(route==='/api/auth/logout'&&method==='POST'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);res.setHeader('Set-Cookie',`${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${publicOrigin?'; Secure':''}`);send(res,200,{ok:true});return;}
    if(route==='/api/curriculum'&&method==='GET'){send(res,200,{records:curriculumFor(user),policySources});return;}
    if(route==='/api/curriculum'&&method==='POST'){
     const b=await readBody(req);const record={...b,id:`teacher-${crypto.randomUUID()}`,source:{...b.source,status:'teacher-confirmed',verifiedAt:null,policyVersion:null}};validateRecord(record);if(JSON.stringify(record).length>25000)throw new ValidationError('Source record is too large');db.prepare('INSERT INTO curriculum VALUES (?,?,?)').run(record.id,user,JSON.stringify(record));send(res,201,{record});return;
    }
    if(route==='/api/plans'&&method==='GET'){
     const search=(url.searchParams.get('search')||'').slice(0,200).toLowerCase();const state=url.searchParams.get('status')||'';
     const rows=db.prepare('SELECT id,title,grade,subject,status,revision,created_at,modified_at,payload FROM plans WHERE user_id=? ORDER BY modified_at DESC LIMIT 500').all(user);
     send(res,200,{plans:rows.filter(r=>(!search||`${r.title} ${r.grade} ${r.subject}`.toLowerCase().includes(search))&&(!state||r.status===state)).map(r=>{const p=JSON.parse(r.payload);return {id:r.id,title:r.title,grade:r.grade,subject:r.subject,status:r.status,revision:r.revision,modifiedAt:r.modified_at,term:p.input.term,week:p.input.week,sessions:p.input.sessions,duration:p.input.duration,mode:p.metadata.mode};})});return;
    }
    if(route==='/api/jobs'&&method==='POST'){
     const input=normalizeInput(await readBody(req));resolveCompetency(input,curriculumFor(user));if(input.mode==='ai'&&!provider.available)throw statusError(503,'Live AI is not configured. Select guided design, or configure a server-side provider credential.');
     const active=db.prepare("SELECT count(*) n FROM jobs WHERE user_id=? AND status IN ('queued','running')").get(user).n;if(active)throw statusError(409,'A lesson is already being generated. Open the active generation.');
     if(activeJobs.size>=3)throw statusError(429,'The generation queue is busy. Try again shortly.');limit(`generation:${user}`,8,3600000);
     const id=crypto.randomUUID();db.prepare('INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?)').run(id,user,'queued','resolve',JSON.stringify(input),null,null,now(),now());
     send(res,202,{jobId:id});setImmediate(()=>makeJob(id,input,user));return;
    }
    const jobMatch=route.match(/^\/api\/jobs\/([a-f0-9-]{36})$/);
    if(jobMatch&&method==='GET'){const job=db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').get(jobMatch[1],user);if(!job)throw statusError(404,'Generation not found');send(res,200,{id:job.id,status:job.status,stage:job.stage,label:stageLabels[job.stage]||job.stage,planId:job.plan_id,error:job.error,input:job.status==='failed'?JSON.parse(job.input):undefined});return;}
    const planMatch=route.match(/^\/api\/plans\/([a-f0-9-]{36})(?:\/(revisions|restore|review|duplicate|regenerate|retime|evidence|docx|print))?$/);
    if(planMatch){const id=planMatch[1],action=planMatch[2];const plan=requirePlan(id,user);
     if(!action&&method==='GET'){plan.quality=qualityCheck(plan);send(res,200,{plan});return;}
     if(!action&&method==='PUT'){
      const b=await readBody(req);checkRevision(plan,b.revision);validateSessions(b.sessions,plan.input.sessions);if(typeof b.title!=='string'||!b.title.trim()||b.title.length>200)throw new ValidationError('Lesson title must contain 1–200 characters.');
      const edited={...plan,title:b.title.trim(),sessions:b.sessions,metadata:{...plan.metadata,status:'draft',teacherReviewedAt:null}};edited.quality=qualityCheck(edited);
      send(res,200,{plan:savePlan(edited,user,{expectedRevision:b.revision,label:'Teacher revision'})});return;
     }
     if(!action&&method==='DELETE'){db.prepare('DELETE FROM plans WHERE id=? AND user_id=?').run(id,user);send(res,200,{ok:true});return;}
     if(action==='revisions'&&method==='GET'){send(res,200,{revisions:db.prepare('SELECT revision,label,created_at FROM revisions WHERE plan_id=? ORDER BY revision DESC').all(id).map(r=>({revision:r.revision,label:r.label,createdAt:r.created_at}))});return;}
     if(action==='restore'&&method==='POST'){
      const b=await readBody(req);checkRevision(plan,b.revision);const r=db.prepare('SELECT payload FROM revisions WHERE plan_id=? AND revision=?').get(id,b.targetRevision);if(!r)throw statusError(404,'Revision not found');const restored=JSON.parse(r.payload);restored.metadata.status='draft';restored.metadata.teacherReviewedAt=null;restored.quality=qualityCheck(restored);send(res,200,{plan:savePlan(restored,user,{expectedRevision:plan.revision,label:`Restored revision ${b.targetRevision}`})});return;
     }
     if(action==='revisions'&&method==='POST'){const b=await readBody(req);const r=db.prepare('SELECT payload FROM revisions WHERE plan_id=? AND revision=?').get(id,b.targetRevision);if(!r)throw statusError(404,'Revision not found');send(res,200,{plan:JSON.parse(r.payload)});return;}
     if(action==='review'&&method==='POST'){
      const b=await readBody(req);checkRevision(plan,b.revision);if(b.confirm!==true)throw new ValidationError('Confirm that you reviewed the draft and its warnings.');plan.quality=qualityCheck(plan);if(plan.quality.counts.error)throw statusError(422,'Resolve the disconnected alignment links before marking this plan reviewed.');plan.metadata.status='reviewed';plan.metadata.teacherReviewedAt=now();send(res,200,{plan:savePlan(plan,user,{expectedRevision:plan.revision,label:'Teacher-reviewed'})});return;
     }
     if(action==='duplicate'&&method==='POST'){const copy=structuredClone(plan);copy.id=crypto.randomUUID();copy.title=`${plan.title.slice(0,185)} (copy)`;delete copy.evidenceSummary;copy.metadata.status='draft';copy.metadata.createdAt=now();copy.metadata.teacherReviewedAt=null;copy.quality=qualityCheck(copy);send(res,201,{plan:savePlan(copy,user,{isNew:true,label:'Duplicated draft'})});return;}
     if(action==='regenerate'&&method==='POST'){
      const b=await readBody(req);checkRevision(plan,b.revision);limit(`regenerate:${user}`,20,3600000);
      if(!['replace','simplify','low-resource','interactive','contextualize','improve'].includes(b.action||'replace'))throw new ValidationError('Unknown revision action');
      const edited=plan.metadata.mode==='ai'?await regenerateAI(plan,b,provider):await regenerateGuided(plan,b);validateSessions(edited.sessions,plan.input.sessions);edited.metadata.status='draft';edited.metadata.teacherReviewedAt=null;edited.quality=qualityCheck(edited);send(res,200,{plan:savePlan(edited,user,{expectedRevision:b.revision,label:`${plan.metadata.mode==='ai'?'AI':'Guided'} revision: ${b.section}${b.nodeId?' component':''}`})});return;
     }
     if(action==='evidence'&&method==='POST'){
      const b=await readBody(req);checkRevision(plan,b.revision);if(!plan.sessions.some(s=>s.id===b.sessionId))throw new ValidationError('Session not found');
      const values={};for(const k of ['support','developing','mastery','extension']){if(!Number.isInteger(b[k])||b[k]<0||b[k]>plan.input.classSize)throw new ValidationError('Evidence counts must be whole numbers within the class size');values[k]=b[k];}
      if(Object.values(values).reduce((a,n)=>a+n,0)>plan.input.classSize)throw new ValidationError('Evidence counts exceed class size; use one category per observed learner');
      if(typeof b.notes!=='string'||b.notes.length>1000)throw new ValidationError('Anonymous evidence notes must be 0–1000 characters');
      const measuredSession=plan.sessions.find(s=>s.id===b.sessionId);
      const edited={...plan,evidenceSummary:{...(plan.evidenceSummary||{}),[b.sessionId]:{...values,notes:b.notes,recordedAt:now(),basedOnRevision:plan.revision,objectiveSnapshot:measuredSession.objectives.map(o=>({id:o.id,text:o.text,criterion:o.criterion})),assessmentSnapshot:measuredSession.assessment.map(a=>({id:a.id,prompt:a.prompt,method:a.method,rubric:a.rubric})),kind:'teacher-reported aggregate'}},metadata:{...plan.metadata,status:'draft',teacherReviewedAt:null}};edited.quality=qualityCheck(edited);send(res,200,{plan:savePlan(edited,user,{expectedRevision:b.revision,label:`Teacher-reported evidence: ${b.sessionId}`})});return;
     }
     if(action==='retime'&&method==='POST'){
      const b=await readBody(req);checkRevision(plan,b.revision);const edited=retimePlan(plan,b.duration);edited.metadata.status='draft';edited.metadata.teacherReviewedAt=null;edited.quality=qualityCheck(edited);send(res,200,{plan:savePlan(edited,user,{expectedRevision:b.revision,label:`Retimed to ${b.duration} minutes; content preserved`})});return;
     }
     if(action==='docx'&&method==='GET'){plan.quality=qualityCheck(plan);const bytes=exportDOCX(plan);res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':`attachment; filename="ILAW-Grade-${plan.input.grade}-${id.slice(0,8)}.docx"`,'Cache-Control':'no-store'});res.end(bytes);return;}
     if(action==='print'&&method==='GET'){plan.quality=qualityCheck(plan);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(exportHTML(plan));return;}
    }
    throw statusError(404,'API route not found');
   }
   if(method!=='GET'&&method!=='HEAD')throw statusError(405,'Method not allowed');
   const file=route==='/'?'index.html':route.slice(1);if(!publicFiles.has(file))throw statusError(404,'Page not found');
   const bytes=await fs.readFile(path.join(root,file));const mime={html:'text/html',js:'text/javascript',css:'text/css',svg:'image/svg+xml',webmanifest:'application/manifest+json'};const compressed=bytes.length>1024&&/\bgzip\b/.test(req.headers['accept-encoding']||'');res.writeHead(200,{'Content-Type':`${mime[file.split('.').pop()]||'text/plain'}; charset=utf-8`,'Cache-Control':file==='index.html'?'no-store':'public, max-age=300',...(compressed?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{})});res.end(method==='HEAD'?undefined:compressed?gzipSync(bytes):bytes);
  }catch(e){if(res.headersSent){res.end();return;}const status=e.status||500;send(res,status,{error:status===500?'Something went wrong. Your edits are preserved; try again.':e.message});if(status===500)console.error(`request_failed: ${e.name}: ${e.message}`);}
 });
 return {server,storage,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);const done=()=>{server.removeListener('error',reject);resolve(server.address());};if(socketPath)server.listen(socketPath,done);else server.listen(port,host,done);}),close:()=>new Promise(resolve=>server.close(()=>{if(!database)storage.close();resolve();}))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const app=await createApp();
 try{
  const address=await app.listen();console.log(typeof address==='string'?`ILAW listening on local socket ${address}`:`ILAW running at http://${address.address}:${address.port}`);console.log('Guided design available. Live AI: '+(new AIProvider().available?'configured':'not configured (no fake fallback)'));
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close().then(()=>process.exit(0)));
 }catch(e){console.error(`ILAW cannot start its listener (${e.code||e.name}). Check local socket permissions or run in an environment that permits HTTP serving.`);app.storage.close();process.exitCode=1;}
}
