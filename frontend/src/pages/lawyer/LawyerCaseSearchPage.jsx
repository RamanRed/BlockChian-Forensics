import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { firService, courtService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineSearch,
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
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import TimelineEvent, { EVENT_CONFIG } from "../../components/TimelineEvent";


/* ── Main Lawyer Page ────────────────────────────────────────── */
function LawyerCaseSearchPage() {
  const [search, setSearch] = useState("");
  const [selectedFir, setSelectedFir] = useState(null); // { id, fir_number, police_station, status }
  const [chainLoading, setChainLoading] = useState(false);
  const [chainData, setChainData] = useState(null);
  const [chainError, setChainError] = useState("");

  /* Fetch all FIRs for search/selection */
  const { data: firsData, loading: firsLoading } = useFetch(() => firService.list({ limit: 500 }), []);
  const allFirs = Array.isArray(firsData) ? firsData : firsData?.data || [];

  /* Filter FIRs based on search input */
  const filtered = allFirs.filter(f => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      f.fir_number?.toLowerCase().includes(s) ||
      f.police_station?.toLowerCase().includes(s) ||
      f.district?.toLowerCase().includes(s) ||
      f.offence_sections?.toLowerCase().includes(s) ||
      f.complainant_name?.toLowerCase().includes(s) ||
      String(f.id).includes(s)
    );
  });

  /* Load chain of events for selected FIR */
  const handleViewChain = async (fir) => {
    setSelectedFir(fir);
    setChainData(null);
    setChainError("");
    setChainLoading(true);
    try {
      const data = await courtService.getChainOfEvents(fir.id);
      setChainData(data);
    } catch (err) {
      setChainError("Could not load chain of events for this case. Access may be restricted.");
    } finally {
      setChainLoading(false);
    }
  };

  const timeline = chainData?.timeline || [];

  return (
    <section>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <h2 style={{ margin: 0 }}>Case Record Search</h2>
            <span style={{
              background: "#d97706", color: "#fff",
              borderRadius: "6px", padding: "2px 10px",
              fontSize: "0.75rem", fontWeight: 700,
            }}>LAWYER</span>
          </div>
          <p className="page-subtitle">
            Search a case by FIR number, case ID, or police station — view the complete chain of events
          </p>
        </div>
      </div>

      {/* Notice banner */}
      <div style={{
        background: "linear-gradient(135deg, #d9770615, #f59e0b08)",
        border: "1px solid #d9770625",
        borderRadius: "10px",
        padding: "0.85rem 1.25rem",
        marginBottom: "1.75rem",
        display: "flex", alignItems: "center", gap: "0.75rem",
        fontSize: "0.85rem", color: "var(--text-muted)",
      }}>
        <HiOutlineExclamationCircle style={{ color: "#d97706", fontSize: "1.2rem", flexShrink: 0 }} />
        <span>
          <strong style={{ color: "#d97706" }}>Read-Only Access</strong> — You can search and view any registered case's chain of events. No data can be modified from this portal.
        </span>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

        {/* ── Left panel: Search ─────────────────────────────── */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <div className="form-card" style={{ position: "sticky", top: "1.5rem" }}>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem" }}>
              <HiOutlineSearch style={{ color: "var(--primary)" }} />
              Search Case
            </h3>

            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <HiOutlineSearch style={{
                position: "absolute", left: "0.75rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem",
              }} />
              <input
                className="input"
                type="text"
                placeholder="FIR number, ID, station..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: "2.25rem", marginBottom: 0 }}
              />
            </div>

            {firsLoading && <Loader />}

            {!firsLoading && (
              <div style={{
                maxHeight: 480, overflowY: "auto",
                display: "flex", flexDirection: "column", gap: "0.5rem",
              }}>
                {filtered.length === 0 && (
                  <div className="empty-state" style={{ padding: "1.5rem 0" }}>
                    <p style={{ fontSize: "0.85rem" }}>
                      {search ? "No cases match your search." : "No cases found in the system."}
                    </p>
                  </div>
                )}

                {filtered.map(f => (
                  <div
                    key={f.id}
                    onClick={() => handleViewChain(f)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      border: `1.5px solid ${selectedFir?.id === f.id ? "var(--primary)" : "var(--border)"}`,
                      background: selectedFir?.id === f.id ? "var(--primary)08" : "var(--card-bg)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: selectedFir?.id === f.id ? "var(--primary)" : "var(--text)" }}>
                      {f.fir_number}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {f.police_station}{f.district ? `, ${f.district}` : ""}
                    </div>
                    <div style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className={`badge badge-${f.status === "open" ? "blue" : f.status === "chargesheeted" ? "green" : "yellow"}`}
                        style={{ fontSize: "0.68rem", padding: "1px 7px" }}>
                        {f.status?.replace("_", " ").toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ID: #{f.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: Chain of Events ───────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* No case selected */}
          {!selectedFir && !chainLoading && (
            <div className="empty-state" style={{ marginTop: "3rem" }}>
              <div className="empty-state-icon"><HiOutlineDocumentText /></div>
              <p style={{ fontWeight: 600 }}>Select a case to view its chain of events</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Use the search panel on the left to find a case by FIR number, ID, or police station.
              </p>
            </div>
          )}

          {/* Loading chain */}
          {chainLoading && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
              <Loader />
            </div>
          )}

          {/* Error */}
          {chainError && (
            <div style={{
              background: "#dc262610", border: "1px solid #dc262630",
              borderRadius: "10px", padding: "1rem 1.5rem",
              color: "#dc2626", marginTop: "1rem",
            }}>
              {chainError}
            </div>
          )}

          {/* Chain data loaded */}
          {chainData && !chainLoading && (
            <>
              {/* Case header */}
              <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1rem 1.5rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                    <HiOutlineDocumentText style={{ verticalAlign: "middle", marginRight: 6, color: "var(--primary)" }} />
                    {chainData.fir_number}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {selectedFir?.police_station}
                    {selectedFir?.district ? ` · ${selectedFir.district}` : ""}
                  </p>
                </div>
                <span style={{
                  background: "var(--primary)12", color: "var(--primary)",
                  border: "1px solid var(--primary)30",
                  borderRadius: "20px", padding: "4px 14px",
                  fontSize: "0.78rem", fontWeight: 700,
                }}>
                  {chainData.total_events} Events Recorded
                </span>
              </div>

              {/* Event type summary badges */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {Object.entries(
                  timeline.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {})
                ).map(([type, count]) => {
                  const cfg = EVENT_CONFIG[type] || {};
                  return (
                    <span key={type} style={{
                      background: cfg.bg || "#f1f5f9",
                      color: cfg.color || "#64748b",
                      padding: "3px 11px", borderRadius: "20px",
                      fontSize: "0.75rem", fontWeight: 600,
                      border: `1px solid ${cfg.color || "#cbd5e1"}25`,
                    }}>
                      {cfg.label || type} ({count})
                    </span>
                  );
                })}
              </div>

              {/* Timeline */}
              {timeline.length === 0 ? (
                <div className="empty-state">
                  <p>No events recorded for this case yet.</p>
                </div>
              ) : (
                <div>
                  {timeline.map((event, idx) => (
                    <TimelineEvent key={idx} event={event} timeline={timeline} index={idx} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default LawyerCaseSearchPage;
