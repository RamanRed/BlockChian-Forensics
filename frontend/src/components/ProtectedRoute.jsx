import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import Loader from "./Loader";

function ProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (roles.length && !roles.includes(role)) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, role, roles, router]);

  if (loading) return <Loader label="Loading session..." />;
  if (!isAuthenticated) return null;
  if (roles.length && !roles.includes(role)) return null;

  return children;
}

export default ProtectedRoute;
