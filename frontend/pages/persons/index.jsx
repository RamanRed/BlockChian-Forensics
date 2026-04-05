import ProtectedRoute from "../../src/components/ProtectedRoute";
import PersonsPage from "../../src/pages/persons/index";

export default function PersonsPageRoute() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin"]}>
      <PersonsPage />
    </ProtectedRoute>
  );
}
