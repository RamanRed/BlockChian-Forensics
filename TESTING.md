# Test Suite Documentation

## Overview

The test suite is organized in a separate `uv` virtual environment to keep test dependencies isolated from the main backend.

## Structure

```
tests/
├── conftest.py                    # Pytest configuration & shared fixtures
├── test_images/                   # Folder for test image files
│   └── .gitkeep
├── test_huggingface_model.py      # Test Hugging Face Vision Transformer model
├── test_ai_service.py              # Test AI service integration
└── test_api_endpoints.py           # Test backend API endpoints
```

## Test Dependencies

Kept in `test-requirements.txt`:
- `pytest` — test framework
- `pytest-asyncio` — async test support
- `pytest-cov` — code coverage
- `torch` — PyTorch for model
- `transformers` — Hugging Face transformers
- `pillow` — image processing
- `httpx` — async HTTP client for testing

## Running Tests

### Option 1: Using the provided script (recommended)

**On Linux/Mac:**
```bash
chmod +x run_tests.sh
./run_tests.sh
```

**On Windows:**
```cmd
run_tests.bat
```

### Option 2: Manual setup

```bash
# Create test environment
uv venv test_env
source test_env/bin/activate  # Linux/Mac
# or: test_env\Scripts\activate  # Windows

# Install test dependencies
uv pip install -r test-requirements.txt

# Run tests
pytest tests/ -v

# Run specific test file
pytest tests/test_huggingface_model.py -v

# Run with coverage
pytest tests/ --cov=backend --cov-report=html
```

## Environment Variables for Testing

Tests automatically set:
- `DEBUG=True`
- `DATABASE_URL=sqlite:///./test_forensic.db`
- `HF_TOKEN=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`
- `AI_MODEL_NAME=prithivMLmods/Deep-Fake-Detector-v2-Model`

## Adding Test Images

Place image files in `tests/test_images/` (`.jpg`, `.png`):

```
tests/test_images/
├── authentic_image_1.jpg
├── authentic_image_2.png
├── deepfake_sample_1.jpg
└── ...
```

The tests will automatically discover and process these images.

## Test Categories

### 1. **test_huggingface_model.py**
- Model loading from Hugging Face registry
- Inference on single image
- Batch inference on multiple images
- Class predictions and confidence scores

### 2. **test_ai_service.py**
- Deepfake detection via `analyze_image()`
- Result validation (score, status, confidence)
- Multi-image processing pipeline
- SHA-256 hashing service

### 3. **test_api_endpoints.py**
- `/api/health` endpoint
- `/` root endpoint
- FastAPI app instantiation

## Troubleshooting

### Model Download Failed
- Ensure internet connection
- Check HuggingFace token: `HF_TOKEN=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`
- Manually download: 
  ```bash
  huggingface-cli login --token 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
  ```

### PyTorch Installation Issues
For GPU (CUDA 12.1):
```bash
uv pip install torch==2.3.0 --index-url https://download.pytorch.org/whl/cu121
```

For CPU only:
```bash
uv pip install torch==2.3.0 --index-url https://download.pytorch.org/whl/cpu
```

### Missing Test Images
Create a `tests/test_images/` folder and add `.jpg` or `.png` files. Tests will skip if no images are found.

## Test Coverage

Generate coverage report:
```bash
pytest tests/ --cov=backend --cov-report=html
open htmlcov/index.html  # View coverage report
```

## Continuous Integration

Tests are designed to:
- Skip gracefully if Hugging Face model is unavailable (already downloaded)
- Work offline once the model is cached
- Run in CI/CD pipelines with pytest

Example GitHub Actions (would go in `.github/workflows/tests.yml`):
```yaml
- name: Run tests
  run: |
    pip install uv pytest
    uv venv test_env
    source test_env/bin/activate
    uv pip install -r test-requirements.txt
    pytest tests/ -v
```
