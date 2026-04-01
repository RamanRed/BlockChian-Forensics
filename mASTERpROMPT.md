You are an expert Python (FastAPI) + Solidity + Web3 engineer implementing remaining features in the DIRS (Digital Investigation & Record System) codebase on the modification branch. You have done a full audit. Below is the exact state of the codebase and the precise list of changes needed. Follow every instruction exactly — do not skip, do not hallucinate new abstractions, do not refactor things not listed.

CODEBASE CONTEXT (DO NOT CHANGE ANYTHING NOT LISTED BELOW)

WHAT ALREADY EXISTS AND WORKS — DO NOT TOUCH:
- blockchain_service.py — Web3 adapter, calls storeRecordHash() on DIRSRegistry
- ai_service.py — Hugging Face ViT deepfake detection pipeline
- hashing_service.py — SHA-256 evidence binding
- All route files (FIR, Case Diary, Seizure, Custody, Persons, Chargesheet, Court, Verification, Admin, Auth)
- JWT auth system
- SQLAlchemy models base
- EvidenceRegistry.sol contract logic (storeRecordHash, storeEvidence)
- Frontend pages (do not touch unless explicitly listed)

SMART CONTRACT INTERNAL NAME: DIRSRegistry
ABI FUNCTION: storeRecordHash(recordType, recordId, dataHash)
CURRENT CHAIN: Hardhat local (chainId: 1337)

TASK LIST — IMPLEMENT EXACTLY THESE 11 ITEMS

TASK 1 — ipfs_service.py (FULL REWRITE)
CURRENT: Uses local IPFS node at http://127.0.0.1:5001
REPLACE WITH: Pinata REST API
Requirements:
- Use Pinata JWT (from env var PINATA_JWT) in Authorization header
- Upload: POST https://api.pinata.cloud/pinning/pinFileToIPFS
  Return: {"cid": str, "pinata_url": str, "ipfs_url": str}
  pinata_url = f"https://gateway.pinata.cloud/ipfs/{cid}"
  ipfs_url = f"ipfs://{cid}"
- Retrieve: GET https://gateway.pinata.cloud/ipfs/{cid} → raw bytes
- Pin by CID: POST https://api.pinata.cloud/pinning/pinByHash
- Unpin: DELETE https://api.pinata.cloud/pinning/unpin/{cid}
- All methods async (httpx AsyncClient)
- Raise HTTPException(502) on failure: "IPFS upload failed: {detail}"
- Class name: PinataIPFSService
- Keep same public method names: upload_file, get_file, pin_cid

TASK 2 — config.py (ADD ENTRIES ONLY)
ADD to existing Settings class:
  PINATA_JWT: str = ""
  PINATA_API_KEY: str = ""
  PINATA_SECRET: str = ""
  POLYGON_AMOY_RPC: str = "https://rpc-amoy.polygon.technology"
  POLYGON_MAINNET_RPC: str = "https://polygon-rpc.com"
  POLYGON_CHAIN_ID: int = 80002
  DEPLOYER_PRIVATE_KEY: str = ""
  CONTRACT_ADDRESS_AMOY: str = ""
  CONTRACT_ADDRESS_MAINNET: str = ""

TASK 3 — .env (ADD PLACEHOLDER ENTRIES)
Append (do not overwrite):
  PINATA_JWT=your_pinata_jwt_here
  PINATA_API_KEY=your_pinata_api_key_here
  PINATA_SECRET=your_pinata_secret_here
  POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
  POLYGON_MAINNET_RPC=https://polygon-rpc.com
  POLYGON_CHAIN_ID=80002
  DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
  CONTRACT_ADDRESS_AMOY=
  CONTRACT_ADDRESS_MAINNET=

TASK 4 — models.py (ADDITIVE ONLY, DO NOT REMOVE ANYTHING)
4a. UserRole enum ADD: lawyer = "lawyer"
4b. FIR model ADD:
  investigation_state = Column(String, default="active")
  # Valid: active|suspended_court|suspended_police|closed_no_chargesheet|
  #        restarted_closure|restarted_court_order|merged|quashed_merged|further_investigation
  state_changed_by = Column(String, nullable=True)
  state_change_reason = Column(String, nullable=True)
  state_order_reference = Column(String, nullable=True)
  state_changed_at = Column(DateTime, nullable=True)
  merged_into_fir_id = Column(Integer, ForeignKey("firs.id"), nullable=True)
4c. CaseDiaryEntry ADD: ipfs_cid, blockchain_hash, version=1
4d. SeizureMemo ADD: ipfs_cid, blockchain_hash, version=1
4e. ChargeSheet ADD: ipfs_cid, blockchain_hash, version=1

