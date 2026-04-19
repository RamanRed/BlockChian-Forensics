"""
Pytest configuration and shared fixtures
"""

import pytest
import sys
import os
from pathlib import Path

# Setup path
BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

# Set test environment
os.environ["DEBUG"] = "True"
os.environ["DATABASE_URL"] = "sqlite:///./test_forensic.db"
os.environ["HF_TOKEN"] = "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"
os.environ["AI_MODEL_NAME"] = "prithivMLmods/Deep-Fake-Detector-v2-Model"


@pytest.fixture
def test_image_dir():
    """Return path to test images folder."""
    return Path(__file__).parent / "test_images"


@pytest.fixture
def sample_test_image(test_image_dir):
    """Load first test image."""
    images = list(test_image_dir.glob("*.jpg")) + list(test_image_dir.glob("*.png"))
    if not images:
        return None
    return images[0]


@pytest.fixture
def sample_image_bytes(sample_test_image):
    """Load test image as bytes."""
    if not sample_test_image:
        pytest.skip("No test images found")
    with open(sample_test_image, "rb") as f:
        return f.read()
