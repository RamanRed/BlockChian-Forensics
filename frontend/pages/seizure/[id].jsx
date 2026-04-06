import ProtectedRoute from "../../src/components/ProtectedRoute";
import SeizureDetail from "../../src/pages/seizure/[id]";

export default function SeizureDetailPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin", "court", "auditor", "cfsl"]}>
      <SeizureDetail />
    </ProtectedRoute>
  );
}
