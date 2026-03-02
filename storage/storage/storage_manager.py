"""
Storage Manager
Handles all file storage operations for evidence and quarantine directories.
"""

import os
import uuid
import shutil
import hashlib
import aiofiles
from typing import Optional, Tuple
from datetime import datetime
from config import settings
from utils.logger import setup_logger

logger = setup_logger(__name__)


class StorageManager:
    def __init__(
        self,
        evidence_dir: str = settings.EVIDENCE_STORAGE_PATH,
        quarantine_dir: str = settings.QUARANTINE_STORAGE_PATH
    ):
        self.evidence_dir = evidence_dir
        self.quarantine_dir = quarantine_dir
        self._ensure_directories()

    def _ensure_directories(self):
        """Create storage directories if they don't exist."""
        os.makedirs(self.evidence_dir, exist_ok=True)
        os.makedirs(self.quarantine_dir, exist_ok=True)
        logger.info(f"Storage directories ready: {self.evidence_dir}, {self.quarantine_dir}")

    # ─────────────────────────────────────────────
    #  SAVE
    # ─────────────────────────────────────────────

    def save_evidence(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        """
        Save evidence file to the evidence directory.
        Returns (stored_filename, full_path).
        """
        ext = os.path.splitext(original_filename)[1].lower()
        stored_filename = f"{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
        full_path = os.path.join(self.evidence_dir, stored_filename)

        with open(full_path, "wb") as f:
            f.write(file_bytes)

        logger.info(f"Evidence saved: {stored_filename} ({len(file_bytes)} bytes)")
        return stored_filename, full_path

    async def save_evidence_async(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
        """Async version of save_evidence."""
        ext = os.path.splitext(original_filename)[1].lower()
        stored_filename = f"{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
        full_path = os.path.join(self.evidence_dir, stored_filename)

        async with aiofiles.open(full_path, "wb") as f:
            await f.write(file_bytes)

        logger.info(f"Evidence saved (async): {stored_filename} ({len(file_bytes)} bytes)")
        return stored_filename, full_path

    # ─────────────────────────────────────────────
    #  QUARANTINE
    # ─────────────────────────────────────────────

    def quarantine_file(self, file_path: str) -> Optional[str]:
        """
        Move a suspicious file from evidence dir to quarantine dir.
        Returns new quarantine path or None on failure.
        """
        if not os.path.exists(file_path):
            logger.error(f"Quarantine failed: file not found at {file_path}")
            return None

        filename = os.path.basename(file_path)
        dest_path = os.path.join(self.quarantine_dir, filename)

        try:
            shutil.move(file_path, dest_path)
            logger.warning(f"File quarantined: {filename}")
            return dest_path
        except Exception as e:
            logger.error(f"Quarantine move failed: {e}")
            return None

    def release_from_quarantine(self, filename: str) -> Optional[str]:
        """
        Move a file back from quarantine to evidence directory (admin action).
        Returns new evidence path or None on failure.
        """
        src_path = os.path.join(self.quarantine_dir, filename)
        if not os.path.exists(src_path):
            logger.error(f"Release failed: file not found in quarantine: {filename}")
            return None

        dest_path = os.path.join(self.evidence_dir, filename)
        try:
            shutil.move(src_path, dest_path)
            logger.info(f"File released from quarantine: {filename}")
            return dest_path
        except Exception as e:
            logger.error(f"Quarantine release failed: {e}")
            return None

    # ─────────────────────────────────────────────
    #  READ
    # ─────────────────────────────────────────────

    def read_file(self, file_path: str) -> Optional[bytes]:
        """Read a file and return its bytes."""
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None
        with open(file_path, "rb") as f:
            return f.read()

    async def read_file_async(self, file_path: str) -> Optional[bytes]:
        """Async version of read_file."""
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()

    # ─────────────────────────────────────────────
    #  DELETE
    # ─────────────────────────────────────────────

    def delete_file(self, file_path: str) -> bool:
        """Permanently delete a file. Returns True on success."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File deleted: {file_path}")
                return True
            logger.warning(f"Delete skipped: file not found at {file_path}")
            return False
        except Exception as e:
            logger.error(f"File deletion failed: {e}")
            return False

    # ─────────────────────────────────────────────
    #  VERIFY
    # ─────────────────────────────────────────────

    def verify_integrity(self, file_path: str, expected_hash: str) -> bool:
        """
        Recompute SHA-256 of a stored file and compare with expected hash.
        Returns True if file is intact.
        """
        if not os.path.exists(file_path):
            logger.error(f"Integrity check failed: file not found at {file_path}")
            return False

        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)

        computed = hasher.hexdigest()
        match = computed == expected_hash
        logger.info(f"Integrity check: {'PASS' if match else 'FAIL'} for {os.path.basename(file_path)}")
        return match

    # ─────────────────────────────────────────────
    #  LIST
    # ─────────────────────────────────────────────

    def list_evidence_files(self) -> list:
        """Return list of all filenames in the evidence directory."""
        return os.listdir(self.evidence_dir)

    def list_quarantine_files(self) -> list:
        """Return list of all filenames in the quarantine directory."""
        return os.listdir(self.quarantine_dir)

    # ─────────────────────────────────────────────
    #  STATS
    # ─────────────────────────────────────────────

    def get_storage_stats(self) -> dict:
        """Return storage statistics for both directories."""
        def dir_stats(path):
            files = os.listdir(path)
            total_size = sum(
                os.path.getsize(os.path.join(path, f))
                for f in files if os.path.isfile(os.path.join(path, f))
            )
            return {"file_count": len(files), "total_size_mb": round(total_size / (1024 * 1024), 2)}

        return {
            "evidence": dir_stats(self.evidence_dir),
            "quarantine": dir_stats(self.quarantine_dir)
        }


# Singleton instance
storage_manager = StorageManager()
