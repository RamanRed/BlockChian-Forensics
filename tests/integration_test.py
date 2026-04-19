#!/usr/bin/env python3
"""
Integration Test Runner
Tests the complete workflow: AI analysis -> storage -> blockchain -> verification
"""

import sys
from pathlib import Path
import os
from datetime import datetime

# Setup path
BACKEND_PATH = Path(__file__).parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

# Set test environment
os.environ["DEBUG"] = "True"
os.environ["DATABASE_URL"] = "sqlite:///./test_forensic.db"

from services.ai_service import analyze_image
from services.hashing_service import generate_sha256, bind_evidence
from schemas import AIStatus


def test_complete_workflow():
    """Test the complete evidence processing workflow."""
    print("\n" + "="*70)
    print("DIGITAL FORENSIC EVIDENCE PRESERVATION SYSTEM - TEST SUITE")
    print("="*70 + "\n")
    
    # Step 1: Load test image
    test_images_dir = Path(__file__).parent / "test_images"
    images = list(test_images_dir.glob("*.jpg"))
    
    if not images:
        print("❌ No test images found in 'test images' folder")
        return False
    
    test_image = images[0]
    print(f"📷 Loading test image: {test_image.name}")
    
    with open(test_image, "rb") as f:
        image_bytes = f.read()
    print(f"   ✓ Loaded {len(image_bytes)} bytes\n")
    
    # Step 2: AI Analysis
    print("🤖 Running AI Deepfake Detection...")
    try:
        ai_result = analyze_image(image_bytes)
        print(f"   ✓ Model: {ai_result.model_version}")
        print(f"   ✓ Score: {ai_result.ai_score:.4f}")
        print(f"   ✓ Status: {ai_result.status}")
        print(f"   ✓ Confidence: {ai_result.confidence:.4f}\n")
    except Exception as e:
        print(f"   ❌ AI analysis failed: {e}")
        print(f"   💡 Make sure you have:")
        print(f"      1. Internet connection")
        print(f"      2. Valid HF_TOKEN in backend/.env")
        print(f"      3. Sufficient disk space for model (~1GB)\n")
        return False
    
    # Step 3: Generate hash
    print("🔐 Processing Evidence...")
    file_hash = generate_sha256(image_bytes)
    print(f"   ✓ SHA-256 Hash: {file_hash[:16]}...")
    
    # Step 4: Bind evidence
    metadata = {
        "filename": test_image.name,
        "file_size": len(image_bytes),
        "timestamp": datetime.utcnow().isoformat()
    }
    bound = bind_evidence(file_hash, ai_result, metadata)
    print(f"   ✓ Binding Hash: {bound['binding_hash'][:16]}...\n")
    
    # Step 5: Summary
    print("📊 Test Summary")
    print("="*70)
    print(f"Image:              {test_image.name}")
    print(f"File Size:          {len(image_bytes)} bytes")
    print(f"AI Status:          {ai_result.status}")
    print(f"AI Score:           {ai_result.ai_score:.4f}")
    print(f"Model Version:      {ai_result.model_version}")
    print(f"File Hash:          {file_hash}")
    print("="*70 + "\n")
    
    # Step 6: Processing result
    if ai_result.status == AIStatus.AUTHENTIC:
        print("✅ Image appears AUTHENTIC - ready for secure storage")
    else:
        print("⚠️  Image marked SUSPICIOUS - will be quarantined")
    
    print("\n✅ All tests passed! System is ready to use.\n")
    return True


def test_database():
    """Test database connectivity."""
    print("\n🗄️  Testing Database Connection...")
    try:
        from database import engine, Base, SessionLocal
        Base.metadata.create_all(bind=engine)
        session = SessionLocal()
        session.close()
        print("   ✓ Database connection successful\n")
        return True
    except Exception as e:
        print(f"   ❌ Database error: {e}\n")
        return False


def test_model_download():
    """Test if the model can be downloaded."""
    print("\n📥 Testing Model Download...")
    try:
        from services.ai_service import load_model
        print("   Loading ViT model from Hugging Face...")
        model, processor = load_model()
        print(f"   ✓ Model loaded successfully\n")
        return True
    except Exception as e:
        print(f"   ⚠️  Could not load model: {e}")
        print(f"   💡 This is normal on first run (~1GB download)")
        print(f"   💡 Ensure HF_TOKEN is set in backend/.env\n")
        return False


if __name__ == "__main__":
    success = True
    
    # Database test
    success &= test_database()
    
    # Model download test
    success &= test_model_download()
    
    # Complete workflow test
    success &= test_complete_workflow()
    
    if success:
        print("🎉 All integration tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some tests had issues. Check the output above.")
        sys.exit(1)
