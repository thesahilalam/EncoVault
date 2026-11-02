const MAGIC = new Uint8Array([69, 78, 67, 79, 86, 65, 85, 76, 84]);
const HEADER_SIZE = 42;
const ITERATIONS = {balanced: 600000, high: 900000};
const content = document.getElementById("content");
const crumb = document.getElementById("crumb");
const navButtons = [...document.querySelectorAll("[data-mode], [data-lab], [data-learn]")];
let mode = "lock";
let selectedFiles = [];
let activeLab = "classical";

function setActiveNav(){
  navButtons.forEach(button=>button.classList.toggle("active",(button.dataset.mode==="lock"&&(mode==="lock"||mode==="unlock"))||button.dataset.mode===mode||button.dataset.lab===activeLab&&mode==="lab"||button.hasAttribute("data-learn")&&mode==="learn"));
}

function renderFileTool(){
  if(mode==="compress"){renderCompressionTool("compress");return;}
  content.className="content";
  const locking=mode==="lock";
  crumb.textContent="File security";
  content.innerHTML=`<div class="eyebrow">PRIVATE FILE PROTECTION</div>
    <h1 class="page-title">${locking?"Lock your files.":"Unlock your files."}</h1>
    <p class="page-subtitle">${locking?"Encrypt files into EncoVault format before they leave your device.":"Restore files from an EncoVault encrypted file using its password."}</p>
    <div class="mode-switch file-mode-switch" role="group" aria-label="Choose file security action"><button class="mode-choice ${locking?"selected":""}" data-file-mode="lock" aria-pressed="${locking}">Lock files</button><button class="mode-choice ${!locking?"selected":""}" data-file-mode="unlock" aria-pressed="${!locking}">Unlock files</button></div>
    <div class="file-workspace"><section class="work-card">
      <h2 class="card-heading">${locking?"Choose files or a folder":"Choose .encovault files"}</h2>
      <p class="card-copy">${locking?"Drop files below, browse your files, or choose a folder. Encryption happens in this browser.":"Select one or more EncoVault files. Decrypted files are saved by your browser."}</p>
      <input id="file-picker" type="file" ${locking?"multiple":"multiple accept='.encovault'"} hidden>
      ${locking?'<input id="folder-picker" type="file" webkitdirectory directory multiple hidden>':""}
      <div class="drop-zone" id="drop-zone"><div><div class="drop-icon">${locking?"↥":"🔓"}</div><h3>${locking?"Drop files here":"Drop encrypted files here"}</h3><p>or choose from this device</p><button class="browse-button" id="browse-files">Browse files</button> ${locking?'<button class="browse-button secondary-button" id="browse-folder">Choose folder</button>':""}</div></div>
      <div id="file-list" class="file-list"></div>
      <div class="field-label">${locking?"VAULT PASSWORD":"PASSWORD"}</div><div class="password-wrap"><input class="field" id="password" type="password" autocomplete="new-password" placeholder="${locking?"Create a strong password":"Enter the password used to lock these files"}"><button class="reveal" id="reveal-password" type="button">SHOW</button></div>
      ${locking?'<div class="password-strength" id="password-strength"><div class="strength-track"><span></span></div><small>Use 10+ characters with a mix of letters, numbers and symbols.</small></div>':""}
      ${locking?'<div class="field-label">CONFIRM PASSWORD</div><input class="field" id="confirm-password" type="password" autocomplete="new-password" placeholder="Enter the password again"><div class="field-label">SECURITY PROFILE</div><div class="profile-grid"><label class="profile-option"><input type="radio" name="profile" value="balanced" checked><span><strong>Balanced</strong><small>AES-256-GCM · 600,000 rounds</small></span></label><label class="profile-option"><input type="radio" name="profile" value="high"><span><strong>High protection</strong><small>AES-256-GCM · 900,000 rounds</small></span></label></div><div class="protection-summary"><span>✓ Authenticated encryption</span><span>✓ Private file names</span><span>✓ Fresh key material per file</span></div><label class="compress-toggle"><input type="checkbox" id="compress-before-lock"><span><strong>Compress before locking</strong><small>Use lossless gzip when it makes the file smaller.</small></span></label>':""}
      <button class="primary-button" id="run-file-action">${locking?"Lock files · Create .encovault":"Unlock selected files"}</button>
      <div id="operation-message"></div><div id="results"></div>
    </section><aside><div class="side-card"><h3>${locking?"How file locking works":"Unlock safely"}</h3><ul>${locking?"<li>A fresh random salt and nonce are created per file.</li><li>File contents and original names are encrypted together.</li><li>Your password stays in this browser and is never uploaded.</li>":"<li>Only files in the EncoVault format are accepted.</li><li>The correct password is required for authenticated decryption.</li><li>Restored files download to your browser’s chosen location.</li>"}</ul></div><div class="security-note"><strong>Keep your password safe.</strong> EncoVault does not store or recover it. If it is lost, encrypted files cannot be opened.</div><div class="security-note"><strong>Format note.</strong> The .encovault extension identifies this app’s encrypted file format. Decryption still depends on the password; the extension alone does not restrict other compatible software.</div></aside></div>
    <div class="muted-caption">Files are processed locally with browser cryptography. Nothing is sent to a server.</div>`;
  selectedFiles=[];
  renderFileList();
  content.querySelectorAll("[data-file-mode]").forEach(button=>button.addEventListener("click",()=>{mode=button.dataset.fileMode;renderFileTool();}));
  document.getElementById("browse-files").onclick=()=>document.getElementById("file-picker").click();
  document.getElementById("file-picker").onchange=event=>setFiles(event.target.files);
  if(locking){document.getElementById("browse-folder").onclick=()=>document.getElementById("folder-picker").click();document.getElementById("folder-picker").onchange=event=>setFiles(event.target.files);}
  document.getElementById("reveal-password").onclick=()=>{const input=document.getElementById("password");input.type=input.type==="password"?"text":"password";document.getElementById("reveal-password").textContent=input.type==="password"?"SHOW":"HIDE";};
  if(locking){document.getElementById("password").addEventListener("input",updatePasswordStrength);updatePasswordStrength();}
  document.getElementById("run-file-action").onclick=locking?lockFiles:unlockFiles;
  const zone=document.getElementById("drop-zone");
  ["dragenter","dragover"].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.add("drag-over");}));
  ["dragleave","drop"].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.remove("drag-over");}));
  zone.addEventListener("drop",event=>setFiles(event.dataTransfer.files));
  setActiveNav();
}

