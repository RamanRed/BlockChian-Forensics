# DIRS — Digital Investigation Record System 
## Frontend Architecture & Role-Based Access Control (RBAC) Guide

The Digital Investigation Record System (DIRS) is built to mirror the physical legal workflows laid out in the Indian Criminal Procedure Code (CrPC). The Next.js frontend implements a rigorous Tab-Based Navigation mapped strictly to user roles and blockchain-backed immutable records.

---

## 1. Core Modules (Tabs) & Their Functions

### 📊 **Dashboard (`/`)**
- **Function:** The centralized hub for the authenticated user. Displays numerical statistics (Open Cases, Under Investigation, Chargesheeted) and quick actions based on the user's role.
- **Linking:** Acts as the jumping-off point to all other tabs (`/fir/new`, `/diary`, `/verify`).

### 📝 **FIR Register (`/fir`)**
- **Function:** Manages First Information Reports (Section 154 CrPC).
- **Features:** 
  - Register a new FIR (`/fir/new`).
  - View full immutable details (`/fir/[id]`).
- **Linking:** FIRs are the core of the system. Every Case Diary, Seizure Memo, Person, and Charge Sheet MUST link back to an existing FIR ID.

### 📖 **Case Diary (`/diary`)**
- **Function:** The Investigation Journal (Section 172 CrPC).
- **Features:** An **Append-Only** module. Officers record places visited, persons met, and actions taken chronologically. Once appended, an entry is cryptographically hashed and cannot be altered.
- **Linking:** Drops down to select an Active FIR. Displays chronological progress for that FIR.

### 📦 **Seizure & Property (`/seizure`)**
- **Function:** Manages physical and digital evidence seized during investigation.
- **Features:** Generates a Seizure Memo and adds items to the Malkhana Inventory (Property Register). Digital media triggers the AI Deepfake checker.
- **Linking:** Tied directly to an FIR. 

### 🔄 **Chain of Custody (`/custody`)**
- **Function:** Tracks the movement of property.
- **Features:** When evidence moves from the Malkhana to an IO, or from an IO to the CFSL Lab, a movement handshake is recorded.
- **Linking:** Dropdown selector links to items explicitly registered in the `PropertyRegister`.

### 👥 **Persons (`/persons`)**
- **Function:** A central database of individuals involved in cases.
- **Features:** Assigns dynamic roles (`complainant`, `accused`, `witness`, `expert`, `victim`) to a mapping table.
- **Linking:** Links to the respective FIR.

### ⚖️ **Charge Sheet (`/chargesheet`)**
- **Function:** The Final Report ending police involvement (Section 173 CrPC). 
- **Features:** Compiles the entire investigation, summarizing findings, accused lists, seized properties, and IO conclusions. 
- **Linking:** Absorbs FIR ID, arrays of Person IDs, and Property IDs into a single unified cryptographic report.

### 🏛️ **Court (`/court`)**
- **Function:** Tracks Judicial proceedings once a Charge Sheet is filed.
- **Features:** Allows a logged-in Court user to record hearings, judge notes, and next trial dates.
- **Linking:** Attached directly to a filed Charge Sheet.

### 🔍 **Public Verification (`/verify`)**
- **Function:** A **No-Auth** public portal for defense lawyers, journalists, or magistrates to verify system integrity.
- **Features:** Users paste the system's generated SHA-256 hash or IPFS CID to query the Polygon Amoy Testnet and mathematically prove that evidence was not tampered with.

### 🔒 **Audit & Admin (`/admin`, `/audit`)**
- **Function:** Zero-trust system tracing point.
- **Features:** Even when an Admin views a file, the system writes to the immutable `audit_logs` table recording the IP address, action, and timestamp.

---

## 2. Dynamic IRBAC (Role-Based Access Control)

The system restricts visibility and write-permissions using a strict hierarchical enum:

| Role | Access Level | Data Permissions | Core Workflows |
|---|---|---|---|
| **Investigating Officer (`io`)** | Primary Writer | **Read/Write** (Cases Assigned) | Registers FIRs, appends Case Diaries, submits Seizures, files Charge Sheets. |
| **Superintendent (`sp` / `dsp`)** | Supervisor | **Read** (All), **Write** (Management) | Cannot edit raw diaries, but can merge cases, suspend FIRs, review charge sheets, re-assign IOs. |
| **Forensic Lab (`cfsl`)** | Expert Contributor | **Read** (Assigned Seizures), **Write** (Lab Reports) | Access strictly limited to uploading AI Verification scores and forensic findings. No access to sensitive witness statements. |
| **Court / Magistrate (`court`)** | Adjudicator | **Read** (Chargesheeted), **Write** (Proceedings) | Views completed Charge Sheets and physical logs. Appends judicial hearing records (`/court`). |
| **Auditor (`auditor`)** | Overseer | **Read-Only** (Logs + Systems) | Reviews the Zero-Trust `audit_logs` table for compliance and chain-of-custody leaks. |
| **Defence Lawyer (`lawyer`)** | External Reader | **Read-Only** (Case Scoped) | Only sees evidence unsealed by the court for a specific FIR. |
| **Administrator (`admin`)** | IT Ops | **Write** (User Setup) | Sets up user accounts and handles backend server configs. Cannot unilaterally alter evidence due to blockchain anchoring. |

### How Permissions Are Enforced:
1. **Frontend Tabs:** Next.js protects routes mathematically. If an `io` accesses `/audit`, the frontend forces a redirect to `/` with an "Unauthorized" boundary.
2. **Backend API:** FastAPI's `get_current_user` injects the JWT. Even if a user manually intercepts and modifies their browser URL, the Python API will return a `403 Forbidden` if their Role Enum is missing permissions for the requested route.
3. **Database Layer:** The `AuditLog` catches any attempt by lower-level users trying to fetch data not linked to their ID.
