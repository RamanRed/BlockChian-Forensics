import Loader from "../components/Loader";
import { useFetch } from "../hooks/useFetch";
import { adminService } from "../services/dirsService";
import { HiOutlineShieldExclamation, HiOutlineShieldCheck } from "react-icons/hi";

function Quarantine() {
  const { data, loading, error } = useFetch(() => adminService.getQuarantine(), []);
  const items = Array.isArray(data) ? data : [];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Quarantine Zone</h2>
          <p className="page-subtitle">Evidence items flagged as suspicious by AI analysis</p>
        </div>
        {items.length > 0 && (
          <span className="badge badge-red">{items.length} flagged</span>
        )}
      </div>

      {loading && <Loader />}
      {error && <p className="error-text">Unable to load quarantined records.</p>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineShieldCheck style={{ color: "var(--success)" }} /></div>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>No quarantined evidence</p>
          <p className="text-sm text-muted">All evidence has passed AI analysis ✓</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid">
          {items.map((item) => (
            <div key={item.id} className="evidence-card" style={{ borderLeft: "3px solid var(--danger)" }}>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <strong>#{item.id} — {item.property_number || item.original_filename || "Unknown"}</strong>
                <span className="badge badge-red">
                  <HiOutlineShieldExclamation style={{ marginRight: 4 }} />
                  QUARANTINED
                </span>
              </div>
              {item.description && <p style={{ fontSize: "0.88rem", marginBottom: 8 }}>{item.description}</p>}
              {item.ai_score != null && (
                <p className="text-sm text-muted">
                  AI Score: <strong style={{ color: "var(--danger)" }}>{(item.ai_score * 100).toFixed(1)}% suspicious</strong>
                </p>
              )}
              {item.storage_location && (
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>📁 {item.storage_location}</p>
              )}
              {item.file_hash && (
                <div className="hash-mono" style={{ marginTop: 8, fontSize: "0.72rem" }}>
                  {item.file_hash.slice(0, 24)}…
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Quarantine;
