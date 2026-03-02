import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { user, logout, token } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="topbar">
      <Link href="/dashboard" className="brand">Digital Evidence Preservation</Link>
      <div className="topbar-right">
        {token ? (
          <>
            <span className="user-chip">{user?.name || "User"} ({user?.role})</span>
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link className="btn btn-secondary" href="/login">Login</Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
