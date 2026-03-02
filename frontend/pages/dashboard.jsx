import ProtectedRoute from "../src/components/ProtectedRoute";
import Dashboard from "../src/pages/Dashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
