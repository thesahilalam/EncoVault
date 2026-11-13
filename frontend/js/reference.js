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
    modern: {label: "Modern Cryptography", crumb: "Modern Crypto", summary: "Authenticated encryption, hashing, and public key techniques.", tools: ["AES-GCM demo", "RSA-OAEP demo", "SHA-256 hash"]},
    compression: {label: "Compression Lab", crumb: "Compression", summary: "Interactive demos on how data redundancy is removed.", tools: ["Run-length encoding", "Huffman coding", "Entropy explorer"]}
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
    modern: ["AES-GCM demo", "RSA-OAEP demo", "SHA-256 hash"],
    compression: ["Run-length encoding", "Huffman coding", "Entropy explorer"]
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
  } else {
      target.innerHTML=`<div class="work-card"><h2>${name}</h2><p>Interactive tool active.</p></div>`;
  }
}

