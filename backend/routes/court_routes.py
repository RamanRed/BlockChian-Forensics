"""
Court Routes — Extended

Provides:
  1. Public blockchain hash verification (no auth)
  2. Court proceeding CRUD
  3. Case listing for court (all chargesheeted cases)
  4. Chain of events view (diary + seizure + custody + forensics + verdicts)
  5. Read-only diary and forensic views
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import (
    User, ChargeSheet, CourtProceeding, FIR, PropertyRegister,
    CaseDiaryEntry, SeizureMemo, PropertyMovement, InvestigationFinding,
    ForensicSubmission, CourtVerdict, UserRole
)
from schemas import (
    CourtProceedingCreate, CourtProceedingResponse,
    PublicVerificationResponse, CaseDiaryResponse, FIRResponse
)
from auth.dependencies import get_current_user, require_read_only
from services.blockchain_service import get_blockchain_record
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


# ── Public Verification (no auth) ─────────────────────────────────────────

@router.get("/verify/{file_hash}", response_model=PublicVerificationResponse)
async def public_verify(file_hash: str):
    """Public blockchain verification — NO AUTH."""
    bc_record = await get_blockchain_record(file_hash)
    if bc_record:
        return PublicVerificationResponse(
            record_type="unknown",
            record_id=file_hash[:16],
            submitted_hash=file_hash,
            blockchain_found=True,
            blockchain_tx=bc_record.get("tx_hash"),
            timestamp_on_chain=bc_record.get("timestamp"),
            verdict="VERIFIED — Record found on blockchain and integrity confirmed.",
        )
    else:
        return PublicVerificationResponse(
            record_type="unknown",
            record_id=file_hash[:16],
            submitted_hash=file_hash,
            blockchain_found=False,
            blockchain_tx=None,
            timestamp_on_chain=None,
            verdict="NOT_FOUND — Hash not found on blockchain.",
        )


# ── Court Proceedings ─────────────────────────────────────────────────────

@router.post("/proceedings", response_model=CourtProceedingResponse, status_code=status.HTTP_201_CREATED)
async def add_proceeding(
    data: CourtProceedingCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a court hearing record. Requires court or admin role."""
    if current_user.role.value not in ("court", "admin", "sp", "dsp"):
        raise HTTPException(status_code=403, detail="Only court officers can add proceedings.")

    cs = db.query(ChargeSheet).filter(ChargeSheet.id == data.chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")

    proc = CourtProceeding(
        chargesheet_id=data.chargesheet_id,
        hearing_date=data.hearing_date,
        court_name=data.court_name,
        judge_designation=data.judge_designation,
        order_summary=data.order_summary,
        next_hearing_date=data.next_hearing_date,
        ecourts_case_id=data.ecourts_case_id,
    )
    db.add(proc)
    db.commit()
    db.refresh(proc)

    log_action(db, user_id=current_user.id, action="COURT_PROCEEDING_ADDED",
               chargesheet_id=data.chargesheet_id,
               details=f"Hearing: {data.hearing_date.date()}", ip_address=request.client.host)
    return proc


@router.get("/proceedings/{chargesheet_id}", response_model=List[CourtProceedingResponse])
async def get_proceedings(
    chargesheet_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all court proceedings for a Charge Sheet."""
    cs = db.query(ChargeSheet).filter(ChargeSheet.id == chargesheet_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charge Sheet not found.")
    procs = (
        db.query(CourtProceeding)
        .filter(CourtProceeding.chargesheet_id == chargesheet_id)
        .order_by(CourtProceeding.hearing_date.asc())
        .all()
    )
    log_action(db, user_id=current_user.id, action="PROCEEDINGS_VIEWED",
               chargesheet_id=chargesheet_id, ip_address=request.client.host)
    return procs


# ── Case Listing — Court sees all chargesheeted cases ─────────────────────

@router.get("/cases")
async def list_court_cases(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """List all FIRs that have chargesheets (court-visible cases)."""
    firs = db.query(FIR).join(ChargeSheet, ChargeSheet.fir_id == FIR.id).distinct().all()
    result = []
    for fir in firs:
        cs_list = db.query(ChargeSheet).filter(ChargeSheet.fir_id == fir.id).all()
        verdict_count = db.query(CourtVerdict).filter(CourtVerdict.fir_id == fir.id).count()
        result.append({
            "id": fir.id,
            "fir_number": fir.fir_number,
            "police_station": fir.police_station,
            "district": fir.district,
            "offence_sections": fir.offence_sections,
            "complainant_name": fir.complainant_name,
            "status": fir.status.value if fir.status else None,
            "investigation_state": fir.investigation_state.value if fir.investigation_state else None,
            "registered_at": fir.registered_at.isoformat() if fir.registered_at else None,
            "chargesheets": [{"id": cs.id, "number": cs.chargesheet_number, "status": cs.status.value} for cs in cs_list],
            "verdict_count": verdict_count,
        })
    log_action(db, user_id=current_user.id, action="COURT_CASES_LISTED",
               ip_address=request.client.host)
    return result


# ── Chain of Events — Full timeline for a case ───────────────────────────

@router.get("/chain/{fir_id}")
async def get_chain_of_events(
    fir_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only),
):
    """Get the full chain of events for a FIR: diary, seizures, custody, forensics, verdicts."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")

    # Diary entries
    diaries = db.query(CaseDiaryEntry).filter(CaseDiaryEntry.fir_id == fir_id)\
        .order_by(CaseDiaryEntry.entry_date.asc()).all()

    # Seizure memos
    seizures = db.query(SeizureMemo).filter(SeizureMemo.fir_id == fir_id)\
        .order_by(SeizureMemo.date_time.asc()).all()

    # Evidence items (via seizure memos)
    seizure_ids = [s.id for s in seizures]
    evidence = db.query(PropertyRegister).filter(PropertyRegister.seizure_memo_id.in_(seizure_ids)).all() if seizure_ids else []

    # Custody movements
    evidence_ids = [e.id for e in evidence]
    movements = db.query(PropertyMovement).filter(PropertyMovement.property_id.in_(evidence_ids))\
        .order_by(PropertyMovement.movement_date.asc()).all() if evidence_ids else []

    # Forensic submissions
    forensic_subs = db.query(ForensicSubmission).filter(ForensicSubmission.fir_id == fir_id)\
        .order_by(ForensicSubmission.submitted_at.asc()).all()

    # Investigation findings (lab reports, etc.)
    findings = db.query(InvestigationFinding).filter(InvestigationFinding.fir_id == fir_id)\
        .order_by(InvestigationFinding.recorded_at.asc()).all()

    # Chargesheets
    chargesheets = db.query(ChargeSheet).filter(ChargeSheet.fir_id == fir_id).all()

    # Court proceedings
    cs_ids = [cs.id for cs in chargesheets]
    proceedings = db.query(CourtProceeding).filter(CourtProceeding.chargesheet_id.in_(cs_ids))\
        .order_by(CourtProceeding.hearing_date.asc()).all() if cs_ids else []

    # Verdicts
    verdicts = db.query(CourtVerdict).filter(CourtVerdict.fir_id == fir_id)\
        .order_by(CourtVerdict.verdict_date.asc()).all()

    # Build the timeline
    timeline = []

    # FIR registration
    timeline.append({
        "type": "fir_registered",
        "timestamp": fir.registered_at.isoformat() if fir.registered_at else None,
        "data": {
            "fir_number": fir.fir_number,
            "police_station": fir.police_station,
            "offence_sections": fir.offence_sections,
            "complainant_name": fir.complainant_name,
            "blockchain_tx": fir.blockchain_tx,
        }
    })

    for d in diaries:
        timeline.append({
            "type": "diary_entry",
            "timestamp": d.entry_date.isoformat() if d.entry_date else d.created_at.isoformat(),
            "data": {
                "entry_number": d.entry_number,
                "action_taken": d.action_taken,
                "observations": d.observations,
                "next_steps": d.next_steps,
                "place_visited": d.place_visited,
                "blockchain_tx": d.blockchain_tx,
            }
        })

    for s in seizures:
        timeline.append({
            "type": "seizure_memo",
            "timestamp": s.date_time.isoformat() if s.date_time else s.created_at.isoformat(),
            "data": {
                "memo_number": s.memo_number,
                "place_of_seizure": s.place_of_seizure,
                "items_description": s.items_description,
                "blockchain_tx": s.blockchain_tx,
            }
        })

    for e in evidence:
        timeline.append({
            "type": "evidence_registered",
            "timestamp": e.registered_at.isoformat() if e.registered_at else None,
            "data": {
                "property_number": e.property_number,
                "description": e.description,
                "item_type": e.item_type,
                "ai_status": e.ai_status.value if e.ai_status else None,
                "blockchain_tx": e.blockchain_tx,
            }
        })

    for m in movements:
        timeline.append({
            "type": "custody_transfer",
            "timestamp": m.movement_date.isoformat() if m.movement_date else m.created_at.isoformat(),
            "data": {
                "from": m.from_custodian_name,
                "to": m.to_custodian_name,
                "purpose": m.purpose,
                "blockchain_tx": m.blockchain_tx,
            }
        })

    for fs in forensic_subs:
        timeline.append({
            "type": "forensic_submission",
            "timestamp": fs.submitted_at.isoformat() if fs.submitted_at else None,
            "data": {
                "submission_id": fs.id,
                "property_id": fs.property_id,
                "status": fs.status.value if fs.status else None,
                "notes": fs.notes,
                "lab_observations": fs.lab_observations,
                "lab_conclusion": fs.lab_conclusion,
                "blockchain_tx": fs.blockchain_tx,
                "completed_at": fs.completed_at.isoformat() if fs.completed_at else None,
            }
        })

    for f in findings:
        timeline.append({
            "type": "investigation_finding",
            "timestamp": f.recorded_at.isoformat() if f.recorded_at else None,
            "data": {
                "finding_type": f.finding_type.value if f.finding_type else None,
                "title": f.title,
                "description": f.description,
                "lab_name": f.lab_name,
                "lab_reference_number": f.lab_reference_number,
                "blockchain_tx": f.blockchain_tx,
                "ipfs_cid": f.ipfs_cid,
            }
        })

    for cs in chargesheets:
        timeline.append({
            "type": "chargesheet_filed",
            "timestamp": cs.filed_at.isoformat() if cs.filed_at else cs.created_at.isoformat(),
            "data": {
                "chargesheet_number": cs.chargesheet_number,
                "status": cs.status.value if cs.status else None,
                "offence_summary": cs.offence_summary,
                "blockchain_tx": cs.blockchain_tx,
            }
        })

    for p in proceedings:
        timeline.append({
            "type": "court_proceeding",
            "timestamp": p.hearing_date.isoformat() if p.hearing_date else p.created_at.isoformat(),
            "data": {
                "court_name": p.court_name,
                "judge_designation": p.judge_designation,
                "order_summary": p.order_summary,
                "next_hearing_date": p.next_hearing_date.isoformat() if p.next_hearing_date else None,
            }
        })

    for v in verdicts:
        timeline.append({
            "type": "court_verdict",
            "timestamp": v.verdict_date.isoformat() if v.verdict_date else v.created_at.isoformat(),
            "data": {
                "verdict_type": v.verdict_type.value if v.verdict_type else None,
                "verdict_summary": v.verdict_summary,
                "reasoning": v.reasoning,
                "sentence": v.sentence,
                "judge_name": v.judge_name,
                "court_name": v.court_name,
                "blockchain_tx": v.blockchain_tx,
            }
        })

    # Sort timeline by timestamp
    timeline.sort(key=lambda x: x.get("timestamp") or "")

    log_action(db, user_id=current_user.id, action="CHAIN_OF_EVENTS_VIEWED",
               fir_id=fir_id, ip_address=request.client.host)

    return {
        "fir_id": fir_id,
        "fir_number": fir.fir_number,
        "timeline": timeline,
        "total_events": len(timeline),
    }
