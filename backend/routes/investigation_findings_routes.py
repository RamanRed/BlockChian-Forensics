from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import os, uuid, hashlib, json

from database import get_db
from models import User, FIR, InvestigationFinding, FindingType, AIStatus
from schemas import InvestigationFindingCreate, InvestigationFindingResponse
from auth.dependencies import get_current_user, require_io_or_above, require_read_only, require_cfsl_or_above

from services.ipfs_service import PinataIPFSService
from services.blockchain_service import store_record_hash
from services.ai_service import analyze_file
from services.hashing_service import generate_sha256
from services.audit_service import log_action
from config import settings
from utils.logger import setup_logger

router = APIRouter(prefix="/investigation-findings", tags=["Investigation Findings"])
logger = setup_logger(__name__)


# Helpers
async def _handle_ipfs_and_blockchain(
    fir_id: int, 
    finding_id: str, 
    original_hash: str, 
    file_bytes: bytes = None, 
    filename: str = None, 
    content_type: str = None
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    ipfs_cid = None
    if file_bytes and settings.PINATA_JWT:
        service = PinataIPFSService()
        try:
            res = await service.upload_file(file_bytes, filename, content_type)
            ipfs_cid = res.get("cid")
        except Exception as e:
            logger.error(f"IPFS Upload Error: {e}")
            
    bc_result = await store_record_hash("finding", finding_id, original_hash, ipfs_cid=ipfs_cid or "")
    blockchain_tx = None
    blockchain_hash = original_hash
    if bc_result:
        blockchain_tx = bc_result.get("tx_hash")
        
    return ipfs_cid, blockchain_tx, blockchain_hash


@router.post("/{fir_id}/lab-report", response_model=InvestigationFindingResponse)
async def add_lab_report(
    fir_id: int,
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    lab_reference_number: Optional[str] = Form(None),
    lab_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cfsl_or_above)
):
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir: raise HTTPException(status_code=404, detail="FIR not found")
    
    file_bytes = await file.read()
    original_hash = generate_sha256(file_bytes)
    
    stored_filename = f"{uuid.uuid4().hex}_{file.filename}"
    storage_dir = os.path.join(settings.EVIDENCE_STORAGE_PATH, "findings")
    os.makedirs(storage_dir, exist_ok=True)
    storage_path = os.path.join(storage_dir, stored_filename)
    with open(storage_path, "wb") as f:
        f.write(file_bytes)
        
    finding = InvestigationFinding(
        fir_id=fir_id,
        finding_type=FindingType.lab_report,
        title=title,
        description=description,
        original_filename=file.filename,
        stored_filename=stored_filename,
        storage_path=storage_path,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        lab_reference_number=lab_reference_number,
        lab_name=lab_name,
        file_hash=original_hash,
        recorded_by_io_id=current_user.id
    )
    db.add(finding)
    db.flush()
    
    cid, tx, bc_hash = await _handle_ipfs_and_blockchain(
        fir_id=fir_id, details=f"lab_{finding.id}", original_hash=original_hash,
        file_bytes=file_bytes, filename=file.filename, content_type=file.content_type
    )
    
    finding.ipfs_cid = cid
    finding.blockchain_tx = tx
    finding.blockchain_hash = bc_hash
    db.commit()
    db.refresh(finding)
    
    log_action(db, user_id=current_user.id, action="FINDING_LAB_REPORT_ADDED", fir_id=fir_id, details=str(finding.id), ip_address=request.client.host)
    return finding


@router.post("/{fir_id}/media", response_model=InvestigationFindingResponse)
async def add_media(
    fir_id: int,
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    finding_type: str = Form("photograph"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_io_or_above)
):
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir: raise HTTPException(status_code=404, detail="FIR not found")
    
    file_bytes = await file.read()
    original_hash = generate_sha256(file_bytes)
    
    # Store physically
    stored_filename = f"{uuid.uuid4().hex}_{file.filename}"
    storage_dir = os.path.join(settings.EVIDENCE_STORAGE_PATH, "findings")
    os.makedirs(storage_dir, exist_ok=True)
    storage_path = os.path.join(storage_dir, stored_filename)
    with open(storage_path, "wb") as f:
        f.write(file_bytes)
        
    # AI verify deepfakes
    ai_result = await analyze_file(file_bytes, file.content_type)
    
    enum_type = FindingType.photograph
    try: enum_type = FindingType(finding_type)
    except: pass
    
    finding = InvestigationFinding(
        fir_id=fir_id,
        finding_type=enum_type,
        title=title,
        description=description,
        original_filename=file.filename,
        stored_filename=stored_filename,
        storage_path=storage_path,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        file_hash=original_hash,
        recorded_by_io_id=current_user.id,
        ai_score=ai_result.ai_score,
        ai_status=ai_result.status,
        model_version=ai_result.model_version
    )
    db.add(finding)
    db.flush()
    
    # Only push verified content to IPFS to save space/protect integrity if desired, or push all.
    cid, tx, bc_hash = await _handle_ipfs_and_blockchain(
        fir_id=fir_id, details=f"media_{finding.id}", original_hash=original_hash,
        file_bytes=file_bytes if ai_result.status != AIStatus.SUSPICIOUS else None, 
        filename=file.filename, content_type=file.content_type
    )
    
    finding.ipfs_cid = cid
    finding.blockchain_tx = tx
    finding.blockchain_hash = bc_hash
    db.commit()
    db.refresh(finding)
    log_action(db, user_id=current_user.id, action="FINDING_MEDIA_ADDED", fir_id=fir_id, details=str(finding.id), ip_address=request.client.host)
    return finding


