"""
Property Movement Routes — Chain of Custody

Every transfer of evidence between custodians is recorded here.
Chain of Custody is the most commonly attacked element in court — every event is
hashed and blockchain-anchored. Any break in the chain creates reasonable doubt.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import hashlib, json

from database import get_db
from models import User, PropertyRegister, PropertyMovement
from schemas import PropertyMovementCreate, PropertyMovementResponse
from auth.dependencies import get_current_user, require_investigator
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/transfer", response_model=PropertyMovementResponse, status_code=status.HTTP_201_CREATED)
async def record_transfer(
    data: PropertyMovementCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Record a property custody transfer.
    from_custodian is the current user (or the last recorded custodian).
    Blockchain hash ensures the movement record is immutable.
    """
    prop = db.query(PropertyRegister).filter(PropertyRegister.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property Register entry not found.")

    # Determine from_custodian from last movement or current custodian
    last_movement = (
        db.query(PropertyMovement)
        .filter(PropertyMovement.property_id == data.property_id)
        .order_by(PropertyMovement.created_at.desc())
        .first()
    )
    from_name = last_movement.to_custodian_name if last_movement else current_user.name

    movement = PropertyMovement(
        property_id=data.property_id,
        from_custodian_id=current_user.id,
        from_custodian_name=from_name,
        to_custodian_id=data.to_custodian_id,
        to_custodian_name=data.to_custodian_name,
        purpose=data.purpose,
        movement_date=data.movement_date,
        lab_case_number=data.lab_case_number,
    )
    db.add(movement)
    db.flush()

    # Hash this movement record
    payload = {
        "property_id":       data.property_id,
        "from_custodian":    from_name,
        "to_custodian":      data.to_custodian_name,
        "purpose":           data.purpose,
        "movement_date":     data.movement_date.isoformat(),
    }
    movement.signature_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    # Update property custodian
    if data.to_custodian_id:
        prop.custodian_io_id = data.to_custodian_id

    bc_result = await store_record_hash("custody", f"{data.property_id}-{movement.id}", movement.signature_hash)
    if bc_result:
        movement.blockchain_tx = bc_result.get("tx_hash")

    db.commit()
    db.refresh(movement)

    log_action(db, user_id=current_user.id, action="CUSTODY_TRANSFERRED",
               evidence_id=data.property_id,
               details=f"{from_name} → {data.to_custodian_name} | Purpose: {data.purpose}",
               ip_address=request.client.host)
    logger.info(f"Property {data.property_id} transferred to {data.to_custodian_name}")
    return movement


@router.get("/{property_id}", response_model=List[PropertyMovementResponse])
async def get_movement_history(
    property_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete chain of custody for a property item (chronological)."""
    prop = db.query(PropertyRegister).filter(PropertyRegister.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property Register entry not found.")

    movements = (
        db.query(PropertyMovement)
        .filter(PropertyMovement.property_id == property_id)
        .order_by(PropertyMovement.movement_date.asc())
        .all()
    )
    log_action(db, user_id=current_user.id, action="CUSTODY_CHAIN_VIEWED",
               evidence_id=property_id,
               details=f"{len(movements)} movements", ip_address=request.client.host)
    return movements
