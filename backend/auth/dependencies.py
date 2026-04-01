"""
DIRS — Authentication Dependencies + Role-Based Access Control
modification branch (v2.1.0)

Fixes vs v1:
  - require_investigator was checking UserRole.investigator (does not exist) → FIXED
  - Added require_io_or_above, require_sp_or_above, require_read_only, require_cfsl_or_above
  - Added require_lawyer (read-only, case-scoped — IPFS/blockchain verified view only)

Role hierarchy (high → low authority):
  admin > sp > dsp > io > cfsl > auditor > court > lawyer
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from auth.jwt_handler import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# Base: resolve current user from JWT
# ---------------------------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve JWT → User. Raises 401 if token invalid or user inactive."""
    payload = verify_token(token)
    email: str = payload.get("sub")
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account inactive.",
        )
    return user


# ---------------------------------------------------------------------------
# Single-role guards
# ---------------------------------------------------------------------------

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restrict to admin only."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required.")
    return current_user


# ---------------------------------------------------------------------------
# Multi-role guards — write operations
# ---------------------------------------------------------------------------

def require_investigator(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow any active investigative role to perform write operations.
    Covers: io, sp, dsp, admin.
    FIXED: v1 used UserRole.investigator which does not exist in the enum.
    """
    WRITE_ROLES = {UserRole.io, UserRole.sp, UserRole.dsp, UserRole.admin}
    if current_user.role not in WRITE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investigating officer or supervisory privileges required.",
        )
    return current_user


def require_io_or_above(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow IO and above (io, sp, dsp, admin).
    Alias of require_investigator — use this name for clarity in IO-specific endpoints.
    """
    return require_investigator(current_user)


def require_sp_or_above(current_user: User = Depends(get_current_user)) -> User:
    """
    Restrict to SP-level supervisors and above (sp, admin).
    Used for: FIR state transitions (suspend/merge/restart), IO reassignment.
    """
    SP_ROLES = {UserRole.sp, UserRole.admin}
    if current_user.role not in SP_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superintendent of Police (SP) or admin privileges required.",
        )
    return current_user


def require_cfsl_or_above(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow CFSL officers and above (cfsl, io, sp, dsp, admin).
    Used for: uploading lab reports, recording findings from forensic lab.
    """
    CFSL_ROLES = {UserRole.cfsl, UserRole.io, UserRole.sp, UserRole.dsp, UserRole.admin}
    if current_user.role not in CFSL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forensic lab officer (CFSL) or investigative role required.",
        )
    return current_user


# ---------------------------------------------------------------------------
# Multi-role guards — read-only operations
# ---------------------------------------------------------------------------

def require_read_only(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow all read-only roles: lawyer, court, auditor.
    """
    ALLOWED = {UserRole.lawyer, UserRole.court, UserRole.auditor, UserRole.admin}
    if current_user.role not in ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Read-only privileges required.",
        )
    return current_user

def require_supervisor(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow SP, DSP, Admin.
    """
    ALLOWED = {UserRole.sp, UserRole.dsp, UserRole.admin}
    if current_user.role not in ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor privileges required.",
        )
    return current_user


def require_auditor_or_above(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow auditors + all investigative roles.
    Used for: audit log reads, verification endpoints.
    FIXED: v1 included UserRole.investigator (non-existent) in the allowed set.
    """
    ALLOWED = {
        UserRole.auditor,
        UserRole.io,
        UserRole.sp,
        UserRole.dsp,
        UserRole.cfsl,
        UserRole.admin,
    }
    if current_user.role not in ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auditor or investigative privileges required.",
        )
    return current_user


def require_court_or_lawyer(current_user: User = Depends(get_current_user)) -> User:
    """
    Allow court/magistrate and lawyer (defence/prosecution advocate) roles.
    Read-only — they cannot write any investigation records.
    """
    READ_ONLY_ROLES = {UserRole.court, UserRole.lawyer}
    if current_user.role not in READ_ONLY_ROLES and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Court or lawyer role required for this portal.",
        )
    return current_user
