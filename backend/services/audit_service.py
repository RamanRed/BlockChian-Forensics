"""
DIRS — Audit Service
Logs every read and write action. Zero-trust: even internal admin access is logged.
"""

from sqlalchemy.orm import Session
from typing import Optional
from utils.logger import setup_logger

logger = setup_logger(__name__)


def log_action(
    db: Session,
    user_id: int,
    action: str,
    fir_id: Optional[int] = None,
    evidence_id: Optional[int] = None,
    property_id: Optional[int] = None,   # alias for evidence_id used in some routes
    chargesheet_id: Optional[int] = None,
    finding_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    result: str = "success",
) -> None:
    """
    Append an audit log entry. Called on every read and write.
    Supported actions include:
      FIR_REGISTERED, FIR_CORRECTED, FIR_STATUS_CHANGED, FIR_VIEWED,
      DIARY_ENTRY_ADDED, DIARY_VIEWED,
      SEIZURE_MEMO_CREATED, SEIZURE_MEMO_VIEWED,
      PROPERTY_REGISTERED, PROPERTY_VIEWED,
      CUSTODY_TRANSFERRED, CUSTODY_CHAIN_VIEWED,
      PERSON_REGISTERED, PERSON_LINKED_TO_FIR, PERSON_VIEWED,
      CHARGESHEET_CREATED, CHARGESHEET_FILED, CHARGESHEET_VIEWED,
      COURT_PROCEEDING_ADDED, PROCEEDINGS_VIEWED,
      BLOCKCHAIN_VERIFIED, EVIDENCE_UPLOADED, EVIDENCE_VIEWED,
      USER_REGISTERED, USER_LOGIN
    """
    try:
        from models import AuditLog
        # property_id is a caller-side alias for evidence_id
        resolved_evidence_id = evidence_id or property_id
        entry = AuditLog(
            user_id=user_id,
            action=action,
            fir_id=fir_id,
            evidence_id=resolved_evidence_id,
            chargesheet_id=chargesheet_id,
            finding_id=finding_id,
            details=details,
            ip_address=ip_address,
            result=result,
        )
        db.add(entry)
        db.commit()
        logger.debug(f"[AUDIT] {action} | user={user_id} | fir={fir_id} | result={result}")
    except Exception as e:
        logger.error(f"Audit log write failed: {e}")
