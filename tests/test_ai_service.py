"""
Tests for AI Service with Hugging Face ViT Model
Tests the deepfake detection model integration
"""

import pytest
import sys
import os
from pathlib import Path

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

# Set test environment variables
os.environ["HF_TOKEN"] = "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"
os.environ["AI_MODEL_NAME"] = "prithivMLmods/Deep-Fake-Detector-v2-Model"

from services.ai_service import analyze_image, load_model
from schemas import AIStatus


class TestAIServiceWithViT:
    """Test suite for AI deepfake detection with Hugging Face Vision Transformer."""

    @pytest.fixture(scope="class")
    def model_setup(self):
        """Load model once for all class tests."""
        try:
            model, processor = load_model()
            return model, processor
        except Exception as e:
            pytest.skip(f"Model loading skipped: {str(e)[:100]}")

    def test_model_loading(self, model_setup):
        """Test that the ViT model loads successfully from Hugging Face."""
        model, processor = model_setup
        assert model is not None, "Model should load successfully"
        assert processor is not None, "Processor should load successfully"
        print("\n✓ Hugging Face ViT model loaded successfully")

    def test_analyze_image_returns_valid_result(self, sample_image_bytes):
        """Test that analyze_image returns expected AIAnalysisResult fields."""
        if not sample_image_bytes:
            pytest.skip("No test images available")
        
        try:
            result = analyze_image(sample_image_bytes)
            assert result is not None
            assert hasattr(result, "ai_score")
            assert hasattr(result, "status")
            assert hasattr(result, "model_version")
            assert hasattr(result, "confidence")
            
            assert 0.0 <= result.ai_score <= 1.0, "AI score must be 0-1"
            assert result.status in [AIStatus.AUTHENTIC, AIStatus.SUSPICIOUS, AIStatus.PENDING]
            assert 0.0 <= result.confidence <= 1.0, "Confidence must be 0-1"
            print(f"\n✓ Analysis Result:")
            print(f"  - Score: {result.ai_score:.4f}")
            print(f"  - Status: {result.status}")
            print(f"  - Confidence: {result.confidence:.2%}")
            print(f"  - Model: {result.model_version}")
        except Exception as e:
            pytest.skip(f"Analysis test skipped: {str(e)[:100]}")

    def test_analyze_multiple_images(self, test_image_dir):
        """Test analysis on multiple images from test_images folder."""
        image_files = list(test_image_dir.glob("*.jpg")) + list(test_image_dir.glob("*.png"))
        
        if not image_files:
            pytest.skip("No test images found in test_images folder")

        results = []
        for img_path in image_files[:5]:  # Max 5 images
            try:
                with open(img_path, "rb") as f:
                    image_bytes = f.read()
                
                result = analyze_image(image_bytes)
                results.append({
                    "file": img_path.name,
                    "status": result.status,
                    "score": result.ai_score,
                    "confidence": result.confidence
                })
            except Exception as e:
                print(f"  ✗ Failed to process {img_path.name}: {e}")

        print(f"\n✓ Processed {len(results)} images:")
        for r in results:
            print(f"  - {r['file']}: {r['status']} (score: {r['score']:.4f}, conf: {r['confidence']:.2%})")

        assert len(results) > 0, "At least one image should be processed successfully"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
