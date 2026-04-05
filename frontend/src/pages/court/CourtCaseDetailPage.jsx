import { useState, useContext } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { courtService, diaryService, forensicSubmissionService } from "../../services/dirsService";
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
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";

/* ── Event type config ───────────────────────────────────────── */
const EVENT_CONFIG = {
  fir_registered:        { icon: <HiOutlineDocumentText />, label: "FIR Registered",         color: "#4f46e5", bg: "#4f46e510" },
  diary_entry:           { icon: <HiOutlineBookOpen />,     label: "Case Diary Entry",        color: "#0891b2", bg: "#0891b210" },
  seizure_memo:          { icon: <HiOutlineArchive />,      label: "Seizure Memo",             color: "#7c3aed", bg: "#7c3aed10" },
  evidence_registered:   { icon: <HiOutlineArchive />,      label: "Evidence Registered",      color: "#059669", bg: "#05966910" },
  custody_transfer:      { icon: <HiOutlineSwitchHorizontal />, label: "Custody Transfer",    color: "#d97706", bg: "#d9770610" },
  forensic_submission:   { icon: <HiOutlineBeaker />,       label: "Forensic Submission",      color: "#0e7490", bg: "#0e749010" },
  investigation_finding: { icon: <HiOutlineLightningBolt />,label: "Investigation Finding",    color: "#6366f1", bg: "#6366f110" },
  chargesheet_filed:     { icon: <HiOutlineClipboardCheck />,label: "Chargesheet Filed",       color: "#dc2626", bg: "#dc262610" },
  court_proceeding:      { icon: <HiOutlineScale />,        label: "Court Proceeding",         color: "#be185d", bg: "#be185d10" },
  court_verdict:         { icon: <HiOutlineScale />,        label: "Court Verdict",            color: "#dc2626", bg: "#dc262620" },
  lab_report:            { icon: <HiOutlineBeaker />,       label: "Forensic Lab Report",      color: "#059669", bg: "#05966910" },
};

