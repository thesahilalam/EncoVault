# EncoVault — AGENTS.md

> **Single source of truth for all AI agents working on this project.**  
> Keep updated. Symlink to `CLAUDE.md` / `instructions.md` as needed.

---

## 🎯 Project Overview

**EncoVault** — Local-first file encryption & compression toolkit.  
**Stack:** Vanilla HTML/CSS/JS (classic scripts), FastAPI optional backend.  
**Deploy:** Vercel (static) + optional FastAPI on Railway/Render.  
**Version:** 2.0.29 | **Tag:** `v2.0.29`

---

## 🏗️ Architecture

```
EncoVault/
├── frontend/
│   ├── index.html          # Home entry point
│   ├── encryption-decryption.html # File vault page
│   ├── compression.html    # ZIP compression page
│   ├── simulation.html     # Learning labs page
│   ├── styles.css          # Light-only design system
│   ├── app.js              # Router + boot (loaded last)
│   └── js/
│       ├── aes.js          # Pure-JS FIPS-197 AES-128 ECB
│       ├── api.js          # Backend /api client
│       ├── archive.js      # Crypto core: v4 format, HMAC, Shamir, time-lock
│       ├── compress.js     # RLE, Huffman, Entropy
│       ├── file-security.js # lockFiles()/unlockFiles() flow
│       ├── reference.js    # Learn + Labs (Classical/Modern/Network/Compression)
│       ├── store.js        # Reactive state (files/ui/crypto/settings)
│       ├── ui.js           # Helpers: showMessage, showProgress, etc.
│       └── zip.js          # CRC32, DEFLATE, zip ops
├── backend/
│   ├── app/main.py         # FastAPI + StaticFiles mount
│   ├── app/api/            # /api/encrypt, /api/compress, /api/process
│   ├── app/algorithms/     # Pure-Python implementations
│   └── requirements.txt
├── vite.config.js          # Build config (optional prod build)
├── package.json            # npm scripts: dev, build, preview, bump
└── AGENTS.md               # THIS FILE
```

---

## 🛠️ Commands

```bash
# Frontend dev (Vite HMR)
cd frontend && npm run dev          # http://localhost:3000

# Production build
cd frontend && npm run build        # → /dist/

# Backend (optional, for /api/algorithms)
cd backend && python3 -m uvicorn app.main:app --port 8000

# Version bump
npm run bump           # patch
npm run bump:minor     # minor
npm run bump:major     # major
```

---

## 📐 Coding Conventions

- **No bundler** — classic `<script>` tags in `index.html` (load order matters)
- **ES2020** — `const`/`let`, arrow functions, optional chaining, nullish coalescing
- **No external deps** — pure browser APIs (`crypto.subtle`, `CompressionStream`)
- **Error handling** — `try/catch` with user-friendly `showMessage()`
- **Security** — `secureWipe()` for sensitive buffers, constant-time compare
- **Naming** — camelCase functions, PascalCase constructors, UPPER_SNAKE constants

---

## 🧪 Testing & Quality

```bash
# Manual testing checklist (run before PR)
# 1. Encryption: lock → unlock single file
# 2. Encryption: lock → unlock multiple files (archive v4)
# 3. Key mgmt: Shamir split (2/3), key file 2FA, time-lock
# 4. Labs: Classical (Caesar, Vigenère, Playfair, Hill, Cryptanalysis)
# 5. Labs: Modern (ECB vs GCM, RSA, SHA-256 avalanche)
# 6. Labs: Network (TLS, certs, firewall, MFA)
# 7. Labs: Compression (RLE, Huffman, Entropy)
# 8. Top navigation and responsive layout (<760px)
# 9. Backward compat: v2/v3/v4 .enco files unlock
```

---

## 📦 Key Modules — Quick Reference

| Module | Exports | Purpose |
|--------|---------|---------|
| `aes.js` | `AES.encryptBlock`, `AES.ecbEncrypt`, `AES.hex` | Pure-JS AES-128 ECB (FIPS-197) |
| `archive.js` | `encryptSelection`, `decryptFile`, `shamirSplit`, `shamirCombine`, `makeKeyFile`, `timeLockCheck` | Core crypto + key mgmt |
| `store.js` | `useStore()`, `useFiles()`, `useUI()`, `useCrypto()`, `useSettings()` | Reactive state slices |
| `file-security.js` | `lockFiles()`, `unlockFiles()` | High-level lock/unlock flow |
| `reference.js` | `renderLearn()`, `renderLab()`, `renderLabTool()` | Learn + Labs UI |

---

## 🔒 Security Rules

- **Never log secrets** (passwords, keys, HMAC keys)
- **Always wipe** sensitive `Uint8Array` via `secureWipe()` after use
- **HMAC verify** every v4 `.enco` header before decrypt
- **Constant-time compare** for all secret comparisons
- **PBKDF2 iterations** ≥ 600,000 (configurable up to 5M)

---

## 📝 Agent Instructions

1. **Read AGENTS.md first** — understand stack before coding
2. **Classic scripts only** — no `import`/`export`, globals via `window.X`
3. **Load order matters** — `index.html` script order is canonical
4. **Don't touch** `vite.config.js` / `package.json` unless build changes
5. **Test locally** (`npm run dev`) before suggesting changes
6. **Update AGENTS.md** after adding features/changing conventions
6. **Symlink** `CLAUDE.md` → `AGENTS.md` for cross-tool support

---

## 🔗 Symlinks (Cross-Tool)

```bash
# Run once per clone
ln -sf AGENTS.md CLAUDE.md
ln -sf AGENTS.md instructions.md
```

---

*Last updated: v2.0.29 — keep this file current.*
