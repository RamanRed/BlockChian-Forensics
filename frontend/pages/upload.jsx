import ProtectedRoute from "../src/components/ProtectedRoute";
import UploadEvidence from "../src/pages/UploadEvidence";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadEvidence />
    </ProtectedRoute>
  );
}
