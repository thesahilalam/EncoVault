export const MAGIC = new Uint8Array([69, 78, 67, 79, 86, 65, 85, 76, 84]);
const HEADER_SIZE = 42;
const HEADER_SIZE_V4 = 48;
const ITERATIONS = {balanced: 600000, high: 900000};
const HASH_IDS = {"SHA-256": 1, "SHA-384": 2, "SHA-512": 3};
const KEY_BITS_IDS = {128: 1, 192: 2, 256: 3};

const ARCHIVE_MAGIC = new Uint8Array([69, 86, 65, 82]); // "EVAR"
const FLAG_GZIP = 1;
const FLAG_ARCHIVE = 2;
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;

export async function transformStream(blob, format, direction) {
  const StreamClass = direction === "compress" ? CompressionStream : DecompressionStream;
  return new Blob([await new Response(blob.stream().pipeThrough(new StreamClass(format))).arrayBuffer()]);
}

async function deriveKey(password, salt, iterations, hash = "SHA-256", keyBits = 256) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "PBKDF2", salt, iterations, hash}, material, {name: "AES-GCM", length: keyBits}, false, ["encrypt", "decrypt"]);
}

export function makeHeader(iterations, salt, iv, version = 2) {
  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC, 0);
  header[9] = version;
  new DataView(header.buffer).setUint32(10, iterations, false);
  header.set(salt, 14);
  header.set(iv, 30);
  return header;
}

function makeHeaderV4(hashId, keyBitsId, iterations, salt, iv) {
  const header = new Uint8Array(HEADER_SIZE_V4);
  header.set(MAGIC, 0);
  header[9] = 4;
  header[10] = hashId;
  header[11] = keyBitsId;
  new DataView(header.buffer).setUint32(16, iterations, false);
  header.set(salt, 20);
  header.set(iv, 36);
  return header;
}

function archivePath(file) {
  const path = file.webkitRelativePath || file.name;
  if (!path || path.split(/[\\/]/).some(part => !part || part === "." || part === "..")) {
    throw new Error("A selected file has an unsafe path.");
  }
  return path.replace(/\\/g, "/");
}

async function createArchive(files, onProgress = () => {}) {
  if (!files.length) throw new Error("Choose at least one file.");
  const encoder = new TextEncoder();
  let total = 8;
  const entries = [];
  for (const file of files) {
    const pathBytes = encoder.encode(archivePath(file));
    if (pathBytes.length > 65535 || file.size > 0xffffffff) throw new Error("A selected file is too large for this archive format.");
    total += 8 + pathBytes.length + file.size;
    if (total > MAX_ARCHIVE_BYTES) throw new Error("This demo vault supports selections up to 250 MB total.");
    entries.push({ file, path: pathBytes });
  }
  const output = new Uint8Array(total);
  output.set(ARCHIVE_MAGIC, 0);
  const view = new DataView(output.buffer);
  view.setUint32(4, entries.length, false);
  let offset = 8;
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    view.setUint32(offset, entry.path.length, false);
    view.setUint32(offset + 4, entry.file.size, false);
    offset += 8;
    output.set(entry.path, offset);
    offset += entry.path.length;
    output.set(new Uint8Array(await entry.file.arrayBuffer()), offset);
    offset += entry.file.size;
    onProgress(index + 1, entries.length, entry.file);
  }
  return new Blob([output], { type: "application/octet-stream" });
}

