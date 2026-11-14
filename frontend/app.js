// Entry point - imports all modules and initializes the app
import * as API from "./js/api.js";
import * as UI from "./js/ui.js";
import * as Zip from "./js/zip.js";
import * as Archive from "./js/archive.js";
import * as FileSecurity from "./js/file-security.js";
import * as Compress from "./js/compress.js";
import * as AES from "./js/aes.js";
import * as Reference from "./js/reference.js";

// Make AES and API available globally for backward compatibility (reference.js uses window.AES)
if (typeof window !== "undefined") {
  window.AES = AES.AES;
  window.API = API.API;
}

const content = document.getElementById("content");
const crumb = document.getElementById("crumb");
const navButtons = [...document.querySelectorAll("[data-mode], [data-lab], [data-learn]")];
let mode = "lock";
let selectedFiles = [];
let activeLab = "classical";

function setActiveNav(){
  navButtons.forEach(button=>button.classList.toggle("active",(button.dataset.mode==="lock"&&(mode==="lock"||mode==="unlock"))||button.dataset.mode===mode||button.dataset.lab===activeLab&&mode==="lab"||button.hasAttribute("data-learn")&&mode==="learn"));
}


function updateAnalyzer(password){
  const bf = document.getElementById("brute-force-est");
  const ent = document.getElementById("entropy-est");
  const cp = document.getElementById("compress-est");
  if (!bf || !ent) return;
  if (!password || password.length < 4) { bf.textContent = "—"; ent.textContent = "—"; if(cp) cp.textContent = "—"; return; }
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  const entropy = password.length * Math.log2(pool);
  const guesses = 1e7;
  const seconds = Math.pow(2, entropy) / (2 * guesses);
  const years = seconds / (3600 * 24 * 365);
  let timeStr;
  if (years < 1) timeStr = "< 1 year";
  else if (years < 1e3) timeStr = "~" + years.toFixed(1) + " years";
  else if (years < 1e6) timeStr = "~" + (years/1e3).toFixed(1) + "K years";
  else if (years < 1e9) timeStr = "~" + (years/1e6).toFixed(1) + "M years";
  else if (years < 1e12) timeStr = "~" + (years/1e9).toFixed(1) + "B years";
  else timeStr = "> 1T years";
  bf.textContent = timeStr + " @ 10M guesses/sec";
  ent.textContent = entropy.toFixed(1);
  if (cp) {
    const totalSize = selectedFiles.reduce((s, f) => s + f.size, 0);
    if (totalSize > 0) {
      // rough estimate: text files compress well, images/videos don't
      const hasText = selectedFiles.some(f => f.type.startsWith("text/") || f.name.endsWith(".txt") || f.name.endsWith(".js") || f.name.endsWith(".json") || f.name.endsWith(".html") || f.name.endsWith(".css") || f.name.endsWith(".md"));
      const estRatio = hasText ? 0.35 : 0.95;
      cp.textContent = "~" + (totalSize * estRatio / 1024 / 1024).toFixed(2) + " MB (est.) from " + (totalSize / 1024 / 1024).toFixed(2) + " MB";
    }
  }
}

