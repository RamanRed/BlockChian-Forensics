import ProtectedRoute from "../../src/components/ProtectedRoute";
import PersonDetail from "../../src/pages/persons/[id]";

export default function PersonDetailPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin"]}>
      <PersonDetail />
    </ProtectedRoute>
  );
}
