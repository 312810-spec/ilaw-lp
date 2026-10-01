export class ValidationError extends Error { constructor(message){super(message);this.name='ValidationError';this.status=400;} }
const str=(max=3000,min=1)=>({type:'string',minLength:min,maxLength:max});
const arr=(items,max=30,min=0)=>({type:'array',items,minItems:min,maxItems:max});
const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const ids=arr(str(60),6,1);
export const objectiveSchema=obj({id:str(60),text:str(),criterion:str(),evidence:str(),prerequisite:str()});
export const activitySchema=obj({id:str(60),title:str(200),minutes:{type:'integer',minimum:1,maximum:240},teacher:str(),learners:str(),materials:arr(str(200),12),check:str(),transition:str(),objectiveIds:ids,supports:str()});
export const assessmentSchema=obj({id:str(60),title:str(200),method:str(200),prompt:str(5000),answerKey:str(5000),rubric:str(),misconception:str(),objectiveIds:ids});
export const waysSchema=obj({id:str(60),pathway:{...str(30),enum:['support','developing','mastery','extension']},evidence:str(),condition:str(),response:str(),nextSession:str(),objectiveIds:ids});
export const differentiationSchema=obj({support:str(),language:str(),extension:str(),accessibility:str()});
export const stages={
 unpack:obj({focus:str(),components:arr(str(),12,1),prerequisites:arr(str(),10,1),misconceptions:arr(str(),10,1),scopeNote:str()}),
 context:obj({needs:arr(str(),10,1),resourcePlan:str(),approach:str(200),rationale:str()}),
 outcomes:obj({sessions:arr(obj({id:str(60),title:str(200),keyConcept:str(),objectives:arr(objectiveSchema,3,1)}),5,1)}),
 assessment:obj({sessions:arr(obj({id:str(60),assessment:arr(assessmentSchema,8,1)}),5,1)}),
 experiences:obj({sessions:arr(obj({id:str(60),experiences:arr(activitySchema,12,1)}),5,1)}),
 differentiation:obj({sessions:arr(obj({id:str(60),differentiation:differentiationSchema}),5,1)}),
 ways:obj({sessions:arr(obj({id:str(60),ways:arr(waysSchema,8,1)}),5,1)}),
 review:obj({strengths:arr(str(),8),concerns:arr(str(),8),teacherReview:str()})
};
export const sessionSchema=obj({id:str(60),title:str(200),keyConcept:str(),objectives:arr(objectiveSchema,3,1),assessment:arr(assessmentSchema,8,1),experiences:arr(activitySchema,12,1),differentiation:differentiationSchema,ways:arr(waysSchema,8,1)});
export function validate(value,schema,path='input'){
 if(schema.type==='object'){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new ValidationError(`${path} must be an object`);
  for(const k of schema.required||[])if(!(k in value))throw new ValidationError(`${path}.${k} is required`);
  if(schema.additionalProperties===false)for(const k of Object.keys(value))if(!(k in schema.properties))throw new ValidationError(`${path}.${k} is not allowed`);
  for(const [k,s] of Object.entries(schema.properties||{}))if(k in value)validate(value[k],s,`${path}.${k}`);
 }else if(schema.type==='array'){
  if(!Array.isArray(value)||value.length<(schema.minItems||0)||value.length>(schema.maxItems||100))throw new ValidationError(`${path} has an invalid number of items`);
  value.forEach((v,i)=>validate(v,schema.items,`${path}[${i}]`));
 }else if(schema.type==='string'){
  if(typeof value!=='string'||value.trim().length<(schema.minLength||0)||value.length>(schema.maxLength||10000))throw new ValidationError(`${path} must be text (${schema.minLength||0}–${schema.maxLength||10000} characters)`);
 }else if(schema.type==='integer'){
  if(!Number.isInteger(value)||value<schema.minimum||value>schema.maximum)throw new ValidationError(`${path} is outside the supported range`);
 }else if(schema.type==='boolean'&&typeof value!=='boolean')throw new ValidationError(`${path} must be true or false`);
 if(schema.enum&&!schema.enum.includes(value))throw new ValidationError(`${path} has an unsupported value`);
 return value;
}
export const resources=['board','textbook','worksheets','printer','manipulatives','projector','internet','phones','computers','laboratory'];
export const curricula=['Teacher-selected / verify applicability','MATATAG','Revised K–10','K–12 legacy','Strengthened SHS'];
export const inputSchema=obj({schoolName:str(200,0),section:str(100,0),teacherName:str(200,0),checkedBy:str(200,0),notedBy:str(200,0),lessonReferences:str(4000,0),schoolYear:str(30),curriculum:{...str(100),enum:curricula},grade:{type:'integer',minimum:1,maximum:12},subject:str(100),term:str(40),week:{type:'integer',minimum:1,maximum:52},duration:{type:'integer',minimum:20,maximum:180},sessions:{type:'integer',minimum:1,maximum:5},competencyId:str(100,0),competency:str(4000),contentStandard:str(4000,0),performanceStandard:str(4000,0),classSize:{type:'integer',minimum:1,maximum:100},readiness:{...str(40),enum:['Mixed readiness','Beginning','Developing','Ready','Advanced']},priorKnowledge:str(2000,0),difficulty:str(2000,0),language:str(100),support:str(2000,0),advanced:str(2000,0),resources:arr({...str(30),enum:resources},resources.length,1),offline:{type:'boolean'},lowResource:{type:'boolean'},approach:str(100),grouping:str(100),assessmentPreference:str(200),localContext:str(1000,0),instructions:str(2000,0),mode:{...str(20),enum:['guided','ai']}});
export function normalizeInput(v){
 const defaults={schoolName:'',section:'',teacherName:'',checkedBy:'',notedBy:'',lessonReferences:'',schoolYear:'2026–2027',curriculum:curricula[0],grade:5,subject:'Mathematics',term:'Quarter 1',week:1,duration:45,sessions:1,competencyId:'',competency:'',contentStandard:'',performanceStandard:'',classSize:40,readiness:'Mixed readiness',priorKnowledge:'',difficulty:'',language:'English and Filipino',support:'',advanced:'',resources:['board'],offline:true,lowResource:true,approach:'Recommend an approach',grouping:'Pairs',assessmentPreference:'Recommend evidence',localContext:'',instructions:'',mode:'guided'};
 return validate({...defaults,...v},inputSchema);
}
export function validateSessions(sessions,expected){
 validate(sessions,arr(sessionSchema,5,1),'lesson.sessions');
 if(sessions.length!==expected)throw new ValidationError('The number of sessions does not match the class context');
 const all=new Set();
 for(const session of sessions){for(const node of [session,...session.objectives,...session.experiences,...session.assessment,...session.ways]){if(all.has(node.id))throw new ValidationError(`Duplicate graph ID: ${node.id}`);all.add(node.id);}}
 return sessions;
}
