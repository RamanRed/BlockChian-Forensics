"""
Logging Utility
"""

import logging
import os
from datetime import datetime

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

_DEBUG = os.getenv("DEBUG", "False").strip().lower() in ("1", "true", "yes")


def setup_logger(name: str) -> logging.Logger:
    """Configure and return a named logger with file and console handlers."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    level = logging.DEBUG if _DEBUG else logging.INFO
    logger.setLevel(level)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Rotating daily file handler
    log_file = os.path.join(LOG_DIR, f"forensic_{datetime.now().strftime('%Y%m%d')}.log")
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
