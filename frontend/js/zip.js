
export const CRC32_TABLE=(()=>{const table=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);table[i]=c>>>0;}return table;})();
export function calculateCRC32(data){let crc=0xFFFFFFFF;for(let i=0;i<data.length;i++)crc=(crc>>>8)^CRC32_TABLE[(crc^data[i])&0xFF];return (crc^0xFFFFFFFF)>>>0;}
export async function deflateBytes(bytes){
  if(typeof CompressionStream==="undefined")return null;
  try{
    const source=new Blob([bytes]);
    const input=typeof source.stream==="function"?source.stream():new Response(bytes).body;
    const compressed=input.pipeThrough(new CompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(compressed).arrayBuffer());
  }catch(error){return null;}
}
function dosDateTime(date=new Date()){
  const time=((date.getHours()&0x1F)<<11)|((date.getMinutes()&0x3F)<<5)|((date.getSeconds()>>1)&0x1F);
  const day=((Math.max(1980,date.getFullYear())-1980)<<9)|(((date.getMonth()+1)&0x0F)<<5)|(date.getDate()&0x1F);
  return {time:time&0xFFFF,day:day&0xFFFF};
}
async function createZipArchive(items,onProgress=()=>{}){
  const encoder=new TextEncoder();const chunks=[];const central=[];let offset=0;const stamp=dosDateTime();
  for(let i=0;i<items.length;i++){
    const item=items[i];
    const path=(item.path||item.name).replace(/\\/g,"/");
    if(!path||path.split("/").some(part=>!part||part==="."||part===".."))throw new Error("A selected file has an unsafe path.");
    const nameBytes=encoder.encode(path);
    const raw=item.bytes||new Uint8Array(await item.file.arrayBuffer());
    let method=0,payload=raw;
    const deflated=await deflateBytes(raw);
    if(deflated&&deflated.length<raw.length){method=8;payload=deflated;}
    const crc=calculateCRC32(raw);
    onProgress(i+1,items.length,item.file||{name:path});
    const header=new Uint8Array(30+nameBytes.length);const hv=new DataView(header.buffer);
    hv.setUint32(0,0x04034b50,true);hv.setUint16(4,20,true);hv.setUint16(6,0x0800,true);hv.setUint16(8,method,true);
    hv.setUint16(10,stamp.time,true);hv.setUint16(12,stamp.day,true);hv.setUint32(14,crc,true);
    hv.setUint32(18,payload.length,true);hv.setUint32(22,raw.length,true);
    hv.setUint16(26,nameBytes.length,true);hv.setUint16(28,0,true);
    header.set(nameBytes,30);
    chunks.push(header,payload);
    const cde=new Uint8Array(46+nameBytes.length);const cv=new DataView(cde.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,method,true);
    cv.setUint16(12,stamp.time,true);cv.setUint16(14,stamp.day,true);cv.setUint32(16,crc,true);
    cv.setUint32(20,payload.length,true);cv.setUint32(24,raw.length,true);
    cv.setUint16(28,nameBytes.length,true);cv.setUint16(30,0,true);cv.setUint16(32,0,true);
    cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);
    cde.set(nameBytes,46);
    central.push(cde);
    offset+=header.length+payload.length;
  }
  let cdSize=0;
  for(const cde of central){chunks.push(cde);cdSize+=cde.length;}
  const eocd=new Uint8Array(22);const ev=new DataView(eocd.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(4,0,true);ev.setUint16(6,0,true);
  ev.setUint16(8,items.length,true);ev.setUint16(10,items.length,true);
  ev.setUint32(12,cdSize,true);ev.setUint32(16,offset,true);ev.setUint16(20,0,true);
  chunks.push(eocd);
  return new Blob(chunks,{type:"application/zip"});
}
async function readZip(bytes){
  if(bytes.length<22)throw new Error("This file is not a valid .zip archive.");
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-22-65535);i--){
    if(view.getUint32(i,true)===0x06054b50){eocd=i;break;}
  }
  if(eocd<0)throw new Error("This file is not a valid .zip archive.");
  const count=view.getUint16(eocd+10,true);
  let cursor=view.getUint32(eocd+16,true);
  const decoder=new TextDecoder();const entries=[];
  for(let i=0;i<count;i++){
    if(cursor+46>bytes.length||view.getUint32(cursor,true)!==0x02014b50)throw new Error("This .zip archive uses an unsupported layout.");
    const method=view.getUint16(cursor+10,true);
    const compSize=view.getUint32(cursor+20,true);
    const nameLen=view.getUint16(cursor+28,true);
    const extraLen=view.getUint16(cursor+30,true);
    const commentLen=view.getUint16(cursor+32,true);
    const localOffset=view.getUint32(cursor+42,true);
    const name=decoder.decode(bytes.slice(cursor+46,cursor+46+nameLen));
    cursor+=46+nameLen+extraLen+commentLen;
    if(name.endsWith("/"))continue;
    if(!name||name.split("/").some(part=>!part||part==="."||part===".."))throw new Error("This .zip archive contains an unsafe path.");
    if(localOffset+30>bytes.length)throw new Error("This .zip archive is damaged.");
    const lNameLen=view.getUint16(localOffset+26,true);
    const lExtraLen=view.getUint16(localOffset+28,true);
    const dataStart=localOffset+30+lNameLen+lExtraLen;
    if(dataStart+compSize>bytes.length)throw new Error("This .zip archive is damaged.");
    const payload=bytes.slice(dataStart,dataStart+compSize);
    let data;
    if(method===0)data=payload;
    else if(method===8){
      if(typeof DecompressionStream==="undefined")throw new Error("This browser cannot decompress deflated .zip entries.");
      const source=new Blob([payload]);
      const input=typeof source.stream==="function"?source.stream():new Response(payload).body;
      data=new Uint8Array(await new Response(input.pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    }else throw new Error("This .zip archive uses an unsupported compression method.");
    entries.push({path:name,blob:new Blob([data])});
  }
  return entries;
}
function zipRootName(fileName){ return (fileName.replace(/\.zip$/i,"").replace(/[^a-z0-9._-]/gi,"-")||"EncoVault-restored"); }
async function writeEntriesToFolder(dirHandle,entries){
  for(const entry of entries){
    const parts=entry.path.split("/").filter(Boolean);const fileName=parts.pop();if(!fileName)continue;
    let handle=dirHandle;for(const part of parts)handle=await handle.getDirectoryHandle(part,{create:true});
    const fileHandle=await handle.getFileHandle(fileName,{create:true});
    const writable=await fileHandle.createWritable();await writable.write(entry.blob);await writable.close();
  }
  return entries.length;
}

