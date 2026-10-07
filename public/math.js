// A bounded notation renderer. It does not prove a solution or interpret arbitrary TeX.
const symbols={times:'×',div:'÷',cdot:'·',pm:'±',le:'≤',leq:'≤',ge:'≥',geq:'≥',ne:'≠',neq:'≠',pi:'π',theta:'θ',alpha:'α',beta:'β',infty:'∞',approx:'≈'};
export function parseMath(source){
 if(typeof source!=='string'||source.length>2000)throw Error('Mathematical expression exceeds the supported length');let i=0;
 const group=depth=>{while(/\s/.test(source[i]||'')&&i<source.length)i++;if(source[i++]!=='{')throw Error('Use braces around fraction, root and script groups');return sequence(depth+1,true);};
 const atom=depth=>{
  if(source[i]==='{'){i++;return sequence(depth+1,true);}
  if(source[i]==='\\'){i++;const command=source.slice(i).match(/^[a-zA-Z]+/)?.[0];if(!command)throw Error('Unsupported mathematical escape');i+=command.length;
   if(command==='frac')return {type:'frac',children:[group(depth),group(depth)]};if(command==='sqrt')return {type:'sqrt',children:[group(depth)]};
   if(command==='text'){while(/\s/.test(source[i]||'')&&i<source.length)i++;if(source[i++]!=='{')throw Error('Use braces for text');const end=source.indexOf('}',i);if(end<0||/[{}\\]/.test(source.slice(i,end)))throw Error('Unsupported text group');const value=source.slice(i,end);i=end+1;return {type:'text',value};}
   if(Object.hasOwn(symbols,command))return {type:/[αβθπ]/.test(symbols[command])?'identifier':'operator',value:symbols[command]};throw Error(`Unsupported math command: ${command}`);
  }
  const number=source.slice(i).match(/^\d+(?:\.\d+)?/)?.[0];if(number){i+=number.length;return {type:'number',value:number};}
  const value=source[i++];if(value==='}'||value==='_'||value==='^')throw Error('Unbalanced mathematical group or script');return {type:/[A-Za-zα-ωΑ-Ω]/u.test(value)?'identifier':'operator',value};
 };
 const sequence=(depth=0,closing=false)=>{
  if(depth>20)throw Error('Mathematical nesting exceeds the supported depth');const children=[];
  while(i<source.length){if(/\s/.test(source[i])){i++;continue;}if(source[i]==='}'){if(!closing)throw Error('Unexpected closing brace');i++;if(!children.length)throw Error('Empty mathematical group');return {type:'row',children};}
   if(source[i]==='^'||source[i]==='_'){const type=source[i++]==='^'?'sup':'sub';const base=children.pop();if(!base)throw Error('A script needs a base');while(/\s/.test(source[i]||'')&&i<source.length)i++;if(i>=source.length)throw Error('Missing script');const script=source[i]==='{'?group(depth):source[i]==='\\'?atom(depth+1):parseMath(source[i++]);if(['sup','sub','scripts'].includes(base.type)){if(base.type===type||base.type==='scripts')throw Error('Repeated script needs explicit grouping');children.push({type:'scripts',children:[base.children[0],type==='sub'?script:base.children[1],type==='sup'?script:base.children[1]]});}else children.push({type,children:[base,script]});
   }else children.push(atom(depth));
  }
  if(closing)throw Error('Missing closing brace');if(!children.length)throw Error('Empty mathematical expression');return {type:'row',children};
 };return sequence();
}
export function mathSegments(text){const source=String(text??'');const result=[];const pattern=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;let start=0;for(const match of source.matchAll(pattern)){if(match.index>start)result.push({type:'text',value:source.slice(start,match.index)});const content=match[1]??match[2]??match[3];try{result.push({type:'math',source:content,raw:match[0],tree:parseMath(content),display:match[2]!=null||match[3]!=null});}catch(e){result.push({type:'math',source:content,raw:match[0],error:e.message});}start=match.index+match[0].length;}if(start<source.length||!result.length)result.push({type:'text',value:source.slice(start)});return result;}
export const mathTags={row:'mrow',frac:'mfrac',sqrt:'msqrt',sup:'msup',sub:'msub',scripts:'msubsup',text:'mtext',number:'mn',identifier:'mi',operator:'mo'};
const escape=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function mathML(tree){const tag=mathTags[tree.type];return `<${tag}>${tree.children?tree.children.map(mathML).join(''):escape(tree.value)}</${tag}>`;}
export function plainTree(tree){const c=tree.children?.map(plainTree)||[];if(tree.type==='row')return c.join('');if(tree.type==='frac')return `(${c[0]})/(${c[1]})`;if(tree.type==='sqrt')return `√(${c[0]})`;if(tree.type==='sup')return `${c[0]}^(${c[1]})`;if(tree.type==='sub')return `${c[0]}_(${c[1]})`;if(tree.type==='scripts')return `${c[0]}_(${c[1]})^(${c[2]})`;return tree.value;}
export function plainMath(text){return mathSegments(text).map(s=>s.type==='text'?s.value:s.tree?plainTree(s.tree):s.raw).join('');}
export function mathHTML(text){return mathSegments(text).map(s=>s.type==='text'?escape(s.value):s.tree?`<math xmlns="http://www.w3.org/1998/Math/MathML" display="${s.display?'block':'inline'}" aria-label="${escape(s.source)}">${mathML(s.tree)}</math>`:escape(s.raw)).join('');}
export function officeMath(tree){const c=tree.children?.map(officeMath)||[];if(tree.type==='row')return c.join('');if(tree.type==='frac')return `<m:f><m:num>${c[0]}</m:num><m:den>${c[1]}</m:den></m:f>`;if(tree.type==='sqrt')return `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${c[0]}</m:e></m:rad>`;if(tree.type==='sup'||tree.type==='sub'){const tag=tree.type==='sup'?'sSup':'sSub';return `<m:${tag}><m:e>${c[0]}</m:e><m:${tree.type}>${c[1]}</m:${tree.type}></m:${tag}>`;}if(tree.type==='scripts')return `<m:sSubSup><m:e>${c[0]}</m:e><m:sub>${c[1]}</m:sub><m:sup>${c[2]}</m:sup></m:sSubSup>`;return `<m:r><m:t xml:space="preserve">${escape(tree.value)}</m:t></m:r>`;}
export function wordMathRuns(text){return mathSegments(text).map(s=>s.type==='math'&&s.tree?`<m:oMath>${officeMath(s.tree)}</m:oMath>`:`<w:r><w:t xml:space="preserve">${escape(s.type==='text'?s.value:s.raw).replace(/\n/g,'</w:t><w:br/><w:t xml:space="preserve">')}</w:t></w:r>`).join('');}