/* ── Timeline Event Card ─────────────────────────────────────── */
function TimelineEvent({ event }) {
  const cfg = EVENT_CONFIG[event.type] || { icon: <HiOutlineEye />, label: event.type, color: "#64748b", bg: "#64748b10" };
  const data = event.data || {};
  const ts = event.timestamp
    ? new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
      {/* Dot + Line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "10px",
          background: cfg.bg, border: `2px solid ${cfg.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: cfg.color, fontSize: "1rem", flexShrink: 0,
        }}>
          {cfg.icon}
        </div>
        <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 4 }} />
      </div>
      {/* Content */}
      <div style={{
        flex: 1, background: "var(--card-bg)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "1rem 1.25rem", borderLeft: `3px solid ${cfg.color}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{ts}</span>
        </div>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
          {Object.entries(data)
            .filter(([k, v]) => v && k !== "blockchain_tx" && k !== "ipfs_cid")
            .map(([k, v]) => (
              <div key={k}>
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                  {k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}:
                </span>{" "}
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

/* ── Diary Entry Card (Court read-only view) ─────────────────── */
function DiaryCard({ entry }) {
  const ts = entry.entry_date
    ? new Date(entry.entry_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "";
  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderLeft: "4px solid #0891b2",
      borderRadius: "10px",
      padding: "1rem 1.25rem",
      marginBottom: "1rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontWeight: 700, color: "#0891b2", display: "flex", alignItems: "center", gap: 6 }}>
          <HiOutlineBookOpen /> Entry #{entry.entry_number}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ts}</span>
      </div>
      {entry.place_visited && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>📍 {entry.place_visited}</p>
      )}
      {entry.persons_met && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>👤 Persons met: {entry.persons_met}</p>
      )}
      <p style={{ margin: "6px 0", fontSize: "0.9rem", lineHeight: 1.6 }}>{entry.action_taken}</p>
      {entry.observations && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Observations: {entry.observations}
        </p>
      )}
      {entry.next_steps && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Next steps: {entry.next_steps}
        </p>
      )}
      {entry.entry_hash && (
        <div style={{
          marginTop: "0.5rem", padding: "4px 8px", background: "#05966915",
          borderRadius: "6px", fontSize: "0.72rem", color: "#059669",
          fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <HiOutlineShieldCheck /> Hash: {entry.entry_hash.slice(0, 32)}…
        </div>
      )}
    </div>
  );
}

/* ── Forensic Result Card ───────────────────────────────────── */
function ForensicResultCard({ result }) {
  const statusColor = {
    completed: "#059669",
    in_progress: "#0891b2",
    pending: "#d97706",
  }[result.status] || "#64748b";

  const statusBg = {
    completed: "#05966910",
    in_progress: "#0891b210",
    pending: "#d9770610",
  }[result.status] || "#64748b10";

  return (
    <div style={{
      background: "var(--card-bg)",
      border: `1px solid ${statusColor}30`,
      borderLeft: `4px solid ${statusColor}`,
      borderRadius: "10px",
      padding: "1rem 1.25rem",
      marginBottom: "1rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <span style={{ fontWeight: 700, color: statusColor, display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem" }}>
            <HiOutlineBeaker /> Submission #{result.id} — Property #{result.property_id}
          </span>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
            Submitted: {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString("en-IN") : "—"}
            {result.completed_at && ` · Completed: ${new Date(result.completed_at).toLocaleDateString("en-IN")}`}
          </div>
        </div>
        <span style={{
          background: statusBg, color: statusColor,
          border: `1px solid ${statusColor}40`,
          borderRadius: "6px", padding: "3px 10px",
          fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {result.status?.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* IO Notes */}
      {result.notes && (
        <div style={{
          background: "#4f46e510", border: "1px solid #4f46e520",
          borderRadius: "8px", padding: "0.6rem 0.9rem", marginBottom: "0.75rem", fontSize: "0.85rem",
        }}>
          <strong style={{ color: "#4f46e5" }}>IO Request Notes:</strong> {result.notes}
        </div>
      )}

      {/* Lab Report */}
      {result.status === "completed" ? (
        <div>
          {result.lab_observations && (
            <div style={{ marginBottom: "0.5rem" }}>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>🔬 Lab Observations:</strong>
              </p>
              <p style={{ margin: "4px 0 0.5rem", fontSize: "0.87rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                {result.lab_observations}
              </p>
            </div>
          )}
          {result.lab_conclusion && (
            <div style={{
              background: "#05966910", border: "1px solid #05966930",
              borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "0.5rem",
            }}>
              <strong style={{ color: "#059669" }}>✓ Lab Conclusion:</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.88rem", lineHeight: 1.65 }}>{result.lab_conclusion}</p>
            </div>
          )}
          {result.blockchain_tx && (
            <div style={{
              marginTop: "0.5rem", padding: "4px 8px", background: "#05966915",
              borderRadius: "6px", fontSize: "0.75rem", color: "#059669",
              fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <HiOutlineCheckCircle /> Blockchain: {result.blockchain_tx.slice(0, 24)}…
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          color: "var(--text-muted)", fontSize: "0.85rem",
        }}>
          <HiOutlineClock /> Analysis in progress — results will appear here once forensic lab completes the report.
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
function CourtCaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState("chain");

  /* Data fetches */
  const { data: chainData, loading: chainLoading } = useFetch(
    () => (id ? courtService.getChainOfEvents(id) : Promise.resolve(null)),
    [id]
  );

  const { data: diaryData, loading: diaryLoading } = useFetch(
    () => (id ? diaryService.getEntries(id) : Promise.resolve([])),
    [id]
  );

  const { data: forensicData, loading: forensicLoading } = useFetch(
    () => (id ? forensicSubmissionService.getResults(id) : Promise.resolve([])),
    [id]
  );

  const diaryEntries = Array.isArray(diaryData) ? diaryData : [];
  const forensicResults = Array.isArray(forensicData) ? forensicData : [];
  const isLoading = chainLoading || diaryLoading || forensicLoading;

  if (isLoading) return <Loader />;

  if (!chainData) return (
    <div className="empty-state">
      <div className="empty-state-icon"><HiOutlineScale /></div>
      <p>Case not found or access denied.</p>
      <Link href="/court/cases" className="btn btn-secondary" style={{ marginTop: "1rem" }}>← Back to Cases</Link>
    </div>
  );

  const { fir_number, timeline = [], total_events } = chainData;

  const TABS = [
    { key: "chain",    label: "Chain of Events",       icon: <HiOutlineLightningBolt />, count: timeline.length },
    { key: "diary",    label: "Investigation Diary",   icon: <HiOutlineBookOpen />,      count: diaryEntries.length },
    { key: "forensic", label: "Forensic Lab Results",  icon: <HiOutlineBeaker />,        count: forensicResults.length },
  ];

  return (
    <section>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Case File: {fir_number}</h2>
          <p className="page-subtitle">
            {total_events} events · {diaryEntries.length} diary entries · {forensicResults.length} forensic submission(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/court/cases" className="btn btn-secondary">← Back to Cases</Link>
          <Link href={`/court/verdict?fir=${id}`} className="btn">
            <HiOutlineScale style={{ verticalAlign: "middle", marginRight: 4 }} /> Issue Verdict
          </Link>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: "2rem",
        background: "var(--card-bg)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.9rem 1rem",
              background: activeTab === t.key ? "var(--primary)" : "transparent",
              color: activeTab === t.key ? "#fff" : "var(--text-muted)",
              fontWeight: activeTab === t.key ? 700 : 500,
              fontSize: "0.88rem",
              border: "none",
              borderRight: i < TABS.length - 1 ? "1px solid var(--border)" : "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.icon}
            {t.label}
            <span style={{
              background: activeTab === t.key ? "#ffffff30" : "var(--border)",
              color: activeTab === t.key ? "#fff" : "var(--text-muted)",
              borderRadius: "20px",
              padding: "1px 8px",
              fontSize: "0.72rem",
              fontWeight: 700,
              marginLeft: 2,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: Chain of Events ─────────────────────────────── */}
      {activeTab === "chain" && (
        <>
          {/* Summary badges */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {Object.entries(
              timeline.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {})
            ).map(([type, count]) => {
              const cfg = EVENT_CONFIG[type] || {};
              return (
                <span key={type} style={{
                  background: cfg.bg || "#f1f5f9",
                  color: cfg.color || "#64748b",
                  padding: "4px 12px", borderRadius: "20px",
                  fontSize: "0.78rem", fontWeight: 600,
                  border: `1px solid ${cfg.color || "#cbd5e1"}30`,
                }}>
                  {(cfg.label || type).replace("_", " ")} ({count})
                </span>
              );
            })}
          </div>

          {timeline.length === 0 ? (
            <div className="empty-state"><p>No events recorded for this case yet.</p></div>
          ) : (
            <div style={{ maxWidth: 800 }}>
              {timeline.map((event, idx) => (
                <TimelineEvent key={idx} event={event} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Investigation Diary ─────────────────────────── */}
      {activeTab === "diary" && (
        <>
          <div style={{
            background: "linear-gradient(135deg, #0891b215, #06b6d408)",
            border: "1px solid #0891b220",
            borderRadius: "10px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}>
            <HiOutlineBookOpen style={{ color: "#0891b2", fontSize: "1.2rem", flexShrink: 0 }} />
            <span>
              <strong style={{ color: "#0891b2" }}>Read-Only Access</strong> — These diary entries were recorded by the investigating officer. Court has read-only access.
            </span>
          </div>

          {diaryEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><HiOutlineBookOpen /></div>
              <p>No diary entries have been recorded for this case yet.</p>
            </div>
          ) : (
            <div style={{ maxWidth: 800 }}>
              {diaryEntries.map(entry => (
                <DiaryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Forensic Lab Results ─────────────────────────── */}
      {activeTab === "forensic" && (
        <>
          <div style={{
            background: "linear-gradient(135deg, #05966915, #10b98108)",
            border: "1px solid #05966920",
            borderRadius: "10px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}>
            <HiOutlineBeaker style={{ color: "#059669", fontSize: "1.2rem", flexShrink: 0 }} />
            <span>
              <strong style={{ color: "#059669" }}>Forensic Lab Submissions</strong> — Evidence items forwarded by investigators and their corresponding lab analysis reports.
            </span>
          </div>

          {/* Stats row */}
          {forensicResults.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {[
                { label: "Total", count: forensicResults.length, color: "#4f46e5", bg: "#4f46e510" },
                { label: "Completed", count: forensicResults.filter(r => r.status === "completed").length, color: "#059669", bg: "#05966910" },
                { label: "In Progress", count: forensicResults.filter(r => r.status === "in_progress").length, color: "#0891b2", bg: "#0891b210" },
                { label: "Pending", count: forensicResults.filter(r => r.status === "pending").length, color: "#d97706", bg: "#d9770610" },
              ].map(s => (
                <span key={s.label} style={{
                  background: s.bg, color: s.color,
                  border: `1px solid ${s.color}30`,
                  borderRadius: "20px", padding: "4px 14px",
                  fontSize: "0.78rem", fontWeight: 600,
                }}>
                  {s.label}: {s.count}
                </span>
              ))}
            </div>
          )}

          {forensicResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><HiOutlineBeaker /></div>
              <p>No forensic submissions found for this case.</p>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Evidence is forwarded to the lab by the investigating officer using the "Forward to Lab" feature.
              </span>
            </div>
          ) : (
            <div style={{ maxWidth: 800 }}>
              {forensicResults.map(r => (
                <ForensicResultCard key={r.id} result={r} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default CourtCaseDetailPage;
