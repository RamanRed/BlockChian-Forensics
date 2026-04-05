# DIRS (Digital Investigation Record System) - Manual Testing Guide

This guide provides a complete, step-by-step walkthrough to manually test the DIRS platform end-to-end. It mimics a real-world criminal investigation under the Indian CrPC, from filing an FIR to validating evidence in Court.

## Prerequisites
Ensure all 3 layers of the system are running in your terminals:
1. **Blockchain:** `npx hardhat node` & `npx hardhat run scripts/deploy.js --network localhost`
2. **Backend:** `uvicorn main:app --reload --port 8000`
3. **Frontend:** `npm run dev` (Runs on `http://localhost:3000`)

---

## Step 0: Account Creation (Registration & Login)
1. Go to the **Register** page (`http://localhost:3000/register`).
2. Create an **Investigating Officer (IO)** account:
   - **Full Name:** `Inspector Singham`
   - **Email:** `io@dirs.in`
   - **Password:** `Password@123`
   - **Role:** Select `io` (Investigating Officer)
3. Click **Register**. Once successful, you will be redirected to Login.
4. **Login** with `io@dirs.in` and `Password@123`.

---

## Step 1: File the First Information Report (FIR)
*The legal starting point of the case.*

1. Navigate to **FIR Management** from the sidebar.
2. Click on the **Register New FIR** tab.
3. Fill in the exact values:
   - **FIR Number:** `FIR/2026/001`
   - **Complainant Name:** `Raman Patil`
   - **Date & Time of Incident:** `04-04-2026 23:30`
   - **Place of Incident:** `MG Road Cyber Cafe, Sector 4`
   - **Incident Details:** `Victim reported unauthorized access to their digital accounts and creation of a deepfake video used for financial extortion.`
   - **Known Suspects:** `Unknown`
4. Click **Register**. The FIR is now anchored to the blockchain.

---

## Step 2: Record a Case Diary Entry
*The chronological daily log of the IO.*

1. Navigate to **Case Diary**.
2. Make sure the toggle/tab is set to **Add Entry**.
3. Fill in the form:
   - **Select FIR:** Choose `FIR/2026/001` from the dropdown.
   - **Entry Details:** `Reached the crime scene at 10:00 AM. Interrogated the cafe owner. Found a suspicious laptop and a pendrive left behind by the suspect.`
4. Click **Save Entry**.

---

## Step 3: Create a Seizure Memo
*The contemporaneous document made when actively collecting evidence in front of witnesses.*

1. Navigate to **Seizure & Property**.
2. Click the **Create Seizure Memo** tab.
3. Fill in the exact values:
   - **FIR:** Choose `FIR/2026/001`
   - **Memo Number:** `SM-2026-001`
   - **Date & Time:** (Pick current time)
   - **Place of Seizure:** `Inside Cabin 4, MG Road Cyber Cafe`
   - **Witness 1 Name:** `Rahul Sharma` (Required by CrPC)
   - **Witness 1 Contact:** `9876543210`
   - **Items Description:** `1x Dell Inspiron Laptop (Black), 1x Sandisk Pendrive 64GB`
4. Click **Create Seizure Memo**. 

---

## Step 4: Register Digital Evidence (Malkhana / Property)
*Uploading digital evidence items linked to the Seizure Memo.*

1. Stay on **Seizure & Property**, but click the **Register Digital Evidence** tab.
2. Fill inside the form:
   - **Seizure Memo:** Choose the dropdown item `SM-2026-001 (FIR: 1)`
   - **Property Number:** `PROP-01-PEND`
   - **Description:** `Deepfake source video extracted from Sandisk Pendrive`
   - **Item Type:** `Digital`
   - **Storage Location:** `CFSL-Locker-A`
   - **Evidence File:** Select a small mock image or `.mp4` file from your desktop.
3. Click **Register & Analyse**.
   - *Behind the scenes: The system will generate a SHA-256 hash of the file, pass it to the HuggingFace Deepfake AI Model, and store the resulting AI score on the Blockchain.*

---

## Step 5: Transfer Chain of Custody (Optional)
*Handing evidence over to the Forensic Lab (CFSL).*

1. Navigate to **Chain of Custody**.
2. Select your newly created Evidence/Property from the dropdown list.
3. **To Person:** (You can type `CFSL Agent` or an ID depending on the dropdown).
4. **Reason:** `Sending for advanced deepfake laboratory analysis.`
5. Click **Transfer Custody**.

---

## Step 6: File the Charge Sheet
*Final report submitted to the court after investigation.*

