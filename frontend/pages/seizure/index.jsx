import ProtectedRoute from "../../src/components/ProtectedRoute";
import SeizurePage from "../../src/pages/seizure/index";

export default function SeizurePageRoute() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin"]}>
      <SeizurePage />
    </ProtectedRoute>
  );
}
