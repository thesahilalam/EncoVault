"""
Compression Routes — api/routes_compress.py
=============================================
Thin FastAPI router for compression and decompression endpoints.

Prefix: /compress  (mounted under /api in main.py → full paths: /api/compress/...)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any

from app.services import compression_service

router = APIRouter(prefix="/compress", tags=["Compression"])


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class CompressRequest(BaseModel):
    """Body for POST /compress/compress."""
    algorithm: str
    text: str


class DecompressRequest(BaseModel):
    """Body for POST /compress/decompress.

    *compressed_data* is typed ``Any`` because:
    - RLE produces a string.
    - Huffman produces a string (bit-string).
    - LZW produces a list of integers.

    The service layer handles each type appropriately.
    """
    algorithm: str
    compressed_data: Any
    options: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/compress")
def compress_endpoint(body: CompressRequest) -> dict:
    """Compress *text* with the specified *algorithm*.

    Returns a standardised response with the compressed output, timing, and
    size metrics.  For Huffman, the metadata field includes the code table
    and padding count needed for decompression.
    """
    try:
        return compression_service.compress_text(
            algorithm=body.algorithm,
            text=body.text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compression error: {exc}")


@router.post("/decompress")
def decompress_endpoint(body: DecompressRequest) -> dict:
    """Decompress *compressed_data* with the specified *algorithm*.

    Required *options* by algorithm:
    - RLE:     ``{}`` (no extra options needed)
    - Huffman: ``{"huffman_table": dict, "padding": int}``
    - LZW:     ``{}`` (the compressed_data list is self-describing)
    """
    try:
        return compression_service.decompress_text(
            algorithm=body.algorithm,
            compressed_data=body.compressed_data,
            options=body.options or {},
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except KeyError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required option: {exc}",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Decompression error: {exc}")
