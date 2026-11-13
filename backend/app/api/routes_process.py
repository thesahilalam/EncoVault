"""
Process Routes — api/routes_process.py
========================================
Thin FastAPI router for the pipeline endpoint that chains multiple
operations (compress + encrypt, or any combination) in sequence.

Prefix: /process  (mounted under /api → full path: /api/process/process)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.services import pipeline_service

router = APIRouter(prefix="/process", tags=["Pipeline"])


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------

class OperationStep(BaseModel):
    """Describes a single step in the pipeline."""
    type: str                        # "encrypt" | "decrypt" | "compress" | "decompress"
    algorithm: str
    options: dict = Field(default_factory=dict)


class ProcessRequest(BaseModel):
    """Body for POST /process/process."""
    text: str
    operations: Optional[List[OperationStep]] = None
    operation: Optional[str] = None
    algorithms: Optional[dict] = None
    order: Optional[str] = "compress_first"
    options: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/process")
def process_endpoint(body: ProcessRequest) -> dict:
    """Execute an ordered pipeline of operations on the input text."""
    try:
        steps_list = body.operations or []
        if not steps_list:
            enc_algo = (body.algorithms or {}).get("encryption", "caesar")
            comp_algo = (body.algorithms or {}).get("compression", "rle")
            opts = body.options or {}

            if body.operation == "encrypt":
                steps_list.append(OperationStep(type="encrypt", algorithm=enc_algo, options=opts))
            elif body.operation == "compress":
                steps_list.append(OperationStep(type="compress", algorithm=comp_algo, options=opts))
            elif body.operation == "both":
                if body.order == "encrypt_first":
                    steps_list.append(OperationStep(type="encrypt", algorithm=enc_algo, options=opts))
                    steps_list.append(OperationStep(type="compress", algorithm=comp_algo, options=opts))
                else:
                    steps_list.append(OperationStep(type="compress", algorithm=comp_algo, options=opts))
                    steps_list.append(OperationStep(type="encrypt", algorithm=enc_algo, options=opts))
            else:
                raise ValueError("Choose an operation: encrypt, compress, or both.")

        if not steps_list:
            raise ValueError("At least one pipeline operation is required.")

        ops_as_dicts = [
            {"type": step.type, "algorithm": step.algorithm, "options": step.options or {}}
            for step in steps_list
        ]
        return pipeline_service.process_pipeline(
            text=body.text,
            operations=ops_as_dicts,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except (KeyError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid pipeline options: {exc}")
