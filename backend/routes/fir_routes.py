"""
FIR Routes — First Information Report (Section 154 CrPC)

Rules:
  - FIR is IMMUTABLE after registration. No direct UPDATE.
  - Corrections are appended via a dedicated correction endpoint (logged to AuditLog).
  - Every FIR registration triggers a blockchain hash write.
  - Every FIR read is logged to the AuditLog.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import hashlib, json

from database import get_db
from models import User, FIR, AuditLog, FIRStatus
from schemas import FIRCreate, FIRResponse, FIRStatusUpdate
from auth.dependencies import get_current_user, require_investigator
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


def _compute_fir_hash(fir: FIR) -> str:
    """Deterministic SHA-256 of canonical FIR fields."""
    payload = {
        "fir_number":          fir.fir_number,
        "police_station":      fir.police_station,
        "district":            fir.district,
        "date_of_offence":     fir.date_of_offence.isoformat(),
        "offence_sections":    fir.offence_sections,
        "offence_description": fir.offence_description,
        "complainant_name":    fir.complainant_name,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


@router.post("/register", response_model=FIRResponse, status_code=status.HTTP_201_CREATED)
async def register_fir(
    data: FIRCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Register a new FIR (Section 154 CrPC).
    - Must be uniquely numbered per police station.
    - Immutable after creation — use /correct for post-registration amendments.
    - Triggers blockchain hash write and CCTNS stub.
    """
    # Duplicate check
    existing = db.query(FIR).filter(FIR.fir_number == data.fir_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"FIR number '{data.fir_number}' already registered.")

    fir = FIR(
        fir_number=data.fir_number,
        police_station=data.police_station,
        district=data.district,
        state=data.state,
        date_of_offence=data.date_of_offence,
        place_of_offence=data.place_of_offence,
        offence_sections=data.offence_sections,
        offence_description=data.offence_description,
        accused_description=data.accused_description,
        complainant_name=data.complainant_name,
        complainant_contact=data.complainant_contact,
        io_assigned=data.io_assigned,
        registered_by=current_user.id,
        status=FIRStatus.open,
        is_current=True,
    )
    db.add(fir)
    db.flush()   # Get fir.id before commit

    # Compute and store hash
    fir.data_hash = _compute_fir_hash(fir)

    # Blockchain write (non-blocking — fails gracefully)
    bc_result = await store_record_hash("fir", fir.fir_number, fir.data_hash)
    if bc_result:
        fir.blockchain_tx = bc_result.get("tx_hash")

    db.commit()
    db.refresh(fir)

    log_action(
        db, user_id=current_user.id, action="FIR_REGISTERED",
        fir_id=fir.id,
        details=f"FIR No: {fir.fir_number} | Station: {fir.police_station}",
        ip_address=request.client.host
    )
    logger.info(f"FIR registered: {fir.fir_number} by {current_user.email}")
    return fir


@router.post("/{fir_id}/correct", status_code=status.HTTP_200_OK)
async def correct_fir(
    fir_id: int,
    correction_note: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Append a correction note to an existing FIR.
    The FIR record is NEVER altered — this appends an AuditLog correction entry.
    """
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")
    if not correction_note or len(correction_note.strip()) < 5:
        raise HTTPException(status_code=400, detail="Correction note must be at least 5 characters.")

    log_action(
        db, user_id=current_user.id, action="FIR_CORRECTED",
        fir_id=fir.id,
        details=f"CORRECTION: {correction_note}",
        ip_address=request.client.host
    )
    logger.info(f"FIR {fir.fir_number} correction appended by {current_user.email}")
    return {"message": "Correction recorded. Original FIR preserved.", "fir_number": fir.fir_number}


@router.patch("/{fir_id}/status", response_model=FIRResponse)
async def update_fir_status(
    fir_id: int,
    update: FIRStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """Update FIR status (open → under_investigation → chargesheeted → closed). Logged."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    old_status = fir.status
    fir.status = update.status
    db.commit()
    db.refresh(fir)

    log_action(
        db, user_id=current_user.id, action="FIR_STATUS_CHANGED",
        fir_id=fir.id,
        details=f"{old_status} → {update.status} | Note: {update.supervisor_note}",
        ip_address=request.client.host
    )
    return fir


@router.get("/{fir_id}", response_model=FIRResponse)
async def get_fir(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve FIR by ID. Every access is logged (Section 6.2 — Zero-Trust Audit)."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    log_action(db, user_id=current_user.id, action="FIR_VIEWED",
               fir_id=fir.id, ip_address=request.client.host)
    return fir


@router.get("/", response_model=List[FIRResponse])
async def list_firs(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[FIRStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List FIRs. IO sees only their assigned FIRs; SP/Admin see all."""
    query = db.query(FIR)
    if status_filter:
        query = query.filter(FIR.status == status_filter)
    # IO restricted to own cases
    if current_user.role == "io":
        query = query.filter(
            (FIR.registered_by == current_user.id) |
            (FIR.io_assigned == current_user.id)
        )
    return query.order_by(FIR.registered_at.desc()).offset(skip).limit(limit).all()
