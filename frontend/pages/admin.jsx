import ProtectedRoute from "../src/components/ProtectedRoute";
import AdminPanel from "../src/pages/AdminPanel";

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminPanel />
    </ProtectedRoute>
  );
}
