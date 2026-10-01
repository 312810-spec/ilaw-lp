import fs from 'node:fs/promises';
const sources = [
 ['deped-orders','https://www.deped.gov.ph/category/issuances/deped-orders/'],
 ['matatag','https://www.deped.gov.ph/matatag-curriculum/'],
 ['codex-skills','https://developers.openai.com/codex/skills/'],
 ['openai-skills','https://raw.githubusercontent.com/openai/skills/main/README.md']
];
await fs.mkdir('research-cache',{recursive:true});
for (const [id,url] of sources) {
 try { const r=await fetch(url,{signal:AbortSignal.timeout(15000)}); if(!r.ok) throw Error(`HTTP ${r.status}`);
 const text=await r.text(); await fs.writeFile(`research-cache/${id}.html`,text);
 console.log(`${id}: retrieved, NOT yet verified`);
 } catch(e) {console.error(`${id}: unavailable (${e.name})`); process.exitCode=1;}
}
