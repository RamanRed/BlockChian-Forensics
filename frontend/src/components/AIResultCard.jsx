import { HiOutlineLightningBolt, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";

function AIResultCard({ evidence }) {
  if (!evidence) return null;

  const score = evidence.ai_score != null ? Math.round(evidence.ai_score * 100) : null;
  const isAuthentic = evidence.ai_status === "AUTHENTIC";

  return (
    <div className="section-card">
      <div className="section-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HiOutlineLightningBolt style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
          <h3 style={{ margin: 0 }}>AI Analysis</h3>
        </div>
        <span className={`badge badge-${isAuthentic ? "authentic" : "suspicious"}`}>
          {isAuthentic ? <HiCheckCircle /> : <HiExclamationCircle />}
          {evidence.ai_status}
        </span>
      </div>
      <div className="section-card-body">
        <div className="detail-grid">
          <div className="detail-item">
            <label>Confidence Score</label>
            <div className="detail-value" style={{ color: isAuthentic ? "var(--success)" : "var(--danger)" }}>
              {score != null ? `${score}%` : "-"}
            </div>
          </div>
          <div className="detail-item">
            <label>Model Version</label>
            <div className="detail-value">{evidence.model_version || "-"}</div>
          </div>
          <div className="detail-item">
            <label>Manipulation Type</label>
            <div className="detail-value">{evidence.manipulation_type || "Not detected"}</div>
          </div>
        </div>
        {score != null && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Authenticity</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: isAuthentic ? "var(--success)" : "var(--danger)" }}>{score}%</span>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 999, height: 8, overflow: "hidden" }}>
              <div style={{
                width: `${score}%`,
                height: "100%",
                borderRadius: 999,
                background: isAuthentic ? "var(--success)" : "var(--danger)",
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResultCard;
