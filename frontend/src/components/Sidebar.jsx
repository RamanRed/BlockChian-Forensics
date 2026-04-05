import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import {
  HiOutlineViewGrid,
  HiOutlineDocumentText,
  HiOutlineBookOpen,
  HiOutlineArchive,
  HiOutlineSwitchHorizontal,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlineScale,
  HiOutlineShieldCheck,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShieldExclamation,
  HiOutlineBeaker,
  HiOutlineEye,
  HiOutlineCollection,
  HiOutlineUpload,
  HiOutlineLightningBolt,
} from "react-icons/hi";

function NavItem({ href, icon, children }) {
  const router = useRouter();
  const active = router.pathname === href || router.pathname.startsWith(href + "/");
  return (
    <Link href={href} className={active ? "active" : ""}>
      <span className="nav-icon">{icon}</span>
      {children}
    </Link>
  );
}

/* ─── IO Sidebar ──────────────────────────────────────────── */
function IOSidebar() {
  return (
    <>
      <div className="sidebar-label">Investigator — IO</div>
      <NavItem href="/investigator" icon={<HiOutlineViewGrid />}>My Dashboard</NavItem>

      <div className="sidebar-label">Case Work</div>
      <NavItem href="/investigator/fir" icon={<HiOutlineDocumentText />}>FIR Register</NavItem>
      <NavItem href="/investigator/evidence" icon={<HiOutlineArchive />}>Evidence Recorder</NavItem>
      <NavItem href="/investigator/forward-lab" icon={<HiOutlineBeaker />}>Forward to Lab</NavItem>
      <NavItem href="/investigator/diary" icon={<HiOutlineBookOpen />}>Case Diary</NavItem>

      <div className="sidebar-label">Case Updates</div>
      <NavItem href="/investigator/chain" icon={<HiOutlineLightningBolt />}>Chain of Events</NavItem>
      <NavItem href="/investigator/verdict" icon={<HiOutlineScale />}>Court Verdicts</NavItem>

      <div className="sidebar-label">Persons</div>
      <NavItem href="/persons" icon={<HiOutlineUserGroup />}>Person Register</NavItem>

      <div className="sidebar-label">Verify</div>
      <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
    </>
  );
}

/* ─── SP Sidebar ──────────────────────────────────────────── */
function SPSidebar() {
  return (
    <>
      <div className="sidebar-label">Superintendent — SP</div>
      <NavItem href="/investigator" icon={<HiOutlineViewGrid />}>My Dashboard</NavItem>

      <div className="sidebar-label">Case Management</div>
      <NavItem href="/investigator/fir" icon={<HiOutlineDocumentText />}>FIR Register</NavItem>
      <NavItem href="/investigator/forward-lab" icon={<HiOutlineBeaker />}>Forward to Lab</NavItem>
      <NavItem href="/investigator/diary" icon={<HiOutlineBookOpen />}>Case Diary</NavItem>

      <div className="sidebar-label">Legal</div>
      <NavItem href="/chargesheet" icon={<HiOutlineClipboardCheck />}>Charge Sheets</NavItem>

      <div className="sidebar-label">Case Updates</div>
      <NavItem href="/investigator/chain" icon={<HiOutlineLightningBolt />}>Chain of Events</NavItem>
      <NavItem href="/investigator/verdict" icon={<HiOutlineScale />}>Court Verdicts</NavItem>

      <div className="sidebar-label">Personnel</div>
      <NavItem href="/persons" icon={<HiOutlineUserGroup />}>Person Register</NavItem>

      <div className="sidebar-label">Monitoring</div>
      <NavItem href="/audit" icon={<HiOutlineClipboardList />}>Audit Logs</NavItem>
      <NavItem href="/quarantine" icon={<HiOutlineShieldExclamation />}>Quarantine</NavItem>

      <div className="sidebar-label">Verify</div>
      <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
    </>
  );
}

/* ─── DSP Sidebar ─────────────────────────────────────────── */
function DSPSidebar() {
  return (
    <>
      <div className="sidebar-label">Deputy SP — DSP</div>
      <NavItem href="/investigator" icon={<HiOutlineViewGrid />}>My Dashboard</NavItem>

      <div className="sidebar-label">Supervision</div>
      <NavItem href="/investigator/fir" icon={<HiOutlineEye />}>View FIR Register</NavItem>
      <NavItem href="/investigator/forward-lab" icon={<HiOutlineBeaker />}>Forward to Lab</NavItem>
      <NavItem href="/investigator/diary" icon={<HiOutlineBookOpen />}>Case Diary</NavItem>

      <div className="sidebar-label">Legal</div>
      <NavItem href="/chargesheet" icon={<HiOutlineClipboardCheck />}>Charge Sheets</NavItem>

      <div className="sidebar-label">Case Updates</div>
      <NavItem href="/investigator/chain" icon={<HiOutlineLightningBolt />}>Chain of Events</NavItem>
      <NavItem href="/investigator/verdict" icon={<HiOutlineScale />}>Court Verdicts</NavItem>

      <div className="sidebar-label">Monitoring</div>
      <NavItem href="/audit" icon={<HiOutlineClipboardList />}>Audit Logs</NavItem>

      <div className="sidebar-label">Verify</div>
      <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
    </>
  );
}

