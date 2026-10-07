import {randomUUID} from 'node:crypto';
import {ValidationError} from './schema.js';
import {retimePlan} from './engine.js';
import {qualityCheck} from './quality.js';
export function adaptPlan(plan,body){
 if(typeof body.section!=='string'||!body.section.trim()||body.section.length>100)throw new ValidationError('Name the new class/section (up to 100 characters)');
 if(typeof body.context!=='string'||body.context.length>2000)throw new ValidationError('Provide anonymous class adaptation context (up to 2000 characters)');
 const copy=body.duration==null?structuredClone(plan):retimePlan(plan,body.duration);
 copy.id=randomUUID();copy.input.section=body.section.trim();copy.input.instructions=body.context;copy.title=`${plan.title.slice(0,170)} (${body.section.trim().slice(0,25)})`;delete copy.reflections;delete copy.evidenceSummary;delete copy.exportAssets;
 copy.metadata={...copy.metadata,status:'draft',teacherReviewedAt:null,createdAt:new Date().toISOString(),ancestry:{parentPlanId:plan.id,parentRevision:plan.revision,kind:'class-adaptation',notice:'Copied instructional content; new class context requires teacher adaptation and review.'}};copy.quality=qualityCheck(copy);return copy;
}
