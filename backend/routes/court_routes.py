"""
Court Proceedings Routes

Two roles:
  1. Internal (court role): view and add court proceedings.
  2. Public (no auth): blockchain hash verification endpoint — accessible by defence,
     judges, and citizens without any login. Returns VERIFIED / NOT_FOUND.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, ChargeSheet, CourtProceeding, FIR, PropertyRegister
from schemas import (
    CourtProceedingCreate, CourtProceedingResponse,
    PublicVerificationResponse
)
from auth.dependencies import get_current_user
from services.blockchain_service import get_blockchain_record
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.get("/verify/{file_hash}", response_model=PublicVerificationResponse)
async def public_verify(file_hash: str):
    """
    Public blockchain verification endpoint — NO AUTHENTICATION REQUIRED.
    Used by courts, defence lawyers, and citizens to independently verify
    any record hash against the blockchain without system access.
    Section 9.5 — Court-Facing Public Verification Endpoint.
    """
    bc_record = await get_blockchain_record(file_hash)
    if bc_record:
        verdict = "VERIFIED — Record found on blockchain and integrity confirmed."
        return PublicVerificationResponse(
            record_type="unknown",
            record_id=file_hash[:16],
            submitted_hash=file_hash,
            blockchain_found=True,
            blockchain_tx=bc_record.get("tx_hash"),
            timestamp_on_chain=bc_record.get("timestamp"),
            verdict=verdict,
        )
    else:
        return PublicVerificationResponse(
            record_type="unknown",
            record_id=file_hash[:16],
            submitted_hash=file_hash,
            blockchain_found=False,
            blockchain_tx=None,
            timestamp_on_chain=None,
            verdict="NOT_FOUND — Hash not found on blockchain. Record may not have been anchored, or hash is incorrect.",
        )


@router.post("/proceedings", response_model=CourtProceedingResponse, status_code=status.HTTP_201_CREATED)
async def add_proceeding(
    data: CourtProceedingCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a court hearing record. Requires court or admin role."""
    if current_user.role.value not in ("court", "admin", "sp", "dsp"):
        raise HTTPException(status_code=403, detail="Only court officers can add proceedings.")

    cs = db.query(ChargeSheet).filter(ChargeSheet.id == data.chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")

    proc = CourtProceeding(
        chargesheet_id=data.chargesheet_id,
        hearing_date=data.hearing_date,
        court_name=data.court_name,
        judge_designation=data.judge_designation,
        order_summary=data.order_summary,
        next_hearing_date=data.next_hearing_date,
        ecourts_case_id=data.ecourts_case_id,
    )
    db.add(proc)
    db.commit()
    db.refresh(proc)

    log_action(db, user_id=current_user.id, action="COURT_PROCEEDING_ADDED",
               chargesheet_id=data.chargesheet_id,
               details=f"Hearing: {data.hearing_date.date()}", ip_address=request.client.host)
    return proc


@router.get("/proceedings/{chargesheet_id}", response_model=List[CourtProceedingResponse])
async def get_proceedings(
    chargesheet_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all court proceedings for a Charge Sheet. Access is audit-logged."""
    cs = db.query(ChargeSheet).filter(ChargeSheet.id == chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")
    procs = (
        db.query(CourtProceeding)
        .filter(CourtProceeding.chargesheet_id == chargesheet_id)
        .order_by(CourtProceeding.hearing_date.asc())
        .all()
    )
    log_action(db, user_id=current_user.id, action="PROCEEDINGS_VIEWED",
               chargesheet_id=chargesheet_id, ip_address=request.client.host)
    return procs