1. Navigate to **Charge Sheet**.
2. Click **Draft Charge Sheet**.
3. Fill the details:
   - **FIR Name:** Choose `FIR/2026/001`
   - **Court Name:** `District Digital Cyber Court`
   - **Investigating Officer:** (Your name/ID)
   - **Charges (IPC/BNS):** `Section 318(4) BNS, Section 66E IT Act`
   - **Accused Persons:** `John Doe (Arrested)`
   - **Summary of Facts:** `AI analysis confirmed the video was highly manipulated (Deepfake). IP address logs attach the suspect to the cafe.`
4. Click **Submit Final Report**.

---

## Step 7: Court & Blockchain Verification
*Proving to the Judge that evidence was NOT tampered with.*

1. Go to the **Court / Verify** sidebar tab.
2. Go to the list of Evidence or FIRs and copy the **Blockchain TX Hash** (Should start with `0x...`).
3. Paste the hash or the Evidence ID into the **Verify** search bar.
4. The system queries the local Hardhat Node/Smart Contract, comparing the original SHA-256 uploaded in Step 4 to the current database copy.
5. You should see a green **"VERIFIED: Data perfectly matches the blockchain record"** alert, establishing zero-trust proof.

---

## Step 8: Supervisor Review (SP / DSP)
*Supervisory officers reviewing the entire jurisdiction's files.*

1. **Logout** from your IO account.
2. **Register & Login** with a new account:
   - **Email:** `sp@dirs.in` (Password: `Password@123`)
   - **Role:** `sp` (Superintendent of Police) or `dsp`
3. Navigate through **FIR Management**, **Case Diary**, and **Charge Sheet** tabs.
4. *Test outcome:* Notice that unlike the IO (who only sees their own assigned cases), the SP/DSP can view `FIR/2026/001`, the Seizure Memos, and the finalized Charge Sheet directly, bypassing the ownership restriction.

---

## Step 9: Forensic Lab Processing (CFSL)
*Receiving evidence sent via Chain of Custody in Step 5.*

1. **Logout** and **Register & Login** as:
   - **Email:** `cfsl@dirs.in`
   - **Role:** `cfsl` (Forensic Scientist)
2. Navigate to **Chain of Custody** or **Seizure & Property**.
3. *Test outcome:* You should be able to view the transferred digital evidence (`PROP-01-PEND`) that was handed over to CFSL for deepfake laboratory analysis.

---

## Step 10: Court Trial & Proceedings (Court & Lawyer)
*Conducting the trial and providing read-only access to defense.*

1. **Logout** and **Register & Login** as the Judge:
   - **Email:** `judge@dirs.in`
   - **Role:** `court` (Judicial Officer)
2. Navigate to the **Court / Verify** section.
3. You will now see the previously hidden **Add Proceeding** tab (which was locked for the IO).
4. Fill the details:
   - **Select Charge Sheet:** Choose the `FIR/2026/001` charge sheet filed in Step 6.
   - **Hearing Date:** (Pick today's date)
   - **Next Hearing Date:** (Pick a date next week)
   - **Judge Notes:** `Initial hearing started. CFSL report on deepfake video admitted as primary evidence. Defense granted access to case files.`
   - **Order Summary:** `Accused remanded to further judicial custody.`
5. Click **Save Proceeding**.
6. **Logout** and **Register & Login** as the Defence:
   - **Email:** `lawyer@dirs.in`
   - **Role:** `lawyer` (Defence/Prosecution)
7. *Test outcome:* Navigate through the system and observe that the lawyer has strict **read-only access** to the final proceedings and unsealed evidence, but cannot add or modify any records.

---

## Step 11: Audit Trail Verification (Auditor / Admin)
*Checking the immutable operational logs.*

1. **Logout** and **Register & Login** as:
   - **Email:** `auditor@dirs.in`
   - **Role:** `auditor`
2. Navigate to the **Audit / Logs** section (if exposed on your frontend sidebar).
3. *Test outcome:* You will see a chronological log of every action taken in Steps 1-10 (e.g., who viewed the FIR, who downloaded the video, who transferred custody). This ensures zero-trust compliance against police data tampering.

---

### Troubleshooting Common Errors during Testing
- **401 Unauthorized:** Your login JWT session expired. Go back to Login.
- **409 Conflict (Seizure):** You combined an already existing `SM-2026-001` memo number. Just increment to `002`.
- **404 Not Found (Frontend):** Ensure the dropdowns successfully loaded data from previous steps. 
