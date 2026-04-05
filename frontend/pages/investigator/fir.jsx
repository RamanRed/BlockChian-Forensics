import ProtectedRoute from "../../src/components/ProtectedRoute";
import FIRRegister from "../../src/pages/investigator/FIRRegister";

export default function InvestigatorFIRPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp"]}>
      <FIRRegister />
    </ProtectedRoute>
  );
}
