import ProtectedRoute from "../../src/components/ProtectedRoute";
import EvidenceRecorder from "../../src/pages/investigator/EvidenceRecorder";

export default function InvestigatorEvidencePage() {
  return (
    <ProtectedRoute roles={["io"]}>
      <EvidenceRecorder />
    </ProtectedRoute>
  );
}
