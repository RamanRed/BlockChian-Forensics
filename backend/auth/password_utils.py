"""
Password Hashing and Verification Utilities
"""

import bcrypt


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    password_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a hashed password."""
    password_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
