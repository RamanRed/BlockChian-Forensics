"""
Password Hashing and Verification Utilities
(Bypassing legacy passlib limitations on Python 3.12+ with bcrypt 4.0+)
"""

import bcrypt

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password securely using raw bcrypt."""
    salt = bcrypt.gensalt()
    # bcrypt requires bytes; we decode back to string to store cleanly in the DB
    return bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against the stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )
