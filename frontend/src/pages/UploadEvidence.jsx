import { useState } from "react";
import UploadForm from "../components/UploadForm";
import AIResultCard from "../components/AIResultCard";
import BlockchainInfo from "../components/BlockchainInfo";
import evidenceService from "../services/evidenceService";

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
      <h2>Upload Evidence</h2>
      <UploadForm onSubmit={handleUpload} loading={loading} />
      {error ? <p className="error-text">{error}</p> : null}
      {result ? (
        <div className="grid grid-two">
          <AIResultCard evidence={result} />
          <BlockchainInfo evidence={result} />
        </div>
      ) : null}
    </section>
  );
}

export default UploadEvidence;
