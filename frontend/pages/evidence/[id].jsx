import ProtectedRoute from "../../src/components/ProtectedRoute";
import EvidenceDetails from "../../src/pages/EvidenceDetails";

export default function EvidenceDetailsPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin", "court", "auditor", "cfsl"]}>
      <EvidenceDetails />
    </ProtectedRoute>
  );
}