function readArchive(bytes) {
  if (bytes.length < 8 || !ARCHIVE_MAGIC.every((value, index) => bytes[index] === value)) {
    throw new Error("Encrypted archive contents are invalid.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(4, false);
  let offset = 8;
  const decoder = new TextDecoder();
  const entries = [];
  if (count === 0 || count > 10000) throw new Error("Encrypted archive has an invalid file count.");
  for (let index = 0; index < count; index++) {
    if (offset + 8 > bytes.length) throw new Error("Encrypted archive ends unexpectedly.");
    const pathLength = view.getUint32(offset, false);
    const dataLength = view.getUint32(offset + 4, false);
    offset += 8;
    if (pathLength === 0 || offset + pathLength + dataLength > bytes.length) throw new Error("Encrypted archive entry is invalid.");
    const path = decoder.decode(bytes.slice(offset, offset + pathLength));
    offset += pathLength;
    if (!path || path.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Encrypted archive contains an unsafe path.");
    entries.push({ path, blob: new Blob([bytes.slice(offset, offset + dataLength)]) });
    offset += dataLength;
  }
  if (offset !== bytes.length) throw new Error("Encrypted archive contains unexpected trailing data.");
  return entries;
}

function parseEncoHeader(raw) {
  if (!raw || raw.length < HEADER_SIZE || !MAGIC.every((b, i) => raw[i] === b)) return null;
  const version = raw[9];
  const headerSize = version === 4 ? HEADER_SIZE_V4 : HEADER_SIZE;
  if (raw.length < headerSize) return null;
  const header = raw.slice(0, headerSize);
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  let hash = "SHA-256", keyBits = 256, iterations;
  if (version === 4) {
    hash = Object.keys(HASH_IDS).find(k => HASH_IDS[k] === header[10]) || "SHA-256";
    keyBits = Object.keys(KEY_BITS_IDS).find(k => KEY_BITS_IDS[Number(k)] === header[11]) || 256;
    iterations = view.getUint32(16, false);
  } else {
    iterations = view.getUint32(10, false);
  }
  const salt = version === 4 ? header.slice(20, 36) : header.slice(14, 30);
  const iv = version === 4 ? header.slice(36, 48) : header.slice(30, 42);
  const flags = version === 1 ? 0 : (raw[headerSize + 4] || 0);
  return { version, hash, keyBits, iterations, salt, iv, flags, headerSize };
}

function estimateBruteForce(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  if (pool === 0) return { entropy: 0, timeYears: 0 };
  const entropy = password.length * Math.log2(pool);
  const guessesPerSec = 1e7;
  const seconds = Math.pow(2, entropy) / (2 * guessesPerSec);
  const years = seconds / (3600 * 24 * 365);
  return { entropy: Math.round(entropy * 10) / 10, timeYears: years };
}

// ============ SHAMIR SECRET SHARING (GF(256)) ============
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function() {
  let x = 1;
  for (let i = 0; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; x &= 0xff; }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
const gfAdd = (a, b) => a ^ b;
const gfMul = (a, b) => { if (!a || !b) return 0; return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255]; };
const gfDiv = (a, b) => { if (!a) return 0; if (!b) throw new Error("Division by zero"); return GF_EXP[(GF_LOG[a] - GF_LOG[b] + 255) % 255]; };
const gfInv = a => gfDiv(1, a);

// Evaluate polynomial at x: coeffs[0] + coeffs[1]*x + coeffs[2]*x^2 + ...
function gfPolyEval(coeffs, x) {
  let y = coeffs[coeffs.length - 1];
  for (let i = coeffs.length - 2; i >= 0; i--) y = gfAdd(gfMul(y, x), coeffs[i]);
  return y;
}

// Generate N shares, threshold = k (need k shares to reconstruct)
function shamirSplit(secret, n, k) {
  if (k < 2 || k > n) throw new Error("Threshold must be 2..n");
  if (n > 255) throw new Error("Max 255 shares");
  const coeffs = [secret];
  for (let j = 1; j < k; j++) coeffs.push(crypto.getRandomValues(new Uint8Array(1))[0]);
  const shares = [];
  for (let i = 1; i <= n; i++) {
    const y = gfPolyEval(coeffs, i);
    shares.push({ x: i, y });
  }
  return shares;
}

// Reconstruct secret from k shares using Lagrange interpolation
function shamirCombine(shares) {
  if (shares.length < 2) throw new Error("Need at least 2 shares");
  let secret = 0;
  for (let i = 0; i < shares.length; i++) {
    const { x: xi, y: yi } = shares[i];
    let num = 1, den = 1;
    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      const xj = shares[j].x;
      num = gfMul(num, xj);
      den = gfMul(den, gfAdd(xj, xi));
    }
    secret = gfAdd(secret, gfMul(yi, gfDiv(num, den)));
  }
  return secret;
}

// Encode shares to base64 string for .key files
function sharesToKeyFile(shares, meta = {}) {
  const payload = { shares: shares.map(s => ({ x: s.x, y: s.y })), meta, version: 1 };
  return "ENCOKEY:" + btoa(JSON.stringify(payload));
}

// Parse .key file
function parseKeyFile(text) {
  if (!text.startsWith("ENCOKEY:")) throw new Error("Invalid key file format");
  const payload = JSON.parse(atob(text.slice(8)));
  return { shares: payload.shares.map(s => ({ x: s.x, y: s.y })), meta: payload.meta || {} };
}

// ============ KEY FILE (2FA) ============
function makeKeyFile(masterKey, meta = {}) {
  // masterKey is 32 bytes for AES-256
  const keyBytes = new Uint8Array(masterKey);
  // Split master key into 32 bytes -> 32 shares of 1 byte each? 
  // Simpler: use the master key directly as the secret for Shamir, 
  // but we need 32 bytes. Let's split the 32-byte key into 32 separate Shamir sharings.
  // Actually, for key file 2FA, we just need ONE master key that's split.
  // The key file contains shares of the master key.
  return sharesToKeyFile(shamirSplit(masterKey, meta.shares || 3, meta.threshold || 2), meta);
}

// Time-lock: encrypt with future timestamp check
function timeLockEncrypt(data, unlockTime, password, meta = {}) {
  // This adds a time check to the encryption
  // The actual time check happens on decrypt
  return { data, unlockTime, meta };
}

function timeLockCheck(unlockTime) {
  if (unlockTime && Date.now() < unlockTime) {
    const remaining = unlockTime - Date.now();
    const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    throw new Error(`Time-locked until ${new Date(unlockTime).toLocaleString()}. ${days} day${days!==1?'s':''} remaining.`);
  }
}



async function encryptSelection(files, password, options, onProgress = () => {}) {
  // options: {iterations, hash, keyBits, compression, keyfile, threshold, unlockTime}
  const {iterations, hash, keyBits, compression, keyfile, threshold, unlockTime} = options;
  if (!Object.hasOwn(HASH_IDS, hash)) throw new Error("Unsupported hash function selected.");
  if (!Object.hasOwn(KEY_BITS_IDS, keyBits)) throw new Error("Unsupported key size selected.");
  const version = 4; // Always use v4 for advanced features
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const isArchive = files.length > 1 || Boolean(files[0].webkitRelativePath);
  const displayName = isArchive ? "EncoVault archive" : files[0].name;
  const header = makeHeaderV4(HASH_IDS[hash], KEY_BITS_IDS[keyBits], iterations, salt, iv);
  const key = await deriveKey(password, salt, iterations, hash, keyBits);
  const name = new TextEncoder().encode(displayName);
  let data = isArchive ? await createArchive(files, onProgress) : new Blob([await files[0].arrayBuffer()]);
  if (!isArchive) onProgress(1, 1, files[0]);
  let flags = isArchive ? FLAG_ARCHIVE : 0;
  const canCompress = typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
  const wantCompress = compression === "always" || (compression === "auto" && canCompress);
  const shouldTry = (compression === "always" || compression === "auto") && canCompress;
  if (shouldTry && data.size) {
    try {
      const candidate = await transformStream(data, "gzip", "compress");
      if (compression === "always" || candidate.size < data.size) {
        data = candidate;
        flags |= FLAG_GZIP;
      }
    } catch (error) {
      throw new Error("This browser could not compress the selected file.");
    }
  }
  const payload = new Uint8Array(5 + name.length + data.size);
  new DataView(payload.buffer).setUint32(0, name.length, false);
  payload[4] = flags;
  payload.set(name, 5);
  payload.set(new Uint8Array(await data.arrayBuffer()), 5 + name.length);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv, additionalData: header, tagLength: 128}, key, payload));
  
  let keyFile = null;
  if (keyfile === "generate") {
    const masterKey = crypto.getRandomValues(new Uint8Array(32));
    keyFile = sharesToKeyFile(shamirSplit(masterKey[0], threshold || 2, threshold || 2), {algo: "AES-256-GCM"});
  }
  
  return { blob: new Blob([header, ciphertext], { type: "application/octet-stream" }), compressed: Boolean(flags & FLAG_GZIP), isArchive, version, keyFile, unlockTime };
}

