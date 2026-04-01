"""
Person Register Routes — All Case Persons
Manages complainants, accused, witnesses, experts across cases.
Cross-case intelligence: same person in multiple FIRs is flagged.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, Person, CasePersonMapping, FIR
from schemas import PersonCreate, PersonResponse, CasePersonMappingCreate, CasePersonMappingResponse
from auth.dependencies import get_current_user, require_investigator
from services.audit_service import log_action
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

@router.get("/", response_model=List[PersonResponse])
async def list_persons(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all persons in the system."""
    persons = db.query(Person).offset(offset).limit(limit).all()
    return persons


@router.post("/", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def register_person(
    data: PersonCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """Register a new person in the Person Register."""
    person = Person(
        name=data.name,
        alias=data.alias,
        gender=data.gender,
        dob=data.dob,
        address=data.address,
        contact=data.contact,
        aadhaar_ref=data.aadhaar_ref,
        occupation=data.occupation,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    log_action(db, user_id=current_user.id, action="PERSON_REGISTERED",
               details=f"Person: {person.name}", ip_address=request.client.host)
    return person


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get person by ID. Access logged."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    log_action(db, user_id=current_user.id, action="PERSON_VIEWED",
               details=f"Person ID: {person_id}", ip_address=request.client.host)
    return person


@router.post("/link", response_model=CasePersonMappingResponse, status_code=status.HTTP_201_CREATED)
async def link_person_to_fir(
    data: CasePersonMappingCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_investigator),
):
    """Link a person to an FIR with a specific role (accused / witness / complainant / expert)."""
    fir = db.query(FIR).filter(FIR.id == data.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found.")
    person = db.query(Person).filter(Person.id == data.person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")

    # Check if already linked in same role
    existing = db.query(CasePersonMapping).filter(
        CasePersonMapping.fir_id == data.fir_id,
        CasePersonMapping.person_id == data.person_id,
        CasePersonMapping.role == data.role
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Person already linked to this FIR with this role.")

    mapping = CasePersonMapping(
        fir_id=data.fir_id,
        person_id=data.person_id,
        role=data.role,
        remarks=data.remarks,
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    log_action(db, user_id=current_user.id, action="PERSON_LINKED_TO_FIR",
               fir_id=data.fir_id, details=f"Person {person.name} as {data.role}", ip_address=request.client.host)
    return mapping


@router.get("/{person_id}/cases", response_model=List[CasePersonMappingResponse])
async def get_person_cases(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all FIRs a person is associated with (cross-case intelligence view)."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    return db.query(CasePersonMapping).filter(CasePersonMapping.person_id == person_id).all()
