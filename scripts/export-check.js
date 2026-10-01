import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {examples} from '../src/curriculum.js';import {generateGuided} from '../src/engine.js';import {exportDOCX,exportHTML} from '../src/exports.js';
await fs.mkdir('test-results',{recursive:true});
for(const record of examples){const plan=await generateGuided({grade:record.grade,subject:record.subject,competencyId:record.id,competency:record.competency,duration:record.grade===1?40:60,sessions:record.grade===5?3:1});await fs.writeFile(`test-results/${record.id}.json`,JSON.stringify(plan,null,2));await fs.writeFile(`test-results/${record.id}.docx`,exportDOCX(plan));await fs.writeFile(`test-results/${record.id}.html`,exportHTML(plan));}
const python=spawnSync('python',['-c',`import zipfile, glob, xml.etree.ElementTree as ET
for name in glob.glob('test-results/*.docx'):
 with zipfile.ZipFile(name) as z:
  assert z.testzip() is None, 'ZIP CRC failure'
  for entry in z.namelist():
   if entry.endswith(('.xml','.rels')): ET.fromstring(z.read(entry))
  text=z.read('word/document.xml').decode()
  for section in ['Intentions','Learning Experiences','Assessing Learning','Ways Forward','Source status','Current DepEd policy']: assert section in text, (name, section)
  assert 'DEpEd approved' not in text
  print(name + ': ZIP CRC, XML and sections valid')
`],{encoding:'utf8'});process.stdout.write(python.stdout);process.stderr.write(python.stderr);if(python.status)process.exitCode=1;
