import ProtectedRoute from "../../src/components/ProtectedRoute";
import InvestigatorVerdictPage from "../../src/pages/investigator/InvestigatorVerdictPage";

export default function InvestigatorVerdictRoute() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp"]}>
      <InvestigatorVerdictPage />
    </ProtectedRoute>
  );
}
