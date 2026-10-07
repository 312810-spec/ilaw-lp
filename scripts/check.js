import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const files=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('.js'))files.push(file);}};
for(const dir of ['src','public','scripts','tests','spikes'])walk(dir);
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status){process.stderr.write(r.stderr);process.exitCode=1;}}
const client=fs.readFileSync('public/app.js','utf8');if(/innerHTML|document\.write|eval\(/.test(client)){console.error('Unsafe client rendering primitive detected');process.exitCode=1;}
if(/AI_API_KEY|Authorization:.*Bearer/.test(client)){console.error('Potential credential logic in browser');process.exitCode=1;}
for(const asset of ['favicon.svg','app.js','styles.css','print.css','print.js'])if(!fs.existsSync(`public/${asset}`)){console.error(`Missing asset ${asset}`);process.exitCode=1;}
if(!process.exitCode)console.log(`Syntax and static security checks passed (${files.length} JavaScript files).`);
