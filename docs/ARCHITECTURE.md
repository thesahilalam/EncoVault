# Architecture

The interface is a static HTML, CSS and JavaScript application in
`encovault/web`. The Python CLI starts a standard-library local HTTP server
bound only to `127.0.0.1`. Browser Web Crypto encrypts and decrypts files using
AES-256-GCM and derives keys with PBKDF2-SHA-256. Browser Compression Streams
provide gzip. File bytes and passwords stay in the browser; the server only
provides static assets.

Start the app with `python -m encovault web`. Interactive labs are separate
client-side demonstrations in the same interface.
