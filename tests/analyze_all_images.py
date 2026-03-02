"""
Analyze ALL images in test_images/ and produce a detailed report.
Classifies each image as Real or Deepfake with confidence scores.
"""

import sys
from pathlib import Path

# Add backend to path
BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

import os
os.environ["HF_TOKEN"] = "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"
os.environ["AI_MODEL_NAME"] = "prithivMLmods/Deep-Fake-Detector-v2-Model"

import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
import hashlib


def get_file_hash(filepath: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def analyze_all_images():
    test_dir = Path(__file__).parent / "test_images"
    extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
    images = sorted([f for f in test_dir.iterdir() if f.suffix.lower() in extensions])

    if not images:
        print("No images found in test_images/")
        return

    print("Loading Hugging Face ViT model...")
    token = os.environ["HF_TOKEN"]
    model_name = os.environ["AI_MODEL_NAME"]

    model = ViTForImageClassification.from_pretrained(model_name, token=token)
    processor = ViTImageProcessor.from_pretrained(model_name, token=token)
    model.eval()
    print(f"Model loaded: {model_name}\n")

    print("=" * 90)
    print(f"{'#':<4} {'Image':<35} {'Verdict':<12} {'Confidence':<12} {'Score':<10} {'SHA-256 (short)'}")
    print("=" * 90)

    results = []
    real_count = 0
    fake_count = 0

    for idx, img_path in enumerate(images, 1):
        try:
            image = Image.open(img_path).convert("RGB")
            inputs = processor(images=image, return_tensors="pt")

            with torch.no_grad():
                outputs = model(**inputs)

            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)
            predicted_class = logits.argmax(-1).item()
            confidence = probs.max().item()
            label = model.config.id2label.get(predicted_class, "UNKNOWN")

            # Normalize label
            is_fake = label.lower() in ["deepfake", "fake"]
            verdict = "FAKE" if is_fake else "REAL"
            file_hash = get_file_hash(img_path)[:16]

            if is_fake:
                fake_count += 1
            else:
                real_count += 1

            results.append({
                "file": img_path.name,
                "verdict": verdict,
                "label": label,
                "confidence": confidence,
                "score": 1 - confidence if is_fake else confidence,
                "hash": file_hash,
            })

            print(f"{idx:<4} {img_path.name:<35} {verdict:<12} {confidence:<12.2%} {1-confidence if is_fake else confidence:<10.4f} {file_hash}")

        except Exception as e:
            print(f"{idx:<4} {img_path.name:<35} {'ERROR':<12} {str(e)}")

    print("=" * 90)
    print(f"\nTotal: {len(images)} images | REAL: {real_count} | FAKE: {fake_count}")
    print()

    # Separate lists
    if fake_count > 0:
        print("--- FAKE / DEEPFAKE Images ---")
        for r in results:
            if r["verdict"] == "FAKE":
                print(f"  [FAKE]  {r['file']} (confidence: {r['confidence']:.2%})")
        print()

    if real_count > 0:
        print("--- REAL / AUTHENTIC Images ---")
        for r in results:
            if r["verdict"] == "REAL":
                print(f"  [REAL]  {r['file']} (confidence: {r['confidence']:.2%})")
        print()

    return results


if __name__ == "__main__":
    analyze_all_images()
