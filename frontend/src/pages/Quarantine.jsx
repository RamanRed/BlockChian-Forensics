import EvidenceCard from "../components/EvidenceCard";
import Loader from "../components/Loader";
import evidenceService from "../services/evidenceService";
import { useFetch } from "../hooks/useFetch";
import { HiOutlineShieldExclamation } from "react-icons/hi";

function Quarantine() {
  const { data, loading, error } = useFetch(() => evidenceService.getQuarantineList(), []);

  const items = data || [];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Quarantine Zone</h2>
          <p className="page-subtitle">Evidence flagged as suspicious by AI analysis</p>
        </div>
        {items.length > 0 && (
          <span className="badge badge-suspicious">{items.length} flagged</span>
        )}
      </div>

      {loading && <Loader />}
      {error && <p className="error-text">Unable to load quarantined records.</p>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineShieldExclamation /></div>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>No quarantined evidence</p>
          <p className="text-sm text-muted">All evidence has passed AI analysis</p>
        </div>
      )}

      <div className="grid">
        {items.map((item) => <EvidenceCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export default Quarantine;
