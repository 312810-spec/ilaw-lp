import {randomUUID,createHash} from 'node:crypto';
const fail=(status,message)=>Object.assign(Error(message),{status});
export const retentionDays=7;
export function jobStore(storage,{worker=randomUUID(),clock=Date.now,leaseMs=120000,maxCalls=27}={}){
 const {db,transaction}=storage;
 const stamp=()=>new Date(clock()).toISOString();
 db.exec(`CREATE TABLE IF NOT EXISTS job_workers (job_id TEXT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,owner TEXT NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS job_usage (job_id TEXT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,calls INTEGER NOT NULL DEFAULT 0,input_tokens INTEGER NOT NULL DEFAULT 0,output_tokens INTEGER NOT NULL DEFAULT 0,unknown INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS job_requests(user_id TEXT NOT NULL REFERENCES users(id),request_key TEXT NOT NULL,input_hash TEXT NOT NULL,job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,request_key));`);
 const recover=()=>transaction(()=>{
  db.prepare("UPDATE jobs SET status='failed',error='Generation was interrupted. Your input and validated stages are retained; resume when ready.' WHERE status IN ('queued','running') AND NOT EXISTS (SELECT 1 FROM job_workers w WHERE w.job_id=jobs.id AND w.expires_at>?)").run(clock());
  db.prepare('DELETE FROM job_workers WHERE expires_at<=?').run(clock());
  // Scrub retained lesson content; keep its expiry marker so Resume cannot restart silently.
  db.prepare("UPDATE job_checkpoints SET payload='{}' WHERE updated_at<? AND payload!='{}'").run(new Date(clock()-retentionDays*86400000).toISOString());
 });
 const ensure=id=>{const row=db.prepare("SELECT j.status,w.owner,w.expires_at FROM jobs j LEFT JOIN job_workers w ON w.job_id=j.id WHERE j.id=?").get(id);if(!row||!['queued','running'].includes(row.status)||row.owner!==worker||row.expires_at<=clock())throw fail(409,'Generation stopped or worker ownership expired. Your accepted lesson is unchanged.');};
 const reserve=(id,user,input,{resume=false,requestKey=null}={})=>transaction(()=>{
  let inputHash;if(requestKey!=null){if(resume||typeof requestKey!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(requestKey))throw fail(400,'Use a valid generation request key');inputHash=createHash('sha256').update(JSON.stringify(input)).digest('hex');const existing=db.prepare('SELECT * FROM job_requests WHERE user_id=? AND request_key=?').get(user,requestKey);if(existing){if(existing.input_hash!==inputHash)throw fail(409,'This generation request key belongs to different input.');return {id:existing.job_id,reused:true};}}
  if(resume){const j=db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').get(id,user);if(!j)throw fail(404,'Generation not found');if(j.status==='completed')return {id,completed:true};if(!['failed','cancelled'].includes(j.status))throw fail(409,'Generation is already active.');}
  if(db.prepare("SELECT count(*) n FROM jobs WHERE user_id=? AND status IN ('queued','running')").get(user).n)throw fail(409,'A lesson is already being generated. Open the active generation.');
  if(db.prepare("SELECT count(*) n FROM jobs WHERE status IN ('queued','running')").get().n>=3)throw fail(429,'The generation queue is busy. Try again shortly.');
  if(resume)db.prepare("UPDATE jobs SET status='queued',error=NULL,updated_at=? WHERE id=? AND user_id=?").run(stamp(),id,user);
  else db.prepare('INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?)').run(id,user,'queued','resolve',JSON.stringify(input),null,null,stamp(),stamp());
  db.prepare('INSERT INTO job_workers VALUES (?,?,?) ON CONFLICT(job_id) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at').run(id,worker,clock()+leaseMs);
  db.prepare('INSERT OR IGNORE INTO job_usage(job_id) VALUES (?)').run(id);if(requestKey)db.prepare('INSERT INTO job_requests VALUES (?,?,?,?)').run(user,requestKey,inputHash,id);return {id,completed:false};
 });
 const stage=(id,name)=>transaction(()=>{ensure(id);db.prepare("UPDATE jobs SET status='running',stage=?,updated_at=? WHERE id=?").run(name,stamp(),id);db.prepare('UPDATE job_workers SET expires_at=? WHERE job_id=? AND owner=?').run(clock()+leaseMs,id,worker);});
 const heartbeat=id=>transaction(()=>{ensure(id);db.prepare('UPDATE job_workers SET expires_at=? WHERE job_id=? AND owner=?').run(clock()+leaseMs,id,worker);});
 const release=id=>db.prepare('DELETE FROM job_workers WHERE job_id=? AND owner=?').run(id,worker);
 const cancel=(id,user)=>transaction(()=>{const j=db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').get(id,user);if(!j)throw fail(404,'Generation not found');if(j.status==='completed')throw fail(409,'The lesson is already saved. Open the completed lesson.');db.prepare("UPDATE jobs SET status='cancelled',error='Generation cancelled. Your input and validated stages remain available for resume.',updated_at=? WHERE id=?").run(stamp(),id);db.prepare('DELETE FROM job_workers WHERE job_id=?').run(id);});
 const attempt=id=>transaction(()=>{ensure(id);const row=db.prepare('SELECT calls FROM job_usage WHERE job_id=?').get(id);if(row.calls>=maxCalls)throw fail(429,`This generation reached its ${maxCalls}-request budget. Input and stages are retained. Review the scope before starting a new generation.`);db.prepare('UPDATE job_usage SET calls=calls+1,unknown=unknown+1 WHERE job_id=?').run(id);});
 const usage=(id,value)=>transaction(()=>{ensure(id);if(value){const input=Number.isFinite(value.prompt_tokens)&&value.prompt_tokens>=0?Math.floor(value.prompt_tokens):0;const output=Number.isFinite(value.completion_tokens)&&value.completion_tokens>=0?Math.floor(value.completion_tokens):0;db.prepare('UPDATE job_usage SET input_tokens=input_tokens+?,output_tokens=output_tokens+?,unknown=max(0,unknown-1) WHERE job_id=?').run(input,output,id);}});
 const totals=id=>{const r=db.prepare('SELECT * FROM job_usage WHERE job_id=?').get(id);return r?{calls:r.calls,input:r.input_tokens,output:r.output_tokens,unknown:r.unknown,maxCalls}:null;};
 recover();return {worker,recover,ensure,reserve,stage,heartbeat,release,cancel,attempt,usage,totals};
}