function updatePasswordStrength(){
  const input=document.getElementById("password");const target=document.getElementById("password-strength");if(!input||!target)return;
  const value=input.value;const score=[value.length>=10,/[a-z]/.test(value)&&/[A-Z]/.test(value),/\d/.test(value),/[^A-Za-z0-9]/.test(value)].filter(Boolean).length;target.dataset.level=String(score);target.querySelector("span").style.width=`${Math.max(8,score*25)}%`;target.querySelector("small").textContent=score<2?"Weak sample · use 10+ characters with mixed character types":score<4?"Good start · add another character type for stronger protection":"Strong password pattern";
}

let compressionAction="compress";
let compressionMethod="gzip";
let compressionMode="lossless";
let imageQuality=0.78;
let imageFormat="image/webp";

const compressionInfo={
  gzip:{label:"File compression",definition:"File compression reduces the number of bytes needed to store a file while keeping its content intact. EncoVault uses a local gzip stream for a practical, lossless workflow: the restored file has the same bytes as the original.",working:"The compressor looks for repeated or predictable byte patterns and represents them more compactly. During decompression, the stream reverses those representations and rebuilds the original bytes; already-compressed media may show little or no reduction.",types:"Lossless stream compression; adaptive pattern coding; archive-style compression.",examples:"Gzip and DEFLATE, ZIP archives, browser compression streams.",applications:"Documents, PDFs, DOCX files, source code, backups, images, videos, and files that must be restored exactly."},
  rle:{label:"Run-length encoding",definition:"Run-length encoding (RLE) replaces a sequence of identical symbols with one symbol and a count. It is simple, fast, and lossless when the data contains long repeated runs.",working:"The encoder scans left to right, counts consecutive copies, and writes pairs such as A×5 or 0×12. The decoder expands each pair back into the original sequence; short or varied data can become larger because each run needs metadata.",types:"Basic RLE, packed RLE, byte-oriented RLE, and bit-plane RLE.",examples:"AAAAABBB becomes A×5, B×3; long zero areas in a bitmap; repeated telemetry values.",applications:"Simple graphics, icons, masks, fax-like data, bitmap rows, and sensor streams with repeated values."},
  huffman:{label:"Huffman coding",definition:"Huffman coding is a lossless variable-length coding method. Frequent symbols receive shorter bit codes, while rare symbols receive longer codes, reducing the average number of bits per symbol.",working:"The encoder counts symbol frequencies, repeatedly joins the two least-frequent nodes, and forms a binary tree. The path to each symbol becomes its prefix-free code, so the decoder can read the bit stream unambiguously using the same tree.",types:"Static Huffman trees, canonical Huffman codes, and adaptive Huffman coding.",examples:"A frequent letter may use 1–2 bits while a rare symbol uses more; DEFLATE combines Huffman coding with LZ matching.",applications:"ZIP and gzip streams, image formats, text compressors, archival tools, and communication systems."},
  arithmetic:{label:"Arithmetic coding",definition:"Arithmetic coding represents an entire message as a progressively narrowed interval between 0 and 1. It can approach the information-theoretic limit more closely than assigning a whole number of bits to every symbol.",working:"A probability model divides the current interval into symbol ranges. Each input symbol selects one sub-range, and the final interval is represented by a compact number; decoding uses the same model to walk through those ranges in reverse.",types:"Static-model arithmetic coding, adaptive arithmetic coding, and range coding, a closely related integer-friendly form.",examples:"A message with highly probable symbols narrows the interval efficiently; JPEG 2000 and some video/archival codecs use arithmetic-style coding.",applications:"Image and video codecs, high-efficiency archival formats, scientific data, and systems where squeezing out extra redundancy matters."},
  entropy:{label:"Entropy and redundancy",definition:"Entropy measures the average uncertainty or information content of a source. It is not itself a file compressor, but it helps estimate how much a lossless compressor can theoretically reduce predictable data.",working:"The tool counts symbols, converts their frequencies into probabilities, and calculates −p log₂(p) for each symbol. Repetition lowers uncertainty and creates redundancy; a uniform, unpredictable source has higher entropy and is harder to compress.",types:"Shannon entropy, conditional entropy, cross-entropy, and source redundancy analysis.",examples:"AAAA has low entropy because one symbol dominates; a balanced random-looking message has higher entropy and less obvious redundancy.",applications:"Choosing compression strategies, measuring data quality, communications, cryptanalysis, and evaluating whether more compression is realistic."},
  tradeoff:{label:"Lossless and lossy compression",definition:"Lossless compression preserves every original bit, while lossy compression deliberately discards selected detail to make media much smaller. The correct choice depends on whether exact recovery or a smaller perceptual result matters more.",working:"Lossless methods encode repetition and predictability, then reverse the process exactly. Lossy codecs transform data, remove less noticeable information, and quantize the result; quality and file size move in opposite directions.",types:"Lossless: gzip, ZIP, PNG, FLAC. Lossy: JPEG, WebP, AAC, H.264/H.265, with quality or bitrate controls.",examples:"Use gzip for a PDF or DOCX; use JPEG/WebP quality controls for a photo; use a video codec for a camera recording.",applications:"Lossless for documents, code, backups, PDFs and EncoVault workflows; lossy for photos, audio and video when a controlled quality trade-off is acceptable."}
};

function compressionInfoMarkup(method){
  const info=compressionInfo[method]||compressionInfo.gzip;
  return `<section class="compression-info" aria-label="${info.label} information"><div class="compression-info-header"><span class="eyebrow">ABOUT THIS METHOD</span><h2>${info.label}</h2><p>${info.definition}</p></div><div class="compression-info-grid"><article><span>HOW IT WORKS</span><p>${info.working}</p></article><article><span>TYPES</span><p>${info.types}</p></article><article><span>EXAMPLES</span><p>${info.examples}</p></article><article><span>APPLICATIONS</span><p>${info.applications}</p></article></div></section>`;
}

