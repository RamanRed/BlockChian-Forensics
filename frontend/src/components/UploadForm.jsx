import { useState, useRef } from "react";
import { HiOutlineCloudUpload, HiOutlineDocumentAdd } from "react-icons/hi";

function UploadForm({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <form className="section-card" onSubmit={handleSubmit}>
      <div className="section-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HiOutlineCloudUpload style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
          <h3 style={{ margin: 0 }}>Upload Evidence File</h3>
        </div>
      </div>
      <div className="section-card-body">
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? "var(--primary)" : "var(--line)"}`,
            borderRadius: "var(--radius-sm)",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "var(--primary-soft)" : "var(--bg)",
            transition: "all var(--transition)",
            marginBottom: "1.25rem"
          }}
        >
          <HiOutlineDocumentAdd style={{ fontSize: "2rem", color: file ? "var(--success)" : "var(--text-muted)", marginBottom: "0.5rem" }} />
          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.92rem" }}>
            {file ? file.name : "Click or drag file to upload"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Supports images and videos up to 100MB"}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label>Case Number</label>
            <input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="CASE-2026-001" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the evidence..." />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit" disabled={loading} style={{ marginTop: "0.25rem" }}>
          <HiOutlineCloudUpload />
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </div>
    </form>
  );
}

export default UploadForm;