function renderFileTool(){
  if(mode==="compress"){renderCompressionTool("compress");return;}
  content.className="content";
  const locking=mode==="lock";
  crumb.textContent="Encryption";
  content.innerHTML=`<div class="page-head"><div class="page-head-text"><div class="eyebrow">PRIVATE FILE PROTECTION</div>
    <h1 class="page-title">${locking?"Lock your files.":"Unlock your files."}</h1>
    <p class="page-subtitle">${locking?"Encrypt one file, several files, or an entire folder into one .enco archive.":"Restore files from an .enco archive using its password."}</p></div>
    <div class="mode-switch file-mode-switch" role="group" aria-label="Choose file security action"><button class="mode-choice ${locking?"selected":""}" data-file-mode="lock" aria-pressed="${locking}">Lock files</button><button class="mode-choice ${!locking?"selected":""}" data-file-mode="unlock" aria-pressed="${!locking}">Unlock files</button></div></div>
    <div class="file-workspace file-split"><section class="work-card">
      <h2 class="card-heading">${locking?"Choose files or a folder":"Choose .enco files"}</h2>
      <p class="card-copy">${locking?"Drop files below, browse your files, or choose a folder. Your selection becomes one encrypted download.":"Select one or more .enco files. Restored files download from your browser."}</p>
      <input id="file-picker" type="file" ${locking?"multiple":"multiple accept='.enco'"} hidden>
      ${locking?'<input id="folder-picker" type="file" webkitdirectory directory multiple hidden>':""}
      <div class="drop-zone" id="drop-zone"><div><div class="drop-icon">${locking?"↥":"🔓"}</div><h3>${locking?"Drop files here":"Drop encrypted files here"}</h3><p>or choose from this device</p><button class="browse-button" id="browse-files">Browse files</button>${locking?'<button class="browse-button secondary-button" id="browse-folder">Choose folder</button>':""}</div></div>
      <div id="file-list" class="file-list"></div><div id="file-summary" class="file-summary"></div>
    </section><section class="work-card">
      <h2 class="card-heading">${locking?"Vault security & options":"Unlock password"}</h2>
      <p class="card-copy">${locking?"Create a strong password to protect your files.":"Enter the password used when creating this .enco archive."}</p>
      <div class="field-label">${locking?"VAULT PASSWORD":"PASSWORD"}</div><div class="password-wrap"><input class="field" id="password" type="password" autocomplete="new-password" placeholder="${locking?"Create a strong password":"Enter password"}"><button class="reveal" id="reveal-password" type="button">SHOW</button></div>
      ${locking?'<div class="password-strength" id="password-strength"><div class="strength-track"><span></span></div><small>Use at least 4 characters.</small></div>':""}
      ${locking?'<div class="field-label">CONFIRM PASSWORD</div><input class="field" id="confirm-password" type="password" autocomplete="new-password" placeholder="Enter password again">':""}
      ${locking?'<div class="field-label">SECURITY PROFILE</div><div class="profile-grid"><label class="profile-option"><input type="radio" name="profile" value="balanced" checked><span><strong>Balanced</strong><small>AES-256-GCM · 600,000 rounds</small></span></label><label class="profile-option"><input type="radio" name="profile" value="high"><span><strong>High protection</strong><small>AES-256-GCM · 900,000 rounds</small></span></label></div>':""}
      ${locking?'<label class="compress-toggle"><input type="checkbox" id="compress-before-lock"><span><strong>Compress before locking</strong><small>Use lossless gzip when it makes the file smaller.</small></span></label>':""}
      ${locking?'<div class="analyzer-bar" id="analyzer-bar" style="display:none;margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);"><div class="lab-row"><div><div class="field-label">EST. BRUTE-FORCE TIME</div><div id="brute-force-est" style="font-family:var(--mono);font-size:1.1rem;color:var(--ink);">—</div></div><div><div class="field-label">ENTROPY</div><div id="entropy-est" style="font-family:var(--mono);font-size:1.1rem;color:var(--ink);">— bits</div></div></div><div class="lab-row"><div><div class="field-label">COMPRESSION PREVIEW</div><div id="compress-est" style="font-family:var(--mono);font-size:1.1rem;color:var(--ink);">—</div></div></div></div>':""}
      ${locking?'<div class="keymgmt-bar" id="keymgmt-bar" style="display:none;margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);"><div class="lab-row"><div><div class="field-label">KEY FILE (2FA)</div><select class="select" id="km-keyfile"><option value="none" selected>Disabled</option><option value="generate">Generate .key file</option><option value="require">Require existing .key</option></select></div><div><div class="field-label">THRESHOLD</div><select class="select" id="km-threshold"><option value="2">2 of 3</option><option value="3">3 of 5</option></select></div></div><div class="lab-row"><div><div class="field-label">TIME LOCK</div><input class="field" id="km-timelock" type="datetime-local"></div></div></div>':""}
      ${locking?'<div class="advanced-toggle"><button type="button" class="secondary-button" id="toggle-advanced">Advanced options ▸</button></div>':""}
      ${locking?'<div id="advanced-options" style="display:none;margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);"><div class="lab-row"><div><div class="field-label">AES KEY SIZE</div><select class="select" id="adv-key-bits"><option value="256" selected>AES-256 (default)</option><option value="192">AES-192</option><option value="128">AES-128</option></select></div><div><div class="field-label">KDF HASH</div><select class="select" id="adv-hash"><option value="SHA-256" selected>SHA-256 (default)</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option></select></div></div><div class="lab-row"><div><div class="field-label">PBKDF2 ROUNDS</div><input class="field" id="adv-rounds" type="number" min="100000" max="5000000" step="100000" value="600000"></div><div><div class="field-label">COMPRESSION</div><select class="select" id="adv-compress"><option value="auto" selected>Auto (gzip if smaller)</option><option value="always">Always gzip</option><option value="never">Never</option></select></div></div></div>':""}
      <button class="primary-button" id="run-file-action">${locking?"Lock selection · Create .enco":"Unlock selected files"}</button>
      <div id="operation-message"></div><div id="results"></div>
    </section></div>
    <div class="info-strip"><div class="side-card"><h3>${locking?"How file locking works":"Unlock safely"}</h3><ul>${locking?"<li>A fresh random salt and nonce are created per file.</li><li>File contents and original names are encrypted together.</li><li>Your password stays in this browser and is never uploaded.</li>":"<li>Only valid EncoVault archives are accepted.</li><li>The correct password is required for authenticated decryption.</li><li>Restored files download to your browser’s chosen location.</li>"}</ul></div>${locking?'<div class="side-card"><h3>Security profiles</h3><p><strong>Balanced · 600,000 rounds</strong> derives the key from your password with a strong delay.</p><p><strong>High protection · 900,000 rounds</strong> applies more derivation work for sensitive files.</p></div>':''}<div class="security-note"><strong>Keep your password safe.</strong> EncoVault does not store or recover it. If lost, encrypted files cannot be opened.</div></div>
    <div class="muted-caption">Files are processed locally with browser cryptography. Nothing is sent to a server.</div>`;
  selectedFiles=[];
  renderFileList();
  content.querySelectorAll("[data-file-mode]").forEach(button=>button.addEventListener("click",()=>{mode=button.dataset.fileMode;renderFileTool();}));
  document.getElementById("browse-files").onclick=()=>document.getElementById("file-picker").click();
  document.getElementById("file-picker").onchange=event=>setFiles(event.target.files);
  if(locking){document.getElementById("browse-folder").onclick=()=>document.getElementById("folder-picker").click();document.getElementById("folder-picker").onchange=event=>setFiles(event.target.files);}
  document.getElementById("reveal-password").onclick=()=>{const input=document.getElementById("password");input.type=input.type==="password"?"text":"password";document.getElementById("reveal-password").textContent=input.type==="password"?"SHOW":"HIDE";};
  const advBtn=document.getElementById("toggle-advanced");
  if(advBtn){advBtn.onclick=()=>{const panel=document.getElementById("advanced-options");const open=panel.style.display!=="none";panel.style.display=open?"none":"block";advBtn.textContent=open?"Advanced options ▸":"Advanced options ▾";};}
  // Enter/Return key submits form (works for both lock and unlock)
  const pwd=document.getElementById("password");
  const confirm=document.getElementById("confirm-password");
  const submitBtn=document.getElementById("run-file-action");
  const handleEnter=e=>{if(e.key==="Enter"||e.key==="Return"){e.preventDefault();submitBtn.click();}};
  [pwd, confirm].forEach(el=>el&&el.addEventListener("keydown",handleEnter));
  if(locking){
    pwd.addEventListener("input",updatePasswordStrength);
    updatePasswordStrength();
    // X-Ray + Analyzer
    pwd.addEventListener("input", () => {
      const bar = document.getElementById("analyzer-bar");
      if (bar) bar.style.display = pwd.value.length >= 4 ? "block" : "none";
      updateAnalyzer(pwd.value);
    });
    const cb = document.getElementById("compress-before-lock");
    if (cb) cb.addEventListener("change", () => updateAnalyzer(pwd.value));
  }
  document.getElementById("run-file-action").onclick=locking?lockFiles:unlockFiles;
  const zone=document.getElementById("drop-zone");
  ["dragenter","dragover"].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.add("drag-over");}));
  ["dragleave","drop"].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.remove("drag-over");}));
  zone.addEventListener("drop",event=>setFiles(event.dataTransfer.files));
  setActiveNav();
}

