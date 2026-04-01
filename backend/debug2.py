import os
import traceback
from sqlalchemy.exc import DBAPIError
from pydantic import ValidationError

try:
    from database import SessionLocal, engine, Base
    from models import User, UserRole
    from auth.password_utils import hash_password
    from schemas import UserCreate

    # Verify Pydantic validation
    u = UserCreate(name="hello", email="hello2@test.com", password="SecurePass123", role="io")

    # DB logic
    db = SessionLocal()
    new_user = User(
        name=u.name,
        email=u.email,
        password_hash=hash_password(u.password),
        role=u.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"User created: {new_user.id}")
except Exception as e:
    print("FATAL ERROR CAUGHT IN SCRIPT:")
    traceback.print_exc()
