"""
Test suite for the Digital Forensic Evidence Preservation System
Runs tests for AI service, API endpoints, and end-to-end workflows
"""

import pytest
import sys
import os
from pathlib import Path

# Add backend to path
BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))
