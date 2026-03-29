"""
DIRS — Digital Investigation Record System
SQLAlchemy Database Models (CrPC-Aligned)

Every model reflects a real legal document used in Indian criminal investigation.
Field names use official police/legal terminology — do NOT rename to generic IT terms.
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Text, Enum, Boolean, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    admin        = "admin"
    io           = "io"            # Investigating Officer
    sp           = "sp"            # Superintendent of Police (supervisor)
    dsp          = "dsp"           # Deputy Superintendent
    cfsl         = "cfsl"          # Forensic Lab Officer
    court        = "court"         # Court / Magistrate (read-only)
    auditor      = "auditor"       # Internal audit


class FIRStatus(str, enum.Enum):
    open         = "open"
    under_investigation = "under_investigation"
    chargesheeted = "chargesheeted"
    closed       = "closed"
    cancelled    = "cancelled"


class PersonRole(str, enum.Enum):
    complainant  = "complainant"
    accused      = "accused"
    witness      = "witness"
    expert       = "expert"
    victim       = "victim"


class ChargesheetStatus(str, enum.Enum):
    draft        = "draft"
    filed        = "filed"
    supplementary = "supplementary"


class PropertyCondition(str, enum.Enum):
    intact       = "intact"
    damaged      = "damaged"
    partial      = "partial"
    destroyed    = "destroyed"


class AIStatus(str, enum.Enum):
    AUTHENTIC    = "AUTHENTIC"
    SUSPICIOUS   = "SUSPICIOUS"
    PENDING      = "PENDING"


# ---------------------------------------------------------------------------
# User — Extended with officer identity fields
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, index=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.io, nullable=False)
    officer_id      = Column(String(50), nullable=True, unique=True)   # Badge / service number
    police_station  = Column(String(150), nullable=True)
    district        = Column(String(100), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    firs_registered = relationship("FIR", back_populates="registered_by_user", foreign_keys="FIR.registered_by")
    diary_entries   = relationship("CaseDiaryEntry", back_populates="io")
    seizures        = relationship("SeizureMemo", back_populates="seized_by_user")
    audit_logs      = relationship("AuditLog", back_populates="user")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


# ---------------------------------------------------------------------------
# FIR — First Information Report (Section 154 CrPC)
# ---------------------------------------------------------------------------

class FIR(Base):
    """
    Legal starting point of every criminal case.
    Immutable after registration — corrections are appended, never overwrites.
    """
    __tablename__ = "firs"

    id                  = Column(Integer, primary_key=True, index=True)
    fir_number          = Column(String(50), unique=True, index=True, nullable=False)
    police_station      = Column(String(150), nullable=False)
    district            = Column(String(100), nullable=False)
    state               = Column(String(100), nullable=False, default="India")

    # Offence details
    date_of_offence     = Column(DateTime(timezone=True), nullable=False)
    place_of_offence    = Column(Text, nullable=False)
    offence_sections    = Column(String(500), nullable=False)   # e.g. "IPC 302, IPC 120B"
    offence_description = Column(Text, nullable=False)
    accused_description = Column(Text, nullable=True)

    # Complainant
    complainant_id      = Column(Integer, ForeignKey("persons.id"), nullable=True)
    complainant_name    = Column(String(150), nullable=False)   # Denormalized for immutability
    complainant_contact = Column(String(50), nullable=True)

    # Status and assignment
    status              = Column(Enum(FIRStatus), default=FIRStatus.open, nullable=False)
    registered_by       = Column(Integer, ForeignKey("users.id"), nullable=False)
    io_assigned         = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Blockchain integrity
    blockchain_tx       = Column(String(66), nullable=True)
    data_hash           = Column(String(64), nullable=True)   # SHA-256 of canonical FIR data

    # External sync
    cctns_fir_id        = Column(String(100), nullable=True)  # CCTNS acknowledgment ID

    # Timestamps
    registered_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())
    is_current          = Column(Boolean, default=True)         # Always True; corrections via diary

    # Relationships
    registered_by_user      = relationship("User", back_populates="firs_registered", foreign_keys=[registered_by])
    io_user                 = relationship("User", foreign_keys=[io_assigned])
    complainant             = relationship("Person", foreign_keys=[complainant_id])
    diary_entries           = relationship("CaseDiaryEntry", back_populates="fir", cascade="all, delete-orphan")
    seizure_memos           = relationship("SeizureMemo", back_populates="fir", cascade="all, delete-orphan")
    case_person_mappings    = relationship("CasePersonMapping", back_populates="fir", cascade="all, delete-orphan")
    chargesheets            = relationship("ChargeSheet", back_populates="fir")
    audit_logs              = relationship("AuditLog", back_populates="fir")

    def __repr__(self):
        return f"<FIR id={self.id} number={self.fir_number} status={self.status}>"


# ---------------------------------------------------------------------------
# Case Diary Entry — Investigation Journal (Section 172 CrPC)
# Append-Only: no record is ever deleted or updated.
# ---------------------------------------------------------------------------

class CaseDiaryEntry(Base):
    __tablename__ = "case_diary_entries"

    id              = Column(Integer, primary_key=True, index=True)
    fir_id          = Column(Integer, ForeignKey("firs.id"), nullable=False)
    entry_number    = Column(Integer, nullable=False)   # Sequential per FIR, backend-enforced
    entry_date      = Column(DateTime(timezone=True), nullable=False)
    place_visited   = Column(String(300), nullable=True)
    persons_met     = Column(Text, nullable=True)
    action_taken    = Column(Text, nullable=False)
    observations    = Column(Text, nullable=True)
    next_steps      = Column(Text, nullable=True)
    io_id           = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Integrity
    entry_hash      = Column(String(64), nullable=True)   # SHA-256 of this entry's content
    blockchain_tx   = Column(String(66), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    fir             = relationship("FIR", back_populates="diary_entries")
    io              = relationship("User", back_populates="diary_entries")

    def __repr__(self):
        return f"<CaseDiaryEntry fir={self.fir_id} entry={self.entry_number}>"


# ---------------------------------------------------------------------------
# Seizure Memo — Evidence Collection Record
# ---------------------------------------------------------------------------

class SeizureMemo(Base):
    __tablename__ = "seizure_memos"

    id                  = Column(Integer, primary_key=True, index=True)
    fir_id              = Column(Integer, ForeignKey("firs.id"), nullable=False)
    memo_number         = Column(String(50), unique=True, index=True, nullable=False)
    date_time           = Column(DateTime(timezone=True), nullable=False)
    place_of_seizure    = Column(Text, nullable=False)
    seized_by           = Column(Integer, ForeignKey("users.id"), nullable=False)
    witness_1_name      = Column(String(150), nullable=False)
    witness_1_contact   = Column(String(50), nullable=True)
    witness_2_name      = Column(String(150), nullable=True)   # Recommended 2 independent witnesses
    witness_2_contact   = Column(String(50), nullable=True)
    items_description   = Column(Text, nullable=False)
    seizure_hash        = Column(String(64), nullable=True)     # Hash of this memo
    blockchain_tx       = Column(String(66), nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    fir                 = relationship("FIR", back_populates="seizure_memos")
    seized_by_user      = relationship("User", back_populates="seizures")
    property_items      = relationship("PropertyRegister", back_populates="seizure_memo", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SeizureMemo id={self.id} memo={self.memo_number} fir={self.fir_id}>"


# ---------------------------------------------------------------------------
# Property Register — Malkhana Inventory
# ---------------------------------------------------------------------------

class PropertyRegister(Base):
    __tablename__ = "property_register"

    id                  = Column(Integer, primary_key=True, index=True)
    seizure_memo_id     = Column(Integer, ForeignKey("seizure_memos.id"), nullable=False)
    property_number     = Column(String(50), unique=True, index=True, nullable=False)
    description         = Column(Text, nullable=False)
    item_type           = Column(String(100), nullable=False)   # digital | physical | document
    condition           = Column(Enum(PropertyCondition), default=PropertyCondition.intact)

    # Digital evidence integrity
    original_filename   = Column(String(255), nullable=True)
    stored_filename     = Column(String(255), nullable=True)
    storage_path        = Column(String(500), nullable=True)
    file_size           = Column(Integer, nullable=True)
    hash_value          = Column(Text, nullable=True)   # JSON: {"original": "...", "clone": "..."}
    ipfs_cid            = Column(String(255), nullable=True)

    # AI Analysis (for digital items)
    ai_score            = Column(Float, nullable=True)
    ai_status           = Column(Enum(AIStatus), default=AIStatus.PENDING)
    model_version       = Column(String(50), nullable=True)
    manipulation_type   = Column(String(100), nullable=True)
    is_quarantined      = Column(Boolean, default=False)

    # Blockchain
    blockchain_tx       = Column(String(66), nullable=True)
    blockchain_block    = Column(Integer, nullable=True)

    # Malkhana storage
    storage_location    = Column(String(200), nullable=True)   # e.g. "Shelf B-12, Malkhana Room"
    custodian_io_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    registered_at       = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    seizure_memo        = relationship("SeizureMemo", back_populates="property_items")
    custodian           = relationship("User", foreign_keys=[custodian_io_id])
    movements           = relationship("PropertyMovement", back_populates="property_item", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PropertyRegister id={self.id} prop={self.property_number}>"


# ---------------------------------------------------------------------------
# Property Movement — Chain of Custody
# ---------------------------------------------------------------------------

class PropertyMovement(Base):
    __tablename__ = "property_movements"

    id                  = Column(Integer, primary_key=True, index=True)
    property_id         = Column(Integer, ForeignKey("property_register.id"), nullable=False)
    from_custodian_id   = Column(Integer, ForeignKey("users.id"), nullable=True)
    from_custodian_name = Column(String(150), nullable=False)   # Denormalized for audit trail
    to_custodian_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    to_custodian_name   = Column(String(150), nullable=False)
    purpose             = Column(Text, nullable=False)          # e.g. "Sent to CFSL for analysis"
    movement_date       = Column(DateTime(timezone=True), nullable=False)
    return_date         = Column(DateTime(timezone=True), nullable=True)
    lab_case_number     = Column(String(100), nullable=True)    # CFSL reference
    signature_hash      = Column(String(64), nullable=True)     # Hash of movement record
    blockchain_tx       = Column(String(66), nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property_item       = relationship("PropertyRegister", back_populates="movements")
    from_user           = relationship("User", foreign_keys=[from_custodian_id])
    to_user             = relationship("User", foreign_keys=[to_custodian_id])

    def __repr__(self):
        return f"<PropertyMovement property={self.property_id} {self.from_custodian_name}→{self.to_custodian_name}>"


# ---------------------------------------------------------------------------
# Person Register — All Case Persons
# ---------------------------------------------------------------------------

class Person(Base):
    __tablename__ = "persons"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(150), nullable=False)
    alias           = Column(String(300), nullable=True)        # Known aliases
    gender          = Column(String(20), nullable=True)
    dob             = Column(DateTime(timezone=True), nullable=True)
    address         = Column(Text, nullable=True)
    contact         = Column(String(50), nullable=True)
    aadhaar_ref     = Column(String(20), nullable=True)         # Last 4 digits only (privacy)
    occupation      = Column(String(100), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    fir_complainant = relationship("FIR", back_populates="complainant", foreign_keys="FIR.complainant_id")
    case_mappings   = relationship("CasePersonMapping", back_populates="person")

    def __repr__(self):
        return f"<Person id={self.id} name={self.name}>"


# ---------------------------------------------------------------------------
# Case Person Mapping — Links persons to FIRs with a role
# ---------------------------------------------------------------------------

class CasePersonMapping(Base):
    __tablename__ = "case_person_mappings"

    id          = Column(Integer, primary_key=True, index=True)
    fir_id      = Column(Integer, ForeignKey("firs.id"), nullable=False)
    person_id   = Column(Integer, ForeignKey("persons.id"), nullable=False)
    role        = Column(Enum(PersonRole), nullable=False)
    remarks     = Column(Text, nullable=True)
    added_at    = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    fir         = relationship("FIR", back_populates="case_person_mappings")
    person      = relationship("Person", back_populates="case_mappings")

    def __repr__(self):
        return f"<CasePersonMapping fir={self.fir_id} person={self.person_id} role={self.role}>"


# ---------------------------------------------------------------------------
# Charge Sheet — Final Report (Section 173 CrPC)
# ---------------------------------------------------------------------------

class ChargeSheet(Base):
    __tablename__ = "chargesheets"

    id                  = Column(Integer, primary_key=True, index=True)
    fir_id              = Column(Integer, ForeignKey("firs.id"), nullable=False)
    chargesheet_number  = Column(String(50), unique=True, index=True, nullable=False)
    filed_by_io_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    status              = Column(Enum(ChargesheetStatus), default=ChargesheetStatus.draft)

    # Content (stored as JSON arrays of IDs)
    accused_ids         = Column(JSON, nullable=True)           # List of person IDs
    witness_ids         = Column(JSON, nullable=True)           # List of person IDs
    property_ids        = Column(JSON, nullable=True)           # List of property register IDs
    offence_summary     = Column(Text, nullable=False)
    io_conclusion       = Column(Text, nullable=True)

    # Statutory deadlines (Sec 173 CrPC)
    deadline_date       = Column(DateTime(timezone=True), nullable=True)
    filed_at            = Column(DateTime(timezone=True), nullable=True)

    # Supplementary
    parent_chargesheet_id = Column(Integer, ForeignKey("chargesheets.id"), nullable=True)

    # Blockchain
    data_hash           = Column(String(64), nullable=True)
    blockchain_tx       = Column(String(66), nullable=True)

    # eCourts integration
    ecourts_case_id     = Column(String(100), nullable=True)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    fir                 = relationship("FIR", back_populates="chargesheets")
    filed_by            = relationship("User", foreign_keys=[filed_by_io_id])
    proceedings         = relationship("CourtProceeding", back_populates="chargesheet", cascade="all, delete-orphan")
    supplementary_sheets = relationship("ChargeSheet", foreign_keys=[parent_chargesheet_id])

    def __repr__(self):
        return f"<ChargeSheet id={self.id} number={self.chargesheet_number} status={self.status}>"


# ---------------------------------------------------------------------------
# Court Proceeding — Post-Charge-Sheet Hearing Tracking
# ---------------------------------------------------------------------------

class CourtProceeding(Base):
    __tablename__ = "court_proceedings"

    id                  = Column(Integer, primary_key=True, index=True)
    chargesheet_id      = Column(Integer, ForeignKey("chargesheets.id"), nullable=False)
    hearing_date        = Column(DateTime(timezone=True), nullable=False)
    court_name          = Column(String(200), nullable=True)
    judge_designation   = Column(String(150), nullable=True)
    order_summary       = Column(Text, nullable=True)
    next_hearing_date   = Column(DateTime(timezone=True), nullable=True)
    ecourts_case_id     = Column(String(100), nullable=True)
    blockchain_verified = Column(Boolean, default=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    chargesheet         = relationship("ChargeSheet", back_populates="proceedings")

    def __repr__(self):
        return f"<CourtProceeding id={self.id} chargesheet={self.chargesheet_id} date={self.hearing_date}>"


# ---------------------------------------------------------------------------
# Audit Log — Zero-Trust Append-Only Audit Trail
# Logs every read AND write — even internal access.
# ---------------------------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    action          = Column(String(100), nullable=False)

    # Flexible target references
    fir_id          = Column(Integer, ForeignKey("firs.id"), nullable=True)
    evidence_id     = Column(Integer, ForeignKey("property_register.id"), nullable=True)
    chargesheet_id  = Column(Integer, ForeignKey("chargesheets.id"), nullable=True)

    details         = Column(Text, nullable=True)
    ip_address      = Column(String(45), nullable=True)
    result          = Column(String(20), nullable=True, default="success")  # success | failure
    timestamp       = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user            = relationship("User", back_populates="audit_logs")
    fir             = relationship("FIR", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action} user={self.user_id}>"
