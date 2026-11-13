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
    classical: {label: "Historic Crypto & Cryptanalysis", crumb: "Classical Ciphers", summary: "Explore classical substitution, matrix encryption, and automated cryptanalysis.", tools: ["Caesar Cipher", "Vigenère Cipher", "Playfair Cipher", "Cryptanalysis & Frequency"]},
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
    classical: ["Caesar Cipher", "Vigenère Cipher", "Playfair Cipher", "Cryptanalysis & Frequency"],
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
      target.innerHTML=`<div class="work-card"><h2>Playfair Cipher</h2><p>Construct a 5x5 key matrix (I/J combined) and encrypt digraph pairs.</p><textarea class="lab-input" id="sim-input">PLAYFAIR EXAMPLE</textarea><div class="lab-row"><div><label class="field-label">KEYWORD</label><input class="field" id="sim-key" value="MONARCHY"></div></div><button class="browse-button" id="sim-run">Generate Grid & Process</button><div class="lab-output" id="sim-output">Result & Grid matrix will appear here.</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const rawKey = document.getElementById("sim-key").value.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
          const gridChars = Array.from(new Set((rawKey + "ABCDEFGHIKLMNOPQRSTUVWXYZ").split("")));
          let gridHTML = "<div style='display:grid;grid-template-columns:repeat(5,35px);gap:6px;margin:10px 0;font-weight:bold;'>";
          gridChars.forEach(ch => gridHTML += `<div style='background:#f0f2f5;padding:8px;text-align:center;border-radius:4px;'>${ch}</div>`);
          gridHTML += "</div>";
          
          const text = document.getElementById("sim-input").value.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
          document.getElementById("sim-output").innerHTML = `<b>5x5 Matrix Grid:</b>${gridHTML}<b>Cleaned Digraph Input:</b> ${text}`;
      };
  } else if(name==="Cryptanalysis & Frequency"){
      target.innerHTML=`<div class="work-card"><h2>Cryptanalysis & Frequency Analysis</h2><p>Break simple ciphers automatically or analyze character distribution.</p><textarea class="lab-input" id="sim-input">DOWDFN DW GDZQ</textarea><button class="browse-button" id="sim-run">Analyze & Crack Caesar</button><div class="lab-output" id="sim-output">Analysis output...</div></div>`;
      document.getElementById("sim-run").onclick = () => {
          const text = document.getElementById("sim-input").value;
          const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
          if (!cleanText) {
              document.getElementById("sim-output").textContent = "Provide cipher text for analysis.";
              return;
          }
          const freq = {};
          [...cleanText].forEach(c => freq[c] = (freq[c] || 0) + 1);
          const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]);
          
          let bestShift = 0;
          let bestScore = -Infinity;
          const engFreq = {E:12.7, T:9.1, A:8.2, O:7.5, I:7.0, N:6.7, S:6.3, H:6.1, R:6.0, D:4.3, L:4.0, C:2.8, U:2.8};
          
          for(let shift=0; shift<26; shift++) {
              let score = 0;
              for (const c of cleanText) {
                  const decryptedChar = String.fromCharCode(((c.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
                  score += (engFreq[decryptedChar] || 0);
              }
              if (score > bestScore) {
                  bestScore = score;
                  bestShift = shift;
              }
          }
          
          const crackedText = [...text].map(c => {
             if (!/[a-z]/i.test(c)) return c;
             const code = c.charCodeAt(0);
             const base = code < 97 ? 65 : 97;
             return String.fromCharCode(((code - base - bestShift + 2600) % 26) + base);
          }).join("");
          
          document.getElementById("sim-output").innerHTML = `<b>Top Letter Frequencies:</b> ${sorted.slice(0,5).map(([c,n])=>`${c}:${n}`).join(', ')}<br><br><b>Automated Caesar Crack (Best Guess Shift ${bestShift}):</b><br><span style="color:#0f9d6e;font-weight:bold;">${crackedText}</span>`;
      };
  } else {
      target.innerHTML=`<div class="work-card"><h2>${name}</h2><p>Interactive tool active.</p></div>`;
  }
}

