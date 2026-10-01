import {Readable} from 'node:stream';
import {EventEmitter} from 'node:events';
// Exercise the application's actual HTTP request listener without opening a socket.
// This environment denies both TCP and Unix listen. Production still uses Node HTTP.
export function dispatch(app,{method='GET',url='/',headers={},body}={}){
 return new Promise((resolve,reject)=>{
  const req=Readable.from(body==null?[]:[typeof body==='string'?body:JSON.stringify(body)]);
  req.method=method;req.url=url;req.headers={host:'localhost:3000',...(body?{'content-type':'application/json'}:{}),...Object.fromEntries(Object.entries(headers).map(([k,v])=>[k.toLowerCase(),v]))};req.socket={remoteAddress:'127.0.0.1'};
  const res=new EventEmitter();const resultHeaders={};res.headersSent=false;res.setHeader=(k,v)=>{if(res.headersSent)throw Error('Headers already sent');resultHeaders[k.toLowerCase()]=v;};res.writeHead=(status,values={})=>{res.statusCode=status;for(const [k,v]of Object.entries(values))res.setHeader(k,v);res.headersSent=true;};res.end=bytes=>{const data=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes||'');resolve({status:res.statusCode||200,headers:resultHeaders,bytes:data,text:data.toString(),json:()=>JSON.parse(data.toString())});};
  try{app.server.emit('request',req,res);}catch(e){reject(e);}
 });
}
export async function teacher(app,email='teacher@example.test'){
 const response=await dispatch(app,{method:'POST',url:'/api/auth/register',headers:{origin:'http://localhost:3000'},body:{name:'Teacher',email,password:'a long test password 123'}});
 if(response.status!==201)throw Error(response.text);const data=response.json();const cookie=response.headers['set-cookie'].split(';')[0];return {user:data.user,headers:{cookie,'x-csrf-token':data.csrf,origin:'http://localhost:3000'}};
}
export async function waitJob(app,id,headers){for(let i=0;i<500;i++){const result=await dispatch(app,{url:`/api/jobs/${id}`,headers});const job=result.json();if(job.status==='completed'||job.status==='failed')return job;await new Promise(r=>setTimeout(r,5));}throw Error('Job did not complete');}
