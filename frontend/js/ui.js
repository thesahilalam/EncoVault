function showMessage(message,error=false){
  const target=document.getElementById("operation-message");
  if(!target)return;
  // Map technical errors to user-friendly messages
  let friendly = String(message || "An unexpected error occurred.");
  if (error) {
    const lower = friendly.toLowerCase();
    if (lower.includes("password is incorrect") || lower.includes("wrong password") || lower.includes("invalid key") || lower.includes("hmac") || lower.includes("gcm tag") || lower.includes("header integrity")) {
      friendly = "Wrong password — the file cannot be unlocked. Check for typos or try a different password.";
    } else if (lower.includes("file is not a supported") || lower.includes("not a valid") || lower.includes("unsupported") || lower.includes("invalid key file") || lower.includes("invalid format")) {
      friendly = "This file is not a valid EncoVault archive. It may be corrupted or from an incompatible version.";
    } else if (lower.includes("too large") || lower.includes("exceeds") || lower.includes("250 mb")) {
      friendly = "File too large — maximum supported size is 250 MB. Try splitting into smaller archives.";
    } else if (lower.includes("unsafe path") || lower.includes("path is invalid")) {
      friendly = "File path contains unsafe characters. Remove special characters from filenames.";
    } else if (lower.includes("time-locked") || lower.includes("time lock")) {
      // Keep the original time-lock message.
    } else if (lower.includes("corrupt") || lower.includes("damaged") || lower.includes("tampered")) {
      friendly = "File appears corrupted or tampered with. It cannot be safely unlocked.";
    } else if (lower.includes("password") && (lower.includes("match") || lower.includes("same") || lower.includes("confirm"))) {
      friendly = "Passwords don't match. Please enter the same password twice.";
    } else if (lower.includes("at least 4") || lower.includes("too short")) {
      friendly = "Password too short — use at least 4 characters.";
    } else if (lower.includes("could not compress") || lower.includes("compression failed")) {
      friendly = "Compression failed. The file may already be compressed (like JPG, MP4, PDF) or your browser doesn't support the format.";
    } else if (lower.includes("choose at least one") || lower.includes("no file")) {
      friendly = "Please select at least one file to continue.";
    }
  }
  
  target.innerHTML=`<div class="${error?"inline-error":"security-note"}" role="${error?"alert":"status"}">${escapeHTML(friendly)}</div>`;
}

function showProgress(label,current,total){
  const target=document.getElementById("operation-message");
  if(!target)return;
  const percent=total?Math.min(100,Math.round(current/total*100)):0;
  target.innerHTML=`<div class="operation-progress" role="status" aria-live="polite"><div><span>${escapeHTML(String(label))}</span><strong>${percent}%</strong></div><div class="progress-track"><i style="width:${percent}%"></i></div><small>${current} of ${total} file${total===1?"":"s"}</small></div>`;
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
  target.innerHTML=`<div class="result-card"><h3>${escapeHTML(String(title))}</h3>${items.map(item=>`<div class="result-entry"><span>${escapeHTML(String(item.source||""))}${item.name?` → ${escapeHTML(String(item.name))}`:""}</span><span>${escapeHTML(String(item.detail||verb||""))}</span></div>`).join("")}</div>`;
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
  return String(value ?? "").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
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
