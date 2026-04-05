import ProtectedRoute from "../../src/components/ProtectedRoute";
import FIRList from "../../src/pages/fir/index";

export default function FIRPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin"]}>
      <FIRList />
    </ProtectedRoute>
  );
}
