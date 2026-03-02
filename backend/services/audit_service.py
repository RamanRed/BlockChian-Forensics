"""
Audit Logging Service
"""

from sqlalchemy.orm import Session
from typing import Optional, List
from models import AuditLog
from utils.logger import setup_logger

logger = setup_logger(__name__)


def log_action(
    db: Session,
    user_id: int,
    action: str,
    evidence_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Create an audit log entry."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        evidence_id=evidence_id,
        details=details,
        ip_address=ip_address
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    logger.debug(f"Audit: user={user_id} action={action} evidence={evidence_id}")
    return entry


def fetch_logs(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    evidence_id: Optional[int] = None,
    limit: int = 100,
    skip: int = 0
) -> List[AuditLog]:
    """Fetch audit logs with optional filters."""
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if evidence_id:
        query = query.filter(AuditLog.evidence_id == evidence_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
