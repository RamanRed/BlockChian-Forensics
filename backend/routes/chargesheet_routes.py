"""
Charge Sheet Routes — Final Report (Section 173 CrPC)

Statutory rules:
  - Must be filed within 60 days (custody) / 90 days (bail) of FIR (Sec 173(2) CrPC).
  - Once filed, status cannot revert to draft.
  - Full content is hashed and stored on blockchain.
  - Supplementary charge sheet references parent chargesheet_id.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import hashlib, json

from database import get_db
from models import User, FIR, ChargeSheet, ChargesheetStatus, FIRStatus, UserRole
from schemas import ChargesheetCreate, ChargesheetResponse
from auth.dependencies import get_current_user, require_investigator
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/", response_model=ChargesheetResponse, status_code=status.HTTP_201_CREATED)
async def create_chargesheet(
    data: ChargesheetCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Create a Charge Sheet draft (Section 173 CrPC).
    Validates that the parent FIR exists and is in an appropriate state.
    """
    fir = db.query(FIR).filter(FIR.id == data.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")
    if fir.status.value == "closed":
        raise HTTPException(status_code=400, detail="Charge Sheet cannot be created for a closed FIR.")

    existing = db.query(ChargeSheet).filter(ChargeSheet.chargesheet_number == data.chargesheet_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Charge Sheet number '{data.chargesheet_number}' already exists.")

    # Validate assigned court user
    if data.assigned_court_id:
        court_user = db.query(User).filter(
            User.id == data.assigned_court_id,
            User.role == UserRole.court,
            User.is_active == True
        ).first()
        if not court_user:
            raise HTTPException(status_code=400, detail="Selected court user not found or is not a court role.")

    chargesheet = ChargeSheet(
        fir_id=data.fir_id,
        chargesheet_number=data.chargesheet_number,
        filed_by_io_id=current_user.id,
        status=ChargesheetStatus.draft,
        assigned_court_id=data.assigned_court_id,
        accused_ids=data.accused_ids,
        witness_ids=data.witness_ids,
        property_ids=data.property_ids,
        offence_summary=data.offence_summary,
        io_conclusion=data.io_conclusion,
        deadline_date=data.deadline_date,
        parent_chargesheet_id=data.parent_chargesheet_id,
    )
    db.add(chargesheet)
    db.flush()

    # Hash the charge sheet content
    payload = {
        "fir_id":            data.fir_id,
        "cs_number":         data.chargesheet_number,
        "offence_summary":   data.offence_summary,
        "accused_ids":       data.accused_ids or [],
        "property_ids":      data.property_ids or [],
    }
    chargesheet.data_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    db.commit()
    db.refresh(chargesheet)

    log_action(db, user_id=current_user.id, action="CHARGESHEET_CREATED",
               fir_id=data.fir_id, chargesheet_id=chargesheet.id,
               details=f"CS No: {data.chargesheet_number}", ip_address=request.client.host)
    return _enrich(chargesheet, db)


def _enrich(cs: ChargeSheet, db: Session):
    """Attach computed fields (assigned_court_name) to a ChargeSheet ORM object."""
    court_name = None
    if cs.assigned_court_id:
        court_user = db.query(User).filter(User.id == cs.assigned_court_id).first()
        if court_user:
            court_name = court_user.name
    # Attach as a transient attribute so Pydantic can serialise it
    cs.__dict__["assigned_court_name"] = court_name
    return cs


@router.post("/{chargesheet_id}/file", response_model=ChargesheetResponse)
async def file_chargesheet(
    chargesheet_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Officially file a Charge Sheet — transitions status from draft → filed.
    Triggers blockchain write and updates FIR status to chargesheeted.
    """
    cs = db.query(ChargeSheet).filter(ChargeSheet.id == chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")
    if cs.status != ChargesheetStatus.draft:
        raise HTTPException(status_code=400, detail=f"Charge Sheet is already {cs.status.value}.")

    cs.status = ChargesheetStatus.filed
    cs.filed_at = datetime.utcnow()

    # Blockchain write on official filing
    bc_result = await store_record_hash("chargesheet", cs.chargesheet_number, cs.data_hash)
    if bc_result:
        cs.blockchain_tx = bc_result.get("tx_hash")

    # Update FIR status
    fir = db.query(FIR).filter(FIR.id == cs.fir_id).first()
    if fir:
        fir.status = FIRStatus.chargesheeted

    db.commit()
    db.refresh(cs)

    log_action(db, user_id=current_user.id, action="CHARGESHEET_FILED",
               fir_id=cs.fir_id, chargesheet_id=cs.id,
               details=f"Filed: {cs.chargesheet_number}", ip_address=request.client.host)
    logger.info(f"Charge Sheet {cs.chargesheet_number} officially filed by {current_user.email}")
    return _enrich(cs, db)


@router.get("/{chargesheet_id}", response_model=ChargesheetResponse)
async def get_chargesheet(
    chargesheet_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve Charge Sheet. Every access is audit-logged."""
    cs = db.query(ChargeSheet).filter(ChargeSheet.id == chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")
    log_action(db, user_id=current_user.id, action="CHARGESHEET_VIEWED",
               fir_id=cs.fir_id, chargesheet_id=cs.id, ip_address=request.client.host)
    return _enrich(cs, db)


@router.get("/", response_model=List[ChargesheetResponse])
async def list_chargesheets(
    fir_id: int = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List charge sheets, optionally filtered by FIR."""
    query = db.query(ChargeSheet)
    if fir_id:
        query = query.filter(ChargeSheet.fir_id == fir_id)
    sheets = query.order_by(ChargeSheet.created_at.desc()).offset(skip).limit(limit).all()
    return [_enrich(cs, db) for cs in sheets]
