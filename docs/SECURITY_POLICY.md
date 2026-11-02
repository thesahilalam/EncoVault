# Security Policy

File protection uses browser Web Crypto AES-256-GCM with PBKDF2-SHA-256 key
derivation (600,000 or 900,000 iterations), random per-file salt and nonce,
and authenticated format headers. Optional gzip compression occurs before
encryption, and the compression flag is kept inside the encrypted payload.
The app has not received independent security review. Back up important data
before relying on it.

The local server binds to loopback (`127.0.0.1`) and serves static files only.
Passwords and file contents stay in the browser. Folder selections are
encrypted one file at a time. The Labs area is educational; its classical
ciphers and simplified models do not protect real data. Losing a password means
the encrypted files cannot be restored.
