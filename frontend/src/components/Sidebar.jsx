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
} from "react-icons/hi";

function NavItem({ href, icon, children }) {
  const router = useRouter();
  const active = router.pathname.startsWith(href);
  return (
    <Link href={href} className={active ? "active" : ""}>
      <span className="nav-icon">{icon}</span>
      {children}
    </Link>
  );
}

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
        <div className="sidebar-label">Overview</div>
        <NavItem href="/dashboard" icon={<HiOutlineViewGrid />}>Dashboard</NavItem>

        <div className="sidebar-label">Investigation</div>
        {["io", "sp", "dsp", "admin", "court", "lawyer"].includes(role) && (
          <NavItem href="/fir" icon={<HiOutlineDocumentText />}>FIR Register</NavItem>
        )}
        {["io", "sp", "dsp", "admin"].includes(role) && (
          <NavItem href="/diary" icon={<HiOutlineBookOpen />}>Case Diary</NavItem>
        )}
        {["io", "sp", "dsp", "admin", "cfsl", "court", "lawyer"].includes(role) && (
          <NavItem href="/seizure" icon={<HiOutlineArchive />}>Seizure & Property</NavItem>
        )}
        {["io", "sp", "dsp", "admin", "cfsl"].includes(role) && (
          <NavItem href="/custody" icon={<HiOutlineSwitchHorizontal />}>Chain of Custody</NavItem>
        )}
        {["io", "sp", "dsp", "admin", "court", "lawyer"].includes(role) && (
          <NavItem href="/persons" icon={<HiOutlineUserGroup />}>Person Register</NavItem>
        )}

        {role === "cfsl" && (
          <>
            <div className="sidebar-label">Forensic Lab</div>
          </>
        )}
        {["io", "sp", "dsp", "court", "lawyer", "admin"].includes(role) && (
          <NavItem href="/lab-report" icon={<HiOutlineDocumentText />}>Forensic Reports</NavItem>
        )}

        {["io", "sp", "dsp", "admin"].includes(role) && (
          <>
            <div className="sidebar-label">Legal</div>
            <NavItem href="/chargesheet" icon={<HiOutlineClipboardCheck />}>Charge Sheet</NavItem>
          </>
        )}

        {["io", "sp", "dsp", "admin", "court", "lawyer", "auditor"].includes(role) && (
          <>
            <div className="sidebar-label">Court & Verify</div>
            <NavItem href="/court" icon={<HiOutlineScale />}>Court Portal</NavItem>
            <NavItem href="/verify" icon={<HiOutlineShieldCheck />}>Verify Hash</NavItem>
          </>
        )}

        {["admin", "auditor", "sp"].includes(role) && (
          <>
            <div className="sidebar-label">Monitoring</div>
            <NavItem href="/audit" icon={<HiOutlineClipboardList />}>Audit Logs</NavItem>
            <NavItem href="/quarantine" icon={<HiOutlineShieldExclamation />}>Quarantine</NavItem>
          </>
        )}

        {role === "admin" && (
          <>
            <div className="sidebar-label">Administration</div>
            <NavItem href="/admin" icon={<HiOutlineCog />}>Admin Panel</NavItem>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Sign out">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name || "User"}</div>
            <div className="sidebar-user-role">{user?.role?.toUpperCase() || ""}</div>
          </div>
          <HiOutlineLogout style={{ marginLeft: "auto", color: "var(--sidebar-text)", fontSize: "1.1rem" }} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
