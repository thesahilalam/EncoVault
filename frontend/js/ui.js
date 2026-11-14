export function showMessage(message,error=false){
  const target=document.getElementById("operation-message");
  if(!target)return;
  target.innerHTML=`<div class="${error?"inline-error":"security-note"}">${escapeHTML(message)}</div>`;
}

function showProgress(label,current,total){
  const target=document.getElementById("operation-message");
  if(!target)return;
  const percent=total?Math.min(100,Math.round(current/total*100)):0;
  target.innerHTML=`<div class="operation-progress"><div><span>${escapeHTML(label)}</span><strong>${percent}%</strong></div><div class="progress-track"><i style="width:${percent}%"></i></div><small>${current} of ${total} file${total===1?"":"s"}</small></div>`;
}

function clearMessage(){
  const target=document.getElementById("operation-message");
  if(target)target.innerHTML="";
  const results=document.getElementById("results");
  if(results)results.innerHTML="";
}

function showResults(title,items,verb){
  const target=document.getElementById("results");
  if(!target)return;
  target.innerHTML=`<div class="result-card"><h3>${title}</h3>${items.map(item=>`<div class="result-entry"><span>${escapeHTML(item.source)}${item.name?` → ${escapeHTML(item.name)}`:""}</span><span>${escapeHTML(item.detail||verb)}</span></div>`).join("")}</div>`;
}

function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}

function sleep(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function escapeHTML(value){
  return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function formatSize(bytes){
  if(bytes<1024)return `${bytes} B`;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}

function sizeChange(original,compressed){
  if(!original)return "empty file";
  const percent=Math.abs((1-compressed/original)*100).toFixed(1);
  return compressed<=original?`${percent}% smaller`:`${percent}% larger`;
}
