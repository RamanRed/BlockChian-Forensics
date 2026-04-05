import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { firService, courtService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineDocumentText,
  HiOutlineBookOpen,
  HiOutlineArchive,
  HiOutlineSwitchHorizontal,
  HiOutlineBeaker,
  HiOutlineClipboardCheck,
  HiOutlineScale,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineEye,
} from "react-icons/hi";

/* ── Event type config ─────────────────────────────────────── */
const EVENT_CONFIG = {
  fir_registered:        { icon: <HiOutlineDocumentText />, label: "FIR Registered",        color: "#4f46e5", bg: "#4f46e510" },
  diary_entry:           { icon: <HiOutlineBookOpen />,     label: "Case Diary Entry",      color: "#0891b2", bg: "#0891b210" },
  seizure_memo:          { icon: <HiOutlineArchive />,      label: "Seizure Memo",           color: "#7c3aed", bg: "#7c3aed10" },
  evidence_registered:   { icon: <HiOutlineArchive />,      label: "Evidence Registered",    color: "#059669", bg: "#05966910" },
  custody_transfer:      { icon: <HiOutlineSwitchHorizontal />, label: "Custody Transfer",  color: "#d97706", bg: "#d9770610" },
  forensic_submission:   { icon: <HiOutlineBeaker />,       label: "Forensic Submission",    color: "#0e7490", bg: "#0e749010" },
  investigation_finding: { icon: <HiOutlineLightningBolt />,label: "Investigation Finding",  color: "#6366f1", bg: "#6366f110" },
  chargesheet_filed:     { icon: <HiOutlineClipboardCheck />,label: "Chargesheet Filed",     color: "#dc2626", bg: "#dc262610" },
  court_proceeding:      { icon: <HiOutlineScale />,        label: "Court Proceeding",       color: "#be185d", bg: "#be185d10" },
  court_verdict:         { icon: <HiOutlineScale />,        label: "Court Verdict",          color: "#dc2626", bg: "#dc262620" },
};

function TimelineEvent({ event }) {
  const cfg = EVENT_CONFIG[event.type] || { icon: <HiOutlineEye />, label: event.type, color: "#64748b", bg: "#64748b10" };
  const data = event.data || {};
  const ts = event.timestamp ? new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "10px",
          background: cfg.bg, border: `2px solid ${cfg.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: cfg.color, fontSize: "1rem", flexShrink: 0,
        }}>{cfg.icon}</div>
        <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 4 }} />
      </div>
      <div style={{
        flex: 1, background: "var(--card-bg)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "1rem 1.25rem", borderLeft: `3px solid ${cfg.color}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{ts}</span>
        </div>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
          {Object.entries(data).filter(([k, v]) => v && k !== "blockchain_tx" && k !== "ipfs_cid").map(([k, v]) => (
            <div key={k}>
              <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}:</span>{" "}
              <span>{String(v).length > 200 ? String(v).slice(0, 200) + "…" : String(v)}</span>
            </div>
          ))}
        </div>
        {data.blockchain_tx && (
          <div style={{
            marginTop: "0.5rem", padding: "4px 8px", background: "#05966915",
            borderRadius: "6px", fontSize: "0.75rem", color: "#059669",
            fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <HiOutlineShieldCheck /> {data.blockchain_tx.slice(0, 24)}…
          </div>
        )}
      </div>
    </div>
  );
}

function ChainOfEventsPage() {
  const { role } = useContext(AuthContext);
  const [selectedFirId, setSelectedFirId] = useState("");

  const { data: firsData, loading: firsLoading } = useFetch(() => firService.list({ limit: 500 }), []);
  const firs = Array.isArray(firsData) ? firsData : [];

  const { data: chainData, loading: chainLoading } = useFetch(
    () => selectedFirId ? courtService.getChainOfEvents(selectedFirId) : Promise.resolve(null),
    [selectedFirId]
  );

  const timeline = chainData?.timeline || [];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Chain of Events</h2>
          <p className="page-subtitle">View the full investigation timeline — all actions, findings, forensics, and verdicts</p>
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
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Select Case (FIR)</label>
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
          <div className="empty-state-icon"><HiOutlineDocumentText /></div>
          <p>Select a case to view its complete chain of events.</p>
        </div>
      )}

      {selectedFirId && chainLoading && <Loader />}

      {selectedFirId && !chainLoading && timeline.length === 0 && (
        <div className="empty-state">
          <p>No events recorded for this case yet.</p>
        </div>
      )}

      {selectedFirId && !chainLoading && timeline.length > 0 && (
        <>
          {/* Summary badges */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <span style={{
              background: "#4f46e510", color: "#4f46e5",
              padding: "4px 12px", borderRadius: "20px",
              fontSize: "0.78rem", fontWeight: 700,
              border: "1px solid #4f46e530",
            }}>
              {chainData.fir_number} — {timeline.length} Events
            </span>
            {Object.entries(
              timeline.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {})
            ).map(([type, count]) => {
              const cfg = EVENT_CONFIG[type] || {};
              return (
                <span key={type} style={{
                  background: cfg.bg || "#f1f5f9", color: cfg.color || "#64748b",
                  padding: "4px 12px", borderRadius: "20px",
                  fontSize: "0.78rem", fontWeight: 600,
                  border: `1px solid ${cfg.color || "#cbd5e1"}30`,
                }}>
                  {cfg.label || type} ({count})
                </span>
              );
            })}
          </div>

          {/* Timeline */}
          <div style={{ maxWidth: 800 }}>
            {timeline.map((event, idx) => (
              <TimelineEvent key={idx} event={event} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default ChainOfEventsPage;
