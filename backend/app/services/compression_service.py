"""
Compression Service — services/compression_service.py
=======================================================
Business-logic layer for compression and decompression operations.

Supported algorithms:
  - rle     : Run-Length Encoding
  - huffman : Huffman Coding (bit-string output)
  - lzw     : Lempel–Ziv–Welch (integer code list output)

Return schema mirrors the encryption service for consistency so the
frontend can use a single response renderer for all operations.
"""

from app.algorithms import rle, huffman, lzw
from app.utils.timers import measure_time
from app.utils.sizing import get_size_bytes, calculate_reduction
from app.utils.validators import validate_text_input, validate_algorithm

SUPPORTED_ALGORITHMS = ["rle", "huffman", "lzw"]


def compress_text(algorithm: str, text: str) -> dict:
    """Compress *text* using the specified *algorithm*.

    Parameters
    ----------
    algorithm: One of ``"rle"``, ``"huffman"``, ``"lzw"``.
    text:      Input string to compress.

    Returns
    -------
    Standardised result dict containing compression output and metrics.
    """
    validate_text_input(text)
    algorithm = validate_algorithm(algorithm, SUPPORTED_ALGORITHMS)

    original_size = get_size_bytes(text)
    output = None
    metadata = {}

    if algorithm == "rle":
        result, time_ms = measure_time(rle.compress, text)
        output = result
        metadata = {}

    elif algorithm == "huffman":
        result, time_ms = measure_time(huffman.compress, text)
        # output_text carries the bit string; table and padding go to metadata
        output = result["encoded_bits"]
        metadata = {
            "huffman_table": result["huffman_table"],
            "padding": result["padding"],
        }

    elif algorithm == "lzw":
        result, time_ms = measure_time(lzw.compress, text)
        output = result  # list of ints
        metadata = {"code_count": len(result)}

    processed_size = get_size_bytes(output)
    if algorithm == "huffman":
        # The table and padding are required to decode the bit-string payload.
        processed_size += get_size_bytes(metadata)

    return {
        "status": "success",
        "algorithm": algorithm,
        "operation": "compress",
        "original_size": original_size,
        "processed_size": processed_size,
        "reduction_percentage": calculate_reduction(original_size, processed_size),
        "time_ms": time_ms,
        "output_text": output,
        "metadata": metadata,
    }


def decompress_text(algorithm: str, compressed_data, options: dict) -> dict:
    """Decompress *compressed_data* using the specified *algorithm*.

    Parameters
    ----------
    algorithm:       One of ``"rle"``, ``"huffman"``, ``"lzw"``.
    compressed_data: Compressed payload:
                     - RLE:     str
                     - Huffman: str (bit string)
                     - LZW:     list of int
    options:         Algorithm-specific options:
                     - Huffman: ``{"huffman_table": dict, "padding": int}``
                     - Others:  ``{}``

    Returns
    -------
    Standardised result dict containing the decompressed text and metrics.
    """
    algorithm = validate_algorithm(algorithm, SUPPORTED_ALGORITHMS)

    original_size = get_size_bytes(compressed_data)
    output = None
    metadata = {}

    if algorithm == "rle":
        result, time_ms = measure_time(rle.decompress, compressed_data)
        output = result

    elif algorithm == "huffman":
        huffman_table = options["huffman_table"]
        padding = int(options.get("padding", 0))
        result, time_ms = measure_time(
            huffman.decompress, compressed_data, huffman_table, padding
        )
        output = result

    elif algorithm == "lzw":
        # compressed_data should be a list of ints
        if isinstance(compressed_data, str):
            import json
            compressed_data = json.loads(compressed_data)
        result, time_ms = measure_time(lzw.decompress, compressed_data)
        output = result

    processed_size = get_size_bytes(output)

    return {
        "status": "success",
        "algorithm": algorithm,
        "operation": "decompress",
        "original_size": original_size,
        "processed_size": processed_size,
        "reduction_percentage": calculate_reduction(original_size, processed_size),
        "time_ms": time_ms,
        "output_text": output,
        "metadata": metadata,
    }