@router.post("/{fir_id}/finding", response_model=InvestigationFindingResponse)
async def add_finding(
    fir_id: int,
    data: InvestigationFindingCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_io_or_above)
):
    """
    Store text-based findings or bypass for massive digital forensics system images.
    If 'digital_forensics' is chosen, system_command_data string will be hashed and mapped.
    """
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir: raise HTTPException(status_code=404, detail="FIR not found")
    
    enum_type = FindingType.field_finding
    try: enum_type = FindingType(data.finding_type)
    except: pass
    
    text_content = data.text_content or ""
    
    # HUGE SYSTEM FILE BYPASS logic
    if enum_type == FindingType.digital_forensics:
        if not data.system_command_data:
            raise HTTPException(status_code=400, detail="digital_forensics requires 'system_command_data' containing exact reference arguments or dump hashes")
        text_content = f"[DIGITAL FORENSIC BYPASS]: Command tracked - {data.system_command_data}\n\nNotes: {text_content}"
    
    # Content hash
    payload_hash = generate_sha256(text_content.encode('utf-8'))
    
    finding = InvestigationFinding(
        fir_id=fir_id,
        finding_type=enum_type,
        title=data.title,
        description=data.description,
        text_content=text_content,
        file_hash=payload_hash,
        recorded_by_io_id=current_user.id,
        lab_reference_number=data.lab_reference_number,
        lab_name=data.lab_name,
        received_on=data.received_on,
        result_date=data.result_date,
    )
    db.add(finding)
    db.flush()
    
    # IPFS - for text, we upload the raw text buffer
    cid, tx, bc_hash = await _handle_ipfs_and_blockchain(
        fir_id=fir_id, details=f"text_{finding.id}", original_hash=payload_hash,
        file_bytes=text_content.encode('utf-8'), filename=f"finding_{finding.id}.txt", content_type="text/plain"
    )
    
    finding.ipfs_cid = cid
    finding.blockchain_tx = tx
    finding.blockchain_hash = bc_hash
    db.commit()
    db.refresh(finding)
    
    log_action(db, user_id=current_user.id, action=f"FINDING_TEXT_ADDED_TYPE_{enum_type.value}", fir_id=fir_id, details=str(finding.id), ip_address=request.client.host)
    return finding


@router.get("/{fir_id}/all", response_model=List[InvestigationFindingResponse])
async def list_all_findings(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    log_action(db, user_id=current_user.id, action="FINDINGS_VIEWED", fir_id=fir_id, ip_address=request.client.host)
    return db.query(InvestigationFinding).filter(InvestigationFinding.fir_id == fir_id).all()


@router.get("/{fir_id}/lab-reports", response_model=List[InvestigationFindingResponse])
async def list_lab_reports(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    log_action(db, user_id=current_user.id, action="LAB_REPORTS_VIEWED", fir_id=fir_id, ip_address=request.client.host)
    return db.query(InvestigationFinding).filter(InvestigationFinding.fir_id == fir_id, 
             InvestigationFinding.finding_type.in_([FindingType.lab_report, FindingType.new_result])).all()


@router.get("/{fir_id}/media", response_model=List[InvestigationFindingResponse])
async def list_media(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    log_action(db, user_id=current_user.id, action="MEDIA_VIEWED", fir_id=fir_id, ip_address=request.client.host)
    media_types = [FindingType.cctv_frame, FindingType.cctv_clip, FindingType.photograph, FindingType.audio_recording]
    return db.query(InvestigationFinding).filter(InvestigationFinding.fir_id == fir_id, 
             InvestigationFinding.finding_type.in_(media_types)).all()


@router.delete("/{finding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_finding(
    finding_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_io_or_above)
):
    # Depending on legal framework, deleting evidence is illegal, so we'll just block it or soft-delete.
    # The models don't have is_active for findings, but block the deletion completely 
    # to maintain strict append-only rules.
    raise HTTPException(status_code=403, detail="Deleting investigation findings is constitutionally restricted. Create a new log explicitly detailing correction.")