function renderCompressionTool(action,method=compressionMethod,preserveSelection=false){
  const validMethods=["gzip","rle","huffman","arithmetic","entropy","tradeoff"];
  if(!validMethods.includes(method))method="gzip";
  const retainedFiles=preserveSelection?[...selectedFiles]:[];
  mode="compress";compressionAction=action;compressionMethod=method;crumb.textContent="Compression lab";content.className="content compression-page";setActiveNav();
  if(method!=="gzip"){renderCompressionDemo(method);return;}
  const compressing=action==="compress";
  content.innerHTML=`<div class="eyebrow">COMPRESSION LAB</div><h1 class="page-title">Reduce file size.</h1><p class="page-subtitle">Compress any file type locally—documents, PDFs, images, videos and more. Choose exact restore or a quality trade-off.</p>
    <div class="compression-methods" role="group" aria-label="Compression methods">${[["gzip","File compression"],["rle","Run-length"],["huffman","Huffman"],["arithmetic","Arithmetic"],["entropy","Entropy"],["tradeoff","Lossless vs lossy"]].map(([key,label])=>`<button class="compression-method ${key===method?"selected":""}" data-compression-method="${key}">${label}</button>`).join("")}</div>
    <div class="mode-switch"><button class="mode-choice ${compressing?"selected":""}" data-compression-mode="compress">Compress</button><button class="mode-choice ${!compressing?"selected":""}" data-compression-mode="decompress">Decompress</button></div>
    <div class="file-workspace"><section class="work-card"><h2 class="card-heading">${compressing?"Choose any files or a folder":"Choose .gz files"}</h2><p class="card-copy">${compressing?(compressionMode==="lossy"?"Images use adjustable lossy quality. PDFs, DOCX, videos and other files use a safe lossless fallback.":"Lossless mode works on any file bytes. Gzip restores the original file exactly."):"Restore files from gzip-compressed .gz files."}</p>
      <input id="file-picker" type="file" multiple ${compressing?"":"accept='.gz'"} hidden>${compressing?'<input id="folder-picker" type="file" webkitdirectory directory multiple hidden>':""}
      <div class="drop-zone" id="drop-zone"><div><div class="drop-icon">${compressing?"↘":"↗"}</div><h3>${compressing?"Drop files to compress":"Drop .gz files to decompress"}</h3><p>or browse this device</p><button class="browse-button" id="browse-files">Browse files</button>${compressing?'<button class="browse-button secondary-button" id="browse-folder">Choose folder</button>':""}</div></div>
      <div id="file-list" class="file-list"></div>${compressing?`<div class="compression-settings"><div class="compression-choice" role="group" aria-label="Compression quality"><button class="compression-choice-button ${compressionMode==="lossless"?"selected":""}" data-loss-mode="lossless">Lossless <small>exact restore</small></button><button class="compression-choice-button ${compressionMode==="lossy"?"selected":""}" data-loss-mode="lossy">Lossy <small>quality for images</small></button></div>${compressionMode==="lossy"?`<div class="lossy-options"><label>IMAGE QUALITY <output id="quality-value">${Math.round(imageQuality*100)}%</output><input id="image-quality" type="range" min="35" max="95" value="${Math.round(imageQuality*100)}"></label><label>OUTPUT FORMAT<select id="image-format" class="select"><option value="image/webp" ${imageFormat==="image/webp"?"selected":""}>WebP</option><option value="image/jpeg" ${imageFormat==="image/jpeg"?"selected":""}>JPEG</option></select></label><p>Images use lossy quality settings. PDFs, DOCX, videos and other files use safe lossless gzip automatically.</p></div>`:""}</div>`:""}<button class="primary-button" id="run-file-action" ${selectedFiles.length?"":"disabled"}>${compressing?"Compress selected files":"Decompress selected files"}</button><div id="operation-message"></div><div id="results"></div></section>
      <aside><div class="side-card"><h3>${compressionMode==="lossy"?"Choose your trade-off":"Lossless compression"}</h3><ul>${compressionMode==="lossy"?"<li>Images can become much smaller.</li><li>PDFs, DOCX and videos still get a safe lossless output.</li><li>Only image pixels use the quality trade-off.</li>":"<li>Original content is preserved exactly.</li><li>Works for text, PDFs, DOCX, images and videos.</li><li>Already-compressed media may not get smaller.</li>"}</ul></div><div class="security-note">To compress and encrypt in one step, choose <strong>File security</strong> and enable “Compress before locking”.</div></aside></div>
      <div class="muted-caption">Compression runs locally in your browser using the built-in gzip stream.</div>${compressionInfoMarkup("gzip")}`;
  selectedFiles=retainedFiles;renderFileList();
  content.querySelectorAll("[data-compression-mode]").forEach(button=>button.addEventListener("click",()=>renderCompressionTool(button.dataset.compressionMode,"gzip",true)));
  content.querySelectorAll("[data-compression-method]").forEach(button=>button.addEventListener("click",()=>renderCompressionTool("compress",button.dataset.compressionMethod,true)));
  content.querySelectorAll("[data-loss-mode]").forEach(button=>button.addEventListener("click",()=>{compressionMode=button.dataset.lossMode;renderCompressionTool("compress","gzip",true);}));
  const qualityInput=document.getElementById("image-quality");
  if(qualityInput)qualityInput.oninput=event=>{imageQuality=Number(event.target.value)/100;document.getElementById("quality-value").textContent=`${event.target.value}%`;};
  const formatInput=document.getElementById("image-format");
  if(formatInput)formatInput.onchange=event=>{imageFormat=event.target.value;};
  document.getElementById("browse-files").onclick=()=>document.getElementById("file-picker").click();
  document.getElementById("file-picker").onchange=event=>setFiles(event.target.files);
  if(compressing){document.getElementById("browse-folder").onclick=()=>document.getElementById("folder-picker").click();document.getElementById("folder-picker").onchange=event=>setFiles(event.target.files);}
  document.getElementById("run-file-action").onclick=compressing?compressFiles:decompressFiles;
  const zone=document.getElementById("drop-zone");
  ["dragenter","dragover"].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.add("drag-over");}));
  ["dragleave","drop"].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.remove("drag-over");}));
  zone.addEventListener("drop",event=>setFiles(event.dataTransfer.files));
}

