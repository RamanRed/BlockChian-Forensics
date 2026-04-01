import ProtectedRoute from "../src/components/ProtectedRoute";
import CourtPage from "../src/pages/court";

export default function CourtPageRoute() {
  return (
    <ProtectedRoute>
      <CourtPage />
    </ProtectedRoute>
  );
}
