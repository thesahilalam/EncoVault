"""
Huffman Coding — algorithms/huffman.py
========================================
Huffman coding (David Huffman, 1952) is an optimal prefix-free
variable-length encoding scheme.  Characters that appear frequently in the
input are assigned shorter bit strings, while rare characters receive longer
ones — minimising the total number of bits needed to represent the message.

Algorithm outline:
1. Build a **frequency table** mapping each character to its occurrence count.
2. Insert every (frequency, character) pair into a **min-heap** (priority queue).
3. Repeatedly extract the two nodes with the lowest frequency, merge them into
   a new internal node whose frequency is their sum, and re-insert it.
4. The last remaining node is the **Huffman tree** root.
5. Traverse the tree to build a **code table**: left edges = '0', right = '1'.
6. Encode the original message by replacing each character with its code.

The resulting bit string is packed into bytes for transmission, with
*padding* bits appended at the end if the length is not a multiple of 8.

Time complexity: O(n log n) where n is the number of unique characters.
"""

import heapq
from collections import Counter


# ---------------------------------------------------------------------------
# Internal tree node
# ---------------------------------------------------------------------------

class _Node:
    """A node in the Huffman binary tree.

    Supports comparison by frequency so Python's heapq can maintain the
    min-heap property automatically.
    """

    __slots__ = ("freq", "char", "left", "right")

    def __init__(self, freq: int, char: str = "", left=None, right=None):
        self.freq = freq
        self.char = char
        self.left = left
        self.right = right

    # heapq compares tuples; tie-break on char to make ordering deterministic
    def __lt__(self, other):
        if self.freq == other.freq:
            return self.char < other.char
        return self.freq < other.freq


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _build_codes(node: _Node, prefix: str, codes: dict):
    """Recursively traverse the Huffman tree to assign bit codes."""
    if node is None:
        return
    # Leaf node — record the code for this character
    if node.left is None and node.right is None:
        codes[node.char] = prefix if prefix else "0"  # edge case: single unique char
        return
    _build_codes(node.left, prefix + "0", codes)
    _build_codes(node.right, prefix + "1", codes)


def compress(text: str) -> dict:
    """Huffman-encode *text*.

    Parameters
    ----------
    text: Input string to compress.

    Returns
    -------
    dict with:
        - ``encoded_bits``:   String of '0'/'1' characters representing the
                              encoded message (before byte-packing).
        - ``huffman_table``:  Mapping of character → bit-code string.
        - ``padding``:        Number of zero-bits appended to make the
                              bit string a multiple of 8.
    """
    if not text:
        return {"encoded_bits": "", "huffman_table": {}, "padding": 0}

    # Step 1: frequency table
    freq = Counter(text)

    # Step 2: initialise heap with leaf nodes
    heap = [_Node(f, c) for c, f in freq.items()]
    heapq.heapify(heap)

    # Step 3: build the Huffman tree
    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = _Node(left.freq + right.freq, left.char + right.char, left, right)
        heapq.heappush(heap, merged)

    root = heap[0]

    # Step 4: generate code table
    codes: dict = {}
    _build_codes(root, "", codes)

    # Step 5: encode the original text
    encoded_bits = "".join(codes[ch] for ch in text)

    # Step 6: calculate padding needed to reach a byte boundary
    padding = (8 - len(encoded_bits) % 8) % 8
    encoded_bits += "0" * padding

    return {
        "encoded_bits": encoded_bits,
        "huffman_table": codes,
        "padding": padding,
    }


def decompress(encoded_bits: str, huffman_table: dict, padding: int) -> str:
    """Reverse Huffman encoding back to the original string.

    Parameters
    ----------
    encoded_bits:  Bit string (from :func:`compress`), including any padding.
    huffman_table: The same code table returned by :func:`compress`.
    padding:       Number of trailing padding bits to strip before decoding.

    Returns
    -------
    Recovered original string.
    """
    if not encoded_bits and not huffman_table:
        return ""
    if not isinstance(encoded_bits, str) or any(bit not in "01" for bit in encoded_bits):
        raise ValueError("Huffman data must contain only 0 and 1 bits.")
    if not isinstance(huffman_table, dict) or not huffman_table:
        raise ValueError("A Huffman code table is required.")
    if type(padding) is not int or not 0 <= padding <= 7 or padding > len(encoded_bits):
        raise ValueError("Huffman padding must be an integer from 0 to 7.")

    # Strip padding bits from the end
    if padding:
        encoded_bits = encoded_bits[:-padding]

    # Invert the table: code → character
    reverse_table = {v: k for k, v in huffman_table.items()}
    if len(reverse_table) != len(huffman_table) or any(not code or set(code) - {"0", "1"} for code in reverse_table):
        raise ValueError("Invalid Huffman code table.")

    result = []
    current_code = ""
    for bit in encoded_bits:
        current_code += bit
        if current_code in reverse_table:
            result.append(reverse_table[current_code])
            if len(result) > 100_000:
                raise ValueError("Decompressed Huffman output exceeds the 100,000 character limit.")
            current_code = ""
        elif not any(code.startswith(current_code) for code in reverse_table):
            raise ValueError("Encoded bits do not match the Huffman code table.")

    if current_code:
        raise ValueError("Encoded Huffman data ends with an incomplete code.")

    return "".join(result)


def get_info() -> dict:
    """Return descriptive metadata about Huffman coding."""
    return {
        "id": "huffman",
        "name": "Huffman Coding",
        "type": "compression",
        "description": (
            "An optimal prefix-free variable-length encoding that assigns "
            "shorter codes to more frequent characters, minimising total "
            "bit length."
        ),
        "use_case": (
            "ZIP files, JPEG/PNG image compression, MP3 audio encoding, "
            "and many file archiving formats."
        ),
        "strength": (
            "Provably optimal for symbol-by-symbol coding given character "
            "frequencies.  Simple to implement."
        ),
        "limitation": (
            "Requires transmitting the code table alongside the compressed "
            "data.  Less effective than modern context-modelling compressors "
            "on natural language text."
        ),
        "parameters": [],
    }
