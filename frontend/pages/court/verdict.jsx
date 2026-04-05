import ProtectedRoute from "../../src/components/ProtectedRoute";
import VerdictPage from "../../src/pages/court/VerdictPage";

export default function CourtVerdictRoute() {
  return (
    <ProtectedRoute roles={["court", "admin"]}>
      <VerdictPage />
    </ProtectedRoute>
  );
}
