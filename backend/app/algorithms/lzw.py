"""A self-describing LZW codec for Unicode text.

The first two integers encode the initial alphabet size and the sorted
Unicode code points. Remaining integers are standard LZW dictionary codes.
"""


def compress(text: str) -> list[int]:
    if not text:
        return []
    alphabet = sorted(set(text))
    dictionary = {char: index for index, char in enumerate(alphabet)}
    next_code = len(dictionary)
    codes = []
    current = ""
    for char in text:
        candidate = current + char
        if candidate in dictionary:
            current = candidate
        else:
            codes.append(dictionary[current])
            dictionary[candidate] = next_code
            next_code += 1
            current = char
    if current:
        codes.append(dictionary[current])
    return [len(alphabet), *(ord(char) for char in alphabet), *codes]


def decompress(codes: list[int]) -> str:
    if not isinstance(codes, list) or any(type(code) is not int or code < 0 for code in codes):
        raise ValueError("LZW data must be a list of non-negative integer codes.")
    if not codes:
        return ""
    alphabet_size = codes[0]
    if alphabet_size < 1 or alphabet_size > len(codes) - 1:
        raise ValueError("Invalid LZW alphabet header.")
    alphabet_codes = codes[1:1 + alphabet_size]
    if any(code > 0x10FFFF or 0xD800 <= code <= 0xDFFF for code in alphabet_codes):
        raise ValueError("Invalid Unicode code point in LZW alphabet.")
    alphabet = [chr(code) for code in alphabet_codes]
    if alphabet != sorted(set(alphabet)):
        raise ValueError("LZW alphabet must contain unique sorted characters.")

    dictionary = {index: char for index, char in enumerate(alphabet)}
    stream = codes[1 + alphabet_size:]
    if not stream:
        raise ValueError("LZW stream is missing its first data code.")
    if stream[0] not in dictionary:
        raise ValueError("Invalid first LZW data code.")

    current = dictionary[stream[0]]
    output = [current]
    output_length = len(current)
    next_code = len(dictionary)
    for code in stream[1:]:
        if code in dictionary:
            entry = dictionary[code]
        elif code == next_code:
            entry = current + current[0]
        else:
            raise ValueError(f"Invalid LZW code: {code}.")
        output_length += len(entry)
        if output_length > 100_000:
            raise ValueError("Decompressed LZW output exceeds the 100,000 character limit.")
        output.append(entry)
        new_entry = current + entry[0]
        if len(new_entry) > 100_000:
            raise ValueError("LZW dictionary entry exceeds the output limit.")
        dictionary[next_code] = new_entry
        next_code += 1
        current = entry
    return "".join(output)


def get_info() -> dict:
    return {
        "id": "lzw", "name": "LZW (Lempel–Ziv–Welch)", "type": "compression",
        "description": "Builds a shared dictionary of repeated strings and emits integer codes.",
        "use_case": "Teaching dictionary based lossless compression.",
        "strength": "Finds repeated patterns in one pass.",
        "limitation": "A readable integer list plus alphabet header is a demonstration format, not a compact binary file format.",
        "parameters": [],
    }
