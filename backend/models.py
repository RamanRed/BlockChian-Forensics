"""
SQLAlchemy Database Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    investigator = "investigator"
    auditor = "auditor"


class AIStatus(str, enum.Enum):
    AUTHENTIC = "AUTHENTIC"
    SUSPICIOUS = "SUSPICIOUS"
    PENDING = "PENDING"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.investigator, nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    evidence = relationship("Evidence", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), unique=True, index=True, nullable=False)
    ipfs_cid = Column(String(255), nullable=True)
    storage_path = Column(String(500), nullable=True)

    # AI Analysis
    ai_score = Column(Float, nullable=True)
    ai_status = Column(Enum(AIStatus), default=AIStatus.PENDING)
    model_version = Column(String(20), nullable=True)
    manipulation_type = Column(String(100), nullable=True)

    # Blockchain
    blockchain_tx = Column(String(66), nullable=True)
    blockchain_block = Column(Integer, nullable=True)

    # Metadata
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_number = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_quarantined = Column(Integer, default=0)

    uploader = relationship("User", back_populates="evidence")
    audit_logs = relationship("AuditLog", back_populates="evidence")

    def __repr__(self):
        return f"<Evidence id={self.id} hash={self.file_hash[:8]}... status={self.ai_status}>"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")
    evidence = relationship("Evidence", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action} user={self.user_id}>"
