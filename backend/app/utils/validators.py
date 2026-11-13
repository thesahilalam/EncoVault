"""
Input Validators — utils/validators.py
========================================
Centralised validation helpers used by the service layer to enforce
input contracts before passing data to algorithm implementations.

Raising ``ValueError`` (rather than returning a boolean) allows FastAPI
exception handlers to surface descriptive error messages in HTTP 422
responses without additional plumbing in each route handler.
"""


def validate_text_input(text: str, max_chars: int = 100_000) -> None:
    """Ensure *text* is a non-empty string within the allowed character limit.

    Parameters
    ----------
    text:      The input string to validate.
    max_chars: Maximum allowed character count (default 100 000).

    Raises
    ------
    ValueError: If *text* is empty/whitespace-only or exceeds *max_chars*.
    """
    if not isinstance(text, str):
        raise ValueError("Input must be text.")
    if text == "":
        raise ValueError("Input text must not be empty.")
    if len(text) > max_chars:
        raise ValueError(
            f"Input text exceeds the maximum allowed length of {max_chars:,} characters "
            f"(got {len(text):,})."
        )


def normalize_algo_name(algorithm: str, valid_list: list) -> str:
    """Normalize algorithm identifier (e.g. lowercase, strip, handle indices or substrings)."""
    if not isinstance(algorithm, str):
        algorithm = str(algorithm)
    clean = algorithm.strip().lower()
    if clean in valid_list:
        return clean
    if clean.isdigit():
        idx = int(clean)
        if 0 <= idx < len(valid_list):
            return valid_list[idx]
    for v in valid_list:
        if v in clean:
            return v
    return clean


def validate_algorithm(algorithm: str, valid_list: list) -> str:
    """Ensure *algorithm* is in the list of supported algorithm identifiers.
    Returns the normalized algorithm name.
    """
    normalized = normalize_algo_name(algorithm, valid_list)
    if normalized not in valid_list:
        raise ValueError(
            f"Unsupported algorithm '{algorithm}'. "
            f"Valid options are: {', '.join(sorted(valid_list))}."
        )
    return normalized
