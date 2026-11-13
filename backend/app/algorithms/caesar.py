"""
Caesar Cipher — algorithms/caesar.py
======================================
The Caesar cipher is one of the oldest and simplest substitution ciphers.
Each letter in the plaintext is shifted a fixed number of positions (the
*key* / *shift*) down the alphabet.  With a shift of 3, 'A' → 'D', 'B' → 'E',
and so on, wrapping around at the end (Z → C).

Security note: The Caesar cipher has only 25 possible keys (for the English
alphabet), making it trivially breakable by exhaustive search.  It is
included here purely for educational purposes.
"""


def encrypt(text: str, shift: int = 3) -> str:
    """Shift every alphabetic character forward by *shift* positions.

    Non-alphabetic characters (digits, punctuation, whitespace) are passed
    through unchanged, preserving the structure of the original message.

    Parameters
    ----------
    text:  Plaintext string to encrypt.
    shift: Number of positions to shift (default 3, the classic Caesar key).

    Returns
    -------
    Ciphertext string with the same length as *text*.
    """
    result = []
    for char in text:
        if 'A' <= char <= 'Z' or 'a' <= char <= 'z':
            # Determine the ASCII base for upper/lowercase letters
            base = ord('A') if char.isupper() else ord('a')
            # Modular arithmetic ensures wrapping around the 26-letter alphabet
            shifted = (ord(char) - base + shift) % 26 + base
            result.append(chr(shifted))
        else:
            result.append(char)
    return "".join(result)


def decrypt(text: str, shift: int = 3) -> str:
    """Reverse a Caesar encryption by shifting backward by *shift* positions.

    Decryption is simply encryption with a negative shift.

    Parameters
    ----------
    text:  Ciphertext produced by :func:`encrypt`.
    shift: The same shift used during encryption.

    Returns
    -------
    Recovered plaintext string.
    """
    # Decryption is encryption with the negated shift
    return encrypt(text, shift=-shift)


def get_info() -> dict:
    """Return descriptive metadata about the Caesar cipher algorithm."""
    return {
        "id": "caesar",
        "name": "Caesar Cipher",
        "type": "encryption",
        "description": (
            "A classical substitution cipher that shifts each letter of the "
            "plaintext by a fixed number of positions in the alphabet."
        ),
        "use_case": "Educational demonstrations of basic substitution ciphers.",
        "strength": "Extremely simple to understand and implement.",
        "limitation": (
            "Only 25 possible keys — trivially broken by brute force or "
            "frequency analysis.  Not suitable for real-world use."
        ),
        "parameters": ["shift (integer, 1–25)"],
    }
