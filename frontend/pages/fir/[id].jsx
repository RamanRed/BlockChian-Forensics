import ProtectedRoute from "../../src/components/ProtectedRoute";
import FIRDetail from "../../src/pages/fir/[id]";

export default function FIRDetailPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin", "court", "auditor", "cfsl"]}>
      <FIRDetail />
    </ProtectedRoute>
  );
}
