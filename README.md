# Digital Forensic Evidence Preservation System

Blockchain-assisted storage and verification platform for digital evidence with AI-based authenticity screening.

## Current Working System

The project currently runs as a full-stack application made up of:

- A `FastAPI` backend for authentication, evidence upload, verification, audit logs, and admin actions
- A `Next.js` frontend for investigators, auditors, and admins
- A Solidity `EvidenceRegistry` smart contract for on-chain evidence registration
- Local file storage for accepted and quarantined evidence
- SQLite for users, evidence metadata, and audit logs

The application is designed to keep working even when optional services are unavailable:

- If the Hugging Face model is unavailable, AI analysis falls back to a development-safe mock score
- If blockchain is not configured, uploads still complete and on-chain storage is skipped
- If IPFS is not enabled or reachable, uploads still complete and IPFS storage is skipped

## Implemented Features

- User registration and login with JWT-based authentication
- Role-based access control for `admin`, `investigator`, and `auditor`
- Password validation with minimum length, uppercase, and numeric requirements
- Evidence upload for image and video files up to `100 MB`
- Supported image formats: `JPEG`, `PNG`, `BMP`, `TIFF`
- Supported video formats: `MP4`, `AVI`, `MOV`, `MKV`
- SHA-256 hashing for each uploaded file
- Duplicate evidence detection based on file hash
- AI authenticity scoring with `AUTHENTIC`, `SUSPICIOUS`, and `PENDING` statuses
- Automatic quarantine flow for suspicious evidence
- Optional IPFS upload for non-quarantined files
- Optional blockchain recording with transaction hash and block number
- Integrity verification by recomputing the file hash and checking blockchain state
- Full audit trail for registration, login, upload, view, verification, deletion, and role changes
- Admin tools for user role updates and evidence deletion
- Frontend dashboard with evidence statistics, filters, details, verification, quarantine, audit logs, and admin pages

## User Roles

- `admin`: full access, including user management and evidence deletion
- `investigator`: upload evidence, view records, verify evidence, view quarantine, and access audit logs
- `auditor`: view records, run verification, and access audit logs

## Evidence Flow

1. A user registers and signs in.
2. An investigator or admin uploads an image or video file.
3. The backend validates file type and size.
4. A SHA-256 hash is generated and checked for duplicates.
5. The file is stored locally.
6. AI analysis assigns a score and status.
7. Suspicious files are moved to quarantine.
8. Clean files can optionally be uploaded to IPFS.
9. Evidence metadata is optionally written to the blockchain.
10. Metadata and audit entries are stored in SQLite.
11. Any authenticated user can later verify integrity using the stored file and blockchain record.

## Main API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/evidence/upload`
- `GET /api/evidence/all`
- `GET /api/evidence/{id}`
- `POST /api/verify/{id}`
- `GET /api/admin/audit/logs`
- `GET /api/admin/quarantine`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/role`
- `DELETE /api/admin/evidence/{id}`
- Interactive API docs: `http://localhost:8000/api/docs`

## Frontend Pages

- `/login` and `/register`
- `/dashboard`
- `/upload`
- `/evidence/[id]`
- `/verify/[id]`
- `/quarantine`
- `/audit`
- `/admin`

## Project Structure

- `backend/` FastAPI app, database models, auth, services, and API routes
- `frontend/` Next.js user interface
- `contracts/` Solidity smart contract
- `scripts/` deployment script for the smart contract
- `storage/` local evidence and quarantine folders
- `tests/` backend and AI-related tests

## Tech Stack

- Frontend: `Next.js 14`, `React 18`, `Axios`, `react-icons`
- Backend: `FastAPI`, `SQLAlchemy`, `Pydantic`, `python-jose`, `passlib`
- AI: `transformers`, `torch`, `Pillow`, `NumPy`
- Blockchain: `Hardhat`, `Solidity`, `Web3.py`
- Storage: local filesystem, optional `IPFS`
- Database: `SQLite`

## Local Setup

### 1. Install backend dependencies

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` with at least:

```env
JWT_SECRET_KEY=change-me
DATABASE_URL=sqlite:///./forensic_evidence.db
ALLOWED_ORIGINS=http://localhost:3000

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=
WALLET_PRIVATE_KEY=
CHAIN_ID=1337

USE_IPFS=False
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/

AI_MODEL_NAME=prithivMLmods/Deep-Fake-Detector-v2-Model
AI_MODEL_VERSION=v2.0-ViT
HF_TOKEN=
AI_SUSPICIOUS_THRESHOLD=0.5

EVIDENCE_STORAGE_PATH=./storage/evidence
QUARANTINE_STORAGE_PATH=./storage/quarantine
```

### 2. Start the backend

```powershell
cd backend
uvicorn main:app --reload --port 8000
```

### 3. Install frontend dependencies

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### 4. Start the frontend

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Optional Blockchain Setup

Start a local Hardhat node:

```powershell
npx hardhat node
```

Deploy the contract from the project root:

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

Then copy the printed contract address into `backend/.env` as `CONTRACT_ADDRESS`.

## Notes About Current Behavior

- The frontend is configured to call the backend through `NEXT_PUBLIC_API_BASE_URL`
- The backend creates database tables and storage folders on startup
- Verification can return a partial result when the file hash matches but blockchain confirmation is not available
- Evidence is stored locally by default under the configured storage directories
- The example env files in the repo are placeholders, so the README setup above is the reliable source of required variables
