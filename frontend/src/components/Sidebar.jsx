import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";

function NavItem({ href, children }) {
  const router = useRouter();
  const active = router.pathname === href;
  return (
    <Link href={href} className={active ? "active" : ""}>
      {children}
    </Link>
  );
}

function Sidebar() {
  const { role } = useAuth();

  return (
    <aside className="sidebar">
      <NavItem href="/dashboard">Dashboard</NavItem>
      <NavItem href="/upload">Upload</NavItem>
      {(role === "admin" || role === "investigator") && <NavItem href="/quarantine">Quarantine</NavItem>}
      {["admin", "investigator", "auditor"].includes(role) && <NavItem href="/audit">Audit Logs</NavItem>}
      {role === "admin" && <NavItem href="/admin">Admin Panel</NavItem>}
    </aside>
  );
}

export default Sidebar;
