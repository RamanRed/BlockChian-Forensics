import ProtectedRoute from "../../../src/components/ProtectedRoute";
import CourtCaseDetailPage from "../../../src/pages/court/CourtCaseDetailPage";

export default function CourtCaseDetailRoute() {
  return (
    <ProtectedRoute roles={["court", "admin"]}>
      <CourtCaseDetailPage />
    </ProtectedRoute>
  );
}
