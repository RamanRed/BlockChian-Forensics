# Test Environment Setup Guide

## Summary

You now have a **separate test environment** using `uv` that is completely isolated from the main backend.

## What Was Done

### 1. **Created Test Environment Files**
- `test-requirements.txt` — test-only dependencies
- `pyproject.toml` — project configuration with pytest settings
- `tests/conftest.py` — pytest fixtures & settings
- `tests/test_images/` — folder for test images (copy your test images here)
- `TESTING.md` — comprehensive testing documentation

### 2. **Updated Backend for Hugging Face**
- `backend/.env` — added `HF_TOKEN` and `AI_MODEL_NAME`
- `backend/requirements.txt` — added `torch` and `transformers`
- `backend/services/ai_service.py` — now uses Hugging Face Vision Transformer
- `backend/config.py` — already configured for HF model

### 3. **Created Test Scripts**
- `run_tests.sh` — bash script (Linux/Mac)
- `run_tests.bat` — batch script (Windows)
- Automated setup and test execution

## Test Environment Structure

```
test_env/                   # Separate venv (created by uv)
├── lib/
├── bin/
└── ... (isolated packages)

tests/
├── conftest.py
├── test_images/
├── test_huggingface_model.py
├── test_ai_service.py
└── test_api_endpoints.py
```

## Quick Start

### Windows:
```cmd
cd c:\Users\raman\Desktop\trainer module\blockchain
run_tests.bat
```

### Linux/Mac:
```bash
cd /path/to/trainer\ module/blockchain
chmod +x run_tests.sh
./run_tests.sh
```

## Manual Test Environment Setup

If you prefer manual control:

```bash
# Create environment
uv venv test_env

# Activate
source test_env/bin/activate          # Linux/Mac
test_env\Scripts\activate             # Windows

# Install test deps
uv pip install -r test-requirements.txt

# Run tests
pytest tests/ -v
pytest tests/test_huggingface_model.py -v  # Specific test
pytest tests/ --cov=backend  # With coverage
```

## Key Dependencies (Isolated in test_env)

| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | 8.2.0 | Test framework |
| `pytest-asyncio` | 0.23.7 | Async test support |
| `pytest-cov` | 4.1.1 | Code coverage |
| `torch` | 2.3.0 | PyTorch for Vision Transformer |
| `transformers` | 4.38.2 | Hugging Face models |
| `pillow` | 10.3.0 | Image processing |
| `httpx` | 0.27.0 | Async HTTP testing |

**Note:** These are NOT installed in the main backend environment, keeping it lightweight.

## Adding Test Images

Copy your test images to:
```
tests/test_images/
├── image1.jpg
├── image2.png
├── authentic_sample.jpg
├── deepfake_sample.jpg
└── ...
```

Supports: `.jpg`, `.png`, `.bmp`, `.tiff`

## Test Files Explained

| File | Tests |
|------|-------|
| `test_huggingface_model.py` | ViT model loading, inference, batch processing |
| `test_ai_service.py` | `analyze_image()` function, result validation |
| `test_api_endpoints.py` | Backend health check, root endpoint |

## Environment Variables for Tests

Automatically set in `conftest.py`:
```
HF_TOKEN=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
AI_MODEL_NAME=prithivMLmods/Deep-Fake-Detector-v2-Model
DEBUG=True
DATABASE_URL=sqlite:///./test_forensic.db
```

## Running Specific Tests

```bash
# Single file
pytest tests/test_huggingface_model.py -v

# Single test class
pytest tests/test_huggingface_model.py::TestHuggingFaceModel -v

# Single test method
pytest tests/test_huggingface_model.py::TestHuggingFaceModel::test_model_loads -v

# With output
pytest tests/ -v -s

# With coverage report
pytest tests/ --cov=backend --cov-report=html
```

## Troubleshooting

### Tests skip with "Model loading skipped"
→ This is expected if running offline. The model uses Hugging Face cache.

### torch/transformers package not found
→ Check that `test_env` is activated before running tests.
→ Or manually install: `uv pip install torch transformers`

### ModuleNotFoundError: 'backend' not found
→ Tests automatically add backend to path via `conftest.py`
→ Make sure you run pytest from the project root directory

### No test images found
→ Create and add images to `tests/test_images/`
→ Tests will skip gracefully if no images are present

## Updating Test Requirements

If you need to add a new test dependency:

```bash
# Activate test environment
source test_env/bin/activate

# Add new package
uv pip install new-package

# Update requirements
echo "new-package==version" >> test-requirements.txt
```

## CI/CD Integration

For GitHub Actions or other CI:

```yaml
- name: Setup test environment
  run: |
    pip install uv
    uv venv test_env
    source test_env/bin/activate
    uv pip install -r test-requirements.txt
    
- name: Run tests
  run: |
    source test_env/bin/activate
    pytest tests/ -v --cov=backend
```

---

**Next:** You're ready to run tests! Execute `run_tests.sh` or `run_tests.bat` to get started.
