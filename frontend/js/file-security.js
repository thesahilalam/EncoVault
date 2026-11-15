// File Security: Lock and Unlock operations
async function lockFiles(){
  const password=document.getElementById("password").value;const confirm=document.getElementById("confirm-password").value;
  if(password.length<4){showMessage("Use a password with at least 4 characters.",true);return;}
  if(password!==confirm){showMessage("Passwords do not match.",true);return;}
  const profile=document.querySelector('input[name="profile"]:checked').value;const rounds=ITERATIONS[profile];
  const hash=document.getElementById("adv-hash")?.value||"SHA-256";
  const keyBits=parseInt(document.getElementById("adv-key-bits")?.value||"256",10);
  const advRounds=parseInt(document.getElementById("adv-rounds")?.value||rounds,10);
  const compress=document.getElementById("adv-compress")?.value||(document.getElementById("compress-before-lock")?.checked?"auto":"never");
  const iterations=document.getElementById("adv-rounds")?advRounds:rounds;
  const kmKeyfile=document.getElementById("km-keyfile")?.value||"none";
  const kmThreshold=parseInt(document.getElementById("km-threshold")?.value||"2",10);
  const kmTimelock=document.getElementById("km-timelock")?.value;
  const unlockTime=kmTimelock?new Date(kmTimelock).getTime():null;
  if(kmKeyfile==="require" && !document.getElementById("km-keyfile-input")?.files?.[0]){showMessage("Please select a .key file for 2FA.",true);return;}
  const button=document.getElementById("run-file-action");button.disabled=true;button.textContent="Creating encrypted archive…";clearMessage();
  try{
    showProgress("Preparing protected archive",0,selectedFiles.length);
    const encrypted=await encryptSelection(selectedFiles,password,{iterations,hash,keyBits,compression:compress,keyfile:kmKeyfile,threshold:kmThreshold,unlockTime},(current,total,file)=>showProgress(`Adding ${file.name}`,current,total));
    showProgress("Encrypting archive",selectedFiles.length,selectedFiles.length);
    const firstPath=archivePath(selectedFiles[0]);const root=encrypted.isArchive?(firstPath.split("/")[0]||"EncoVault-archive"):firstPath.replace(/\.[^.]+$/,"");
    const outputName=`${root.replace(/[^a-z0-9._-]/gi,"-")||"EncoVault-archive"}.encovault`;downloadBlob(encrypted.blob,outputName);
    if(encrypted.keyFile){downloadBlob(new Blob([encrypted.keyFile]),root+".key");}
    const source=encrypted.isArchive?`${selectedFiles.length} files · one protected archive`:selectedFiles[0].name;
    showResults("Encrypted archive created",[{name:outputName,source,detail:encrypted.compressed?"gzip compressed before encryption":"encrypted without compression"}],"downloaded");
    resetFileTool();
  }catch(error){showMessage(error.message||"Could not encrypt the selected files.",true);}finally{button.disabled=selectedFiles.length===0;button.textContent="Lock selection · Create .encovault";}
}


async function unlockFiles(){
  const password=document.getElementById("password").value;if(!password){showMessage("Enter the password for these files.",true);return;}
  const button=document.getElementById("run-file-action");button.disabled=true;button.textContent="Unlocking files…";clearMessage();const results=[];
  try{for(let i=0;i<selectedFiles.length;i++){const file=selectedFiles[i];showProgress(`Unlocking ${file.name}`,i,selectedFiles.length);const output=await decryptFile(file,password);
      if(output.archive){for(let index=0;index<output.archive.length;index++){const entry=output.archive[index];showProgress(`Restoring ${entry.path.split("/").pop()}`,index+1,output.archive.length);const downloadName=entry.path.replaceAll("/","__");downloadBlob(entry.blob,downloadName);results.push({name:entry.path,source:file.name,detail:"restored from archive"});await sleep(120);}}
      else{downloadBlob(output.blob,output.name);results.push({name:output.name,source:file.name});showProgress(`Restored ${output.name}`,i+1,selectedFiles.length);}
      if(i<selectedFiles.length-1)await sleep(180);}
    // Add integrity badge to each result
    results.forEach(r => r.detail = (r.detail ? r.detail + " · " : "") + "✓ Integrity verified (GCM tag)");
    showResults("Files unlocked",results,"restored");
    resetFileTool();
  }catch(error){showMessage(error.message||"Could not unlock the selected files.",true);}finally{button.disabled=selectedFiles.length===0;button.textContent="Unlock selected files";}
}
