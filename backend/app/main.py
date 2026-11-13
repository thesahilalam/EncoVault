"""
EncoVault Backend — main.py
============================
Entry point for the FastAPI application. Configures CORS, registers API
routers and exposes a metadata endpoint that lists every supported algorithm.

Design note: All heavy logic lives in services/ and algorithms/. The routes
here are thin orchestration layers so that the core logic remains testable
independently of the HTTP layer.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import routers
from app.api.routes_encrypt import router as encrypt_router
from app.api.routes_compress import router as compress_router
from app.api.routes_process import router as process_router

# Import algorithm info helpers for the /api/algorithms metadata endpoint
from app.algorithms import caesar, aes, rsa_algo, rle, huffman, lzw

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="EncoVault API",
    description="Educational API for exploring encryption and compression algorithms.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS is limited to the local app and common local development server ports.
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000", "http://127.0.0.1:8000",
        "http://localhost:5500", "http://127.0.0.1:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — each router is mounted under /api so the frontend always targets
# /api/<resource>.
# ---------------------------------------------------------------------------

app.include_router(encrypt_router, prefix="/api")
app.include_router(compress_router, prefix="/api")
app.include_router(process_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "EncoVault API running"}

# ---------------------------------------------------------------------------
# Algorithm metadata endpoint
# Returns rich information about every supported algorithm so the frontend
# can render informational cards without hard-coding the data.
# ---------------------------------------------------------------------------

@app.get("/api/algorithms")
def list_algorithms():
    """Return metadata for all supported encryption and compression algorithms."""
    return {
        "encryption": [
            caesar.get_info(),
            aes.get_info(),
            rsa_algo.get_info(),
        ],
        "compression": [
            rle.get_info(),
            huffman.get_info(),
            lzw.get_info(),
        ],
    }

# ---------------------------------------------------------------------------
# Mount Frontend as Static Files (Single-server convenience for 1-click run)
# ---------------------------------------------------------------------------
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        """Fallback health-check endpoint."""
        return {"message": "EncoVault API running"}