function updatePasswordStrength(){
  const input=document.getElementById("password");const target=document.getElementById("password-strength");if(!input||!target)return;
  const value=input.value;const score=[value.length>=4,value.length>=10,/[a-z]/.test(value)&&/[A-Z]/.test(value),/\d/.test(value),/[^A-Za-z0-9]/.test(value)].filter(Boolean).length;target.dataset.level=String(score);target.querySelector("span").style.width=`${Math.max(8,score*20)}%`;target.querySelector("small").textContent=value.length<4?"Use at least 4 characters.":score<3?"Works, but use a longer password for sensitive files.":score<5?"Good start · add another character type for stronger protection":"Strong password pattern";
}

let compressionAction="compress";
let compressionMethod="gzip";
let compressionMode="lossless";
let imageQuality=0.78;
let imageFormat="image/webp";
let compressionPreviewToken=0;

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

function renderCompressionTool(action,method="gzip",preserveSelection=false){
  const compressing=action==="compress";
  mode="compress";compressionAction=action;compressionMethod=method;
  crumb.textContent="Compression";content.className="content";setActiveNav();
  content.innerHTML=`<div class="page-head"><div class="page-head-text"><div class="eyebrow">COMPRESSION TOOL</div><h1 class="page-title">${compressing?"Compression":"Decompression"}</h1><p class="page-subtitle">${compressing?"Reduce file size locally into one .zip archive.":"Restore the original files inside a .zip archive."}</p></div><div class="mode-switch"><button class="mode-choice ${compressing?"selected":""}" data-compression-mode="compress">Compress</button><button class="mode-choice ${!compressing?"selected":""}" data-compression-mode="decompress">Decompress</button></div></div>
  <div class="file-workspace file-split"><section class="work-card">
    <h2 class="card-heading">${compressing?"Choose files or a folder":"Choose .zip files"}</h2>
    <p class="card-copy">${compressing?"Drop files below, browse your files, or choose a folder. Your selection becomes one standard .zip archive.":"Choose .zip archives to restore the original files. Multi-file archives come back as one folder."}</p>
    <input id="file-picker" type="file" multiple ${compressing?"":"accept='.zip'"} hidden>${compressing?'<input id="folder-picker" type="file" webkitdirectory directory multiple hidden>':""}
    <div class="drop-zone" id="drop-zone"><div><div class="drop-icon">${compressing?"↘":"↗"}</div><h3>${compressing?"Drop files to compress":"Drop .zip files to decompress"}</h3><p>or choose from this device</p><button class="browse-button" id="browse-files">Browse files</button>${compressing?'<button class="browse-button secondary-button" id="browse-folder">Choose folder</button>':""}</div></div>
    <div id="file-list" class="file-list"></div><div id="file-summary" class="file-summary"></div>
  </section><section class="work-card">
    <h2 class="card-heading">${compressing?"Compression settings":"Decompression"}</h2>
    <p class="card-copy">${compressing?"Your files become one standard .zip archive that opens on any device.":"Restore files locally, in your browser."}</p>
    ${compressing?`<div class="compression-settings"><div class="field-label">COMPRESSION MODE</div><div class="compression-choice" role="group" aria-label="Compression quality"><button class="compression-choice-button ${compressionMode==="lossless"?"selected":""}" data-loss-mode="lossless">Lossless <small>exact restore</small></button><button class="compression-choice-button ${compressionMode==="lossy"?"selected":""}" data-loss-mode="lossy">Lossy <small>images only</small></button></div>${compressionMode==="lossy"?`<div class="lossy-options"><label>IMAGE QUALITY <output id="quality-value">${Math.round(imageQuality*100)}%</output><input id="image-quality" type="range" min="35" max="95" value="${Math.round(imageQuality*100)}"></label><label>OUTPUT FORMAT<select id="image-format" class="select"><option value="image/webp" ${imageFormat==="image/webp"?"selected":""}>WebP</option><option value="image/jpeg" ${imageFormat==="image/jpeg"?"selected":""}>JPEG</option></select></label><p>Images use the quality trade-off. PDFs, DOCX, videos and other files use safe lossless gzip automatically.</p></div>`:""}</div>`:""}
    <button class="primary-button" id="run-file-action" ${selectedFiles.length?"":"disabled"}>${compressing?"Start compression":"Start decompression"}</button>
    <div id="operation-message"></div><div id="results"></div>
  </section></div>
  <div class="info-strip"><div class="side-card"><h3>${compressing?"How compression works":"How decompression works"}</h3><ul>${compressing?"<li>Compressed bytes are built in your browser, never uploaded.</li><li>Lossless deflate keeps every original byte.</li><li>Already-compressed media may not get smaller.</li>":"<li>Multi-file archives restore into one folder in a single step.</li><li>.zip archives also open natively on macOS and Windows.</li>"}</ul></div><div class="security-note"><strong>Local processing.</strong> Compression and decompression run entirely in your browser.</div></div>
  <div class="muted-caption">Compression runs locally in your browser. Nothing is sent to a server.</div>`;
  selectedFiles=preserveSelection?[...selectedFiles]:[];
  renderFileList();
  content.querySelectorAll("[data-compression-mode]").forEach(button=>button.addEventListener("click",()=>renderCompressionTool(button.dataset.compressionMode,"gzip",true)));
  content.querySelectorAll("[data-loss-mode]").forEach(button=>button.addEventListener("click",()=>{compressionMode=button.dataset.lossMode;renderCompressionTool(action,"gzip",true);}));
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

function clearPasswordInputs(){
  const password=document.getElementById("password");
  const confirm=document.getElementById("confirm-password");
  if(password){password.value="";password.type="password";}
  if(confirm)confirm.value="";
  const reveal=document.getElementById("reveal-password");
  if(reveal)reveal.textContent="SHOW";
  updatePasswordStrength();
}

/* Return the tool to its idle state: no files, no password, no stale progress. */
function resetFileTool({keepResults=true}={}){
  selectedFiles=[];
  renderFileList();
  updateCompressionPreview();
  ["file-picker","folder-picker"].forEach(id=>{const input=document.getElementById(id);if(input)input.value="";});
  const message=document.getElementById("operation-message");
  if(message)message.innerHTML="";
  if(!keepResults){const results=document.getElementById("results");if(results)results.innerHTML="";}
  clearPasswordInputs();
}

function setFiles(fileList){
  selectedFiles=[...fileList];
  renderFileList();
  updateCompressionPreview();
}

function renderFileList(){
  const list=document.getElementById("file-list");
  if(!list)return;
  list.innerHTML=selectedFiles.map((file,index)=>`<div class="file-item"><span class="file-name">${escapeHTML(file.webkitRelativePath||file.name)}</span><span class="file-size">${formatSize(file.size)}</span><button class="file-remove" data-remove="${index}" aria-label="Remove file">×</button></div>`).join("");
  list.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>{
    selectedFiles.splice(Number(button.dataset.remove),1);
    if(!selectedFiles.length){resetFileTool({keepResults:false});return;}
    renderFileList();
    updateCompressionPreview();
  }));
  document.getElementById("run-file-action").disabled=selectedFiles.length===0;
  const summary=document.getElementById("file-summary");
  if(summary){
    if(!selectedFiles.length){summary.innerHTML="";return;}
    const total=selectedFiles.reduce((sum,file)=>sum+file.size,0);
    const folders=new Set(selectedFiles.map(file=>(file.webkitRelativePath||"").split("/")[0]).filter(Boolean));
    const collection=selectedFiles.length>1||folders.size>0;
    summary.innerHTML=`<div class="selection-summary"><span class="selection-icon">${collection?"▣":"▤"}</span><span><strong>${selectedFiles.length} ${selectedFiles.length===1?"file":"files"} selected</strong><small>${formatSize(total)} total${folders.size?` · ${folders.size} folder`+(folders.size===1?"":"s"):""}</small></span><span class="selection-output">${collection?"One .enco archive":"One .enco file"}</span></div>`;
  }
}

