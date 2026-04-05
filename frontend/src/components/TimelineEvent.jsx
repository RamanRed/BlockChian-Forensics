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

export default function TimelineEvent({ event }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cfg = EVENT_CONFIG[event.type] || { icon: <HiOutlineEye />, label: event.type, color: "#64748b", bg: "#64748b10", docs: "Investigation Event Record" };
  const data = event.data || {};
  const ts = event.timestamp ? new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Timestamp Not Available";
  
  const dataEntries = Object.entries(data).filter(([k, v]) => v && k !== "blockchain_tx" && k !== "ipfs_cid");

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
          onClick={() => setIsModalOpen(true)}
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
          backgroundColor: "rgba(10, 10, 15, 0.9)", // Strong backdrop for privacy
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000,
          padding: "1.5rem"
        }} onClick={() => setIsModalOpen(false)}>
          
          <div 
            style={{
              background: "white",
              color: "#1e293b",
              borderRadius: "16px",
              width: "100%", maxWidth: "720px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: `1px solid rgba(255,255,255,0.2)`,
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              animation: "modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* OFFICIAL HEADER BAR */}
            <div style={{ 
              padding: "1rem 1.5rem", background: "#f8fafc", 
              borderBottom: "1px solid #e2e8f0", display: "flex", 
              justifyContent: "space-between", alignItems: "center" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
                <HiOutlineLockClosed style={{ color: cfg.color }} /> OFFICIAL RECORD: DIRS SYSTEM
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>UID: {data.id || data.fir_number || "REF-"+Math.floor(Math.random()*10000)}</div>
            </div>

            {/* DOCUMENT TITLE SECTION */}
            <div style={{ padding: "1.5rem 2rem", background: "white", borderBottom: "2px solid #f1f5f9" }}>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <div style={{ 
                  width: 64, height: 64, borderRadius: "16px", background: cfg.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cfg.color, fontSize: "2rem", border: `2px solid ${cfg.color}20`
                }}>
                  {cfg.icon}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a", fontWeight: 800 }}>{cfg.label} Summary</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem", fontWeight: 500 }}>Forensic Status: Verified & Elaborated</p>
                </div>
              </div>
            </div>

            {/* ELABORATED CONTENT GRID */}
            <div style={{ padding: "2rem", maxHeight: "60vh", overflowY: "auto", background: "#fcfcfd" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
                {dataEntries.map(([k, v]) => (
                  <div key={k} style={{ 
                    borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem"
                  }}>
                    <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                       <Info size={12} /> {k.replace(/_/g, " ")}
                    </div>
                    <div style={{ color: "#334155", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.5 }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>

              {/* SECURITY CERTIFICATION BOX */}
              {(data.blockchain_tx || data.ipfs_cid) && (
                <div style={{ 
                  marginTop: "2rem", padding: "1.5rem", borderRadius: "12px", 
                  background: "#f1f5f9", border: "1px solid #e2e8f0" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#475569" }}>
                     <Shield size={18} style={{ color: "#059669" }} />
                     <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.02em" }}>SECURITY CERTIFICATIONS</h4>
                  </div>
                  
                  {data.blockchain_tx && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>
                        <Hash size={14} /> BLOCKCHAIN PROOFS
                      </div>
                      <div style={{ 
                        fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem", 
                        background: "white", padding: "8px 12px", borderRadius: "6px",
                        border: "1px solid #e2e8f0", wordBreak: "break-all", color: "#1e293b"
                      }}>
                        {data.blockchain_tx}
                      </div>
                    </div>
                  )}

                  {data.ipfs_cid && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4f46e5", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>
                        <HardDrive size={14} /> IPFS ASSET HASH
                      </div>
                      <div style={{ 
                        fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem", 
                        background: "white", padding: "8px 12px", borderRadius: "6px",
                        border: "1px solid #e2e8f0", wordBreak: "break-all", color: "#1e293b"
                      }}>
                        {data.ipfs_cid}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WATERMARK-STYLE TIMESTAMP */}
              <div style={{ 
                marginTop: "2.5rem", textAlign: "center", color: "#cbd5e1", 
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
              }}>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={12} /> RECORDED ON: {ts}
                </div>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
              </div>
            </div>

            {/* MODAL ACTIONS BAR */}
            <div style={{ 
              padding: "1rem 2rem", background: "#f8fafc", 
              borderTop: "1px solid #e2e8f0", display: "flex", 
              justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  onClick={() => window.print()}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", fontWeight: 600 }}
                >
                  <HiOutlinePrinter size={16} /> Print Case File
                </button>
                <button 
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", fontWeight: 600 }}
                >
                  <HiOutlineDownload size={16} /> Export Record
                </button>
              </div>
              <button 
                className="btn" 
                style={{ background: "#0f172a", color: "white", padding: "8px 20px", borderRadius: "8px", fontWeight: 700 }}
                onClick={() => setIsModalOpen(false)}
              >
                Close Official View
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
              background: #f8fafc !important;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
