// Security Reference: Learn and Lab pages

const keyConcepts=[
  ["Security goals","The CIA triad","The CIA triad describes the three outcomes a secure system should protect. Confidentiality limits who can read information, integrity helps detect unauthorised changes, and availability keeps data and services usable when needed.","When evaluating a control, ask which goal it supports. Encryption mainly protects confidentiality, hashes help check integrity, and backups and redundancy improve availability."],
  ["Risk basics","Threats, vulnerabilities and attacks","A threat is a possible source of harm, such as a malicious user or a hardware failure. A vulnerability is a weakness that can be used or triggered. An attack is the actual attempt to exploit that weakness and cause an unwanted result.","Security teams reduce risk by finding weaknesses early, limiting exposure, adding detection, and preparing a recovery path when prevention fails."],
  ["Encryption","Plaintext, ciphertext and keys","Plaintext is readable input such as a document or message. Encryption uses an algorithm and a key to turn it into ciphertext, which should be unintelligible without the required key. Decryption reverses the process for an authorised user.","A strong design can keep the algorithm public; the secret that must be protected is the key or password. EncoVault combines a password derived key with authenticated encryption so modified data is rejected."],
  ["Encryption","Why classical ciphers fail","Caesar shifts every letter by a fixed amount, while Vigenère changes the shift using a repeating keyword. These ciphers are useful for seeing substitution and key ideas, but their small patterns remain visible. Frequency analysis and repeated structure can often reveal the message without the key.","Classical methods are learning tools, not protection for real files. Their value is showing why modern systems need large key spaces, strong randomness, and authenticated designs.","classical"],
  ["Encryption","Authenticated encryption (AES-GCM)","AES-GCM encrypts and authenticates in one pass. The ciphertext comes with a tag that proves the data was not tampered with. A nonce must never repeat with the same key.","Using AES-GCM with a fresh nonce per message gives confidentiality plus integrity. The tag lets the receiver reject any modified data.","modern"],
  ["Encryption","RSA-OAEP for key exchange","RSA-OAEP encrypts a symmetric key with a public key, using padding that prevents chosen-ciphertext attacks. The recipient decrypts with the private key.","Hybrid schemes use RSA-OAEP to deliver a session key, then AES-GCM for the bulk data. This avoids the size limit of RSA and the speed penalty of public-key crypto on large inputs.","modern"],
  ["Encryption","SHA-256 hash","SHA-256 maps any input to a fixed 256-bit digest. It is deterministic, fast to compute, and practically irreversible. Finding two inputs with the same output is infeasible.","Hashes verify integrity: the sender publishes the digest, the receiver recomputes it. They also anchor digital signatures and key derivation.","modern"],
  ["Encryption","Password-based key derivation (PBKDF2)","PBKDF2 hashes a password with a salt many times. The salt prevents rainbow tables; the iteration count slows down brute force. The output is a key for AES-GCM.","EncoVault uses 600,000 or 900,000 iterations of PBKDF2 with SHA-256 to turn a password into a 256-bit AES key.","modern"],
  ["Encryption","Digital certificates and trust","A certificate binds a public key to an identity, signed by a trusted CA. The chain of signatures leads to a root CA trusted by the OS or browser.","TLS uses certificates so browsers can verify they are talking to the real site, not an impostor.","modern"],
  ["Encryption","TLS and the handshake","TLS negotiates keys, authenticates the server, and provides forward secrecy. The handshake uses certificates, key exchange, and authenticated encryption.","Modern TLS 1.3 removes obsolete features and mandates forward secrecy. EncoVault uses the same AES-GCM and SHA-256 primitives internally.","modern"],
  ["Compression","File compression","File compression reduces the number of bytes needed to store a file while keeping its content intact. EncoVault uses a local gzip stream for a practical, lossless workflow: the restored file has the same bytes as the original.","The compressor looks for repeated or predictable byte patterns and represents them more compactly. During decompression, the stream reverses those representations and rebuilds the original bytes; already-compressed media may show little or no reduction.","Lossless stream compression; adaptive pattern coding; archive-style compression.","Documents, PDFs, DOCX files, source code, backups, images, videos, and files that must be restored exactly.","compression"],
  ["Compression","RLE and Huffman coding","Run-length encoding replaces a repeated sequence with a symbol and a count, so it works well when long runs occur. Huffman coding builds a prefix code in which frequent symbols receive shorter bit sequences. Both methods are lossless, but each has overhead such as counts, code tables, or metadata.","RLE is simple and transparent; Huffman is more flexible when symbol frequencies are uneven. Real compressors often combine several techniques rather than relying on one method alone.","compression"],
  ["Compression","Entropy and information density","Entropy measures the average information content of symbols in a source. A source with evenly distributed, unpredictable symbols has higher entropy and is harder to compress. Repeated or predictable patterns are redundancy that a compressor can represent more efficiently.","Try the same message with and without repetition in the Compression lab. The entropy estimate helps explain why one version may have more room for compression.","compression"],
];

const referenceTree=[
  {title:"Foundations",hint:"Start here",items:[0,1]},
  {title:"Encryption",hint:"How it works",items:[2,3,4,5,6,7,8,9,10]},
  {title:"Modern protection",hint:"Trust the system",items:[4,5,6]},
  {title:"Identity and connections",hint:"Protect access",items:[7,8,9,10]},
  {title:"Compression and data",hint:"Work smarter with data",items:[11,12,13]},
];

