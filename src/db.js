import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
export function openDatabase(filename=process.env.ILAW_DB_PATH||'./data/ilaw.sqlite'){
 if(filename!==':memory:')fs.mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});
 const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode = WAL');db.exec('PRAGMA foreign_keys = ON');db.exec('PRAGMA busy_timeout = 5000');
 db.exec(`
 CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, grade INTEGER NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, modified_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS plans_owner_modified ON plans(user_id,modified_at);
 CREATE TABLE IF NOT EXISTS revisions (plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE, revision INTEGER NOT NULL, label TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(plan_id,revision));
 CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL, stage TEXT NOT NULL, input TEXT NOT NULL, plan_id TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS jobs_owner ON jobs(user_id,created_at);
 CREATE TABLE IF NOT EXISTS curriculum (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, payload TEXT NOT NULL);
 PRAGMA user_version = 1;
 `);
 db.exec('CREATE TABLE IF NOT EXISTS job_workers (job_id TEXT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,owner TEXT NOT NULL,expires_at INTEGER NOT NULL)');
 db.prepare("UPDATE jobs SET status='failed',error='Generation was interrupted. Your input and validated stages are retained; resume when ready.' WHERE status IN ('queued','running') AND NOT EXISTS (SELECT 1 FROM job_workers w WHERE w.job_id=jobs.id AND w.expires_at>?)").run(Date.now());
 if(filename!==':memory:'){fs.chmodSync(filename,0o600);for(const suffix of ['-wal','-shm'])if(fs.existsSync(filename+suffix))fs.chmodSync(filename+suffix,0o600);}
 const secretPath=filename+'.keys';let credentialKey;
 if(filename===':memory:')credentialKey=randomBytes(32);else{try{fs.writeFileSync(secretPath,randomBytes(32),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}fs.chmodSync(secretPath,0o600);credentialKey=fs.readFileSync(secretPath);if(credentialKey.length!==32)throw Error('Invalid credential encryption key');}
 db.exec('CREATE TABLE IF NOT EXISTS ai_credentials (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, provider TEXT NOT NULL, secret TEXT NOT NULL)');
 db.exec('CREATE TABLE IF NOT EXISTS ai_probes (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, fingerprint TEXT NOT NULL, model TEXT NOT NULL, tested_at TEXT NOT NULL, success INTEGER NOT NULL)');
 db.exec('CREATE TABLE IF NOT EXISTS job_checkpoints (job_id TEXT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE, fingerprint TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL)');
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}};
 const getPlan=(id,user)=>{const r=db.prepare('SELECT * FROM plans WHERE id=? AND user_id=?').get(id,user);return r?{...JSON.parse(r.payload),revision:r.revision}:null;};
 const savePlan=(plan,user,{expectedRevision,label='Teacher revision',isNew=false,onSaved}={})=>transaction(()=>{
  const r=db.prepare('SELECT revision FROM plans WHERE id=? AND user_id=?').get(plan.id,user);
  if(!r&&!isNew){const e=Error('Lesson not found');e.status=404;throw e;}
  if(r&&r.revision!==expectedRevision){const e=Error('This lesson has a newer revision. Your edits are preserved locally. Reload the latest version before saving.');e.status=409;throw e;}
  const revision=r?r.revision+1:1;const now=new Date().toISOString();const payload={...plan,revision,metadata:{...plan.metadata,modifiedAt:now}};
  const serialized=JSON.stringify(payload);if(serialized.length>350000){const e=Error('Lesson exceeds the supported document size');e.status=400;throw e;}
  if(r)db.prepare('UPDATE plans SET title=?,status=?,revision=?,payload=?,modified_at=? WHERE id=? AND user_id=?').run(plan.title,plan.metadata.status,revision,serialized,now,plan.id,user);
  else db.prepare('INSERT INTO plans (id,user_id,title,grade,subject,status,revision,payload,created_at,modified_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(plan.id,user,plan.title,plan.input.grade,plan.input.subject,plan.metadata.status,revision,serialized,now,now);
  db.prepare('INSERT INTO revisions (plan_id,revision,label,payload,created_at) VALUES (?,?,?,?,?)').run(plan.id,revision,label,serialized,now);
  db.prepare('DELETE FROM revisions WHERE plan_id=? AND revision > 1 AND revision < ?').run(plan.id,Math.max(2,revision-98));
  onSaved?.(payload);
  return payload;
 });
 return {db,credentialKey,transaction,getPlan,savePlan,close:()=>db.close()};
}
