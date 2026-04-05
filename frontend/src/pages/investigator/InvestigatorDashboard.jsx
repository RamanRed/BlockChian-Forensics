import { useContext, useMemo } from "react";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { firService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineDocumentText,
  HiOutlineBookOpen,
  HiOutlineArchive,
  HiOutlineClipboardCheck,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineBeaker,
  HiOutlineSwitchHorizontal,
  HiOutlineShieldCheck,
  HiOutlineEye,
} from "react-icons/hi";

/* ── Stat card ─────────────────────────────────────────────── */
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

/* ── Quick-action button ────────────────────────────────────── */
const QuickBtn = ({ href, icon, label, color }) => (
  <Link href={href} style={{ textDecoration: "none" }}>
    <div
      className="stat-card"
      style={{
        cursor: "pointer",
        minWidth: 160,
        borderLeft: `3px solid var(--${color === "purple" ? "primary" : color === "blue" ? "primary" : color === "green" ? "success" : "danger"})`,
      }}
    >
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-label" style={{ fontWeight: 600 }}>
        {label}
      </div>
    </div>
  </Link>
);

/* ── Role config ────────────────────────────────────────────── */
const ROLE_CONFIG = {
  io: {
    title: "Investigating Officer Portal",
    subtitle: "IO — Case Investigation & Evidence Management",
    badge: { label: "IO", color: "#4f46e5" },
    quickActions: [
      { href: "/investigator/fir", label: "Register New FIR", icon: <HiOutlineDocumentText />, color: "purple" },
      { href: "/investigator/evidence", label: "Record Evidence", icon: <HiOutlineArchive />, color: "green" },
      { href: "/investigator/forward-lab", label: "Forward to Lab", icon: <HiOutlineBeaker />, color: "blue" },
      { href: "/investigator/diary", label: "Case Diary", icon: <HiOutlineBookOpen />, color: "purple" },
      { href: "/investigator/chain", label: "Chain of Events", icon: <HiOutlineSwitchHorizontal />, color: "green" },
      { href: "/investigator/verdict", label: "Court Verdicts", icon: <HiOutlineClipboardCheck />, color: "red" },
      { href: "/persons", label: "Person Register", icon: <HiOutlineUserGroup />, color: "blue" },
    ],
  },
  sp: {
    title: "Superintendent of Police Portal",
    subtitle: "SP — Case Supervision & Oversight",
    badge: { label: "SP", color: "#0891b2" },
    quickActions: [
      { href: "/investigator/fir", label: "FIR Register", icon: <HiOutlineDocumentText />, color: "purple" },
      { href: "/investigator/forward-lab", label: "Forward to Lab", icon: <HiOutlineBeaker />, color: "blue" },
      { href: "/investigator/diary", label: "Case Diary", icon: <HiOutlineBookOpen />, color: "purple" },
      { href: "/chargesheet", label: "Charge Sheets", icon: <HiOutlineClipboardCheck />, color: "green" },
      { href: "/investigator/chain", label: "Chain of Events", icon: <HiOutlineSwitchHorizontal />, color: "green" },
      { href: "/investigator/verdict", label: "Court Verdicts", icon: <HiOutlineClipboardCheck />, color: "red" },
      { href: "/persons", label: "Person Register", icon: <HiOutlineUserGroup />, color: "blue" },
      { href: "/audit", label: "Audit Logs", icon: <HiOutlineClipboardList />, color: "red" },
    ],
  },
  dsp: {
    title: "Deputy SP Portal",
    subtitle: "DSP — Area Supervision & Case Monitoring",
    badge: { label: "DSP", color: "#7c3aed" },
    quickActions: [
      { href: "/investigator/fir", label: "View FIR Register", icon: <HiOutlineEye />, color: "purple" },
      { href: "/investigator/forward-lab", label: "Forward to Lab", icon: <HiOutlineBeaker />, color: "blue" },
      { href: "/investigator/diary", label: "Case Diary", icon: <HiOutlineBookOpen />, color: "purple" },
      { href: "/chargesheet", label: "Charge Sheets", icon: <HiOutlineClipboardCheck />, color: "green" },
      { href: "/investigator/chain", label: "Chain of Events", icon: <HiOutlineSwitchHorizontal />, color: "green" },
      { href: "/investigator/verdict", label: "Court Verdicts", icon: <HiOutlineClipboardCheck />, color: "red" },
      { href: "/audit", label: "Audit Logs", icon: <HiOutlineClipboardList />, color: "red" },
    ],
  },
};

