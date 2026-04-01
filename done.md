# DIRS — Modification Branch Change Log
> Every file touched in this branch is recorded here, in chronological order.
> Format: `[DATE] | FILE | ACTION | WHAT CHANGED`

---

## Session 1 — Audit of existing codebase (pre-implementation)

| # | File | Status | Notes |
|---|------|--------|-------|
| 1 | `backend/config.py` | ✅ Already done | Pinata JWT + Polygon RPC + EIP-1559 + storage paths — all present |
| 2 | `backend/models.py` | ✅ Already done | `lawyer` role, `InvestigationState`, `ipfs_cid`/`blockchain_hash` on Diary/Seizure/ChargeSheet, `InvestigationFinding` model — all present |
| 3 | `backend/auth/dependencies.py` | ✅ Already done | `require_investigator` fixed, `require_sp_or_above`, `require_cfsl_or_above`, `require_read_only`, `require_court_or_lawyer` — all present |
| 4 | `backend/services/ipfs_service.py` | ✅ Already done | Full Pinata rewrite — file, bytes, JSON upload; retrieve; integrity verify; health check |
| 5 | `backend/services/blockchain_service.py` | ✅ Already done | EIP-1559 gas params, `store_record_hash` with `ipfs_cid` logging |
| 6 | `hardhat.config.js` | ✅ Already done | Polygon Amoy (80002) + Polygon mainnet (137) networks added |
| 7 | `scripts/deploy.js` | ✅ Already done | Fixed contract name → `DIRSRegistry`, saves ABI + deployment.json to backend |
| 8 | `contracts/EvidenceRegistry.sol` | ✅ Already done | `DIRSRegistry` with generic `storeRecordHash` + legacy `storeEvidence` |
| 9 | `backend/.env` | ✅ Already done | Pinata, Polygon RPC, EIP-1559, storage path placeholders all present |
| 10 | `backend/routes/lawyer_routes.py` | ✅ Already done (file exists) | Read-only lawyer/court portal — needs audit below |

---

## REMAINING — To implement in this session

| # | File | Action | Status |
|---|------|--------|--------|
| R1 | `backend/routes/investigation_routes.py` | **CREATE** | Investigation findings: lab reports, field findings, text/images/video/frames | ⬜ TODO |
| R2 | `backend/routes/fir_routes.py` | **MODIFY** | Add FIR state-machine endpoints: suspend, restart, merge | ⬜ TODO |
| R3 | `backend/main.py` | **MODIFY** | Register `investigation_router` and `lawyer_router` | ⬜ TODO |
| R4 | `backend/schemas.py` | **MODIFY** | Add `InvestigationFindingCreate`, `InvestigationFindingResponse`, `FIRStateTransition` schemas | ⬜ TODO |
| R5 | `backend/routes/__init__.py` | **MODIFY** | Export new routers | ⬜ TODO |
| R6 | `backend/storage/` dirs | **CREATE** | `investigation/` and `lab_reports/` subdirs | ⬜ TODO |

---

## Change Log (append here after every file touch)

```
[2026-04-01] done.md created — initial audit complete, remaining work scoped
```
