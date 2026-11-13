"""
AES Encryption — algorithms/aes.py
====================================
AES (Advanced Encryption Standard) is a symmetric block cipher standardised
by NIST in 2001.  It operates on 128-bit blocks and supports key sizes of
128, 192 or 256 bits.

This implementation uses **AES-GCM** (Galois/Counter Mode): a random nonce
is generated per message and an authentication tag detects tampering.

All binary artefacts (ciphertext, key, IV) are returned as Base64 strings
so they can be safely transmitted in JSON responses.
"""

import base64
import os

from Crypto.Cipher import AES


# AES block size is always 128 bits (16 bytes) regardless of key size.
BLOCK_SIZE = AES.block_size  # 16


def encrypt(text: str, key: str = None) -> dict:
    """Encrypt *text* with AES-GCM.

    Parameters
    ----------
    text: Plaintext string to encrypt.
    key:  Optional Base64-encoded 16-byte key.  If ``None`` a fresh random
          key is generated.

    Returns
    -------
    dict with keys:
        - ``ciphertext_b64``: Base64-encoded ciphertext.
        - ``key_b64``:        Base64-encoded AES key.
        - ``nonce_b64``:      Base64-encoded GCM nonce.
        - ``tag_b64``:        Base64-encoded authentication tag.
    """
    try:
        raw_key = os.urandom(16) if key is None else base64.b64decode(key, validate=True)
    except Exception as exc:
        raise ValueError("AES key must be valid Base64.") from exc
    if len(raw_key) not in (16, 24, 32):
        raise ValueError("AES key must decode to 16, 24, or 32 bytes.")

    # GCM provides confidentiality and an authentication tag that detects tampering.
    cipher = AES.new(raw_key, AES.MODE_GCM, nonce=os.urandom(12))
    ciphertext, tag = cipher.encrypt_and_digest(text.encode("utf-8"))

    return {
        "ciphertext_b64": base64.b64encode(ciphertext).decode("utf-8"),
        "key_b64": base64.b64encode(raw_key).decode("utf-8"),
        "nonce_b64": base64.b64encode(cipher.nonce).decode("utf-8"),
        "tag_b64": base64.b64encode(tag).decode("utf-8"),
    }


def decrypt(ciphertext_b64: str, key_b64: str, nonce_b64: str, tag_b64: str) -> str:
    """Decrypt and authenticate an AES-GCM ciphertext.

    Parameters
    ----------
    ciphertext_b64: Base64-encoded ciphertext (from :func:`encrypt`).
    key_b64:        Base64-encoded AES key.
    nonce_b64:      Base64-encoded nonce used during encryption.
    tag_b64:        Base64-encoded authentication tag.

    Returns
    -------
    Recovered plaintext string.
    """
    try:
        raw_key = base64.b64decode(key_b64, validate=True)
    except Exception as exc:
        raise ValueError("AES key must be valid Base64.") from exc
    if len(raw_key) not in (16, 24, 32):
        raise ValueError("AES key must decode to 16, 24, or 32 bytes.")
    try:
        nonce = base64.b64decode(nonce_b64, validate=True)
        tag = base64.b64decode(tag_b64, validate=True)
        ciphertext = base64.b64decode(ciphertext_b64, validate=True)
        cipher = AES.new(raw_key, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")
    except Exception as exc:
        raise ValueError("AES data could not be authenticated. Check the ciphertext and key metadata.") from exc


def get_info() -> dict:
    """Return descriptive metadata about AES."""
    return {
        "id": "aes",
        "name": "AES (Advanced Encryption Standard)",
        "type": "encryption",
        "description": (
            "A symmetric block cipher operating on 128-bit blocks with "
            "128/192/256-bit keys.  Standardised by NIST (FIPS 197, 2001) "
            "and used worldwide for secure data protection."
        ),
        "use_case": (
            "Protecting sensitive data at rest and in transit "
            "(HTTPS, file encryption, VPNs)."
        ),
        "strength": (
            "Extremely fast in hardware and software; resistant to all known "
            "practical attacks when used correctly."
        ),
        "limitation": (
            "Key management is critical — a lost key means lost data.  "
            "A fresh nonce must be used for every message with the same key."
        ),
        "parameters": ["key (optional Base64 16, 24, or 32-byte key)"],
    }
