"""
Central Configuration Module
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # App
    APP_NAME: str = "Digital Forensic Evidence Preservation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./forensic_evidence.db")

    # Blockchain
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "")
    WALLET_PRIVATE_KEY: str = os.getenv("WALLET_PRIVATE_KEY", "")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "1337"))

    # IPFS
    IPFS_API_URL: str = os.getenv("IPFS_API_URL", "http://127.0.0.1:5001")
    IPFS_GATEWAY_URL: str = os.getenv("IPFS_GATEWAY_URL", "http://127.0.0.1:8080/ipfs/")
    USE_IPFS: bool = os.getenv("USE_IPFS", "False") == "True"

    # AI Model
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "prithivMLmods/Deep-Fake-Detector-v2-Model")
    AI_MODEL_PATH: str = os.getenv("AI_MODEL_PATH", "./models/deepfake_detector.h5")
    AI_MODEL_VERSION: str = os.getenv("AI_MODEL_VERSION", "v2.0-ViT")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    AI_CONFIDENCE_THRESHOLD: float = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.7"))
    AI_SUSPICIOUS_THRESHOLD: float = float(os.getenv("AI_SUSPICIOUS_THRESHOLD", "0.5"))

    # File Handling
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_IMAGE_FORMATS: list = ["image/jpeg", "image/png", "image/bmp", "image/tiff"]
    ALLOWED_VIDEO_FORMATS: list = ["video/mp4", "video/avi", "video/mov", "video/mkv"]
    ALLOWED_FORMATS: list = ALLOWED_IMAGE_FORMATS + ALLOWED_VIDEO_FORMATS

    # Storage
    EVIDENCE_STORAGE_PATH: str = os.getenv("EVIDENCE_STORAGE_PATH", "./storage/evidence")
    QUARANTINE_STORAGE_PATH: str = os.getenv("QUARANTINE_STORAGE_PATH", "./storage/quarantine")

    # CORS
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")


settings = Settings()