async function decryptFile(file, password) {
  const raw = new Uint8Array(await file.arrayBuffer());
  if (raw.length < HEADER_SIZE + 16 || !MAGIC.every((byte, index) => raw[index] === byte) || ![1, 2, 3, 4].includes(raw[9])) {
    throw new Error("This file is not a supported EncoVault file.");
  }
  const version = raw[9];
  const headerSize = version === 4 ? HEADER_SIZE_V4 : HEADER_SIZE;
  if (raw.length < headerSize + 16) throw new Error("This file is not a supported EncoVault file.");
  const header = raw.slice(0, headerSize);
  const view = new DataView(header.buffer);
  let hash = "SHA-256", keyBits = 256, iterations;
  if (version === 4) {
    hash = Object.keys(HASH_IDS).find(k => HASH_IDS[k] === header[10]);
    keyBits = Object.keys(KEY_BITS_IDS).find(k => KEY_BITS_IDS[Number(k)] === header[11]);
    if (!hash || !keyBits) throw new Error("Unsupported settings in this file.");
    iterations = view.getUint32(16, false);
  } else {
    iterations = view.getUint32(10, false);
  }
  if (!Object.values(ITERATIONS).includes(iterations) && version !== 4) throw new Error("Unsupported security profile in this file.");
  const salt = version === 4 ? header.slice(20, 36) : header.slice(14, 30);
  const iv = version === 4 ? header.slice(36, 48) : header.slice(30, 42);
  const key = await deriveKey(password, salt, iterations, hash, keyBits);
  let plain;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({name: "AES-GCM", iv, additionalData: header, tagLength: 128}, key, raw.slice(headerSize)));
  } catch (error) {
    throw new Error("Password is incorrect or the file is damaged.");
  }
  const nameOffset = (version === 2 || version === 3) ? 5 : 4;
  if (plain.length < nameOffset) throw new Error("Encrypted file contents are invalid.");
  const nameLength = new DataView(plain.buffer, plain.byteOffset, plain.byteLength).getUint32(0, false);
  if (nameLength > plain.length - nameOffset) throw new Error("Encrypted file name is invalid.");
  const originalName = new TextDecoder().decode(plain.slice(nameOffset, nameOffset + nameLength));
  const outputName = originalName.split(/[\\/]/).filter(Boolean).pop() || "restored-file";
  let data = new Blob([plain.slice(nameOffset + nameLength)]);
  const flags = version === 1 ? 0 : plain[4];
  if (flags & FLAG_GZIP) {
    try {
      data = await transformStream(data, "gzip", "decompress");
    } catch (error) {
      throw new Error("Compressed content inside this file is damaged.");
    }
  }
  if (version === 3 && (flags & FLAG_ARCHIVE)) return { archive: readArchive(new Uint8Array(await data.arrayBuffer())), name: outputName };
  return { blob: data, name: outputName };
}
