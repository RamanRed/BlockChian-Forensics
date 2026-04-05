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
import TimelineEvent, { EVENT_CONFIG } from "../../components/TimelineEvent";



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
