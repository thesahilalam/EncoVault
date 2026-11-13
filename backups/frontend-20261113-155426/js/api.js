/**
 * api.js — Centralized API layer for EncoVault
 * Communicates with the FastAPI backend at http://localhost:8000
 */

const API_BASE = (window.location.origin && window.location.origin.startsWith('http')) 
  ? `${window.location.origin}/api` 
  : 'http://localhost:8000/api';

/**
 * Internal helper: perform a JSON fetch and throw on HTTP errors.
 */
async function _fetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || body.message || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

const API = {
  /**
   * GET /api/algorithms
   * Returns the full algorithm registry from the backend.
   * Shape: { encryption: { caesar: {...}, aes: {...}, rsa: {...} }, compression: { rle: {...}, huffman: {...}, lzw: {...} } }
   */
  async getAlgorithms() {
    return _fetch('/algorithms');
  },

  /**
   * POST /api/encrypt/encrypt
   * @param {string} algorithm  - 'caesar' | 'aes' | 'rsa'
   * @param {string} text       - plaintext to encrypt
   * @param {object} options    - { shift?, key?, ... }
   * @returns {object}          - { output_text, original_size, processed_size, reduction_percentage, time_ms, metadata }
   */
  async encrypt(algorithm, text, options = {}) {
    return _fetch('/encrypt/encrypt', {
      method: 'POST',
      body: JSON.stringify({ algorithm, text, options }),
    });
  },

  /**
   * POST /api/encrypt/decrypt
   * @param {string} algorithm
   * @param {string} text       - ciphertext to decrypt
   * @param {object} options    - { shift?, key_b64?, iv_b64?, private_key_pem?, ... }
   */
  async decrypt(algorithm, text, options = {}) {
    return _fetch('/encrypt/decrypt', {
      method: 'POST',
      body: JSON.stringify({ algorithm, text, options }),
    });
  },

  /**
   * POST /api/compress/compress
   * @param {string} algorithm  - 'rle' | 'huffman' | 'lzw'
   * @param {string} text       - raw text to compress
   */
  async compress(algorithm, text) {
    return _fetch('/compress/compress', {
      method: 'POST',
      body: JSON.stringify({ algorithm, text }),
    });
  },

  /**
   * POST /api/compress/decompress
   * @param {string} algorithm
   * @param {any}    compressedData - string | array depending on algorithm
   * @param {object} options        - { huffman_table?, padding?, ... }
   */
  async decompress(algorithm, compressedData, options = {}) {
    return _fetch('/compress/decompress', {
      method: 'POST',
      body: JSON.stringify({ algorithm, compressed_data: compressedData, options }),
    });
  },

  /**
   * POST /api/process/process
   * Run a full pipeline (compress+encrypt or encrypt+compress, etc.)
   * @param {string} text
   * @param {string} operation   - 'encrypt' | 'compress' | 'both'
   * @param {object} algorithms  - { encryption?: string, compression?: string }
   * @param {string} order       - 'compress_first' | 'encrypt_first'
   * @param {object} options     - { shift?, key?, ... }
   */
  async process(text, operation, algorithms = {}, order = 'compress_first', options = {}) {
    return _fetch('/process/process', {
      method: 'POST',
      body: JSON.stringify({ text, operation, algorithms, order, options }),
    });
  },
};

// Make available globally (non-module script environment)
window.API = API;
