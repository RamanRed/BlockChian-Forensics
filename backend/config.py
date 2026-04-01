"""
DIRS — Digital Investigation Record System
Central Configuration  (modification branch)

Changes vs v1:
  - Added Pinata IPFS cloud credentials (replaces local IPFS node)
  - Added Polygon Amoy (testnet) + Polygon mainnet RPC support
  - Added EIP-1559 gas settings for Polygon
  - Added lab/investigation media storage settings
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── Application ──────────────────────────────────────────────────────
    APP_NAME: str    = "DIRS — Digital Investigation Record System"
    APP_VERSION: str = "2.1.0"
    DEBUG: bool      = os.getenv("DEBUG", "False") == "True"

    # ── JWT ──────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str               = os.getenv("JWT_SECRET_KEY", "dirs-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str                = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dirs_forensic.db")

    # ── Blockchain ───────────────────────────────────────────────────────
    BLOCKCHAIN_RPC_URL: str  = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS: str    = os.getenv("CONTRACT_ADDRESS", "")
    WALLET_PRIVATE_KEY: str  = os.getenv("WALLET_PRIVATE_KEY", "")
    CHAIN_ID: int            = int(os.getenv("CHAIN_ID", "1337"))

    # EIP-1559 gas settings (required for Polygon — ignored on local Hardhat)
    USE_EIP1559: bool            = os.getenv("USE_EIP1559", "False") == "True"
    MAX_FEE_PER_GAS_GWEI: float  = float(os.getenv("MAX_FEE_PER_GAS_GWEI", "50"))      # maxFeePerGas
    MAX_PRIORITY_FEE_GWEI: float = float(os.getenv("MAX_PRIORITY_FEE_GWEI", "2"))       # maxPriorityFeePerGas

    # Polygon-specific RPC URLs (separate from primary BLOCKCHAIN_RPC_URL)
    POLYGON_AMOY_RPC_URL: str     = os.getenv("POLYGON_AMOY_RPC_URL", "")   # testnet
    POLYGON_MAINNET_RPC_URL: str  = os.getenv("POLYGON_MAINNET_RPC_URL", "") # mainnet
    POLYGON_AMOY_RPC: str = "https://rpc-amoy.polygon.technology"
    POLYGON_MAINNET_RPC: str = "https://polygon-rpc.com"
    POLYGON_CHAIN_ID: int = 80002
    DEPLOYER_PRIVATE_KEY: str = os.getenv("DEPLOYER_PRIVATE_KEY", "")
    CONTRACT_ADDRESS_AMOY: str = os.getenv("CONTRACT_ADDRESS_AMOY", "")
    CONTRACT_ADDRESS_MAINNET: str = os.getenv("CONTRACT_ADDRESS_MAINNET", "")

    # ── Pinata IPFS (cloud, replaces local IPFS node) ────────────────────
    PINATA_JWT: str        = os.getenv("PINATA_JWT", "")          # Primary auth — JWT Bearer
    PINATA_API_KEY: str    = os.getenv("PINATA_API_KEY", "")      # Retained for v1 API compat
    PINATA_SECRET: str     = os.getenv("PINATA_SECRET", "")       # Retained for v1 API compat
    USE_IPFS: bool         = os.getenv("USE_IPFS", "False") == "True"

    # Legacy local IPFS (kept for backward compatibility — not used when USE_IPFS=True+Pinata)
    IPFS_API_URL: str     = os.getenv("IPFS_API_URL", "http://127.0.0.1:5001")
    IPFS_GATEWAY_URL: str = os.getenv("IPFS_GATEWAY_URL", "http://127.0.0.1:8080/ipfs/")

    # ── AI Model (Hugging Face ViT deepfake detector) ────────────────────
    AI_MODEL_NAME: str            = os.getenv("AI_MODEL_NAME", "prithivMLmods/Deep-Fake-Detector-v2-Model")
    AI_MODEL_PATH: str            = os.getenv("AI_MODEL_PATH", "./models/deepfake_detector.h5")
    AI_MODEL_VERSION: str         = os.getenv("AI_MODEL_VERSION", "v2.0-ViT")
    HF_TOKEN: str                 = os.getenv("HF_TOKEN", "")
    AI_CONFIDENCE_THRESHOLD: float = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.7"))
    AI_SUSPICIOUS_THRESHOLD: float = float(os.getenv("AI_SUSPICIOUS_THRESHOLD", "0.5"))

    # ── File Handling ────────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int   = int(os.getenv("MAX_FILE_SIZE_MB", "500"))   # raised for videos
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024

    ALLOWED_IMAGE_FORMATS: list = [
        "image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp"
    ]
    ALLOWED_VIDEO_FORMATS: list = [
        "video/mp4", "video/avi", "video/mov", "video/mkv", "video/webm"
    ]
    ALLOWED_AUDIO_FORMATS: list = [
        "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/m4a"
    ]
    ALLOWED_DOC_FORMATS: list = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]
    # All allowed MIME types for investigation findings / evidence
    ALLOWED_FORMATS: list = (
        ALLOWED_IMAGE_FORMATS
        + ALLOWED_VIDEO_FORMATS
        + ALLOWED_AUDIO_FORMATS
        + ALLOWED_DOC_FORMATS
    )

    # ── Storage Paths ────────────────────────────────────────────────────
    EVIDENCE_STORAGE_PATH: str       = os.getenv("EVIDENCE_STORAGE_PATH", "./storage/evidence")
    QUARANTINE_STORAGE_PATH: str     = os.getenv("QUARANTINE_STORAGE_PATH", "./storage/quarantine")
    INVESTIGATION_STORAGE_PATH: str  = os.getenv("INVESTIGATION_STORAGE_PATH", "./storage/investigation")
    LAB_REPORT_STORAGE_PATH: str     = os.getenv("LAB_REPORT_STORAGE_PATH", "./storage/lab_reports")

    # ── CORS ─────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    # ── External Integrations ────────────────────────────────────────────
    CCTNS_ENDPOINT: str       = os.getenv("CCTNS_ENDPOINT", "")
    ICJS_ENDPOINT: str        = os.getenv("ICJS_ENDPOINT", "")
    CFSL_WEBHOOK_SECRET: str  = os.getenv("CFSL_WEBHOOK_SECRET", "")

    # ── CrPC Statutory Deadlines ─────────────────────────────────────────
    CHARGE_SHEET_DEADLINE_CUSTODY_DAYS: int = int(os.getenv("CHARGE_SHEET_DEADLINE_CUSTODY_DAYS", "60"))
    CHARGE_SHEET_DEADLINE_BAIL_DAYS: int    = int(os.getenv("CHARGE_SHEET_DEADLINE_BAIL_DAYS", "90"))


settings = Settings()
