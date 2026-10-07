export const exportImages=(plan,options={})=>(plan.exportAssets||[]).filter(a=>options.materials!=='learner'||a.audience==='learner');
export const imageCaption=a=>`${a.audience==='teacher'?'Teacher only / answer-key visual: ':''}${a.caption||'Lesson image'}\nDescription: ${a.description||a.alt}\nAttribution: ${a.attribution||'Teacher supplied'}\nRights / source: ${a.rights}`;
