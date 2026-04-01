"""
DIRS — Digital Investigation Record System
SQLAlchemy Database Models (CrPC-Aligned)
modification branch (v2.1.0)

Changes vs v1:
  - UserRole: added 'lawyer' (read-only, defence/court advocate access)
  - FIR: added investigation_state (InvestigationState enum), merged_into_fir_id
  - CaseDiaryEntry: added ipfs_cid, blockchain_hash
  - SeizureMemo: added ipfs_cid, blockchain_hash
  - ChargeSheet: added ipfs_cid, blockchain_hash
  - New model: InvestigationFinding (lab reports, field findings, text/image/video/frames)

Every model reflects a real legal document used in Indian criminal investigation.
Field names use official police/legal terminology — do NOT rename to generic IT terms.
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Text, Enum, Boolean, JSON, BigInteger
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    admin    = "admin"
    io       = "io"        # Investigating Officer
    sp       = "sp"        # Superintendent of Police (supervisor)
    dsp      = "dsp"       # Deputy Superintendent
    cfsl     = "cfsl"      # Forensic Lab Officer
    court    = "court"     # Court / Magistrate (read-only)
    auditor  = "auditor"   # Internal audit
    lawyer   = "lawyer"    # Defence / prosecution advocate (read-only, case-scoped)


class FIRStatus(str, enum.Enum):
    open                = "open"
    under_investigation = "under_investigation"
    chargesheeted       = "chargesheeted"
    closed              = "closed"
    cancelled           = "cancelled"


class InvestigationState(str, enum.Enum):
    """
    State machine for the investigation lifecycle.
    Separate from FIRStatus (which tracks the legal document status).
    InvestigationState tracks the operational investigation pipeline.

    Transitions:
      active      → suspended   (IO/SP: Sec 157 CrPC — inquiry suspended)
      active      → merged      (SP: two cases combined per court order)
      suspended   → active      (SP/Court: 156(3) CrPC restart order)
      active      → closed      (IO files chargesheet — Sec 173; or final report)
      merged      → closed      (parent case absorbs this one)
    """
    active    = "active"     # Normal investigation ongoing
    suspended = "suspended"  # Paused — inquiry not progressed (with reason)
    restarted = "restarted"  # Reinstated after suspension (new diary entry mandatory)
    merged    = "merged"     # Merged into another FIR per court/SP order
    closed    = "closed"     # Investigation concluded (chargesheeted or final report filed)


class PersonRole(str, enum.Enum):
    complainant = "complainant"
    accused     = "accused"
    witness     = "witness"
    expert      = "expert"
    victim      = "victim"


class ChargesheetStatus(str, enum.Enum):
    draft         = "draft"
    filed         = "filed"
    supplementary = "supplementary"


class PropertyCondition(str, enum.Enum):
    intact    = "intact"
    damaged   = "damaged"
    partial   = "partial"
    destroyed = "destroyed"


class AIStatus(str, enum.Enum):
    AUTHENTIC  = "AUTHENTIC"
    SUSPICIOUS = "SUSPICIOUS"
    PENDING    = "PENDING"


class FindingType(str, enum.Enum):
    """
    Classification of investigation findings for IPFS + blockchain cataloguing.
    """
    lab_report       = "lab_report"      # CFSL / FSL forensic lab report (PDF)
    field_finding    = "field_finding"   # Officer's on-site discovery (text + optional media)
    new_result       = "new_result"      # Updated test/analysis result from lab
    cctv_frame       = "cctv_frame"      # Extracted CCTV/video frame (image)
    cctv_clip        = "cctv_clip"       # Full CCTV clip (video)
    witness_statement = "witness_statement" # Recorded statement (text / audio / video)
    photograph       = "photograph"      # Crime scene or evidence photo
    audio_recording  = "audio_recording" # Voice memo, call recording
    document         = "document"        # Any supporting document (PDF, DOCX, TXT)
    # ── STUB — do not implement until separately tasked ──
    digital_forensics = "digital_forensics"  # Computer/mobile forensic dump — NOT IMPLEMENTED


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, index=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.io, nullable=False)
    officer_id      = Column(String(50), nullable=True, unique=True)
    police_station  = Column(String(150), nullable=True)
    district        = Column(String(100), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

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

    # Offence
    date_of_offence     = Column(DateTime(timezone=True), nullable=False)
    place_of_offence    = Column(Text, nullable=False)
    offence_sections    = Column(String(500), nullable=False)
    offence_description = Column(Text, nullable=False)
    accused_description = Column(Text, nullable=True)

    # Complainant
    complainant_id      = Column(Integer, ForeignKey("persons.id"), nullable=True)
    complainant_name    = Column(String(150), nullable=False)
    complainant_contact = Column(String(50), nullable=True)

    # Status + assignment
    status              = Column(Enum(FIRStatus), default=FIRStatus.open, nullable=False)
    registered_by       = Column(Integer, ForeignKey("users.id"), nullable=False)
    io_assigned         = Column(Integer, ForeignKey("users.id"), nullable=True)

    # ── Investigation lifecycle state machine (new in v2.1) ───────────────
    investigation_state = Column(
        Enum(InvestigationState),
        default=InvestigationState.active,
        nullable=False
    )
    # For merged cases: ID of the FIR this case was absorbed into
    merged_into_fir_id  = Column(Integer, ForeignKey("firs.id"), nullable=True)
    # Reason for suspension / merge / restart (mandatory for state transitions)
    state_change_reason = Column(Text, nullable=True)
    state_order_reference = Column(String, nullable=True)
    state_changed_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    state_changed_at    = Column(DateTime(timezone=True), nullable=True)

    # Blockchain + IPFS
    blockchain_tx       = Column(String(66), nullable=True)
    data_hash           = Column(String(64), nullable=True)
    ipfs_cid            = Column(String(255), nullable=True)   # CID of FIR JSON snapshot on IPFS

    # External sync
    cctns_fir_id        = Column(String(100), nullable=True)

    # Timestamps
    registered_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())
    is_current          = Column(Boolean, default=True)

    # Relationships
    registered_by_user   = relationship("User", back_populates="firs_registered", foreign_keys=[registered_by])
    io_user              = relationship("User", foreign_keys=[io_assigned])
    state_changed_by_user = relationship("User", foreign_keys=[state_changed_by])
    complainant          = relationship("Person", foreign_keys=[complainant_id])
    merged_into          = relationship("FIR", remote_side="FIR.id", foreign_keys=[merged_into_fir_id])
    diary_entries        = relationship("CaseDiaryEntry", back_populates="fir", cascade="all, delete-orphan")
    seizure_memos        = relationship("SeizureMemo", back_populates="fir", cascade="all, delete-orphan")
    case_person_mappings = relationship("CasePersonMapping", back_populates="fir", cascade="all, delete-orphan")
    chargesheets         = relationship("ChargeSheet", back_populates="fir")
    audit_logs           = relationship("AuditLog", back_populates="fir")
    findings             = relationship("InvestigationFinding", back_populates="fir", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FIR id={self.id} number={self.fir_number} state={self.investigation_state}>"


# ---------------------------------------------------------------------------
# Case Diary Entry — Investigation Journal (Section 172 CrPC)
# Append-Only
# ---------------------------------------------------------------------------

class CaseDiaryEntry(Base):
    __tablename__ = "case_diary_entries"

    id              = Column(Integer, primary_key=True, index=True)
    fir_id          = Column(Integer, ForeignKey("firs.id"), nullable=False)
    entry_number    = Column(Integer, nullable=False)
    entry_date      = Column(DateTime(timezone=True), nullable=False)
    place_visited   = Column(String(300), nullable=True)
    persons_met     = Column(Text, nullable=True)
    action_taken    = Column(Text, nullable=False)
    observations    = Column(Text, nullable=True)
    next_steps      = Column(Text, nullable=True)
    io_id           = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Integrity (updated in v2.1)
    entry_hash      = Column(String(64), nullable=True)
    blockchain_tx   = Column(String(66), nullable=True)
    blockchain_hash = Column(String(64), nullable=True)   # canonical JSON hash stored on-chain
    ipfs_cid        = Column(String(255), nullable=True)  # CID of JSON diary entry on Pinata
    version         = Column(Integer, default=1)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    fir             = relationship("FIR", back_populates="diary_entries")
    io              = relationship("User", back_populates="diary_entries")

    def __repr__(self):
        return f"<CaseDiaryEntry fir={self.fir_id} entry={self.entry_number}>"


# ---------------------------------------------------------------------------
# Seizure Memo
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
    witness_2_name      = Column(String(150), nullable=True)
    witness_2_contact   = Column(String(50), nullable=True)
    items_description   = Column(Text, nullable=False)

    # Integrity (updated in v2.1)
    seizure_hash        = Column(String(64), nullable=True)
    blockchain_tx       = Column(String(66), nullable=True)
    blockchain_hash     = Column(String(64), nullable=True)  # canonical hash stored on-chain
    ipfs_cid            = Column(String(255), nullable=True) # CID of memo JSON on Pinata
    version             = Column(Integer, default=1)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    fir                 = relationship("FIR", back_populates="seizure_memos")
    seized_by_user      = relationship("User", back_populates="seizures")
    property_items      = relationship("PropertyRegister", back_populates="seizure_memo", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SeizureMemo id={self.id} memo={self.memo_number}>"


# ---------------------------------------------------------------------------
# Property Register — Malkhana Inventory
# ---------------------------------------------------------------------------

class PropertyRegister(Base):
    __tablename__ = "property_register"

    id                  = Column(Integer, primary_key=True, index=True)
    seizure_memo_id     = Column(Integer, ForeignKey("seizure_memos.id"), nullable=False)
    property_number     = Column(String(50), unique=True, index=True, nullable=False)
    description         = Column(Text, nullable=False)
    item_type           = Column(String(100), nullable=False)
    condition           = Column(Enum(PropertyCondition), default=PropertyCondition.intact)

    original_filename   = Column(String(255), nullable=True)
    stored_filename     = Column(String(255), nullable=True)
    storage_path        = Column(String(500), nullable=True)
    file_size           = Column(Integer, nullable=True)
    hash_value          = Column(Text, nullable=True)
    ipfs_cid            = Column(String(255), nullable=True)

    ai_score            = Column(Float, nullable=True)
    ai_status           = Column(Enum(AIStatus), default=AIStatus.PENDING)
    model_version       = Column(String(50), nullable=True)
    manipulation_type   = Column(String(100), nullable=True)
    is_quarantined      = Column(Boolean, default=False)

    blockchain_tx       = Column(String(66), nullable=True)
    blockchain_block    = Column(Integer, nullable=True)

    storage_location    = Column(String(200), nullable=True)
    custodian_io_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    registered_at       = Column(DateTime(timezone=True), server_default=func.now())

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
    from_custodian_name = Column(String(150), nullable=False)
    to_custodian_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    to_custodian_name   = Column(String(150), nullable=False)
    purpose             = Column(Text, nullable=False)
    movement_date       = Column(DateTime(timezone=True), nullable=False)
    return_date         = Column(DateTime(timezone=True), nullable=True)
    lab_case_number     = Column(String(100), nullable=True)
    signature_hash      = Column(String(64), nullable=True)
    blockchain_tx       = Column(String(66), nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    property_item       = relationship("PropertyRegister", back_populates="movements")
    from_user           = relationship("User", foreign_keys=[from_custodian_id])
    to_user             = relationship("User", foreign_keys=[to_custodian_id])

    def __repr__(self):
        return f"<PropertyMovement property={self.property_id} {self.from_custodian_name}→{self.to_custodian_name}>"


# ---------------------------------------------------------------------------
# Person Register
# ---------------------------------------------------------------------------

class Person(Base):
    __tablename__ = "persons"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(150), nullable=False)
    alias           = Column(String(300), nullable=True)
    gender          = Column(String(20), nullable=True)
    dob             = Column(DateTime(timezone=True), nullable=True)
    address         = Column(Text, nullable=True)
    contact         = Column(String(50), nullable=True)
    aadhaar_ref     = Column(String(20), nullable=True)
    occupation      = Column(String(100), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    fir_complainant = relationship("FIR", back_populates="complainant", foreign_keys="FIR.complainant_id")
    case_mappings   = relationship("CasePersonMapping", back_populates="person")

    def __repr__(self):
        return f"<Person id={self.id} name={self.name}>"


# ---------------------------------------------------------------------------
# Case Person Mapping
# ---------------------------------------------------------------------------

class CasePersonMapping(Base):
    __tablename__ = "case_person_mappings"

    id          = Column(Integer, primary_key=True, index=True)
    fir_id      = Column(Integer, ForeignKey("firs.id"), nullable=False)
    person_id   = Column(Integer, ForeignKey("persons.id"), nullable=False)
    role        = Column(Enum(PersonRole), nullable=False)
    remarks     = Column(Text, nullable=True)
    added_at    = Column(DateTime(timezone=True), server_default=func.now())

    fir         = relationship("FIR", back_populates="case_person_mappings")
    person      = relationship("Person", back_populates="case_mappings")

    def __repr__(self):
        return f"<CasePersonMapping fir={self.fir_id} person={self.person_id} role={self.role}>"


# ---------------------------------------------------------------------------
# Charge Sheet — Final Report (Section 173 CrPC)
# ---------------------------------------------------------------------------

class ChargeSheet(Base):
    __tablename__ = "chargesheets"

    id                    = Column(Integer, primary_key=True, index=True)
    fir_id                = Column(Integer, ForeignKey("firs.id"), nullable=False)
    chargesheet_number    = Column(String(50), unique=True, index=True, nullable=False)
    filed_by_io_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    status                = Column(Enum(ChargesheetStatus), default=ChargesheetStatus.draft)

    accused_ids           = Column(JSON, nullable=True)
    witness_ids           = Column(JSON, nullable=True)
    property_ids          = Column(JSON, nullable=True)
    offence_summary       = Column(Text, nullable=False)
    io_conclusion         = Column(Text, nullable=True)

    deadline_date         = Column(DateTime(timezone=True), nullable=True)
    filed_at              = Column(DateTime(timezone=True), nullable=True)

    parent_chargesheet_id = Column(Integer, ForeignKey("chargesheets.id"), nullable=True)

    # Integrity (updated in v2.1)
    data_hash             = Column(String(64), nullable=True)
    blockchain_tx         = Column(String(66), nullable=True)
    blockchain_hash       = Column(String(64), nullable=True)  # canonical hash on-chain
    ipfs_cid              = Column(String(255), nullable=True) # CID of chargesheet PDF/JSON on Pinata
    version               = Column(Integer, default=1)

    ecourts_case_id       = Column(String(100), nullable=True)

    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), onupdate=func.now())

    fir                   = relationship("FIR", back_populates="chargesheets")
    filed_by              = relationship("User", foreign_keys=[filed_by_io_id])
    proceedings           = relationship("CourtProceeding", back_populates="chargesheet", cascade="all, delete-orphan")
    supplementary_sheets  = relationship("ChargeSheet", foreign_keys=[parent_chargesheet_id])

    def __repr__(self):
        return f"<ChargeSheet id={self.id} number={self.chargesheet_number}>"


# ---------------------------------------------------------------------------
# Investigation Finding — Lab Reports, Field Findings, Media (NEW in v2.1)
# ---------------------------------------------------------------------------

class InvestigationFinding(Base):
    """
    Stores every intermediate finding produced during investigation:
      - Lab reports from CFSL / FSL
      - Field findings (text observations with optional photos)
      - New analytical results (updated test outcomes)
      - CCTV frames / video clips
      - Witness audio/video statements
      - Supporting documents

    Every finding is:
      1. Stored to DB (metadata + local path)
      2. Uploaded to Pinata IPFS (file → CID)
      3. SHA-256 hashed → stored on blockchain

    NOTE: FindingType.digital_forensics is a stub.
          Full computer/mobile forensic dump is NOT implemented yet.
          Route exists at POST /api/investigation/{fir_id}/findings
          with type=digital_forensics — returns 501 Not Implemented.
    """
    __tablename__ = "investigation_findings"

    id                   = Column(Integer, primary_key=True, index=True)
    fir_id               = Column(Integer, ForeignKey("firs.id"), nullable=False)
    finding_type         = Column(Enum(FindingType), nullable=False)
    title                = Column(String(300), nullable=False)
    description          = Column(Text, nullable=True)

    # Text content (for text-based findings — stored directly)
    text_content         = Column(Text, nullable=True)

    # File (for media-based findings)
    original_filename    = Column(String(255), nullable=True)
    stored_filename      = Column(String(255), nullable=True)
    storage_path         = Column(String(500), nullable=True)
    file_size            = Column(BigInteger, nullable=True)   # bytes; BigInteger for large videos
    mime_type            = Column(String(100), nullable=True)

    # CFSL / Lab reference (for lab_report and new_result types)
    lab_reference_number = Column(String(100), nullable=True)  # CFSL case number
    lab_name             = Column(String(200), nullable=True)   # e.g. "CFSL, Hyderabad"
    received_on          = Column(DateTime(timezone=True), nullable=True)
    result_date          = Column(DateTime(timezone=True), nullable=True)

    # Integrity
    file_hash            = Column(String(64), nullable=True)   # SHA-256 of file bytes
    blockchain_tx        = Column(String(66), nullable=True)
    blockchain_hash      = Column(String(64), nullable=True)   # hash stored on-chain
    ipfs_cid             = Column(String(255), nullable=True)  # Pinata CID

    # AI deepfake analysis (for photo/video findings)
    ai_score             = Column(Float, nullable=True)
    ai_status            = Column(Enum(AIStatus), default=AIStatus.PENDING)
    model_version        = Column(String(50), nullable=True)

    # Officer who recorded the finding
    recorded_by_io_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    recorded_at          = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    fir                  = relationship("FIR", back_populates="findings")
    recorded_by          = relationship("User", foreign_keys=[recorded_by_io_id])

    def __repr__(self):
        return f"<InvestigationFinding id={self.id} fir={self.fir_id} type={self.finding_type}>"


# ---------------------------------------------------------------------------
# Court Proceeding
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

    chargesheet         = relationship("ChargeSheet", back_populates="proceedings")

    def __repr__(self):
        return f"<CourtProceeding id={self.id} chargesheet={self.chargesheet_id}>"


# ---------------------------------------------------------------------------
# Audit Log — Zero-Trust Append-Only
# ---------------------------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    action          = Column(String(100), nullable=False)
    fir_id          = Column(Integer, ForeignKey("firs.id"), nullable=True)
    evidence_id     = Column(Integer, ForeignKey("property_register.id"), nullable=True)
    chargesheet_id  = Column(Integer, ForeignKey("chargesheets.id"), nullable=True)
    finding_id      = Column(Integer, ForeignKey("investigation_findings.id"), nullable=True)
    details         = Column(Text, nullable=True)
    ip_address      = Column(String(45), nullable=True)
    result          = Column(String(20), nullable=True, default="success")
    timestamp       = Column(DateTime(timezone=True), server_default=func.now())

    user            = relationship("User", back_populates="audit_logs")
    fir             = relationship("FIR", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action} user={self.user_id}>"
