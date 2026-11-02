# EncoVault

EncoVault is a local file protection and compression tool with a separate set
of interactive security and compression labs.

## Start

```bash
cd ~/EncoVault
.venv/bin/python -m encovault web
```

The command starts a local server and attempts to open the browser. If it does
not open automatically, visit `http://127.0.0.1:8765/`. Keep the terminal
running while using the app; press `Ctrl+C` to stop it.

## Lock and unlock

Choose **Lock files**, then browse, drag files in, or select a folder. Set and
confirm a password and choose the Balanced or High PBKDF2 profile. Encrypted
files download with the `.encovault` extension. To restore them, choose
**Unlock files**, select the encrypted files and enter the same password.

File encryption and decryption happen in the browser using AES-256-GCM. The
original name is included inside the encrypted content. Folder contents are
encrypted as individual files. Keep the password safe; it cannot be recovered.
The file extension is EncoVault's format marker, not a guarantee that only
this app could ever implement decryption. Locking can optionally gzip data
before encryption. Use **Compress files** to create or restore `.gz` files.

## Labs

The sidebar contains classical cipher, modern cryptography, compression and
network security sandboxes. These are demonstrations for learning and must not
be used to protect real data. File inputs never get uploaded to the local server.

## Publish as a website

The browser interface is a static site and can be deployed with GitHub Pages.
This repository includes a Pages workflow that publishes `encovault/web` after
each push to the `main` branch. Enable **Settings → Pages → GitHub Actions** in
the GitHub repository after the first push. The site will be available at the
repository's GitHub Pages URL.
