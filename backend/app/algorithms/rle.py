"""Run-length encoding for Unicode text.

The textual format is ``count:codepoint;`` (for example, ``3:41;`` is
``AAA``). Encoding each character as a Unicode code point keeps delimiters,
digits, whitespace, and newlines unambiguous.
"""


def compress(text: str) -> str:
    if not text:
        return ""
    result = []
    count = 1
    start = 0
    for index in range(1, len(text) + 1):
        if index < len(text) and text[index] == text[start]:
            count += 1
            continue
        result.append(f"{count}:{ord(text[start]):X};")
        if index < len(text):
            start = index
            count = 1
    return "".join(result)


def decompress(encoded: str) -> str:
    if not encoded:
        return ""
    output = []
    position = 0
    output_length = 0
    while position < len(encoded):
        separator = encoded.find(":", position)
        end = encoded.find(";", separator + 1) if separator >= 0 else -1
        if separator == -1 or end == -1:
            raise ValueError(f"Invalid RLE format near position {position}.")
        count_text, codepoint_text = encoded[position:separator], encoded[separator + 1:end]
        if not count_text.isdecimal() or not codepoint_text:
            raise ValueError(f"Invalid RLE run near position {position}.")
        count, codepoint = int(count_text), int(codepoint_text, 16)
        if count < 1 or count > 1_000_000 or not 0 <= codepoint <= 0x10FFFF or 0xD800 <= codepoint <= 0xDFFF:
            raise ValueError("RLE run count or Unicode code point is out of range.")
        output_length += count
        if output_length > 100_000:
            raise ValueError("Decompressed RLE output exceeds the 100,000 character limit.")
        output.append(chr(codepoint) * count)
        position = end + 1
    return "".join(output)


def get_info() -> dict:
    return {
        "id": "rle", "name": "Run-Length Encoding (RLE)", "type": "compression",
        "description": "Replaces consecutive repeated characters with a count and Unicode code point.",
        "use_case": "Simple data with long runs of repeated values.",
        "strength": "O(n) time and easy to explain.",
        "limitation": "Can expand data with few repeated characters; this demo's readable output includes delimiter overhead.",
        "parameters": [],
    }
