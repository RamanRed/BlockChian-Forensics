import ProtectedRoute from "../../src/components/ProtectedRoute";
import EvidenceDetails from "../../src/pages/EvidenceDetails";

export default function EvidenceDetailsPage() {
  return (
    <ProtectedRoute>
      <EvidenceDetails />
    </ProtectedRoute>
  );
}
