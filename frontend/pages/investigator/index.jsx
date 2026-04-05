import ProtectedRoute from "../../src/components/ProtectedRoute";
import InvestigatorDashboard from "../../src/pages/investigator/InvestigatorDashboard";

export default function InvestigatorPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp"]}>
      <InvestigatorDashboard />
    </ProtectedRoute>
  );
}