function renderCompressionDemo(method){
  const labels={rle:"Run-length encoding",huffman:"Huffman coding",arithmetic:"Arithmetic coding",entropy:"Entropy & redundancy",tradeoff:"Lossless and lossy compression"};
  const descriptions={rle:"Compact repeated runs of the same character. Best suited to data with long repeats.",huffman:"Build a prefix code that gives frequent characters shorter bit strings.",arithmetic:"Model a message as a narrowing probability interval. This short sample is a teaching simulation.",entropy:"Estimate the information per character and see how repetition changes predictability.",tradeoff:"Choose whether the original must be restored exactly, or whether some detail can be discarded to save more space."};
  const methods=[["gzip","File compression"],["rle","Run-length"],["huffman","Huffman"],["arithmetic","Arithmetic"],["entropy","Entropy"],["tradeoff","Lossless vs lossy"]];
  content.innerHTML=`<div class="eyebrow">COMPRESSION LAB</div><h1 class="page-title">${labels[method]}</h1><p class="page-subtitle">${descriptions[method]}</p><div class="compression-methods" role="group" aria-label="Compression methods">${methods.map(([key,label])=>`<button class="compression-method ${key===method?"selected":""}" data-compression-method="${key}">${label}</button>`).join("")}</div>${method==="tradeoff"?`<section class="compression-compare"><article class="work-card"><span class="compare-tag">EXACT RESTORE</span><h2>Lossless</h2><p>Every original bit is preserved. Decompression recreates the source exactly.</p><strong>Good for</strong><p>Documents, archives, code and EncoVault files.</p><strong>Examples</strong><p>Gzip, Run-length encoding, Huffman and arithmetic coding.</p></article><article class="work-card"><span class="compare-tag">SMALLER OUTPUT</span><h2>Lossy</h2><p>Some detail is discarded to reach a smaller result. The original cannot be reconstructed perfectly.</p><strong>Good for</strong><p>Photos, audio and video where a small quality change is acceptable.</p><strong>Trade-off</strong><p>More compression can mean more visible or audible quality loss.</p></article></section>`:`<section class="compression-demo work-card"><label class="card-heading" for="compression-sample">Sample text</label><p class="card-copy">Try a short message. This demo runs locally and does not upload it.</p><textarea class="lab-input" id="compression-sample">AAAAABBBCCDAA</textarea><button class="browse-button" id="run-compression-demo">${method==="entropy"?"Analyze sample":"Encode sample"}</button><div class="lab-output" id="compression-result">Your result will appear here.</div></section>`}${compressionInfoMarkup(method)}<p class="muted-caption">RLE and Huffman produce illustrative encodings here. Arithmetic coding shows an estimated interval size; it is a learning simulation, not a file format.</p>`;
  content.querySelectorAll("[data-compression-method]").forEach(button=>button.addEventListener("click",()=>renderCompressionTool("compress",button.dataset.compressionMethod)));
  if(method==="tradeoff")return;
  document.getElementById("run-compression-demo").onclick=()=>{
    const sample=document.getElementById("compression-sample").value;
    const result=document.getElementById("compression-result");
    if(!sample){result.textContent="Enter a sample to see the result.";return;}
    if(method==="rle"){
      let encoded="";for(let i=0;i<sample.length;){let j=i+1;while(j<sample.length&&sample[j]===sample[i])j++;encoded+=`${sample[i]}${j-i>1?j-i:""} `;i=j;}
      result.textContent=`Encoded runs: ${encoded.trim()}\n${sample.length} characters → ${encoded.trim().length} display characters (illustrative; real formats also store symbols and counts).`;
    }else if(method==="huffman"){
      const counts=new Map();for(const char of sample)counts.set(char,(counts.get(char)||0)+1);
      let queue=[...counts].map(([char,count])=>({char,count,left:null,right:null}));
      while(queue.length>1){queue.sort((a,b)=>a.count-b.count);const left=queue.shift(),right=queue.shift();queue.push({char:null,count:left.count+right.count,left,right});}
      const codes={};const visit=(node,prefix)=>{if(node.char!==null){codes[node.char]=prefix||"0";return;}visit(node.left,prefix+"0");visit(node.right,prefix+"1");};visit(queue[0],"");
      const bits=[...sample].map(char=>codes[char]).join("");const table=Object.entries(codes).map(([char,code])=>`${JSON.stringify(char)} ${code}`).join(" · ");
      result.textContent=`Codes: ${table}\nEncoded bits: ${bits}\n${sample.length*8} input bits → ${bits.length} encoded bits, before storing the code table.`;
    }else if(method==="arithmetic"){
      if(sample.length>24||new Set(sample).size>8){result.textContent="For this interval demo, use at most 24 characters and 8 unique symbols.";return;}
      const counts=new Map();for(const char of sample)counts.set(char,(counts.get(char)||0)+1);
      const symbols=[...counts.keys()].sort();const total=sample.length;let low=0,high=1;
      for(const char of sample){const width=high-low;let before=0;for(const symbol of symbols){const share=counts.get(symbol)/total;if(symbol===char){const nextLow=low+width*before;high=low+width*(before+share);low=nextLow;break;}before+=share;}}
      const bits=Math.ceil(-Math.log2(high-low));result.textContent=`Final interval: [${low.toPrecision(8)}, ${high.toPrecision(8)})\nEstimated payload: about ${bits} bits for ${sample.length} symbols (model costs are not included).`;
    }else{
      const counts=new Map();for(const char of sample)counts.set(char,(counts.get(char)||0)+1);
      const entropy=[...counts.values()].reduce((sum,count)=>{const p=count/sample.length;return sum-p*Math.log2(p);},0);
      result.textContent=`${counts.size} unique symbols · ${entropy.toFixed(3)} bits per character\nUniform 8-bit text: ${sample.length*8} bits. Lower entropy means more predictable symbols and potential for compression.`;
    }
  };
}

function setFiles(fileList){
  selectedFiles=[...fileList];
  renderFileList();
}

function renderFileList(){
  const list=document.getElementById("file-list");
  if(!list)return;
  list.innerHTML=selectedFiles.map((file,index)=>`<div class="file-item"><span class="file-name">${escapeHTML(file.webkitRelativePath||file.name)}</span><span class="file-size">${formatSize(file.size)}</span><button class="file-remove" data-remove="${index}" aria-label="Remove file">×</button></div>`).join("");
  list.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>{selectedFiles.splice(Number(button.dataset.remove),1);renderFileList();}));
  document.getElementById("run-file-action").disabled=selectedFiles.length===0;
}

