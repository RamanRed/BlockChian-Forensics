"""
Admin Routes
GET    /audit/logs        - Fetch audit logs
GET    /quarantine        - List quarantined files
DELETE /evidence/{id}    - Delete evidence (restricted to admin)
GET    /users            - List all users
PATCH  /users/{id}/role  - Update user role
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import User, Evidence, AuditLog, UserRole
from schemas import AuditLogResponse, EvidenceListResponse, UserResponse
from auth.dependencies import require_admin, require_investigator, require_auditor_or_above
from services.audit_service import log_action
from utils.logger import setup_logger
import os

router = APIRouter()
logger = setup_logger(__name__)


@router.get("/audit/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0, limit: int = 100,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor_or_above)
):
    """Fetch audit logs with optional filtering by user."""
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/quarantine", response_model=List[EvidenceListResponse])
async def get_quarantined_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator)
):
    """List all quarantined (suspicious) evidence files."""
    quarantined = db.query(Evidence).filter(Evidence.is_quarantined == 1).all()
    return quarantined


@router.delete("/evidence/{evidence_id}", status_code=status.HTTP_200_OK)
async def delete_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Permanently delete evidence record and associated file. Admin only."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    # Delete file from storage
    if evidence.storage_path and os.path.exists(evidence.storage_path):
        os.remove(evidence.storage_path)

    log_action(db, user_id=current_user.id, action="EVIDENCE_DELETED", evidence_id=evidence_id,
               details=f"Hash: {evidence.file_hash}")
    db.delete(evidence)
    db.commit()
    logger.warning(f"Evidence {evidence_id} deleted by admin {current_user.email}")
    return {"message": f"Evidence {evidence_id} deleted successfully"}


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all registered users."""
    return db.query(User).all()


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a user's role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    old_role = user.role
    user.role = role
    db.commit()
    log_action(db, user_id=current_user.id, action="USER_ROLE_UPDATED",
               details=f"User {user_id}: {old_role} -> {role}")
    return {"message": f"User {user_id} role updated to {role}"}