TASK 5 — auth/dependencies.py
5a. FIX require_investigator: UserRole.investigator does not exist → change to {UserRole.io, UserRole.sp, UserRole.dsp}
5b. ADD require_read_only: allow {UserRole.lawyer, UserRole.court, UserRole.auditor}
5c. ADD require_supervisor: allow {UserRole.sp, UserRole.dsp, UserRole.admin}

TASK 6 — contracts/EvidenceRegistry.sol
In storeRecordHash: add param string memory ipfsCid
Update RecordStored event to emit ipfsCid
Add mapping(bytes32 => string) public recordCID
After storing hash: recordCID[key] = ipfsCid
Add getter: getRecordCID(bytes32 key) returns (string memory)
Keep all existing functions. Do not rename contract.

TASK 7 — hardhat.config.js (ADD NETWORKS ONLY)
Keep localhost. ADD:
  polygonAmoy: { url: POLYGON_AMOY_RPC, chainId: 80002, accounts: [DEPLOYER_PRIVATE_KEY] }
  polygon: { url: POLYGON_MAINNET_RPC, chainId: 137, accounts: [DEPLOYER_PRIVATE_KEY] }
Add require("dotenv").config() if not present.

TASK 8 — deploy.js (FIX BUG)
FIX: getContractFactory("EvidenceRegistry") → getContractFactory("DIRSRegistry")
Print network name and contract address after deploy.

TASK 9 — blockchain_service.py (ADDITIVE ONLY)
ADD get_eip1559_gas_params() async method:
  baseFee from web3.eth.get_block("latest").baseFeePerGas
  maxPriorityFeePerGas = web3.to_wei(30, "gwei")
  maxFeePerGas = (2 * baseFee) + maxPriorityFeePerGas
UPDATE store_record_hash():
  Add optional ipfs_cid: str = "" param
  Use EIP-1559 gas if chain_id in {137, 80002}
  Pass ipfs_cid to contract call

TASK 10 — routes/lawyer_routes.py (NEW FILE)
Prefix: /lawyer. Protect all with Depends(require_read_only).
READ-ONLY endpoints:
  GET /lawyer/cases/{fir_id} → FIR summary
  GET /lawyer/cases/{fir_id}/diary → CaseDiaryEntry list
  GET /lawyer/cases/{fir_id}/persons → Person list via CasePersonMapping
  GET /lawyer/cases/{fir_id}/chargesheet → ChargeSheet record
  GET /lawyer/cases/{fir_id}/court-proceedings → CourtProceeding list
Register in main.py.

TASK 11 — routes/investigation_findings_routes.py (SCAFFOLD ONLY — NO LOGIC)
Prefix: /investigation-findings
POST /{fir_id}/lab-report → # TODO: Pinata upload, hash, blockchain anchor
POST /{fir_id}/finding → # TODO: text finding entry
POST /{fir_id}/media → # TODO: image/video/frame upload
GET  /{fir_id}/all → # TODO: list all findings
GET  /{fir_id}/lab-reports → # TODO: list lab reports
GET  /{fir_id}/media → # TODO: list media
DELETE /{finding_id} → # TODO: soft-delete
Each endpoint returns: {"status": "not_implemented", "message": "Coming soon"}
POST/DELETE: Depends(require_investigator). GET: Depends(require_read_only).
DO NOT create InvestigationFinding model. DO NOT wire to DB.
Register in main.py.

EXECUTION RULES:
1. Work on modification branch only.
2. Tasks in order 1→11, confirm each: "✅ Task N complete — [filename]"
3. Never rename existing functions, classes, columns.
4. Never remove existing imports or fields.
5. Never change existing route paths.
6. Task 11 = scaffold only, zero business logic.
7. No frontend changes.
8. No Alembic migration files — models.py only.
9. Use httpx for async HTTP.
10. End with summary table: | Task | File | Status | Notes |

KNOWN BUGS TO FIX:
- auth/dependencies.py → UserRole.investigator doesn't exist → fix to io/sp/dsp
- deploy.js → "EvidenceRegistry" → "DIRSRegistry"
- ipfs_service.py → local IPFS → full Pinata rewrite

DO NOT:
❌ Implement InvestigationFinding model/DB
❌ Implement digital computer evidence ingestion
❌ Refactor working services
❌ Create frontend components
❌ Create Alembic files
❌ Change existing API response schemas
❌ Add auth to existing public routes

Begin by outputting: "✅ DIRS modification branch — beginning implementation of 11 tasks."
Then proceed file by file.


i also want to stoer teh lab reports, images, videos, and other digital evidence in the pinnata, but now i don't want to store entire computer system data etc as evidnece as they are very big just keep its fucntion and pass command in it as a parameter and  