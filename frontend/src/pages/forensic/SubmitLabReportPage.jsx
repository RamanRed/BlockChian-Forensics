import { useState, useContext } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { forensicSubmissionService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineBeaker,
  HiOutlineUpload,
  HiOutlineDocumentText,
} from "react-icons/hi";

function SubmitLabReportPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const preSelectedSubmission = router.query.submission || "";

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(preSelectedSubmission);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    observations: "",
    conclusion: "",
    file: null,
  });

  // Fetch pending submissions
  const { data: incoming, loading } = useFetch(() => forensicSubmissionService.getIncoming(), []);
  const submissions = Array.isArray(incoming) ? incoming : [];
  const pendingSubmissions = submissions.filter(s => s.status !== "completed");

  const selectedSubmission = submissions.find(s => String(s.id) === String(selectedSubmissionId));

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setForm(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmissionId || !form.observations || !form.conclusion || !form.file) {
      toast.error("Please fill all fields and select a file.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("observations", form.observations);
      formData.append("conclusion", form.conclusion);
      formData.append("file", form.file);

      await forensicSubmissionService.submitLabResult(selectedSubmissionId, formData);
      toast.success("Lab report submitted and anchored on blockchain ✓");
      setForm({ observations: "", conclusion: "", file: null });
      setSelectedSubmissionId("");
      router.push("/forensic/evidence");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit lab report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Submit Forensic Lab Report</h2>
          <p className="page-subtitle">Select the evidence submission, provide your analysis, and upload proof</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 800 }}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HiOutlineBeaker style={{ color: "var(--success)" }} />
          Lab Analysis Report
        </h3>

        {loading && <Loader />}

        {!loading && (
          <form onSubmit={handleSubmit}>
            {/* Select Submission */}
            <div className="form-group">
              <label>Select Evidence Submission *</label>
              <select
                className="input"
                value={selectedSubmissionId}
                onChange={(e) => setSelectedSubmissionId(e.target.value)}
                required
              >
                <option value="">— Choose Evidence Submission —</option>
                {pendingSubmissions.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — FIR/{s.fir_id} | Property #{s.property_id} [{s.status?.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {/* Submission Info */}
            {selectedSubmission && (
              <div style={{
                background: "#0e749010",
                border: "1px solid #0e749030",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
              }}>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.8 }}>
                  <div><strong>Submission ID:</strong> #{selectedSubmission.id}</div>
                  <div><strong>FIR ID:</strong> {selectedSubmission.fir_id}</div>
                  <div><strong>Property ID:</strong> {selectedSubmission.property_id}</div>
                  <div><strong>Submitted By:</strong> User #{selectedSubmission.submitted_by}</div>
                  <div><strong>IO Notes:</strong> {selectedSubmission.notes || "None"}</div>
                  <div><strong>Status:</strong>
                    <span className={`badge badge-${selectedSubmission.status === "pending" ? "yellow" : "blue"}`} style={{ marginLeft: 8 }}>
                      {selectedSubmission.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Observations */}
            <div className="form-group">
              <label>Lab Observations / What You Found *</label>
              <textarea
                className="input"
                rows={5}
                value={form.observations}
                onChange={(e) => setForm(f => ({ ...f, observations: e.target.value }))}
                placeholder="Describe what your forensic analysis revealed — methods used, findings, anomalies detected..."
                required
              />
            </div>

            {/* Conclusion */}
            <div className="form-group">
              <label>Lab Conclusion / Expert Opinion *</label>
              <textarea
                className="input"
                rows={4}
                value={form.conclusion}
                onChange={(e) => setForm(f => ({ ...f, conclusion: e.target.value }))}
                placeholder="Your professional conclusion — was the evidence tampered with? What does the analysis indicate? Final opinion..."
                required
              />
            </div>

            {/* File Upload */}
            <div className="form-group">
              <label>Upload Proof / Lab Report Document (PDF/Image) *</label>
              <input
                type="file"
                className="input"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                required
              />
              {form.file && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                  <HiOutlineDocumentText style={{ verticalAlign: "middle" }} /> {form.file.name} ({(form.file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Warning */}
            <div style={{
              background: "#f59e0b10",
              border: "1px solid #f59e0b30",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}>
              <HiOutlineUpload />
              This report will be permanently recorded on the blockchain and visible to IO, SP, DSP, Court, and other forensic officers. It cannot be modified after submission.
            </div>

            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Submitting Securely..." : "🔬 Submit Lab Report & Hash on Chain"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default SubmitLabReportPage;
