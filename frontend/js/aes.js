// Pure-JS AES-128 block encryption — teaching-only core for the Modern Crypto lab.
// Lets the ECB vs GCM image demo run client-side on Vercel (no backend).
// NOT for protecting real data — EncoVault file locking uses WebCrypto AES-GCM.

const AES = (() => {
  // Build the FIPS-197 S-box at load time: GF(2^8) inverse + affine transform.
  const exp = new Uint8Array(256), log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x ^= x << 1; if (x & 0x100) x ^= 0x11b; x &= 0xff; }
  const inv = a => a === 0 ? 0 : exp[(255 - log[a]) % 255];
  const SBOX = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const s0 = inv(i);
    let s = s0;
    for (let k = 1; k <= 4; k++) s ^= ((s0 << k) | (s0 >> (8 - k))) & 0xff;
    SBOX[i] = (s ^ 0x63) & 0xff;
  }
  const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
  const xtime = a => ((a << 1) ^ ((a & 0x80) ? 0x1b : 0)) & 0xff;

  function expandKey(key) {                    // 16-byte key -> 44 words
    const w = [];
    for (let i = 0; i < 4; i++) w.push([key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]]);
    for (let i = 4; i < 44; i++) {
      let t = w[i-1].slice();
      if (i % 4 === 0) { t = [t[1],t[2],t[3],t[0]]; t = t.map(b => SBOX[b]); t[0] ^= RCON[i/4-1]; }
      w.push(w[i-4].map((b,j) => b ^ t[j]));
    }
    return w;
  }

  // State is column-major: bytes 0..15 fill column 0, then 1, 2, 3 (FIPS-197 order).
  function encryptBlock(key, block, out, outOffset) {
    const w = expandKey(key);
    const s = Array.from(block);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[c*4+r] ^= w[c][r];      // AddRoundKey
    for (let round = 1; round <= 10; round++) {
      for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];                                  // SubBytes
      const t = s.slice();                                                              // ShiftRows: row r shifts left by r
      for (let r = 1; r < 4; r++) for (let c = 0; c < 4; c++) t[c*4+r] = s[((c+r)%4)*4+r];
      for (let i = 0; i < 16; i++) s[i] = t[i];
      if (round < 10) for (let c = 0; c < 4; c++) {                                     // MixColumns
        const a = [s[4*c], s[4*c+1], s[4*c+2], s[4*c+3]];
        const m = a.map(xtime);
        s[4*c]   = m[0] ^ m[1] ^ a[1] ^ a[2] ^ a[3];
        s[4*c+1] = a[0] ^ m[1] ^ m[2] ^ a[2] ^ a[3];
        s[4*c+2] = a[0] ^ a[1] ^ m[2] ^ m[3] ^ a[3];
        s[4*c+3] = m[0] ^ a[0] ^ a[1] ^ a[2] ^ m[3];
      }
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[c*4+r] ^= w[round*4+c][r];
    }
    for (let i = 0; i < 16; i++) out[outOffset + i] = s[i];
    return out;
  }

  function ecbEncrypt(bytes, key) {
    if (bytes.length % 16 !== 0) throw new Error("ECB demo needs a multiple of 16 bytes.");
    const out = new Uint8Array(bytes.length);
    for (let o = 0; o < bytes.length; o += 16) encryptBlock(key, bytes.subarray(o, o+16), out, o);
    return out;
  }

  function hex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2,"0")).join(""); }

  return { encryptBlock, ecbEncrypt, hex, SBOX };
})();
