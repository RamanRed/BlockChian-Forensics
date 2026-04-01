import os
import traceback
from sqlalchemy.exc import DBAPIError

try:
    from database import SessionLocal, engine, Base
    from models import User, UserRole
    from auth.password_utils import hash_password

    db = SessionLocal()
    new_user = User(
        name="hello",
        email="hello@test.com",
        password_hash=hash_password("SecurePass123"),
        role=UserRole.io
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"User created: {new_user.id}")
except Exception as e:
    print("DB ERROR!")
    traceback.print_exc()
