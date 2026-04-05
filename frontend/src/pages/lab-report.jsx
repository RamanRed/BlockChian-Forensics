import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import { HiOutlineDocumentText } from "react-icons/hi";
import { findingsService, firService } from "../services/dirsService";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";

function LabReport() {
  const { role } = useAuth();
  const [tab, setTab] = useState(role === "cfsl" ? "upload" : "view");
  const [form, setForm] = useState({
    firId: "",
    title: "",
    description: "",
    labReferenceNumber: "",
    labName: "",
    file: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data: firs, loading: firLoading } = useFetch(() => firService.list(), []);
  
  // To handle view tab
  const [viewFirId, setViewFirId] = useState("");
  const [reports, setReports] = useState([]);
  const [fetchingReports, setFetchingReports] = useState(false);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!form.firId || !form.file || !form.title) {
      setError("FIR, Title, and File are required to upload a lab report.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("lab_reference_number", form.labReferenceNumber);
      formData.append("lab_name", form.labName);
      formData.append("file", form.file);

      const res = await findingsService.uploadLabReport(form.firId, formData);
      setSuccess(`Lab report successfully uploaded and anchored to blockchain (Hash: ${res.file_hash.substring(0, 16)}...)`);
      setForm({ ...form, title: "", description: "", labReferenceNumber: "", file: null });
      document.getElementById("labFileUploader").value = "";
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Verify FIR number.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchReports = async (e) => {
    e.preventDefault();
    if (!viewFirId) return;
    setFetchingReports(true);
    setReports([]);
    try {
      const res = await findingsService.getLabReports(viewFirId);
      setReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingReports(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Forensic Lab Network</h2>
          <p className="page-subtitle">Upload & View CFSL Investigation Findings</p>
        </div>
      </div>

      <div className="filter-row">
        {role === "cfsl" && (
          <button className={tab === "upload" ? "btn" : "btn btn-secondary"} onClick={() => setTab("upload")}>Upload Lab Report</button>
        )}
        <button className={tab === "view" ? "btn" : "btn btn-secondary"} onClick={() => setTab("view")}>View Network Reports</button>
      </div>

      {tab === "upload" && role === "cfsl" && (
        <div className="form-card">
          <h3>Submit New Forensic Analysis</h3>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>Your findings will be immutably linked to the case timeline.</p>
          
          <form onSubmit={handleUploadSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Target FIR / Case *</label>
                <select value={form.firId} onChange={(e) => setForm({ ...form, firId: e.target.value })} required>
                  <option value="">-- Select FIR --</option>
                  {(firs?.items || []).map((f) => (
                    <option key={f.id} value={f.id}>{f.fir_number}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Report Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Deepfake Source Validation" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lab Reference Number</label>
                <input value={form.labReferenceNumber} onChange={(e) => setForm({ ...form, labReferenceNumber: e.target.value })} placeholder="e.g. CFSL-2026-991" />
              </div>
              <div className="form-group">
                <label>Lab Name</label>
                <input value={form.labName} onChange={(e) => setForm({ ...form, labName: e.target.value })} placeholder="e.g. Central Forensic Lab, Delhi" />
              </div>
            </div>

             <div className="form-group">
              <label>Findings Summary</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" placeholder="Briefly describe the analytical results or testing methods applied..."></textarea>
            </div>

            <div className="form-group">
              <label>Attach Official PDF/Evidence *</label>
              <input id="labFileUploader" type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required />
            </div>

            {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
            {success && <p className="success-text" style={{ marginTop: "1rem", color: "var(--success)", fontWeight: 500 }}>{success}</p>}

            <button type="submit" className="btn" style={{ marginTop: "1rem" }} disabled={loading}>
              {loading ? "Uploading to Blockchain..." : "Securely Submit Report"}
            </button>
          </form>
        </div>
      )}

      {tab === "view" && (
        <div className="card">
          <h3>View Reports by FIR</h3>
          <form className="filter-row" onSubmit={handleFetchReports}>
            <select value={viewFirId} onChange={(e) => setViewFirId(e.target.value)} required>
                <option value="">-- Select FIR --</option>
                {(firs?.items || []).map((f) => (
                  <option key={f.id} value={f.id}>{f.fir_number}</option>
                ))}
            </select>
            <button type="submit" className="btn" disabled={fetchingReports}>Search</button>
          </form>
          
          {fetchingReports && <Loader />}
          {!fetchingReports && reports.length === 0 && <p className="text-muted" style={{ marginTop: "1rem" }}>No lab reports found for this FIR.</p>}
          
          {reports.map((report) => (
            <div key={report.id} className="evidence-card" style={{ marginTop: "1rem" }}>
              <div className="flex-between">
                 <strong>{report.title}</strong>
                 <span className="badge badge-purple">{report.lab_name || "CFSL Network"}</span>
              </div>
              <p style={{ marginTop: "0.5rem" }}>{report.description}</p>
              {report.lab_reference_number && <p className="text-sm text-muted"><strong>Ref:</strong> {report.lab_reference_number}</p>}
              <div className="flex-between" style={{ marginTop: "1rem" }}>
                <div className="hash-mono">Hash: {report.file_hash.substring(0, 24)}...</div>
                {report.ipfs_cid && (
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${report.ipfs_cid}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-sm btn-secondary"
                  >
                    Download Findings
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default LabReport;