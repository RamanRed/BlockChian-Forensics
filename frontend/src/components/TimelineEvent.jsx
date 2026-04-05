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
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi";

/* ── Event type config ─────────────────────────────────────── */
export const EVENT_CONFIG = {
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
  lab_report:            { icon: <HiOutlineBeaker />,       label: "Forensic Lab Report",      color: "#059669", bg: "#05966910" },
};

export default function TimelineEvent({ event }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cfg = EVENT_CONFIG[event.type] || { icon: <HiOutlineEye />, label: event.type, color: "#64748b", bg: "#64748b10" };
  const data = event.data || {};
  const ts = event.timestamp ? new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
  
  const dataEntries = Object.entries(data).filter(([k, v]) => v && k !== "blockchain_tx" && k !== "ipfs_cid");

  return (
    <>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "10px",
            background: cfg.bg, border: `2px solid ${cfg.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: cfg.color, fontSize: "1.05rem", flexShrink: 0,
          }}>
            {cfg.icon}
          </div>
          <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 4, minHeight: 20 }} />
        </div>
        <div 
          style={{
            flex: 1, background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "0.9rem 1.2rem", borderLeft: `3px solid ${cfg.color}`,
            cursor: "pointer", transition: "all 0.2s ease"
          }}
          onClick={() => setIsModalOpen(true)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.2rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{ts}</span>
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Click to view full record details ({dataEntries.length} entries)</span>
            <HiOutlineEye style={{ fontSize: "1.1rem" }} />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }} onClick={() => setIsModalOpen(false)}>
          <div 
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              width: "100%", maxWidth: "600px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: `1px solid ${cfg.color}50`,
              borderTop: `4px solid ${cfg.color}`,
              overflow: "hidden"
            }}
            onClick={e => e.stopPropagation()} /* Prevent background click from closing */
          >
            {/* Modal Header */}
            <div style={{ 
              padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: cfg.bg
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: cfg.color, fontSize: "1.2rem", display: "flex" }}>{cfg.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text)" }}>{cfg.label}</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{ts}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ 
                  background: "transparent", border: "none", cursor: "pointer", 
                  fontSize: "1.2rem", color: "var(--text-muted)", padding: "0.25rem" 
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gap: "1rem", fontSize: "0.9rem" }}>
                {dataEntries.map(([k, v]) => (
                  <div key={k} style={{ 
                    background: "var(--bg-color)", padding: "0.75rem 1rem", 
                    borderRadius: "8px", border: "1px solid var(--border)"
                  }}>
                    <div style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "4px" }}>
                      {k.replace(/_/g, " ")}
                    </div>
                    <div style={{ color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Hashes Section */}
              {(data.blockchain_tx || data.ipfs_cid) && (
                <div style={{ marginTop: "1.5rem", borderTop: "1px dashed var(--border)", paddingTop: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Security Verification</h4>
                  
                  {data.blockchain_tx && (
                    <div style={{
                      marginBottom: "0.5rem", padding: "0.75rem", background: "#05966910",
                      borderRadius: "8px", border: "1px solid #05966930",
                      display: "flex", flexDirection: "column", gap: "0.25rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#059669", fontWeight: 600, fontSize: "0.8rem" }}>
                        <HiOutlineShieldCheck style={{ fontSize: "1.1rem" }} /> Blockchain Hash Record
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text)", wordBreak: "break-all" }}>
                        {data.blockchain_tx}
                      </div>
                    </div>
                  )}
                  
                  {data.ipfs_cid && (
                    <div style={{
                      padding: "0.75rem", background: "#4f46e510",
                      borderRadius: "8px", border: "1px solid #4f46e530",
                      display: "flex", flexDirection: "column", gap: "0.25rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4f46e5", fontWeight: 600, fontSize: "0.8rem" }}>
                        <HiOutlineArchive style={{ fontSize: "1.1rem" }} /> IPFS Immutable Storage CID
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text)", wordBreak: "break-all" }}>
                        {data.ipfs_cid}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-color)", textAlign: "right" }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
