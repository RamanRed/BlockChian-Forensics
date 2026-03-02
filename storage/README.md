evidence/suspicious/
save_ai_report(hash, ai_result)

Stores JSON in:

metadata/ai_reports/
create_binding_record(hash, ai_result, metadata, tx, cid)

Creates immutable record in:

metadata/binding_records/
retrieve_file(hash)

Searches:

authentic/

suspicious/

Returns file path.

verify_integrity(hash)

Recomputes SHA-256
Compares with stored binding record
Returns True/False.

🔒 Security Measures in Storage

✔ File type validation
✔ MIME type check
✔ Max file size
✔ Hash-based naming
✔ Read-only after final save
✔ Audit logging
✔ No direct public file access

Access only through backend.

🔁 Full Storage Workflow
1. User uploads file
2. Save in temp/
3. AI analysis
4. Generate SHA-256
5. Store AI JSON
6. Bind evidence
7. Store on blockchain
8. Move file:
     → authentic/ OR suspicious/
9. Log action
💡 If Using IPFS

Then flow becomes:

temp/ → upload to IPFS → get CID
→ store CID on blockchain
→ keep local copy for redundancy

You do NOT need paid IPFS.

Local node is fine for college.

🧠 Why This Structure Is Strong

Because it supports:

Legal traceability

Auditability

Tamper detection

Chain-of-custody

Academic clarity

Demonstration simplicity

🎓 For Viva Explanation

If professor asks:

"Why separate authentic and suspicious?"

You answer:

To maintain forensic completeness and preserve manipulated evidence attempts for audit and legal traceability.

That’s a strong answer.