import ProtectedRoute from "../../src/components/ProtectedRoute";
import ChainOfEventsPage from "../../src/pages/investigator/ChainOfEventsPage";

export default function InvestigatorChainRoute() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp"]}>
      <ChainOfEventsPage />
    </ProtectedRoute>
  );
}
