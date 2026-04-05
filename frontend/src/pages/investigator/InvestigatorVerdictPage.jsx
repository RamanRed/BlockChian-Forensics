import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { firService, verdictService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineScale,
  HiOutlineSearch,
  HiOutlineCheckCircle,
} from "react-icons/hi";

const VERDICT_COLORS = {
  conviction: "#dc2626",
  acquittal: "#059669",
  adjourn: "#d97706",
  further_investigation: "#0891b2",
  discharge: "#64748b",
  compounded: "#7c3aed",
};

function InvestigatorVerdictPage() {
  const { user, role } = useContext(AuthContext);
  const [selectedFirId, setSelectedFirId] = useState("");

  const { data: firsData, loading: firsLoading } = useFetch(() => firService.list({ limit: 500 }), []);
  const firs = Array.isArray(firsData) ? firsData : [];

  const { data: verdicts, loading: vLoading } = useFetch(
    () => selectedFirId ? verdictService.getByFir(selectedFirId) : Promise.resolve([]),
    [selectedFirId]
  );
  const verdictList = Array.isArray(verdicts) ? verdicts : [];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Court Verdicts</h2>
          <p className="page-subtitle">View court verdicts issued for your cases</p>
        </div>
        <span style={{
          background: "#4f46e520",
          color: "#4f46e5",
          borderRadius: "8px",
          padding: "6px 14px",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}>
          Role: {role?.toUpperCase()}
        </span>
      </div>

      {/* Case Selector */}
      <div className="form-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>
          <HiOutlineSearch style={{ verticalAlign: "middle", marginRight: 6 }} />
          Select Case to View Verdict
        </h3>
        <div className="form-group">
          <label>FIR / Case</label>
          {firsLoading ? <Loader /> : (
            <select
              className="input"
              value={selectedFirId}
              onChange={(e) => setSelectedFirId(e.target.value)}
            >
              <option value="">— Choose Case —</option>
              {firs.map(f => (
                <option key={f.id} value={f.id}>
                  {f.fir_number} — {f.police_station} [{f.status?.toUpperCase()}]
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results */}
      {!selectedFirId && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineScale /></div>
          <p>Select a case to view its court verdicts.</p>
        </div>
      )}

      {selectedFirId && vLoading && <Loader />}

      {selectedFirId && !vLoading && verdictList.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineScale /></div>
          <p>No verdicts have been issued for this case yet.</p>
        </div>
      )}

      {selectedFirId && !vLoading && verdictList.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {verdictList.map(v => (
            <div key={v.id} className="form-card" style={{
              borderLeft: `4px solid ${VERDICT_COLORS[v.verdict_type] || "#64748b"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <span style={{
                    fontWeight: 700, fontSize: "1rem",
                    color: VERDICT_COLORS[v.verdict_type] || "#64748b",
                    textTransform: "uppercase",
                  }}>
                    {v.verdict_type?.replace("_", " ")}
                  </span>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {v.court_name} — Judge {v.judge_name}
                  </div>
                </div>
                <span className="badge badge-blue">
                  {v.verdict_date ? new Date(v.verdict_date).toLocaleDateString("en-IN") : ""}
                </span>
              </div>

              <div style={{ fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                <strong>Verdict Summary:</strong>
                <p style={{ margin: "4px 0" }}>{v.verdict_summary}</p>
              </div>

              {v.reasoning && (
                <div style={{ fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                  <strong>Reasoning:</strong>
                  <p style={{ margin: "4px 0", color: "var(--text-muted)" }}>{v.reasoning}</p>
                </div>
              )}

              {v.sentence && (
                <div style={{
                  background: "#dc262610",
                  border: "1px solid #dc262630",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  marginBottom: "0.75rem",
                }}>
                  <strong style={{ color: "#dc2626" }}>Sentence:</strong> {v.sentence}
                </div>
              )}

              {v.next_hearing_date && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  📅 Next Hearing: <strong>{new Date(v.next_hearing_date).toLocaleDateString("en-IN")}</strong>
                </p>
              )}

              {v.blockchain_tx && (
                <div style={{
                  marginTop: "0.5rem", padding: "4px 8px", background: "#05966915",
                  borderRadius: "6px", fontSize: "0.75rem", color: "#059669",
                  fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <HiOutlineCheckCircle /> Blockchain: {v.blockchain_tx.slice(0, 24)}…
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default InvestigatorVerdictPage;
