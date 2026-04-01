import ProtectedRoute from "../src/components/ProtectedRoute";
import QuarantinePage from "../src/pages/Quarantine";

export default function QuarantinePageRoute() {
  return (
    <ProtectedRoute roles={["admin", "auditor", "sp"]}>
      <QuarantinePage />
    </ProtectedRoute>
  );
}
