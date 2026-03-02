"""
Authentication Dependencies and Role-Based Access Control
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from auth.jwt_handler import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get the currently authenticated user from JWT token."""
    payload = verify_token(token)
    email: str = payload.get("sub")
    user = db.query(User).filter(User.email == email, User.is_active == 1).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require the current user to have admin role."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


def require_investigator(current_user: User = Depends(get_current_user)) -> User:
    """Require the current user to be an investigator or admin."""
    if current_user.role not in [UserRole.investigator, UserRole.admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Investigator privileges required")
    return current_user


def require_auditor_or_above(current_user: User = Depends(get_current_user)) -> User:
    """Allow auditors, investigators, and admins."""
    if current_user.role not in [UserRole.auditor, UserRole.investigator, UserRole.admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
    return current_user
