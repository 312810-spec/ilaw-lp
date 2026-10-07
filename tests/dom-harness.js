import {revisionText} from '../public/revision-text.js';
import {mathSegments,mathTags} from '../public/math.js';
// A minimal DOM test double for functional JS smoke tests. This is NOT a browser,
// accessibility audit or visual/layout proof; tests/browser.js supplies those checks.
import vm from 'node:vm';import fs from 'node:fs';import {dispatch} from './helpers.js';
class Node {
 constructor(tag='#text',text=''){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.parentNode=null;this._text=text;this.value='';this.checked=false;this.disabled=false;this.className='';this.document=null;}
 append(...nodes){for(let node of nodes){if(!(node instanceof Node))node=new Node('#text',String(node));node.parentNode=this;node.document=this.document;this.children.push(node);}}
 replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.className=String(v);}
 getAttribute(k){return k==='class'?this.className:this.attrs[k];}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 set textContent(v){this.children=[];this._text=String(v);}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
 removeEventListener(k,fn){this.listeners[k]=(this.listeners[k]||[]).filter(x=>x!==fn);}
 get classList(){return {add:v=>this.className=[...new Set([...this.className.split(' '),v])].join(' '),remove:v=>this.className=this.className.split(' ').filter(x=>x!==v).join(' ')};}
 descendants(){return this.children.flatMap(c=>[c,...c.descendants()]);}
 matches(selector){
  if(selector.includes(' ')){const parts=selector.split(' ');if(!this.matches(parts.pop()))return false;let p=this.parentNode;while(p){if(p.matches(parts.join(' ')))return true;p=p.parentNode;}return false;}
  if(selector.includes(':not(:disabled)')){if(this.disabled)return false;selector=selector.replace(':not(:disabled)','');}
  const attrs=[...selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];selector=selector.replace(/\[[^\]]+\]/g,'');for(const [,key,value]of attrs){if(this.attrs[key]==null||value!==undefined&&this.attrs[key]!==value)return false;}
  const id=selector.match(/#([\w-]+)/)?.[1];if(id&&this.attrs.id!==id)return false;
  const classes=[...selector.matchAll(/\.([\w-]+)/g)].map(x=>x[1]);if(classes.some(c=>!this.className.split(' ').includes(c)))return false;
  const tag=selector.match(/^[\w-]+/)?.[0];return !tag||tag.toUpperCase()===this.tagName;
 }
 querySelectorAll(s){const choices=s.split(',').map(x=>x.trim());return this.descendants().filter(n=>choices.some(c=>n.matches(c)));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 focus(){if(this.document)this.document.activeElement=this;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
 click(){this.document.downloads??=[];if(this.tagName==='A'&&this.attrs.download)this.document.downloads.push({...this.attrs});return this.emit('click');}
 scrollIntoView(){}
 reportValidity(){return this.querySelectorAll('input, textarea, select').every(n=>!n.attrs.required||String(n.value).trim().length>0);}
 async emit(type,event={}){const e={target:this,preventDefault(){},...event};for(const fn of this.listeners[type]||[])await fn(e);}
}
class Doc extends Node {
 constructor(){super('document');this.document=this;this.body=this;this.activeElement=null;this.append(this.make('div','app'),this.make('div','toast'),this.make('div','modal-root'));}
 make(tag,id){const n=this.createElement(tag);n.setAttribute('id',id);return n;}
 createElementNS(namespace,tag){return this.createElement(tag);}
 createElement(tag){const n=new Node(tag);n.document=this;return n;}
 createTextNode(text){const n=new Node('#text',text);n.document=this;return n;}
}
export async function clientHarness(app,options={}){
 const document=new Doc();const local=options.local||new Map();let cookie=options.cookie||'',hash=options.hash||'';const window=new Node('window');const location={get hash(){return hash;},set hash(v){hash=v.startsWith('#')?v:'#'+v;queueMicrotask(()=>window.emit('hashchange').catch(console.error));}};
 const sandbox={revisionText,mathSegments,mathTags,Node,document,window,location,navigator:{onLine:true},localStorage:{setItem:(k,v)=>local.set(k,v),getItem:k=>local.get(k)||null,removeItem:k=>local.delete(k)},console,URL,Date,Math,JSON,Set,Map,Error,Number,String,Boolean,Blob,crypto,structuredClone,setTimeout,clearTimeout,queueMicrotask,
  FormData:class {constructor(form){this.fields=Object.fromEntries(form.querySelectorAll('input,textarea,select').map(n=>[n.attrs.name,n.value]));}get(k){return this.fields[k];}},
  fetch:async(url,options={})=>{const r=await dispatch(app,{url,method:options.method,headers:{...options.headers,...(cookie?{cookie}:{}),...(options.method&&options.method!=='GET'?{origin:'http://localhost:3000'}:{})},body:options.body});if(r.headers['set-cookie'])cookie=r.headers['set-cookie'].split(';')[0];return {ok:r.status>=200&&r.status<300,status:r.status,json:async()=>r.json(),blob:async()=>new Blob([r.bytes],{type:r.headers['content-type']})};}
 };
 const source=fs.readFileSync('public/app.js','utf8').replace(/^import .*?;\n/gm,'');const context=vm.createContext(sandbox);await vm.runInContext(`(async()=>{${source}\nglobalThis.testAPI={state,newLesson,openRoute,saveNow,renderEditor,renderWizard,showVersions,showExport,reviewPlan,confirmRegenerate,closeModal};})()`,context);
 return {document,api:context.testAPI,local,sessionCookie:()=>cookie,async flush(){await new Promise(r=>setTimeout(r,20));},field(label){const container=document.querySelectorAll('.field').find(n=>n.querySelector('label')?.textContent===label);return container?.querySelector('input,textarea,select');},button(text){return document.querySelectorAll('button').find(n=>n.textContent===text);}};
}