/* ─── Main Sidebar ─────────────────────────────────────────── */
function Sidebar() {
  const { role, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const roleBadgeColor = {
    io: "#4f46e5",
    sp: "#0891b2",
    dsp: "#7c3aed",
    cfsl: "#059669",
    court: "#dc2626",
    lawyer: "#d97706",
    admin: "#1e293b",
    auditor: "#64748b",
  }[role] || "#64748b";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">DIRS</div>
        <div>
          <div className="sidebar-title">Investigation</div>
          <div className="sidebar-subtitle">Record System</div>
        </div>
      </div>

      <div className="sidebar-section">

        {role === "io" && <IOSidebar />}
        {role === "sp" && <SPSidebar />}
        {role === "dsp" && <DSPSidebar />}

        {role === "cfsl" && (
          <>
            <div className="sidebar-label">Forensic Lab</div>
            <NavItem href="/forensic" icon={<HiOutlineViewGrid />}>Lab Dashboard</NavItem>
            <NavItem href="/forensic/evidence" icon={<HiOutlineArchive />}>Incoming Evidence</NavItem>
            <NavItem href="/forensic/submit-report" icon={<HiOutlineUpload />}>Submit Lab Report</NavItem>
            <div className="sidebar-label">Verify</div>
            <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
          </>
        )}

        {role === "court" && (
          <>
            <div className="sidebar-label">Court Portal</div>
            <NavItem href="/court" icon={<HiOutlineViewGrid />}>Court Dashboard</NavItem>
            <NavItem href="/court/cases" icon={<HiOutlineCollection />}>All Cases</NavItem>
            <NavItem href="/court/verdict" icon={<HiOutlineScale />}>Issue Verdict</NavItem>
            <div className="sidebar-label">Verify</div>
            <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
          </>
        )}

        {role === "lawyer" && (
          <>
            <div className="sidebar-label">Lawyer Portal</div>
            <NavItem href="/lawyer" icon={<HiOutlineScale />}>Case Search</NavItem>
            <div className="sidebar-label">Verify</div>
            <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
          </>
        )}

        {role === "auditor" && (
          <>
            <div className="sidebar-label">Audit</div>
            <NavItem href="/dashboard" icon={<HiOutlineViewGrid />}>Overview</NavItem>
            <NavItem href="/audit" icon={<HiOutlineClipboardList />}>Audit Logs</NavItem>
            <NavItem href="/quarantine" icon={<HiOutlineShieldExclamation />}>Quarantine</NavItem>
            <div className="sidebar-label">Verify</div>
            <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
          </>
        )}

        {role === "admin" && (
          <>
            <div className="sidebar-label">Overview</div>
            <NavItem href="/dashboard" icon={<HiOutlineViewGrid />}>Dashboard</NavItem>
            <div className="sidebar-label">Investigation</div>
            <NavItem href="/fir" icon={<HiOutlineDocumentText />}>FIR Register</NavItem>
            <NavItem href="/diary" icon={<HiOutlineBookOpen />}>Case Diary</NavItem>
            <NavItem href="/seizure" icon={<HiOutlineArchive />}>Seizure & Property</NavItem>
            <NavItem href="/custody" icon={<HiOutlineSwitchHorizontal />}>Chain of Custody</NavItem>
            <NavItem href="/persons" icon={<HiOutlineUserGroup />}>Person Register</NavItem>
            <div className="sidebar-label">Legal</div>
            <NavItem href="/chargesheet" icon={<HiOutlineClipboardCheck />}>Charge Sheet</NavItem>
            <NavItem href="/court" icon={<HiOutlineScale />}>Court Portal</NavItem>
            <div className="sidebar-label">Monitoring</div>
            <NavItem href="/audit" icon={<HiOutlineClipboardList />}>Audit Logs</NavItem>
            <NavItem href="/quarantine" icon={<HiOutlineShieldExclamation />}>Quarantine</NavItem>
            <div className="sidebar-label">Administration</div>
            <NavItem href="/admin" icon={<HiOutlineCog />}>Admin Panel</NavItem>
            <div className="sidebar-label">Verify</div>
            <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Sign out">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name || "User"}</div>
            <div
              className="sidebar-user-role"
              style={{
                background: roleBadgeColor,
                color: "#fff",
                borderRadius: "4px",
                padding: "1px 6px",
                fontSize: "0.7rem",
                fontWeight: 700,
                display: "inline-block",
                marginTop: "2px",
              }}
            >
              {user?.role?.toUpperCase() || ""}
            </div>
          </div>
          <HiOutlineLogout style={{ marginLeft: "auto", color: "var(--sidebar-text)", fontSize: "1.1rem" }} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