function escapeHTML(value){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function formatSize(bytes){if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`;}
function sizeChange(original,compressed){if(!original)return "empty file";const percent=Math.abs((1-compressed/original)*100).toFixed(1);return compressed<=original?`${percent}% smaller`:`${percent}% larger`}
function concatBytes(...arrays){const result=new Uint8Array(arrays.reduce((sum,array)=>sum+array.length,0));let offset=0;for(const array of arrays){result.set(array,offset);offset+=array.length;}return result;}
async function transformStream(blob,format,direction){const StreamClass=direction==="compress"?CompressionStream:DecompressionStream;return new Blob([await new Response(blob.stream().pipeThrough(new StreamClass(format))).arrayBuffer()]);}

async function deriveKey(password,salt,iterations){
  const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}

function makeHeader(iterations,salt,iv){
  const header=new Uint8Array(HEADER_SIZE);header.set(MAGIC,0);header[9]=2;
  new DataView(header.buffer).setUint32(10,iterations,false);header.set(salt,14);header.set(iv,30);return header;
}

async function encryptFile(file,password,iterations,compress){
  const salt=crypto.getRandomValues(new Uint8Array(16));const iv=crypto.getRandomValues(new Uint8Array(12));
  const header=makeHeader(iterations,salt,iv);const key=await deriveKey(password,salt,iterations);
  const name=new TextEncoder().encode(file.webkitRelativePath||file.name);let data=new Blob([await file.arrayBuffer()]);let compressed=false;
  if(compress&&data.size){try{const candidate=await transformStream(data,"gzip","compress");if(candidate.size<data.size){data=candidate;compressed=true;}}catch(error){throw new Error("This browser could not compress the selected file.");}}
  const payload=new Uint8Array(5+name.length+data.size);
  new DataView(payload.buffer).setUint32(0,name.length,false);payload[4]=compressed?1:0;payload.set(name,5);payload.set(new Uint8Array(await data.arrayBuffer()),5+name.length);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:header,tagLength:128},key,payload));
  return {blob:new Blob([header,ciphertext],{type:"application/octet-stream"}),compressed};
}

async function decryptFile(file,password){
  const raw=new Uint8Array(await file.arrayBuffer());
  if(raw.length<HEADER_SIZE+16||!MAGIC.every((byte,index)=>raw[index]===byte)||![1,2].includes(raw[9]))throw new Error("This file is not a supported EncoVault file.");
  const version=raw[9];
  const header=raw.slice(0,HEADER_SIZE);const view=new DataView(header.buffer);const iterations=view.getUint32(10,false);
  if(!Object.values(ITERATIONS).includes(iterations))throw new Error("Unsupported security profile in this file.");
  const salt=header.slice(14,30);const iv=header.slice(30,42);const key=await deriveKey(password,salt,iterations);
  let plain;try{plain=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:header,tagLength:128},key,raw.slice(HEADER_SIZE)));}catch(error){throw new Error("Password is incorrect or the file is damaged.");}
  const nameOffset=version===2?5:4;
  if(plain.length<nameOffset)throw new Error("Encrypted file contents are invalid.");
  const nameLength=new DataView(plain.buffer,plain.byteOffset,plain.byteLength).getUint32(0,false);
  if(nameLength>plain.length-nameOffset)throw new Error("Encrypted file name is invalid.");
  const originalName=new TextDecoder().decode(plain.slice(nameOffset,nameOffset+nameLength));
  const outputName=originalName.split(/[\\/]/).filter(Boolean).pop()||"restored-file";
  let data=new Blob([plain.slice(nameOffset+nameLength)]);
  if(version===2&&plain[4]===1){try{data=await transformStream(data,"gzip","decompress");}catch(error){throw new Error("Compressed content inside this file is damaged.");}}
  return {blob:data,name:outputName};
}

function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function lockFiles(){
  const password=document.getElementById("password").value;const confirm=document.getElementById("confirm-password").value;
  if(password.length<10){showMessage("Use a password with at least 10 characters.",true);return;}
  if(password!==confirm){showMessage("Passwords do not match.",true);return;}
  const profile=document.querySelector('input[name="profile"]:checked').value;const rounds=ITERATIONS[profile];
  const compress=document.getElementById("compress-before-lock").checked;
  const button=document.getElementById("run-file-action");button.disabled=true;button.textContent="Encrypting files…";clearMessage();const results=[];
  try{for(let i=0;i<selectedFiles.length;i++){const file=selectedFiles[i];const encrypted=await encryptFile(file,password,rounds,compress);const suffix=crypto.getRandomValues(new Uint8Array(4));const tag=[...suffix].map(byte=>byte.toString(16).padStart(2,"0")).join("");const name=`EncoVault-${tag}.encovault`;downloadBlob(encrypted.blob,name);results.push({name,source:`${file.webkitRelativePath||file.name}${encrypted.compressed?" · compressed":""}`});if(i<selectedFiles.length-1)await sleep(180);}
    showResults("Files locked",results,"encrypted");
  }catch(error){showMessage(error.message||"Could not encrypt the selected files.",true);}finally{button.disabled=selectedFiles.length===0;button.textContent="Lock files · Create .encovault";}
}

function isImageFile(file){return file.type.startsWith("image/")||/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);}
async function compressImage(file,quality,format){
  if(typeof createImageBitmap!=="function")throw new Error("This browser cannot recompress images locally.");
  const bitmap=await createImageBitmap(file);const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext("2d");
  if(format==="image/jpeg"){context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);}
  context.drawImage(bitmap,0,0);bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,format,quality));if(!blob)throw new Error("This browser could not create the selected image format.");
  const extension=format==="image/jpeg"?"jpg":"webp";const outputName=file.name.replace(/\.[^/.]+$/i,"")+`.${extension}`;return {blob,name:outputName};
}

async function unlockFiles(){
  const password=document.getElementById("password").value;if(!password){showMessage("Enter the password for these files.",true);return;}
  const button=document.getElementById("run-file-action");button.disabled=true;button.textContent="Unlocking files…";clearMessage();const results=[];
  try{for(let i=0;i<selectedFiles.length;i++){const file=selectedFiles[i];const output=await decryptFile(file,password);downloadBlob(output.blob,output.name);results.push({name:output.name,source:file.name});if(i<selectedFiles.length-1)await sleep(180);}
    showResults("Files unlocked",results,"restored");
  }catch(error){showMessage(error.message||"Could not unlock the selected files.",true);}finally{button.disabled=selectedFiles.length===0;button.textContent="Unlock selected files";}
}

async function compressFiles(){
  const needsGzip=compressionMode==="lossless"||selectedFiles.some(file=>!isImageFile(file));
  if(needsGzip&&typeof CompressionStream==="undefined"){showMessage("This browser does not support local gzip compression.",true);return;}
  const button=document.getElementById("run-file-action");button.disabled=true;clearMessage();const results=[];
  try{for(let index=0;index<selectedFiles.length;index++){const file=selectedFiles[index];let compressed;let outputName;let methodLabel;
      if(compressionMode==="lossy"){
        if(isImageFile(file)){const image=await compressImage(file,imageQuality,imageFormat);compressed=image.blob;outputName=image.name;methodLabel=`lossy image · quality ${Math.round(imageQuality*100)}%`;}
        else{compressed=await transformStream(file,"gzip","compress");outputName=`${file.name}.gz`;methodLabel="lossless fallback · original preserved";}
      }else{compressed=await transformStream(file,"gzip","compress");outputName=`${file.name}.gz`;methodLabel="lossless gzip";}
      downloadBlob(compressed,outputName);const ratio=compressed.size?(file.size/compressed.size).toFixed(2):"—";const change=sizeChange(file.size,compressed.size);results.push({name:outputName,source:`${file.name} · ${formatSize(file.size)} → ${formatSize(compressed.size)} · ${ratio}:1 · ${change}`,detail:methodLabel});if(index<selectedFiles.length-1)await sleep(180);}showResults("Compression complete",results,"created");}
  catch(error){showMessage(error.message||"Could not compress the selected files.",true);}finally{button.disabled=selectedFiles.length===0;}
}

async function decompressFiles(){
  if(typeof DecompressionStream==="undefined"){showMessage("This browser does not support local gzip decompression.",true);return;}
  const button=document.getElementById("run-file-action");button.disabled=true;clearMessage();const results=[];
  try{for(let index=0;index<selectedFiles.length;index++){const file=selectedFiles[index];const blob=await transformStream(file,"gzip","decompress");const outputName=file.name.toLowerCase().endsWith(".gz")?file.name.slice(0,-3):`${file.name}.restored`;downloadBlob(blob,outputName);results.push({name:outputName,source:file.name});if(index<selectedFiles.length-1)await sleep(180);}showResults("Decompression complete",results,"restored");}
  catch(error){showMessage("Could not decompress this file. Check that it is a valid .gz file.",true);}finally{button.disabled=selectedFiles.length===0;}
}

function showMessage(message,error=false){const target=document.getElementById("operation-message");target.innerHTML=`<div class="${error?"inline-error":"security-note"}">${escapeHTML(message)}</div>`;}
function clearMessage(){document.getElementById("operation-message").innerHTML="";document.getElementById("results").innerHTML="";}
function showResults(title,items,verb){document.getElementById("results").innerHTML=`<div class="result-card"><h3>${title}</h3>${items.map(item=>`<div class="result-entry"><span>${escapeHTML(item.source)}${item.name?` → ${escapeHTML(item.name)}`:""}</span><span>${escapeHTML(item.detail||verb)}</span></div>`).join("")}</div>`;}

const keyConcepts=[
  ["Security goals","The CIA triad","The CIA triad describes the three outcomes a secure system should protect. Confidentiality limits who can read information, integrity helps detect unauthorised changes, and availability keeps data and services usable when needed.","When evaluating a control, ask which goal it supports. Encryption mainly protects confidentiality, hashes help check integrity, and backups and redundancy improve availability."],
  ["Risk basics","Threats, vulnerabilities and attacks","A threat is a possible source of harm, such as a malicious user or a hardware failure. A vulnerability is a weakness that can be used or triggered. An attack is the actual attempt to exploit that weakness and cause an unwanted result.","Security teams reduce risk by finding weaknesses early, limiting exposure, adding detection, and preparing a recovery path when prevention fails."],
  ["Encryption","Plaintext, ciphertext and keys","Plaintext is readable input such as a document or message. Encryption uses an algorithm and a key to turn it into ciphertext, which should be unintelligible without the required key. Decryption reverses the process for an authorised user.","A strong design can keep the algorithm public; the secret that must be protected is the key or password. EncoVault combines a password derived key with authenticated encryption so modified data is rejected."],
  ["Encryption","Why classical ciphers fail","Caesar shifts every letter by a fixed amount, while Vigenère changes the shift using a repeating keyword. These ciphers are useful for seeing substitution and key ideas, but their small patterns remain visible. Frequency analysis and repeated structure can often reveal the message without the key.","Classical methods are learning tools, not protection for real files. Their value is showing why modern systems need large key spaces, strong randomness, and authenticated designs.","classical"],
  ["Modern cryptography","AES and RSA","AES is a symmetric cipher: the same secret key protects and opens the data. RSA is an asymmetric system with a public key that can be shared and a private key that must stay secret. RSA is useful for identity and key exchange, while AES is efficient for large files.","Modern applications usually combine them: public-key cryptography establishes trust or a temporary secret, then symmetric encryption handles the actual data."],
  ["Trust and integrity","Hashes, signatures and certificates","A cryptographic hash maps data to a fixed-size fingerprint; a changed input should produce a different fingerprint. A digital signature uses a private key to prove who approved data and a public key to verify it. A certificate binds a public key to an identity through a trusted issuer.","A hash can show that data changed, but it cannot identify the author by itself. Signatures and certificate chains add identity and accountability."],
  ["Key protection","Managing encryption keys","Key management covers the full life of a key: secure generation, storage, access control, rotation, backup, revocation and disposal. A mathematically strong cipher is still unsafe if its key is exposed or lost. Different keys should be separated by purpose and access should be limited.","Passwords and keys should never be placed in source code or sent to a server unnecessarily. Recovery planning matters because a lost key can make correctly encrypted data permanently unreadable."],
  ["Identity","Passwords and MFA","A password proves something the user knows, but it can be guessed, reused, phished or leaked. Multi-factor authentication combines different categories, such as something you know, something you have, or something you are. A second factor limits damage when the password alone is compromised.","Two passwords are still one factor category. A hardware key or authenticator app usually adds more useful protection than another secret question."],
  ["Secure connections","TLS and certificates","TLS creates an encrypted connection between a client and a server and uses certificates to help authenticate the server. During the handshake, the peers agree on algorithms and establish temporary session keys. Integrity checks then help detect tampering while data is in transit.","TLS protects the connection between endpoints; it does not guarantee that the website is honest or that the device is clean. Certificate warnings should be treated as a real trust decision."],
  ["Network protection","Firewalls and VPNs","A firewall evaluates traffic against rules such as source, destination, port and direction, then allows or blocks it. A VPN creates an encrypted tunnel between a device and a VPN endpoint, hiding the traffic from parts of the local network. Both controls protect a defined boundary rather than everything around it.","A default-deny rule reduces unnecessary exposure, while a VPN changes the path and trust point for traffic. Neither replaces secure passwords, updates, or endpoint protection."],
  ["Network threats","Service disruption and spoofing","A denial-of-service attack tries to make a service unavailable by exhausting bandwidth, connections, compute, or another resource. IP spoofing forges the source address in a packet, which can confuse logs or bypass weak source-based rules. Spoofing does not automatically give the attacker control of the claimed address.","Rate limits, filtering, redundancy, monitoring and upstream protection can reduce impact. Good incident design focuses on keeping critical functions available while the attack is handled."],
  ["Compression","Lossless and lossy methods","Lossless compression removes repeated or predictable patterns and restores every original byte during decompression. Lossy compression discards details that may be less noticeable, allowing a smaller result but preventing perfect reconstruction. The right choice depends on whether exact recovery is required.","Use lossless compression for documents, code, archives and encrypted workflows. Lossy compression is more common for media where a controlled quality trade-off is acceptable."],
  ["Compression","Entropy and repeated data","Entropy estimates the average uncertainty or information content of symbols in a source. A source with evenly distributed, unpredictable symbols has higher entropy and is harder to compress. Repeated or predictable patterns are redundancy that a compressor can represent more efficiently.","Try the same message with and without repetition in the Compression lab. The entropy estimate helps explain why one version may have more room for compression."],
  ["Compression","RLE and Huffman coding","Run-length encoding replaces a repeated sequence with a symbol and a count, so it works well when long runs occur. Huffman coding builds a prefix code in which frequent symbols receive shorter bit sequences. Both methods are lossless, but each has overhead such as counts, code tables, or metadata.","RLE is simple and transparent; Huffman is more flexible when symbol frequencies are uneven. Real compressors often combine several techniques rather than relying on one method alone.","compression"],
];

const referenceTree=[
  {title:"Security foundations",hint:"Start here",items:[0,1]},
  {title:"Encryption essentials",hint:"Protect the message",items:[2,3]},
  {title:"Modern protection",hint:"Trust the system",items:[4,5,6]},
  {title:"Identity and connections",hint:"Protect access",items:[7,8,9,10]},
  {title:"Compression and data",hint:"Work smarter with data",items:[11,12,13]},
];

function renderLearn(selected=0,openBranch=null){
  if(!Number.isInteger(selected)||selected<0||selected>=keyConcepts.length)selected=0;
  const branch=openBranch===null?Math.max(0,referenceTree.findIndex(branch=>branch.items.includes(selected))):openBranch;
  const currentBranch=referenceTree[branch]||referenceTree[0];
  mode="learn";crumb.textContent="Security reference";content.className="content";setActiveNav();
  content.innerHTML=`<div class="eyebrow">SECURITY, MADE CLEAR</div><h1 class="page-title">Security reference</h1><p class="page-subtitle">Follow the branches from the big idea to the details. Open a topic to see its explanation and the next related step.</p><div class="reference-tree-layout"><nav class="reference-tree" aria-label="Security reference tree"><div class="tree-root"><span class="tree-root-dot">E</span><div><strong>EncoVault reference</strong><small>Choose a branch to explore</small></div></div>${referenceTree.map((branchItem,index)=>`<section class="tree-branch ${index===branch?"open":""}"><button class="branch-toggle" data-ref-branch="${index}" aria-expanded="${index===branch}"><span class="branch-arrow">${index===branch?"⌄":"›"}</span><span><strong>${branchItem.title}</strong><small>${branchItem.hint} · ${branchItem.items.length} topics</small></span></button>${index===branch?`<div class="tree-leaves">${branchItem.items.map((topicIndex,position)=>{const topic=keyConcepts[topicIndex];return `<button class="tree-leaf ${topicIndex===selected?"selected":""}" data-ref-topic="${topicIndex}"><span class="leaf-line"></span><span class="leaf-number">${String(position+1).padStart(2,"0")}</span><span><strong>${topic[1]}</strong><small>${topic[0]}</small></span><span class="leaf-mark">${topicIndex===selected?"●":"○"}</span></button>`;}).join("")}</div>`:""}</section>`).join("")}</nav><article class="concept-detail reference-detail" id="concept-detail"></article></div>`;
  content.querySelectorAll("[data-ref-branch]").forEach(button=>button.addEventListener("click",()=>{const next=Number(button.dataset.refBranch);const first=referenceTree[next].items[0];renderLearn(keyConcepts[selected]&&referenceTree[next].items.includes(selected)?selected:first,next);}));
  content.querySelectorAll("[data-ref-topic]").forEach(button=>button.addEventListener("click",()=>renderLearn(Number(button.dataset.refTopic),branch)));
  const topic=keyConcepts[selected];const detail=document.getElementById("concept-detail");
  const related=currentBranch.items.filter(index=>index!==selected).slice(0,2);
  detail.innerHTML=`<div class="detail-path"><span>EncoVault reference</span><b>›</b><span>${currentBranch.title}</span><b>›</b><strong>${topic[1]}</strong></div><span class="concept-unit">${topic[0]}</span><h2>${topic[1]}</h2><p>${topic[2]}</p><div class="takeaway"><strong>Practical takeaway</strong><p>${topic[3]}</p></div>${related.length?`<div class="related-topics"><strong>Continue this branch</strong><div>${related.map(index=>`<button data-ref-topic="${index}">${keyConcepts[index][1]} <span>→</span></button>`).join("")}</div></div>`:""}${topic[4]?`<button class="browse-button" id="related-lab">Open related tool →</button>`:""}`;
  detail.querySelectorAll("[data-ref-topic]").forEach(button=>button.addEventListener("click",()=>renderLearn(Number(button.dataset.refTopic),branch)));
  if(topic[4])document.getElementById("related-lab").onclick=()=>renderLab(topic[4]);
}

function renderLab(category){
  const labNames={classical:["Caesar cipher","Vigenère cipher"],modern:["AES-GCM demo","SHA-256 hash"],compression:["Run-length encoding","Entropy explorer"],network:["Password strength","Firewall rules"]};
  const categories={classical:{label:"Classical cipher tools",crumb:"Classical ciphers",summary:"Try historic ciphers with sample messages."},modern:{label:"Modern crypto tools",crumb:"Modern cryptography",summary:"See how authenticated encryption and hashing behave."},compression:{label:"Compression tools",crumb:"Compression",summary:"Explore repeated patterns and information density."},network:{label:"Network security tools",crumb:"Network security",summary:"Try simple, local authentication and traffic rule examples."}};
  if(!Object.hasOwn(labNames,category))category="classical";
  mode="lab";activeLab=category;crumb.textContent=categories[category].crumb;content.className="content";setActiveNav();
  content.innerHTML=`<div class="eyebrow">LEARN BY TRYING</div><h1 class="page-title">${categories[category].label}</h1><p class="page-subtitle">${categories[category].summary} Sample inputs stay in this browser.</p><div class="lab-tabs">${Object.entries({classical:"Classical ciphers",modern:"Modern crypto",compression:"Compression",network:"Network security"}).map(([key,label])=>`<button class="lab-tab ${key===category?"active":""}" data-category="${key}">${label}</button>`).join("")}</div><section class="lab-workspace" id="lab-workspace"></section><div class="muted-caption">Small demonstrations for exploring security ideas.</div>`;
  content.querySelectorAll("[data-category]").forEach(button=>button.addEventListener("click",()=>renderLab(button.dataset.category)));
  renderLabTool(category,labNames[category][0]);
}

function renderLabTool(category,name){
  const tools={classical:["Caesar cipher","Vigenère cipher"],modern:["AES-GCM demo","SHA-256 hash"],compression:["Run-length encoding","Entropy explorer"],network:["Password strength","Firewall rules"]};
  if(!Object.hasOwn(tools,category))category="classical";
  const options=tools[category];if(!options.includes(name))name=options[0];
  const panel=document.getElementById("lab-workspace");if(!panel)return;
  panel.innerHTML=`<div class="lab-tabs">${options.map(option=>`<button class="lab-tab ${option===name?"active":""}" data-tool="${escapeHTML(option)}">${escapeHTML(option)}</button>`).join("")}</div><div id="lab-tool-content"></div>`;
  panel.querySelectorAll("[data-tool]").forEach(button=>button.addEventListener("click",()=>renderLabTool(category,button.dataset.tool)));
  const target=document.getElementById("lab-tool-content");
  if(name==="Caesar cipher"||name==="Vigenère cipher"){
    target.innerHTML=`<h2>${name}</h2><p>Encrypt or decrypt a sample message and inspect the result.</p><label class="field-label">MESSAGE</label><textarea class="lab-input" id="sim-input">ATTACK AT DAWN</textarea><div class="lab-row"><div><label class="field-label">${name==="Caesar cipher"?"SHIFT":"KEYWORD"}</label><input class="field" id="sim-key" value="${name==="Caesar cipher"?"3":"LEMON"}"></div><div><label class="field-label">ACTION</label><select class="select" id="sim-mode"><option value="1">Encrypt</option><option value="-1">Decrypt</option></select></div></div><button class="browse-button" id="sim-run">Run simulation</button><div class="lab-output" id="sim-output">Result appears here</div>`;
    document.getElementById("sim-run").onclick=()=>{const text=document.getElementById("sim-input").value;const key=document.getElementById("sim-key").value;const direction=Number(document.getElementById("sim-mode").value);let index=0;const result=[...text].map(char=>{const upper=char.toUpperCase();if(upper<"A"||upper>"Z")return char;const base=char===upper?65:97;const shift=name==="Caesar cipher"?(Number(key)||0):key.toUpperCase().replace(/[^A-Z]/g,"").charCodeAt(index++%Math.max(1,key.replace(/[^A-Z]/gi,"").length))-65;if(name!=="Caesar cipher"&&!key.replace(/[^A-Z]/gi,""))return char;return String.fromCharCode((char.charCodeAt(0)-base+shift*direction+2600)%26+base);}).join("");document.getElementById("sim-output").textContent=result;};
  }else if(name==="Run-length encoding"){
    target.innerHTML=`<h2>Run-length encoding</h2><p>Replace repeated symbols with a count and value.</p><textarea class="lab-input" id="sim-input">AAAAABBBCCDAA</textarea><button class="browse-button" id="sim-run">Compress</button><div class="lab-output" id="sim-output"></div>`;
    document.getElementById("sim-run").onclick=()=>{const text=document.getElementById("sim-input").value;let out="";for(let i=0;i<text.length;){let j=i+1;while(j<text.length&&text[j]===text[i])j++;out+=text[i]+(j-i>1?j-i:"");i=j;}document.getElementById("sim-output").textContent=`${out}\n${text.length} → ${out.length} symbols`;};
  }else if(name==="Entropy explorer"){
    target.innerHTML=`<h2>Character entropy</h2><p>Estimate Shannon entropy from the symbol distribution.</p><textarea class="lab-input" id="sim-input">BANANA BANDANA</textarea><button class="browse-button" id="sim-run">Calculate</button><div class="lab-output" id="sim-output"></div>`;
    document.getElementById("sim-run").onclick=()=>{const text=document.getElementById("sim-input").value;const counts={};for(const char of text)counts[char]=(counts[char]||0)+1;const h=text.length?Object.values(counts).reduce((sum,count)=>{const p=count/text.length;return sum-p*Math.log2(p);},0):0;document.getElementById("sim-output").textContent=`${h.toFixed(3)} bits per character · ${Object.keys(counts).length} unique symbols`;};
  }else if(name==="SHA-256 hash"){
    target.innerHTML=`<h2>SHA-256 fingerprint</h2><p>Change one character and compare the resulting digest.</p><textarea class="lab-input" id="sim-input">EncoVault learning lab</textarea><button class="browse-button" id="sim-run">Hash message</button><div class="lab-output" id="sim-output"></div>`;
    document.getElementById("sim-run").onclick=async()=>{const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(document.getElementById("sim-input").value));document.getElementById("sim-output").textContent=[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");};
  }else if(name==="AES-GCM demo"){
    target.innerHTML=`<h2>AES-256-GCM round trip</h2><p>Encrypt and decrypt a sample with a fresh temporary key.</p><textarea class="lab-input" id="sim-input">Sample message</textarea><button class="browse-button" id="sim-run">Run AES demo</button><div class="lab-output" id="sim-output"></div>`;
    document.getElementById("sim-run").onclick=async()=>{const key=await crypto.subtle.generateKey({name:"AES-GCM",length:256},true,["encrypt","decrypt"]);const iv=crypto.getRandomValues(new Uint8Array(12));const data=new TextEncoder().encode(document.getElementById("sim-input").value);const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,data);const clear=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,encrypted);document.getElementById("sim-output").textContent=`Encrypted ${encrypted.byteLength} bytes\nDecrypted: ${new TextDecoder().decode(clear)}`;};
  }else if(name==="Password strength"){
    target.innerHTML=`<h2>Password strength sandbox</h2><p>Scoring happens locally. Do not enter a real password.</p><input class="field" id="sim-input" type="password" placeholder="Use a fictional sample"><button class="browse-button" id="sim-run">Check sample</button><div class="lab-output" id="sim-output"></div>`;
    document.getElementById("sim-run").onclick=()=>{const value=document.getElementById("sim-input").value;const score=[value.length>=12,/[a-z]/.test(value)&&/[A-Z]/.test(value),/\d/.test(value),/[^A-Za-z0-9]/.test(value)].filter(Boolean).length;document.getElementById("sim-output").textContent=`Sample score: ${score}/4 · ${["Very weak","Weak","Fair","Good","Stronger sample"][score]}`;};
  }else{
    target.innerHTML=`<h2>Firewall rule sandbox</h2><p>Choose a sample packet and see whether this simple rule set allows it.</p><label class="field-label">SAMPLE PACKET</label><select class="select" id="sim-input"><option value="https">Outbound HTTPS · TCP 443</option><option value="ssh">Inbound SSH · TCP 22</option><option value="dns">Outbound DNS · UDP 53</option></select><button class="browse-button" id="sim-run">Evaluate sample</button><div class="lab-output" id="sim-output">Sample rules: allow outbound HTTPS and DNS; deny inbound connections by default.</div>`;
    document.getElementById("sim-run").onclick=()=>{const packet=document.getElementById("sim-input").value;document.getElementById("sim-output").textContent=packet==="https"||packet==="dns"?"ALLOW · matches outbound service rule":"DENY · inbound by default";};
  }
}

navButtons.forEach(button=>button.addEventListener("click",()=>{if(button.hasAttribute("data-mode")){mode=button.getAttribute("data-mode");renderFileTool();}else if(button.hasAttribute("data-learn"))renderLearn();else renderLab(button.getAttribute("data-lab"));}));
document.getElementById("home-link").addEventListener("click",event=>{event.preventDefault();mode="lock";renderFileTool();});
renderFileTool();
