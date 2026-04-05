"""
Forensic Submission Routes

IO/SP/DSP submit evidence to forensic team.
CFSL views incoming evidence, submits lab reports with observations.
All roles can view forensic results for a case.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import os, uuid, json
from datetime import datetime, timezone

from database import get_db
from models import (
    User, FIR, PropertyRegister, ForensicSubmission,
    ForensicSubmissionStatus, InvestigationFinding, FindingType, UserRole
)
from schemas import ForensicSubmissionCreate, ForensicSubmissionResponse
from auth.dependencies import get_current_user, require_investigator, require_cfsl_or_above, require_read_only
from services.hashing_service import generate_sha256
from services.blockchain_service import store_record_hash
from services.audit_service import log_action
from config import settings
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


# ── IO/SP/DSP: Submit evidence to forensic team ──────────────────────────

@router.post("/submit", response_model=ForensicSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_evidence_to_forensic(
    data: ForensicSubmissionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """IO/SP/DSP submits evidence to the forensic team for analysis."""
    fir = db.query(FIR).filter(FIR.id == data.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    prop = db.query(PropertyRegister).filter(PropertyRegister.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Evidence (Property) not found.")

    # Check for duplicate submission
    existing = db.query(ForensicSubmission).filter(
        ForensicSubmission.property_id == data.property_id,
        ForensicSubmission.status != ForensicSubmissionStatus.completed
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="This evidence is already submitted for forensic analysis.")

    submission = ForensicSubmission(
        fir_id=data.fir_id,
        property_id=data.property_id,
        submitted_by=current_user.id,
        submitted_to=data.submitted_to,
        notes=data.notes,
        status=ForensicSubmissionStatus.pending,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    log_action(db, user_id=current_user.id, action="FORENSIC_EVIDENCE_SUBMITTED",
               fir_id=data.fir_id, details=f"Submission #{submission.id} | Property #{data.property_id}",
               ip_address=request.client.host)

    logger.info(f"Evidence submitted to forensics: submission={submission.id}, property={data.property_id}")
    return submission


# ── CFSL: List incoming evidence ──────────────────────────────────────────

@router.get("/incoming", response_model=List[ForensicSubmissionResponse])
async def list_incoming_evidence(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cfsl_or_above),
):
    """CFSL lists all evidence submitted to the forensic team."""
    query = db.query(ForensicSubmission)

    # If CFSL user, show items submitted to them OR all pending
    if current_user.role == UserRole.cfsl:
        query = query.filter(
            (ForensicSubmission.submitted_to == current_user.id) |
            (ForensicSubmission.submitted_to == None)
        )

    return query.order_by(ForensicSubmission.submitted_at.desc()).all()


# ── CFSL: Submit lab results for a submission ─────────────────────────────

@router.post("/lab-result/{submission_id}", response_model=ForensicSubmissionResponse)
async def submit_lab_result(
    submission_id: int,
    request: Request,
    observations: str = Form(...),
    conclusion: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cfsl_or_above),
):
    """CFSL submits forensic lab results for a submission."""
    submission = db.query(ForensicSubmission).filter(ForensicSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Forensic submission not found.")

    if submission.status == ForensicSubmissionStatus.completed:
        raise HTTPException(status_code=409, detail="Lab results already submitted for this evidence.")

    # Save file
    file_bytes = await file.read()
    stored_filename = f"{uuid.uuid4().hex}_{file.filename}"
    storage_dir = os.path.join(settings.EVIDENCE_STORAGE_PATH, "forensic_reports")
    os.makedirs(storage_dir, exist_ok=True)
    storage_path = os.path.join(storage_dir, stored_filename)
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    file_hash = generate_sha256(file_bytes)

    # Create InvestigationFinding for the lab report
    finding = InvestigationFinding(
        fir_id=submission.fir_id,
        finding_type=FindingType.lab_report,
        title=f"Forensic Report — Submission #{submission.id}",
        description=observations,
        text_content=f"OBSERVATIONS:\n{observations}\n\nCONCLUSION:\n{conclusion}",
        original_filename=file.filename,
        stored_filename=stored_filename,
        storage_path=storage_path,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        file_hash=file_hash,
        recorded_by_io_id=current_user.id,
    )
    db.add(finding)
    db.flush()

    # Blockchain anchor
    bc_result = await store_record_hash(
        record_type="forensic_report",
        record_id=f"FR-{finding.id}",
        data_hash=file_hash,
        ipfs_cid=""
    )
    if bc_result:
        finding.blockchain_tx = bc_result.get("tx_hash")
        finding.blockchain_hash = file_hash

    # Update submission
    submission.status = ForensicSubmissionStatus.completed
    submission.finding_id = finding.id
    submission.lab_observations = observations
    submission.lab_conclusion = conclusion
    submission.lab_report_file = storage_path
    submission.completed_at = datetime.now(timezone.utc)
    submission.data_hash = file_hash
    if bc_result:
        submission.blockchain_tx = bc_result.get("tx_hash")

    db.commit()
    db.refresh(submission)

    log_action(db, user_id=current_user.id, action="FORENSIC_REPORT_SUBMITTED",
               fir_id=submission.fir_id,
               details=f"Submission #{submission.id} completed | Finding #{finding.id}",
               ip_address=request.client.host)

    logger.info(f"Lab result submitted: submission={submission.id}, finding={finding.id}")
    return submission


# ── All roles: View forensic results for a case ──────────────────────────

@router.get("/results/{fir_id}", response_model=List[ForensicSubmissionResponse])
async def get_forensic_results(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """Get all forensic submissions and results for a FIR case."""
    return db.query(ForensicSubmission).filter(ForensicSubmission.fir_id == fir_id)\
        .order_by(ForensicSubmission.submitted_at.desc()).all()


# ── All roles: List all submissions ───────────────────────────────────────

@router.get("/all", response_model=List[ForensicSubmissionResponse])
async def list_all_submissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """List all forensic submissions (paginated)."""
    return db.query(ForensicSubmission).order_by(ForensicSubmission.submitted_at.desc())\
        .offset(skip).limit(limit).all()
