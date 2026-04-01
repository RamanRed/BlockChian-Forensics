import ProtectedRoute from "../../src/components/ProtectedRoute";
import SeizurePage from "../../src/pages/seizure/index";

export default function SeizurePageRoute() {
  return (
    <ProtectedRoute>
      <SeizurePage />
    </ProtectedRoute>
  );
}
