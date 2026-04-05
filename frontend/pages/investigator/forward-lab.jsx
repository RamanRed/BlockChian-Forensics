import ProtectedRoute from "../../src/components/ProtectedRoute";
import ForwardToLab from "../../src/pages/investigator/ForwardToLab";

export default function InvestigatorForwardLabPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp"]}>
      <ForwardToLab />
    </ProtectedRoute>
  );
}
