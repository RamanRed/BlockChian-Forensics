# Tests for Digital Forensic Evidence Preservation System

This folder contains comprehensive tests for the entire system.

## Quick Start

### Run all tests
```bash
cd tests
python integration_test.py
```

### Test all images in test_images folder
```bash
python test_all_images.py
```

### Run pytest suite
```bash
pytest test_ai_service.py -v -s
pytest test_api.py -v -s
```

## Test Files

### `integration_test.py` (Main Test)
Complete end-to-end workflow test:
- Database connectivity check
- Model download and loading verification
- Full evidence processing pipeline:
  - Image loading
  - AI deepfake detection (ViT model)
  - SHA-256 hashing
  - Evidence binding
  - Result validation

**Run with:**
```bash
python integration_test.py
```

### `test_all_images.py`
Tests all images in the `test images` folder:
- Analyzes each image with the deepfake detector
- Generates detailed report with scores and status
- Shows authentic vs. suspicious breakdown

**Run with:**
```bash
python test_all_images.py
```

### `test_ai_service.py`
Unit tests for AI service:
- Model loading from Hugging Face
- Image analysis functionality
- Result validation
- Confidence score checks

**Run with:**
```bash
pytest test_ai_service.py -v -s
```

### `test_api.py`
FastAPI endpoint tests:
- Authentication (register, login)
- Health check endpoint
- Protected routes
- Error handling

**Run with:**
```bash
pytest test_api.py -v -s
```

### `run_tests.py`
Quick wrapper to run integration tests.

**Run with:**
```bash
python run_tests.py
```

## Requirements

Before running tests:

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Verify HF token** in `backend/.env`:
   ```
   HF_TOKEN=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
   ```

3. **Check test images**:
   ```
   test images/  (10 JPEG files)
   ```

## What Gets Tested

✅ Model loading from Hugging Face  
✅ Image deepfake detection (ViT)  
✅ Cryptographic hashing (SHA-256)  
✅ Evidence binding  
✅ Database connectivity  
✅ API authentication  
✅ Protected endpoints  
✅ Error handling  

## Test Results Interpretation

**Score Ranges:**
- `0.0 - 0.5`: Likely deepfake/manipulated
- `0.5 - 1.0`: Likely authentic

**Status Values:**
- `AUTHENTIC`: Image passes authenticity check
- `SUSPICIOUS`: Image marked for quarantine
- `PENDING`: Analysis in progress

## Troubleshooting

### "Model loading requires internet..."
- Ensure internet connection
- Check HF_TOKEN in backend/.env
- First run takes ~1-2 minutes for model download

### "No test images found"
- Verify `test images` folder exists
- Ensure JPEG files are present

### "Database error"
- Remove `forensic_evidence.db` if corrupted
- Check write permissions in project folder

### "Transformer import error"
- Reinstall: `pip install -r requirements.txt`
- Check Python version (3.9+)

## Output Example

```
======================================================================
DIGITAL FORENSIC EVIDENCE PRESERVATION SYSTEM - TEST SUITE
======================================================================

📷 Loading test image: IMG-20241231-WA0003.jpg
   ✓ Loaded 245678 bytes

🤖 Running AI Deepfake Detection...
   ✓ Model: v2.0-ViT
   ✓ Score: 0.8934
   ✓ Status: AUTHENTIC
   ✓ Confidence: 0.7868

🔐 Processing Evidence...
   ✓ SHA-256 Hash: a3f2b1c9d8e4f0a2...
   ✓ Binding Hash: 7d4e2f1a9c3b0e8f...

📊 Test Summary
======================================================================
Image:              IMG-20241231-WA0003.jpg
File Size:          245678 bytes
AI Status:          AUTHENTIC
AI Score:           0.8934
Model Version:      v2.0-ViT
File Hash:          a3f2b1c9d8e4f0a2b7e5f3c1d9a8b4f0
======================================================================

✅ Image appears AUTHENTIC - ready for secure storage

✅ All tests passed! System is ready to use.
```

---

For more information, see the root [README.md](../README.md)
