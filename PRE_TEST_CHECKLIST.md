# Pre-Test Checklist

## ✅ Backend Setup

- [x] HF_TOKEN added to `backend/.env`
- [x] AI_MODEL_NAME added to `backend/.env`
- [x] `ai_service.py` updated with Hugging Face ViT model
- [x] `torch` & `transformers` in `backend/requirements.txt`
- [x] `config.py` configured for HF model

**Status:** Ready for backend testing

---

## ✅ Test Environment Setup

- [x] `test-requirements.txt` created (pytest, torch, transformers, etc.)
- [x] `pyproject.toml` created with pytest config
- [x] `tests/conftest.py` created with fixtures
- [x] `TESTING.md` documentation ready
- [x] `run_tests.sh` & `run_tests.bat` created

**Status:** Environment files ready

---

## ✅ Test Files

- [x] `tests/test_huggingface_model.py` — ViT model tests ✓
- [x] `tests/test_ai_service.py` — AI service tests ✓
- [x] `tests/test_api_endpoints.py` — API endpoint tests ✓
- [x] `tests/test_images/` folder created

**Status:** Test suite ready

---

## ⚠️ YOU MUST DO: Add Test Images

**Before running tests, add images to:**
```
tests/test_images/
```

**What:** Copy your test image files
**Where:** `tests/test_images/`
**Format:** `.jpg`, `.png`, `.bmp`, or `.tiff`
**Examples:**
- authentic_image.jpg
- deepfake_sample.jpg
- test_photo.png
- etc.

**Why:** Tests will skip if no images found, but detection tests need images.

---

## 📋 Environment Check

### Option A: Automated (Recommended)

**Windows:**
```cmd
cd "c:\Users\raman\Desktop\trainer module\blockchain"
run_tests.bat
```

**Linux/Mac:**
```bash
cd /path/to/blockchain
chmod +x run_tests.sh
./run_tests.sh
```

### Option B: Manual Verification

```bash
# Check HF_TOKEN is set
echo $HF_TOKEN  # Should display your token

# Check backend requirements
cat backend/requirements.txt | grep -E "torch|transformers"

# Check test requirements exist
cat test-requirements.txt

# Check test files exist
ls tests/test_*.py
```

---

## 🚀 Ready to Run?

Once you have:
1. ✅ Added test images to `tests/test_images/`
2. ✅ Verified `.env` has `HF_TOKEN`
3. ✅ Internet connection (first run downloads ~2GB model)

Then run:

**Windows:**
```cmd
run_tests.bat
```

**Linux/Mac:**
```bash
./run_tests.sh
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `TESTING.md` | Complete testing guide |
| `TEST_ENV_SETUP.md` | Quick reference |
| `UV_TEST_SETUP_SUMMARY.md` | Overview & structure |
| `PRE_TEST_CHECKLIST.md` | This file |

---

## 🎯 What Tests Will Do

1. ✅ Create `test_env/` (if missing)
2. ✅ Install pytest, torch, transformers to `test_env/`
3. ✅ Run 3 test suites:
   - `test_huggingface_model.py` — Model loading & inference
   - `test_ai_service.py` — AI analysis pipeline  
   - `test_api_endpoints.py` — Backend health

4. ✅ Report results (PASSED/SKIPPED/FAILED)

---

## 💾 Storage Notes

**Model Cache Location:**
- Linux/Mac: `~/.cache/huggingface/hub/`
- Windows: `%USERPROFILE%\.cache\huggingface\hub\`
- Size: ~2GB (downloaded once, cached forever)

**Test Database:**
- `test_forensic.db` (created in project root during tests)
- SQLite, ephemeral (deleted/recreated each run)

---

## 🔧 If Something Goes Wrong

### Tests skip with "No test images found"
→ Add images to `tests/test_images/` and re-run

### "Model loading skipped" message
→ **This is OK!** Tests gracefully skip if offline
→ After first run, model is cached locally

### permission denied: run_tests.sh
→ Run: `chmod +x run_tests.sh` first

### torch not found in test_env
→ Manually run: `uv pip install torch transformers`
→ Check `test_env` is activated

### ModuleNotFoundError: backend
→ Make sure you're in the correct directory:
```bash
cd c:\Users\raman\Desktop\trainer\ module\blockchain
```

---

## ✨ Next Commands

After adding test images, run **ONE** of:

**Windows:**
```cmd
run_tests.bat
```

**Linux/Mac:**
```bash
./run_tests.sh
```

**Result:** See test output, coverage report, and model performance metrics!

---

**You're all set! 🎉**
