"""
Encryption Routes — api/routes_encrypt.py
==========================================
Thin FastAPI router for encryption and decryption endpoints.  All heavy
logic lives in the encryption service layer; these routes only handle HTTP
serialisation and error mapping.

Prefix: /encrypt  (mounted under /api in main.py → full paths: /api/encrypt/...)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import encryption_service

router = APIRouter(prefix="/encrypt", tags=["Encryption"])


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class EncryptRequest(BaseModel):
    """Body for POST /encrypt/encrypt."""
    algorithm: str
    text: str
    options: dict = Field(default_factory=dict)


class DecryptRequest(BaseModel):
    """Body for POST /encrypt/decrypt."""
    algorithm: str
    text: str
    options: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/encrypt")
def encrypt_endpoint(body: EncryptRequest) -> dict:
    """Encrypt *text* with the specified *algorithm*.

    Returns a standardised response containing the ciphertext, timing
    information, size metrics, and algorithm-specific metadata (e.g. the
    generated AES key and IV, or RSA key pair).
    """
    try:
        return encryption_service.encrypt_text(
            algorithm=body.algorithm,
            text=body.text,
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
        raise HTTPException(status_code=500, detail=f"Encryption error: {exc}")


@router.post("/decrypt")
def decrypt_endpoint(body: DecryptRequest) -> dict:
    """Decrypt *text* (ciphertext) with the specified *algorithm*.

    The *options* dict must supply the decryption key material:
    - Caesar: ``{"shift": int}``
    - AES:    ``{"key_b64": str, "iv_b64": str}``
    - RSA:    ``{"private_key_pem": str}``
    """
    try:
        return encryption_service.decrypt_text(
            algorithm=body.algorithm,
            text=body.text,
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
        raise HTTPException(status_code=500, detail=f"Decryption error: {exc}")
