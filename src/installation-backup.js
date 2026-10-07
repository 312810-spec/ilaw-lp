import {DatabaseSync,backup} from 'node:sqlite';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {randomBytes,scryptSync,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const passwordKey=(password,salt)=>{if(typeof password!=='string'||password.length<12||password.length>1024)throw Error('Use a backup password of 12–1024 characters in ILAW_BACKUP_PASSWORD');return scryptSync(password,salt,32);};
export async function backupInstallation(databasePath,outputPath,password){
 const salt=randomBytes(16),key=passwordKey(password,salt),iv=randomBytes(12);const keys=await fs.readFile(databasePath+'.keys');if(keys.length!==32)throw Error('Invalid credential key file');
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'ilaw-backup-'));let db;
 try{db=new DatabaseSync(databasePath,{readOnly:true});if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw Error('Database integrity check failed');const snapshot=path.join(folder,'snapshot.sqlite');await backup(db,snapshot);const bytes=await fs.readFile(snapshot);if(bytes.length>100_000_000)throw Error('Backup exceeds the supported size');
  const payload=Buffer.from(JSON.stringify({schemaVersion:1,database:bytes.toString('base64'),credentialKey:keys.toString('base64'),databaseHash:digest(bytes),keyHash:digest(keys)}));const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('ILAW-installation-backup-v1'));const encrypted=Buffer.concat([cipher.update(payload),cipher.final()]);
  await fs.writeFile(outputPath,JSON.stringify({format:'ILAW-installation-backup',version:1,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:encrypted.toString('base64')}),{flag:'wx',mode:0o600});return {bytes:encrypted.length,databaseHash:digest(bytes)};
 }finally{db?.close();await fs.rm(folder,{recursive:true,force:true});key.fill(0);}
}
export async function restoreInstallation(archivePath,targetDirectory,password){
 if((await fs.stat(archivePath)).size>200_000_000)throw Error('Backup exceeds the supported size');const envelope=JSON.parse(await fs.readFile(archivePath,'utf8'));if(envelope.format!=='ILAW-installation-backup'||envelope.version!==1)throw Error('Unsupported backup format');
 const salt=Buffer.from(envelope.salt||'','base64'),iv=Buffer.from(envelope.iv||'','base64'),tag=Buffer.from(envelope.tag||'','base64');if(salt.length!==16||iv.length!==12||tag.length!==16)throw Error('Invalid encrypted backup');const key=passwordKey(password,salt);let payload;
 try{const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(Buffer.from('ILAW-installation-backup-v1'));decipher.setAuthTag(tag);payload=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext||'','base64')),decipher.final()]).toString());}catch{throw Error('Backup password is incorrect or the archive is damaged');}finally{key.fill(0);}
 const bytes=Buffer.from(payload.database||'','base64'),keys=Buffer.from(payload.credentialKey||'','base64');if(payload.schemaVersion!==1||keys.length!==32||bytes.length>100_000_000||digest(bytes)!==payload.databaseHash||digest(keys)!==payload.keyHash)throw Error('Backup integrity mismatch');
 try{await fs.access(targetDirectory);throw Error('Restore requires a new directory; existing installations are never overwritten');}catch(e){if(e.code!=='ENOENT')throw e;}
 const absolute=path.resolve(targetDirectory);await fs.mkdir(path.dirname(absolute),{recursive:true});const temporary=await fs.mkdtemp(absolute+'.restore-');let db;
 try{const file=path.join(temporary,'ilaw.sqlite');await fs.writeFile(file,bytes,{mode:0o600});await fs.writeFile(file+'.keys',keys,{mode:0o600});db=new DatabaseSync(file);if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Restored database integrity check failed');if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Restored references are invalid');db.exec('DELETE FROM sessions');db.close();db=null;await fs.rename(temporary,absolute);return {databasePath:path.join(absolute,'ilaw.sqlite'),databaseHash:payload.databaseHash};
 }catch(e){await fs.rm(temporary,{recursive:true,force:true});throw e;}finally{db?.close();}
}
