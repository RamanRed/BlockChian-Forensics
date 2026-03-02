"""
Digital Forensic Evidence Preservation System
Main FastAPI Application Entry Point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os
import time
import uuid
from dotenv import load_dotenv

from database import Base, engine
from routes.auth_routes import router as auth_router
from routes.evidence_routes import router as evidence_router
from routes.verification_routes import router as verification_router
from routes.admin_routes import router as admin_router
from utils.logger import setup_logger

load_dotenv()
logger = setup_logger(__name__)

APP_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    start = time.time()
    logger.info("=" * 60)
    logger.info("Starting Digital Forensic Evidence Preservation System")
    logger.info(f"Version: {APP_VERSION}")
    Base.metadata.create_all(bind=engine)
    os.makedirs("storage/evidence", exist_ok=True)
    os.makedirs("storage/quarantine", exist_ok=True)
    elapsed = time.time() - start
    logger.info(f"Startup complete in {elapsed:.2f}s. DB tables ready, storage dirs OK.")
    logger.info("=" * 60)
    yield
    logger.info("Shutting down Digital Forensic Evidence Preservation System...")


app = FastAPI(
    title="Digital Forensic Evidence Preservation System",
    description="""Blockchain + AI-Based Authenticity Verification for Digital Evidence.

## Features
- AI deepfake detection (image & video)
- SHA-256 file hashing and evidence binding
- Blockchain timestamping via Solidity smart contract
- Off-chain storage with optional IPFS
- JWT authentication with role-based access control
- Full audit trail
""",
    version=APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_tags=[
        {"name": "Authentication", "description": "Register, login, and manage user sessions"},
        {"name": "Evidence", "description": "Upload, retrieve, and manage forensic evidence"},
        {"name": "Verification", "description": "Verify evidence integrity against blockchain records"},
        {"name": "Admin", "description": "Admin controls, audit logs, and user management"},
        {"name": "Health", "description": "Service health check"},
    ],
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id_and_timing(request: Request, call_next):
    """Attach a unique request ID and log response time for every request."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
    logger.debug(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({elapsed_ms:.1f}ms)")
    return response


# ---------------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"[{request_id}] Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "request_id": request_id,
        }
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(evidence_router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(verification_router, prefix="/api/verify", tags=["Verification"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# Core Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Lightweight health probe for load-balancers and monitoring."""
    return {
        "status": "healthy",
        "version": APP_VERSION,
        "service": "Digital Forensic Evidence Preservation System",
    }


@app.get("/", tags=["Health"], include_in_schema=False)
async def root():
    return {
        "message": "Digital Forensic Evidence Preservation System API",
        "version": APP_VERSION,
        "docs": "/api/docs",
        "health": "/api/health",
    }
