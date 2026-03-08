import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import { HiOutlineSearch, HiOutlineBell } from "react-icons/hi";

function Navbar() {
  const { user, logout, token } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="topbar">
      <Link href="/dashboard" className="brand">Evidence Preservation</Link>

      {token && (
        <div className="topbar-search">
          <HiOutlineSearch className="search-icon" />
          <input type="text" placeholder="Search evidence, cases..." />
        </div>
      )}

      <div className="topbar-right">
        {token ? (
          <>
            <button className="notification-btn" title="Notifications">
              <HiOutlineBell />
              <span className="notification-dot" />
            </button>
            <div className="user-chip" onClick={handleLogout} style={{ cursor: "pointer" }} title="Sign out">
              <div className="user-chip-avatar">{initials}</div>
              <span>{user?.name || "User"}</span>
            </div>
          </>
        ) : (
          <Link className="btn" href="/login">Sign In</Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
