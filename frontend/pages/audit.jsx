import ProtectedRoute from "../src/components/ProtectedRoute";
import AuditLogs from "../src/pages/AuditLogs";

export default function AuditPage() {
  return (
    <ProtectedRoute roles={["admin", "auditor", "sp"]}>
      <AuditLogs />
    </ProtectedRoute>
  );
}