function renderLearn(selected=0,openBranch=null){
  if(!Number.isInteger(selected)||selected<0||selected>=keyConcepts.length)selected=0;
  const branch=openBranch===null?Math.max(0,referenceTree.findIndex(branch=>branch.items.includes(selected))):openBranch;
  const currentBranch=referenceTree[branch]||referenceTree[0];
  mode="learn";crumb.textContent="Security reference";content.className="content";setActiveNav();
  content.innerHTML=`<div class="page-head"><div class="page-head-text"><div class="eyebrow">SECURITY, MADE CLEAR</div><h1 class="page-title">Security reference</h1><p class="page-subtitle">Follow the branches from the big idea to the details. Open a topic to see its explanation and the next related step.</p></div></div>
  <div class="reference-tree-layout"><nav class="reference-tree" aria-label="Security reference tree"><div class="tree-root"><span class="tree-root-dot">E</span><div><strong>EncoVault reference</strong><small>Choose a branch to explore</small></div></div>${referenceTree.map((branchItem,index)=>`<section class="tree-branch ${index===branch?"open":""}"><button class="branch-toggle" data-ref-branch="${index}" aria-expanded="${index===branch}"><span class="branch-arrow">${index===branch?"\u2304":"\u203a"}</span><span><strong>${branchItem.title}</strong><small>${branchItem.hint} \u00b7 ${branchItem.items.length} topics</small></span></button>${index===branch?`<div class="tree-leaves">${branchItem.items.map((topicIndex,position)=>{const topic=keyConcepts[topicIndex];return `<button class="tree-leaf ${topicIndex===selected?"selected":""}" data-ref-topic="${topicIndex}"><span class="leaf-line"></span><span class="leaf-number">${String(position+1).padStart(2,"0")}</span><span><strong>${topic[1]}</strong><small>${topic[0]}</small></span><span class="leaf-mark">${topicIndex===selected?"\u25cf":"\u25cb"}</span></button>`;}).join("")}</div>`:""}</section>`).join("")}</nav><article class="concept-detail reference-detail" id="concept-detail"></article></div>`;
  content.querySelectorAll("[data-ref-branch]").forEach(button=>button.addEventListener("click",()=>{const next=Number(button.dataset.refBranch);const first=referenceTree[next].items[0];renderLearn(keyConcepts[selected]&&referenceTree[next].items.includes(selected)?selected:first,next);}));
  content.querySelectorAll("[data-ref-topic]").forEach(button=>button.addEventListener("click",()=>renderLearn(Number(button.dataset.refTopic),branch)));
  const topic=keyConcepts[selected];const detail=document.getElementById("concept-detail");
  const related=currentBranch.items.filter(index=>index!==selected).slice(0,2);
  detail.innerHTML=`<div class="detail-path"><span>EncoVault reference</span><b>\u203a</b><span>${currentBranch.title}</span><b>\u203a</b><strong>${topic[1]}</strong></div><span class="concept-unit">${topic[0]}</span><h2>${topic[1]}</h2><p>${topic[2]}</p><div class="takeaway"><strong>Practical takeaway</strong><p>${topic[3]}</p></div>${related.length?`<div class="related-topics"><strong>Continue this branch</strong><div>${related.map(index=>`<button data-ref-topic="${index}">${keyConcepts[index][1]} <span>\u2192</span></button>`).join("")}</div></div>`:""}${topic[4]?`<button class="browse-button" id="related-lab">Open related tool \u2192</button>`:""}`;
  detail.querySelectorAll("[data-ref-topic]").forEach(button=>button.addEventListener("click",()=>renderLearn(Number(button.dataset.refTopic),branch)));
  if(topic[4])document.getElementById("related-lab").onclick=()=>renderLab(topic[4]);
}

function renderLab(category){
  const labConfig = {
    classical: {label: "Historic Crypto & Cryptanalysis", crumb: "Classical Ciphers", summary: "Explore classical substitution, matrix encryption, and automated cryptanalysis.", tools: ["Caesar Cipher", "Vigenère Cipher", "Playfair Cipher", "Hill Cipher", "Cryptanalysis & Frequency"]},
    modern: {label: "Modern Cryptography", crumb: "Modern Crypto", summary: "Authenticated encryption, RSA, and hashing — entirely in your browser.", tools: ["Block cipher modes — ECB vs GCM", "AES-GCM tamper test", "RSA step-by-step", "SHA-256 avalanche"]},
    compression: {label: "Compression Lab", crumb: "Compression", summary: "Interactive demos on how data redundancy is removed.", tools: ["Run-length encoding", "Huffman coding", "Entropy explorer"]},
    network: {label: "Network Security Lab", crumb: "Network Security", summary: "TLS handshake, certificate chains, firewall rules, and MFA — all simulated locally.", tools: ["TLS handshake walk-through", "Certificate chain viewer", "Firewall rule builder", "MFA & password strength"]}
  };
  if(!labConfig[category]) category = "classical";
  mode="lab";activeLab=category;crumb.textContent=labConfig[category].crumb;content.className="content";setActiveNav();
  content.innerHTML=`<div class="page-head"><div class="page-head-text"><div class="eyebrow">LABORATORY</div>
    <h1 class="page-title">${labConfig[category].label}</h1><p class="page-subtitle">${labConfig[category].summary}</p></div></div>
    <div class="lab-tabs">${Object.entries(labConfig).map(([key,c])=>`<button class="lab-tab ${key===category?"active":""}" data-category="${key}">${c.crumb}</button>`).join("")}</div>
    <section class="lab-workspace" id="lab-workspace"></section>`;
  content.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>renderLab(b.dataset.category)));
  renderLabTool(category, labConfig[category].tools[0]);
}

