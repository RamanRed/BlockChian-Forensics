from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database import get_db
from models import User, FIR, CaseDiaryEntry, CasePersonMapping, Person, ChargeSheet, CourtProceeding
from auth.dependencies import get_current_user, require_read_only

router = APIRouter(prefix="/lawyer", tags=["Lawyer Read-Only"])

@router.get("/cases/{fir_id}")
async def get_case_summary(
    fir_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
) -> Dict[str, Any]:
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    return {
        "fir_number": fir.fir_number,
        "status": fir.status,
        "investigation_state": fir.investigation_state,
        "date_of_offence": fir.date_of_offence,
        "place_of_offence": fir.place_of_offence,
        "offence_sections": fir.offence_sections,
        "offence_description": fir.offence_description,
    }

@router.get("/cases/{fir_id}/diary")
async def get_case_diary(
    fir_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    entries = db.query(CaseDiaryEntry).filter(CaseDiaryEntry.fir_id == fir_id).all()
    return [{"entry_number": e.entry_number, "action_taken": e.action_taken, "date": e.entry_date} for e in entries]

@router.get("/cases/{fir_id}/persons")
async def get_case_persons(
    fir_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    mappings = db.query(CasePersonMapping).filter(CasePersonMapping.fir_id == fir_id).all()
    result = []
    for m in mappings:
        result.append({
            "person_id": m.person_id,
            "role": m.role,
            "remarks": m.remarks
        })
    return result

@router.get("/cases/{fir_id}/chargesheet")
async def get_case_chargesheet(
    fir_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    sheet = db.query(ChargeSheet).filter(ChargeSheet.fir_id == fir_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Chargesheet not found")
    return {
        "chargesheet_number": sheet.chargesheet_number,
        "status": sheet.status,
        "offence_summary": sheet.offence_summary,
        "ipfs_cid": sheet.ipfs_cid
    }

@router.get("/cases/{fir_id}/court-proceedings")
async def get_case_proceedings(
    fir_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_only)
):
    sheet = db.query(ChargeSheet).filter(ChargeSheet.fir_id == fir_id).first()
    if not sheet:
        return []
    proceedings = db.query(CourtProceeding).filter(CourtProceeding.chargesheet_id == sheet.id).all()
    return [{"date": p.hearing_date, "order_summary": p.order_summary, "next_hearing_date": p.next_hearing_date} for p in proceedings]
