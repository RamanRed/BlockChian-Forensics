"""
Authentication Routes
POST /register - Register new user
POST /login    - Login and get JWT token
GET  /me       - Get current user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from auth.password_utils import hash_password, verify_password
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_user
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"New user registered: {new_user.email} (role: {new_user.role})")
    log_action(db, user_id=new_user.id, action="USER_REGISTERED", details=f"Role: {new_user.role}")
    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT access token."""
    user = db.query(User).filter(User.email == credentials.email, User.is_active == 1).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})
    log_action(db, user_id=user.id, action="USER_LOGIN", ip_address=request.client.host)
    logger.info(f"User logged in: {user.email}")
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's profile."""
    return current_user
