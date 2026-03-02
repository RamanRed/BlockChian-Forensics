"""
Cryptographic Hashing Service
"""

import hashlib
import json
from datetime import datetime
from typing import Any
from schemas import AIAnalysisResult
from utils.logger import setup_logger

logger = setup_logger(__name__)


def generate_sha256(file_bytes: bytes) -> str:
    """Generate a SHA-256 hash from file bytes."""
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    digest = hasher.hexdigest()
    logger.debug(f"SHA-256 generated: {digest[:16]}...")
    return digest


def bind_evidence(file_hash: str, ai_result: AIAnalysisResult, metadata: dict) -> dict:
    """
    Create a cryptographically bound evidence record combining
    the file hash, AI result, and metadata.
    """
    bound = {
        "file_hash": file_hash,
        "ai_score": ai_result.ai_score,
        "ai_status": ai_result.status.value,
        "model_version": ai_result.model_version,
        "manipulation_type": ai_result.manipulation_type,
        "metadata": metadata,
        "bound_at": datetime.utcnow().isoformat()
    }

    # Create a binding hash over the combined data
    binding_string = json.dumps(bound, sort_keys=True)
    bound["binding_hash"] = hashlib.sha256(binding_string.encode()).hexdigest()
    logger.info(f"Evidence bound: file_hash={file_hash[:16]}... binding={bound['binding_hash'][:16]}...")
    return bound


def verify_hash(original_hash: str, recomputed_hash: str) -> bool:
    """Securely compare two hashes using constant-time comparison."""
    import hmac
    result = hmac.compare_digest(original_hash.lower(), recomputed_hash.lower())
    logger.info(f"Hash verification: {'MATCH' if result else 'MISMATCH'}")
    return result


def generate_file_metadata_hash(filename: str, file_size: int, timestamp: str) -> str:
    """Generate a hash from file metadata for additional binding."""
    meta_string = f"{filename}|{file_size}|{timestamp}"
    return hashlib.sha256(meta_string.encode()).hexdigest()