async function updateCompressionPreview(){
  const target=document.getElementById("compression-preview");
  if(!target||mode!=="compress"||compressionAction!=="compress"||compressionMethod!=="gzip")return;
  const token=++compressionPreviewToken;
  if(!selectedFiles.length){target.innerHTML="";return;}
  if(typeof CompressionStream==="undefined"&&!(compressionMode==="lossy"&&selectedFiles.every(isImageFile))){target.innerHTML='<div class="inline-error">This browser cannot calculate a gzip preview.</div>';return;}
  target.innerHTML='<div class="preview-loading">Calculating actual local compression preview…</div>';
  const rows=[];let originalTotal=0,outputTotal=0;
  try{
    for(const file of selectedFiles){
      let result,method;
      if(compressionMode==="lossy"&&isImageFile(file)){const image=await compressImage(file,imageQuality,imageFormat);result=image.blob;method=`${imageFormat.split("/")[1].toUpperCase()} · ${Math.round(imageQuality*100)}%`;}
      else{result=await transformStream(file,"gzip","compress");method="gzip";}
      if(token!==compressionPreviewToken)return;
      originalTotal+=file.size;outputTotal+=result.size;
      const delta=result.size<=file.size?`${((1-result.size/file.size)*100).toFixed(1)}% smaller`:`${((result.size/file.size-1)*100).toFixed(1)}% larger`;
      rows.push(`<div><span>${escapeHTML(file.webkitRelativePath||file.name)}</span><span>${formatSize(file.size)} → ${formatSize(result.size)} · ${delta} · ${method}</span></div>`);
    }
    if(token!==compressionPreviewToken)return;
    const totalDelta=outputTotal<=originalTotal?`${((1-outputTotal/originalTotal)*100).toFixed(1)}% smaller`:`${((outputTotal/originalTotal-1)*100).toFixed(1)}% larger`;
    target.innerHTML=`<div class="preview-card"><h3>Actual local preview</h3><div class="preview-metrics"><div><span>Original</span><strong>${formatSize(originalTotal)}</strong></div><div><span>Estimated output</span><strong>${formatSize(outputTotal)}</strong></div><div class="${outputTotal<=originalTotal?"preview-saving":"preview-growing"}"><span>Change</span><strong>${totalDelta}</strong></div></div><div class="preview-rows">${rows.join("")}</div><small>The download runs the same compression again. Already-compressed JPG, MP4 and PDF files may become larger.</small></div>`;
  }catch(error){if(token===compressionPreviewToken)target.innerHTML=`<div class="inline-error">Preview unavailable: ${escapeHTML(error.message||"could not compress this selection")}</div>`;}
}




function concatBytes(...arrays){const result=new Uint8Array(arrays.reduce((sum,array)=>sum+array.length,0));let offset=0;for(const array of arrays){result.set(array,offset);offset+=array.length;}return result;}

navButtons.forEach(button=>button.addEventListener("click",()=>{if(button.hasAttribute("data-mode")){mode=button.getAttribute("data-mode");renderFileTool();}else if(button.hasAttribute("data-learn"))renderLearn();else renderLab(button.getAttribute("data-lab"));}));
document.getElementById("home-link").addEventListener("click",event=>{event.preventDefault();mode="lock";renderFileTool();});

// Theme toggle
(function(){
  const btn = document.getElementById("theme-toggle");
  const sun = document.getElementById("theme-icon-sun");
  const moon = document.getElementById("theme-icon-moon");
  if (!btn) return;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const apply = (dark) => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    sun.style.display = dark ? "block" : "none";
    moon.style.display = dark ? "none" : "block";
    localStorage.setItem("theme", dark ? "dark" : "light");
  };
  apply(saved ? saved === "dark" : prefersDark);
  btn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    apply(!isDark);
  });
})();

renderFileTool();

// Export init function for main.js
export function initApp() {
  // The app initializes itself when the module loads
  // But we export this for explicit control
}
