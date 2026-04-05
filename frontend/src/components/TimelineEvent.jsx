import { useState } from "react";
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
  HiOutlinePrinter,
  HiOutlineDownload,
  HiOutlineLockClosed,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { Shield, Info, Hash, Clock, HardDrive } from "lucide-react";

/* ── Event type config ─────────────────────────────────────── */
export const EVENT_CONFIG = {
  fir_registered:        { icon: <HiOutlineDocumentText />, label: "FIR Registered",        color: "#4f46e5", bg: "#4f46e510", docs: "Primary Case Foundation" },
  diary_entry:           { icon: <HiOutlineBookOpen />,     label: "Case Diary Entry",      color: "#0891b2", bg: "#0891b210", docs: "Daily Investigation Record" },
  seizure_memo:          { icon: <HiOutlineArchive />,      label: "Seizure Memo",           color: "#7c3aed", bg: "#7c3aed10", docs: "Physical Evidence Capture" },
  evidence_registered:   { icon: <HiOutlineArchive />,      label: "Evidence Registered",    color: "#059669", bg: "#05966910", docs: "Digital Asset Registry" },
  custody_transfer:      { icon: <HiOutlineSwitchHorizontal />, label: "Custody Transfer",  color: "#d97706", bg: "#d9770610", docs: "Chain of Custody Movement" },
  forensic_submission:   { icon: <HiOutlineBeaker />,       label: "Forensic Submission",    color: "#0e7490", bg: "#0e749010", docs: "Laboratory Analysis Request" },
  investigation_finding: { icon: <HiOutlineLightningBolt />,label: "Investigation Finding",  color: "#6366f1", bg: "#6366f110", docs: "Critical Discovery Record" },
  chargesheet_filed:     { icon: <HiOutlineClipboardCheck />,label: "Chargesheet Filed",     color: "#dc2626", bg: "#dc262610", docs: "Judicial Submission Document" },
  court_proceeding:      { icon: <HiOutlineScale />,        label: "Court Proceeding",       color: "#be185d", bg: "#be185d10", docs: "Hearing Documentation" },
  court_verdict:         { icon: <HiOutlineScale />,        label: "Court Verdict",          color: "#dc2626", bg: "#dc262620", docs: "Final Judicial Determination" },
  lab_report:            { icon: <HiOutlineBeaker />,       label: "Forensic Lab Report",      color: "#059669", bg: "#05966910", docs: "Scientifically Validated Findings" },
};

