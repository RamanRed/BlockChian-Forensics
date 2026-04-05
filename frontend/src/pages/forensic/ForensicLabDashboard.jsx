import { useState, useContext, useMemo } from "react";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { forensicSubmissionService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineBeaker,
  HiOutlineArchive,
  HiOutlineUpload,
  HiOutlineCheckCircle,
  HiOutlineClock,
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

function ForensicLabDashboard() {
  const { user } = useContext(AuthContext);

  const { data: incoming, loading } = useFetch(() => forensicSubmissionService.getIncoming(), []);
  const submissions = Array.isArray(incoming) ? incoming : [];

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    inProgress: submissions.filter(s => s.status === "in_progress").length,
    completed: submissions.filter(s => s.status === "completed").length,
  }), [submissions]);

  return (
    <section>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <h2 style={{ margin: 0 }}>Forensic Lab Portal</h2>
            <span style={{
              background: "#059669",
              color: "#fff",
              borderRadius: "6px",
              padding: "2px 10px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}>CFSL</span>
          </div>
          <p className="page-subtitle">
            Welcome, {user?.name} — Forensic Analysis & Lab Reporting Hub
          </p>
        </div>
      </div>

      {loading && <Loader />}
      {!loading && (
        <div className="stats-row">
          <StatCard href="/forensic/evidence" icon={<HiOutlineArchive />} value={stats.total} label="Total Evidence" color="purple" />
          <StatCard href="/forensic/evidence" icon={<HiOutlineClock />} value={stats.pending} label="Pending Analysis" color="blue" />
          <StatCard href="/forensic/evidence" icon={<HiOutlineBeaker />} value={stats.inProgress} label="In Progress" color="green" />
          <StatCard href="/forensic/evidence" icon={<HiOutlineCheckCircle />} value={stats.completed} label="Completed" color="red" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Quick Actions</h3>
      </div>
      <div className="stats-row" style={{ flexWrap: "wrap" }}>
        {[
          { href: "/forensic/evidence", label: "View Incoming Evidence", icon: <HiOutlineArchive />, color: "purple" },
          { href: "/forensic/submit-report", label: "Submit Lab Report", icon: <HiOutlineUpload />, color: "green" },
        ].map(q => (
          <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{
              cursor: "pointer", minWidth: 200,
              borderLeft: `3px solid var(--${q.color === "purple" ? "primary" : "success"})`,
            }}>
              <div className={`stat-icon ${q.color}`}>{q.icon}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>{q.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #05966920, #10b98110)",
        border: "1px solid #05966930",
        borderRadius: "12px",
        padding: "1rem 1.5rem",
        marginTop: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        <HiOutlineBeaker style={{ fontSize: "1.5rem", color: "#059669", flexShrink: 0 }} />
        <div>
          <strong style={{ color: "#059669" }}>Forensic Lab</strong>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Evidence is submitted by investigation officers (IO/SP/DSP). Review each item, run your analysis,
            and submit lab reports with observations and conclusions. All reports are blockchain-anchored.
          </p>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Recent Submissions</h3>
        <Link href="/forensic/evidence" className="btn btn-secondary">View All</Link>
      </div>

      {!loading && submissions.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineArchive /></div>
          <p>No evidence has been submitted to the forensic lab yet.</p>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>FIR</th>
                <th>Property ID</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.slice(0, 8).map(s => (
                <tr key={s.id}>
                  <td><strong>#{s.id}</strong></td>
                  <td>FIR/{s.fir_id}</td>
                  <td>PROP-{s.property_id}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.notes || "—"}
                  </td>
                  <td>
                    <span className={`badge badge-${s.status === "completed" ? "green" : s.status === "in_progress" ? "blue" : "yellow"}`}>
                      {s.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    {s.status !== "completed" ? (
                      <Link href={`/forensic/submit-report?submission=${s.id}`} className="btn btn-secondary" style={{ padding: "4px 12px", fontSize: "0.8rem" }}>
                        Submit Report
                      </Link>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.8rem" }}>✓ Done</span>
                    )}
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

export default ForensicLabDashboard;
