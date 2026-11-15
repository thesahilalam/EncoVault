# EncoVault

EncoVault is a local learning and demo tool for **Data Encryption and Compression**. It combines a small FastAPI backend with a plain HTML, CSS, and JavaScript frontend. No account or external service is needed.

## What it does

- Learn and run Caesar, AES, RSA, RLE, Huffman, and LZW.
- Encrypt only, compress only, or run both in either order.
- Lock and unlock arbitrary files locally with password-derived AES-GCM; optional gzip compression runs before encryption when it reduces size. A folder or multi-file selection becomes one `.encovault` archive.
- Compress and decompress arbitrary files locally with gzip and show measured before/after size. Image files can optionally be re-encoded to WebP at a chosen quality; video uses a lossless gzip attempt.
- Process pasted text or load a text file (up to 500 KB) in the browser.
- Compare input/output size and elapsed processing time, inspect algorithm metadata, and download the result.
- Reverse single-step encryption/compression in Learn mode while the generated metadata remains in the page.
- Explore the API at `/docs`.

## Run locally

Requirements: Python 3.9+ and pip.

```bash
cd EncoVault
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\\Scripts\\activate
python -m pip install -r backend/requirements.txt
python start.py
```

Open <http://127.0.0.1:8000>. Stop the server with Ctrl+C. To run without the launcher:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The UI is served by FastAPI; opening `frontend/index.html` directly is not the supported setup because API calls expect the local server.

## Project layout

```text
backend/app/algorithms/   Core codec and cipher functions
backend/app/services/     Metrics and pipeline orchestration
backend/app/api/          FastAPI request models and routes
backend/app/utils/        Validation, size estimates, timing
frontend/index.html       Single-page interface
frontend/js/              API client, UI helpers, page behavior
start.py                  Local development launcher
```

## API examples

`POST /api/encrypt/encrypt`

```json
{"algorithm":"caesar","text":"Hello World","options":{"shift":3}}
```

`POST /api/compress/compress`

```json
{"algorithm":"rle","text":"AAABBBCC"}
```

`POST /api/process/process`

```json
{
  "text":"Hello World",
  "operation":"both",
  "order":"compress_first",
  "algorithms":{"encryption":"aes","compression":"rle"}
}
```

Other endpoints are `POST /api/encrypt/decrypt`, `POST /api/compress/decompress`, and `GET /api/algorithms`.

## Algorithm notes for a viva

- **Caesar:** shifts English A–Z letters; educational only and trivially brute-forced.
- **AES (API lab):** AES-GCM with a random nonce and authentication tag. The response includes the key material needed to decrypt. Keep it private. If a Base64 key is supplied, it must decode to 16, 24, or 32 bytes.
- **File vault:** AES-GCM derives its key from the vault password using PBKDF2. The default profile is AES-256 with SHA-256 and 600,000 PBKDF2 rounds; advanced options can choose a different supported AES key size, hash, and round count.
- **RSA:** RSA-OAEP with a 2048-bit key pair, chunked for larger text. This direct-RSA demonstration is slower and less suitable for large data than hybrid encryption. A generated private key is returned for the demo.
- **RLE:** readable `count:hex-codepoint;` runs (for example, `3:41;` represents `AAA`). This unambiguous text representation handles Unicode, delimiters, and line breaks.
- **Huffman:** output is a readable bit string; its code table and padding count are returned as metadata and required to decompress.
- **LZW:** output is a self-describing integer list containing the initial alphabet followed by LZW codes.

The displayed size is the UTF-8/JSON size of the returned representation, not a claim about a production binary archive. Huffman includes its required decoding table in the reported size; LZW includes its alphabet header in the code list. AES/RSA key metadata is shown separately and is not counted as ciphertext payload. RLE favors readability, so short inputs may grow. Processing times are local measurements and can vary by machine.

## Scope

File Vault reads file bytes in the browser and never uploads them; folders can be selected when locking. A decrypted multi-file archive downloads its files individually because a browser cannot silently write a folder hierarchy to the user's disk; each download name preserves its original relative path with `__` separators. The algorithm workspace's file selection reads text files (up to 500 KB) in the browser and sends their text to the local API. The tool mode's two-operation pipeline is for demonstration and returns per-step metadata. It does not yet provide a one-click inverse pipeline; reverse each step in the opposite order using those saved parameters.
