/* EncoVault page controller — classic script loaded after all feature modules. */
var content = document.getElementById("content");
var crumb = document.getElementById("crumb");
var navButtons = [...document.querySelectorAll("[data-nav]")];
var mode = document.body.dataset.page || "home";
var selectedFiles = [];
var activeLab = "classical";

function setAppMode(nextMode) { mode = nextMode; useUI().setState({mode: nextMode}); }
function setActiveNav() {
  navButtons.forEach(link => link.classList.toggle("active",
    link.dataset.nav === mode ||
    (link.dataset.nav === "crypto" && mode === "unlock") ||
    (link.dataset.nav === "simulation" && mode === "lab")
  ));
}
function setCrumb(text) { if (crumb) crumb.textContent = text; }

function updatePasswordStrength() {
  const input = document.getElementById("password"), target = document.getElementById("password-strength");
  if (!input || !target) return;
  const value = input.value, score = [value.length >= 4, value.length >= 10, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  target.dataset.level = String(score);
  target.querySelector("span").style.width = `${Math.max(8, score * 20)}%`;
  target.querySelector("small").textContent = value.length < 4 ? "Use at least 4 characters." : score < 3 ? "Works, but a longer password is safer." : score < 5 ? "Good start · add another character type for stronger protection." : "Strong password pattern";
}

function bindDropZone(zone) {
  ["dragenter", "dragover"].forEach(name => zone.addEventListener(name, event => { event.preventDefault(); zone.classList.add("drag-over"); }));
  ["dragleave", "drop"].forEach(name => zone.addEventListener(name, event => { event.preventDefault(); zone.classList.remove("drag-over"); }));
  zone.addEventListener("drop", event => setFiles(event.dataTransfer.files));
}

function renderFileTool() {
  const locking = mode !== "unlock";
  mode = locking ? "crypto" : "unlock";
  setCrumb("Encryption / Decryption");
  content.className = "content";
  const profileInfo = locking ? '<div class="side-card"><h3>Security profiles</h3><p><strong>Balanced</strong> uses AES-256-GCM with 600,000 PBKDF2 rounds: a practical default for normal files.</p><p><strong>High protection</strong> uses 900,000 rounds: it takes longer but adds password-guessing resistance.</p></div>' : "";
  content.innerHTML = `<div class="page-head"><div class="page-head-text"><div class="eyebrow">PRIVATE FILE PROTECTION</div><h1 class="page-title">${locking ? "Lock your files." : "Unlock your files."}</h1><p class="page-subtitle">${locking ? "Encrypt one file, several files, or an entire folder into one .encovault archive." : "Restore files from an EncoVault archive using its password."}</p></div><div class="mode-switch file-mode-switch" role="group" aria-label="Choose file security action"><button class="mode-choice ${locking ? "selected" : ""}" data-file-mode="crypto" aria-pressed="${locking}">Lock files</button><button class="mode-choice ${locking ? "" : "selected"}" data-file-mode="unlock" aria-pressed="${!locking}">Unlock files</button></div></div><div class="file-workspace file-split"><section class="work-card"><h2 class="card-heading">${locking ? "Choose files or a folder" : "Choose .encovault files"}</h2><p class="card-copy">${locking ? "Drop files below, browse your files, or choose a folder. Your selection becomes one encrypted download." : "Select one or more vault files. Restored files download from your browser."}</p><input id="file-picker" type="file" ${locking ? "multiple" : "multiple accept='.encovault,.enco'"} hidden>${locking ? '<input id="folder-picker" type="file" webkitdirectory directory multiple hidden>' : ""}<div class="drop-zone" id="drop-zone"><div><div class="drop-icon">${locking ? "↥" : "🔓"}</div><h3>${locking ? "Drop files here" : "Drop encrypted files here"}</h3><p>or choose from this device</p><button class="browse-button" id="browse-files" type="button">Browse files</button>${locking ? '<button class="browse-button secondary-button" id="browse-folder" type="button">Choose folder</button>' : ""}</div></div><div id="file-list" class="file-list"></div><div id="file-summary" class="file-summary"></div></section><section class="work-card"><h2 class="card-heading">${locking ? "Vault security & options" : "Unlock password"}</h2><p class="card-copy">${locking ? "Create a strong password to protect your files." : "Enter the password used when creating this .encovault archive."}</p><div class="field-label">${locking ? "VAULT PASSWORD" : "PASSWORD"}</div><div class="password-wrap"><input class="field" id="password" type="password" autocomplete="${locking ? "new-password" : "current-password"}" placeholder="${locking ? "Create a strong password" : "Enter password"}"><button class="reveal" id="reveal-password" type="button" aria-label="Show password" aria-pressed="false">SHOW</button></div>${locking ? '<div class="password-strength" id="password-strength"><div class="strength-track"><span></span></div><small>Use at least 4 characters.</small></div>' : ""}${locking ? '<div class="field-label">CONFIRM PASSWORD</div><input class="field" id="confirm-password" type="password" autocomplete="new-password" placeholder="Enter password again">' : ""}${locking ? '<div class="field-label">SECURITY PROFILE</div><div class="profile-grid"><label class="profile-option"><input type="radio" name="profile" value="balanced" checked><span><strong>Balanced</strong><small>AES-256-GCM · 600,000 rounds</small></span></label><label class="profile-option"><input type="radio" name="profile" value="high"><span><strong>High protection</strong><small>AES-256-GCM · 900,000 rounds</small></span></label></div>' : ""}${locking ? '<label class="compress-toggle"><input type="checkbox" id="compress-before-lock"><span><strong>Compress before locking</strong><small>Use lossless gzip when it makes the file smaller.</small></span></label>' : ""}${locking ? '<div class="security-note"><strong>Extra key management is temporarily unavailable.</strong> Shamir shares, external key files, and time locks are not supported by this archive format.</div>' : ""}<button class="primary-button" id="run-file-action">${locking ? "Lock selection · Create .encovault" : "Unlock selected files"}</button><div id="operation-message" aria-live="polite"></div><div id="results" aria-live="polite"></div></section></div><div class="info-strip"><div class="side-card"><h3>${locking ? "How file locking works" : "Unlock safely"}</h3><ul>${locking ? "<li>A fresh random salt and nonce are created per file.</li><li>File contents and original names are encrypted together.</li><li>Your password stays in this browser and is never uploaded.</li>" : "<li>Only valid EncoVault archives are accepted.</li><li>The correct password is required for authenticated decryption.</li><li>Restored files download to your browser's chosen location.</li>"}</ul></div>${locking ? profileInfo : ""}<div class="security-note"><strong>Keep your password safe.</strong> EncoVault does not store or recover it. If lost, encrypted files cannot be opened.</div></div><div class="muted-caption">Files are processed locally with browser cryptography. Nothing is sent to a server.</div>`;
  selectedFiles = []; renderFileList();
  content.querySelectorAll("[data-file-mode]").forEach(button => button.addEventListener("click", () => { mode = button.dataset.fileMode; renderFileTool(); }));
  document.getElementById("browse-files").onclick = () => document.getElementById("file-picker").click();
  document.getElementById("file-picker").onchange = event => setFiles(event.target.files);
  if (locking) { document.getElementById("browse-folder").onclick = () => document.getElementById("folder-picker").click(); document.getElementById("folder-picker").onchange = event => setFiles(event.target.files); }
  document.getElementById("reveal-password").onclick = event => { const input = document.getElementById("password"), button = event.currentTarget; const visible = input.type === "password"; input.type = visible ? "text" : "password"; button.textContent = visible ? "HIDE" : "SHOW"; button.setAttribute("aria-label", visible ? "Hide password" : "Show password"); button.setAttribute("aria-pressed", String(visible)); };
  if (locking) { document.getElementById("password").addEventListener("input", updatePasswordStrength); updatePasswordStrength(); }
  document.getElementById("run-file-action").onclick = locking ? lockFiles : unlockFiles;
  bindDropZone(document.getElementById("drop-zone")); setActiveNav();
}

function renderCompressionTool(action = "compress") {
  const compressing = action === "compress"; setAppMode("compress"); setCrumb("Compression"); content.className = "content";
  content.innerHTML = `<div class="page-head"><div class="page-head-text"><div class="eyebrow">LOCAL FILE COMPRESSION</div><h1 class="page-title">${compressing ? "Compress files." : "Extract ZIP archives."}</h1><p class="page-subtitle">${compressing ? "Create a standard ZIP archive that opens on macOS, Windows and Linux." : "Restore files from a standard ZIP archive without uploading anything."}</p></div><div class="mode-switch" role="group" aria-label="Choose compression action"><button class="mode-choice ${compressing ? "selected" : ""}" data-compression-mode="compress" aria-pressed="${compressing}">Compress</button><button class="mode-choice ${compressing ? "" : "selected"}" data-compression-mode="decompress" aria-pressed="${!compressing}">Decompress</button></div></div><div class="file-workspace file-split"><section class="work-card"><h2 class="card-heading">${compressing ? "Choose files or a folder" : "Choose .zip files"}</h2><p class="card-copy">${compressing ? "Your selection becomes one standard ZIP download." : "Choose a ZIP archive to restore its files."}</p><input id="file-picker" type="file" multiple ${compressing ? "" : "accept='.zip'"} hidden>${compressing ? '<input id="folder-picker" type="file" webkitdirectory directory multiple hidden>' : ""}<div class="drop-zone" id="drop-zone"><div><div class="drop-icon">${compressing ? "↘" : "↗"}</div><h3>${compressing ? "Drop files to compress" : "Drop a ZIP archive here"}</h3><p>or choose from this device</p><button class="browse-button" id="browse-files" type="button">Browse files</button>${compressing ? '<button class="browse-button secondary-button" id="browse-folder" type="button">Choose folder</button>' : ""}</div></div><div id="file-list" class="file-list"></div><div id="file-summary" class="file-summary"></div></section><section class="work-card"><h2 class="card-heading">${compressing ? "Compression details" : "Extraction details"}</h2><p class="card-copy">${compressing ? "ZIP uses lossless DEFLATE when it makes the archive smaller." : "Extracted file names and paths are validated before they are restored."}</p><div class="security-note"><strong>Good to know.</strong> JPG, MP4, PDF and other already-compressed formats may not shrink further.</div><button class="primary-button" id="run-file-action">${compressing ? "Compress selection" : "Extract selection"}</button><div id="operation-message" aria-live="polite"></div><div id="results" aria-live="polite"></div></section></div><div class="info-strip"><div class="side-card"><h3>${compressing ? "How compression works" : "Extraction notes"}</h3><ul>${compressing ? "<li>DEFLATE combines LZ77 and Huffman coding.</li><li>GZIP wraps DEFLATE with headers/CRC.</li><li>Already-compressed files (JPG, MP4, PDF) may grow slightly.</li>" : "<li>Only valid ZIP archives are accepted.</li><li>Extracted files download to your browser's chosen location.</li><li>Folder structure is preserved when saving to a selected folder.</li>"}</ul></div><div class="muted-caption">Files are processed locally with browser compression. Nothing is sent to a server.</div>`;
  selectedFiles = []; renderFileList();
  content.querySelectorAll("[data-compression-mode]").forEach(button => button.addEventListener("click", () => renderCompressionTool(button.dataset.compressionMode)));
  document.getElementById("browse-files").onclick = () => document.getElementById("file-picker").click(); document.getElementById("file-picker").onchange = event => setFiles(event.target.files);
  if (compressing) { document.getElementById("browse-folder").onclick = () => document.getElementById("folder-picker").click(); document.getElementById("folder-picker").onchange = event => setFiles(event.target.files); }
  document.getElementById("run-file-action").onclick = compressing ? compressFiles : decompressFiles; bindDropZone(document.getElementById("drop-zone")); setActiveNav();
}

function setFiles(fileList) { selectedFiles = [...fileList]; renderFileList(); }
function renderFileList() {
  const list = document.getElementById("file-list"), summary = document.getElementById("file-summary"), runButton = document.getElementById("run-file-action");
  if (!list || !summary || !runButton) return;
  runButton.disabled = selectedFiles.length === 0;
  if (!selectedFiles.length) { list.innerHTML = ""; summary.innerHTML = ""; return; }
  list.innerHTML = selectedFiles.map((file, index) => `<div class="file-item"><span class="file-name">${escapeHTML(file.webkitRelativePath || file.name)}</span><span class="file-size">${formatSize(file.size)}</span><button class="file-remove" type="button" data-remove="${index}" aria-label="Remove file">×</button></div>`).join("");
  list.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => { selectedFiles.splice(Number(button.dataset.remove), 1); renderFileList(); }));
  const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  summary.innerHTML = `<div class="selection-summary"><span class="selection-icon">${selectedFiles.length > 1 ? "▣" : "▤"}</span><span><strong>${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"} selected</strong><small>${formatSize(total)} total</small></span><span class="selection-output">Ready</span></div>`;
}
function resetFileTool() { selectedFiles = []; renderFileList(); clearPasswordInputs(); }
function clearPasswordInputs() { ["password", "confirm-password"].forEach(id => { const input = document.getElementById(id); if (input) { input.value = ""; input.type = "password"; } }); const reveal = document.getElementById("reveal-password"); if (reveal) reveal.textContent = "SHOW"; updatePasswordStrength(); }

