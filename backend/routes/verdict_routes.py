"""
Court Verdict Routes

Court users can issue verdicts.
All authenticated users (IO, SP, DSP, CFSL, Court) can view verdicts.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, FIR, ChargeSheet, CourtVerdict, UserRole
from schemas import CourtVerdictCreate, CourtVerdictResponse
from auth.dependencies import get_current_user, require_read_only
from services.hashing_service import generate_sha256
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/", response_model=CourtVerdictResponse, status_code=status.HTTP_201_CREATED)
async def issue_verdict(
    data: CourtVerdictCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Issue a court verdict. Requires court or admin role."""
    if current_user.role not in (UserRole.court, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only court officers can issue verdicts.")

    fir = db.query(FIR).filter(FIR.id == data.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    cs = db.query(ChargeSheet).filter(ChargeSheet.id == data.chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")

    import json
    verdict_json = json.dumps({
        "fir_id": data.fir_id,
        "chargesheet_id": data.chargesheet_id,
        "verdict_type": data.verdict_type.value,
        "verdict_summary": data.verdict_summary,
        "judge_name": data.judge_name,
    }, sort_keys=True)
    data_hash = generate_sha256(verdict_json.encode("utf-8"))

    verdict = CourtVerdict(
        fir_id=data.fir_id,
        chargesheet_id=data.chargesheet_id,
        verdict_type=data.verdict_type.value,
        verdict_summary=data.verdict_summary,
        reasoning=data.reasoning,
        sentence=data.sentence,
        judge_name=data.judge_name,
        court_name=data.court_name,
        verdict_date=data.verdict_date,
        next_hearing_date=data.next_hearing_date,
        data_hash=data_hash,
        issued_by=current_user.id,
    )
    db.add(verdict)
    db.flush()

    # Blockchain anchor
    bc_result = await store_record_hash(
        record_type="verdict",
        record_id=f"V-{verdict.id}",
        data_hash=data_hash,
        ipfs_cid=""
    )
    if bc_result:
        verdict.blockchain_tx = bc_result.get("tx_hash")

    db.commit()
    db.refresh(verdict)

    log_action(db, user_id=current_user.id, action="VERDICT_ISSUED",
               fir_id=data.fir_id, chargesheet_id=data.chargesheet_id,
               details=f"Verdict: {data.verdict_type.value}", ip_address=request.client.host)

    logger.info(f"Verdict issued: ID={verdict.id}, FIR={data.fir_id}, Type={data.verdict_type.value}")
    return verdict


@router.get("/by-fir/{fir_id}", response_model=List[CourtVerdictResponse])
async def get_verdicts_by_fir(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """Get all verdicts for a FIR. Accessible to all authenticated users."""
    verdicts = db.query(CourtVerdict).filter(CourtVerdict.fir_id == fir_id)\
        .order_by(CourtVerdict.verdict_date.desc()).all()
    log_action(db, user_id=current_user.id, action="VERDICTS_VIEWED",
               fir_id=fir_id, ip_address=request.client.host)
    return verdicts


@router.get("/by-chargesheet/{cs_id}", response_model=List[CourtVerdictResponse])
async def get_verdicts_by_chargesheet(
    cs_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """Get all verdicts for a Charge Sheet."""
    verdicts = db.query(CourtVerdict).filter(CourtVerdict.chargesheet_id == cs_id)\
        .order_by(CourtVerdict.verdict_date.desc()).all()
    return verdicts


@router.get("/all", response_model=List[CourtVerdictResponse])
async def list_all_verdicts(
    skip: int = 0,
    limit: int = 100,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """List all verdicts (paginated)."""
    return db.query(CourtVerdict).order_by(CourtVerdict.created_at.desc())\
        .offset(skip).limit(limit).all()
