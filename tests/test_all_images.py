#!/usr/bin/env python3
"""
Direct image analysis test
Analyze all images in test_images folder with the deepfake detector
"""

import sys
from pathlib import Path
import os

# Setup path
BACKEND_PATH = Path(__file__).parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

os.environ["DEBUG"] = "True"

from services.ai_service import analyze_image
from schemas import AIStatus


def test_all_images():
    """Test all images in the test_images folder."""
    test_images_dir = Path(__file__).parent / "test images"
    
    if not test_images_dir.exists():
        print("❌ 'test images' folder not found")
        return
    
    images = sorted(test_images_dir.glob("*.jpg"))
    
    if not images:
        print("❌ No JPEG images found")
        return
    
    print("\n" + "="*80)
    print("DEEPFAKE DETECTION TEST - ALL IMAGES")
    print("="*80 + "\n")
    
    results = []
    
    for idx, img_path in enumerate(images, 1):
        print(f"[{idx}/{len(images)}] Testing: {img_path.name}")
        
        try:
            with open(img_path, "rb") as f:
                image_bytes = f.read()
            
            result = analyze_image(image_bytes)
            
            status_emoji = "✅" if result.status == AIStatus.AUTHENTIC else "⚠️"
            print(f"  {status_emoji} Status: {result.status}")
            print(f"     Score: {result.ai_score:.4f} | Confidence: {result.confidence:.4f}")
            
            results.append({
                "filename": img_path.name,
                "status": result.status,
                "score": result.ai_score
            })
            
        except Exception as e:
            print(f"  ❌ Error: {e}\n")
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    
    authentic_count = sum(1 for r in results if r["status"] == AIStatus.AUTHENTIC)
    suspicious_count = sum(1 for r in results if r["status"] == AIStatus.SUSPICIOUS)
    
    print(f"\nTotal images tested: {len(results)}")
    print(f"Authentic: {authentic_count}")
    print(f"Suspicious: {suspicious_count}")
    
    avg_score = sum(r["score"] for r in results) / len(results) if results else 0
    print(f"Average score: {avg_score:.4f}\n")


if __name__ == "__main__":
    test_all_images()
