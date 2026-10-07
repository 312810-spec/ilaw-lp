import {plainMath} from '../public/math.js';
import fs from 'node:fs';
import {deflateSync} from 'node:zlib';
import {documentBlocks} from './exports.js';
import {ValidationError} from './schema.js';
const font=fs.readFileSync(new URL('../assets/fonts/DejaVuSans.ttf',import.meta.url));
const tables={};for(let i=0;i<font.readUInt16BE(4);i++){const p=12+i*16;tables[font.toString('ascii',p,p+4)]=font.readUInt32BE(p+8);}
const units=font.readUInt16BE(tables.head+18),metrics=font.readUInt16BE(tables.hhea+34);
const cmap=tables.cmap;const subtables=[];for(let i=0;i<font.readUInt16BE(cmap+2);i++){const p=cmap+4+i*8,offset=cmap+font.readUInt32BE(p+4);if([4,12].includes(font.readUInt16BE(offset)))subtables.push(offset);}
subtables.sort((a,b)=>font.readUInt16BE(b)-font.readUInt16BE(a));
function glyph(code){
 for(const offset of subtables){
  if(font.readUInt16BE(offset)===12){const groups=font.readUInt32BE(offset+12);for(let i=0;i<groups;i++){const p=offset+16+i*12,start=font.readUInt32BE(p),end=font.readUInt32BE(p+4);if(code>=start&&code<=end)return font.readUInt32BE(p+8)+code-start;if(start>code)break;}}
  else if(code<=65535){const n=font.readUInt16BE(offset+6)/2,ends=offset+14,starts=ends+2*n+2,deltas=starts+2*n,ranges=deltas+2*n;for(let i=0;i<n;i++){const end=font.readUInt16BE(ends+2*i);if(code>end)continue;if(code<font.readUInt16BE(starts+2*i))break;const delta=font.readInt16BE(deltas+2*i),range=font.readUInt16BE(ranges+2*i);if(!range)return (code+delta)&65535;const g=font.readUInt16BE(ranges+2*i+range+2*(code-font.readUInt16BE(starts+2*i)));return g?(g+delta)&65535:0;}}
 }return 0;
}
const width=code=>font.readUInt16BE(tables.hmtx+4*Math.min(glyph(code),metrics-1))/units*1000;
const hex=n=>n.toString(16).padStart(4,'0');
export function exportPDF(plan,options={}){
 const blocks=documentBlocks(plan,options).map(block=>({...block,text:plainMath(block.text)}));const characters=new Set('0123456789Page / ');
 for(const b of blocks)for(const c of b.text.replace(/[\r\n\t]/g,' ')){if(!glyph(c.codePointAt(0)))throw new ValidationError(`PDF font does not support character U+${c.codePointAt(0).toString(16).toUpperCase()}. Use DOCX or browser print for this content.`);characters.add(c);}
 const chars=[...characters],cid=new Map(chars.map((c,i)=>[c,i+1]));const encode=s=>[...s].map(c=>hex(cid.get(c))).join('');
 const measure=(s,size)=>[...s].reduce((sum,c)=>sum+width(c.codePointAt(0))*size/1000,0);
 const wrap=(text,size)=>{const lines=[];for(const paragraph of text.replace(/\r/g,'').replace(/\t/g,' ').split('\n')){let line='';for(const word of paragraph.split(/ +/)){const candidate=line?line+' '+word:word;if(measure(candidate,size)<=503){line=candidate;continue;}if(line)lines.push(line);line='';for(const c of word){if(measure(line+c,size)>503&&line){lines.push(line);line='';}line+=c;}}lines.push(line);}return lines;};
 const pages=[];let commands=[],y=796;const flush=()=>{pages.push(commands.join('\n'));commands=[];y=796;};
 for(const b of blocks){const size=({Title:20,Heading1:16,Heading2:13,Heading3:11.5})[b.style]||10.5,leading=size*1.45;const lines=wrap(b.text,size);if(b.style!=='Normal'){if(y<46+leading*3)flush();y-=8;}
  for(const line of lines){if(y<55+leading)flush();commands.push(`BT /F1 ${size} Tf 1 0 0 1 46 ${y.toFixed(2)} Tm <${encode(line)}> Tj ET`);y-=leading;}y-=5;
 }if(commands.length)flush();
 const objects=[];const reserve=()=>{objects.push(null);return objects.length;};const set=(id,bytes)=>objects[id-1]=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);const add=bytes=>{const id=reserve();set(id,bytes);return id;};
 const stream=(bytes,extra='')=>{const compressed=deflateSync(bytes);return Buffer.concat([Buffer.from(`<< /Length ${compressed.length} /Filter /FlateDecode ${extra} >>\nstream\n`),compressed,Buffer.from('\nendstream')]);};
 const catalog=reserve(),pageTree=reserve();const fontFile=add(stream(font,`/Length1 ${font.length}`));
 const bbox=[36,38,40,42].map(n=>Math.round(font.readInt16BE(tables.head+n)/units*1000)).join(' ');
 const descriptor=add(`<< /Type /FontDescriptor /FontName /DejaVuSans /Flags 32 /FontBBox [${bbox}] /ItalicAngle 0 /Ascent 928 /Descent -236 /CapHeight 730 /StemV 80 /FontFile2 ${fontFile} 0 R >>`);
 const gid=Buffer.alloc((chars.length+1)*2);chars.forEach((c,i)=>gid.writeUInt16BE(glyph(c.codePointAt(0)),(i+1)*2));const gidId=add(stream(gid));
 const descendant=add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /DejaVuSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /CIDToGIDMap ${gidId} 0 R /W [1 [${chars.map(c=>Math.round(width(c.codePointAt(0)))).join(' ')}]] >>`);
 const mappings=chars.map((c,i)=>`<${hex(i+1)}> <${Buffer.from(c,'utf16le').swap16().toString('hex')}>`);const groups=[];for(let i=0;i<mappings.length;i+=100){const group=mappings.slice(i,i+100);groups.push(`${group.length} beginbfchar\n${group.join('\n')}\nendbfchar`);}
 const unicode=add(stream(Buffer.from(`/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def /CMapName /ILAWUnicode def /CMapType 2 def 1 begincodespacerange <0000> <FFFF> endcodespacerange\n${groups.join('\n')}\nendcmap CMapName currentdict /CMap defineresource pop end end`)));
 const type0=add(`<< /Type /Font /Subtype /Type0 /BaseFont /DejaVuSans /Encoding /Identity-H /DescendantFonts [${descendant} 0 R] /ToUnicode ${unicode} 0 R >>`);
 const pageIds=pages.map((content,i)=>{content+=`\nBT /F1 9 Tf 1 0 0 1 46 30 Tm <${encode(`Page ${i+1} / ${pages.length}`)}> Tj ET`;const contents=add(stream(Buffer.from(content)));return add(`<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${type0} 0 R >> >> /Contents ${contents} 0 R >>`);});
 set(pageTree,`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] >>`);set(catalog,`<< /Type /Catalog /Pages ${pageTree} 0 R >>`);
 const chunks=[Buffer.from('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n','latin1')],offsets=[0];let position=chunks[0].length;objects.forEach((value,i)=>{offsets.push(position);const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),value,Buffer.from('\nendobj\n')]);chunks.push(chunk);position+=chunk.length;});
 chunks.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${position}\n%%EOF\n`));return Buffer.concat(chunks);
}
