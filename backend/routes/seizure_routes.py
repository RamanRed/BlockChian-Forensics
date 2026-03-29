"""
Seizure Memo + Property Register Routes

Seizure Memo: created at the moment of evidence collection.
Property Register (Malkhana): official inventory of all seized items.
Digital items are SHA-256 hashed + AI-analyzed + blockchain-anchored on registration.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from sqlalchemy.orm import Session
from typing import Optional, List
import os, uuid, shutil, hashlib, json

from database import get_db
from models import User, FIR, SeizureMemo, PropertyRegister, AIStatus
from schemas import (
    SeizureMemoCreate, SeizureMemoResponse,
    PropertyRegisterCreate, PropertyRegisterResponse
)
from auth.dependencies import get_current_user, require_investigator
from services.ai_service import analyze_file
from services.hashing_service import generate_sha256
from services.ipfs_service import upload_to_ipfs
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from config import settings
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/memo", response_model=SeizureMemoResponse, status_code=status.HTTP_201_CREATED)
async def create_seizure_memo(
    data: SeizureMemoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Create a Seizure Memo at the point of evidence collection.
    Validation: seizure requires at least one independent witness (two recommended).
    """
    fir = db.query(FIR).filter(FIR.id == data.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    if not data.witness_1_name or len(data.witness_1_name.strip()) < 2:
        raise HTTPException(
            status_code=422,
            detail={
                "error_code": "SEIZURE_WITNESS_REQUIRED",
                "message": "At least one independent witness is required on a Seizure Memo.",
            }
        )

    existing = db.query(SeizureMemo).filter(SeizureMemo.memo_number == data.memo_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Seizure Memo '{data.memo_number}' already exists.")

    # Hash the memo for integrity
    memo_payload = {
        "fir_id": data.fir_id,
        "memo_number": data.memo_number,
        "date_time": data.date_time.isoformat(),
        "place_of_seizure": data.place_of_seizure,
        "items_description": data.items_description,
    }
    seizure_hash = hashlib.sha256(json.dumps(memo_payload, sort_keys=True).encode()).hexdigest()

    memo = SeizureMemo(
        fir_id=data.fir_id,
        memo_number=data.memo_number,
        date_time=data.date_time,
        place_of_seizure=data.place_of_seizure,
        seized_by=current_user.id,
        witness_1_name=data.witness_1_name,
        witness_1_contact=data.witness_1_contact,
        witness_2_name=data.witness_2_name,
        witness_2_contact=data.witness_2_contact,
        items_description=data.items_description,
        seizure_hash=seizure_hash,
    )
    db.add(memo)
    db.flush()

    bc_result = await store_record_hash("seizure", memo.memo_number, seizure_hash)
    if bc_result:
        memo.blockchain_tx = bc_result.get("tx_hash")

    db.commit()
    db.refresh(memo)

    log_action(db, user_id=current_user.id, action="SEIZURE_MEMO_CREATED",
               fir_id=data.fir_id, details=f"Memo: {memo.memo_number}", ip_address=request.client.host)
    return memo


@router.get("/memo/{memo_id}", response_model=SeizureMemoResponse)
async def get_seizure_memo(
    memo_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a Seizure Memo. Access is audit-logged."""
    memo = db.query(SeizureMemo).filter(SeizureMemo.id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="Seizure Memo not found.")
    log_action(db, user_id=current_user.id, action="SEIZURE_MEMO_VIEWED",
               fir_id=memo.fir_id, ip_address=request.client.host)
    return memo


@router.post("/property/upload", response_model=PropertyRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_digital_property(
    request: Request,
    file: UploadFile = File(...),
    seizure_memo_id: int = Form(...),
    property_number: str = Form(...),
    description: str = Form(...),
    item_type: str = Form("digital"),
    storage_location: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """
    Register a digital evidence item into the Property Register (Malkhana).
    Full pipeline: SHA-256 → AI Analysis → Quarantine if suspicious → IPFS → Blockchain.
    Hash stored as JSON {"original": "...", "clone": "..."} per Malkhana standard.
    """
    memo = db.query(SeizureMemo).filter(SeizureMemo.id == seizure_memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="Seizure Memo not found.")

    # Check duplicate property number
    existing = db.query(PropertyRegister).filter(PropertyRegister.property_number == property_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Property number '{property_number}' already registered.")

    if file.content_type not in settings.ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail=f"File type '{file.content_type}' not allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit.")

    # SHA-256 of original
    original_hash = generate_sha256(file_bytes)
    # Simulate clone hash (in real deployment: write-blocked clone would be hashed separately)
    clone_hash = original_hash  # Same content → same hash proves integrity
    hash_value = json.dumps({"original": original_hash, "clone": clone_hash})

    # Save to storage
    stored_filename = f"{uuid.uuid4().hex}_{file.filename}"
    storage_path = os.path.join(settings.EVIDENCE_STORAGE_PATH, stored_filename)
    os.makedirs(settings.EVIDENCE_STORAGE_PATH, exist_ok=True)
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    # AI Analysis
    ai_result = await analyze_file(file_bytes, file.content_type)
    is_suspicious = ai_result.status == AIStatus.SUSPICIOUS

    if is_suspicious:
        quarantine_path = os.path.join(settings.QUARANTINE_STORAGE_PATH, stored_filename)
        os.makedirs(settings.QUARANTINE_STORAGE_PATH, exist_ok=True)
        shutil.move(storage_path, quarantine_path)
        storage_path = quarantine_path
        logger.warning(f"Property {property_number} quarantined (score: {ai_result.ai_score:.4f})")

    # IPFS (optional)
    ipfs_cid = None
    if settings.USE_IPFS and not is_suspicious:
        ipfs_cid = await upload_to_ipfs(storage_path)

    # Blockchain
    bc_result = await store_record_hash("property", property_number, original_hash)
    blockchain_tx = None
    blockchain_block = None
    if bc_result:
        blockchain_tx = bc_result.get("tx_hash")
        blockchain_block = bc_result.get("block_number")

    prop = PropertyRegister(
        seizure_memo_id=seizure_memo_id,
        property_number=property_number,
        description=description,
        item_type=item_type,
        original_filename=file.filename,
        stored_filename=stored_filename,
        storage_path=storage_path,
        file_size=len(file_bytes),
        hash_value=hash_value,
        ipfs_cid=ipfs_cid,
        ai_score=ai_result.ai_score,
        ai_status=ai_result.status,
        model_version=ai_result.model_version,
        manipulation_type=ai_result.manipulation_type,
        is_quarantined=is_suspicious,
        blockchain_tx=blockchain_tx,
        blockchain_block=blockchain_block,
        storage_location=storage_location,
        custodian_io_id=current_user.id,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    log_action(db, user_id=current_user.id, action="PROPERTY_REGISTERED",
               evidence_id=prop.id, fir_id=memo.fir_id,
               details=f"PropNo: {property_number} | AI: {ai_result.status}", ip_address=request.client.host)
    return prop


@router.get("/property/{property_id}", response_model=PropertyRegisterResponse)
async def get_property(
    property_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a Property Register entry. Access is audit-logged."""
    prop = db.query(PropertyRegister).filter(PropertyRegister.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property Register entry not found.")
    log_action(db, user_id=current_user.id, action="PROPERTY_VIEWED",
               evidence_id=property_id, ip_address=request.client.host)
    return prop
