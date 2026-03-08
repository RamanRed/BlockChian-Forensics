import { useState } from "react";
import UploadForm from "../components/UploadForm";
import AIResultCard from "../components/AIResultCard";
import BlockchainInfo from "../components/BlockchainInfo";
import evidenceService from "../services/evidenceService";
import { HiCheckCircle } from "react-icons/hi";

function UploadEvidence() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleUpload = async (formData) => {
    setLoading(true);
    setError("");
    try {
      const data = await evidenceService.uploadEvidence(formData);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Upload Evidence</h2>
          <p className="page-subtitle">Submit digital evidence for AI analysis and blockchain storage</p>
        </div>
      </div>

      {!result && <UploadForm onSubmit={handleUpload} loading={loading} />}
      {error && <p className="error-text">{error}</p>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ background: "var(--success-light)", border: "none", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem" }}>
            <HiCheckCircle style={{ fontSize: "1.5rem", color: "var(--success)" }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--success)" }}>Evidence uploaded successfully</div>
              <div style={{ fontSize: "0.85rem", color: "var(--success)", opacity: 0.8 }}>AI analysis and blockchain recording complete</div>
            </div>
          </div>
          <div className="grid grid-two">
            <AIResultCard evidence={result} />
            <BlockchainInfo evidence={result} />
          </div>
          <button className="btn btn-secondary" onClick={() => setResult(null)} style={{ alignSelf: "flex-start" }}>
            Upload Another
          </button>
        </div>
      )}
    </section>
  );
}

export default UploadEvidence;
