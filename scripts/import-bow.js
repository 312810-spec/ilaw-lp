import fs from 'node:fs';
import {validateRecord} from '../src/curriculum.js';
import {validateBOW} from '../src/bow.js';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node scripts/import-bow.js reviewed-rows.json output.json');
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(rows))throw Error('Expected an array of reviewed BOW competency rows');
const ids=new Set();for(const row of rows){validateBOW(row,validateRecord);if(ids.has(row.id))throw Error('Duplicate BOW id');ids.add(row.id);}
fs.writeFileSync(output,JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
console.log(`Validated ${rows.length} BOW rows. Set ILAW_BOW_FILE to the output path and restart.`);
