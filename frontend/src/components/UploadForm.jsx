import { useState } from "react";

function UploadForm({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Select a file before uploading.");
      return;
    }
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    if (caseNumber) formData.append("case_number", caseNumber);
    if (description) formData.append("description", description);
    await onSubmit(formData);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Upload Evidence</h3>
      <label>File</label>
      <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <label>Case Number</label>
      <input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="CASE-2026-001" />

      <label>Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

      {error ? <p className="error-text">{error}</p> : null}
      <button className="btn" type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
    </form>
  );
}

export default UploadForm;
