"""
RSA Encryption — algorithms/rsa_algo.py
=========================================
RSA (Rivest–Shamir–Adleman, 1977) is an asymmetric cryptosystem based on
the computational difficulty of factoring the product of two large primes.

Key concepts:
- **Key pair**: a mathematically linked public/private pair.
- **Public key** encrypts; only the matching **private key** can decrypt.
- RSA is *not* designed for encrypting large amounts of data directly.
  Its practical limit per OAEP-padded operation on a 2048-bit key is
  ~190 bytes.  Longer messages are split into 190-byte chunks.

In practice RSA is used to encrypt a short symmetric key (e.g. an AES key)
which then encrypts the actual message — this is called a *hybrid* scheme.
"""

import base64

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP


# Maximum plaintext bytes per RSA-OAEP 2048-bit encryption operation.
# Formula: (key_size_bytes) - 2*hash_size_bytes - 2 = 256 - 66 = 190
CHUNK_SIZE = 190


def generate_keys() -> dict:
    """Generate a fresh 2048-bit RSA key pair.

    Returns
    -------
    dict with:
        - ``public_key_pem``:  PEM-encoded public key string.
        - ``private_key_pem``: PEM-encoded private key string.
    """
    key = RSA.generate(2048)
    return {
        "public_key_pem": key.publickey().export_key().decode("utf-8"),
        "private_key_pem": key.export_key().decode("utf-8"),
    }


def encrypt(text: str, public_key_pem: str = None) -> dict:
    """Encrypt *text* with RSA-OAEP.

    Long messages are automatically split into 190-byte chunks, each
    encrypted separately and concatenated.

    Parameters
    ----------
    text:           Plaintext string to encrypt.
    public_key_pem: PEM-encoded public key.  If ``None``, a fresh 2048-bit
                    key pair is generated and both keys are returned.

    Returns
    -------
    dict with:
        - ``ciphertext_b64``:  Base64-encoded concatenated ciphertext chunks.
        - ``public_key_pem``:  PEM-encoded public key (echoed or generated).
        - ``private_key_pem``: PEM-encoded private key (only when generated).
    """
    private_key_pem = None

    if public_key_pem is None:
        keys = generate_keys()
        public_key_pem = keys["public_key_pem"]
        private_key_pem = keys["private_key_pem"]

    rsa_key = RSA.import_key(public_key_pem)
    cipher = PKCS1_OAEP.new(rsa_key)

    # Encode the plaintext to bytes, then chunk it
    text_bytes = text.encode("utf-8")
    ciphertext_chunks = []

    for i in range(0, len(text_bytes), CHUNK_SIZE):
        chunk = text_bytes[i : i + CHUNK_SIZE]
        ciphertext_chunks.append(cipher.encrypt(chunk))

    # Concatenate all encrypted chunks and Base64-encode for JSON transport
    combined = b"".join(ciphertext_chunks)

    result = {
        "ciphertext_b64": base64.b64encode(combined).decode("utf-8"),
        "public_key_pem": public_key_pem,
    }
    if private_key_pem:
        result["private_key_pem"] = private_key_pem

    return result


def decrypt(ciphertext_b64: str, private_key_pem: str) -> str:
    """Decrypt RSA-OAEP ciphertext.

    Reverses the chunked encryption: the raw ciphertext is split into
    256-byte blocks (the RSA key size in bytes) and each block is decrypted
    individually before the results are concatenated.

    Parameters
    ----------
    ciphertext_b64:  Base64-encoded concatenated ciphertext.
    private_key_pem: PEM-encoded private key.

    Returns
    -------
    Recovered plaintext string.
    """
    rsa_key = RSA.import_key(private_key_pem)
    cipher = PKCS1_OAEP.new(rsa_key)

    ciphertext = base64.b64decode(ciphertext_b64)

    # Each encrypted chunk is exactly key_size bytes (256 for 2048-bit RSA)
    key_size_bytes = rsa_key.size_in_bytes()
    plaintext_chunks = []

    for i in range(0, len(ciphertext), key_size_bytes):
        chunk = ciphertext[i : i + key_size_bytes]
        plaintext_chunks.append(cipher.decrypt(chunk))

    return b"".join(plaintext_chunks).decode("utf-8")


def get_info() -> dict:
    """Return descriptive metadata about RSA."""
    return {
        "id": "rsa",
        "name": "RSA (Rivest–Shamir–Adleman)",
        "type": "encryption",
        "description": (
            "An asymmetric cryptosystem based on the difficulty of factoring "
            "the product of two large prime numbers.  Uses separate public "
            "and private keys for encryption and decryption."
        ),
        "use_case": (
            "Key exchange, digital signatures, and secure bootstrapping of "
            "symmetric sessions (e.g. TLS handshake)."
        ),
        "strength": (
            "No shared secret needed.  The public key can be distributed "
            "freely without compromising security."
        ),
        "limitation": (
            "Very slow compared to symmetric ciphers; can only encrypt small "
            "payloads directly (~190 bytes per operation for 2048-bit keys)."
        ),
        "parameters": ["public_key_pem (optional PEM string)"],
    }
