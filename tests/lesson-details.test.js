import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInput} from '../src/schema.js';
import {generateGuided,regenerateGuided} from '../src/engine.js';
import {examples} from '../src/curriculum.js';
import {documentBlocks,exportDOCX,exportHTML} from '../src/exports.js';

test('school details and references survive generation, revision and escaped exports',async()=>{
 const r=examples[1];
 const details={schoolName:'School <North> & South',section:'Kindness',teacherName:'Teacher Example, Teacher I',checkedBy:'Checker Example, Master Teacher II',notedBy:'Head Example, Principal I',lessonReferences:'Teacher-selected textbook, p. 12\nLAS: equivalent fractions'};
 const p=await generateGuided({grade:r.grade,subject:r.subject,competencyId:r.id,competency:r.competency,term:'Term 3',...details});
 const revised=await regenerateGuided(p,{sessionId:p.sessions[0].id,section:'experiences'});
 for(const [key,value] of Object.entries(details)){assert.equal(revised.input[key],value);assert.ok(documentBlocks(revised).some(b=>b.text.includes(value)));}
 assert.equal(revised.source.source.status,'practice');
 const html=exportHTML(revised);assert.ok(html.includes('School &lt;North&gt; &amp; South'));assert.ok(!html.includes('School <North>'));
 assert.ok(exportDOCX(revised).includes(Buffer.from('School &lt;North&gt; &amp; South')));
});

test('old inputs receive optional empty details; invalid and oversized details fail validation',()=>{
 assert.equal(normalizeInput({competency:'A valid teacher competency'}).teacherName,'');
 assert.throws(()=>normalizeInput({competency:'A valid teacher competency',lessonReferences:'x'.repeat(4001)}));
 assert.throws(()=>normalizeInput({competency:'A valid teacher competency',checkedBy:42}));
});
