📘 Frontend – Digital Evidence Preservation System
🎯 Frontend Objective

The frontend provides:

Secure user authentication

Evidence upload interface

AI result visualization

Blockchain transaction transparency

Evidence verification

Admin monitoring panel

Audit trail visualization

It must:

Be secure

Be clean

Be explainable

Show blockchain transparency clearly (very important for demo)

📁 Frontend Folder Structure
frontend/
│
├── public/
│   └── index.html
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UploadEvidence.jsx
│   │   ├── EvidenceDetails.jsx
│   │   ├── VerifyEvidence.jsx
│   │   ├── Quarantine.jsx
│   │   ├── AuditLogs.jsx
│   │   └── AdminPanel.jsx
│   │
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── EvidenceCard.jsx
│   │   ├── AIResultCard.jsx
│   │   ├── BlockchainInfo.jsx
│   │   ├── UploadForm.jsx
│   │   ├── HeatmapViewer.jsx
│   │   ├── StatusBadge.jsx
│   │   └── Loader.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── evidenceService.js
│   │   ├── verificationService.js
│   │   ├── adminService.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── hashShortener.js
│   │   ├── roleUtils.js
│   │
│   └── styles/
│       ├── global.css
│       └── layout.css
│
└── package.json
🔷 CORE FILES
1️⃣ main.jsx
Responsibility:

React root initialization

Wrap app with:

BrowserRouter

AuthProvider

2️⃣ App.jsx
Responsibility:

Layout wrapper

Navbar inclusion

Sidebar layout

Route rendering

🔐 AUTHENTICATION SYSTEM
context/AuthContext.jsx
Responsibility:

Global authentication state management.

Stores:

user

token

role

login()

logout()

Handles:

Save JWT in localStorage

Attach token to API headers

hooks/useAuth.js
Responsibility:

Custom hook to access auth state.

components/ProtectedRoute.jsx
Responsibility:

Prevent unauthorized access

Redirect to login if no token

Optional role restriction

Example logic:

if (!token) redirect("/login")
if (role !== requiredRole) redirect("/dashboard")
🌐 ROUTE STRUCTURE
routes/AppRoutes.jsx
Routes:
/login
/register
/dashboard
/upload
/evidence/:id
/verify/:id
/quarantine
/audit
/admin

All except login/register wrapped in ProtectedRoute.

📄 PAGES
1️⃣ Login.jsx
Features:

Email input

Password input

Call authService.login()

Store token

Redirect to dashboard

2️⃣ Register.jsx
Features:

Role selection (investigator/admin/auditor)

Password confirmation

Validation errors

3️⃣ Dashboard.jsx
Features:

List of all evidence

Status filter:

Authentic

Suspicious

All

Quick stats:

Total uploaded

Authentic count

Suspicious count

EvidenceCard components

4️⃣ UploadEvidence.jsx
Core Feature Page

Uses:

UploadForm.jsx

Upload Flow:

Select file

Validate type (image/video)

Send multipart/form-data

Show loader

Display:

AI Score

AI Status

Blockchain TX hash

CID

Timestamp

5️⃣ EvidenceDetails.jsx

Displays:

Original filename

AI score

Model version

Blockchain transaction hash

CID

Submitter

Timestamp

Status badge

Includes:

BlockchainInfo.jsx
AIResultCard.jsx

6️⃣ VerifyEvidence.jsx
Feature:

User clicks "Verify Integrity"

Frontend:

Calls backend verification endpoint

Shows:

Hash matched ✅

Hash mismatch ❌

Blockchain timestamp

7️⃣ Quarantine.jsx

Visible only to:

Admin

Investigators

Shows:

Suspicious evidence

AI manipulation type

Confidence score

Option to re-run AI analysis

8️⃣ AuditLogs.jsx

Displays:

User

Action

Evidence ID

Timestamp

Filters:

By user

By action

By date

9️⃣ AdminPanel.jsx

Features:

View all users

Role management

Delete evidence (restricted)

View system statistics

🧩 COMPONENTS
EvidenceCard.jsx

Displays summary:

Filename

Status badge

AI score

View button

AIResultCard.jsx

Displays:

AI confidence score

Status

Manipulation type

Model version

Optional heatmap preview

BlockchainInfo.jsx

Displays:

Shortened hash

CID

Block number

Transaction hash

Link to local blockchain explorer (if used)

UploadForm.jsx

Handles:

File validation

Preview

Submission

Progress bar

StatusBadge.jsx

Visual indicator:

Green → AUTHENTIC

Red → SUSPICIOUS

Yellow → PENDING

HeatmapViewer.jsx

Displays:

Grad-CAM overlay

Toggle on/off

Download option

🔌 SERVICES (API LAYER)
api.js

Central Axios configuration.

Adds:

Base URL

Authorization header interceptor

Global error handler

authService.js

Functions:

login()

register()

logout()

getProfile()

evidenceService.js

Functions:

uploadEvidence()

getAllEvidence()

getEvidenceById()

getQuarantineList()

verificationService.js

Functions:

verifyEvidence(evidenceId)

adminService.js

Functions:

getAuditLogs()

getUsers()

updateUserRole()

🔒 SECURITY FEATURES

JWT stored securely

Automatic token expiry handling

Protected routes

Role-based UI rendering

File type validation

Max size enforcement

🎨 UI DESIGN PRINCIPLES

Keep:

Minimal

Clean

Forensic theme (dark blue / gray)

Dashboard-style layout

Clear blockchain visibility

Very important:

Blockchain info must be visible clearly during demo.

🔁 FULL USER FLOW

Login

Upload evidence

AI analysis shown

Blockchain confirmation shown

Evidence saved

Later → Verify integrity

Admin can audit

🎓 Academic Demonstration Features

During viva/demo, you show:

Upload file

AI detects deepfake

Blockchain transaction hash generated

Refresh page

Verify integrity

Show audit logs

That will impress.

🧠 Advanced Optional Additions

Real-time WebSocket update after blockchain confirmation

Merkle proof display

Download verification certificate (PDF)

Graph visualization of chain-of-custody