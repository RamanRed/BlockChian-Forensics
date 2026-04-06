import { useRouter } from "next/router";
import Link from "next/link";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { chargesheetService, courtService } from "../../services/dirsService";
import { HiOutlineClipboardCheck, HiOutlineShieldCheck } from "react-icons/hi";

function ChargesheetDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { data, loading, error } = useFetch(
    () => (id ? chargesheetService.getById(id) : Promise.resolve(null)),
    [id]
  );
  const cs = data?.data || data;

  const { data: proceedings, loading: pLoading } = useFetch(
    () => (id ? courtService.getProceedings(id) : Promise.resolve([])),
    [id]
  );
  const proceedingsList = Array.isArray(proceedings) ? proceedings : [];

  if (loading) return <Loader />;
  if (error || !cs) return (
    <section>
      <div className="page-header">
        <Link href="/chargesheet" className="btn btn-secondary">← Back</Link>
      </div>
      <p className="error-text">Charge Sheet not found.</p>
    </section>
  );

  const statusColor = cs.status === "filed" ? "green" : cs.status === "draft" ? "yellow" : "blue";

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Charge Sheet {cs.chargesheet_number}</h2>
          <p className="page-subtitle">Final Report — Section 173 CrPC</p>
        </div>
        <div className="row-gap">
          <span className={`badge badge-${statusColor}`}>{cs.status?.toUpperCase()}</span>
          <Link href="/chargesheet" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div className="form-card">
        <h3 style={{ marginTop: 0 }}>Charge Sheet Details</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>CS Number</label>
            <div className="detail-value">{cs.chargesheet_number}</div>
          </div>
          <div className="detail-item">
            <label>FIR ID</label>
            <div className="detail-value">
              <Link href={`/fir/${cs.fir_id}`} style={{ color: "var(--primary)" }}>#{cs.fir_id}</Link>
            </div>
          </div>
          <div className="detail-item">
            <label>Status</label>
            <div className="detail-value">
              <span className={`badge badge-${statusColor}`}>{cs.status?.toUpperCase()}</span>
            </div>
          </div>
          <div className="detail-item">
            <label>Assigned Court</label>
            <div className="detail-value">
              {cs.assigned_court_name ? (
                <span className="badge badge-blue">{cs.assigned_court_name}</span>
              ) : (
                <span className="text-muted">Not assigned</span>
              )}
            </div>
          </div>
          <div className="detail-item">
            <label>Created At</label>
            <div className="detail-value">
              {cs.created_at ? new Date(cs.created_at).toLocaleString("en-IN") : "—"}
            </div>
          </div>
          {cs.filed_at && (
            <div className="detail-item">
              <label>Filed At</label>
              <div className="detail-value">{new Date(cs.filed_at).toLocaleString("en-IN")}</div>
            </div>
          )}
        </div>

        {cs.offence_summary && (
          <div style={{ marginTop: "1rem" }}>
            <div className="info-label">Offence Summary</div>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: "0.4rem" }}>{cs.offence_summary}</p>
          </div>
        )}

        {cs.io_conclusion && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className="info-label">IO Conclusion</div>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: "0.4rem" }}>{cs.io_conclusion}</p>
          </div>
        )}

        {cs.data_hash && (
          <div style={{ marginTop: "1rem" }}>
            <div className="info-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <HiOutlineShieldCheck /> Blockchain Hash
            </div>
            <div className="hash-mono">{cs.data_hash}</div>
          </div>
        )}

        {cs.blockchain_tx && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className="info-label">Transaction Hash</div>
            <div className="hash-mono">{cs.blockchain_tx}</div>
          </div>
        )}
      </div>

      {/* Court Proceedings */}
      <div className="form-card">
        <h3 style={{ marginTop: 0 }}>
          <HiOutlineClipboardCheck style={{ verticalAlign: "middle", marginRight: 8 }} />
          Court Proceedings
        </h3>
        {pLoading && <Loader />}
        {!pLoading && proceedingsList.length === 0 && (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <p className="text-muted">No court proceedings recorded yet.</p>
          </div>
        )}
        {proceedingsList.length > 0 && (
          <div className="timeline">
            {proceedingsList.map((p) => (
              <div key={p.id} className="timeline-item">
                <div className="evidence-card" style={{ padding: "0.75rem 1rem" }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <strong style={{ fontSize: "0.85rem" }}>{p.court_name}</strong>
                    <span className="text-muted text-sm">
                      {p.hearing_date ? new Date(p.hearing_date).toLocaleDateString("en-IN") : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.88rem" }}>{p.notes}</p>
                  {p.next_date && (
                    <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                      Next date: {new Date(p.next_date).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ChargesheetDetail;
