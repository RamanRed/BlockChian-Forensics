import ProtectedRoute from "../src/components/ProtectedRoute";
import Quarantine from "../src/pages/Quarantine";

export default function QuarantinePage() {
  return (
    <ProtectedRoute roles={["admin", "investigator"]}>
      <Quarantine />
    </ProtectedRoute>
  );
}