export default function TimelineEvent({ event: initialEvent, timeline = [], index = -1 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(index);

  // If navigation is active, use the timeline[currentIndex], otherwise fallback to initialEvent
  const isNavigable = timeline.length > 0 && currentIndex >= 0;
  const currentEvent = isNavigable ? timeline[currentIndex] : initialEvent;
  
  const cfg = EVENT_CONFIG[currentEvent.type] || { icon: <HiOutlineEye />, label: currentEvent.type, color: "#64748b", bg: "#64748b10", docs: "Investigation Event Record" };
  const data = currentEvent.data || {};
  const ts = currentEvent.timestamp ? new Date(currentEvent.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Timestamp Not Available";
  
  const dataEntries = Object.entries(data).filter(([k, v]) => v && k !== "blockchain_tx" && k !== "ipfs_cid");

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < timeline.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const openModal = () => {
    if (isNavigable) setCurrentIndex(index); 
    setIsModalOpen(true);
  };

  return (
    <>
      <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.75rem" }}>
        {/* Timeline Line/Icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 42 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "12px",
            background: cfg.bg, border: `2px solid ${cfg.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: cfg.color, fontSize: "1.1rem", flexShrink: 0,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            transition: "transform 0.2s ease"
          }} className="timeline-icon-container">
            {cfg.icon}
          </div>
          <div style={{ width: 2, flex: 1, background: "linear-gradient(to bottom, var(--border), transparent)", marginTop: 6, minHeight: 25 }} />
        </div>

        {/* List Card (Summary) */}
        <div 
          style={{
            flex: 1, background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "1rem 1.4rem", borderLeft: `4px solid ${cfg.color}`,
            cursor: "pointer", transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
          }}
          onClick={openModal}
          className="timeline-card-summary"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{cfg.label}</span>
              <span style={{ fontSize: "0.65rem", padding: "1px 6px", background: cfg.bg, color: cfg.color, borderRadius: "4px", fontWeight: 600 }}>{cfg.docs}</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{ts}</span>
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <HiOutlineEye style={{ fontSize: "1rem" }} />
            <span>Open elaborated case details for this {cfg.label}</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "#0a0a0fF2",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000,
          padding: "1rem"
        }} onClick={() => setIsModalOpen(false)}>

          {/* Nav: Left Arrow */}
          {isNavigable && (
            <button 
              disabled={currentIndex === 0}
              onClick={handlePrev}
              style={{
                position: "absolute", left: "2rem", top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", borderRadius: "50%", width: 54, height: 54,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                opacity: currentIndex === 0 ? 0.2 : 1, transition: "all 0.2s",
                zIndex: 2010, backdropFilter: "blur(4px)"
              }}
              className="nav-arrow"
            >
              <HiOutlineChevronLeft size={32} />
            </button>
          )}

          {/* Nav: Right Arrow */}
          {isNavigable && (
            <button 
              disabled={currentIndex === timeline.length - 1}
              onClick={handleNext}
              style={{
                position: "absolute", right: "2rem", top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", borderRadius: "50%", width: 54, height: 54,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: currentIndex === timeline.length - 1 ? "not-allowed" : "pointer",
                opacity: currentIndex === timeline.length - 1 ? 0.2 : 1, transition: "all 0.2s",
                zIndex: 2010, backdropFilter: "blur(4px)"
              }}
              className="nav-arrow"
            >
              <HiOutlineChevronRight size={32} />
            </button>
          )}
          
          <div 
            style={{
              background: "white",
              color: "#1e293b",
              borderRadius: "16px",
              width: "100%", maxWidth: "760px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: `1px solid rgba(255,255,255,0.2)`,
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              animation: "modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* OFFICIAL HEADER BAR */}
            <div style={{ 
              padding: "0.85rem 1.75rem", background: "#f8fafc", 
              borderBottom: "1px solid #e2e8f0", display: "flex", 
              justifyContent: "space-between", alignItems: "center" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
                <HiOutlineLockClosed style={{ color: cfg.color }} /> OFFICIAL RECORD: DIRS SYSTEM
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                {isNavigable && (
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", background: "var(--primary)10", padding: "3px 10px", borderRadius: "6px", border: "1px solid var(--primary)20" }}>
                    RECORD {currentIndex + 1} OF {timeline.length}
                  </div>
                )}
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>UID: {data.id || data.fir_number || "REF-"+Math.floor(Math.random()*10000)}</div>
              </div>
            </div>

            {/* DOCUMENT TITLE SECTION */}
            <div style={{ padding: "1.75rem 2.25rem", background: "white", borderBottom: "2px solid #f1f5f9" }}>
              <div style={{ display: "flex", gap: "1.75rem", alignItems: "center" }}>
                <div style={{ 
                  width: 68, height: 68, borderRadius: "18px", background: cfg.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cfg.color, fontSize: "2.2rem", border: `2px solid ${cfg.color}20`
                }}>
                  {cfg.icon}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.6rem", color: "#0f172a", fontWeight: 800 }}>{cfg.label} Summary</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.92rem", fontWeight: 500 }}>Forensic Status: Verified & Elaborated</p>
                </div>
              </div>
            </div>

            {/* ELABORATED CONTENT GRID */}
            <div style={{ padding: "2.5rem", maxHeight: "60vh", overflowY: "auto", background: "#fcfcfd" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.75rem" }}>
                {dataEntries.map(([k, v]) => (
                  <div key={k} style={{ 
                    borderBottom: "1px solid #f1f5f9", paddingBottom: "0.85rem"
                  }}>
                    <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                       <Info size={14} /> {k.replace(/_/g, " ")}
                    </div>
                    <div style={{ color: "#334155", fontSize: "0.98rem", fontWeight: 600, lineHeight: 1.5 }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>

              {/* SECURITY CERTIFICATION BOX */}
              {(data.blockchain_tx || data.ipfs_cid) && (
                <div style={{ 
                  marginTop: "2.5rem", padding: "1.75rem", borderRadius: "14px", 
                  background: "#f1f5f9", border: "1px solid #e2e8f0" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem", color: "#475569" }}>
                     <Shield size={20} style={{ color: "#059669" }} />
                     <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.03em" }}>SECURITY CERTIFICATIONS</h4>
                  </div>
                  
                  {data.blockchain_tx && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#059669", fontSize: "0.72rem", fontWeight: 700, marginBottom: "5px" }}>
                        <Hash size={15} /> BLOCKCHAIN PROOFS
                      </div>
                      <div style={{ 
                        fontFamily: "'Roboto Mono', monospace", fontSize: "0.78rem", 
                        background: "white", padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #e2e8f0", wordBreak: "break-all", color: "#1e293b",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                      }}>
                        {data.blockchain_tx}
                      </div>
                    </div>
                  )}

                  {data.ipfs_cid && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#4f46e5", fontSize: "0.72rem", fontWeight: 700, marginBottom: "5px" }}>
                        <HardDrive size={15} /> IPFS ASSET HASH
                      </div>
                      <div style={{ 
                        fontFamily: "'Roboto Mono', monospace", fontSize: "0.78rem", 
                        background: "white", padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #e2e8f0", wordBreak: "break-all", color: "#1e293b",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                      }}>
                        {data.ipfs_cid}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WATERMARK-STYLE TIMESTAMP */}
              <div style={{ 
                marginTop: "3rem", textAlign: "center", color: "#cbd5e1", 
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px"
              }}>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} /> RECORDED ON: {ts}
                </div>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
              </div>
            </div>

            {/* MODAL ACTIONS BAR */}
            <div style={{ 
              padding: "1.25rem 2.25rem", background: "#f8fafc", 
              borderTop: "1px solid #e2e8f0", display: "flex", 
              justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: "1.75rem" }}>
                <button 
                  onClick={() => window.print()}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600 }}
                >
                  <HiOutlinePrinter size={18} /> Print File
                </button>
                <button 
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600 }}
                >
                  <HiOutlineDownload size={18} /> Export
                </button>
              </div>
              <button 
                className="btn" 
                style={{ background: "#0f172a", color: "white", padding: "10px 28px", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem" }}
                onClick={() => setIsModalOpen(false)}
              >
                Close View
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: translateY(30px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .timeline-card-summary:hover {
              transform: translateX(6px);
              background: #fcfcfd !important;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08) !important;
            }
            .nav-arrow:hover:not(:disabled) {
              background: rgba(255,255,255,0.15) !important;
              transform: translateY(-50%) scale(1.1) !important;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
