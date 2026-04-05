import ProtectedRoute from "../../src/components/ProtectedRoute";
import ForensicLabDashboard from "../../src/pages/forensic/ForensicLabDashboard";

export default function ForensicIndexPage() {
  return (
    <ProtectedRoute roles={["cfsl", "admin"]}>
      <ForensicLabDashboard />
    </ProtectedRoute>
  );
}
