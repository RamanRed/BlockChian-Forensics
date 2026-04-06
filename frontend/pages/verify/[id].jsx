import ProtectedRoute from "../../src/components/ProtectedRoute";
import VerifyEvidence from "../../src/pages/VerifyEvidence";

export default function VerifyPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin", "court", "auditor", "cfsl"]}>
      <VerifyEvidence />
    </ProtectedRoute>
  );
}
