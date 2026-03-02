# ──────────────────────────────────────────────────────────────
#  Test: Hugging Face Transformer Model Integration
# ──────────────────────────────────────────────────────────────

import pytest
from pathlib import Path
from PIL import Image
import torch
from transformers import ViTForImageClassification, ViTImageProcessor


class TestHuggingFaceModel:
    """Test Hugging Face Vision Transformer deepfake detector."""

    @pytest.fixture(scope="class")
    def model_and_processor(self):
        """Load model once for all tests (slow operation)."""
        print("\nLoading Hugging Face model...")
        token = "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"
        model = ViTForImageClassification.from_pretrained(
            "prithivMLmods/Deep-Fake-Detector-v2-Model",
            token=token
        )
        processor = ViTImageProcessor.from_pretrained(
            "prithivMLmods/Deep-Fake-Detector-v2-Model",
            token=token
        )
        return model, processor

    def test_model_loads(self, model_and_processor):
        """Test that model loads successfully."""
        model, processor = model_and_processor
        assert model is not None
        assert processor is not None
        print(f"✓ Model loaded: {model.__class__.__name__}")
        print(f"✓ Processor loaded: {processor.__class__.__name__}")

    def test_inference_on_image(self, model_and_processor, sample_test_image):
        """Test inference on a real image from test_images."""
        if not sample_test_image:
            pytest.skip("No test images found in test_images folder")

        model, processor = model_and_processor
        
        # Load and preprocess image
        image = Image.open(sample_test_image).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")
        
        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            predicted_class = torch.argmax(logits, dim=-1).item()

        # Get label
        label = model.config.id2label.get(predicted_class, "UNKNOWN")
        confidence = torch.softmax(logits, dim=-1).max().item()

        print(f"\n  Image: {sample_test_image.name}")
        print(f"  Predicted: {label} (confidence: {confidence:.2%})")
        
        assert label in ["REAL", "FAKE", "deepfake", "real", "Deepfake", "Real"], f"Unexpected label: {label}"
        assert 0.0 <= confidence <= 1.0, "Confidence must be between 0 and 1"

    def test_batch_inference(self, model_and_processor, test_image_dir):
        """Test inference on multiple images."""
        model, processor = model_and_processor
        image_files = list(test_image_dir.glob("*.jpg")) + list(test_image_dir.glob("*.png"))
        
        if not image_files:
            pytest.skip("No test images found in test_images folder")

        results = []
        for img_path in image_files[:5]:  # Test max 5 images
            try:
                image = Image.open(img_path).convert("RGB")
                inputs = processor(images=image, return_tensors="pt")
                
                with torch.no_grad():
                    outputs = model(**inputs)
                    logits = outputs.logits
                    predicted_class = torch.argmax(logits, dim=-1).item()
                
                label = model.config.id2label.get(predicted_class, "UNKNOWN")
                confidence = torch.softmax(logits, dim=-1).max().item()
                results.append({
                    "file": img_path.name,
                    "label": label,
                    "confidence": confidence
                })
            except Exception as e:
                print(f"  ✗ Failed to process {img_path.name}: {e}")

        print(f"\n  Processed {len(results)} images:")
        for r in results:
            print(f"    - {r['file']}: {r['label']} ({r['confidence']:.2%})")

        assert len(results) > 0, "No images were successfully processed"
