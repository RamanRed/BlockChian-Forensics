"""
DIRS — Digital Investigation Record System
Main FastAPI Application Entry Point  (v2.0.0)
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
from routes.auth_routes        import router as auth_router
from routes.fir_routes         import router as fir_router
from routes.case_diary_routes  import router as diary_router
from routes.seizure_routes     import router as seizure_router
from routes.custody_routes     import router as custody_router
from routes.person_routes      import router as person_router
from routes.chargesheet_routes import router as chargesheet_router
from routes.court_routes       import router as court_router
from routes.verification_routes import router as verification_router
from routes.admin_routes       import router as admin_router
from routes.lawyer_routes      import router as lawyer_router
from routes.investigation_findings_routes import router as findings_router
from utils.logger import setup_logger

load_dotenv()
logger = setup_logger(__name__)

APP_VERSION = "2.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    start = time.time()
    logger.info("=" * 60)
    logger.info("Starting DIRS — Digital Investigation Record System")
    logger.info(f"Version: {APP_VERSION}")
    Base.metadata.create_all(bind=engine)
    os.makedirs("storage/evidence", exist_ok=True)
    os.makedirs("storage/quarantine", exist_ok=True)
    elapsed = time.time() - start
    logger.info(f"Startup complete in {elapsed:.2f}s. DB tables ready, storage dirs OK.")
    logger.info("=" * 60)
    yield
    logger.info("Shutting down DIRS...")


app = FastAPI(
    title="DIRS — Digital Investigation Record System",
    description="""
**CrPC-Aligned Digital Investigation Record System**

Blockchain + AI-Based authenticity verification for Indian police forensic investigations.

## Modules
- **FIR** — First Information Report (Section 154 CrPC) — immutable, append-only corrections
- **Case Diary** — Investigation Journal (Section 172 CrPC) — strict append-only
- **Seizure & Property** — Seizure Memo + Malkhana Property Register with AI analysis
- **Chain of Custody** — Property Movement Register — full custody trail
- **Persons** — Person Register + Case-Person Role Mapping
- **Charge Sheet** — Final Report (Section 173 CrPC) — blockchain-hashed
- **Court** — Court Proceedings + Public Blockchain Verification Portal (no auth)
- **Auth** — JWT with role-based access control (IO / SP / DSP / CFSL / Court / Admin)
- **Audit** — Zero-trust append-only audit trail — every read and write logged
""",
    version=APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_tags=[
        {"name": "Auth",           "description": "Register, login, JWT token"},
        {"name": "FIR",            "description": "First Information Report — Sec 154 CrPC"},
        {"name": "Case Diary",     "description": "Investigation Journal — Sec 172 CrPC (append-only)"},
        {"name": "Seizure",        "description": "Seizure Memo + Property Register (Malkhana)"},
        {"name": "Custody",        "description": "Property Movement / Chain of Custody"},
        {"name": "Persons",        "description": "Person Register + Case-Person Mapping"},
        {"name": "Charge Sheet",   "description": "Final Report — Sec 173 CrPC"},
        {"name": "Court",          "description": "Court Proceedings + Public Verification Portal"},
        {"name": "Verification",   "description": "Blockchain integrity verification"},
        {"name": "Admin",          "description": "Audit logs, user management"},
        {"name": "Health",         "description": "Service health probe"},
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
        content={"detail": "An internal server error occurred.", "request_id": request_id}
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router,          prefix="/api/auth",         tags=["Auth"])
app.include_router(fir_router,           prefix="/api/fir",          tags=["FIR"])
app.include_router(diary_router,         prefix="/api/diary",        tags=["Case Diary"])
app.include_router(seizure_router,       prefix="/api/seizure",      tags=["Seizure"])
app.include_router(custody_router,       prefix="/api/custody",      tags=["Custody"])
app.include_router(person_router,        prefix="/api/persons",      tags=["Persons"])
app.include_router(chargesheet_router,   prefix="/api/chargesheet",  tags=["Charge Sheet"])
app.include_router(court_router,         prefix="/api/court",        tags=["Court"])
app.include_router(verification_router,  prefix="/api/verify",       tags=["Verification"])
app.include_router(admin_router,         prefix="/api/admin",        tags=["Admin"])
app.include_router(lawyer_router,        prefix="/api")
app.include_router(findings_router,      prefix="/api")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": APP_VERSION,
        "service": "DIRS — Digital Investigation Record System",
    }


@app.get("/", tags=["Health"], include_in_schema=False)
async def root():
    return {
        "message": "DIRS — Digital Investigation Record System API",
        "version": APP_VERSION,
        "docs": "/api/docs",
        "health": "/api/health",
        "public_verification": "/api/court/verify/{hash}",
    }
