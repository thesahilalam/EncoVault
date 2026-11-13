"""
Encryption Service — services/encryption_service.py
======================================================
Business-logic layer for encryption and decryption operations.  Routes call
into this service; the service delegates to the appropriate algorithm module
and enriches the result with timing and size metadata.

Supported algorithms:
  - caesar   : Caesar Cipher (shift-based substitution)
  - aes      : AES-GCM authenticated encryption
  - rsa      : RSA-OAEP with 2048-bit keys

Return schema (all operations):
{
    "status":               "success" | "error",
    "algorithm":            str,
    "operation":            "encrypt" | "decrypt",
    "original_size":        int   (bytes),
    "processed_size":       int   (bytes),
    "reduction_percentage": float,
    "time_ms":              float,
    "output_text":          str | dict,
    "metadata":             dict  (algorithm-specific extras),
}
"""

from app.algorithms import caesar, aes, rsa_algo
from app.utils.timers import measure_time
from app.utils.sizing import get_size_bytes, calculate_reduction
from app.utils.validators import validate_text_input, validate_algorithm

SUPPORTED_ALGORITHMS = ["caesar", "aes", "rsa"]


def encrypt_text(algorithm: str, text: str, options: dict) -> dict:
    validate_text_input(text)
    algorithm = validate_algorithm(algorithm, SUPPORTED_ALGORITHMS)

    original_size = get_size_bytes(text)
    output = None
    metadata = {}

    if algorithm == "caesar":
        shift = int(options.get("shift", 3))
        result, time_ms = measure_time(caesar.encrypt, text, shift=shift)
        output = result
        metadata = {"shift": shift}

    elif algorithm == "aes":
        key = options.get("key")
        result, time_ms = measure_time(aes.encrypt, text, key=key)
        output = result["ciphertext_b64"]
        metadata = {
            "key_b64": result["key_b64"],
            "nonce_b64": result["nonce_b64"],
            "tag_b64": result["tag_b64"],
        }

    elif algorithm == "rsa":
        pub_key = options.get("public_key_pem")
        result, time_ms = measure_time(rsa_algo.encrypt, text, public_key_pem=pub_key)
        output = result["ciphertext_b64"]
        metadata = {
            "public_key_pem": result.get("public_key_pem"),
            "private_key_pem": result.get("private_key_pem"),
        }

    processed_size = get_size_bytes(output)

    return {
        "status": "success",
        "algorithm": algorithm,
        "operation": "encrypt",
        "original_size": original_size,
        "processed_size": processed_size,
        "reduction_percentage": calculate_reduction(original_size, processed_size),
        "time_ms": time_ms,
        "output_text": output,
        "metadata": metadata,
    }


def decrypt_text(algorithm: str, text: str, options: dict) -> dict:
    """Decrypt *text* (or ciphertext) using the specified *algorithm*.

    Parameters
    ----------
    algorithm: One of ``"caesar"``, ``"aes"``, ``"rsa"``.
    text:      Ciphertext string (or Base64-encoded blob) to decrypt.
    options:   Algorithm-specific decryption parameters:
               - Caesar:  ``{"shift": int}``
               - AES:     ``{"key_b64": str, "iv_b64": str}``
               - RSA:     ``{"private_key_pem": str}``

    Returns
    -------
    Standardised result dict (see module docstring for schema).
    """
    validate_text_input(text)
    algorithm = validate_algorithm(algorithm, SUPPORTED_ALGORITHMS)

    original_size = get_size_bytes(text)
    output = None
    metadata = {}

    if algorithm == "caesar":
        shift = int(options.get("shift", 3))
        result, time_ms = measure_time(caesar.decrypt, text, shift=shift)
        output = result
        metadata = {"shift": shift}

    elif algorithm == "aes":
        key_b64 = options["key_b64"]
        nonce_b64 = options["nonce_b64"]
        tag_b64 = options["tag_b64"]
        result, time_ms = measure_time(aes.decrypt, text, key_b64, nonce_b64, tag_b64)
        output = result

    elif algorithm == "rsa":
        private_key_pem = options["private_key_pem"]
        result, time_ms = measure_time(rsa_algo.decrypt, text, private_key_pem)
        output = result

    processed_size = get_size_bytes(output)

    return {
        "status": "success",
        "algorithm": algorithm,
        "operation": "decrypt",
        "original_size": original_size,
        "processed_size": processed_size,
        "reduction_percentage": calculate_reduction(original_size, processed_size),
        "time_ms": time_ms,
        "output_text": output,
        "metadata": metadata,
    }
