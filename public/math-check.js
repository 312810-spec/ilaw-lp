import {parseMath} from './math.js';
// Exact bounded rational arithmetic; no evaluation of JavaScript or universal proofs.
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){[a,b]=[b,a%b];}return a;};
const rat=(n,d=1n)=>{if(!d)throw Error('Division by zero');if(d<0n){n=-n;d=-d;}if(n.toString().length>160||d.toString().length>160)throw Error('Arithmetic exceeds the supported size');const g=gcd(n,d);return {n:n/g,d:d/g};};
const add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>rat(a.n*b.n,a.d*b.d),neg=a=>rat(-a.n,a.d);
const power=(a,e)=>{if(e.d!==1n||e.n<-8n||e.n>8n)throw Error('Only integer powers from −8 to 8 are checked');return e.n<0n?rat(a.d**(-e.n),a.n**(-e.n)):rat(a.n**e.n,a.d**e.n);};
const decimal=value=>{if(!/^\d+(?:\.\d+)?$/.test(value))throw Error('Unsupported number');const parts=value.split('.');return rat(BigInt(parts.join('')),10n**BigInt(parts[1]?.length||0));};
const root=n=>{if(n<0n)throw Error('A real square root requires a nonnegative value');let low=0n,high=n+1n;while(high-low>1n){const mid=(low+high)/2n;if(mid*mid<=n)low=mid;else high=mid;}if(low*low!==n)throw Error('Only exact rational square roots are checked');return low;};
function calculate(tree,variables={}){
 if(tree.type==='number')return decimal(tree.value);
 if(tree.type==='identifier'){if(!Object.hasOwn(variables,tree.value))throw Error('Variables need explicitly supplied values');const value=String(variables[tree.value]);if(!/^-?\d+(?:\.\d+)?$/.test(value)||value.length>40)throw Error('Supply a bounded numeric variable value');return value[0]==='-'?neg(decimal(value.slice(1))):decimal(value);}
 if(tree.type==='frac'){const a=calculate(tree.children[0],variables),b=calculate(tree.children[1],variables);return rat(a.n*b.d,a.d*b.n);}
 if(tree.type==='sqrt'){const a=calculate(tree.children[0],variables);return rat(root(a.n),root(a.d));}
 if(tree.type==='sup')return power(calculate(tree.children[0],variables),calculate(tree.children[1],variables));
 if(tree.type!=='row')throw Error('Unsupported arithmetic construct');
 const tokens=tree.children;let index=0,steps=0;
 const operator=node=>node?.type==='operator'?node.value:null;
 const atom=()=>{if(++steps>1000)throw Error('Too many arithmetic steps');const op=operator(tokens[index]);if(op==='+'||op==='-'||op==='−'){index++;const v=atom();return op==='+'?v:neg(v);}if(op==='('){index++;const v=expression();if(operator(tokens[index++])!==')')throw Error('Unbalanced parentheses');return v;}const t=tokens[index++];if(!t)throw Error('Missing operand');return calculate(t,variables);};
 const product=()=>{let a=atom();while(index<tokens.length){const op=operator(tokens[index]);if(['×','*','·','÷','/'].includes(op)){index++;const b=atom();a=['÷','/'].includes(op)?rat(a.n*b.d,a.d*b.n):mul(a,b);}else if(tokens[index]?.type!=='operator'||op==='('){a=mul(a,atom());}else break;}return a;};
 const expression=()=>{let a=product();while(['+','-','−'].includes(operator(tokens[index]))){const op=operator(tokens[index++]),b=product();a=add(a,op==='+'?b:neg(b));}return a;};
 const result=expression();if(index!==tokens.length)throw Error('Unsupported operator or statement');return result;
}
const format=r=>r.d===1n?r.n.toString():`${r.n}/${r.d}`;
export function checkMathStatement(source,{variables={}}={}){
 try{const tree=parseMath(source);const comparisons=tree.children.map((n,i)=>n.type==='operator'&&['=','<','>','≤','≥','≠'].includes(n.value)?i:-1).filter(i=>i>=0);if(comparisons.length!==1)throw Error('Check one explicit equality or inequality at a time');const at=comparisons[0],op=tree.children[at].value;
  const left=calculate({type:'row',children:tree.children.slice(0,at)},variables),right=calculate({type:'row',children:tree.children.slice(at+1)},variables);const delta=left.n*right.d-right.n*left.d;const correct={'=':delta===0n,'≠':delta!==0n,'<':delta<0n,'>':delta>0n,'≤':delta<=0n,'≥':delta>=0n}[op];
  return {status:'arithmetic-checked',correct,left:format(left),right:format(right),relation:op,notice:'Exact arithmetic under the supplied numeric values. This does not verify the interpretation, units, word problem or complete answer key.'};
 }catch(e){return {status:'teacher-review-required',correct:null,reason:e.message,notice:'The original expression is preserved; no correctness claim is made.'};}
}
