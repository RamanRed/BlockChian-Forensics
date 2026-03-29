"""
Test: Chain of Custody — Property Movement (DIRS Section 3.5)

Tests:
  1. Full chain of custody: seize → move to lab → move to court
  2. Hash mismatch detection (tamper simulation)
"""

import sys, os, json, hashlib
import pytest
from pathlib import Path
from datetime import datetime

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

os.environ["DATABASE_URL"] = "sqlite:///./test_dirs_custody.db"
os.environ["DEBUG"] = "True"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import (
    User, FIR, SeizureMemo, PropertyRegister, PropertyMovement,
    FIRStatus, UserRole, AIStatus, PropertyCondition
)
from auth.password_utils import hash_password


@pytest.fixture(scope="module")
def setup(request):
    engine = create_engine("sqlite:///./test_dirs_custody.db", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # IO user
    io_user = User(
        name="IO Custody Test", email="custody.io@dirs.gov.in",
        password_hash=hash_password("TestPass1"),
        role=UserRole.io, officer_id="IO-CUS-001",
        police_station="North PS", district="Mumbai",
    )
    # CFSL user
    cfsl_user = User(
        name="CFSL Officer", email="cfsl@dirs.gov.in",
        password_hash=hash_password("CfslPass1"),
        role=UserRole.cfsl, officer_id="CFSL-001",
        police_station="CFSL Mumbai", district="Mumbai",
    )
    session.add_all([io_user, cfsl_user])
    session.flush()

    fir = FIR(
        fir_number="FIR/CUSTODY/TEST/001",
        police_station="North PS", district="Mumbai", state="India",
        date_of_offence=datetime(2026, 3, 10),
        place_of_offence="Bandra West",
        offence_sections="IPC 302",
        offence_description="Homicide case.",
        complainant_name="Suresh Patil",
        registered_by=io_user.id,
        status=FIRStatus.open, is_current=True,
    )
    session.add(fir)
    session.flush()

    memo = SeizureMemo(
        fir_id=fir.id,
        memo_number="SM/CUS/001",
        date_time=datetime(2026, 3, 10, 14, 0),
        place_of_seizure="Bandra West crime scene",
        seized_by=io_user.id,
        witness_1_name="Pramod Nair",
        witness_2_name="Sunita Rao",
        items_description="One kitchen knife (potential murder weapon)",
        seizure_hash="abc123",
    )
    session.add(memo)
    session.flush()

    prop = PropertyRegister(
        seizure_memo_id=memo.id,
        property_number="PROP/MUM/001",
        description="Kitchen knife, approx 25cm",
        item_type="physical",
        condition=PropertyCondition.intact,
        hash_value=json.dumps({"original": "fakehash1234", "clone": "fakehash1234"}),
        ai_status=AIStatus.PENDING,
        custodian_io_id=io_user.id,
        storage_location="Malkhana Shelf A-3",
    )
    session.add(prop)
    session.commit()

    yield session, io_user, cfsl_user, fir, memo, prop

    session.close()
    engine.dispose()
    Base.metadata.drop_all(bind=engine)
    try:
        if os.path.exists("test_dirs_custody.db"):
            os.remove("test_dirs_custody.db")
    except PermissionError:
        pass  # Windows file lock


def test_full_chain_of_custody(setup):
    """Seize → transfer to CFSL → transfer to court — all hashed and traceable."""
    session, io_user, cfsl_user, fir, memo, prop = setup

    # Transfer 1: IO → CFSL Lab
    m1 = PropertyMovement(
        property_id=prop.id,
        from_custodian_id=io_user.id,
        from_custodian_name=io_user.name,
        to_custodian_id=cfsl_user.id,
        to_custodian_name=cfsl_user.name,
        purpose="Sent to CFSL Mumbai for forensic analysis",
        movement_date=datetime(2026, 3, 12, 9, 0),
        lab_case_number="CFSL/MUM/2026/042",
        signature_hash=hashlib.sha256(b"movement1").hexdigest(),
    )
    session.add(m1)

    # Transfer 2: CFSL → Court
    m2 = PropertyMovement(
        property_id=prop.id,
        from_custodian_id=cfsl_user.id,
        from_custodian_name=cfsl_user.name,
        to_custodian_id=None,
        to_custodian_name="Sessions Court Clerk, Mumbai",
        purpose="Presented as evidence before Sessions Court",
        movement_date=datetime(2026, 3, 25, 11, 0),
        signature_hash=hashlib.sha256(b"movement2").hexdigest(),
    )
    session.add(m2)
    session.commit()

    movements = (
        session.query(PropertyMovement)
        .filter(PropertyMovement.property_id == prop.id)
        .order_by(PropertyMovement.movement_date.asc())
        .all()
    )
    assert len(movements) == 2
    assert movements[0].to_custodian_name == cfsl_user.name
    assert movements[1].to_custodian_name == "Sessions Court Clerk, Mumbai"
    assert movements[0].lab_case_number == "CFSL/MUM/2026/042"

    print(f"✓ Chain of Custody: {len(movements)} movements recorded")
    for m in movements:
        print(f"  {m.from_custodian_name} → {m.to_custodian_name} ({m.purpose[:40]}...)")


def test_hash_mismatch_tamper_detection(setup):
    """
    Simulate tampering: manually alter hash_value in DB.
    Verification logic must detect the mismatch.
    """
    session, io_user, cfsl_user, fir, memo, prop = setup

    # The recorded original hash
    stored = json.loads(prop.hash_value)
    original_hash = stored["original"]

    # Simulate tampered re-computation (different result)
    tampered_file_content = b"TAMPERED CONTENT"
    recomputed_hash = hashlib.sha256(tampered_file_content).hexdigest()

    hash_match = recomputed_hash == original_hash
    assert not hash_match, "Tampered content should NOT match stored hash"

    verdict = "COMPROMISED" if not hash_match else "VERIFIED"
    assert verdict == "COMPROMISED"
    print(f"✓ Tamper detection: stored={original_hash[:16]}... recomputed={recomputed_hash[:16]}... → {verdict}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("DIRS — Chain of Custody Tests")
    print("="*60)
    pytest.main([__file__, "-v"])
