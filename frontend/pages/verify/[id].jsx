import ProtectedRoute from "../../src/components/ProtectedRoute";
import VerifyEvidence from "../../src/pages/VerifyEvidence";

export default function VerifyPage() {
  return (
    <ProtectedRoute>
      <VerifyEvidence />
    </ProtectedRoute>
  );
}
