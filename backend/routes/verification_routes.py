"""
DIRS Verification Routes
POST /api/verify/{evidence_id}    — Re-verify digital property hash vs blockchain
GET  /api/verify/fir/{fir_id}     — Verify FIR hash against blockchain
GET  /api/verify/property/{id}    — Verify property hash against its stored value
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import User, FIR, PropertyRegister
from schemas import PublicVerificationResponse
from auth.dependencies import get_current_user
from services.hashing_service import generate_sha256
from services.blockchain_service import get_blockchain_record
from services.audit_service import log_action
from utils.logger import setup_logger
import os, json, hashlib

router = APIRouter()
logger = setup_logger(__name__)


@router.get("/fir/{fir_id}")
async def verify_fir(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify a FIR's integrity: recompute hash and check blockchain."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    # Recompute hash
    payload = {
        "fir_number":          fir.fir_number,
        "police_station":      fir.police_station,
        "district":            fir.district,
        "date_of_offence":     fir.date_of_offence.isoformat(),
        "offence_sections":    fir.offence_sections,
        "offence_description": fir.offence_description,
        "complainant_name":    fir.complainant_name,
    }
    recomputed = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    hash_match = recomputed == fir.data_hash

    bc_record = None
    blockchain_verified = False
    if fir.data_hash:
        bc_record = await get_blockchain_record(fir.data_hash)
        blockchain_verified = bc_record is not None

    verdict = (
        "VERIFIED — FIR is authentic and unaltered"
        if hash_match and blockchain_verified
        else "PARTIAL — Hash matches but blockchain record not confirmed"
        if hash_match
        else "COMPROMISED — Hash mismatch! FIR may have been tampered with"
    )

    log_action(db, user_id=current_user.id, action="BLOCKCHAIN_VERIFIED",
               fir_id=fir_id, details=f"FIR verify: {verdict[:40]}", ip_address=request.client.host)
    return {
        "fir_id": fir_id,
        "fir_number": fir.fir_number,
        "stored_hash": fir.data_hash,
        "recomputed_hash": recomputed,
        "hash_match": hash_match,
        "blockchain_verified": blockchain_verified,
        "blockchain_tx": fir.blockchain_tx,
        "verdict": verdict,
        "verified_at": datetime.utcnow().isoformat(),
    }


@router.get("/property/{property_id}")
async def verify_property(
    property_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-hash the stored file and verify against recorded + blockchain hash."""
    prop = db.query(PropertyRegister).filter(PropertyRegister.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property Register entry not found.")
    if not prop.storage_path or not os.path.exists(prop.storage_path):
        raise HTTPException(status_code=404, detail="Evidence file not found on storage.")

    with open(prop.storage_path, "rb") as f:
        file_bytes = f.read()

    recomputed = generate_sha256(file_bytes)
    stored_hash_data = json.loads(prop.hash_value) if prop.hash_value else {}
    original_hash = stored_hash_data.get("original", "")
    hash_match = recomputed == original_hash

    blockchain_verified = False
    if original_hash:
        bc_record = await get_blockchain_record(original_hash)
        blockchain_verified = bc_record is not None

    verdict = (
        "VERIFIED — Evidence is authentic and unaltered"
        if hash_match and blockchain_verified
        else "PARTIAL — Hash matches but blockchain record not confirmed"
        if hash_match
        else "COMPROMISED — Hash mismatch! Evidence may have been tampered with"
    )

    log_action(db, user_id=current_user.id, action="BLOCKCHAIN_VERIFIED",
               evidence_id=property_id, details=f"Property verify: {verdict[:40]}", ip_address=request.client.host)
    return {
        "property_id": property_id,
        "property_number": prop.property_number,
        "stored_hash": original_hash,
        "recomputed_hash": recomputed,
        "hash_match": hash_match,
        "blockchain_verified": blockchain_verified,
        "blockchain_tx": prop.blockchain_tx,
        "ai_status": prop.ai_status,
        "verdict": verdict,
        "verified_at": datetime.utcnow().isoformat(),
    }
