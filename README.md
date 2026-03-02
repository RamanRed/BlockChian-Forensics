# Digital Evidence Preservation System

> **Blockchain-Based Forensic Storage with AI Deepfake Detection**

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Smart Contract](#smart-contract)
8. [Setup and Installation](#setup-and-installation)
9. [API Reference](#api-reference)
10. [Workflow](#workflow)
11. [Environment Variables](#environment-variables)
12. [Security](#security)
13. [Academic Contribution](#academic-contribution)

---

## Overview

The **Digital Evidence Preservation System** is a secure forensic platform that:

- Detects deepfake and manipulated digital media using AI
- Preserves evidence files with cryptographic integrity guarantees
- Records tamper-proof proof on-chain via a Solidity smart contract
- Maintains a verifiable chain of custody with a full audit trail

---

## Problem Statement

Digital media (images, videos) is increasingly critical in investigations, courts, and audits.
Traditional centralised systems are vulnerable to:

| Threat                    | Impact                              |
|---------------------------|-------------------------------------|
| Unauthorised modification | Evidence integrity lost             |
| Loss of provenance        | Chain of custody broken             |
| Insider tampering         | Investigator accountability gaps    |
| Evidence deletion         | Case outcomes compromised           |

This system mitigates every vector above using **AI + Blockchain + Cryptographic Binding**.

---

## Architecture

```
User (browser)
      â”‚
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Next.js Frontend   â”‚  JWT auth Â· evidence upload Â· verification UI
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚ REST / JSON
         â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  FastAPI Backend    â”‚  routes Â· auth Â· services Â· audit logging
â””â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
   â”‚      â”‚
   â”‚      â–¼
   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚  â”‚  AI Service  â”‚  SHA-256 hash Â· deepfake detection Â· binding
   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
   â”‚
   â”œâ”€â”€â–¶  SQLite / PostgreSQL   (metadata + audit logs)
   â”‚
   â”œâ”€â”€â–¶  Local file storage    (evidence + quarantine dirs)
   â”‚
   â”œâ”€â”€â–¶  IPFS node (optional)  (content-addressed off-chain storage)
   â”‚
   â””â”€â”€â–¶ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚  Hardhat / EVM Node         â”‚
        â”‚  EvidenceRegistry.sol       â”‚  immutable hash + AI score record
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Features

### 1 â€” AI Authenticity Verification
- Deepfake detection on images and video (frame-level analysis)
- Confidence score normalised to `[0, 1]`
- Model version logged per analysis
- Grad-CAM heatmap support (optional)

### 2 â€” Cryptographic Hashing
- **SHA-256** file hashing on every upload
- Evidence binding: `hash(file_hash + AI_result + metadata)` â†’ prevents post-submission tampering
- Constant-time HMAC comparison to prevent timing attacks

### 3 â€” Blockchain Timestamping
`EvidenceRegistry.sol` stores per evidence:

| Field          | Type      | Description                      |
|----------------|-----------|----------------------------------|
| `evidenceHash` | `string`  | SHA-256 hex of the file          |
| `ipfsCid`      | `string`  | IPFS content identifier          |
| `aiScore`      | `uint256` | AI score Ã— 100                   |
| `aiStatus`     | `string`  | `"AUTHENTIC"` or `"SUSPICIOUS"`  |
| `modelVersion` | `string`  | AI model version tag             |
| `timestamp`    | `uint256` | `block.timestamp`                |
| `submitter`    | `address` | Wallet address of uploader       |

Duplicate hash entries are rejected at the contract level.

### 4 â€” Secure Storage
| Path                    | Contents                         |
|-------------------------|----------------------------------|
| `storage/evidence/`     | Authentic evidence files         |
| `storage/quarantine/`   | Suspicious / flagged files       |

### 5 â€” Verification System
Recomputes the SHA-256 of the stored file, compares it with the original hash,
and cross-checks against the on-chain record. Returns a three-state verdict:

| Verdict      | Condition                                 |
|--------------|-------------------------------------------|
| `VERIFIED`   | Hash match **and** blockchain confirmed   |
| `PARTIAL`    | Hash match but blockchain unconfirmed     |
| `COMPROMISED`| Hash mismatch â€” file has been altered     |

### 6 â€” Role-Based Access Control

| Role           | Permissions                                     |
|----------------|-------------------------------------------------|
| `investigator` | Upload evidence, view own evidence              |
| `auditor`      | Read-only access to evidence + audit logs       |
| `admin`        | Full access including delete and role management|

### 7 â€” Full Audit Trail

Every upload, view, verification, login, and deletion is logged to the `audit_logs`
table with user ID, IP address, and timestamp.

---

## Tech Stack

### Backend
| Package           | Purpose                       |
|-------------------|-------------------------------|
| FastAPI 0.111     | REST API framework            |
| SQLAlchemy 2      | ORM & DB migrations (Alembic) |
| Pydantic v2       | Request/response validation   |
| python-jose       | JWT encoding / decoding       |
| passlib[bcrypt]   | Password hashing              |
| Web3.py 6         | Ethereum / Hardhat interaction|
| aiohttp / aiofiles| Async IPFS + file I/O         |
| Pillow / NumPy    | Image pre-processing          |

### Blockchain
| Tool              | Purpose                       |
|-------------------|-------------------------------|
| Solidity 0.8.20   | Smart contract language       |
| Hardhat           | Local EVM node + deployment   |
| Web3.py           | Python â†” contract bridge      |

### Frontend
| Package           | Purpose                       |
|-------------------|-------------------------------|
| Next.js 14        | React framework + routing     |
| Axios             | HTTP client                   |
| react-toastify    | User notifications            |
| dayjs             | Date formatting               |

---

## Project Structure

```
blockchain/                         â† monorepo root
â”‚
â”œâ”€â”€ backend/                        â† FastAPI application
â”‚   â”œâ”€â”€ main.py                     â† app factory, middleware, routers
â”‚   â”œâ”€â”€ config.py                   â† Settings class (env-driven)
â”‚   â”œâ”€â”€ database.py                 â† SQLAlchemy engine + session
â”‚   â”œâ”€â”€ models.py                   â† ORM models (User, Evidence, AuditLog)
â”‚   â”œâ”€â”€ schemas.py                  â† Pydantic v2 schemas
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â”œâ”€â”€ Dockerfile
â”‚   â”œâ”€â”€ .env.example                â† copy to .env before running
â”‚   â”‚
â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”œâ”€â”€ jwt_handler.py          â† create / verify JWT
â”‚   â”‚   â”œâ”€â”€ password_utils.py       â† bcrypt helpers
â”‚   â”‚   â””â”€â”€ dependencies.py        â† FastAPI dependency injection
â”‚   â”‚
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ auth_routes.py          â† POST /api/auth/register|login  GET /api/auth/me
â”‚   â”‚   â”œâ”€â”€ evidence_routes.py      â† POST /api/evidence/upload  GET /api/evidence/{id}
â”‚   â”‚   â”œâ”€â”€ verification_routes.py  â† POST /api/verify/{id}
â”‚   â”‚   â””â”€â”€ admin_routes.py         â† GET  /api/admin/audit/logs  PATCH /api/admin/users
â”‚   â”‚
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ ai_service.py           â† deepfake detection (TensorFlow/mock)
â”‚   â”‚   â”œâ”€â”€ hashing_service.py      â† SHA-256 + evidence binding
â”‚   â”‚   â”œâ”€â”€ blockchain_service.py   â† Web3.py contract calls
â”‚   â”‚   â”œâ”€â”€ ipfs_service.py         â† async IPFS upload/retrieve
â”‚   â”‚   â””â”€â”€ audit_service.py        â† audit log writer
â”‚   â”‚
â”‚   â”œâ”€â”€ blockchain/
â”‚   â”‚   â”œâ”€â”€ abi.json                â† auto-generated by deploy.js
â”‚   â”‚   â””â”€â”€ contract_address.txt   â† auto-generated by deploy.js
â”‚   â”‚
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”œâ”€â”€ logger.py
â”‚   â”‚   â””â”€â”€ file_utils.py
â”‚   â”‚
â”‚   â””â”€â”€ storage/
â”‚       â”œâ”€â”€ evidence/
â”‚       â””â”€â”€ quarantine/
â”‚
â”œâ”€â”€ frontend/                       â† Next.js application
â”‚   â”œâ”€â”€ next.config.js              â† env passthrough + API rewrite
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ Dockerfile
â”‚   â”œâ”€â”€ .env.local.example          â† copy to .env.local before running
â”‚   â”‚
â”‚   â”œâ”€â”€ pages/                      â† Next.js file-based routes
â”‚   â”‚   â”œâ”€â”€ _app.jsx
â”‚   â”‚   â”œâ”€â”€ index.jsx               â† redirects to /dashboard
â”‚   â”‚   â”œâ”€â”€ login.jsx
â”‚   â”‚   â”œâ”€â”€ register.jsx
â”‚   â”‚   â”œâ”€â”€ dashboard.jsx
â”‚   â”‚   â”œâ”€â”€ upload.jsx
â”‚   â”‚   â”œâ”€â”€ quarantine.jsx
â”‚   â”‚   â”œâ”€â”€ audit.jsx
â”‚   â”‚   â”œâ”€â”€ admin.jsx
â”‚   â”‚   â”œâ”€â”€ evidence/[id].jsx
â”‚   â”‚   â””â”€â”€ verify/[id].jsx
â”‚   â”‚
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ components/             â† reusable UI components
â”‚       â”œâ”€â”€ context/AuthContext.jsx â† JWT + user state
â”‚       â”œâ”€â”€ hooks/                  â† useAuth, useFetch
â”‚       â”œâ”€â”€ services/               â† api.js, authService.js, evidenceService.js â€¦
â”‚       â””â”€â”€ utils/                  â† formatDate, hashShortener, roleUtils
â”‚
â”œâ”€â”€ contracts/
â”‚   â””â”€â”€ EvidenceRegistry.sol        â† Solidity smart contract (pass your implementation here)
â”‚
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ deploy.js                   â† Hardhat deployment script
â”‚
â”œâ”€â”€ hardhat.config.js
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ .gitignore
â””â”€â”€ README.md
```

---

## Smart Contract

The contract is located at [`contracts/EvidenceRegistry.sol`](contracts/EvidenceRegistry.sol).

### Interface consumed by the Python backend

```solidity
// Store a new evidence record (reverts on duplicate hash)
function storeEvidence(
    string calldata fileHash,
    string calldata ipfsCid,
    uint256         aiScore,     // 0â€“100 (actual score Ã— 100)
    string calldata aiStatus,    // "AUTHENTIC" | "SUSPICIOUS"
    string calldata modelVersion
) external;

// Returns true if the hash has already been registered
function evidenceExists(string calldata fileHash) external view returns (bool);

// Retrieve all fields for a stored hash
function getEvidence(string calldata fileHash)
    external view
    returns (string, string, uint256, string, string, uint256, address);
```

> **Note:** Pass your Solidity implementation file here.  
> After deploying, the `scripts/deploy.js` script automatically writes  
> `backend/blockchain/abi.json` and `backend/blockchain/contract_address.txt`.

---

## Setup and Installation

### Prerequisites

| Tool        | Version  | Install                                                |
|-------------|----------|--------------------------------------------------------|
| Python      | 3.11+    | [python.org](https://python.org)                       |
| Node.js     | 20+      | [nodejs.org](https://nodejs.org)                       |
| npm         | 10+      | bundled with Node                                      |
| Git         | any      | [git-scm.com](https://git-scm.com)                     |

---

### 1 â€” Clone and configure

```bash
git clone <your-repo-url>
cd blockchain
```

Copy and edit environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit both files and fill in real values (JWT secret, contract address, etc.)
```

---

### 2 â€” Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs will be available at <http://localhost:8000/api/docs>

---

### 3 â€” Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at <http://localhost:3000>

---

### 4 â€” Blockchain (local Hardhat node)

```bash
# In the repo root
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv

# Terminal A â€” start local node
npx hardhat node

# Terminal B â€” deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

The script prints the deployed address and writes `abi.json` and `contract_address.txt`
into `backend/blockchain/`. Update `CONTRACT_ADDRESS` in `backend/.env` to match.

---

### 5 â€” Docker (optional, all services at once)

```bash
docker compose up --build
```

| Service    | URL                        |
|------------|----------------------------|
| Backend    | http://localhost:8000      |
| API docs   | http://localhost:8000/api/docs |
| Frontend   | http://localhost:3000      |

---

## API Reference

| Method | Path                          | Auth           | Description                          |
|--------|-------------------------------|----------------|--------------------------------------|
| POST   | `/api/auth/register`          | â€”              | Create a new user account            |
| POST   | `/api/auth/login`             | â€”              | Obtain JWT access token              |
| GET    | `/api/auth/me`                | Bearer token   | Get current user profile             |
| POST   | `/api/evidence/upload`        | investigator+  | Upload and process evidence file     |
| GET    | `/api/evidence/all`           | any role       | List all evidence (paginated)        |
| GET    | `/api/evidence/{id}`          | any role       | Get a single evidence record         |
| POST   | `/api/verify/{id}`            | any role       | Verify evidence integrity            |
| GET    | `/api/admin/audit/logs`       | auditor+       | Fetch audit log entries              |
| GET    | `/api/admin/quarantine`       | investigator+  | List quarantined files               |
| DELETE | `/api/admin/evidence/{id}`    | admin only     | Permanently delete evidence          |
| GET    | `/api/admin/users`            | admin only     | List all users                       |
| PATCH  | `/api/admin/users/{id}/role`  | admin only     | Update a user's role                 |
| GET    | `/api/health`                 | â€”              | Health probe                         |

Interactive documentation: `/api/docs` (Swagger UI) Â· `/api/redoc` (ReDoc)

---

## Workflow

```
1. Upload      User submits image / video via POST /api/evidence/upload
                    â”‚
2. Validate    File type and size checked against allowed list / max size
                    â”‚
3. Hash        SHA-256 digest computed from file bytes
                    â”‚
4. AI          Deepfake / tampering detection â†’ score + status
                    â”‚
5. Route       Authentic â†’ storage/evidence/
               Suspicious â†’ storage/quarantine/  (is_quarantined = 1)
                    â”‚
6. IPFS        If USE_IPFS=True and file is authentic, upload and store CID
                    â”‚
7. Blockchain  storeEvidence() called on EvidenceRegistry contract
               â†’ tx hash + block number stored in DB
                    â”‚
8. Database    Evidence record persisted (hash, AI result, paths, tx)
                    â”‚
9. Audit       Upload action logged with user ID, IP, timestamp
                    â”‚
10. Verify     POST /api/verify/{id}
               Re-hash file â†’ compare with DB hash â†’ cross-check blockchain
               â†’ return VERIFIED / PARTIAL / COMPROMISED verdict
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                   | Default                         | Description                          |
|----------------------------|---------------------------------|--------------------------------------|
| `DEBUG`                    | `False`                         | Enable debug logging                 |
| `ALLOWED_ORIGINS`          | `http://localhost:3000`         | Comma-separated CORS origins         |
| `JWT_SECRET_KEY`           | *(required)*                    | HS256 signing key â€” use `openssl rand -hex 32` |
| `JWT_EXPIRE_MINUTES`       | `60`                            | Token lifetime                       |
| `DATABASE_URL`             | `sqlite:///./forensic_evidence.db` | SQLAlchemy connection string      |
| `BLOCKCHAIN_RPC_URL`       | `http://127.0.0.1:8545`         | Hardhat / EVM JSON-RPC endpoint      |
| `CONTRACT_ADDRESS`         | *(required for blockchain)*     | Deployed `EvidenceRegistry` address  |
| `WALLET_PRIVATE_KEY`       | *(required for blockchain)*     | Signing wallet private key           |
| `CHAIN_ID`                 | `1337`                          | EVM chain ID (1337 = Hardhat local)  |
| `USE_IPFS`                 | `False`                         | Enable IPFS uploads                  |
| `AI_MODEL_PATH`            | `./models/deepfake_detector.h5` | Path to TF/Keras model file          |
| `MAX_FILE_SIZE_MB`         | `100`                           | Maximum upload size                  |

### Frontend (`frontend/.env.local`)

| Variable                      | Default                          | Description               |
|-------------------------------|----------------------------------|---------------------------|
| `NEXT_PUBLIC_API_BASE_URL`    | `http://localhost:8000/api`      | FastAPI backend URL       |
| `NEXT_PUBLIC_IPFS_GATEWAY`    | `https://ipfs.io/ipfs/`          | IPFS gateway for viewing  |

---

## Security

| Mechanism                      | Layer         |
|--------------------------------|---------------|
| JWT (HS256) authentication     | API           |
| Role-based route guards        | API + Frontend|
| bcrypt password hashing        | Backend       |
| SHA-256 file hashing           | Backend       |
| HMAC constant-time comparison  | Backend       |
| Evidence binding hash          | Backend       |
| Immutable blockchain record    | Blockchain    |
| Input validation (Pydantic v2) | Backend       |
| File type + size enforcement   | Backend       |
| Full audit log                 | Backend + DB  |
| Request ID tracing             | Backend       |

---

## Academic Contribution

This project demonstrates:

- Integration of AI (deepfake detection) with blockchain immutability
- Practical digital forensic system design
- Cryptographic evidence binding and chain-of-custody architecture
- Solidity smart contract development with a real Python integration layer
- Secure REST API design with JWT + RBAC
- Full-stack application development (FastAPI + Next.js)

---

*Built as part of a forensic blockchain training module.*