function renderHome() {
  setCrumb("Home"); content.className = "content";
  content.innerHTML = `<div class="page-head"><div class="page-head-text"><div class="eyebrow">WELCOME TO ENCOVAULT</div><h1 class="page-title">Your local file security toolkit.</h1><p class="page-subtitle">Encrypt, compress and study core data-security algorithms—entirely in your browser.</p></div></div><div class="feature-grid"><a class="feature-card" href="encryption-decryption.html"><span class="feature-icon">🔐</span><h3>Encryption / Decryption</h3><p>Protect individual files, folders and multi-file archives with password-based AES-GCM.</p><span>Open vault →</span></a><a class="feature-card" href="compression.html"><span class="feature-icon">⌁</span><h3>Compression</h3><p>Create standard ZIP archives and restore them locally with integrity verification.</p><span>Open compression →</span></a><a class="feature-card" href="simulation.html"><span class="feature-icon">🧪</span><h3>Simulation labs</h3><p>Explore classical ciphers, modern cryptography, network security and compression.</p><span>Open simulations →</span></a></div><div class="info-strip"><div class="side-card"><h3>Local-first</h3><ul><li>Your files are processed in this browser.</li><li>No account or upload is required.</li><li>Passwords are never stored by EncoVault.</li></ul></div><div class="side-card"><h3>Made for learning</h3><ul><li>Try algorithms with understandable inputs.</li><li>Compare security and compression trade-offs.</li><li>Use the practical tools alongside the simulations.</li></ul></div></div>`;
  setActiveNav();
}

function bootApp() {
  if (!content) return;
  if (mode === "crypto") { setAppMode("crypto"); renderFileTool(); }
  else if (mode === "compress") renderCompressionTool();
  else if (mode === "simulation") { setAppMode("lab"); renderLab("classical"); }
  else { setAppMode("home"); renderHome(); }
}
bootApp();
