import ProtectedRoute from "../../src/components/ProtectedRoute";
import VerifyPage from "../../src/pages/verify/index";

export default function VerifyPageRoute() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin", "court", "auditor", "cfsl"]}>
      <VerifyPage />
    </ProtectedRoute>
  );
}
