"""
Pydantic Validation Models / Schemas
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    investigator = "investigator"
    auditor = "auditor"


class AIStatus(str, Enum):
    AUTHENTIC = "AUTHENTIC"
    SUSPICIOUS = "SUSPICIOUS"
    PENDING = "PENDING"


# --- User Schemas ---
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.investigator

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Evidence Schemas ---
class EvidenceUploadResponse(BaseModel):
    id: int
    original_filename: str
    file_hash: str
    file_size: int
    ipfs_cid: Optional[str] = None
    ai_score: Optional[float] = None
    ai_status: AIStatus
    model_version: Optional[str] = None
    manipulation_type: Optional[str] = None
    blockchain_tx: Optional[str] = None
    case_number: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class EvidenceListResponse(BaseModel):
    id: int
    original_filename: str
    file_hash: str
    ai_status: AIStatus
    ai_score: Optional[float]
    blockchain_tx: Optional[str]
    uploaded_by: int
    timestamp: datetime
    is_quarantined: int

    model_config = ConfigDict(from_attributes=True)


# --- Verification Schemas ---
class VerificationResponse(BaseModel):
    evidence_id: int
    original_hash: str
    recomputed_hash: str
    hash_match: bool
    blockchain_verified: bool
    blockchain_tx: Optional[str]
    ai_status: AIStatus
    verification_timestamp: datetime
    verdict: str


# --- Blockchain Schemas ---
class BlockchainRecord(BaseModel):
    evidence_hash: str
    ipfs_cid: Optional[str]
    ai_score: float
    ai_status: str
    model_version: str
    timestamp: int
    submitter: str
    transaction_hash: str
    block_number: int


# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    evidence_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# --- AI Analysis Schemas ---
class AIAnalysisResult(BaseModel):
    ai_score: float = Field(..., ge=0.0, le=1.0)
    status: AIStatus
    model_version: str
    manipulation_type: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    heatmap_path: Optional[str] = None