/* ── Main Component ─────────────────────────────────────────── */
function InvestigatorDashboard() {
  const { role, user } = useContext(AuthContext);
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.io;

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

  const recent = firs.slice(0, 6);

  return (
    <section>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <h2 style={{ margin: 0 }}>{cfg.title}</h2>
            <span
              style={{
                background: cfg.badge.color,
                color: "#fff",
                borderRadius: "6px",
                padding: "2px 10px",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              {cfg.badge.label}
            </span>
          </div>
          <p className="page-subtitle">
            Welcome, {user?.name || "Officer"} — {cfg.subtitle}
          </p>
        </div>
        {role === "io" && (
          <Link href="/investigator/fir" className="btn">
            + Register FIR
          </Link>
        )}
      </div>

      {/* Stats */}
      {loading && <Loader />}
      {!loading && (
        <div className="stats-row">
          <StatCard
            href="/investigator/fir"
            icon={<HiOutlineDocumentText />}
            value={stats.total}
            label="Total FIRs"
            color="purple"
          />
          <StatCard
            href="/investigator/fir"
            icon={<HiOutlineBookOpen />}
            value={stats.open}
            label="Open Cases"
            color="blue"
          />
          <StatCard
            href="/investigator/fir"
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
      )}

      {/* Quick Actions */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Quick Actions</h3>
      </div>
      <div className="stats-row" style={{ flexWrap: "wrap" }}>
        {cfg.quickActions.map((q) => (
          <QuickBtn key={q.href} {...q} />
        ))}
      </div>

      {/* Role-specific notice banner */}
      {role === "io" && (
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e520, #6366f110)",
            border: "1px solid #4f46e530",
            borderRadius: "12px",
            padding: "1rem 1.5rem",
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <HiOutlineShieldCheck style={{ fontSize: "1.5rem", color: "#4f46e5", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#4f46e5" }}>IO Responsibility</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              You have full access to register FIRs, record evidence, and update case diaries. All actions are
              blockchain-hashed and immutable.
            </p>
          </div>
        </div>
      )}
      {role === "sp" && (
        <div
          style={{
            background: "linear-gradient(135deg, #0891b220, #06b6d410)",
            border: "1px solid #0891b230",
            borderRadius: "12px",
            padding: "1rem 1.5rem",
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <HiOutlineClipboardList style={{ fontSize: "1.5rem", color: "#0891b2", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#0891b2" }}>SP Oversight</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              You have supervisory access. You can review FIRs, forward cases to forensic labs, approve charge sheets, and
              monitor audit logs.
            </p>
          </div>
        </div>
      )}
      {role === "dsp" && (
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed20, #8b5cf610)",
            border: "1px solid #7c3aed30",
            borderRadius: "12px",
            padding: "1rem 1.5rem",
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <HiOutlineSwitchHorizontal style={{ fontSize: "1.5rem", color: "#7c3aed", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#7c3aed" }}>DSP Area Supervision</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              You have area-level oversight. Monitor all cases in your jurisdiction, ensure lab referrals are timely and
              case diaries are maintained.
            </p>
          </div>
        </div>
      )}

      {/* Recent FIRs */}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: 0 }}>Recent FIRs</h3>
        <Link href="/investigator/fir" className="btn btn-secondary">
          View All
        </Link>
      </div>

      {!loading && recent.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HiOutlineDocumentText />
          </div>
          <p style={{ fontWeight: 600 }}>No FIRs registered yet</p>
          {role === "io" && (
            <Link href="/investigator/fir" className="btn" style={{ marginTop: "1rem" }}>
              Register First FIR
            </Link>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <div className="table-wrap">
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
        </div>
      )}
    </section>
  );
}

export default InvestigatorDashboard;
