"""
File Handling Utilities
"""

import os
import uuid
import hashlib
import mimetypes
from typing import Optional, Tuple
from utils.logger import setup_logger

logger = setup_logger(__name__)


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename preserving the original extension."""
    ext = os.path.splitext(original_filename)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


def get_file_mime_type(file_path: str) -> Optional[str]:
    """Detect MIME type of a file."""
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type


def is_allowed_file(content_type: str, allowed_types: list) -> bool:
    """Check if a file's content type is in the allowed list."""
    return content_type in allowed_types


def get_file_size_mb(file_bytes: bytes) -> float:
    """Return file size in megabytes."""
    return round(len(file_bytes) / (1024 * 1024), 2)


def safe_delete_file(file_path: str) -> bool:
    """Safely delete a file, returning True on success."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"File deleted: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete file {file_path}: {e}")
        return False


def move_to_quarantine(file_path: str, quarantine_dir: str) -> Optional[str]:
    """Move a file to the quarantine directory."""
    import shutil
    try:
        os.makedirs(quarantine_dir, exist_ok=True)
        filename = os.path.basename(file_path)
        dest = os.path.join(quarantine_dir, filename)
        shutil.move(file_path, dest)
        logger.warning(f"File quarantined: {filename}")
        return dest
    except Exception as e:
        logger.error(f"Quarantine move failed: {e}")
        return None


def read_file_chunks(file_path: str, chunk_size: int = 8192):
    """Generator to read a file in chunks for memory-efficient hashing."""
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            yield chunk


def compute_sha256_from_path(file_path: str) -> str:
    """Compute SHA-256 hash of a file directly from disk."""
    hasher = hashlib.sha256()
    for chunk in read_file_chunks(file_path):
        hasher.update(chunk)
    return hasher.hexdigest()
