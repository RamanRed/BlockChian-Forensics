import ProtectedRoute from "../src/components/ProtectedRoute";
import AuditLogs from "../src/pages/AuditLogs";

export default function AuditPage() {
  return (
    <ProtectedRoute roles={["admin", "investigator", "auditor"]}>
      <AuditLogs />
    </ProtectedRoute>
  );
}
