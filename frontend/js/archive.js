const MAGIC = new Uint8Array([69, 78, 67, 79, 86, 65, 85, 76, 84]);
const HEADER_SIZE = 42;
const ITERATIONS = {balanced: 600000, high: 900000};

const ARCHIVE_MAGIC = new Uint8Array([69, 86, 65, 82]); // "EVAR"
const FLAG_GZIP = 1;
const FLAG_ARCHIVE = 2;
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;

async function transformStream(blob, format, direction) {
  const StreamClass = direction === "compress" ? CompressionStream : DecompressionStream;
  return new Blob([await new Response(blob.stream().pipeThrough(new StreamClass(format))).arrayBuffer()]);
}

async function deriveKey(password, salt, iterations) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "PBKDF2", salt, iterations, hash: "SHA-256"}, material, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}

function makeHeader(iterations, salt, iv, version = 2) {
  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC, 0);
  header[9] = version;
  new DataView(header.buffer).setUint32(10, iterations, false);
  header.set(salt, 14);
  header.set(iv, 30);
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

async function encryptSelection(files, password, iterations, compress, onProgress = () => {}) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const isArchive = files.length > 1 || Boolean(files[0].webkitRelativePath);
  const displayName = isArchive ? "EncoVault archive" : files[0].name;
  const header = makeHeader(iterations, salt, iv, isArchive ? 3 : 2);
  const key = await deriveKey(password, salt, iterations);
  const name = new TextEncoder().encode(displayName);
  let data = isArchive ? await createArchive(files, onProgress) : new Blob([await files[0].arrayBuffer()]);
  if (!isArchive) onProgress(1, 1, files[0]);
  let flags = isArchive ? FLAG_ARCHIVE : 0;
  if (compress && data.size) {
    try {
      const candidate = await transformStream(data, "gzip", "compress");
      if (candidate.size < data.size) {
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
  return { blob: new Blob([header, ciphertext], { type: "application/octet-stream" }), compressed: Boolean(flags & FLAG_GZIP), isArchive };
}

async function decryptFile(file, password) {
  const raw = new Uint8Array(await file.arrayBuffer());
  if (raw.length < HEADER_SIZE + 16 || !MAGIC.every((byte, index) => raw[index] === byte) || ![1, 2, 3].includes(raw[9])) {
    throw new Error("This file is not a supported EncoVault file.");
  }
  const version = raw[9];
  const header = raw.slice(0, HEADER_SIZE);
  const view = new DataView(header.buffer);
  const iterations = view.getUint32(10, false);
  if (!Object.values(ITERATIONS).includes(iterations)) throw new Error("Unsupported security profile in this file.");
  const salt = header.slice(14, 30);
  const iv = header.slice(30, 42);
  const key = await deriveKey(password, salt, iterations);
  let plain;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({name: "AES-GCM", iv, additionalData: header, tagLength: 128}, key, raw.slice(HEADER_SIZE)));
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
