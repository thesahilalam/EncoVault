// Compression Tool: Compress and Decompress operations

function isImageFile(file){return file.type.startsWith("image/")||/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);}
async function compressImage(file,quality,format){
  if(typeof createImageBitmap!=="function")throw new Error("This browser cannot recompress images locally.");
  const bitmap=await createImageBitmap(file);const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext("2d");
  if(format==="image/jpeg"){context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);}
  context.drawImage(bitmap,0,0);bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,format,quality));if(!blob)throw new Error("This browser could not create the selected image format.");
  const extension=format==="image/jpeg"?"jpg":"webp";const outputName=file.name.replace(/\.[^/.]+$/i,"")+`.${extension}`;return {blob,name:outputName};
}

async function compressFiles(){
  const button=document.getElementById("run-file-action");button.disabled=true;clearMessage();
  try{
    const folderMode=selectedFiles.length>1 || selectedFiles[0].webkitRelativePath;
    const items=selectedFiles.map(file=>({path:(file.webkitRelativePath||file.name),file}));
    showProgress("Building ZIP archive", 0, selectedFiles.length);
    const archive=await createZipArchive(items,(current,total,file)=>showProgress(`Compressing ${file.name}`,current,total));
    const outputName=folderMode?"EncoVault-archive.zip":(selectedFiles.length===1?`${selectedFiles[0].name.replace(/\.[^/.]+$/,"")}.zip`:"EncoVault-archive.zip");
    const originalTotal=selectedFiles.reduce((s,f)=>s+f.size,0);
    downloadBlob(archive,outputName);
    showResults("Compression complete",[{name:outputName,source:`${selectedFiles.length} file${selectedFiles.length===1?"":"s"}`,detail:`${formatSize(originalTotal)} → ${formatSize(archive.size)} · ${sizeChange(originalTotal,archive.size)} · standard .zip`}],"created");
    resetFileTool();
  }catch(error){showMessage(error.message||"Could not compress the selected files.",true);}
  finally{button.disabled=selectedFiles.length===0;}
}

async function decompressFiles(){
  const button=document.getElementById("run-file-action");button.disabled=true;clearMessage();const results=[];
  try{
    for(let index=0;index<selectedFiles.length;index++){
      const file=selectedFiles[index];
      showProgress(`Extracting ${file.name}`,index,selectedFiles.length);
      const entries=await readZip(new Uint8Array(await file.arrayBuffer()));
      if(!entries.length)throw new Error("This .zip archive is empty.");
      const root=zipRootName(file.name);
      let handled=false;
      if(typeof window.showDirectoryPicker==="function"){
        try{
          const dirHandle=await window.showDirectoryPicker({mode:"readwrite"});
          const parent=await dirHandle.getDirectoryHandle(root,{create:true});
          await writeEntriesToFolder(parent,entries);
          handled=true;
          results.push({name:root+"/",source:file.name,detail:"saved into folder"});
        }catch(e){ if(e.name==="AbortError") { showMessage("Folder selection cancelled.",true); return; } }
      }
      if(!handled){
        if(entries.length > 1) throw new Error("Choose a destination folder to extract this archive.");
        for(const entry of entries){
          const safeName=entry.path.split("/").pop();
          downloadBlob(entry.blob,safeName);
          results.push({name:safeName,source:file.name,detail:"extracted"});
        }
      }
    }
    showResults("Decompression complete",results,"restored");
    resetFileTool();
  }catch(error){showMessage(error.message||"Could not decompress this file. Check that it is a valid .zip file.",true);}
  finally{button.disabled=selectedFiles.length===0;}
}

window.compressFiles = compressFiles;
window.decompressFiles = decompressFiles;

