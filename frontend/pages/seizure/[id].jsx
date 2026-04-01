import ProtectedRoute from "../../src/components/ProtectedRoute";
import SeizureDetail from "../../src/pages/seizure/[id]";

export default function SeizureDetailPage() {
  return (
    <ProtectedRoute>
      <SeizureDetail />
    </ProtectedRoute>
  );
}
