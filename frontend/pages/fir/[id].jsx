import ProtectedRoute from "../../src/components/ProtectedRoute";
import FIRDetail from "../../src/pages/fir/[id]";

export default function FIRDetailPage() {
  return (
    <ProtectedRoute>
      <FIRDetail />
    </ProtectedRoute>
  );
}
