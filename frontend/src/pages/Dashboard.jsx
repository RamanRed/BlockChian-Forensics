import { useMemo, useContext, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { useFetch } from "../hooks/useFetch";
import { firService } from "../services/dirsService";
import { AuthContext } from "../context/AuthContext";
import CourtDashboard from "./court/CourtDashboardPage";
import ForensicDashboard from "./forensic/ForensicLabDashboard";
import InvestigatorDashboard from "./investigator/InvestigatorDashboard";
import LawyerDashboard from "./lawyer/LawyerCaseSearchPage";
import {
  HiOutlineDocumentText,
  HiOutlineBookOpen,
  HiOutlineArchive,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCheck,
  HiOutlineScale,
} from "react-icons/hi";

const StatCard = ({ icon, value, label, color, href }) => (
  <Link href={href} style={{ textDecoration: "none" }}>
    <div className="stat-card" style={{ cursor: "pointer" }}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  </Link>
);

function Dashboard() {
  const { role } = useContext(AuthContext);

  // Redirect investigator roles to their portal
  if (["io", "sp", "dsp"].includes(role)) {
    return <InvestigatorDashboard />;
  }

  if (role === "court") {
    return <CourtDashboard />;
  }

  if (role === "cfsl") {
    return <ForensicDashboard />;
  }

  if (role === "lawyer") {
    return <LawyerDashboard />;
  }

  const { data, loading } = useFetch(() => firService.list({ limit: 200 }), []);
  const firs = data?.data || data || [];

  const stats = useMemo(
    () => ({
      open: firs.filter((f) => f.status === "open").length,
      under: firs.filter((f) => f.status === "under_investigation").length,
      chargesheeted: firs.filter((f) => f.status === "chargesheeted").length,
      total: firs.length,
    }),
    [firs]
  );

  const recent = firs.slice(0, 5);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>DIRS Dashboard</h2>
          <p className="page-subtitle">Digital Investigation Record System — Case Overview</p>
        </div>
        <Link href="/fir/new" className="btn">
          + Register FIR
        </Link>
      </div>

      <div className="stats-row">
        <StatCard href="/fir" icon={<HiOutlineDocumentText />} value={stats.total} label="Total FIRs" color="purple" />
        <StatCard href="/fir?status=open" icon={<HiOutlineBookOpen />} value={stats.open} label="Open Cases" color="blue" />
        <StatCard
          href="/fir?status=under_investigation"
          icon={<HiOutlineArchive />}
          value={stats.under}
          label="Under Investigation"
          color="green"
        />
        <StatCard
          href="/chargesheet"
          icon={<HiOutlineClipboardCheck />}
          value={stats.chargesheeted}
          label="Chargesheeted"
          color="red"
        />
      </div>

      {/* Quick Links */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Quick Actions</h3>
      </div>
      <div className="stats-row" style={{ flexWrap: "wrap" }}>
        {[
          { href: "/fir/new", label: "Register FIR", icon: <HiOutlineDocumentText />, color: "purple" },
          { href: "/diary", label: "Add Diary Entry", icon: <HiOutlineBookOpen />, color: "blue" },
          { href: "/seizure/new", label: "Seizure Memo", icon: <HiOutlineArchive />, color: "green" },
          { href: "/custody/transfer", label: "Transfer Custody", icon: <HiOutlineSwitchHorizontal />, color: "red" },
          { href: "/chargesheet/new", label: "New Charge Sheet", icon: <HiOutlineClipboardCheck />, color: "purple" },
          { href: "/verify", label: "Public Verify Hash", icon: <HiOutlineScale />, color: "blue" },
        ].map((q) => (
          <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{ cursor: "pointer", minWidth: 160 }}>
              <div className={`stat-icon ${q.color}`}>{q.icon}</div>
              <div className="stat-label" style={{ fontWeight: 600 }}>
                {q.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent FIRs */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Recent FIRs</h3>
        <Link href="/fir" className="btn btn-secondary">
          View All
        </Link>
      </div>

      {loading && <Loader />}
      {!loading && recent.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HiOutlineDocumentText />
          </div>
          <p style={{ fontWeight: 600 }}>No FIRs registered yet</p>
          <Link href="/fir/new" className="btn" style={{ marginTop: "1rem" }}>
            Register First FIR
          </Link>
        </div>
      )}

      <div className="table-wrap">
        {recent.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>FIR Number</th>
                <th>Police Station</th>
                <th>Offence</th>
                <th>Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>{f.fir_number}</strong>
                  </td>
                  <td>{f.police_station}</td>
                  <td
                    style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {f.offence_sections}
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        f.status === "open" ? "blue" : f.status === "chargesheeted" ? "green" : "yellow"
                      }`}
                    >
                      {f.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(f.registered_at).toLocaleDateString("en-IN")}</td>
                  <td>
                    <Link
                      href={`/fir/${f.id}`}
                      className="btn btn-secondary"
                      style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
