import { useContext, useMemo } from "react";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { courtService, verdictService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineScale,
  HiOutlineCollection,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from "react-icons/hi";

const StatCard = ({ icon, value, label, color, href }) => (
  <Link href={href || "#"} style={{ textDecoration: "none" }}>
    <div className="stat-card" style={{ cursor: "pointer" }}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  </Link>
);

function CourtDashboardPage() {
  const { user } = useContext(AuthContext);

  const { data: cases, loading } = useFetch(() => courtService.listCases(), []);
  const caseList = Array.isArray(cases) ? cases : [];

  const { data: verdictsData } = useFetch(() => verdictService.listAll({ limit: 200 }), []);
  const verdicts = Array.isArray(verdictsData) ? verdictsData : [];

  const stats = useMemo(() => ({
    total: caseList.length,
    pending: caseList.filter(c => c.verdict_count === 0).length,
    verdicted: caseList.filter(c => c.verdict_count > 0).length,
    totalVerdicts: verdicts.length,
  }), [caseList, verdicts]);

  return (
    <section>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <h2 style={{ margin: 0 }}>Court Portal</h2>
            <span style={{
              background: "#dc2626",
              color: "#fff",
              borderRadius: "6px",
              padding: "2px 10px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}>COURT</span>
          </div>
          <p className="page-subtitle">
            Welcome, Hon. {user?.name || "Judge"} — Review cases, view chain of events, and issue verdicts
          </p>
        </div>
      </div>

      {loading && <Loader />}
      {!loading && (
        <div className="stats-row">
          <StatCard href="/court/cases" icon={<HiOutlineCollection />} value={stats.total} label="Total Cases" color="purple" />
          <StatCard href="/court/cases" icon={<HiOutlineDocumentText />} value={stats.pending} label="Pending Verdict" color="blue" />
          <StatCard href="/court/cases" icon={<HiOutlineClipboardCheck />} value={stats.verdicted} label="Verdict Issued" color="green" />
          <StatCard href="/court/verdict" icon={<HiOutlineScale />} value={stats.totalVerdicts} label="Total Verdicts" color="red" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Quick Actions</h3>
      </div>
      <div className="stats-row" style={{ flexWrap: "wrap" }}>
        {[
          { href: "/court/cases", label: "View All Cases", icon: <HiOutlineCollection />, color: "purple" },
          { href: "/court/verdict", label: "Issue Verdict", icon: <HiOutlineScale />, color: "red" },
          { href: "/verify", label: "Verify Hash", icon: <HiOutlineShieldCheck />, color: "green" },
        ].map(q => (
          <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{
              cursor: "pointer", minWidth: 180,
              borderLeft: `3px solid var(--${q.color === "purple" ? "primary" : q.color === "red" ? "danger" : "success"})`,
            }}>
              <div className={`stat-icon ${q.color}`}>{q.icon}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>{q.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Banner */}
      <div style={{
        background: "linear-gradient(135deg, #dc262620, #ef444410)",
        border: "1px solid #dc262630",
        borderRadius: "12px",
        padding: "1rem 1.5rem",
        marginTop: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        <HiOutlineScale style={{ fontSize: "1.5rem", color: "#dc2626", flexShrink: 0 }} />
        <div>
          <strong style={{ color: "#dc2626" }}>Court Authority</strong>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            You have read-only access to case investigation data. Open any case to view the full chain of events
            including investigation diaries, evidence, forensic reports, and custody transfers.
            You can issue official verdicts which are permanently recorded on the blockchain.
          </p>
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Recent Cases</h3>
        <Link href="/court/cases" className="btn btn-secondary">View All</Link>
      </div>

      {!loading && caseList.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineScale /></div>
          <p>No chargesheeted cases found in the system.</p>
        </div>
      )}

      {caseList.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>FIR Number</th>
                <th>Police Station</th>
                <th>Offence</th>
                <th>Status</th>
                <th>Verdict</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {caseList.slice(0, 8).map(c => (
                <tr key={c.id}>
                  <td><strong>{c.fir_number}</strong></td>
                  <td>{c.police_station}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.offence_sections}</td>
                  <td>
                    <span className={`badge badge-${c.investigation_state === "active" ? "blue" : "green"}`}>
                      {c.investigation_state?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.verdict_count > 0 ? "green" : "yellow"}`}>
                      {c.verdict_count > 0 ? `${c.verdict_count} Verdict(s)` : "Pending"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/court/case/${c.id}`} className="btn btn-secondary" style={{ padding: "4px 12px", fontSize: "0.8rem" }}>
                      Open Case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default CourtDashboardPage;
