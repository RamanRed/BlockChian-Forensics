import ProtectedRoute from "../../src/components/ProtectedRoute";
import PersonDetail from "../../src/pages/persons/[id]";

export default function PersonDetailPage() {
  return (
    <ProtectedRoute>
      <PersonDetail />
    </ProtectedRoute>
  );
}
