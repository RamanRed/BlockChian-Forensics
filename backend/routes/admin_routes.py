"""
Admin Routes — Audit logs, user management, quarantine list, case-level admin.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import User, PropertyRegister, AuditLog, UserRole
from schemas import AuditLogResponse, PropertyRegisterResponse, UserResponse
from auth.dependencies import require_admin, require_investigator
from services.audit_service import log_action
from utils.logger import setup_logger
import os

router = APIRouter()
logger = setup_logger(__name__)


@router.get("/audit/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0, limit: int = 100,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    fir_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Fetch audit logs with optional filtering. Admin/Auditor only."""
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if fir_id:
        query = query.filter(AuditLog.fir_id == fir_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


@router.get("/quarantine", response_model=List[PropertyRegisterResponse])
async def get_quarantined_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """List all AI-flagged quarantined digital evidence items."""
    return db.query(PropertyRegister).filter(PropertyRegister.is_quarantined == True).all()


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all registered users. Admin only."""
    return db.query(User).all()


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a user's role. Admin only. Change is audit-logged."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    old_role = user.role
    user.role = role
    db.commit()
    log_action(db, user_id=current_user.id, action="USER_ROLE_UPDATED",
               details=f"User {user_id}: {old_role} → {role}")
    return {"message": f"User {user_id} role updated to {role}"}


@router.patch("/users/{user_id}/activate")
async def toggle_user_active(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Activate or deactivate a user account. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    log_action(db, user_id=current_user.id, action="USER_DEACTIVATED" if not is_active else "USER_ACTIVATED",
               details=f"User {user_id}")
    return {"message": f"User {user_id} {'activated' if is_active else 'deactivated'}"}
