import ProtectedRoute from "../../src/components/ProtectedRoute";
import ForensicEvidencePage from "../../src/pages/forensic/ForensicEvidencePage";

export default function ForensicEvidenceRoute() {
  return (
    <ProtectedRoute roles={["cfsl", "admin"]}>
      <ForensicEvidencePage />
    </ProtectedRoute>
  );
}
