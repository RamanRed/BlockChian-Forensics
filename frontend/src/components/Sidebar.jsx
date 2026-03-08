import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import { HiOutlineViewGrid, HiOutlineCloudUpload, HiOutlineShieldExclamation, HiOutlineClipboardList, HiOutlineCog, HiOutlineLogout } from "react-icons/hi";

function NavItem({ href, icon, children }) {
  const router = useRouter();
  const active = router.pathname === href;
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
        <div className="sidebar-logo">DEP</div>
        <div>
          <div className="sidebar-title">Evidence</div>
          <div className="sidebar-subtitle">Preservation System</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Main</div>
        <NavItem href="/dashboard" icon={<HiOutlineViewGrid />}>Dashboard</NavItem>
        <NavItem href="/upload" icon={<HiOutlineCloudUpload />}>Upload Evidence</NavItem>

        {(role === "admin" || role === "investigator") && (
          <>
            <div className="sidebar-label">Investigation</div>
            <NavItem href="/quarantine" icon={<HiOutlineShieldExclamation />}>Quarantine</NavItem>
          </>
        )}

        {["admin", "investigator", "auditor"].includes(role) && (
          <>
            <div className="sidebar-label">Monitoring</div>
            <NavItem href="/audit" icon={<HiOutlineClipboardList />}>Audit Logs</NavItem>
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
            <div className="sidebar-user-role">{user?.role || ""}</div>
          </div>
          <HiOutlineLogout style={{ marginLeft: "auto", color: "var(--sidebar-text)", fontSize: "1.1rem" }} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
