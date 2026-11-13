"""
Sizing Utilities — utils/sizing.py
=====================================
Helpers for computing the byte-size of various data types and the
size-reduction percentage achieved by a compression or encryption operation.

These utilities are used by the service layer to populate the metadata
fields returned to the frontend (original_size, processed_size,
reduction_percentage).
"""

import sys
import json


def get_size_bytes(data) -> int:
    """Return the byte-size of *data* in a type-aware manner.

    Supported types:
    - ``str``  → UTF-8 encoded byte length.
    - ``bytes`` → raw length.
    - ``list`` or ``dict`` → JSON-serialised UTF-8 byte length.
    - anything else → Python's sys.getsizeof as a fallback.

    Parameters
    ----------
    data: The data whose size to measure.

    Returns
    -------
    Size in bytes (int).
    """
    if isinstance(data, str):
        return len(data.encode("utf-8"))
    if isinstance(data, bytes):
        return len(data)
    if isinstance(data, (list, dict)):
        return len(json.dumps(data).encode("utf-8"))
    # Fallback: Python object size (less meaningful but non-zero)
    return sys.getsizeof(data)


def calculate_reduction(original: int, processed: int) -> float:
    """Calculate the percentage size reduction between two byte counts.

    A positive value means the data was compressed/reduced; negative means
    it grew (which can happen with encryption overhead or short inputs).

    Parameters
    ----------
    original:  Byte count of the original data.
    processed: Byte count of the processed (compressed/encrypted) data.

    Returns
    -------
    Percentage reduction as a float, rounded to 2 decimal places.
    Returns 0.0 if *original* is zero to avoid division by zero.

    Example
    -------
    >>> calculate_reduction(1000, 400)
    60.0
    >>> calculate_reduction(100, 150)   # data grew
    -50.0
    """
    if original == 0:
        return 0.0
    reduction = (original - processed) / original * 100
    return round(reduction, 2)
