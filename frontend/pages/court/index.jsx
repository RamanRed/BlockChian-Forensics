import ProtectedRoute from "../../src/components/ProtectedRoute";
import CourtDashboardPage from "../../src/pages/court/CourtDashboardPage";

export default function CourtIndexPage() {
  return (
    <ProtectedRoute roles={["court", "admin"]}>
      <CourtDashboardPage />
    </ProtectedRoute>
  );
}