function renderLabTool(category, name){
  const tools = {
    classical: ["Caesar Cipher", "Vigenère Cipher", "Playfair Cipher", "Hill Cipher", "Cryptanalysis & Frequency"],
    modern: ["Block cipher modes — ECB vs GCM", "AES-GCM tamper test", "RSA step-by-step", "SHA-256 avalanche"],
    compression: ["Run-length encoding", "Huffman coding", "Entropy explorer"],
    network: ["TLS handshake walk-through", "Certificate chain viewer", "Firewall rule builder", "MFA & password strength"]
  };
  const options = tools[category] || tools.classical;
  if(!options.includes(name)) name = options[0];
  const panel=document.getElementById("lab-workspace");
  if(!panel) return;
  panel.innerHTML=`<div class="lab-tabs-sub">${options.map(o=>`<button class="lab-tab-sub ${o===name?"active":""}" data-tool="${escapeHTML(o)}">${escapeHTML(o)}</button>`).join("")}</div><div id="lab-tool-content"></div>`;
  panel.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>renderLabTool(category, b.dataset.tool)));
  
  const target=document.getElementById("lab-tool-content");
  if(name==="Caesar Cipher"){
      target.innerHTML=`<div class="work-card"><h2>Caesar Cipher</h2><p>Shift letters by a fixed amount.</p><textarea class="lab-input" id="sim-input">ATTACK AT DAWN</textarea><div class="lab-row"><div><label class="field-label">SHIFT</label><input class="field" id="sim-key" value="3" type="number" min="1" max="25"></div><div><label class="field-label">ACTION</label><select class="select" id="sim-mode"><option value="1">Encrypt</option><option value="-1">Decrypt</option></select></div></div><button class="browse-button" id="sim-run">Execute</button><div class="lab-output" id="sim-output">Result here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const text = document.getElementById("sim-input").value;
          const shift = parseInt(document.getElementById("sim-key").value) || 0;
          const mode = parseInt(document.getElementById("sim-mode").value);
          const result = [...text].map(c => {
             if (!/[a-z]/i.test(c)) return c;
             const code = c.charCodeAt(0);
             const base = code < 97 ? 65 : 97;
             return String.fromCharCode(((code - base + (shift * mode) + 2600) % 26) + base);
          }).join("");
          document.getElementById("sim-output").textContent = result;
      };
    } else if(name==="Vigenère Cipher"){
      target.innerHTML=`<div class="work-card"><h2>Vigenère Cipher</h2><p>Polyalphabetic substitution using a keyword.</p><textarea class="lab-input" id="sim-input">ATTACK AT DAWN</textarea><div class="lab-row"><div><label class="field-label">KEYWORD</label><input class="field" id="sim-key" value="LEMON"></div><div><label class="field-label">ACTION</label><select class="select" id="sim-mode"><option value="1">Encrypt</option><option value="-1">Decrypt</option></select></div></div><button class="browse-button" id="sim-run">Execute</button><div class="lab-output" id="sim-output">Result here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const text = document.getElementById("sim-input").value.toUpperCase();
          const key = document.getElementById("sim-key").value.toUpperCase().replace(/[^A-Z]/g, '') || "A";
          const mode = parseInt(document.getElementById("sim-mode").value);
          let keyIdx = 0;
          const result = [...text].map(c => {
             if (!/[A-Z]/.test(c)) return c;
             const shift = key.charCodeAt(keyIdx++ % key.length) - 65;
             return String.fromCharCode(((c.charCodeAt(0) - 65 + (shift * mode) + 2600) % 26) + 65);
          }).join("");
          document.getElementById("sim-output").textContent = result;
      };
  } else if(name==="Playfair Cipher"){
      target.innerHTML=`<div class="work-card"><h2>Playfair Cipher</h2><p>Encrypts digraph pairs using a 5×5 key matrix. J is merged into I.</p><textarea class="lab-input" id="sim-input">HELLO WORLD</textarea><div class="lab-row"><div><label class="field-label">KEYWORD</label><input class="field" id="sim-key" value="MONARCHY"></div><div><label class="field-label">ACTION</label><select class="select" id="sim-mode"><option value="1">Encrypt</option><option value="-1">Decrypt</option></select></div></div><button class="browse-button" id="sim-run">Execute</button><div class="lab-output" id="sim-output">Result & Grid will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const rawKey = document.getElementById("sim-key").value.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
          if (!rawKey) { document.getElementById("sim-output").textContent = "Enter a keyword first."; return; }
          const chars = Array.from(new Set((rawKey + "ABCDEFGHIKLMNOPQRSTUVWXYZ").split("")));
          const pos = {};
          chars.forEach((ch, i) => pos[ch] = [Math.floor(i / 5), i % 5]);
          let gridHTML = "<div style='display:grid;grid-template-columns:repeat(5,34px);gap:6px;margin:10px 0;font-weight:bold;'>";
          chars.forEach((ch, i) => gridHTML += `<div style='background:${i < rawKey.length ? '#eef0ff' : '#f0f2f5'};padding:7px;text-align:center;border-radius:4px;color:${i < rawKey.length ? '#4f46e5' : '#333'};'>${ch}</div>`);
          gridHTML += "</div>";
          const mode = parseInt(document.getElementById("sim-mode").value);
          const cleaned = document.getElementById("sim-input").value.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
          const pairs = [];
          for (let i = 0; i < cleaned.length; i += 2) {
              let a = cleaned[i], b = cleaned[i + 1] || 'X';
              if (a === b) { b = 'X'; i--; }
              pairs.push([a, b]);
          }
          const output = pairs.map(([a, b]) => {
              const [ra, ca] = pos[a], [rb, cb] = pos[b];
              if (ra === rb) return mode === 1
                  ? chars[ra * 5 + (ca + 1) % 5] + chars[rb * 5 + (cb + 1) % 5]
                  : chars[ra * 5 + (ca + 24) % 5] + chars[rb * 5 + (cb + 24) % 5];
              if (ca === cb) return mode === 1
                  ? chars[((ra + 1) % 5) * 5 + ca] + chars[((rb + 1) % 5) * 5 + cb]
                  : chars[((ra + 4) % 5) * 5 + ca] + chars[((rb + 4) % 5) * 5 + cb];
              return chars[ra * 5 + cb] + chars[rb * 5 + ca];
          }).join(' ');
          document.getElementById("sim-output").innerHTML = `<b>Key Matrix:</b>${gridHTML}<b>Digraphs:</b> ${pairs.map(p => p.join('')).join(' · ')}<br><b>Result:</b> <span style="color:#0f9d6e;font-weight:bold;">${output}</span>`;
      };
  } else if(name==="Hill Cipher"){
      target.innerHTML=`<div class="work-card"><h2>Hill Cipher (2×2)</h2><p>Linear-algebra block cipher: each letter pair becomes a vector multiplied by a key matrix modulo 26.</p><textarea class="lab-input" id="sim-input">ACT</textarea><div class="lab-row"><div><label class="field-label">KEY MATRIX (a b c d)</label><input class="field" id="sim-key" value="3 3 2 5"></div><div><label class="field-label">ACTION</label><select class="select" id="sim-mode"><option value="1">Encrypt</option><option value="-1">Decrypt</option></select></div></div><button class="browse-button" id="sim-run">Execute</button><div class="lab-output" id="sim-output">Result will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const nums = document.getElementById("sim-key").value.match(/-?\d+/g);
          const output = document.getElementById("sim-output");
          if (!nums || nums.length !== 4) { output.textContent = "Enter 4 integers, e.g. 3 3 2 5"; return; }
          const [a, b, c, d] = nums.map(Number);
          const det = a * d - b * c;
          const detMod = ((det % 26) + 26) % 26;
          const inv = [1,3,5,7,9,11,15,17,19,21,23,25].find(x => (detMod * x) % 26 === 1);
          if (inv === undefined) { output.innerHTML = `<b>det = ${det} ≡ ${detMod} (mod 26)</b> — not invertible. Pick a key whose determinant shares no factor with 26 (e.g. 3 3 2 5 → det 9).`; return; }
          const matrix = parseInt(document.getElementById("sim-mode").value) === 1
              ? [a, b, c, d]
              : [d, -b, -c, a].map(x => ((inv * x) % 26 + 26) % 26);
          const letters = document.getElementById("sim-input").value.toUpperCase().replace(/[^A-Z]/g, '');
          if (!letters) { output.textContent = "Enter letters first."; return; }
          const padded = letters.length % 2 ? letters + 'X' : letters;
          let steps = [];
          let result = '';
          for (let i = 0; i < padded.length; i += 2) {
              const x = padded.charCodeAt(i) - 65, y = padded.charCodeAt(i + 1) - 65;
              const e1 = ((matrix[0] * x + matrix[1] * y) % 26 + 26) % 26, e2 = ((matrix[2] * x + matrix[3] * y) % 26 + 26) % 26;
              steps.push(`[${x},${y}] → [${e1},${e2}] (${padded[i]}${padded[i+1]} → ${String.fromCharCode(e1+65)}${String.fromCharCode(e2+65)})`);
              result += String.fromCharCode(e1 + 65) + String.fromCharCode(e2 + 65);
            }
          output.innerHTML = `<b>Effective key matrix:</b> [${matrix.join(' ')}] · det=${det}, inverse=${inv}<br><b>Step-by-step:</b><br>${steps.join('<br>')}<br><b>Result:</b> <span style="color:#0f9d6e;font-weight:bold;">${result}</span>`;
      };
  } else if(name==="Cryptanalysis & Frequency"){
      target.innerHTML=`<div class="work-card"><h2>Cryptanalysis & Frequency Analysis</h2><p>Break simple substitution with statistics: letter frequency, index of coincidence, and a chi-squared Caesar crack.</p><textarea class="lab-input" id="sim-input">DWWDFN DW GDZQ</textarea><button class="browse-button" id="sim-run">Analyze & Crack Caesar</button><div class="lab-output" id="sim-output">Analysis output...</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const text = document.getElementById("sim-input").value;
          const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
          if (cleanText.length < 2) { document.getElementById("sim-output").textContent = "Provide at least 2 cipher letters for analysis."; return; }
          const engFreq={A:8.2,B:1.5,C:2.8,D:4.3,E:12.7,F:2.2,G:2.0,H:6.1,I:7.0,J:0.15,K:0.77,L:4.0,M:2.5,N:6.7,O:7.5,P:1.9,Q:0.095,R:6.0,S:6.3,T:9.1,U:2.8,V:0.98,W:2.4,X:0.15,Y:2.0,Z:0.074};
          // Observed frequency
          const freq = {};
          [...cleanText].forEach(c => freq[c] = (freq[c] || 0) + 1);
          const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]);
          // Index of coincidence: probability two random letters match (English ≈ 0.066, random ≈ 0.038)
          const ic = Object.values(freq).reduce((sum,n) => sum + n*(n-1), 0) / (cleanText.length*(cleanText.length-1));
          // Chi-squared: pick shift whose decrypted distribution best matches English
          let bestShift = 0, bestChi = Infinity;
          for (let shift=0; shift<26; shift++) {
              const counts = {};
              for (const c of cleanText) { const d = String.fromCharCode(((c.charCodeAt(0)-65-shift+26)%26)+65); counts[d]=(counts[d]||0)+1; }
              let x = 0;
              for (const [L,f] of Object.entries(engFreq)) { const o = counts[L]||0, e = cleanText.length*f/100; x += (o-e)*(o-e)/e; }
              if (x < bestChi) { bestChi = x; bestShift = shift; }
          }
          const crackedText = [...text].map(c => {
             if (!/[a-z]/i.test(c)) return c;
             const code = c.charCodeAt(0);
             const base = code < 97 ? 65 : 97;
             return String.fromCharCode(((code - base - bestShift + 2600) % 26) + base);
          }).join("");
          const maxCount = sorted[0][1];
          const bars = sorted.slice(0,8).map(([c,n]) => `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;"><span style="width:16px;font-weight:bold;color:#4f46e5;">${c}</span><div style="background:#eef0ff;border-radius:4px;height:14px;width:${Math.max(4,(n/maxCount)*60)}%;"></div><span style="font-size:.75rem;color:#666;">${n} (${(n/cleanText.length*100).toFixed(1)}%)</span></div>`).join("");
          document.getElementById("sim-output").innerHTML = `<b>Letter frequencies:</b>${bars}<b>Index of coincidence:</b> ${ic.toFixed(4)} · English ≈ 0.066, random ≈ 0.038 ${ic>0.055?'· <span style="color:#0f9d6e;font-weight:bold;">looks like a monoalphabetic substitution</span>':'· spread out — likely polyalphabetic or short sample'}<br><br><b>Chi-squared Caesar crack:</b> best shift <b>${bestShift}</b> (χ² = ${bestChi.toFixed(1)})<br><span style="color:#0f9d6e;font-weight:bold;">${crackedText}</span>`;
      };
  } else if(name==="Block cipher modes — ECB vs GCM"){
      target.innerHTML=`<div class="work-card"><h2>Block cipher modes — ECB vs GCM</h2><p>The same image encrypted two ways. <strong>ECB</strong> encrypts every 16-byte block independently, so identical blocks become identical ciphertext — the pattern survives encryption. <strong>GCM</strong> (what EncoVault uses) mixes each block with the message position, so nothing leaks.</p><button class="browse-button" id="sim-run">Encrypt the sample image both ways</button><div class="lab-grid3" id="lab-canvas-grid"><div><span class="canvas-label">PLAIN</span><canvas id="cv-plain" width="128" height="128"></canvas></div><div><span class="canvas-label">ECB</span><canvas id="cv-ecb" width="128" height="128"></canvas></div><div><span class="canvas-label">AES-GCM</span><canvas id="cv-gcm" width="128" height="128"></canvas></div></div><div class="lab-output" id="sim-output">Result will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = async () => {
          const out = document.getElementById("sim-output");
          const size = 64; // 64x64 bytes: one gray byte per pixel, clean 16-byte AES blocks
          const plain = new Uint8Array(size*size);
          for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
              const tile = (x>>4) + (y>>4); // strong repeating structure in 16px tiles
              plain[y*size+x] = tile % 2 ? 255 : (x % 16 < 4 ? 0 : 120);
          }
          const key = new Uint8Array([...Array(16)].map((_,i)=>i));
          const ecb = AES.ecbEncrypt(plain, key);
          let gcm;
          try {
              const ck = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
              const iv = new Uint8Array(12); // fixed IV keeps the demo deterministic
              gcm = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM", iv}, ck, plain));
          } catch (error) { out.textContent = "WebCrypto AES-GCM unavailable in this browser: " + error.message; return; }
          const paint = (id, bytes) => { const cv = document.getElementById(id); if (!cv || !cv.getContext) return; const ctx = cv.getContext("2d"); const img = ctx.createImageData(size, size); for (let i = 0; i < bytes.length; i++) { img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=bytes[i]; img.data[i*4+3]=255; } ctx.putImageData(img, 0, 0); };
          paint("cv-plain", plain); paint("cv-ecb", ecb); paint("cv-gcm", gcm);
          const dupBlocks = arr => { const seen = new Map(); for (let o = 0; o < arr.length; o += 16) { const k = arr.slice(o, o+16).join(","); seen.set(k, (seen.get(k)||0)+1); } let d = 0; seen.forEach(n => { if (n > 1) d += n; }); return d; };
          const ecbDup = dupBlocks(ecb), gcmDup = dupBlocks(gcm);
          out.innerHTML = `<b>${plain.length/16} AES blocks.</b> ECB ciphertext contains <b style="color:#d93025;">${ecbDup} duplicated blocks</b> → the eye still sees shapes and edges inside the "noise". AES-GCM contains <b style="color:#0f9d6e;">${gcmDup} duplicated blocks</b> → a genuine pattern block.<br><small>Teaching image encrypted with the demo key 000102…0f. ECB runs on a pure-JS AES core verified against FIPS-197 test vectors; GCM uses your browser's native AES. Real EncoVault files always use GCM.</small>`;
      };
  } else if(name==="AES-GCM tamper test"){
      target.innerHTML=`<div class="work-card"><h2>AES-GCM tamper test</h2><p>GCM is <em>authenticated</em> encryption: a 16-byte tag proves integrity. Encrypt a message, flip one ciphertext bit, and watch decryption reject it.</p><label class="field-label">MESSAGE</label><textarea class="lab-input" id="sim-input">Transfer Rs 100 to Alice</textarea><div class="lab-row"><button class="browse-button" id="sim-run">Encrypt</button><button class="browse-button secondary-button" id="sim-tamper" disabled>Flick one ciphertext bit</button><button class="browse-button secondary-button" id="sim-decrypt" disabled>Attempt decrypt</button></div><div class="lab-output" id="sim-output">Encrypt a message to start.</div></div>`;
      let encIv = null, encBytes = null, encKey = null, tampered = false;
      document.getElementById("sim-run").onclick = async () => {
          const out = document.getElementById("sim-output");
          const msg = document.getElementById("sim-input").value;
          if (!msg) { out.textContent = "Enter a message first."; return; }
          encKey = await crypto.subtle.importKey("raw", crypto.getRandomValues(new Uint8Array(32)), "AES-GCM", false, ["encrypt","decrypt"]);
          encIv = crypto.getRandomValues(new Uint8Array(12));
          const buf = await crypto.subtle.encrypt({name:"AES-GCM", iv: encIv, tagLength: 128}, encKey, new TextEncoder().encode(msg));
          encBytes = new Uint8Array(buf); tampered = false;
          document.getElementById("sim-tamper").disabled = false;
          document.getElementById("sim-decrypt").disabled = false;
          out.innerHTML = `<b>Sealed:</b> ${encBytes.length} bytes ciphertext (${encBytes.length-msg.length} B overhead = 12 B nonce + 16 B tag).<br><code style="font-size:.7rem;word-break:break-all;">${AES.hex(encBytes.subarray(0, 48))}…</code>`;
      };
      document.getElementById("sim-tamper").onclick = () => {
          if (!encBytes) return;
          encBytes[20] ^= 0x01; tampered = true;
          document.getElementById("sim-output").innerHTML += `<br><b style="color:#d93025;">One bit flipped at byte 20.</b> Now try decrypting.`;
      };
      document.getElementById("sim-decrypt").onclick = async () => {
          if (!encBytes) return;
          const out = document.getElementById("sim-output");
          try {
              const pt = await crypto.subtle.decrypt({name:"AES-GCM", iv: encIv, tagLength: 128}, encKey, encBytes);
              out.innerHTML += `<br><b style="color:#0f9d6e;">DECRYPTED OK:</b> "${new TextDecoder().decode(pt)}" ${tampered ? "· unusual — the flip happened to land safely" : "· nothing was modified"}`;
          } catch (error) {
              out.innerHTML += `<br><b style="color:#d93025;">REJECTED — authentication tag mismatch.</b><br>GCM proved the data changed. This is how EncoVault blocks silently corrupted or maliciously edited .enco files.`;
          }
      };
  } else if(name==="RSA step-by-step"){
      target.innerHTML=`<div class="work-card"><h2>RSA step-by-step</h2><p>Textbook RSA with small primes so every number stays visible. Real RSA uses 2048-bit primes — small primes here are strictly for learning.</p><div class="lab-row"><div><label class="field-label">PRIME P</label><input class="field" id="rsa-p" value="17"></div><div><label class="field-label">PRIME Q</label><input class="field" id="rsa-q" value="11"></div><div><label class="field-label">MESSAGE NUMBER (0..n−1)</label><input class="field" id="rsa-m" value="88"></div></div><button class="browse-button" id="sim-run">Run keygen + encrypt + decrypt</button><div class="lab-output" id="sim-output">Steps will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const out = document.getElementById("sim-output");
          const gcd = (a,b) => b ? gcd(b, a%b) : a;
          const egcd = (a,b) => { if (!b) return [1, 0]; const [x, y] = egcd(b, a % b); return [y, x - Math.floor(a / b) * y]; };
          const modInv = (a,m) => { const [x] = egcd(a,m); return ((x % m)+m)%m; };
          const powmod = (base, e, m) => { let r = 1n; base = BigInt(base)%BigInt(m); e = BigInt(e); m = BigInt(m); while (e > 0n) { if (e & 1n) r = r*base % m; base = base*base % m; e >>= 1n; } return Number(r); };
          const p = parseInt(document.getElementById("rsa-p").value, 10), q = parseInt(document.getElementById("rsa-q").value, 10);
          const m0 = parseInt(document.getElementById("rsa-m").value, 10);
          const small = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97];
          if (!small.includes(p) || !small.includes(q) || p === q) { out.textContent = "Pick two different primes from 2…97 for this classroom demo."; return; }
          const n = p*q, phi = (p-1)*(q-1);
          let e = 3; while (gcd(e, phi) !== 1 && e < phi) e += 2;
          if (gcd(e, phi) !== 1) { out.textContent = "No suitable e found; try different primes."; return; }
          const d = modInv(e, phi);
          if (!Number.isInteger(m0) || m0 < 0 || m0 >= n) { out.textContent = `Message number must be 0..${n-1} for this key.`; return; }
          const c = powmod(m0, e, n), mBack = powmod(c, d, n);
          out.innerHTML = `<b>1.</b> n = p × q = ${p} × ${q} = <b>${n}</b><br><b>2.</b> φ(n) = (p−1)(q−1) = ${p-1} × ${q-1} = <b>${phi}</b><br><b>3.</b> public e with gcd(e, φ) = 1 → <b>e = ${e}</b><br><b>4.</b> private d: e·d ≡ 1 (mod φ) → <b>d = ${d}</b> (check: ${e}·${d} = ${e*d} = ${(e*d)%phi} + k·${phi})<br><b>5.</b> encrypt: c = m^e mod n = ${m0}^${e} mod ${n} = <b>${c}</b><br><b>6.</b> decrypt: m = c^d mod n = ${c}^${d} mod ${n} = <b>${mBack}</b> ${mBack===m0?'<span style="color:#0f9d6e;font-weight:bold;">✓ round-trip matches</span>':'<span style="color:#d93025;">✗ mismatch</span>'}<br><small>Public key = (n=${n}, e=${e}) — anyone can encrypt. Only d=${d} recovers the message. With 1024-bit p and q this rests on the hardness of factoring ${n}.</small>`;
      };
  } else if(name==="SHA-256 avalanche"){
      target.innerHTML=`<div class="work-card"><h2>SHA-256 avalanche & integrity check</h2><p>Change one character and watch the entire 256-bit digest scramble — that is the avalanche effect behind every checksum and digital signature.</p><label class="field-label">ORIGINAL TEXT</label><textarea class="lab-input" id="sim-input">The quick brown fox</textarea><label class="field-label">MODIFIED TEXT (try one letter)</label><textarea class="lab-input" id="sim-input2">The quick brown goat</textarea><button class="browse-button" id="sim-run">Hash both</button><div class="lab-output" id="sim-output">Digests and bit-diff will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = async () => {
          const out = document.getElementById("sim-output");
          const a = new TextEncoder().encode(document.getElementById("sim-input").value);
          const b = new TextEncoder().encode(document.getElementById("sim-input2").value);
          if (!a.length && !b.length) { out.textContent = "Enter at least one text first."; return; }
          const ha = new Uint8Array(await crypto.subtle.digest("SHA-256", a));
          const hb = new Uint8Array(await crypto.subtle.digest("SHA-256", b));
          let diffBits = 0, grid = "";
          for (let i = 0; i < 32; i++) { const x = ha[i] ^ hb[i]; for (let k = 0; k < 8; k++) { const on = (x >> k) & 1; diffBits += on; grid += `<span class="bit-cell ${on?"bit-flip":""}">${on?"1":"0"}</span>`; } }
          out.innerHTML = `<b>SHA-256 #1:</b> <code style="word-break:break-all;">${AES.hex(ha)}</code><br><b>SHA-256 #2:</b> <code style="word-break:break-all;">${AES.hex(hb)}</code><br><div class="bit-grid">${grid}</div><b>${diffBits}/256 bits flipped (${(diffBits/256*100).toFixed(1)}%)</b> — ideal is ≈50%. ${diffBits > 90 && diffBits < 166 ? '<span style="color:#0f9d6e;font-weight:bold;">Healthy avalanche ✓</span>' : '<span style="color:#b06000;">Weak flip rate — use two different sentences.</span>'}<br><small>Grid shows digest #1's bits; highlighted cells differ in digest #2. One edited byte in a file is why every checksum and signature fails.</small>`;
      };
  } else if(name==="Run-length encoding"){
      target.innerHTML=`<div class="work-card"><h2>Run-length encoding</h2><p>Replace long runs of one symbol with the symbol plus a count. Great for repeating data; tiny files can actually grow.</p><label class="field-label">SAMPLE DATA</label><textarea class="lab-input" id="sim-input">AAAAABBBCCDAAAAA</textarea><button class="browse-button" id="sim-run">Encode</button><div class="lab-output" id="sim-output">Result will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const sample = document.getElementById("sim-input").value;
          const out = document.getElementById("sim-output");
          if (!sample) { out.textContent = "Enter sample data first."; return; }
          let encoded = "", runs = 0;
          for (let i = 0; i < sample.length;) {
              let j = i + 1;
              while (j < sample.length && sample[j] === sample[i]) j++;
              const run = j - i;
              encoded += (sample[i] === " " ? "␣" : sample[i]) + (run > 1 ? "×" + run : "");
              runs += run > 1 ? 1 : 0;
              i = j;
          }
          out.innerHTML = `<b>RLE runs:</b> ${encoded.trim()}<br><b>Input:</b> ${sample.length} symbols → <b>Encoded display:</b> ${encoded.trim().length} characters · ${runs} long run${runs===1?"":"s"} detected<br><small>Real formats (PNG, RLE .pack, fax G3) pack each symbol+count into exact bytes, so the true ratio is better than this display suggests.</small>`;
      };
  } else if(name==="Huffman coding"){
      target.innerHTML=`<div class="work-card"><h2>Huffman coding</h2><p>Frequent symbols get short bit codes, rare symbols get longer ones. The tree is prefix-free, so decoding is unambiguous.</p><label class="field-label">SAMPLE TEXT</label><textarea class="lab-input" id="sim-input">AABBBCCCC</textarea><button class="browse-button" id="sim-run">Build code tree</button><div class="lab-output" id="sim-output">Code table and encoded bits will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const sample = document.getElementById("sim-input").value;
          const out = document.getElementById("sim-output");
          if (!sample) { out.textContent = "Enter sample text first."; return; }
          const counts = new Map();
          for (const ch of sample) counts.set(ch, (counts.get(ch)||0)+1);
          let queue = [...counts].map(([ch, c]) => ({ ch, c, l: null, r: null }));
          while (queue.length > 1) {
              queue.sort((a,b) => a.c - b.c || a.c - b.c);
              const l = queue.shift(), r = queue.shift();
              queue.push({ ch: null, c: l.c + r.c, l, r });
          }
          const codes = {};
          const visit = (node, prefix) => {
              if (node.ch !== null) { codes[node.ch] = prefix || "0"; return; }
              visit(node.l, prefix + "0"); visit(node.r, prefix + "1");
          };
          visit(queue[0], "");
          const table = Object.entries(codes).map(([ch, code]) => `<span class="code-chip">${JSON.stringify(ch)} → ${code}</span>`).join(" ");
          const bits = [...sample].map(ch => codes[ch]).join("");
          const avg = bits.length / sample.length;
          out.innerHTML = `<b>Code table:</b> ${table}<br><b>Encoded:</b> <code style="word-break:break-all;">${bits}</code><br>${sample.length} symbols × 8 bits = ${sample.length*8} input bits → <b>${bits.length} encoded bits</b> (${(avg).toFixed(2)} bits/symbol vs 8)${sample.length*8 > bits.length ? `<span style="color:#0f9d6e;font-weight:bold;"> · ${(100 - bits.length*100/(sample.length*8)).toFixed(1)}% smaller</span>` : " · <em>not worth it for tiny samples — the code table itself must be stored too</em>"}<br><small>Each character's code length is ⌈−log₂ p⌉-ish: frequent symbols shorter, rare symbols longer. DEFLATE (ZIP/gzip) builds on exactly this idea.</small>`;
      };
  } else if(name==="Entropy explorer"){
      target.innerHTML=`<div class="work-card"><h2>Entropy explorer</h2><p>Shannon entropy measures average surprise per symbol. High repetition = low entropy = more compressible.</p><label class="field-label">SAMPLE TEXT</label><textarea class="lab-input" id="sim-input">AAAAABBBCCDAA</textarea><button class="browse-button" id="sim-run">Analyze</button><div class="lab-output" id="sim-output">Entropy and per-symbol breakdown will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const sample = document.getElementById("sim-input").value;
          const out = document.getElementById("sim-output");
          if (!sample) { out.textContent = "Enter sample text first."; return; }
          const counts = new Map();
          for (const ch of sample) counts.set(ch, (counts.get(ch)||0)+1);
          let H = 0;
          const rows = [...counts].map(([ch, n]) => {
              const p = n / sample.length;
              H -= p * Math.log2(p);
              return { ch, n, p, bits: -p * Math.log2(p) };
          }).sort((a,b) => b.n - a.n);
          const maxH = Math.log2(counts.size);
          out.innerHTML = rows.map(r => `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;"><span style="width:22px;font-weight:bold;color:#4f46e5;">${JSON.stringify(r.ch)}</span><div style="background:#eef0ff;border-radius:4px;height:14px;width:${Math.max(3, r.p*60)}%;"></div><span style="font-size:.75rem;color:#666;">p=${r.p.toFixed(3)} · ${r.bits.toFixed(3)} bits</span></div>`).join("") + `<br><b>H = ${H.toFixed(3)} bits/symbol</b> (max ${maxH.toFixed(3)} with ${counts.size} symbols)<br>8-bit input: ${sample.length*8} bits → lower-bound compressed ≈ ${Math.ceil(H*sample.length)} bits<br><small>Random text sits near 4.7 bits/symbol (English letters); pure noise near 8. The smaller H, the more headroom a compressor can exploit.</small>`;
      };
  } else if(name==="TLS handshake walk-through"){
      target.innerHTML=`<div class="work-card"><h2>TLS Handshake</h2><p>Click through the standard TLS 1.3 handshake. It negotiates security without sending secrets in the clear.</p><div class="lab-row"><button class="browse-button" id="sim-run">Start Handshake</button></div><div class="lab-output" id="sim-output">Handshake sequence appears here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const steps = [
              "1. ClientHello: Client sends supported ciphers & random number.",
              "2. ServerHello: Server picks cipher & sends its certificate.",
              "3. Certificate Verify: Client verifies server identity.",
              "4. Key Exchange: Both compute shared secret (Diffie-Hellman).",
              "5. Finished: Secure channel established. Encryption begins."
          ];
          let s = 0;
          const out = document.getElementById("sim-output");
          out.innerHTML = `<ul id="handshake-list" style="padding-left:20px;"></ul>`;
          const list = document.getElementById("handshake-list");
          const next = () => {
              if (s < steps.length) {
                  const li = document.createElement("li"); li.textContent = steps[s++]; list.appendChild(li);
                  setTimeout(next, 800);
              }
          };
          next();
      };
  } else if(name==="Certificate chain viewer"){
      target.innerHTML=`<div class="work-card"><h2>Certificate chain</h2><p>View a mock trust chain from an end-site cert back to a trusted root.</p><div class="lab-row"><button class="browse-button" id="sim-run">Show Chain</button></div><div class="lab-output" id="sim-output">Result appears here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          document.getElementById("sim-output").innerHTML = `<b>Root CA:</b> "DigiCert Global Root"<br>&nbsp;└─ <b>Intermediate CA:</b> "DigiCert TLS RSA SHA256"<br>&nbsp;&nbsp;&nbsp;└─ <b>End-site:</b> "encovault.vercel.app"<br><br><small>Your browser checks signatures in reverse: it already trusts the Root CA. Each link validates the next one until the site's cert is verified.</small>`;
      };
  } else if(name==="Firewall rule builder"){
      target.innerHTML=`<div class="work-card"><h2>Firewall Rule Sandbox</h2><p>Sample rules: allow outbound HTTPS and DNS, deny all inbound.</p><label class="field-label">SAMPLE PACKET</label><select class="select" id="sim-input"><option value="https">Outbound HTTPS (TCP 443)</option><option value="ssh">Inbound SSH (TCP 22)</option></select><button class="browse-button" id="sim-run">Evaluate</button><div class="lab-output" id="sim-output"></div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const p = document.getElementById("sim-input").value;
          document.getElementById("sim-output").innerHTML = p === "https" ? '<b style="color:#0f9d6e;">ALLOW</b> · outbound traffic matches rule' : '<b style="color:#d93025;">DENY</b> · inbound traffic dropped by default';
      };
  } else if(name==="MFA & password strength"){
      target.innerHTML=`<div class="work-card"><h2>MFA & Password Strength</h2><p>Estimate strength and see how MFA blocks stolen passwords.</p><label class="field-label">PASSWORD</label><input class="field" id="sim-input" placeholder="Type password..."><div class="lab-row"><label class="field-label">MFA CODE (Try "123456")</label><input class="field" id="sim-mfa" value="000000"></div><button class="browse-button" id="sim-run">Login</button><div class="lab-output" id="sim-output"></div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const pwd = document.getElementById("sim-input").value;
          const mfa = document.getElementById("sim-mfa").value;
          const out = document.getElementById("sim-output");
          if (pwd.length < 6) out.innerHTML = `<b style="color:#d93025;">DENY</b> · Password too short.`;
          else if (mfa !== "123456") out.innerHTML = `<b style="color:#d93025;">DENY</b> · Correct password, but MFA code is wrong.`;
          else out.innerHTML = `<b style="color:#0f9d6e;">ACCESS GRANTED</b> · MFA prevented account takeover!`;
      };
  } else {
      target.innerHTML=`<div class="work-card"><h2>${name}</h2><p>Interactive tool active.</p></div>`;
  }
}

