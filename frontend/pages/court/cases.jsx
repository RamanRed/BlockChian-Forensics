import ProtectedRoute from "../../src/components/ProtectedRoute";
import CourtCasesPage from "../../src/pages/court/CourtCasesPage";

export default function CourtCasesRoute() {
  return (
    <ProtectedRoute roles={["court", "admin"]}>
      <CourtCasesPage />
    </ProtectedRoute>
  );
}
