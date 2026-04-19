"""
DIRS — Digital Investigation Record System
Pydantic Validation Schemas
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ---------------------------------------------------------------------------
# Enumerations (mirrors models.py)
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    admin    = "admin"
    io       = "io"
    sp       = "sp"
    dsp      = "dsp"
    cfsl     = "cfsl"
    court    = "court"
    auditor  = "auditor"
    lawyer   = "lawyer"   # defence / prosecution advocate (read-only)


class FIRStatus(str, Enum):
    open                  = "open"
    under_investigation   = "under_investigation"
    chargesheeted         = "chargesheeted"
    closed                = "closed"
    cancelled             = "cancelled"


class PersonRole(str, Enum):
    complainant = "complainant"
    accused     = "accused"
    witness     = "witness"
    expert      = "expert"
    victim      = "victim"


class ChargesheetStatus(str, Enum):
    draft         = "draft"
    filed         = "filed"
    supplementary = "supplementary"


class PropertyCondition(str, Enum):
    intact    = "intact"
    damaged   = "damaged"
    partial   = "partial"
    destroyed = "destroyed"


class AIStatus(str, Enum):
    AUTHENTIC  = "AUTHENTIC"
    SUSPICIOUS = "SUSPICIOUS"
    PENDING    = "PENDING"


# ---------------------------------------------------------------------------
# User Schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    name:           str = Field(..., min_length=2, max_length=100)
    email:          EmailStr
    password:       str = Field(..., min_length=8)
    role:           UserRole = UserRole.io
    officer_id:     Optional[str] = None
    police_station: Optional[str] = None
    district:       Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class UserResponse(BaseModel):
    id:             int
    name:           str
    email:          str
    role:           UserRole
    officer_id:     Optional[str]
    police_station: Optional[str]
    district:       Optional[str]
    is_active:      bool
    created_at:     datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserResponse


# ---------------------------------------------------------------------------
# FIR Schemas
# ---------------------------------------------------------------------------

class FIRCreate(BaseModel):
    fir_number:          str = Field(..., min_length=3, max_length=50)
    police_station:      str
    district:            str
    state:               str = "India"
    date_of_offence:     datetime
    place_of_offence:    str
    offence_sections:    str = Field(..., description="e.g. IPC 302, IPC 120B")
    offence_description: str
    accused_description: Optional[str] = None
    complainant_name:    str
    complainant_contact: Optional[str] = None
    io_assigned:         Optional[int] = None


class FIRResponse(BaseModel):
    id:                  int
    fir_number:          str
    police_station:      str
    district:            str
    state:               str
    date_of_offence:     datetime
    place_of_offence:    str
    offence_sections:    str
    offence_description: str
    accused_description: Optional[str]
    complainant_name:    str
    status:              FIRStatus
    registered_by:       int
    io_assigned:         Optional[int]
    blockchain_tx:       Optional[str]
    data_hash:           Optional[str]
    cctns_fir_id:        Optional[str]
    registered_at:       datetime

    model_config = ConfigDict(from_attributes=True)


class FIRStatusUpdate(BaseModel):
    status:          FIRStatus
    supervisor_note: Optional[str] = None


# ---------------------------------------------------------------------------
# Case Diary Schemas
# ---------------------------------------------------------------------------

class CaseDiaryCreate(BaseModel):
    entry_date:   datetime
    place_visited: Optional[str] = None
    persons_met:  Optional[str] = None
    action_taken: str = Field(..., min_length=10)
    observations: Optional[str] = None
    next_steps:   Optional[str] = None


class CaseDiaryResponse(BaseModel):
    id:           int
    fir_id:       int
    entry_number: int
    entry_date:   datetime
    place_visited: Optional[str]
    persons_met:  Optional[str]
    action_taken: str
    observations: Optional[str]
    next_steps:   Optional[str]
    io_id:        int
    entry_hash:   Optional[str]
    blockchain_tx: Optional[str]
    created_at:   datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Seizure Memo Schemas
# ---------------------------------------------------------------------------

class SeizureMemoCreate(BaseModel):
    fir_id:            int
    memo_number:       str
    date_time:         datetime
    place_of_seizure:  str
    witness_1_name:    str
    witness_1_contact: Optional[str] = None
    witness_2_name:    Optional[str] = None
    witness_2_contact: Optional[str] = None
    items_description: str


class SeizureMemoResponse(BaseModel):
    id:                int
    fir_id:            int
    memo_number:       str
    date_time:         datetime
    place_of_seizure:  str
    seized_by:         int
    witness_1_name:    str
    witness_2_name:    Optional[str]
    items_description: str
    seizure_hash:      Optional[str]
    blockchain_tx:     Optional[str]
    created_at:        datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Property Register Schemas
# ---------------------------------------------------------------------------

class PropertyRegisterCreate(BaseModel):
    seizure_memo_id:  int
    property_number:  str
    description:      str
    item_type:        str = Field(..., description="digital | physical | document")
    condition:        PropertyCondition = PropertyCondition.intact
    storage_location: Optional[str] = None


class PropertyRegisterResponse(BaseModel):
    id:               int
    seizure_memo_id:  int
    property_number:  str
    description:      str
    item_type:        str
    condition:        PropertyCondition
    original_filename: Optional[str]
    file_size:        Optional[int]
    hash_value:       Optional[str]
    ipfs_cid:         Optional[str]
    ai_score:         Optional[float]
    ai_status:        AIStatus
    model_version:    Optional[str]
    is_quarantined:   bool
    blockchain_tx:    Optional[str]
    storage_location: Optional[str]
    registered_at:    datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Property Movement (Chain of Custody) Schemas
# ---------------------------------------------------------------------------

class PropertyMovementCreate(BaseModel):
    property_id:        int
    to_custodian_name:  str
    to_custodian_id:    Optional[int] = None
    purpose:            str
    movement_date:      datetime
    lab_case_number:    Optional[str] = None


class PropertyMovementResponse(BaseModel):
    id:                 int
    property_id:        int
    from_custodian_name: str
    to_custodian_name:  str
    purpose:            str
    movement_date:      datetime
    return_date:        Optional[datetime]
    lab_case_number:    Optional[str]
    signature_hash:     Optional[str]
    blockchain_tx:      Optional[str]
    created_at:         datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Person Schemas
# ---------------------------------------------------------------------------

class PersonCreate(BaseModel):
    name:        str
    alias:       Optional[str] = None
    gender:      Optional[str] = None
    dob:         Optional[datetime] = None
    address:     Optional[str] = None
    contact:     Optional[str] = None
    aadhaar_ref: Optional[str] = Field(None, max_length=4, description="Last 4 digits only")
    occupation:  Optional[str] = None


class PersonResponse(BaseModel):
    id:          int
    name:        str
    alias:       Optional[str]
    gender:      Optional[str]
    address:     Optional[str]
    contact:     Optional[str]
    occupation:  Optional[str]
    created_at:  datetime

    model_config = ConfigDict(from_attributes=True)


class CasePersonMappingCreate(BaseModel):
    fir_id:    int
    person_id: int
    role:      PersonRole
    remarks:   Optional[str] = None


class CasePersonMappingResponse(BaseModel):
    id:        int
    fir_id:    int
    person_id: int
    role:      PersonRole
    remarks:   Optional[str]
    added_at:  datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Charge Sheet Schemas
# ---------------------------------------------------------------------------

class ChargesheetCreate(BaseModel):
    fir_id:               int
    chargesheet_number:   str
    accused_ids:          Optional[List[int]] = None
    witness_ids:          Optional[List[int]] = None
    property_ids:         Optional[List[int]] = None
    offence_summary:      str
    io_conclusion:        Optional[str] = None
    deadline_date:        Optional[datetime] = None
    parent_chargesheet_id: Optional[int] = None


class ChargesheetResponse(BaseModel):
    id:                   int
    fir_id:               int
    chargesheet_number:   str
    filed_by_io_id:       int
    status:               ChargesheetStatus
    accused_ids:          Optional[Any]
    witness_ids:          Optional[Any]
    property_ids:         Optional[Any]
    offence_summary:      str
    io_conclusion:        Optional[str]
    deadline_date:        Optional[datetime]
    filed_at:             Optional[datetime]
    data_hash:            Optional[str]
    blockchain_tx:        Optional[str]
    ecourts_case_id:      Optional[str]
    created_at:           datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Court Proceeding Schemas
# ---------------------------------------------------------------------------

class CourtProceedingCreate(BaseModel):
    chargesheet_id:    int
    hearing_date:      datetime
    court_name:        Optional[str] = None
    judge_designation: Optional[str] = None
    order_summary:     Optional[str] = None
    next_hearing_date: Optional[datetime] = None
    ecourts_case_id:   Optional[str] = None


class CourtProceedingResponse(BaseModel):
    id:                 int
    chargesheet_id:     int
    hearing_date:       datetime
    court_name:         Optional[str]
    judge_designation:  Optional[str]
    order_summary:      Optional[str]
    next_hearing_date:  Optional[datetime]
    ecourts_case_id:    Optional[str]
    blockchain_verified: bool
    created_at:         datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Public Verification (Court-Facing, No Auth)
# ---------------------------------------------------------------------------

class PublicVerificationResponse(BaseModel):
    record_type:       str   # fir | property | chargesheet | diary_entry
    record_id:         str
    submitted_hash:    str
    blockchain_found:  bool
    blockchain_tx:     Optional[str]
    timestamp_on_chain: Optional[int]
    verdict:           str   # VERIFIED | NOT_FOUND | MISMATCH


# ---------------------------------------------------------------------------
# Audit Log Schema
# ---------------------------------------------------------------------------

class AuditLogResponse(BaseModel):
    id:            int
    user_id:       int
    action:        str
    fir_id:        Optional[int]
    evidence_id:   Optional[int]
    chargesheet_id: Optional[int]
    details:       Optional[str]
    ip_address:    Optional[str]
    result:        Optional[str]
    timestamp:     datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# AI Analysis Result (internal schema — retained from original)
# ---------------------------------------------------------------------------

class AIAnalysisResult(BaseModel):
    ai_score:         float = Field(..., ge=0.0, le=1.0)
    status:           AIStatus
    model_version:    str
    manipulation_type: Optional[str] = None
    heatmap_path:     Optional[str] = None


# ---------------------------------------------------------------------------
# Investigation Finding Schemas
# ---------------------------------------------------------------------------

class InvestigationFindingCreate(BaseModel):
    title:               str = Field(..., max_length=300)
    description:         Optional[str] = None
    finding_type:        str = Field(..., description="e.g., field_finding, witness_statement, digital_forensics")
    # For text-based (like statements) or command bypassing (digital_forensics)
    text_content:        Optional[str] = None
    # For forensic bypass specifically
    system_command_data: Optional[str] = None
    # Lab details if applicable
    lab_reference_number: Optional[str] = None
    lab_name:            Optional[str] = None
    received_on:         Optional[datetime] = None
    result_date:         Optional[datetime] = None


class InvestigationFindingResponse(BaseModel):
    id:                   int
    fir_id:               int
    finding_type:         str
    title:                str
    description:          Optional[str]
    text_content:         Optional[str]
    original_filename:    Optional[str]
    file_size:            Optional[int]
    mime_type:            Optional[str]
    lab_reference_number: Optional[str]
    lab_name:             Optional[str]
    received_on:          Optional[datetime]
    result_date:          Optional[datetime]
    file_hash:            Optional[str]
    blockchain_tx:        Optional[str]
    ipfs_cid:             Optional[str]
    ai_score:             Optional[float]
    ai_status:            str
    model_version:        Optional[str]
    recorded_by_io_id:    int
    recorded_at:          datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Verdict Schemas
# ---------------------------------------------------------------------------

class VerdictType(str, Enum):
    acquittal             = "acquittal"
    conviction            = "conviction"
    adjourn               = "adjourn"
    further_investigation = "further_investigation"
    discharge             = "discharge"
    compounded            = "compounded"


class CourtVerdictCreate(BaseModel):
    fir_id:             int
    chargesheet_id:     int
    verdict_type:       VerdictType
    verdict_summary:    str = Field(..., min_length=10)
    reasoning:          Optional[str] = None
    sentence:           Optional[str] = None
    judge_name:         str
    court_name:         str
    verdict_date:       datetime
    next_hearing_date:  Optional[datetime] = None


class CourtVerdictResponse(BaseModel):
    id:                 int
    fir_id:             int
    chargesheet_id:     int
    verdict_type:       str
    verdict_summary:    str
    reasoning:          Optional[str]
    sentence:           Optional[str]
    judge_name:         str
    court_name:         str
    verdict_date:       datetime
    next_hearing_date:  Optional[datetime]
    data_hash:          Optional[str]
    blockchain_tx:      Optional[str]
    ipfs_cid:           Optional[str]
    issued_by:          int
    created_at:         datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Forensic Submission Schemas
# ---------------------------------------------------------------------------

class ForensicSubmissionStatus(str, Enum):
    pending     = "pending"
    in_progress = "in_progress"
    completed   = "completed"


class ForensicSubmissionCreate(BaseModel):
    fir_id:         int
    property_id:    int
    submitted_to:   Optional[int] = None
    notes:          Optional[str] = None


class ForensicSubmissionResponse(BaseModel):
    id:                 int
    fir_id:             int
    property_id:        int
    submitted_by:       int
    submitted_to:       Optional[int]
    notes:              Optional[str]
    status:             str
    finding_id:         Optional[int]
    lab_observations:   Optional[str]
    lab_conclusion:     Optional[str]
    lab_report_file:    Optional[str]
    data_hash:          Optional[str]
    blockchain_tx:      Optional[str]
    ipfs_cid:           Optional[str]
    submitted_at:       datetime
    completed_at:       Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

