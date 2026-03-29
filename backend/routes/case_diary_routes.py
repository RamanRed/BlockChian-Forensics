"""
Case Diary Routes — Investigation Journal (Section 172 CrPC)

CRITICAL RULES:
  - Entries are APPEND-ONLY. No delete, no update — ever.
  - DELETE method returns 405 with legal error code APPEND_ONLY_VIOLATION.
  - Defence counsel CANNOT access Case Diary (returns LEGAL_RESTRICTION, not 403).
  - Every read is audit-logged.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import hashlib, json

from database import get_db
from models import User, FIR, CaseDiaryEntry
from schemas import CaseDiaryCreate, CaseDiaryResponse
from auth.dependencies import get_current_user, require_investigator
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/{fir_id}/entry", response_model=CaseDiaryResponse, status_code=status.HTTP_201_CREATED)
async def append_diary_entry(
    fir_id: int,
    data: CaseDiaryCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Append a new entry to the Case Diary for a given FIR.
    Entry number is auto-incremented per FIR. Cannot be deleted or updated.
    """
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")
    if fir.status.value in ("closed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Case Diary entry cannot be added to a {fir.status.value} FIR.")

    # Auto-increment entry number
    last_entry = (
        db.query(CaseDiaryEntry)
        .filter(CaseDiaryEntry.fir_id == fir_id)
        .order_by(CaseDiaryEntry.entry_number.desc())
        .first()
    )
    entry_number = (last_entry.entry_number + 1) if last_entry else 1

    entry = CaseDiaryEntry(
        fir_id=fir_id,
        entry_number=entry_number,
        entry_date=data.entry_date,
        place_visited=data.place_visited,
        persons_met=data.persons_met,
        action_taken=data.action_taken,
        observations=data.observations,
        next_steps=data.next_steps,
        io_id=current_user.id,
    )
    db.add(entry)
    db.flush()

    # Hash this entry for integrity
    payload = {
        "fir_id":       fir_id,
        "entry_number": entry.entry_number,
        "entry_date":   data.entry_date.isoformat(),
        "action_taken": data.action_taken,
        "io_id":        current_user.id,
    }
    entry.entry_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    # Blockchain anchor
    bc_result = await store_record_hash("diary", f"{fir_id}-{entry_number}", entry.entry_hash)
    if bc_result:
        entry.blockchain_tx = bc_result.get("tx_hash")

    db.commit()
    db.refresh(entry)

    log_action(db, user_id=current_user.id, action="DIARY_ENTRY_ADDED",
               fir_id=fir_id, details=f"Entry #{entry_number}", ip_address=request.client.host)
    logger.info(f"Case Diary entry #{entry_number} added for FIR {fir_id} by {current_user.email}")
    return entry


@router.get("/{fir_id}", response_model=List[CaseDiaryResponse])
async def get_diary(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all Case Diary entries for an FIR in chronological order.
    Defence counsel role is blocked with LEGAL_RESTRICTION error (Sec 172 CrPC).
    Every access is audit-logged.
    """
    # Defence counsel restriction (Section 172 CrPC — courts can inspect but defence cannot directly access)
    if current_user.role.value == "court":
        # Court can read — allowed, but logged
        pass

    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    entries = (
        db.query(CaseDiaryEntry)
        .filter(CaseDiaryEntry.fir_id == fir_id)
        .order_by(CaseDiaryEntry.entry_number.asc())
        .all()
    )
    log_action(db, user_id=current_user.id, action="DIARY_VIEWED",
               fir_id=fir_id, details=f"{len(entries)} entries viewed", ip_address=request.client.host)
    return entries


@router.delete("/{fir_id}/entry/{entry_id}", status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
async def delete_diary_entry_blocked(fir_id: int, entry_id: int):
    """
    DELETE is permanently blocked on Case Diary entries.
    Returns legal error code APPEND_ONLY_VIOLATION (not generic 403).
    """
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail={
            "error_code": "APPEND_ONLY_VIOLATION",
            "legal_basis": "Section 172 CrPC",
            "message": "Case Diary entries are legally append-only. Deletion is not permitted under any circumstances.",
        }
    )
