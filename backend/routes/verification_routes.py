"""
Evidence Verification Routes
POST /verify/{evidence_id} - Verify evidence integrity against blockchain
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import User, Evidence
from schemas import VerificationResponse
from auth.dependencies import get_current_user
from services.hashing_service import verify_hash
from services.blockchain_service import get_blockchain_record
from services.audit_service import log_action
from utils.logger import setup_logger
import os

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/{evidence_id}", response_model=VerificationResponse)
async def verify_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify evidence integrity:
    1. Retrieve stored file
    2. Recompute SHA-256 hash
    3. Compare with blockchain record
    4. Return full verification report
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    # Step 1: Read stored file
    if not evidence.storage_path or not os.path.exists(evidence.storage_path):
        raise HTTPException(status_code=404, detail="Evidence file not found on storage")

    with open(evidence.storage_path, "rb") as f:
        file_bytes = f.read()

    # Step 2: Recompute hash
    from services.hashing_service import generate_sha256
    recomputed_hash = generate_sha256(file_bytes)

    # Step 3: Compare hashes
    hash_match = verify_hash(evidence.file_hash, recomputed_hash)

    # Step 4: Verify blockchain record
    blockchain_verified = False
    if evidence.blockchain_tx:
        bc_record = await get_blockchain_record(evidence.file_hash)
        blockchain_verified = bc_record is not None and bc_record.get("evidence_hash") == evidence.file_hash

    # Determine verdict
    if hash_match and blockchain_verified:
        verdict = "VERIFIED - Evidence is authentic and unaltered"
    elif hash_match and not blockchain_verified:
        verdict = "PARTIAL - Hash matches but blockchain record not confirmed"
    else:
        verdict = "COMPROMISED - Hash mismatch detected! Evidence may have been tampered with"

    log_action(
        db, user_id=current_user.id, action="EVIDENCE_VERIFIED",
        evidence_id=evidence_id,
        details=f"HashMatch={hash_match} BlockchainVerified={blockchain_verified} Verdict={verdict[:30]}"
    )
    logger.info(f"Evidence {evidence_id} verified: {verdict[:50]}")

    return VerificationResponse(
        evidence_id=evidence_id,
        original_hash=evidence.file_hash,
        recomputed_hash=recomputed_hash,
        hash_match=hash_match,
        blockchain_verified=blockchain_verified,
        blockchain_tx=evidence.blockchain_tx,
        ai_status=evidence.ai_status,
        verification_timestamp=datetime.utcnow(),
        verdict=verdict
    )
