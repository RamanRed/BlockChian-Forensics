"""
Evidence Management Routes
POST /upload         - Upload new evidence file
GET  /{id}           - Get evidence by ID
GET  /all            - List all evidence
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from sqlalchemy.orm import Session
from typing import Optional, List
import os, uuid, shutil
from database import get_db
from models import User, PropertyRegister, AIStatus
from pydantic import BaseModel
class EvidenceUploadResponse(BaseModel):
    evidence_id: int
    filename: str
    ai_score: float
    ai_status: str
    blockchain_tx: Optional[str] = None

class EvidenceListResponse(BaseModel):
    id: int
    property_number: str
    description: Optional[str] = None
    item_type: str
    ai_status: str
    blockchain_tx: Optional[str] = None
from auth.dependencies import get_current_user, require_investigator
from services.ai_service import analyze_file
from services.hashing_service import generate_sha256, bind_evidence
from services.ipfs_service import upload_to_ipfs
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from config import settings
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/upload", response_model=EvidenceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    request: Request,
    file: UploadFile = File(...),
    case_number: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator)
):
    """Upload a new evidence file through the full processing pipeline."""

    # Step 1: Validate file format
    if file.content_type not in settings.ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail=f"File type '{file.content_type}' not allowed.")

    file_bytes = await file.read()

    # Step 2: Validate file size
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds max size of {settings.MAX_FILE_SIZE_MB}MB.")

    # Step 3: Generate SHA-256 hash
    file_hash = generate_sha256(file_bytes)

    # Check for duplicate
    existing = db.query(PropertyRegister).filter(PropertyRegister.hash_value.like(f'%{file_hash}%')).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Evidence with this hash already exists (ID: {existing.id})")

    # Step 4: Save file to local storage
    stored_filename = f"{uuid.uuid4().hex}_{file.filename}"
    storage_path = os.path.join(settings.EVIDENCE_STORAGE_PATH, stored_filename)
    os.makedirs(settings.EVIDENCE_STORAGE_PATH, exist_ok=True)
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    # Step 5: AI Analysis
    ai_result = await analyze_file(file_bytes, file.content_type)
    is_suspicious = ai_result.status == AIStatus.SUSPICIOUS

    # Step 6: Quarantine if suspicious
    if is_suspicious:
        quarantine_path = os.path.join(settings.QUARANTINE_STORAGE_PATH, stored_filename)
        os.makedirs(settings.QUARANTINE_STORAGE_PATH, exist_ok=True)
        shutil.move(storage_path, quarantine_path)
        storage_path = quarantine_path
        logger.warning(f"File quarantined: {file.filename} (score: {ai_result.ai_score})")

    # Step 7: Upload to IPFS
    ipfs_cid = None
    if settings.USE_IPFS and not is_suspicious:
        ipfs_cid = await upload_to_ipfs(storage_path)

    # Step 8: Store on blockchain
    blockchain_tx = None
    blockchain_block = None
    bound_data = bind_evidence(file_hash, ai_result, {"filename": file.filename, "case": case_number})
    # Use the new unified blockchain service method (store_record_hash)
    bc_result = await store_record_hash(
        record_type="evidence",
        record_id=file_hash[:16],  # Evidence doesn't have a natural human ID, use hash prefix
        data_hash=bound_data,
        ipfs_cid=ipfs_cid or ""
    )
    if bc_result:
        blockchain_tx = bc_result.get("tx_hash")
        blockchain_block = bc_result.get("block_number")

    # Step 9: Save to database
    import json
    evidence = PropertyRegister(
        seizure_memo_id=int(case_number) if case_number and case_number.isdigit() else 1, # default to memo 1 if missing for testing
        property_number=f"EVD-{''.join(str(uuid.uuid4()).split('-')[:2])}",
        item_type="digital",
        description=description or file.filename,
        storage_location=storage_path,
        hash_value=json.dumps({"original": file_hash}),
        ai_score=ai_result.ai_score,
        ai_status=ai_result.status,
        blockchain_tx=blockchain_tx,
        is_quarantined=1 if is_suspicious else 0
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # Step 10: Log audit
    log_action(db, user_id=current_user.id, action="EVIDENCE_UPLOADED", property_id=evidence.id,
               details=f"Hash: {file_hash[:16]}... Status: {ai_result.status}",
               ip_address=request.client.host)

    logger.info(f"Evidence uploaded: ID={evidence.id}, Status={ai_result.status}")
    return evidence


@router.get("/all", response_model=List[EvidenceListResponse])
async def get_all_evidence(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all evidence records (paginated)."""
    evidence_list = db.query(PropertyRegister).offset(skip).limit(limit).all()
    return evidence_list


@router.get("/{evidence_id}", response_model=EvidenceUploadResponse)
async def get_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific evidence record by ID."""
    evidence = db.query(PropertyRegister).filter(PropertyRegister.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    log_action(db, user_id=current_user.id, action="EVIDENCE_VIEWED", property_id=evidence_id)
    return evidence
