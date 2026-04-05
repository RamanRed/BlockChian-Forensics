import ProtectedRoute from "../../src/components/ProtectedRoute";
import RegisterFIR from "../../src/pages/fir/new";

export default function NewFIRPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin"]}>
      <RegisterFIR />
    </ProtectedRoute>
  );
}
